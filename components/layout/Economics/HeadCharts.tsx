"use client";
import Highcharts, { chart } from "highcharts/highstock";
import {
  HighchartsProvider,
  HighchartsChart,
  Chart,
  XAxis,
  YAxis,
  Title,
  Tooltip,
  PlotBand,
  AreaSeries,
} from "react-jsx-highcharts";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import "@splidejs/splide/css";
import { l2_data } from "@/types/api/EconomicsResponse";
import { useLocalStorage } from "usehooks-ts";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useMemo, useState, useCallback } from "react";
import d3 from "d3";
import {
  navigationItems,
  navigationCategories,
  getFundamentalsByKey,
} from "@/lib/navigation";
import { useUIContext } from "@/contexts/UIContext";
import { useMaster } from "@/contexts/MasterContext";
import ChartWatermark from "@/components/layout/ChartWatermark";
import { unix } from "moment";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

const METRIC_COLORS = {
  profit: ["#EEFF97", "#A1B926"],
  fees: ["#1DF7EF", "#10808C"],
  costs: {
    costs_l1: ["#FE5468", "#98323E"],
    costs_blobs: ["#D41027", "#FE5468"],
  },
};

const urls = {
  profit: "/fundamentals/profit",
  fees: "/fundamentals/fees-paid-by-users",
};

