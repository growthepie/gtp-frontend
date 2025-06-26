// --- Types for SSE Data (adjust based on your actual data structure) ---
export interface ChainMetrics {
  name: string;
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
}

export interface SSEData {
  type: 'initial' | 'update';
  data?: Record<string, ChainMetrics>; // Chain-specific data, keyed by chain ID/name
  global_metrics?: GlobalMetrics;
  timestamp: string;
}
// --------------------------------------------------------------------------