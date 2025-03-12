"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
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
import { useHighchartsWrappers } from "@/contexts/UIContext";
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
import moment from "moment";
import { useGTPChartSyncProvider } from "../_contexts/GTPChartSyncContext";

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




export const ApplicationDetailsChart = ({ seriesData, seriesTypes,  metric, prefix, suffix, decimals}: { seriesData: SeriesData[], seriesTypes: string[], metric: string, prefix: string, suffix: string, decimals: number }) => {
  const { selectedScale, selectedYAxisScale } = useChartScale();
  const { data } = useApplicationDetailsData();
  const { metricsDef } = useMetrics();
  const [showUsd] = useLocalStorage("showUsd", true);
  const [showGwei] = useLocalStorage("showGwei", false);
  const { selectedTimespan, timespans } = useTimespan();
  // const { hoveredSeriesName, setHoveredSeriesName, onChartCreated, onChartDestroyed } = useGTPChartSyncProvider();
  useHighchartsWrappers();

  
  // const metricData = data.metrics[metric] as MetricData;
  
  // const chainsData = Object.entries(metricData.aggregated.data);
  // const maxUnix = Math.max(...Object.values(metricData.over_time).map((chainData) => chainData.daily.data[chainData.daily.data.length - 1][0]));
  const minUnix = Math.min(...seriesData.map((series) => series.data[0][0]));
  const maxUnix = Math.max(...seriesData.map((series) => series.data[series.data.length - 1][0]))
  
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
          else if (absVal < 1) number = val.toFixed(2);
          else if (absVal < 10)
            number = units[unitKey].currency ? val.toFixed(2) :
              d3Format(`~.3s`)(val).replace(/G/, "B");
          else if (absVal < 100)
            number = units[unitKey].currency ? d3Format(`s`)(val).replace(/G/, "B") :
              d3Format(`~.4s`)(val).replace(/G/, "B")
          else
            number = units[unitKey].currency ? d3Format(`s`)(val).replace(/G/, "B") :
              d3Format(`~.2s`)(val).replace(/G/, "B");
        } else {
          if (absVal === 0) number = "0";
          else if (absVal < 1) number = val.toFixed(2);
          else if (absVal < 10)
            d3Format(`.2s`)(val).replace(/G/, "B")
          else number = d3Format(`s`)(val).replace(/G/, "B");
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
      if (name === "ethereum") {
        // show column chart for ethereum if monthly and stacked
        if (selectedScale === "stacked")
          return "column";
        // else show area
        return "area";
      }
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

      const columnFillColor = {
        linearGradient: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 1,
        },
        stops: [
          [0, MetadataByKeys[name]?.colors.dark[0] + "FF"],
          // [0.349, MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "88"],
          [1, MetadataByKeys[name]?.colors.dark[0] + "00"],
        ],
      };

      const columnColor = {
        linearGradient: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 1,
        },
        stops: [
          [0, MetadataByKeys[name]?.colors.dark[0] + "FF"],
          // [0.349, MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "88"],
          [1, MetadataByKeys[name]?.colors.dark[0] + "00"],
        ],
      };

      const dottedColumnColor = {
        pattern: {
          path: {
            d: "M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11",
            "stroke-width": 3,
          },
          width: 10,
          height: 10,
          opacity: 1,
          color: MetadataByKeys[name].colors.dark[0] + "CC",
        },
      };

      const todaysDateUTC = new Date().getUTCDate();

      const secondZoneDottedColumnColor =
        todaysDateUTC === 1 ? columnColor : dottedColumnColor;

      const secondZoneDashStyle = todaysDateUTC === 1 ? "Solid" : "Dot";



      // if it is not the last day of the month, add a zone to the chart to indicate that the data is incomplete
      // if (selectedTimeInterval === "monthly") {

      //   if (seriesData.length > 1 && todaysDateUTC !== 1) {
      //     zoneAxis = "x";
      //     zones = [
      //       {
      //         value: seriesData[seriesData.length - 2][0] + 1,
      //         dashStyle: "Solid",
      //         fillColor: isColumnChart ? columnFillColor : seriesFill,
      //         color: isColumnChart
      //           ? columnColor
      //           : MetadataByKeys[name].colors["dark"][0],
      //       },
      //       {
      //         // value: monthlyData[monthlyData.length - 2][0],
      //         dashStyle: secondZoneDashStyle,
      //         fillColor: isColumnChart ? columnFillColor : seriesFill,
      //         color: isColumnChart
      //           ? secondZoneDottedColumnColor
      //           : MetadataByKeys[name].colors["dark"][0],
      //       },
      //     ];
      //   } else if (todaysDateUTC !== 1) {
      //     zoneAxis = "x";
      //     zones = [
      //       {
      //         // value: monthlyData[monthlyData.length - 2][0],
      //         dashStyle: secondZoneDashStyle,
      //         fillColor: isColumnChart ? columnFillColor : seriesFill,
      //         color: isColumnChart
      //           ? secondZoneDottedColumnColor
      //           : MetadataByKeys[name].colors["dark"][0],
      //       }
      //     ];
      //     marker.radius = 2;
      //   } else {
      //     zoneAxis = "x";
      //     zones = [
      //       {
      //         // value: monthlyData[monthlyData.length - 2][0],
      //         dashStyle: secondZoneDashStyle,
      //         fillColor: isColumnChart ? columnFillColor : seriesFill,
      //         color: isColumnChart
      //           ? secondZoneDottedColumnColor
      //           : MetadataByKeys[name].colors["dark"][0],
      //       }
      //     ];
      //   }
      // }

      return {
        data: seriesData,
        zoneAxis,
        zones,
        fillColor,
        fillOpacity,
        color,
        marker,
      };
    },
    [getSeriesType, MetadataByKeys, seriesData],
  );

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
          height: 168,
          // events: {
          //   load: function () {
          //     console.log("chart loaded");
          //     onChartCreated(this);
          //   },
          // },
        },
        plotOptions: {
          ...plotOptions,
        }
      }} 
      chartProps={{
        time: {
          timezone: "UTC",
        },
        marginLeft: 40,
        marginBottom: 30,
        type: "area",
        
      }} 
    >
      <GTPChartTooltip metric_id={metric} />
      <GTPXAxis
        categories={times(24, (i) => `${i}:00`)}
        labels={{
          style: {
            color: "rgb(215, 223, 222)",
          },
        }}
        minDataUnix={minUnix}
        maxDataUnix={maxUnix}
        min={(maxUnix - timespans[selectedTimespan].value * 24 * 3600 * 1000) / 1000}
        max={maxUnix/1000}
      />
      <GTPYAxis
        type={selectedYAxisScale === "logarithmic" && selectedScale === "absolute" ? "logarithmic" : "linear"}
        // title={{
        //   text: "Transactions",
        //   style: {
        //     color: "rgb(215, 223, 222)",
        //   },
        // }}
        // labels={{
        //   style: {
        //     color: "rgb(215, 223, 222)",
        //   },
        // }}
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
            return formatNumber(t.value, {
              isAxis: true,
              // prefix: prefix,
              // suffix: suffix,
              // seriesTypes: ["eth", "usd"],
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

          return (
            <AreaSeries
              key={i}
              // type="column"
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
              states={{
                hover: {
                  enabled: true,
                  halo: {
                    size: 5,
                    opacity: 1,
                    attributes: {
                      fill:
                        MetadataByKeys[series.name]?.colors.dark[0] + "99",
                      stroke:
                        MetadataByKeys[series.name]?.colors.dark[0] + "66",
                      "stroke-width": 0,
                    },
                  },
                  brightness: 0.3,
                },
                inactive: {
                  enabled: true,
                  opacity: 0.6,
                },
                //@ts-ignore
                selection: {
                  enabled: false,
                },
              }}
              events={{
                // mouseOver: function (e) {
                //   setHoveredSeriesName(series.name);
                // },
                // mouseOut: function (e) {
                //   setHoveredSeriesName(null);
                // },
              }}
              shadow={["area", "line"].includes(getSeriesType(series.name)) && selectedScale !== "stacked" ? 
                {
                  color:
                    MetadataByKeys[series.name]?.colors.dark[1] + "FF",
                  width: 7,
                } : 
                undefined 
              }
              // borderColor={MetadataByKeys[series.name]?.colors.dark[0]}
                
              // type: getSeriesType(chainKey),
              // clip: true,
              // dataGrouping: dataGrouping,
              // // borderRadiusTopLeft: borderRadius,
              // // borderRadiusTopRight: borderRadius,
              // fillOpacity: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data)
              //   .fillOpacity,
              // fillColor: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data)
              //   .fillColor,
              // color: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data)
              //   .color,
              // borderColor:
              //   MetadataByKeys[chainKey]?.colors[theme ?? "dark"][0],
              // borderWidth: 1,
              // lineWidth: 2,
              // marker: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data).marker,
              // color={metricItems[series.name].color}
            />
          )
        })}
        
      </GTPYAxis>
    </GTPChart>
  )
}

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
  const xMax = startOfYesterdayUTC;
  const xMin = timespans[selectedTimespan].value > 0 ? startOfYesterdayUTC - timespans[selectedTimespan].value * 24 * 3600 * 1000 : undefined;

  const onXAxisSetExtremes =
    useCallback<Highcharts.AxisSetExtremesEventCallbackFunction>(
      function (e) {
        if (e.trigger === "pan") return;
        const { min, max } = e;
        const numDays = (max - min) / (24 * 60 * 60 * 1000);

        // setIntervalShown({
        //   min,
        //   max,
        //   num: numDays,
        //   label: `${Math.round(numDays)} day${numDays > 1 ? "s" : ""}`,
        // });

        if (
          e.trigger === "zoom" ||
          // e.trigger === "pan" ||
          e.trigger === "navigator" ||
          e.trigger === "rangeSelectorButton"
        ) {
          // const { xMin, xMax } = timespans[selectedTimespan];

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

  const tickInterval = useMemo(() => {
    let min = xMin || props.minDataUnix || 0;
    let max = xMax || props.maxDataUnix || 0;
    

    let days = (max - min) / (24 * 3600 * 1000);
    if (days <= 1) {
      return 12 * 3600 * 1000;
    } else if (days <= 7) {
      return 24 * 3600 * 1000;
    } else if (days <= 30) {
      return 7 * 24 * 3600 * 1000;
    } else if (days <= 90) {
      return 30 * 24 * 3600 * 1000;
    } else if (days <= 365) {
      return 90 * 24 * 3600 * 1000;
    }else if (days <= 365 * 2) {
      return 3 * 30 * 24 * 3600 * 1000;
    }else {
      return 365 * 24 * 3600 * 1000;
    }
  }, [xMin, props.minDataUnix, props.maxDataUnix, xMax]);
  
  return (
    <XAxis
      // {...props}

      // {...baseOptions.xAxis}
      title={undefined}
      events={{
        afterSetExtremes: onXAxisSetExtremes,
      }}
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
          let max = xMax || props.maxDataUnix || 0;
          let min = xMin || props.minDataUnix || 0;

          if (max - min <= 40 * 24 * 3600 * 1000) {
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
      tickInterval={tickInterval}
      // minorTickInterval={xMax - xMin <= 40 * 24 * 3600 * 1000 ? 30 * 3600 * 1000 : 30 * 24 * 3600 * 1000}
      minPadding={0}
      maxPadding={0}
      // min={zoomed ? zoomMin : timespans[selectedTimespan].xMin} // don't include the last day
      // max={zoomed ? zoomMax : timespans[selectedTimespan].xMax}
      min={xMin}
      max={props.maxDataUnix || xMax}
      // max={xMax}
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
  
  const valuePrefix = Object.keys(metricsDef[metric_id].units).includes("usd") ? showUsd ? metricsDef[metric_id].units.usd.prefix : metricsDef[metric_id].units.eth.prefix : Object.values(metricsDef[metric_id].units)[0].prefix;

  const tooltipFormatter = useCallback(
  
    function (this: any) {
      const { x, points }: { x: number; points: any[] } = this;
      points.sort((a: any, b: any) => {
        // if (reversePerformer) return a.y - b.y;
        return b.y - a.y;
      });
  
      const showOthers = points.length > 10 && metric_id !== "txcosts";
  
      const dateString = moment.utc(x).utc().locale("en-GB").format("DD MMM YYYY");
  
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
  // const { onChartCreated, onChartDestroyed } = useGTPChartSyncProvider();
  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);

  // useEffect(() => {
  //   return () => {
  //     if (chartComponent.current) {
  //       onChartDestroyed();
  //     }
  //   };
  // }, [onChartDestroyed]);

  return (
    <HighchartsProvider 
      
      Highcharts={Highcharts}
      {...providerProps}
    >
      <HighchartsChart
        chart={{
          ...baseOptions.chart, 
          
        }}

        containerProps={{
          style: {
            overflow: "visible",
          }
        }}
        {...highchartsChartProps}
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
