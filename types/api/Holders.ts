export interface HolderResponse {
  data: {
    chart: ChartDataBreakdown;
    holders_table: TableDataBreakdown;
  };
}

export interface ChartDataBreakdown {
  [key: string]: {
    data: {
      [index: number]: [number, number, number];
    };
    types: string[];
  };
}

export interface TableDataBreakdown {
  [key: string]: {
    balance: number;
    share: number;
    twitter: string;
    website: string;
  };
}
