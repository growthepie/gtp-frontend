export interface EconomicsResponse {
  data: {
    chain_breakdown: ChainBreakdownResponse;
    da_charts: FeesBreakdown;
    all_l2s: l2_data;
    // Other properties if exist
  };
}

export interface ChainBreakdownResponse {
  [key: string]: ChainBreakdownData;
}

export interface ChainBreakdownData {
  "1d": DurationData;
  "7d": DurationData;
  "30d": DurationData;
  "90d": DurationData;
  "180d": DurationData;
  daily: DailyData;
  max: DurationData;
}

export interface DurationData {
  costs: Costs;
  profit: Profit;
  profit_margin: Profit;
  revenue: Profit;
  size: Profit;
}

export interface l2_data {
  chain_id: string;
  chain_name: string;
  metrics: {
    profit: l2_metrics;
    fees: l2_metrics;
    rent_paid: l2_metrics;
    costs: {
      settlement: l2_metrics;
      da: l2_metrics;
    };
  };
}

export interface l2_metrics {
  metric_name: string;
  source: string[];
  avg: string;
  daily: Daily;
}

export interface DailyData {
  costs: Daily;
  profit: Daily;
  revenue: Daily;
}

export interface Costs {
  blobs: number[];
  l1_costs: number[];
  total: number[];
  types: string[];
  settlement: number[];
  da: number[];
}

export interface Profit {
  total: number[];
  types: string[];
}

export interface FeesBreakdown {
  [key: string]: { total_blob_size: FeesData; total_blob_fees: FeesData };
}

export interface FeesData {
  avg?: string;
  daily: Daily;
  metric_name: string;
}

export interface Daily {
  data: DataRow[];
  types: string[];
}

type DataRow = [number, number, number];
