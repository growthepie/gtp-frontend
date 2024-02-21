"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsRoundedCorners from "highcharts-rounded-corners";
import highchartsPatternFill from "highcharts/modules/pattern-fill";
import HighchartsReact from "highcharts-react-official";
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
  forceHoveredChartSeriesId,
  setHoveredChartSeriesId,
  yScale = "linear",
  chartHeight,
  chartWidth,
  decimals = 2,
  maxY,
  chartAvg,
}: {
  // data: { [chain: string]: number[][] };
  chartType: "area" | "line";
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
  forceHoveredChartSeriesId?: string;
  setHoveredChartSeriesId?: (ids: string) => void;
  yScale?: "linear" | "logarithmic" | "percentage" | "percentageDecimal";
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
      series.forEach((s) => {
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

        const fillHexColorOpacity = s.fillOpacity
          ? decimalPercentageToHex(s.fillOpacity)
          : "33";

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
              { type: chartType, stacking: areaStacking },
              false,
            );
          }
        } else {
          const chainKey = s.name;

          let fillColor =
            AllChainsByKeys[chainKey].colors[theme ?? "dark"][0] +
            fillHexColorOpacity;

          console.log("fillColor", fillColor, s.id, chainKey, theme, s.name);

          let color = s.id.includes("unlabeled")
            ? {
                pattern: {
                  color: AllChainsByKeys[chainKey].colors["dark"][0] + "55",
                  path: {
                    d: "M 10 0 L 0 10 M 9 11 L 11 9 M -1 1 L 1 -1",
                    strokeWidth: 3,
                  },
                  width: 10,
                  height: 10,
                  opacity: 0.99,
                },
              }
            : AllChainsByKeys[chainKey].colors[theme ?? "dark"][0];
          // {
          //   linearGradient: {
          //     x1: 0,
          //     y1: 0,
          //     x2: 1,
          //     y2: 0,
          //   },
          //   stops: [
          //     [0, AllChainsByKeys[chainKey]?.colors[theme ?? "dark"][0]],
          //     // [0.33, AllChainsByKeys[series.name].colors[1]],
          //     [1, AllChainsByKeys[chainKey]?.colors[theme ?? "dark"][1]],
          //   ],
          // };
          chartComponent.current?.addSeries(
            {
              id: s.id,
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
              clip: false,
              // opacity: s.fillOpacity,
              fillOpacity: s.fillOpacity,
              // fillColor: fillColor,
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
                                AllChainsByKeys[chainKey]?.colors[
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
                                AllChainsByKeys[chainKey]?.colors[
                                  theme ?? "dark"
                                ][1] + "E6",
                              ],
                            ]
                          : [
                              [
                                0,
                                AllChainsByKeys[chainKey]?.colors[
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
                                AllChainsByKeys[chainKey]?.colors[
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
                    color: color,
                    // fillColor: color + fillHexColorOpacity,
                    // opacity: s.fillOpacity,
                    // fillColor: color,
                  }),
            },
            false,
          );
        }
      });
      chartComponent.current?.redraw();
    }
  }, [chartType, series, theme, types, maxY, yScale, stack]);

  useEffect(() => {
    drawChartSeries();
  }, [drawChartSeries, series, types, maxY, yScale, stack]);

  const resetColorsAndOpacity = useCallback(() => {
    if (chartComponent.current) {
      chartComponent.current.series.forEach((s: Highcharts.Series) => {
        s.setState("normal");

        // s.options.opacity = 1;

        if (s.options.custom) {
          s.color = s.options.custom.color;
          s.options["fillOpacity"] = s.options.custom.fillHexColorOpacity;
        }
      });
    }
  }, []);

  const hoverSeriesCallback = useCallback(() => {
    if (forceHoveredChartSeriesId !== undefined) {
      if (chartComponent.current) {
        if (forceHoveredChartSeriesId === "") {
          // chartComponent.current.series.forEach((s: Highcharts.Series) => {
          //   s.setState("normal");

          //   s.options.opacity = 1;

          //   if (s.options.custom) {
          //     s.color = s.options.custom.color;
          //     s.options["fillOpacity"] = 1;
          //   }
          // });
          resetColorsAndOpacity();
        } else {
          chartComponent.current.series.forEach((s: Highcharts.Series) => {
            if (s.options.id === forceHoveredChartSeriesId) {
              s.setState("hover");
              // s.options.opacity = 1;

              if (s.options.custom) {
                s.color = s.options.custom.chainColor;
                s.options["fillOpacity"] = 1;
              }
            } else {
              s.setState("inactive");
              // s.options.opacity = 0;
              if (s.options.custom) {
                s.color = s.options.custom.color;
                s.options["fillOpacity"] = 0;
              }
            }
          });
        }
      }
    }
  }, [forceHoveredChartSeriesId, resetColorsAndOpacity]);

  useEffect(() => {
    //   if (forceHoveredChartSeriesId !== undefined) {
    //     if (chartComponent.current) {
    //       if (forceHoveredChartSeriesId === "") {
    //         chartComponent.current.series.forEach((s: Highcharts.Series) => {
    //           s.setState("normal");

    //           // s.options.opacity = 1;

    //           if (s.options.custom)
    //             s.options.color =
    //               s.options.custom.chainColor +
    //               s.options.custom.fillHexColorOpacity;
    //         });
    //       } else {
    //         chartComponent.current.series.forEach((s: Highcharts.Series) => {
    //           if (s.options.id === forceHoveredChartSeriesId) {
    //             s.setState("hover");
    //             // s.options.opacity = 1;
    //             if (s.options.custom)
    //               s.options.color = s.options.custom.chainColor + "FF";
    //           } else {
    //             // s.setState("inactive");
    //             // s.options.opacity = 0;
    //             if (s.options.custom)
    //               s.options.color = s.options.custom.chainColor + "00";
    //           }
    //         });
    //       }
    //     }
    //   }
    hoverSeriesCallback();
  }, [hoverSeriesCallback]);

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
                onMouseOut={() => {
                  if (
                    setHoveredChartSeriesId &&
                    forceHoveredChartSeriesId !== ""
                  ) {
                    resetColorsAndOpacity();
                  }
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
                          // mouseOver: function (this, e) {
                          //   if (
                          //     setHoveredChartSeriesId &&
                          //     forceHoveredChartSeriesId !== ""
                          //   ) {
                          //     setHoveredChartSeriesId("");
                          //   }
                          // },
                          mouseOut: function (this, e) {
                            if (
                              setHoveredChartSeriesId &&
                              forceHoveredChartSeriesId !== ""
                            ) {
                              setHoveredChartSeriesId("");
                            }
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
                          trackByArea: forceHoveredChartSeriesId
                            ? false
                            : false,
                          stacking:
                            yScale === "percentage"
                              ? "percent"
                              : stack
                              ? "normal"
                              : undefined,
                        },
                        series: {
                          // point: {
                          //   events: {
                          //     mouseOver: function (this, e) {
                          //       const seriesId = this.series.options.id;
                          //       if (seriesId && setHoveredChartSeriesId) {
                          //         setHoveredChartSeriesId(seriesId);
                          //       }
                          //     } as Highcharts.PointMouseOverCallbackFunction,
                          //   },
                          // },
                          animation: false,
                          states: {
                            hover: {
                              enabled: false,
                            },
                            animation: {
                              duration: 0,
                            },
                            inactive: {
                              animation: false,
                            },
                          },

                          stickyTracking:
                            forceHoveredChartSeriesId !== undefined
                              ? false
                              : true,
                          events: {
                            // points: {
                            //   mouseOver: function (this, e) {
                            //     const seriesId = this.options.id;
                            //     if (
                            //       seriesId &&
                            //       setHoveredChartSeriesId &&
                            //       forceHoveredChartSeriesId !== seriesId
                            //     ) {
                            //       setHoveredChartSeriesId(seriesId);
                            //     }
                            //     return true;
                            //   } as Highcharts.SeriesMouseOutCallbackFunction,
                            //   mouseOut: function (this, e) {
                            //     if (
                            //       setHoveredChartSeriesId &&
                            //       !forceHoveredChartSeriesId
                            //     ) {
                            //       setHoveredChartSeriesId("");
                            //     }
                            //     return true;
                            //   } as Highcharts.SeriesMouseOutCallbackFunction,
                            // },
                            mouseOver: function (this, e) {
                              const seriesId = this.options.id;
                              if (
                                setHoveredChartSeriesId &&
                                forceHoveredChartSeriesId !== seriesId
                              ) {
                                setHoveredChartSeriesId(seriesId || "");
                              }
                              return true;
                            } as Highcharts.SeriesMouseOutCallbackFunction,
                            mouseOut: function (this, e) {
                              if (
                                setHoveredChartSeriesId &&
                                !forceHoveredChartSeriesId
                              ) {
                                setHoveredChartSeriesId("");
                              }
                              return true;
                            } as Highcharts.SeriesMouseOutCallbackFunction,
                          },
                        },
                      },
                      // series: {
                      //   ...baseOptions.series,
                      //   states: {
                      //     hover: {
                      //       enabled: false,
                      //     },
                      //     animation: {
                      //       duration: 0,
                      //     },
                      //   },
                      // },
                      tooltip: {
                        ...baseOptions.tooltip,
                        // positioner: function (
                        //   boxWidth: number,
                        //   boxHeight: number,
                        //   point: Highcharts.TooltipPositionerPointObject,
                        // ) {
                        //   return {
                        //     x: 10,
                        //     y: 10,
                        //   };
                        // },
                        positioner: tooltipPositioner,
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
