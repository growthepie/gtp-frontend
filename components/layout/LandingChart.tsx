"use client";

import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsRoundedCorners from "highcharts-rounded-corners";
import HighchartsReact from "highcharts-react-official";
import Highcharts, {
  AxisLabelsFormatterContextObject,
  Tick,
  chart,
} from "highcharts/highstock";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { debounce, merge } from "lodash";
import { Switch } from "../Switch";
import {
  // AllChainsByKeys,
  // EnabledChainsByKeys,
  Get_SupportedChainKeys,
} from "@/lib/chains";
import d3 from "d3";
import { Icon } from "@iconify/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import Link from "next/link";
import { Sources } from "@/lib/datasources";
import { useUIContext, useHighchartsWrappers } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import ChartWatermark from "./ChartWatermark";
import { BASE_URL, IS_PREVIEW } from "@/lib/helpers";
import EmbedContainer from "@/app/(embeds)/embed/EmbedContainer";
import "../../app/highcharts.axis.css";
import {
  TopRowContainer,
  TopRowChild,
  TopRowParent,
} from "@/components/layout/TopRow";
import { useMaster } from "@/contexts/MasterContext";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};
const isArray = (obj: any) =>
  Object.prototype.toString.call(obj) === "[object Array]";
const splat = (obj: any) => (isArray(obj) ? obj : [obj]);

