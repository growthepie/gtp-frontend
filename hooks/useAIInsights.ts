import { useCallback, useRef, useState } from "react";
import useSWRMutation from "swr/mutation";
import {
  AIInsightsRequest,
  AIInsightsResponse,
  ChainInsightContext,
  TableInsightContext,
  InsightComponentType,
} from "@/types/api/AIInsightsResponse";

// Cache for storing insights
const insightsCache = new Map<string, { data: AIInsightsResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a cache key from the request context
 */
function generateCacheKey(context: TableInsightContext | ChainInsightContext, componentType: InsightComponentType): string {
  if (componentType === "chain") {
    const chainContext = context as ChainInsightContext;
    return `chain:${chainContext.chainKey}:${chainContext.weeklyActiveAddresses}`;
  }
  const tableContext = context as TableInsightContext;
  const chainKeys = tableContext.chains.map(c => c.chainKey).sort().join(",");
  return `table:${tableContext.totalChains}:${chainKeys}:${tableContext.sortedBy || "default"}`;
}

/**
 * Get cached insight if valid
 */
function getCachedInsight(key: string): AIInsightsResponse | null {
  const cached = insightsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { ...cached.data, cached: true };
  }
  insightsCache.delete(key);
  return null;
}

/**
 * Store insight in cache
 */
function setCachedInsight(key: string, data: AIInsightsResponse): void {
  insightsCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetcher function for SWR mutation
 */
async function fetchInsight(
  url: string,
  { arg }: { arg: AIInsightsRequest }
): Promise<AIInsightsResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export interface UseAIInsightsOptions {
  /** The type of component requesting insights */
  componentType: InsightComponentType;
  /** Title for the insight context */
  title: string;
  /** Context data for generating insights */
  context: TableInsightContext | ChainInsightContext;
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Whether to use cached results (default: true) */
  useCache?: boolean;
}

export interface UseAIInsightsResult {
  /** The insight data */
  data: AIInsightsResponse | null;
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Error if the request failed */
  error: Error | null;
  /** Trigger the insight generation */
  fetchInsights: () => Promise<AIInsightsResponse | null>;
  /** Reset the state */
  reset: () => void;
}

/**
 * Hook for fetching AI insights
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, fetchInsights } = useAIInsights({
 *   componentType: "table",
 *   title: "Landing Metrics Table",
 *   context: tableContext,
 * });
 *
 * // Trigger on button click
 * <button onClick={fetchInsights} disabled={isLoading}>
 *   Get AI Insights
 * </button>
 * ```
 */
export function useAIInsights({
  componentType,
  title,
  context,
  debounceMs = 300,
  useCache = true,
}: UseAIInsightsOptions): UseAIInsightsResult {
  const [cachedData, setCachedData] = useState<AIInsightsResponse | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestRef = useRef<number>(0);

  const { trigger, data, error, isMutating, reset: swrReset } = useSWRMutation(
    "/api/gemini/insights",
    fetchInsight
  );

  const fetchInsights = useCallback(async (): Promise<AIInsightsResponse | null> => {
    // Debounce protection
    const now = Date.now();
    if (now - lastRequestRef.current < debounceMs) {
      return null;
    }
    lastRequestRef.current = now;

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Check cache first
    if (useCache) {
      const cacheKey = generateCacheKey(context, componentType);
      const cached = getCachedInsight(cacheKey);
      if (cached) {
        setCachedData(cached);
        return cached;
      }
    }

    try {
      const request: AIInsightsRequest = {
        componentType,
        title,
        context,
      };

      const result = await trigger(request);

      // Cache the result
      if (result && useCache) {
        const cacheKey = generateCacheKey(context, componentType);
        setCachedInsight(cacheKey, result);
      }

      return result || null;
    } catch (err) {
      console.error("Error fetching AI insights:", err);
      throw err;
    }
  }, [componentType, title, context, debounceMs, useCache, trigger]);

  const reset = useCallback(() => {
    setCachedData(null);
    swrReset();
  }, [swrReset]);

  // Return cached data if available, otherwise SWR data
  const resultData = cachedData || data || null;

  return {
    data: resultData,
    isLoading: isMutating,
    error: error || null,
    fetchInsights,
    reset,
  };
}

/**
 * Build table context from landing page data
 */
export function buildTableContext(
  rows: Array<{
    data: {
      chain_name: string;
      purpose?: string;
      users: number;
      user_share: number;
      cross_chain_activity: number;
    };
    chain: { key: string; urlKey?: string };
  }>,
  master: { chains: { [key: string]: { maturity?: string } } },
  sortConfig?: { metric: string; sortOrder: "asc" | "desc" }
): TableInsightContext {
  return {
    totalChains: rows.length,
    chains: rows.map((row) => ({
      chainKey: row.chain.key,
      chainName: row.data.chain_name,
      urlKey: row.chain.urlKey || row.chain.key,
      purpose: row.data.purpose,
      maturity: master.chains[row.chain.key]?.maturity,
      weeklyActiveAddresses: row.data.users,
      userShare: row.data.user_share,
      crossChainActivity: row.data.cross_chain_activity,
    })),
    timeframe: "7d",
    sortedBy: sortConfig?.metric,
    sortOrder: sortConfig?.sortOrder,
  };
}

/**
 * Build chain context from row data
 */
export function buildChainContext(
  row: {
    data: {
      chain_name: string;
      purpose?: string;
      users: number;
      user_share: number;
      cross_chain_activity: number;
    };
    chain: { key: string; urlKey?: string };
  },
  master: { chains: { [key: string]: { maturity?: string } } },
  rankings?: {
    [metric: string]: {
      rank: number | null;
      out_of: number | null;
    };
  }
): ChainInsightContext {
  return {
    chainKey: row.chain.key,
    chainName: row.data.chain_name,
    urlKey: row.chain.urlKey || row.chain.key,
    purpose: row.data.purpose,
    maturity: master.chains[row.chain.key]?.maturity,
    weeklyActiveAddresses: row.data.users,
    userShare: row.data.user_share,
    crossChainActivity: row.data.cross_chain_activity,
    rankings: rankings
      ? Object.fromEntries(
          Object.entries(rankings).map(([metric, r]) => [
            metric,
            { rank: r.rank, outOf: r.out_of },
          ])
        )
      : undefined,
  };
}
