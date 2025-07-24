import { DurationData, DailyData } from "@/types/api/EconomicsResponse";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  use,
} from "react";
import Highcharts from "highcharts/highstock";
import addHighchartsMore from "highcharts/highcharts-more";
import { useLocalStorage } from "usehooks-ts";
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
  AreaSeries,
  ColumnSeries,
} from "react-jsx-highcharts";
import { useUIContext } from "@/contexts/UIContext";
import { useMaster } from "@/contexts/MasterContext";
import { times } from "lodash";
const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

type AreaData = {
  seriesData: any[][]; // Replace 'any' with the specific type if known
  profitData: any[][]; // Replace 'any' with the specific type if known
};

function BreakdownCharts({
  data,
  dailyData,
  chain,
  timespans,
  selectedTimespan,
  isOpen,
  isMonthly,
}: {
  data: DurationData;
  dailyData: DailyData;
  chain: string;
  timespans: Object;
  selectedTimespan: string;
  isOpen?: boolean;
  isMonthly?: boolean;
}) {
  addHighchartsMore(Highcharts);

  const { AllChainsByKeys } = useMaster();

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [profitChart, setProfitChart] = useState<any>(null);
  const [mainChart, setMainChart] = useState<any>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const profitChartRef = useRef<HTMLDivElement>(null);
  const reversePerformer = false;
  const selectedScale: string = "absolute";
  const { isMobile } = useUIContext();
  const [isVisible, setIsVisible] = useState(isOpen);
  const valuePrefix = useMemo(() => {
    if (showUsd) return "$";
    // eth symbol
    return "Ξ";
  }, [showUsd]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, 300); // Match this duration with your CSS transition duration
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleMouseEnter = (event) => {
      const e = mainChart.pointer.normalize(event);
      const xAxisValue = mainChart.xAxis[0].toValue(e.chartX);
      const series = profitChart.series[0];

      // Find the index of the closest point to the xAxisValue
      let closestIndex = -1;
      let minDistance = Infinity;

      series.points.forEach((point, index) => {
        const currentX = point.x;
        const distance = Math.abs(currentX - xAxisValue);

        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      // Retrieve the point using the closestIndex
      const point = series.points[closestIndex];

      if (mainChart.xAxis[0].crosshair) {
        profitChart.xAxis[0].drawCrosshair(event, point);
      }
      if (point && point.graphic) {
        point.setState("hover"); // Highlight the point
      }
      profitChart.tooltip.hide();
    };

    const handleMouseLeave = () => {
      profitChart.tooltip.hide();
      // Add your custom logic here
    };

    const chartContainer = chartRef.current;
    if (chartContainer && mainChart && profitChart) {
      chartContainer.addEventListener("mouseenter", handleMouseEnter);
      chartContainer.addEventListener("mousemove", handleMouseEnter);
      chartContainer.addEventListener("mouseleave", handleMouseLeave);
    }

    // Clean up event listeners on component unmount
    return () => {
      if (chartContainer) {
        chartContainer.removeEventListener("mouseenter", handleMouseEnter);
        chartContainer.removeEventListener("mousemove", handleMouseEnter);
        chartContainer.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [mainChart, profitChart]);

  useEffect(() => {
    const handleMouseEnter = (event) => {
      const e = profitChart.pointer.normalize(event);
      const xAxisValue = profitChart.xAxis[0].toValue(e.chartX);

      const series1 = mainChart.series[0];
      const series2 = mainChart.series[1]; // Assuming mainChart has two series

      // Find the index of the closest point to the xAxisValue for series1
      let closestIndex1 = -1;
      let minDistance1 = Infinity;

      series1.points.forEach((point, index) => {
        const currentX = point.x;
        const distance = Math.abs(currentX - xAxisValue);

        if (distance < minDistance1) {
          minDistance1 = distance;
          closestIndex1 = index;
        }
      });

      // Retrieve the point using the closestIndex for series1
      const point1 = series1.points[closestIndex1];

      // Find the index of the closest point to the xAxisValue for series2
      let closestIndex2 = -1;
      let minDistance2 = Infinity;

      series2.points.forEach((point, index) => {
        const currentX = point.x;
        const distance = Math.abs(currentX - xAxisValue);

        if (distance < minDistance2) {
          minDistance2 = distance;
          closestIndex2 = index;
        }
      });

      // Retrieve the point using the closestIndex for series2
      const point2 = series2.points[closestIndex2];

      // Show crosshair for mainChart
      if (mainChart.xAxis[0].crosshair) {
        mainChart.xAxis[0].drawCrosshair(event, point1);
        mainChart.xAxis[0].drawCrosshair(event, point2); // Draw crosshair for both series
        profitChart.xAxis[0].drawCrosshair(event, point1);
      }

      // Refresh tooltips for both series
      mainChart.tooltip.refresh([point1, point2]);
    };

    const handleMouseLeave = () => {
      profitChart.tooltip.hide();
      // Add your custom logic here
    };

    const chartContainer = profitChartRef.current;
    if (chartContainer && mainChart && profitChart) {
      chartContainer.addEventListener("mouseenter", handleMouseEnter);
      chartContainer.addEventListener("mousemove", handleMouseEnter);
      chartContainer.addEventListener("mouseleave", handleMouseLeave);
    }

    // Clean up event listeners on component unmount
    return () => {
      if (chartContainer) {
        chartContainer.removeEventListener("mouseenter", handleMouseEnter);
        chartContainer.removeEventListener("mousemove", handleMouseEnter);
        chartContainer.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [
    mainChart,
    profitChart,
    profitChartRef,
    chartRef,
    timespans,
    selectedTimespan,
  ]);

  const newestUnixTimestamp = useMemo(() => {
    return dailyData.revenue.data[dailyData.revenue.data.length - 1][0];
  }, [selectedTimespan, dailyData]);

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

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-44 text-xs font-raleway">
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

        .map((point: any, index) => {
          const { series, y, percentage } = point;
          const { name } = series;
          const lastIndex = index === 1 && name !== "Profit";
          let profitY = 0;
          if (name === "Revenue" || name === "Costs") {
            const profitObj = dailyData.profit.data.find(
              (xValue) => xValue[0] === x,
            );
            if (profitObj) {
              profitY =
                profitObj[
                dailyData.profit.types.indexOf(showUsd ? "usd" : "eth")
                ];
            }
          }

          if (selectedScale === "percentage")
            return `
                  <div class="flex w-full gap-x-2 items-center font-medium mb-0.5">
                    <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${"#24E5DF"}"></div>
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
                      background-color: ${AllChainsByKeys["all_l2s"].colors["dark"][0]
              };
                    "></div>
                  </div>`;

          let prefix = valuePrefix;
          let suffix = "";
          let value = y;
          let displayValue = y;

          if (name === "Revenue" || name === "Costs") {
            return `
              <div class="flex w-full justify-between gap-x-2 items-center font-medium mb-0.5">
                  <div class="flex items-center gap-x-2">
                    <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${series.color
              }">
                    </div>
                  <div class="tooltip-point-name text-xs">${name}</div>
                </div>
                 <div class="flex-1 text-right justify-end flex numbers-xs">
                    <div class="${!prefix && "hidden"
              }">${prefix}</div>
                    ${parseFloat(displayValue).toLocaleString("en-GB", {
                minimumFractionDigits: valuePrefix ? 2 : 0,
                maximumFractionDigits: valuePrefix ? 2 : 0,
              })}
                    <div class="ml-0.5 ${!suffix && "hidden"
              }">${suffix}</div>
                </div>
              </div>
              ${lastIndex
                ? `<div class="flex w-full justify-between gap-x-2 items-center font-medium mb-0.5">
                <div class="flex items-center gap-x-2">
                  <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${profitY >= 0 ? "#EEFF97" : "#FFDF27"
                }">
                  </div>
                  <div class="tooltip-point-name text-xs">${"Profit"}</div>
                </div>
                 <div class="flex-1 text-right justify-end flex numbers-xs">
                    <div class="${!prefix && "hidden"
                }">${prefix}</div>
                    ${parseFloat(String(profitY)).toLocaleString("en-GB", {
                  minimumFractionDigits: valuePrefix ? 2 : 0,
                  maximumFractionDigits: valuePrefix ? 2 : 0,
                })}
                    <div class="ml-0.5 ${!suffix && "hidden"
                }">${suffix}</div>
                </div>
              </div>`
                : ""
              }
              `;
          } else {
            return `
            <div class="flex w-full justify-between gap-x-2 items-center font-medium mb-0.5">
              <div class="flex gap-x-1 items-center">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${series.color
              }"></div>
                <div class="tooltip-point-name text-xs">${name}</div>
              </div>
               <div class="flex-1 text-right justify-end flex numbers-xs">
                  <div class="${!prefix && "hidden"
              }">${prefix}</div>
                  ${parseFloat(displayValue).toLocaleString("en-GB", {
                minimumFractionDigits: valuePrefix ? 2 : 0,
                maximumFractionDigits: valuePrefix ? 2 : 0,
              })}
                  <div class="ml-0.5 ${!suffix && "hidden"
              }">${suffix}</div>
              </div>
            </div>
            
            `;
          }
        })
        .join("");

      let prefix = valuePrefix;
      let suffix = "";
      let value = pointsSum;

      const sumRow =
        selectedScale === "stacked"
          ? `
            <div class="flex w-full gap-x-2 items-center font-medium mt-1.5 mb-0.5 opacity-70">
              <div class="w-4 h-1.5 rounded-r-full" style=""></div>
              <div class="tooltip-point-name text-xs">Total</div>
               <div class="flex-1 text-right justify-end flex numbers-xs">
    
                  <div class="${!prefix && "hidden"
          }">${prefix}</div>
                  ${parseFloat(value).toLocaleString("en-GB", {
            minimumFractionDigits: valuePrefix ? 2 : 0,
            maximumFractionDigits: valuePrefix ? 2 : 0,
          })}
                  <div class="ml-0.5 ${!suffix && "hidden"
          }">${suffix}</div>
              </div>
            </div>
            <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
              <div class="h-[2px] rounded-none absolute right-0 -top-[3px] w-full bg-white/0"></div>
            </div>`
          : "";

      return tooltip + tooltipPoints + sumRow + tooltipEnd;
    },
    [valuePrefix, AllChainsByKeys, dailyData.profit.data, dailyData.profit.types, showUsd],
  );

  const tooltipManager = useMemo(() => {
    if (!mainChart || !profitChart) return;
    if (isOpen === false) {
      mainChart.tooltip.hide();
      profitChart.tooltip.hide();
    }
    return;
  }, [isOpen, mainChart, profitChart]);

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

  function formatNumber(x: number) {
    return (
      <div className="flex gap-x-0.5 ">
        <span>
          {Intl.NumberFormat("en-GB", {
            notation: "standard",
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          }).format(x)}
        </span>
      </div>
    );
  }

  const profitMinMaxValues = useMemo(() => {
    // Get the minimum timestamp for the selected timespan
    const minTimestamp =
      selectedTimespan !== "max"
        ? newestUnixTimestamp -
        1000 * 60 * 60 * 24 * timespans[selectedTimespan].value
        : 0;

    // Filter and extract the data points for either "usd" or "eth" based on dailyData.profit and selected timespan
    const values = dailyData.profit.data
      .filter((d: any) => d[0] >= minTimestamp) // Assuming the timestamp is the first element of each data point
      .map(
        (d: any) => d[dailyData.profit.types.indexOf(showUsd ? "usd" : "eth")],
      );

    // Calculate the absolute max value
    const maxAbsValue = Math.max(...values.map(Math.abs));

    // Define a function to round values up to a "clean" number for chart presentation
    const roundToNiceNumber = (value: number) => {
      const exponent = Math.floor(Math.log10(Math.abs(value)));
      const factor = Math.pow(10, exponent);
      return Math.ceil(Math.abs(value) / factor) * factor * Math.sign(value);
    };

    // Round the absolute max value
    const roundedMaxAbsValue = roundToNiceNumber(maxAbsValue);

    // Set the final max as the positive rounded value and the final min as the negative rounded value
    const finalMax = roundedMaxAbsValue;
    const finalMin = -roundedMaxAbsValue;

    return {
      min: finalMin,
      max: finalMax,
    };
  }, [data, showUsd, selectedTimespan, timespans]);

  return (
    <div
      className={`${isVisible ? "block" : "hidden"} `}
      onMouseLeave={() => {
        if (mainChart) mainChart.tooltip.hide();
        if (profitChart) profitChart.tooltip.hide();
      }}
    >
      <div
        className="w-full h-full min-h-[210px] max-h-[210px] relative "
        ref={chartRef}
      >
        <div className="absolute bottom-2.5 left-[50px] w-[48px] h-[16px] bg-[#344240AA] bg-opacity-50 z-20 rounded-full flex items-center  gap-x-[2px] px-[3px]">
          <div className="w-[5px] h-[5px] bg-[#1DF7EF] rounded-full"></div>
          <div className="text-xxxs">Revenue</div>
        </div>
        <div className="absolute bottom-2.5 left-[102px] w-[32px] h-[16px] bg-[#344240AA] bg-opacity-50 z-20 rounded-full flex items-center  gap-x-[2px] px-[3px]">
          <div className="w-[5px] h-[5px] bg-[#FE5468] rounded-full" />
          <div className="text-xxxs">Cost</div>
        </div>
        <HighchartsProvider Highcharts={Highcharts}>
          <HighchartsChart
            containerProps={{
              style: { height: "100%", width: "100%" },
            }}
            syncId="shareTooltip"
            plotOptions={{
              line: {
                lineWidth: 1.5,
              },
              area: {
                lineWidth: 1.5,
                dataGrouping: {
                  enabled: true,
                  units: isMonthly ? [["month", [1]]] : [["day", [1]]],
                },

                // marker: {
                //   radius: 12,
                //   lineWidth: 4,
                // },

                // shadow: {
                //   color:
                //     AllChainsByKeys[data.chain_id]?.colors[theme ?? "dark"][1] + "33",
                //   width: 10,
                // },

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
              type="line"
              panning={{
                enabled: false,
                type: "x",
              }}
              panKey="shift"
              // zooming={{
              //   type: "x",
              //   mouseWheel: {
              //     enabled: false,
              //     type: "xy",
              //   },
              // }}
              zooming={{
                mouseWheel: {
                  enabled: false,
                },
              }}
              animation={{
                duration: 50,
              }}
              marginBottom={5}
              marginLeft={45}
              marginRight={45}
              marginTop={15}
              height={209}
              onRender={(chartData) => {
                const chart = chartData.target as any; // Cast chartData.target to any

                if (!chart || !chart.series || chart.series.length === 0)
                  return;

                setMainChart(chart);

                // console.log(chart);
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
              }}
              crosshair={{
                width: 0.5,
                color: COLORS.PLOT_LINE,
                snap: true,
              }}
              tickmarkPlacement="on"
              zoomEnabled={false}
              // startOnTick={true}
              // endOnTick={true}
              tickWidth={0}
              tickLength={20}
              // ordinal={true}
              minorTicks={false}
              minorTickLength={2}
              minorTickWidth={2}
              minorGridLineWidth={0}
              minorTickInterval={1000 * 60 * 60 * 24 * 1}
              // min={
              //   timespans[selectedTimespan].xMin
              //     ? newestUnixTimestamp -
              //       1000 *
              //         60 *
              //         60 *
              //         24 *
              //         (timespans[selectedTimespan].value - 1)
              //     : undefined
              // }
              min={timespans[selectedTimespan].xMin + 1000 * 60 * 60 * 24 * 1} // don't include the last day
              max={timespans[selectedTimespan].xMax}
              panningEnabled={true}
            ></XAxis>
            <YAxis
              opposite={false}
              // showFirstLabel={true}
              // showLastLabel={true}
              type="linear"
              gridLineWidth={1}
              gridLineColor={"#5A6462"}
              gridLineDashStyle={"ShortDot"}
              gridZIndex={10}
              min={0}
              showFirstLabel={true}
              showLastLabel={true}
              tickAmount={5}
              zoomEnabled={false}
              labels={{
                align: "right",
                y: 2,
                x: -3,
                style: {
                  textAlign: "right",
                  width: 45,
                  color: "rgb(215, 223, 222)",
                  fontSize: "10px",
                  fontWeight: "700",
                  fontFamily: "Fira Sans",
                },


                useHTML: true,
                formatter: function (
                  this: Highcharts.AxisLabelsFormatterContextObject,
                ): string {
                  const value = this.value as number | bigint;
                  const formattedValue =
                    valuePrefix +
                    Intl.NumberFormat("en-GB", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                      minimumFractionDigits: 0,
                    }).format(value);

                  // Check if this is the last label
                  if (this.isFirst) {
                    // For the last label, we'll use a trick to adjust its position
                    // by adding some HTML spacing
                    const yAdjustment = 3; // Adjust this value to move the label up or down
                    return `<span style="position:relative; bottom:${yAdjustment}px;">${formattedValue}</span>`;
                  }
                  if (this.isLast) {
                    // For the last label, we'll use a trick to adjust its position
                    // by adding some HTML spacing
                    const yAdjustment = 5; // Adjust this value to move the label up or down
                    return `<span style="position:relative; top:${yAdjustment}px;">${formattedValue}</span>`;
                  }

                  return formattedValue;
                },
              }}
            >
              <AreaSeries
                name="Revenue"
                color={"#1DF7EF"}
                data={dailyData.revenue.data.map((d: any) => [
                  d[0],
                  d[dailyData.revenue.types.indexOf(showUsd ? "usd" : "eth")],
                ])}
                dataGrouping={{
                  enabled: true,
                  units: isMonthly ? [["month", [1]]] : [["day", [1]]],
                }}
                lineWidth={1.5}
                fillColor={{
                  linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1,
                  },

                  stops: [
                    /* 50% in hex: 80 */
                    // [0.33, "#10808C80"],
                    // [1, "#1DF7EF80"],
                    [0, "#10808CDD"],
                    [0.5, "#10808CDD"],
                    [1, "#1DF7EFDD"],
                  ],
                }}
              />
              {/* Second line */}
              <AreaSeries
                name="Costs"
                color={"#FE5468"}
                data={dailyData.costs.data.map((d: any) => [
                  d[0],
                  d[dailyData.costs.types.indexOf(showUsd ? "usd" : "eth")],
                ])}
                dataGrouping={{
                  enabled: true,
                  units: isMonthly ? [["month", [1]]] : [["day", [1]]],
                }}
                lineWidth={1.5}
                fillColor={{
                  linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1,
                  },
                  stops: [
                    /* 50% in hex: 80 */
                    // [0.33, "#98323E80"],
                    // [1, "#FE546880"],
                    [0, "#98323EDD"],
                    [0.5, "#98323EDD"],
                    [1, "#FE5468DD"],
                  ],
                }}
              />
              {/* 

                position: absolute;
              width: 1182px;
              height: 207px;
              left: 0px;
              top: 42px;

              background: linear-gradient(180deg, #10808C 0%, #1DF7EF 100%);
              opacity: 0.5;
              border-radius: 3px;

              */}

              {/* Area between the lines */}
            </YAxis>
          </HighchartsChart>
        </HighchartsProvider>
      </div>
      <div className="w-full h-[2px] px-[45px] flex items-center justify-center relative bottom-[1.5px] ">
        <div className="w-full h-full  bg-[#344240]"></div>
      </div>
      <div
        className="h-[175px] w-full flex justify-center items-center relative  overflow-visible"
        ref={profitChartRef}
      >
        <div className="absolute top-2.5 left-[50px] w-[36px] h-[16px] bg-[#344240AA] bg-opacity-50 z-20 rounded-full flex items-center  gap-x-[2px] px-[3px]">
          <div className="w-[5px] h-[5px] bg-[#EEFF97] rounded-full"></div>
          <div className="text-xxxs">Profit</div>
        </div>
        <div className="absolute bottom-[36px] left-[50px] w-[36px] h-[16px] bg-[#344240AA] bg-opacity-50 rounded-full flex items-center z-20  gap-x-[2px] px-[3px]">
          <div className="w-[5px] h-[5px] bg-[#FFDF27] rounded-full" />
          <div className="text-xxxs">Loss</div>
        </div>
        <HighchartsProvider Highcharts={Highcharts}>
          {" "}
          <HighchartsChart
            containerProps={{
              style: { height: 175, width: "100%" },
              overflow: "allow",
            }}
            syncId="shareTooltip"
            plotOptions={{
              line: {
                lineWidth: 1.5,
              },
              area: {
                lineWidth: 1.5,
              },
              column: {
                stacking: "normal",
                borderColor: "transparent",
                groupPadding: 0,
                animation: true,
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
              type="column"
              panning={{
                enabled: false,
                type: "x",
              }}
              panKey="shift"
              zooming={{
                mouseWheel: {
                  enabled: false,
                },
              }}
              style={{
                borderRadius:
                  timespans[selectedTimespan] > 90 || selectedTimespan === "max"
                    ? 15
                    : 30,
              }}
              animation={{
                duration: 50,
              }}
              marginBottom={30}
              marginLeft={45}
              marginRight={45}
              marginTop={2}
              onRender={(chartData) => {
                const chart = chartData.target as any; // Cast chartData.target to any

                if (!chart || !chart.series || chart.series.length === 0)
                  return;

                setProfitChart(chart);
                // console.log(chart);
              }}
            />
            <Tooltip
              useHTML={true}
              enabled={false}
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
              type="datetime"
              labels={{
                align: undefined,
                rotation: 0,
                // allowOverlap: false,
                // staggerLines: 1,
                // reserveSpace: true,
                overflow: "justify",
                useHTML: true,
                distance: -14,
                style: {
                  color: COLORS.LABEL,
                  fontSize: "10px",
                  fontWeight: "550",
                  fontVariant: "small-caps",
                  textTransform: "lowercase",
                  fontFamily: "var(--font-raleway), sans-serif",
                  // fontVariant: "all-small-caps",
                  zIndex: 1000,
                },
                enabled: true,

                formatter: function () {
                  // Convert Unix timestamp to milliseconds
                  const date = new Date(this.value);
                  // Format the date as needed (e.g., "dd MMM yyyy")
                  const dateString = date
                    .toLocaleDateString("en-GB", {
                      day: !(
                        timespans[selectedTimespan].value >= 90 ||
                        selectedTimespan === "max"
                      )
                        ? "2-digit"
                        : undefined,
                      month: "short",
                      year:
                        timespans[selectedTimespan].value >= 90 ||
                          selectedTimespan === "max"
                          ? "numeric"
                          : undefined,
                    })
                    .toUpperCase();

                  return `<span class="font-bold">${dateString}</span>`;
                },
              }}
              crosshair={{
                width: 0.5,
                color: COLORS.PLOT_LINE,
                snap: true,
              }}
              zoomEnabled={false}
              lineWidth={0}
              offset={24}
              // startOnTick={true}
              // endOnTick={true}
              tickAmount={0}
              tickLength={5}
              tickWidth={1}
              // ordinal={true}
              minorTicks={false}
              minorTickLength={2}
              minorTickWidth={2}
              minorGridLineWidth={0}
              minorTickInterval={1000 * 60 * 60 * 24 * 1}
              // min={
              //   timespans[selectedTimespan].xMin
              //     ? newestUnixTimestamp -
              //       1000 *
              //         60 *
              //         60 *
              //         24 *
              //         (timespans[selectedTimespan].value - 1)
              //     : undefined
              // }
              min={timespans[selectedTimespan].xMin + 1000 * 60 * 60 * 24 * 1} // don't include the last day
              max={timespans[selectedTimespan].xMax}
              panningEnabled={true}
            >
              <XAxis.Title></XAxis.Title>
            </XAxis>
            <YAxis
              opposite={false}
              // showFirstLabel={true}
              // showLastLabel={true}
              zoomEnabled={false}
              type="linear"
              gridLineWidth={1}
              gridLineColor={"#5A6462"}
              gridLineDashStyle={"ShortDot"}
              gridZIndex={10}
              showFirstLabel={true}
              showLastLabel={true}
              tickAmount={3}
              min={profitMinMaxValues.min}
              max={profitMinMaxValues.max}
              labels={{
                align: "right",
                y: 2,
                x: -3,
                overflow: "allow",
                style: {
                  textAlign: "right",
                  width: 45,
                  color: "rgb(215, 223, 222)",
                  fontSize: "10px",
                  fontWeight: "700",
                  fontFamily: "Fira Sans",
                },
                useHTML: true,
                formatter: function (
                  this: Highcharts.AxisLabelsFormatterContextObject,
                ): string {
                  const value = this.value as number | bigint;
                  const formattedValue =
                    valuePrefix +
                    Intl.NumberFormat("en-GB", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                      minimumFractionDigits: 0,
                    }).format(value);

                  // Check if this is the last label
                  if (this.isLast) {
                    // For the last label, we'll use a trick to adjust its position
                    // by adding some HTML spacing
                    const yAdjustment = 5; // Adjust this value to move the label up or down
                    return `<span style="position:relative; top:${yAdjustment}px;">${formattedValue}</span>`;
                  }

                  return formattedValue;
                },
              }}
            >
              {" "}
              <ColumnSeries
                name="Profit"
                borderRadius="8%"
                pointPlacement="on"
                zones={[
                  {
                    value: 0, // Values up to 0 (exclusive)
                    color: {
                      linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1,
                      },
                      stops: [
                        [0, "#FFE761DD"],
                        [1, "#C7AE24DD"],
                      ],
                    },
                  },
                  {
                    color: {
                      linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1,
                      },
                      stops: [
                        [0, "#EEFF97DD"],
                        [0.5, "#EEFF97DD"],
                        [1, "#A1B926DD"],
                      ],
                    },
                  },
                ]}
                data={dailyData.profit.data.map((d: any) => [
                  d[0],
                  d[dailyData.profit.types.indexOf(showUsd ? "usd" : "eth")],
                ])}
              />
            </YAxis>
          </HighchartsChart>
        </HighchartsProvider>
      </div>
    </div>
  );
}

export default React.memo(BreakdownCharts, (prevProps, nextProps) => {
  // Prevent re-renders if isOpen is false in both prev and next props
  if (!prevProps.isOpen && !nextProps.isOpen) {
    return true; // No need to re-render
  }

  // Normal comparison logic
  return (
    prevProps.data === nextProps.data &&
    prevProps.dailyData === nextProps.dailyData &&
    prevProps.chain === nextProps.chain &&
    prevProps.timespans === nextProps.timespans &&
    prevProps.selectedTimespan === nextProps.selectedTimespan &&
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.isMonthly === nextProps.isMonthly
  );
});

