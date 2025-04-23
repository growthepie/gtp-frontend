"use client";
import { useMaster } from "@/contexts/MasterContext";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Metrics } from "@/types/api/MasterResponse";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Define metric icons
const metricIcons = {
  gas_fees: "gtp-metrics-transactioncosts",
  txcount: "gtp-metrics-transactioncount",
  daa: "gtp-metrics-activeaddresses",
};

// Default metric to use if none is specified
const DEFAULT_METRIC = "txcount";

export type MetricsContextType = {
  metricsDef: Metrics;
  metricIcons: { [key: string]: string };
  selectedMetrics: string[];
  setSelectedMetrics: (metrics: string[]) => void;
  selectedMetricKeys: string[];
};

export const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

export const MetricsProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: masterData } = useMaster();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  
  // Get URL utilities from Next.js
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  
  // Get the metric from URL params or use default
  const metricsFromParams = searchParams.get("metric") || DEFAULT_METRIC;

  
  // Update URL when selected metrics change
  const setSelectedMetrics = useCallback((metrics: string[]) => {
    if (!metrics.length || !metrics[0] || JSON.stringify(metrics) === metricsFromParams) {
      return;
    }

    if (!masterData) return;
    
    // Create a new URLSearchParams object
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    const validMetrics = Object.keys(masterData.app_metrics);

    const newMetrics = metrics.filter(metric => validMetrics.includes(metric));
    
    if(newMetrics.length === 1 && newMetrics[0] === DEFAULT_METRIC) {
      newSearchParams.delete("metric");
    } else {
      newSearchParams.set("metric", metrics.join(","));
    }

    setTimeout(() => {
      // create new url and update url
      let url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;
      // router.replace(url, { scroll: false });
      window.history.replaceState(null, "", url);
    }, 10);
  }, [metricsFromParams, masterData, searchParams, pathname]);
  
  
  // Filter selected metrics to only include valid ones
  const orderedMetrics = useMemo(() => {
    if (!masterData) return [DEFAULT_METRIC];
    
    const validMetrics = Object.keys(masterData.app_metrics);
    const metrics = metricsFromParams.split(',');
    return metrics.filter(metric => validMetrics.includes(metric));
  }, [masterData, metricsFromParams]);
  
  // Map metrics to their actual data keys
  const selectedMetricKeys = useMemo(() => {
    return orderedMetrics.map((metric) => {
      if (metric === "gas_fees") {
        return showUsd ? "gas_fees_usd" : "gas_fees_eth";
      }
      return metric;
    });
  }, [orderedMetrics, showUsd]);
  
  // Create the context value
  const contextValue = useMemo(() => ({
    metricsDef: masterData ? masterData.app_metrics : {},
    metricIcons,
    selectedMetrics: orderedMetrics,
    setSelectedMetrics,
    selectedMetricKeys,
  }), [
    masterData, 
    orderedMetrics, 
    setSelectedMetrics, 
    selectedMetricKeys,
  ]);
  
  return (
    <MetricsContext.Provider value={contextValue}>
      {children}
    </MetricsContext.Provider>
  );
};

export const useMetrics = () => {
  const context = useContext(MetricsContext);
  if (context === undefined) {
    throw new Error("useMetrics must be used within a MetricsProvider");
  }
  return context;
};