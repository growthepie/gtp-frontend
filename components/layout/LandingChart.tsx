"use client";

import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsRoundedCorners from "highcharts-rounded-corners";
import HighchartsReact from "highcharts-react-official";
import Highcharts, { chart } from "highcharts";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Card } from "@/components/Card";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import fullScreen from "highcharts/modules/full-screen";
import _merge from "lodash/merge";
import { zinc, red, blue, amber, purple } from "tailwindcss/colors";
import { theme as customTheme } from "tailwind.config";
import { ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import _ from "lodash";
import { Switch } from "../Switch";
import { AllChains, AllChainsByKeys } from "@/lib/chains";
// import borderRadius from "highcharts-border-radius";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135", // mignight-express but lighter
  ANNOTATION_BG: "rgb(215, 223, 222)",
  // visx
  // SERIES: ["#0b7285", "#66d9e8", "#fcc419", "#ff8787", "#9c36b5", "#cc5de8", "#a61e4d"],
  // chart.js
  SERIES: ["#36a2eb", "#ff6384", "#8142ff", "#ff9f40", "#ffcd56", "#4bc0c0"],
};
const isArray = (obj: any) =>
  Object.prototype.toString.call(obj) === "[object Array]";
const splat = (obj: any) => (isArray(obj) ? obj : [obj]);

