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
  showRollingAverage: boolean;
  metric_type: "fundamentals" | "data-availability";
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
  showRollingAverage: true,
  metric_type: "fundamentals",
});

type MetricChartControlsProviderProps = {
  children: React.ReactNode;
  metric_type: "fundamentals" | "data-availability";
  is_embed?: boolean;
  embed_start_timestamp?: number;
  embed_end_timestamp?: number;
  selectedTimeInterval?: string;
  selectedTimespan?: string;
  showRollingAverage?: boolean;
  defaultScale?: string;
  setSelectedTimeInterval?: (timeInterval: string) => void;
};

export const MetricChartControlsProvider = ({
  children,
  metric_type,
  is_embed = false,
  embed_start_timestamp = undefined,
  embed_end_timestamp = undefined,
  selectedTimeInterval: providedSelectedTimeInterval,
  selectedTimespan: providedSelectedTimespan,
  showRollingAverage = true,
  setSelectedTimeInterval: providedSetSelectedTimeInterval,
  defaultScale: providedDefaultScale,
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
  const { metric_id, allChains, allChainsByKeys, log_default, chainKeys, data, timeIntervals } = useMetricData();

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

  // Use provided props if available, otherwise fall back to session storage
  const [internalSelectedTimeInterval, setInternalSelectedTimeInterval] = useSessionStorage(
    storageKeys["timeInterval"],
    "daily",
  );
  
  const selectedTimeInterval = providedSelectedTimeInterval ?? internalSelectedTimeInterval;
  const setSelectedTimeInterval = providedSetSelectedTimeInterval ?? setInternalSelectedTimeInterval;

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

  useEffect(() => {
    if (providedSelectedTimespan) {
      setSelectedTimespan(providedSelectedTimespan);
    }
    if (providedSelectedTimeInterval) {
      setInternalSelectedTimeInterval(providedSelectedTimeInterval);
    }
    if (providedDefaultScale) {
      // console.log("setting selected scale to", providedDefaultScale);
      setSelectedScale(providedDefaultScale);
    }
  }, []);

  // If the stored interval isn't supported by this metric (e.g. "hourly" carried
  // over from a different page), fall back to daily so the chart isn't empty.
  useEffect(() => {
    if (timeIntervals.length > 0 && !timeIntervals.includes(selectedTimeInterval)) {
      setSelectedTimeInterval("daily");
      setSelectedTimespan(selectedTimespansByTimeInterval?.["daily"] ?? "365d");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeIntervals]);

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

  // Keep selected chains deduplicated and constrained to chains available for this metric.
  useEffect(() => {
    if (chainKeys.length === 0) return;

    const normalized = Array.from(
      new Set(selectedChains.filter((chain) => chainKeys.includes(chain))),
    );

    if (normalized.length !== selectedChains.length) {
      setSelectedChains(normalized);
    }
  }, [chainKeys, selectedChains, setSelectedChains]);

  // When hourly is selected, keep only chains that actually have hourly datapoints.
  // This can intentionally result in no selected chains.
  useEffect(() => {
    if (!data || selectedTimeInterval !== "hourly") return;

    const hourlySelected = selectedChains.filter((chainKey) => {
      if (!chainKeys.includes(chainKey)) return false;
      const rows = data.chains[chainKey]?.hourly?.data;
      return Array.isArray(rows) && rows.length > 0;
    });

    if (hourlySelected.length !== selectedChains.length) {
      setSelectedChains(hourlySelected);
      setLastSelectedChains(hourlySelected);
    }
  }, [
    chainKeys,
    data,
    setLastSelectedChains,
    setSelectedChains,
    selectedChains,
    selectedTimeInterval,
  ]);


  const [showEthereumMainnet, setShowEthereumMainnet] = useSessionStorage(
    storageKeys["showEthereumMainnet"],
    false,
  );

  const [zoomed, setZoomed] = useState(false);
  const [zoomMin, setZoomMin] = useState<number | undefined>(is_embed === true && embed_start_timestamp ? embed_start_timestamp : undefined);
  const [zoomMax, setZoomMax] = useState<number | undefined>(is_embed === true && embed_start_timestamp ? embed_start_timestamp : undefined);

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
      data.avg === true && showRollingAverage &&
      ["365d", "max"].includes(selectedTimespan)
    ) {
      return "daily_7d_rolling";
    }

    if (selectedTimeInterval === "hourly") {
      return "hourly";
    }

    if (selectedTimeInterval === "weekly") {
      return "weekly";
    }

    if (selectedTimeInterval === "monthly") {
      return "monthly";
    }

    return "daily";
  }, [data, selectedTimeInterval, selectedTimespan, showRollingAverage]);

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
        showRollingAverage: showRollingAverage,
        metric_type: metric_type,
      }}
    >
      {children}
    </MetricChartControlsContext.Provider>
  );
}

export const useMetricChartControls = () => useContext(MetricChartControlsContext);
