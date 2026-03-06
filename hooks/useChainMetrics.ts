import useSWR, { useSWRConfig } from "swr";
import { ChainMetricResponse, MetricDetails } from "@/types/api/ChainMetricResponse";
import { getChainMetricURL, getDALayerMetricURL, MetricURLKeyToAPIKey, DAMetricURLKeyToAPIKey } from "@/lib/urls";
import { useMemo, useCallback } from "react";
import { ChainData } from "@/types/api/MetricsResponse";
import { Get_SupportedChainKeys } from "@/lib/chains";
import { MasterResponse } from "@/types/api/MasterResponse";

type AggregatedMetricData = {
  metric_id: string;
  metric_name: string;
  description: string;
    source: string[];
    avg?: boolean;
  monthly_agg: "sum" | "maa" | "avg" | "unique";
  last_updated_utc: string;
  chains: {
    [chainKey: string]: ChainData;
  };
  timeIntervals: string[];
};

type UseChainMetricsResult = {
  data: AggregatedMetricData | undefined;
  error: any;
  isLoading: boolean;
  isValidating: boolean;
};


/**
 * Unified hook to fetch metrics for multiple chains or DA layers in parallel
 * and aggregate them into a structure compatible with the old MetricsResponse
 * 
 * @param metricURLKey - The metric URL key
 * @param chainKeys - Array of chain/DA layer keys to fetch
 * @param master - Master response data
 * @param metricType - Either "fundamentals" for chain metrics or "data-availability" for DA metrics
 */
