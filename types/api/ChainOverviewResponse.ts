export interface ChainOverviewResponse {
  data: Data;
}

export interface Data {
  metric_id: string;
  chains: Chains;
}

export interface Chains {
  [key: string]: ChainData;
}

export interface AllChainsData {
  chain_name: string;
  daily: Daily;
}

export interface ChainData {
  chain_name: string;
  overview: Overviews;
  daily: Daily;
  totals: Overviews;
}

export interface Daily {
  types: string[];
  utility: CategoryData;
  scaling: CategoryData;
  native_transfers: CategoryData;
  gaming: CategoryData;
  token_transfers: CategoryData;
  collectibles: CategoryData;
  finance: CategoryData;
  unlabeled: CategoryData;
}

export interface CategoryData {
  data: Array<number[]>;
}

export interface Overviews {
  types: string[];
  "180": Categories;
  "7d": Categories;
  "30d": Categories;
  "90d": Categories;
  "365d": Categories;
}

export interface Categories {
  utility: number[];
  scaling: number[];
  native_transfers: number[];
  gaming: number[];
  token_transfers: number[];
  collectibles: number[];
  finance: number[];
}


export interface StreaksData {
  last_updated_utc: string;
  data: {
    [key: string]: {
      txcount: {
        value: number;
      };
      fees: {
        usd: number;
        eth: number;
      };
      
    }
  }
}