export default function EconHeadCharts({
  chart_data,
}: {
  chart_data: l2_data;
}) {
  const { AllChains, AllChainsByKeys } = useMaster();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [chartWidth, setChartWidth] = useState<number | null>(null);
  const { isMobile } = useUIContext();
  const selectedScale: string = "absolute";
  const valuePrefix = useMemo(() => {
    if (showUsd) return "$";
    // eth symbol
    return "Ξ";
  }, [showUsd]);

  const { isSidebarOpen, isSafariBrowser } = useUIContext();
  const enabledFundamentalsKeys = useMemo<string[]>(() => {
    return navigationItems[1].options.map((option) => option.key ?? "");
  }, []);

  const lastPointLines = useMemo<{
    [key: string]: Highcharts.SVGElement[];
  }>(() => ({}), []);

  const lastPointCircles = useMemo<{
    [key: string]: Highcharts.SVGElement[];
  }>(() => ({}), []);

  const reversePerformer = true;

  function calculateDecimalPlaces(value: number): number {
    if (value === 0) return 0;

    let absValue = Math.abs(value);
    let decimalPlaces = 0;

    if (absValue >= 1) {
      return 2; // Default to 2 decimal places for values >= 1
    } else {
      while (absValue < 1) {
        absValue *= 10;
        decimalPlaces++;
      }
      return decimalPlaces + 1; // Add 2 more decimal places for precision
    }
  }

  function calculateCostPerGB(dollarAmount: number, bytes: number): string {
    const gigabytes = bytes / (1024 * 1024 * 1024);
    const costPerGB = dollarAmount / gigabytes;

    const decimalPlaces = calculateDecimalPlaces(costPerGB);

    return costPerGB.toFixed(decimalPlaces);
  }

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points } = this;
      const date = new Date(x);
      let dateString = date.toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const chartTitle = this.series.chart.title.textStr;

      // check if data steps are less than 1 day
      // if so, add the time to the tooltip
      const timeDiff = points[0].series.xData[1] - points[0].series.xData[0];
      if (timeDiff < 1000 * 60 * 60 * 24) {
        dateString +=
          " " +
          date.toLocaleTimeString("en-GB", {
            hour: "numeric",
            minute: "2-digit",
          });
      }

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-52 md:w-52 text-xs font-raleway">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2 ">${dateString}</div>`;
      const tooltipEnd = `</div>`;

      // let pointsSum = 0;
      // if (selectedScale !== "percentage")
      let pointsSum = points.reduce((acc: number, point: any) => {
        acc += point.y;
        return acc;
      }, 0);

      let pointSumNonNegative = points.reduce((acc: number, point: any) => {
        if (point.y > 0) acc += point.y;
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

      const tooltipPoints = points

        .map((point: any, index: number) => {
          const { series, y, percentage } = point;
          const { name } = series;
          let blob_value;
          let blob_index;

          const isFees = true;
          const nameString = name;

          const color = series.color.stops[0][1];

          let prefix = isFees ? valuePrefix : "";
          let suffix = "";
          let value = y;
          let displayValue = y;

          return `
          <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${color}"></div>
            <div class="tooltip-point-name text-md">${nameString}</div>
            <div class="flex-1 text-right font-inter w-full flex">
              <div class="flex justify-end text-right w-full">
                  <div class="opacity-70 mr-0.5 ${
                    !prefix && "hidden"
                  }">${prefix}</div>
                  <div style={{
                            fontFeatureSettings: "'pnum' on, 'lnum' on",
                          }}>${
                            isFees
                              ? parseFloat(displayValue).toLocaleString(
                                  "en-GB",
                                  {
                                    minimumFractionDigits: 2,

                                    maximumFractionDigits: 2,
                                  },
                                )
                              : formatBytes(displayValue)
                          }
                  </div>
                </div>
                <div class="opacity-70 ml-0.5 ${
                  !suffix && "hidden"
                }">${suffix}</div>
            </div>
          </div>
         `;
        })
        .join("");

      return tooltip + tooltipPoints + tooltipEnd;
    },
    [valuePrefix, reversePerformer, showUsd],
  );

  function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  const tooltipPositioner =
    useCallback<Highcharts.TooltipPositionerCallbackFunction>(
      function (this, width, height, point) {
        const chart = this.chart;
        const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
        const tooltipWidth = width;
        const tooltipHeight = height;

        const distance = 40;
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
          if (pointX - tooltipWidth / 2 < plotLeft) {
            return {
              x: plotLeft,
              y: -250,
            };
          }
          if (pointX + tooltipWidth / 2 > plotLeft + plotWidth) {
            return {
              x: plotLeft + plotWidth - tooltipWidth,
              y: -250,
            };
          }
          return {
            x: pointX - tooltipWidth / 2,
            y: -250,
          };
        }

        return {
          x: tooltipX,
          y: tooltipY,
        };
      },
      [isMobile],
    );

  const formatNumber = useCallback(
    (key: string, value: number | string) => {
      let val = parseFloat(value as string);

      // Function to format large numbers with at least 2 decimals
      const formatLargeNumber = (num) => {
        let formatted = d3.format(".2s")(num).replace(/G/, "B");
        if (/(\.\dK|\.\dM|\.\dB)$/.test(formatted)) {
          formatted = d3.format(".3s")(num).replace(/G/, "B");
        } else if (/(\.\d\dK|\.\d\dM|\.\d\dB)$/.test(formatted)) {
          formatted = d3.format(".4s")(num).replace(/G/, "B");
        } else {
          formatted = d3.format(".2s")(num).replace(/G/, "B");
        }
        return formatted;
      };

      let number = formatLargeNumber(val);

      if (showUsd) {
        if (val < 1) {
          number = valuePrefix + " " + val.toFixed(2);
        } else {
          number = valuePrefix + " " + formatLargeNumber(val);
        }
      } else {
        number = valuePrefix + " " + formatLargeNumber(val);
      }

      return number;
    },
    [showUsd],
  );

  function getMultiLastIndexKey(data, unixIndex) {
    let lastIndexKey;
    let smallestUnixTimestamp;

    Object.keys(data).map((key, i) => {
      if (
        i === 0 ||
        data[key].daily.data[data[key].daily.data.length - 1][unixIndex] <
          smallestUnixTimestamp
      ) {
        smallestUnixTimestamp =
          data[key].daily.data[data[key].daily.data.length - 1][unixIndex];
        lastIndexKey = key;
      }
    });

    return lastIndexKey;
  }

  function getMultiFirstIndexKey(data, unixIndex) {
    let firstIndexKey;
    let largestUnixTimestamp;

    Object.keys(data).map((key, i) => {
      if (
        i === 0 ||
        data[key].daily.data[0][unixIndex] < largestUnixTimestamp
      ) {
        largestUnixTimestamp = data[key].daily.data[0][unixIndex];
        firstIndexKey = key;
      }
    });

    return firstIndexKey;
  }

  function getSumDisplayValue(data) {
    let sum = 0;
    Object.keys(data).map((key) => {
      sum +=
        data[key].daily.data[data[key].daily.data.length - 1][
          data[key].daily.types.indexOf(showUsd ? "usd" : "eth")
        ];
    });

    return sum;
  }

  return (
    <div className="wrapper h-[145px] md:h-[183px] w-full">
      <Splide
        options={{
          gap: "15px",
          autoHeight: true,
          width: "100%",
          breakpoints: {
            640: {
              perPage: 2,
            },
            900: {
              perPage: 2,
            },
            1100: {
              perPage: 2,
            },
            1250: {
              perPage: 2,
            },
            1450: {
              perPage: 2,
            },
            1600: {
              perPage: 3,
            },
            6000: {
              perPage: 3,
            },
          },
        }}
        aria-labelledby={"economics-traction-title"}
        hasTrack={false}
        // onDrag={(e) => {
        //   setIsDragging(true);
        // }}
        // onDragged={(e) => {
        //   setIsDragging(false);
        // }}
      >
        <SplideTrack>
          {Object.keys(chart_data.metrics)
            .filter((key) => {
              return key !== "rent_paid";
            })
            .map((key, i) => {
              const isMultipleSeries = key === "costs";
              const link = key !== "costs" ? urls[key] : undefined;

              const lastIndex = !isMultipleSeries
                ? chart_data.metrics[key].daily.data.length - 1
                : 0;
              const unixIndex = !isMultipleSeries
                ? chart_data.metrics[key].daily.types.indexOf("unix")
                : 0;
              const dataIndex = !isMultipleSeries
                ? chart_data.metrics[key].daily.types.indexOf(
                    showUsd ? "usd" : "eth",
                  )
                : 0;

              const lastMultiIndex = isMultipleSeries
                ? getMultiLastIndexKey(chart_data.metrics[key], unixIndex)
                : 0;

              const firstMultiIndex = isMultipleSeries
                ? getMultiFirstIndexKey(chart_data.metrics[key], unixIndex)
                : 0;

              const sumDisplayValue = isMultipleSeries
                ? getSumDisplayValue(chart_data.metrics[key])
                : 0;

              return (
                <SplideSlide key={"Splide" + key}>
                  <div className="relative flex flex-col w-full overflow-hidden h-[197px] bg-[#1F2726] rounded-2xl  ">
                    <div
                      className={`absolute items-center text-[16px] font-bold top-[15px] left-[15px] flex gap-x-[10px]  z-10 ${
                        link ? "cursor-pointer" : ""
                      }`}
                      onClick={() => {
                        if (link) window.location.href = link;
                      }}
                    >
                      <div className="z-10">
                        {isMultipleSeries
                          ? "Costs"
                          : chart_data.metrics[key].metric_name}
                      </div>

                      <div
                        className={`rounded-full w-[15px] h-[15px] bg-[#344240] flex items-center justify-center text-[10px] z-10 ${
                          !link ? "hidden" : "block"
                        }`}
                      >
                        <Icon
                          icon="feather:arrow-right"
                          className="w-[11px] h-[11px]"
                        />
                      </div>
                    </div>
                    <div className="absolute text-[18px] top-[14px] right-[30px]">
                      {!isMultipleSeries
                        ? valuePrefix +
                          " " +
                          Intl.NumberFormat("en-GB", {
                            notation: "standard",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          }).format(
                            chart_data.metrics[key].daily.data[lastIndex][
                              dataIndex
                            ],
                          )
                        : valuePrefix +
                          " " +
                          Intl.NumberFormat("en-GB", {
                            notation: "standard",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          }).format(sumDisplayValue)}
                    </div>
                    <hr className="absolute w-full border-t-[2px] top-[51px] border-[#5A64624F] my-4" />
                    <hr className="absolute w-full border-t-[2px] top-[89px] border-[#5A64624F] my-4" />
                    <hr className="absolute w-full border-t-[2px] top-[126px] border-[#5A64624F] my-4" />
                    <div className="absolute bottom-[41.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-20">
                      <ChartWatermark className="w-[128.54px] h-[25.69px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
                    </div>

                    <div className="opacity-100 transition-opacity duration-[900ms] z-20 group-hover/chart:opacity-0 absolute left-[7px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-forest-50/50 dark:bg-[#344240]/70 pointer-events-none">
                      <div className="w-[5px] h-[5px] bg-[#CDD8D3] rounded-full"></div>
                      <div className="text-[#CDD8D3] text-[9px] font-medium leading-[150%]">
                        {!isMultipleSeries
                          ? new Date(
                              chart_data.metrics[key].daily.data[0][unixIndex],
                            ).toLocaleDateString("en-GB", {
                              timeZone: "UTC",
                              month: "short",
                              // day: "numeric",
                              year: "numeric",
                            })
                          : new Date(
                              chart_data.metrics[key][
                                lastMultiIndex
                              ].daily.data[0][unixIndex],
                            ).toLocaleDateString("en-GB", {
                              timeZone: "UTC",
                              month: "short",
                              // day: "numeric",
                              year: "numeric",
                            })}
                      </div>
                    </div>
                    <div className=" duration-[900ms] group-hover/chart:opacity-0 z-20 absolute right-[15px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-forest-50/50 dark:bg-[#344240]/70 pointer-events-none">
                      <div className="text-[#CDD8D3] text-[9px] font-medium leading-[150%]">
                        {!isMultipleSeries
                          ? new Date(
                              chart_data.metrics[key].daily.data[lastIndex][
                                unixIndex
                              ],
                            ).toLocaleDateString("en-GB", {
                              timeZone: "UTC",
                              month: "short",
                              // day: "numeric",
                              year: "numeric",
                            })
                          : new Date(
                              chart_data.metrics[key][
                                lastMultiIndex
                              ].daily.data[
                                chart_data.metrics[key][lastMultiIndex].daily
                                  .data.length - 1
                              ][unixIndex],
                            ).toLocaleDateString("en-GB", {
                              timeZone: "UTC",
                              month: "short",
                              // day: "numeric",
                              year: "numeric",
                            })}
                      </div>
                      <div className="w-[5px] h-[5px] bg-[#CDD8D3] rounded-full"></div>
                    </div>
                    <div className="relative w-full h-full flex justify-center items-end overflow-visible">
                      <HighchartsProvider Highcharts={Highcharts}>
                        <HighchartsChart
                          containerProps={{
                            style: {
                              height: "100%",
                              width: "100%",
                              marginLeft: "auto",
                              marginRight: "auto",
                              position: "absolute",

                              overflow: "visible",
                            },
                          }}
                          plotOptions={{
                            line: {
                              lineWidth: 2,
                              color: {
                                linearGradient: {
                                  x1: 0,
                                  y1: 0,
                                  x2: 1,
                                  y2: 0,
                                },
                                stops: [
                                  [0, METRIC_COLORS[key][1]],
                                  // [0.33, AllChainsByKeys[series.name].colors[1]],
                                  [1, METRIC_COLORS[key][0]],
                                ],
                              },
                            },
                            area: {
                              stacking: "normal",
                              lineWidth: 2,
                              // marker: {
                              //   radius: 12,
                              //   lineWidth: 4,
                              // },

                              fillColor: {
                                linearGradient: {
                                  x1: 0,
                                  y1: 0,
                                  x2: 0,
                                  y2: 1,
                                },
                                stops: [
                                  [0, METRIC_COLORS[key][1] + "DD"],
                                  [0.5, METRIC_COLORS[key][1] + "DD"],
                                  [1, METRIC_COLORS[key][0] + "DD"],
                                ],
                              },
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
                                  [0, METRIC_COLORS[key][0]],
                                  // [0.33, AllChainsByKeys[series.name].colors[1]],
                                  [1, METRIC_COLORS[key][0]],
                                ],
                              },
                              // borderColor: AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][0],
                              // borderWidth: 1,
                            },
                            series: {
                              zIndex: 10,
                              animation: false,
                              marker: {
                                lineColor: "white",
                                radius: 0,
                                symbol: "circle",
                              },
                            },
                          }}
                        >
                          <Title
                            style={{ display: "none" }} // This hides the title
                          >
                            {"Test"}
                          </Title>
                          <Chart
                            backgroundColor={"transparent"}
                            type="area"
                            title={"test"}
                            panning={{ enabled: true }}
                            panKey="shift"
                            zooming={{ type: undefined }}
                            style={{ borderRadius: 15 }}
                            animation={{ duration: 50 }}
                            // margin={[0, 15, 0, 0]} // Use the array form for margin
                            margin={[33, 21, 15, 0]}
                            spacingBottom={0}
                            spacingTop={40}
                            spacingLeft={10}
                            spacingRight={10}
                            onRender={(chartData) => {
                              const chart = chartData.target as any; // Cast chartData.target to any

                              if (
                                !chart ||
                                !chart.series ||
                                chart.series.length === 0
                              )
                                return;

                              //Set width for y axis label
                              if (
                                chartWidth === null ||
                                chartWidth !== chart.plotWidth
                              ) {
                                setChartWidth(chart.plotWidth);
                              }

                              chart.series.forEach((object, index) => {
                                const dictionaryKey = `${chart.series[index].name}_${key}`;

                                // check if gradient exists
                                if (!document.getElementById("gradient0")) {
                                  // add def containing linear gradient with stop colors for the circle
                                  chart.renderer.definition({
                                    attributes: {
                                      id: "gradient0",
                                      x1: "0%",
                                      y1: "0%",
                                      x2: "0%",
                                      y2: "95%",
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
                                  const stop1 =
                                    document.getElementById("stop1");
                                  const stop2 =
                                    document.getElementById("stop2");
                                  stop1?.setAttribute("stop-color", "#CDD8D3");
                                  stop1?.setAttribute("stop-opacity", "1");
                                  stop2?.setAttribute("stop-color", "#CDD8D3");
                                  stop2?.setAttribute("stop-opacity", "0.33");
                                }
                                const lastPoint: Highcharts.Point =
                                  chart.series[index].points[
                                    chart.series[index].points.length - 1
                                  ];
                                // check if i exists as a key in lastPointLines
                                if (!lastPointLines[dictionaryKey]) {
                                  lastPointLines[dictionaryKey] = [];
                                }
                                if (
                                  lastPointLines[dictionaryKey] &&
                                  lastPointLines[dictionaryKey].length > 0
                                ) {
                                  lastPointLines[dictionaryKey].forEach(
                                    (line) => {
                                      line.destroy();
                                    },
                                  );
                                  lastPointLines[dictionaryKey] = [];
                                }
                                // calculate the fraction that 15px is in relation to the pixel width of the chart
                                const fraction = 21 / chart.chartWidth;
                                // create a bordered line from the last point to the top of the chart's container
                                lastPointLines[dictionaryKey][
                                  lastPointLines[dictionaryKey].length
                                ] = chart.renderer
                                  .createElement("line")
                                  .attr({
                                    x1:
                                      chart.chartWidth * (1 - fraction) +
                                      0.00005,
                                    y1: lastPoint.plotY
                                      ? lastPoint.plotY + chart.plotTop
                                      : 0,
                                    x2:
                                      chart.chartWidth * (1 - fraction) -
                                      0.00005,
                                    y2: chart.plotTop - 5,

                                    stroke: isSafariBrowser
                                      ? "#CDD8D3"
                                      : "url('#gradient0')",
                                    "stroke-dasharray":
                                      key === "costs" ? null : "2",
                                    "stroke-width": 1,
                                    rendering: "crispEdges",
                                  })
                                  .add();
                                lastPointLines[dictionaryKey][
                                  lastPointLines[dictionaryKey].length
                                ] = chart.renderer
                                  .circle(
                                    chart.chartWidth * (1 - fraction),
                                    chart.plotTop / 3 + 17,

                                    3,
                                  )
                                  .attr({
                                    fill: "#CDD8D3",
                                    r: 4.5,
                                    zIndex: 9999,
                                    rendering: "crispEdges",
                                  })
                                  .add();
                              });
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
                            valuePrefix={showUsd ? "$" : ""}
                            valueSuffix={showUsd ? "" : " Gwei"}
                          />
                          <XAxis
                            title={undefined}
                            type="datetime"
                            labels={{
                              useHTML: true,
                              style: {
                                color: COLORS.LABEL,
                                fontSize: "10px",
                                fontFamily: "var(--font-raleway), sans-serif",
                                zIndex: 1000,
                              },
                              enabled: true,
                              formatter: (item) => {
                                const date = new Date(item.value);
                                const isMonthStart = date.getDate() === 1;
                                const isYearStart =
                                  isMonthStart && date.getMonth() === 0;
                                if (isYearStart) {
                                  return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
                                } else {
                                  return `<span style="">${date.toLocaleDateString(
                                    "en-GB",
                                    {
                                      month: "short",
                                    },
                                  )}</span>`;
                                }
                              },
                            }}
                            crosshair={{
                              width: 0.5,
                              color: COLORS.PLOT_LINE,
                              snap: false,
                            }}
                            tickmarkPlacement="on"
                            tickWidth={0}
                            tickLength={20}
                            ordinal={false}
                            minorTicks={false}
                            minorTickInterval={1000 * 60 * 60 * 24 * 1}
                            min={
                              !isMultipleSeries
                                ? chart_data.metrics[key].daily.data[0][0]
                                : chart_data.metrics[key][firstMultiIndex].daily
                                    .data[0][0]
                            }
                            max={
                              !isMultipleSeries
                                ? chart_data.metrics[key].daily.data[
                                    chart_data.metrics[key].daily.data.length -
                                      1
                                  ][0]
                                : chart_data.metrics[key][lastMultiIndex].daily
                                    .data[
                                    chart_data.metrics[key][lastMultiIndex]
                                      .daily.data.length - 1
                                  ][0]
                            }
                          >
                            <XAxis.Title>X Axis</XAxis.Title>
                          </XAxis>

                          <YAxis
                            opposite={false}
                            type="linear"
                            gridLineWidth={0}
                            gridLineColor={"#5A64624F"}
                            showFirstLabel={false}
                            showLastLabel={false}
                            tickAmount={5}
                            labels={{
                              align: "left",
                              y: -5,
                              x: 2,
                              distance: 50,

                              style: {
                                backgroundColor: "#1F2726",
                                whiteSpace: "nowrap",
                                fontWeight: "semibold",
                                fontSize: "9px",
                                fontFamily: "var(--font-raleway), sans-serif",
                                color: "#CDD8D3",
                              },
                              formatter: function (
                                t: Highcharts.AxisLabelsFormatterContextObject,
                              ) {
                                return formatNumber(key, t.value);
                              },
                            }}
                            min={0}
                          >
                            {!isMultipleSeries ? (
                              <AreaSeries
                                name={chart_data.metrics[key].metric_name}
                                showInLegend={false}
                                lineWidth={1.5}
                                data={chart_data.metrics[key].daily.data.map(
                                  (d: any) => [
                                    d[0],
                                    d[
                                      chart_data.metrics[
                                        key
                                      ].daily.types.indexOf(
                                        showUsd ? "usd" : "eth",
                                      )
                                    ],
                                  ],
                                )}
                                states={{
                                  hover: {
                                    enabled: true,
                                    halo: {
                                      size: 5,
                                      opacity: 0.5,
                                      attributes: {
                                        fill: METRIC_COLORS[key][0],
                                        stroke: undefined,
                                      },
                                    },
                                    brightness: 0.3,
                                  },
                                  inactive: {
                                    enabled: true,
                                    opacity: 0.6,
                                  },
                                }}
                              ></AreaSeries>
                            ) : (
                              <>
                                {Object.keys(chart_data.metrics[key]).map(
                                  (costKey, j) => {
                                    console.log(costKey);
                                    return (
                                      <AreaSeries
                                        key={costKey}
                                        name={
                                          chart_data.metrics[key][costKey]
                                            .metric_name
                                        }
                                        index={j}
                                        lineWidth={1.5}
                                        showInLegend={false}
                                        data={chart_data.metrics[key][
                                          costKey
                                        ].daily.data.map((d: any) => [
                                          d[0],
                                          d[
                                            chart_data.metrics[key][
                                              costKey
                                            ].daily.types.indexOf(
                                              showUsd ? "usd" : "eth",
                                            )
                                          ],
                                        ])}
                                        color={{
                                          linearGradient: {
                                            x1: 0,
                                            y1: 0,
                                            x2: 1,
                                            y2: 0,
                                          },
                                          stops: [
                                            [0, METRIC_COLORS[key][costKey][0]], // Use the unique color for each series
                                            [1, METRIC_COLORS[key][costKey][0]],
                                          ],
                                        }}
                                        fillColor={{
                                          linearGradient: {
                                            x1: 0,
                                            y1: 0,
                                            x2: 0,
                                            y2: 1,
                                          },
                                          stops: [
                                            [
                                              0,
                                              METRIC_COLORS[key][costKey][1] +
                                                "DD",
                                            ],
                                            [
                                              0.6,
                                              METRIC_COLORS[key][costKey][1] +
                                                "DD",
                                            ],
                                            [
                                              1,
                                              METRIC_COLORS[key][costKey][0] +
                                                "DD",
                                            ],
                                          ],
                                        }}
                                        lineColor={{
                                          linearGradient: {
                                            x1: 0,
                                            y1: 0,
                                            x2: 1,
                                            y2: 0,
                                          },
                                          stops: [
                                            [
                                              0,
                                              METRIC_COLORS[key][costKey][
                                                costKey === "costs_l1" ? 0 : 1
                                              ],
                                            ], // Use the unique color for each series
                                            [1, METRIC_COLORS[key][costKey][1]],
                                          ],
                                        }}
                                        states={{
                                          hover: {
                                            enabled: true,
                                            halo: {
                                              size: 5,
                                              opacity: 0.5,
                                              attributes: {
                                                fill: METRIC_COLORS[key][
                                                  costKey
                                                ][0],
                                                stroke: undefined,
                                              },
                                            },
                                            brightness: 0.3,
                                          },
                                          inactive: {
                                            enabled: true,
                                            opacity: 0.6,
                                          },
                                        }}
                                      ></AreaSeries>
                                    );
                                  },
                                )}
                              </>
                            )}
                          </YAxis>
                        </HighchartsChart>
                      </HighchartsProvider>
                    </div>
                  </div>
                </SplideSlide>
              );
            })}
        </SplideTrack>
        <div className="splide__arrows relative  bottom-[93px]  md:-mt-0">
          <button className="splide__arrow splide__arrow--prev rounded-full text-forest-400 bg-white dark:bg-forest-700 -ml-2 md:-ml-14 !w-5 md:!w-8 !h-5 md:!h-8">
            <Icon
              icon="feather:chevron-right"
              className="w-3 h-3 md:w-6 md:h-6 z-50"
            />
          </button>
          <button className="splide__arrow splide__arrow--next rounded-full text-forest-400 bg-white dark:bg-forest-700 -mr-2 md:-mr-14 !w-5 md:!w-8 !h-5 md:!h-8">
            <Icon
              icon="feather:chevron-right"
              className="w-3 h-3 md:w-6 md:h-6 z-50"
            />
          </button>
        </div>
        <div className="splide__progress ">
          <div className="splide__progress__bar" />
        </div>
      </Splide>
    </div>
  );
}
