"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
  memo,
} from "react";
import Highcharts, {
  AxisLabelsFormatterContextObject,
} from "highcharts/highstock";
import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsPatternFill from "highcharts/modules/pattern-fill";
import highchartsRoundedCorners from "highcharts-rounded-corners";
import addHighchartsMore from "highcharts/highcharts-more";
import { useLocalStorage } from "usehooks-ts";
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
import { useHighchartsWrappers, useUIContext } from "@/contexts/UIContext";
import { useMaster } from "@/contexts/MasterContext";
import { min, times } from "lodash";
import "@/app/highcharts.axis.css";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import { format as d3Format } from "d3"
import EmbedContainer from "@/app/(embeds)/embed/EmbedContainer";
import ChartWatermark from "@/components/layout/ChartWatermark";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import { baseOptions, tooltipFormatter } from "@/lib/chartUtils";
import { useTimespan } from "../_contexts/TimespanContext";
import { useChartScale } from "../_contexts/ChartScaleContext";
import { useMetrics } from "../_contexts/MetricsContext";
import { useApplicationDetailsData } from "../_contexts/ApplicationDetailsDataContext";
import dayjs from "@/lib/dayjs";
import { useChartSync } from "../_contexts/GTPChartSyncContext";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};



type SeriesData = {
  name: string;
  data: number[][]; // [timestamp, value]
}


