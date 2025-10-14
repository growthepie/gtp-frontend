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
const STORAGE_KEY = "selectedMetrics";

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
  const [savedMetrics, setSavedMetrics] = useLocalStorage<string>(STORAGE_KEY, DEFAULT_METRIC);

  // Get URL utilities from Next.js
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Validate and sanitize localStorage value
  const validatedSavedMetrics = useMemo(() => {
    if (!masterData) return DEFAULT_METRIC;

    try {
      // Get valid metrics from master data
      const validMetrics = Object.keys(masterData.app_metrics);

      // Parse saved metrics and filter out invalid ones
      const metricsArray = savedMetrics.split(',').filter(m => m && validMetrics.includes(m));

      // If no valid metrics remain, return default
      if (metricsArray.length === 0) {
        return DEFAULT_METRIC;
      }

      return metricsArray.join(',');
    } catch (error) {
      // If any error occurs (malformed data, etc.), return default
      console.warn('Invalid savedMetrics in localStorage, using default:', error);
      return DEFAULT_METRIC;
    }
  }, [masterData, savedMetrics]);

  // Priority: URL params > validated localStorage > DEFAULT_METRIC
  const urlMetric = searchParams.get("metric");
  const metricsFromParams = urlMetric || validatedSavedMetrics;

  // Cleanup effect: fix localStorage if it contained invalid data
  useEffect(() => {
    if (savedMetrics !== validatedSavedMetrics && validatedSavedMetrics !== null) {
      // Only update if validation changed the value (means it was invalid)
      setSavedMetrics(validatedSavedMetrics);
    }
  }, [savedMetrics, validatedSavedMetrics, setSavedMetrics]);

  // Sync URL params to localStorage, or localStorage to URL on mount
  useEffect(() => {
    if (!masterData) return;

    const validMetrics = Object.keys(masterData.app_metrics);

    // Case 1: URL has metric param (user clicked a shared link)
    if (urlMetric) {
      // Validate URL metrics
      const urlMetricsArray = urlMetric.split(',').filter(m => m && validMetrics.includes(m));

      if (urlMetricsArray.length > 0) {
        const urlMetricsString = urlMetricsArray.join(',');

        // Save URL metrics to localStorage (so they persist after URL is gone)
        if (savedMetrics !== urlMetricsString) {
          setSavedMetrics(urlMetricsString);
        }
      }
    }
    // Case 2: No URL param, but localStorage has non-default metrics
    else if (validatedSavedMetrics && validatedSavedMetrics !== DEFAULT_METRIC) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set("metric", validatedSavedMetrics);

      const url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;
      // Use Next.js router to preserve scroll restoration
      router.replace(url, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  // Update URL and localStorage when selected metrics change
  const setSelectedMetrics = useCallback((metrics: string[]) => {
    if (!metrics.length || !metrics[0] || JSON.stringify(metrics) === metricsFromParams) {
      return;
    }

    if (!masterData) return;

    // Create a new URLSearchParams object
    const newSearchParams = new URLSearchParams(searchParams.toString());

    const validMetrics = Object.keys(masterData.app_metrics);

    const newMetrics = metrics.filter(metric => validMetrics.includes(metric));

    // Save to localStorage for persistence
    const metricsString = newMetrics.join(",");
    setSavedMetrics(metricsString);

    if(newMetrics.length === 1 && newMetrics[0] === DEFAULT_METRIC) {
      newSearchParams.delete("metric");
    } else {
      newSearchParams.set("metric", metricsString);
    }

    // Use Next.js router with scroll: false to preserve scroll position
    const url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;
    router.replace(url, { scroll: false });
  }, [metricsFromParams, masterData, searchParams, pathname, setSavedMetrics, router]);
  
  
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