export interface DATimeseriesResponse {
    data: {
        da_layers: DALayer;
    }
}

export interface DALayer {
    [key: string]: DALayerData;
}

export interface DALayerData {
    da_consumers: DALayerChains;
}

export interface DALayerChains {
    [key: string]: DALayerChainData;
}

export interface DALayerChainData {
    daily: {
        types: string[];
        values: [string, string, string, number, number][];
    }
}