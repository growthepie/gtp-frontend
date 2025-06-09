import { types } from "util";

export type EthAggResponse = {
    data: {
        tps: Tps;
        count_layer2s: CountLayer2s;
        stables: Stables;
    };
}

export type Stables = {
    layer_2s: {
        daily: {
            types: string[];
            values: number[][];
        }
    }
    ethereum_mainnet: {
        daily: {
            types: string[];
            values: number[][];
        }
    }
  
}

export type Tps = {
    layer_2s: {
        daily: {
            types: string[];
            values: number[][];
        }
    }
    ethereum_mainnet: {
        daily: {
            types: string[];
            values: number[][];
        }
    }
}

export type CountLayer2s = {
    daily: {
        types: string[];
        values: number[][];
    }
}