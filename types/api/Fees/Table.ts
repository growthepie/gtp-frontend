export interface FeesTableResponse {
  chain_data: { [key: string]: ChainDatum };
}

export interface ChainDatum {
  hourly: Hourly;
}

export interface Hourly {
  txcosts_avg: CostsBody;
  txcosts_native_median: CostsBody;
  txcosts_median: CostsBody;
  txcosts_swap: CostsBody;
  tps?: TPSBody;
}

export interface CostsBody {
  types: [CostType, CostType, CostType, CostType];
  data: [number, number, number, number][];
}

export interface TPSBody {
  types: [TPSType, TPSType, TPSType];
  data: [number, number, number][];
}

export enum CostType {
  Normalized = "normalized",
  Unix = "unix",
  ValueEth = "value_eth",
  ValueUsd = "value_usd",
}

export enum TPSType {
  Normalized = "normalized",
  Unix = "unix",
  Value = "value",
}
