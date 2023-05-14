"use client";

import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsRoundedCorners from "highcharts-rounded-corners";
import HighchartsReact from "highcharts-react-official";
import Highcharts, {
  AxisLabelsFormatterContextObject,
} from "highcharts/highstock";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSessionStorage } from "usehooks-ts";
import { theme as customTheme } from "tailwind.config";
import { useTheme } from "next-themes";
import { clamp, merge } from "lodash";
import { Switch } from "../Switch";
import { AllChainsByKeys } from "@/lib/chains";
import d3 from "d3";
import { Icon } from "@iconify/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import Link from "next/link";
import { Sources } from "@/lib/datasources";

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
    type: "column",
    animation: true,
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
      enabled: true,
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

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });
    highchartsRoundedCorners(Highcharts);
    highchartsAnnotations(Highcharts);

    setHighchartsLoaded(true);
  }, []);

  const { theme } = useTheme();

  const [showUsd, setShowUsd] = useSessionStorage("showUsd", true);

  const [selectedTimespan, setSelectedTimespan] = useState("max");

  const [selectedScale, setSelectedScale] = useState("absolute");

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");

  const [zoomed, setZoomed] = useState(false);

  const [showEthereumMainnet, setShowEthereumMainnet] = useState(false);

  const [totalUsersIncrease, setTotalUsersIncrease] = useState(0);

  const getTickPositions = useCallback(
    (xMin: any, xMax: any): number[] => {
      const tickPositions: number[] = [];
      const xMinDate = new Date(xMin);
      const xMaxDate = new Date(xMax);
      const xMinMonth = xMinDate.getMonth();
      const xMaxMonth = xMaxDate.getMonth();

      const xMinYear = xMinDate.getFullYear();
      const xMaxYear = xMaxDate.getFullYear();

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
    [selectedTimespan]
  );

  const getSeriesType = useCallback(
    (name: string) => {
      if (selectedScale === "percentage") return "area";

      if (name === "ethereum") return "area";

      return "column";
    },
    [selectedScale]
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
    [selectedScale]
  );

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points } = this;
      const date = new Date(x);
      const dateString = `<div>${date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}</div><div>-</div><div> ${
        //add 7 days to the date
        new Date(date.valueOf() + 6 * 24 * 60 * 59 * 1000).toLocaleDateString(
          undefined,
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          }
        )
      }</div>`;

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-60 text-xs font-raleway"><div class="w-full flex justify-between font-bold text-[1rem] pl-6 pr-1 mb-2">${dateString}</div>`;
      const tooltipEnd = `</div>`;

      let pointsSum = 0;
      if (selectedScale !== "percentage")
        pointsSum = points.reduce((acc: number, point: any) => {
          acc += point.y;
          return pointsSum;
        }, 0);

      const tooltipPoints = points
        .sort((a: any, b: any) => b.y - a.y)
        .map((point: any) => {
          const { series, y, percentage } = point;
          const { name } = series;
          if (selectedScale === "percentage")
            return `
              <div class="flex w-full space-x-2 items-center font-medium mb-1">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${
                  AllChainsByKeys[name].colors[theme][0]
                }"></div>
                <div class="tooltip-point-name">${
                  AllChainsByKeys[name].label
                }</div>
                <div class="flex-1 text-right font-inter">${Highcharts.numberFormat(
                  percentage,
                  2
                )}%</div>
              </div>
              <!-- <div class="flex ml-6 w-[calc(100% - 24rem)] relative mb-1">
                <div class="h-[2px] w-full bg-gray-200 rounded-full absolute left-0 top-0" > </div>

                <div class="h-[2px] rounded-full absolute left-0 top-0" style="width: ${Highcharts.numberFormat(
                  percentage,
                  2
                )}%; background-color: ${
              AllChainsByKeys[name].colors[theme][0]
            };"> </div>
              </div> -->`;

          const value = formatNumber(y);
          return `
          <div class="flex w-full space-x-2 items-center font-medium mb-1">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${
              AllChainsByKeys[name].colors[theme][0]
            }"></div>
            <div class="tooltip-point-name text-md">${
              AllChainsByKeys[name].label
            }</div>
            <div class="flex-1 text-right justify-end font-inter">
              <div class="mr-1 inline-block">${parseFloat(y).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 0,
                }
              )}</div>
            </div>
          </div>
          <!-- <div class="flex ml-4 w-[calc(100% - 1rem)] relative mb-1">
            <div class="h-[2px] w-full bg-gray-200 rounded-full absolute left-0 top-0" > </div>

            <div class="h-[2px] rounded-full absolute right-0 top-0" style="width: ${formatNumber(
              (y / pointsSum) * 100
            )}%; background-color: ${
            AllChainsByKeys[name].colors[theme][0]
          }33;"></div>
          </div> -->`;
        })
        .join("");
      return tooltip + tooltipPoints + tooltipEnd;
    },
    [formatNumber, selectedScale, theme]
  );

  const [showTotalUsers, setShowTotalUsers] = useState(true);

  const filteredData = useMemo(() => {
    if (!data) return null;

    const l2s = data.filter((d) => ["all_l2s"].includes(d.name))[0];

    setTotalUsersIncrease(
      (l2s.data[l2s.data.length - 1][1] - l2s.data[l2s.data.length - 2][1]) /
        l2s.data[l2s.data.length - 2][1]
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
      filteredData.length > 0
        ? filteredData[0].data[filteredData[0].data.length - 1][0]
        : 0
    );

    const maxPlusBuffer = maxDate.valueOf() + 3.5 * 24 * 60 * 60 * 1000;

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
        xMin: Date.now() - 90 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "180d": {
        label: "180 days",
        value: 180,
        xMin: Date.now() - 180 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "365d": {
        label: "1 year",
        value: 365,
        xMin: Date.now() - 365 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      max: {
        label: "Maximum",
        value: 0,
        xMin: filteredData.reduce(
          (min, d) => Math.min(min, d.data[0][0]),
          Infinity
        ),

        xMax: maxPlusBuffer,
      },
    };
  }, [filteredData]);

  useEffect(() => {
    if (chartComponent.current) {
      chartComponent.current.xAxis[0].setExtremes(
        timespans[selectedTimespan].xMin,
        timespans[selectedTimespan].xMax
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
      [selectedTimespan, timespans]
    );

  const options = useMemo((): Highcharts.Options => {
    const dynamicOptions: Highcharts.Options = {
      chart: {
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
      },
      plotOptions: {
        area: {
          stacking: selectedScale === "percentage" ? "percent" : "normal",
        },
        column: {
          crisp: true,
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
            ? "rgba(215, 223, 222, 0.33)"
            : "rgba(41, 51, 50, 0.33)",
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
        positioner: function (this: any, width: any, height: any, point: any) {
          const chart = this.chart;
          const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
          const tooltipWidth = width;
          const tooltipHeight = height;
          const distance = 20;
          const pointX = point.plotX + plotLeft;
          const pointY = point.plotY + plotTop;
          const tooltipX =
            pointX - distance - tooltipWidth < plotLeft
              ? pointX + distance
              : pointX - tooltipWidth - distance;
          const tooltipY =
            pointY - tooltipHeight / 2 < plotTop
              ? pointY + distance
              : pointY - tooltipHeight / 2;
          return {
            x: tooltipX,
            y: tooltipY,
          };
        },
        split: false,
        followPointer: true,
        followTouchMove: true,
        backgroundColor:
          (customTheme?.extend?.colors
            ? theme === "dark"
              ? customTheme?.extend?.colors["forest"]["900"]
              : customTheme?.extend?.colors["forest"]["50"]
            : "#ffffff") + "EE",
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
      series: [
        ...filteredData
          .sort((a, b) => {
            if (selectedScale === "percentage")
              return (
                a.data[a.data.length - 1][1] - b.data[b.data.length - 1][1]
              );
            else {
              return (
                b.data[b.data.length - 1][1] - a.data[a.data.length - 1][1]
              );
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
              clip: false,
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
                  [0, AllChainsByKeys[series.name].colors[theme][0] + "33"],
                  [1, AllChainsByKeys[series.name].colors[theme][1] + "33"],
                ],
              },
              borderColor: AllChainsByKeys[series.name].colors[theme][0],
              borderWidth: 1,
              ...(getSeriesType(series.name) !== "column"
                ? {
                    shadow: {
                      color:
                        AllChainsByKeys[series.name].colors[theme][1] + "33",
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
                        [0, AllChainsByKeys[series.name].colors[theme][0]],
                        // [0.33, AllChainsByKeys[series.name].colors[1]],
                        [1, AllChainsByKeys[series.name].colors[theme][1]],
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
                                AllChainsByKeys[series.name].colors[theme][0] +
                                  "E6",
                              ],
                              // [
                              //   0.3,
                              //   //   AllChainsByKeys[series.name].colors[theme][0] + "FF",
                              //   AllChainsByKeys[series.name].colors[theme][0] +
                              //     "FF",
                              // ],
                              [
                                1,
                                AllChainsByKeys[series.name].colors[theme][1] +
                                  "E6",
                              ],
                            ]
                          : [
                              [
                                0,
                                AllChainsByKeys[series.name].colors[theme][0] +
                                  "E6",
                              ],
                              // [
                              //   0.7,
                              //   AllChainsByKeys[series.name].colors[theme][0] +
                              //     "88",
                              // ],
                              [
                                1,
                                AllChainsByKeys[series.name].colors[theme][1] +
                                  "E6",
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
                                AllChainsByKeys[series.name].colors[theme][0] +
                                  "FF",
                              ],
                              [
                                0.349,
                                AllChainsByKeys[series.name].colors[theme][0] +
                                  "88",
                              ],
                              [
                                1,
                                AllChainsByKeys[series.name].colors[theme][0] +
                                  "00",
                              ],
                            ]
                          : [
                              [
                                0,
                                AllChainsByKeys[series.name].colors[theme][0] +
                                  "FF",
                              ],
                              [
                                0.349,
                                AllChainsByKeys[series.name].colors[theme][0] +
                                  "88",
                              ],
                              [
                                1,
                                AllChainsByKeys[series.name].colors[theme][0] +
                                  "00",
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
                        AllChainsByKeys[series.name].colors[theme][0] + "99",
                      stroke:
                        AllChainsByKeys[series.name].colors[theme][0] + "66",
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
    metric,
    onXAxisSetExtremes,
    selectedScale,
    showEthereumMainnet,
    theme,
    timespans.max.xMax,
    timespans.max.xMin,
    tooltipFormatter,
  ]);

  useEffect(() => {
    if (chartComponent.current) {
      setZoomed(false);
      switch (selectedScale) {
        case "absolute":
          chartComponent.current?.update({
            plotOptions: {
              series: {
                stacking: "normal",
              },
            },
            yAxis: {
              type: "linear",
            },
            tooltip: {
              formatter: tooltipFormatter,
            },
            series: filteredData.map((series: any) => ({
              type: getSeriesType(series.name),
            })),
          });
        case "log":
          chartComponent.current?.update({
            chart: {
              type: "column",
            },
            plotOptions: {
              series: {
                stacking: "normal",
              },
            },
            yAxis: {
              type: "logarithmic",
            },
            tooltip: {
              formatter: tooltipFormatter,
            },
            series: filteredData.map((series: any) => ({
              type: getSeriesType(series.name),
            })),
          });
        case "percentage":
          chartComponent.current?.update({
            chart: {
              type: "area",
            },
            plotOptions: {
              area: {
                stacking: "percent",
                marker: {
                  enabled: false,
                },
              },
            },
            yAxis: {
              type: "linear",
            },
            tooltip: {
              formatter: tooltipFormatter,
            },
            series: filteredData.map((series: any) => ({
              type: getSeriesType(series.name),
            })),
          });
        default:
          break;
      }
    }
  }, [
    selectedScale,
    chartComponent,
    filteredData,
    tooltipFormatter,
    getSeriesType,
  ]);

  useEffect(() => {
    if (chartComponent.current) {
      chartComponent.current.reflow();
    }
  }, [chartComponent, filteredData]);

  return (
    <div className="w-full mb-[6rem] mt-[3rem] relative">
      <div className="flex w-full justify-between items-center absolute -top-[3rem] left-0 right-0 text-xs rounded-full bg-forest-50 p-0.5">
        <div className="flex justify-center items-center space-x-1">
          <button
            className={`rounded-full px-2 py-1.5 text-md lg:px-4 lg:py-3 lg:text-md xl:px-4 xl:py-3 xl:text-lg font-medium ${
              showTotalUsers
                ? "bg-forest-500 dark:bg-[#151A19]"
                : "hover:bg-forest-100"
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
            className={`rounded-full px-2 py-1.5 text-md lg:px-4 lg:py-3 lg:text-md xl:px-4 xl:py-3 xl:text-lg font-medium ${
              "absolute" === selectedScale && !showTotalUsers
                ? "bg-forest-500 dark:bg-[#151A19]"
                : "hover:bg-forest-100"
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
            className={`rounded-full px-2 py-1.5 text-md lg:px-4 lg:py-3 lg:text-md xl:px-4 xl:py-3 xl:text-lg font-medium ${
              "percentage" === selectedScale
                ? "bg-forest-500 dark:bg-[#151A19]"
                : "hover:bg-forest-100"
            }`}
            onClick={() => {
              setShowTotalUsers(false);
              setSelectedScale("percentage");
              setSelectedMetric("Percentage");
            }}
          >
            Percentage
          </button>
          {/* {showTimeIntervals &&
            timeIntervals.map((timeInterval, i) => (
              <button
                key={timeInterval}
                className={`rounded-full px-2 py-1 font-medium capitalize ${
                  selectedTimeInterval === timeInterval
                    ? "bg-forest-900 text-forest-50 hover:bg-forest-700"
                    : "hover:bg-forest-100"
                }`}
                onClick={() => {
                  onTimeIntervalChange(timeInterval);
                  // chartComponent.current?.xAxis[0].setExtremes(
                  //   timespans[timespan].xMin,
                  //   timespans[timespan].xMax
                  // );
                }}
              >
                {timeInterval}
              </button>
            ))} */}
        </div>
        <div className="flex justify-center items-center space-x-1">
          {!zoomed ? (
            Object.keys(timespans).map((timespan) => (
              <button
                key={timespan}
                className={`rounded-full px-2 py-1.5 text-md lg:px-4 lg:py-3 lg:text-md xl:px-4 xl:py-3 xl:text-lg font-medium ${
                  selectedTimespan === timespan
                    ? "bg-forest-500 dark:bg-[#151A19]"
                    : "hover:bg-forest-100"
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
                      timespans.max.xMax
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
                className={`rounded-full flex items-center space-x-3 px-2 py-[5px] text-md lg:px-4 lg:py-3 lg:text-md xl:px-4 xl:py-3 xl:text-lg font-medium border-[1px] border-forest-800`}
                onClick={() => {
                  chartComponent?.current?.xAxis[0].setExtremes(
                    timespans[selectedTimespan].xMin,
                    timespans[selectedTimespan].xMax
                  );
                  setZoomed(false);
                }}
              >
                <Icon icon="feather:zoom-out" className="w-6 h-6" />
                <div>Reset Zoom</div>
              </button>
              <button
                className={`rounded-full px-2 py-1.5 text-md lg:px-4 lg:py-3 lg:text-md xl:px-4 xl:py-3 xl:text-lg font-medium bg-forest-100 dark:bg-[#151A19]`}
              >
                {intervalShown?.label}
              </button>
            </>
          )}
        </div>
      </div>
      {highchartsLoaded && filteredData.length > 0 ? (
        <div className="w-full py-4 rounded-xl">
          <div className="w-full h-[26rem] relative rounded-xl">
            <div className="absolute w-full h-[24rem] top-4">
              <HighchartsReact
                highcharts={Highcharts}
                options={options}
                constructorType={"stockChart"}
                ref={(chart) => {
                  chartComponent.current = chart?.chart;
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-[26rem] my-4 flex justify-center items-center">
          <div className="w-10 h-10 animate-spin">
            <Icon icon="feather:loader" className="w-10 h-10 text-forest-500" />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center absolute -bottom-[5rem] left-0 right-0 rounded-full bg-forest-50 p-0.5">
        {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
        {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
        {/* toggle ETH */}
        <div className="z-10 block lg:hidden">
          <Switch
            checked={showEthereumMainnet}
            onChange={() => setShowEthereumMainnet(!showEthereumMainnet)}
            rightLabel="ETH"
          />
        </div>
        <div className="z-10 hidden lg:block">
          <Switch
            checked={showEthereumMainnet}
            onChange={() => setShowEthereumMainnet(!showEthereumMainnet)}
            rightLabel="Show Ethereum"
          />
        </div>
      </div>
      <div className="flex justify-end items-center absolute -bottom-[6.5rem] left-0 right-0 rounded-full">
        {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
        {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
        {/* toggle ETH */}

        <div className="flex justify-center items-center">
          <div className="flex bg-forest-100 rounded-xl px-3 py-1.5 items-center mr-5">
            <Icon
              icon="feather:users"
              className="w-8 h-8 lg:w-14 lg:h-14 text-forest-900 mr-2"
            />
            <div className="flex flex-col items-center justify-center">
              <div className="text-[0.65rem] lg:text-xs font-medium text-forest-900 leading-tight">
                Total Users
              </div>
              <div className="text-xl lg:text-3xl font-[650] text-forest-900">
                {latest_total.toLocaleString()}
              </div>
              <div className="text-[0.65rem] lg:text-xs font-medium text-forest-900 leading-tight">
                {latest_total_comparison > 0 ? (
                  <span
                    className="text-[#45AA6F] dark:text-[#4CFF7E] font-semibold"
                    // style={{
                    //   textShadow:
                    //     theme === "dark"
                    //       ? "1px 1px 4px #00000066"
                    //       : "1px 1px 4px #ffffff99",
                    // }}
                  >
                    +{(latest_total_comparison * 100).toFixed(2)}%
                  </span>
                ) : (
                  <span
                    className="text-[#DD3408] dark:text-[#FE5468] font-semibold"
                    // style={{
                    //   textShadow:
                    //     theme === "dark"
                    //       ? "1px 1px 4px #00000066"
                    //       : "1px 1px 4px #ffffff99",
                    // }}
                  >
                    {(latest_total_comparison * 100).toFixed(2)}%
                  </span>
                )}{" "}
                in last week
              </div>
            </div>
          </div>
          <div className="flex bg-forest-100 rounded-xl px-3 py-1.5 items-center mr-1.5">
            <Icon
              icon="feather:layers"
              className="w-8 h-8 lg:w-14 lg:h-14 text-forest-900 mr-2"
            />
            <div className="flex flex-col items-center justify-center">
              <div className="text-[0.65rem] lg:text-xs font-medium text-forest-900 leading-tight">
                Layer-2 Dominance
              </div>
              <div className="text-xl lg:text-3xl font-[650] text-forest-900">
                {l2_dominance.toFixed(2)}x
              </div>
              <div className="text-[0.65rem] lg:text-xs font-medium text-forest-900 leading-tight">
                {l2_dominance_comparison > 0 ? (
                  <span
                    className="text-[#45AA6F] dark:text-[#4CFF7E] font-semibold"
                    // style={{
                    //   textShadow:
                    //     theme === "dark"
                    //       ? "1px 1px 4px #00000066"
                    //       : "1px 1px 4px #ffffff99",
                    // }}
                  >
                    +{l2_dominance_comparison.toFixed(2)}%
                  </span>
                ) : (
                  <span
                    className="text-[#DD3408] dark:text-[#FE5468] font-semibold"
                    // style={{
                    //   textShadow:
                    //     theme === "dark"
                    //       ? "1px 1px 4px #00000066"
                    //       : "1px 1px 4px #ffffff99",
                    // }}
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
              <div className="p-1.5 z-10 mr-1">
                <Icon icon="feather:info" className="w-6 h-6 text-forest-900" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
              <div className="px-3 text-sm font-medium bg-forest-100 text-forest-900 rounded-xl shadow-lg z-50 w-[435px] h-[80px] flex items-center">
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
                          className="text-forest-900 hover:text-forest-500 dark:text-forest-100 dark:hover:text-forest-500 underline"
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
