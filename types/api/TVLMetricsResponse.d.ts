export interface TVLMetricsResponse {
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
	ethereum: ChainData;
	optimism: ChainData;
	arbitrum: ChainData;
	loopring: ChainData;
}
export interface ChainData {
	chain_name: string;
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
