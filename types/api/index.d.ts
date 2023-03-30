import { ArbitrumChainResponse } from "./ArbitrumChainResponse";
import { OptimismChainResponse } from "./OptimismChainResponse";
import { TVLMetricsResponse } from "./TVLMetricsResponse";
import { TxCountMetricsResponse } from "./TxCountMetricsResponse";
import { MasterResponse } from "./MasterResponse";

export type APIResponseTypes =
  | MasterResponse
  | ArbitrumChainResponse
  | OptimismChainResponse
  | TVLMetricsResponse
  | TxCountMetricsResponse;
