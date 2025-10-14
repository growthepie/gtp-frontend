export type MetricsResponse = {
  data: MetricData;
};

export type MetricData = {
  avg?: boolean;
  monthly_agg: "sum" | "avg" | "unique";
  metric_id: string;
  metric_name: string;
  description: string;
  source: string[];
  chains: Chains;
};

export type Chains = {
  [key: string]: ChainData;
};

export type ChainData = {
  chain_name: string;
  changes: {
    types: string[];
    "1d": number[];
    "7d": number[];
    "30d": number[];
    "90d": number[];
    "180d": number[];
    "365d": number[];
  };
  daily: {
    types: string[];
    data: number[][];
  };
  weekly?: {
    types: string[];
    data: number[][];
  };
  changes_monthly: {
    types: string[];
    "30d": number[];
    "90d": number[];
    "180d": number[];
    "365d": number[];
  };
  monthly: {
    types: string[];
    data: number[][];
  };
  last_30d: {
    types: string[];
    data: number[];
  };
};
