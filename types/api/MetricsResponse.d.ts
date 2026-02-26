import { Changes, Summary } from "./ChainMetricResponse";

export type MetricsResponse = {
  data: MetricData;
};

export type MetricData = {
  avg?: boolean;
  monthly_agg: "sum" | "avg" | "unique";
  metric_id: string;
  last_updated_utc: string;
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
  changes: Changes;
  hourly?: {
    types: string[];
    data: number[][];
  };
  daily: {
    types: string[];
    data: number[][];
  };
  daily_7d_rolling: {
    types: string[];
    data: number[][];
  } | undefined;
  weekly?: {
    types: string[];
    data: number[][];
  };
  // changes_monthly: {
  //   types: string[];
  //   "30d": number[];
  //   "90d": number[];
  //   "180d": number[];
  //   "365d": number[];
  // };
  monthly: {
    types: string[];
    data: number[][];
  };
  summary: Summary;
  // last_30d: {
  //   types: string[];
  //   data: number[];
  // };
};
