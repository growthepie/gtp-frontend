import { useMaster } from "@/contexts/MasterContext";
import { Get_SupportedChainKeys } from "@/lib/chains";
import { DAMetricsURLs, MetricsURLs } from "@/lib/urls";
import { ChainData, MetricsResponse } from "@/types/api/MetricsResponse";
import { intersection } from "lodash";
import { RefObject, createContext, useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useSessionStorage } from "usehooks-ts";

type Timespans = {
  [key: string]: {
    label: string;
    shortLabel: string;
    value: number;
    xMin: number;
    xMax: number;
  };
} | {};

// data={Object.keys(metricData.data.chains)
//   .filter((chain) => selectedChains.includes(chain))
//   .map((chain) => {
//     return {
//       name: chain,
//       // type: 'spline',
//       types: metricData.data.chains[chain][timeIntervalKey].types,
//       data: metricData.data.chains[chain][timeIntervalKey].data,
//     };
//   })}

type SeriesData = {
  name: string;
  types: string[];
  data: number[][];
};



type MetricDataContextType = {
  data: MetricsResponse | undefined;
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
  chainKeys: string[];
  timeIntervalKey: string;
  metric_id: string;
  avg: boolean;
  monthly_agg: string;
  sources: string[];
  timeIntervals: string[];
  showTimeIntervals: boolean;
  showSources: boolean;
  showAvg: boolean;
  showMonthlyAgg: boolean;
  showEthereumMainnetToggle: boolean;
  zoomed: boolean;
  setZoomed: (zoomed: boolean) => void;
  timespans: Timespans;
  chartComponent: RefObject<Highcharts.Chart> | undefined;
  setChartComponent: (chart: RefObject<Highcharts.Chart>) => void;
  intervalShown?: {
    min: number;
    max: number;
    num: number;
    label: string;
  } | null;
};

const MetricDataContext = createContext<MetricDataContextType>({
  data: undefined,
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
  chainKeys: [],
  timeIntervalKey: "",
  metric_id: "",
  avg: false,
  monthly_agg: "sum",
  sources: [],
  timeIntervals: [],
  showTimeIntervals: false,
  showSources: false,
  showAvg: false,
  showMonthlyAgg: false,
  showEthereumMainnetToggle: false,
  zoomed: false,
  setZoomed: () => { },
  timespans: {} as Timespans,
  chartComponent: undefined,
  setChartComponent: () => { },
  intervalShown: null,
});

type MetricDataProviderProps = {
  children: React.ReactNode;
  metric_id: string;
  metric_type: string;
};

const MetricDataProvider = ({ children, metric_id, metric_type }: MetricDataProviderProps) => {
  const UrlsMap = {
    fundamentals: MetricsURLs,
    "data-availability": DAMetricsURLs,
  };

  const { AllChains, EnabledChainsByKeys, data: master } = useMaster();

  const {
    data: metricData,
    error: metricError,
    isLoading: metricLoading,
    isValidating: metricValidating,
  } = useSWR<MetricsResponse>(UrlsMap[metric_type][metric_id]);


  const minDailyUnix = useMemo<number>(() => {
    if (!metricData) return 0;
    return Object.values(metricData.data.chains).reduce(
      (acc: number, chain: ChainData) => {
        if (!chain["daily"].data[0][0]) return acc;
        return Math.min(
          acc,
          chain["daily"].data[0][0],
        );
      }
      , Infinity) as number
  }, [metricData])

  const maxDailyUnix = useMemo<number>(() => {
    if (!metricData) return 0;
    return Object.values(metricData.data.chains).reduce(
      (acc: number, chain: ChainData) => {
        return Math.max(
          acc,
          chain["daily"].data[chain["daily"].data.length - 1][0],
        );
      }
      , 0) as number

  }, [metricData])



  const timespans = useMemo(() => {
    if (!metricData) return {};
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
  }, [metricData, maxDailyUnix, minDailyUnix]);


  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    "fundamentalsTimespan",
    "365d",
  );

  const [selectedTimeInterval, setSelectedTimeInterval] = useSessionStorage(
    "fundamentalsTimeInterval",
    "daily",
  );

  const [intervalShown, setIntervalShown] = useState<{
    min: number;
    max: number;
    num: number;
    label: string;
  } | null>(null);

  const [selectedScale, setSelectedScale] = useSessionStorage(
    "fundamentalsScale",
    "absolute",
  );

  const [selectedChains, setSelectedChains] = useSessionStorage(
    "fundamentalsChains",
    [...Object.keys(EnabledChainsByKeys), "ethereum"],
  );

  const [showEthereumMainnet, setShowEthereumMainnet] = useSessionStorage(
    "fundamentalsShowEthereumMainnet",
    false,
  );

  const [zoomed, setZoomed] = useState(false);

  const chainKeys = useMemo(() => {
    if (!metricData)
      return AllChains.filter((chain) =>
        Get_SupportedChainKeys(master).includes(chain.key),
      ).map((chain) => chain.key);

    return AllChains.filter(
      (chain) =>
        Object.keys(metricData.data.chains).includes(chain.key) &&
        Get_SupportedChainKeys(master).includes(chain.key),
    ).map((chain) => chain.key);
  }, [master, metricData]);

  const timeIntervalKey = useMemo(() => {
    if (
      metricData?.data.avg === true &&
      ["365d", "max"].includes(selectedTimespan)
    ) {
      return "daily_7d_rolling";
    }

    if (selectedTimeInterval === "monthly") {
      return "monthly";
    }

    return "daily";
  }, [metricData, selectedTimeInterval, selectedTimespan]);

  const [chartComponent, setChartComponent] = useState<RefObject<Highcharts.Chart>>();


  useEffect(() => {
    let currentURL = window.location.href;
    if (currentURL.includes("?is_og=true")) {
      setSelectedScale("stacked");
    }
  }, []);

  return (
    <MetricDataContext.Provider
      value={{
        data: metricData,
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
        chainKeys,
        timeIntervalKey,
        metric_id: metric_id,
        avg: metricData?.data.avg || false,
        monthly_agg: metricData?.data.monthly_agg || "sum",
        sources: metricData?.data.source || [],
        timeIntervals: metricData ? intersection(
          Object.keys(metricData.data.chains.arbitrum),
          ["daily", "weekly", "monthly"],
        ) : [],
        showTimeIntervals: true,
        showSources: true,
        showAvg: true,
        showMonthlyAgg: true,
        showEthereumMainnetToggle: true,
        zoomed: zoomed,
        setZoomed: setZoomed,
        timespans: timespans as Timespans,
        chartComponent: chartComponent,
        setChartComponent: setChartComponent,
        intervalShown: intervalShown,
      }}
    >
      {children}
    </MetricDataContext.Provider>
  );
}

const useMetricData = () => useContext(MetricDataContext);