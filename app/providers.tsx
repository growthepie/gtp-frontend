"use client";
import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { addCollection } from "@iconify/react";
import GTPIcons from "@/icons/gtp.json";
import { UIContextProvider } from "@/contexts/UIContext";

// load icons
addCollection(GTPIcons);

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <SWRConfig
        value={{
          fetcher: (url) => fetch(url).then((r) => r.json()),
          // fetch(`/api/cors?url=${encodeURI(url)}`).then((r) => r.json()),
          refreshInterval: 1000 * 60 * 60, // 1 hour
        }}
      >
        <UIContextProvider>{children}</UIContextProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
