export interface ChainResponse {
  data: ChainsData;
}
export interface ChainsData {
  chain_id: string;
  chain_name: string;
  description: string;
  symbol: string;
  website: string;
  explorer: string;
  metrics: Metrics;
}
export interface Metrics {
  [key: string]: MetricData;
}
export interface MetricData {
  metric_name: string;
  unit: string;
  source: string[];
  changes: Changes;
  daily: Daily;
  avg: boolean;
}

export interface Daily {
  types: string[];
  data: [number, number][];
}

export interface Changes {
  "1d": number;
  "7d": number;
  "30d": number;
  "90d": number;
  "180d": number;
  "365d": number;
}
