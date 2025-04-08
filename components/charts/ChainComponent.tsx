"use client";

import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import highchartsAnnotations from "highcharts/modules/annotations";
// import highchartsDebug from "highcharts/modules/debugger";
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
import { useLocalStorage, useWindowSize, useIsMounted } from "usehooks-ts";
import fullScreen from "highcharts/modules/full-screen";
import _merge from "lodash/merge";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import Image from "next/image";
import d3 from "d3";
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


const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

const ChainComponent = memo(function ChainComponent({
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
  const isMounted = useIsMounted();
  const { isSidebarOpen, isSafariBrowser } = useUIContext();
  const { AllChainsByKeys } = useMaster();
  const { width, height } = useWindowSize();
  const { theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const metric_index = metricItems.findIndex((item) => item.key === category);
  const chartComponents = useRef<Highcharts.Chart[]>([]);

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

      let number = d3.format(`.2~s`)(val).replace(/G/, "B");

      if (isAxis) {
        if (selectedScale === "percentage") {
          number = d3.format(".2~s")(val).replace(/G/, "B") + "%";
        } else {
          if (showGwei(key) && showUsd) {
            // for small USD amounts, show 2 decimals
            if (val < 1) number = prefix + val.toFixed(2) + suffix;
            else if (val < 10)
              number =
                prefix + d3.format(".3s")(val).replace(/G/, "B") + suffix;
            else if (val < 100)
              number =
                prefix + d3.format(".4s")(val).replace(/G/, "B") + suffix;
            else
              number =
                prefix + d3.format(".2s")(val).replace(/G/, "B") + suffix;
          } else {
            number = prefix + d3.format(".2s")(val).replace(/G/, "B") + suffix;
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

  const onXAxisSetExtremes =
    useCallback<Highcharts.AxisSetExtremesEventCallbackFunction>(
      function (e: Highcharts.AxisSetExtremesEventObject) {
        // if (e.trigger === "pan") return;

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
    function (this: Highcharts.TooltipFormatterContextObject) {
      const { x, points } = this;



      if (!points || !x) return;

      const series = points[0].series;

      const date = new Date(x);
      const dateString = `
      <div>
        ${date.toLocaleDateString("en-GB", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      })}
      </div>
      `;

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-52 text-xs font-raleway"><div class="flex-1 font-bold text-[13px] md:text-[1rem] ml-6 mb-2 flex justify-between">${dateString}</div>`;
      const tooltipEnd = `</div>`;

      let pointsSum = 0;
      if (selectedScale !== "percentage")
        pointsSum = points.reduce((acc: number, point: any) => {
          acc += point.y;
          return pointsSum;
        }, 0);

      let tooltipPoints = points
        .sort((a: any, b: any) => b.y - a.y)
        .map((point: any) => {
          const { series, y, percentage } = point;
          const { name } = series;
          
          const label = name === "ethereum" ? AllChainsByKeys[name].name_short : AllChainsByKeys[name].label;
    
          if (selectedScale === "percentage")
            return `
              <div class="flex w-full space-x-2 items-center font-medium mb-1 ">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]
              }"></div>
                <!--
                <div class="tooltip-point-name">${label
              }</div>
                -->
                <div class="flex-1 text-right numbers-xs">${Highcharts.numberFormat(
                percentage,
                2,
              )}%</div>
              </div>
              <!-- <div class="flex ml-6 w-[calc(100% - 24rem)] relative mb-1">
                <div class="h-[2px] w-full bg-gray-200 rounded-full absolute left-0 top-0" > </div>

                <div class="h-[2px] rounded-full absolute left-0 top-0" style="width: ${Highcharts.numberFormat(
                percentage,
                2,
              )}%; background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]
              };"> </div>
              </div> -->`;

          const units = Object.keys(master.metrics[category].units);
          const unitKey =
            units.find((unit) => unit !== "usd" && unit !== "eth") ||
            (showUsd ? "usd" : "eth");
          const decimals =
            !showUsd && showGwei(category)
              ? 2
              : master.metrics[category].units[unitKey].decimals_tooltip;

          let prefix = displayValues[category].prefix;
          let suffix = displayValues[category].suffix;
          let value = y;

          if (
            !showUsd &&
            data.metrics[category].daily.types.includes("eth")
          ) {
            if (showGwei(category)) {
              prefix = "";
              suffix = " Gwei";
            }
          }

          return `
          <div class="flex w-full space-x-2 items-center justify-between font-medium mb-1">
            <div class="flex items-center gap-x-[5px]">
              <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]
              }"></div>
              
              <div class="tooltip-point-name text-xs">${label
              }</div>
            </div>
            <div class="flex-1 text-right justify-end numbers-xs flex">
                <div class="${!prefix && "hidden"
            }">${prefix}</div>
                ${parseFloat(value).toLocaleString("en-GB", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}
                <div class="ml-0.5 ${!suffix && "hidden"
            }">${suffix}</div>
            </div>
          </div>
          <!-- <div class="flex ml-4 w-[calc(100% - 1rem)] relative mb-1">
            <div class="h-[2px] w-full bg-gray-200 rounded-full absolute left-0 top-0" > </div>

            <div class="h-[2px] rounded-full absolute right-0 top-0" style="width: ${formatNumber(
              name,
              (y / pointsSum) * 100,
              false,
              false,
            )}%; background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]
            }33;"></div>
          </div> -->`;
        })
        .join("");

      if(points.length > 1) {
        let tooltipTotal = points.reduce((acc: number, point: any) => acc + (point.y || 0), 0);        
        
        tooltipPoints += `
          <div class="flex w-full h-[15px] mt-[5px] space-x-2 items-center font-medium mb-1">
            <div class="w-3.5 h-1.5 rounded-r-full" style="background-color: ${"transparent"
            }"></div>
            <div class="tooltip-point-name text-xs">${"Total"
            }</div>
            <div class="flex-1 text-right justify-end numbers-xs flex">
                <div class="${!prefixes[chain] && "hidden"
            }">${prefixes[chain]}</div>
                ${parseFloat(tooltipTotal).toLocaleString("en-GB", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
                <div class="ml-0.5 ${!prefixes[chain] && "hidden"
            }">${prefixes[chain]}</div>
            </div>
          </div>`
      }
      return tooltip + tooltipPoints + tooltipEnd;
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
    ],
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
        let tooltipX =
          pointX - distance - tooltipWidth < plotLeft - 120
            ? pointX + distance
            : pointX - tooltipWidth - distance;

        let tooltipY = pointY - tooltipHeight / 2;

        if (tooltipY > plotTop + plotHeight - tooltipHeight) {
          tooltipY = plotTop + plotHeight - tooltipHeight;
        }

        if (isMobile) {
          if (tooltipX < plotLeft) {
            tooltipX = pointX + distance;
          }
          return {
            x: tooltipX,
            y: 49,
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

          // set series state
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

      if (chartComponents.current && chartComponents.current.length > 0) {
        chartComponents.current.forEach((chart) => {
          if (!chart) return;

          // if (chart.index === hoveredChart.index) {
          // }

          if (event.type === "mouseOver" || event.type === "mouseMove") {
            if (chart.series[hoveredSeries.index]) {
              if (event.target !== null) {
                const pointerEvent =
                  event.target as unknown as Highcharts.PointerEventObject;

                const point =
                  chart.series[hoveredSeries.index].points.find(
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
                  // if this is the chart we are hovering
                  if (chart.index === hoveredChart.index) {
                    // // render rectangular hover box for datagrouping
                    // if (chart.HoverBox) {
                    //   try {
                    //     chart.HoverBox.attr("visibility", "hidden");
                    //   } catch (e) {
                    //     console.log(e);
                    //   }
                    // }
                    // // calculate width if weekly or monthly
                    // const boxWidth =
                    //   chart.plotWidth /
                    //   (timespans[selectedTimespan].daysDiff / 7);
                    // if (!chart.HoverBox) {
                    //   chart.HoverBox = chart.renderer
                    //     .rect(0, chart.plotTop, boxWidth, chart.plotHeight, 0)
                    //     .attr({
                    //       fill:
                    //         AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][0] +
                    //         "11",
                    //       zIndex: 100,
                    //     })
                    //     .add()
                    //     .toFront();
                    // } else {
                    //   chart.HoverBox.attr("visibility", "visible");
                    //   chart.HoverBox.attr(
                    //     "x",
                    //     simulatedPointerEvent.chartX - boxWidth / 2,
                    //   );
                    //   chart.HoverBox.attr("width", boxWidth);
                    // }
                  }

                  // else if this is not the chart we are hovering
                  else {
                    point.setState("hover");
                    chart.xAxis[0].drawCrosshair(simulatedPointerEvent);
                  }
                }

                return;
              }
            }
          }

          chart.xAxis[0].hideCrosshair();
          // if (chart.HoverBox) {
          //   try {
          //     chart.HoverBox.attr("visibility", "hidden");
          //   } catch (e) {
          //     console.log(e);
          //   }
          // }
          if (chart.index !== hoveredChart.index)
            chart.series[hoveredSeries.index].points.forEach((point) => {
              point.setState();
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
    // highchartsDebug(Highcharts);
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

  const lastPointLines = useMemo<{
    [key: string]: Highcharts.SVGElement[];
  }>(() => ({}), []);

  const resetXAxisExtremes = useCallback(() => {
    if (chartComponents.current && !zoomed) {
      chartComponents.current.forEach((chart) => {
        if (!chart) return;

        const pixelsPerDay =
          chart.plotWidth / timespans[selectedTimespan].daysDiff;

        // 15px padding on each side
        const paddingMilliseconds = (15 / pixelsPerDay) * 24 * 60 * 60 * 1000;

        chart.xAxis[0].setExtremes(
          timespans[selectedTimespan].xMin, //- paddingMilliseconds,
          timespans[selectedTimespan].xMax,
          isAnimate,
        );
      });
    }
  }, [isAnimate, selectedTimespan, timespans, zoomed]);

  const options: Highcharts.Options | any = useMemo(() => {
    return {
      accessibility: { enabled: false },
      exporting: { enabled: false },
      chart: {
        // displayErrors: false,
        type: "area",
        height: isMobile ? "146px" : "176px",
        // width: "100%",
        backgroundColor: undefined,
        margin: [1, 0, 0, 0],
        spacingBottom: 0,
        panning: { enabled: false },
        panKey: "shift",
        animation: forceNoAnimation.current ? false : isAnimate,
        zooming: {
          type: undefined,
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
          //@ts-ignore
          borderRadius: "0 0 15px 15px",
        },
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
          y: 11,
          x: 2,
          style: {
            gridLineColor:
              theme === "dark"
                ? "rgba(215, 223, 222, 0.33)"
                : "rgba(41, 51, 50, 0.33)",
            fontSize: "10px",
          },
        },
        // gridLineColor:
        //   theme === "dark"
        //     ? "rgba(215, 223, 222, 0.33)"
        //     : "rgba(41, 51, 50, 0.33)",
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
        min: zoomed ? zoomMin : timespans[selectedTimespan].xMin,
        max: zoomed ? zoomMax : timespans[selectedTimespan].xMax,
        tickPositions: getTickPositions(
          timespans[selectedTimespan].xMin,
          timespans[selectedTimespan].xMax,
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
          style: { color: COLORS.LABEL },
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
        // minPadding: 0.04,
        // maxPadding: 0.04,
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
        outside: isMobile ? false : true,
        formatter: tooltipFormatter,
        positioner: tooltipPositioner,
        split: false,
        followPointer: true,
        followTouchMove: true,
        backgroundColor: (theme === "dark" ? "#2A3433" : "#EAECEB") + "EE",
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
        area: {
          stacked: true,
          lineWidth: 2,
          // marker: {
          //   radius: 12,
          //   lineWidth: 4,
          // },
          fillOpacity: 1,
          
          // shadow: {
          //   color:
          //     AllChainsByKeys[data.chain_id]?.colors[theme ?? "dark"][1] + "33",
          //   width: 10,
          // },
          color: {
            linearGradient: {
              x1: 0,
              y1: 0,
              x2: 1,
              y2: 0,
            },
            stops: [
              [0, AllChainsByKeys[data.chain_id]?.colors[theme ?? "dark"][0]],
              // [0.33, AllChainsByKeys[series.name].colors[1]],
              [1, AllChainsByKeys[data.chain_id]?.colors[theme ?? "dark"][1]],
            ],
          },
          // borderColor: AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][0],
          // borderWidth: 1,
        },
        series: {
          stacking: "normal",
          zIndex: 10,
          animation: false,
          marker: {
            lineColor: "white",
            radius: 0,
            symbol: "circle",
          },
        },
      },
      navigator: {
        enabled: false,
      },
      rangeSelector: {
        enabled: false,
      },
      stockTools: {
        gui: {
          enabled: false,
        },
      },
      scrollbar: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
    };
  }, [
    data.chain_id,
    getTickPositions,
    isAnimate,
    isMobile,
    onXAxisSetExtremes,
    selectedTimespan,
    theme,
    timespans,
    tooltipFormatter,
    tooltipPositioner,
    zoomMax,
    zoomMin,
    zoomed,
    forceNoAnimation.current,
  ]);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const delayPromises = [];
 

  const onChartRender = (chart: Highcharts.Chart) => {
    if (!chart || !chart.series) return;

    // check if gradient exists
    if (!document.getElementById("gradient0")) {
      // add def containing linear gradient with stop colors for the circle
      chart.renderer.definition({
        attributes: {
          id: "gradient0",
          x1: "0%",
          y1: "0%",
          x2: "0%",
          y2: "100%",
        },
        children: [
          {
            tagName: "stop",
            // offset: "0%",

            attributes: {
              id: "stop1",
              offset: "0%",
            },
          },
          {
            tagName: "stop",
            // offset: "100%",
            attributes: {
              id: "stop2",
              offset: "100%",
            },
          },
        ],
        tagName: "linearGradient",
        textContent: "",
      });
      const stop1 = document.getElementById("stop1");
      const stop2 = document.getElementById("stop2");
      stop1?.setAttribute(
        "stop-color",
        AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][1],
      );
      stop1?.setAttribute("stop-opacity", "1");
      stop2?.setAttribute(
        "stop-color",
        AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][0],
      );
      stop2?.setAttribute("stop-opacity", "0.33");
    }

    // only 1 chart so setting const for i to = 0
    const i = 0;
    const index = chart.series.findIndex((s) => s.name === "all_l2s");

    // const chart: Highcharts.Chart = this;
    const lastPoint: Highcharts.Point =
      chart.series[index].points[chart.series[index].points.length - 1];

    // check if i exists as a key in lastPointLines
    if (!lastPointLines[i]) {
      lastPointLines[i] = [];
    }

    if (lastPointLines[i] && lastPointLines[i].length > 0) {
      lastPointLines[i].forEach((line) => {
        line.destroy();
      });
      lastPointLines[i] = [];
    }
    
    if (index === -1) {
      console.warn("Series 'all_l2s' not found in chart");
      return;
    }
    
    // Add safety check for series
    if (!chart.series[index] || !chart.series[index].points || chart.series[index].points.length === 0) {
      console.warn("No points found in series 'all_l2s'");
      return;
    }
    // calculate the fraction that 15px is in relation to the pixel width of the chart
    const fraction = 15 / chart.chartWidth;

    // create a bordered line from the last point to the top of the chart's container
    lastPointLines[i][lastPointLines[i].length] = chart.renderer
      .createElement("line")
      .attr({
        x1: chart.chartWidth * (1 - fraction) + 0.00005,
        y1: lastPoint.plotY ? lastPoint.plotY + chart.plotTop : 0,
        x2: chart.chartWidth * (1 - fraction) - 0.00005,
        y2: chart.plotTop / 2,
        stroke: isSafariBrowser
          ? AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][1]
          : "url('#gradient0')",
        "stroke-dasharray": "2",
        "stroke-width": 1,
        rendering: "crispEdges",
      })
      .add();

    lastPointLines[i][lastPointLines[i].length] = chart.renderer
      .createElement("line")
      .attr({
        x1: chart.chartWidth * (1 - fraction) + 0.5,
        y1: chart.plotTop / 2 + 0.00005,
        x2: chart.chartWidth * (1 - fraction),
        y2: chart.plotTop / 2,
        stroke: AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][1],
        "stroke-dasharray": 2,
        "stroke-width": 1,
        rendering: "crispEdges",
      })
      .add();

    // create a circle at the end of the line
    lastPointLines[i][lastPointLines[i].length] = chart.renderer
      .circle(chart.chartWidth * (1 - fraction), chart.plotTop / 2, 3)
      .attr({
        fill: AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][1],
        r: 4.5,
        zIndex: 9999,
        rendering: "crispEdges",
      })
      .add();

    // create a circle at the end of the line
    // lastPointLines[i][lastPointLines[i].length] = chart.renderer
    //   .circle(
    //     lastPoint.plotX,
    //     lastPoint.plotY ? lastPoint.plotY + chart.plotTop : 0,
    //     2,
    //   )
    //   .attr({
    //     stroke: "#CDD8D3",
    //     opacity: 0.44,
    //     r: 1,
    //     zIndex: 9999,
    //     rendering: "crispEdges",
    //   })
    //   .add();
  };

  const resituateChart = debounce(() => {
    if (chartComponents.current && !zoomed) {
      chartComponents.current.forEach((chart) => {
        isMounted() && chart && chart.setSize(null, null, false);
        isMounted() && chart && chart.reflow();
        isMounted() && chart && resetXAxisExtremes();

        // delay(0)
        //   .then(() => {
        //     isMounted() && chart && chart.setSize(null, null, false);
        //     // chart.reflow();
        //   })
        //   .then(() => {
        //     isMounted() && chart && chart.reflow();
        //   })
        //   .then(() => {
        //     isMounted() && chart && resetXAxisExtremes();
        //   });
      });
    }
  }, 500);

  useEffect(() => {
    resituateChart();

    // cancel the debounced function on component unmount
    return () => {
      resituateChart.cancel();
    };
  }, [width, height, isSidebarOpen, resituateChart]);

  const SourcesDisplay = useMemo(() => {
    return data.metrics[category].source &&
      data.metrics[category].source.length > 0 ? (
      (data.metrics[category].source as string[])
        .map<ReactNode>((s) => (
          <Link
            key={s}
            rel="noopener noreferrer"
            target="_blank"
            href={Sources[s] ?? ""}
            className="hover:text-forest-500 dark:hover:text-forest-500 underline"
          >
            {s}
          </Link>
        ))
        .reduce((prev, curr) => [prev, ", ", curr])
    ) : (
      <>Unavailable</>
    );
  }, [category, data.metrics]);

  const seriesConfig = useMemo(() => {
    return [
      {
        name: data.chain_id,
        crisp: true,
        data: filteredData.map(d => [d[0], d[1]]),
        showInLegend: false,
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
              AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][0] +
              "33",
            ],
            [
              1,
              AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][1] +
              "33",
            ],
          ],
        },
        marker: {
          enabled: false,
        },
        dataGrouping: {
          enabled: false,
        },
        point: {
          events: {
            mouseOver: pointHover,
            mouseOut: pointHover,
          },
        },
        states: {
          hover: {
            enabled: true,
            halo: {
              size: 5,
              opacity: 1,
              attributes: {
                fill:
                  AllChainsByKeys[data.chain_id]?.colors[
                  theme ?? "dark"
                  ][0] + "99",
                stroke:
                  AllChainsByKeys[data.chain_id]?.colors[
                  theme ?? "dark"
                  ][0] + "66",
              },
            },
            brightness: 0.3,
          },
          inactive: {
            enabled: true,
            opacity: 0.6,
          },
          selection: {
            enabled: false,
          },
        },
      },
      ((category !== "rent_paid")) && {
        visible: focusEnabled ? false : true,
        name: ethData.chain_id,
        crisp: true,
        data: filteredData.map(d => [d[0], d[2]]),
        showInLegend: false,
        marker: {
          enabled: false,
        },
        dataGrouping: {
          enabled: false,
        },
        color: AllChainsByKeys[ethData.chain_id]?.colors[theme ?? "dark"][0],
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
              AllChainsByKeys[ethData.chain_id].colors[theme ?? "dark"][0] +
              "33",
            ],
            [
              1,
              AllChainsByKeys[ethData.chain_id].colors[theme ?? "dark"][1] +
              "33",
            ],
          ],
        },
        point: {
          events: {
            mouseOver: pointHover,
            mouseOut: pointHover,
          },
        },
        states: {
          hover: {
            enabled: true,
            halo: {
              size: 5,
              opacity: 1,
              attributes: {
                fill:
                  AllChainsByKeys[ethData.chain_id]?.colors[
                  theme ?? "dark"
                  ][0] + "99",
                stroke:
                  AllChainsByKeys[ethData.chain_id]?.colors[
                  theme ?? "dark"
                  ][0] + "66",
              },
            },
            brightness: 0.3,
          },
          inactive: {
            enabled: true,
            opacity: 0.6,
          },
          selection: {
            enabled: false,
          },
        },
      },
    ].filter(Boolean);
  }, [data.chain_id, filteredData, AllChainsByKeys, theme, pointHover, category, focusEnabled, ethData.chain_id]);

  // Add this effect to detect focus changes and temporarily disable animations
  useEffect(() => {
    // When focusEnabled changes, disable animations temporarily
    forceNoAnimation.current = true;
    
    // Re-enable animations after data has been processed
    const timer = setTimeout(() => {
      forceNoAnimation.current = false;
    }, 600);
    
    return () => clearTimeout(timer);
  }, [focusEnabled]);

  return (
    <div
      key={category}
      className="w-full h-fit relative z-10"
      suppressHydrationWarning={true}
    >
      <div className="w-full h-[146px] md:h-[176px] relative">
        <div className="absolute w-full h-full bg-forest-50 dark:bg-[#1F2726] rounded-[15px]"></div>
        <div className="absolute w-full h-[146px] md:h-[176px]">
          <HighchartsReact
            containerProps={{
              className: isVisible ? "" : "hidden",
            }}
            highcharts={Highcharts}
            constructorType={"stockChart"}
            options={{
              ...options,
              chart: {
                ...options.chart,
                
                margin: zoomed ? zoomMargin : defaultMargin,
                events: {
                  // render: function () {
                  //   const chart = this;
                  // },
                  render: function () {
                    const chart = this;
                    onChartRender(chart);
                  },
                },
              },
              yAxis: {
                ...options.yAxis,

                labels: {
                  enabled: false,
                  ...(options.yAxis as Highcharts.YAxisOptions).labels,
                  formatter: function (
                    t: Highcharts.AxisLabelsFormatterContextObject,
                  ) {
                    return formatNumber(category, t.value, true);
                  },
                },
              },

              series: seriesConfig,
            }}
            ref={(chart) => {
              if (chart) {
                chartComponents.current[0] = chart.chart;
              }
            }}
          />
        </div>
        <div className="absolute top-[14px] w-full flex justify-between items-center px-[23px]">
          <div className="text-[20px] leading-snug font-bold">
            {metricItems[metric_index]?.page?.title}
          </div>
          <div className="numbers-lg leading-snug font-medium flex">
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
        <div className="flex absolute h-[40px] w-[320px] bottom-[7px] md:bottom-[16px] left-[36px] items-center gap-x-[6px] dark:text-[#CDD8D3] opacity-20 pointer-events-none">
          <Icon
            icon={getNavIcon(category)}
            className="w-[30px] h-[30px] md:w-[40px] md:h-[40px] text-forest-900 dark:text-forest-200"
          />
          <div className="text-[20px] md:text-[30px] font-bold text-forest-900 dark:text-forest-200">
            {getNavLabel(category).toUpperCase()}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-[2px] right-[6px]">
        {/* <Tooltip placement="left" allowInteract>
          <TooltipTrigger>
            <div className="p-0 -mr-0.5 z-30 opacity-40 hover:opacity-80">
              <Icon icon="feather:info" className="w-6 h-6" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="pr-0 z-50 flex items-center justify-center">
            <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto h-[80px] flex items-center">
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
});

ChainComponent.displayName = "ChainComponent";

export default ChainComponent;