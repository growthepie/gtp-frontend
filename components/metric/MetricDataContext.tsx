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
  timespans: Timespans;
  minDailyUnix: number;
  maxDailyUnix: number;
  selectedTimeInterval: string;

  allChains: Chain[] | DALayerWithKey[];
  allChainsByKeys: { [key: string]: Chain } | { [key: string]: DALayerWithKey };
  selectedChains: string[];
  setSelectedChainsInDataContext: (chains: string[]) => void;
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
  timespans: {},
  minDailyUnix: 0,
  maxDailyUnix: 0,
  selectedTimeInterval: "daily",
  allChains: [],
  allChainsByKeys: {},
  selectedChains: [],
  setSelectedChainsInDataContext: () => {}
});

type MetricDataProviderProps = {
  children: React.ReactNode;
  metric: string;
  metric_type: "fundamentals" | "data-availability";
  selectedTimeInterval?: string;
};

export const MetricDataProvider = ({ children, metric, metric_type, selectedTimeInterval = "daily" }: MetricDataProviderProps) => {
  const [selectedChains, setSelectedChainsInDataContext] = useState<string[]>([]);
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



  const minDailyUnix = useMemo<number>(() => {
    if (!data) return 0;
    return Object.keys(data.data.chains)
      .filter((chainKey) => selectedChains.includes(chainKey))
      .map((chainKey) => data.data.chains[chainKey])
      .reduce(
        (acc: number, chain: ChainData) => {
          if (!chain[selectedTimeInterval].data[0][0]) return acc;
          return Math.min(
            acc,
            chain[selectedTimeInterval].data[0][0],
          );
        }
        , Infinity) as number
  }, [data, selectedChains, selectedTimeInterval])

  const maxDailyUnix = useMemo<number>(() => {
    if (!data) return 0;
    return Object.keys(data.data.chains)
      .filter((chainKey) => selectedChains.includes(chainKey))
      .map((chainKey) => data.data.chains[chainKey])
      .reduce(
        (acc: number, chain: ChainData) => {
          return Math.max(
            acc,
            chain[selectedTimeInterval].data[chain[selectedTimeInterval].data.length - 1][0],
          );
        }
        , 0) as number

  }, [data, selectedChains, selectedTimeInterval])




  const timespans = useMemo(() => {
    if (!data) return {};
    const buffer = 1 * 24 * 60 * 60 * 1000 * 2;
    const maxMinusBuffer = new Date(maxDailyUnix).valueOf() - buffer;
    const maxPlusBuffer = new Date(maxDailyUnix).valueOf() + buffer;
    const minMinusBuffer = new Date(minDailyUnix).valueOf() - buffer;

    // calculate how many days are 6 months ago from the max date
    const sixMonthsAgo = new Date(maxDailyUnix);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoPlusBuffer = sixMonthsAgo.valueOf() - buffer;

    return {
      "90d": {
        label: "90 days",
        shortLabel: "90d",
        value: 90,
        xMin: maxMinusBuffer - 90 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "180d": {
        label: "180 days",
        shortLabel: "180d",
        value: 180,
        xMin: maxMinusBuffer - 180 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "365d": {
        label: "1 year",
        shortLabel: "365d",
        value: 365,
        xMin: maxMinusBuffer - 365 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "6m": {
        label: "6 months",
        shortLabel: "6M",
        value: 6,
        xMin: sixMonthsAgoPlusBuffer,
        xMax: maxPlusBuffer,
      },
      "12m": {
        label: "1 year",
        shortLabel: "1Y",
        value: 12,
        xMin: maxMinusBuffer - 365 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      maxM: {
        label: "Max",
        shortLabel: "Max",
        value: 0,
        xMin: minMinusBuffer,

        xMax: maxPlusBuffer,
      },
      max: {
        label: "Max",
        shortLabel: "Max",
        value: 0,
        xMin: minMinusBuffer,

        xMax: maxPlusBuffer,
      },
    };
  }, [data, maxDailyUnix, minDailyUnix]);

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
        timespans: timespans,
        minDailyUnix,
        maxDailyUnix,
        selectedTimeInterval,
        allChains: metric_type === "fundamentals" ? AllChains : AllDALayers,
        allChainsByKeys: metric_type === "fundamentals" ? AllChainsByKeys : AllDALayersByKeys,
        selectedChains,
        setSelectedChainsInDataContext,
      }}
    >
      {children}
    </MetricDataContext.Provider>
  );
}

export const useMetricData = () => useContext(MetricDataContext);

// Hook to sync selectedChains from MetricChartControls to MetricData
// This should be called inside a component that has access to both contexts
export const useSyncSelectedChainsToDataContext = (selectedChains: string[]) => {
  const { setSelectedChainsInDataContext } = useMetricData();
  
  useEffect(() => {
    setSelectedChainsInDataContext(selectedChains);
  }, [selectedChains, setSelectedChainsInDataContext]);
};