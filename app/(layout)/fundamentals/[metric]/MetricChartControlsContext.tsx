import { useMaster } from "@/contexts/MasterContext";
import { Get_SupportedChainKeys } from "@/lib/chains";
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
  selectedScale: string;
  setSelectedScale: (scale: string) => void;
  selectedChains: string[];
  setSelectedChains: (chains: string[]) => void;
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
  selectedScale: "absolute",
  setSelectedScale: () => { },
  selectedChains: [],
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
  type: string;
  is_embed?: boolean;
  embed_start_timestamp?: number;
  embed_end_timestamp?: number;
};

export const MetricChartControlsProvider = ({
  children,
  type,
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

  const { AllChains, SupportedChainKeys, data: master } = useMaster();
  const { metric_id } = useMetricData();

  const url = UrlsMap[type][metric_id];
  const storageKeys = {
    timespan: `${StorageKeyPrefixMap[type]}Timespan`,
    timeInterval: `${StorageKeyPrefixMap[type]}TimeInterval`,
    scale: `${StorageKeyPrefixMap[type]}Scale`,
    chains: `${StorageKeyPrefixMap[type]}Chains`,
    showEthereumMainnet: `${StorageKeyPrefixMap[type]}ShowEthereumMainnet`,
  }



  const {
    data,
    error,
    isLoading,
    isValidating,
  } = useSWR<MetricsResponse>(UrlsMap[type][metric_id]);

  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    storageKeys["timespan"],
    "365d",
  );

  const [selectedTimeInterval, setSelectedTimeInterval] = useSessionStorage(
    storageKeys["timeInterval"],
    "daily",
  );

  const [intervalShown, setIntervalShown] = useState<{
    min: number;
    max: number;
    num: number;
    label: string;
  } | null>(null);

  const [selectedScale, setSelectedScale] = useSessionStorage(
    storageKeys["scale"],
    "absolute",
  );

  const [selectedChains, setSelectedChains] = useSessionStorage(
    storageKeys["chains"],
    [...SupportedChainKeys, "ethereum"],
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
    if (showEthereumMainnet) {
      setSelectedChains([...selectedChains, "ethereum"]);
    } else {
      setSelectedChains(selectedChains.filter((chain) => chain !== "ethereum"));
    }
  }, [showEthereumMainnet]);

  return (
    <MetricChartControlsContext.Provider
      value={{
        selectedTimespan,
        setSelectedTimespan,
        selectedTimeInterval,
        setSelectedTimeInterval,
        selectedScale,
        setSelectedScale,
        selectedChains,
        setSelectedChains,
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