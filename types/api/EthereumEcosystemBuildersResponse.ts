export interface EthereumEcosystemBuildersResponse {
  data: Data
  last_updated_utc: string
}

export interface Data {
  ecosystem: Ecosystem
}

export interface Ecosystem {
  active_apps: {
    count: number;
  }
  apps: {
    types: string[];
    data: [][];
  }
}