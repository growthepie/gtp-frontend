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
import { addAuthToUrl } from '@/lib/cloudfront-url-auth';

// load icons
// addCollection(GTPIcons);
// addCollection(GTPIconsFigmaExport);

type ProvidersProps = {
  children: React.ReactNode;
  forcedTheme?: string;
};

/**
 * Check if a URL requires authentication (zircuit routes)
 */
function requiresAuth(url: string): boolean {
  // Add patterns that require authentication
  const protectedPatterns = [
    '/metrics/chains/zircuit/',
  ];
  
  return protectedPatterns.some(pattern => url.includes(pattern));
}

const singleOrMultiFetcher = async (urlOrUrls) => {
  const fetchWithErrorHandling = async (url) => {
    // Add CloudFront auth params to protected URLs
    const finalUrl = requiresAuth(url) ? addAuthToUrl(url) : url;

    // Build headers
    const headers = new Headers();
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");

    if (process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN) {
      headers.set("X-Developer-Token", process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN);
    }

    const requestOptions: RequestInit = {
      method: "GET",
      headers: headers,
    };

    console.log(finalUrl, requestOptions);

    const response = await fetch(finalUrl, requestOptions);

    // For 404/403 errors on chain metrics, return null instead of throwing
    if (!response.ok && finalUrl.includes('/metrics/chains/')) {
      if (response.status === 404 || response.status === 403) {
        return null;
      }
    }

    if (response.ok) {
      return response.json();
    }

    const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.response = response;
    throw error;
  };

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
              let newUrl = url.replace("/v1/", "/dev/");
              return fetcher(newUrl);
            }
            return fetcher(url);
          }));
        } else {
          if (urlOrUrls.includes("api.growthepie.com")) {
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

              // Log other errors
              console.error('[SWR Error] Key:', key, 'Error:', error);
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
