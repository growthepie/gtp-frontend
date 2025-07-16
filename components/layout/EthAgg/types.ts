// --- Types for SSE Data (adjust based on your actual data structure) ---
export interface ChainMetrics {
  name: string;
  display_name: string;
  tps?: number;
  cost?: number;
  tx_cost_native_usd?: number;
  tx_cost_native?: number;
  // Add other chain-specific metrics if needed
}

export interface GlobalMetrics {
  total_tps?: number;
  highest_tps?: number;
  highest_l2_cost_usd?: number;
  eth_price_usd?: number;
  ethereum_tx_cost_usd?: number;
  layer2s_tx_cost_usd?: number;
  avg_tx_cost_usd?: number;
  total_tps_24h_high?: number;
  total_tps_ath?: number;
  total_tps_24h_high_timestamp?: string;
  total_tps_ath_timestamp?: string;
}

export interface SSEData {
  type: 'initial' | 'update';
  data?: Record<string, ChainMetrics>; // Chain-specific data, keyed by chain ID/name
  global_metrics?: GlobalMetrics;
  timestamp: string;
}


export interface HistoryData {
  history: HistoryItem[]
  summary: SummaryItem
}

export interface SummaryItem {
  total_events: number;
  time_range_hours: number;
  avg_tps: number;
  max_tps: number;
  min_tps: number;
  current_ath: number;
  current_24_high: number;
}


export interface HistoryItem {
  tps: number;
  timestamp: string;
  total_chains: number;
  active_chains: number;
  is_ath: boolean;
}
// --------------------------------------------------------------------------