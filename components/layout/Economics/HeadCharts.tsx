"use client";
import Highcharts from "highcharts/highstock";
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
  Tooltip,
  PlotBand,
  PlotLine,
  withHighcharts,
  AreaSeries,
} from "react-jsx-highcharts";
import { FeesBreakdown } from "@/types/api/EconomicsResponse";
import { useLocalStorage } from "usehooks-ts";
import { Icon } from "@iconify/react";
import Link from "next/link";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import {
  navigationItems,
  navigationCategories,
  getFundamentalsByKey,
} from "@/lib/navigation";
import { useUIContext } from "@/contexts/UIContext";
import {
  AllChains,
  AllChainsByKeys,
  Get_DefaultChainSelectionKeys,
  Get_SupportedChainKeys,
} from "@/lib/chains";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

export default function EconHeadCharts({
  da_fees,
}: {
  da_fees: FeesBreakdown;
}) {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
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

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points } = this;
      const date = new Date(x);
      let dateString = date.toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

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

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-36 md:w-40 text-xs font-raleway">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-8 mb-2 ">${dateString}</div>`;
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
        .sort((a: any, b: any) => {
          if (reversePerformer) return a.y - b.y;

          return b.y - a.y;
        })
        .map((point: any) => {
          const { series, y, percentage } = point;
          const { name } = series;
          if (selectedScale === "percentage")
            return `
              <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${
                  AllChainsByKeys["all_l2s"].colors["dark"][0]
                }"></div>
                <div class="tooltip-point-name">${name}</div>
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
                  background-color: ${
                    AllChainsByKeys["all_l2s"].colors["dark"][0]
                  };
                "></div>
              </div>`;

          let prefix = valuePrefix;
          let suffix = "";
          let value = y;
          let displayValue = y;

          return `
          <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${
              AllChainsByKeys["all_l2s"].colors["dark"][0]
            }"></div>
            <div class="tooltip-point-name text-md">${name}</div>
            <div class="flex-1 text-right font-inter flex">
                <div class="opacity-70 mr-0.5 ${
                  !prefix && "hidden"
                }">${prefix}</div>
                ${parseFloat(displayValue).toLocaleString("en-GB", {
                  minimumFractionDigits: valuePrefix ? 2 : 0,
                  maximumFractionDigits: valuePrefix ? 2 : 0,
                })}
                <div class="opacity-70 ml-0.5 ${
                  !suffix && "hidden"
                }">${suffix}</div>
            </div>
          </div>
          `;
        })
        .join("");

      let prefix = valuePrefix;
      let suffix = "";
      let value = pointsSum;

      const sumRow =
        selectedScale === "stacked"
          ? `
        <div class="flex w-full space-x-2 items-center font-medium mt-1.5 mb-0.5 opacity-70">
          <div class="w-4 h-1.5 rounded-r-full" style=""></div>
          <div class="tooltip-point-name text-md">Total</div>
          <div class="flex-1 text-right justify-end font-inter flex">

              <div class="opacity-70 mr-0.5 ${
                !prefix && "hidden"
              }">${prefix}</div>
              ${parseFloat(value).toLocaleString("en-GB", {
                minimumFractionDigits: valuePrefix ? 2 : 0,
                maximumFractionDigits: valuePrefix ? 2 : 0,
              })}
              <div class="opacity-70 ml-0.5 ${
                !suffix && "hidden"
              }">${suffix}</div>
          </div>
        </div>
        <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
          <div class="h-[2px] rounded-none absolute right-0 -top-[3px] w-full bg-white/0"></div>
        </div>`
          : "";

      return tooltip + tooltipPoints + sumRow + tooltipEnd;
    },
    [valuePrefix, reversePerformer, showUsd],
  );

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

  return (
    <div className="flex gap-x-[15px] w-full justify-between">
      {Object.keys(da_fees).map((key, i) => {
        let dataIndex = da_fees[key].daily.types.indexOf(
          showUsd ? "usd" : "eth",
        );

        return (
          <div
            className="relative w-full h-[155px] xl:h-[180px] pt-[10px] bg-[#1F2726] rounded-2xl overflow-hidden"
            key={key}
          >
            <div className="absolute top-[12px] w-full flex justify-between pl-[15px] text-[16px] font-[650] ">
              <div className="flex items-center gap-x-2 justify-center">
                <div>{da_fees[key].metric_name}</div>
                <div className="rounded-full w-[15px] h-[15px] bg-[#344240] flex items-center justify-center text-[10px] z-10">
                  <Icon
                    icon="feather:arrow-right"
                    className="w-[11px] h-[11px]"
                  />
                </div>
              </div>
            </div>

            <HighchartsProvider Highcharts={Highcharts}>
              <HighchartsChart
                containerProps={{ style: { height: "100%", width: "100%" } }}
                plotOptions={{
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
                        [
                          0,
                          AllChainsByKeys["all_l2s"].colors["dark"][0] + "33",
                        ],
                        [
                          1,
                          AllChainsByKeys["all_l2s"].colors["dark"][1] + "33",
                        ],
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
                        [0, AllChainsByKeys["all_l2s"]?.colors["dark"][0]],
                        // [0.33, AllChainsByKeys[series.name].colors[1]],
                        [1, AllChainsByKeys["all_l2s"]?.colors["dark"][1]],
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
                <Chart
                  backgroundColor={"transparent"}
                  type="area"
                  panning={{ enabled: true }}
                  panKey="shift"
                  zooming={{ type: undefined }}
                  style={{ borderRadius: 15 }}
                  animation={{ duration: 50 }}
                  // margin={[0, 15, 0, 0]} // Use the array form for margin
                  margin={[0, 15, 0, 0]}
                  spacingBottom={0}
                  spacingTop={40}
                  spacingLeft={0}
                  spacingRight={0}
                  onRender={(chartData) => {
                    const chart = chartData.target as any; // Cast chartData.target to any

                    if (!chart || !chart.series || chart.series.length === 0)
                      return;

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
                        AllChainsByKeys["all_l2s"].colors["dark"][1],
                      );
                      stop1?.setAttribute("stop-opacity", "1");
                      stop2?.setAttribute(
                        "stop-color",
                        AllChainsByKeys["all_l2s"].colors["dark"][0],
                      );
                      stop2?.setAttribute("stop-opacity", "0.33");
                    }

                    // only 1 chart so setting const for i to = 0
                    const i = 0;
                    // const chart: Highcharts.Chart = this;

                    const lastPoint: Highcharts.Point =
                      chart.series[0].points[chart.series[0].points.length - 1];

                    // check if i exists as a key in lastPointLines
                    if (!lastPointLines[key]) {
                      lastPointLines[key] = [];
                    }

                    if (lastPointLines[key] && lastPointLines[key].length > 0) {
                      lastPointLines[key].forEach((line) => {
                        line.destroy();
                      });
                      lastPointLines[key] = [];
                    }

                    // calculate the fraction that 15px is in relation to the pixel width of the chart
                    const fraction = 15 / chart.chartWidth;

                    // create a bordered line from the last point to the top of the chart's container
                    lastPointLines[key][lastPointLines[key].length] =
                      chart.renderer
                        .createElement("line")
                        .attr({
                          x1: chart.chartWidth * (1 - fraction) + 0.00005,
                          y1: lastPoint.plotY
                            ? lastPoint.plotY + chart.plotTop
                            : 0,
                          x2: chart.chartWidth * (1 - fraction) - 0.00005,
                          y2: chart.plotTop + 10,
                          stroke: isSafariBrowser
                            ? AllChainsByKeys["all_l2s"].colors["dark"][1]
                            : "url('#gradient0')",
                          "stroke-dasharray": "2",
                          "stroke-width": 1,
                          rendering: "crispEdges",
                        })
                        .add();

                    // lastPointLines[key][lastPointLines[key].length] =
                    //   chart.renderer
                    //     .createElement("line")
                    //     .attr({
                    //       x1: chart.chartWidth * (1 - fraction) + 0.5,
                    //       y1: chart.plotTop / 2 + 0.00005,
                    //       x2: chart.chartWidth * (1 - fraction),
                    //       y2: chart.plotTop / 2,
                    //       stroke: AllChainsByKeys["all_l2s"].colors["dark"][1],
                    //       "stroke-dasharray": 2,
                    //       "stroke-width": 1,
                    //       rendering: "crispEdges",
                    //     })
                    //     .add();

                    // create a circle at the end of the line
                    lastPointLines[key][lastPointLines[key].length] =
                      chart.renderer
                        .circle(
                          chart.chartWidth * (1 - fraction),
                          chart.plotTop / 3 + 7,
                          3,
                        )
                        .attr({
                          fill: AllChainsByKeys["all_l2s"].colors["dark"][1],
                          r: 4.5,
                          zIndex: 9999,
                          rendering: "crispEdges",
                        })
                        .add();
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
                    // formatter: (item) => {
                    //   const date = new Date(item.value);
                    //   const isMonthStart = date.getDate() === 1;
                    //   const isYearStart = isMonthStart && date.getMonth() === 0;
                    //   if (isYearStart) {
                    //     return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
                    //   } else {
                    //     return `<span style="">${date.toLocaleDateString("en-GB", {
                    //       month: "short",
                    //     })}</span>`;
                    //   }
                    // },
                  }}
                  crosshair={{
                    width: 0.5,
                    color: COLORS.PLOT_LINE,
                    snap: false,
                  }}
                  tickmarkPlacement="on"
                  tickWidth={1}
                  tickLength={20}
                  ordinal={false}
                  minorTicks={false}
                  minorTickLength={2}
                  minorTickWidth={2}
                  minorGridLineWidth={0}
                  minorTickInterval={1000 * 60 * 60 * 24 * 1}
                  min={da_fees[key].daily.data[0][0]}
                  max={
                    da_fees[key].daily.data[
                      da_fees[key].daily.data.length - 1
                    ][0]
                  }
                >
                  <XAxis.Title>X Axis</XAxis.Title>
                </XAxis>
                <YAxis
                  opposite={false}
                  // showFirstLabel={true}
                  // showLastLabel={true}
                  type="linear"
                  gridLineWidth={1}
                  gridLineColor={"#5A64624F"}
                  showFirstLabel={false}
                  showLastLabel={false}
                  labels={{
                    align: "left",
                    y: 11,
                    x: 3,
                    style: {
                      fontSize: "10px",
                      color: "#CDD8D34D",
                    },
                  }}
                  min={0}
                >
                  <YAxis.Title>Y Axis</YAxis.Title>
                  <AreaSeries
                    name={""}
                    showInLegend={false}
                    data={da_fees[key].daily.data.map((d: any) => [
                      d[0],
                      d[dataIndex],
                    ])}
                    states={{
                      hover: {
                        enabled: true,
                        halo: {
                          size: 5,
                          opacity: 1,
                          attributes: {
                            fill:
                              AllChainsByKeys["all_l2s"]?.colors["dark"][0] +
                              "99",
                            stroke:
                              AllChainsByKeys["all_l2s"]?.colors["dark"][0] +
                              "66",
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
                </YAxis>
              </HighchartsChart>
            </HighchartsProvider>
            <div className="opacity-100 transition-opacity duration-[900ms] group-hover/chart:opacity-0 absolute left-[7px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-forest-50/50 dark:bg-[#344240]/50 pointer-events-none">
              <div className="w-[5px] h-[5px] bg-[#CDD8D3] rounded-full"></div>

              <div className="text-[#CDD8D3] text-[8px] font-medium leading-[150%]">
                {new Date(da_fees[key].daily.data[0][0]).toLocaleDateString(
                  "en-GB",
                  {
                    timeZone: "UTC",
                    month: "short",
                    // day: "numeric",
                    year: "numeric",
                  },
                )}
              </div>
            </div>
            <div className="opacity-100 transition-opacity duration-[900ms] group-hover/chart:opacity-0 absolute right-[9px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-forest-50/50 dark:bg-[#344240]/50 pointer-events-none">
              <div className="text-[#CDD8D3] text-[8px] font-medium leading-[150%]">
                {new Date(
                  da_fees[key].daily.data[
                    da_fees[key].daily.data.length - 1
                  ][0],
                ).toLocaleDateString("en-GB", {
                  timeZone: "UTC",
                  month: "short",
                  // day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="w-[5px] h-[5px] bg-[#CDD8D3] rounded-full"></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
