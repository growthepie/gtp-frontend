import useSWR from "swr";
import { ChainMetricResponse, MetricDetails } from "@/types/api/ChainMetricResponse";
import { getChainMetricURL } from "@/lib/urls";
import { useMemo } from "react";
import { ChainData } from "@/types/api/MetricsResponse";

type AggregatedMetricData = {
  metric_id: string;
  metric_name: string;
  description: string;
  source: string[];
  avg?: boolean;
  monthly_agg: "sum" | "avg" | "unique";
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
 * Custom hook to fetch metrics for multiple chains in parallel
 * and aggregate them into a structure compatible with the old MetricsResponse
 */
export function useChainMetrics(
  metricURLKey: string,
  chainKeys: string[]
): UseChainMetricsResult {
  // Create an array of SWR hooks, one for each chain
  const chainResponses = chainKeys.map((chainKey) => {
    const url = getChainMetricURL(chainKey, metricURLKey);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSWR<ChainMetricResponse>(url, {
      onError: (error) => {
        // Silence expected errors (404, 403, CORS failures, JSON parse errors from 403/404 responses)
        const status = error?.status || error?.response?.status;

        // Check if it's a 404 or 403
        if (status === 404 || status === 403) {
          return;
        }

        // Check if it's a JSON parse error (happens when 403/404 returns HTML/XML)
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
          return;
        }

        // Check if it's a CORS error or fetch failure (often caused by 403 blocking)
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          return;
        }

        // Log other errors normally
        console.error(`Error fetching ${chainKey} ${metricURLKey}:`, error);
      },
      // Prevent SWR from retrying on 404/403 and fetch failures
      shouldRetryOnError: (error) => {
        const status = error?.status || error?.response?.status;

        // Don't retry on 404/403
        if (status === 404 || status === 403) {
          return false;
        }

        // Don't retry on JSON parse errors (403/404 responses)
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
          return false;
        }

        // Don't retry on CORS/fetch failures
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          return false;
        }

        // Retry on other errors
        return true;
      },
    });
  });

  // Aggregate all the responses
  const aggregatedData = useMemo(() => {
    // Filter responses: only include successful ones (ignore 404/403/500 errors)
    const successfulResponses = chainResponses.filter((response, index) => {
      // Skip if still loading
      if (!response.data && response.isLoading) return false;

      // Skip if error is 404, 403, or any HTTP error (chain doesn't have this metric)
      if (response.error) {
        const errorStatus = response.error?.status || response.error?.response?.status;
        // Filter out 404 (not found), 403 (forbidden), and 500+ (server errors)
        if (errorStatus === 404 || errorStatus === 403 || errorStatus >= 500) {
          return false;
        }
      }

      // Include if we have data
      return !!response.data;
    });

    // Wait until all chains have either loaded or errored
    const allSettled = chainResponses.every(
      (response) => response.data || response.error || !response.isLoading
    );
    if (!allSettled) return undefined;

    // If no successful responses, return undefined
    if (successfulResponses.length === 0) return undefined;

    // Get the first successful response to extract common metadata
    const firstSuccessfulIndex = chainResponses.findIndex(
      (response) => response.data && !response.error
    );
    if (firstSuccessfulIndex === -1) return undefined;

    const firstResponse = chainResponses[firstSuccessfulIndex].data;
    if (!firstResponse) return undefined;

    // Build the chains object by transforming each successful ChainMetricResponse
    const chains: { [chainKey: string]: ChainData } = {};

    chainResponses.forEach((response, index) => {
      const chainKey = chainKeys[index];

      // Skip if error or no data
      if (response.error || !response.data) return;

      // Transform the new structure to the old ChainData structure
      chains[chainKey] = transformToChainData(response.data.details, chainKey);
    });

    return {
      metric_id: firstResponse.details.metric_id,
      metric_name: firstResponse.details.metric_name,
      description: "", // Not available in new API structure
      source: [], // Not available in new API structure
      avg: false, // Default value, can be overridden
      monthly_agg: "sum" as const, // Default value, can be overridden
      chains,
    };
  }, [chainResponses, chainKeys]);

  // Aggregate loading and error states
  const isLoading = chainResponses.some((response) => response.isLoading);
  const isValidating = chainResponses.some((response) => response.isValidating);

  // Only report critical errors (not 404/403 which are expected for some chains)
  const criticalError = chainResponses.find((response) => {
    if (!response.error) return false;
    const errorStatus = response.error?.status || response.error?.response?.status;
    // Only report non-404/403 errors as critical
    return errorStatus && errorStatus !== 404 && errorStatus !== 403;
  })?.error;

  return {
    data: aggregatedData,
    error: criticalError,
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
    changes: {
      types: changes.daily.types as string[],
      "1d": changes.daily["1d"],
      "7d": changes.daily["7d"],
      "30d": changes.daily["30d"],
      "90d": changes.daily["90d"],
      "180d": changes.daily["180d"],
      "365d": changes.daily["365d"],
    },
    daily: {
      types: timeseries.daily.types as string[],
      data: timeseries.daily.data,
    },
    changes_monthly: {
      types: changes.monthly.types as string[],
      "30d": changes.monthly["30d"],
      "90d": changes.monthly["90d"],
      "180d": changes.monthly["180d"],
      "365d": changes.monthly["365d"],
    },
    monthly: {
      types: timeseries.monthly.types as string[],
      data: timeseries.monthly.data,
    },
    weekly: timeseries.weekly ? {
      types: timeseries.weekly.types as string[],
      data: timeseries.weekly.data,
    } : undefined,
    last_30d: {
      types: summary.last_30d.types as string[],
      data: summary.last_30d.data,
    },
  };
}
