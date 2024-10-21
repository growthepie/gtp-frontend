import { useMaster } from "@/contexts/MasterContext";
import { Get_SupportedChainKeys } from "@/lib/chains";
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
  metric: string;
  metric_id: string;
  avg: boolean;
  monthly_agg: string;
  chainKeys: string[];
  sources: string[];
  timeIntervals: string[];
  timespans: Timespans;
  minDailyUnix: number;
  maxDailyUnix: number;
};

const MetricDataContext = createContext<MetricDataContextType>({
  data: undefined,
  metric: "",
  metric_id: "",
  avg: false,
  monthly_agg: "sum",
  chainKeys: [],
  sources: [],
  timeIntervals: [],
  timespans: {},
  minDailyUnix: 0,
  maxDailyUnix: 0,
});

type MetricDataProviderProps = {
  children: React.ReactNode;
  metric: string;
  type: string;
};

export const MetricDataProvider = ({ children, metric, type }: MetricDataProviderProps) => {
  const UrlsMap = {
    fundamentals: MetricsURLs,
    "data-availability": DAMetricsURLs,
  };

  const StorageKeyPrefixMap = {
    fundamentals: "fundamentals",
    "data-availability": "da",
  };

  const url = UrlsMap[type][metric];
  const storageKeys = {
    timespan: `${StorageKeyPrefixMap[type]}Timespan`,
    timeInterval: `${StorageKeyPrefixMap[type]}TimeInterval`,
    scale: `${StorageKeyPrefixMap[type]}Scale`,
    chains: `${StorageKeyPrefixMap[type]}Chains`,
    showEthereumMainnet: `${StorageKeyPrefixMap[type]}ShowEthereumMainnet`,
  }

  const { AllChains, SupportedChainKeys, data: master } = useMaster();

  const {
    data,
    error,
    isLoading,
    isValidating,
  } = useSWR<MetricsResponse>(UrlsMap[type][metric]);

  const chainKeys = useMemo(() => {
    if (!data)
      return AllChains.filter((chain) =>
        SupportedChainKeys.includes(chain.key),
      ).map((chain) => chain.key);

    return AllChains.filter(
      (chain) =>
        Object.keys(data.data.chains).includes(chain.key) &&
        SupportedChainKeys.includes(chain.key),
    ).map((chain) => chain.key);
  }, [data, AllChains, SupportedChainKeys]);


  const minDailyUnix = useMemo<number>(() => {
    if (!data) return 0;
    return Object.values(data.data.chains).reduce(
      (acc: number, chain: ChainData) => {
        if (!chain["daily"].data[0][0]) return acc;
        return Math.min(
          acc,
          chain["daily"].data[0][0],
        );
      }
      , Infinity) as number
  }, [data])

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
        label: "Maximum",
        shortLabel: "Max",
        value: 0,
        xMin: minMinusBuffer,

        xMax: maxPlusBuffer,
      },
      max: {
        label: "Maximum",
        shortLabel: "Max",
        value: 0,
        xMin: minMinusBuffer,

        xMax: maxPlusBuffer,
      },
    };
  }, [data, maxDailyUnix, minDailyUnix]);


  const seriesData = useMemo(() => {
    if (!data) return undefined;

    const chainData = chainKeys.map((chainKey) => {
      const chain = data.data.chains[chainKey];

      return {
        name: chainKey,
        types: chain[Object.keys(chain)[0]].types,
        data: chain[Object.keys(chain)[0]].data,
      };
    });

    return chainData[0];
  }, [data, chainKeys]);

  const metric_id = data?.data.metric_id || "";

  return (
    <MetricDataContext.Provider
      value={{
        data: data?.data || undefined,
        metric_id: metric_id,
        metric: metric,
        avg: data?.data.avg || false,
        monthly_agg: data?.data.monthly_agg || "sum",
        chainKeys,
        sources: data?.data.source || [],
        timeIntervals: data ? intersection(
          Object.keys(data.data.chains.arbitrum),
          ["daily", "weekly", "monthly"],
        ) : [],
        timespans: timespans,
        minDailyUnix,
        maxDailyUnix,
      }}
    >
      {children}
    </MetricDataContext.Provider>
  );
}

export const useMetricData = () => useContext(MetricDataContext);