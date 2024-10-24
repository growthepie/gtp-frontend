"use client";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import { useTheme } from "next-themes";
import {
  baseOptions,
  getTickPositions,
  getXAxisLabels,
  decimalToPercent,
  tooltipFormatter,
  tooltipPositioner,
} from "@/lib/chartUtils";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useUIContext } from "@/contexts/UIContext";
import ChartWatermark from "@/components/layout/ChartWatermark";
import * as d3 from "d3";
import { useLocalStorage } from "usehooks-ts";
import { useMaster } from "@/contexts/MasterContext";

export const ChartColors = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

export default function FeesChart({
  chartWidth,
  chartHeight,
  yScale = "linear",
  stack = false,
  series,
  chartType = "line",
  types,
  decimals = 3,
  maxY,
  timespan = "1d",
  setZoomed,
  disableZoom,
  setDisableZoom,
}: {
  chartHeight: string;
  chartWidth: string;
  yScale: string;
  stack: boolean;
  series: {
    id: string;
    name: string;
    custom?: {
      tooltipLabel: string;
    };
    type?: string;
    unixKey: string;
    dataKey: string;
    data: number[][];
    fillOpacity?: number;
    lineWidth?: number;
  }[];
  chartType: "area" | "line" | "column";
  types: string[];
  decimals?: number;
  maxY?: number;
  timespan: string;
  setZoomed: (zoom: boolean) => void;
  disableZoom: boolean;
  setDisableZoom: (disZoom: boolean) => void;
}) {
  type TimespanSelections = "1d" | "7d" | "max";
  const { theme } = useTheme();
  const { AllChainsByKeys } = useMaster();
  const chartRef = useRef<Highcharts.Chart | null | undefined>(undefined);
  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);
  const { isSidebarOpen } = useUIContext();
  const chartColor =
    series[0]?.name &&
    AllChainsByKeys[series[0].name]?.colors[theme ?? "dark"][0];
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const getTimespans = (
    data?,
    isPercentageScale = false,
  ): {
      [key in TimespanSelections]: {
        label: string;
        value: number;
        xMin: number;
        xMax: number;
      };
    } => {
    const maxDate = data
      ? new Date(data.length > 0 ? data[0][0] : 0)
      : new Date();

    const buffer = isPercentageScale ? 0 : 3.5 * 24 * 60 * 60 * 1000;
    const maxPlusBuffer = maxDate.valueOf() + buffer;
    const minDate = data
      ? data.reduce((min, d) => Math.min(min, d[0]), Infinity)
      : maxDate.valueOf() - 365 * 24 * 60 * 60 * 1000;
    return {
      "1d": {
        label: "1 day",
        value: 1,
        xMin: maxDate.valueOf() - 1 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "7d": {
        label: "7 days",
        value: 7,
        xMin: maxDate.valueOf() - 7 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      max: {
        label: "Maximum",
        value: 0,
        xMin: minDate,
        xMax: maxDate.getTime(),
      },
    };
  };

  const getXAxisLabels = (dailyTicks = false) => {
    return {
      style: { color: ChartColors.LABEL },
      enabled: true,
      formatter: (item) => {
        const date = new Date(item.value);
        const isDayStart = date.getHours() === 0 && date.getMinutes() === 0;
        const isMonthStart = date.getDate() === 1;
        const isYearStart = isMonthStart && date.getMonth() === 0;

        if (isYearStart) {
          return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
        } else {
          if (dailyTicks && isDayStart) {
            return `<span style="">${date.toLocaleDateString("en-GB", {
              timeZone: "UTC",
              month: "short",
              day: "numeric",
            })}</span>`;
          }

          return `<span style="">${date.toLocaleDateString("en-GB", {
            timeZone: "UTC",
            month: "short",
            day: "numeric",
          })}</span>`;
        }
      },
    };
  };

  const formatNumber =
    // (
    //   value: number | string,
    //   isAxis = false,
    //   isPercentage = false,
    // ) => {
    (
      value: number | string,
      isAxis = false,
      isPercentage = false,
      prefix = "",
      suffix = "",
    ) => {
      let val = parseFloat(value as string);

      // Check if the value should be displayed as dollars with only decimals
      if (showUsd) {
        // Format the value with only decimals using Intl.NumberFormat
        return `${prefix}${Intl.NumberFormat("en-GB", {
          notation: "compact",
          maximumFractionDigits: 5,
          minimumFractionDigits: 1,
        }).format(Number(val.toFixed(5)))}${suffix}`;
      }

      // Proceed with the existing logic
      let number = d3.format(`.2~s`)(val).replace(/G/, "B");

      if (isAxis) {
        if (isPercentage) {
          number = decimalToPercent(val * 100, 0);
        } else {
          number = prefix + d3.format(".2s")(val).replace(/G/, "B") + suffix;
        }
      } else {
        if (isPercentage) {
          number =
            d3
              .format(".2~s")(val * 100)
              .replace(/G/, "B") + "%";
        } else {
          number = val;
        }
      }

      return number;
    };

  const timespans = useMemo(() => {
    if (true) {
      let xMin: number = Infinity; // Initialize with a large number
      let xMax: number = -Infinity; // Initialize with a small number

      let defaultVals = getTimespans(Object.values(series)[0].data, true);

      Object.keys(series).forEach((index) => {
        let x = getTimespans(Object.values(series)[index].data, true);
        if (xMin > x.max.xMin) {
          xMin = x.max.xMin;
        }
        if (xMax < x.max.xMax) {
          xMax = x.max.xMax;
        }
      });
      defaultVals.max.xMin = xMin;
      defaultVals.max.xMax = xMax;

      return defaultVals;
    } else {
      return series.length > 0
        ? getTimespans(Object.values(series)[0].data)
        : getTimespans(null);
    }
  }, [series]);

  const tickPositions = useMemo(
    () =>
      getTickPositions(
        timespans.max.xMin,
        timespans.max.xMax,
        timespan === "max",
      ),
    [timespan, timespans.max.xMax, timespans.max.xMin],
  );

  const drawChartSeries = useCallback(() => {
    const areaStacking =
      yScale === "percentage" ? "percent" : stack ? "normal" : undefined;

    if (chartComponent.current) {
      const currentSeries = chartComponent?.current?.series;

      const seriesToRemove = currentSeries.filter(
        (cs) => !series.find((s) => s.id === cs.options.id),
      );

      seriesToRemove.forEach((s) => {
        s.remove(false);
      });

      // add new series
      series.forEach((s, seriesIndex) => {
        const chainKey = s.name;

        const fillHexColorOpacity = s.fillOpacity
          ? decimalPercentageToHex(s.fillOpacity)
          : "33";

        let fillColor =
          AllChainsByKeys[chainKey].colors[theme ?? "dark"][0] +
          fillHexColorOpacity;

        const normalAreaColor = {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
          },
          stops:
            theme === "dark"
              ? [
                [
                  0,
                  AllChainsByKeys[chainKey]?.colors[theme ?? "dark"][0] +
                  "E6",
                ],
                [
                  1,
                  AllChainsByKeys[chainKey]?.colors[theme ?? "dark"][1] +
                  "E6",
                ],
              ]
              : [
                [
                  0,
                  AllChainsByKeys[chainKey]?.colors[theme ?? "dark"][0] +
                  "E6",
                ],
                [
                  1,
                  AllChainsByKeys[chainKey]?.colors[theme ?? "dark"][1] +
                  "E6",
                ],
              ],
        };

        const color = normalAreaColor;

        // Remove series if no data
        if (!s.data || s.data.length === 0) {
          if (
            currentSeries &&
            currentSeries.find((cs) => cs.options.id === s.id)
          ) {
            const seriesToUpdate = currentSeries.find(
              (cs) => cs.options.id === s.id,
            );
            if (seriesToUpdate) {
              seriesToUpdate.remove(false);
            }
          }
        }

        // Update series if it already exists
        if (
          currentSeries &&
          currentSeries.find((cs) => cs.options.id === s.id)
        ) {
          const seriesToUpdate = currentSeries.find(
            (cs) => cs.options.id === s.id,
          );

          if (seriesToUpdate) {
            seriesToUpdate.setData([], false);
            seriesToUpdate.setData(
              s.data.map((d) => [
                d[types.indexOf(s.unixKey)],
                d[types.indexOf(s.dataKey)],
              ]),
              false,
            );

            seriesToUpdate.update(
              // @ts-ignore
              {
                type: chartType,
                stacking: areaStacking,
                index: seriesIndex,
                borderColor: "transparent",
                ...(chartType !== "column" && {
                  shadow: {
                    color:
                      AllChainsByKeys[chainKey]?.colors[theme ?? "dark"][1] +
                      (s.fillOpacity ? "11" : "33"),
                    width: s.fillOpacity ? 6 : 10,
                  },
                  color: color,
                  fillOpacity: s.fillOpacity,
                  fillColor: fillColor,
                  borderColor:
                    AllChainsByKeys[chainKey]?.colors[theme ?? "dark"][0],
                  borderWidth: s.lineWidth === undefined ? 1 : s.lineWidth,
                  lineWidth: s.lineWidth === undefined ? 1 : s.lineWidth,
                }),
              },
              false,
            );
          }
        } else {
          chartComponent.current?.addSeries(
            // @ts-ignore
            {
              id: s.id,
              index: seriesIndex,
              name: s.name,
              custom: {
                ...s.custom,
                chainColor:
                  AllChainsByKeys[chainKey]?.colors[theme ?? "dark"][0],
                fillHexColorOpacity: fillHexColorOpacity,
                color: color,
              },
              data: s.data.map((d) => [
                d[types.indexOf(s.unixKey)],
                d[types.indexOf(s.dataKey)],
              ]),
              type: chartType,
              stacking: areaStacking,
              clip: true,
              fillOpacity: s.fillOpacity,
              fillColor: fillColor,
              borderColor:
                AllChainsByKeys[chainKey]?.colors[theme ?? "dark"][0],
              borderWidth: s.lineWidth === undefined ? 1 : s.lineWidth,
              lineWidth: s.lineWidth === undefined ? 2 : s.lineWidth,
              ...// @ts-ignore
              (chartType !== "column"
                ? {
                  shadow: {
                    color:
                      AllChainsByKeys[chainKey]?.colors[theme ?? "dark"][1] +
                      (s.fillOpacity ? "11" : "33"),
                    width: s.fillOpacity ? 6 : 10,
                  },
                  color: color,
                }
                : chainKey === "all_l2s"
                  ? {
                    borderColor: "transparent",

                    shadow: {
                      color: "#CDD8D3" + "FF",
                      // color:
                      //   AllChainsByKeys[series.name].colors[theme ?? "dark"][1] + "33",
                      // width: 10,
                      offsetX: 0,
                      offsetY: 0,
                      width: 2,
                    },
                    color: color,
                  }
                  : {
                    borderColor: "transparent",
                    shadow: {
                      color: "#CDD8D3" + "FF",
                      offsetX: 0,
                      offsetY: 0,
                      width: 2,
                    },
                    color: color,
                  }),
            },
            false,
          );
        }
      });
      chartComponent.current?.redraw();
    }
  }, [yScale, stack, series, chartType, types, theme]);

  useEffect(() => {
    drawChartSeries();
  }, [drawChartSeries, series, types, yScale, stack]);

  useEffect(() => {
    if (disableZoom) {
      chartComponent?.current?.xAxis[0].setExtremes(
        timespans[timespan].xMin,
        timespans[timespan].xMax,
      );

      setDisableZoom(false);
    }
  }, [disableZoom]);

  function useYAxisTicks(maxY, yScale) {
    const [yAxisTicks, setYAxisTicks] = useState({
      interval: 0.05, // Default interval for percentages
      numIntervals: 1,
    });

    useEffect(() => {
      // Determine the tick interval based on maxY
      let selectedInterval;
      let numIntervals;

      if (yScale === "percentage" || yScale === "percentageDecimal") {
        selectedInterval = 0.05; // Default interval for percentages
      } else {
        selectedInterval = 1; // Default interval for other scales
      }

      // Calculate the number of intervals based on maxY and the selectedInterval
      numIntervals = Math.ceil(maxY / selectedInterval);

      // Adjust the interval and numIntervals if needed
      while (selectedInterval * numIntervals > maxY) {
        // Reduce the interval until it doesn't exceed maxY
        selectedInterval /= 2;
        numIntervals = Math.ceil(maxY / selectedInterval);
      }

      // Set a maximum of 4 intervals
      if (numIntervals > 3) {
        numIntervals = 3;
        selectedInterval = maxY / numIntervals;
      }

      // Set the yAxisTicks state
      setYAxisTicks({ interval: selectedInterval, numIntervals });
    }, [maxY, yScale]);

    return yAxisTicks;
  }

  const yAxisTicks = useYAxisTicks(maxY, yScale);
  const numIntervals = Math.ceil(parseFloat(chartHeight) / 171);
  const intervalSize = maxY ? maxY / numIntervals : 0;

  const lastTick = tickPositions[tickPositions.length - 1];
  const displayMinorTicksOnly =
    lastTick < timespans[timespan].xMin || lastTick > timespans[timespan].xMax;

  const options: Highcharts.Options = {
    ...baseOptions,
    title: {
      text: "",
    },
    chart: {
      height: chartHeight, // Specify the height of the chart
      backgroundColor: "transparent",
      animation: true,
      zooming: {
        type: "x",
        mouseWheel: {
          enabled: false,
        },
        resetButton: {
          position: {
            x: 0,
            y: 10,
          },
          theme: {
            fill: "transparent",
            style: {
              opacity: 0,
              fontSize: "12",
              fontFamily: "Inter",
              fontWeight: "300",
              color: "#fff",
              textTransform: "lowercase",
              border: "1px solid #fff",
            },
            borderRadius: 4,
            padding: 8,
            borderWidth: 2,
            r: 16,
            states: { hover: { fill: "#fff", style: { color: "#000" } } },
          },
        },
      },
      events: {
        //@ts-ignore
        selection: function (event) {
          setZoomed(true);
        },
      },
    },

    legend: {
      enabled: false,
    },
    yAxis: {
      ...baseOptions.yAxis,
      //@ts-ignore
      type: yScale,
      title: undefined,
      min: yScale === "percentage" ? 0 : undefined,
      max: maxY ? maxY : undefined,
      tickPositions: maxY
        ? Array.from({ length: numIntervals + 1 }, (_, i) => i * intervalSize)
        : undefined,
      tickInterval: maxY ? yAxisTicks.interval : undefined,
      gridLineColor:
        theme === "dark"
          ? "rgba(215, 223, 222, 0.11)"
          : "rgba(41, 51, 50, 0.11)",
      plotLines: [
        {
          color: chartColor ? chartColor : null,
          width: 1,
          dashStyle: "Dash",
        },
      ],
      labels: {
        //@ts-ignore
        ...baseOptions.yAxis.labels,
        formatter: function (t: Highcharts.AxisLabelsFormatterContextObject) {
          const isPercentage =
            yScale === "percentage" || yScale === "percentageDecimal";
          let prefix = "";
          let suffix = "";

          if (isPercentage) {
            prefix = "";
            suffix = "%";
          } else if (series.length > 0) {
            if (series[0].dataKey.includes("usd")) {
              prefix = "$";
              suffix = "";
            } else if (series.length > 0 && series[0].dataKey.includes("eth")) {
              prefix = "";
              suffix = "Ξ";
            }
          }

          return formatNumber(
            t.value,
            true,
            yScale === "percentageDecimal",
            prefix,
            suffix,
          );
          // return t.value;
        },
      },
    },
    xAxis: {
      ...baseOptions.xAxis,
      min: timespans[timespan].xMin,
      max: timespans[timespan].xMax,
      minorTicks: true,
      minorTickLength: 2,
      minorTickWidth: 2,
      minorGridLineWidth: 0,
      minorTickInterval: ["7d", "30d"].includes(timespan)
        ? 1000 * 60 * 60 * 24 * 1
        : 1000 * 60 * 60 * 24 * 7,
      tickPositions: displayMinorTicksOnly ? undefined : tickPositions,
      labels: getXAxisLabels(),
    },
    tooltip: {
      ...baseOptions.tooltip,
      formatter:
        yScale === "percentageDecimal"
          ? tooltipFormatter(true, true, decimalToPercent)
          : yScale === "percentage"
            ? tooltipFormatter(true, true, null)
            : tooltipFormatter(
              true,
              false,
              (x) => {
                return parseFloat(x).toFixed(decimals);
              },
              series.length > 0 ? series[0].dataKey : undefined,
              false,
              stack,
              true,
            ),
    },
    events: {
      events: {
        load: function () {
          chartComponent.current = this;
          drawChartSeries();
        },
      },
    },
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (chartComponent.current) {
        chartComponent.current.reflow();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [isSidebarOpen]);

  const resetXAxisExtremes = useCallback(() => {
    if (chartComponent.current) {
      // const pixelsPerDay =
      // chartComponent.current.plotWidth / timespans[timespan].daysDiff;

      // // 15px padding on each side
      // const paddingMilliseconds = (15 / pixelsPerDay) * 24 * 60 * 60 * 1000;

      chartComponent.current.xAxis[0].setExtremes(
        timespans[timespan].xMin,
        timespans[timespan].xMax,
        true,
      );
    }
  }, [timespan, timespans]);

  const decimalPercentageToHex = (percentage: number) => {
    const hex = Math.round(percentage * 255).toString(16);

    return hex.length === 1 ? "0" + hex : hex;
  };

  return (
    <div
      className="relative"
      style={{
        width: chartWidth,
        height: chartHeight,
      }}
    >
      <div className="w-full h-full">
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
          ref={(chart) => {
            chartComponent.current = chart?.chart;
            if (chartRef !== undefined) chartRef.current = chart?.chart;
          }}
        />
      </div>

      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-50"
        style={{
          top:
            parseInt(chartHeight, 12) <= 400
              ? parseInt(chartHeight) / 3 - parseInt(chartHeight) / 25
              : parseInt(chartHeight) / 3 + parseInt(chartHeight) / 12,
        }}
      >
        <ChartWatermark
          className={`h-[30.67px] md:h-[46px] ${parseInt(chartHeight, 10) > 200
            ? "w-[128px] md:w-[163px]"
            : "w-[128.67px] md:w-[193px] "
            } text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten`}
        />
      </div>
    </div>
  );
}
