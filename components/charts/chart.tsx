"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsRoundedCorners from "highcharts-rounded-corners";
import HighchartsReact from "highcharts-react-official";
import Highcharts, {
  AxisLabelsFormatterContextObject,
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
} from "@/lib/chartUtils";
import ChartWatermark from "../layout/ChartWatermark";
import { Icon } from "@iconify/react";
import { AllChainsByKeys } from "@/lib/chains";
import { debounce } from "lodash";

export const Chart = ({
  // data,
  chartType,
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
}: {
  // data: { [chain: string]: number[][] };
  chartType: "area" | "line";
  stack?: boolean;
  types: string[];
  timespan: string;
  series: {
    id: string;
    name: string;
    unixKey: string;
    dataKey: string;
    data: number[][];
  }[];
  yScale?: "linear" | "logarithmic" | "percentage";
  chartHeight: string;
  chartWidth: string;
  decimals?: number;
  maxY?: number;
  chartAvg?: number;
}) => {
  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);
  const [highchartsLoaded, setHighchartsLoaded] = useState(false);

  const timespans = useMemo(
    () =>
      series.length > 0
        ? getTimespans(Object.values(series)[0].data)
        : getTimespans(null),
    [series],
  );
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

    setHighchartsLoaded(true);
  }, []);

  const drawChartSeries = useCallback(() => {
    if (chartComponent.current) {
      const currentSeries = chartComponent.current.series;

      // remove all series
      // for (var i = chartComponent.current.series.length - 1; i >= 0; i--) {
      //   chartComponent.current.series[i].remove(false);
      // }

      const seriesToRemove = currentSeries.filter(
        (cs) => !series.find((s) => s.name === cs.name),
      );

      seriesToRemove.forEach((s) => {
        s.remove(false);
      });

      // add new series
      series.forEach((s) => {
        if (currentSeries && currentSeries.find((cs) => cs.name === s.name)) {
          const seriesToUpdate = currentSeries.find((cs) => cs.name === s.name);

          seriesToUpdate &&
            seriesToUpdate.setData(
              s.data.map((d) => [
                d[types.indexOf(s.unixKey)],
                d[types.indexOf(s.dataKey)],
              ]),
              false,
            );
        } else {
          chartComponent.current?.addSeries(
            {
              name: s.name,
              data: s.data.map((d) => [
                d[types.indexOf(s.unixKey)],
                d[types.indexOf(s.dataKey)],
              ]),
              type: chartType,
              clip: true,
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
                    AllChainsByKeys[s.name]?.colors[theme ?? "dark"][0] + "33",
                  ],
                  [
                    1,
                    AllChainsByKeys[s.name]?.colors[theme ?? "dark"][1] + "33",
                  ],
                ],
              },
              borderColor: AllChainsByKeys[s.name]?.colors[theme ?? "dark"][0],
              borderWidth: 1,
              lineWidth: 2,
              ...// @ts-ignore
              (chartType !== "column"
                ? {
                    shadow: {
                      color:
                        AllChainsByKeys[s.name]?.colors[theme ?? "dark"][1] +
                        "33",
                      width: 10,
                    },
                    color: {
                      linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 1,
                        y2: 0,
                      },
                      stops: [
                        [
                          0,
                          AllChainsByKeys[s.name]?.colors[theme ?? "dark"][0],
                        ],
                        // [0.33, AllChainsByKeys[series.name].colors[1]],
                        [
                          1,
                          AllChainsByKeys[s.name]?.colors[theme ?? "dark"][1],
                        ],
                      ],
                    },
                  }
                : s.name === "all_l2s"
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
                    color: {
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
                                AllChainsByKeys[s.name]?.colors[
                                  theme ?? "dark"
                                ][0] + "E6",
                              ],
                              // [
                              //   0.3,
                              //   //   AllChainsByKeys[series.name].colors[theme][0] + "FF",
                              //   AllChainsByKeys[series.name].colors[theme][0] +
                              //     "FF",
                              // ],
                              [
                                1,
                                AllChainsByKeys[s.name]?.colors[
                                  theme ?? "dark"
                                ][1] + "E6",
                              ],
                            ]
                          : [
                              [
                                0,
                                AllChainsByKeys[s.name]?.colors[
                                  theme ?? "dark"
                                ][0] + "E6",
                              ],
                              // [
                              //   0.7,
                              //   AllChainsByKeys[series.name].colors[theme][0] +
                              //     "88",
                              // ],
                              [
                                1,
                                AllChainsByKeys[s.name]?.colors[
                                  theme ?? "dark"
                                ][1] + "E6",
                              ],
                            ],
                    },
                  }
                : {
                    borderColor: "transparent",
                    shadow: {
                      color: "#CDD8D3" + "FF",
                      offsetX: 0,
                      offsetY: 0,
                      width: 2,
                    },
                    color: {
                      linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1,
                      },
                      stops: [
                        [
                          0,
                          AllChainsByKeys[s.name]?.colors[theme ?? "dark"][0] +
                            "FF",
                        ],
                        [
                          0.349,
                          AllChainsByKeys[s.name]?.colors[theme ?? "dark"][0] +
                            "88",
                        ],
                        [
                          1,
                          AllChainsByKeys[s.name]?.colors[theme ?? "dark"][0] +
                            "00",
                        ],
                      ],
                    },
                  }),
            },
            false,
          );
        }
      });
      chartComponent.current?.redraw();
    }
  }, [chartType, series, theme, types, maxY]);

  useEffect(() => {
    drawChartSeries();
  }, [drawChartSeries, series, types, maxY]);

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

      if (yScale === "percentage") {
        // For percentages, use a default interval of 0.05
        selectedInterval = 0.05;
        numIntervals = maxY / selectedInterval;
      } else {
        // For other scales, calculate the interval based on maxY
        const tickIntervals = [25, 20, 15, 10, 5, 2, 1, 0.5, 0.1, 0.05];

        for (const interval of tickIntervals) {
          if (maxY >= interval) {
            selectedInterval = interval;
            numIntervals = maxY / interval;
            break;
          }
        }

        if (!selectedInterval) {
          // If no suitable interval is found, use a default interval
          selectedInterval = 1;
          numIntervals = maxY / selectedInterval;
        }
      }

      // Round up maxY to ensure it's not smaller than the calculated maxY
      maxY = Math.ceil(maxY / selectedInterval) * selectedInterval;

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

  return (
    <>
      {
        // series.length > 0 &&
        // Object.values(series)[0].data.length > 0 &&
        timespans && highchartsLoaded ? (
          <div className="w-full py-4 rounded-xl">
            {/* <div>{JSON.stringify(timespans[timespan])}</div>
          <div>
            {JSON.stringify(
              Object.keys(data).map((chain) => ({
                chain,
                unixKey: series[0].unixKey,
                dataKey: series[0].dataKey,
                dataFirst: data[chain][0],
                dataLast: data[chain][data[chain].length - 1],
              })),
            )}
          </div> */}
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
                  options={{
                    ...baseOptions,
                    chart: {
                      ...baseOptions.chart,
                      type: chartType,
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
                        stacking: stack ? "normal" : undefined,
                      },
                    },
                    tooltip: {
                      ...baseOptions.tooltip,
                      formatter:
                        yScale === "percentage"
                          ? tooltipFormatter(true, true, decimalToPercent)
                          : tooltipFormatter(
                              true,
                              false,
                              (x) => {
                                return parseFloat(x).toFixed(decimals);
                              },
                              series.length > 0 ? series[0].dataKey : undefined,
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
                      tickPositions: tickPositions,
                      labels: getXAxisLabels(),
                    },
                    yAxis: {
                      ...baseOptions.yAxis,
                      type: yScale,
                      min: yScale === "percentage" ? 0 : undefined,
                      max: maxY ? maxY : undefined,
                      tickPositions: maxY
                        ? Array.from(
                            { length: yAxisTicks.numIntervals + 1 },
                            (_, i) => i * yAxisTicks.interval,
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
                          const isPercentage = yScale === "percentage";
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
                            isPercentage,
                            prefix,
                            suffix,
                          );
                          // return t.value;
                        },
                      },
                    },
                  }}
                  constructorType={"stockChart"}
                  ref={(chart) => {
                    chartComponent.current = chart?.chart;
                  }}
                />
              </div>
              <div className="absolute bottom-[47.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-50 mix-blend-lighten">
                <ChartWatermark
                  className={`h-[30.67px]  md:h-[46px] ${
                    parseInt(chartHeight, 10) > 200
                      ? "w-[128px] md:w-[163px]"
                      : "w-[128.67px] md:w-[193px] "
                  }`}
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
