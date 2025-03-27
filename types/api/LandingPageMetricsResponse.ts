export interface LandingPageMetricsResponse {
  data: Data;
}

export interface Data {
  metrics: Metrics;
}

export interface Metrics {
  user_base: UserBase;
  engagement: Engagement;
  table_visual: TableVisual;
}

export interface TableVisual {
  [chain: string]: {
    chain_name: string;
    cross_chain_activity: number;
    purpose: string;
    technology: string;
    users: number;
    ranking: { [key in RankingType]: EthUsdRanking };
    ranking_w_eth: { [key in RankingType]: EthUsdRanking };
  };
}

export interface Engagement {
  metric_name: string;
  source: string[];
  weekly: EngagementWeekly;
}

export interface EngagementWeekly {
  latest_total: number;
  latest_total_comparison: number;
  l2_dominance: number;
  l2_dominance_comparison: number;
  cross_chain_users: number;
  cross_chain_users_comparison: number;
  timechart: Timechart;
}

export interface Timechart {
  types: string[];
  compositions: Composition;
}

export interface Composition {
  cross_layer: number[][];
  single_l2: number[][];
  multiple_l2s: number[][];
  only_l1: number[][];
}

export type RankingType =
  | "daa"
  | "stables_mcap"
  | "fees"
  | "profit"
  | "txcosts"
  | "fdv"
  | "throughput";

export interface ValueRanking {
  rank: number | null;
  out_of: number | null;
  color_scale: number | null;
  value?: number;
}

export interface EthUsdRanking {
  rank: number;
  out_of: number;
  color_scale: number;
  value_usd: number;
  value_eth: number;
}

export interface UserBase {
  metric_name: string;
  source: string[];
  daily: Daily;
  weekly: Weekly;
}

export interface Daily {
  cross_chain_users;
  cross_chain_users_comparison;
  latest_total: number;
  latest_total_comparison: number;
  l2_dominance: number;
  l2_dominance_comparison: number;
  chains: Chains;
}

export interface Chains {
  ethereum: Ethereum;
  polygon_zkevm: PolygonZkevm;
  optimism: Optimism;
  arbitrum: Arbitrum;
  imx: Imx;
  multiple: Multiple;
}

export interface Ethereum {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}

export interface ChainData {
  types: string[];
  data: number[][];
}

export interface PolygonZkevm {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}

export interface Optimism {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}
export interface Arbitrum {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}

export interface Imx {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}

export interface Multiple {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}

export interface Weekly {
  cross_chain_users;
  cross_chain_users_comparison;
  latest_total: number;
  latest_total_comparison: number;
  l2_dominance: number;
  l2_dominance_comparison: number;
  chains: Chains;
}

export interface Ethereum2 {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}

export interface PolygonZkevm2 {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}
export interface Optimism2 {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}

export interface Arbitrum2 {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}

export interface Imx2 {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}

export interface Multiple2 {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}

export interface Monthly {
  latest_total: number;
  l2_dominance: number;
  chains: Chains;
}

export interface Ethereum3 {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}

export interface PolygonZkevm3 {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}
export interface Optimism3 {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}

export interface Arbitrum3 {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}

export interface Imx3 {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}

export interface Multiple3 {
  chain_name: string;
  rollup_type: string;
  user_share: number;
  data: ChainData;
}