const baseOptions: Highcharts.Options = {
  accessibility: { enabled: false },
  exporting: { enabled: false },
  chart: {
    type: "column",
    animation: false,
    backgroundColor: "transparent",
    showAxes: false,
    zooming: {
      type: "x",
      resetButton: {
        position: {
          x: 0,
          y: 10,
        },
        theme: {
          fill: "transparent",
          style: {
            opacity: 1,
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
  },

  title: undefined,
  yAxis: {
    title: { text: undefined },
    labels: {
      enabled: true,
    },
    gridLineWidth: 1,
    gridLineColor: COLORS.GRID,
  },
  xAxis: {
    type: "datetime",
    lineWidth: 0,
    crosshair: {
      width: 0.5,
      color: COLORS.PLOT_LINE,
    },

    labels: {
      style: { color: COLORS.LABEL },
      enabled: true,
      formatter: (item) => {
        const date = new Date(item.value);
        const isMonthStart = date.getDate() === 1;
        const isYearStart = isMonthStart && date.getMonth() === 0;
        if (isYearStart) {
          return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
        } else {
          return `<span style="">${date.toLocaleDateString(undefined, {
            month: "short",
          })}</span>`;
        }
        // return `<span style="">${new Date(item.value).toLocaleDateString(
        //   undefined,
        //   { year: "numeric", month: "numeric", day: "numeric" }
        // )}</span>`;
      },
    },
    tickWidth: 4,
    tickLength: 4,
    minPadding: 0.04,
    maxPadding: 0.04,
    gridLineWidth: 0,
  },
  legend: {
    enabled: false,
    useHTML: false,
    symbolWidth: 0,
    // labelFormatter: function () {
    // 	const color = bgColors[this.name][0];

    // 	return `
    //     <div class="flex flex-row items-center gap-x-2">
    //         <div class="w-2 h-2 rounded-full ${color}"></div>
    //         <div class="font-roboto font-normal text-zincus-400 text-xs">
    //         ${this.name}
    //         </div>
    //     </div>`;
    // },
  },
  tooltip: {
    // backgroundColor: 'transparent',
    useHTML: true,
    shadow: false,
    shared: true,
  },
  plotOptions: {
    // spline: {
    //   lineWidth: 2,
    // },
    column: {
      stacking: "normal",
      events: {
        legendItemClick: function () {
          return false;
        },
      },
      // borderColor: "#ffffff",
      // borderWidth: 1,
      // make columns touch each other
      pointWidth: undefined,
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
      // states: {
      //   hover: {
      //     enabled: false,
      //   },
      // },
      shadow: false,
      animation: false,
    },
  },

  credits: {
    enabled: false,
  },
  navigation: {
    buttonOptions: {
      enabled: false,
    },
  },
};

const timespans = {
  // "30d": {
  //   label: "30 days",
  //   value: 30,
  //   xMin: Date.now() - 30 * 24 * 60 * 60 * 1000,
  //   xMax: Date.now(),
  // },
  "90d": {
    label: "90 days",
    value: 90,
    xMin: Date.now() - 90 * 24 * 60 * 60 * 1000,
    xMax: Date.now(),
  },
  "180d": {
    label: "180 days",
    value: 180,
    xMin: Date.now() - 180 * 24 * 60 * 60 * 1000,
    xMax: Date.now(),
  },
  "365d": {
    label: "1 year",
    value: 365,
    xMin: Date.now() - 365 * 24 * 60 * 60 * 1000,
    xMax: Date.now(),
  },
  max: {
    label: "Maximum",
    value: 0,
    xMin: Date.parse("2020-09-28"),
    xMax: Date.now(),
  },
};

export default function LandingChart({
  data,
}: // timeIntervals,
// onTimeIntervalChange,
// showTimeIntervals = true,
{
  data: any;
  // timeIntervals: string[];
  // onTimeIntervalChange: (interval: string) => void;
  // showTimeIntervals: boolean;
}) {
  const [highchartsLoaded, setHighchartsLoaded] = useState(false);

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });
    highchartsRoundedCorners(Highcharts);
    highchartsAnnotations(Highcharts);
    // fullScreen(Highcharts);

    setHighchartsLoaded(true);
  }, []);

  // const [darkMode, setDarkMode] = useLocalStorage("darkMode", true);
  const { theme } = useTheme();

  const [showUsd, setShowUsd] = useSessionStorage("showUsd", true);

  const [selectedTimespan, setSelectedTimespan] = useState("180d");

  const [selectedScale, setSelectedScale] = useState("absolute");

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");

  const [showEthereumMainnet, setShowEthereumMainnet] = useState(false);

  const getTickPositions = useCallback(
    (xMin: any, xMax: any): number[] => {
      const tickPositions: number[] = [];
      const xMinDate = new Date(xMin);
      const xMaxDate = new Date(xMax);
      const xMinMonth = xMinDate.getMonth();
      const xMaxMonth = xMaxDate.getMonth();

      const xMinYear = xMinDate.getFullYear();
      const xMaxYear = xMaxDate.getFullYear();

      if (selectedTimespan === "max") {
        for (let year = xMinYear; year <= xMaxYear; year++) {
          for (let month = 0; month < 12; month = month + 4) {
            if (year === xMinYear && month < xMinMonth) continue;
            if (year === xMaxYear && month > xMaxMonth) continue;
            tickPositions.push(new Date(year, month, 1).getTime());
          }
        }
        return tickPositions;
      }

      for (let year = xMinYear; year <= xMaxYear; year++) {
        for (let month = 0; month < 12; month++) {
          if (year === xMinYear && month < xMinMonth) continue;
          if (year === xMaxYear && month > xMaxMonth) continue;
          tickPositions.push(new Date(year, month, 1).getTime());
        }
      }

      return tickPositions;
    },
    [selectedTimespan]
  );

  const getSeriesType = useCallback(
    (name: string) => {
      if (selectedScale === "percentage") return "area";

      if (name === "ethereum") return "area";

      return "column";
    },
    [selectedScale]
  );

  const formatNumber = useCallback((value: number) => {
    if (value < 1000) return value.toFixed(2);
    if (value < 1000000) return (value / 1000).toFixed(2) + "K";
    if (value < 1000000000) return (value / 1000000).toFixed(2) + "M";
    if (value < 1000000000000) return (value / 1000000000).toFixed(2) + "B";
    if (value < 1000000000000000)
      return (value / 1000000000000).toFixed(2) + "T";
    if (value < 1000000000000000000)
      return (value / 1000000000000000).toFixed(2) + "P";
    return (value / 1000000000000000000).toFixed(2) + "E";
  }, []);

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points } = this;
      const date = new Date(x);
      const dateString = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-80 text-xs font-raleway"><div class="w-full font-bold text-[1rem] ml-6 mb-2 opacity-50">${dateString}</div>`;
      const tooltipEnd = `</div>`;

      let pointsSum = 0;
      if (selectedScale !== "percentage")
        pointsSum = points.reduce((acc: number, point: any) => {
          acc += point.y;
          return pointsSum;
        }, 0);

      const tooltipPoints = points
        .sort((a: any, b: any) => b.y - a.y)
        .map((point: any) => {
          const { series, y, percentage } = point;
          const { name } = series;
          if (selectedScale === "percentage")
            return `
              <div class="flex w-full space-x-2 items-center font-medium mb-1">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${
                  AllChainsByKeys[name].colors[theme][0]
                }"></div>
                <div class="tooltip-point-name">${
                  AllChainsByKeys[name].label
                }</div>
                <div class="flex-1 text-right font-inter">${Highcharts.numberFormat(
                  percentage,
                  2
                )}%</div>
              </div>
              <!-- <div class="flex ml-6 w-[calc(100% - 24rem)] relative mb-1">
                <div class="h-[2px] w-full bg-gray-200 rounded-full absolute left-0 top-0" > </div>

                <div class="h-[2px] rounded-full absolute left-0 top-0" style="width: ${Highcharts.numberFormat(
                  percentage,
                  2
                )}%; background-color: ${
              AllChainsByKeys[name].colors[theme][0]
            };"> </div>
              </div> -->`;

          const value = formatNumber(y);
          return `
          <div class="flex w-full space-x-2 items-center font-medium mb-1">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${
              AllChainsByKeys[name].colors[theme][0]
            }"></div>
            <div class="tooltip-point-name text-md">${
              AllChainsByKeys[name].label
            }</div>
            <div class="flex-1 text-right justify-end font-inter">
              <div class="mr-1 inline-block">${parseFloat(y).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                }
              )}</div>
          <!-- <div class="inline-block">≈</div>
              <div class="inline-block">${value}</div>
              -->
            </div>
          </div>
          <!-- <div class="flex ml-4 w-[calc(100% - 1rem)] relative mb-1">
            <div class="h-[2px] w-full bg-gray-200 rounded-full absolute left-0 top-0" > </div>

            <div class="h-[2px] rounded-full absolute right-0 top-0" style="width: ${formatNumber(
              (y / pointsSum) * 100
            )}%; background-color: ${
            AllChainsByKeys[name].colors[theme][0]
          }33;"></div>
          </div> -->`;
        })
        .join("");
      return tooltip + tooltipPoints + tooltipEnd;
    },
    [formatNumber, selectedScale, theme]
  );

  const tooltipPositioner = useCallback(function (
    this: any,
    labelWidth: any,
    labelHeight: any,
    point: any
  ) {
    const { chart } = this;
    const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
    const { plotX } = point;

    const pos = {
      x: plotX - labelWidth / 2,
      y: plotTop + plotHeight / 2 - labelHeight,
    };

    if (pos.x < plotLeft) pos.x = plotLeft;
    if (pos.x + labelWidth > plotLeft + plotWidth)
      pos.x = plotLeft + plotWidth - labelWidth;

    // if (plotX < chart.plotLeft + labelWidth / 2)
    //   return { x: plotLeft, y: plotTop + plotHeight / 2 - labelHeight };
    // if (plotX > chart.plotLeft + plotWidth - labelWidth / 2)
    //   return {
    //     x: plotX - labelWidth,
    //     y: plotTop + plotHeight / 2 - labelHeight,
    //   };

    return pos;
  },
  []);

  const getNumColumnsVisible = useCallback(
    (data: any) => {
      if (showEthereumMainnet)
        return data
          .find((d: any) => d.name === "ethereum")
          .data.filter((d) => d[0] >= timespans[selectedTimespan].xMin).length;
      return data[1].data.filter(
        (d) => d[0] >= timespans[selectedTimespan].xMin
      ).length;
    },
    [showEthereumMainnet, selectedTimespan]
  );

  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);

  useEffect(() => {
    if (chartComponent.current) {
      chartComponent.current.xAxis[0].setExtremes(
        timespans[selectedTimespan].xMin,
        timespans[selectedTimespan].xMax
      );
    }
  }, [selectedTimespan, chartComponent]);

  const filteredData = useMemo(() => {
    if (!data) return null;
    return showEthereumMainnet
      ? data
      : data.filter((d) => d.name !== "ethereum");
  }, [data, showEthereumMainnet]);

  const options = useMemo((): Highcharts.Options => {
    const dynamicOptions: Highcharts.Options = {
      chart: {
        type: selectedScale === "percentage" ? "area" : "column",
      },
      plotOptions: {
        area: {
          stacking: selectedScale === "percentage" ? "percent" : "normal",
        },
        column: {
          pointPadding: getNumColumnsVisible(filteredData) / 500,
          // borderColor: "#ffffff",
          // borderWidth: 1,
          // shadow: {
          //   color: "#ffffff" + "ff",
          //   width: 1,
          // },
        },
      },

      legend: {
        enabled: false,
      },
      yAxis: {
        type: selectedScale === "log" ? "logarithmic" : "linear",
        labels: {
          style: {
            color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
          },
        },
        gridLineColor:
          theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
      },
      xAxis: {
        min: timespans[selectedTimespan].xMin,
        max: timespans[selectedTimespan].xMax,
        // calculate tick positions based on the selected time interval so that the ticks are aligned to the first day of the month
        tickPositions: getTickPositions(
          timespans[selectedTimespan].xMin,
          timespans[selectedTimespan].xMax
        ),
        labels: {
          style: {
            color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
          },
        },
      },
      tooltip: {
        formatter: tooltipFormatter,
        // positioner: tooltipPositioner,
        followPointer: true,
        backgroundColor:
          theme === "light"
            ? customTheme.extend.colors["forest"]["800"]
            : customTheme.extend.colors["forest"]["50"],
        borderRadius: 17,
        borderWidth: 0,
        padding: 0,

        style: {
          color: theme === "light" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
        },
      },
      series: [
        ...filteredData
          .sort((a, b) => {
            if (selectedScale === "percentage")
              return (
                a.data[a.data.length - 1][1] - b.data[b.data.length - 1][1]
              );
            else {
              return (
                b.data[b.data.length - 1][1] - a.data[a.data.length - 1][1]
              );
            }
          })
          .map((series: any, i: number) => {
            const zIndex = showEthereumMainnet
              ? series.name === "ethereum"
                ? 0
                : 10
              : 10;

            let borderRadius = "0%";

            if (showEthereumMainnet && i === 1) {
              borderRadius = "5%";
            } else if (i === 0) {
              borderRadius = "5%";
            }

            return {
              name: series.name,
              // always show ethereum on the bottom
              zIndex: zIndex,
              data: series.data.map((d: any) => [d[0], d[1]]),
              borderRadiusTopLeft: borderRadius,
              borderRadiusTopRight: borderRadius,

              // type: selectedScale === "percentage" ? "area" : "column",
              type: getSeriesType(series.name),
              // fill if series name is ethereum
              fillOpacity: series.name === "ethereum" ? 1 : 0,
              fillColor: {
                linearGradient: {
                  x1: 0,
                  y1: 0,
                  x2: 0,
                  y2: 1,
                },
                stops: [
                  [0, AllChainsByKeys[series.name].colors[theme][0] + "99"],
                  [0.33, AllChainsByKeys[series.name].colors[theme][1] + "33"],
                  [0.66, AllChainsByKeys[series.name].colors[theme][1] + "00"],
                ],
              },
              borderColor: AllChainsByKeys[series.name].colors[theme][0] + "33",
              borderWidth: 1,
              shadow: {
                color: AllChainsByKeys[series.name].colors[theme][1] + "33",
                width: 8,
              },

              color: {
                linearGradient: {
                  x1: 0,
                  y1: 0,
                  x2: 0,
                  y2: 1,
                },
                stops: [
                  [0, AllChainsByKeys[series.name].colors[theme][0] + "FF"],
                  [0.7, AllChainsByKeys[series.name].colors[theme][0] + "44"],
                  [1, AllChainsByKeys[series.name].colors[theme][0] + "22"],
                ],
              },
              states: {
                hover: {
                  enabled: true,
                  halo: {
                    size: 5,
                    opacity: 1,
                    attributes: {
                      fill:
                        AllChainsByKeys[series.name].colors[theme][0] + "99",
                      stroke:
                        AllChainsByKeys[series.name].colors[theme][0] + "66",
                      "stroke-width": 0,
                    },
                  },
                  brightness: 0.3,
                },
                inactive: {
                  enabled: true,
                  opacity: 0.6,
                },
              },
            };
          }),
      ],
    };

    return _merge({}, baseOptions, dynamicOptions);
  }, [
    filteredData,
    getNumColumnsVisible,
    getSeriesType,
    getTickPositions,
    selectedScale,
    selectedTimespan,
    showEthereumMainnet,
    theme,
    tooltipFormatter,
  ]);

  useEffect(() => {
    if (chartComponent.current) {
      switch (selectedScale) {
        case "absolute":
          chartComponent.current?.update({
            plotOptions: {
              series: {
                stacking: "normal",
              },
            },
            yAxis: {
              type: "linear",
            },
            tooltip: {
              formatter: tooltipFormatter,
            },
            series: filteredData.map((series: any) => ({
              ...series,
              type: getSeriesType(series.name),
            })),
          });
          break;
        case "log":
          chartComponent.current?.update({
            chart: {
              type: "column",
            },
            plotOptions: {
              series: {
                stacking: "normal",
              },
            },
            yAxis: {
              type: "logarithmic",
            },
            tooltip: {
              formatter: tooltipFormatter,
            },
            series: filteredData.map((series: any) => ({
              ...series,
              type: getSeriesType(series.name),
            })),
          });
          break;
        case "percentage":
          chartComponent.current?.update({
            chart: {
              type: "area",
            },
            plotOptions: {
              area: {
                stacking: "percent",
                marker: {
                  enabled: false,
                },
              },
            },
            yAxis: {
              type: "linear",
            },
            tooltip: {
              formatter: tooltipFormatter,
            },
            series: filteredData.map((series: any) => ({
              ...series,
              type: getSeriesType(series.name),
            })),
          });
          break;
        default:
          break;
      }
    }
  }, [
    selectedScale,
    chartComponent,
    filteredData,
    tooltipFormatter,
    getSeriesType,
  ]);

  useEffect(() => {
    if (chartComponent.current) {
      chartComponent.current.reflow();
    }
  }, [chartComponent, filteredData]);

  const toggleFullScreen = () => {
    // @ts-ignore
    chartComponent.current?.chart?.fullScreen.toggle();
  };

  return (
    <div className="w-full my-[8rem] relative">
      <div className="flex w-full justify-between items-center absolute -top-32 left-0 right-0 text-xs rounded-full bg-forest-50 p-0.5">
        <div className="flex justify-center items-center space-x-1">
          <button
            className={`rounded-full px-2 py-1.5 text-md lg:px-4 lg:py-3 lg:text-md xl:px-4 xl:py-3 xl:text-lg font-medium ${
              "absolute" === selectedScale
                ? "bg-forest-900 text-forest-50"
                : "hover:bg-forest-100"
            }`}
            onClick={() => {
              setSelectedScale("absolute");
            }}
          >
            Total Users
          </button>
          <button
            className={`rounded-full px-2 py-1.5 text-md lg:px-4 lg:py-3 lg:text-md xl:px-4 xl:py-3 xl:text-lg font-medium ${
              "log" === selectedScale
                ? "bg-forest-900 text-forest-50"
                : "hover:bg-forest-100"
            }`}
            onClick={() => {
              setSelectedScale("log");
            }}
          >
            Users per Chain
          </button>
          <button
            className={`rounded-full px-2 py-1.5 text-md lg:px-4 lg:py-3 lg:text-md xl:px-4 xl:py-3 xl:text-lg font-medium ${
              "percentage" === selectedScale
                ? "bg-forest-900 text-forest-50"
                : "hover:bg-forest-100"
            }`}
            onClick={() => {
              setSelectedScale("percentage");
            }}
          >
            Percentage
          </button>
          {/* {showTimeIntervals &&
            timeIntervals.map((timeInterval, i) => (
              <button
                key={timeInterval}
                className={`rounded-full px-2 py-1 font-medium capitalize ${
                  selectedTimeInterval === timeInterval
                    ? "bg-forest-900 text-forest-50 hover:bg-forest-700"
                    : "hover:bg-forest-100"
                }`}
                onClick={() => {
                  onTimeIntervalChange(timeInterval);
                  // chartComponent.current?.xAxis[0].setExtremes(
                  //   timespans[timespan].xMin,
                  //   timespans[timespan].xMax
                  // );
                }}
              >
                {timeInterval}
              </button>
            ))} */}
        </div>
        <div className="flex justify-center items-center space-x-1">
          {Object.keys(timespans).map((timespan) => (
            <button
              key={timespan}
              className={`rounded-full px-2 py-1.5 text-md lg:px-4 lg:py-3 lg:text-md xl:px-4 xl:py-3 xl:text-lg font-medium ${
                selectedTimespan === timespan
                  ? "bg-forest-900 text-forest-50 hover:bg-forest-700"
                  : "hover:bg-forest-100"
              }`}
              onClick={() => {
                setSelectedTimespan(timespan);
                // chartComponent.current?.xAxis[0].setExtremes(
                //   timespans[timespan].xMin,
                //   timespans[timespan].xMax
                // );
              }}
            >
              {timespans[timespan].label}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full py-4 rounded-xl">
        <div className="w-full h-[26rem] relative rounded-xl">
          <div className="absolute w-full h-[24rem] top-4">
            {highchartsLoaded && (
              <HighchartsReact
                highcharts={Highcharts}
                options={options}
                ref={(chart) => {
                  chartComponent.current = chart?.chart;
                }}

                // immutable={true}
                // oneToOne={true}
                // callBack={(chart) => {
                // 	setChart(chart);
                // }}
              />
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center absolute -bottom-10 left-0 right-0 rounded-full bg-forest-50 p-0.5">
        {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
        {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
        {/* toggle ETH */}
        <Switch
          checked={showEthereumMainnet}
          onChange={() => setShowEthereumMainnet(!showEthereumMainnet)}
          rightLabel="Show Ethereum"
        />

        {/* <button
            className={`rounded-full px-2 py-1 text-xs font-bold
            ${
              showEthereumMainnet
                ? "bg-forest-900 text-forest-50 hover:bg-forest-700"
                : "bg-transparent text-forest-800 hover:bg-forest-700"
            }`}
            onClick={() => setShowEthereumMainnet(!showEthereumMainnet)}
          >
            {showEthereumMainnet ? "Hide ETH Mainnet" : "Show ETH Mainnet"}
          </button> */}
        {/* </div> */}
        <div className="flex justify-center items-center space-x-1"></div>
      </div>
    </div>
  );
}
