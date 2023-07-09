export interface CategoryComparisonResponse {
  data: CategoryComparisonResponseData;
}

export interface CategoryComparisonResponseData {
  native_transfers: Cefi;
  token_transfers: Cefi;
  nft_fi: Cefi;
  defi: Cefi;
  gaming: Cefi;
  scaling: Cefi;
  cefi: Cefi;
  utility: Cefi;
}

export interface Cefi {
  type: string;
  subcategories: Subcategories;
  daily: Daily;
  aggregated: { [key: string]: Aggregated };
}

export interface Aggregated {
  data: AggregatedData;
  contracts: Contracts;
}

export interface Contracts {
  types: Type[];
  data: Array<Array<number | DatumEnum>>;
}

export enum DatumEnum {
  Arbitrum = "arbitrum",
  Defi = "defi",
  Dex = "dex",
  SuhiRouter = "Suhi: Router",
  The0X1B02Da8Cb0D097Eb8D57A175B88C7D8B47997506 = "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506",
  The0X68B3465833Fb72A70Ecdf485E0E4C7Bd8665Fc45 = "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
  UniswapV3Router2 = "Uniswap V3: Router 2",
}

export enum Type {
  Address = "address",
  Chain = "chain",
  GasFeesAbsoluteEth = "gas_fees_absolute_eth",
  GasFeesAbsoluteUsd = "gas_fees_absolute_usd",
  GasFeesShare = "gas_fees_share",
  MainCategoryKey = "main_category_key",
  Name = "name",
  SubCategoryKey = "sub_category_key",
  TxcountAbsolute = "txcount_absolute",
  TxcountShare = "txcount_share",
  Unix = "unix",
}

export interface AggregatedData {
  types: Type[];
  arbitrum: number[];
  optimism: number[];
  zksync_era: number[];
}

export interface Daily {
  types: Type[];
  arbitrum: Array<number[]>;
  optimism: Array<number[]>;
  zksync_era: Array<number[]>;
}

export interface Subcategories {
  list: string[];
}
