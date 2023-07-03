"use client";

import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import highchartsAnnotations from "highcharts/modules/annotations";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { useLocalStorage, useWindowSize, useIsMounted } from "usehooks-ts";
import fullScreen from "highcharts/modules/full-screen";
import _merge from "lodash/merge";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import Image from "next/image";
import d3 from "d3";
import { AllChainsByKeys } from "@/lib/chains";
import { debounce, forEach } from "lodash";

import { navigationItems } from "@/lib/navigation";
import { useUIContext } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";
import ChartWatermark from "./ChartWatermark";
import { ChainsData } from "@/types/api/ChainResponse";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

export default function ChainChart({
  data,
  chain,
}: {
  data: ChainsData;
  chain: string;
}) {
  // Keep track of the mounted state
  const isMounted = useIsMounted();

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", "M", "B", "T", "P", "E"],
      },
    });
    highchartsAnnotations(Highcharts);
    fullScreen(Highcharts);
  }, []);

  const { theme } = useTheme();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [selectedTimespan, setSelectedTimespan] = useState("365d");
  const [selectedScale, setSelectedScale] = useState("log");
  const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");
  const [showEthereumMainnet, setShowEthereumMainnet] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomMin, setZoomMin] = useState<number | null>(null);
  const [zoomMax, setZoomMax] = useState<number | null>(null);

  const { isSidebarOpen } = useUIContext();
  const { width, height } = useWindowSize();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const zoomedMargin = [1, 15, 0, 0];
  const defaultMargin = [1, 15, 0, 0];

  const timespans = useMemo(() => {
    let max = 0;
    let min = Infinity;
    const now = Date.now();

    Object.keys(data.metrics).forEach((key) => {
      max = Math.max(
        max,
        ...data.metrics[key].daily.data.map((d: any) => d[0]),
      );

      min = Math.min(
        min,
        ...data.metrics[key].daily.data.map((d: any) => d[0]),
      );
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
  }, [data]);

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

  function hexToRgba(hex, alpha) {
    const hexWithoutHash = hex.replace("#", "");
    const r = parseInt(hexWithoutHash.substring(0, 2), 16);
    const g = parseInt(hexWithoutHash.substring(2, 4), 16);
    const b = parseInt(hexWithoutHash.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function getDate(unix) {
    const date = new Date(unix);
    const formattedDate = date.toLocaleString("en-us", {
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

  //const [prefixes, setPrefixes] = useState<string[]>([]);

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
    (key: string, value: number | string, isAxis = false) => {
      let prefix = prefixes[key];
      let suffix = "";
      let val = parseFloat(value as string);

      if (
        !showUsd &&
        data.metrics[key].daily.types.includes("eth") &&
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
            if (val < 10)
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
      // if (xMinDate.getDate() !== 1) {
      //   tickPositions.push(new Date(xMinYear, xMinMonth + 1, 1).getTime());
      // } else {
      //   tickPositions.push(xMinDate.getTime());
      // }

      // // find last day of month less than or equal to xMax
      // if (xMaxDate.getDate() !== 1) {
      //   tickPositions.push(new Date(xMaxYear, xMaxMonth, 1).getTime());
      // } else {
      //   tickPositions.push(xMaxDate.getTime());
      // }

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

  const displayValues = useMemo(() => {
    const p: {
      [key: string]: {
        value: string;
        prefix: string;
        suffix: string;
      };
    } = {};
    Object.keys(data.metrics).forEach((key) => {
      let prefix = "";
      let suffix = "";
      let valueIndex = 1;
      let valueMultiplier = 1;

      let valueFormat = Intl.NumberFormat(undefined, {
        notation: "compact",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });

      let navItem = navigationItems[1].options.find((ni) => ni.key === key);

      if (data.metrics[key].daily.types.includes("eth")) {
        if (!showUsd) {
          prefix = "Ξ";
          valueIndex = data.metrics[key].daily.types.indexOf("eth");
          if (navItem && navItem.page?.showGwei) {
            prefix = "";
            suffix = " Gwei";
            valueMultiplier = 1000000000;
          }
        } else {
          prefix = "$";

          valueIndex = data.metrics[key].daily.types.indexOf("usd");
        }
      } else {
      }

      let dateIndex = data.metrics[key].daily.data.length - 1;

      const latestUnix =
        data.metrics[key].daily.data[data.metrics[key].daily.data.length - 1];

      if (intervalShown) {
        const intervalMaxIndex = data.metrics[key].daily.data.findIndex(
          (d) => d[0] >= intervalShown?.max,
        );
        if (intervalMaxIndex !== -1) dateIndex = intervalMaxIndex;
      }

      let value = valueFormat.format(
        data.metrics[key].daily.data[dateIndex][valueIndex] * valueMultiplier,
      );

      p[key] = { value, prefix, suffix };
    });
    return p;
  }, [data.metrics, showUsd, intervalShown]);

  const tooltipFormatter = useCallback(
    function (this: Highcharts.TooltipFormatterContextObject) {
      const { x, points } = this;

      if (!points || !x) return;

      const series = points[0].series;

      const date = new Date(x);

      // const prefix = prefixes[series.name] ?? "";

      const dateString = date.toLocaleDateString(undefined, {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-36 text-xs font-raleway"><div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2">${dateString}</div>`;
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
                  AllChainsByKeys[data.chain_id].colors[theme][0]
                }"></div>
                <!--
                <div class="tooltip-point-name">${
                  AllChainsByKeys[data.chain_id].label
                }</div>
                -->
                <div class="flex-1 text-right font-inter">${Highcharts.numberFormat(
                  percentage,
                  2,
                )}%</div>
              </div>
              <!-- <div class="flex ml-6 w-[calc(100% - 24rem)] relative mb-1">
                <div class="h-[2px] w-full bg-gray-200 rounded-full absolute left-0 top-0" > </div>

                <div class="h-[2px] rounded-full absolute left-0 top-0" style="width: ${Highcharts.numberFormat(
                  percentage,
                  2,
                )}%; background-color: ${
              AllChainsByKeys[data.chain_id].colors[theme][0]
            };"> </div>
              </div> -->`;

          let prefix = displayValues[series.name].prefix;
          let suffix = displayValues[series.name].suffix;
          let value = y;

          if (
            !showUsd &&
            data.metrics[series.name].daily.types.includes("eth")
          ) {
            if (showGwei(series.name)) {
              prefix = "";
              suffix = " Gwei";
            }
          }

          return `
          <div class="flex w-full space-x-2 items-center font-medium mb-1">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${
              AllChainsByKeys[data.chain_id].colors[theme][0]
            }"></div>
            <!--
            <div class="tooltip-point-name text-md">${
              AllChainsByKeys[data.chain_id].label
            }</div>
            -->
            <div class="flex-1 text-left justify-start font-inter flex">
                <div class="opacity-70 mr-0.5 ${
                  !prefix && "hidden"
                }">${prefix}</div>
                ${parseFloat(value).toLocaleString(undefined, {
                  minimumFractionDigits: prefix ? 2 : 0,
                  maximumFractionDigits: prefix ? 2 : 0,
                })}
                <div class="opacity-70 ml-0.5 ${
                  !suffix && "hidden"
                }">${suffix}</div>
            </div>
          </div>
          <!-- <div class="flex ml-4 w-[calc(100% - 1rem)] relative mb-1">
            <div class="h-[2px] w-full bg-gray-200 rounded-full absolute left-0 top-0" > </div>

            <div class="h-[2px] rounded-full absolute right-0 top-0" style="width: ${formatNumber(
              name,
              (y / pointsSum) * 100,
            )}%; background-color: ${
            AllChainsByKeys[data.chain_id].colors[theme][0]
          }33;"></div>
          </div> -->`;
        })
        .join("");
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

        const tooltipY = pointY - tooltipHeight / 2;

        if (isMobile) {
          if (tooltipX < plotLeft) {
            tooltipX = pointX + distance;
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

      if (chartComponents.current && chartComponents.current.length > 1) {
        chartComponents.current.forEach((chart) => {
          if (!chart || chart.index === hoveredChart.index) return;

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
                  point.setState("hover");
                  chart.xAxis[0].drawCrosshair(simulatedPointerEvent);
                }
                return;
              }
            }
          }

          chart.xAxis[0].hideCrosshair();
          chart.series[hoveredSeries.index].points.forEach((point) => {
            point.setState();
          });
        });
      }
    },

    [chartComponents],
  );

  const options: Highcharts.Options = {
    accessibility: { enabled: false },
    exporting: { enabled: false },
    chart: {
      type: "area",
      height: 142 - 15,
      backgroundColor: undefined,
      margin: [1, 0, 0, 0],
      spacingBottom: 0,
      panning: { enabled: true },
      panKey: "shift",
      zooming: {
        type: "x",
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
          ? "rgba(215, 223, 222, 0.33)"
          : "rgba(41, 51, 50, 0.33)",

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
      min: zoomed
        ? zoomMin
        : timespans[selectedTimespan].xMin - 1000 * 60 * 60 * 24 * 7,
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
            return `<span style="">${date.toLocaleDateString(undefined, {
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
        lineWidth: 2,
        // marker: {
        //   radius: 12,
        //   lineWidth: 4,
        // },
        fillOpacity: 1,
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
          },
          stops: [
            [0, AllChainsByKeys[data.chain_id].colors[theme][0] + "33"],
            [1, AllChainsByKeys[data.chain_id].colors[theme][1] + "33"],
          ],
        },
        shadow: {
          color:
            AllChainsByKeys[data.chain_id]?.colors[theme ?? "dark"][1] + "33",
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
            [0, AllChainsByKeys[data.chain_id]?.colors[theme ?? "dark"][0]],
            // [0.33, AllChainsByKeys[series.name].colors[1]],
            [1, AllChainsByKeys[data.chain_id]?.colors[theme ?? "dark"][1]],
          ],
        },
        borderColor: AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][0],
        borderWidth: 1,
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
  };

  const lastPointLines = useMemo<{
    [key: string]: Highcharts.SVGElement;
  }>(() => ({}), []);

  const lastPointCircles = useMemo<{
    [key: string]: Highcharts.SVGElement;
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
          timespans[selectedTimespan].xMin - paddingMilliseconds,
          timespans[selectedTimespan].xMax,
          true,
        );
      });
    }
  }, [selectedTimespan, timespans, zoomed]);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const delayPromises = [];

  const resituateChart = debounce(() => {
    if (chartComponents.current && !zoomed) {
      chartComponents.current.forEach((chart) => {
        delay(50)
          .then(() => {
            isMounted() && chart && chart.setSize(null, null, true);
            // chart.reflow();
          })
          .then(() => {
            delay(50).then(() => isMounted() && chart && chart.reflow());
          })
          .then(() => {
            delay(50).then(() => isMounted() && chart && resetXAxisExtremes());
          });
      });
    }
  }, 50);

  useEffect(() => {
    resituateChart();

    // cancel the debounced function on component unmount
    return () => {
      resituateChart.cancel();
    };
  }, [
    chartComponents,
    selectedTimespan,
    timespans,
    width,
    height,
    isSidebarOpen,
    resituateChart,
  ]);

  const enabledFundamentalsKeys = useMemo<string[]>(() => {
    return navigationItems[1].options.map((option) => option.key ?? "");
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full">
      <style>
        {`
        .highcharts-tooltip-container {
          z-index: 9999 !important;
        }
        .highcharts-grid.highcharts-yaxis-grid > .highcharts-grid-line:first-child {
          stroke-width: 0px !important;
        `}
      </style>
      <div className="flex w-full justify-between items-center text-xs rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 mb-[32px]">
        <div className="flex justify-center items-center">
          <div className="hidden md:flex justify-center items-center space-x-[8px]">
            <Image
              src="/GTP-Metrics.png"
              alt="pie slice"
              width={36}
              height={36}
              className="ml-[21px]"
            />
            <h2 className="text-[24px] xl:text-[30px] leading-snug font-bold hidden lg:block my-[10px]">
              All Chain Metrics
            </h2>
          </div>
        </div>
        <div className="flex w-full md:w-auto justify-between md:justify-center items-stretch md:items-center space-x-[4px] md:space-x-1">
          {!zoomed ? (
            Object.keys(timespans).map((timespan) => (
              <button
                key={timespan}
                className={`rounded-full grow px-[16px] py-[8px] text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium ${
                  selectedTimespan === timespan
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedTimespan(timespan);
                }}
              >
                {timespans[timespan].label}
              </button>
            ))
          ) : (
            <div className="flex">
              <button
                className={`rounded-full flex items-center space-x-3 px-[15px] py-[7px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium border-[0.5px] border-forest-400`}
                onClick={() => {
                  //chartComponent?.current?.xAxis[0].setExtremes(
                  //timespans[selectedTimespan].xMin,
                  //</div>timespans[selectedTimespan].xMax,
                  //);
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
            </div>
          )}
        </div>
      </div>

      {data && (
        <div
          className="grid grid-rows-8 lg:grid-rows-3 lg:grid-cols-2 lg:grid-flow-col gap-y-0 gap-x-[15px]"
          // style={{
          //   gridRow: `span ${Math.ceil(enabledFundamentalsKeys.length / 2)}`,
          // }}
        >
          {enabledFundamentalsKeys
            // .filter((key) => enabledFundamentalsKeys.includes(key))
            .map((key, i) => {
              if (!Object.keys(data.metrics).includes(key)) {
                return (
                  <div key={key} className="w-full relative">
                    <div className="w-full h-[60px] lg:h-[176px] relative  pointer-events-none">
                      <div className="w-full absolute top-0 -bottom-[15px] text-[10px] opacity-10 z-0">
                        <div className="absolute left-[15px] h-full border-l border-forest-500 dark:border-forest-600 pl-0.5 align-bottom flex items-end"></div>
                        <div className="absolute right-[15px] h-full border-r border-forest-500 dark:border-forest-600 pr-0.5 align-bottom flex items-end"></div>
                      </div>
                      <div className="absolute w-full h-full bg-forest-50 dark:bg-[#1F2726] text-forest-50 rounded-[15px] opacity-30 z-30"></div>
                      <div className="absolute w-full h-[142px] top-[49px]"></div>
                      <div className="absolute top-[14px] w-full flex justify-between items-center space-x-4 px-[26px] opacity-30">
                        <div className="text-[20px] leading-snug font-bold break-inside-avoid">
                          {
                            navigationItems[1].options.find(
                              (o) => o.key === key,
                            )?.page?.title
                          }
                        </div>
                        <div className="lg:hidden text-xs flex-1 text-right leading-snug">
                          {data.chain_id === "ethereum" && (
                            <>
                              {key === "tvl" && (
                                <>
                                  TVL On-Chain data is not available for
                                  Ethereum
                                </>
                              )}
                            </>
                          )}
                          {data.chain_id === "imx" && (
                            <>
                              {key === "txcosts" && (
                                <>IMX does not charge Transaction Costs</>
                              )}
                            </>
                          )}
                        </div>
                        {/* <div className="text-[18px] leading-snug flex space-x-[2px]">
                          Unavailable
                        </div> */}
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
                      <div>
                        <div className="absolute inset-0 hidden lg:flex font-medium opacity-30 select-none justify-center items-center text-xs lg:text-sm">
                          {data.chain_id === "ethereum" && (
                            <>
                              {key === "tvl" && (
                                <>
                                  TVL On-Chain data is not available for
                                  Ethereum
                                </>
                              )}
                            </>
                          )}
                          {data.chain_id === "imx" && (
                            <>
                              {key === "txcosts" && (
                                <>IMX does not charge Transaction Costs</>
                              )}
                            </>
                          )}
                        </div>
                        <Icon
                          icon={
                            navigationItems[1].options.find(
                              (o) => o.key === key,
                            )?.icon ?? ""
                          }
                          className="absolute h-[64px] w-[64px] top-[55px] right-[26px] dark:text-[#CDD8D3] opacity-5 pointer-events-none"
                        />
                      </div>
                    </div>
                    <div className="w-full h-[15px] relative text-[10px]">
                      <div className="absolute left-[15px] h-[15px] border-l border-forest-500 dark:border-forest-600 pl-0.5 align-bottom flex items-end"></div>
                      <div className="absolute right-[15px] h-[15px] border-r border-forest-500 dark:border-forest-600 pr-0.5 align-bottom flex items-end"></div>
                    </div>
                    {(key === "stables_mcap" || key === "txcosts") &&
                      intervalShown && (
                        <div
                          className={`w-full h-[15px] absolute -bottom-[15px] text-[10px] text-forest-600/80 dark:text-forest-500/80 ${
                            key === "txcosts" ? "hidden lg:block" : ""
                          }`}
                        >
                          <div className="absolute left-[15px] align-bottom flex items-end z-30 ">
                            {new Date(intervalShown.min).toLocaleDateString(
                              undefined,
                              {
                                timeZone: "UTC",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <div className="absolute right-[15px] align-bottom flex items-end z-30">
                            {new Date(intervalShown.max).toLocaleDateString(
                              undefined,
                              {
                                timeZone: "UTC",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                );
              }
              return (
                <div key={key} className="w-full h-fit relative">
                  <div className="w-full h-[176px] relative">
                    <div className="absolute w-full h-full bg-forest-50 dark:bg-[#1F2726] rounded-[15px]"></div>
                    <div className="absolute w-full h-[142px] top-[49px]">
                      <HighchartsReact
                        highcharts={Highcharts}
                        options={{
                          ...options,
                          chart: {
                            ...options.chart,
                            index: i,
                            margin: zoomed ? zoomedMargin : defaultMargin,
                            events: {
                              load: function () {
                                const chart = this;
                                // chart.reflow();
                              },
                              render: function () {
                                const chart: Highcharts.Chart = this;
                                const lastPoint: Highcharts.Point =
                                  chart.series[0].points[
                                    chart.series[0].points.length - 1
                                  ];

                                if (lastPointLines[i]) {
                                  lastPointLines[i].destroy();
                                }

                                if (lastPointCircles[i]) {
                                  lastPointCircles[i].destroy();
                                }
                                // calculate the fraction that 15px is in relation to the pixel width of the chart
                                const fraction = 15 / chart.chartWidth;

                                // create a bordered line from the last point to the top of the chart's container
                                lastPointLines[i] = chart.renderer
                                  .path(
                                    chart.renderer.crispLine(
                                      [
                                        //@ts-ignore
                                        "M",
                                        //@ts-ignore
                                        chart.chartWidth * (1 - fraction),
                                        //@ts-ignore
                                        lastPoint.plotY + chart.plotTop,
                                        //@ts-ignore
                                        "L",
                                        //@ts-ignore
                                        chart.chartWidth * (1 - fraction),
                                        //@ts-ignore
                                        chart.plotTop,
                                      ],
                                      1,
                                    ),
                                  )
                                  .attr({
                                    stroke: "#4B5563",
                                    "stroke-width": 1,
                                  })
                                  .add();

                                // lastPointCircles[i] = chart.renderer
                                //   .circle(
                                //     chart.chartWidth * (1 - fraction),
                                //     lastPoint.plotY + chart.plotTop,
                                //     3
                                //   )
                                //   .attr({
                                //     fill:
                                //       // AllChainsByKeys[data.chain_id].colors[
                                //       //   theme ?? "dark"
                                //       // ][0]
                                //       "#ffffff" + "80",

                                //     r: 2,
                                //     zIndex: 9999,
                                //   })
                                //   .add();
                              },
                            },
                          },
                          yAxis: {
                            ...options.yAxis,
                            labels: {
                              ...(options.yAxis as Highcharts.YAxisOptions)
                                .labels,
                              formatter: function (
                                t: Highcharts.AxisLabelsFormatterContextObject,
                              ) {
                                return formatNumber(key, t.value, true);
                              },
                            },
                          },

                          series: [
                            {
                              name: key,
                              crisp: false,
                              data: data.metrics[key].daily.types.includes(
                                "eth",
                              )
                                ? showUsd
                                  ? data.metrics[key].daily.data.map((d) => [
                                      d[0],
                                      d[
                                        data.metrics[key].daily.types.indexOf(
                                          "usd",
                                        )
                                      ],
                                    ])
                                  : data.metrics[key].daily.data.map((d) => [
                                      d[0],
                                      showGwei(key)
                                        ? d[
                                            data.metrics[
                                              key
                                            ].daily.types.indexOf("eth")
                                          ] * 1000000000
                                        : d[
                                            data.metrics[
                                              key
                                            ].daily.types.indexOf("eth")
                                          ],
                                    ])
                                : data.metrics[key].daily.data.map((d) => [
                                    d[0],
                                    d[1],
                                  ]),
                              showInLegend: false,
                              marker: {
                                enabled: false,
                              },
                              point: {
                                events: {
                                  mouseOver: pointHover,
                                  mouseOut: pointHover,
                                },
                              },
                            },
                          ],
                        }}
                        ref={(chart) => {
                          if (chart) {
                            chartComponents.current[i] = chart.chart;
                          }
                        }}
                      />
                      <div className="absolute bottom-[22px] right-[22px] md:bottom-[22px] md:right-[22px]pointer-events-none z-0 opacity-40 mix-blend-lighten">
                        <ChartWatermark className="w-[102.936px] h-[24.536px]" />
                      </div>
                    </div>
                    <div className="absolute top-[14px] w-full flex justify-between items-center px-[26px]">
                      <div className="text-[20px] leading-snug font-bold">
                        {
                          navigationItems[1].options.find((o) => o.key === key)
                            ?.page?.title
                        }
                      </div>
                      <div className="text-[18px] leading-snug font-medium flex space-x-[2px]">
                        <div>{displayValues[key].prefix}</div>
                        <div>{displayValues[key].value}</div>
                        <div className="text-base pl-0.5">
                          {displayValues[key].suffix}
                        </div>
                      </div>
                      <div
                        className={`absolute -bottom-[12px] top-1/2 right-[15px] w-[5px] rounded-sm border-r border-t`}
                        style={{
                          borderColor: "#4B5563",
                        }}
                      ></div>
                      <div
                        className={`absolute top-[calc(50% - 0.5px)] right-[20px] w-[4px] h-[4px] rounded-full bg-forest-900 dark:bg-forest-50`}
                      ></div>
                    </div>
                    <div>
                      <Icon
                        icon={
                          navigationItems[1].options.find((o) => o.key === key)
                            ?.icon ?? ""
                        }
                        className="absolute h-[64px] w-[64px] top-[55px] right-[26px] dark:text-[#CDD8D3] opacity-5 pointer-events-none"
                      />
                    </div>
                  </div>
                  <div className="w-full h-[15px] relative text-[10px] z-30">
                    <div className="absolute left-[15px] h-[15px] border-l border-forest-500 dark:border-forest-600 pl-0.5 align-bottom flex items-end"></div>
                    <div className="absolute right-[15px] h-[15px] border-r border-forest-500 dark:border-forest-600 pr-0.5 align-bottom flex items-end"></div>
                  </div>
                  {!zoomed
                    ? (key === "stables_mcap" || key === "txcosts") && (
                        <div
                          className={`w-full h-[15px] absolute -bottom-[15px] text-[10px] text-forest-600/80 dark:text-forest-500/80 ${
                            key === "txcosts" ? "hidden lg:block" : ""
                          }`}
                        >
                          <div className="absolute left-[15px] align-bottom flex items-end z-30">
                            {new Date(
                              timespans[selectedTimespan].xMin,
                            ).toLocaleDateString(undefined, {
                              timeZone: "UTC",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div className="absolute right-[15px] align-bottom flex items-end z-30">
                            {new Date(
                              timespans[selectedTimespan].xMax,
                            ).toLocaleDateString(undefined, {
                              timeZone: "UTC",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      )
                    : (key === "stables_mcap" || key === "txcosts") &&
                      intervalShown && (
                        <div
                          className={`w-full h-[15px] absolute -bottom-[15px] text-[10px] text-forest-600/80 dark:text-forest-500/80 ${
                            key === "txcosts" ? "hidden lg:block" : ""
                          }`}
                        >
                          <div className="absolute left-[15px] align-bottom flex items-end z-30 ">
                            {new Date(intervalShown.min).toLocaleDateString(
                              undefined,
                              {
                                timeZone: "UTC",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <div className="absolute right-[15px] align-bottom flex items-end z-30">
                            {new Date(intervalShown.max).toLocaleDateString(
                              undefined,
                              {
                                timeZone: "UTC",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </div>
                      )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
