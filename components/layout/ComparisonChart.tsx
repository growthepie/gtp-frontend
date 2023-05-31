import HighchartsReact from "highcharts-react-official";
import Highcharts, {
  AxisLabelsFormatterContextObject,
} from "highcharts/highstock";
import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsRoundedCorners from "highcharts-rounded-corners";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useLocalStorage } from "usehooks-ts";
import { merge } from "lodash";
// import { theme as customTheme } from "tailwind.config.js";
import { useTheme } from "next-themes";
import { Switch } from "../Switch";
import { AllChainsByKeys } from "@/lib/chains";
import d3 from "d3";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import Link from "next/link";
import { Sources } from "@/lib/datasources";
import { useUIContext } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";
import Container from "./Container";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135", // mignight-express but lighter
  ANNOTATION_BG: "rgb(215, 223, 222)",
  SERIES: ["#36a2eb", "#ff6384", "#8142ff", "#ff9f40", "#ffcd56", "#4bc0c0"],
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

type MainChartProps = {
  data: {
    name: string;
    data: any;
    types: any[];
  };
  dataKeys: string[];
};

export default function ComparisonChart({
  data,
  timeIntervals,
  onTimeIntervalChange,
  showTimeIntervals = true,
  children,
  sources,
  avg,
  showEthereumMainnet,
  setShowEthereumMainnet,
  selectedTimespan,
  setSelectedTimespan,
}: {
  data: any;
  timeIntervals: string[];
  onTimeIntervalChange: (interval: string) => void;
  showTimeIntervals: boolean;
  children?: ReactNode;
  sources: string[];
  avg?: boolean;
  showEthereumMainnet: boolean;
  setShowEthereumMainnet: (show: boolean) => void;
  selectedTimespan: string;
  setSelectedTimespan: (timespan: string) => void;
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

  // const [darkMode, setDarkMode] = useLocalStorage("darkMode", true);
  const { theme } = useTheme();

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  // const [selectedTimespan, setSelectedTimespan] = useState("365d");

  const [selectedScale, setSelectedScale] = useState("absolute");

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");

  const [zoomed, setZoomed] = useState(false);

  const [valuePrefix, setValuePrefix] = useState("");

  const isMobile = useMediaQuery("(max-width: 767px)");

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
      if (name === "ethereum") return "area";
      if (selectedScale === "percentage") return "area";
      if (selectedScale === "log") return "area";

      return "line";
    },
    [selectedScale]
  );

  // const getChartType = useCallback(() => {
  //   if (selectedScale === "percentage") return "area";
  //   if (selectedScale === "log") return "column";

  //   return "line";
  // }, [selectedScale]);

  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);

  const formatNumber = useCallback(
    (value: number | string, isAxis = false) => {
      const prefix = valuePrefix;

      return isAxis
        ? selectedScale !== "percentage"
          ? prefix + d3.format(".2s")(value).replace(/G/, "B")
          : d3.format(".2~s")(value).replace(/G/, "B") + "%"
        : d3.format(",.2~s")(value).replace(/G/, "B");
    },
    [valuePrefix, selectedScale]
  );

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points } = this;
      const date = new Date(x);
      const dateString = date.toLocaleDateString(undefined, {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-52 md:w-60 text-xs font-raleway"><div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2">${dateString}</div>`;
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
              <div class="mr-1 inline-block"><span class="opacity-70 inline-block mr-[1px]">${valuePrefix}</span>${parseFloat(
            y
          ).toLocaleString(undefined, {
            minimumFractionDigits: valuePrefix ? 2 : 0,
            maximumFractionDigits: valuePrefix ? 2 : 0,
          })}</div>
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
    [formatNumber, selectedScale, theme, valuePrefix]
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
      [isMobile]
    );

  const filteredData = useMemo<any[]>(() => {
    if (!data)
      return [
        {
          name: "",
          data: [],
          types: [],
        },
      ];

    const d: any[] = showEthereumMainnet
      ? data
      : data.filter((d) => d.name !== "ethereum");

    if (d.length === 0)
      return [
        {
          name: "",
          data: [],
          types: [],
        },
      ];
    return d;
  }, [data, showEthereumMainnet]);

  const timespans = useMemo(() => {
    let maxDate = new Date();
    if (filteredData && filteredData[0].name !== "") {
      maxDate = new Date(
        filteredData.length > 0
          ? filteredData[0].data[filteredData[0].data.length - 1][0]
          : 0
      );
    }

    const buffer = 0.5 * 24 * 60 * 60 * 1000;
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
        xMin: maxDate.valueOf() - 90 * 24 * 60 * 60 * 1000 - buffer,
        xMax: maxPlusBuffer,
      },
      "180d": {
        label: "180 days",
        value: 180,
        xMin: maxDate.valueOf() - 180 * 24 * 60 * 60 * 1000 - buffer,
        xMax: maxPlusBuffer,
      },
      "365d": {
        label: "1 year",
        value: 365,
        xMin: maxDate.valueOf() - 365 * 24 * 60 * 60 * 1000 - buffer,
        xMax: maxPlusBuffer,
      },
      max: {
        label: "Maximum",
        value: 0,
        xMin:
          filteredData[0].name === ""
            ? Date.now() - 365 * 24 * 60 * 60 * 1000
            : filteredData.reduce(
                (min, d) => Math.min(min, d.data[0][0]),
                Infinity
              ) - buffer,

        xMax: maxPlusBuffer,
      },
    };
  }, [filteredData, selectedScale]);

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

  const dataGrouping = useMemo(() => {
    let grouping: Highcharts.DataGroupingOptionsObject | undefined = {
      enabled: false,
    };

    if (
      (avg === true || selectedScale === "log") &&
      ["max", "365d"].includes(selectedTimespan)
    ) {
      grouping = {
        enabled: false,
        // units: [["week", [1]]],
        // approximation: "average",
        // forced: true,
      };
    } else {
      grouping = {
        enabled: false,
      };
    }

    return grouping;
  }, [avg, selectedScale, selectedTimespan]);

  const scaleToPlotOptions = useMemo<Highcharts.PlotOptions>(() => {
    switch (selectedScale) {
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
      case "log":
        return {
          column: {
            stacking: "normal",
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
  }, [selectedScale]);

  const options = useMemo((): Highcharts.Options => {
    if (!filteredData || filteredData.length === 0) return {};

    if (filteredData[0].types.includes("usd")) {
      if (!showUsd) setValuePrefix("Ξ");
      else setValuePrefix("$");
    } else {
      setValuePrefix("");
    }

    const dynamicOptions: Highcharts.Options = {
      chart: {
        height: isMobile ? 275 : 400,
        type: getSeriesType(filteredData[0].name),
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
      plotOptions: scaleToPlotOptions,
      legend: {
        enabled: false,
      },
      yAxis: {
        opposite: false,
        showFirstLabel: true,
        showLastLabel: true,
        type: "linear",
        // ["absolute", "percentage"].includes(selectedScale)
        //   ? "linear"
        //   : "logarithmic",
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
        // ...xAxisMinMax,
        min: timespans[selectedTimespan].xMin,
        max: timespans[selectedTimespan].xMax,
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
      //@ts-ignore
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
              // getSeriesType(series.name) === "column"
              //   ? {
              //       pointPlacement: 0.5,
              //       pointPadding: 0.15,
              //       pointRange:
              //         timeIntervalToMilliseconds[
              //           dataGrouping.enabled ? "weekly" : "daily"
              //         ],
              //     }
              //   :
              {
                pointPlacement: 0.5,
                // pointInterval: 7,
                // pointIntervalUnit: "day",
              };

            return {
              name: series.name,
              // always show ethereum on the bottom
              zIndex: zIndex,
              step:
                // getSeriesType(series.name) === "column" ||
                // selectedScale === "log"
                //   ? "center"
                //   :
                undefined,
              data:
                !showUsd && series.types.includes("usd")
                  ? series.data.map((d: any) => [d[0], d[2]])
                  : series.data.map((d: any) => [d[0], d[1]]),
              ...pointsSettings,
              type: getSeriesType(series.name),
              // fill if series name is ethereum
              clip: true,
              dataGrouping: dataGrouping,
              borderRadiusTopLeft: borderRadius,
              borderRadiusTopRight: borderRadius,
              // type: getSeriesType(series.name),
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
                    AllChainsByKeys[series.name]?.colors[theme ?? "dark"][0] +
                      "33",
                  ],
                  [
                    1,
                    AllChainsByKeys[series.name]?.colors[theme ?? "dark"][1] +
                      "33",
                  ],
                ],
              },
              borderColor:
                AllChainsByKeys[series.name]?.colors[theme ?? "dark"][0],
              borderWidth: 1,
              lineWidth: 2,
              ...// @ts-ignore
              (getSeriesType(series.name) !== "column"
                ? {
                    shadow: {
                      color:
                        AllChainsByKeys[series.name]?.colors[
                          theme ?? "dark"
                        ][1] + "33",
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
                          AllChainsByKeys[series.name]?.colors[
                            theme ?? "dark"
                          ][0],
                        ],
                        // [0.33, AllChainsByKeys[series.name].colors[1]],
                        [
                          1,
                          AllChainsByKeys[series.name]?.colors[
                            theme ?? "dark"
                          ][1],
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
                                AllChainsByKeys[series.name]?.colors[
                                  theme ?? "dark"
                                ][0] + "E6",
                              ],
                              // [
                              //   0.3,
                              //   //   AllChainsByKeys[series.name].colors[theme][0] + "FF",
                              //   AllChainsByKeys[series.name].colors[theme][0] +
                              //     "FF",
                              // ],
                              [
                                1,
                                AllChainsByKeys[series.name]?.colors[
                                  theme ?? "dark"
                                ][1] + "E6",
                              ],
                            ]
                          : [
                              [
                                0,
                                AllChainsByKeys[series.name]?.colors[
                                  theme ?? "dark"
                                ][0] + "E6",
                              ],
                              // [
                              //   0.7,
                              //   AllChainsByKeys[series.name].colors[theme][0] +
                              //     "88",
                              // ],
                              [
                                1,
                                AllChainsByKeys[series.name]?.colors[
                                  theme ?? "dark"
                                ][1] + "E6",
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
                      stops: [
                        [
                          0,
                          AllChainsByKeys[series.name]?.colors[
                            theme ?? "dark"
                          ][0] + "FF",
                        ],
                        [
                          0.349,
                          AllChainsByKeys[series.name]?.colors[
                            theme ?? "dark"
                          ][0] + "88",
                        ],
                        [
                          1,
                          AllChainsByKeys[series.name]?.colors[
                            theme ?? "dark"
                          ][0] + "00",
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
                        AllChainsByKeys[series.name]?.colors[
                          theme ?? "dark"
                        ][0] + "99",
                      stroke:
                        AllChainsByKeys[series.name]?.colors[
                          theme ?? "dark"
                        ][0] + "66",
                      strokeWidth: 0,
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
              showInNavigator: false,
            };
          }),
      ],
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
    isMobile,
    getSeriesType,
    scaleToPlotOptions,
    theme,
    getTickPositions,
    timespans,
    onXAxisSetExtremes,
    selectedTimespan,
    tooltipFormatter,
    tooltipPositioner,
    showUsd,
    formatNumber,
    selectedScale,
    showEthereumMainnet,
    dataGrouping,
  ]);

  useEffect(() => {
    if (chartComponent.current) {
      chartComponent.current.reflow();
    }
  }, [chartComponent, filteredData]);

  const { isSidebarOpen } = useUIContext();

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
        chartComponent.current.setSize(null, 275, false);
      } else {
        chartComponent.current.setSize(null, 400, false);
      }
    }
  }, [isMobile]);

  return (
    <div className="w-full flex-col relative">
      <Container className="">
        <div className="flex w-full justify-between items-center text-xs rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5">
          <div className="hidden md:flex justify-center items-center">
            <div className="w-7 h-7 md:w-9 md:h-9 relative ml-[21px] mr-1.5">
              <Image
                src="/GTP-Chain.png"
                alt="GTP Chain"
                className="object-contain"
                fill
              />
            </div>
            {/* <Icon icon="gtp:chain" className="w-7 h-7 lg:w-9 lg:h-9" /> */}
            <h2 className="text-[24px] xl:text-[30px] leading-snug font-bold hidden lg:block my-[10px]">
              Selected Chains
            </h2>
          </div>
          <div className="flex w-full md:w-auto justify-between md:justify-center items-stretch md:items-center space-x-[4px] md:space-x-1">
            {!zoomed ? (
              Object.keys(timespans).map((timespan) => (
                <button
                  key={timespan}
                  className={`rounded-full px-[16px] py-[8px] grow text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium ${
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
                  className={`rounded-full flex items-center space-x-3 px-[15px] py-[7px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium border-[0.5px] border-forest-400`}
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
                  className={`rounded-full px-[16px] py-[8px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4  bg-forest-100 dark:bg-forest-1000`}
                >
                  {intervalShown?.label}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="w-full flex flex-col-reverse lg:flex-row mt-8 md:mt-0">
          <div className="hidden lg:block lg:w-1/2 xl:w-5/12 pl-2 pr-[19px] self-center">
            <div className="-mt-7">{children}</div>
          </div>
          {highchartsLoaded ? (
            <>
              <div className="w-full lg:w-1/2 xl:w-7/12 relative">
                <div className="w-full p-0 py-0 xl:pl-4 xl:py-14">
                  <div className="w-full h-[17rem] md:h-[26rem] relative rounded-xl">
                    <div className="block absolute w-full h-[275px] md:h-[24rem] top-0 md:top-4">
                      <HighchartsReact
                        highcharts={Highcharts}
                        options={options}
                        ref={(chart) => {
                          chartComponent.current = chart?.chart;
                        }}
                        constructorType={"stockChart"}
                      />
                    </div>
                  </div>
                </div>
                {avg && ["365d", "max"].includes(selectedTimespan) && (
                  <div className="absolute -top-[10px] right-3 sm:-top-[7px] md:top-[5px] md:right-3 lg:top-[5px] xl:top-[60px] xl:right-[calc(0%+1.75rem)] rounded-full text-xs font-medium capitalize">
                    Displaying 7d Rolling Average
                  </div>
                )}
                <div className="absolute top-3 left-[calc(0%-1.75rem)] rounded-full text-xs font-medium"></div>
              </div>
            </>
          ) : (
            <div className="w-full lg:w-1/2 xl:w-7/12 h-[26rem] my-4 flex justify-center items-center">
              <div className="w-10 h-10 animate-spin">
                <Icon
                  icon="feather:loader"
                  className="w-10 h-10 text-forest-500"
                />
              </div>
            </div>
          )}
        </div>
        {data.filter((d) => d.name === "ethereum").length > 0 ? (
          <div className="flex flex-col md:flex-row w-full justify-normal md:justify-between items-center text-sm md:text-base rounded-2xl md:rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 px-0.5 md:px-1">
            {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
            {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
            {/* toggle ETH */}
            <div
              className={`flex justify-between w-full md:w-auto pt-0 md:pt-0 h-[35px] md:h-auto`}
            >
              <div className="flex z-10">
                <Switch
                  checked={showEthereumMainnet}
                  onChange={() => setShowEthereumMainnet(!showEthereumMainnet)}
                />
                <div className="ml-2 block md:hidden lg:block leading-[2.5]">
                  Show Ethereum
                </div>
                <div className="ml-2 hidden md:block lg:hidden leading-[2.5]">
                  ETH
                </div>
              </div>
              <div className="block md:hidden z-10">
                <Tooltip placement="left" allowInteract>
                  <TooltipTrigger>
                    <div className="p-1 z-10 mr-0 md:-mr-0.5">
                      <Icon icon="feather:info" className="w-6 h-6" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
                    <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-autow-[420px] h-[80px] flex items-center">
                      <div className="flex flex-col space-y-1">
                        <div className="font-bold text-sm leading-snug">
                          Data Sources:
                        </div>
                        <div className="flex space-x-1 flex-wrap font-medium text-xs leading-snug">
                          {sources
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
                            .reduce((prev, curr) => [prev, ", ", curr])}
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className={`md:hidden w-[70%] mx-auto my-[4px] pb-2 md:pb-0`}>
              <hr
                className={`border-dotted border-top-[1px] h-[0.5px] border-forest-400`}
              />
            </div>
            <div className="flex justify-normal md:justify-end items-center w-full md:w-auto">
              {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
              {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
              {/* toggle ETH */}

              <div className="flex justify-center items-center pl-0 md:pl-0 w-full md:w-auto">
                <div className="flex justify-between md:justify-center items-center  space-x-[4px] md:space-x-1 mr-0 md:mr-2.5 w-full md:w-auto ">
                  <button
                    className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                      "absolute" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                      setSelectedScale("absolute");
                    }}
                  >
                    Absolute
                  </button>
                  <button
                    className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base  lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                      "log" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                      setSelectedScale("log");
                    }}
                  >
                    Stacked
                  </button>
                  <button
                    className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base  lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                      "percentage" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                      setSelectedScale("percentage");
                    }}
                  >
                    Percentage
                  </button>
                </div>
                <div className="hidden md:flex">
                  <Tooltip placement="left" allowInteract>
                    <TooltipTrigger>
                      <div className="p-1 z-10">
                        <Icon icon="feather:info" className="w-6 h-6" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
                      <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-[420px] h-[80px] flex items-center">
                        <div className="flex flex-col space-y-1">
                          <div className="font-bold text-sm leading-snug">
                            Data Sources:
                          </div>
                          <div className="flex space-x-1 flex-wrap font-medium text-xs leading-snug">
                            {sources
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
        ) : (
          <div className="flex flex-col md:flex-row w-full justify-normal md:justify-between items-center text-sm md:text-base rounded-2xl md:rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 px-0.5 md:px-1">
            {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
            {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
            {/* toggle ETH */}

            <div className="flex justify-normal items-center w-full md:w-auto">
              {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
              {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
              {/* toggle ETH */}

              <div className="flex justify-center items-center pl-0 md:pl-0 w-full md:w-auto">
                <div className="flex justify-between md:justify-center items-center  space-x-[4px] md:space-x-1 mr-0 md:mr-2.5 w-full md:w-auto ">
                  <button
                    className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                      "absolute" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                      setSelectedScale("absolute");
                    }}
                  >
                    Absolute
                  </button>
                  <button
                    className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base  lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                      "log" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                      setSelectedScale("log");
                    }}
                  >
                    Stacked
                  </button>
                  <button
                    className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base  lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                      "percentage" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                      setSelectedScale("percentage");
                    }}
                  >
                    Percentage
                  </button>
                </div>
                <div className="flex">
                  <Tooltip placement="left" allowInteract>
                    <TooltipTrigger>
                      <div className="p-1 z-10 ml-[5px]">
                        <Icon icon="feather:info" className="w-6 h-6" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
                      <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-[420px] h-[80px] flex items-center">
                        <div className="flex flex-col space-y-1">
                          <div className="font-bold text-sm leading-snug">
                            Data Sources:
                          </div>
                          <div className="flex space-x-1 flex-wrap font-medium text-xs leading-snug">
                            {sources
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
        )}
      </Container>
      <Container className="block mt-6 lg:hidden w-full !pr-0">
        {children}
      </Container>
    </div>
  );
}
