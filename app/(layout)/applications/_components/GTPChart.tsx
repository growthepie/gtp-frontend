"use client";
import { DurationData, DailyData } from "@/types/api/EconomicsResponse";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  use,
  useLayoutEffect,
  ReactNode,
} from "react";
import Highcharts, {
  AxisLabelsFormatterContextObject,
} from "highcharts/highstock";
import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsPatternFill from "highcharts/modules/pattern-fill";
import highchartsRoundedCorners from "highcharts-rounded-corners";
import addHighchartsMore from "highcharts/highcharts-more";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { AxisTickPositionerCallbackFunction } from "highcharts";
import {
  HighchartsProvider,
  HighchartsChart,
  Chart,
  XAxis,
  YAxis,
  Tooltip as HighchartsTooltip,
  Series,
  HighchartsProviderProps,
  HighchartsChartProps,
  ChartProps,
  AreaSeries,
} from "react-jsx-highcharts";
import { useUIContext, useHighchartsWrappers } from "@/contexts/UIContext";
import { useMaster } from "@/contexts/MasterContext";
import { debounce, over, times } from "lodash";
import "@/app/highcharts.axis.css";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import { daMetricItems, metricItems } from "@/lib/metrics";
import { format as d3Format } from "d3"
import { useTheme } from "next-themes";
import { BASE_URL } from "@/lib/helpers";
import EmbedContainer from "@/app/(embeds)/embed/EmbedContainer";
import ChartWatermark from "@/components/layout/ChartWatermark";
import { Icon } from "@iconify/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import dynamic from "next/dynamic";
import { baseOptions, formatNumber, tooltipFormatter } from "@/lib/chartUtils";
import { useTimespan } from "../_contexts/TimespanContext";
import { useChartScale } from "../_contexts/ChartScaleContext";
import { useMetrics } from "../_contexts/MetricsContext";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

highchartsRoundedCorners(Highcharts);

type SeriesData = {
  name: string;
  data: number[][]; // [timestamp, value]
}

export const ApplicationDetailsChart = ({ seriesData, metric }: { seriesData: SeriesData[], metric: string }) => {
  const { selectedScale } = useChartScale();

  const getPlotOptions: (scale: string) => Highcharts.PlotOptions = (scale) => {
    switch (scale) {
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
      case "stacked":
        return {
          column: {
            stacking: "normal",
            crisp: false,
          },
          area: {
            stacking: "normal",
          },
        };
      default:
        return {
          column: {
            stacking: undefined,
          },
          line: {
            stacking: undefined,
          },
          area: {
            stacking: undefined,
          },
        };
    }
  }

  const plotOptions: Highcharts.PlotOptions = {
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
    ...getPlotOptions(selectedScale),
  };

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });
    highchartsRoundedCorners(Highcharts);
    highchartsAnnotations(Highcharts);
    highchartsPatternFill(Highcharts);

    // update x-axis label sizes if it is a 4 digit number
    Highcharts.wrap(
      Highcharts.Axis.prototype,
      "renderTick",
      function (proceed) {
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        const axis: Highcharts.Axis = this;
        const ticks: Highcharts.Dictionary<Highcharts.Tick> = axis.ticks;
        if (
          axis.isXAxis &&
          axis.options.labels &&
          axis.options.labels.enabled
        ) {
          Object.keys(ticks).forEach((tick) => {
            const tickLabel = ticks[tick].label;
            if (!tickLabel) return;
            const tickValue = tickLabel.element.textContent;
            if (tickValue) {
              // if the tick value is a 4 digit number, increase the font size
              if (tickValue.length === 4) {
                tickLabel.css({
                  transform: "scale(1.4)",
                  fontWeight: "600",
                });
              }
            }
          });
        }
      },
    );

  }, []);

  return (
    <GTPChart 
      highchartsChartProps={{
        chart: {
          height: 168
        },
        plotOptions: {
          ...plotOptions,
        }
      }} 

      chartProps={{}} 
    >
      <GTPChartTooltip metric_id={metric} />
      <GTPXAxis
        categories={times(24, (i) => `${i}:00`)}
        labels={{
          style: {
            color: "rgb(215, 223, 222)",
          },
        }}
      />
      <GTPYAxis
        title={{
          text: "Transactions",
          style: {
            color: "rgb(215, 223, 222)",
          },
        }}
        labels={{
          style: {
            color: "rgb(215, 223, 222)",
          },
        }}
      >

        {seriesData.map((series, i) => (
          <AreaSeries
            key={i}
            type="column"
            name={series.name}
            data={series.data}
            // color={metricItems[series.name].color}
          />
        ))}
        
      </GTPYAxis>
    </GTPChart>
  )
}

