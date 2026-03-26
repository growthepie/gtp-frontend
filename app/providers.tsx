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
import { WalletProvider } from "@/contexts/WalletContext";

// load icons
// addCollection(GTPIcons);
// addCollection(GTPIconsFigmaExport);

type ProvidersProps = {
  children: React.ReactNode;
  forcedTheme?: string;
};


function createFetchHeaders(url: string): Headers {
  const headers = new Headers();
  
  // Standard cache control headers
  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");

  // Add developer token only for external AWS API calls
  const isExternalApi = url.includes('api.growthepie.com');
  const hasDeveloperToken = !!process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN;
  
  if (isExternalApi && hasDeveloperToken) {
    headers.set("X-Developer-Token", process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN as string);
  }

  return headers;
}

const singleOrMultiFetcher = async (urlOrUrls: string | string[]) => {
  const fetchWithErrorHandling = async (url: string) => {
    const headers = createFetchHeaders(url);
    
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    // Handle expected missing data from chain metrics
    if (!response.ok && url.includes('/metrics/chains/')) {
      if (response.status === 404 || response.status === 403) {
        return null; // Expected missing data
      }
    }

    // Parse successful responses
    if (response.ok) {
      return response.json();
    }

    // Throw detailed error for other failures
    const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.response = response;
    throw error;
  };

  // Handle single URL or array of URLs
  if (Array.isArray(urlOrUrls)) {
    return Promise.all(urlOrUrls.map(fetchWithErrorHandling));
  }
  return fetchWithErrorHandling(urlOrUrls);
};


const devMiddleware = (useSWRNext) => {
  return (key, fetcher, config) => {
    return useSWRNext(
      key,
      (urlOrUrls) => {
        if (Array.isArray(urlOrUrls)) {
          return Promise.all(urlOrUrls.map(url => {
            if (url.includes("api.growthepie.com")) {
              // Replace /v1/ with /dev/ to get JSON files from the dev folder in S3
              const newUrl = url.replace("/v1/", "/dev/");
              return fetcher(newUrl);
            }
            return fetcher(url);
          }));
        } else {
          if (urlOrUrls.includes("api.growthepie.com")) {
            // Replace /v1/ with /dev/ to get JSON files from the dev folder in S3
            const newUrl = urlOrUrls.replace("/v1/", "/dev/");
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

              // Log other errors
              console.error('[SWR Error] Key:', key, 'Error:', error);
            },
          }}
        >
            <MasterProvider>
                <UIContextProvider>
                <ToastProvider>
                  {/* <ConfettiProvider> */}
                    <WalletProvider>
                      {children}
                    </WalletProvider>
                  {/* </ConfettiProvider> */}
                </ToastProvider>
              </UIContextProvider>
            </MasterProvider>
        </SWRConfig>
      </ThemeProvider>
    </NavigationProvider>
  );
}
