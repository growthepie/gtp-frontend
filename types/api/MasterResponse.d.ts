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

export interface ChainInfo {
  name: string;
  name_short: string;
  symbol: string;
  bucket: string;
  deployment: "PROD" | "DEV";
  technology: string;
  purpose: string;
  launch_date: string;
  website: string;
  twitter: string;
  block_explorer: string;
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