type AxisProps<TAxisOptions> = {
  children?: ReactNode;
  onAfterBreaks?: Highcharts.AxisEventCallbackFunction;
  onAfterSetExtremes?: Highcharts.AxisSetExtremesEventCallbackFunction;
  onPointBreak?: Highcharts.AxisPointBreakEventCallbackFunction;
  onPointInBreak?: Highcharts.AxisPointBreakEventCallbackFunction;
  onSetExtremes?: Highcharts.AxisSetExtremesEventCallbackFunction;
} & Partial<TAxisOptions>;

const GTPXAxis = (props: AxisProps<Highcharts.XAxisOptions>) => {
  const { timespans, selectedTimespan} = useTimespan();
  // start of yesterday in UTC is the last data point we have
  const startOfYesterdayUTC = new Date(new Date().setUTCHours(0, 0, 0, 0) - 24 * 3600 * 1000).getTime();
  const xMax = startOfYesterdayUTC;
  const xMin = timespans[selectedTimespan].value > 0 ? startOfYesterdayUTC - timespans[selectedTimespan].value * 24 * 3600 * 1000 : undefined;
  return (
    <XAxis
      {...props}
      // {...baseOptions.xAxis}
      title={undefined}
      // events={{
      //   afterSetExtremes: onXAxisSetExtremes,
      // }}
      type="datetime"
      labels={{
        align: undefined,
        rotation: 0,
        allowOverlap: false,
        // staggerLines: 1,
        reserveSpace: true,
        overflow: "justify",
        useHTML: true,
        formatter: function (this: AxisLabelsFormatterContextObject) {
          if (xMin && xMax - xMin <= 40 * 24 * 3600 * 1000) {
            let isBeginningOfWeek = new Date(this.value).getUTCDay() === 1;
            let showMonth = this.isFirst || new Date(this.value).getUTCDate() === 1;

            return new Date(this.value).toLocaleDateString("en-GB", {
              timeZone: "UTC",
              month: "short",
              day: "numeric",
              year: this.isFirst ? "numeric" : undefined,
            });
          }
          else {
            // if Jan 1st, show year
            if (new Date(this.value).getUTCMonth() === 0) {
              return new Date(this.value).toLocaleDateString("en-GB", {
                timeZone: "UTC",
                year: "numeric",
              });
            }
            // if not 1st of the month, show month and day
            else if (new Date(this.value).getUTCDate() !== 1) {
              return new Date(this.value).toLocaleDateString("en-GB", {
                timeZone: "UTC",
                month: "short",
                day: "numeric",
              });
            }
            return new Date(this.value).toLocaleDateString("en-GB", {
              timeZone: "UTC",
              month: "short",
              year: "numeric",
            });
          }
        },
        y: 30,
        style: {
          fontFamily: "Fira Sans",
          fontSize: "10px",
          color: "#CDD8D3",
        },
      }}
      crosshair={{
        width: 0.5,
        color: COLORS.PLOT_LINE,
        snap: false,
      }}
      tickColor="#5A6462"
      tickmarkPlacement="on"
      zoomEnabled={false}
      tickPosition="outside"
      tickWidth={2}
      tickLength={15}
      minorTicks={false}
      minorTickColor="#5A6462"
      minorTickLength={3}
      minorTickWidth={2}
      minorGridLineWidth={0}
      // tickInterval={}
      // tickInterval={tickInterval}
      // minorTickInterval={timespans[selectedTimespan].xMax - timespans[selectedTimespan].xMin <= 40 * 24 * 3600 * 1000 ? 30 * 3600 * 1000 : 30 * 24 * 3600 * 1000}
      minPadding={0}
      maxPadding={0}
      // min={zoomed ? zoomMin : timespans[selectedTimespan].xMin} // don't include the last day
      // max={zoomed ? zoomMax : timespans[selectedTimespan].xMax}
      min={xMin}
      max={xMax}
    />
  )
}