export const ApplicationDetailsChart = memo(({ seriesData, seriesTypes,  metric, prefix, suffix, decimals}: { seriesData: SeriesData[], seriesTypes: string[], metric: string, prefix: string, suffix: string, decimals: number }) => {
  const { selectedScale, selectedYAxisScale } = useChartScale();
  const { data } = useApplicationDetailsData();
  const { metricsDef } = useMetrics();
  const [showUsd] = useLocalStorage("showUsd", true);
  const [showGwei] = useLocalStorage("showGwei", false);
  const { selectedTimespan, timespans } = useTimespan();
  const { registerChart, unregisterChart, hoveredSeriesName, selectedSeriesName } = useChartSync();
  const chartRef = useRef<Highcharts.Chart | null>(null);

  useHighchartsWrappers();

  
  // const metricData = data.metrics[metric] as MetricData;
  
  // const chainsData = Object.entries(metricData.aggregated.data);
  // const maxUnix = Math.max(...Object.values(metricData.over_time).map((chainData) => chainData.daily.data[chainData.daily.data.length - 1][0]));
  const { minUnix, maxUnix } = useMemo(() => {
    const nonEmpty = seriesData.filter((series) => series.data.length > 0);
    return {
      minUnix: nonEmpty.length > 0 ? Math.min(...nonEmpty.map((series) => series.data[0][0])) : 0,
      maxUnix: nonEmpty.length > 0 ? Math.max(...nonEmpty.map((series) => series.data[series.data.length - 1][0])) : 0,
    };
  }, [seriesData]);
  
  // Calculate the visible range based on selectedTimespan
  const visibleRange = useMemo(() => {
    const end = maxUnix;
    const start = timespans[selectedTimespan].value > 0 
      ? end - (timespans[selectedTimespan].value * 24 * 3600 * 1000)
      : minUnix;
    return { start, end };
  }, [maxUnix, minUnix, selectedTimespan, timespans]);
  
  const formatNumber = useCallback((value: number | string, options: {
    isAxis: boolean;
    // prefix: string;
    // suffix: string
    // seriesTypes: string[];
    selectedScale: string;
  }) => {
    const { isAxis, selectedScale } = options;
    // let prefix = valuePrefix;
    // let suffix = "";
    let val = parseFloat(value as string);
    const metricDef = metricsDef[metric];
    const units = metricDef.units;
    const unitKeys = Object.keys(units);
    const unitKey =
      unitKeys.find((unit) => unit !== "usd" && unit !== "eth") ||
      (showUsd ? "usd" : "eth");

    let prefix = metricDef.units[unitKey].prefix
      ? metricDef.units[unitKey].prefix
      : "";
    let suffix = metricDef.units[unitKey].suffix
      ? metricDef.units[unitKey].suffix
      : "";

    if (
      !showUsd &&
      seriesTypes.includes("eth") &&
      selectedScale !== "percentage"
    ) {
      if (showGwei) {
        prefix = "";
        suffix = " Gwei";
      }
    }

    let number = d3Format(`.2~s`)(val).replace(/G/, "B");

    let absVal = Math.abs(val);

    // let formatStringPrefix = units[unitKey].currency ? "." : "~."

    if (isAxis) {
      if (selectedScale === "percentage") {
        number = d3Format(".2~s")(val).replace(/G/, "B") + "%";
      } else {
        if (prefix || suffix) {
          // for small USD amounts, show 2 decimals
          if (absVal === 0) number = "0";
          else if (absVal < 0.1) number = val.toFixed(3);
          else if (absVal < 1) number = val.toFixed(2);
          else if (absVal < 10)
            number = units[unitKey].currency ? val.toFixed(2) :
              d3Format(`.2~s`)(val).replace(/G/, "B");  // Changed from .3~s
          else if (absVal < 100)
            number = units[unitKey].currency ? d3Format(`~s`)(val).replace(/G/, "B") :
              d3Format(`.2~s`)(val).replace(/G/, "B");  // Changed from .4~s
          else
            number = units[unitKey].currency ? d3Format(`~s`)(val).replace(/G/, "B") :
              d3Format(`~s`)(val).replace(/G/, "B");     // Changed from .2~s
        } else {
          if (absVal === 0) number = "0";
          else if (absVal < 1) number = val.toFixed(2);
          else if (absVal < 10)
            number = d3Format(`.2~s`)(val).replace(/G/, "B");
          else number = d3Format(`~s`)(val).replace(/G/, "B");
        }
        // for negative values, add a minus sign before the prefix
        number = `${prefix}${number} ${suffix}`.replace(`${prefix}-`, `\u2212${prefix}`);
      }
    }

    return number;
  }, [metricsDef, metric, showUsd, seriesTypes, showGwei]);

  
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

  const { data: master, AllChainsByKeys } = useMaster();
  
  const MetadataByKeys = useMemo(() => {
    if (!master) return {};
    return master.chains;
  }, [master]);

  const getSeriesType = useCallback(
    (name: string) => {
      // if (name === "ethereum") {
      //   // show column chart for ethereum if monthly and stacked
      //   if (selectedScale === "stacked")
      //     return "column";
      //   // else show area
      //   return "area";
      // }
      if (selectedScale === "percentage") return "area";
      if (selectedScale === "stacked")
        return "area";

      return "line";
    },
    [selectedScale,],
  );

  const getSeriesData = useCallback(
    (name: string) => {
      if (name === "")
        return {
          // data: [],
          zoneAxis: undefined,
          zones: undefined,
          fillColor: undefined,
          fillOpacity: undefined,
          color: undefined,
        };

      const timeIndex = 0;
      let valueIndex = 1;
      let valueMulitplier = 1;

      let zones: any[] | undefined = undefined;
      let zoneAxis: string | undefined = undefined;

      const isLineChart = getSeriesType(name) === "line";
      //@ts-ignore
      const isColumnChart = getSeriesType(name) === "column";

      const isAreaChart = getSeriesType(name) === "area";

      let fillOpacity = undefined;

      let seriesFill = "transparent";

      if (isAreaChart) {
        seriesFill = MetadataByKeys[name]?.colors.dark[0] + "33";
      }

      if (isAreaChart) {
        seriesFill = MetadataByKeys[name]?.colors.dark[0] + "33";
      }

      let fillColor = MetadataByKeys[name]?.colors.dark[0];
      let color =MetadataByKeys[name]?.colors.dark[0];

      // if (types.includes("usd")) {
      //   if (showUsd) {
      //     valueIndex = types.indexOf("usd");
      //   } else {
      //     valueIndex = types.indexOf("eth");
      //     if (showGwei) valueMulitplier = 1000000000;
      //   }
      // }

      // const seriesData = data.map((d) => {
      //   return [d[timeIndex], d[valueIndex] * valueMulitplier];
      // });

      let marker = {
        lineColor: MetadataByKeys[name].colors.dark[0],
        radius: 0,
        symbol: "circle",
      }

      // if (selectedTimeInterval === "daily") {
      return {
        // data: seriesData,
        zoneAxis,
        zones,
        fillColor: seriesFill,
        fillOpacity,
        color,
        marker,
      };
      // }
    },
    [getSeriesType, MetadataByKeys],
  );

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });
    // addHighchartsMore(Highcharts);
    // highchartsRoundedCorners(Highcharts); !!-- causing error on server side --!!
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

  // 

  // Register chart with sync provider on load
  const onChartLoad = useCallback(function(this: Highcharts.Chart) {
    chartRef.current = this;

    // Manually add the className since react-jsx-highcharts doesn't pass it through
    if (this.container && !this.container.className.includes('shared-crosshair-app-details')) {
      this.container.className = `${this.container.className} shared-crosshair-app-details shared-hover-app-details`.trim();
    }

    registerChart(this);
  }, [registerChart]);

  // Cleanup on unmount - ONLY run on actual unmount, not when unregisterChart ref changes
  useEffect(() => {
    return () => {
      unregisterChart();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GTPChart
      highchartsChartProps={{
        chart: {
          height: 168,
          events: {
            load: onChartLoad,
          },
        },
        plotOptions: {
          ...plotOptions,
        },
        containerProps: {
          className: "shared-crosshair-app-details shared-hover-app-details",
        }
      }}
      chartProps={{
        time: {
          timezone: "UTC",
          useUTC: true,
        },
        marginLeft: 40,
        marginBottom: 30,
        type: "area",
      }} 
    >
      <GTPChartTooltip metric_id={metric} />
      <GTPXAxis
        minDataUnix={minUnix}
        maxDataUnix={maxUnix}
        min={visibleRange.start}
        max={visibleRange.end}
        ordinal={false}
        startOnTick={false}
        endOnTick={false}
      />
      <GTPYAxis
        type={selectedYAxisScale === "logarithmic" && selectedScale === "absolute" ? "logarithmic" : "linear"}
        labels={{
          distance: 9,
          align: "right",
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
            return formatNumber(t.value, {
              isAxis: true,
              selectedScale: selectedScale,
            });
          },
        }}
        tickAmount={3}
      >
        {seriesData.map((series, i) => {
          const pointsSettings = {
            pointPlacement: 0.5,
          };

          const isVisible = !selectedSeriesName || series.name === selectedSeriesName;

          return (
            <AreaSeries
              key={i}
              connectNulls={true}
              connectEnds={true}
              name={series.name}
              data={series.data}
              zoneAxis={getSeriesData(series.name).zoneAxis}
              zones={getSeriesData(series.name).zones}
              pointPlacement={pointsSettings.pointPlacement}
              type={getSeriesType(series.name)}
              clip={true}
              dataGrouping={{}}
              fillOpacity={getSeriesData(series.name).fillOpacity}
              fillColor={getSeriesData(series.name).fillColor}
              color={getSeriesData(series.name).color}
              borderColor={["area", "line"].includes(getSeriesType(series.name)) && selectedScale !== "stacked" ? MetadataByKeys[series.name]?.colors.dark[0] : undefined}
              borderWidth={1}
              lineWidth={2}
              marker={getSeriesData(series.name).marker}
              visible={isVisible}
              states={{
                hover: {
                  enabled: true,
                  halo: {
                    size: 5,
                    opacity: 1,
                    attributes: {
                      fill: MetadataByKeys[series.name]?.colors.dark[0] + "99",
                      stroke: MetadataByKeys[series.name]?.colors.dark[0] + "66",
                      "stroke-width": 0,
                    },
                  },
                  brightness: 0.3,
                },
                inactive: {
                  enabled: true,
                  opacity: 0.6,
                },
                select: {
                  enabled: false,
                },
              }}
              shadow={["area", "line"].includes(getSeriesType(series.name)) && selectedScale !== "stacked" ? 
                {
                  color: MetadataByKeys[series.name]?.colors.dark[1] + "FF",
                  width: 7,
                } : 
                undefined 
              }
            />
          )
        })}
      </GTPYAxis>
    </GTPChart>
  )
});

