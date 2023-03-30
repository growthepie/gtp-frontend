import { useContext, createContext, useState, useEffect, useMemo } from "react";
import { APIResponseTypes } from "@/types/api";

import { DataSource } from "@/types/DataSource";
import _ from "lodash";

const USECORSPROXY = true;

const APIEndpoints: {
  [apiType: string]: { [endpoint: string]: string };
} = {
  master: {
    data: "https://d2cfnw27176mbd.cloudfront.net/v0_2/master.json",
  },
  chains: {
    Arbitrum: "https://d2cfnw27176mbd.cloudfront.net/v0_2/chains/arbitrum.json",
    Ethereum: "https://d2cfnw27176mbd.cloudfront.net/v0_2/chains/ethereum.json",
    Optimism: "https://d2cfnw27176mbd.cloudfront.net/v0_2/chains/optimism.json",
    Polygon: "https://d2cfnw27176mbd.cloudfront.net/v0_2/chains/polygon.json",
  },
  metrics: {
    DAA: "https://d2cfnw27176mbd.cloudfront.net/v0_2/metrics/daa.json",
    Fees: "https://d2cfnw27176mbd.cloudfront.net/v0_2/metrics/fees.json",
    StablecoinMarketCap:
      "https://d2cfnw27176mbd.cloudfront.net/v0_2/metrics/stablecoin_mcap.json",
    TVL: "https://d2cfnw27176mbd.cloudfront.net/v0_2/metrics/tvl.json",
    TxCount: "https://d2cfnw27176mbd.cloudfront.net/v0_2/metrics/txcount.json",
  },
};

type MetricsContextState =
  | { status: "loading" | "error" }
  | {
      status: "success";
      rootKeys: string[];
      data: any;
      dataSources: DataSource<APIResponseTypes>[];
    };

const MetricsContext = createContext<MetricsContextState | null>(null);

export const useMetricsData = (): MetricsContextState | null => {
  const contextState = useContext(MetricsContext);
  if (!contextState) {
    throw new Error("useMetricsData must be used within a MetricsProvider");
  }
  return contextState;
};

export const MetricsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<MetricsContextState>({
    status: "loading",
  });

  const rootKeys = useMemo(() => {
    if (state.status === "success") {
      return Object.values(state.dataSources).map(
        (dataSource) => dataSource.rootKey
      );
    }
    return [];
  }, [state]);

  const getUniqueRootKey = (camelCaseKey: string): string => {
    if (rootKeys.length > 0 && rootKeys.includes(camelCaseKey)) {
      // prepend the key with 'new' if it's already in the rootKeys array
      return getUniqueRootKey(`new${_.upperFirst(camelCaseKey)}`);
    }
    return camelCaseKey;
  };

  const getCamelCaseKeyFromUrl = (url: string) => {
    // if the url ends with a slash, remove it
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    // if the url is just a domain, return the domain as a valid camelCase key
    if (url.split("/").length === 2) {
      return _.camelCase(url.split("/")[1]);
    }
    // if the url is a path, return the last part of the path as a valid camelCase key
    return _.camelCase(url.split("/").pop());
  };

  useEffect(() => {
    const dataSources: DataSource<APIResponseTypes>[] = [];

    const endpointCount =
      _.size(APIEndpoints.chains) +
      _.size(APIEndpoints.metrics) +
      _.size(APIEndpoints.master);

    console.log("endpointCount", endpointCount);
    console.log("dataSources", dataSources);

    Object.keys(APIEndpoints).forEach((apiType) => {
      Object.keys(APIEndpoints[apiType]).forEach((endpoint) => {
        const url = USECORSPROXY
          ? `/api/cors?url=${encodeURI(APIEndpoints[apiType][endpoint])}`
          : APIEndpoints[apiType][endpoint];
        const startTime = performance.now();
        fetch(url)
          .then((res) => {
            if (res.ok) {
              return res.json();
            }
            return res.text().then((text) => {
              throw new Error(text);
            });
          })
          .then((data) => {
            const endTime = performance.now();
            dataSources.push({
              rootKey: getUniqueRootKey(
                getCamelCaseKeyFromUrl(`${apiType}.${endpoint}`)
              ),
              url: APIEndpoints[apiType][endpoint],
              useCorsProxy: true,
              error: null,
              data,
              responseTimeMS: endTime - startTime,
            });
            if (dataSources.length === endpointCount) {
              // create a new object with rootKeys as keys and dataSources.data as values
              const data = dataSources.reduce(
                (acc: { [key: string]: any }, dataSource) => {
                  acc[dataSource.rootKey] = dataSource.data;
                  return acc;
                },
                {}
              );

              const rootKeys = Object.values(dataSources).map(
                (dataSource) => dataSource.rootKey
              );

              setState({
                status: "success",
                dataSources: dataSources,
                data,
                rootKeys,
              });
            }
          })
          .catch((error) => {
            console.log(error);
            const endTime = performance.now();
            dataSources.push({
              rootKey: getUniqueRootKey(
                getCamelCaseKeyFromUrl(`${apiType}.${endpoint}`)
              ),
              url: APIEndpoints[apiType][endpoint],
              useCorsProxy: true,
              error: error.message,
              data: null,
              responseTimeMS: endTime - startTime,
            });
            if (dataSources.length === endpointCount) {
              // create a new object with rootKeys as keys and dataSources.data as values
              const data = dataSources.reduce(
                (acc: { [key: string]: any }, dataSource) => {
                  acc[dataSource.rootKey] = dataSource.data;
                  return acc;
                },
                {}
              );

              const rootKeys = Object.values(dataSources).map(
                (dataSource) => dataSource.rootKey
              );
              setState({
                status: "success",
                dataSources: dataSources,
                data,
                rootKeys,
              });
            }
          });
      });
    });

    // if (dataSources.length === 0) {
    //   setState({ status: "error" });
    // }
  }, []);

  return (
    <MetricsContext.Provider value={state}>{children}</MetricsContext.Provider>
  );
};
