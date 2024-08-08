export interface EconomicsResponse {
  data: {
    chain_breakdown: ChainBreakdownResponse;
    da_charts: FeesBreakdown;
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
