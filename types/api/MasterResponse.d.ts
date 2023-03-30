export interface MasterResponse {
  data: Data;
}

export interface Data {
  metric_id: string;
  metric_name: string;
  description: string;
  unit: string;
  source: string;
  chains: Chains;
}

export interface Chains {
  ethereum: Ethereum;
  loopring: Loopring;
  arbitrum: Arbitrum;
  optimism: Optimism;
}

export interface Ethereum {
  chain_name: string;
  changes: Changes;
  daily: number[][];
}

export interface Changes {
  "1d": number;
  "7d": number;
  "30d": number;
  "90d": number;
  "180d": number;
  "365d": number;
}

export interface Loopring {
  chain_name: string;
  changes: Changes2;
  daily: number[][];
}

export interface Arbitrum {
  chain_name: string;
  changes: Changes3;
  daily: number[][];
}

export interface Optimism {
  chain_name: string;
  changes: Changes4;
  daily: number[][];
}
