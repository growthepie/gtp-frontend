"use client";
import { DurationData, DailyData } from "@/types/api/EconomicsResponse";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  use,
  useLayoutEffect,
} from "react";
import Highcharts, {
  AxisLabelsFormatterContextObject,
} from "highcharts/highstock";
import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsPatternFill from "highcharts/modules/pattern-fill";
import highchartsRoundedCorners from "highcharts-rounded-corners";
import addHighchartsMore from "highcharts/highcharts-more";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { AxisTickPositionerCallbackFunction } from "highcharts";
import {
  HighchartsProvider,
  HighchartsChart,
  Chart,
  XAxis,
  YAxis,
  Title,
  Subtitle,
  Legend,
  LineSeries,
  SplineSeries,
  AreaSplineSeries,
  Tooltip,
  AreaRangeSeries,
  PlotBand,
  PlotLine,
  withHighcharts,
  ColumnSeries,
  Series,
} from "react-jsx-highcharts";
import { useUIContext, useHighchartsWrappers } from "@/contexts/UIContext";
import { useMaster } from "@/contexts/MasterContext";
import { times } from "lodash";
import { useMetricSeries } from "./MetricSeriesContext";
import { useMetricData } from "./MetricDataContext";
import { useMetricChartControls } from "./MetricChartControlsContext";
import "@/app/highcharts.axis.css";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import { metricItems } from "@/lib/metrics";
import { format as d3Format } from "d3"
import { useTheme } from "next-themes";
import { BASE_URL } from "@/lib/helpers";
import EmbedContainer from "@/app/(embeds)/embed/EmbedContainer";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

const baseOptions: Highcharts.Options = {
  accessibility: { enabled: false },
  exporting: { enabled: false },
  chart: {
    type: "column",
    animation: true,
    backgroundColor: "transparent",
    showAxes: false,
    panKey: "shift",
  },
  title: undefined,
  yAxis: {
    title: { text: undefined },
    labels: {
      enabled: true,
    },
    gridLineWidth: 1,
    gridLineColor: COLORS.GRID,
  },
  xAxis: {
    type: "datetime",
    lineWidth: 0,
    crosshair: {
      width: 0.5,
      color: COLORS.PLOT_LINE,
      snap: false,
    },
    // labels: {
    //   style: { color: COLORS.LABEL },
    //   enabled: true,
    //   formatter: (item) => {
    //     const date = new Date(item.value);
    //     const isMonthStart = date.getDate() === 1;
    //     const isYearStart = isMonthStart && date.getMonth() === 0;

    //     if (isYearStart) {
    //       return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
    //     } else {
    //       return `<span style="">${date.toLocaleDateString("en-GB", {
    //         timeZone: "UTC",
    //         month: "short",
    //       })}</span>`;
    //     }
    //   },
    // },

    gridLineWidth: 0,
  },
  legend: {
    enabled: false,
    useHTML: false,
    symbolWidth: 0,
  },
  tooltip: {
    // backgroundColor: 'transparent',
    useHTML: true,
    shadow: false,
    shared: true,
  },
  plotOptions: {
    column: {
      grouping: false,
      stacking: "normal",
      events: {
        legendItemClick: function () {
          return false;
        },
      },
      groupPadding: 0,
      animation: false,
    },
    series: {
      stacking: "normal",
      events: {
        legendItemClick: function () {
          return false;
        },
      },
      marker: {
        lineColor: "white",
        radius: 0,
        symbol: "circle",
      },
      shadow: false,
      animation: false,
    },
  },
  credits: {
    enabled: false,
  },
  navigation: {
    buttonOptions: {
      enabled: false,
    },
  },
};


const monthly_agg_labels = {
  avg: "Average",
  sum: "Total",
  unique: "Distinct",
  distinct: "Distinct",
};

const EmbedUrlsMap = {
  fundamentals: `${BASE_URL}/embed/fundamentals/`,
  "data-availability": `${BASE_URL}/embed/data-availability/`,
};

const MetricInfoKeyMap = {
  fundamentals: "metrics",
  "data-availability": "da_layers",
};

