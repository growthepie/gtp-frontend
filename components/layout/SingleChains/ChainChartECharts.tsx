"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, memo, useTransition } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useMaster } from "@/contexts/MasterContext";
import { useSWRConfig } from "swr";
import { ChainsBaseURL, getChainMetricURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { ChainsData, MetricData, IntervalData } from "@/types/api/ChainResponse";
import ChainSectionHead from "@/components/layout/SingleChains/ChainSectionHead";
import { TopRowContainer, TopRowChild, TopRowParent } from "@/components/layout/TopRow";
import ChartWatermark from "@/components/layout/ChartWatermark";
import { metricItems, getFundamentalsByKey, metricCategories } from "@/lib/metrics";
import { IS_PRODUCTION } from "@/lib/helpers";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Heading from "@/components/layout/Heading";
import { Get_AllChainsNavigationItems, Get_SupportedChainKeys } from "@/lib/chains";
import { preload } from "swr";
import { ChainMetricResponse, MetricDetails } from "@/types/api/ChainMetricResponse";
import { ToggleSwitch } from "@/components/layout/ToggleSwitch";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};
const withOpacity = (color: string, opacity: number): string => {
  return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const transformMetricDetails = (details: MetricDetails): MetricData => {
  return {
    metric_name: details.metric_name,
    unit: "",
    source: [],
    changes: details.changes.daily as any,
    daily: {
      types: details.timeseries.daily.types,
      data: details.timeseries.daily.data as [number, number][],
    },
    weekly: details.timeseries.weekly
      ? {
          types: details.timeseries.weekly.types,
          data: details.timeseries.weekly.data as [number, number][],
        }
      : undefined,
    monthly: details.timeseries.monthly
      ? {
          types: details.timeseries.monthly.types,
          data: details.timeseries.monthly.data as [number, number][],
        }
      : undefined,
    quarterly: details.timeseries.quarterly
      ? {
          types: details.timeseries.quarterly.types,
          data: details.timeseries.quarterly.data as [number, number][],
        }
      : undefined,
    avg: false,
  };
};

const getNiceInterval = (rawInterval: number): number => {
  if (!Number.isFinite(rawInterval) || rawInterval <= 0) return 1;

  const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
  const normalized = rawInterval / magnitude;

  let niceInterval: number;
  if (normalized <= 1) niceInterval = 1;
  else if (normalized <= 2) niceInterval = 2;
  else if (normalized <= 2.5) niceInterval = 2.5;
  else if (normalized <= 5) niceInterval = 5;
  else niceInterval = 10;

  return niceInterval * magnitude;
};

// Calculate "nice" Y-axis range and interval to match Highcharts-like spacing,
// while supporting negative-only and mixed-sign datasets.
function calculateNiceYAxisRange(
  minValue: number,
  maxValue: number,
  tickCount: number = 4
): { min: number; max: number; interval: number } {
  const hasNegative = minValue < 0;
  const hasPositive = maxValue > 0;

  if (!hasNegative && !hasPositive) {
    return { min: 0, max: 1, interval: 0.25 };
  }

  if (!hasNegative) {
    const paddedMax = maxValue * 1.1;
    const interval = getNiceInterval(paddedMax / tickCount);
    const niceMax = Math.ceil(paddedMax / interval) * interval;
    return { min: 0, max: Math.max(interval, niceMax), interval };
  }

  if (!hasPositive) {
    const paddedMin = minValue * 1.1; // More negative.
    const interval = getNiceInterval(Math.abs(paddedMin) / tickCount);
    const niceMin = Math.floor(paddedMin / interval) * interval;
    return { min: Math.min(-interval, niceMin), max: 0, interval };
  }

  const paddedMin = minValue * 1.1;
  const paddedMax = maxValue * 1.1;
  const interval = getNiceInterval((paddedMax - paddedMin) / tickCount);
  const niceMin = Math.floor(paddedMin / interval) * interval;
  const niceMax = Math.ceil(paddedMax / interval) * interval;

  return { min: niceMin, max: niceMax, interval };
}

// Format number with SI suffix - matches Highcharts format (e.g., "1.0M", "750k")
function formatNumberWithSI(num: number, decimals = 2): string {
  if (num === 0) return "0";
  const sign = num < 0 ? "-" : "";
  const absNum = Math.abs(num);
  const tiers = [
    { value: 1e12, symbol: "T" },
    { value: 1e9, symbol: "B" },
    { value: 1e6, symbol: "M" },
    { value: 1e3, symbol: "k" },
  ];
  const tier = tiers.find((t) => absNum >= t.value);
  if (!tier) {
    return sign + (absNum < 1 ? absNum.toFixed(decimals) : Math.round(absNum).toString());
  }
  const scaledValue = absNum / tier.value;
  // Match Highcharts format: "1.0M" for millions, "750k" for thousands
  let formattedValue: string;
  if (scaledValue >= 100) {
    // Very large scaled values: no decimal
    formattedValue = Math.round(scaledValue).toString();
  } else if (scaledValue >= 10) {
    // 10-99: no decimal needed
    formattedValue = Math.round(scaledValue).toString();
  } else if (scaledValue === Math.floor(scaledValue)) {
    // Whole numbers under 10: show with .0 for M, no decimal for k
    if (tier.symbol === "M" || tier.symbol === "B" || tier.symbol === "T") {
      formattedValue = scaledValue.toFixed(1);
    } else {
      formattedValue = scaledValue.toString();
    }
  } else {
    // Fractional: show 1 decimal place
    formattedValue = scaledValue.toFixed(1);
  }
  return sign + formattedValue + tier.symbol;
}

// Lazy loading wrapper for charts - only renders when visible
const LazyChart = memo(({ children, height = 224 }: { children: React.ReactNode; height?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        if (visible && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      {
        rootMargin: "100px", // Start loading 100px before entering viewport
        threshold: 0,
      }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [hasBeenVisible]);

  return (
    <div ref={containerRef} style={{ minHeight: height }}>
      {hasBeenVisible ? children : (
        <div
          className="w-full rounded-2xl bg-color-bg-default animate-pulse"
          style={{ height }}
        />
      )}
    </div>
  );
});

// Helper to create a diagonal hash pattern
const createDiagonalPattern = (color: string) => {
  // Ensure we are in the browser
  if (typeof document === 'undefined') return color;

  const canvas = document.createElement('canvas');
  const size = 10; // Size of the pattern tile
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return color;

  // 1. Optional: Draw a faint background of the same color
  // This makes the bar look "filled" but hatched. Remove if you want transparent gaps.
  ctx.fillStyle = color + '00'; // 10% opacity hex
  ctx.fillRect(0, 0, size, size);

  // 2. Draw the diagonal lines
  ctx.strokeStyle = color + '99';
  ctx.lineWidth = 3;
  ctx.lineCap = 'square';
  
  ctx.beginPath();
  // Main diagonal
  ctx.moveTo(0, size);
  ctx.lineTo(size, 0);
  // Top-left corner (for seamless tiling)
  ctx.moveTo(-size / 2, size / 2);
  ctx.lineTo(size / 2, -size / 2);
  // Bottom-right corner (for seamless tiling)
  ctx.moveTo(size / 2, size * 1.5);
  ctx.lineTo(size * 1.5, size / 2);
  
  ctx.stroke();

  // Return ECharts Pattern Object
  return {
    type: 'pattern',
    image: canvas,
    repeat: 'repeat'
  };
};


LazyChart.displayName = "LazyChart";

// Single chart component
const MetricChart = memo(
  ({
    metricKey,
    data,
    chainKey,
    selectedTimeInterval,
    selectedTimespan,
    showUsd,
    theme,
    master,
    AllChainsByKeys,
    activeTimespan,
    zoomed,
    zoomMin,
    zoomMax,
    onZoomChange,
    groupId,
    lineType,
  }: {
    metricKey: string;
    data: ChainsData[];
    chainKey: string[];
    selectedTimeInterval: string;
    selectedTimespan: string;
    showUsd: boolean;
    theme: string | undefined;
    master: MasterResponse;
    AllChainsByKeys: any;
    activeTimespan: any;
    zoomed: boolean;
    zoomMin: number | null;
    zoomMax: number | null;
    onZoomChange: (zoomed: boolean, min: number | null, max: number | null) => void;
    groupId: string;
    lineType: "complex" | "simple";
  }) => {
    const chartRef = useRef<ReactECharts>(null);
    const isMobile = useMediaQuery("(max-width: 767px)");
    const isHovered = useRef(false);
    const lastGraphicElements = useRef<any[]>([]);
    const lastXPos = useRef<number | null>(null);
    const lastYPositions = useRef<{ [chainId: string]: number }>({});
    const [textPosition, setTextPosition] = useState<number | null>(null);

    // Determine chart type based on interval and comparison
    const chartType = useMemo(() => {
      const isComparing = chainKey.length > 1;
      if (isComparing) return "line";
      if (selectedTimeInterval === "weekly" || selectedTimeInterval === "monthly" || selectedTimeInterval === "quarterly") return "bar";
      return "line"; // ECharts uses 'line' with areaStyle for area charts
    }, [chainKey.length, selectedTimeInterval]);

    const showGwei = useCallback((metric_id: string) => {
      const item = metricItems.find((item) => item.key === metric_id);
      return item?.page?.showGwei && !showUsd;
    }, [showUsd]);

    // Process series data
    const seriesDataMap = useMemo(() => {
      const result: { [chainId: string]: { data: [number, number][]; types: string[] } | null } = {};

      data.forEach((item) => {
        const metricData = item.metrics[metricKey];
        const intervalData = metricData
          ? (metricData[selectedTimeInterval as keyof typeof metricData] as IntervalData)
          : null;

        if (!intervalData || !intervalData.data) {
          result[item.chain_id] = null;
          return;
        }

        let processedData: [number, number][];
        if (intervalData.types.includes("eth")) {
          if (showUsd) {
            const usdIndex = intervalData.types.indexOf("usd");
            processedData = intervalData.data
              .map((d) => [d[0], d[usdIndex]] as [number, number])
              .filter((d) => d[1] !== null && d[1] !== undefined && !Number.isNaN(d[1]));
          } else {
            const ethIndex = intervalData.types.indexOf("eth");
            const multiplier = showGwei(metricKey) ? 1000000000 : 1;
            processedData = intervalData.data
              .map((d) => [d[0], d[ethIndex] * multiplier] as [number, number])
              .filter((d) => d[1] !== null && d[1] !== undefined && !Number.isNaN(d[1]));
          }
        } else {
          // For non-eth metrics, find the value index (skip timestamp at index 0)
          const valueIndex = 1;
          processedData = intervalData.data
            .map((d) => [d[0], d[valueIndex]] as [number, number])
            .filter((d) => d[1] !== null && d[1] !== undefined && !Number.isNaN(d[1]));
        }

        result[item.chain_id] = { data: processedData, types: intervalData.types };
      });

      return result;
    }, [data, metricKey, selectedTimeInterval, showUsd, showGwei]);

    // Format axis label
    const formatAxisLabel = useCallback(
      (value: number) => {
        const units = Object.keys(master.metrics[metricKey]?.units || {});
        const unitKey = units.find((u) => u !== "usd" && u !== "eth") || (showUsd ? "usd" : "eth");
        const unitInfo = master.metrics[metricKey]?.units[unitKey];
        // When showing Gwei, don't show prefix (no $ sign)
        const prefix = showGwei(metricKey) ? "" : (unitInfo?.prefix || "");
        const suffix = showGwei(metricKey) ? " Gwei" : (unitInfo?.suffix || "");
        const sign = value < 0 ? "-" : "";
        return `${sign}${prefix}${formatNumberWithSI(Math.abs(value))} ${suffix}`;
      },
      [master, metricKey, showUsd, showGwei]
    );

    // Check if all values are zero
    const isAllZeroValues = useMemo(() => {
      const firstChainData = seriesDataMap[data[0]?.chain_id];
      if (!firstChainData) return false;
      return firstChainData.data.every((d) => d[1] === 0);
    }, [seriesDataMap, data]);

    // Check for incomplete data (last data point)
    const getIncompleteStatus = useCallback(
      (seriesData: [number, number][]) => {
        if (selectedTimeInterval !== "weekly" && selectedTimeInterval !== "monthly" && selectedTimeInterval !== "quarterly") return false;
        if (seriesData.length === 0) return false;

        const todaysDateUTC = new Date().getTime();
        const lastDataPointTime = seriesData[seriesData.length - 1][0];

        if (selectedTimeInterval === "weekly") {
          const daysSinceLastDataPoint = Math.floor((todaysDateUTC - lastDataPointTime) / (1000 * 60 * 60 * 24));
          return daysSinceLastDataPoint < 7;
        } else if (selectedTimeInterval === "monthly") {
          const todaysDayOfMonth = new Date().getUTCDate();
          return todaysDayOfMonth !== 1;
        } else if (selectedTimeInterval === "quarterly") {
          // Quarters start on Jan 1, Apr 1, Jul 1, Oct 1
          const today = new Date();
          const month = today.getUTCMonth();
          const dayOfMonth = today.getUTCDate();
          // Check if we're at the start of a quarter (month 0, 3, 6, 9 and day 1)
          const isQuarterStart = [0, 3, 6, 9].includes(month) && dayOfMonth === 1;
          return !isQuarterStart;
        }
        return false;
      },
      [selectedTimeInterval]
    );

    // Pre-compute filtered data and y-axis bounds to avoid duplicate filtering in option.
    const { filteredDataMap, minDataValue, maxDataValue, xMin, xMax } = useMemo(() => {
      const xMinRaw = zoomed ? zoomMin : activeTimespan?.xMin;
      const xMaxVal = zoomed ? zoomMax : activeTimespan?.xMax;

      // Calculate left padding in time units (like Highcharts does with 15px)
      const timeRange = (xMaxVal && xMinRaw) ? (xMaxVal - xMinRaw) : 0;
      const leftPaddingMs = timeRange * 0.0375; // ~15px worth of time
      const xMinVal = xMinRaw ? xMinRaw - leftPaddingMs : xMinRaw;

      const filtered: { [chainId: string]: [number, number][] } = {};
      let maxVal = Number.NEGATIVE_INFINITY;
      let minVal = Number.POSITIVE_INFINITY;
      let hasValues = false;

      data.forEach((item) => {
        const seriesDataObj = seriesDataMap[item.chain_id];
        if (!seriesDataObj) {
          filtered[item.chain_id] = [];
          return;
        }

        // Filter once per chain
        const chainFiltered = xMinVal && xMaxVal
          ? seriesDataObj.data.filter((d) => d[0] >= xMinVal && d[0] <= xMaxVal)
          : seriesDataObj.data;

        filtered[item.chain_id] = chainFiltered;

        // Calculate min/max in same pass
        for (let i = 0; i < chainFiltered.length; i++) {
          const currentVal = chainFiltered[i][1];
          if (currentVal > maxVal) maxVal = currentVal;
          if (currentVal < minVal) minVal = currentVal;
          hasValues = true;
        }
      });

      if (!hasValues) {
        minVal = 0;
        maxVal = 0;
      }

      return {
        filteredDataMap: filtered,
        minDataValue: minVal,
        maxDataValue: maxVal,
        xMin: xMinVal,
        xMax: xMaxVal,
      };
    }, [data, seriesDataMap, zoomed, zoomMin, zoomMax, activeTimespan?.xMin, activeTimespan?.xMax]);
    const echartsColors = useMemo(() => {
      const colors = theme === 'dark' ? ECHARTS_COLORS.dark : ECHARTS_COLORS.light;
      return {
        ...colors,
        bgDefaultTransparent: withOpacity(colors.bgDefault, 0.95),
      };
    }, [theme]);
    

    // Build ECharts option
    const option = useMemo(() => {
      const series: any[] = [];
      const isComparing = chainKey.length > 1;

      const { min: niceYMin, max: niceYMax, interval: niceYInterval } = calculateNiceYAxisRange(minDataValue, maxDataValue, 4);

      data.forEach((item, index) => {
        const chainColors = AllChainsByKeys[item.chain_id]?.colors[theme ?? "dark"] || ["#FF0000", "#FF0000"];
        const seriesDataObj = seriesDataMap[item.chain_id];
        if (!seriesDataObj) return;

        // Use pre-filtered data
        const filteredData = filteredDataMap[item.chain_id] || [];
        const isIncomplete = getIncompleteStatus(filteredData);
        const processedData = filteredData;

        // Base series config
        const baseSeries: any = {
          name: item.chain_id,
          type: chartType === "bar" ? "bar" : "line",
          data: processedData,
          animation: true,
          animationDuration: 200,
          animationDurationUpdate: 200,
          animationEasing: "sinusoidalOut",
          animationEasingUpdate: "sinusoidalOut",
          // Large mode optimization for line charts (bars handle this separately)
          large: chartType !== "bar",
          largeThreshold: 100,
          progressive: chartType !== "bar" ? 200 : 0,
          emphasis: {
            disabled: true,
          },
          z: 10 - index,
        };

        const getBarBorderRadius = (value: number): [number, number, number, number] =>
          value < 0 ? [0, 0, 2, 2] : [2, 2, 0, 0];
        const getBarGradient = (value: number) =>
          value < 0
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: chainColors[0] + "00" },
                { offset: 1, color: chainColors[0] + "FF" },
              ], false)
            : new echarts.graphic.LinearGradient(0, 1, 0, 0, [
                { offset: 0, color: chainColors[0] + "00" },
                { offset: 1, color: chainColors[0] + "FF" },
              ], false);

        if (chartType === "line" && !isComparing) {
          // Area chart styling with shadow/glow effect
          baseSeries.areaStyle = {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: chainColors[0] + "33" },
              { offset: 1, color: chainColors[1] + "33" },
            ]),
            shadowColor: chainColors[1] + "33",
            shadowBlur: 10,
            shadowOffsetY: 5,
          };
          baseSeries.lineStyle = {
            width: 2,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: chainColors[0] },
              { offset: 1, color: chainColors[1] },
            ]),
            shadowColor: chainColors[0] + "66",
            shadowBlur: 4,
            shadowOffsetY: 2,
          };
          baseSeries.itemStyle = {
            color: chainColors[0],
          };
          baseSeries.showSymbol = false;
          baseSeries.symbol = "none";
          baseSeries.smooth = false;
        } else if (chartType === "line" && isComparing) {
          // Line chart without fill for comparison
          baseSeries.lineStyle = {
            width: 2,
            color: chainColors[0],
          };
          baseSeries.itemStyle = {
            color: chainColors[0],
          };
          baseSeries.showSymbol = false;
          baseSeries.symbol = "none";
          baseSeries.smooth = false;

          // Dotted line for incomplete data
          if (isIncomplete && processedData.length > 1) {
            // Create solid line that stops before the last point
            const solidData = processedData.slice(0, -1);
            // Dotted segment for the last two points
            const dottedData = processedData.slice(-2);

            baseSeries.data = solidData;

            // Add dotted segment series (includes last point for tooltip)
            series.push({
              ...baseSeries,
              name: item.chain_id + "_incomplete",
              data: dottedData,
              lineStyle: {
                ...baseSeries.lineStyle,
                type: "dotted",
                color: chainColors[0] + '66',
              },
              z: 9 - index,
            });
          }
        } else if (chartType === "bar") {
          // Column/bar chart styling with shadow/glow effect
          // Remove barMaxWidth to allow bars to grow naturally with fewer data points
          // Use 15% gap to match landing charts (equivalent to Highcharts pointPadding: 0.15)
          baseSeries.barCategoryGap = '15%';
          baseSeries.barGap = '15%';

          const LARGE_DATASET_THRESHOLD = 100;
          const isLargeDataset = processedData.length > LARGE_DATASET_THRESHOLD;

          // if (isLargeDataset) {
          //   // For large datasets, use bucketed gradients - bars with similar heights share the same gradient object
          //   // This reduces the number of unique gradient objects while still having per-bar gradients

          //   const NUM_BUCKETS = 15;
          //   // Use niceYMax (Y-axis max) to determine rendered height proportion
          //   const yAxisMax = niceYMax || 1;

          //   // Pre-create gradient objects for each bucket
          //   // Each gradient goes from transparent (bottom) to a specific opacity (top)
          //   // The top opacity varies by bucket to simulate height-based gradient intensity
          //   const bucketGradients: any[] = [];
          //   for (let b = 0; b < NUM_BUCKETS; b++) {
          //     // Map bucket to top opacity: shorter bars = less opaque top, taller = more opaque top
          //     const topOpacity = Math.round(80 + (b / (NUM_BUCKETS - 1)) * 175); // 80-255 range (31%-100%)
          //     const topHex = topOpacity.toString(16).padStart(2, '0');
          //     bucketGradients.push(
          //       new echarts.graphic.LinearGradient(0, 1, 0, 0, [
          //         { offset: 0, color: chainColors[0] + "00" },
          //         { offset: 1, color: chainColors[0] + topHex },
          //       ], false)
          //     );
          //   }

          //   // Incomplete bar gradient (lighter)
          //   const incompleteGradient = new echarts.graphic.LinearGradient(0, 1, 0, 0, [
          //     { offset: 0, color: chainColors[0] + "00" },
          //     { offset: 1, color: chainColors[0] + "66" },
          //   ], false);

          //   // Generate the pattern using the primary chain color
          //   const incompletePattern = createDiagonalPattern(chainColors[0]);

          //   // Assign each bar a gradient based on its rendered height bucket
          //   const lastIndex = processedData.length - 1;
          //   baseSeries.data = processedData.map((d, i) => {
          //     const val = d[1];
          //     // Height proportion: 0 = bottom of chart, 1 = top of chart
          //     const heightProportion = Math.max(0, Math.min(1, val / yAxisMax));
          //     const bucketIndex = Math.min(NUM_BUCKETS - 1, Math.floor(heightProportion * NUM_BUCKETS));
          //     const isLastAndIncomplete = isIncomplete && i === lastIndex;

          //     return {
          //       value: d,
          //       itemStyle: {
          //         color: isLastAndIncomplete ? incompletePattern : bucketGradients[bucketIndex],
          //       },
          //     };
          //   });

          //   // Base item style
          //   baseSeries.itemStyle = {
          //     borderRadius: [2, 2, 0, 0],
          //     shadowColor: chainColors[0] + "22",
          //     shadowBlur: 4,
          //     shadowOffsetY: 2,
          //   };
          // } else {
            // For small datasets, use per-bar gradients (better visual quality)
            // Gradient: bottom (transparent) to top (opaque) — for positive bars
            const posGradient = new echarts.graphic.LinearGradient(0, 1, 0, 0, [
              { offset: 0, color: chainColors[0] + "00" },
              { offset: 1, color: chainColors[0] + "FF" },
            ], false);
            // Reversed gradient for negative bars: top (transparent) to bottom (opaque)
            const negGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: chainColors[0] + "00" },
              { offset: 1, color: chainColors[0] + "FF" },
            ], false);

            baseSeries.itemStyle = {
              // global: false makes gradient relative to each bar, not the whole chart
              // Gradient: bottom (transparent) to top (opaque)
              color: getBarGradient(1),
              borderRadius: getBarBorderRadius(1),
              shadowColor: chainColors[0] + "44",
              shadowBlur: 8,
              shadowOffsetX: 0,
              shadowOffsetY: 4,
            };

            // Generate the pattern using the primary chain color
            const incompletePattern = createDiagonalPattern(chainColors[0]);

            // Apply per-bar styling so negative bars keep matching rounded edges.
            if (processedData.length > 0) {
              const lastIndex = processedData.length - 1;
              baseSeries.data = processedData.map((d, i) => {
                const isLastAndIncomplete = isIncomplete && i === lastIndex;
                return {
                  value: d,
                  itemStyle: {
                    color: isLastAndIncomplete
                      ? incompletePattern
                      : getBarGradient(d[1]),
                    borderRadius: getBarBorderRadius(d[1]),
                  },
                };
              });
            }
          // }
        }

        series.push(baseSeries);
      });

      // Create placeholder graphic elements that will be updated by drawLastPointLines
      // Use last known positions to prevent flashing during transitions
      // Always use 3 line segments (v1, h, v2) to match drawLastPointLines
      // Start invisible if no previous position - drawLastPointLines will make them visible
      const hasKnownPosition = lastXPos.current !== null;
      const xPos = lastXPos.current ?? 500;
      const placeholderGraphics = data.map((item, index) => {
        const chainColors = AllChainsByKeys[item.chain_id]?.colors[theme ?? "dark"] || ["#CDD8D3", "#CDD8D3"];
        const topY = index === 0 ? 25 : 50; // Match drawLastPointLines
        const turnY = topY + 28; // Match drawLastPointLines
        const lastY = lastYPositions.current[item.chain_id] ?? topY;
        const lineStyle = {
          stroke: chainColors[0],
          lineWidth: 1,
          lineDash: [2, 2],
          opacity: hasKnownPosition ? 1 : 0, // Start invisible on first render
        };
        return [
          // Segment 1: vertical from dot to turn point
          {
            type: "line",
            id: `lastpoint-line-v1-${item.chain_id}`,
            shape: { x1: xPos, y1: topY, x2: xPos, y2: turnY },
            style: lineStyle,
            z: 100,
            transition: ["shape", "style"],
            silent: true,
          },
          // Segment 2: horizontal (collapsed to point in line mode)
          {
            type: "line",
            id: `lastpoint-line-h-${item.chain_id}`,
            shape: { x1: xPos, y1: turnY, x2: xPos, y2: turnY },
            style: lineStyle,
            z: 100,
            transition: ["shape", "style"],
            silent: true,
          },
          // Segment 3: vertical from turn point to data point
          {
            type: "line",
            id: `lastpoint-line-v2-${item.chain_id}`,
            shape: { x1: xPos, y1: turnY, x2: xPos, y2: lastY },
            style: lineStyle,
            z: 100,
            transition: ["shape", "style"],
            silent: true,
          },
          // Circle at top
          {
            type: "circle",
            id: `lastpoint-circle-${item.chain_id}`,
            shape: { cx: xPos, cy: topY, r: 4.5 },
            style: { fill: chainColors[0], opacity: hasKnownPosition ? 1 : 0 },
            z: 101,
            transition: ["shape", "style"],
            silent: true,
          },
        ];
      }).flat();

      return {
        animation: true,
        animationDuration: 200,
        animationDurationUpdate: 200,
        animationEasing: "sinusoidalOut",
        animationEasingUpdate: "sinusoidalOut",
        backgroundColor: "transparent",
        graphic: placeholderGraphics,
        grid: {
          left: 0,
          right: 15,
          top: 49,
          bottom: 0,
          containLabel: false,
        },
        xAxis: {
          type: "time",
          min: zoomed ? zoomMin : activeTimespan?.xMin,
          max: zoomed ? zoomMax : activeTimespan?.xMax,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false },
          axisPointer: {
            show: true,
            type: "line",
            snap: false, // Don't snap - show crosshair at cursor position even without data
            label: { show: false },
            lineStyle: {
              color: COLORS.PLOT_LINE,
              width: 0.5,
              type: "solid",
            },
            handle: { show: false },
          },
        },
        yAxis: {
          type: "value",
          min: isAllZeroValues && data.length === 1 ? 0 : niceYMin,
          max: isAllZeroValues && data.length === 1 ? 1 : niceYMax,
          z: 1000,
          position: "left",
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            showMinLabel: false,
            show: true,
            inside: true,
            margin: 0,
            padding: [0, 0, 1, 2],
            verticalAlign: "bottom",
            fontSize: 10,
            fontWeight: "600",
            fontFamily: "'Fira Sans', sans-serif",
            color: echartsColors.textPrimary,
            formatter: (value: number) => formatAxisLabel(value),
            hideOverlap: true,
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: theme === "dark" ? "rgba(215, 223, 222, 0.11)" : "rgba(41, 51, 50, 0.11)",
              width: 1,
            },
          },
          interval: niceYInterval, // Use calculated interval for even tick spacing
        },
        axisPointer: {
          link: [{ xAxisIndex: "all" }],
          type: "line",
          snap: false,
          label: { show: false },
          lineStyle: {
            color: COLORS.PLOT_LINE,
            width: 0.5,
            type: "solid",
          },
        },
        tooltip: {
          trigger: "axis",
          triggerOn: "mousemove",
          showDelay: 0,
          hideDelay: 50,
          enterable: false, // Don't need to enter tooltip, improves responsiveness
          transitionDuration: 0, // Disable animation for snappier feel
          appendToBody: true, // Render outside chart for better performance
          backgroundColor: (theme === "dark" ? "#2A3433" : "#EAECEB") + "EE",
          borderWidth: 0,
          borderRadius: 17,
          padding: 0, // Match Highcharts - content provides its own padding
          extraCssText: "box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.015); pointer-events: none;", // Match Highcharts shadow
          textStyle: {
            color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41, 51, 50)",
            fontSize: 12,
            fontFamily: "var(--font-raleway)",
          },
          axisPointer: {
            type: "line",
            snap: true, // Snap to data points for bar charts
            label: { show: false },
            lineStyle: {
              color: COLORS.PLOT_LINE,
              width: 0.5,
              type: "solid",
            },
            handle: { show: false },
          },
          // Let ECharts handle tooltip positioning naturally
          formatter: (params: any) => {
            // Only show tooltip if this chart is being directly hovered
            if (!isHovered.current) return "";
            if (!params || params.length === 0) return "";

            const date = new Date(params[0].value[0]);
            let dateString: string;

            if (selectedTimeInterval === "weekly") {
              const start = new Date(date);
              const end = new Date(date);
              end.setUTCDate(start.getUTCDate() + 6);
              const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
              const startStr = start.toLocaleDateString("en-GB", {
                timeZone: "UTC",
                month: "short",
                day: "numeric",
              });
              const endStr = end.toLocaleDateString("en-GB", {
                timeZone: "UTC",
                month: "short",
                day: "numeric",
              });
              dateString = `${startStr} - ${endStr}${sameYear ? " " + start.getUTCFullYear() : ""}`;
            } else if (selectedTimeInterval === "monthly") {
              dateString = date.toLocaleDateString("en-GB", {
                timeZone: "UTC",
                month: "short",
                year: "numeric",
              });
            } else if (selectedTimeInterval === "quarterly") {
              const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
              const year = date.getUTCFullYear();
              dateString = `Q${quarter} ${year}`;
            } else {
              dateString = date.toLocaleDateString("en-GB", {
                timeZone: "UTC",
                month: "short",
                day: "numeric",
                year: "numeric",
              });
            }

            const metricLabel = getFundamentalsByKey[metricKey]?.label || metricKey;

            // Normalize series names and deduplicate
            // The _incomplete series contains the last data point when comparing chains
            const chainDataMap = new Map<string, any>();
            params.forEach((p: any) => {
              const chainId = p.seriesName.replace("_incomplete", "");
              // Prefer non-incomplete series if both exist for same point
              if (!chainDataMap.has(chainId) || !p.seriesName.includes("_incomplete")) {
                chainDataMap.set(chainId, { ...p, seriesName: chainId });
              }
            });

            // Sort by value descending
            const sortedParams = Array.from(chainDataMap.values())
              .sort((a: any, b: any) => (b.value[1] || 0) - (a.value[1] || 0));

            const maxValue = Math.max(...sortedParams.map((p: any) => p.value[1] || 0));

            const units = Object.keys(master.metrics[metricKey]?.units || {});
            const unitKey = units.find((u) => u !== "usd" && u !== "eth") || (showUsd ? "usd" : "eth");
            const unitInfo = master.metrics[metricKey]?.units[unitKey];
            // When showing Gwei, don't show prefix (no $ sign)
            const prefix = showGwei(metricKey) ? "" : (unitInfo?.prefix || "");
            const suffix = showGwei(metricKey) ? " Gwei" : (unitInfo?.suffix || "");
            const decimals = unitInfo?.decimals_tooltip ?? 2;

            let rows = sortedParams
              .map((p: any) => {
                const chainId = p.seriesName;
                const value = p.value[1];
                if (value === null || value === undefined || Number.isNaN(value)) return "";

                let chainColors = AllChainsByKeys[chainId]?.colors[theme ?? "dark"];
                // Special color handling to match Highcharts
                if (chainId === "all_l2s") {
                  chainColors = ["#FFDF27", "#FE5468"];
                } else if (chainId === "ethereum") {
                  chainColors = ["#94ABD3", "#596780"];
                }
                if (!chainColors) {
                  chainColors = ["#94ABD3", "#596780"];
                }

                const label =
                  chainId === "ethereum"
                    ? AllChainsByKeys[chainId]?.name_short ?? master.chains[chainId]?.name
                    : AllChainsByKeys[chainId]?.label ?? AllChainsByKeys[chainId]?.name_short ?? master.chains[chainId]?.name ?? chainId.toUpperCase();

                const gradient = `linear-gradient(180deg, ${chainColors[0]} 0%, ${chainColors[1]} 100%)`;
                const barWidth = maxValue > 0 && chainKey.length > 1 ? Math.min(100, (value / maxValue) * 100) : 0;
                const showBar = chainKey.length > 1;

                const sign = value < 0 ? "-" : "";
                const valueStr = Math.abs(value).toLocaleString("en-GB", {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                });

                return `
                  <div style="display: flex; width: 100%; gap: 8px; align-items: center; font-weight: 500; margin-bottom: 2px;">
                    <div style="width: 16px; height: 6px; border-radius: 0 4px 4px 0; background: ${gradient};"></div>
                    <div style="font-size: 12px;" class="tooltip-point-name">${label || chainId}</div>
                    <div style="flex: 1; text-align: right; font-size: 12px;" class="numbers-xs">${sign}${prefix}${valueStr}${suffix ? " " + suffix : ""}</div>
                  </div>
                  ${
                    showBar
                      ? `<div style="display: flex; margin-left: 24px; width: calc(100% - 24px); position: relative; margin-bottom: 2px;">
                        <div style="height: 2px; border-radius: 0; position: absolute; right: 0; top: -2px; width: 100%; background: transparent;"></div>
                        <div style="height: 2px; border-radius: 0; position: absolute; right: 0; top: -2px; width: ${barWidth}%; background: ${gradient};"></div>
                      </div>`
                      : ""
                  }
                `;
              })
              .join("");

            // increased min width to 280 if weekly, 240 if monthly, 200 if daily
            const minWidth = selectedTimeInterval === "weekly" ? 280 : selectedTimeInterval === "monthly" ? 240 : 240;

            return `
              <div style="padding: 12px 12px 12px 0; min-width: ${minWidth}px; font-size: 12px; font-family: var(--font-raleway);">
                <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 13px; margin-left: 24px; margin-bottom: 8px; gap: 15px;">
                  <div>${dateString}</div>
                  <div style="font-size: 12px;">${metricLabel}</div>
                </div>
                ${rows}
              </div>
            `;
          },
        },
        dataZoom: [
          {
            type: "inside",
            xAxisIndex: 0,
            disabled: true, // Disable to prevent mousewheel capture during page scroll
          },
        ],
        series,
      };
    }, [
      data,
      chainKey,
      seriesDataMap,
      filteredDataMap,
      minDataValue,
      maxDataValue,
      minDataValue,
      chartType,
      theme,
      AllChainsByKeys,
      activeTimespan,
      zoomed,
      zoomMin,
      zoomMax,
      isAllZeroValues,
      formatAxisLabel,
      getIncompleteStatus,
      metricKey,
      selectedTimeInterval,
      master,
      showUsd,
      showGwei,
    ]);


    // Draw vertical lines connecting last point to value display
    const drawLastPointLines = useCallback(() => {
      const chartInstance = chartRef.current?.getEchartsInstance();
      if (!chartInstance) return;

      const graphicElements: any[] = [];
      const chartWidth = chartInstance.getWidth();
      let linesXPos = chartWidth - 15; // 15px from right edge (default for simple mode and line charts)
      let hasValidElements = false;

      // Check if we're rendering bars (no compare + weekly/monthly/quarterly)
      const isComparing = chainKey.length > 1;
      const isBarChart = !isComparing && (selectedTimeInterval === "weekly" || selectedTimeInterval === "monthly" || selectedTimeInterval === "quarterly");

      // For complex mode bar charts, we'll calculate linesXPos based on last bar position
      // For now, keep default - will be updated per series in complex mode

      data.forEach((item, seriesIndex) => {
        const seriesDataObj = seriesDataMap[item.chain_id];
        if (!seriesDataObj || seriesDataObj.data.length === 0) return;

        const lastDataPoint = seriesDataObj.data[seriesDataObj.data.length - 1];
        const chainColors = AllChainsByKeys[item.chain_id]?.colors[theme ?? "dark"] || ["#CDD8D3", "#CDD8D3"];

        // Convert data point to pixel position
        const pointPixel = chartInstance.convertToPixel({ seriesIndex }, [lastDataPoint[0], lastDataPoint[1]]);
        if (!pointPixel || isNaN(pointPixel[1])) return;

        const lastPointX = pointPixel[0]; // X position of the last bar's center
        const lastPointY = pointPixel[1];
        const topY = seriesIndex === 0 ? 25 : 50; // Primary at top, secondary below
        hasValidElements = true;

        // Save Y position for placeholder graphics
        lastYPositions.current[item.chain_id] = lastPointY;

        const lineStyle = {
          stroke: chainColors[0],
          lineWidth: 1,
          lineDash: [2, 2],
          opacity: 1, // Ensure visible when positioned correctly
        };

        // Always use 3 line segments for smooth animation between modes
        // For bar charts: v1 (down) → h (left) → v2 (down to bar center)
        // For line charts: all segments collapse to a single vertical line at linesXPos

        if (isBarChart) {
          if (lineType === "simple") {
            // Simple mode: straight vertical line, dot at bar center, text positioned relative to dot
            // Position dot at the center of the last bar
            const dotXPos = lastPointX;
            
            // Update linesXPos for this series to position the dot at bar center
            // This will be used for the circle position
            const currentLinesXPos = dotXPos;
            
            // For the first series, update the global position for text positioning
            // In simple mode, position text to the left of the dot with a gap
            if (seriesIndex === 0) {
              lastXPos.current = currentLinesXPos;
              // Calculate text position: dot is at lastPointX from left, text should be gap pixels to the left
              // CSS 'right' property is distance from right edge, so: chartWidth - (lastPointX - gap)
              const chartWidth = chartInstance.getWidth();
              const gap = 10; // Gap between text and dot
              setTextPosition(Math.max(0, chartWidth - lastPointX + gap));
            }

            // Segment 1: Straight vertical line from dot down to bar center
            graphicElements.push({
              type: "line",
              id: `lastpoint-line-v1-${item.chain_id}`,
              shape: {
                x1: dotXPos,
                y1: topY,
                x2: dotXPos,
                y2: lastPointY,
              },
              style: lineStyle,
              z: 100,
              transition: ["shape", "style"],
            });

            // Collapsed horizontal segment (for animation compatibility)
            graphicElements.push({
              type: "line",
              id: `lastpoint-line-h-${item.chain_id}`,
              shape: {
                x1: dotXPos,
                y1: lastPointY,
                x2: dotXPos,
                y2: lastPointY,
              },
              style: lineStyle,
              z: 100,
              transition: ["shape", "style"],
            });

            // Collapsed vertical segment (for animation compatibility)
            graphicElements.push({
              type: "line",
              id: `lastpoint-line-v2-${item.chain_id}`,
              shape: {
                x1: dotXPos,
                y1: lastPointY,
                x2: dotXPos,
                y2: lastPointY,
              },
              style: lineStyle,
              z: 100,
              transition: ["shape", "style"],
            });
          } else {
            // Complex mode: kinked path with 2 turns to hit top-center of bar
            const turnY = topY + 28; // Y level where we turn horizontally

            // Segment 1: Vertical from dot down to turn point
            graphicElements.push({
              type: "line",
              id: `lastpoint-line-v1-${item.chain_id}`,
              shape: {
                x1: linesXPos,
                y1: topY,
                x2: linesXPos,
                y2: turnY,
              },
              style: lineStyle,
              z: 100,
              transition: ["shape", "style"],
            });

            // Segment 2: Horizontal from right edge to bar center
            graphicElements.push({
              type: "line",
              id: `lastpoint-line-h-${item.chain_id}`,
              shape: {
                x1: linesXPos,
                y1: turnY,
                x2: lastPointX,
                y2: turnY,
              },
              style: lineStyle,
              z: 100,
              transition: ["shape", "style"],
            });

            // Segment 3: Vertical from turn point down to bar top
            graphicElements.push({
              type: "line",
              id: `lastpoint-line-v2-${item.chain_id}`,
              shape: {
                x1: lastPointX,
                y1: turnY,
                x2: lastPointX,
                y2: lastPointY,
              },
              style: lineStyle,
              z: 100,
              transition: ["shape", "style"],
            });
          }
        } else {
          // Line/area chart: all 3 segments collapse to straight vertical line
          // This allows smooth animation when switching from bar to line mode
          const turnY = topY + 28; // Same as bar mode

          // Segment 1: Top portion of vertical line
          graphicElements.push({
            type: "line",
            id: `lastpoint-line-v1-${item.chain_id}`,
            shape: {
              x1: linesXPos,
              y1: topY,
              x2: linesXPos,
              y2: turnY,
            },
            style: lineStyle,
            z: 100,
            transition: ["shape", "style"],
          });

          // Segment 2: Collapsed horizontal (zero width - just a point)
          graphicElements.push({
            type: "line",
            id: `lastpoint-line-h-${item.chain_id}`,
            shape: {
              x1: linesXPos,
              y1: turnY,
              x2: linesXPos,
              y2: turnY,
            },
            style: lineStyle,
            z: 100,
            transition: ["shape", "style"],
          });

          // Segment 3: Bottom portion of vertical line
          graphicElements.push({
            type: "line",
            id: `lastpoint-line-v2-${item.chain_id}`,
            shape: {
              x1: linesXPos,
              y1: turnY,
              x2: linesXPos,
              y2: lastPointY,
            },
            style: lineStyle,
            z: 100,
            transition: ["shape", "style"],
          });
        }

        // Circle at top (value display dot)
        // In simple mode bar charts, position dot at bar center; otherwise use linesXPos (right edge)
        const dotXPosition = (isBarChart && lineType === "simple") ? lastPointX : linesXPos;
        graphicElements.push({
          type: "circle",
          id: `lastpoint-circle-${item.chain_id}`,
          shape: {
            cx: dotXPosition,
            cy: topY,
            r: 4.5,
          },
          style: {
            fill: chainColors[0],
            opacity: 1, // Ensure visible when positioned correctly
          },
          z: 101,
          transition: ["shape", "style"],
        });
      });

      // Only update if we have valid elements, otherwise keep showing previous
      if (hasValidElements) {
        lastGraphicElements.current = graphicElements;
      }

      // Always apply graphic elements (current or previous)
      // Defer setOption to avoid calling during ECharts' main rendering process
      // This happens when drawLastPointLines is triggered from event handlers like datazoom
      setTimeout(() => {
        try {
          const instance = chartRef.current?.getEchartsInstance();
          if (instance && !instance.isDisposed?.()) {
            instance.setOption(
              { graphic: lastGraphicElements.current },
              { notMerge: false, lazyUpdate: false }
            );
          }
        } catch (e) {
          // Chart may have been disposed during async operations - silently ignore
          console.debug('Chart instance unavailable during drawLastPointLines:', e);
        }
      }, 0);
    }, [data, seriesDataMap, AllChainsByKeys, theme, chainKey.length, selectedTimeInterval, lineType]);

    // Draw lines after chart renders - use RAF to ensure chart is ready
    useEffect(() => {
      let cancelled = false;
      let rafId: number;
      let timeoutId: ReturnType<typeof setTimeout>;

      const attemptDraw = () => {
        if (cancelled) return;
        const chartInstance = chartRef.current?.getEchartsInstance();
        // Only draw if chart instance exists and has valid dimensions
        if (chartInstance && chartInstance.getWidth() > 0) {
          drawLastPointLines();
        } else {
          // Chart not ready yet, retry after a short delay
          timeoutId = setTimeout(() => {
            rafId = requestAnimationFrame(attemptDraw);
          }, 50);
        }
      };

      // Use RAF to wait for next paint cycle when chart should be ready
      rafId = requestAnimationFrame(attemptDraw);

      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
        clearTimeout(timeoutId);
      };
    }, [drawLastPointLines, option]);

    // Keep overlay graphics aligned in responsive layouts for simple mode.
    // Without this, dashed line / marker / value label can stay at stale positions after resize.
    useEffect(() => {
      if (lineType !== "simple") return;

      let redrawTimeoutId: ReturnType<typeof setTimeout> | null = null;
      let resizeObserver: ResizeObserver | null = null;

      const scheduleOverlayRedraw = () => {
        if (redrawTimeoutId) {
          clearTimeout(redrawTimeoutId);
        }
        redrawTimeoutId = setTimeout(() => {
          drawLastPointLines();
        }, 80);
      };

      const chartDom = chartRef.current?.getEchartsInstance()?.getDom?.();
      if (chartDom && typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          scheduleOverlayRedraw();
        });
        resizeObserver.observe(chartDom);
      }

      window.addEventListener("resize", scheduleOverlayRedraw);

      return () => {
        if (redrawTimeoutId) {
          clearTimeout(redrawTimeoutId);
        }
        window.removeEventListener("resize", scheduleOverlayRedraw);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }, [drawLastPointLines, lineType]);

    // Handle zoom events
    const onEvents = useMemo(
      () => ({
        datazoom: (params: any) => {
          const chartInstance = chartRef.current?.getEchartsInstance();
          if (!chartInstance) return;

          const option = chartInstance.getOption();
          const xAxis = option.xAxis as any[];
          if (xAxis && xAxis[0]) {
            const { min, max } = xAxis[0];
            if (min !== undefined && max !== undefined) {
              onZoomChange(true, min, max);
            }
          }
          // Redraw lines after zoom
          setTimeout(() => drawLastPointLines(), 50);
        },
        // Note: Removed 'finished' event handler that was calling drawLastPointLines()
        // on every render completion. This caused severe choppiness when hovering with
        // shared cursors (echarts.connect) since all connected charts would fire 'finished'
        // events simultaneously. drawLastPointLines is already called via useEffect when needed.
      }),
      [onZoomChange, drawLastPointLines]
    );

    // Get display value for the metric
    const displayValue = useMemo(() => {
      const firstChainData = seriesDataMap[data[0]?.chain_id];
      if (!firstChainData || firstChainData.data.length === 0) return { value: "N/A", prefix: "", suffix: "" };

      const lastDataPoint = firstChainData.data[firstChainData.data.length - 1];
      const value = lastDataPoint[1];

      const units = Object.keys(master.metrics[metricKey]?.units || {});
      const unitKey = units.find((u) => u !== "usd" && u !== "eth") || (showUsd ? "usd" : "eth");
      const unitInfo = master.metrics[metricKey]?.units[unitKey];

      const baseDecimals = unitInfo?.decimals ?? 2;
      const decimals = Math.abs(value) >= 1000 ? 2 : baseDecimals; // Use 2 decimals for compacted (k/M/B) values
      const valueFormat = Intl.NumberFormat("en-GB", {
        notation: "compact",
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      });

      const isNegative = value < 0;
      return {
        value: valueFormat.format(Math.abs(value)),
        prefix: showGwei(metricKey) ? "" : unitInfo?.prefix || "",
        suffix: showGwei(metricKey) ? "Gwei" : unitInfo?.suffix || "",
        sign: isNegative ? "-" : "",
      };
    }, [seriesDataMap, data, master, metricKey, showUsd, showGwei]);

    // Determine if we should show the accumulation badge
    const accumulationBadge = useMemo(() => {
      if (selectedTimeInterval !== "weekly" && selectedTimeInterval !== "monthly" && selectedTimeInterval !== "quarterly") {
        return null;
      }

      const firstChainData = seriesDataMap[data[0]?.chain_id];
      if (!firstChainData || firstChainData.data.length === 0) return null;

      const isIncomplete = getIncompleteStatus(firstChainData.data);
      if (!isIncomplete) return null;

      const labels: Record<string, string> = {
        weekly: "this week",
        monthly: "this month",
        quarterly: "this quarter",
      };

      return labels[selectedTimeInterval];
    }, [selectedTimeInterval, seriesDataMap, data, getIncompleteStatus]);

    // Second chain display value
    const displayValue2 = useMemo(() => {
      if (data.length < 2) return null;
      const secondChainData = seriesDataMap[data[1]?.chain_id];
      if (!secondChainData || secondChainData.data.length === 0) return null;

      const lastDataPoint = secondChainData.data[secondChainData.data.length - 1];
      const value = lastDataPoint[1];

      const units = Object.keys(master.metrics[metricKey]?.units || {});
      const unitKey = units.find((u) => u !== "usd" && u !== "eth") || (showUsd ? "usd" : "eth");
      const unitInfo = master.metrics[metricKey]?.units[unitKey];

      const baseDecimals = unitInfo?.decimals ?? 2;
      const decimals = Math.abs(value) >= 1000 ? 2 : baseDecimals; // Use 2 decimals for compacted (k/M/B) values
      const valueFormat = Intl.NumberFormat("en-GB", {
        notation: "compact",
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      });

      const isNegative = value < 0;
      return {
        value: valueFormat.format(Math.abs(value)),
        prefix: showGwei(metricKey) ? "" : unitInfo?.prefix || "",
        suffix: showGwei(metricKey) ? "Gwei" : unitInfo?.suffix || "",
        sign: isNegative ? "-" : "",
      };
    }, [seriesDataMap, data, master, metricKey, showUsd, showGwei]);

    if (!seriesDataMap[data[0]?.chain_id]) return null;

    // Determine if this is a bar chart for text positioning
    const isComparing = chainKey.length > 1;
    const isBarChartForText = !isComparing && (selectedTimeInterval === "weekly" || selectedTimeInterval === "monthly" || selectedTimeInterval === "quarterly");

    return (
      <div className="group/chart w-full h-[224px] rounded-2xl bg-color-bg-default relative @container">
        {/* Header */}
        <div className="absolute left-[15px] top-[15px] flex items-center justify-between w-[calc(100%-15px)] z-10 pr-[25px]">
          <Link
            href={`/fundamentals/${getFundamentalsByKey[metricKey]?.urlKey}`}
            className="relative z-10 -top-[3px] text-[16px] font-bold flex gap-x-2 items-center cursor-pointer min-w-0 flex-shrink"
          >
            <div className="truncate">{getFundamentalsByKey[metricKey]?.label}</div>
            <div className="rounded-full w-[15px] h-[15px] bg-color-bg-medium flex items-center justify-center text-[10px] z-10 flex-shrink-0">
              <Icon icon="feather:arrow-right" className="w-[11px] h-[11px]" />
            </div>
          </Link>
          <div 
            className="relative -top-[2px] flex items-center gap-x-[5px] flex-shrink-0"
            style={isBarChartForText && lineType === "simple" && textPosition !== null 
              ? { right: `${textPosition}px`, position: 'absolute', top: '1px' } 
              : undefined}
          >
            {accumulationBadge && (
              <div className="hidden @[340px]:flex px-[5px] h-[13px] items-center justify-center bg-color-bg-medium rounded-full">
                <span className="text-xxxs whitespace-nowrap">{accumulationBadge}</span>
              </div>
            )}
            <div className="flex numbers-lg">
              {displayValue.sign && <div>{displayValue.sign}</div>}
              <div>{displayValue.prefix}</div>
              <div>{displayValue.value}</div>
              {displayValue.suffix && <div className="pl-0.5">{displayValue.suffix}</div>}
            </div>
          </div>
          {displayValue2 && (
            <div className="absolute top-[28px] w-full flex justify-end items-center pl-[23px] pr-[25px] text-[#5A6462]">
              <div className="numbers-sm flex gap-x-[2px]">
                {displayValue2.sign && <div>{displayValue2.sign}</div>}
                <div>{displayValue2.prefix}</div>
                <div>{displayValue2.value}</div>
                {displayValue2.suffix && <div className="numbers-sm pl-0.5">{displayValue2.suffix}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div
          style={{ height: "100%", width: "100%", borderRadius: "0 0 15px 15px", overflow: "hidden" }}
          onMouseEnter={() => { isHovered.current = true; }}
          onMouseLeave={() => { isHovered.current = false; }}
        >
          <ReactECharts
            ref={chartRef}
            option={option}
            style={{ height: "100%", width: "100%" }}
            opts={{ renderer: "canvas" }}
            onEvents={onEvents}
            notMerge={false}
            lazyUpdate={true}
            onChartReady={(chart) => {
              if (groupId) {
                chart.group = groupId;
                echarts.connect(groupId);
              }
            }}
          />
        </div>

        {/* Watermark */}
        <div className="absolute bottom-[43.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-40">
          <ChartWatermark className="w-[102.936px] h-[24.536px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
        </div>

        {/* Date labels */}
        <div className="opacity-100 transition-opacity duration-[900ms] group-hover/chart:opacity-0 absolute left-[7px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-color-bg-medium/50 pointer-events-none">
          <div className="w-[5px] h-[5px] bg-color-text-primary rounded-full"></div>
          <div className="text-color-text-primary text-[8px] font-medium leading-[150%]">
            {new Date(zoomed ? zoomMin! : activeTimespan?.xMin ?? 0).toLocaleDateString("en-GB", {
              timeZone: "UTC",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
        <div className="opacity-100 transition-opacity duration-[900ms] group-hover/chart:opacity-0 absolute right-[9px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-color-bg-medium/50 pointer-events-none">
          <div className="text-color-text-primary text-[8px] font-medium leading-[150%]">
            {new Date(zoomed ? zoomMax! : activeTimespan?.xMax ?? Date.now()).toLocaleDateString("en-GB", {
              timeZone: "UTC",
              month: "short",
              year: "numeric",
            })}
          </div>
          <div className="w-[5px] h-[5px] bg-color-text-primary rounded-full"></div>
        </div>
      </div>
    );
  }
);

MetricChart.displayName = "MetricChart";
const ECHARTS_COLORS = {
  light: {
    textPrimary: 'rgb(31, 39, 38)',           // --text-primary
    textSecondary: 'rgb(121, 139, 137)',      // --text-secondary
    bgDefault: 'rgb(240, 244, 244)',          // --bg-default
    bgMedium: 'rgb(236, 239, 239)',           // --bg-medium
    uiShadow: 'rgb(215, 218, 218)',           // --ui-shadow
    uiHover: 'rgb(233, 237, 237)',            // --ui-hover
  },
  dark: {
    textPrimary: 'rgb(205, 216, 211)',        // --text-primary
    textSecondary: 'rgb(75, 83, 79)',         // --text-secondary
    bgDefault: 'rgb(31, 39, 38)',             // --bg-default
    bgMedium: 'rgb(52, 66, 64)',              // --bg-medium
    uiShadow: 'rgb(21, 26, 25)',              // --ui-shadow
    uiHover: 'rgb(90, 100, 98)',              // --ui-hover
  },
} as const;

// Main component
export default function ChainChartECharts({
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
  const { AllChains, AllChainsByKeys } = useMaster();
  const [data, setData] = useState<ChainsData[]>([chainData]);
  const [chainKey, setChainKey] = useState<string[]>([defaultChainKey]);
  const [showUsd] = useLocalStorage("showUsd", true);
  const [selectedTimespan, setSelectedTimespan] = useState("180d");
  const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");
  const [lineType, setLineType] = useLocalStorage<"complex" | "simple">("fundamentalsLineTypeV2", "simple");
  const [mounted, setMounted] = useState(false);
  
  // Ensure component is mounted before rendering toggle to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset to simple whenever the fundamentals tab is opened
  useEffect(() => {
    setLineType("simple");
  }, [setLineType]);
  
  const handleLineTypeChange = useCallback((value: string) => {
    setLineType(value as "complex" | "simple");
  }, [setLineType]);
  const [isPending, startTransition] = useTransition();
  const [zoomed, setZoomed] = useState(false);
  const [zoomMin, setZoomMin] = useState<number | null>(null);
  const [zoomMax, setZoomMax] = useState<number | null>(null);
  const [compareTo, setCompareTo] = useState(false);
  const { theme } = useTheme();
  const { cache, mutate } = useSWRConfig();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const dayMs = 24 * 60 * 60 * 1000;

  const enabledFundamentalsKeys = useMemo<string[]>(() => {
    return metricItems.map((item) => item.key ?? "");
  }, []);

  // Available intervals
  const availableIntervals = useMemo(() => {
    const intervals: string[] = [];
    if (data.length === 0 || !data[0].metrics) return ["daily"];
    const firstMetricKey = Object.keys(data[0].metrics)[0];
    if (!firstMetricKey) return ["daily"];
    const firstMetric = data[0].metrics[firstMetricKey];
    if (firstMetric.daily) intervals.push("daily");
    if (firstMetric.weekly) intervals.push("weekly");
    if (firstMetric.monthly) intervals.push("monthly");
    if (firstMetric.quarterly) intervals.push("quarterly");
    return intervals.length > 0 ? intervals : ["daily"];
  }, [data]);

  // Fetch chain data
  const fetchChainData = useCallback(async () => {
    if (chainKey.length === 0) return;

    try {
      const fetchPromises = chainKey.map(async (key) => {
        const supportedMetrics = master.chains[key]?.supported_metrics || [];
        const metricsToFetch = enabledFundamentalsKeys.filter((mKey) => supportedMetrics.includes(mKey));

        const metricPromises = metricsToFetch.map(async (mKey) => {
          const metricItem = metricItems.find((item) => item.key === mKey);
          if (!metricItem) return { key: mKey, data: null };

          const url = getChainMetricURL(key, metricItem.urlKey);
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
          description: "",
          symbol: "",
          website: "",
          explorer: "",
          ranking: {},
          hottest_contract: { data: [], types: [] },
        } as ChainsData;
      });

      const responseData = await Promise.all(fetchPromises);
      setData(responseData);
    } catch (error) {
      console.error("Error fetching chain data:", error);
    }
  }, [chainKey, cache, mutate, enabledFundamentalsKeys, master]);

  useEffect(() => {
    fetchChainData();
  }, [chainKey, fetchChainData]);

  // Derived data metrics (timespans, min/max)
  const derivedDataMetrics = useMemo(() => {
    const now = Date.now();
    let minUnix = Infinity;
    let maxUnix = -Infinity;

    data.forEach((item) => {
      Object.keys(item.metrics).forEach((key) => {
        const metricData = item.metrics[key];
        const intervalData = metricData[selectedTimeInterval as keyof typeof metricData] as IntervalData;
        if (intervalData && intervalData.data && intervalData.data.length > 0) {
          const firstTs = intervalData.data[0][0];
          const lastTs = intervalData.data[intervalData.data.length - 1][0];
          if (firstTs < minUnix) minUnix = firstTs;
          if (lastTs > maxUnix) maxUnix = lastTs;
        }
      });
    });

    if (minUnix === Infinity) minUnix = now - 180 * dayMs;
    if (maxUnix === -Infinity) maxUnix = now;

    const clampMin = (windowMs: number) => Math.max(minUnix, maxUnix - windowMs);
    const dayDiff = Math.max(1, Math.round((maxUnix - minUnix) / dayMs));

    let timespansResult: any;

    if (selectedTimeInterval === "weekly") {
      timespansResult = {
        "12w": { label: "3 months", shortLabel: "3m", value: 12, xMin: clampMin(12 * 7 * dayMs), xMax: maxUnix, daysDiff: Math.round((maxUnix - clampMin(12 * 7 * dayMs)) / dayMs) },
        "24w": { label: "6 months", shortLabel: "6m", value: 24, xMin: clampMin(24 * 7 * dayMs), xMax: maxUnix, daysDiff: Math.round((maxUnix - clampMin(24 * 7 * dayMs)) / dayMs) },
        "52w": { label: "1 year", shortLabel: "1y", value: 52, xMin: clampMin(52 * 7 * dayMs), xMax: maxUnix, daysDiff: Math.round((maxUnix - clampMin(52 * 7 * dayMs)) / dayMs) },
        maxW: { label: "Max", shortLabel: "Max", value: 0, xMin: minUnix, xMax: maxUnix, daysDiff: dayDiff },
      };
    } else if (selectedTimeInterval === "monthly") {
      const monthMs = 30 * dayMs;
      timespansResult = {
        "6m": { label: "6 months", shortLabel: "6m", value: 6, xMin: clampMin(6 * monthMs), xMax: maxUnix, daysDiff: Math.round((maxUnix - clampMin(6 * monthMs)) / dayMs) },
        "12m": { label: "1 year", shortLabel: "1y", value: 12, xMin: clampMin(12 * monthMs), xMax: maxUnix, daysDiff: Math.round((maxUnix - clampMin(12 * monthMs)) / dayMs) },
        maxM: { label: "Max", shortLabel: "Max", value: 0, xMin: minUnix, xMax: maxUnix, daysDiff: dayDiff },
      };
    } else if (selectedTimeInterval === "quarterly") {
      const quarterMs = 91 * dayMs; // ~3 months
      timespansResult = {
        "4q": { label: "1 year", shortLabel: "1y", value: 4, xMin: clampMin(4 * quarterMs), xMax: maxUnix, daysDiff: Math.round((maxUnix - clampMin(4 * quarterMs)) / dayMs) },
        "8q": { label: "2 years", shortLabel: "2y", value: 8, xMin: clampMin(8 * quarterMs), xMax: maxUnix, daysDiff: Math.round((maxUnix - clampMin(8 * quarterMs)) / dayMs) },
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

    return { timespans: timespansResult, minUnixAll: minUnix, maxUnixAll: maxUnix };
  }, [data, selectedTimeInterval, dayMs]);

  const timespans = derivedDataMetrics.timespans;

  // Keep track of last valid activeTimespan to prevent flashing during transitions
  const lastValidTimespanRef = useRef<any>(null);

  const activeTimespan = useMemo(() => {
    const keys = Object.keys(timespans);
    if (!keys.length) {
      // Return last valid timespan if available
      return lastValidTimespanRef.current;
    }
    const newTimespan = timespans[selectedTimespan] ?? timespans[keys[0]];
    if (newTimespan) {
      lastValidTimespanRef.current = newTimespan;
    }
    return newTimespan ?? lastValidTimespanRef.current;
  }, [timespans, selectedTimespan]);

  // Timespan map for interval changes
  const timespanMap = useMemo(
    () => ({
      daily: ["90d", "180d", "365d", "max"],
      weekly: ["12w", "24w", "52w", "maxW"],
      monthly: ["6m", "12m", "maxM"],
      quarterly: ["4q", "8q", "maxQ"],
    }),
    []
  );

  const prevIntervalRef = useRef(selectedTimeInterval);

  useEffect(() => {
    const prevInterval = prevIntervalRef.current;
    if (prevInterval === selectedTimeInterval) return;

    const prevList = timespanMap[prevInterval as keyof typeof timespanMap] || [];
    const newList = timespanMap[selectedTimeInterval as keyof typeof timespanMap] || [];
    const prevIndex = prevList.indexOf(selectedTimespan);

    let nextTimespan = (prevIndex >= 0 && newList[prevIndex]) || newList[0] || selectedTimespan;

    if (nextTimespan && timespans[nextTimespan]) {
      if (nextTimespan !== selectedTimespan) setSelectedTimespan(nextTimespan);
    } else {
      const availableKeys = Object.keys(timespans);
      if (availableKeys.length && !availableKeys.includes(selectedTimespan)) {
        setSelectedTimespan(availableKeys[0]);
      }
    }

    prevIntervalRef.current = selectedTimeInterval;
  }, [selectedTimeInterval, selectedTimespan, timespanMap, timespans]);

  // Comparison chains
  const CompChains = useMemo(() => {
    if (!master) return [];

    const chainItemsByKey = Get_AllChainsNavigationItems(master)
      .options.filter((option) => option.hide !== true)
      .filter((option) => option.key && Get_SupportedChainKeys(master).includes(option.key))
      .reduce((acc: any, option) => {
        if (option.key) acc[option.key] = option;
        return acc;
      }, {});

    const chainsByBucket = Object.entries(master.chains).reduce((acc: any, [key, chainInfo]) => {
      if (!acc[chainInfo.bucket]) acc[chainInfo.bucket] = [];
      if (chainItemsByKey[key] && key !== chainKey[0]) acc[chainInfo.bucket].push(chainItemsByKey[key]);
      return acc;
    }, {});

    Object.keys(chainsByBucket).forEach((bucket) => {
      chainsByBucket[bucket].sort((a: any, b: any) => a.label.localeCompare(b.label));
    });

    return Object.keys(chainsByBucket).reduce((acc: any[], bucket: string) => {
      acc.push(...chainsByBucket[bucket]);
      return acc;
    }, []);
  }, [master, chainKey]);

  const compChain = useMemo(() => (chainKey.length > 1 ? chainKey[1] : null), [chainKey]);

  const nextChainKey = useMemo(() => {
    if (!compChain) return CompChains[0]?.key;
    const currentIndex = CompChains.findIndex((chain: any) => chain.key === compChain);
    return currentIndex === CompChains.length - 1 ? CompChains[0]?.key : CompChains[currentIndex + 1]?.key;
  }, [compChain, CompChains]);

  const prevChainKey = useMemo(() => {
    if (!compChain) return CompChains[CompChains.length - 1]?.key;
    const currentIndex = CompChains.findIndex((chain: any) => chain.key === compChain);
    return currentIndex === 0 ? CompChains[CompChains.length - 1]?.key : CompChains[currentIndex - 1]?.key;
  }, [compChain, CompChains]);

  const handleNextCompChain = () => setChainKey([chainKey[0], nextChainKey]);
  const handlePrevCompChain = () => setChainKey([chainKey[0], prevChainKey]);

  const handleZoomChange = useCallback((newZoomed: boolean, min: number | null, max: number | null) => {
    setZoomed(newZoomed);
    setZoomMin(min);
    setZoomMax(max);
  }, []);

  const resetZoom = useCallback(() => {
    setZoomed(false);
    setZoomMin(null);
    setZoomMax(null);
  }, []);

  const textColors = {
    default: "text-white",
    darkTextOnBackground: "text-color-bg-default",
  };

  const [hoverChainKey, setHoverChainKey] = useState<string | null>(null);

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  if (!master || !data) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="w-full flex-col relative " id="chains-content-container">
      {/* Title and Compare Section */}
      <div className="flex items-center justify-between mb-[15px]">
        <div className="flex gap-x-[8px] items-center scroll-mt-8" id="fundamentals">
          <GTPIcon icon="gtp-fundamentals" size="lg" className="!w-[32px] !h-[32px]" containerClassName="w-[36px] h-[36px]" />
          <Heading className="font-bold leading-[120%] text-[20px] md:text-[30px] break-inside-avoid" as="h2">
            Fundamental Metrics
          </Heading>
          {mounted && !IS_PRODUCTION && (
            <ToggleSwitch
              values={[
                { value: "simple", label: "simple" },
                { value: "complex", label: "complex" },
              ]}
              value={lineType}
              onChange={handleLineTypeChange}
              size="sm"
              ariaLabel="Line type toggle"
              className="ml-[12px]"
            />
          )}
        </div>

        {/* Chain Compare Dropdown */}
        <div className="flex flex-col relative h-[54px] w-[271px]">
          <div
            className="relative flex rounded-full h-full w-full z-30 p-[5px] cursor-pointer"
            style={{
              backgroundColor: compChain ? AllChainsByKeys[compChain]?.colors[theme ?? "dark"][0] : "rgb(var(--ui-active))",
            }}
          >
            <div
              className="rounded-[40px] w-[54px] h-[44px] bg-forest-50 dark:bg-color-bg-default flex items-center justify-center z-[15] hover:cursor-pointer"
              onClick={handlePrevCompChain}
              onMouseOver={() => preload(`${ChainsBaseURL}${prevChainKey}.json`, fetcher)}
            >
              <Icon icon="feather:arrow-left" className="w-6 h-6" />
            </div>
            <div className="flex flex-1 flex-col items-center justify-self-center gap-y-[1px]" onClick={() => setCompareTo(!compareTo)}>
              <div
                className={`font-[500] leading-[150%] text-[12px] ${
                  compChain
                    ? AllChainsByKeys[compChain]?.darkTextOnBackground
                      ? textColors.darkTextOnBackground
                      : textColors.default
                    : "text-forest-400 dark:text-[#5A6462]"
                }`}
              >
                Compare to
              </div>
              <div
                className={`flex font-[550] ${
                  compChain ? (AllChainsByKeys[compChain]?.darkTextOnBackground ? textColors.darkTextOnBackground : textColors.default) : "text-color-text-primary"
                } gap-x-[5px] justify-center items-center w-32`}
              >
                {compChain && <Icon icon={`gtp:${AllChainsByKeys[compChain]?.urlKey}-logo-monochrome`} className="w-[22px] h-[22px]" />}
                <div className="text-sm overflow-ellipsi truncate whitespace-nowrap">{compChain ? master.chains[compChain].name : "None"}</div>
              </div>
            </div>
            <div
              className="rounded-[40px] w-[54px] h-[44px] bg-forest-50 dark:bg-color-bg-default flex items-center justify-center z-[15] hover:cursor-pointer"
              onClick={handleNextCompChain}
              onMouseOver={() => preload(`${ChainsBaseURL}${nextChainKey}.json`, fetcher)}
            >
              <Icon icon="feather:arrow-right" className="w-6 h-6" />
            </div>
          </div>

          {/* Dropdown */}
          <div
            className={`flex flex-col absolute top-[27px] left-0 right-0 bg-forest-50 dark:bg-color-bg-default rounded-t-none border-0 border-b border-l border-r transition-all ease-in-out duration-300 ${
              compareTo
                ? `max-h-[${CompChains.length * 30 + 40}px] z-[25] border-transparent border-forest-200 dark:border-forest-500 rounded-b-2xl shadow-[0px_4px_46.2px_#00000066] dark:shadow-[0px_4px_46.2px_#000000]`
                : "max-h-0 z-20 overflow-hidden border-transparent rounded-b-[22px]"
            }`}
          >
            <div className="pb-[20px] lg:pb-[10px]">
              <div className="h-[10px] lg:h-[28px]"></div>
              <div
                className="flex pl-[21px] pr-[19px] lg:pr-[15px] py-[5px] gap-x-[10px] items-center text-base leading-[150%] cursor-pointer hover:bg-forest-200/30 dark:hover:bg-forest-500/10"
                onClick={() => {
                  setCompareTo(false);
                  delay(100).then(() => setChainKey([chainKey[0]]));
                }}
              >
                <Icon icon="feather:arrow-right-circle" className="w-6 h-6" visibility={compChain === null ? "visible" : "hidden"} />
                <div className="flex w-[22px] h-[22px] items-center justify-center">
                  <Icon
                    icon="feather:x"
                    className={`transition-all duration-300 ${compChain === null ? "w-[22px] h-[22px]" : "w-[15px] h-[15px]"}`}
                    style={{ color: compChain === null ? "" : "#5A6462" }}
                  />
                </div>
                <div>None</div>
              </div>
              {CompChains.sort((a: any, b: any) => master.chains[a.key].name.toLowerCase().localeCompare(master.chains[b.key].name.toLowerCase())).map(
                (chain: any, index: number) => (
                  <div
                    className="flex pl-[21px] pr-[15px] py-[5px] gap-x-[10px] items-center text-base leading-[150%] cursor-pointer hover:bg-forest-200/30 dark:hover:bg-forest-500/10"
                    onClick={() => {
                      setCompareTo(false);
                      delay(100).then(() => setChainKey([chainKey[0], chain.key]));
                    }}
                    key={index}
                    onMouseOver={() => {
                      setHoverChainKey(chain.key);
                      preload(`${ChainsBaseURL}${chain.key}.json`, fetcher);
                    }}
                    onMouseLeave={() => setHoverChainKey(null)}
                  >
                    <Icon icon="feather:arrow-right-circle" className="w-6 h-6" visibility={compChain === chain.key ? "visible" : "hidden"} />
                    <div className="flex w-[22px] h-[22px] items-center justify-center">
                      <Icon
                        icon={`gtp:${chain.urlKey}-logo-monochrome`}
                        className={`${compChain === chain.key ? "w-[22px] h-[22px]" : "w-[15px] h-[15px]"}`}
                        style={{
                          color: compChain === chain.key || hoverChainKey === chain.key ? AllChainsByKeys[chain.key]?.colors[theme ?? "dark"][0] : "#5A6462",
                        }}
                      />
                    </div>
                    <div>{master.chains[chain.key].name}</div>
                  </div>
                )
              )}
            </div>
          </div>
          {compareTo && <div className="fixed inset-0 z-20" onClick={() => setCompareTo(false)} />}
        </div>
      </div>

      {/* Controls */}
      <TopRowContainer className="relative mb-[15px]">
        <div className="flex flex-col relative h-full lg:h-[54px] w-full lg:w-fit -mt-[1px]">
          <TopRowParent>
            {availableIntervals.map((interval) => (
              <TopRowChild
                key={interval}
                isSelected={selectedTimeInterval === interval}
                onClick={() => startTransition(() => setSelectedTimeInterval(interval))}
                className="capitalize relative"
              >
                <span>{interval}</span>
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
                  : ["4q", "8q", "maxQ"].includes(timespan)
              )
              .map((timespan) => (
                <TopRowChild
                  key={timespan}
                  isSelected={selectedTimespan === timespan}
                  onClick={() => setSelectedTimespan(timespan)}
                  style={{
                    fontSize: isMobile ? "16px" : "",
                    paddingTop: isMobile ? "6px" : "",
                    paddingBottom: isMobile ? "6px" : "",
                  }}
                  className="py-[4px] xl:py-[13px]"
                >
                  <span className="hidden sm:block">{timespans[timespan].label}</span>
                  <span className="block text-xs sm:hidden">{timespans[timespan].shortLabel}</span>
                </TopRowChild>
              ))
          ) : (
            <div className="flex w-full gap-x-1">
              <button
                className="rounded-full flex items-center justify-center space-x-1 md:space-x-3 px-[16px] py-[3px] md:px-[15px] md:py-[6px] leading-[20px] md:leading-normal lg:px-[16px] lg:py-[11px] w-full lg:w-auto text-xs md:text-base font-medium border-[0.5px] border-forest-400"
                onClick={resetZoom}
              >
                <Icon icon="feather:zoom-out" className="w-4 h-4 md:w-5 md:h-5" />
                <div className="hidden md:block">Reset Zoom</div>
                <div className="block md:hidden">Reset</div>
              </button>
            </div>
          )}
        </TopRowParent>
      </TopRowContainer>

      {/* Charts Grid */}
      <div className={`flex flex-col gap-y-[15px] transition-opacity duration-150 ${isPending ? "opacity-60" : "opacity-100"}`}>
        {Object.keys(metricCategories)
          .filter((group) => group !== "gtpmetrics" && group !== "public-goods-funding" && group !== "developer")
          .map((categoryKey) => (
            <ChainSectionHead
              title={metricCategories[categoryKey].label}
              enableDropdown={true}
              defaultDropdown={true}
              key={categoryKey}
              icon={"gtp:" + categoryKey}
              childrenHeight={
                Math.round(
                  enabledFundamentalsKeys.filter((key) => getFundamentalsByKey[key]?.category === categoryKey).length / (isMobile ? 1 : 2)
                ) * 235
              }
            >
              <div className="wrapper h-auto w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 items-start relative gap-2">
                  {enabledFundamentalsKeys
                    .filter((key) => getFundamentalsByKey[key]?.category === categoryKey)
                    .map((key) => {
                      if (!Object.keys(data[0]?.metrics || {}).includes(key)) return null;

                      return (
                        <LazyChart key={key} height={224}>
                          <MetricChart
                            metricKey={key}
                            data={data}
                            chainKey={chainKey}
                            selectedTimeInterval={selectedTimeInterval}
                            selectedTimespan={selectedTimespan}
                            showUsd={showUsd}
                            theme={theme}
                            master={master}
                            AllChainsByKeys={AllChainsByKeys}
                            activeTimespan={activeTimespan}
                            zoomed={zoomed}
                            zoomMin={zoomMin}
                            zoomMax={zoomMax}
                            onZoomChange={handleZoomChange}
                            groupId="fundamentals-charts"
                            lineType={lineType}
                          />
                        </LazyChart>
                      );
                    })}
                </div>
              </div>
            </ChainSectionHead>
          ))}
      </div>
    </div>
  );
}
