export type TVLMetricsResponse = {
  data: {
    metric_id: string;
    metric_name: string;
    description: string;
    source: string[];
    chains: {
      ethereum: {
        chain_name: string;
        changes: {
          types: Array<string>;
          "1d": Array<number>;
          "7d": Array<number>;
          "30d": Array<number>;
          "90d": Array<number>;
          "180d": Array<number>;
          "365d": Array<number>;
        };
        daily: {
          types: Array<string>;
          data: Array<Array<number>>;
        };
      };
      arbitrum: {
        chain_name: string;
        changes: {
          types: Array<string>;
          "1d": Array<number>;
          "7d": Array<number>;
          "30d": Array<number>;
          "90d": Array<number>;
          "180d": Array<number>;
          "365d": Array<number>;
        };
        daily: {
          types: Array<string>;
          data: Array<Array<number>>;
        };
      };
      optimism: {
        chain_name: string;
        changes: {
          types: Array<string>;
          "1d": Array<number>;
          "7d": Array<number>;
          "30d": Array<number>;
          "90d": Array<number>;
          "180d": Array<number>;
          "365d": Array<number>;
        };
        daily: {
          types: Array<string>;
          data: Array<Array<number>>;
        };
      };
      polygon: {
        chain_name: string;
        changes: {
          types: Array<string>;
          "1d": Array<number>;
          "7d": Array<number>;
          "30d": Array<number>;
          "90d": Array<number>;
          "180d": Array<number>;
          "365d": Array<number>;
        };
        daily: {
          types: Array<string>;
          data: Array<Array<number>>;
        };
      };
    };
  };
};
