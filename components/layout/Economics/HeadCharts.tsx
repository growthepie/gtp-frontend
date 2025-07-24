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
import "@/app/highcharts.axis.css";
import {
  TopRowContainer,
  TopRowChild,
  TopRowParent,
} from "@/components/layout/TopRow";
import Container from "../Container";
import SwiperContainer from "../SwiperContainer";


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
  selectedTimespan,
  setSelectedTimespan,
  isMonthly,
  setIsMonthly,
}: {
  chart_data: l2_data;
  selectedTimespan: string;
  setSelectedTimespan: (selectedTimespan: string) => void;
  isMonthly: boolean;
  setIsMonthly: (isMonthly: boolean) => void;
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
            <div class="tooltip-point-name text-xs">${nameString}</div>
            <div class="flex-1 text-right justify-end flex numbers-xs">
              <div class="flex justify-end text-right w-full">
                  <div class="${!prefix && "hidden"
            }">${prefix}</div>
              ${isFees
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
                <div class="ml-0.5 ${!suffix && "hidden"
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
              y: -20,
            };
          }
          if (pointX + tooltipWidth / 2 > plotLeft + plotWidth) {
            return {
              x: plotLeft + plotWidth - tooltipWidth,
              y: -20,
            };
          }
          return {
            x: pointX - tooltipWidth / 2,
            y: -20,
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
          number = valuePrefix + val.toFixed(2);
        } else {
          number = valuePrefix + formatLargeNumber(val);
        }
      } else {
        number = valuePrefix + formatLargeNumber(val);
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

  const dataTimestampExtremes = useMemo(() => {
    let xMin = Infinity;
    let xMax = -Infinity;

    Object.keys(chart_data.metrics).map((key) => {
      // chart_data.metrics[key]
      if(key === "costs") {
        Object.keys(chart_data.metrics[key]).map((cost_key) => {
          chart_data.metrics[key][cost_key].daily.data.map((data) => {
            const min = chart_data.metrics[key][cost_key].daily.data[0][0];
            const max =
              chart_data.metrics[key][cost_key].daily.data[
              chart_data.metrics[key][cost_key].daily.data.length - 1
              ][0];
    
            xMin = Math.min(min, xMin);
            xMax = Math.max(max, xMax);
          });
        });
      }else {
        const min = chart_data.metrics[key].daily.data[0][0];
        const max =
          chart_data.metrics[key].daily.data[
          chart_data.metrics[key].daily.data.length - 1
          ][0];

        xMin = Math.min(min, xMin);
        xMax = Math.max(max, xMax);
      }
    });

    return { xMin, xMax };
  }, [chart_data]);

  const timespans = useMemo(() => {
    let xMin = dataTimestampExtremes.xMin;
    let xMax = dataTimestampExtremes.xMax;

    if (!isMonthly) {
      return {
        "1d": {
          shortLabel: "1d",
          label: "1 day",
          value: 1,
        },
        "7d": {
          shortLabel: "7d",
          label: "7 days",
          value: 7,
          xMin: xMax - 7 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "30d": {
          shortLabel: "30d",
          label: "30 days",
          value: 30,
          xMin: xMax - 30 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "90d": {
          shortLabel: "90d",
          label: "90 days",
          value: 90,
          xMin: xMax - 90 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "365d": {
          shortLabel: "1y",
          label: "1 year",
          value: 365,
          xMin: xMax - 365 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },

        max: {
          shortLabel: "Max",
          label: "Max",
          value: 0,
          xMin: xMin,
          xMax: xMax,
        },
      };
    } else {
      return {
        "180d": {
          shortLabel: "6m",
          label: "6 months",
          value: 90,
          xMin: xMax - 180 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "365d": {
          shortLabel: "1y",
          label: "1 year",
          value: 365,
          xMin: xMax - 365 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },

        max: {
          shortLabel: "Max",
          label: "Max",
          value: 0,
          xMin: xMin,
          xMax: xMax,
        },
      };
    }
  }, [dataTimestampExtremes.xMax, dataTimestampExtremes.xMin, isMonthly]);

  return (
    <>
    <Container className="">
      <TopRowContainer className="!flex-col !rounded-[15px] !py-[3px] !px-[3px] !text-xs  2xl:!gap-y-0 2xl:!text-base 2xl:!flex 2xl:!flex-row 2xl:!rounded-full ">
        <TopRowParent className="!w-full 2xl:!w-auto !justify-between 2xl:!justify-center !items-stretch 2xl:!items-center !mx-4 2xl:!mx-0 !gap-x-[4px] 2xl:!gap-x-[5px]">
          <TopRowChild
            isSelected={!isMonthly}
            onClick={() => {
              const isTransferrableTimespan =
                selectedTimespan === "max" || selectedTimespan === "365d";
              if (!isTransferrableTimespan) {
                setSelectedTimespan("max");
              }
              setIsMonthly(false);
            }}
            className={"!px-[16px] !py-[4px] !grow !text-sm 2xl:!text-base 2xl:!px-4 2xl:!py-[14px] 3xl:!px-6 3xl:!py-4"}

            style={{
              paddingTop: "10.5px",
              paddingBottom: "10.5px",
              paddingLeft: "16px",
              paddingRight: "16px",
            }}
          >
            {"Daily"}
          </TopRowChild>
          <TopRowChild
            isSelected={isMonthly}
            onClick={() => {
              const isTransferrableTimespan =
                selectedTimespan === "max" || selectedTimespan === "365d";
              if (!isTransferrableTimespan) {
                setSelectedTimespan("max");
              }
              setIsMonthly(true);
            }}
            className={"!px-[16px] !py-[4px] !grow !text-sm 2xl:!text-base 2xl:!px-4 2xl:!py-[14px] 3xl:!px-6 3xl:!py-4"}

            style={{
              paddingTop: "10.5px",
              paddingBottom: "10.5px",
              paddingLeft: "16px",
              paddingRight: "16px",
            }}
          >
            {"Monthly"}
          </TopRowChild>
        </TopRowParent>
        <div className="block 2xl:hidden w-[70%] mx-auto my-[10px]">
          <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
        </div>
        <TopRowParent className="!w-full 2xl:!w-auto !justify-between 2xl:!justify-center !items-stretch 2xl:!items-center !mx-4 2xl:!mx-0 !gap-x-[4px] 2xl:!gap-x-[5px] ">
          {Object.keys(timespans).map((key) => {
            {
              return (
                <TopRowChild
                  className={"!px-[16px] !py-[4px] !grow !text-sm 2xl:!text-base 2xl:!px-4 2xl:!py-[14px] 3xl:!px-6 3xl:!py-4"}

                  onClick={() => {
                    setSelectedTimespan(key);
                  }}
                  key={key}
                  style={{
                    paddingTop: "10.5px",
                    paddingBottom: "10.5px",
                    paddingLeft: "16px",
                    paddingRight: "16px",
                  }}
                  isSelected={selectedTimespan === key}
                >
                  {selectedTimespan === key
                    ? timespans[key].label
                    : timespans[key].shortLabel}
                </TopRowChild>
              );
            }
          })}
        </TopRowParent>
      </TopRowContainer>
    </Container>
      <div className={`transition-height duration-500 relative overflow-hidden ${selectedTimespan === "1d" ? "h-[0px]" : "h-[197px]"}`}>
        <SwiperContainer ariaId="economics-traction-title" size="economics">
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
                    <div className="relative flex flex-col w-full overflow-hidden h-[197px] bg-[#1F2726] rounded-[15px]  group ">
                      <div
                        className={`absolute items-center text-[16px] font-bold top-[15px] left-[15px] flex gap-x-[10px]  z-10 ${link ? "cursor-pointer" : ""
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
                          className={`rounded-full w-[15px] h-[15px] bg-[#344240] flex items-center justify-center text-[10px] z-10 ${!link ? "hidden" : "block"
                            }`}
                        >
                          <Icon
                            icon="feather:arrow-right"
                            className="w-[11px] h-[11px]"
                          />
                        </div>
                      </div>
                      <div className="absolute text-[18px] top-[18px] right-[30px] numbers">
                        {!isMultipleSeries
                          ? valuePrefix +

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
                          Intl.NumberFormat("en-GB", {
                            notation: "standard",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          }).format(sumDisplayValue)}
                      </div>
                      <hr className="absolute w-full border-t-[2px] top-[54px] border-[#5A64624F] my-4" />
                      <hr className="absolute w-full border-t-[2px] top-[95px] border-[#5A64624F] my-4" />
                      <hr className="absolute w-full border-t-[2px] top-[137px] border-[#5A64624F] my-4" />
                      <div className="absolute bottom-[38.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-20">
                        <ChartWatermark className="w-[128.54px] h-[25.69px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
                      </div>

                      <div className="opacity-100 transition-opacity duration-[900ms] z-20 group-hover:opacity-0 absolute left-[7px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-forest-50/50 dark:bg-[#344240]/70 pointer-events-none">
                        <div className="w-[5px] h-[5px] bg-[#CDD8D3] rounded-full"></div>
                        <div className="text-[#CDD8D3] text-[9px] font-medium leading-[150%]">
                          {!isMultipleSeries
                            ? new Date(
                              timespans[selectedTimespan].xMin,
                            ).toLocaleDateString("en-GB", {
                              timeZone: "UTC",
                              month: "short",
                              // day: "numeric",
                              year: "numeric",
                            })
                            : new Date(
                              timespans[selectedTimespan].xMin,
                            ).toLocaleDateString("en-GB", {
                              timeZone: "UTC",
                              month: "short",
                              // day: "numeric",
                              year: "numeric",
                            })}
                        </div>
                      </div>
                      <div className=" duration-[900ms] group-hover:opacity-0 z-20 absolute right-[15px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-forest-50/50 dark:bg-[#344240]/70 pointer-events-none">
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
                      <div className="relative w-full h-[197px] flex justify-center items-end overflow-visible">
                        <HighchartsProvider Highcharts={Highcharts}>
                          <HighchartsChart
                            containerProps={{
                              style: {
                                height: "197px",
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
                              panning={{ enabled: false }}
                              panKey="shift"
                              zooming={{ type: undefined }}
                              style={{ borderRadius: 15 }}
                              animation={{ duration: 50 }}
                              // margin={[0, 15, 0, 0]} // Use the array form for margin
                              margin={[33, 21, 0, 0]}
                              spacingBottom={0}
                              spacingTop={40}
                              spacingLeft={10}
                              spacingRight={10}
                              onRender={(chartData) => {
                                const chart = chartData.target as any; // Cast chartData.target to any

                                if (
                                  !chart ||
                                  !chart.series ||
                                  chart.series.length === 0 ||
                                  selectedTimespan === "1d"
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
                                enabled: false,
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
                                snap: true,
                              }}
                              tickmarkPlacement="on"
                              tickWidth={0}
                              tickLength={20}
                              ordinal={false}
                              minorTicks={false}
                              minorTickInterval={1000 * 60 * 60 * 24 * 1}
                              min={timespans[selectedTimespan].xMin + 1000 * 60 * 60 * 24 * 1} // don't include the last day
                              max={timespans[selectedTimespan].xMax}
                            ></XAxis>

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
                                  color: "rgb(215, 223, 222)",
                                  fontSize: "10px",
                                  fontWeight: "300",
                                  fontFamily: "Fira Sans",
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
        </SwiperContainer>
      </div>
    </>
  );
}
