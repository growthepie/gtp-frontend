"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsRoundedCorners from "highcharts-rounded-corners";
import HighchartsReact from "highcharts-react-official";
import highchartsPatternFill from "highcharts/modules/pattern-fill";
import Highcharts, {
  AxisLabelsFormatterContextObject,
  GradientColorStopObject,
} from "highcharts/highstock";

import { useTheme } from "next-themes";
import {
  baseOptions,
  getTimespans,
  getTickPositions,
  getXAxisLabels,
  decimalToPercent,
  tooltipFormatter,
  formatNumber,
  tooltipPositioner,
} from "@/lib/chartUtils";
import ChartWatermark from "../layout/ChartWatermark";
import { Icon } from "@iconify/react";
import { AllChainsByKeys } from "@/lib/chains";
import { debounce } from "lodash";

export const Chart = ({
  // data,
  chartType,
  backgroundColor = "transparent",
  stack = false,
  types,
  timespan,
  series,
  yScale = "linear",
  chartHeight,
  chartWidth,
  decimals = 2,
  maxY,
  chartAvg,
  forceHoveredChartSeriesId,
  hoveredChartSeriesId,
  setHoveredChartSeriesId,
  allCats,
  chartRef,
  forceEIP,
}: {
  // data: { [chain: string]: number[][] };
  chartType: "area" | "line" | "column";
  backgroundColor?: string;
  stack?: boolean;
  types: string[];
  timespan: string;
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
  yScale?: "linear" | "logarithmic" | "percentage" | "percentageDecimal";
  chartHeight: string;
  chartWidth: string;
  decimals?: number;
  maxY?: number;
  chartAvg?: number;
  forceHoveredChartSeriesId?: string;
  hoveredChartSeriesId?: string;
  setHoveredChartSeriesId?: (ids: string) => void;
  allCats?: boolean;
  chartRef?: React.MutableRefObject<Highcharts.Chart | null | undefined>;
  forceEIP?: boolean;
}) => {
  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);
  const [highchartsLoaded, setHighchartsLoaded] = useState(false);

  const timespans = useMemo(() => {
    if (forceEIP) {
      let xMin: number = Infinity; // Initialize with a large number
      let xMax: number = -Infinity; // Initialize with a small number

      let defaultVals = getTimespans(Object.values(series)[0].data);
      Object.keys(series).forEach((index) => {
        let x = getTimespans(Object.values(series)[index].data);
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
  }, [forceEIP, series]);

  const tickPositions = useMemo(
    () =>
      getTickPositions(
        timespans.max.xMin,
        timespans.max.xMax,
        timespan === "max",
      ),
    [timespan, timespans.max.xMax, timespans.max.xMin],
  );

  const { theme } = useTheme();

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });
    highchartsRoundedCorners(Highcharts);
    highchartsAnnotations(Highcharts);
    highchartsPatternFill(Highcharts);
    setHighchartsLoaded(true);
  }, []);

  const decimalPercentageToHex = (percentage: number) => {
    const hex = Math.round(percentage * 255).toString(16);

    return hex.length === 1 ? "0" + hex : hex;
  };

  const drawChartSeries = useCallback(() => {
    const areaStacking =
      yScale === "percentage" ? "percent" : stack ? "normal" : undefined;

    if (chartComponent.current) {
      const currentSeries = chartComponent.current.series;

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
          : "40";

        let fillColor =
          allCats === true
            ? undefined
            : AllChainsByKeys[chainKey].colors[theme ?? "dark"][0] +
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

        let blockspaceAreaColor =
          s.custom?.tooltipLabel === "Unlabeled" && allCats === true
            ? {
                pattern: {
                  color: AllChainsByKeys[chainKey].colors["dark"][0] + "99",
                  path: {
                    d: "M 10 0 L 0 10 M 9 11 L 11 9 M -1 1 L 1 -1",
                    strokeWidth: 3,
                  },
                  width: 10,
                  height: 10,
                  opacity: 0.99,
                },
              }
            : AllChainsByKeys[chainKey].colors[theme ?? "dark"][0] +
              fillHexColorOpacity;

        const color =
          allCats === true && series.length > 1
            ? blockspaceAreaColor
            : normalAreaColor;

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
                  lineWidth: s.lineWidth === undefined ? 2 : s.lineWidth,
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
                      //   AllChainsByKeys[series.name].colors[theme][1] + "33",
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
  }, [yScale, stack, series, chartType, types, theme, allCats]);

  useEffect(() => {
    drawChartSeries();
  }, [drawChartSeries, series, types, maxY, yScale, stack]);

  useEffect(() => {
    // Check if forceEIP is true
    if (forceEIP) {
      // Redraw the chart
      drawChartSeries();
    }
  }, [forceEIP, series]); // Add forceEIP and series as dependencies

  useEffect(() => {
    if (allCats === true && chartComponent.current && series.length > 1) {
      if (
        !forceHoveredChartSeriesId ||
        forceHoveredChartSeriesId.includes("all_chain")
      ) {
        chartComponent.current.series.forEach((s: Highcharts.Series) => {
          s.setState("normal");
          if (s.options.custom) {
            s.options["fillColor"] = s.options.custom.fillColor;
          }
        });
      } else {
        chartComponent.current.series.forEach((s: Highcharts.Series) => {
          if (s.options.id === forceHoveredChartSeriesId) {
            s.setState("hover");
            if (s.options.custom) {
              s.options["fillColor"] = s.options.custom.chainColor;
            }
          } else {
            s.setState("inactive");
            if (s.options.custom) {
              s.options["fillColor"] = s.options.custom.fillColor;
            }
          }
        });
      }
    }
  }, [forceHoveredChartSeriesId, series, allCats]);

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

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const resituateChart = debounce(() => {
    if (chartComponent.current) {
      delay(50)
        .then(() => {
          chartComponent.current &&
            chartComponent.current.setSize(null, null, true);
          // chart.reflow();
        })
        .then(() => {
          delay(100).then(
            () => chartComponent.current && chartComponent.current.reflow(),
          );
        })
        .then(() => {
          delay(150).then(() => chartComponent.current && resetXAxisExtremes());
        });
    }
  }, 150);

  useEffect(() => {
    resituateChart();

    // cancel the debounced function on component unmount
    return () => {
      resituateChart.cancel();
    };
  }, [chartComponent, timespan, timespans, resituateChart]);

  const chartColor =
    series[0]?.name &&
    AllChainsByKeys[series[0].name]?.colors[theme ?? "dark"][0];

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

  return (
    <>
      {
        // series.length > 0 &&
        // Object.values(series)[0].data.length > 0 &&
        timespans && highchartsLoaded ? (
          <div className="w-full py-4 rounded-xl">
            <div
              className="relative"
              style={{ height: chartHeight, width: chartWidth }}
            >
              <div
                className="absolute top-0"
                style={{
                  height: chartHeight,
                  width: chartWidth,
                }}
              >
                <HighchartsReact
                  highcharts={Highcharts}
                  options={
                    {
                      ...baseOptions,
                      chart: {
                        ...baseOptions.chart,
                        type: chartType,
                        backgroundColor: backgroundColor,
                        height: parseFloat(chartHeight),
                        events: {
                          load: function () {
                            chartComponent.current = this;
                            drawChartSeries();
                          },
                        },
                      },
                      plotOptions: {
                        ...baseOptions.plotOptions,
                        line: {
                          stacking: undefined,
                        },
                        area: {
                          ...baseOptions.plotOptions.area,
                          stacking:
                            yScale === "percentage"
                              ? "percent"
                              : stack
                              ? "normal"
                              : undefined,
                        },
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
                                series.length > 0
                                  ? series[0].dataKey
                                  : undefined,
                                false,
                                stack,
                                forceEIP,
                              ),
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
                        tickPositions: displayMinorTicksOnly
                          ? undefined
                          : tickPositions,
                        labels: getXAxisLabels(),
                      },
                      yAxis: {
                        ...baseOptions.yAxis,
                        type: yScale,
                        min: yScale === "percentage" ? 0 : undefined,
                        max: maxY ? maxY : undefined,
                        tickPositions: maxY
                          ? Array.from(
                              { length: numIntervals + 1 },
                              (_, i) => i * intervalSize,
                            )
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
                            value: chartAvg ? chartAvg : null,
                            dashStyle: "Dash",
                          },
                        ],
                        labels: {
                          ...baseOptions.yAxis.labels,
                          formatter: function (
                            t: Highcharts.AxisLabelsFormatterContextObject,
                          ) {
                            const isPercentage =
                              yScale === "percentage" ||
                              yScale === "percentageDecimal";
                            let prefix = "";
                            let suffix = "";

                            if (isPercentage) {
                              prefix = "";
                              suffix = "%";
                            } else if (series.length > 0) {
                              if (series[0].dataKey.includes("usd")) {
                                prefix = "$";
                                suffix = "";
                              } else if (
                                series.length > 0 &&
                                series[0].dataKey.includes("eth")
                              ) {
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
                    } as Highcharts.Options
                  }
                  constructorType={"stockChart"}
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
                    parseInt(chartHeight, 10) <= 400
                      ? parseInt(chartHeight) / 3 - parseInt(chartHeight) / 25
                      : parseInt(chartHeight) / 3 + parseInt(chartHeight) / 12,
                }}
              >
                <ChartWatermark
                  className={`h-[30.67px] md:h-[46px] ${
                    parseInt(chartHeight, 10) > 200
                      ? "w-[128px] md:w-[163px]"
                      : "w-[128.67px] md:w-[193px] "
                  } text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten`}
                />
              </div>
            </div>
            {series.length === 0 && (
              <div className="absolute top-[calc(50%+1.5rem)] left-[0px] text-xs font-medium flex justify-center w-full text-forest-500/60">
                No chain(s) selected for comparison. Please select at least one.
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-[26rem] my-4 flex justify-center items-center">
            <div className="w-10 h-10 animate-spin">
              <Icon
                icon="feather:loader"
                className="w-10 h-10 text-forest-500"
              />
            </div>
          </div>
        )
      }
    </>
  );
};
