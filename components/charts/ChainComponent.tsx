"use client";

import ReactECharts, { EChartsOption } from 'echarts-for-react';
import * as echarts from 'echarts';
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
  ReactNode,
  memo,
} from "react";

// ECharts color tokens - mirrors globals.css values for canvas rendering
// Canvas doesn't understand CSS variables, so we define them here matching globals.css
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

// Helper to get color with opacity
const withOpacity = (color: string, opacity: number): string => {
  return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
};
import { useLocalStorage, useWindowSize, useIsMounted, useResizeObserver } from "usehooks-ts";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { format as d3Format } from "d3"
import { debounce, forEach } from "lodash";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/layout/Tooltip";
import Link from "next/link";
import { Sources } from "@/lib/datasources";
import { metricItems, MetricItem, metricCategories } from "@/lib/metrics";
import { navigationItems, navigationCategories } from "@/lib/navigation";
import { useUIContext } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";
import ChartWatermark from "@/components/layout/ChartWatermark";
import { ChainsData } from "@/types/api/ChainResponse";
import { MasterResponse } from "@/types/api/MasterResponse";
import { useMaster } from "@/contexts/MasterContext";
import { GTPIcon } from '../layout/GTPIcon';
import { GTPIconName } from '@/icons/gtp-icon-names';
import { formatNumberWithSI } from '../layout/EthAgg/AggChart';
const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