const GTPYAxis = (props: AxisProps<Highcharts.YAxisOptions>) => {
  return (
    <YAxis
      {...props}
      {...baseOptions.yAxis}
      title={undefined}
      opposite={false}
      // type={selectedYAxisScale === "logarithmic" && selectedScale === "absolute" ? "logarithmic" : "linear"}
      // showFirstLabel={true}
      // showLastLabel={true}
      // type={master[MetricInfoKeyMap[metric_type]][metric_id].log_default && ["absolute"].includes(selectedScale) ? "logarithmic" : "linear"}
      gridLineWidth={1}
      gridLineColor={"#5A6462A7"}
      // gridLineDashStyle={"ShortDot"}
      gridZIndex={10}
      // min={metric_id === "profit" || (master[MetricInfoKeyMap[metric_type]][metric_id].log_default && ["absolute"].includes(selectedScale)) ? null : 0}
      // max={selectedScale === "percentage" ? 100 : undefined}
      showFirstLabel={true}
      showLastLabel={true}
      tickAmount={5}
      zoomEnabled={false}
      plotLines={[
        {
          value: 0,
          color: "#CDD8D3A7",
          className: "highcharts-zero-line",
          // width: 2,
        }
      ]}
      labels={{
        // y: 5,
        // x: 0,
        distance: 9,
        // justify: false,
        align: "right",
        // overflow: "justify",
        // allowOverlap: true,
        useHTML: true,
        style: {
          whiteSpace: "nowrap",
          textAlign: "right",
          color: "rgb(215, 223, 222)",
          fontSize: "10px",
          fontWeight: "700",
          fontFamily: "Fira Sans",
        },
        formatter: function (t: AxisLabelsFormatterContextObject) {
          return formatNumber(t.value, true);
        },
      }}
    >
      {props.children}
    </YAxis>
  )
}
type TooltipProps = Partial<Highcharts.TooltipOptions>;

