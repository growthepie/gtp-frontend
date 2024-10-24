import { useMaster } from "@/contexts/MasterContext";
import { Chain, Get_SupportedChainKeys } from "@/lib/chains";
import { DAMetricsURLs, MetricsURLs } from "@/lib/urls";
import { ChainData, MetricsResponse } from "@/types/api/MetricsResponse";
import { intersection } from "lodash";
import { RefObject, createContext, useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useSessionStorage } from "usehooks-ts";
import { useMetricData } from "./MetricDataContext";

const monthly_agg_labels = {
  avg: "Average",
  sum: "Total",
  unique: "Distinct",
  distinct: "Distinct",
};

type TopRowControlData = {
  monthlyAggLabel: string;

};

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

  const { SupportedChainKeys } = useMaster();
  const { metric_id, allChains, allChainsByKeys, log_default } = useMetricData();

  const url = UrlsMap[metric_type][metric_id];
  const storageKeys = {
    timespan: `${StorageKeyPrefixMap[metric_type]}Timespan`,
    timeInterval: `${StorageKeyPrefixMap[metric_type]}TimeInterval`,
    timespanByInterval: `${StorageKeyPrefixMap[metric_type]}TimespanByInterval`,
    scale: `${StorageKeyPrefixMap[metric_type]}Scale`,
    chains: `${StorageKeyPrefixMap[metric_type]}Chains`,
    lastChains: `${StorageKeyPrefixMap[metric_type]}LastChains`,
    showEthereumMainnet: `${StorageKeyPrefixMap[metric_type]}ShowEthereumMainnet`,
  }



  const {
    data,
    error,
    isLoading,
    isValidating,
  } = useSWR<MetricsResponse>(UrlsMap[metric_type][metric_id]);

  const [selectedTimespan, setSelectedTimespan] = useState(
    // storageKeys["timespan"],
    "365d",
  );

  const [selectedTimeInterval, setSelectedTimeInterval] = useState(
    // storageKeys["timeInterval"],
    "daily",
  );

  const [selectedTimespansByTimeInterval, setSelectedTimespansByTimeInterval] = useState(
    // storageKeys["timespanByInterval"], 
    {
      daily: "365d",
      monthly: "12m",
      [selectedTimeInterval]: selectedTimespan,
    }
  );

  const [intervalShown, setIntervalShown] = useState<{
    min: number;
    max: number;
    num: number;
    label: string;
  } | null>(null);

  const [selectedScale, setSelectedScale] = useState(
    // storageKeys["scale"],
    "absolute",
  );

  const [selectedYAxisScale, setSelectedYAxisScale] = useState(log_default ? "logarithmic" : "linear");

  const [selectedChains, setSelectedChains] = useSessionStorage(
    storageKeys["chains"],
    metric_type === "fundamentals" ? [...SupportedChainKeys.filter(chain => ["all_l2s", "multiple"].includes(chain))] : allChains.map((chain) => chain.key),
  );

  const [lastSelectedChains, setLastSelectedChains] = useState(
    // storageKeys["lastChains"],
    metric_type === "fundamentals" ? allChains.filter(
      (chain: Chain) =>
        (chain.ecosystem.includes("all-chains") &&
          ["arbitrum", "optimism", "base", "linea", "zksync_era"].includes(
            chain.key,
          )) ||
        chain.key === "ethereum",
    ).map((chain) => chain.key) : allChains.map((chain) => chain.key),
  );


  const [showEthereumMainnet, setShowEthereumMainnet] = useSessionStorage(
    storageKeys["showEthereumMainnet"],
    false,
  );

  const [zoomed, setZoomed] = useState(false);
  const [zoomMin, setZoomMin] = useState<number | undefined>(is_embed === true && embed_start_timestamp ? embed_start_timestamp : undefined);
  const [zoomMax, setZoomMax] = useState<number | undefined>(is_embed === true && embed_end_timestamp ? embed_end_timestamp : undefined);

  const timeIntervalKey = useMemo(() => {
    if (
      data?.data.avg === true &&
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
      setSelectedChains(selectedChains.filter((chain) => chain !== "ethereum"));
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
        selectedScale,
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
        avg: data?.data.avg || false,
        monthly_agg: data?.data.monthly_agg || "sum",
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
      }}
    >
      {children}
    </MetricChartControlsContext.Provider>
  );
}

export const useMetricChartControls = () => useContext(MetricChartControlsContext);