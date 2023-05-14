export interface ChainResponse {
  data: Data;
}
export interface Data {
  chain_id: string;
  chain_name: string;
  description: string;
  symbol: string;
  website: string;
  explorer: string;
  metrics: Metrics;
}
export interface Metrics {
  tvl: TvlOrTxcountOrDaa;
  txcount: TvlOrTxcountOrDaa;
  daa: TvlOrTxcountOrDaa;
}
export interface TvlOrTxcountOrDaa {
  metric_name: string;
  unit: string;
  source: string;
  changes: Changes;
  daily?: (number[] | null)[] | null;
  avg: boolean;
}
export interface Changes {
  "1d": number;
  "7d": number;
  "30d": number;
  "90d": number;
  "180d": number;
  "365d": number;
}
