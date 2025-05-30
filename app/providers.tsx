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
import { ProjectsMetadataProvider } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { ToastProvider } from "@/components/toast/GTPToast";

// load icons
addCollection(GTPIcons);
addCollection(GTPIconsFigmaExport);

type ProvidersProps = {
  children: React.ReactNode;
  forcedTheme?: string;
};

// bypass AWS rate limiting in development
const headers = new Headers();
headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
headers.set("Pragma", "no-cache");
headers.set("Expires", "0");

if (process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN)
  headers.set("X-Developer-Token", process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN);

const requestOptions = {
  method: "GET",
  headers: headers,
};

const singleOrMultiFetcher = (urlOrUrls) => {
  if (Array.isArray(urlOrUrls)) {
    return Promise.all(urlOrUrls.map(url => fetch(url, requestOptions).then((r) => r.json())));
  }
  return fetch(urlOrUrls, requestOptions).then((r) => r.json());
};

const devMiddleware = (useSWRNext) => {
  return (key, fetcher, config) => {
    return useSWRNext(
      key,
      (urlOrUrls) => {
        if (Array.isArray(urlOrUrls)) {
          return Promise.all(urlOrUrls.map(url => {
            if (url.includes("api.growthepie.com")) {
              // replace /v1/ with /dev/ to get JSON files from the dev folder in S3
              let newUrl = url.replace("/v1/", "/dev/");
              return fetcher(newUrl);
            }
            return fetcher(url);
          }));
        } else {
          if (urlOrUrls.includes("api.growthepie.com")) {
            // replace /v1/ with /dev/ to get JSON files from the dev folder in S3
            let newUrl = urlOrUrls.replace("/v1/", "/dev/");
            return fetcher(newUrl);
          }
          return fetcher(urlOrUrls);
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
          fetcher: singleOrMultiFetcher,
          use: apiRoot === "dev" && !IS_PRODUCTION ? [devMiddleware] : [],
          // refreshInterval: 1000 * 60 * 60, // 1 hour
        }}
      >
          <MasterProvider>
            <ProjectsMetadataProvider>
              <UIContextProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </UIContextProvider>
          </ProjectsMetadataProvider>
          </MasterProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