const GTPChartTooltip = ({props, metric_id} : {props?: TooltipProps, metric_id: string}) => {
  const {data: master, AllChainsByKeys} = useMaster();
  const { selectedScale } = useChartScale();
  const {metricsDef} = useMetrics();
  const [showUsd] = useLocalStorage("showUsd", true);
  const [showGwei] = useLocalStorage("showGwei", false);
  
  const valuePrefix = Object.keys(metricsDef[metric_id].units).includes("usd") ? showUsd ? metricsDef[metric_id].units.usd.prefix : metricsDef[metric_id].units.eth.prefix : Object.values(metricsDef[metric_id].units)[0].prefix;

  const tooltipFormatter = useCallback(
  
    function (this: any) {
   
      const { x, points }: { x: number; points: any[] } = this;
      points.sort((a: any, b: any) => {
        // if (reversePerformer) return a.y - b.y;
        return b.y - a.y;
      });
  
      const showOthers = points.length > 10 && metric_id !== "txcosts";
  
      const date = new Date(x);
      const dateString = date.toLocaleDateString("en-GB", {
        timeZone: "UTC",
        month: "short",
        // day: selectedTimeInterval === "daily" ? "numeric" : undefined,
        day: "numeric",
        year: "numeric",
      });
  
      const pointsSum = points.reduce((acc: number, point: any) => acc + point.y, 0);
      
      const maxPoint = points.reduce((max: number, point: any) => 
        Math.max(max, point.y), 0);
  
      const maxPercentage = points.reduce((max: number, point: any) => 
        Math.max(max, point.percentage), 0);
  
      if (!master) return;
  
      const units = metricsDef[metric_id].units;
      const unitKeys = Object.keys(units);
      const unitKey = unitKeys.find((unit) => unit !== "usd" && unit !== "eth") ||
        (showUsd ? "usd" : "eth");
  
      let prefix = metricsDef[metric_id].units[unitKey].prefix || "";
      let suffix = metricsDef[metric_id].units[unitKey].suffix || "";
  
      const decimals = !showUsd && showGwei
        ? 2
        : metricsDef[metric_id].units[unitKey].decimals_tooltip;
  
      if (!showUsd && metricsDef[metric_id].units[unitKey].currency && showGwei) {
        prefix = "";
        suffix = " Gwei";
      }
  
      if (metric_id === "throughput") {
        suffix = " Mgas/s";
      }
  
      // Generate a cache key based on relevant data
      // const cacheKey = createSafeCacheKey(
      //   points,
      //   maxPoint,
      //   maxPercentage,
      //   metric_id,
      //   prefix,
      //   suffix,
      //   decimals,
      //   selectedScale,
      //   showOthers
      // );
  
  
      // Check cache first
      // if (tooltipCache.has(cacheKey)) {
      //   return tooltipCache.get(cacheKey);
      // }
  
      // // If no worker exists, create one
      // if (!tooltipWorker) {
      //   tooltipWorker = new Worker(new URL('./tooltipWorker.ts', import.meta.url));
      // }
  
      // Process the points directly in the main thread as fallback
      const processPointsInMainThread = () => {
        const firstTenPoints = points.slice(0, 10);
        const afterTenPoints = points.slice(10);
  
        let tooltipPoints = (showOthers ? firstTenPoints : points)
          .map((point: any) => {
            const { series, y, percentage } = point;
            const { name } = series;
  
            if (selectedScale === "percentage") {
              return `
                <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
                  <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${AllChainsByKeys[name].colors.dark[0]}"></div>
                  <div class="tooltip-point-name text-xs">${AllChainsByKeys[name].label}</div>
                  <div class="flex-1 text-right numbers-xs">${percentage.toFixed(2)}%</div>
                </div>
                <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
                  <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
                  <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
                  style="width: ${(percentage / maxPercentage) * 100}%; background-color: ${AllChainsByKeys[name].colors.dark[0]}99;"></div>
                </div>`;
            }
  
            const value = y;
            const formattedValue = metric_id === "fdv" || metric_id === "market_cap"
              ? shortenNumber(value)
              : value.toLocaleString("en-GB", {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                });
  
            return `
              <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${AllChainsByKeys[name].colors.dark[0]}"></div>
                <div class="tooltip-point-name text-xs">${AllChainsByKeys[name].label}</div>
                <div class="flex-1 text-right justify-end numbers-xs flex">
                  <div class="${!prefix && "hidden"}">${prefix}</div>
                  ${formattedValue}
                  <div class="ml-0.5 ${!suffix && "hidden"}">${suffix}</div>
                </div>
              </div>
              <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
                style="width: ${(Math.max(0, value) / maxPoint) * 100}%; background-color: ${AllChainsByKeys[name].colors.dark[0]}99;"></div>
              </div>`;
          })
          .join("");
  
        if (showOthers && afterTenPoints.length > 0) {
          const restSum = afterTenPoints.reduce((acc: number, point: any) => acc + point.y, 0);
          const restPercentage = afterTenPoints.reduce((acc: number, point: any) => acc + point.percentage, 0);
  
          if (selectedScale === "percentage") {
            tooltipPoints += `
              <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: #E0E7E6"></div>
                <div class="tooltip-point-name text-xs">${afterTenPoints.length > 1 ? `${afterTenPoints.length} Others` : "1 Other"}</div>
                <div class="flex-1 text-right numbers-xs">${restPercentage.toFixed(2)}%</div>
              </div>
              <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
                style="width: ${(restPercentage / maxPercentage) * 100}%; background-color: #E0E7E699;"></div>
              </div>`;
          } else {
            tooltipPoints += `
              <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: #E0E7E6"></div>
                <div class="tooltip-point-name text-xs">${afterTenPoints.length > 1 ? `${afterTenPoints.length} Others` : "1 Other"}</div>
                <div class="flex-1 text-right justify-end numbers-xs flex">
                  <div class="${!prefix && "hidden"}">${prefix}</div>
                  ${metric_id === "fdv" || metric_id === "market_cap"
                    ? shortenNumber(restSum)
                    : restSum.toLocaleString("en-GB", {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals,
                      })}
                  <div class="ml-0.5 ${!suffix && "hidden"}">${suffix}</div>
                </div>
              </div>
              <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
                style="width: ${(restSum / maxPoint) * 100}%; background-color: #E0E7E699;"></div>
              </div>`;
          }
        }
  
        return tooltipPoints;
      };
  
      const tooltipPoints = processPointsInMainThread();
      
      const tooltip = `<div class="mt-3 mr-3 mb-3 w-52 md:w-60 text-xs font-raleway">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2">${dateString}</div>`;
      
      const sumRow = selectedScale === "stacked"
        ? `<div class="flex w-full space-x-2 items-center font-medium mt-1.5 mb-0.5">
            <div class="w-4 h-1.5 rounded-r-full"></div>
            <div class="tooltip-point-name text-xs">Total</div>
            <div class="flex-1 text-right justify-end numbers-xs flex">
              <div class="${!prefix && "hidden"}">${prefix}</div>
              ${pointsSum.toLocaleString("en-GB", {
                minimumFractionDigits: valuePrefix ? 2 : 0,
                maximumFractionDigits: valuePrefix ? 2 : metric_id === "throughput" ? 2 : 0,
              })}
              <div class="ml-0.5 ${!suffix && "hidden"}">${suffix}</div>
            </div>
          </div>
          <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
            <div class="h-[2px] rounded-none absolute right-0 -top-[3px] w-full bg-white/0"></div>
          </div>`
        : "";
  
      const result = tooltip + tooltipPoints + sumRow + "</div>";
      // tooltipCache.set(cacheKey, result);
      

      return result;
    },
    [metric_id, master, metricsDef, showUsd, showGwei, selectedScale, valuePrefix, AllChainsByKeys]
  );

  return (
    <HighchartsTooltip
      {...props}
      formatter={tooltipFormatter}
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
      valuePrefix={"$"}
      valueSuffix={""}
    />
  );
}


export const GTPChart = ({ children, providerProps, highchartsChartProps, chartProps }: { children?: ReactNode , providerProps?: HighchartsProviderProps, highchartsChartProps?: HighchartsChartProps, chartProps?: ChartProps }) => {
  const [containerRef, { width, height }] = useElementSizeObserver();
  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);

  return (
    <HighchartsProvider 
      {...providerProps}
      Highcharts={Highcharts}
    >
      <HighchartsChart
        {...highchartsChartProps}
        {...baseOptions.chart}
        containerProps={{
          style: {
            overflow: "visible",
          }
        }}
        
      >
          <Chart
              {...chartProps}
              {...baseOptions.chart}
              // width={width}
              // height={height}
              // className="zoom-chart" zoom not working
              marginTop={5}
              marginBottom={37}
              marginRight={5}
              marginLeft={60}
              
              zooming={{
                mouseWheel: {
                  enabled: false,
                },
              }}
              
              options={{
                
                chartComponent: chartComponent.current,
              }}
            />
        {children}
      </HighchartsChart>
    </HighchartsProvider>
  )
}