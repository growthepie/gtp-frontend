import useSWR, { useSWRConfig } from "swr";
import { ChainMetricResponse, MetricDetails } from "@/types/api/ChainMetricResponse";
import { getChainMetricURL, MetricURLKeyToAPIKey } from "@/lib/urls";
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
  chains: {
    [chainKey: string]: ChainData;
  };
};

type UseChainMetricsResult = {
  data: AggregatedMetricData | undefined;
  error: any;
  isLoading: boolean;
  isValidating: boolean;
};


/**
 * Hook to fetch metrics for multiple chains in parallel
 * and aggregate them into a structure compatible with the old MetricsResponse
 */
export function useChainMetrics(
  metricURLKey: string,
  chainKeys: string[],
  master: MasterResponse
): UseChainMetricsResult {
  const { fetcher } = useSWRConfig();
  console.log("metricURLKey", metricURLKey);
  const metricKey = MetricURLKeyToAPIKey[metricURLKey];
  if (!master.metrics[metricKey]) {
    console.error("Metric not found", metricKey);
    return {
      data: undefined,
      error: "Metric not found",
      isLoading: false,
      isValidating: false,
    };
  }
  const supportedChainKeys = master.metrics[metricKey].supported_chains || Get_SupportedChainKeys(master).filter((key) => !["all_l2s", "multiple"].includes(key));

  // Filter and prepare URLs
  const validChainKeys = useMemo(() =>
    chainKeys.filter((chainKey) => supportedChainKeys.includes(chainKey)),
    [chainKeys, supportedChainKeys]
  );

  const urls = useMemo(() =>
    validChainKeys.map((chainKey) => getChainMetricURL(chainKey, metricURLKey)),
    [validChainKeys, metricURLKey]
  );

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
  const swrKey = useMemo(() =>
    urls.length > 0 ? `chain-metrics-${metricURLKey}-${validChainKeys.join(',')}` : null,
    [metricURLKey, validChainKeys]
  );

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
      source: [], // Not available in new API structure
      avg: master.metrics[metricKey].avg || false, // Default value, can be overridden
      monthly_agg: master.metrics[metricKey].monthly_agg || "sum" as const, // Default value, can be overridden
      chains,
    };
  }, [chainDataMap, validChainKeys, isLoading, metricKey, master]);

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