export function useChainMetrics(
  metricURLKey: string,
  chainKeys: string[],
  master: MasterResponse,
  metricType: "fundamentals" | "data-availability" = "fundamentals"
): UseChainMetricsResult {
  const { fetcher } = useSWRConfig();

  // Choose the right mapping and metrics based on type
  const metricKey = metricType === "fundamentals"
    ? MetricURLKeyToAPIKey[metricURLKey]
    : DAMetricURLKeyToAPIKey[metricURLKey];

  const metricsDict = metricType === "fundamentals" ? master.metrics : master.da_metrics;

  const supportedChainKeys = useMemo(() => {
    if (metricType === "data-availability") {
      return metricsDict[metricKey]?.supported_chains || [];
    }
    return metricsDict[metricKey]?.supported_chains || Get_SupportedChainKeys(master).filter((key) => !["all_l2s", "multiple"].includes(key));
  }, [metricType, metricsDict, metricKey, master]);

  // For DA metrics, use supported chains directly; for fundamentals, filter provided chains
  const validChainKeys = useMemo(() => {
    if (metricType === "data-availability") {
      // For DA, use all supported DA layers
      return supportedChainKeys;
    }
    // For fundamentals, filter the provided chainKeys
    return chainKeys.filter((chainKey) => supportedChainKeys.includes(chainKey));
  }, [metricType, chainKeys, supportedChainKeys]);

  const urls = useMemo(() => {
    const urlFunction = metricType === "fundamentals" ? getChainMetricURL : getDALayerMetricURL;
    return validChainKeys.map((chainKey) => urlFunction(chainKey, metricURLKey));
  }, [validChainKeys, metricURLKey, metricType]);

  // Custom fetcher that fetches all URLs in parallel and returns a map
  const parallelFetcher = useCallback(async () => {
    if (urls.length === 0) return {};

    // Use the configured fetcher to fetch all URLs in parallel
    // The fetcher handles apiRoot replacement and error handling
    const results = await Promise.allSettled(
      urls.map(async (url, index) => {
        try {
          const data = await fetcher!(url);
          return { chainKey: validChainKeys[index], data };
        } catch (error) {
          // The fetcher in providers.tsx already handles 404/403 errors for chain metrics
          // by returning null, so we should handle that case
          return { chainKey: validChainKeys[index], data: null };
        }
      })
    );

    // Convert results to a map
    const resultMap: { [key: string]: ChainMetricResponse | null } = {};
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        resultMap[result.value.chainKey] = result.value.data as ChainMetricResponse;
      }
    });

    return resultMap;
  }, [urls, validChainKeys, fetcher]);

  // Create a stable key for SWR
  const swrKey = useMemo(() => {
    if (urls.length === 0) return null;
    const prefix = metricType === "fundamentals" ? "chain-metrics" : "da-layer-metrics";
    return `${prefix}-${metricURLKey}-${validChainKeys.join(',')}`;
  }, [metricType, metricURLKey, validChainKeys, urls.length]);

  // Use a single SWR hook to fetch all chains in parallel
  const { data: chainDataMap, error, isLoading, isValidating } = useSWR<{ [key: string]: ChainMetricResponse | null }>(
    swrKey,
    parallelFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      // Keep previous data while revalidating to prevent UI flicker
      keepPreviousData: true,
    }
  );

 

  // Aggregate all the responses with progressive loading
  const aggregatedData = useMemo(() => {
    // Return early if not a valid metric
    if (!metricsDict[metricKey]) return undefined;
    
    // Return early if no data yet
    if (!chainDataMap) return undefined;

    // Find successful responses (non-null data)
    const successfulChains = validChainKeys.filter(
      (chainKey) => chainDataMap[chainKey] !== null && chainDataMap[chainKey] !== undefined
    );

    // Progressive loading: Show data as soon as we have at least one successful response
    // This prevents UI freezing while waiting for all chains
    if (successfulChains.length === 0 && isLoading) {
      // Still loading initial data
      return undefined;
    }

    if (successfulChains.length === 0) {
      // No data available for any chain
      return undefined;
    }

    // Get the first successful response to extract common metadata
    const firstSuccessfulChain = successfulChains[0];
    const firstResponse = chainDataMap[firstSuccessfulChain];
    if (!firstResponse) return undefined;

    // Build the chains object by transforming each successful ChainMetricResponse
    const chains: { [chainKey: string]: ChainData } = {};
    // Derive intervals from timeseries keys, filtered to those we actually support.
    // Using timeseries (not changes) ensures "hourly" is included; using an
    // allowlist keeps unsupported keys like "quarterly" and "daily_7d_rolling" out.
    const supported = ["hourly", "daily", "weekly", "monthly"];
    const timeIntervals = supported.filter(
      (key) => key in firstResponse.details.timeseries,
    );

    successfulChains.forEach((chainKey) => {
      const responseData = chainDataMap[chainKey];
      if (responseData) {
        // Transform the new structure to the old ChainData structure
        chains[chainKey] = transformToChainData(responseData.details, chainKey);
      }
    });

    return {
      metric_id: firstResponse.details.metric_id,
      metric_name: firstResponse.details.metric_name,
      description: "", // Not available in new API structure
      source: firstResponse.details.source || [], // Not available in new API structure
      avg: metricsDict[metricKey].avg || false, // Default value, can be overridden
      monthly_agg: metricsDict[metricKey].monthly_agg || "sum" as const, // Default value, can be overridden
      chains,
      timeIntervals,
      last_updated_utc:
        firstResponse.last_updated_utc instanceof Date
          ? firstResponse.last_updated_utc.toISOString()
          : String(firstResponse.last_updated_utc),
    };
  }, [chainDataMap, validChainKeys, isLoading, metricKey, metricsDict]);


  if (!metricsDict[metricKey]) {
    console.error(`Metric not found in ${metricType}`, metricKey);
    return {
      data: undefined,
      error: "Metric not found",
      isLoading: false,
      isValidating: false,
    };
  }

  return {
    data: aggregatedData,
    error,
    isLoading,
    isValidating,
  };
}

/**
 * Transform the new ChainMetricResponse structure to the old ChainData structure
 */
function transformToChainData(
  details: MetricDetails,
  chainKey: string
): ChainData {
  const { timeseries, changes, summary } = details;

  return {
    chain_name: chainKey, // Will be enriched with actual name from Master context
    changes: changes,
    daily: {
      types: timeseries.daily.types as string[],
      data: timeseries.daily.data,
    },
    hourly: timeseries.hourly ? {
      types: timeseries.hourly.types as string[],
      data: timeseries.hourly.data,
    } : undefined,
    daily_7d_rolling: timeseries.daily_7d_rolling ? {
      types: timeseries.daily_7d_rolling.types as string[],
      data: timeseries.daily_7d_rolling.data,
    } : undefined,
    // changes_monthly: {
    //   types: changes.monthly.types as string[],
    //   "30d": changes.monthly["30d"],
    //   "90d": changes.monthly["90d"],
    //   "180d": changes.monthly["180d"],
    //   "365d": changes.monthly["365d"],
    // },
    monthly: {
      types: timeseries.monthly.types as string[],
      data: timeseries.monthly.data,
    },
    weekly: timeseries.weekly ? {
      types: timeseries.weekly.types as string[],
      data: timeseries.weekly.data,
    } : undefined,
    summary: summary
    // last_30d: {
    //   types: summary.last_30d.types as string[],
    //   data: summary.last_30d.data,
    // },
  };
}
