export interface MasterResponse {
  sources: { [key: string]: SouceType };
  current_version: string;
  chains: Chains;
  custom_logos: { [key: string]: CustomLogo };
  metrics: Metrics;
  app_metrics: Metrics;
  da_metrics: Metrics;
  fee_metrics: FeeMetrics;
  default_chain_selection: string[];
  blockspace_categories: BlockspaceCategories;
  da_layers: DataAvailabilityLayers;
  maturity_levels: { [key: string]: MaturityLevels};
  composition_types: { [key: string]: CompositionTypes};
  last_updated_utc: string;
  ethereum_events: EthereumEvents[];
  searchbar_items?: string[];
}

export interface EthereumEvents {
  date: string;
  description: string;
  issuance?: string;
  short_title: string;
  show_in_chart: boolean;
  source: string;
  title: string;
  type: string;
}

export interface SourceType {
  name: string;
  url: string;
}

export interface CompositionTypes {
  name: string;
  description: string;
}

export interface MaturityLevels {
  name: string;
  description: string;
  conditions: {
    [key: string]: {
      tvs: number;
      stage: string;
      risks: number,
      age: number,
    }
  }
}

export interface Chains {
  [key: string]: ChainInfo;
}

export interface CustomLogo {
  body: string;
  width?: number;
  height?: number;
}

export interface ChainInfo {
  name: string;
  name_short: string;
  url_key: string;
  chain_type: string;
  evm_chain_id: string;
  ecosystem: string[];
  deployment: "PROD" | "DEV";
  name_short: string;
  description: string;
  symbol: string;
  bucket: string;
  company?: string;
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
  maturity: string;
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
  tab_status: {
    [key: string]: "locked" | "active" | "soon";
  };
  supported_metrics: string[];
  similar_chains: string[];
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
  units: { [key: string]: UnitSchema };
  icon: string;
  avg: boolean;
  all_l2s_aggregate: string;
  fundamental: boolean;
  log_default: boolean;
  max_date_fill: boolean;
  monthly_agg: "sum" | "avg" | "maa";
  source: string[];
  supported_chains: string[];
}

export interface DataAvailabilityLayers {
  [key: string]: DataAvailabilityLayerData;
}

export interface DataAvailabilityLayerData {
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
  block_explorers: BlockExplorers;
  incl_in_da_overview: boolean;
  url_key: string;
  website: string;
  twitter: string;
}

export interface FeeMetrics {
  txcosts_native_median: FeeSchema;
  txcosts_median: FeeSchema;
  tps: FeeSchema;
  throughput: FeeSchema;
  txcosts_swap: FeeSchema;
  txcosts_avg: FeeSchema;
  [key: string]: FeeSchema;
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
