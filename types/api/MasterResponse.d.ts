export interface MasterResponse {
  current_version: string;
  chains: Chains;
  metrics: Metrics;
  default_chain_selection: string[];
  blockspace_categories: BlockspaceCategories;
}

export interface Chains {
  [key: string]: ChainInfo;
}
// {
//   "name": "Base",
//   "deployment": "PROD",
//   "name_short": "Base",
//   "description": "Base is an fully EVM compatible optimistic rollup built on the OP Stack. It is incubated inside of Coinbase. Public mainnet launch was on August 9th 2023.",
//   "symbol": "-",
//   "bucket": "OP Chains",
//   "technology": "Optimistic Rollup",
//   "purpose": "General Purpose (EVM)",
//   "launch_date": "2023-07-13",
//   "website": "https://base.org/",
//   "twitter": "https://twitter.com/base",
//   "block_explorer": "https://basescan.org/"
// }
export interface ChainInfo {
  name: string;
  deployment: "PROD" | "DEV";
  name_short: string;
  description: string;
  symbol: string;
  bucket: string;
  da_layer: string;
  technology: string;
  purpose: string;
  launch_date: string;
  website: string;
  twitter: string;
  block_explorer: string;
  rhino_listed: boolean;
  rhino_naming: string;
  l2beat_stage: string;
}

export interface Metrics {
  [key: string]: MetricInfo;
}

export interface MetricInfo {
  name: string;
  metric_keys: string[];
  units: string[];
  avg: boolean;
  all_l2s_aggregate: string;
}

export interface BlockspaceCategories {
  main_categories: MainCategories;
  sub_categories: SubCategories;
  mapping: BlockspaceCategoriesMapping;
}

export interface MainCategories {
  [key: string]: string;
}

export interface SubCategories {
  [key: string]: string;
}

export interface BlockspaceCategoriesMapping {
  [key: string]: string[];
}
