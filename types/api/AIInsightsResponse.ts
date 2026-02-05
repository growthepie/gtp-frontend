/**
 * Types for the AI Insights feature
 */

import { ToolCallRecord } from "@/lib/insights/tools/types";

export type InsightComponentType = "table" | "chart" | "card" | "chain";

export type InsightTimeframe = "7d" | "30d" | "all";

/**
 * Context data for a single chain's metrics
 */
export interface ChainInsightContext {
  chainKey: string;
  chainName: string;
  urlKey?: string;
  purpose?: string;
  maturity?: string;
  weeklyActiveAddresses: number;
  userShare: number;
  crossChainActivity: number;
  rankings?: {
    [metric: string]: {
      rank: number | null;
      outOf: number | null;
      value?: number;
    };
  };
}

/**
 * Context data for table-level insights
 */
export interface TableInsightContext {
  totalChains: number;
  chains: ChainInsightContext[];
  timeframe: InsightTimeframe;
  sortedBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Request payload for the AI Insights API
 */
export interface AIInsightsRequest {
  /** Type of component requesting insights */
  componentType: InsightComponentType;
  /** Title or description of what's being analyzed */
  title: string;
  /** The actual data context */
  context: TableInsightContext | ChainInsightContext;
  /** Optional custom prompt to guide the analysis */
  customPrompt?: string;
}

/**
 * Response from the AI Insights API
 */
export interface AIInsightsResponse {
  /** The main insight text */
  insight: string;
  /** Optional suggested actions or follow-up points */
  suggestions?: string[];
  /** Key metrics highlighted in the insight */
  highlightedMetrics?: {
    metric: string;
    value: string;
    trend?: "up" | "down" | "stable";
  }[];
  /** Whether this response was from cache */
  cached?: boolean;
  /** Error message if the request failed */
  error?: string;
  /** Debug info: the prompt that was sent to the LLM */
  debug?: {
    prompt: string;
    systemPrompt: string;
    model: string;
    toolCalls?: ToolCallRecord[];
    agenticTurns?: number;
  };
  /** The model's thinking/reasoning process (if available) */
  thinking?: string;
  /** Sources from Google Search grounding (if enabled) */
  sources?: {
    title: string;
    url: string;
  }[];
}

/**
 * Internal state for the useAIInsights hook
 */
export interface AIInsightsState {
  data: AIInsightsResponse | null;
  isLoading: boolean;
  error: Error | null;
}