ApplicationDetailsChart.displayName = "ApplicationDetailsChart";

type ExtraAxisProps = {
  minDataUnix?: number;
  maxDataUnix?: number;
}

type AxisProps<TAxisOptions> = {
  children?: ReactNode;
  onAfterBreaks?: Highcharts.AxisEventCallbackFunction;
  onAfterSetExtremes?: Highcharts.AxisSetExtremesEventCallbackFunction;
  onPointBreak?: Highcharts.AxisPointBreakEventCallbackFunction;
  onPointInBreak?: Highcharts.AxisPointBreakEventCallbackFunction;
  onSetExtremes?: Highcharts.AxisSetExtremesEventCallbackFunction;
} & Partial<TAxisOptions> & ExtraAxisProps;

const GTPXAxis = (props: AxisProps<Highcharts.XAxisOptions>) => {
  const { timespans, selectedTimespan} = useTimespan();

  const [zoomed, setZoomed] = useState(false);
  const [zoomMin, setZoomMin] = useState<number | undefined>(undefined);
  const [zoomMax, setZoomMax] = useState<number | undefined>(undefined);

  // start of yesterday in UTC is the last data point we have
  const startOfYesterdayUTC = new Date(new Date().setUTCHours(0, 0, 0, 0) - 24 * 3600 * 1000).getTime();
  
  // Data min/max - the full range of available data
  const dataMax = props.maxDataUnix || startOfYesterdayUTC;
  const dataMin = props.minDataUnix || (timespans[selectedTimespan].value > 0 ? startOfYesterdayUTC - timespans[selectedTimespan].value * 24 * 3600 * 1000 : undefined);
  
  // Visible min/max - what's actually shown on the chart
  const visibleMax = props.max || dataMax;
  const visibleMin = props.min || dataMin;
  
  // For X axis min/max props - use the data range
  const xMax = dataMax;
  const xMin = dataMin;

  const onXAxisSetExtremes =
    useCallback<Highcharts.AxisSetExtremesEventCallbackFunction>(
      function (e) {
        if (e.trigger === "pan") return;
        const { min, max } = e;
        const numDays = (max - min) / (24 * 60 * 60 * 1000);

        if (
          e.trigger === "zoom" ||
          e.trigger === "navigator" ||
          e.trigger === "rangeSelectorButton"
        ) {
          if (min === xMin && max === xMax) {
            setZoomed(false);
          } else {
            setZoomed(true);
          }
          setZoomMin(min);
          setZoomMax(max);
        }
      },
      [xMax, xMin],
    );

  // This function calculates the appropriate tick interval based on the time range
  function calculateTickInterval(rangeInDays: number): number {
    // Define time constants in milliseconds for better readability
    const HOUR_MS = 3600 * 1000;
    const DAY_MS = 24 * HOUR_MS;
    const WEEK_MS = 7 * DAY_MS;
    const MONTH_MS = 30 * DAY_MS;  // Approximating month as 30 days
  
    // Select appropriate interval based on the date range
    if (rangeInDays <= 1) {
      return 12 * HOUR_MS;       // 12 hours for ranges up to 1 day
    } else if (rangeInDays <= 7) {
      return DAY_MS;             // 1 day for ranges up to 1 week
    } else if (rangeInDays <= 30) {
      return WEEK_MS;            // 1 week for ranges up to 1 month
    } else if (rangeInDays <= 90) {
      return MONTH_MS;           // 1 month for ranges up to 3 months
    } else if (rangeInDays <= 365) {
      return 2 * MONTH_MS;       // 2 months for ranges up to 1 year
    } else if (rangeInDays <= 730) {
      return 3 * MONTH_MS;       // 3 months for ranges up to 2 years
    } else if (rangeInDays <= 1460) {
      return 6 * MONTH_MS;       // 3 months for ranges up to 2 years
    } else {
      return 12 * MONTH_MS;       // 6 months for ranges beyond 2 years
    }
  }
  
  // Get effective min and max timestamps for calculations - USE VISIBLE RANGE
  const effectiveMin = zoomed && zoomMin !== undefined ? zoomMin : (visibleMin || 0);
  const effectiveMax = zoomed && zoomMax !== undefined ? zoomMax : (visibleMax || Date.now());
  
  // Calculate range in days based on the VISIBLE range, not the data range
  const rangeInMilliseconds = effectiveMax - effectiveMin;
  const rangeInDays = rangeInMilliseconds / (24 * 3600 * 1000);
  
  // Determine appropriate tick interval
  const computedTickInterval = calculateTickInterval(rangeInDays);
  
  return (
    <XAxis
      title={undefined}
      events={{
        afterSetExtremes: onXAxisSetExtremes,
      }}
      type="datetime"
      // ordinal={false}
      // startOnTick={false}
      // endOnTick={false}
      labels={{
        align: undefined,
        rotation: 0,
        allowOverlap: false,
        reserveSpace: true,
        overflow: "justify",
        useHTML: true,
        formatter: function (this: AxisLabelsFormatterContextObject) {
          if (effectiveMax - effectiveMin <= 40 * 24 * 3600 * 1000) {
            return new Date(this.value).toLocaleDateString("en-GB", {
              timeZone: "UTC",
              month: "short",
              day: "numeric",
              year: this.isFirst ? "numeric" : undefined,
            });
          }
          else {
            // if Jan 1st, show year
            if (new Date(this.value).getUTCMonth() === 0 && new Date(this.value).getUTCDate() === 1) {
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
        snap: true,
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
      tickInterval={computedTickInterval}
      minPadding={0}
      maxPadding={0}
      min={xMin}
      max={xMax}
      {...props}
    />
  )
}

const GTPYAxis = (props: AxisProps<Highcharts.YAxisOptions>) => {
  return (
    <YAxis
      
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
        // formatter: function (t: AxisLabelsFormatterContextObject) {
        //   return formatNumber(t.value, true);
        // },
      }}
      {...props}
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
  const isMobile = useUIContext((state) => state.isMobile);
  
  const valuePrefix = Object.keys(metricsDef[metric_id].units).includes("usd") ? showUsd ? metricsDef[metric_id].units.usd.prefix : metricsDef[metric_id].units.eth.prefix : Object.values(metricsDef[metric_id].units)[0].prefix;
  const tooltipPositioner =
  useCallback<Highcharts.TooltipPositionerCallbackFunction>(

    function (this, width, height, point) {
      const chart = this.chart;
      const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
      const tooltipWidth = width;
      const tooltipHeight = height;

      const distance = 20;

      // Use actual mouse position for smooth horizontal movement
      // Fall back to point position if mouse position not available
      let mouseX = point.plotX + plotLeft;
      if (chart.pointer && chart.pointer['lastEvent']) {
        mouseX = chart.pointer['lastEvent'].chartX;
      }

      let tooltipX =
        mouseX - distance - tooltipWidth < plotLeft
          ? mouseX + distance
          : mouseX - tooltipWidth - distance;

      const tooltipY = 10;

      if (isMobile) {
        if (tooltipX + tooltipWidth > plotLeft + plotWidth) {
          tooltipX = plotLeft + plotWidth - tooltipWidth;
        }
        return {
          x: tooltipX,
          y: 10,
        };
      }

      return {
        x: tooltipX,
        y: tooltipY,
      };
    },
    [isMobile],
  );
  const tooltipFormatter = useCallback(
  
    function (this: any) {
      const { x, points }: { x: number; points: any[] } = this;
      points.sort((a: any, b: any) => {
        // if (reversePerformer) return a.y - b.y;
        return b.y - a.y;
      });
  
      const showOthers = points.length > 10 && metric_id !== "txcosts";
  
      const dateString = dayjs.utc(x).utc().locale("en-GB").format("DD MMM YYYY");
  
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
                  <div class="flex-1 text-right numbers-xs">${percentage ? percentage.toFixed(2) : 0}%</div>
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
      
      const tooltip = `<div class="mt-3 mr-3 mb-3 min-w-52 md:min-w-60 text-xs font-raleway">
        <div class="flex justify-between items-center font-bold text-[13px] md:text-[1rem] ml-6 mb-2"><div>${dateString}</div><div class="text-xs">${metricsDef[metric_id].name}</div></div>`;
      
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
      positioner={tooltipPositioner}
      useHTML={true}
      shared={true}
      split={false}
      followPointer={true}
      followTouchMove={true}
      backgroundColor={"rgb(var(--bg-default) / 0.95)"}
      padding={0}
      hideDelay={300}
      stickOnContact={true}
      shape="rect"
      borderRadius={17}
      borderWidth={0}
      outside={true}
      shadow={{
        color: "rgb(var(--ui-shadow))",
        opacity: 0.3,
        offsetX: 0,
        offsetY: 0,
      }}
      style={{
        color: "rgb(var(--text-primary))",
      }}
      valuePrefix={"$"}
      valueSuffix={""}
    />
  );
}

// Cache for shared group names
const chartGroupCache = new Map();
  
function getCachedGroupName(chart, className) {
  if (!chart) return null;
  const chartId = chart.container.id;
  if (!chartGroupCache.has(chartId)) {
    chartGroupCache.set(chartId, getSharedChartGroupName(chart, className));
  }
  return chartGroupCache.get(chartId);
}

// Throttle function to improve performance
function throttle(func, limit = 16) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  };
}

// Use a throttled handler for mousemove
const handleMouseMove = throttle(function(e) {
  if (!(e instanceof MouseEvent || e instanceof TouchEvent)) return;

  const target = e.target as HTMLElement;
  const chartContainer = target.closest(".highcharts-container");
  if (!chartContainer) return;

  const thisChartId = chartContainer.id;

  // Find the current chart
  const sourceChart = Highcharts.charts.find(chart =>
    chart && chart.container.id === thisChartId);

  if (!sourceChart) return;

  // Get normalized position in the chart
  const event = sourceChart.pointer.normalize(e);
  const sourceX = event.chartX;
  const sourceY = event.chartY; // Store actual mouse Y position
  const sourceGroupName = getCachedGroupName(sourceChart, SHARE_CROSSHAIR_CLASS);
  const hoveredSourcePoint = sourceChart.pointer.findNearestKDPoint(sourceChart.series, true, event);
  const hoveredSourcePointX = hoveredSourcePoint ? hoveredSourcePoint.x : null;

  if (!sourceGroupName) return;

  // Calculate the relative Y position within the source chart's plot area (0 to 1)
  const sourceRelativeY = (sourceY - sourceChart.plotTop) / sourceChart.plotHeight;

  // Update all charts in the same group
  Highcharts.charts.forEach(chart => {
    if (!chart || !chart.xAxis || !chart.xAxis[0]) return;

    const targetGroupName = getCachedGroupName(chart, SHARE_CROSSHAIR_CLASS);
    if (targetGroupName !== sourceGroupName) return;

    // Convert to x-axis value in source chart
    const xValue = sourceChart.xAxis[0].toValue(sourceX);

    // Find the corresponding x position in target chart
    const targetX = chart.xAxis[0].toPixels(xValue);

    // Calculate the Y position in this chart based on the relative position from source chart
    const targetY = chart.plotTop + (sourceRelativeY * chart.plotHeight);

    // Create a simulated event at this position
    const fakeEvent = {
      chartX: targetX,
      chartY: targetY,
      target: chart.container
    } as any;

    // Store the mouse event in the chart's pointer so tooltipPositioner can access it
    if (chart.pointer) {
      chart.pointer['lastEvent'] = fakeEvent;
    }

    // First, clear all point states in this chart
    if (chart.series && Array.isArray(chart.series)) {
      chart.series.forEach(series => {
        if (series && series.points && Array.isArray(series.points)) {
          series.points.forEach(point => {
            if (point && point['state'] === 'hover') {
              point.setState('');
            }
          });
        }
      });
    }

    // Find points near this position in target chart
    const points: Highcharts.Point[] = [];
    if (chart.series && Array.isArray(chart.series)) {
      chart.series.forEach(series => {
        if (series && series.visible && series.points && hoveredSourcePointX !== null) {
          const point = series.points.find(p => p && p.x === hoveredSourcePointX);
          if (point !== undefined) points.push(point);
        }
      });
    }

    // Highlight the points if found
    if (points.length > 0) {
      // Set points to hover state
      points.forEach(p => {
        if (p) {
          p.setState('hover');
        }
      });

      // Refresh tooltip and crosshair
      if (chart.tooltip && chart.tooltip.refresh) {
        try {
          // Temporarily disable hideDelay to prevent tooltip from hiding
          const originalHideDelay = chart.tooltip.options.hideDelay;
          if (chart.tooltip.options) {
            chart.tooltip.options.hideDelay = 0;
          }

          // Refresh the tooltip
          chart.tooltip.refresh(points.length > 1 ? points : points[0]);

          // Restore original hideDelay
          if (chart.tooltip.options) {
            chart.tooltip.options.hideDelay = originalHideDelay;
          }
        } catch (e) {
          // Silently catch tooltip errors
        }
      }
      if (chart.xAxis[0] && chart.xAxis[0].crosshair) {
        try {
          chart.xAxis[0].drawCrosshair(fakeEvent, points[0]);
        } catch (e) {
          // Silently catch crosshair errors
        }
      }
    }
  });
}, 16); // ~60fps throttle

// Handle mouseout events
const handleMouseOut = function(e) {
  if (!(e instanceof MouseEvent || e instanceof TouchEvent)) return;

  const target = e.target as HTMLElement;
  const chartContainer = target.closest(".highcharts-container");

  // Only hide tooltips if we're actually leaving the chart group
  if (!chartContainer) {
    Highcharts.charts.forEach(function(chart) {
      if (!chart) return;
      const groupName = getCachedGroupName(chart, SHARE_CROSSHAIR_CLASS);
      if (!groupName) return;

      // Reset point states - check if series exists first
      if (chart.series && Array.isArray(chart.series)) {
        chart.series.forEach(series => {
          if (series && series.points && Array.isArray(series.points)) {
            series.points.forEach(point => {
              if (point && point.series.chart.hoverSeries?.name !== point.series.name) {
                point.setState('');
              }
            });
          }
        });
      }

      if (chart.tooltip) {
        chart.tooltip.hide();
      }
      if (chart.xAxis && chart.xAxis[0]) {
        chart.xAxis[0].hideCrosshair();
      }
    });
  }
};

// shared crosshair class names are like shared-crosshair-1, shared-crosshair-2, etc. to group charts together for shared interactions
const SHARE_CROSSHAIR_CLASS = "shared-crosshair";

const getSharedChartGroupName = (chart: Highcharts.Chart, SHARE_CROSSHAIR_CLASS: string) => {
  const classList =  chart.container.className?.split(" ");
  const sharedGroupName = classList.find((className) => className.startsWith(SHARE_CROSSHAIR_CLASS));
  if(sharedGroupName) {
    // get last part of the class name
    return sharedGroupName.split("-").pop();
  }
  return null;
}


export const GTPChart = ({ children, providerProps, highchartsChartProps, chartProps }: { children?: ReactNode , providerProps?: HighchartsProviderProps, highchartsChartProps?: HighchartsChartProps, chartProps?: ChartProps }) => {
  const [containerRef, { width, height }] = useElementSizeObserver();
  // const { onChartCreated, onChartDestroyed } = useGTPChartSyncProvider();
  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);

  const finalClassName = `${highchartsChartProps?.containerProps?.className || ''}`.trim();

  useEffect(() => {
    highchartsRoundedCorners(Highcharts);

    // Override the reset function to maintain tooltip and crosshair visibility during synchronization
    const originalReset = Highcharts.Pointer.prototype.reset;
    Highcharts.Pointer.prototype.reset = function () {
      // Don't reset if we're hovering over a chart in the same group
      const chart = this.chart;
      const groupName = getCachedGroupName(chart, SHARE_CROSSHAIR_CLASS);
      if (groupName) {
        // Check if mouse is still over any chart in the group
        const isOverGroupChart = Highcharts.charts.some(c => {
          if (!c) return false;
          const cGroupName = getCachedGroupName(c, SHARE_CROSSHAIR_CLASS);
          if (cGroupName !== groupName) return false;
          const container = c.container;
          return container && container.matches(':hover');
        });
        if (isOverGroupChart) {
          return undefined;
        }
      }
      return originalReset.apply(this, arguments as any);
    };

    // Override tooltip hide to prevent hiding during synchronization
    const originalTooltipHide = Highcharts.Tooltip.prototype.hide;
    Highcharts.Tooltip.prototype.hide = function(delay) {
      const chart = this.chart;
      const groupName = getCachedGroupName(chart, SHARE_CROSSHAIR_CLASS);

      if (groupName) {
        // Check if mouse is still over any chart in the group
        const isOverGroupChart = Highcharts.charts.some(c => {
          if (!c) return false;
          const cGroupName = getCachedGroupName(c, SHARE_CROSSHAIR_CLASS);
          if (cGroupName !== groupName) return false;
          const container = c.container;
          return container && container.matches(':hover');
        });

        // Don't hide if mouse is still over a chart in the group
        if (isOverGroupChart) {
          return;
        }
      }

      return originalTooltipHide.call(this, delay);
    };

    // Handle mouse/touch events for synchronized charts
    ['mousemove', 'touchmove', 'touchstart'].forEach(function (eventType) {
      document.addEventListener(eventType, handleMouseMove);
    });

    ['mouseout', 'touchend'].forEach(function (eventType) {
      document.addEventListener(eventType, handleMouseOut);
    });

    // Synchronize extremes (zooming) within shared groups
    function syncExtremes(e: Highcharts.AxisSetExtremesEventObject) {
      const thisChart = this.chart;
      const sharedGroupName = getSharedChartGroupName(thisChart, SHARE_CROSSHAIR_CLASS);
      
      if (!sharedGroupName || e.trigger === 'syncExtremes') return; // Prevent feedback loop
      
      Highcharts.charts.forEach(chart => {
        if (!chart || chart === thisChart) return;
        
        const otherGroupName = getSharedChartGroupName(chart, SHARE_CROSSHAIR_CLASS);
        if (otherGroupName !== sharedGroupName) return;
        
        chart.xAxis[0].setExtremes(
          e.min,
          e.max,
          undefined,
          false,
          { trigger: 'syncExtremes' }
        );
      });
    }

    // Reset zoom across shared group charts
    function resetZoom(e: Highcharts.SelectEventObject): boolean {
      if (e.resetSelection) return false; // Prevent feedback loop
      
      // The chart that triggered the selection event is available directly on the event
      const thisChart = (e as any).detail?.chart || (e as any).target?.chart;
      if (!thisChart) return false;
      
      const sharedGroupName = getSharedChartGroupName(thisChart, SHARE_CROSSHAIR_CLASS);
      if (!sharedGroupName) return false;
      
      Highcharts.charts.forEach(chart => {
        if (!chart || chart === thisChart) return;
        
        const otherGroupName = getSharedChartGroupName(chart, SHARE_CROSSHAIR_CLASS);
        if (otherGroupName === sharedGroupName) {
          chart.zoomOut();
        }
      });

      return false;
    }

    // Add the event handlers to Highcharts options
    const defaultOptions = Highcharts.getOptions() || {};
    const xAxisOptions = defaultOptions.xAxis as Highcharts.XAxisOptions || {};
    const chartOptions = defaultOptions.chart as Highcharts.ChartOptions || {};
    
    xAxisOptions.events = {
      ...xAxisOptions.events,
      setExtremes: syncExtremes
    };
    
    chartOptions.events = {
      ...chartOptions.events,
      selection: resetZoom
    };
    
    Highcharts.setOptions({
      ...defaultOptions,
      xAxis: xAxisOptions,
      chart: chartOptions
    });


    // Remove the event listeners and restore original functions
    return () => {
      ['mousemove', 'touchmove', 'touchstart'].forEach(eventType => {
        document.removeEventListener(eventType, handleMouseMove);
      });
      ['mouseout', 'touchend'].forEach(eventType => {
        document.removeEventListener(eventType, handleMouseOut);
      });
      // Restore original functions
      Highcharts.Pointer.prototype.reset = originalReset;
      Highcharts.Tooltip.prototype.hide = originalTooltipHide;
    }

  }, []);

  return (
    <HighchartsProvider 
      
      Highcharts={Highcharts}
      {...providerProps}
    >
      <HighchartsChart
        {...highchartsChartProps}
        chart={{
          ...baseOptions.chart,
          ...highchartsChartProps?.chart,
        }}
        containerProps={{
          style: {
            overflow: "visible",
          },
          ...highchartsChartProps?.containerProps,
          className: finalClassName,
        }}
      >
          <Chart
              {...baseOptions.chart}
              // width={width}
              // height={height}
              // className="zoom-chart" zoom not working
              marginTop={chartProps?.marginTop || 5}
              marginBottom={chartProps?.marginBottom || 37}
              marginRight={chartProps?.marginRight || 5}
              marginLeft={chartProps?.marginLeft || 60}
              
              zooming={{
                ...chartProps?.zooming,
                mouseWheel: {
                  enabled: false,
                },
              }}
              // events={{
              //   // load: function (this: Highcharts.Chart) {
              //   //   chartComponent.current = this;
              //   //   onChartCreated(this);
              //   // },
              // }}
              options={{
                ...chartProps?.options,
                chartComponent: chartComponent.current,
              }}
              {...chartProps}
            />
        {children}
      </HighchartsChart>
    </HighchartsProvider>
  )
}

// Add type declarations for our Highcharts extensions
declare module 'highcharts' {
  interface Point {
    highlight(event: PointerEvent | TouchEvent | MouseEvent): void;
  }
}
