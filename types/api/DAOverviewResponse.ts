export interface DAOverviewResponse {
    data: {
        all_da: AllDAOverview;
        da_breakdown: DAOverviewBreakdown;
    }
}

export interface AllDAOverview {
    da_id: string;
    da_name: string;
    metrics: { [key: string]: DAMetrics };
    top_da_consumers: TopConsumerColumns;
}

export interface DAMetrics {
    metric_name: string;
    source: string[];
    avg: boolean;
    daily: Daily;
}

export interface Daily {
    data: DataRow[];
    types: string[];
}


export interface TopConsumerColumns {
    "1d": TopConsumerData;
    "7d": TopConsumerData;
    "30d": TopConsumerData;
    "90d": TopConsumerData;
    "180d": TopConsumerData;
    "365d": TopConsumerData;
    "max": TopConsumerData;
}

export interface TopConsumerData {
    types: string[];
    data: DataRow[];
}

export interface DAOverviewBreakdown {
    [key: string]: {
        "1d": DACategoryColumns;
        "7d": DACategoryColumns;
        "30d": DACategoryColumns;
        "90d": DACategoryColumns;
        "180d": DACategoryColumns;
        "365d": DACategoryColumns;
        "max": DACategoryColumns;
    }
}


export interface DACategoryColumns {
    fees: DACategoryData;
    size: DACategoryData;
    fees_per_mb: DACategoryData;
    da_consumers: {
        count: number;
        chains: {
            types: string[];
            values: string[];
        }
    }
    fixed_params: any;
    da_consumer_chart: DAConsumerChart
}

export interface DAConsumerChart {
        types: string[];
        data: DataRowConsumers[]; 
}

export interface DACategoryData {
    types: string[];
    total: number[];
}

export interface DACategoryData_Consumers {
    types: string[];
    total: [number, string[]]
}
export interface DACategoryData_fixed_params {
    block_time: string;
    blob_size: string;
    l2beat_risk: string;
}

type DataRow = [number, number, number] | [number, number, number, number, number];
type DataRowConsumers = [string, string, string, string, number];
