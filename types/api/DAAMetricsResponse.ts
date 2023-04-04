export interface DAAMetricsResponse {
  data: Data;
}

export interface Data {
  metric_id: string;
  metric_name: string;
  description: string;
  source: string;
  chains: Chains;
}

export interface Chains {
  ethereum: Ethereum;
  arbitrum: Arbitrum;
  optimism: Optimism;
  polygon: Polygon;
}

export interface Ethereum {
  chain_name: string;
  changes: Changes;
  daily: Daily;
}

export interface Changes {
  types: string[];
  "1d": number[];
  "7d": number[];
  "30d": number[];
  "90d": number[];
  "180d": number[];
  "365d": number[];
}

export interface Daily {
  types: string[];
  data: number[][];
}

export interface Arbitrum {
  chain_name: string;
  changes: Changes;
  daily: Daily;
}

export interface Optimism {
  chain_name: string;
  changes: Changes;
  daily: Daily;
}

export interface Polygon {
  chain_name: string;
  changes: Changes;
  daily: Daily;
}
