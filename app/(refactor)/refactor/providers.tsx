"use client";
import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { addCollection } from "@iconify/react";
import GTPIcons from "@/icons/gtp.json";
import GTPIconsFigmaExport from "@/icons/gtp-figma-export.json";
import { UIContextProvider } from "@/contexts/UIContext";
import { useLocalStorage } from "usehooks-ts";
import { IS_PRODUCTION } from "@/lib/helpers";
import { MasterProvider } from "./contexts/MasterContext";

// load icons
addCollection(GTPIcons);
addCollection(GTPIconsFigmaExport);

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
          fetcher: (url) => fetch(url).then((r) => r.json()),
          use: apiRoot === "dev" && !IS_PRODUCTION ? [devMiddleware] : [],
        }}
      >
        <UIContextProvider>
          {children}
        </UIContextProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
