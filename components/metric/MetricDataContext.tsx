import { DALayerWithKey, useMaster } from "@/contexts/MasterContext";
import { Chain, Get_SupportedChainKeys } from "@/lib/chains";
import { DAMetricsURLs, MetricsURLs } from "@/lib/urls";
import { ChainData, MetricData, MetricsResponse } from "@/types/api/MetricsResponse";
import { intersection } from "lodash";
import { RefObject, createContext, useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useSessionStorage } from "usehooks-ts";

type SeriesData = {
  name: string;
  types: string[];
  data: number[][];
};

type Timespans = {
  [key: string]: {
    label: string;
    shortLabel: string;
    value: number;
    xMin: number;
    xMax: number;
  };
} | {};

type MetricDataContextType = {
  data: MetricData | undefined;
  type: "fundamentals" | "data-availability";
  metric: string;
  metric_id: string;
  avg: boolean;
  log_default: boolean;
  monthly_agg: string;
  chainKeys: string[];
  sources: string[];
  timeIntervals: string[];
  // Remove timespans and minDailyUnix from here
  maxDailyUnix: number;

  allChains: Chain[] | DALayerWithKey[];
  allChainsByKeys: { [key: string]: Chain } | { [key: string]: DALayerWithKey };
};

const MetricDataContext = createContext<MetricDataContextType>({
  data: undefined,
  type: "fundamentals",
  metric: "",
  metric_id: "",
  avg: false,
  log_default: false,
  monthly_agg: "sum",
  chainKeys: [],
  sources: [],
  timeIntervals: [],
  // Remove these two lines:
  // timespans: {},
  // minDailyUnix: 0,
  maxDailyUnix: 0,
  allChains: [],
  allChainsByKeys: {}
});

type MetricDataProviderProps = {
  children: React.ReactNode;
  metric: string;
  metric_type: "fundamentals" | "data-availability";
};

export const MetricDataProvider = ({ children, metric, metric_type }: MetricDataProviderProps) => {
  const UrlsMap = {
    fundamentals: MetricsURLs,
    "data-availability": DAMetricsURLs,
  };

  const StorageKeyPrefixMap = {
    fundamentals: "fundamentals",
    "data-availability": "da",
  };

  const url = UrlsMap[metric_type][metric];
  const storageKeys = {
    timespan: `${StorageKeyPrefixMap[metric_type]}Timespan`,
    timeInterval: `${StorageKeyPrefixMap[metric_type]}TimeInterval`,
    scale: `${StorageKeyPrefixMap[metric_type]}Scale`,
    chains: `${StorageKeyPrefixMap[metric_type]}Chains`,
    showEthereumMainnet: `${StorageKeyPrefixMap[metric_type]}ShowEthereumMainnet`,
  }

  const { data: master, SupportedChainKeys, AllChains, AllChainsByKeys, AllDALayers, AllDALayersByKeys, metrics, da_metrics } = useMaster();

  const {
    data,
    error,
    isLoading,
    isValidating,
  } = useSWR<MetricsResponse>(UrlsMap[metric_type][metric]);

  const chainKeys = useMemo(() => {
   
    if (metric_type === "fundamentals") {
      if (!data)
        return AllChains.filter((chain) =>
          SupportedChainKeys.includes(chain.key),
        ).map((chain) => chain.key);

      return AllChains.filter(
        (chain) =>
          Object.keys(data.data.chains).includes(chain.key) &&
          SupportedChainKeys.includes(chain.key)
      ).map((chain) => chain.key);
    }
    if (!data)
      return []

    return AllDALayers.filter(
      (chain) =>
        Object.keys(data.data.chains).includes(chain.key)
    ).map((chain) => chain.key);
  }, [metric_type, AllDALayers, data, AllChains, SupportedChainKeys]);


  const maxDailyUnix = useMemo<number>(() => {
    if (!data) return 0;
    return Object.values(data.data.chains).reduce(
      (acc: number, chain: ChainData) => {
        return Math.max(
          acc,
          chain["daily"].data[chain["daily"].data.length - 1][0],
        );
      }
      , 0) as number
  }, [data])

  const metric_id = data?.data.metric_id || "";

  const metricsDict = metric_type === "fundamentals" ? metrics : da_metrics;

  const log_default = metricsDict[metric_id]?.log_default || false;

  if (!data) return null;

  return (
    <MetricDataContext.Provider
      value={{
        data: data?.data || undefined,
        type: metric_type,
        metric_id: metric_id,
        metric: metric,
        avg: data?.data.avg || false,
        monthly_agg: data?.data.monthly_agg || "sum",
        log_default: log_default,
        chainKeys,
        sources: data?.data.source || [],
        timeIntervals: data ? intersection(
          Object.keys(Object.values(data.data.chains)[0]),
          ["daily", "weekly", "monthly"],
        ) : [],
        // Remove timespans, minDailyUnix from here
        maxDailyUnix,
        allChains: metric_type === "fundamentals" ? AllChains : AllDALayers,
        allChainsByKeys: metric_type === "fundamentals" ? AllChainsByKeys : AllDALayersByKeys,
      }}
    >
      {children}
    </MetricDataContext.Provider>
  );
}

export const useMetricData = () => useContext(MetricDataContext);