import { DurationData, DailyData } from "@/types/api/EconomicsResponse";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Highcharts from "highcharts/highstock";
import addHighchartsMore from "highcharts/highcharts-more";
import { useLocalStorage } from "usehooks-ts";
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
import { AllChainsByKeys } from "@/lib/chains";
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
}: {
  data: DurationData;
  dailyData: DailyData;
  chain: string;
  timespans: Object;
  selectedTimespan: string;
}) {
  addHighchartsMore(Highcharts);

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const reversePerformer = true;
  const selectedScale: string = "absolute";
  const { isMobile } = useUIContext();

  const valuePrefix = useMemo(() => {
    if (showUsd) return "$";
    // eth symbol
    return "Ξ";
  }, [showUsd]);

  const data1 = [1, 2, 3, 4, 5];
  const data2 = [2, 3, 2, 5, 6];

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
              <div class="flex w-full justify-between space-x-2 items-center font-medium mb-0.5">
                <div class="flex gap-x-1 items-center">
                  <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${
                    series.color
                  }"></div>
                  <div class="tooltip-point-name text-md">${name}</div>
                </div>
                <div class="flex-1 justify-end text-right font-inter flex">
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
    [valuePrefix, reversePerformer],
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

  console.log(dailyData);
  const ProfitArea = useMemo(() => {
    const largerData =
      dailyData.revenue.data.length > dailyData.costs.data.length
        ? "revenue"
        : "costs";
    const smallerData = largerData === "revenue" ? "costs" : "revenue";

    let lesserIndex = 0;
    let retArray: Array<[string | number, number, number]> = [];
    let isProfitableArray: Array<[string | number, boolean]> = [];

    dailyData[largerData].data.forEach((data, i) => {
      if (lesserIndex < dailyData[smallerData].data.length - 1) {
        if (
          dailyData[largerData].data[i][0] ===
          dailyData[smallerData].data[lesserIndex][0]
        ) {
          const timestamp = dailyData[largerData].data[i][0];
          const smallerValue =
            dailyData[largerData].data[i][
              dailyData.revenue.types.indexOf(showUsd ? "usd" : "eth")
            ] >
            dailyData[smallerData].data[lesserIndex][
              dailyData.revenue.types.indexOf(showUsd ? "usd" : "eth")
            ]
              ? dailyData[smallerData].data[lesserIndex][
                  dailyData.revenue.types.indexOf(showUsd ? "usd" : "eth")
                ]
              : dailyData[largerData].data[i][
                  dailyData.revenue.types.indexOf(showUsd ? "usd" : "eth")
                ];

          const largerValue =
            dailyData[largerData].data[i][
              dailyData.revenue.types.indexOf(showUsd ? "usd" : "eth")
            ] >
            dailyData[smallerData].data[lesserIndex][
              dailyData.revenue.types.indexOf(showUsd ? "usd" : "eth")
            ]
              ? dailyData[largerData].data[i][
                  dailyData.revenue.types.indexOf(showUsd ? "usd" : "eth")
                ]
              : dailyData[smallerData].data[lesserIndex][
                  dailyData.revenue.types.indexOf(showUsd ? "usd" : "eth")
                ];

          retArray.push([timestamp, smallerValue, largerValue]);

          const profitable =
            largerData === "revenue"
              ? dailyData[largerData].data[i][1] >
                dailyData[smallerData].data[lesserIndex][1]
              : dailyData[largerData].data[i][1] <
                dailyData[smallerData].data[lesserIndex][1];

          isProfitableArray.push([timestamp, profitable]);
        }
        lesserIndex++;
      }
    });

    return { seriesData: retArray, profitData: isProfitableArray } as AreaData;
  }, [dailyData, data]);

  const zones = useMemo(() => {
    if (!ProfitArea) return;
    const zonesArray: { value: number; fillColor: string }[] = [];

    if (ProfitArea.profitData.length > 0) {
      let startTimestamp = ProfitArea.profitData[0][0];
      let startColor = ProfitArea.profitData[0][1] ? "#0000FF" : "#FF0000"; // Blue if true, red if false

      for (let i = 1; i < ProfitArea.profitData.length; i++) {
        const [timestamp, isProfitable] = ProfitArea.profitData[i];

        if (isProfitable !== ProfitArea.profitData[i - 1][1]) {
          // End of streak, push current zone
          zonesArray.push({
            value: startTimestamp,
            fillColor: startColor,
          });

          // Start new streak
          startTimestamp = timestamp;
          startColor = isProfitable ? "#0000FF" : "#FF0000";
        }
      }

      // Push the last streak
      zonesArray.push({
        value: startTimestamp,
        fillColor: startColor,
      });
    }

    return zonesArray;
  }, [ProfitArea]);

  console.log(ProfitArea);

  return (
    <div className="h-full">
      <div className="w-full h-full min-h-[209px] max-h-[209px] relative">
        <HighchartsProvider Highcharts={Highcharts}>
          <HighchartsChart
            containerProps={{
              style: { height: "100%", width: "100%" },
            }}
            plotOptions={{
              line: {
                lineWidth: 1.5,
              },
              area: {
                lineWidth: 1.5,

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
                enabled: true,
              }}
              panKey="shift"
              zooming={{
                type: undefined,
              }}
              style={{
                borderRadius: 15,
              }}
              animation={{
                duration: 50,
              }}
              marginBottom={5}
              marginLeft={45}
              marginRight={45}
              marginTop={5}
              onRender={(chartData) => {
                const chart = chartData.target as any; // Cast chartData.target to any

                if (!chart || !chart.series || chart.series.length === 0)
                  return;
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
                snap: false,
              }}
              tickmarkPlacement="on"
              tickWidth={1}
              tickLength={20}
              ordinal={false}
              minorTicks={true}
              minorTickLength={2}
              minorTickWidth={2}
              minorGridLineWidth={0}
              minorTickInterval={1000 * 60 * 60 * 24 * 1}
              min={
                timespans[selectedTimespan].xMin
                  ? timespans[selectedTimespan].xMin
                  : undefined
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
              gridLineColor={"#CDD8D3AA"}
              gridLineDashStyle={"Dot"}
              gridZIndex={10}
              showFirstLabel={true}
              showLastLabel={false}
              tickAmount={5}
              labels={{
                align: "right",
                y: 2,
                x: -3,
                style: {
                  fontSize: "10px",
                  fontWeight: "600",
                  color: "#CDD8D3",
                  textAlign: "right",
                  width: 45,
                },
                formatter: function () {
                  const value = this.value as number | bigint;
                  return (
                    valuePrefix +
                    Intl.NumberFormat("en-GB", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                      minimumFractionDigits: 0,
                    }).format(value)
                  );
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
                lineWidth={1.5}
                fillColor={{
                  linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1,
                  },
                  stops: [
                    [0, "#1DF7EF66"],
                    [1, "#1DF7EF33"],
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
                lineWidth={1.5}
                fillColor={{
                  linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1,
                  },
                  stops: [
                    [0, "#FE5468CC"],
                    [1, "#FE546855"],
                  ],
                }}
              />

              {/* Area between the lines */}
            </YAxis>
          </HighchartsChart>
        </HighchartsProvider>
      </div>
      <div className="h-[140px] flex justify-center items-center relative ">
        <HighchartsProvider Highcharts={Highcharts}>
          <HighchartsChart
            containerProps={{
              style: { height: "100%", width: "100%" },
            }}
            plotOptions={{
              line: {
                lineWidth: 1.5,
              },
              area: {
                lineWidth: 1.5,
              },
              column: {
                borderRadius: 1,
                borderWidth: 0,
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
                enabled: true,
              }}
              panKey="shift"
              zooming={{
                type: undefined,
              }}
              style={{
                borderRadius: 15,
              }}
              animation={{
                duration: 50,
              }}
              marginBottom={5}
              marginLeft={45}
              marginRight={45}
              marginTop={0}
              onRender={(chartData) => {
                const chart = chartData.target as any; // Cast chartData.target to any

                if (!chart || !chart.series || chart.series.length === 0)
                  return;
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
                snap: false,
              }}
              tickmarkPlacement="on"
              tickWidth={1}
              tickLength={20}
              ordinal={false}
              gridLineWidth={0}
              minorTicks={false}
              minorTickLength={2}
              minorTickWidth={2}
              minorGridLineWidth={0}
              minorTickInterval={1000 * 60 * 60 * 24 * 1}
              min={
                timespans[selectedTimespan].xMin
                  ? timespans[selectedTimespan].xMin
                  : undefined
              }
            ></XAxis>
            <YAxis
              opposite={false}
              // showFirstLabel={true}
              // showLastLabel={true}
              type="linear"
              gridLineWidth={1}
              gridLineColor={"#CDD8D3AA"}
              gridLineDashStyle={"Dot"}
              gridZIndex={10}
              showFirstLabel={true}
              showLastLabel={false}
              tickAmount={4}
              softMin={-10000}
              labels={{
                align: "right",
                y: 2,
                x: -3,
                style: {
                  fontSize: "10px",
                  fontWeight: "600",
                  color: "#CDD8D3",
                  textAlign: "right",
                  width: 45,
                },
                formatter: function () {
                  const value = this.value as number | bigint;
                  return (
                    valuePrefix +
                    Intl.NumberFormat("en-GB", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                      minimumFractionDigits: 0,
                    }).format(value)
                  );
                },
              }}
            >
              {" "}
              <ColumnSeries
                name="Profit"
                color={"#FFDF27"}
                zones={[
                  {
                    value: 0, // Values up to 0 (exclusive)
                    color: "#FFDF27", // Color for negative values
                  },
                  {
                    color: "#EEFF97", // Color for positive values
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
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.data === nextProps.data &&
    prevProps.dailyData === nextProps.dailyData &&
    prevProps.chain === nextProps.chain &&
    prevProps.timespans === nextProps.timespans &&
    prevProps.selectedTimespan === nextProps.selectedTimespan
  );
});