const baseOptions: Highcharts.Options = {
  accessibility: { enabled: false },
  exporting: { enabled: false },
  chart: {
    backgroundColor: "transparent",
    showAxes: false,
    panKey: "shift",
    zooming: {
      resetButton: {
        position: {
          x: 0,
          y: 10,
        },
        theme: {
          fill: "transparent",
          style: {
            opacity: 1,
            fontSize: "12",
            fontFamily: "Inter",
            fontWeight: "300",
            color: "#fff",
            textTransform: "lowercase",
            border: "1px solid #fff",
          },
          borderRadius: 4,
          padding: 8,
          borderWidth: 2,
          r: 16,
          states: { hover: { fill: "#fff", style: { color: "#000" } } },
        },
      },
    },
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
    area: {
      stacking: "normal",
      events: {
        legendItemClick: function () {
          return false;
        },
      },
      marker: {
        radius: 0,
      },
      shadow: false,
      animation: false,
    },
    column: {
      grouping: true,
      stacking: "normal",
      events: {
        legendItemClick: function () {
          return false;
        },
      },
      groupPadding: 0,
      animation: true,
    },
    series: {
      stacking: "normal",
      events: {
        legendItemClick: function () {
          return false;
        },
      },
      marker: {
        radius: 0,
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

export default function LandingChart({
  data,
  master,
  cross_chain_users,
  cross_chain_users_comparison,
  latest_total,
  latest_total_comparison,
  l2_dominance,
  l2_dominance_comparison,
  selectedMetric,
  setSelectedMetric,
  metric,
  sources,
  is_embed = false,
  embed_timespan,
  embed_start_timestamp,
  embed_end_timestamp,
  embed_show_mainnet,
  embed_zoomed,
}: // timeIntervals,
  // onTimeIntervalChange,
  // showTimeIntervals = true,
  {
    data: any;
    master: any;
    cross_chain_users: number;
    cross_chain_users_comparison: number;
    latest_total: number;
    latest_total_comparison: number;
    l2_dominance: number;
    l2_dominance_comparison: number;
    selectedMetric: string;
    setSelectedMetric: (metric: string) => void;
    metric: string;
    sources: string[];
    is_embed?: boolean;
    embed_timespan?: string;
    embed_start_timestamp?: number;
    embed_end_timestamp?: number;
    embed_show_mainnet?: boolean;
    embed_zoomed?: boolean;
    // timeIntervals: string[];
    // onTimeIntervalChange: (interval: string) => void;
    // showTimeIntervals: boolean;
  }) {
  const { AllChainsByKeys, EnabledChainsByKeys } = useMaster();
  const [highchartsLoaded, setHighchartsLoaded] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const { isSidebarOpen, setEmbedData, embedData } = useUIContext();


  // useEffect(() => {
  //   if (embedData.src !== BASE_URL + "/embed/user-base")
  //     setEmbedData(prevEmbedData => ({
  //       ...prevEmbedData,
  //       title: "Layer 2 Weekly Engagement - growthepie",
  //       src: BASE_URL + "/embed/user-base",
  //     }));
  // }, [embedData]);

  useHighchartsWrappers();

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });
    highchartsRoundedCorners(Highcharts);
    highchartsAnnotations(Highcharts);

    // loadHighchartsWrappers();

    // update x-axis label sizes if it is a 4 digit number
    Highcharts.wrap(
      Highcharts.Axis.prototype,
      "renderTick",
      function (proceed) {
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        const axis: Highcharts.Axis = this;
        const ticks: Highcharts.Dictionary<Tick> = axis.ticks;
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


    setHighchartsLoaded(true);
  }, []);

  const { theme } = useTheme();

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [selectedTimespan, setSelectedTimespan] = useState(
    embed_timespan ?? "max",
  );

  const [selectedScale, setSelectedScale] = useState(
    selectedMetric === "Percentage" ? "percentage" : "absolute",
  );

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");

  const [zoomed, setZoomed] = useState(false);
  const [zoomMin, setZoomMin] = useState(0);
  const [zoomMax, setZoomMax] = useState(0);

  useEffect(() => {
    if (embed_zoomed && embed_start_timestamp && embed_end_timestamp) {
      setZoomed(embed_zoomed);
      setZoomMin(embed_start_timestamp);
      setZoomMax(embed_end_timestamp);
    }
  }, [embed_end_timestamp, embed_start_timestamp, embed_zoomed]);

  const [showEthereumMainnet, setShowEthereumMainnet] = useState(
    embed_show_mainnet ?? false,
  );

  const [totalUsersIncrease, setTotalUsersIncrease] = useState(0);

  const isMobile = useMediaQuery("(max-width: 767px)");

  // const getTickPositions = useCallback(
  //   (xMin: any, xMax: any): number[] => {
  //     const tickPositions: number[] = [];
  //     const xMinDate = new Date(xMin);
  //     const xMaxDate = new Date(xMax);
  //     const xMinMonth = xMinDate.getUTCMonth();
  //     const xMaxMonth = xMaxDate.getUTCMonth();

  //     const xMinYear = xMinDate.getUTCFullYear();
  //     const xMaxYear = xMaxDate.getUTCFullYear();

  //     // if (selectedTimespan === "max") {
  //     //   for (let year = xMinYear; year <= xMaxYear; year++) {
  //     //     for (let month = 0; month < 12; month = month + 4) {
  //     //       // if (year === xMinYear && month < xMinMonth) continue;
  //     //       // if (year === xMaxYear && month > xMaxMonth) continue;
  //     //       tickPositions.push(Date.UTC(year, month, 1).valueOf());
  //     //     }
  //     //   }
  //     //   return tickPositions;
  //     // }
  //     // for (let year = xMinYear; year <= xMaxYear; year++) {

  //     //   for (let month = 0; month <= 12; month++) {
  //     //     // if (year === xMinYear && month < xMinMonth) continue;
  //     //     // if (year === xMaxYear && month > xMaxMonth) continue;
  //     //     tickPositions.push(Date.UTC(year, month, 1).valueOf());
  //     //   }
  //     // }

  //     const daysDiff = daysShown;

  //     if (daysShown < 365) {
  //       for (let year = xMinYear; year <= xMaxYear; year++) {
  //         for (let month = 0; month < 12; month = month + 1) {
  //           // if (year === xMinYear && month < xMinMonth) continue;
  //           // if (year === xMaxYear && month > xMaxMonth) continue;
  //           tickPositions.push(Date.UTC(year, month, 1).valueOf());
  //         }
  //       }
  //     }

  //     if (daysShown >= 365) {
  //       for (let year = xMinYear; year <= xMaxYear; year++) {
  //         for (let month = 0; month < 12; month = month + 3) {
  //           // if (year === xMinYear && month < xMinMonth) continue;
  //           // if (year === xMaxYear && month > xMaxMonth) continue;
  //           tickPositions.push(Date.UTC(year, month, 1).valueOf());
  //         }
  //       }
  //     }

  //     // for (let i = xMinMonth; i <= xMaxMonth; i++) {
  //     //   tickPositions.push(Date.UTC(xMinYear, i, 1).valueOf());
  //     // }

  //     // // remove the last tick if its an embed
  //     // if (is_embed)
  //     //   tickPositions.pop();

  //     return tickPositions;
  //   },
  //   [selectedTimespan, is_embed, daysShown],
  // );

  const getSeriesType = useCallback(
    (name: string) => {
      if (selectedScale === "percentage") return "area";

      if (name === "ethereum") return "area";

      return "column";
    },
    [selectedScale],
  );

  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);
  // daysShown based on minX and maxX on chart X axis
  // const daysShown = useMemo(a() => {
  //   if (!chartComponent.current) return parseInt(selectedTimespan);
  //   if (zoomed) return Math.round((zoomMax - zoomMin) / (24 * 60 * 60 * 1000));
  //   const minX = chartComponent.current?.xAxis[0].getExtremes().min;
  //   const maxX = chartComponent.current?.xAxis[0].getExtremes().max;
  //   if (minX && maxX)
  //     return Math.round((maxX - minX) / (24 * 60 * 60 * 1000));
  //   if (selectedTimespan === "max") return 365 * 5;
  //   return parseInt(selectedTimespan);
  // }, [selectedTimespan, zoomed, zoomMax, zoomMin, chartComponent.current]);

  const [daysShown, setDaysShown] = useState(900);

  const formatNumber = useCallback(
    (value: number | string, isAxis = false) => {
      return isAxis
        ? selectedScale !== "percentage"
          ? d3.format(".2s")(value)
          : d3.format(".2s")(value) + "%"
        : d3.format(",.2~s")(value);
    },
    [selectedScale],
  );

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points }: { x: number; points: any[] } = this;
      const firstTenPoints = points.sort((a: any, b: any) => b.y - a.y).slice(0, 10);
      const afterTenPoints = points.sort((a: any, b: any) => b.y - a.y).slice(10);
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
      <div>-</div>
      <div>
        ${new Date(date.valueOf() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString(
        //add 7 days to the date
        undefined,
        {
          timeZone: "UTC",
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      )}
      </div>`;

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-60 md:w-60 text-xs font-raleway"><div class="flex-1 font-bold text-[13px] md:text-[1rem] ml-6 mb-2 flex justify-between">${dateString}</div>`;
      let tooltipEnd = `</div>`;

      if (selectedMetric === "Users per Chain")
        tooltipEnd = `
          <div class="text-0.55rem] flex flex-col items-start pl-[24px] pt-3 gap-x-1 w-full text-forest-900/60 dark:text-forest-500/60">
            <div class="font-medium">Note:</div>
            Addresses exclusively interacting with<br/>respective chain.
          </div>
        </div>`;

      let pointsSum = points.reduce((acc: number, point: any) => {
        acc += point.y;
        return acc;
      }, 0);

      let maxPoint = points.reduce((acc: number, point: any) => {
        acc = Math.max(acc, point.y);
        return acc;
      }, 0);

      let maxPercentage = points.reduce((acc: number, point: any) => {
        acc = Math.max(acc, point.percentage);
        return acc;
      }, 0);

      let tooltipPoints = firstTenPoints
        .filter((point: any) => {
          const { series, y, percentage } = point;
          const { name } = series;
          const supportedChainKeys = Get_SupportedChainKeys(master, [
            "all_l2s",
            "multiple",
          ]);

          return supportedChainKeys.includes(name);
        })
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

          const value = formatNumber(y);
          return `
          <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]
            }"></div>
            <div class="tooltip-point-name text-md">${AllChainsByKeys[name].label
            }</div>
            <div class="flex-1 text-right justify-end font-inter flex">
              <div class="inline-block">${parseFloat(y).toLocaleString(
              "en-GB",
              {
                minimumFractionDigits: 0,
              },
            )}</div>
            </div>
          </div>
          <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
            <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>

            <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
            style="
              width: ${(y / maxPoint) * 100}%;
              background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]
            };
            "></div>
          </div>`;
        })
        .join("");

      // add "others" with the sum of the rest of the points
      const rest = afterTenPoints
        .filter((point: any) => {
          const { series, y, percentage } = point;
          const { name } = series;
          const supportedChainKeys = Get_SupportedChainKeys(master, [
            "all_l2s",
            "multiple",
          ]);

          return supportedChainKeys.includes(name);
        })

      if (rest.length === 0) return tooltip + tooltipPoints + tooltipEnd;

      const restString = rest.length > 1 ? `${parseFloat(rest[0].y).toLocaleString("en-GB", { minimumFractionDigits: 0 })}…${parseFloat(rest[rest.length - 1].y).toLocaleString("en-GB", { minimumFractionDigits: 0 })}` :
        parseFloat(rest[0].y).toLocaleString("en-GB", { minimumFractionDigits: 0 });

      const restSum = rest.reduce((acc: number, point: any) => {
        acc += point.y;
        return acc;
      }, 0);

      const restPercentage = rest.reduce((acc: number, point: any) => {
        acc += point.percentage;
        return acc;
      }, 0);

      if (selectedScale === "percentage")
        tooltipPoints += `
          <div class="flex w-full space-x-2 items-center font-medium mb-0.5 opacity-60">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: #E0E7E6"></div>
            <div class="tooltip-point-name">${rest.length > 1 ? `${rest.length} Others` : "1 Other"}</div>
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
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: #E0E7E6"></div>
            <div class="tooltip-point-name">${rest.length > 1 ? `${rest.length} Others` : "1 Other"}</div>
            <div class="flex-1 text-right justify-end font-inter flex">
              <div class="inline-block">${restSum.toLocaleString("en-GB", { minimumFractionDigits: 0, })}</div>
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

      return tooltip + tooltipPoints + tooltipEnd;
    },
    [formatNumber, master, selectedMetric, selectedScale, theme],
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

        const tooltipY = pointY - tooltipHeight / 2;

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

  const [showTotalUsers, setShowTotalUsers] = useState(
    selectedMetric === "Total Users",
  );

  const filteredData = useMemo(() => {
    if (!data) return null;

    const l2s = data.filter((d) => "all_l2s" === d.name)[0];

    setTotalUsersIncrease(
      (l2s.data[l2s.data.length - 1][1] - l2s.data[l2s.data.length - 2][1]) /
      l2s.data[l2s.data.length - 2][1],
    );

    if (showTotalUsers)
      return showEthereumMainnet
        ? data.filter((d) => ["all_l2s", "ethereum"].includes(d.name))
        : [l2s];

    return showEthereumMainnet
      ? data.filter((d) => !["all_l2s"].includes(d.name))
      : data.filter((d) => !["all_l2s", "ethereum"].includes(d.name));
  }, [data, showEthereumMainnet, showTotalUsers]);

  const maxDate = useMemo(() => {
    if (embed_end_timestamp) return new Date(embed_end_timestamp);

    let maxDate = new Date();
    if (filteredData && filteredData[0].name !== "") {
      maxDate = new Date(
        filteredData.length > 0 &&
          filteredData[0].data[filteredData[0].data.length - 1][0]
          ? filteredData[0].data[filteredData[0].data.length - 1][0]
          : 0,
      );
    }
    return maxDate;
  }, [embed_end_timestamp, filteredData]);

  const timespans = useMemo(() => {
    const buffer = selectedScale === "percentage" ? 0 : 7 * 24 * 60 * 60 * 1000;
    const maxPlusBuffer = maxDate.valueOf() + buffer;

    return {
      // "30d": {
      //   label: "30 days",
      //   value: 30,
      //   xMin: Date.now() - 30 * 24 * 60 * 60 * 1000,
      //   xMax: Date.now(),
      // },
      "90d": {
        label: "90 days",
        value: 90,
        xMin: maxPlusBuffer - 90 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "180d": {
        label: "180 days",
        value: 180,
        xMin: maxPlusBuffer - 180 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "365d": {
        label: "1 year",
        value: 365,
        xMin: maxPlusBuffer - 365 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      max: {
        label: "Maximum",
        value: 0,
        xMin:
          filteredData.reduce((min, d) => {
            if (d.data && d.data[0] && d.data[0][0] !== undefined) {
              return Math.min(min, d.data[0][0]);
            }
            return min;
          }, Infinity) - buffer,

        xMax: maxPlusBuffer,
      },
    };
  }, [filteredData, maxDate, selectedScale]);

  useEffect(() => {
    const startTimestamp = zoomed ? zoomMin : undefined;
    const endTimestamp = zoomed ? zoomMax : maxDate.valueOf();

    const vars = {
      theme: theme ? theme : "dark",
      timespan: selectedTimespan,
      scale: selectedScale,
      // interval: selectedTimeInterval,
      showMainnet: showEthereumMainnet ? "true" : "false",
      metric: selectedMetric,
    };

    const absoluteVars = {
      zoomed: zoomed ? "true" : "false",
      startTimestamp: startTimestamp ? startTimestamp.toString() : "",
      endTimestamp: endTimestamp ? endTimestamp.toString() : "",
    };

    let src =
      BASE_URL +
      "/embed/user-base/" +
      "?" +
      new URLSearchParams(vars).toString();
    if (embedData.timeframe === "absolute") {
      src += "&" + new URLSearchParams(absoluteVars).toString();
    }

    setEmbedData((prevEmbedData) => ({
      ...prevEmbedData,
      title: "Layer 2 Weekly Engagement - growthepie",
      src: src,
      zoomed: zoomed,
      timeframe: zoomed ? "absolute" : embedData.timeframe,
    }));
  }, [
    embedData.timeframe,
    maxDate,
    selectedScale,
    selectedTimeInterval,
    selectedTimespan,
    showEthereumMainnet,
    showUsd,
    theme,
    timespans,
    zoomMax,
    zoomMin,
    zoomed,
    selectedMetric,
  ]);

  useEffect(() => {
    if (chartComponent.current) {
      if (!zoomed)
        chartComponent.current.xAxis[0].setExtremes(
          timespans[selectedTimespan].xMin,
          timespans[selectedTimespan].xMax,
        );
    }
  }, [selectedTimespan, timespans, zoomed]);

  const [intervalShown, setIntervalShown] = useState<{
    min: number;
    max: number;
    num: number;
    label: string;
  } | null>(null);

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

  // const containerRef = useRef<HTMLDivElement>(null);

  const [containerRef, { width, height }] = useElementSizeObserver();

  const getChartHeight = useCallback(() => {
    if (is_embed) return height;
    if (isMobile) return 284;
    return 360;
  }, [isMobile, is_embed, height]);

  const options = useMemo((): Highcharts.Options => {
    // let units: [string, Array<number> | null][] = [["month", [6]], ["year", [1]]];
    // if (daysShown <= 365) {
    //   units = [["month", [3]], ["year", [1]]];
    // }
    // if (daysShown <= 180) {
    //   units = [["month", [2]], ["year", [1]]];
    // }
    // if (daysShown <= 90) {
    //   units = [["month", [1]], ["year", [1]]];
    // }

    const dynamicOptions: Highcharts.Options = {
      chart: {
        height: getChartHeight(),
        className: "zoom-chart",
        animation: true,
        type: selectedScale === "percentage" ? "area" : "column",
        plotBorderColor: "transparent",
        panning: {
          enabled: is_embed ? false : true,
        },
        zooming: {
          type: is_embed ? undefined : "x",
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
        events: {},
        // height: isMobile ? 200 : 400,
      },

      plotOptions: {
        area: {
          stacking: selectedScale === "percentage" ? "percent" : "normal",
          animation: false,
          dataGrouping: {
            enabled: false,
          },
        },
        column: {
          animation: false,
          crisp: false,
          dataGrouping: {
            enabled: false,
          },
        },
      },
      legend: {
        enabled: false,
      },
      yAxis: {
        opposite: false,
        showFirstLabel: true,
        showLastLabel: true,
        type: selectedScale === "log" ? "logarithmic" : "linear",
        labels: {
          y: 5,
          style: {
            color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
          },
          formatter: function (t: AxisLabelsFormatterContextObject) {
            return formatNumber(t.value, true);
          },
        },
        gridLineColor:
          theme === "dark"
            ? "rgba(215, 223, 222, 0.11)"
            : "rgba(41, 51, 50, 0.11)",
      },
      xAxis: {
        minorTicks: true,
        minorTickColor: "#CDD8D34C",
        minorTickPosition: "outside",
        minorTickLength: 3,
        minorTickWidth: 2,
        minorGridLineWidth: 0,
        tickColor: "#CDD8D34C",
        tickLength: 25,
        tickWidth: 1,
        offset: 0,
        minTickInterval: 30 * 24 * 3600 * 1000,
        minPadding: 0,
        maxPadding: 0,
        labels: {
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
        },
        events: {
          afterSetExtremes: onXAxisSetExtremes,
        },
        min: zoomed ? zoomMin : timespans[selectedTimespan].xMin,
        max: zoomed ? zoomMax : timespans[selectedTimespan].xMax,
      },
      tooltip: {
        formatter: tooltipFormatter,
        positioner: tooltipPositioner,
        split: false,
        followPointer: true,
        followTouchMove: true,
        backgroundColor: (theme === "dark" ? "#2A3433" : "#EAECEB") + "EE",
        borderRadius: 17,
        borderWidth: 0,
        padding: 0,
        outside: true,
        shadow: {
          color: "black",
          opacity: 0.015,
          offsetX: 2,
          offsetY: 2,
        },
        style: {
          color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
        },
        enabled: isDragging ? false : true,
      },
      series: [
        ...filteredData
          .sort((a, b) => {
            const aValue =
              a.data && a.data[a.data.length - 1]
                ? a.data[a.data.length - 1][1]
                : 0;
            const bValue =
              b.data && b.data[b.data.length - 1]
                ? b.data[b.data.length - 1][1]
                : 0;

            if (selectedScale === "percentage") {
              return aValue - bValue;
            } else {
              return bValue - aValue;
            }
          })
          .map((series: any, i: number) => {
            const zIndex = showEthereumMainnet
              ? series.name === "ethereum"
                ? 0
                : 10
              : 10;

            let borderRadius: string | null = null;

            if (showEthereumMainnet && i === 1) {
              borderRadius = "8%";
            } else if (i === 0) {
              borderRadius = "8%";
            }
            const timeIntervalToMilliseconds = {
              daily: 1 * 24 * 60 * 60 * 1000,
              weekly: 7 * 24 * 60 * 60 * 1000,
              monthly: 30 * 24 * 60 * 60 * 1000,
            };

            const pointsSettings =
              getSeriesType(series.name) === "column"
                ? {
                  pointPlacement: 0.5,
                  pointPadding: 0.15,
                  pointRange: timeIntervalToMilliseconds[metric],
                }
                : {
                  pointPlacement: 0.5,
                };

            return {
              name: series.name,
              // always show ethereum on the bottom
              zIndex: zIndex,
              step: "center",
              data: series.data.map((d: any) => [d[0], d[1]]),
              ...pointsSettings,
              clip: true,
              borderRadiusTopLeft: borderRadius,
              borderRadiusTopRight: borderRadius,
              type: getSeriesType(series.name),
              fillOpacity: series.name === "ethereum" ? 1 : 0,
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
                    series.name && theme && EnabledChainsByKeys[series.name]
                      ? EnabledChainsByKeys[series.name]?.colors[
                      theme ?? "dark"
                      ][0] + "33"
                      : [],
                  ],

                  [
                    1,
                    series.name && theme && EnabledChainsByKeys[series.name]
                      ? EnabledChainsByKeys[series.name]?.colors[
                      theme ?? "dark"
                      ][1] + "33"
                      : [],
                  ],
                ],
              },
              // borderColor:
              //   series.name && theme && EnabledChainsByKeys[series.name]
              //     ? EnabledChainsByKeys[series.name]?.colors[theme ?? "dark"][0]
              //     : "transparent",
              // borderWidth: 1,
              lineWidth: 1,
              ...(getSeriesType(series.name) !== "column"
                ? {
                  shadow: {
                    color:
                      series.name && theme && EnabledChainsByKeys[series.name]
                        ? EnabledChainsByKeys[series.name]?.colors[theme][1] +
                        "FF"
                        : "transparent",
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
                      [
                        0,
                        series.name &&
                          theme &&
                          EnabledChainsByKeys[series.name]
                          ? EnabledChainsByKeys[series.name]?.colors[theme][0]
                          : [],
                      ],
                      // [0.33, AllChainsByKeys[series.name].colors[1]],
                      [
                        1,
                        series.name &&
                          theme &&
                          EnabledChainsByKeys[series.name]
                          ? EnabledChainsByKeys[series.name]?.colors[theme][1]
                          : [],
                      ],
                    ],
                  },
                }
                : series.name === "all_l2s"
                  ? {
                    borderColor: "transparent",
                    borderWidth: 0,
                    // shadow: {
                    //   color: "#CDD8D3",
                    //   offsetX: 0,
                    //   offsetY: 0,
                    //   width: 0,
                    // },
                    color: {
                      linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1,
                      },
                      stops:
                        theme === "dark"
                          ? [
                            [
                              0,
                              series.name &&
                                theme &&
                                EnabledChainsByKeys[series.name]
                                ? EnabledChainsByKeys[series.name]?.colors[
                                theme
                                ][0] + "FF"
                                : [],
                            ],
                            // [
                            //   0.3,
                            //   //   AllChainsByKeys[series.name].colors[theme][0] + "FF",
                            //   AllChainsByKeys[series.name].colors[theme][0] +
                            //     "FF",
                            // ],
                            [
                              1,
                              series.name &&
                                theme &&
                                EnabledChainsByKeys[series.name]
                                ? EnabledChainsByKeys[series.name]?.colors[
                                theme
                                ][1] + "FF"
                                : [],
                            ],
                          ]
                          : [
                            [
                              0,
                              series.name &&
                                theme &&
                                EnabledChainsByKeys[series.name]
                                ? EnabledChainsByKeys[series.name]?.colors[
                                theme
                                ][0] + "FF"
                                : [],
                            ],
                            // [
                            //   0.7,
                            //   AllChainsByKeys[series.name].colors[theme][0] +
                            //     "88",
                            // ],
                            [
                              1,
                              series.name &&
                                theme &&
                                EnabledChainsByKeys[series.name]
                                ? EnabledChainsByKeys[series.name]?.colors[
                                theme
                                ][1] + "FF"
                                : [],
                            ],
                          ],
                    },
                  }
                  : {
                    borderColor: theme == "dark" ? "#2A3433" : "#EAECEB",
                    borderWidth: 0,
                    //  series.name &&
                    //   theme &&
                    //   EnabledChainsByKeys[series.name]
                    //   ? EnabledChainsByKeys[series.name]?.colors[
                    //   theme
                    //   ][0] + "33"
                    //   : [],
                    shadow: null,
                    color: {
                      linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1,
                      },
                      stops:
                        theme === "dark"
                          ? [
                            [
                              0,
                              series.name &&
                                theme &&
                                EnabledChainsByKeys[series.name]
                                ? EnabledChainsByKeys[series.name]?.colors[
                                theme
                                ][0] + "FF"
                                : [],
                            ],
                            // [
                            //   0.349,
                            //   series.name &&
                            //     theme &&
                            //     EnabledChainsByKeys[series.name]
                            //     ? EnabledChainsByKeys[series.name]?.colors[
                            //     theme
                            //     ][0] + "88"
                            //     : [],
                            // ],
                            [
                              1,
                              // "#151a19FF"
                              series.name &&
                                theme &&
                                EnabledChainsByKeys[series.name]
                                ? EnabledChainsByKeys[series.name]?.colors[
                                theme
                                ][0] + "00"
                                : [],
                            ],
                          ]
                          : [
                            [
                              0,
                              series.name &&
                                theme &&
                                EnabledChainsByKeys[series.name]
                                ? EnabledChainsByKeys[series.name]?.colors[
                                theme
                                ][0] + "FF"
                                : [],
                            ],
                            // [
                            //   0.349,
                            //   series.name &&
                            //     theme &&
                            //     EnabledChainsByKeys[series.name]
                            //     ? EnabledChainsByKeys[series.name]?.colors[
                            //     theme
                            //     ][0] + "88"
                            //     : [],
                            // ],
                            [
                              1,
                              // "#FFFFFFFF"
                              series.name &&
                                theme &&
                                EnabledChainsByKeys[series.name]
                                ? EnabledChainsByKeys[series.name]?.colors[
                                theme
                                ][0] + "00"
                                : [],
                            ],
                          ],
                    },
                  }),
              states: {
                hover: {
                  enabled: true,
                  halo: {
                    size: 5,
                    opacity: 1,
                    attributes: {
                      fill:
                        series.name && theme && EnabledChainsByKeys[series.name]
                          ? EnabledChainsByKeys[series.name]?.colors[
                          theme ?? "dark"
                          ][0] + "99"
                          : "transparent",
                      stroke:
                        series.name && theme && EnabledChainsByKeys[series.name]
                          ? EnabledChainsByKeys[series.name]?.colors[
                          theme ?? "dark"
                          ][0] + "66"
                          : "transparent",
                      "stroke-width": 0,
                    },
                  },
                  // lineWidth: 4,
                  // lineWidthPlus: 4,
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
              showInNavigator: false,
            };
          }),
      ],
      // stockchart options
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
    };

    return merge({}, baseOptions, dynamicOptions);
    // return { ...baseOptions };
  }, [
    getChartHeight,
    filteredData,
    formatNumber,
    getSeriesType,
    // getTickPositions,
    isDragging,
    isMobile,
    metric,
    onXAxisSetExtremes,
    selectedScale,
    showEthereumMainnet,
    theme,
    selectedTimespan,
    timespans,
    tooltipFormatter,
    tooltipPositioner,
    zoomMax,
    zoomMin,
    zoomed,
    is_embed,
  ]);

  // const resituateChart = debounce(() => {
  //   chartComponent.current && chartComponent.current.reflow();
  // }, 300);

  // useEffect(() => {
  //   resituateChart();

  //   // cancel the debounced function on component unmount
  //   return () => {
  //     resituateChart.cancel();
  //   };
  // }, [chartComponent, selectedTimespan, timespans, resituateChart]);

  // useEffect(() => {
  //   setTimeout(() => {
  //     resituateChart();
  //   }, 300);

  //   return () => {
  //     resituateChart.cancel();
  //   };
  // }, [isSidebarOpen, resituateChart]);

  useEffect(() => {
    if (chartComponent.current) {
      if (is_embed) {
        return;
      }

      if (isMobile) {
        chartComponent.current.setSize(null, 284, false);
        return;
      }

      chartComponent.current.setSize(null, 400, false);
    }
  }, [isMobile, is_embed]);

  useEffect(() => {
    if (chartComponent.current) {
      chartComponent.current.setSize(width, getChartHeight(), true);
    }
  }, [is_embed, width, height, getChartHeight, isSidebarOpen]);

  if (is_embed)
    return (
      <EmbedContainer
        title="User Base"
        icon="gtp:gtp-pie"
        url="https://www.growthepie.xyz"
        time_frame={timespans[selectedTimespan].label}
        chart_type={selectedMetric}
        aggregation={selectedScale}
      >
        <div className="h-full w-full rounded-xl" ref={containerRef}>
          {highchartsLoaded ? (
            <HighchartsReact
              highcharts={Highcharts}
              options={options}
              constructorType={"stockChart"}
              ref={(chart) => {
                chartComponent.current = chart?.chart;
              }}
            />
          ) : (
            <div className="w-full flex-1 my-4 flex justify-center items-center">
              <div className="w-10 h-10 animate-spin">
                <Icon
                  icon="feather:loader"
                  className="w-10 h-10 text-forest-500"
                />
              </div>
            </div>
          )}
          <div className="absolute bottom-[48.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-50">
            <ChartWatermark className="w-[128.67px] h-[30.67px] md:w-[193px] md:h-[46px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
          </div>
          {filteredData.length === 0 && (
            <div className="absolute top-[calc(50%+2rem)] left-[0px] text-xs font-medium flex justify-center w-full text-forest-500/60">
              No chain(s) selected for comparison. Please select at least one.
            </div>
          )}
          {/* </div> */}
        </div>
      </EmbedContainer>
    );

  return (
    <div
      id="content-container"
      className={`w-full h-full flex flex-col justify-between `}
    >
      <div
        className={`h-[225px] lg:h-[81px] 2xl:h-[60px] ${isMobile ? "mb-[30px]" : "mb-0"
          }`}
      >
        <div className="flex flex-col lg:hidden justify-center pb-[15px] gap-y-[5px]">
          <MobileMetricCard
            icon="feather:users"
            metric_name="Active Addresses"
            metric_value={latest_total}
            metric_comparison={latest_total_comparison}
            theme={theme || "dark"}
          />
          <div className="flex justify-center gap-x-[5px]">
            <MobileMetricCard
              icon="gtp:wallet-chain"
              metric_name="Multi-Chain Users"
              metric_value={cross_chain_users}
              metric_comparison={cross_chain_users_comparison}
              theme={theme || "dark"}
            />
            <MobileMetricCard
              icon="feather:layers"
              metric_name="L2 Dominance"
              metric_value={(Math.round(l2_dominance * 100) / 100).toFixed(2)}
              metric_comparison={l2_dominance_comparison}
              theme={theme || "dark"}
              is_multiple
            />
          </div>
        </div>
        <TopRowContainer className="!flex-col !rounded-[15px] !py-[3px] !px-[3px] !text-xs  2xl:!gap-y-0 2xl:!text-base 2xl:!flex 2xl:!flex-row 2xl:!rounded-full">
          <TopRowParent className="!w-full 2xl:!w-auto !justify-between 2xl:!justify-center !items-stretch 2xl:!items-center !mx-4 2xl:!mx-0 !gap-x-[4px] 2xl:!gap-x-[5px]">
            <TopRowChild
              isSelected={showTotalUsers}
              className={"!px-[16px] !py-[4px] !grow !text-sm 2xl:!text-base 2xl:!px-4 2xl:!py-[14px] 3xl:!px-6 3xl:!py-4"}
              onClick={() => {
                setShowTotalUsers(true);
                setSelectedScale("absolute");
                setSelectedMetric("Total Users");
              }}
            >
              Active Addresses
            </TopRowChild>
            <TopRowChild
              isSelected={"absolute" === selectedScale && !showTotalUsers}
              className={"!px-[16px] !py-[4px] !grow !text-sm 2xl:!text-base 2xl:!px-4 2xl:!py-[14px] 3xl:!px-6 3xl:!py-4"}
              onClick={() => {
                setShowTotalUsers(false);
                setSelectedScale("absolute");
                setSelectedMetric("Users per Chain");
              }}
            >
              Active Addresses per Chain
            </TopRowChild>

            <TopRowChild
              isSelected={"percentage" === selectedScale}
              className={"!px-[16px] !py-[4px] !grow !text-sm 2xl:!text-base 2xl:!px-4 2xl:!py-[14px] 3xl:!px-6 3xl:!py-4"}
              onClick={() => {
                setShowTotalUsers(false);
                setSelectedScale("percentage");
                setSelectedMetric("Percentage");
              }}
            >
              Percentage
            </TopRowChild>
          </TopRowParent>
          <div className="block 2xl:hidden w-[70%] mx-auto my-[10px]">
            <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
          </div>
          <TopRowParent className="!w-full 2xl:!w-auto !justify-between 2xl:!justify-center !items-stretch 2xl:!items-center !mx-4 2xl:!mx-0 !gap-x-[4px] 2xl:!gap-x-[5px]">
            {!zoomed ? (
              Object.keys(timespans).map((timespan) => (
                <TopRowChild
                  key={timespan}
                  className={"!px-[16px] !py-[4px] !grow !text-sm 2xl:!text-base 2xl:!px-4 2xl:!py-[14px] 3xl:!px-6 3xl:!py-4"}
                  //rounded-full sm:w-full px-4 py-1.5 xl:py-4 font-medium
                  isSelected={selectedTimespan === timespan}
                  onClick={() => {
                    setSelectedTimespan(timespan);
                    // setXAxis();
                    // chartComponent?.current?.xAxis[0].update({
                    //   min: timespans[selectedTimespan].xMin,
                    //   max: timespans[selectedTimespan].xMax,
                    //   // calculate tick positions based on the selected time interval so that the ticks are aligned to the first day of the month
                    //   tickPositions: getTickPositions(
                    //     timespans.max.xMin,
                    //     timespans.max.xMax,
                    //   ),
                    // });
                    // if (zoomed)
                    //   setZoomed(false);
                  }}
                >
                  {timespans[timespan].label}
                </TopRowChild>
              ))
            ) : (
              <>
                <button
                  className={`rounded-full flex items-center justify-center space-x-3 px-4 py-1.5 2xl:py-4 text-md w-full 2xl:w-auto 2xl:px-4 2xl:text-md font-medium border-[1px] border-forest-800`}
                  onClick={() => {
                    // chartComponent?.current?.xAxis[0].setExtremes(
                    //   timespans[selectedTimespan].xMin,
                    //   timespans[selectedTimespan].xMax,
                    // );
                    setZoomed(false);
                  }}
                >
                  <Icon
                    icon="feather:zoom-out"
                    className="h-4 w-4 2xl:w-6 2xl:h-6"
                  />
                  <div>Reset Zoom</div>
                </button>
                <button
                  className={`rounded-full text-md w-full 2xl:w-auto px-4 py-1.5 2xl:py-4 2xl:px-4 font-medium bg-forest-100 dark:bg-forest-1000`}
                >
                  {intervalShown?.label}
                </button>
              </>
            )}
          </TopRowParent>
        </TopRowContainer>
      </div>
      <div className="flex-1 min-h-0 w-full pt-8 pb-4 md:pt-[52px] md:pb-4 2xl:pt-[52px] 2xl:pb-16 ">
        <div
          className="relative h-[284px] md:h-[400px] w-full rounded-xl"
          ref={containerRef}
        >
          {highchartsLoaded ? (
            <HighchartsReact
              // containerProps={{ style: { cursor: "url('cursors/zoom.svg') 14.5 14.5, pointer" } }}
              highcharts={Highcharts}
              options={options}
              constructorType={"stockChart"}
              ref={(chart) => {
                chartComponent.current = chart?.chart;
              }}
            />
          ) : (
            <div className="w-full flex-1 my-4 flex justify-center items-center">
              <div className="w-10 h-10 animate-spin">
                <Icon
                  icon="feather:loader"
                  className="w-10 h-10 text-forest-500"
                />
              </div>
            </div>
          )}
          <div className="absolute bottom-[53.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-50">
            <ChartWatermark className="w-[128.67px] h-[30.67px] md:w-[193px] md:h-[46px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
          </div>
          {filteredData.length === 0 && (
            <div className="absolute top-[calc(50%+2rem)] left-[0px] text-xs font-medium flex justify-center w-full text-forest-500/60">
              No chain(s) selected for comparison. Please select at least one.
            </div>
          )}
          {/* </div> */}
        </div>
      </div>
      <div className="h-[32px] lg:h-[80px] flex flex-col justify-start ">
        <div className="flex justify-between items-center rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 relative">
          {/* toggle ETH */}
          <div className="flex z-10">
            <Switch
              checked={showEthereumMainnet}
              onChange={() => setShowEthereumMainnet(!showEthereumMainnet)}
            />
            <div className="ml-2 block md:hidden xl:block leading-[1.75]">
              Show Ethereum
            </div>
            <div className="ml-2 hidden md:block xl:hidden leading-[1.75]">
              Show ETH
            </div>
          </div>
          <div className="flex justify-end items-center absolute top-[56px] lg:-top-[15px] right-[-1px] rounded-full z-10">
            <div className="flex justify-center items-center">
              <div className="flex items-center justify-center gap-x-[20px] pr-[10px]">
                <MetricCard
                  icon="feather:users"
                  metric_name="Active Addresses"
                  metric_value={latest_total}
                  metric_comparison={latest_total_comparison}
                  theme={theme || "dark"}
                />
                <MetricCard
                  icon="gtp:wallet-chain"
                  metric_name="Active on Multiple Chains"
                  metric_value={cross_chain_users}
                  metric_comparison={cross_chain_users_comparison}
                  theme={theme || "dark"}
                />
                <MetricCard
                  icon="feather:layers"
                  metric_name="Layer 2 Dominance"
                  metric_value={(Math.round(l2_dominance * 100) / 100).toFixed(
                    2,
                  )}
                  metric_comparison={l2_dominance_comparison}
                  theme={theme || "dark"}
                  is_multiple
                />
              </div>

              <Tooltip placement="left" allowInteract>
                <TooltipTrigger>
                  <div className="bottom-[28px] right-[8px] p-0 -mr-0.5 lg:p-1.5 z-10 lg:mr-0 absolute lg:static lg:mb-0.5">
                    <Icon icon="feather:info" className="w-6 h-6" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="-mt-10 pr-10 lg:mt-0 z-50 flex items-center justify-center lg:pr-[3px]">
                  <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto md:w-[435px] h-[80px] flex items-center">
                    <div className="flex flex-col space-y-1">
                      <div className="font-bold text-sm leading-snug">
                        Data Sources:
                      </div>
                      <div className="flex space-x-1 flex-wrap font-medium text-xs leading-snug">
                        {sources
                          .map<React.ReactNode>((s) => (
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
                          .reduce((prev, curr) => [prev, ", ", curr])}
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MobileMetricCard = ({
  icon,
  metric_name,
  metric_value,
  metric_comparison,
  is_multiple = false,
  theme,
}: {
  icon: string;
  metric_name: string;
  metric_value: number | string;
  metric_comparison: number;
  is_multiple?: boolean;
  theme: string;
}) => {
  return (
    <div className="flex bg-forest-200/10 dark:bg-[#CDD8D3]/20 backdrop-blur-[30px] rounded-[15px] px-[7px] pt-[10px] pb-[7px] items-center w-full">
      <div className="flex flex-col items-center flex-1">
        <Icon icon={icon} className="w-[30px] h-[30px]" />
        <div className="block text-[10px] font-medium leading-[1.5] text-center">
          {metric_name}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center w-7/12 gap-y-[3px]">
        <div className="text-[20px] font-[650] leading-[1.2] flex items-end">
          <div className="text-[20px]">
            {metric_value.toLocaleString("en-GB")}
          </div>
          <div className="text-[20px] leading-tight">{is_multiple && "x"}</div>
        </div>
        <div className="text-[10px] font-medium leading-[1.5]">
          {metric_comparison > 0 ? (
            <span
              className="text-green-500 dark:text-green-500 font-semibold"
              style={{
                textShadow:
                  theme === "dark"
                    ? "1px 1px 4px #00000066"
                    : "1px 1px 4px #ffffff99",
              }}
            >
              +{(metric_comparison * 100).toFixed(2)}%
            </span>
          ) : (
            <span
              className="text-red-500 dark:text-red-500 font-semibold"
              style={{
                textShadow:
                  theme === "dark"
                    ? "1px 1px 4px #00000066"
                    : "1px 1px 4px #ffffff99",
              }}
            >
              {(metric_comparison * 100).toFixed(2)}%
            </span>
          )}{" "}
          in last week
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({
  icon,
  metric_name,
  metric_value,
  metric_comparison,
  is_multiple = false,
  theme,
}: {
  icon: string;
  metric_name: string;
  metric_value: number | string;
  metric_comparison: number;
  is_multiple?: boolean;
  theme: string;
}) => {
  return (
    <div className="hidden lg:flex bg-forest-200/10 dark:bg-[#CDD8D3]/20 rounded-[11px] px-[13px] py-[5px] items-center backdrop-blur-[30px]">
      <Icon icon={icon} className="w-[28px] h-[32px] mr-[6px]" />
      <div className="flex flex-col items-center justify-center -space-y-[5px]">
        <div className="text-[10px] font-medium leading-[1.5]">
          {metric_name}
        </div>
        <div className="text-[24px] font-[650] leading-[1.33] flex items-end">
          <div className="text-[24px]">
            {metric_value.toLocaleString("en-GB")}
          </div>
          <div className="text-[24px] leading-tight">{is_multiple && "x"}</div>
        </div>
        <div className="text-[10px] font-medium leading-[1.5]">
          {metric_comparison > 0 ? (
            <span
              className="text-green-500 dark:text-green-500 font-semibold"
              style={{
                textShadow:
                  theme === "dark"
                    ? "1px 1px 4px #00000066"
                    : "1px 1px 4px #ffffff99",
              }}
            >
              +{(metric_comparison * 100).toFixed(2)}%
            </span>
          ) : (
            <span
              className="text-red-500 dark:text-red-500 font-semibold"
              style={{
                textShadow:
                  theme === "dark"
                    ? "1px 1px 4px #00000066"
                    : "1px 1px 4px #ffffff99",
              }}
            >
              {(metric_comparison * 100).toFixed(2)}%
            </span>
          )}{" "}
          in last week
        </div>
      </div>
    </div>
  );
};
