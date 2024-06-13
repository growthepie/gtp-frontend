export interface HolderResponse {
  chart: ChartDataBreakdown;
  holders_table: TableDataBreakdown;
  source: string[];
}

export interface ChartDataBreakdown {
  data: number[][];
  types: string[];
}

export interface TableDataBreakdown {
  [key: string]: {
    balance: number;
    share: number;
    twitter: string;
    website: string;
  };
}
