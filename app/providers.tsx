"use client";
import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { addCollection } from "@iconify/react";
import GTPIcons from "@/icons/gtp.json";
import GTPIconsFigmaExport from "@/icons/gtp-figma-export.json";
import { UIContextProvider } from "@/contexts/UIContext";
import { useLocalStorage } from "usehooks-ts";
import { IS_PRODUCTION } from "@/lib/helpers";
import { MasterProvider } from "@/contexts/MasterContext";
import { m } from "framer-motion";

// load icons
addCollection(GTPIcons);
addCollection(GTPIconsFigmaExport);

type ProvidersProps = {
  children: React.ReactNode;
  forcedTheme?: string;
};

// bypass AWS rate limiting in development
const headers = new Headers();
headers.set("Test-Header", "true");

if (process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN)
  headers.set("X-Developer-Token", process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN);

const requestOptions = {
  method: "GET",
  headers: headers,
};

const devMiddleware = (useSWRNext) => {
  return (key, fetcher, config) => {
    return useSWRNext(
      key,
      (url) => {
        if (url.includes("api.growthepie.xyz")) {
          // replace /v1/ with /dev/ to get JSON files from the dev folder in S3
          let newUrl = url.replace("/v1/", "/dev/");
          return fetch(newUrl, requestOptions).then((r) => r.json());
        } else {
          return fetch(url, requestOptions).then((r) => r.json());
        }
      },
      config,
    );
  };
};

export function Providers({ children, forcedTheme }: ProvidersProps) {
  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme={"dark"}
      disableTransitionOnChange
    >
      <SWRConfig
        value={{
          fetcher: (url) => fetch(url, requestOptions).then((r) => r.json()),
          use: apiRoot === "dev" && !IS_PRODUCTION ? [devMiddleware] : [],
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
