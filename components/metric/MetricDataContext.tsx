import { DALayerWithKey, useMaster } from "@/contexts/MasterContext";
import { Chain } from "@/lib/chains";
import { DAMetricsURLs } from "@/lib/urls";
import { ChainData, MetricData, MetricsResponse } from "@/types/api/MetricsResponse";
import { intersection } from "lodash";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useChainMetrics } from "@/hooks/useChainMetrics";

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

  // Loading states
  isLoading: boolean;
  isValidating: boolean;
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
  setSelectedChainsInDataContext: () => {},
  isLoading: false,
  isValidating: false,
});

type MetricDataProviderProps = {
  children: React.ReactNode;
  metric: string;
  metric_type: "fundamentals" | "data-availability";
  selectedTimeInterval?: string;
};

export const MetricDataProvider = ({ children, metric, metric_type, selectedTimeInterval = "daily" }: MetricDataProviderProps) => {
  const [selectedChains, setSelectedChainsInDataContext] = useState<string[]>([]);

  const { SupportedChainKeys, AllChains, AllChainsByKeys, AllDALayers, AllDALayersByKeys, metrics, da_metrics, data: master } = useMaster();

  // Determine which chains to fetch based on metric type
  const chainsToFetch = useMemo(() => {
    if (metric_type === "fundamentals") {
      return AllChains.filter((chain) =>
        SupportedChainKeys.includes(chain.key),
      ).map((chain) => chain.key);
    }
    // For DA metrics, load all DA layers
    return AllDALayers.map((layer) => layer.key);
  }, [metric_type, AllChains, AllDALayers, SupportedChainKeys]);

  // For fundamentals: use the hook to leverage SWR cache (data fetched at page level)
  // For DA: fetch using old API
  const newApiData = useChainMetrics(metric, metric_type === "fundamentals" ? chainsToFetch : [], master!);
  const oldApiData = useSWR<MetricsResponse>(
    metric_type === "data-availability" ? DAMetricsURLs[metric] : null
  );

  // Use new API data for fundamentals, old API for DA
  const data = metric_type === "fundamentals" ? newApiData.data : oldApiData.data?.data;
  const error = metric_type === "fundamentals" ? newApiData.error : oldApiData.error;
  const isLoading = metric_type === "fundamentals" ? newApiData.isLoading : oldApiData.isLoading;
  const isValidating = metric_type === "fundamentals" ? newApiData.isValidating : oldApiData.isValidating;

  const chainKeys = useMemo(() => {
    if (metric_type === "fundamentals") {
      if (!data)
        return AllChains.filter((chain) =>
          SupportedChainKeys.includes(chain.key),
        ).map((chain) => chain.key);

      return AllChains.filter(
        (chain) =>
          Object.keys(data.chains).includes(chain.key) &&
          SupportedChainKeys.includes(chain.key)
      ).map((chain) => chain.key);
    }
    if (!data)
      return []

    return AllDALayers.filter(
      (chain) =>
        Object.keys(data.chains).includes(chain.key)
    ).map((chain) => chain.key);
  }, [metric_type, AllDALayers, data, AllChains, SupportedChainKeys]);



  const minDailyUnix = useMemo<number>(() => {
    if (!data) return 0;
    return Object.keys(data.chains)
      .filter((chainKey) => selectedChains.includes(chainKey))
      .map((chainKey) => data.chains[chainKey])
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
    return Object.keys(data.chains)
      .filter((chainKey) => selectedChains.includes(chainKey))
      .map((chainKey) => data.chains[chainKey])
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
      "12w": {
        label: "12 weeks",
        shortLabel: "12w",
        value: 12,
        xMin: maxMinusBuffer + 100000000 - 11 * 7 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "24w": {
        label: "24 weeks",
        shortLabel: "24w",
        value: 24,
        xMin: maxMinusBuffer + 100000000 - 23 * 7 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "52w": {
        label: "52 weeks",
        shortLabel: "52w",
        value: 52,
        xMin: maxMinusBuffer + 100000000 - 51 * 7 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "maxW": {
        label: "Max",
        shortLabel: "Max",
        value: 0,
        xMin: minMinusBuffer,
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

  const metric_id = data?.metric_id || "";

  const metricsDict = metric_type === "fundamentals" ? metrics : da_metrics;

  const log_default = metricsDict[metric_id]?.log_default || false;

  if (!data) return null;

  return (
    <MetricDataContext.Provider
      value={{
        data: data as MetricData | undefined,
        type: metric_type,
        metric_id: metric_id,
        metric: metric,
        avg: data?.avg || false,
        monthly_agg: data?.monthly_agg || "sum",
        log_default: log_default,
        chainKeys,
        sources: data?.source || [],
        timeIntervals: data ? intersection(
          Object.keys(Object.values(data.chains)[0]),
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
        isLoading,
        isValidating,
      }}
    >
      {children}
    </MetricDataContext.Provider>
  );
}

export const useMetricData = () => useContext(MetricDataContext);

// Hook to access only loading states
export const useMetricDataLoading = () => {
  const { isLoading, isValidating } = useContext(MetricDataContext);
  return { isLoading, isValidating };
};

// Hook to sync selectedChains from MetricChartControls to MetricData
// This should be called inside a component that has access to both contexts
export const useSyncSelectedChainsToDataContext = (selectedChains: string[]) => {
  const { setSelectedChainsInDataContext } = useMetricData();

  useEffect(() => {
    setSelectedChainsInDataContext(selectedChains);
  }, [selectedChains, setSelectedChainsInDataContext]);
};