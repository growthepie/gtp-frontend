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
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import fullScreen from "highcharts/modules/full-screen";
import _merge from "lodash/merge";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import Image from "next/image";
import d3 from "d3";
import { AllChainsByKeys } from "@/lib/chains";
import { debounce } from "lodash";

import { navigationItems } from "@/lib/navigation";
import { useUIContext } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";

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
  data: any;
  chain: string;
}) {
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
  const { isSidebarOpen } = useUIContext();
  const { width, height } = useWindowSize();
  const isMobile = useMediaQuery("(max-width: 767px)");
  /*const chartStyle = useMemo(() => {
    if (!AllChains || !data) return [];

    let result: any = null;

    AllChains.forEach((chain) => {
      if (chain.key === data.chain_id) {
        result = chain;
      }
    });

    return result;
  }, [data]);*/

  const timespans = useMemo(() => {
    let max = 0;
    let min = Infinity;
    const now = Date.now();

    Object.keys(data.metrics).forEach((key) => {
      max = Math.max(
        max,
        ...data.metrics[key].daily.data.map((d: any) => d[0])
      );

      min = Math.min(
        min,
        ...data.metrics[key].daily.data.map((d: any) => d[0])
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

  const formatNumber = useCallback(
    (value: number | string, isAxis = false) => {
      return isAxis
        ? selectedScale !== "percentage"
          ? d3.format(".2s")(value).replace(/G/, "B")
          : d3.format(".2~s")(value).replace(/G/, "B") + "%"
        : d3.format(",.2~s")(value).replace(/G/, "B");
    },
    [selectedScale]
  );

  const chartComponents = useRef<Highcharts.Chart[]>([]);

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

  const getTickPositions = useCallback(
    (xMin: any, xMax: any): number[] => {
      const tickPositions: number[] = [];
      const xMinDate = new Date(xMin);
      const xMaxDate = new Date(xMax);
      const xMinMonth = xMinDate.getMonth();
      const xMaxMonth = xMaxDate.getMonth();

      const xMinYear = xMinDate.getFullYear();
      const xMaxYear = xMaxDate.getFullYear();

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
    [selectedTimespan]
  );

  const tooltipFormatter = useCallback(
    function (this: Highcharts.TooltipFormatterContextObject) {
      const { x, points } = this;

      if (!points || !x) return;

      const series = points[0].series;

      const date = new Date(x);

      const prefix = prefixes[series.name] ?? "";

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
                <div class="flex-1 text-right font-inter">${prefix}${Highcharts.numberFormat(
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
              AllChainsByKeys[data.chain_id].colors[theme][0]
            };"> </div>
              </div> -->`;

          const value = formatNumber(y);
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
            <div class="flex-1 text-left justify-start font-inter">
              <div class="mr-1 inline-block">${prefix}${parseFloat(
            y
          ).toLocaleString(undefined, {
            minimumFractionDigits: 0,
          })}</div>
            </div>
          </div>
          <!-- <div class="flex ml-4 w-[calc(100% - 1rem)] relative mb-1">
            <div class="h-[2px] w-full bg-gray-200 rounded-full absolute left-0 top-0" > </div>

            <div class="h-[2px] rounded-full absolute right-0 top-0" style="width: ${formatNumber(
              (y / pointsSum) * 100
            )}%; background-color: ${
            AllChainsByKeys[data.chain_id].colors[theme][0]
          }33;"></div>
          </div> -->`;
        })
        .join("");
      return tooltip + tooltipPoints + tooltipEnd;
    },
    [data, formatNumber, prefixes, selectedScale, theme]
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
      [isMobile]
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

    [chartComponents]
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
                        .x
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

    [chartComponents]
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
      type: "datetime",
      lineWidth: 0,
      crosshair: {
        width: 0.5,
        color: COLORS.PLOT_LINE,
        snap: false,
      },
      min: timespans[selectedTimespan].xMin - 1000 * 60 * 60 * 24 * 7,
      max: timespans[selectedTimespan].xMax + 1000 * 60 * 60 * 24 * 7,
      tickPositions: getTickPositions(
        timespans[selectedTimespan].xMin,
        timespans[selectedTimespan].xMax
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

  const getIcon = (key) => {
    switch (key) {
      case "tvl":
        return (
          <Icon
            icon="feather:star"
            className="absolute h-[64px] w-[64px] top-[55px] right-[26px] dark:text-[#CDD8D3] opacity-5 pointer-events-none"
          />
        );
      case "txcount":
        return (
          <Icon
            icon="feather:clock"
            className="absolute h-[64px] w-[64px] top-[55px] right-[26px] dark:text-[#CDD8D3] opacity-5 pointer-events-none"
          />
        );
      case "stables_mcap":
        return (
          <Icon
            icon="feather:dollar-sign"
            className="absolute h-[64px] w-[64px] top-[55px] right-[26px] dark:text-[#CDD8D3] opacity-5 pointer-events-none"
          />
        );
      case "fees":
        return (
          <Icon
            icon="feather:credit-card"
            className="absolute h-[64px] w-[64px] top-[55px] right-[26px] dark:text-[#CDD8D3] opacity-5 pointer-events-none"
          />
        );
      default:
        return (
          <Icon
            icon="feather:sunrise"
            className="absolute h-[64px] w-[64px] top-[55px] right-[26px] dark:text-[#CDD8D3] opacity-5 pointer-events-none"
          />
        );
    }
  };

  const lastPointLines = useMemo<{
    [key: string]: Highcharts.SVGElement;
  }>(() => ({}), []);

  const lastPointCircles = useMemo<{
    [key: string]: Highcharts.SVGElement;
  }>(() => ({}), []);

  const resetXAxisExtremes = useCallback(() => {
    if (chartComponents.current) {
      chartComponents.current.forEach((chart) => {
        if (!chart) return;

        const pixelsPerDay =
          chart.plotWidth / timespans[selectedTimespan].daysDiff;

        // 15px padding on each side
        const paddingMilliseconds = (15 / pixelsPerDay) * 24 * 60 * 60 * 1000;

        chart.xAxis[0].setExtremes(
          timespans[selectedTimespan].xMin -
            paddingMilliseconds -
            24 * 60 * 60 * 1000 * 0.5,
          timespans[selectedTimespan].xMax + paddingMilliseconds,
          true
        );
      });
    }
  }, [selectedTimespan, timespans]);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const resituateChart = debounce(() => {
    if (chartComponents.current) {
      chartComponents.current.forEach((chart) => {
        if (!chart) return;

        delay(50)
          .then(() => {
            chart.setSize(null, null, true);
            // chart.reflow();
          })
          .then(() => {
            delay(50).then(() => chart.reflow());
          })
          .then(() => {
            delay(50).then(() => resetXAxisExtremes());
          });
      });
    }
  }, 150);

  useEffect(() => {
    resituateChart();
  }, [
    chartComponents,
    selectedTimespan,
    timespans,
    width,
    height,
    isSidebarOpen,
    resituateChart,
  ]);

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
        <div className="flex w-full md:w-auto justify-between md:justify-center items-center space-x-[4px] md:space-x-1">
          {Object.keys(timespans).map((timespan) => (
            <button
              key={timespan}
              className={`rounded-full w-full md:w-auto px-[16px] py-[8px] text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium ${
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
          ))}
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-[15px]">
          {Object.keys(data.metrics).map((key, i) => {
            return (
              <div key={key} className="w-full">
                <div className="w-full h-[176px] relative">
                  <div className="absolute w-full h-full bg-forest-50 dark:bg-[#1F2726] rounded-[15px]"></div>
                  <div className="absolute w-full h-[142px] top-[49px]">
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={{
                        ...options,
                        chart: {
                          index: i,
                          ...options.chart,
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
                                    1
                                  )
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
                              t: Highcharts.AxisLabelsFormatterContextObject
                            ) {
                              return (
                                prefixes[key] + formatNumber(t.value, true)
                              );
                            },
                          },
                        },

                        series: [
                          {
                            name: key,
                            crisp: false,
                            data:
                              !showUsd &&
                              data.metrics[key].daily.types.includes("eth")
                                ? data.metrics[key].daily.data.map((d) => [
                                    d[0],
                                    d[2],
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
                  </div>
                  <div className="absolute top-[14px] w-full flex justify-between items-center px-[26px]">
                    {/* <div
                      className={`absolute -bottom-1.5 -right-1 text-[10px] text-right cursor-vertical-text`}
                    >
                      <div
                        className="rotate-90 font-inter"
                        style={{
                          color:
                            AllChainsByKeys[data.chain_id].colors[
                              theme ?? "dark"
                            ][0] + "cc",
                        }}
                      >
                        LAST
                      </div>
                    </div> */}
                    <div className="text-[20px] leading-snug font-bold">
                      {
                        navigationItems[1].options.find((o) => o.key === key)
                          ?.label
                      }
                    </div>
                    <div className="text-[18px] leading-snug font-medium flex space-x-[2px]">
                      <div>{prefixes[key]}</div>
                      <div>
                        {Intl.NumberFormat("en-US", {
                          notation: "compact",
                          maximumFractionDigits: 2,
                        }).format(
                          data.metrics[key].daily.data[
                            data.metrics[key].daily.data.length - 1
                          ][
                            data.metrics[key].daily.types.includes("eth")
                              ? !showUsd
                                ? data.metrics[key].daily.types.indexOf("eth")
                                : data.metrics[key].daily.types.indexOf("usd")
                              : 1
                          ]
                        )}
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
                  <div>{getIcon(key)}</div>
                </div>
                <div className="w-full h-[15px] relative text-[10px] z-30">
                  <div className="absolute left-[15px] h-[15px] border-l border-forest-500 dark:border-forest-600 pl-0.5 align-bottom flex items-end"></div>
                  <div className="absolute right-[15px] h-[15px] border-r border-forest-500 dark:border-forest-600 pr-0.5 align-bottom flex items-end"></div>
                </div>
                {(key === "stables_mcap" || key === "fees") && (
                  <div
                    className={`w-full h-[15px] relative text-[10px] text-forest-600/80 dark:text-forest-500/80 ${
                      key === "stables_mcap" ? "hidden lg:block" : ""
                    }`}
                  >
                    <div className="absolute left-[15px] align-bottom flex items-end z-30">
                      {new Date(
                        timespans[selectedTimespan].xMin
                      ).toLocaleDateString(undefined, {
                        timeZone: "UTC",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="absolute right-[15px] align-bottom flex items-end z-30">
                      {new Date(
                        timespans[selectedTimespan].xMax
                      ).toLocaleDateString(undefined, {
                        timeZone: "UTC",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
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
