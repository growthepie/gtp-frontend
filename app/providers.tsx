"use client";

import { ThemeProvider } from "next-themes";
import { MetricsProvider } from "@/context/MetricsProvider";

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class">
      <MetricsProvider>{children}</MetricsProvider>
    </ThemeProvider>
  );
}
