"use client";

import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsPatternFill from "highcharts/modules/pattern-fill";
import Share from "@/components/Share";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  useLocalStorage,
  useWindowSize,
  useIsMounted,
  useMediaQuery,
} from "usehooks-ts";
import fullScreen from "highcharts/modules/full-screen";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import d3 from "d3";
import Link from "next/link";
import {
  Get_AllChainsNavigationItems,
  Get_SupportedChainKeys,
} from "@/lib/chains";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import { navigationItems } from "@/lib/navigation";
import { useUIContext, useHighchartsWrappers } from "@/contexts/UIContext";
import { ChainsBaseURL, MasterURL, getChainMetricURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import useSWR, { preload } from "swr";
import ChartWatermark from "@/components/layout/ChartWatermark";
import { ChainsData, MetricData, Changes, IntervalData } from "@/types/api/ChainResponse";
import ChainSectionHead from "@/components/layout/SingleChains/ChainSectionHead";
import {
  TopRowContainer,
  TopRowChild,
  TopRowParent,
} from "@/components/layout/TopRow";
import "@/app/highcharts.axis.css";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/layout/Tooltip";
import { useSWRConfig } from "swr";
import { useMaster } from "@/contexts/MasterContext";
import {
  metricItems,
  getFundamentalsByKey,
  metricCategories,
} from "@/lib/metrics";
import { ChainMetricResponse, MetricDetails } from "@/types/api/ChainMetricResponse";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Heading from "@/components/layout/Heading";
import moment from "moment";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const transformMetricDetails = (details: MetricDetails): MetricData => {
  return {
    metric_name: details.metric_name,
    unit: "", // unit might be missing or needs to be derived
    source: [], // source missing in new API
    changes: details.changes.daily as unknown as Changes, // mismatch in Changes type?
    daily: {
      types: details.timeseries.daily.types,
      data: details.timeseries.daily.data as [number, number][]
    },
    weekly: details.timeseries.weekly ? {
      types: details.timeseries.weekly.types,
      data: details.timeseries.weekly.data as [number, number][]
    } : undefined,
    monthly: details.timeseries.monthly ? {
      types: details.timeseries.monthly.types,
      data: details.timeseries.monthly.data as [number, number][]
    } : undefined,
    quarterly: details.timeseries.quarterly ? {
      types: details.timeseries.quarterly.types,
      data: details.timeseries.quarterly.data as [number, number][]
    } : undefined,
    avg: false // default
  };
};

export default function ChainChart({
  chainData,
  master,
  chain,
  defaultChainKey,
}: {
  chainData: ChainsData;
  master: MasterResponse;
  chain: string;
  defaultChainKey: string;
}) {
  // Keep track of the mounted state
  const isMounted = useIsMounted();

  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");
  const { AllChains, AllChainsByKeys } = useMaster();
  const [data, setData] = useState<ChainsData[]>([chainData]);

  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chainKey, setChainKey] = useState<string[]>([defaultChainKey]);

  useHighchartsWrappers();

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", "M", "B", "T", "P", "E"],
      },
    });
    highchartsAnnotations(Highcharts);
    highchartsPatternFill(Highcharts);
    fullScreen(Highcharts);
  }, []);

  const { theme } = useTheme();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [selectedTimespan, setSelectedTimespan] = useState("180d");
  const [selectedScale, setSelectedScale] = useState("log");
  const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");
  const [showEthereumMainnet, setShowEthereumMainnet] = useState(false);
  const [compareTo, setCompareTo] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomMin, setZoomMin] = useState<number | null>(null);
  const [zoomMax, setZoomMax] = useState<number | null>(null);
  const dayMs = 24 * 60 * 60 * 1000;

  const { isSidebarOpen } = useUIContext();
  const { width, height } = useWindowSize();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const zoomedMargin = [49, 15, 0, 0];
  const defaultMargin = [49, 15, 0, 0];

  const CompChains = useMemo(() => {
    if (!master) return [];

    const chainItemsByKey = Get_AllChainsNavigationItems(master)
      .options.filter((option) => option.hide !== true)
      .filter(
        (option) =>
          option.key && Get_SupportedChainKeys(master).includes(option.key),
      )
      .reduce((acc, option) => {
        if (option.key) acc[option.key] = option;
        return acc;
      }, {});

    // group master.chains by bucket
    const chainsByBucket = Object.entries(master.chains).reduce(
      (acc, [key, chainInfo]) => {
        if (!acc[chainInfo.bucket]) {
          acc[chainInfo.bucket] = [];
        }

        if (chainItemsByKey[key] && key !== chainKey[0])
          acc[chainInfo.bucket].push(chainItemsByKey[key]);

        return acc;
      },
      {},
    );

    // sort each bucket in alphabetical order
    Object.keys(chainsByBucket).forEach((bucket) => {
      chainsByBucket[bucket].sort((a, b) => a.label.localeCompare(b.label));
    });

    return Object.keys(chainsByBucket).reduce((acc: any[], bucket: string) => {
      acc.push(...chainsByBucket[bucket]);
      return acc;
    }, []);
  }, [master, chainKey]);

  const { cache, mutate } = useSWRConfig();

  const enabledFundamentalsKeys = useMemo<string[]>(() => {
    return metricItems.map((item) => item.key ?? "");
  }, []);

  // Determine which intervals are available in the data
  const availableIntervals = useMemo(() => {
    const intervals: string[] = [];

    if (data.length === 0 || !data[0].metrics) return ["daily"];

    // Check first metric to see which intervals exist
    const firstMetricKey = Object.keys(data[0].metrics)[0];
    if (!firstMetricKey) return ["daily"];

    const firstMetric = data[0].metrics[firstMetricKey];

    if (firstMetric.daily) intervals.push("daily");
    if (firstMetric.weekly) intervals.push("weekly");
    if (firstMetric.monthly) intervals.push("monthly");
    // Note: quarterly is intentionally disabled for chains/fundamentals page

    return intervals.length > 0 ? intervals : ["daily"];
  }, [data]);

  // Ensure selectedTimeInterval is valid
  useEffect(() => {
    if (!availableIntervals.includes(selectedTimeInterval)) {
      setSelectedTimeInterval(availableIntervals[0] || "daily");
    }
  }, [availableIntervals, selectedTimeInterval]);

  const fetchChainData = useCallback(async () => {
    if (chainKey.length === 0) {
      return;
    }

    try {
      const fetchPromises = chainKey.map(async (key) => {
        // Get supported metrics for this chain from master.json
        const supportedMetrics = master.chains[key]?.supported_metrics || [];
        
        // Filter to only fetch metrics that are both enabled and supported by this chain
        const metricsToFetch = enabledFundamentalsKeys.filter((mKey) => 
          supportedMetrics.includes(mKey)
        );
        
        // Fetch all supported metrics for the chain in parallel
        const metricPromises = metricsToFetch.map(async (mKey) => {
          // Find the URL key for this metric key
          const metricItem = metricItems.find((item) => item.key === mKey);
          if (!metricItem) return { key: mKey, data: null };
          
          const url = getChainMetricURL(key, metricItem.urlKey);

          // SWR cache check
          const cachedData = cache.get(url);
          if (cachedData) return { key: mKey, data: cachedData.data };

          const response = await fetch(url);
          if (!response.ok) return { key: mKey, data: null };
          const responseData = await response.json();
          mutate(url, responseData, false);
          return { key: mKey, data: responseData };
        });

        const metricsResults = await Promise.all(metricPromises);
        
        const metrics: { [key: string]: MetricData } = {};
        metricsResults.forEach((res) => {
          if (res.data && res.data.details) {
            metrics[res.key] = transformMetricDetails(res.data.details);
          }
        });

        return {
          chain_id: key,
          chain_name: master.chains[key].name,
          metrics: metrics,
          // Mock other required fields for ChainsData
          description: "",
          symbol: "",
          website: "",
          explorer: "",
          ranking: {},
          hottest_contract: { data: [], types: [] }
        } as ChainsData;
      });

      const responseData = await Promise.all(fetchPromises);

      setData(responseData);
      setError(null);
    } catch (error) {
      setData([]);
      setError(error);
    } finally {
      setValidating(false);
      setLoading(false);
    }
  }, [chainKey, cache, mutate, enabledFundamentalsKeys, master]);

  useEffect(() => {
    if (data.length === 0) {
      setLoading(true);
      setValidating(true);
    }
    fetchChainData();
  }, [data.length, chainKey, fetchChainData]);

  // Combined computation to avoid multiple data iterations
  const derivedDataMetrics = useMemo(() => {
    const now = Date.now();
    const timestampSet = new Set<number>();
    let minUnix = Infinity;
    let maxUnix = -Infinity;
    const prefixMap: { [key: string]: string } = {};

    // Single pass through all data
    data.forEach((item) => {
      Object.keys(item.metrics).forEach((key) => {
        const metricData = item.metrics[key];
        const intervalData = metricData[selectedTimeInterval as keyof typeof metricData] as IntervalData;

        if (intervalData && intervalData.data && intervalData.data.length > 0) {
          // For timespans (skip daa)
          if (key !== "daa") {
            intervalData.data.forEach((d) => timestampSet.add(d[0]));
            // Track min/max
            const firstTs = intervalData.data[0][0];
            const lastTs = intervalData.data[intervalData.data.length - 1][0];
            if (firstTs < minUnix) minUnix = firstTs;
            if (lastTs > maxUnix) maxUnix = lastTs;
          }

          // For prefixes
          if (intervalData.types) {
            const types = intervalData.types;
            if (types.length > 2) {
              if (showUsd && types.includes("usd")) prefixMap[key] = "$";
              else prefixMap[key] = "Ξ";
            } else {
              prefixMap[key] = "";
            }
          }
        }
      });
    });

    // Normalize min/max
    if (minUnix === Infinity) minUnix = now - 180 * dayMs;
    if (maxUnix === -Infinity) maxUnix = now;

    const timestamps = Array.from(timestampSet);
    const clampMin = (windowMs: number) => Math.max(minUnix, maxUnix - windowMs);
    const dayDiff = Math.max(1, Math.round((maxUnix - minUnix) / dayMs));

    // Build timespans based on interval
    let timespansResult: any;

    if (selectedTimeInterval === "weekly") {
      timespansResult = {
        "12w": { label: "12 weeks", shortLabel: "12w", value: 12, xMin: clampMin(12 * 7 * dayMs), xMax: maxUnix, daysDiff: Math.round((maxUnix - clampMin(12 * 7 * dayMs)) / dayMs) },
        "24w": { label: "24 weeks", shortLabel: "24w", value: 24, xMin: clampMin(24 * 7 * dayMs), xMax: maxUnix, daysDiff: Math.round((maxUnix - clampMin(24 * 7 * dayMs)) / dayMs) },
        "52w": { label: "52 weeks", shortLabel: "52w", value: 52, xMin: clampMin(52 * 7 * dayMs), xMax: maxUnix, daysDiff: Math.round((maxUnix - clampMin(52 * 7 * dayMs)) / dayMs) },
        maxW: { label: "Max", shortLabel: "Max", value: 0, xMin: minUnix, xMax: maxUnix, daysDiff: dayDiff },
      };
    } else if (selectedTimeInterval === "monthly") {
      const monthMs = 30 * dayMs;
      timespansResult = {
        "6m": { label: "6 months", shortLabel: "6m", value: 6, xMin: clampMin(6 * monthMs), xMax: maxUnix, daysDiff: Math.round((maxUnix - clampMin(6 * monthMs)) / dayMs) },
        "12m": { label: "1 year", shortLabel: "12m", value: 12, xMin: clampMin(12 * monthMs), xMax: maxUnix, daysDiff: Math.round((maxUnix - clampMin(12 * monthMs)) / dayMs) },
        maxM: { label: "Max", shortLabel: "Max", value: 0, xMin: minUnix, xMax: maxUnix, daysDiff: dayDiff },
      };
    } else if (selectedTimeInterval === "quarterly") {
      const sorted = [...timestamps].sort((a, b) => a - b);
      const windowFromQuarters = (count: number) => {
        if (!sorted.length) return { xMin: maxUnix - count * 90 * dayMs, xMax: maxUnix, daysDiff: count * 90 };
        const startIndex = Math.max(0, sorted.length - count);
        const start = sorted[startIndex];
        const end = sorted[sorted.length - 1];
        return { xMin: start, xMax: end, daysDiff: Math.max(1, Math.round((end - start) / dayMs)) };
      };
      timespansResult = {
        "4q": { label: "4 quarters", shortLabel: "4q", value: 4, ...windowFromQuarters(4) },
        "8q": { label: "8 quarters", shortLabel: "8q", value: 8, ...windowFromQuarters(8) },
        maxQ: { label: "Max", shortLabel: "Max", value: 0, xMin: minUnix, xMax: maxUnix, daysDiff: dayDiff },
      };
    } else {
      timespansResult = {
        "90d": { label: "90 days", shortLabel: "90d", value: 90, xMin: clampMin(90 * dayMs), xMax: maxUnix, daysDiff: 90 },
        "180d": { label: "180 days", shortLabel: "180d", value: 180, xMin: clampMin(180 * dayMs), xMax: maxUnix, daysDiff: 180 },
        "365d": { label: "1 year", shortLabel: "365d", value: 365, xMin: clampMin(365 * dayMs), xMax: maxUnix, daysDiff: 365 },
        max: { label: "Max", shortLabel: "Max", value: 0, xMin: minUnix, xMax: maxUnix, daysDiff: dayDiff },
      };
    }

    return {
      timespans: timespansResult,
      minUnixAll: minUnix,
      maxUnixAll: maxUnix,
      prefixes: prefixMap,
    };
  }, [data, selectedTimeInterval, showUsd, dayMs]);

  // Extract individual values for backwards compatibility
  const timespans = derivedDataMetrics.timespans;
  const minUnixAll = derivedDataMetrics.minUnixAll;
  const maxUnixAll = derivedDataMetrics.maxUnixAll;
  const prefixes = derivedDataMetrics.prefixes;

  const activeTimespan = useMemo(() => {
    const keys = Object.keys(timespans);
    if (!keys.length) return null;
    return timespans[selectedTimespan] ?? timespans[keys[0]];
  }, [timespans, selectedTimespan]);

  const timespanMap = useMemo(
    () => ({
      daily: ["90d", "180d", "365d", "max"],
      weekly: ["12w", "24w", "52w", "maxW"],
      monthly: ["6m", "12m", "maxM"],
      quarterly: ["4q", "8q", "maxQ"],
    }),
    [],
  );

  const prevIntervalRef = useRef(selectedTimeInterval);

  // Synchronize timespan when interval changes - use layout effect to batch with render
  useEffect(() => {
    const prevInterval = prevIntervalRef.current;
    if (prevInterval === selectedTimeInterval) return;

    const prevList = timespanMap[prevInterval] || [];
    const newList = timespanMap[selectedTimeInterval] || [];
    const prevIndex = prevList.indexOf(selectedTimespan);

    let nextTimespan =
      (prevIndex >= 0 && newList[prevIndex]) || newList[0] || selectedTimespan;

    // Use requestAnimationFrame to batch this update with other state changes
    requestAnimationFrame(() => {
      if (nextTimespan && timespans[nextTimespan]) {
        if (nextTimespan !== selectedTimespan) setSelectedTimespan(nextTimespan);
      } else {
        const availableKeys = Object.keys(timespans);
        if (availableKeys.length && !availableKeys.includes(selectedTimespan)) {
          setSelectedTimespan(availableKeys[0]);
        }
      }
    });

    prevIntervalRef.current = selectedTimeInterval;
  }, [selectedTimeInterval, selectedTimespan, timespanMap, timespans, setSelectedTimespan]);

  function hexToRgba(hex, alpha) {
    const hexWithoutHash = hex.replace("#", "");
    const r = parseInt(hexWithoutHash.substring(0, 2), 16);
    const g = parseInt(hexWithoutHash.substring(2, 4), 16);
    const b = parseInt(hexWithoutHash.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function getDate(unix) {
    const date = new Date(unix);
    const formattedDate = date.toLocaleString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const dateParts = formattedDate.split(",");
    const [month, day, year] = dateParts[0].split(" ");
    const formattedDateStr = `${day} ${month} ${date.getFullYear()}`;
    return formattedDateStr;
  }

  const chartComponents = useRef<Highcharts.Chart[]>([]);

  const showGwei = useCallback((metric_id: string) => {
    const item = navigationItems[1].options.find(
      (item) => item.key === metric_id,
    );

    return item?.page?.showGwei;
  }, []);

  const formatNumber = useCallback(
    (key: string, value: number | string, isAxis = false) => {
      const units = Object.keys(master.metrics[key].units);
      const unitKey =
        units.find((unit) => unit !== "usd" && unit !== "eth") ||
        (showUsd ? "usd" : "eth");
      const prefix = master.metrics[key].units[unitKey].prefix
        ? master.metrics[key].units[unitKey].prefix
        : "";
      let suffix = master.metrics[key].units[unitKey].suffix
        ? master.metrics[key].units[unitKey].suffix
        : "";

      if (showGwei(key) && !showUsd) {
        suffix = " Gwei";
      }
    
      let val = parseFloat(value as string);

      let number = d3.format(`.2~s`)(val).replace(/G/, "B");

      if (isAxis) {
        if (selectedScale === "percentage") {
          number = d3.format(".2~s")(val).replace(/G/, "B") + "%";
        } else {
          if (showGwei(key) && showUsd) {
            // for small USD amounts, show 2 decimals
            if (val < 1) number = prefix + val.toFixed(2) + " " + suffix;
            else if (val < 10)
              number =
                prefix + d3.format(".3s")(val).replace(/G/, "B") + " " + suffix;
            else if (val < 100)
              number =
                prefix + d3.format(".4s")(val).replace(/G/, "B") + " " + suffix;
            else
              number =
                prefix + d3.format(".2s")(val).replace(/G/, "B") + " " + suffix;
          } else {
            if(val < 1 && val > -1){
              number = prefix + val.toFixed(2) + " " + suffix;
            }else{
              number = prefix + d3.format(".2s")(val).replace(/G/, "B") + " " + suffix;
            }

          }
        }
      }

      return number;
    },
    [selectedScale, showGwei, showUsd, master],
  );

  const getTickPositions = useCallback(
    (xMin: any, xMax: any): number[] => {
      const tickPositions: number[] = [];
      const xMinDate = new Date(xMin);
      const xMaxDate = new Date(xMax);
      const xMinMonth = xMinDate.getUTCMonth();
      const xMaxMonth = xMaxDate.getUTCMonth();

      const xMinYear = xMinDate.getUTCFullYear();
      const xMaxYear = xMaxDate.getUTCFullYear();

      tickPositions.push(xMinDate.getTime());
      tickPositions.push(xMaxDate.getTime());

      return tickPositions;

      if (selectedTimespan === "max") {
        for (let year = xMinYear; year <= xMaxYear; year++) {
          for (let month = 0; month < 12; month = month + 4) {
            if (year === xMinYear && month < xMinMonth) continue;
            if (year === xMaxYear && month > xMaxMonth) continue;
            tickPositions.push(new Date(year, month, 1).getTime());
          }
        }
        return tickPositions;
      }

      for (let year = xMinYear; year <= xMaxYear; year++) {
        for (let month = 0; month < 12; month++) {
          if (year === xMinYear && month < xMinMonth) continue;
          if (year === xMaxYear && month > xMaxMonth) continue;
          tickPositions.push(new Date(year, month, 1).getTime());
        }
      }

      return tickPositions;
    },
    [selectedTimespan],
  );

  const [intervalShown, setIntervalShown] = useState<{
    min: number;
    max: number;
    num: number;
    label: string;
  } | null>(null);

  const onXAxisSetExtremes =
    useCallback<Highcharts.AxisSetExtremesEventCallbackFunction>(
      function (e: Highcharts.AxisSetExtremesEventObject) {
        const { min, max } = e;

        // set to nearest day at 08:00 UTC
        let minDay = new Date(min);
        let maxDay = new Date(max);

        let minHours = minDay.getUTCHours();
        let maxHours = maxDay.getUTCHours();

        minDay.setUTCHours(0, 0, 0, 0);

        if (maxHours > 12) {
          maxDay.setDate(maxDay.getDate() + 1);
          maxDay.setUTCHours(0, 0, 0, 0);
        } else {
          maxDay.setUTCHours(0, 0, 0, 0);
        }

        let minStartOfDay = minDay.getTime();
        let maxStartOfDay = maxDay.getTime();

        let numMilliseconds = maxStartOfDay - minStartOfDay;

        let paddingMilliseconds = 0;
        if (e.trigger === "zoom" || e.trigger === "pan") {
          if (minStartOfDay < minUnixAll) minStartOfDay = minUnixAll;

          if (maxStartOfDay > maxUnixAll) maxStartOfDay = maxUnixAll;

          numMilliseconds = maxStartOfDay - minStartOfDay;

          setZoomed(true);
          setZoomMin(minStartOfDay);
          setZoomMax(maxStartOfDay);
          chartComponents.current.forEach((chart) => {
            if (chart) {
              const xAxis = chart.xAxis[0];
              const pixelsPerMillisecond = chart.plotWidth / numMilliseconds;

              // 15px padding on left side
              paddingMilliseconds = 15 / pixelsPerMillisecond;

              xAxis.setExtremes(
                minStartOfDay - paddingMilliseconds,
                maxStartOfDay,
              );
            }
          });
        }

        const numDays = numMilliseconds / (24 * 60 * 60 * 1000);

        setIntervalShown({
          min: minStartOfDay,
          max: maxStartOfDay,
          num: numDays,
          label: `${Math.round(numDays)} day${numDays > 1 ? "s" : ""}`,
        });
      },
      [maxUnixAll, minUnixAll],
    );

  const displayValues = useMemo(() => {
    const p: {
      [key: string]: {
        value: string;
        prefix: string;
        suffix: string;
      };
    }[] = [];

    data.forEach((item, chainIndex) => {
      Object.keys(item.metrics).forEach((key) => {
        const units = Object.keys(master.metrics[key].units);
        const unitKey =
          units.find((unit) => unit !== "usd" && unit !== "eth") ||
          (showUsd ? "usd" : "eth");

        let prefix =
          showGwei(key) && !showUsd
            ? ""
            : master.metrics[key].units[unitKey].prefix;
        let suffix =
          showGwei(key) && !showUsd
            ? "Gwei"
            : master.metrics[key].units[unitKey].suffix;
        let valueIndex = showUsd ? 1 : 2;
        let valueMultiplier = showGwei(key) && !showUsd ? 1000000000 : 1;

        let valueFormat = Intl.NumberFormat("en-GB", {
          notation: "compact",
          maximumFractionDigits:
            key === "txcosts" && showUsd
              ? master.metrics[key].units[unitKey].decimals
              : 2,
          minimumFractionDigits:
            key === "txcosts" && showUsd
              ? master.metrics[key].units[unitKey].decimals
              : 2,
        });

        let navItem = navigationItems[1].options.find((ni) => ni.key === key);

        const metricData = item.metrics[key];
        const intervalData = metricData[selectedTimeInterval as keyof typeof metricData] as IntervalData;

        if (!intervalData || !intervalData.data) return;

        let dateIndex = intervalData.data.length - 1;

        const latestUnix =
          intervalData.data[intervalData.data.length - 1];

        if (intervalShown) {
          const intervalMaxIndex = intervalData.data.findIndex(
            (d) => d[0] >= intervalShown?.max,
          );
          if (intervalMaxIndex !== -1) dateIndex = intervalMaxIndex;
        }

        if (!intervalData.data[dateIndex]) return;

        let value = valueFormat.format(
          intervalData.data[dateIndex][
          master.metrics[key].units[unitKey].currency ? valueIndex : 1
          ] * valueMultiplier,
        );

        if (p.length < chainIndex + 1) p[chainIndex] = {};

        p[chainIndex][key] = {
          value,
          prefix: prefix || "",
          suffix: suffix || "",
        };
      });
    });
    return p;
  }, [data, master, showUsd, intervalShown, selectedTimeInterval, showGwei]);

  const formatTooltipDate = useCallback(
    (date: Date) => {
      switch (selectedTimeInterval) {
        case "weekly":
          {
            const start = new Date(date);
            const end = new Date(date);
            end.setUTCDate(start.getUTCDate() + 6);

            const sameMonth = start.getUTCMonth() === end.getUTCMonth();
            const sameYear = start.getUTCFullYear() === end.getUTCFullYear();

            const startStr = start.toLocaleDateString("en-GB", {
              timeZone: "UTC",
              month: "short",
              day: "numeric",
              year: sameYear ? undefined : "numeric",
            });
            const endStr = end.toLocaleDateString("en-GB", {
              timeZone: "UTC",
              month: "short",
              day: "numeric",
              year: sameYear ? undefined : "numeric",
            });

            const yearStr = sameYear ? `, ${start.getUTCFullYear()}` : "";
            return `${startStr} - ${endStr}${yearStr}`;
          }
        case "monthly":
          return date.toLocaleDateString("en-GB", {
            timeZone: "UTC",
            month: "short",
            year: "numeric",
          });
        case "quarterly": {
          const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
          return `Q${quarter} ${date.getUTCFullYear()}`;
        }
        default:
          return date.toLocaleDateString("en-GB", {
            timeZone: "UTC",
            month: "short",
            day: "numeric",
            year: "numeric",
          });
      }
    },
    [selectedTimeInterval],
  );

  const tooltipFormatter = useCallback(
    function (this: Highcharts.TooltipFormatterContextObject) {
      if (!master) return;
      const { x, points } = this;
      if (!points || !x) return;

      const date = new Date(x);
      const dateString = formatTooltipDate(date);

      const sortedPoints = [...points].sort((a: any, b: any) => b.y - a.y);
      const metricKey = sortedPoints[0]?.series?.options?.custom?.metric ?? "";
      const metricLabel =
        metricKey && getFundamentalsByKey[metricKey]
          ? getFundamentalsByKey[metricKey].label
          : metricKey;

      const pointsSum = sortedPoints.reduce(
        (acc, p: any) => acc + (p.y ?? 0),
        0,
      );
      const maxPoint = sortedPoints.reduce(
        (max: number, p: any) => Math.max(max, Number(p.y) || 0),
        0,
      );

      const rows = sortedPoints
        .map((point: any) => {
          const { series, y } = point;
          if (y === null || y === undefined || Number.isNaN(y)) return "";
          const name = series.name;
          const mKey = series.options.custom.metric;
          const unitKey =
            Object.keys(master.metrics[mKey].units).find(
              (u) => u !== "usd" && u !== "eth",
            ) || (showUsd ? "usd" : "eth");
          const decimals =
            master.metrics[mKey].units[unitKey].decimals_tooltip ?? 2;
          let prefix = master.metrics[mKey].units[unitKey].prefix || "";
          let suffix = master.metrics[mKey].units[unitKey].suffix || "";

          const types = series.options.custom.types as string[];
          if (!showUsd && types?.includes("eth")) {
            if (showGwei(mKey)) {
              prefix = "";
              suffix = " Gwei";
            }
          }

          const valueStr = Number(y).toLocaleString("en-GB", {
            minimumFractionDigits:
              showGwei(mKey) && !showUsd ? 2 : decimals,
            maximumFractionDigits:
              showGwei(mKey) && !showUsd ? 2 : decimals,
          });

          const label =
            name === "ethereum"
              ? AllChainsByKeys[name]?.name_short ?? master.chains[name]?.name
              : AllChainsByKeys[name]?.label ??
                AllChainsByKeys[name]?.name_short ??
                master.chains[name]?.name ??
                name.toUpperCase();

          let colors = AllChainsByKeys[name]?.colors[theme ?? "dark"];
          if (name === "all_l2s") {
            colors = ["#FFDF27", "#FE5468"];
          }
          if (name === "ethereum") {
            colors = ["#94ABD3", "#596780"];
          }
          if (!colors) {
            colors = ["#94ABD3", "#596780"];
          }
          const gradient = `linear-gradient(180deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
          const barWidth =
            maxPoint > 0 && chainKey.length > 1
              ? Math.min(100, (Number(y) / maxPoint) * 100)
              : 0;

          const reversePerformer = false;
          const showBar = !reversePerformer && chainKey.length > 1;
          const valueText = reversePerformer
            ? `up to ${prefix}${valueStr}${suffix ? " " + suffix : ""}`
            : `${prefix}${valueStr}${suffix ? " " + suffix : ""}`;

          return `
            <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
              <div class="w-4 h-1.5 rounded-r-full" style="background: ${gradient};"></div>
              <div class="tooltip-point-name text-xs">${label || name}</div>
              <div class="flex-1 text-right numbers-xs">${valueText}</div>
            </div>
            ${
              showBar
                ? `<div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
                  <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
                  <div class="h-[2px] rounded-none absolute right-0 -top-[2px]" 
                    style="width: ${barWidth}%; background: ${gradient};"></div>
                </div>`
                : ""
            }
          `;
        })
        .join("");

      return `<div class="mt-3 mr-3 mb-3 min-w-[240px] md:min-w-[260px] text-xs font-raleway">
        <div class="flex justify-between items-center font-bold text-[13px] md:text-[1rem] ml-6 mb-2 gap-x-[15px]">
          <div>${dateString}</div>
          <div class="text-xs">${metricLabel}</div>
        </div>
        ${rows}
      </div>`;
    },
    [selectedScale, showGwei, showUsd, theme, AllChainsByKeys, master, formatTooltipDate],
  );

  const tooltipPositioner =
    useCallback<Highcharts.TooltipPositionerCallbackFunction>(
      function (this, width, height, point) {
        const chart = this.chart;
        const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
        const tooltipWidth = width;
        const tooltipHeight = height;
        const distance = 20;
        const pointX = point.plotX + plotLeft;
        const pointY = point.plotY + plotTop;
        const anchorRight = pointX - distance; // keep tooltip's right edge anchored to the point
        let tooltipX = anchorRight - tooltipWidth;

        const tooltipY = pointY - tooltipHeight / 2;

        if (isMobile) {
          if (tooltipX < plotLeft) tooltipX = plotLeft;
          return {
            x: tooltipX,
            y: 50,
          };
        }

        return {
          x: tooltipX,
          y: tooltipY,
        };
      },
      [isMobile],
    );

  const seriesHover = useCallback<
    | Highcharts.SeriesMouseOverCallbackFunction
    | Highcharts.SeriesMouseOutCallbackFunction
  >(
    function (this: Highcharts.Series, event: Event) {
      const {
        chart: hoveredChart,
        name: hoveredSeriesName,
        index: hoveredSeriesIndex,
      } = this;

      if (chartComponents.current && chartComponents.current.length > 1) {
        chartComponents.current.forEach((chart) => {
          if (!chart || chart.index === hoveredChart.index) return;

          if (event.type === "mouseOver") {
            if (chart.series[hoveredSeriesIndex]) {
              chart.series[hoveredSeriesIndex].setState("hover");
            }
          } else {
            chart.series[hoveredSeriesIndex].setState();
          }
        });
      }
    },

    [chartComponents],
  );

  const pointHover = useCallback<
    | Highcharts.PointMouseOverCallbackFunction
    | Highcharts.PointMouseOutCallbackFunction
  >(
    function (this: Highcharts.Point, event: MouseEvent) {
      const { series: hoveredSeries, index: hoveredPointIndex } = this;
      const hoveredChart = hoveredSeries.chart;

      if (chartComponents.current && chartComponents.current.length > 1) {
        chartComponents.current.forEach((chart) => {
          if (!chart || chart.index === hoveredChart.index) return;

          let wasCrosshairDrawn = false;

          const chartSeries = chart.series;
          chartSeries.forEach((series, seriesIndex) => {
            if (event.type === "mouseOver" || event.type === "mouseMove") {
              if (event.target !== null) {
                const pointerEvent =
                  event.target as unknown as Highcharts.PointerEventObject;
                const point =
                  series.points.find(
                    (p) =>
                      p.x ===
                      (event.target as unknown as Highcharts.PointerEventObject)
                        .x,
                  ) || null;
                if (point !== null) {
                  const simulatedPointerEvent: any = {
                    chartX: point.plotX ?? 0,
                    chartY: point.plotY ?? 0,
                  };
                  point.setState("hover");
                  if (!wasCrosshairDrawn) {
                    chart.xAxis[0].drawCrosshair(simulatedPointerEvent);
                    wasCrosshairDrawn = true;
                  }
                }
                return;
              }
            }
            if (chart && chart.xAxis[0]) {
              if (seriesIndex === hoveredSeries.index)
                chart.xAxis[0].hideCrosshair();
              series.points.forEach((point) => {
                point.setState();
              });
            }
          });
        });
      }
    },

    [chartComponents],
  );

  const [isVisible, setIsVisible] = useState(true);
  const resizeTimeout = useRef<null | ReturnType<typeof setTimeout>>(null);
  const [isAnimate, setIsAnimate] = useState(false);
  const animationTimeout = useRef<null | ReturnType<typeof setTimeout>>(null);

  const handleResize = () => {
    // Hide the element
    setIsVisible(false);

    // Set animation to false
    setIsAnimate(false);

    // Clear any existing timeouts
    if (resizeTimeout.current) {
      clearTimeout(resizeTimeout.current);
    }

    if (animationTimeout.current) {
      clearTimeout(animationTimeout.current);
    }

    // Set a timeout to show the element again after 500ms of no resizing
    resizeTimeout.current = setTimeout(() => {
      setIsVisible(true);
    }, 200);

    // Set a timeout to show the element again after 500ms of no resizing
    animationTimeout.current = setTimeout(() => {
      setIsAnimate(true);
    }, 500);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    animationTimeout.current = setTimeout(() => {
      setIsAnimate(true);
    }, 500);

    return () => {
      // Cleanup
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }

      if (animationTimeout.current) {
        clearTimeout(animationTimeout.current);
      }
    };
  }, []);

  const options: Highcharts.Options = useMemo(() => ({
    accessibility: { enabled: false },
    exporting: { enabled: false },
    chart: {
      type: "area",
      animation: false, // Disable animation for better performance
      height: 224,
      backgroundColor: undefined,
      margin: [1, 0, 40, 0],
      spacingBottom: 0,
      spacingTop: 40,
      panning: { enabled: true },
      panKey: "shift",
      zooming: {
        type: "x",
        mouseWheel: {
          enabled: false,
        },
        resetButton: {
          theme: {
            zIndex: -10,
            fill: "transparent",
            stroke: "transparent",
            style: {
              color: "transparent",
              height: 0,
              width: 0,
            },
            states: {
              hover: {
                fill: "transparent",
                stroke: "transparent",
                style: {
                  color: "transparent",
                  height: 0,
                  width: 0,
                },
              },
            },
          },
        },
      },

      style: {
        borderRadius: "0 0 15px 15px",
      } as any,
    },

    title: undefined,
    yAxis: {
      title: { text: undefined },
      opposite: false,
      showFirstLabel: false,

      showLastLabel: true,
      gridLineWidth: 1,
      gridLineColor:
        theme === "dark"
          ? "rgba(215, 223, 222, 0.11)"
          : "rgba(41, 51, 50, 0.11)",

      type: "linear",
      min: 0,
      labels: {
        align: "left",
        y: -4,
        x: 2,
        style: {
          color: "rgb(var(--text-primary))",
          gridLineColor:
            theme === "dark"
              ? "rgba(215, 223, 222, 0.33)"
              : "rgba(41, 51, 50, 0.33)",
          fontSize: "8px",
          fontWeight: "300",
          fontFamily: "Fira Sans",
        },
      },
    },
    xAxis: {
      events: {
        afterSetExtremes: onXAxisSetExtremes,
      },
      type: "datetime",
      lineWidth: 0,
      crosshair: {
        width: 0.5,
        color: COLORS.PLOT_LINE,
        snap: false,
      },
      tickPositions: getTickPositions(
        activeTimespan?.xMin ?? Date.now() - 180 * dayMs,
        activeTimespan?.xMax ?? Date.now(),
      ),
      tickmarkPlacement: "on",
      tickWidth: 1,
      tickLength: 20,
      ordinal: false,
      minorTicks: false,
      minorTickLength: 2,
      minorTickWidth: 2,
      minorGridLineWidth: 0,
      minorTickInterval: 1000 * 60 * 60 * 24 * 7,
      labels: {
        style: { color: "rgb(var(--text-primary))" },
        enabled: false,
        formatter: (item) => {
          const date = new Date(item.value);
          const isMonthStart = date.getDate() === 1;
          const isYearStart = isMonthStart && date.getMonth() === 0;
          if (isYearStart) {
            return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
          } else {
            return `<span style="">${date.toLocaleDateString("en-GB", {
              month: "short",
            })}</span>`;
          }
        },
      },
      gridLineWidth: 0,
    },
    legend: {
      enabled: false,
      useHTML: false,
      symbolWidth: 0,
    },
    tooltip: {
      hideDelay: 300,
      stickOnContact: false,
      useHTML: true,
      shared: true,
      outside: true,
      formatter: tooltipFormatter,
      positioner: tooltipPositioner,
      split: false,
      followPointer: true,
      followTouchMove: true,
      backgroundColor: "rgb(var(--bg-default))",
      borderRadius: 17,
      borderWidth: 0,
      padding: 0,
      shadow: {
        color: "black",
        opacity: 0.015,
        offsetX: 2,
        offsetY: 2,
      },
      style: {
        color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
      },
    },

    plotOptions: {
      line: {
        lineWidth: 2,
      },
      column: {
        crisp: false,
        stacking: undefined,
        groupPadding: 0.1,
        pointPadding: 0.05,
        borderWidth: 0,
        borderRadius: 2,
      },
      area: {
        lineWidth: 2,
        fillOpacity: 1,
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
          },
          stops: [
            [
              0,
              AllChainsByKeys[data[0].chain_id].colors[theme ?? "dark"][0] +
              "33",
            ],
            [
              1,
              AllChainsByKeys[data[0].chain_id].colors[theme ?? "dark"][1] +
              "33",
            ],
          ],
        },
        shadow: {
          color:
            AllChainsByKeys[data[0].chain_id]?.colors[theme ?? "dark"][1] +
            "33",
          width: 10,
        },
        color: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 1,
            y2: 0,
          },
          stops: [
            [0, AllChainsByKeys[data[0].chain_id]?.colors[theme ?? "dark"][0]],
            [1, AllChainsByKeys[data[0].chain_id]?.colors[theme ?? "dark"][1]],
          ],
        },
      },
      series: {
        zIndex: 10,
        animation: false,
        marker: {
          lineColor: "white",
          radius: 0,
          symbol: "circle",
        },
        states: {
          inactive: {
            enabled: true,
            opacity: 0.6,
          },
        },
      },
    },

    credits: {
      enabled: false,
    },
  }), [theme, activeTimespan, dayMs, onXAxisSetExtremes, getTickPositions, tooltipFormatter, tooltipPositioner, AllChainsByKeys, data]);

  const getNavIcon = useCallback(
    (key: string) => {
      const metricItem = metricItems.find((item) => item.key === key);
      if (!metricItem || !metricItem.category) return null;

      return metricCategories[metricItem.category]
        ? metricCategories[metricItem.category].icon
        : null;
    },
    [],
  );

  // Determine chart type based on time interval and comparison state
  const getChartSeriesType = useCallback((): "area" | "column" | "line" => {
    const isComparing = chainKey.length > 1;

    // When comparing chains, use line chart without fill
    if (isComparing) {
      return "line";
    }

    // For weekly/monthly without comparison, use column chart
    if (selectedTimeInterval === "weekly" || selectedTimeInterval === "monthly") {
      return "column";
    }

    // Default: daily uses area chart
    return "area";
  }, [chainKey.length, selectedTimeInterval]);

  // Get series styling based on chart type and incomplete data status
  const getSeriesStyling = useCallback(
    (chainId: string, seriesData: [number, number][]) => {
      const chartType = getChartSeriesType();
      const chainColors = AllChainsByKeys[chainId]?.colors[theme ?? "dark"] || ["#FF0000", "#FF0000"];

      // Calculate if last data point is incomplete
      let zones: any[] | undefined = undefined;
      let zoneAxis: string | undefined = undefined;

      if (selectedTimeInterval === "weekly" || selectedTimeInterval === "monthly") {
        const todaysDateUTC = new Date().getTime();
        const lastDataPointTime = seriesData.length > 0 ? seriesData[seriesData.length - 1][0] : 0;

        // For weekly: check if less than 7 days since last data point's week started
        // For monthly: check if we're not on the 1st of the month
        let isIncomplete = false;

        if (selectedTimeInterval === "weekly") {
          const daysSinceLastDataPoint = Math.floor((todaysDateUTC - lastDataPointTime) / (1000 * 60 * 60 * 24));
          isIncomplete = daysSinceLastDataPoint < 7;
        } else if (selectedTimeInterval === "monthly") {
          const todaysDayOfMonth = new Date().getUTCDate();
          isIncomplete = todaysDayOfMonth !== 1;
        }

        if (isIncomplete && seriesData.length > 1) {
          zoneAxis = "x";

          if (chartType === "column") {
            // Dashed pattern for incomplete column
            const dottedColumnColor = {
              pattern: {
                path: {
                  d: "M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11",
                  strokeWidth: 3,
                },
                width: 10,
                height: 10,
                opacity: 1,
                color: chainColors[0] + "CC",
              },
            };

            zones = [
              {
                value: seriesData[seriesData.length - 2][0] + 1,
                color: {
                  linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                  stops: [
                    [0, chainColors[0] + "FF"],
                    [1, chainColors[0] + "00"],
                  ],
                },
              },
              {
                color: dottedColumnColor,
              },
            ];
          } else {
            // Dotted line for incomplete line chart
            zones = [
              {
                value: seriesData[seriesData.length - 2][0] + 1,
                dashStyle: "Solid",
              },
              {
                dashStyle: "Dot",
              },
            ];
          }
        }
      }

      // Base styling by chart type
      if (chartType === "line") {
        // Line chart without fill (for comparison mode)
        return {
          type: "line" as const,
          lineColor: chainColors[0],
          lineWidth: 2,
          fillColor: undefined,
          color: chainColors[0],
          shadow: {
            color: chainColors[1] + "66",
            width: 9,
          },
          zones,
          zoneAxis,
        };
      } else if (chartType === "column") {
        // Column chart for weekly/monthly
        return {
          type: "column" as const,
          color: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, chainColors[0] + "FF"],
              [1, chainColors[0] + "00"],
            ],
          },
          borderColor: chainColors[0],
          borderWidth: 0,
          shadow: undefined,
          zones,
          zoneAxis,
        };
      } else {
        // Area chart (default for daily) - matches original plotOptions.area styling
        return {
          type: "area" as const,
          lineColor: chainColors[0],
          color: {
            linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
            stops: [
              [0, chainColors[0]],
              [1, chainColors[1]],
            ],
          },
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, chainColors[0] + "33"],
              [1, chainColors[1] + "33"],
            ],
          },
          shadow: {
            color: chainColors[1] + "33",
            width: 10,
          },
          zones,
          zoneAxis,
        };
      }
    },
    [getChartSeriesType, AllChainsByKeys, theme, selectedTimeInterval],
  );

  // Use a ref to store the latest styling function to avoid it triggering re-renders
  const getSeriesStylingRef = useRef(getSeriesStyling);
  useEffect(() => {
    getSeriesStylingRef.current = getSeriesStyling;
  }, [getSeriesStyling]);

  // Pre-compute all series data to avoid recalculating inside the chart update loop
  const precomputedSeriesData = useMemo(() => {
    const result: {
      [metricKey: string]: {
        [chainId: string]: {
          seriesData: (number | null)[][];
          types: string[];
        } | null;
      };
    } = {};

    enabledFundamentalsKeys.forEach((metricKey) => {
      result[metricKey] = {};
      data.forEach((item) => {
        const metricData = item.metrics[metricKey];
        const intervalData = metricData
          ? (metricData[selectedTimeInterval as keyof typeof metricData] as IntervalData)
          : null;

        if (!intervalData || !intervalData.data) {
          result[metricKey][item.chain_id] = null;
          return;
        }

        const seriesData = intervalData.types.includes("eth")
          ? showUsd
            ? intervalData.data.map((d) => [
                d[0],
                d[intervalData.types.indexOf("usd")],
              ])
            : intervalData.data.map((d) => [
                d[0],
                showGwei(metricKey)
                  ? d[intervalData.types.indexOf("eth")] * 1000000000
                  : d[intervalData.types.indexOf("eth")],
              ])
          : intervalData.data.map((d) => [d[0], d[1]]);

        result[metricKey][item.chain_id] = {
          seriesData,
          types: intervalData.types,
        };
      });
    });

    return result;
  }, [data, enabledFundamentalsKeys, selectedTimeInterval, showUsd, showGwei]);

  const lastPointLines = useRef<{
    [key: number]: Highcharts.SVGElement[];
  }>({});

  const lastPointCircles = useRef<{
    [key: number]: Highcharts.SVGElement[];
  }>({});

  // Stable render callback to avoid recreating on every render
  const createRenderCallback = useCallback((chartIndex: number) => {
    return function (this: Highcharts.Chart) {
      const chart = this;

      // destroy the last point lines and circles
      if (lastPointLines.current[chartIndex]?.length > 0) {
        lastPointLines.current[chartIndex].forEach((line) => line.destroy());
      }
      if (lastPointCircles.current[chartIndex]?.length > 0) {
        lastPointCircles.current[chartIndex].forEach((circle) => circle.destroy());
      }

      lastPointLines.current[chartIndex] = [];
      lastPointCircles.current[chartIndex] = [];

      const linesXPos = chart.chartWidth * (1 - 15 / chart.chartWidth);
      let primaryLineStartPos = chart.plotTop - 24;
      let primaryLineEndPos: number | null = null;
      let secondaryLineStartPos = chart.plotTop;
      let secondaryLineEndPos: number | null = null;
      let lastPointYDiff = 0;

      if (chart.series.length > 0) {
        const lastPoint = chart.series[0].points[chart.series[0].points.length - 1];
        if (lastPoint && lastPoint.plotY) {
          primaryLineEndPos = chart.plotTop + lastPoint.plotY;
        }

        if (chart.series.length > 1) {
          const lastPoint2 = chart.series[1].points[chart.series[1].points.length - 1];
          if (lastPoint2 && lastPoint2.plotY && primaryLineEndPos) {
            secondaryLineEndPos = chart.plotTop + lastPoint2.plotY;
            lastPointYDiff = primaryLineEndPos - secondaryLineEndPos;
          }
        }
      }

      chart.series.forEach((series, seriesIndex) => {
        const lastPoint = series.points[series.points.length - 1];
        if (!lastPoint || !lastPoint.plotY) return;

        const seriesColor = AllChainsByKeys[series.name]?.colors[theme ?? "dark"]?.[0] || "#CDD8D3";

        if (seriesIndex === 0 && secondaryLineEndPos !== null) {
          // Primary series with comparison - dashed line to top
          lastPointLines.current[chartIndex].push(
            chart.renderer
              .path(chart.renderer.crispLine(
                ["M", linesXPos, primaryLineStartPos, "L", linesXPos, chart.plotTop] as any,
                1
              ))
              .attr({
                stroke: seriesColor,
                "stroke-width": 1,
                "stroke-dasharray": 2,
                zIndex: 9997,
              })
              .add()
          );

          // Solid line portion
          lastPointLines.current[chartIndex].push(
            chart.renderer
              .path(chart.renderer.crispLine(
                ["M", linesXPos, secondaryLineStartPos, "L", linesXPos,
                  (lastPointYDiff > 0 ? secondaryLineEndPos : primaryLineEndPos)] as any,
                1
              ))
              .attr({
                stroke: seriesColor,
                "stroke-width": 1,
                zIndex: 9997,
              })
              .add()
          );

          if (lastPointYDiff > 0) {
            lastPointLines.current[chartIndex].push(
              chart.renderer
                .path(chart.renderer.crispLine(
                  ["M", linesXPos, secondaryLineEndPos, "L", linesXPos, primaryLineEndPos] as any,
                  1
                ))
                .attr({
                  stroke: seriesColor,
                  "stroke-width": 1,
                  "stroke-dasharray": 2,
                  zIndex: 9997,
                })
                .add()
            );
          }
        } else {
          // Single series or secondary series
          lastPointLines.current[chartIndex].push(
            chart.renderer
              .path(chart.renderer.crispLine(
                ["M", linesXPos,
                  seriesIndex === 0 ? primaryLineStartPos : secondaryLineStartPos,
                  "L", linesXPos,
                  seriesIndex === 0 ? primaryLineEndPos : secondaryLineEndPos] as any,
                1
              ))
              .attr({
                stroke: seriesColor,
                "stroke-width": 1,
                "stroke-dasharray": 2,
                zIndex: seriesIndex === 0 ? 9997 : 9998,
              })
              .add()
          );
        }

        // Circle at top
        lastPointCircles.current[chartIndex].push(
          chart.renderer
            .circle(linesXPos, chart.plotTop - (seriesIndex === 0 ? 24 : 0), seriesIndex === 0 ? 4.5 : 4.5)
            .attr({
              fill: seriesColor,
              zIndex: 9999,
            })
            .add()
        );
      });
    };
  }, [AllChainsByKeys, theme]);

  // Memoize per-chart options to prevent recreating objects on every render
  const chartOptionsMap = useMemo(() => {
    const map: { [key: string]: Highcharts.Options } = {};

    enabledFundamentalsKeys.forEach((key, i) => {
      const metricData = data[0]?.metrics[key];
      const intervalData = metricData ? (metricData[selectedTimeInterval as keyof typeof metricData] as IntervalData) : null;
      const isAllZeroValues = intervalData ? intervalData.data.every((d) => d[1] === 0) : false;

      map[key] = {
        ...options,
        chart: {
          ...options.chart,
          className: "zoom-chart",
          animation: isAnimate ? { duration: 500, easing: "easeOutQuint" } : false,
          index: i,
          margin: zoomed ? zoomedMargin : defaultMargin,
          events: {
            render: createRenderCallback(i),
          },
        } as any,
        yAxis: {
          ...(options.yAxis as Highcharts.YAxisOptions),
          min: isAllZeroValues && data.length === 1 ? 0 : undefined,
          max: isAllZeroValues && data.length === 1 ? 1 : undefined,
          labels: {
            ...((options.yAxis as Highcharts.YAxisOptions).labels),
            formatter: function (t: Highcharts.AxisLabelsFormatterContextObject) {
              return formatNumber(key, t.value, true);
            },
          },
        },
        xAxis: {
          ...(options.xAxis as Highcharts.XAxisOptions),
          min: zoomed ? zoomMin : activeTimespan?.xMin,
          max: zoomed ? zoomMax : activeTimespan?.xMax,
        },
      };
    });

    return map;
  }, [options, enabledFundamentalsKeys, data, selectedTimeInterval, isAnimate, zoomed, zoomedMargin, defaultMargin, zoomMin, zoomMax, activeTimespan, formatNumber, createRenderCallback]);

  // Stable ref callbacks to avoid recreating on every render
  const chartRefCallbacks = useMemo(() => {
    return enabledFundamentalsKeys.map((_, i) => (chart: HighchartsReact.RefObject | null) => {
      if (chart) {
        chartComponents.current[i] = chart.chart;
      }
    });
  }, [enabledFundamentalsKeys]);

  const resetXAxisExtremes = useCallback(() => {
    if (chartComponents.current && !zoomed) {
      chartComponents.current.forEach((chart) => {
        if (!chart) return;

        const pixelsPerDay =
          chart.plotWidth /
          (activeTimespan?.daysDiff || 180);

        // 15px padding on each side
        const paddingMilliseconds = (15 / pixelsPerDay) * 24 * 60 * 60 * 1000;

        chart.xAxis[0].setExtremes(
          (activeTimespan?.xMin ?? 0) - paddingMilliseconds,
          activeTimespan?.xMax ?? 0,
          isAnimate,
        );
      });
    }
  }, [activeTimespan, isAnimate, zoomed]);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const resituateChart = useCallback(async () => {
    if (chartComponents.current) {
      await chartComponents.current.forEach(async (chart) => {
        await delay(0)
          .then(() => {
            chart?.setSize(null, null, isAnimate);
          })
          .then(() => {
            delay(0).then(() => chart.reflow());
          });
      });
      resetXAxisExtremes();
    }
  }, [isAnimate, resetXAxisExtremes]);

  useEffect(() => {
    resetXAxisExtremes();
  }, [resetXAxisExtremes, selectedTimespan]);

  useEffect(() => {
    handleResize();
  }, [isSidebarOpen]);

  useEffect(() => {
    // Batch all chart updates together to prevent multiple redraws
    const updateCharts = () => {
      // Pre-calculate whether we need custom styling (same for all series)
      const needsCustomStyling = selectedTimeInterval !== "daily" || chainKey.length > 1;
      const chainIds = data.map((item) => item.chain_id);

      enabledFundamentalsKeys.forEach((key, i) => {
        if (chartComponents.current[i]) {
          // get current series displayed on this chart
          const currentSeries = chartComponents.current[i].series;

          // find the series to remove
          const seriesToRemove = currentSeries.filter(
            (s: Highcharts.Series) => !chainIds.includes(s.name),
          );

          // remove the series we don't need
          chartComponents.current[i].series.forEach((s) => {
            if (seriesToRemove.includes(s)) {
              s.remove(false);
            }
          });

          // loop through the series we need to add/update
          data.forEach((item) => {
            const seriesName = item.chain_id;

            // Use precomputed series data
            const precomputed = precomputedSeriesData[key]?.[item.chain_id];
            if (!precomputed) return;

            const { seriesData, types: seriesTypes } = precomputed;

            // find the series we need to update
            const series = currentSeries.find((s) => s.name === seriesName);

            // Get styling (using ref to avoid dependency issues)
            const styling = needsCustomStyling ? getSeriesStylingRef.current(item.chain_id, seriesData as [number, number][]) : null;

            // if series exists, update it
            if (series) {
              if (styling) {
                // update series with new styling for weekly/monthly/comparison
                series.update(
                  {
                    ...series.options,
                    custom: { types: seriesTypes, metric: key },
                    type: styling.type,
                    color: styling.color,
                    lineColor: styling.lineColor,
                    fillColor: styling.fillColor,
                    shadow: styling.shadow,
                    zones: styling.zones,
                    zoneAxis: styling.zoneAxis,
                    borderColor: styling.borderColor,
                    borderWidth: styling.borderWidth,
                    lineWidth: styling.lineWidth,
                  } as Highcharts.SeriesOptionsType,
                  false,
                );
              } else {
                // For daily without comparison, fully reset to original area styling
                series.update(
                  {
                    ...series.options,
                    custom: { types: seriesTypes, metric: key },
                    type: "area",
                    lineColor: AllChainsByKeys[item.chain_id].colors[theme ?? "dark"][0],
                    color: undefined, // Let plotOptions.area.color handle the gradient
                    fillColor: {
                      linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1,
                      },
                      stops: [
                        [0, AllChainsByKeys[item.chain_id].colors[theme ?? "dark"][0] + "33"],
                        [1, AllChainsByKeys[item.chain_id].colors[theme ?? "dark"][1] + "33"],
                      ],
                    },
                    shadow: {
                      color: AllChainsByKeys[item.chain_id]?.colors[theme ?? "dark"][1] + "33",
                      width: 10,
                    },
                    zones: undefined,
                    zoneAxis: undefined,
                    borderColor: undefined,
                    borderWidth: undefined,
                    lineWidth: 2,
                  } as unknown as Highcharts.SeriesOptionsType,
                  false,
                );
              }
              series.setData(seriesData, false, false); // redraw=false, animation=false
            } else {
              // if series does not exist, add it
              if (styling) {
                // Custom styling for weekly/monthly/comparison
                const seriesOptions: Highcharts.SeriesOptionsType = {
                  name: seriesName,
                  crisp: false,
                  custom: { types: seriesTypes, metric: key },
                  data: seriesData,
                  showInLegend: false,
                  animation: false,
                  marker: {
                    enabled: false,
                  },
                  point: {
                    events: {
                      mouseOver: pointHover,
                      mouseOut: pointHover,
                    },
                  },
                  ...styling,
                } as Highcharts.SeriesOptionsType;
                chartComponents.current[i].addSeries(seriesOptions, false);
              } else {
                // Original area chart styling for daily without comparison
                chartComponents.current[i].addSeries(
                  {
                    name: seriesName,
                    crisp: false,
                    custom: { types: seriesTypes, metric: key },
                    data: seriesData,
                    showInLegend: false,
                    animation: false,
                    marker: {
                      enabled: false,
                    },
                    point: {
                      events: {
                        mouseOver: pointHover,
                        mouseOut: pointHover,
                      },
                    },
                    type: "area",
                    lineColor: AllChainsByKeys[item.chain_id].colors[theme ?? "dark"][0],
                    fillColor: {
                      linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1,
                      },
                      stops: [
                        [0, AllChainsByKeys[item.chain_id].colors[theme ?? "dark"][0] + "33"],
                        [1, AllChainsByKeys[item.chain_id].colors[theme ?? "dark"][1] + "33"],
                      ],
                    },
                    shadow: {
                      color: AllChainsByKeys[item.chain_id]?.colors[theme ?? "dark"][1] + "33",
                      width: 10,
                    },
                  },
                  false,
                );
              }
            }
          });

          // redraw the chart without animation
          chartComponents.current[i].redraw(false);
        }
      });
    };

    // Debounce chart updates to prevent rapid successive updates
    // 100ms gives React time to batch state changes before we update charts
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(updateCharts);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [data, enabledFundamentalsKeys, pointHover, showGwei, showUsd, theme, selectedTimeInterval, AllChainsByKeys, chainKey.length]);

  const compChain = useMemo(() => {
    return chainKey.length > 1 ? chainKey[1] : null;
  }, [chainKey]);

  const nextChainKey = useMemo(() => {
    if (!compChain) return CompChains[0].key;

    const currentIndex = CompChains.findIndex(
      (chain) => chain.key === compChain,
    );

    if (currentIndex === CompChains.length - 1) {
      return CompChains[0].key;
    } else {
      return CompChains[currentIndex + 1].key;
    }
  }, [compChain, CompChains]);

  const prevChainKey = useMemo(() => {
    if (!compChain) return CompChains[CompChains.length - 1].key;

    const currentIndex = CompChains.findIndex(
      (chain) => chain.key === compChain,
    );

    if (currentIndex === 0) {
      return CompChains[CompChains.length - 1].key;
    } else {
      return CompChains[currentIndex - 1].key;
    }
  }, [compChain, CompChains]);

  const handleNextCompChain = () => {
    setChainKey([chainKey[0], nextChainKey]);
  };

  const handlePrevCompChain = () => {
    setChainKey([chainKey[0], prevChainKey]);
  };

  const getNoDataMessage = useCallback(
    (chainKey, metricKey) => {
      if (!master) return "";

      if (
        chainKey === "ethereum" &&
        ["tvl", "rent_paid", "profit"].includes(metricKey)
      )
        return `Data is not available for ${master.chains[chainKey].name}`;

      if (chainKey === "imx" && metricKey === "txcosts")
        return `${master.chains[chainKey].name} does not charge Transaction Costs`;

      return `Data is not available for ${master.chains[chainKey].name}`;
    },
    [master],
  );

  const categoriesMissingData = useMemo(() => {
    // check: !Object.keys(data[0].metrics).includes(key)
    // message: getNoDataMessage(data[0].chain_id, key)

    const missingData: { [key: string]: { key: string; message: string }[] } =
      {};

    Object.keys(metricCategories)
      .filter((group) => {
        return (
          group !== "gtpmetrics" &&
          group !== "public-goods-funding" &&
          group !== "developer"
        );
      })
      .forEach((category) => {
        if (!category) return;

        missingData[category] = navigationItems[1].options
          .filter(
            (option) =>
              option.key &&
              !Object.keys(data[0].metrics).includes(option.key) &&
              option.category === category,
          )
          .map((option) => ({
            key: option.key ?? "",
            message: getNoDataMessage(data[0].chain_id, option.key),
          }));
      });

    return missingData;
  }, [data, getNoDataMessage]);

  const [hoverChainKey, setHoverChainKey] = useState<string | null>(null);

  const textColors = {
    default: "text-white",
    darkTextOnBackground: "text-color-bg-default",
  }

  if (!master || !data) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full flex-col relative " id="chains-content-container">
      <style>
        {`
        .highcharts-tooltip-container {
          z-index: 9999 !important;
        }
        .highcharts-grid.highcharts-yaxis-grid > .highcharts-grid-line:first-child {
          stroke-width: 0px !important;
        `}
      </style>
      
      {/* Title and Compare Section */}
      <div className="flex items-center justify-between mb-[15px]">
        <div className="flex gap-x-[8px] items-center scroll-mt-8" id="fundamentals">
          <GTPIcon icon="gtp-fundamentals" size="lg" className="!w-[32px] !h-[32px]" containerClassName="w-[36px] h-[36px]" />
          <Heading className="text-[20px] leading-snug md:text-[30px] !z-[-1]" as="h2">
            Fundamental Metrics
          </Heading>
        </div>

        {/* Chain Compare Dropdown */}
        <div className="flex flex-col relative h-[54px] w-[271px]">
          <div
            className={`relative flex rounded-full h-full w-full z-30 p-[5px] cursor-pointer`}
            style={{
              backgroundColor: compChain
                ? AllChainsByKeys[compChain].colors[theme ?? "dark"][0]
                : "#151A19",
            }}
          >
            <div
              className="rounded-[40px] w-[54px] h-[44px] bg-forest-50 dark:bg-color-bg-default flex items-center justify-center z-[15] hover:cursor-pointer"
              onClick={handlePrevCompChain}
              onMouseOver={() => {
                preload(`${ChainsBaseURL}${prevChainKey}.json`, fetcher);
              }}
            >
              <Icon icon="feather:arrow-left" className="w-6 h-6" />
            </div>
            <div
              className="flex flex-1 flex-col items-center justify-self-center gap-y-[1px]"
              onClick={() => {
                setCompareTo(!compareTo);
              }}
            >
              <div
                className={`font-[500] leading-[150%] text-[12px] ${compChain
                  ? AllChainsByKeys[compChain].darkTextOnBackground
                    ? textColors.darkTextOnBackground
                    : textColors.default
                  : "text-forest-400 dark:text-[#5A6462]"
                  }`}
              >
                Compare to
              </div>
              <div
                className={`flex font-[550] ${compChain
                  ? AllChainsByKeys[compChain].darkTextOnBackground
                    ? textColors.darkTextOnBackground
                    : textColors.default
                  : textColors.default
                  } gap-x-[5px] justify-center items-center w-32`}
              >
                {compChain && (
                  <Icon
                    icon={`gtp:${AllChainsByKeys[compChain].urlKey}-logo-monochrome`}
                    className="w-[22px] h-[22px]"
                  />
                )}
                <div className="text-sm overflow-ellipsis truncate whitespace-nowrap">
                  {compChain ? master.chains[compChain].name : "None"}
                </div>
              </div>
            </div>
            <div
              className="rounded-[40px] w-[54px] h-[44px] bg-forest-50 dark:bg-color-bg-default flex items-center justify-center z-[15] hover:cursor-pointer"
              onClick={handleNextCompChain}
              onMouseOver={() => {
                preload(`${ChainsBaseURL}${nextChainKey}.json`, fetcher);
              }}
            >
              <Icon icon="feather:arrow-right" className="w-6 h-6" />
            </div>
          </div>
          <div
            className={`flex flex-col absolute top-[27px] left-0 right-0 bg-forest-50 dark:bg-color-bg-default rounded-t-none border-0 border-b border-l border-r transition-all ease-in-out duration-300 ${compareTo
              ? `max-h-[${CompChains.length * 30 + 40}px] z-[25] border-transparent border-forest-200 dark:border-forest-500 rounded-b-2xl shadow-[0px_4px_46.2px_#00000066] dark:shadow-[0px_4px_46.2px_#000000]`
              : "max-h-0 z-20 overflow-hidden border-transparent rounded-b-[22px]"
              } `}
          >
            <div className="pb-[20px] lg:pb-[10px]">
              <div className="h-[10px] lg:h-[28px]"></div>
              <div
                className="flex pl-[21px] pr-[19px] lg:pr-[15px] py-[5px] gap-x-[10px] items-center text-base leading-[150%] cursor-pointer hover:bg-forest-200/30 dark:hover:bg-forest-500/10"
                onClick={() => {
                  setCompareTo(false);
                  delay(300).then(() => setChainKey([chainKey[0]]));
                }}
              >
                <Icon
                  icon="feather:arrow-right-circle"
                  className="w-6 h-6"
                  visibility={compChain === null ? "visible" : "hidden"}
                />
                <div className="flex w-[22px] h-[22px] items-center justify-center">
                  <Icon
                    icon="feather:x"
                    className={`transition-all duration-300 ${compChain === null
                      ? "w-[22px] h-[22px]"
                      : "w-[15px] h-[15px]"
                      }`}
                    style={{
                      color: compChain === null ? "" : "#5A6462",
                    }}
                  />
                </div>
                <div className="">None</div>
              </div>
              {CompChains.sort((chain1, chain2) => {
                const nameA = master.chains[chain1.key].name.toLowerCase();
                const nameB = master.chains[chain2.key].name.toLowerCase();

                if (nameA < nameB) {
                  return -1;
                }
                if (nameA > nameB) {
                  return 1;
                }
                return 0;
              }).map((chain, index) => (
                <div
                  className="flex pl-[21px] pr-[15px] py-[5px] gap-x-[10px] items-center text-base leading-[150%] cursor-pointer hover:bg-forest-200/30 dark:hover:bg-forest-500/10"
                  onClick={() => {
                    setCompareTo(false);
                    delay(400).then(() =>
                      setChainKey([chainKey[0], chain.key]),
                    );
                  }}
                  key={index}
                  onMouseOver={() => {
                    setHoverChainKey(chain.key);
                    preload(`${ChainsBaseURL}${chain.key}.json`, fetcher);
                  }}
                  onMouseLeave={() => {
                    setHoverChainKey(null);
                  }}
                >
                  <Icon
                    icon="feather:arrow-right-circle"
                    className="w-6 h-6"
                    visibility={compChain === chain.key ? "visible" : "hidden"}
                  />
                  <div className="flex w-[22px] h-[22px] items-center justify-center">
                    <Icon
                      icon={`gtp:${chain.urlKey}-logo-monochrome`}
                      className={`${compChain === chain.key
                        ? "w-[22px] h-[22px]"
                        : "w-[15px] h-[15px]"
                        }`}
                      style={{
                        color:
                          compChain === chain.key || hoverChainKey === chain.key
                            ? AllChainsByKeys[chain.key].colors[
                            theme ?? "dark"
                            ][0]
                            : "#5A6462",
                      }}
                    />
                  </div>
                  <div>{master.chains[chain.key].name}</div>
                </div>
              ))}
            </div>
          </div>
          {compareTo && (
            <div
              className={`fixed inset-0 z-20`}
              onClick={() => {
                setCompareTo(false);
              }}
            />
          )}
        </div>
      </div>

      <TopRowContainer
        className={`relative mb-[15px]`}
      >
        <div className="flex flex-col relative h-full lg:h-[54px] w-full lg:w-fit -mt-[1px]">
          <TopRowParent>
            {availableIntervals.map((interval) => (
              <TopRowChild
                key={interval}
                isSelected={selectedTimeInterval === interval}
                onClick={() => {
                  setSelectedTimeInterval(interval);
                }}
                className={"capitalize relative"}
              >
                <span className="">{interval}</span>
              </TopRowChild>
            ))}
          </TopRowParent>
        </div>

        <TopRowParent>
          {!zoomed ? (
            Object.keys(timespans)
              .filter((timespan) =>
                selectedTimeInterval === "daily"
                  ? ["90d", "180d", "365d", "max"].includes(timespan)
                : selectedTimeInterval === "weekly"
                  ? ["12w", "24w", "52w", "maxW"].includes(timespan)
                : selectedTimeInterval === "monthly"
                  ? ["6m", "12m", "maxM"].includes(timespan)
                  : ["4q", "8q", "12q", "maxQ"].includes(timespan),
              )
              .map((timespan) => (
                <TopRowChild
                  key={timespan}
                  isSelected={selectedTimespan === timespan}
                  onClick={() => {
                    setSelectedTimespan(timespan);
                  }}
                  style={{
                    fontSize: isMobile ? "16px" : "",
                    paddingTop: isMobile ? "6px" : "",
                    paddingBottom: isMobile ? "6px" : "",
                  }}
                  className={`py-[4px] xl:py-[13px]`}
                >
                  <span className="hidden sm:block">
                    {timespans[timespan].label}
                  </span>
                  <span className="block text-xs sm:hidden">
                    {timespans[timespan].shortLabel}
                  </span>
                </TopRowChild>
              ))
          ) : (
            <div className="flex w-full gap-x-1">
              <button
                className={`rounded-full flex items-center justify-center space-x-1 md:space-x-3 px-[16px] py-[3px] md:px-[15px] md:py-[6px] leading-[20px] md:leading-normal lg:px-[16px] lg:py-[11px] w-full lg:w-auto text-xs md:text-base font-medium border-[0.5px] border-forest-400`}
                onClick={() => {
                  setZoomed(false);
                  resituateChart();
                }}
              >
                <Icon
                  icon="feather:zoom-out"
                  className="w-4 h-4 md:w-5 md:h-5"
                />
                <div className="hidden md:block">Reset Zoom</div>
                <div className="block md:hidden">Reset</div>
              </button>
              <button
                className={`rounded-full px-[16px] py-[4px] md:px-[15px] md:py-[7px] leading-[20px] md:leading-normal lg:px-[16px] lg:py-[12px] w-full lg:w-auto text-xs md:text-base bg-color-bg-default dark:bg-color-ui-active`}
              >
                {intervalShown?.label}
              </button>
            </div>
          )}
        </TopRowParent>
      </TopRowContainer>

      <div className="flex flex-col gap-y-[15px]">
        {Object.keys(metricCategories)
          .filter((group) => {
            return (
              group !== "gtpmetrics" &&
              group !== "public-goods-funding" &&
              group !== "developer"
            );
          })
          .map((categoryKey) => (
            <ChainSectionHead
              title={metricCategories[categoryKey].label}
              enableDropdown={true}
              defaultDropdown={true}
              key={categoryKey}
              icon={"gtp:" + categoryKey}
              childrenHeight={
                Math.round(
                  enabledFundamentalsKeys.filter((key) => {
                    return getFundamentalsByKey[key].category === categoryKey;
                  }).length / (isMobile ? 1 : 2),
                ) * 235
              }
              rowEnd={
                categoriesMissingData[categoryKey].length > 0 && (
                  <Tooltip placement="left">
                    <TooltipTrigger>
                      <Icon icon="feather:alert-circle" className="w-6 h-6" />
                    </TooltipTrigger>
                    <TooltipContent className="z-50 flex items-center justify-center">
                      <div className="px-3 py-4 text-xs font-medium bg-color-bg-default dark:bg-[#4B5553] rounded-xl shadow-lg z-50 w-auto flex flex-col items-center">
                        {categoriesMissingData[categoryKey].map((missing) => (
                          <div key={missing.key}>
                            <div className="font-semibold">
                              {getFundamentalsByKey[missing.key].label}
                            </div>
                            <div className="text-[0.6rem] text-forest-600 dark:text-forest-300">
                              {missing.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              }
              disabled={
                enabledFundamentalsKeys.filter((key) => {
                  return getFundamentalsByKey[key].category === categoryKey;
                }).length === categoriesMissingData[categoryKey].length
              }
            >
              <div className="wrapper h-auto w-full ">
                <div className="grid grid-cols-1 sm:grid-cols-2 items-start relative gap-2">
                  {enabledFundamentalsKeys
                    .filter((key) => {
                      return getFundamentalsByKey[key].category === categoryKey;
                    })
                    .map((key, i) => {
                      const metricData = data[0].metrics[key];
                      const intervalData = metricData ? (metricData[selectedTimeInterval as keyof typeof metricData] as IntervalData) : null;
                      
                      const isAllZeroValues = intervalData
                        ? intervalData.data.every(
                          (d) => d[1] === 0,
                        )
                        : false;

                      if (!Object.keys(data[0].metrics).includes(key))
                        return null;

                      return (
                        <div key={key}>
                          {/* <div>
                            <div>Debug (dates of last 4 datapoints in current interval):</div>
                            <div>
                              {intervalData ? data.map((item) => (
                                <div key={item.chain_id}>
                                  {item.chain_id}: {intervalData?.data.slice(-4).map((d) => moment(d[0]).utc().format("YYYY-MM-DD")).join(", ")}
                                </div>
                                )) : null
                              }
                            </div>
                          </div> */}
                          <div className="group/chart w-full h-[224px] rounded-2xl bg-color-bg-default relative">
                            {!Object.keys(data[0].metrics).includes(key) ? (
                              <div key={key} className="w-full relative">
                                <div className="w-full h-[60px] lg:h-[176px] relative  pointer-events-none">
                                  <div className="absolute w-full h-full bg-forest-50 dark:bg-color-bg-default text-forest-50 rounded-[15px] opacity-30 z-30"></div>
                                  <div className="absolute w-full h-[191px] top-[0px]"></div>
                                  <div className="absolute top-[15px] w-full flex justify-between items-center space-x-4 px-[15px] opacity-30">
                                    <div className="text-[16px] font-bold leading-snug break-inside-avoid">
                                      {
                                        navigationItems[1].options.find(
                                          (o) => o.key === key,
                                        )?.page?.title
                                      }
                                    </div>
                                    <div className="lg:hidden text-xs flex-1 text-right leading-snug">
                                      {!Object.keys(data[0].metrics).includes(
                                        key,
                                      ) &&
                                        getNoDataMessage(data[0].chain_id, key)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="absolute inset-0 hidden lg:flex font-medium opacity-30 select-none justify-center items-center text-xs lg:text-sm">
                                      {!Object.keys(data[0].metrics).includes(
                                        key,
                                      ) &&
                                        getNoDataMessage(data[0].chain_id, key)}
                                    </div>
                                    {Object.keys(data[0].metrics).includes(
                                      key,
                                    ) && (
                                        <Icon
                                          icon={getNavIcon(key)}
                                          className="absolute h-[40px] w-[40px] top-[116px] left-[24px] dark:text-color-text-primary opacity-20 pointer-events-none"
                                        />
                                      )}
                                  </div>
                                </div>

                                {!zoomed
                                  ? (key === "market_cap" ||
                                    key === "txcosts") && (
                                    <div
                                      className={`w-full h-[15px] absolute -bottom-[15px] text-[10px] text-forest-600/80 dark:text-color-text-primary/80 ${key === "txcosts"
                                        ? "hidden lg:block"
                                        : ""
                                        }`}
                                    ></div>
                                  )
                                  : (key === "profit" || key === "txcosts") &&
                                  intervalShown && (
                                    <div
                                      className={`w-full h-[15px] absolute -bottom-[15px] text-[10px] text-forest-600/80 dark:text-color-text-primary/80 ${key === "txcosts"
                                        ? "hidden lg:block"
                                        : ""
                                        }`}
                                    >
                                      <div className="absolute left-[15px] align-bottom flex items-end z-10">
                                        {new Date(
                                          intervalShown.min,
                                        ).toLocaleDateString("en-GB", {
                                          timeZone: "UTC",
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                      </div>
                                      <div className="absolute right-[15px] align-bottom flex items-end z-10">
                                        {new Date(
                                          intervalShown.max,
                                        ).toLocaleDateString("en-GB", {
                                          timeZone: "UTC",
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <div className="absolute left-[15px] top-[15px] flex items-center justify-between w-full">
                                <Link
                                  href={`/fundamentals/${getFundamentalsByKey[key].urlKey}`}
                                  className="relative z-10 -top-[3px] text-[16px] font-bold flex gap-x-2 items-center cursor-pointer"
                                >
                                  <div>{getFundamentalsByKey[key].label}</div>
                                  <div className="rounded-full w-[15px] h-[15px] bg-color-bg-medium flex items-center justify-center text-[10px] z-10">
                                    <Icon
                                      icon="feather:arrow-right"
                                      className="w-[11px] h-[11px]"
                                    />
                                  </div>
                                </Link>
                                <div className="relative numbers-lg -top-[2px] flex right-[40px]">
                                  <div>{displayValues[0][key].prefix}</div>
                                  <div>{displayValues[0][key].value}</div>
                                  <div className="pl-0.5">
                                    {displayValues[0][key].suffix}
                                  </div>
                                </div>
                                <div className="absolute top-[27px] right-[17px] w-full flex justify-end items-center pl-[23px] pr-[23px] text-[#5A6462]">
                                  {displayValues[1] &&
                                    displayValues[1][key] && (
                                      <div className="text-[14px] leading-snug font-medium flex space-x-[2px]">
                                        <div>
                                          {displayValues[1][key].prefix}
                                        </div>
                                        <div>{displayValues[1][key].value}</div>
                                        <div className="text-base pl-0.5">
                                          {displayValues[1][key].suffix}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </div>
                            )}

                            <HighchartsReact
                              highcharts={Highcharts}
                              options={chartOptionsMap[key]}
                              ref={chartRefCallbacks[enabledFundamentalsKeys.indexOf(key)]}
                            />
                            <div className="absolute bottom-[43.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-40">
                              <ChartWatermark className="w-[102.936px] h-[24.536px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
                            </div>
                            <div className="opacity-100 transition-opacity duration-[900ms] group-hover/chart:opacity-0 absolute left-[7px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-forest-50/50 dark:bg-color-bg-medium/50 pointer-events-none">
                              <div className="w-[5px] h-[5px] bg-[#CDD8D3] rounded-full"></div>
                              {zoomed && zoomMin !== null && (
                                <div className="text-color-text-primary text-[8px] font-medium leading-[150%]">
                                  {new Date(zoomMin).toLocaleDateString(
                                    "en-GB",
                                    {
                                      timeZone: "UTC",
                                      month: "short",
                                      // day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </div>
                              )}
                              {!zoomed && (
                                <div className="text-color-text-primary text-[8px] font-medium leading-[150%]">
                                  {selectedTimespan &&
                                    new Date(
                                      activeTimespan?.xMin ?? 0,
                                    ).toLocaleDateString("en-GB", {
                                      timeZone: "UTC",
                                      month: "short",
                                      // day: "numeric",
                                      year: "numeric",
                                    })}
                                </div>
                              )}
                            </div>
                            <div className="opacity-100 transition-opacity duration-[900ms] group-hover/chart:opacity-0 absolute right-[9px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-forest-50/50 dark:bg-color-bg-medium/50 pointer-events-none">
                              {zoomed && zoomMax !== null && (
                                <div className="text-color-text-primary text-[8px] font-medium leading-[150%]">
                                  {new Date(zoomMax).toLocaleDateString(
                                    "en-GB",
                                    {
                                      timeZone: "UTC",
                                      month: "short",
                                      // day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </div>
                              )}
                              {!zoomed && (
                                <div className="text-color-text-primary text-[8px] font-medium leading-[150%]">
                                  {new Date(
                                    activeTimespan?.xMax ?? 0,
                                  ).toLocaleDateString("en-GB", {
                                    timeZone: "UTC",
                                    month: "short",
                                    // day: "numeric",
                                    year: "numeric",
                                  })}
                                </div>
                              )}
                              <div className="w-[5px] h-[5px] bg-[#CDD8D3] rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </ChainSectionHead>
          ))}
      </div>

      {/* <div className="flex w-full justify-end mt-6 items-center">
        <Share />
      </div> */}
    </div>
  );
}
