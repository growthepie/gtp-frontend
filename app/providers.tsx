"use client";

import { ThemeProvider } from "next-themes";
// import { MetricsProvider } from "@/context/MetricsProvider";
import { SWRConfig } from "swr";

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class">
      <SWRConfig
        value={{
          fetcher: (url) => fetch(url).then((r) => r.json()),
          // fetch(`/api/cors?url=${encodeURI(url)}`).then((r) => r.json()),
          refreshInterval: 1000 * 60 * 60, // 1 hour
        }}
      >
        {/* <MetricsProvider> */}
        {children}
        {/* </MetricsProvider> */}
      </SWRConfig>
    </ThemeProvider>
  );
}
