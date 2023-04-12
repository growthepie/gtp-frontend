export interface MasterResponse {
  current_version: string
  chains: Chains
  metrics: Metrics
}

export interface Chains {
  ethereum: Ethereum
  polygon_zkevm: PolygonZkevm
  optimism: Optimism
  arbitrum: Arbitrum
  imx: Imx
}

export interface Ethereum {
  name: string
  symbol: string
  rollup: string
  launch_date: string
  website: string
  twitter: string
  block_explorer: string
}

export interface PolygonZkevm {
  name: string
  symbol: string
  rollup: string
  launch_date: string
  website: string
  twitter: string
  block_explorer: string
}

export interface Optimism {
  name: string
  symbol: string
  rollup: string
  launch_date: string
  website: string
  twitter: string
  block_explorer: string
}

export interface Arbitrum {
  name: string
  symbol: string
  rollup: string
  launch_date: string
  website: string
  twitter: string
  block_explorer: string
}

export interface Imx {
  name: string
  symbol: string
  rollup: string
  launch_date: string
  website: string
  twitter: string
  block_explorer: string
}

export interface Metrics {
  tvl: Tvl
  txcount: Txcount
  daa: Daa
  stables_mcap: StablesMcap
  fees: Fees
}

export interface Tvl {
  name: string
  metric_keys: string[]
  units: string[]
  source: string
}

export interface Txcount {
  name: string
  metric_keys: string[]
  units: string[]
  source: string
}

export interface Daa {
  name: string
  metric_keys: string[]
  units: string[]
  source: string
}

export interface StablesMcap {
  name: string
  metric_keys: string[]
  units: string[]
  source: string
}

export interface Fees {
  name: string
  metric_keys: string[]
  units: string[]
  source: string
}
