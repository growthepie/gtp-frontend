"use client";

import HighchartsReact from "highcharts-react-official";
import Highcharts, { chart } from "highcharts";
import highchartsAnnotations from "highcharts/modules/annotations";
import { useState, useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/Card";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import fullScreen from "highcharts/modules/full-screen";
import _merge from "lodash/merge";
import { zinc, red, blue, amber, purple } from "tailwindcss/colors";
import { ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import _ from "lodash";
import { Switch } from "../Switch";
import { AllChains, AllChainsByKeys } from "@/lib/chains";

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
    xDateFormat: "%Y-%m-%d",
    valueDecimals: 2,
    useHTML: true,
    borderWidth: 0,
    shadow: false,
    shared: true,
    formatter: function (tooltip) {
      var items = this.points || splat(this),
        series = items[0].series,
        s;

      // sort the values
      items.sort(function (a, b) {
        return a.y < b.y ? -1 : a.y > b.y ? 1 : 0;
      });
      items.reverse();

      return tooltip.defaultFormatter.call(this, tooltip);
    },
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
      borderWidth: 0,
      // make columns touch each other
      pointWidth: undefined,
      groupPadding: 0.0,
      pointPadding: 0,
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
  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });
    highchartsAnnotations(Highcharts);
    fullScreen(Highcharts);
  }, []);

  // const [darkMode, setDarkMode] = useLocalStorage("darkMode", true);
  const { theme } = useTheme();

  const [showUsd, setShowUsd] = useSessionStorage("showUsd", true);

  const [selectedTimespan, setSelectedTimespan] = useState("180d");

  const [selectedScale, setSelectedScale] = useState("log");

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");

  const [showEthereumMainnet, setShowEthereumMainnet] = useState(false);

  function getTickPositions(xMin: any, xMax: any): number[] {
    const tickPositions: number[] = [];
    const xMinDate = new Date(xMin);
    const xMaxDate = new Date(xMax);
    const xMinMonth = xMinDate.getMonth();
    const xMaxMonth = xMaxDate.getMonth();
    const xMinYear = xMinDate.getFullYear();
    const xMaxYear = xMaxDate.getFullYear();

    for (let year = xMinYear; year <= xMaxYear; year++) {
      for (let month = 0; month < 12; month++) {
        if (year === xMinYear && month < xMinMonth) continue;
        if (year === xMaxYear && month > xMaxMonth) continue;
        tickPositions.push(new Date(year, month, 1).getTime());
      }
    }

    return tickPositions;
  }

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
      series: filteredData.map((series: any) => ({
        name: series.name,
        data: series.data.map((d: any) => [d[0], d[1]]),

        type: selectedScale === "percentage" ? "area" : "column",
        shadow: {
          color: AllChainsByKeys[series.name].colors[1] + "33",
          width: 0,
        },
        color: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
          },
          stops: [
            [0, AllChainsByKeys[series.name].colors[0]],
            // [0.5, AllChainsByKeys[series.name].colors[1]],
            [1, AllChainsByKeys[series.name].colors[0]],
          ],
        },
      })),
    };

    return _merge({}, baseOptions, dynamicOptions);
  }, [filteredData, selectedTimespan, showUsd, theme]);

  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);

  useEffect(() => {
    if (chartComponent.current) {
      chartComponent.current.xAxis[0].setExtremes(
        timespans[selectedTimespan].xMin,
        timespans[selectedTimespan].xMax
      );
    }
  }, [selectedTimespan, chartComponent]);

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
              useHTML: true,
              pointFormat:
                '<span style="color:{series.color.stops[0][1]}">{series.name}</span>: <b>{point.y}</b><br/>',
            },
            series: filteredData.map((series: any) => ({
              ...series,
              type: "column",
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
              useHTML: true,
              pointFormat:
                '<span style="color:{series.color.stops[0][1]}">{series.name}</span>: <b>{point.y}</b><br/>',
            },
            series: filteredData.map((series: any) => ({
              ...series,
              type: "column",
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
              useHTML: true,
              pointFormat: `<span style="color:{series.color.stops[0][1]}">{series.name}</span>: <b>{point.percentage:.1f}%</b><br/>`,
            },
            series: filteredData.map((series: any) => ({
              ...series,
              type: "area",
            })),
          });
          break;
        default:
          break;
      }
    }
  }, [selectedScale, chartComponent, filteredData]);

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
      <div className="flex w-full justify-between items-center absolute -top-32 left-0 right-0 text-xs rounded-full bg-forest-50 p-0.5 font-inter">
        <div className="flex justify-center items-center space-x-1">
          <button
            className={`rounded-full px-4 py-3 text-lg font-medium ${
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
            className={`rounded-full px-4 py-3 text-lg font-medium ${
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
            className={`rounded-full px-4 py-3 text-lg font-medium ${
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
              className={`rounded-full px-4 py-3 text-lg font-medium ${
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
