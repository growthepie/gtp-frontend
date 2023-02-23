export interface OptimismChainResponse {
	data: Data;
}
export interface Data {
	chain_id: string;
	chain_name: string;
	description: string;
	symbol: string;
	website: string;
	explorer: string;
	metrics: Metrics;
}
export interface Metrics {
	tvl: MetricsData;
	market_cap_usd: MetricsData;
	txcount: MetricsData;
	daa: MetricsData;
}
export interface MetricsData {
	metric_name: string;
	unit: string;
	source: string;
	changes: Changes;
	daily?: (number[] | null)[] | null;
}
export interface Changes {
	'1d': number;
	'7d': number;
	'30d': number;
	'90d': number;
	'180d': number;
	'365d': number;
}
