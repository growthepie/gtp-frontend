export interface FeesLineChart {
  chain_data: { [key: string]: ChainDatum };
}

export interface ChainDatum {
  txcosts_avg:           { [key: string]: Txcosts };
  txcosts_native_median: { [key: string]: Txcosts };
  txcosts_median:        { [key: string]: Txcosts };
  txcosts_swap:          { [key: string]: Txcosts };
}

export interface Txcosts {
  types:       Type[];
  granularity: Granularity;
  data:        Array<number[]>;
}

export enum Granularity {
  Daily = "daily",
  Hourly = "hourly",
  The10_Min = "10_min",
  The4_Hours = "4_hours",
}

export enum Type {
  Unix = "unix",
  ValueEth = "value_eth",
  ValueUsd = "value_usd",
}