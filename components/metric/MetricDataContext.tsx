import { DALayerWithKey, useMaster } from "@/contexts/MasterContext";
import { Chain } from "@/lib/chains";
import { MetricData } from "@/types/api/MetricsResponse";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useChainMetrics } from "@/hooks/useChainMetrics";

type Timespans = {
  [key: string]: {
    label: string;
    shortLabel: string;
    value: number;
    xMin: number;
    xMax: number;
  };
};

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

  lastUpdatedUtc: string | null;

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
  lastUpdatedUtc: null,
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
    // For DA metrics, the hook will use supported_chains from master
    return [];
  }, [metric_type, AllChains, SupportedChainKeys]);

  // Use unified hook for both fundamentals and DA metrics
  const { data, error, isLoading, isValidating } = useChainMetrics(
    metric, 
    chainsToFetch, 
    master!, 
    metric_type
  );

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

  const intervalBounds = useMemo(() => {
    if (!data) return {};

    const boundsByInterval: { [key: string]: { min: number; max: number } } = {};

    const allChainKeys = Object.keys(data.chains);
    const selectedAvailableKeys = allChainKeys.filter((chainKey) =>
      selectedChains.includes(chainKey),
    );

    const computeBounds = (interval: string, preferredChainKeys: string[]) => {
      const keysToScan = preferredChainKeys.length > 0 ? preferredChainKeys : allChainKeys;
      const series = keysToScan
        .map((chainKey) => data.chains[chainKey]?.[interval]?.data)
        .filter((rows): rows is number[][] => Array.isArray(rows) && rows.length > 0);

      if (series.length === 0) {
        return { min: 0, max: 0 };
      }

      const min = series.reduce((acc, rows) => Math.min(acc, rows[0][0]), Infinity);
      const max = series.reduce((acc, rows) => Math.max(acc, rows[rows.length - 1][0]), 0);

      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return { min: 0, max: 0 };
      }

      return { min, max };
    };

    const intervals = Array.from(
      new Set([
        ...data.timeIntervals,
        ...allChainKeys.flatMap((chainKey) => Object.keys(data.chains[chainKey] ?? {})),
      ]),
    );

    intervals.forEach((interval) => {
      const selectedWithData = selectedAvailableKeys.filter((chainKey) => {
        const rows = data.chains[chainKey]?.[interval]?.data;
        return Array.isArray(rows) && rows.length > 0;
      });
      boundsByInterval[interval] = computeBounds(interval, selectedWithData);
    });

    return boundsByInterval;
  }, [data, selectedChains]);


  const minDailyUnix = useMemo<number>(() => {
    if (!data) return 0;
    return intervalBounds[selectedTimeInterval]?.min ?? 0;
  }, [data, intervalBounds, selectedTimeInterval]);

  const maxDailyUnix = useMemo<number>(() => {
    if (!data) return 0;
    return intervalBounds[selectedTimeInterval]?.max ?? 0;
  }, [data, intervalBounds, selectedTimeInterval]);
  
  const timeIntervals = useMemo(() => {
    if (!data) return [];
    return data.timeIntervals.filter((interval) => {
      return Object.values(data.chains).some((chain) => {
        const rows = chain[interval]?.data;
        return Array.isArray(rows) && rows.length > 0;
      });
    });
  }, [data]);

  const minUnixByTimeInterval = useMemo(() => {
    if (!data) return {};
    const values: { [key: string]: number } = {}
    timeIntervals.forEach((interval) => {
      values[interval] = intervalBounds[interval]?.min ?? 0;
    });
    return values;
  }, [data, timeIntervals, intervalBounds]);

  const maxUnixByTimeInterval = useMemo(() => {
    if (!data) return {};
    const values: { [key: string]: number } = {}
    timeIntervals.forEach((interval) => {
      values[interval] = intervalBounds[interval]?.max ?? 0;
    });
    return values;
  }, [data, timeIntervals, intervalBounds]);

  const timespans = useMemo(() => {
    if (!data) return {};
    const [hourlybuffer, dailybuffer, weeklybuffer, monthlybuffer] = [0, 0, 0, 0];
    const minUnix = minUnixByTimeInterval[selectedTimeInterval];
    const maxUnix = maxUnixByTimeInterval[selectedTimeInterval];

    const ts = {
      "24h": {
        label: "24 hours",
        shortLabel: "24h",
        value: 24,
        xMin: maxUnix - 24 * 60 * 60 * 1000 - hourlybuffer,
        xMax: maxUnix + hourlybuffer,
      },
      "3d": {
        label: "3 days",
        shortLabel: "3d",
        value: 3,
        xMin: maxUnix - 3 * 24 * 60 * 60 * 1000 - hourlybuffer,
        xMax: maxUnix + hourlybuffer,
      },
      "7d": {
        label: "7 days",
        shortLabel: "7d",
        value: 7,
        xMin: maxUnix - 7 * 24 * 60 * 60 * 1000 - hourlybuffer,
        xMax: maxUnix + hourlybuffer,
      },
      "30d": {
        label: "30 days",
        shortLabel: "30d",
        value: 30,
        xMin: maxUnix - 30 * 24 * 60 * 60 * 1000 - hourlybuffer,
        xMax: maxUnix + hourlybuffer,
      },
      "maxH": {
        label: "Max",
        shortLabel: "Max",
        value: 0,
        xMin: minUnix - hourlybuffer,
        xMax: maxUnix + hourlybuffer,
      },
      "90d": {
        label: "90 days",
        shortLabel: "90d",
        value: 90,
        xMin: maxUnix - 90 * 24 * 60 * 60 * 1000 - dailybuffer,
        xMax: maxUnix + dailybuffer,
      },
      "180d": {
        label: "180 days",
        shortLabel: "180d",
        value: 180,
        xMin: maxUnix - 180 * 24 * 60 * 60 * 1000 - dailybuffer,
        xMax: maxUnix + dailybuffer,
      },
      "365d": {
        label: "1 year",
        shortLabel: "365d",
        value: 365,
        xMin: maxUnix - 365 * 24 * 60 * 60 * 1000 - dailybuffer,
        xMax: maxUnix + dailybuffer,
      },
      "12w": {
        label: "3 months",
        shortLabel: "3m",
        value: 12,
        xMin: maxUnix - 12 * 7 * 24 * 60 * 60 * 1000 - weeklybuffer,
        xMax: maxUnix + weeklybuffer,
      },
      "24w": {
        label: "6 months",
        shortLabel: "6m",
        value: 24,
        xMin: maxUnix - 24 * 7 * 24 * 60 * 60 * 1000 - weeklybuffer,
        xMax: maxUnix + weeklybuffer,
      },
      "52w": {
        label: "1 year",
        shortLabel: "1y",
        value: 52,
        xMin: maxUnix - 52 * 7 * 24 * 60 * 60 * 1000 - weeklybuffer,
        xMax: maxUnix + weeklybuffer,
      },
      "maxW": {
        label: "Max",
        shortLabel: "Max",
        value: 0,
        xMin: minUnix - dailybuffer,
        xMax: maxUnix + dailybuffer,
      },
      "6m": {
        label: "6 months",
        shortLabel: "6m",
        value: 6,
        xMin: maxUnix - 6 * 30 * 24 * 60 * 60 * 1000 - monthlybuffer,
        xMax: maxUnix + monthlybuffer,
      },
      "12m": {
        label: "1 year",
        shortLabel: "1y",
        value: 12,
        xMin: maxUnix - 12 * 30 * 24 * 60 * 60 * 1000 - monthlybuffer,
        xMax: maxUnix + monthlybuffer,
      },
      maxM: {
        label: "Max",
        shortLabel: "Max",
        value: 0,
        xMin: minUnix - dailybuffer,
        xMax: maxUnix + dailybuffer,
      },
      max: {
        label: "Max",
        shortLabel: "Max",
        value: 0,
        xMin: minUnix - dailybuffer,
        xMax: maxUnix + dailybuffer,
      },
    };

    return ts;

  }, [data, minUnixByTimeInterval, maxUnixByTimeInterval, selectedTimeInterval]);

  const metric_id = data?.metric_id || "";

  const metricsDict = metric_type === "fundamentals" ? metrics : da_metrics;

  const log_default = metricsDict[metric_id]?.log_default || false;


  // if (!data) return <div>Loading...</div>;

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
        timeIntervals: timeIntervals,
        timespans: timespans,
        minDailyUnix,
        maxDailyUnix,
        selectedTimeInterval,
        allChains: metric_type === "fundamentals" ? AllChains : AllDALayers,
        allChainsByKeys: metric_type === "fundamentals" ? AllChainsByKeys : AllDALayersByKeys,
        selectedChains,
        setSelectedChainsInDataContext,
        lastUpdatedUtc: data?.last_updated_utc ?? null,
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
