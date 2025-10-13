"use client";
import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { addCollection } from "@iconify/react";
import { UIContextProvider } from "@/contexts/UIContext";
import { useLocalStorage } from "usehooks-ts";
import { IS_PRODUCTION } from "@/lib/helpers";
import { MasterProvider } from "@/contexts/MasterContext";
import { ToastProvider } from "@/components/toast/GTPToast";
// import { ConfettiProvider } from "@/components/animations/ConfettiProvider";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { useEffect } from "react";
import { gtpIconsLoader } from "@/utils/gtp-icons-loader";

// load icons
// addCollection(GTPIcons);
// addCollection(GTPIconsFigmaExport);

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

  useEffect(() => {
    // Start loading icons immediately
    gtpIconsLoader.loadIcons();
  }, []);

  return (
    <NavigationProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        forcedTheme={!IS_PRODUCTION ? undefined : "dark"} // force dark for production
        disableTransitionOnChange
      >
        <SWRConfig
          value={{
            fetcher: singleOrMultiFetcher,
            use: apiRoot === "dev" && !IS_PRODUCTION ? [devMiddleware] : [],
            dedupingInterval: 10000, // 10 seconds
            onError: (error, key) => {
              // Silence expected errors from chain metrics endpoints that return 403/404
              if (typeof key === 'string' && key.includes('/metrics/chains/')) {
                // Check for JSON parse errors (403/404 responses return HTML)
                if (error instanceof SyntaxError && error.message.includes('JSON')) {
                  return; // Silently ignore
                }
                // Check for fetch failures (CORS blocks)
                if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                  return; // Silently ignore
                }
              }
              // Log other errors (you can customize this further)
              // console.error('SWR Error:', error, key);
            },
          }}
        >
            <MasterProvider>
                <UIContextProvider>
                <ToastProvider>
                  {/* <ConfettiProvider> */}
                    {children}
                  {/* </ConfettiProvider> */}
                </ToastProvider>
              </UIContextProvider>
            </MasterProvider>
        </SWRConfig>
      </ThemeProvider>
    </NavigationProvider>
  );
}
