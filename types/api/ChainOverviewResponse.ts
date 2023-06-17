export interface ChainOverviewResponse {
  data: Data;
}

export interface Data {
  metric_id: string;
  chains: Chains;
}

export interface Chains {
  arbitrum: ChainData;
  optimism: ChainData;
  all_l2s: AllChainsData;
}

export interface AllChainsData {
  chain_name: string;
  daily: Daily;
}

export interface ChainData {
  chain_name: string;
  overview: Overviews;
  daily: Daily;
}

export interface Daily {
  types: string[];
  utility: CategoryData;
  scaling: CategoryData;
  defi: CategoryData;
  native_transfers: CategoryData;
  gaming: CategoryData;
  token_transfers: CategoryData;
  nft_fi: CategoryData;
  cefi: CategoryData;
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
  defi: number[];
  native_transfers: number[];
  gaming: number[];
  token_transfers: number[];
  nft_fi: number[];
  cefi: number[];
}