const ChainComponent = function ChainComponent({
  data,
  ethData,
  focusEnabled,
  chain,
  category,
  selectedTimespan,
  selectedScale,
  master,
  xMin = new Date("2021-09-01").getTime(),
}: {
  data: ChainsData;
  ethData: ChainsData;
  focusEnabled: boolean;
  chain: string;
  category: string;
  selectedTimespan: string;
  selectedScale: string;
  master: MasterResponse;
  xMin?: number | null;
}) {
  // Keep track of the mounted state
  const { AllChainsByKeys } = useMaster();
  const { theme } = useTheme();
  // const isMobile = useMediaQuery("(max-width: 767px)");
  const isMobile = useUIContext((state) => state.isMobile);
  
  const isSidebarAnimating = useUIContext((state) => state.isSidebarAnimating);
  const isResizing = useUIContext((state) => state.isResizing);
  const isTransitioning = isSidebarAnimating || isResizing;

  // Get ECharts colors based on current theme
  const echartsColors = useMemo(() => {
    const colors = theme === 'dark' ? ECHARTS_COLORS.dark : ECHARTS_COLORS.light;
    return {
      ...colors,
      bgDefaultTransparent: withOpacity(colors.bgDefault, 0.95),
    };
  }, [theme]);

  const metric_index = metricItems.findIndex((item) => item.key === category);
  const chartComponents = useRef<echarts.ECharts[]>([]);
  const chartRef = useRef<ReactECharts>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Use resize observer to handle chart repositioning
  const { width: rawContainerWidth = 0, height: rawContainerHeight = 0 } = useResizeObserver({
    ref: chartContainerRef as React.RefObject<HTMLElement>,
    box: 'border-box',
  });

  // Freeze dimensions during transitions
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    // Only update dimensions when NOT transitioning
    if (!isTransitioning && rawContainerWidth > 0) {
      setContainerWidth(rawContainerWidth);
    }
  }, [rawContainerWidth, isTransitioning]);

  useEffect(() => {
    if (!isTransitioning && rawContainerHeight > 0) {
      setContainerHeight(rawContainerHeight);
    }
  }, [rawContainerHeight, isTransitioning]);

  const [zoomMargin, setZoomMargin] = useState([1, 15, 0, 0]);
  const [defaultMargin, setDefaultMargin] = useState([1, 15, 0, 0]);

  useEffect(() => {
    if (isMobile) {
      setZoomMargin([50, 15, 0, 0]);
      setDefaultMargin([50, 15, 0, 0]);
    } else {
      setZoomMargin([50, 15, 0, 0]);
      setDefaultMargin([50, 15, 0, 0]);
    }
  }, [isMobile]);

  const [zoomed, setZoomed] = useState(false);
  const [zoomMin, setZoomMin] = useState<number | null>(null);
  const [zoomMax, setZoomMax] = useState<number | null>(null);

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
 
  const [intervalShown, setIntervalShown] = useState<{
    min: number;
    max: number;
    num: number;
    label: string;
  } | null>(null);

  const timespans = useMemo(() => {
    let max;
    let min;
    let now = Date.now();

    Object.keys(data.metrics).forEach((key) => {
      const metric = data.metrics[key];
      const metricData = metric.daily.data;
      const metricMax = metricData[metricData.length - 1][0];
      const metricMin = metricData[0][0];

      if (!max || metricMax > max) max = metricMax;
      if (!min || metricMin < min) min = metricMin;
    });

    return {
      "90d": {
        label: "90 days",
        value: 90,
        xMin: max - 90 * 24 * 60 * 60 * 1000,
        xMax: max,
        daysDiff: 90,
      },
      "180d": {
        label: "180 days",
        value: 180,
        xMin: max - 180 * 24 * 60 * 60 * 1000,
        xMax: max,
        daysDiff: 180,
      },
      "365d": {
        label: "1 year",
        value: 365,
        xMin: max - 365 * 24 * 60 * 60 * 1000,
        xMax: max,
        daysDiff: 365,
      },
      max: {
        label: "Maximum",
        value: 0,
        xMin: min,
        xMax: max,
        daysDiff: Math.round((now - min) / (1000 * 60 * 60 * 24)),
      },
    };
  }, [data.metrics]);

  const showGwei = useCallback((metric_id: string) => {
    const item = metricItems.find((item) => item.key === metric_id);
    return item?.page?.showGwei;
  }, []);

  const prefixes = useMemo(() => {
    if (!data) return [];

    const p: {
      [key: string]: string;
    } = {};

    Object.keys(data.metrics).forEach((key) => {
      const types = data.metrics[key].daily.types;
      if (types.length > 2) {
        if (showUsd && types.includes("usd")) p[key] = "$";
        else p[key] = "Ξ";
      } else {
        p[key] = "";
      }
    });
    return p;
  }, [data, showUsd]);



  const formatNumber = useCallback(
    (key: string, value: number | string, isAxis = false, isMetric = true) => {
      let prefix = prefixes[key];
      let suffix = "";
      let val = parseFloat(value as string);
      
      
      if (
        !showUsd &&
        (isMetric ? data.metrics[key].daily.types.includes("eth") : true) &&
        selectedScale !== "percentage"
      ) {
        if (showGwei(key)) {
          prefix = "";
          suffix = " Gwei";
        }
      }

      let number = d3Format(`.2~s`)(val).replace(/G/, "B");

      if (isAxis) {
        if (selectedScale === "percentage") {
          number = d3Format(".2~s")(val).replace(/G/, "B") + "%";
        } else {
          if (showGwei(key) && showUsd) {
            // for small USD amounts, show 2 decimals
            if (val < 1) number = prefix + val.toFixed(2) + suffix;
            else if (val < 10)
              number =
                prefix + d3Format(".3s")(val).replace(/G/, "B") + suffix;
            else if (val < 100)
              number =
                prefix + d3Format(".4s")(val).replace(/G/, "B") + suffix;
            else
              number =
                prefix + d3Format(".2s")(val).replace(/G/, "B") + suffix;
          } else {
            number = prefix + d3Format(".2s")(val).replace(/G/, "B") + suffix;
          }
        }
      }

      return number;
    },
    [data.metrics, prefixes, selectedScale, showGwei, showUsd],
  );

  const minUnixAll = useMemo(() => {
    const minUnixtimes: number[] = [];
    Object.keys(data.metrics).forEach((key) => {
      minUnixtimes.push(data.metrics[key].daily.data[0][0]);
    });
    return Math.min(...minUnixtimes);
  }, [data]);

  const maxUnixAll = useMemo(() => {
    const maxUnixtimes: number[] = [];
    Object.keys(data.metrics).forEach((key) => {
      maxUnixtimes.push(
        data.metrics[key].daily.data[
        data.metrics[key].daily.data.length - 1
        ][0],
      );
    });
    return Math.max(...maxUnixtimes);
  }, [data]);

  const onDataZoom = useCallback(
    (params: any) => {
      if (!params || !params.batch) return;
      
      const batch = params.batch[0];
      if (!batch) return;

      const { startValue, endValue } = batch;
      const min = startValue;
      const max = endValue;

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

      if (minStartOfDay < minUnixAll) minStartOfDay = minUnixAll;
      if (maxStartOfDay > maxUnixAll) maxStartOfDay = maxUnixAll;

      numMilliseconds = maxStartOfDay - minStartOfDay;

      setZoomed(true);
      setZoomMin(minStartOfDay);
      setZoomMax(maxStartOfDay);

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

  const getTickPositions = useCallback(
    (xMin: any, xMax: any): number[] => {
      const tickPositions: number[] = [];
      const xMinDate = new Date(xMin);
      const xMaxDate = new Date(xMax);
      const xMinMonth = xMinDate.getUTCMonth();
      const xMaxMonth = xMaxDate.getUTCMonth();

      const xMinYear = xMinDate.getUTCFullYear();
      const xMaxYear = xMaxDate.getUTCFullYear();

      // // find first day of month greater than or equal to xMin

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

  const getNavIcon = useCallback(
    (key: string) => {
      const navItem = metricItems[metric_index];

      if (!navItem || !navItem.category) return null;

      return metricCategories[navItem.category]
        ? metricCategories[navItem.category].icon
        : null;
    },
    [metricItems],
  );

  const getNavLabel = useCallback(
    (key: string) => {
      const navItem = metricItems[metric_index];
      if (!navItem || !navItem.category) return null;

      return metricCategories[navItem.category]
        ? metricCategories[navItem.category].label
        : null;
    },
    [metricItems],
  );

  const filteredDataCache = useRef<{[key: string]: any[]}>({});

  // Disable animations when focus is changing
  const forceNoAnimation = useRef(false);
  
  const filteredData = useMemo(() => {
    // Check if datasets exist
    if (!data?.metrics?.[category]?.daily) {
      return [];
    }
    
    // Create a lightweight cache key to prevent unnecessary recalculations
    const cacheKey = `${category}-${showUsd}-${focusEnabled}`;
    
    // If we've already calculated this data combination, return from cache
    if (filteredDataCache.current[cacheKey]) {
      return filteredDataCache.current[cacheKey];
    }
    
    // Before heavy computation, disable animations
    forceNoAnimation.current = true;
    setTimeout(() => {
      forceNoAnimation.current = false;
    }, 600);
    
    // Get data from first source
    const firstDataset = data.metrics[category].daily.types.includes("eth")
      ? showUsd
        ? data.metrics[category].daily.data.map((d) => [
            d[0],
            d[data.metrics[category].daily.types.indexOf("usd")],
            0, // placeholder for the second dataset
          ])
        : data.metrics[category].daily.data.map((d) => [
            d[0],
            showGwei(category)
              ? d[data.metrics[category].daily.types.indexOf("eth")] * 1000000000
              : d[data.metrics[category].daily.types.indexOf("eth")],
            0, // placeholder for the second dataset
          ])
      : data.metrics[category].daily.data.map((d) => [
          d[0],
          d[1],
          0, // placeholder for the second dataset
        ]);
     
    // If focusEnabled is true or second dataset doesn't exist, just return the first dataset
    if (focusEnabled || !ethData?.metrics?.[category]?.daily) {
      const result = firstDataset.sort((a, b) => a[0] - b[0]);
      filteredDataCache.current[cacheKey] = result;
      return result;
    }
     
    // Get data from second source (ethData)
    const secondDataset = ethData.metrics[category].daily.types.includes("eth")
      ? showUsd
        ? ethData.metrics[category].daily.data.map((d) => [
            d[0],
            0, // placeholder for the first dataset
            d[ethData.metrics[category].daily.types.indexOf("usd")],
          ])
        : ethData.metrics[category].daily.data.map((d) => [
            d[0],
            0, // placeholder for the first dataset
            showGwei(category)
              ? d[ethData.metrics[category].daily.types.indexOf("eth")] * 1000000000
              : d[ethData.metrics[category].daily.types.indexOf("eth")],
          ])
      : ethData.metrics[category].daily.data.map((d) => [
          d[0],
          0, // placeholder for the first dataset
          d[1],
        ]);
     
    // Combine both datasets, keeping separate values
    const combinedMap = new Map();
     
    // Add first dataset to map
    firstDataset.forEach(([timestamp, value1]) => {
      combinedMap.set(timestamp, { value1: value1 || 0, value2: 0 });
    });
     
    // Add or update with second dataset
    secondDataset.forEach(([timestamp, _, value2]) => {
      if (combinedMap.has(timestamp)) {
        // Set the second value
        combinedMap.get(timestamp).value2 = value2 || 0;
      } else {
        combinedMap.set(timestamp, { value1: 0, value2: value2 || 0 });
      }
    });
     
    // Convert map back to array format [timestamp, value1, value2]
    const result = Array.from(combinedMap.entries())
      .map(([timestamp, { value1, value2 }]) => [
        timestamp,
        value1,
        value2
      ])
      .sort((a, b) => a[0] - b[0]);
    
    // Store in cache
    filteredDataCache.current[cacheKey] = result;
    return result;
  }, [data, ethData, category, showUsd, showGwei, focusEnabled]);

  const displayValues = useMemo(() => {
    const p: {
      [key: string]: {
        value: string;
        prefix: string;
        suffix: string;
      };
    } = {};
    
    Object.keys(data.metrics).forEach((key) => {
      const units = Object.keys(master.metrics[key].units);
      const unitKey =
        units.find((unit) => unit !== "usd" && unit !== "eth") ||
        (showUsd ? "usd" : "eth");
      let prefix = master.metrics[key].units[unitKey].prefix
        ? master.metrics[key].units[unitKey].prefix
        : "";
      let suffix = master.metrics[key].units[unitKey].suffix
        ? master.metrics[key].units[unitKey].suffix
        : "";
      let valueIndex = 1;
      let valueMultiplier = 1;
      let valueFormat = Intl.NumberFormat("en-GB", {
        notation: "compact",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });
      let navItem = metricItems[metric_index];
      
      if (master.metrics[key].units[unitKey].currency) {
        if (!showUsd) {
          valueIndex = data.metrics[key].daily.types.indexOf("eth");
          if (navItem && navItem.page?.showGwei) {
            prefix = "";
            suffix = " Gwei";
            valueMultiplier = 1000000000;
          }
        } else {
          valueIndex = data.metrics[key].daily.types.indexOf("usd");
        }
      }
      
      // Use filteredData for the current category, otherwise use original data
      let dataArray;
      let dateIndex;
      let valueToDisplay;
      
      if (key === category && filteredData.length > 0) {
        dataArray = filteredData;
        dateIndex = dataArray.length - 1;
        
        if (intervalShown) {
          const intervalMaxIndex = dataArray.findIndex(
            (d) => d[0] >= intervalShown?.max
          );
          if (intervalMaxIndex !== -1) dateIndex = intervalMaxIndex;
        }
        
        // Sum value1 and value2 for the combined value
        const value1 = dataArray[dateIndex][1] || 0;
        const value2 = !focusEnabled ? dataArray[dateIndex][2]  || 0 : 0;
        
        valueToDisplay = focusEnabled ? value1 : (value1 + value2);
      } else {
        dataArray = data.metrics[key].daily.data;
        dateIndex = dataArray.length - 1;
        
        if (intervalShown) {
          const intervalMaxIndex = dataArray.findIndex(
            (d) => d[0] >= intervalShown?.max
          );
          if (intervalMaxIndex !== -1) dateIndex = intervalMaxIndex;
        }
        
        valueToDisplay = dataArray[dateIndex][valueIndex];
      }
      
      let value = valueFormat.format(valueToDisplay * valueMultiplier);
      p[key] = { value, prefix, suffix };
    });
    
    return p;
  }, [data.metrics, filteredData, category, showUsd, intervalShown, focusEnabled, master.metrics, metric_index]);

  const tooltipFormatter = useCallback(
    (params: any) => {
      if (!params || !Array.isArray(params) || params.length === 0) return '';
  
      const x = params[0].value[0]; // timestamp
      const points = params;
  
      if (!points || !x) return '';
  
      const date = new Date(x);
      const dateString = date.toLocaleDateString("en-GB", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
  
      // Sort points by value (descending)
      points.sort((a: any, b: any) => b.value[1] - a.value[1]);
  
      // Calculate totals for percentage and bar calculations
      const pointsSum = points.reduce((acc: number, point: any) => 
        acc + point.value[1], 0);
      
      const maxPoint = points.reduce((max: number, point: any) => 
        Math.max(max, point.value[1]), 0);
      
      const maxPercentage = 100; // Since percentages go up to 100%
  
      // Get units and formatting settings
      const units = Object.keys(master.metrics[category].units);
      const unitKey = units.find((unit) => unit !== "usd" && unit !== "eth") ||
        (showUsd ? "usd" : "eth");
      
      const decimals = !showUsd && showGwei(category)
        ? 2
        : master.metrics[category].units[unitKey].decimals_tooltip;
  
      let prefix = displayValues[category].prefix;
      let suffix = displayValues[category].suffix;
  
      if (!showUsd && data.metrics[category].daily.types.includes("eth")) {
        if (showGwei(category)) {
          prefix = "";
          suffix = " Gwei";
        }
      }
  
      // Build tooltip points
      let tooltipPoints = points
        .map((point: any) => {
          const name = point.seriesName;
          const y = point.value[1];
          const percentage = pointsSum > 0 ? (y / pointsSum) * 100 : 0;
          
          const label = name === "ethereum" 
            ? AllChainsByKeys[name]?.name_short 
            : AllChainsByKeys[name]?.label;

          let colors = AllChainsByKeys[name]?.colors[theme ?? "dark"];

          if(name === "all_l2s") {
            colors = [
              "#FFDF27",
              "#FE5468"
            ];
          }
          if(name === "ethereum") {
            colors = [
              "#94ABD3",
              AllChainsByKeys[name]?.colors[theme ?? "dark"][0],
            ];
          }
  
          if (selectedScale === "percentage") {
            return `
              <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
                <div class="w-4 h-1.5 rounded-r-full" style="background: linear-gradient(180deg, ${colors[0]} 0%, ${colors[1]} 100%);"></div>
                <div class="tooltip-point-name text-xs">${label || name}</div>
                <div class="flex-1 text-right numbers-xs">${percentage.toFixed(2)}%</div>
              </div>
              <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
                style="width: ${(percentage / maxPercentage) * 100}%; background: linear-gradient(180deg, ${colors[0]} 0%, ${colors[1]} 100%);"></div>
              </div>`;
          }
  
          const value = y;
          const formattedValue = value.toLocaleString("en-GB", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
  
          return `
            <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
              <div class="w-4 h-1.5 rounded-r-full" style="background: linear-gradient(180deg, ${colors[0]} 0%, ${colors[1]} 100%);"></div>
              <div class="tooltip-point-name text-xs">${label || name}</div>
              <div class="flex-1 text-right justify-end numbers-xs flex">
                <div class="${!prefix && "hidden"}">${prefix}</div>
                ${formattedValue}
                <div class="ml-0.5 ${!suffix && "hidden"}">${suffix}</div>
              </div>
            </div>
            <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
              <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
              <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
              style="width: ${(Math.max(0, value) / maxPoint) * 100}%; background: linear-gradient(180deg, ${colors[0]} 0%, ${colors[1]} 100%);"></div>
            </div>`;
        })
        .join("");
  
      // Build the tooltip container
      const tooltip = `<div class="mt-3 mr-3 mb-3 min-w-[240px] md:min-w-[260px] text-xs font-raleway">
        <div class="flex justify-between items-center font-bold text-[13px] md:text-[1rem] ml-6 mb-2 gap-x-[15px]">
          <div>${dateString}</div>
          <div class="text-xs">${master.metrics[category].name}</div>
        </div>`;
  
      // Add total row if there are multiple points and not in percentage scale
      const sumRow = points.length > 1 && selectedScale !== "percentage"
        ? `<div class="flex w-full space-x-2 items-center font-medium mt-1.5 mb-0.5">
            <div class="w-4 h-1.5 rounded-r-full"></div>
            <div class="tooltip-point-name text-xs">Total</div>
            <div class="flex-1 text-right justify-end numbers-xs flex">
              <div class="${!prefix && "hidden"}">${prefix}</div>
              ${pointsSum.toLocaleString("en-GB", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              })}
              <div class="ml-0.5 ${!suffix && "hidden"}">${suffix}</div>
            </div>
          </div>
          <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
            <div class="h-[2px] rounded-none absolute right-0 -top-[3px] w-full bg-white/0"></div>
          </div>`
        : "";
  
      return tooltip + tooltipPoints + sumRow + "</div>";
    },
    [
      data.chain_id,
      data.metrics,
      displayValues,
      formatNumber,
      selectedScale,
      showGwei,
      showUsd,
      theme,
      AllChainsByKeys,
      master.metrics,
      category,
      prefixes,
      chain,
    ]
  );



  // const [isVisible, setIsVisible] = useState(true);
  const resizeTimeout = useRef<null | ReturnType<typeof setTimeout>>(null);
  const [isAnimate, setIsAnimate] = useState(false);
  const animationTimeout = useRef<null | ReturnType<typeof setTimeout>>(null);

  // const handleResize = () => {
  //   // Hide the element
  //   setIsVisible(false);

  //   // Set animation to false
  //   setIsAnimate(false);

  //   // Clear any existing timeouts
  //   if (resizeTimeout.current) {
  //     clearTimeout(resizeTimeout.current);
  //   }

  //   if (animationTimeout.current) {
  //     clearTimeout(animationTimeout.current);
  //   }

  //   // Set a timeout to show the element again after 500ms of no resizing
  //   resizeTimeout.current = setTimeout(() => {
  //     setIsVisible(true);
  //   }, 200);

  //   // Set a timeout to show the element again after 500ms of no resizing
  //   animationTimeout.current = setTimeout(() => {
  //     setIsAnimate(true);
  //   }, 500);
  // };

  // useEffect(() => {
  //   // highchartsDebug(Highcharts);
  //   window.addEventListener("resize", handleResize);

  //   animationTimeout.current = setTimeout(() => {
  //     setIsAnimate(true);
  //   }, 500);

  //   return () => {
  //     // Cleanup
  //     window.removeEventListener("resize", handleResize);
  //     if (resizeTimeout.current) {
  //       clearTimeout(resizeTimeout.current);
  //     }

  //     if (animationTimeout.current) {
  //       clearTimeout(animationTimeout.current);
  //     }
  //   };
  // }, []);



  const resetXAxisExtremes = useCallback(() => {
    if (chartRef.current && !zoomed) {
      const chartInstance = chartRef.current.getEchartsInstance();
      if (chartInstance) {
        chartInstance.setOption({
          xAxis: {
            min: timespans[selectedTimespan].xMin,
            max: timespans[selectedTimespan].xMax,
          },
        });
      }
    }
  }, [selectedTimespan, timespans, zoomed]);

  const options: any = useMemo(() => {
    if (isTransitioning) return null;
    // Define series configurations similar to AggChart
    const seriesConfigs = [
      ...(category !== "rent_paid" && !focusEnabled ? [{
        key: ethData.chain_id,
        name: ethData.chain_id,
        type: 'line',
        data: filteredData.map(d => [d[0], d[2]]),
        stacking: 'total',
      }] : []),
      {
        key: data.chain_id,
        name: 'all_l2s',
        type: 'line',
        data: filteredData.map(d => [d[0], d[1]]),
        stacking: 'total',
      }
    ];

    // Map series configurations with enhanced styling - matching AggChart pattern
    const series = seriesConfigs.map((config, index) => {
      const colors = AllChainsByKeys[config.key]?.colors[theme ?? "dark"] ?? AllChainsByKeys["all_l2s"]?.colors[theme ?? "dark"];

      const baseConfig: any = {
        name: config.name,
        type: config.type,
        data: config.data,
        stack: config.stacking,
        smooth: false,
        symbol: 'circle',
        symbolSize: 8, // Very small symbols for hover detection
        showSymbol: true,
        lineStyle: { 
          width: 2,
          color: config.name === 'all_l2s' ? {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#FFDF27' }, // Yellow at left
              { offset: 1, color: '#FE5468' }, // Red/pink at right
            ],
          } : colors[0]
        },
        itemStyle: {
          color: 'transparent', // Make normal symbols invisible
          borderWidth: 0,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, 
            config.name === 'all_l2s' ? [
              { offset: 0, color: colors[0] + "33" },
              { offset: 0.4, color: colors[0] + "33" },
              { offset: 1, color: colors[1] + "33" },
            ] : [
              { offset: 0, color: colors[0] + "33" },
              { offset: 1, color: colors[1] + "33" },
            ]
          )
        },
        emphasis: {
          symbolSize: 8,
          symbol: 'circle',
          itemStyle: {
            color: colors[1] + "80", // Series color with 50% opacity
            borderWidth: 0,
            shadowBlur: 0,
          }
        },
        animation: false, // Temporarily disable animations to test hover effects
      };

      return baseConfig;
    });

    return {
      animation: false, // Temporarily disable global animations to test hover effects
      grid: {
        top: isMobile ? 50 : 50,
        right: 15,
        bottom: 0,
        left: 0,
        containLabel: false,
      },
      xAxis: {
        type: 'time',
        show: false,
        min: zoomed ? zoomMin : timespans[selectedTimespan].xMin,
        max: zoomed ? zoomMax : timespans[selectedTimespan].xMax,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        splitNumber: 2,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          show: true,
          lineStyle: { 
            // color: '#5A64624F',
            // top, bottom, left, right
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#5A646200' },
              { offset: 0.2, color: '#5A64624F' },
              { offset: 1, color: '#5A64624F' }
            ]),
            width: 1
          }
        },
        axisLabel: {
          show: true,
          margin: -1,
          padding: [3, 0, 0, 2],
          color: echartsColors.textPrimary,
          fontSize: isMobile ? 7 : 8,
          fontWeight: 500,
          fontFamily: 'var(--font-fira-sans), sans-serif !important;',
          align: 'left',
          verticalAlign: 'top',
          formatter: (value: number) => {
            return displayValues[category].prefix + formatNumberWithSI(value);
          }
        }
      },
      tooltip: {
        show: true,
        trigger: 'axis',
        triggerOn: 'mousemove|click', // Add click for mobile support
        backgroundColor: echartsColors.bgDefaultTransparent,
        shadowColor: echartsColors.uiShadow,
        shadowBlur: 27,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        borderWidth: 0,
        borderRadius: 17,
        padding: 0,
        textStyle: {
          color: echartsColors.textPrimary,
        },
        formatter: tooltipFormatter,
        confine: isMobile ? true : false,
        appendToBody: isMobile ? false : true,
        transitionDuration: 0.3, // Instant hide/show
        hideDelay: 0.3, // Hide immediately when conditions are met
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: "#CDD8D399",
            width: 1,
            type: 'solid'
          }
        },
        position: function (point: [number, number], params: EChartsOption['tooltip']['position'], dom: HTMLDivElement, rect: EChartsOption['grid']['rect'], size: {contentSize: [number, number], viewSize: [number, number]}) {
          const { contentSize, viewSize } = size;
          const [contentWidth, contentHeight] = contentSize;
          const [viewWidth, viewHeight] = viewSize;
          
          
          const distance = 20;
          const pointX = point[0];
          const pointY = point[1];
          const sizeX = size.viewSize[0];
          const sizeY = size.viewSize[1];

          if (isMobile) {
            let tooltipX = pointX - contentWidth / 2;
            // if on the left side of the chart, move to the right
            if (pointX < sizeX/2) {
              tooltipX = pointX + distance;
            }

            if(pointX > sizeX/2) {
              tooltipX = pointX - contentWidth - distance;
            }
            
            return [tooltipX, 0];
          }
          
          let tooltipX = pointX - distance;
          let tooltipY = pointY - contentHeight/2;

          // if on the left side of the chart, move to the right
          if (pointX < sizeX/2) {
            tooltipX = pointX + distance;
          }

          if(pointX > sizeX/2) {
            tooltipX = pointX - contentWidth - distance;
          }

          return [tooltipX, tooltipY];
        },
      },
      dataZoom: [
        {
          type: 'inside',
          disabled: true,
          start: 0,
          end: 100,
        },
      ],
      series,
    };
  }, [
    displayValues,
    data.chain_id,
    isMobile,
    selectedTimespan,
    theme,
    timespans,
    tooltipFormatter,
    zoomMax,
    zoomMin,
    zoomed,
    filteredData,
    AllChainsByKeys,
    category,
    focusEnabled,
    ethData.chain_id,
    echartsColors,
    isTransitioning,
  ]);

  const getGraphicElements = useCallback(() => {
    // if (isTransitioning) return [];

    if (!chartRef.current || !filteredData.length || !containerWidth || !containerHeight) return [];

    const chartInstance = chartRef.current.getEchartsInstance();
    if (!chartInstance) return [];

    const chartWidth = containerWidth || chartInstance.getWidth();
    const chartHeight = containerHeight || chartInstance.getHeight();
    
    // Get chart area bounds
    const gridLeft = 0;
    const gridRight = chartWidth - 15; // Account for right margin
    const gridTop = isMobile ? 50 : 50;
    const gridBottom = chartHeight - (isMobile ? 0 : 0);
    const gridHeightUsable = gridBottom - gridTop;
    
    // Get the last data point
    const lastDataPoint = filteredData[filteredData.length - 1];
    if (!lastDataPoint) return [];

    // Calculate the actual y-position for the all_l2s series (considering stacking)
    // For stacked areas, all_l2s appears on top, so we need the cumulative value
    const all_l2sValue = lastDataPoint[1] || 0;
    const ethereumValue = (!focusEnabled && category !== "rent_paid") ? (lastDataPoint[2] || 0) : 0;
    const cumulativeValue = all_l2sValue + ethereumValue;

    // Convert data coordinates to pixel coordinates using the cumulative value
    const pixelPoint = chartInstance.convertToPixel('grid', [lastDataPoint[0], cumulativeValue]);
    if (!pixelPoint) return [];

    const fraction = 15 / chartWidth;
    const lineX = chartWidth * (1 - fraction);
    const lineStartY = pixelPoint[1];
    const lineEndY = 25;

    const gridLineColor = theme === "dark" ? "rgba(215, 223, 222, 0.8)" : "rgba(41, 51, 50, 0.8)";

    return [

      // Dashed line from last point to top with horizontal gradient
      {
        type: 'line',
        shape: {
          x1: lineX,
          y1: lineStartY,
          x2: lineX,
          y2: lineEndY,
        },
        style: {
          stroke: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: theme !== 'dark' ? 'rgb(31 39 38)' : 'rgb(205 216 211)', // Yellow at left
              },
              {
                offset: 1,
                color: theme !== 'dark' ? 'rgb(31 39 38)' : 'rgb(205 216 211)', // Red/pink at right
              },
            ],
          },
          lineDash: [2, 2],
          lineWidth: 1,
        },
        z: 10,
      },
      // Circle at the end of the line
      {
        type: 'circle',
        shape: {
          cx: lineX,
          cy: lineEndY,
          r: 4.5,
        },
        style: {
          fill: theme !== 'dark' ? 'rgb(31 39 38)' : 'rgb(205 216 211)', // Red to match the right side of the gradient
        },
        z: 11,
      },
    ];
  }, [filteredData, data.chain_id, theme, AllChainsByKeys, isMobile, containerWidth, containerHeight]);

  // const resituateChart = debounce(() => {
  //   if (chartRef.current && !zoomed) {
  //     const chartInstance = chartRef.current.getEchartsInstance();
  //     if (isMounted() && chartInstance) {
  //       chartInstance.resize();
  //       resetXAxisExtremes();
  //     }
  //   }
  // }, 500);

  // useEffect(() => {
  //   resituateChart();

  //   // cancel the debounced function on component unmount
  //   return () => {
  //     resituateChart.cancel();
  //   };
  // }, [width, height, isSidebarOpen, resituateChart]);

  // Handle container size changes and update graphic elements
  // useEffect(() => {
  //   // Skip updates during transitions
  //   if (isTransitioning) return;
    
  //   if (chartRef.current && containerWidth && containerHeight) {
  //     const chartInstance = chartRef.current.getEchartsInstance();
  //     if (chartInstance) {
  //       setTimeout(() => {
  //         chartInstance.setOption({
  //           graphic: getGraphicElements(),
  //         });
  //       }, 100);
  //     }
  //   }
  // }, [containerWidth, containerHeight, getGraphicElements, isTransitioning]);

  // const SourcesDisplay = useMemo(() => {
  //   return data.metrics[category].source &&
  //     data.metrics[category].source.length > 0 ? (
  //     (data.metrics[category].source as string[])
  //       .map<ReactNode>((s) => (
  //         <Link
  //           key={s}
  //           rel="noopener noreferrer"
  //           target="_blank"
  //           href={Sources[s] ?? ""}
  //           className="hover:text-color-text-primary dark:hover:text-color-text-primary underline"
  //         >
  //           {s}
  //         </Link>
  //       ))
  //       .reduce((prev, curr) => [prev, ", ", curr])
  //   ) : (
  //     <>Unavailable</>
  //   );
  // }, [category, data.metrics]);



  // Add this effect to detect focus changes and temporarily disable animations
  // useEffect(() => {
  //   // When focusEnabled changes, disable animations temporarily
  //   forceNoAnimation.current = true;
    
  //   // Re-enable animations after data has been processed
  //   const timer = setTimeout(() => {
  //     forceNoAnimation.current = false;
  //   }, 600);
    
  //   return () => clearTimeout(timer);
  // }, [focusEnabled]);

  const urlKey =
  metricItems[metricItems.findIndex((item) => item.key === category)]
    ?.urlKey;



  return (
    <div
      key={category}
      className="w-full h-fit relative z-10"
      suppressHydrationWarning={true}
    >
      <div className="w-full h-[146px] md:h-[176px] relative" ref={chartContainerRef}>
        <div className="absolute w-full h-full bg-color-bg-default rounded-[15px]"></div>
        <div className="absolute w-full h-[146px] md:h-[176px]">
          <ReactECharts
            ref={chartRef}
            opts={{
              devicePixelRatio: window.devicePixelRatio || 1,
            }}
            option={{
              ...options,
              graphic: getGraphicElements(),
            }}
            style={{
              height: isMobile ? "146px" : "176px",
              width: "100%",
              display: isTransitioning ? "none" : "block",
 
            }}
            onEvents={{
              dataZoom: onDataZoom,
              render: (params: any) => {
                // Chart render finished, update graphic elements
                if (chartRef.current) {
                  const chartInstance = chartRef.current.getEchartsInstance();
                  if (chartInstance) {
                    setTimeout(() => {
                    chartInstance.setOption({
                      graphic: getGraphicElements(),
                    });
                    }, 100);
                  }
                }
              },
            }}
            className='rounded-b-[15px] overflow-hidden'
            // notMerge={false} 
            // lazyUpdate={true}
          />
        </div>
        <div className="absolute top-[15px] w-full flex justify-between items-start pl-[15px] pr-[23px]">
          <Link href={`/fundamentals/${urlKey}`} className="flex gap-x-[10px] items-center">
            <div className="heading-large-sm leading-snug">
              {metricItems[metric_index]?.page?.title}
            </div>
            <GTPIcon 
              icon={"feather:arrow-right" as GTPIconName} 
              size="sm" className="!size-[11px]" 
              containerClassName='!size-[15px] flex items-center justify-center bg-color-bg-medium rounded-full' 
            />
          </Link>
          <div className="numbers-lg leading-snug h-[20px] font-medium flex items-center">
            <div>{displayValues[category].prefix}</div>
            <div>{displayValues[category].value}</div>
            <div className="text-base pl-0.5">
              {displayValues[category].suffix}
            </div>
          </div>
          {/* <div
            className={`absolute -bottom-[12px] top-1/2 right-[15px] w-[5px] rounded-sm border-r border-t`}
            style={{
              borderColor: "#4B5563",
            }}
          ></div>
          <div
            className={`absolute top-[calc(50% - 0.5px)] right-[20px] w-[4px] h-[4px] rounded-full bg-forest-900 dark:bg-forest-50`}
          ></div> */}
        </div>
        {/* <div className="flex absolute h-[40px] w-[320px] bottom-[7px] md:bottom-[16px] left-[36px] items-center gap-x-[6px] dark:text-color-text-primary opacity-20 pointer-events-none">
          <Icon
            icon={getNavIcon(category)}
            className="w-[30px] h-[30px] md:w-[40px] md:h-[40px] text-forest-900 dark:text-forest-200"
          />
          <div className="text-[20px] md:text-[30px] font-bold text-forest-900 dark:text-forest-200">
            {getNavLabel(category).toUpperCase()}
          </div>
        </div> */}
        <div className="absolute  bottom-0 top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-20">
            <ChartWatermark className="w-[96px] md:w-[128.67px] text-forest-300 dark:text-[#EAECEB]" />
        </div>
        {/* <div className="absolute bottom-[120px] left-0 right-0 h-[1px] bg-[#5A64624F] mr-[15px]"  />
        <div className="absolute bottom-[62px] left-0 right-0 h-[1px] bg-[#5A64624F] mr-[15px]" /> */}
      </div>
      <div className="absolute -bottom-[2px] right-[6px]">
        {/* <Tooltip placement="left" allowInteract>
          <TooltipTrigger>
            <div className="p-0 -mr-0.5 z-30 opacity-40 hover:opacity-80">
              <Icon icon="feather:info" className="w-6 h-6" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="pr-0 z-50 flex items-center justify-center">
            <div className="px-3 text-sm font-medium bg-color-bg-default dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto h-[80px] flex items-center">
              <div className="flex flex-col space-y-1">
                <div className="font-bold text-sm leading-snug">
                  Data Sources:
                </div>
                <div className="flex space-x-1 flex-wrap font-medium text-xs leading-snug">
                  {SourcesDisplay}
                </div>
                <div className="flex space-x-1 flex-wrap font-medium text-[0.6rem]">
                  Displaying 7-day average
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip> */}
      </div>
    </div>
  );
};


export default ChainComponent;
