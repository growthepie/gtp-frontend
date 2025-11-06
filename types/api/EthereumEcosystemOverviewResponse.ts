import { types } from "util";

export type EthereumEcosystemOverviewResponse = {
    data: {
        tps: Tps;
        count_layer2s: CountLayer2s;
        stables: Stables;
        app_fees: Gdp;
        meet_l2s: MeetL2s;
    };
}


export type MeetL2s = {
    [key: string]: {
        total_aa: number;
        yesterday_aa: number;
        stables_mcap_usd: number;
        stables_mcap_eth: number;
        tps: number;
        top_apps: string[];
    }
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

export type Gdp = {
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
        l2s_launched: Object[];
        values: number[][];
    }
}

export type L2sLaunched = {
    origin_key: string;
    l2beat_name: string;
}