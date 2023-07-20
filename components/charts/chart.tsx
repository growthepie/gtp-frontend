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
} from "@/lib/chartUtils";
import ChartWatermark from "../layout/ChartWatermark";
import { Icon } from "@iconify/react";
import { AllChainsByKeys } from "@/lib/chains";
import { debounce } from "lodash";

export const Chart = ({
  // data,
  types,
  timespan,
  series,
  yScale = "linear",
  chartHeight,
  chartWidth,
}: {
  // data: { [chain: string]: number[][] };
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
}) => {
  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);
  const [highchartsLoaded, setHighchartsLoaded] = useState(false);

  const timespans = useMemo(
    () => getTimespans(Object.values(series)[0].data),
    [series],
  );
  const tickPositions = useMemo(
    () =>
      getTickPositions(
        timespans.max.xMin,
        timespans.max.xMax,
        timespan === "max",
      ),
    [series, timespan, timespans.max.xMax, timespans.max.xMin],
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
      for (var i = chartComponent.current.series.length - 1; i >= 0; i--) {
        chartComponent.current.series[i].remove(false);
      }

      // add new series
      series.forEach((s) => {
        chartComponent.current?.addSeries(
          {
            name: s.name,
            data: s.data.map((d) => [
              d[types.indexOf(s.unixKey)],
              d[types.indexOf(s.dataKey)],
            ]),
            type: "area",
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
                [0, AllChainsByKeys[s.name]?.colors[theme ?? "dark"][0] + "FF"],
                [
                  0.349,
                  AllChainsByKeys[s.name]?.colors[theme ?? "dark"][0] + "88",
                ],
                [1, AllChainsByKeys[s.name]?.colors[theme ?? "dark"][0] + "00"],
              ],
            },
          },
          false,
        );
      });
      chartComponent.current?.redraw();
    }
  }, [chartComponent, series, theme, types]);

  useEffect(() => {
    drawChartSeries();
  }, [drawChartSeries, series, types]);

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
          delay(50).then(
            () => chartComponent.current && chartComponent.current.reflow(),
          );
        })
        .then(() => {
          delay(50).then(() => chartComponent.current && resetXAxisExtremes());
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

  return (
    <>
      {Object.values(series)[0].data.length > 0 &&
      timespans &&
      highchartsLoaded ? (
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
                    height: parseFloat(chartHeight),
                    events: {
                      load: function () {
                        chartComponent.current = this;
                        drawChartSeries();
                      },
                    },
                  },
                  tooltip: {
                    ...baseOptions.tooltip,
                    formatter:
                      yScale === "percentage"
                        ? tooltipFormatter(true, true, decimalToPercent)
                        : tooltipFormatter(true, false, (x) => {
                            return x.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            });
                          }),
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
                    max: yScale === "percentage" ? 1 : undefined,
                    gridLineColor:
                      theme === "dark"
                        ? "rgba(215, 223, 222, 0.11)"
                        : "rgba(41, 51, 50, 0.11)",
                    labels: {
                      formatter: function (
                        this: AxisLabelsFormatterContextObject,
                      ) {
                        const { value } = this;
                        if (yScale === "percentage") {
                          return decimalToPercent(value);
                        } else {
                          return value;
                        }
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
              <ChartWatermark className="w-[128.67px] h-[30.67px] md:w-[193px] md:h-[46px]" />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-[26rem] my-4 flex justify-center items-center">
          <div className="w-10 h-10 animate-spin">
            <Icon icon="feather:loader" className="w-10 h-10 text-forest-500" />
          </div>
        </div>
      )}
    </>
  );
};
