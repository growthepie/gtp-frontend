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
  ranking: ChainRanking;
  hottest_contract: HottestContractData;
}

export interface HottestContractData {
  data: any[][];
  types: any[];
}

export interface ChainRanking {
  [metric: string]: { color_scale: number; rank: number; out_of: number };
}

export interface Metrics {
  [key: string]: MetricData;
}
export interface MetricData {
  metric_name: string;
  unit: string;
  source: string[];
  changes: Changes;
  daily: IntervalData;
  weekly?: IntervalData;
  monthly?: IntervalData;
  quarterly?: IntervalData;
  avg: boolean;
}

export interface IntervalData {
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
