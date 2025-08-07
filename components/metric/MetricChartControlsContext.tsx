import { useMaster } from "@/contexts/MasterContext";
import { Chain, Get_SupportedChainKeys } from "@/lib/chains";
import { DAMetricsURLs, MetricsURLs } from "@/lib/urls";
import { ChainData, MetricsResponse } from "@/types/api/MetricsResponse";
import { intersection } from "lodash";
import { RefObject, createContext, useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useSessionStorage } from "usehooks-ts";
import { useMetricData } from "./MetricDataContext";
import { time } from "console";

const monthly_agg_labels = {
  avg: "Average",
  sum: "Total",
  unique: "Distinct",
  distinct: "Distinct",
};

type TopRowControlData = {
  monthlyAggLabel: string;

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

type MetricChartControlsContextType = {
  selectedTimespan: string;
  setSelectedTimespan: (timespan: string) => void;
  selectedTimeInterval: string;
  setSelectedTimeInterval: (timeInterval: string) => void;
  selectedTimespansByTimeInterval: { [key: string]: string };
  setSelectedTimespansByTimeInterval: (timespans: { [key: string]: string }) => void;
  selectedScale: string;
  setSelectedScale: (scale: string) => void;
  selectedYAxisScale: string;
  setSelectedYAxisScale: (scale: string) => void;
  selectedChains: string[];
  setSelectedChains: (chains: string[]) => void;
  lastSelectedChains: string[];
  setLastSelectedChains: (chains: string[]) => void;
  showEthereumMainnet: boolean;
  setShowEthereumMainnet: (show: boolean) => void;

  timeIntervalKey: string;
  metric_id: string;
  avg: boolean;
  monthly_agg: string;
  showTimeIntervals: boolean;
  showSources: boolean;
  showAvg: boolean;
  showMonthlyAgg: boolean;
  showEthereumMainnetToggle: boolean;

  zoomed: boolean;
  setZoomed: (zoomed: boolean) => void;
  zoomMin?: number;
  setZoomMin: (min: number) => void;
  zoomMax?: number;
  setZoomMax: (max: number) => void

  intervalShown?: {
    min: number;
    max: number;
    num: number;
    label: string;
  } | null;

  chartComponent: RefObject<Highcharts.Chart> | undefined;
  setChartComponent: (chart: RefObject<Highcharts.Chart>) => void;
  setIntervalShown: (interval: { min: number; max: number; num: number; label: string } | null) => void;

  minDailyUnix: number;
  timespans: Timespans;
};

const MetricChartControlsContext = createContext<MetricChartControlsContextType>({
  selectedTimespan: "365d",
  setSelectedTimespan: () => { },
  selectedTimeInterval: "daily",
  setSelectedTimeInterval: () => { },
  selectedTimespansByTimeInterval: {},
  setSelectedTimespansByTimeInterval: () => { },
  selectedScale: "absolute",
  setSelectedScale: () => { },
  selectedYAxisScale: "linear",
  setSelectedYAxisScale: () => { },
  selectedChains: [],
  lastSelectedChains: [],
  setLastSelectedChains: () => { },
  setSelectedChains: () => { },
  showEthereumMainnet: false,
  setShowEthereumMainnet: () => { },
  timeIntervalKey: "",
  metric_id: "",
  avg: false,
  monthly_agg: "sum",
  showTimeIntervals: false,
  showSources: false,
  showAvg: false,
  showMonthlyAgg: false,
  showEthereumMainnetToggle: false,
  zoomed: false,
  setZoomed: () => { },
  zoomMin: undefined,
  setZoomMin: () => { },
  zoomMax: undefined,
  setZoomMax: () => { },
  chartComponent: undefined,
  setChartComponent: () => { },
  intervalShown: null,
  setIntervalShown: () => { },
  minDailyUnix: 0,
  timespans: {},
});

type MetricChartControlsProviderProps = {
  children: React.ReactNode;
  metric_type: "fundamentals" | "data-availability";
  is_embed?: boolean;
  embed_start_timestamp?: number;
  embed_end_timestamp?: number;
};

export const MetricChartControlsProvider = ({
  children,
  metric_type,
  is_embed = false,
  embed_start_timestamp = undefined,
  embed_end_timestamp = undefined,

}: MetricChartControlsProviderProps) => {
  const UrlsMap = {
    fundamentals: MetricsURLs,
    "data-availability": DAMetricsURLs,
  };

  const StorageKeyPrefixMap = {
    fundamentals: "fundamentals",
    "data-availability": "da",
  };

  const { SupportedChainKeys, DefaultChainSelection } = useMaster();
  const { metric_id, allChains, allChainsByKeys, log_default, chainKeys, data, maxDailyUnix } = useMetricData();

  const url = UrlsMap[metric_type][metric_id];
  const storageKeys = {
    timespan: `${StorageKeyPrefixMap[metric_type]}Timespan`,
    timeInterval: `${StorageKeyPrefixMap[metric_type]}TimeInterval`,
    timespanByInterval: `${StorageKeyPrefixMap[metric_type]}TimespanByInterval`,
    intervalShown: `${StorageKeyPrefixMap[metric_type]}IntervalShown`,
    scale: `${StorageKeyPrefixMap[metric_type]}Scale`,
    chains: `${StorageKeyPrefixMap[metric_type]}Chains`,
    lastChains: `${StorageKeyPrefixMap[metric_type]}LastChains`,
    showEthereumMainnet: `${StorageKeyPrefixMap[metric_type]}ShowEthereumMainnet`,
  }


  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    storageKeys["timespan"],
    "365d",
  );

  const [selectedTimeInterval, setSelectedTimeInterval] = useSessionStorage(
    storageKeys["timeInterval"],
    "daily",
  );

  const [selectedTimespansByTimeInterval, setSelectedTimespansByTimeInterval] = useSessionStorage(
    storageKeys["timespanByInterval"],
    {
      daily: "365d",
      monthly: "12m",
      [selectedTimeInterval]: selectedTimespan,
    }
  );

  const [intervalShown, setIntervalShown] = useSessionStorage<{
    min: number;
    max: number;
    num: number;
    label: string;
  } | null>(
    `${StorageKeyPrefixMap[metric_type]}IntervalShown`,
    null,
  );

  const [selectedScale, setSelectedScale] = useSessionStorage(
    storageKeys["scale"],
    "absolute",
  );

  const [selectedYAxisScale, setSelectedYAxisScale] = useState(log_default ? "logarithmic" : "linear");

  const [selectedChains, setSelectedChains] = useSessionStorage(
    storageKeys["chains"],
    metric_type === "fundamentals" ? DefaultChainSelection.filter((chain) => chainKeys.includes(chain)) : allChains.map((chain) => chain.key)
  );

  const [lastSelectedChains, setLastSelectedChains] = useSessionStorage(
    storageKeys["lastChains"],
    metric_type === "fundamentals" ? allChains.filter(
      (chain: Chain) =>
        (chain.ecosystem.includes("all-chains") &&
          ["arbitrum", "optimism", "base", "linea", "zksync_era"].includes(
            chain.key,
          ))
    ).map((chain) => chain.key) : allChains.map((chain) => chain.key),
  );


  const [showEthereumMainnet, setShowEthereumMainnet] = useSessionStorage(
    storageKeys["showEthereumMainnet"],
    false,
  );

  const [zoomed, setZoomed] = useState(false);
  const [zoomMin, setZoomMin] = useState<number | undefined>(is_embed === true && embed_start_timestamp ? embed_start_timestamp : undefined);
  const [zoomMax, setZoomMax] = useState<number | undefined>(is_embed === true && embed_start_timestamp ? embed_start_timestamp : undefined);

  // Add Xmin calculation based on selected chains
  const minDailyUnix = useMemo<number>(() => {
    if (!data || !selectedChains || selectedChains.length === 0) return 0;
    
    return selectedChains.reduce((acc: number, chainKey: string) => {
      const chain = data.chains[chainKey];
      if (!chain?.["daily"]?.data?.[0]?.[0]) return acc;
      return Math.min(acc, chain["daily"].data[0][0]);
    }, Infinity);
  }, [data, selectedChains]);

  // Add timespans calculation
  const timespans = useMemo(() => {
    if (!data || !maxDailyUnix) return {};
    
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

  // const timeIntervalKey = useMemo(() => {
  //   if (
  //     data?.data.avg === true &&
  //     ["365d", "max"].includes(selectedTimespan)
  //   ) {
  //     return "daily_7d_rolling";
  //   }

  //   if (selectedTimeInterval === "monthly") {
  //     return "monthly";
  //   }

  //   return "daily";
  // }, [data, selectedTimeInterval, selectedTimespan]);

  const timeIntervalKey = useMemo(() => {
    if (!data) return "daily";

    if (
      data.avg === true &&
      ["365d", "max"].includes(selectedTimespan)
    ) {
      return "daily_7d_rolling";
    }

    if (selectedTimeInterval === "monthly") {
      return "monthly";
    }

    return "daily";
  }, [data, selectedTimeInterval, selectedTimespan]);

  const [chartComponent, setChartComponent] = useState<RefObject<Highcharts.Chart>>();


  useEffect(() => {
    let currentURL = window.location.href;
    if (currentURL.includes("?is_og=true")) {
      setSelectedScale("stacked");
    }
  }, []);

  // add or remove ethereum from selected chains based on showEthereumMainnet
  useEffect(() => {

    if (metric_type === "data-availability")
      return;

    if (showEthereumMainnet) {
      setSelectedChains([...selectedChains, "ethereum"]);
    } else {
      setSelectedChains(selectedChains);
    }
  }, [metric_type, showEthereumMainnet]);

  return (
    <MetricChartControlsContext.Provider
      value={{
        selectedTimespan,
        setSelectedTimespan,
        selectedTimeInterval,
        setSelectedTimeInterval,
        selectedTimespansByTimeInterval,
        //@ts-ignore
        setSelectedTimespansByTimeInterval,
        selectedScale: metric_id === "txcosts" ? "absolute" : selectedScale,
        setSelectedScale,
        selectedYAxisScale: selectedYAxisScale,
        setSelectedYAxisScale: setSelectedYAxisScale,
        selectedChains,
        setSelectedChains,
        lastSelectedChains,
        setLastSelectedChains,
        showEthereumMainnet,
        setShowEthereumMainnet,
        timeIntervalKey,
        metric_id: metric_id,
        avg: data?.avg || false,
        monthly_agg: data?.monthly_agg || "sum",
        showTimeIntervals: true,
        showSources: true,
        showAvg: true,
        showMonthlyAgg: true,
        showEthereumMainnetToggle: true,
        zoomed: zoomed,
        setZoomed: setZoomed,
        zoomMin: zoomMin,
        setZoomMin: setZoomMin,
        zoomMax: zoomMax,
        setZoomMax: setZoomMax,
        chartComponent: chartComponent,
        setChartComponent: setChartComponent,
        intervalShown: intervalShown,
        setIntervalShown: setIntervalShown,
        minDailyUnix,
        timespans,
      }}
    >
      {children}
    </MetricChartControlsContext.Provider>
  );
}

export const useMetricChartControls = () => useContext(MetricChartControlsContext);