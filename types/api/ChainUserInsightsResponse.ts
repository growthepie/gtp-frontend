export interface UserInsightsResponse {
  data: AnalyticsData;
  last_updated_utc: string;
}

export interface AnalyticsData {
  new_user_contracts: Record<string, TimeframeData<ContractDataRow>>;
  cross_chain_addresses: Record<string, TimeframeData<CrossChainDataRow>>;
}

export type ContractDataRow = [
  address: string,
  contract_name: string,
  owner_project: string,
  sub_category_key: string,
  main_category_key: string,
  txcount: number,
  gas_fees_eth: number,
  gas_fees_usd: number
];

export interface TimeframeData<T> {
  types: string[];
  data: T[];
}

export type CrossChainDataRow = [
  cross_chain: string,
  current: number,
  previous: number,
  change: number,
  change_percent: number,
  share_of_users: number
];

