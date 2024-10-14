export interface MasterResponse {
  current_version: string;
  chains: Chains;
  metrics: Metrics;
  fee_metrics: FeeMetrics;
  default_chain_selection: string[];
  blockspace_categories: BlockspaceCategories;
  da_layers: DataAvailabilityLayers;
}

export interface Chains {
  [key: string]: ChainInfo;
}

export interface ChainInfo {
  name: string;
  url_key: string;
  chain_type: string;
  ecosystem: string[];
  deployment: "PROD" | "DEV";
  name_short: string;
  description: string;
  symbol: string;
  bucket: string;
  colors: {
    light: [string, string];
    dark: [string, string];
    darkTextOnBackground: boolean;
  };
  logo: {
    body: string;
    width?: number;
    height?: number;
  };
  da_layer: string;
  technology: string;
  purpose: string;
  launch_date: string;
  website: string;
  twitter: string;
  block_explorer: string;
  block_explorers: BlockExplorers;
  rhino_listed: boolean;
  rhino_naming: string;
  l2beat_stage: L2BeatStage;
  l2beat_link: string;
  raas: string;
  stack: Stack;
  enable_contracts: boolean;
}

export interface BlockExplorers {
  [key: string]: string;
}

export interface L2BeatStage {
  stage: string;
  hex: string;
}
export interface Stack {
  label: string;
  url: string;
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

export interface DataAvailabilityLayers {
  [key: string]: {
    name: string;
    name_short: string;
    logo: {
      body: string;
      width?: number;
      height?: number;
    };
    colors: {
      light: [string, string];
      dark: [string, string];
      darkTextOnBackground: boolean;
    };
  };
}

export interface FeeMetrics {
  txcosts_native_median: FeeSchema;
  txcosts_median: FeeSchema;
  tps: FeeSchema;
  throughput: FeeSchema;
  txcosts_swap: FeeSchema;
  txcosts_avg: FeeSchema;
}

export interface UnitSchema {
  currency: boolean;
  prefix: null | string;
  suffix: null | string;
  decimals: number;
  decimals_tooltip: number;
  agg: boolean;
  agg_tooltip: boolean;
}

export interface FeeSchema {
  name: string;
  name_short: string;
  units: { [key: string]: UnitSchema };
  category: string;
  currency: boolean;
  priority: number;
  invert_normalization: boolean;
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
