export type DataSource<T> = {
	rootKey: string;
	url: string;
	data: T | null;
	useCorsProxy?: boolean;
	responseTimeMS: number;
	error: string | null;
};
