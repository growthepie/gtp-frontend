import { DurationData, DailyData } from "@/types/api/EconomicsResponse";
import { useState, useEffect, useMemo, useCallback } from "react";
import Highcharts from "highcharts/highstock";
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
  PlotBand,
  PlotLine,
  withHighcharts,
  AreaSeries,
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

export default function BreakdownCharts({
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

  return (
    <div className="w-full h-full min-h-[240px] max-h-[240px] ">
      <HighchartsProvider Highcharts={Highcharts}>
        <HighchartsChart
          containerProps={{
            style: { height: "100%", width: "100%" },
          }}
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
                  [0, AllChainsByKeys["all_l2s"].colors["dark"][0] + "33"],
                  [1, AllChainsByKeys["all_l2s"].colors["dark"][1] + "33"],
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
            marginBottom={1}
            marginLeft={0}
            marginRight={0}
            marginTop={0}
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
              formatter: function () {
                const value = this.value as number | bigint;
                return (
                  valuePrefix +
                  Intl.NumberFormat("en-GB", {
                    notation: "compact",
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  }).format(value)
                );
              },
            }}
          >
            <YAxis.Title>Y Axis</YAxis.Title>
            <SplineSeries
              name="Revenue"
              color={"#CDD8D399"}
              data={dailyData.revenue.data.map((d: any) => [
                d[0],
                d[dailyData.revenue.types.indexOf(showUsd ? "usd" : "eth")],
              ])}
              lineWidth={2}
            />

            {/* Second line */}
            <SplineSeries
              name="Costs"
              color={"#FE546899"}
              data={dailyData.costs.data.map((d: any) => [
                d[0],
                d[dailyData.costs.types.indexOf(showUsd ? "usd" : "eth")],
              ])}
              lineWidth={1}
            />

            {/* Area between the lines */}
            <AreaSplineSeries
              name="Profit"
              data={dailyData.profit.data.map((d: any) => [
                d[0],
                d[dailyData.profit.types.indexOf(showUsd ? "usd" : "eth")],
              ])}
              color={"#ECF87F"}
              fillColor={"#00D10099"}
              enableMouseTracking={false}
              showInLegend={false}
              color="rgba(0, 100, 0, 0.5)"
              fillOpacity={0.5}
              lineWidth={0}
            />
          </YAxis>
        </HighchartsChart>
      </HighchartsProvider>
    </div>
  );
}
