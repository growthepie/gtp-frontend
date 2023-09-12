"use client";

import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsRoundedCorners from "highcharts-rounded-corners";
import HighchartsReact from "highcharts-react-official";
import Highcharts, {
  AxisLabelsFormatterContextObject,
} from "highcharts/highstock";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { merge } from "lodash";
import { Switch } from "../Switch";
import { AllChainsByKeys } from "@/lib/chains";
import d3 from "d3";
import { Icon } from "@iconify/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import Link from "next/link";
import { Sources } from "@/lib/datasources";
import { useUIContext } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";
import ChartWatermark from "./ChartWatermark";
import { IS_PREVIEW } from "@/lib/helpers";

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
    // type: "column",
    animation: false,
    backgroundColor: "transparent",
    showAxes: false,

    zooming: {
      type: "x",
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
    panning: {
      enabled: false,
    },
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
    labels: {
      style: { color: COLORS.LABEL },
      enabled: true,
      formatter: (item) => {
        const date = new Date(item.value);
        const isMonthStart = date.getDate() === 1;
        const isYearStart = isMonthStart && date.getMonth() === 0;

        if (isYearStart) {
          return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
        } else {
          return `<span style="">${date.toLocaleDateString(undefined, {
            timeZone: "UTC",
            month: "short",
          })}</span>`;
        }
      },
    },
    tickmarkPlacement: "on",
    tickWidth: 4,
    tickLength: 4,
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
        radius: 0,
      },
      shadow: false,
      animation: true,
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
  latest_total,
  latest_total_comparison,
  l2_dominance,
  l2_dominance_comparison,
  selectedMetric,
  setSelectedMetric,
  metric,
  sources,
}: // timeIntervals,
// onTimeIntervalChange,
// showTimeIntervals = true,
{
  data: any;
  latest_total: number;
  latest_total_comparison: number;
  l2_dominance: number;
  l2_dominance_comparison: number;
  selectedMetric: string;
  setSelectedMetric: (metric: string) => void;
  metric: string;
  sources: string[];
  // timeIntervals: string[];
  // onTimeIntervalChange: (interval: string) => void;
  // showTimeIntervals: boolean;
}) {
  const [highchartsLoaded, setHighchartsLoaded] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });
    highchartsRoundedCorners(Highcharts);
    highchartsAnnotations(Highcharts);

    setHighchartsLoaded(true);

    Highcharts.wrap(Highcharts.Pointer.prototype, "dragStart", function (p, e) {
      console.log("dragStart");
      // place vertical dotted line on click
      if (this.chart.series.length > 0) {
        const x = e.chartX;
        const y = e.chartY;

        this.chart.zoomStartX = x;
        this.chart.zoomStartY = y;
      }

      p.call(this);
    });

    Highcharts.wrap(Highcharts.Pointer.prototype, "drag", function (p, e) {
      console.log("drag");

      setIsDragging(true);

      // update vertical dotted line on drag
      if (this.chart.series.length > 0) {
        const x = e.chartX;
        const y = e.chartY;

        const leftX = this.chart.zoomStartX < x ? this.chart.zoomStartX : x;
        const rightX = this.chart.zoomStartX < x ? x : this.chart.zoomStartX;

        if (this.chart.zoomLineStart) {
          this.chart.zoomLineStart.destroy();
        }

        this.chart.zoomLineStart = this.chart.renderer
          .path([
            "M",
            this.chart.zoomStartX,
            this.chart.plotTop,
            "L",
            this.chart.zoomStartX,
            this.chart.plotTop + this.chart.plotHeight,
          ])
          .attr({
            stroke: "#fff",
            stroke: "rgba(205, 216, 211, 1)",
            "stroke-width": "1px",
            "stroke-linejoin": "round",
            "stroke-dasharray": "2, 1",
            "shape-rendering": "crispEdges",
            zIndex: 100,
          })
          .add();

        if (this.chart.zoomStartIcon) {
          this.chart.zoomStartIcon.destroy();
        }

        // place "rightArrow.svg" icon in middle of vertical dotted line
        this.chart.zoomStartIcon = this.chart.renderer
          .image(
            "/cursors/rightArrow.svg",
            leftX - 17,
            this.chart.zoomStartY,
            34,
            34,
          )
          .attr({
            zIndex: 999,
          })
          .add();

        this.chart.zoomStartIcon.toFront();

        if (this.chart.zoomLineEnd) {
          this.chart.zoomLineEnd.destroy();
        }

        this.chart.zoomLineEnd = this.chart.renderer
          .path([
            "M",
            x,
            this.chart.plotTop,
            "L",
            x,
            this.chart.plotTop + this.chart.plotHeight,
          ])
          .attr({
            stroke: "#fff",
            stroke: "rgba(205, 216, 211, 1)",
            "stroke-width": "1px",
            "stroke-linejoin": "round",
            "stroke-dasharray": "2, 1",
            "shape-rendering": "crispEdges",
            zIndex: 100,
          })
          .add();

        this.chart.zoomLineEnd.toFront();

        if (this.chart.zoomEndIcon) {
          this.chart.zoomEndIcon.destroy();
        }

        // place "leftArrow.svg" icon in middle of vertical dotted line
        this.chart.zoomEndIcon = this.chart.renderer
          .image("/cursors/leftArrow.svg", rightX - 17, y, 34, 34)
          .attr({
            zIndex: 999,
          })
          .add();

        this.chart.zoomEndIcon.toFront();
      }

      p.call(this);
    });

    Highcharts.wrap(Highcharts.Pointer.prototype, "drop", function (p, e) {
      console.log("drop");

      setIsDragging(false);

      // remove vertical dotted line on release
      if (this.chart.zoomLineStart) {
        try {
          this.chart.zoomLineStart.destroy();
          this.chart.zoomLineStart = null;
        } catch (e) {
          console.log(e);
        }
      }

      if (this.chart.zoomLineEnd) {
        try {
          this.chart.zoomLineEnd.destroy();
          this.chart.zoomLineEnd = null;
        } catch (e) {
          console.log(e);
        }
      }

      if (this.chart.zoomStartIcon) {
        try {
          this.chart.zoomStartIcon.destroy();
          this.chart.zoomStartIcon = null;
        } catch (e) {
          console.log(e);
        }
      }

      if (this.chart.zoomEndIcon) {
        try {
          this.chart.zoomEndIcon.destroy();
          this.chart.zoomEndIcon = null;
        } catch (e) {
          console.log(e);
        }
      }

      p.call(this);
    });
  }, []);

  const { isSidebarOpen } = useUIContext();

  const { theme } = useTheme();

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [selectedTimespan, setSelectedTimespan] = useState("max");

  const [selectedScale, setSelectedScale] = useState("absolute");

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");

  const [zoomed, setZoomed] = useState(false);

  const [showEthereumMainnet, setShowEthereumMainnet] = useState(false);

  const [totalUsersIncrease, setTotalUsersIncrease] = useState(0);

  const isMobile = useMediaQuery("(max-width: 767px)");

  const getTickPositions = useCallback(
    (xMin: any, xMax: any): number[] => {
      const tickPositions: number[] = [];
      const xMinDate = new Date(xMin);
      const xMaxDate = new Date(xMax);
      const xMinMonth = xMinDate.getUTCMonth();
      const xMaxMonth = xMaxDate.getUTCMonth();

      const xMinYear = xMinDate.getUTCFullYear();
      const xMaxYear = xMaxDate.getUTCFullYear();

      if (selectedTimespan === "max") {
        for (let year = xMinYear; year <= xMaxYear; year++) {
          for (let month = 0; month < 12; month = month + 4) {
            if (year === xMinYear && month < xMinMonth) continue;
            if (year === xMaxYear && month > xMaxMonth) continue;
            tickPositions.push(Date.UTC(year, month, 1).valueOf());
          }
        }
        return tickPositions;
      }

      for (let year = xMinYear; year <= xMaxYear; year++) {
        for (let month = 0; month < 12; month++) {
          if (year === xMinYear && month < xMinMonth) continue;
          if (year === xMaxYear && month > xMaxMonth) continue;
          tickPositions.push(Date.UTC(year, month, 1).valueOf());
        }
      }

      return tickPositions;
    },
    [selectedTimespan],
  );

  const getSeriesType = useCallback(
    (name: string) => {
      if (selectedScale === "percentage") return "area";

      if (name === "ethereum") return "area";

      return "column";
    },
    [selectedScale],
  );

  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);

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
      const { x, points } = this;
      const date = new Date(x);
      const dateString = `
      <div>
        ${date.toLocaleDateString(undefined, {
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

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-52 md:w-60 text-xs font-raleway"><div class="flex-1 font-bold text-[13px] md:text-[1rem] ml-6 mb-2 flex justify-between">${dateString}</div>`;
      const tooltipEnd = `</div>`;

      let pointsSum = points.reduce((acc: number, point: any) => {
        acc += point.y;
        return acc;
      }, 0);

      const tooltipPoints = points
        .sort((a: any, b: any) => b.y - a.y)
        .map((point: any) => {
          const { series, y, percentage } = point;
          const { name } = series;
          if (selectedScale === "percentage")
            return `
              <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${
                  AllChainsByKeys[name].colors[theme][0]
                }"></div>
                <div class="tooltip-point-name">${
                  AllChainsByKeys[name].label
                }</div>
                <div class="flex-1 text-right font-inter">${Highcharts.numberFormat(
                  percentage,
                  2,
                )}%</div>
              </div>
              <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
                <div class="h-[2px] rounded-none absolute right-0 -top-[3px] w-full bg-white/0"></div>
    
                <div class="h-[2px] rounded-none absolute right-0 -top-[3px] bg-forest-900 dark:bg-forest-50" 
                style="
                  width: ${percentage}%;
                  background-color: ${AllChainsByKeys[name].colors[theme][0]};
                "></div>
              </div>`;

          const value = formatNumber(y);
          return `
          <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${
              AllChainsByKeys[name].colors[theme][0]
            }"></div>
            <div class="tooltip-point-name text-md">${
              AllChainsByKeys[name].label
            }</div>
            <div class="flex-1 text-right justify-end font-inter flex">
              <div class="inline-block">${parseFloat(y).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 0,
                },
              )}</div>
            </div>
          </div>
          <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
            <div class="h-[2px] rounded-none absolute right-0 -top-[3px] w-full bg-white/0"></div>

            <div class="h-[2px] rounded-none absolute right-0 -top-[3px] bg-forest-900 dark:bg-forest-50" 
            style="
              width: ${(y / pointsSum) * 100}%;
              background-color: ${AllChainsByKeys[name].colors[theme][0]};
            "></div>
          </div>`;
        })
        .join("");
      return tooltip + tooltipPoints + tooltipEnd;
    },
    [formatNumber, selectedScale, theme],
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

  const [showTotalUsers, setShowTotalUsers] = useState(true);

  const filteredData = useMemo(() => {
    if (!data) return null;

    const l2s = data.filter((d) => ["all_l2s"].includes(d.name))[0];

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

  const timespans = useMemo(() => {
    const maxDate = new Date(
      filteredData.length > 0 &&
      filteredData[0].data.length > 0 &&
      filteredData[0].data[filteredData[0].data.length - 1][0]
        ? filteredData[0].data[filteredData[0].data.length - 1][0]
        : 0,
    );
    const buffer =
      selectedScale === "percentage" ? 0 : 3.5 * 24 * 60 * 60 * 1000;
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
        xMin: maxDate.valueOf() - 90 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "180d": {
        label: "180 days",
        value: 180,
        xMin: maxDate.valueOf() - 180 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "365d": {
        label: "1 year",
        value: 365,
        xMin: maxDate.valueOf() - 365 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      max: {
        label: "Maximum",
        value: 0,
        xMin: filteredData.reduce((min, d) => {
          if (d.data && d.data[0] && d.data[0][0] !== undefined) {
            return Math.min(min, d.data[0][0]);
          }
          return min;
        }, Infinity),

        xMax: maxPlusBuffer,
      },
    };
  }, [filteredData, selectedScale]);

  useEffect(() => {
    if (chartComponent.current) {
      chartComponent.current.xAxis[0].setExtremes(
        timespans[selectedTimespan].xMin,
        timespans[selectedTimespan].xMax,
      );
    }
  }, [selectedTimespan, timespans]);

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
        }
      },
      [selectedTimespan, timespans],
    );

  const options = useMemo((): Highcharts.Options => {
    const dynamicOptions: Highcharts.Options = {
      chart: {
        height: isMobile ? 250 : 400,
        type: selectedScale === "percentage" ? "area" : "column",
        plotBorderColor: "transparent",

        zooming: {
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
        // events: {
        //   load: function () {},
        // },
        // height: isMobile ? 200 : 400,
      },
      plotOptions: {
        area: {
          stacking: selectedScale === "percentage" ? "percent" : "normal",
          animation: true,
          dataGrouping: {
            enabled: false,
          },
        },
        column: {
          animation: false,
          crisp: true,
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
        ordinal: false,
        minorTicks: true,
        minorTickLength: 2,
        minorTickWidth: 2,
        minorGridLineWidth: 0,
        minorTickInterval: 1000 * 60 * 60 * 24 * 7,
        // calculate tick positions based on the selected time interval so that the ticks are aligned to the first day of the month
        tickPositions: getTickPositions(timespans.max.xMin, timespans.max.xMax),
        labels: {
          style: {
            color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
          },
        },
        events: {
          afterSetExtremes: onXAxisSetExtremes,
        },
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
              daily: 1 * 24 * 3600 * 1000,
              weekly: 7 * 24 * 3600 * 1000,
              monthly: 30 * 24 * 3600 * 1000,
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
                    // pointInterval: 7,
                    // pointIntervalUnit: "day",
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
                    series.name && theme
                      ? AllChainsByKeys[series.name]?.colors[theme][0] + "33"
                      : [],
                  ],

                  [
                    1,
                    series.name && theme
                      ? AllChainsByKeys[series.name]?.colors[theme][1] + "33"
                      : [],
                  ],
                ],
              },
              borderColor:
                series.name && theme
                  ? AllChainsByKeys[series.name]?.colors[theme][0]
                  : "transparent",
              borderWidth: 1,
              lineWidth: 2,
              ...(getSeriesType(series.name) !== "column"
                ? {
                    shadow: {
                      color:
                        series.name && theme
                          ? AllChainsByKeys[series.name]?.colors[theme][1] +
                            "33"
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
                          series.name && theme
                            ? AllChainsByKeys[series.name]?.colors[theme][0]
                            : [],
                        ],
                        // [0.33, AllChainsByKeys[series.name].colors[1]],
                        [
                          1,
                          series.name && theme
                            ? AllChainsByKeys[series.name]?.colors[theme][1]
                            : [],
                        ],
                      ],
                    },
                  }
                : series.name === "all_l2s"
                ? {
                    borderColor: "transparent",

                    shadow: {
                      color: "#CDD8D3" + "FF",
                      // color:
                      //   AllChainsByKeys[series.name].colors[theme][1] + "33",
                      // width: 10,
                      offsetX: 0,
                      offsetY: 0,
                      width: 2,
                    },
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
                                series.name && theme
                                  ? AllChainsByKeys[series.name]?.colors[
                                      theme
                                    ][0] + "E6"
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
                                series.name && theme
                                  ? AllChainsByKeys[series.name]?.colors[
                                      theme
                                    ][1] + "E6"
                                  : [],
                              ],
                            ]
                          : [
                              [
                                0,
                                series.name && theme
                                  ? AllChainsByKeys[series.name]?.colors[
                                      theme
                                    ][0] + "E6"
                                  : [],
                              ],
                              // [
                              //   0.7,
                              //   AllChainsByKeys[series.name].colors[theme][0] +
                              //     "88",
                              // ],
                              [
                                1,
                                series.name && theme
                                  ? AllChainsByKeys[series.name]?.colors[
                                      theme
                                    ][1] + "E6"
                                  : [],
                              ],
                            ],
                    },
                  }
                : {
                    borderColor: "transparent",
                    shadow: {
                      color: "#CDD8D3" + "FF",
                      offsetX: 0,
                      offsetY: 0,
                      width: 2,
                    },
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
                                series.name && theme
                                  ? AllChainsByKeys[series.name]?.colors[
                                      theme
                                    ][0] + "FF"
                                  : [],
                              ],
                              [
                                0.349,
                                series.name && theme
                                  ? AllChainsByKeys[series.name]?.colors[
                                      theme
                                    ][0] + "88"
                                  : [],
                              ],
                              [
                                1,
                                series.name && theme
                                  ? AllChainsByKeys[series.name]?.colors[
                                      theme
                                    ][0] + "00"
                                  : [],
                              ],
                            ]
                          : [
                              [
                                0,
                                series.name && theme
                                  ? AllChainsByKeys[series.name]?.colors[
                                      theme
                                    ][0] + "FF"
                                  : [],
                              ],
                              [
                                0.349,
                                series.name && theme
                                  ? AllChainsByKeys[series.name]?.colors[
                                      theme
                                    ][0] + "88"
                                  : [],
                              ],
                              [
                                1,
                                series.name && theme
                                  ? AllChainsByKeys[series.name]?.colors[
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
                        series.name && theme
                          ? AllChainsByKeys[series.name]?.colors[theme][0] +
                            "99"
                          : "transparent",
                      stroke:
                        series.name && theme
                          ? AllChainsByKeys[series.name]?.colors[theme][0] +
                            "66"
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
        outlineWidth: 0,
        outlineColor: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
        maskFill:
          theme === "dark"
            ? "rgba(215, 223, 222, 0.08)"
            : "rgba(41, 51, 50, 0.08)",
        maskInside: true,

        series: {
          // type: "column",
          // color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
          opacity: 0.5,
          fillOpacity: 0.3,
          lineWidth: 1,
          dataGrouping: {
            enabled: false,
          },
          height: 30,
        },
        xAxis: {
          labels: {
            enabled: true,
            style: {
              color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
              fontSize: "8px",
              fontWeight: "400",
              // textTransform: "uppercase",
              letterSpacing: "0.1em",
              lineHeight: "1.5em",
              textShadow: "none",
              textOutline: "none",
              cursor: "default",
              pointerEvents: "none",
              userSelect: "none",
              opacity: 0.5,
            },
            formatter: function () {
              return new Date(this.value).toLocaleDateString(undefined, {
                timeZone: "UTC",
                month: "short",
                //day: "numeric",
                year: "numeric",
              });
            },
          },
          tickLength: 0,
          lineWidth: 0,
          gridLineWidth: 0,
        },
        handles: {
          backgroundColor:
            theme === "dark"
              ? "rgba(215, 223, 222, 0.3)"
              : "rgba(41, 51, 50, 0.3)",
          borderColor:
            theme === "dark" ? "rgba(215, 223, 222, 0)" : "rgba(41, 51, 50, 0)",
          width: 8,
          height: 20,
          symbols: ["doublearrow", "doublearrow"],
        },
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
        height: 1,
        barBackgroundColor:
          theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41, 51, 50)",
        barBorderRadius: 7,
        barBorderWidth: 0,
        rifleColor: "transparent",
        buttonBackgroundColor:
          theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41, 51, 50)",
        buttonBorderWidth: 0,
        buttonBorderRadius: 7,
        trackBackgroundColor: "none",
        trackBorderWidth: 1,
        trackBorderRadius: 8,
        trackBorderColor:
          theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41, 51, 50)",
      },
    };

    return merge({}, baseOptions, dynamicOptions);
  }, [
    filteredData,
    formatNumber,
    getSeriesType,
    getTickPositions,
    isMobile,
    metric,
    onXAxisSetExtremes,
    selectedScale,
    showEthereumMainnet,
    theme,
    timespans.max.xMax,
    timespans.max.xMin,
    tooltipFormatter,
    tooltipPositioner,
  ]);

  useEffect(() => {
    if (chartComponent.current) {
      chartComponent.current.reflow();
    }
  }, [chartComponent, filteredData]);

  useEffect(() => {
    setTimeout(() => {
      if (chartComponent.current) {
        chartComponent.current.reflow();
      }
    }, 300);
  }, [isSidebarOpen]);

  useEffect(() => {
    if (chartComponent.current) {
      if (isMobile) {
        chartComponent.current.setSize(null, 200, false);
      } else {
        chartComponent.current.setSize(null, 400, false);
      }
    }
  }, [isMobile]);

  return (
    <div className="w-full mb-[0rem] lg:mb-[6rem] relative">
      <div className="flex lg:hidden justify-center pb-[30px]">
        <div className="flex bg-forest-100 dark:bg-[#4B5553] rounded-xl w-1/2 px-1.5 py-1.5 md:px-3 md:py-1.5 items-center mr-2">
          <div className="flex flex-col items-center flex-1">
            <Icon
              icon="feather:users"
              className="w-8 h-8 md:w-14 md:h-14 mr-2 relative left-1"
            />
            <div className="block md:hidden text-[0.6rem] sm:text-[0.65rem] lg:text-xs font-medium leading-tight">
              Total Users
            </div>
          </div>
          <div className="flex flex-col items-center justify-center w-7/12">
            <div className="hidden md:block text-xs font-medium leading-tight">
              Total Users
            </div>
            <div className="text-xl md:text-3xl font-[650]">
              {latest_total.toLocaleString()}
            </div>
            <div className="text-[0.6rem] md:text-xs font-medium leading-tight">
              {latest_total_comparison > 0 ? (
                <span
                  className="text-green-500 dark:text-green-400 font-semibold"
                  style={{
                    textShadow:
                      theme === "dark"
                        ? "1px 1px 4px #00000066"
                        : "1px 1px 4px #ffffff99",
                  }}
                >
                  +{(latest_total_comparison * 100).toFixed(2)}%
                </span>
              ) : (
                <span
                  className="text-red-500 dark:text-red-400 font-semibold"
                  style={{
                    textShadow:
                      theme === "dark"
                        ? "1px 1px 4px #00000066"
                        : "1px 1px 4px #ffffff99",
                  }}
                >
                  {(latest_total_comparison * 100).toFixed(2)}%
                </span>
              )}{" "}
              in last week
            </div>
          </div>
        </div>
        <div className="flex bg-forest-100 dark:bg-[#4B5553] w-1/2 rounded-xl px-1.5 py-1.5 md:px-3 md:py-1.5 items-center">
          <div className="flex flex-col items-center flex-1">
            <Icon
              icon="feather:layers"
              className="w-8 h-8 md:w-14 md:h-14 mr-2 relative left-1"
            />
            <div className="block md:hidden text-[0.58rem] sm:text-[0.65rem] lg:text-xs font-medium leading-tight">
              L2 Dominance
            </div>
          </div>
          <div className="flex flex-col items-center justify-center w-7/12">
            <div className="hidden md:block text-xs font-medium leading-tight">
              L2 Dominance
            </div>
            <div className="text-xl md:text-3xl font-[650]">
              {l2_dominance.toFixed(2)}x
            </div>
            <div className="text-[0.6rem] md:text-xs font-medium leading-tight">
              {l2_dominance_comparison > 0 ? (
                <span
                  className="text-green-500 dark:text-green-400 font-semibold"
                  style={{
                    textShadow:
                      theme === "dark"
                        ? "1px 1px 4px #00000066"
                        : "1px 1px 4px #ffffff99",
                  }}
                >
                  +{l2_dominance_comparison.toFixed(2)}%
                </span>
              ) : (
                <span
                  className="text-red-500 dark:text-red-400 font-semibold"
                  style={{
                    textShadow:
                      theme === "dark"
                        ? "1px 1px 4px #00000066"
                        : "1px 1px 4px #ffffff99",
                  }}
                >
                  {l2_dominance_comparison.toFixed(2)}%
                </span>
              )}{" "}
              in last week
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col rounded-[15px] py-[2px] px-[2px] text-xs xl:text-base xl:flex xl:flex-row w-full justify-between items-center static -top-[8rem] left-0 right-0 xl:rounded-full dark:bg-[#1F2726] bg-forest-50 md:py-[2px]">
        <div className="flex w-full xl:w-auto justify-between xl:justify-center items-stretch xl:items-center space-x-[4px] xl:space-x-1">
          <button
            className={`rounded-full grow px-4 py-1.5 xl:py-4 font-medium ${
              showTotalUsers
                ? "bg-forest-500 dark:bg-forest-1000"
                : "hover:bg-forest-500/10"
            }`}
            onClick={() => {
              setShowTotalUsers(true);
              setSelectedScale("absolute");
              setSelectedMetric("Total Users");
            }}
          >
            Total Users
          </button>
          <button
            className={`rounded-full grow px-4 py-1.5 xl:py-4 font-medium ${
              "absolute" === selectedScale && !showTotalUsers
                ? "bg-forest-500 dark:bg-forest-1000"
                : "hover:bg-forest-500/10"
            }`}
            onClick={() => {
              setShowTotalUsers(false);
              setSelectedScale("absolute");
              setSelectedMetric("Users per Chain");
            }}
          >
            Users per Chain
          </button>

          <button
            className={`rounded-full grow px-4 py-1.5 xl:py-4 font-medium ${
              "percentage" === selectedScale
                ? "bg-forest-500 dark:bg-forest-1000"
                : "hover:bg-forest-500/10"
            }`}
            onClick={() => {
              setShowTotalUsers(false);
              setSelectedScale("percentage");
              setSelectedMetric("Percentage");
            }}
          >
            Percentage
          </button>
        </div>
        <div className="block xl:hidden w-[70%] mx-auto my-[10px]">
          <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
        </div>
        <div className="flex w-full xl:w-auto justify-between xl:justify-center items-stretch xl:items-center mx-4 xl:mx-0 space-x-[4px] xl:space-x-1">
          {!zoomed ? (
            Object.keys(timespans).map((timespan) => (
              <button
                key={timespan}
                //rounded-full sm:w-full px-4 py-1.5 xl:py-4 font-medium
                className={`rounded-full grow px-4 py-1.5 xl:py-4 font-medium ${
                  selectedTimespan === timespan
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedTimespan(timespan);
                  // setXAxis();
                  chartComponent?.current?.xAxis[0].update({
                    min: timespans[selectedTimespan].xMin,
                    max: timespans[selectedTimespan].xMax,
                    // calculate tick positions based on the selected time interval so that the ticks are aligned to the first day of the month
                    tickPositions: getTickPositions(
                      timespans.max.xMin,
                      timespans.max.xMax,
                    ),
                  });
                  setZoomed(false);
                }}
              >
                {timespans[timespan].label}
              </button>
            ))
          ) : (
            <>
              <button
                className={`rounded-full flex items-center justify-center space-x-3 px-4 py-1.5 xl:py-4 text-md w-full xl:w-auto xl:px-4 xl:text-md font-medium border-[1px] border-forest-800`}
                onClick={() => {
                  chartComponent?.current?.xAxis[0].setExtremes(
                    timespans[selectedTimespan].xMin,
                    timespans[selectedTimespan].xMax,
                  );
                  setZoomed(false);
                }}
              >
                <Icon
                  icon="feather:zoom-out"
                  className="h-4 w-4 xl:w-6 xl:h-6"
                />
                <div>Reset Zoom</div>
              </button>
              <button
                className={`rounded-full text-md w-full xl:w-auto px-4 py-1.5 xl:py-4 xl:px-4 font-medium bg-forest-100 dark:bg-forest-1000`}
              >
                {intervalShown?.label}
              </button>
            </>
          )}
        </div>
      </div>
      {highchartsLoaded ? (
        <div className="w-full py-4 rounded-xl">
          <div className="w-full h-[16rem] md:h-[26rem] relative rounded-xl">
            <div
              className="absolute w-full h-[24rem] top-1 md:top-4"
              style={{
                cursor: isDragging
                  ? "none"
                  : `url("/cursors/zoom.svg") 17 17, auto`,
              }}
              // onClick={(e) => {
              //   const chart = chartComponent?.current;

              //   if (!chart)
              //     return console.error("chartComponent.current is null");

              //   if (chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY)) {
              //     if (e.type === "mousedown") {
              //       const x = e.chartX - chart.plotLeft;
              //       const y = e.chartY - chart.plotTop;

              //       // place vertical dotted line at the click position
              //       chart.xAxis[0].addPlotLine({
              //         id: "plot-line",
              //         value: chart.xAxis[0].toValue(x, true),
              //         color: "rgba(215, 223, 222, 0.5)",
              //         width: 1,
              //         dashStyle: "Dash",
              //         zIndex: 100,
              //       });
              //     }
              //     if (e.type === "mouseup") {
              //     }
              //   }
              // }}
            >
              <HighchartsReact
                highcharts={Highcharts}
                options={options}
                constructorType={"stockChart"}
                ref={(chart) => {
                  chartComponent.current = chart?.chart;
                }}
              />
            </div>
            <div className="absolute bottom-[46.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-50 mix-blend-lighten">
              <ChartWatermark className="w-[128.67px] h-[30.67px] md:w-[193px] md:h-[46px]" />
            </div>
            {filteredData.length === 0 && (
              <div className="absolute top-[calc(50%+2rem)] left-[0px] text-xs font-medium flex justify-center w-full text-forest-500/60">
                No chain(s) selected for comparison. Please select at least one.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-[26rem] my-4 flex justify-center items-center">
          <div className="w-10 h-10 animate-spin">
            <Icon icon="feather:loader" className="w-10 h-10 text-forest-500" />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center absolute -bottom-[1rem] lg:-bottom-[5rem] left-0 right-0 rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5">
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
      </div>
      <div className="flex justify-end items-center absolute -bottom-[2.5rem] lg:-bottom-[6.5rem] left-0 right-0 rounded-full">
        <div className="flex justify-center items-center">
          <div className="hidden lg:flex bg-forest-100 dark:bg-[#4B5553] rounded-xl px-3 py-1.5 items-center mr-5">
            <Icon
              icon="feather:users"
              className="w-8 h-8 lg:w-14 lg:h-14 mr-2"
            />
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs font-medium leading-tight">
                Total Users
              </div>
              <div className="text-3xl font-[650]">
                {latest_total.toLocaleString()}
              </div>
              <div className="text-xs font-medium leading-tight">
                {latest_total_comparison > 0 ? (
                  <span
                    className="text-green-500 dark:text-green-400 font-semibold"
                    style={{
                      textShadow:
                        theme === "dark"
                          ? "1px 1px 4px #00000066"
                          : "1px 1px 4px #ffffff99",
                    }}
                  >
                    +{(latest_total_comparison * 100).toFixed(2)}%
                  </span>
                ) : (
                  <span
                    className="text-red-500 dark:text-red-400 font-semibold"
                    style={{
                      textShadow:
                        theme === "dark"
                          ? "1px 1px 4px #00000066"
                          : "1px 1px 4px #ffffff99",
                    }}
                  >
                    {(latest_total_comparison * 100).toFixed(2)}%
                  </span>
                )}{" "}
                in last week
              </div>
            </div>
          </div>
          <div className="hidden lg:flex bg-forest-100 dark:bg-[#4B5553] rounded-xl px-3 py-1.5 items-center mr-1.5">
            <Icon
              icon="feather:layers"
              className="w-8 h-8 lg:w-14 lg:h-14 mr-2"
            />
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs font-medium leading-tight">
                Layer-2 Dominance
              </div>
              <div className="text-3xl font-[650]">
                {l2_dominance.toFixed(2)}x
              </div>
              <div className="text-xs font-medium leading-tight">
                {l2_dominance_comparison > 0 ? (
                  <span
                    className="text-green-500 dark:text-green-400 font-semibold"
                    style={{
                      textShadow:
                        theme === "dark"
                          ? "1px 1px 4px #00000066"
                          : "1px 1px 4px #ffffff99",
                    }}
                  >
                    +{l2_dominance_comparison.toFixed(2)}%
                  </span>
                ) : (
                  <span
                    className="text-red-500 dark:text-red-400 font-semibold"
                    style={{
                      textShadow:
                        theme === "dark"
                          ? "1px 1px 4px #00000066"
                          : "1px 1px 4px #ffffff99",
                    }}
                  >
                    {l2_dominance_comparison.toFixed(2)}%
                  </span>
                )}{" "}
                in last week
              </div>
            </div>
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
  );
}
