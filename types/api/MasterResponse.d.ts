export interface MasterResponse {
  current_version: string;
  chains: Chains;
  metrics: Metrics;
  blockspace_categories: BlockspaceCategories;
}

export interface Chains {
  ethereum: Ethereum;
  polygon_zkevm: PolygonZkevm;
  optimism: Optimism;
  arbitrum: Arbitrum;
  imx: Imx;
  zksync_era: ZksyncEra;
}

export interface Ethereum {
  name: string;
  symbol: string;
  technology: string;
  purpose: string;
  launch_date: string;
  website: string;
  twitter: string;
  block_explorer: string;
}

export interface PolygonZkevm {
  name: string;
  symbol: string;
  technology: string;
  purpose: string;
  launch_date: string;
  website: string;
  twitter: string;
  block_explorer: string;
}

export interface Optimism {
  name: string;
  symbol: string;
  technology: string;
  purpose: string;
  launch_date: string;
  website: string;
  twitter: string;
  block_explorer: string;
}

export interface Arbitrum {
  name: string;
  symbol: string;
  technology: string;
  purpose: string;
  launch_date: string;
  website: string;
  twitter: string;
  block_explorer: string;
}

export interface Imx {
  name: string;
  symbol: string;
  technology: string;
  purpose: string;
  launch_date: string;
  website: string;
  twitter: string;
  block_explorer: string;
}

export interface ZksyncEra {
  name: string;
  symbol: string;
  technology: string;
  purpose: string;
  launch_date: string;
  website: string;
  twitter: string;
  block_explorer: string;
}

export interface Metrics {
  tvl: Tvl;
  txcount: Txcount;
  daa: Daa;
  stables_mcap: StablesMcap;
  fees: Fees;
  txcosts: Txcosts;
}

export interface Tvl {
  name: string;
  metric_keys: string[];
  units: string[];
  avg: boolean;
}

export interface Txcount {
  name: string;
  metric_keys: string[];
  units: string[];
  avg: boolean;
}

export interface Daa {
  name: string;
  metric_keys: string[];
  units: string[];
  avg: boolean;
}

export interface StablesMcap {
  name: string;
  metric_keys: string[];
  units: string[];
  avg: boolean;
}

export interface Fees {
  name: string;
  metric_keys: string[];
  units: string[];
  avg: boolean;
}

export interface Txcosts {
  name: string;
  metric_keys: string[];
  units: string[];
  avg: boolean;
}

export interface BlockspaceCategories {
  main_categories: MainCategories;
  sub_categories: SubCategories;
}

export interface MainCategories {
  native_transfers: string;
  token_transfers: string;
  nft_fi: string;
  defi: string;
  gaming: string;
  cefi: string;
  utility: string;
  cross_chain: string;
}

export interface SubCategories {
  native_transfer: string;
  stablecoin: string;
  lsd: string;
  erc20: string;
  erc721: string;
  erc1155: string;
  nft_marketplace: string;
  nft_fi: string;
  dex: string;
  derivative: string;
  lending: string;
  staking: string;
  gaming: string;
  gambling: string;
  ponzi: string;
  cex: string;
  trading: string;
  mev: string;
  privacy: string;
  identity: string;
  social_media: string;
  carbon_credits: string;
  depin: string;
  oracle: string;
  insurance: string;
  developer_tools: string;
  airdrop: string;
  payments: string;
  community: string;
  other: string;
  middleware: string;
  smart_contract_deployment: string;
  l2_rent: string;
  bridge: string;
  cc_communication: string;
}