type MetricChartProps = {
  is_embed?: boolean;
  embed_zoomed?: boolean;
  embed_start_timestamp?: number;
  embed_end_timestamp?: number;
  type?: string;
}

function MetricChart({
  is_embed = false,
  embed_zoomed = false,
  embed_start_timestamp,
  embed_end_timestamp,
  type = "fundamentals",
}: MetricChartProps) {

  useHighchartsWrappers();

  const { theme } = useTheme();
  const { isSidebarOpen, isMobile, setEmbedData, embedData } = useUIContext();
  const { AllChainsByKeys, data: master, formatMetric, getUnits } = useMaster();
  const { timespans, metric_id, minDailyUnix, maxDailyUnix, monthly_agg, avg } = useMetricData();
  const {
    selectedTimespan,
    selectedTimeInterval,
    selectedScale,
    showEthereumMainnet,
    zoomed,
    zoomMin,
    zoomMax,
    setZoomed,
    setZoomMin,
    setZoomMax,
    timeIntervalKey,
    intervalShown,
    setIntervalShown,

  } = useMetricChartControls();


  const { seriesData } = useMetricSeries();

  const [showUsd, setShowUsd] = useSessionStorage("showUsd", true);

  const navItem = useMemo(() => {
    return metricItems.find((item) => item.key === metric_id);
    //return navigationItems[1].options.find((item) => item.key === metric_id);
  }, [metric_id]);

  const urlKey = useMemo(() => {
    if (!navItem) return null;

    return navItem.urlKey;
  }, [navItem]);

  const [showGwei, reversePerformer] = useMemo(() => {

    if (!navItem) return [false, false];

    return [navItem.page?.showGwei, navItem.page?.reversePerformer];
  }, [navItem]);

  useEffect(() => {
    const startTimestamp = zoomed ? zoomMin : undefined;
    const endTimestamp = zoomed ? zoomMax : maxDailyUnix.valueOf();

    const vars = {
      showUsd: showUsd ? "true" : "false",
      theme: theme ? theme : "dark",
      timespan: selectedTimespan,
      scale: selectedScale,
      interval: selectedTimeInterval,
      showMainnet: showEthereumMainnet ? "true" : "false",
      chains: seriesData.map((d) => d.name).join(","),
    };

    const absoluteVars = {
      zoomed: zoomed ? "true" : "false",
      startTimestamp: startTimestamp ? startTimestamp.toString() : "",
      endTimestamp: endTimestamp ? endTimestamp.toString() : "",
    };

    let src =
      EmbedUrlsMap[type] +
      navItem?.urlKey +
      "?" +
      new URLSearchParams(vars).toString();
    if (embedData.timeframe === "absolute") {
      src += "&" + new URLSearchParams(absoluteVars).toString();
    }

    setEmbedData((prevEmbedData) => ({
      ...prevEmbedData,
      title: navItem?.label + " - growthepie",
      src: src,
      zoomed: zoomed,
      timeframe: zoomed ? "absolute" : embedData.timeframe,
    }));
  }, [
    embedData.timeframe,
    seriesData,
    maxDailyUnix,
    navItem?.label,
    navItem?.urlKey,
    selectedScale,
    selectedTimeInterval,
    selectedTimespan,
    showEthereumMainnet,
    showGwei,
    showUsd,
    theme,
    timespans,
    zoomMax,
    zoomMin,
    zoomed,
  ]);

  const yScale: string = "linear";

  const valuePrefix = useMemo(() => {
    if (seriesData[0].types.includes("usd")) {
      if (!showUsd) return "Ξ";
      else return "$";
    } else {
      return "";
    }
  }, [showUsd, seriesData]);


  const getSeriesType = (scale: string) => {
    switch (scale) {
      case "absolute":
        return "line";
      case "logarithmic":
        return "line";
      case "stacked":
        return "area";
      case "percentage":
        return "area";
      case "percentageDecimal":
        return "area";
      default:
        return "line";
    }
  }

  const getPlotOptions = (scale: string) => {
    switch (scale) {
      case "absolute":
        return {
          line: {
            stacking: undefined,
          },
          area: {
            stacking: undefined,
          },
        };
      case "percentage":
        return {
          line: {
            stacking: "percent",
          },
          area: {
            stacking: "percent",
          },
        };
      case "stacked":
        return {
          column: {
            stacking: "normal",
            crisp: false,
          },
          area: {
            stacking: "normal",
          },
        };
      default:
        return {
          column: {
            stacking: "normal",
          },
          line: {
            stacking: undefined,
          },
          area: {
            stacking: undefined,
          },
        };
    }
  }

  const seriesType = getSeriesType(selectedScale);
  const plotOptions = {
    column: {
      grouping: false,
      stacking: "normal",
      events: {
        legendItemClick: function () {
          return false;
        },
      },
      groupPadding: 0,
      animation: false,
    },
    series: {
      stacking: "normal",
      events: {
        legendItemClick: function () {
          return false;
        },
      },
      marker: {
        lineColor: "white",
        radius: 0,
        symbol: "circle",
      },
      shadow: false,
      animation: false,
    },
    ...getPlotOptions(selectedScale),
  };

  console.log("timeIntervalKey", timeIntervalKey);

  useEffect(() => {
    const startTimestamp = zoomed ? zoomMin : undefined;
    const endTimestamp = zoomed ? zoomMax : maxDailyUnix.valueOf();

    const vars = {
      showUsd: showUsd ? "true" : "false",
      theme: theme ? theme : "dark",
      timespan: selectedTimespan,
      scale: selectedScale,
      interval: selectedTimeInterval,
      showMainnet: showEthereumMainnet ? "true" : "false",
      chains: seriesData.map((d) => d.name).join(","),
    };

    const absoluteVars = {
      zoomed: zoomed ? "true" : "false",
      startTimestamp: startTimestamp ? startTimestamp.toString() : "",
      endTimestamp: endTimestamp ? endTimestamp.toString() : "",
    };

    let src =
      BASE_URL +
      "/embed/fundamentals/" +
      navItem?.urlKey +
      "?" +
      new URLSearchParams(vars).toString();
    if (embedData.timeframe === "absolute") {
      src += "&" + new URLSearchParams(absoluteVars).toString();
    }

    setEmbedData((prevEmbedData) => ({
      ...prevEmbedData,
      title: navItem?.label + " - growthepie",
      src: src,
      zoomed: zoomed,
      timeframe: zoomed ? "absolute" : embedData.timeframe,
    }));
  }, [
    embedData.timeframe,
    seriesData,
    maxDailyUnix,
    navItem?.label,
    navItem?.urlKey,
    selectedScale,
    selectedTimeInterval,
    selectedTimespan,
    showEthereumMainnet,
    showGwei,
    showUsd,
    theme,
    timespans,
    zoomMax,
    zoomMin,
    zoomed,
  ]);

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });
    highchartsRoundedCorners(Highcharts);
    highchartsAnnotations(Highcharts);
    highchartsPatternFill(Highcharts);

    // update x-axis label sizes if it is a 4 digit number
    Highcharts.wrap(
      Highcharts.Axis.prototype,
      "renderTick",
      function (proceed) {
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        const axis: Highcharts.Axis = this;
        const ticks: Highcharts.Dictionary<Highcharts.Tick> = axis.ticks;
        if (
          axis.isXAxis &&
          axis.options.labels &&
          axis.options.labels.enabled
        ) {
          Object.keys(ticks).forEach((tick) => {
            const tickLabel = ticks[tick].label;
            if (!tickLabel) return;
            const tickValue = tickLabel.element.textContent;
            if (tickValue) {
              if (tickValue.length === 4) {
                tickLabel.css({
                  transform: "scale(1.4)",
                  fontWeight: "600",
                });
              }
            }
          });
        }
      },
    );

  }, []);

  // useEffect(() => {
  //   if (chartComponent.current) {
  //     if (!zoomed)
  //       chartComponent.current.xAxis[0].setExtremes(
  //         timespans[selectedTimespan].xMin,
  //         timespans[selectedTimespan].xMax,
  //       );
  //   }
  // }, [selectedTimespan, timespans, zoomed]);

  const [selectedTimespansByTimeInterval, setSelectedTimespansByTimeInterval] =
    useSessionStorage("selectedTimespansByTimeInterval", {
      daily: "365d",
      monthly: "12m",
      [selectedTimeInterval]: selectedTimespan,
    });

  // update selectedTimespanByTimeInterval if selectedTimespan or selectedTimeInterval changes
  useEffect(() => {
    setSelectedTimespansByTimeInterval((prev) => ({
      ...prev,
      [selectedTimeInterval]: selectedTimespan,
    }));
  }, [
    selectedTimeInterval,
    selectedTimespan,
    setSelectedTimespansByTimeInterval,
  ]);

  const [containerRef, { width, height }] = useElementSizeObserver();
  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);

  function shortenNumber(number) {
    let numberStr = Math.floor(number).toString();

    const suffixes = ["", "k", "M", "B"];
    const numberOfDigits = numberStr.length;
    const magnitude = Math.floor((numberOfDigits - 1) / 3);
    const suffixIndex = Math.min(magnitude, suffixes.length - 1);

    const suffix = suffixes[suffixIndex];

    let shortenedNumber;
    if (magnitude > 0) {
      const digitsBeforeDecimal = numberOfDigits % 3 || 3;
      shortenedNumber =
        parseFloat(numberStr.slice(0, digitsBeforeDecimal + 2)) / 100;
      // Remove trailing zeros after the decimal point
      shortenedNumber = shortenedNumber.toFixed(2).replace(/\.?0+$/, "");
    } else {
      shortenedNumber = number.toFixed(2);
    }

    // Concatenate the suffix
    return shortenedNumber.toString() + suffix;
  }

  const formatNumber = useCallback(
    (value: number | string, isAxis = false) => {
      let prefix = valuePrefix;
      let suffix = "";
      let val = parseFloat(value as string);

      if (
        !showUsd &&
        seriesData[0].types.includes("eth") &&
        selectedScale !== "percentage"
      ) {
        if (showGwei) {
          prefix = "";
          suffix = " Gwei";
        }
      }

      let number = d3Format(`.2~s`)(val).replace(/G/, "B");

      if (isAxis) {
        if (selectedScale === "percentage") {
          number = d3Format(".2~s")(val).replace(/G/, "B") + "%";
        } else {
          if (showGwei && showUsd) {
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
    [valuePrefix, showUsd, seriesData, selectedScale, showGwei],
  );

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points }: { x: number; points: any[] } = this;
      points.sort((a: any, b: any) => {
        if (reversePerformer) return a.y - b.y;

        return b.y - a.y;
      });

      const firstTenPoints = points.slice(0, 10);
      const afterTenPoints = points.slice(10);

      const showOthers = afterTenPoints.length > 0 && metric_id !== "txcosts";

      const date = new Date(x);
      const dateString = date.toLocaleDateString("en-GB", {
        timeZone: "UTC",
        month: "short",
        day: selectedTimeInterval === "daily" ? "numeric" : undefined,
        year: "numeric",
      });

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-52 md:w-60 text-xs font-raleway">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2">${dateString}</div>`;
      const tooltipEnd = `</div>`;

      let pointsSum = points.reduce((acc: number, point: any) => {
        acc += point.y;
        return acc;
      }, 0);

      const maxPoint = points.reduce((max: number, point: any) => {
        if (point.y > max) max = point.y;
        return max;
      }, 0);

      const maxPercentage = points.reduce((max: number, point: any) => {
        if (point.percentage > max) max = point.percentage;
        return max;
      }, 0);

      if (!master) return;

      const units = Object.keys(getUnits(metric_id))
      const unitKey =
        units.find((unit) => unit !== "usd" && unit !== "eth") ||
        (showUsd ? "usd" : "eth");
      let prefix = master.metrics[metric_id].units[unitKey].prefix
        ? master.metrics[metric_id].units[unitKey].prefix
        : "";
      let suffix = master.metrics[metric_id].units[unitKey].suffix
        ? master.metrics[metric_id].units[unitKey].suffix
        : "";

      const decimals =
        !showUsd && showGwei
          ? 2
          : master.metrics[metric_id].units[unitKey].decimals_tooltip;

      let tooltipPoints = (showOthers ? firstTenPoints : points)
        .map((point: any) => {
          const { series, y, percentage } = point;
          const { name } = series;
          if (selectedScale === "percentage")
            return `
              <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]
              }"></div>
                <div class="tooltip-point-name">${AllChainsByKeys[name].label
              }</div>
                <div class="flex-1 text-right font-inter">${Highcharts.numberFormat(
                percentage,
                2,
              )}%</div>
              </div>
              
              <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
    
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
                style="
                  width: ${(percentage / maxPercentage) * 100}%;
                  background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]
              };
                "></div>
              </div>`;

          let value = y;

          if (!showUsd && master.metrics[metric_id].units[unitKey].currency) {
            if (showGwei) {
              prefix = "";
              suffix = " Gwei";
            }
          }

          return `
          <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]
            }"></div>
            <div class="tooltip-point-name text-md">${AllChainsByKeys[name].label
            }</div>
            <div class="flex-1 text-right justify-end font-inter flex">
                <div class="opacity-70 mr-0.5 ${!prefix && "hidden"
            }">${prefix}</div>
                ${metric_id === "fdv" || metric_id === "market_cap"
              ? shortenNumber(value).toString()
              : parseFloat(value).toLocaleString("en-GB", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              })
            }
                <div class="opacity-70 ml-0.5 ${!suffix && "hidden"
            }">${suffix}</div>
            </div>
          </div>
          <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
            <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>

            <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
            style="
              width: ${(Math.max(0, value) / maxPoint) * 100}%;
              background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]
            };
            "></div>
          </div>`;
        })
        .join("");

      // let prefix = valuePrefix;
      // let suffix = "";
      if (metric_id === "throughput") {
        suffix = " Mgas/s";
      }

      // add "others" with the sum of the rest of the points
      // const rest = afterTenPoints;

      if (showOthers && afterTenPoints.length > 0) {
        const restString =
          afterTenPoints.length > 1
            ? `${parseFloat(afterTenPoints[0].y).toLocaleString("en-GB", {
              minimumFractionDigits: 0,
            })}…${parseFloat(
              afterTenPoints[afterTenPoints.length - 1].y,
            ).toLocaleString("en-GB", { minimumFractionDigits: 0 })}`
            : parseFloat(afterTenPoints[0].y).toLocaleString("en-GB", {
              minimumFractionDigits: 0,
            });

        const restSum = afterTenPoints.reduce((acc: number, point: any) => {
          acc += point.y;
          return acc;
        }, 0);

        const restPercentage = afterTenPoints.reduce(
          (acc: number, point: any) => {
            acc += point.percentage;
            return acc;
          },
          0,
        );

        if (selectedScale === "percentage")
          tooltipPoints += `
          <div class="flex w-full space-x-2 items-center font-medium mb-0.5 opacity-60">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: #E0E7E6"></div>
            <div class="tooltip-point-name">${afterTenPoints.length > 1
              ? `${afterTenPoints.length} Others`
              : "1 Other"
            }</div>
            <div class="flex-1 text-right font-inter">${Highcharts.numberFormat(
              restPercentage,
              2,
            )}%</div>
          </div>
          <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
            <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>

            <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
            style="
              width: ${(restPercentage / maxPercentage) * 100}%;
              background-color: #E0E7E699
            ;
            "></div>
          </div>`;
        else
          tooltipPoints += `
          <div class="flex w-full space-x-2 items-center font-medium mb-0.5 opacity-60">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: #E0E7E6; "></div>
            <div class="tooltip-point-name text-md">${afterTenPoints.length > 1
              ? `${afterTenPoints.length} Others`
              : "1 Other"
            }</div>
            <div class="flex-1 text-right justify-end font-inter flex">
                <div class="opacity-70 mr-0.5 ${!prefix && "hidden"
            }">${prefix}</div>
                ${metric_id === "fdv" || metric_id === "market_cap"
              ? shortenNumber(restSum).toString()
              : parseFloat(restSum).toLocaleString("en-GB", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              })
            }
                <div class="opacity-70 ml-0.5 ${!suffix && "hidden"
            }">${suffix}</div>
            </div>
          </div>
          <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
            <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>

            <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
            style="
              width: ${(restSum / maxPoint) * 100}%;
              background-color: #E0E7E699
            ;
            "></div>
          </div>`;
      }

      let value = pointsSum;

      const sumRow =
        selectedScale === "stacked"
          ? `
        <div class="flex w-full space-x-2 items-center font-medium mt-1.5 mb-0.5 opacity-100">
          <div class="w-4 h-1.5 rounded-r-full" style=""></div>
          <div class="tooltip-point-name text-md">Total</div>
          <div class="flex-1 text-right justify-end font-inter flex">
            <div class="opacity-70 mr-0.5 ${!prefix && "hidden"}">
              ${prefix}
            </div>
          ${parseFloat(value).toLocaleString("en-GB", {
            minimumFractionDigits: valuePrefix ? 2 : 0,
            maximumFractionDigits: valuePrefix
              ? 2
              : metric_id === "throughput"
                ? 2
                : 0,
          })}
            <div class="opacity-70 ml-0.5 ${!suffix && "hidden"}">
              ${suffix}
            </div>
          </div>
        </div>
        <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
          <div class="h-[2px] rounded-none absolute right-0 -top-[3px] w-full bg-white/0"></div>
        </div>`
          : "";

      return tooltip + tooltipPoints + sumRow + tooltipEnd;
    },
    [metric_id, selectedTimeInterval, master, showUsd, showGwei, selectedScale, valuePrefix, reversePerformer, AllChainsByKeys, theme],
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
          pointX - distance - tooltipWidth < plotLeft
            ? pointX + distance
            : pointX - tooltipWidth - distance;

        const tooltipY =
          pointY - tooltipHeight / 2 < plotTop
            ? pointY + distance
            : pointY - tooltipHeight / 2;

        if (isMobile) {
          if (tooltipX + tooltipWidth > plotLeft + plotWidth) {
            tooltipX = plotLeft + plotWidth - tooltipWidth;
          }
          return {
            x: tooltipX,
            y: 0,
          };
        }

        return {
          x: tooltipX,
          y: tooltipY,
        };
      },
      [isMobile],
    );

  // useLayoutEffect(() => {
  //   if (chartComponent.current) {
  //     chartComponent.current.setSize(width, height, true);
  //   }
  // }, [width, height, isSidebarOpen]);

  const onXAxisSetExtremes =
    useCallback<Highcharts.AxisSetExtremesEventCallbackFunction>(
      function (e) {
        if (e.trigger === "pan") return;
        const { min, max } = e;
        const numDays = (max - min) / (24 * 60 * 60 * 1000);

        setIntervalShown({
          min,
          max,
          num: numDays,
          label: `${Math.round(numDays)} day${numDays > 1 ? "s" : ""}`,
        });

        if (
          e.trigger === "zoom" ||
          // e.trigger === "pan" ||
          e.trigger === "navigator" ||
          e.trigger === "rangeSelectorButton"
        ) {
          const { xMin, xMax } = timespans[selectedTimespan];

          if (min === xMin && max === xMax) {
            setZoomed(false);
          } else {
            setZoomed(true);
          }
          setZoomMin(min);
          setZoomMax(max);
        }
      },
      [selectedTimespan, timespans],
    );

  const embedAggregation = useMemo(() => {
    const rolling_avg = avg && ["365d", "max"].includes(selectedTimespan);
    const aggregation =
      monthly_agg && selectedTimeInterval === "monthly"
        ? monthly_agg
        : rolling_avg
          ? "average"
          : "sum";

    if (selectedTimeInterval === "monthly") {
      return `Monthly ${monthly_agg_labels[aggregation]}`;
    }

    if (avg && ["365d", "max"].includes(selectedTimespan)) {
      return `7-day Rolling ${aggregation}`;
    }

    return "Daily";
  }, [avg, monthly_agg, selectedTimeInterval, selectedTimespan]);


  return (
    <HighchartsProvider Highcharts={Highcharts}>
      <HighchartsChart
        containerProps={{
          style: { height: "100%", width: "100%" },
          ref: containerRef,
        }}
        syncId="shareTooltip"
        plotOptions={{
          ...baseOptions.plotOptions,
          ...plotOptions,
        }}
      >
        <Chart
          {...baseOptions.chart}
          className="zoom-chart"

          zooming={
            {
              type: is_embed ? "x" : "x",
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
              }
            }
          }
          options={{
            chartComponent: chartComponent.current,
          }}
        />
        <Tooltip
          useHTML={true}
          shared={true}
          split={false}
          followPointer={true}
          followTouchMove={true}
          backgroundColor={"#2A3433EE"}
          padding={0}
          hideDelay={300}
          stickOnContact={true}
          shape="rect"
          borderRadius={17}
          borderWidth={0}
          outside={true}
          shadow={{
            color: "black",
            opacity: 0.015,
            offsetX: 2,
            offsetY: 2,
          }}
          style={{
            color: "rgb(215, 223, 222)",
          }}
          formatter={tooltipFormatter}
          // ensure tooltip is always above the chart
          positioner={tooltipPositioner}
          valuePrefix={"$"}
          valueSuffix={""}
        />
        <XAxis
          title={undefined}
          events={{
            afterSetExtremes: onXAxisSetExtremes,
          }}
          type="datetime"
          labels={{
            align: undefined,
            rotation: 0,
            allowOverlap: false,
            // staggerLines: 1,
            reserveSpace: true,
            overflow: "justify",
            useHTML: true,
            formatter: function (this: AxisLabelsFormatterContextObject) {
              // if Jan 1st, show year
              if (new Date(this.value).getUTCMonth() === 0) {
                return new Date(this.value).toLocaleDateString("en-GB", {
                  timeZone: "UTC",
                  year: "numeric",
                });
              }
              return new Date(this.value).toLocaleDateString("en-GB", {
                timeZone: "UTC",
                month: isMobile ? "short" : "short",
                year: "numeric",
              });
            },
            y: 40,
            style: {
              fontSize: "10px",
              color: "#CDD8D3",
            },
          }}
          crosshair={{
            width: 0.5,
            color: COLORS.PLOT_LINE,
            snap: false,
          }}
          tickColor="#CDD8D34C"
          tickmarkPlacement="on"
          zoomEnabled={false}
          tickWidth={0}
          tickLength={20}
          minorTicks={true}
          minorTickColor="#CDD8D34C"
          minorTickLength={3}
          minorTickWidth={2}
          minorGridLineWidth={0}
          minorTickInterval={1000 * 60 * 60 * 24 * 1}
          min={zoomed ? zoomMin : timespans[selectedTimespan].xMin} // don't include the last day
          max={zoomed ? zoomMax : timespans[selectedTimespan].xMax}


        />
        <YAxis
          opposite={false}
          // showFirstLabel={true}
          // showLastLabel={true}
          type={master![MetricInfoKeyMap[type]][metric_id].log_default === true && ["absolute"].includes(selectedScale) ? "logarithmic" : "linear"}
          gridLineWidth={1}
          gridLineColor={"#5A6462"}
          gridLineDashStyle={"ShortDot"}
          gridZIndex={10}
          min={metric_id === "profit" || (master![MetricInfoKeyMap[type]][metric_id].log_default === true && ["absolute"].includes(selectedScale)) ? null : 0}
          max={selectedScale === "percentage" ? 100 : undefined}
          showFirstLabel={true}
          showLastLabel={true}
          tickAmount={5}
          zoomEnabled={false}
          labels={{
            y: 5,
            style: {
              color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
            },
            formatter: function (t: AxisLabelsFormatterContextObject) {
              return formatNumber(t.value, true);
            },
          }}
        >
          {seriesData.map((series, i) => {
            return (
              <Series
                // type={seriesType}
                key={i}
                // name={series.name}
                // color={"#1DF7EF"}
                // data={series.data.map((d: any) => [
                //   d[0],
                //   d[1]
                // ])}
                // lineWidth={1.5}
                // fillColor={{
                //   linearGradient: {
                //     x1: 0,
                //     y1: 0,
                //     x2: 0,
                //     y2: 1,
                //   },

                //   stops: [
                //     [0, "#10808CDD"],
                //     [0.5, "#10808CDD"],
                //     [1, "#1DF7EFDD"],
                //   ],
                // }}
                {...series}
              />
            );
          })}
        </YAxis>
      </HighchartsChart>
    </HighchartsProvider>

  );
}

export default MetricChart;