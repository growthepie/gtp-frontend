export interface EconomicsResponse {
  chain_breakdown: ChainBreakdown;
  da_fees: Fees;
}

export interface ChainBreakdown {
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
  da_costs: number[];
  proof_costs: number[];
  total: number[];
  types: string[];
}

export interface Profit {
  total: number[];
  types: string[];
}

export interface Fees {
  [key: string]: FeesData;
}

export interface FeesData {
  avg: string;
  daily: Daily;
  metric_name: string;
  source: string[];
}

export interface Daily {
  data: DataRow[];
  types: string[];
}

type DataRow = [number, number, number];
