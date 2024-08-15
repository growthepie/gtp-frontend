"use client";
import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { addCollection } from "@iconify/react";
import GTPIcons from "@/icons/gtp.json";
import { UIContextProvider } from "@/contexts/UIContext";
import { useLocalStorage } from "usehooks-ts";
import { IS_PRODUCTION } from "@/lib/helpers";
import { MasterProvider } from "@/contexts/MasterContext";
import { apiFetch, ApiRoot } from "@/lib/apiRoot";
import { useEffect } from "react";

// load icons
addCollection(GTPIcons);

type ProvidersProps = {
  children: React.ReactNode;
  forcedTheme?: string;
};

const devMiddleware = (useSWRNext) => {
  return (key, fetcher, config) => {
    return useSWRNext(
      key,
      (url) => {
        if (url.includes("api.growthepie.xyz")) {
          // replace /v1/ with /dev/ to get JSON files from the dev folder in S3
          let newUrl = url.replace("/v1/", "/dev/");
          return fetch(newUrl).then((r) => r.json());
        } else {
          return fetch(url).then((r) => r.json());
        }
      },
      config,
    );
  };
};

export function Providers({ children, forcedTheme }: ProvidersProps) {
  const [apiRoot, setApiRoot] = useLocalStorage<ApiRoot>("apiRoot", "v1");

  useEffect(() => {
    // Set the cookie whenever apiRoot changes
    document.cookie = `apiRoot=${apiRoot};path=/;max-age=31536000`;
  }, [apiRoot]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme={"dark"}
      disableTransitionOnChange
    >
      <SWRConfig
        value={{
          fetcher: async (url) => {
            console.log("providers::swr::url", url);
            const data = apiFetch(url).then((r) => r.json());
            console.log("providers::swr::data", data);
            return data;
          }
          // use: apiRoot === "dev" && !IS_PRODUCTION ? [devMiddleware] : [],
          // refreshInterval: 1000 * 60 * 60, // 1 hour
        }}
      >
        <MasterProvider>
          <UIContextProvider>{children}</UIContextProvider>
        </MasterProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
