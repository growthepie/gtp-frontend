import { ArbitrumChainResponse } from './ArbitrumChainResponse';
import { OptimismChainResponse } from './OptimismChainResponse';
import { TVLMetricsResponse } from './TVLMetricsResponse';
import { TxCountMetricsResponse } from './TxCountMetricsResponse';

export type APIResponseTypes =
	| ArbitrumChainResponse
	| OptimismChainResponse
	| TVLMetricsResponse
	| TxCountMetricsResponse;
