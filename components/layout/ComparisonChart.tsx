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

const COLORS = {
  GRID: "#262e48",
  PLOT_LINE: "#6675a3",
  LABEL: "#8490b5",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135", // mignight-express but lighter
  ANNOTATION_BG: "#293350",
  // visx
  // SERIES: ["#0b7285", "#66d9e8", "#fcc419", "#ff8787", "#9c36b5", "#cc5de8", "#a61e4d"],
  // chart.js
  SERIES: ["#36a2eb", "#ff6384", "#8142ff", "#ff9f40", "#ffcd56", "#4bc0c0"],
};

const baseOptions: Highcharts.Options = {
  accessibility: { enabled: false },
  exporting: { enabled: false },
  chart: {
    type: "line",
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
    gridLineWidth: 0,
  },
  xAxis: {
    type: "datetime",
    lineWidth: 0,
    labels: {
      style: { color: COLORS.LABEL },
      enabled: false,
    },
    tickWidth: 4,
    tickLength: 4,
    minPadding: 0.04,
    maxPadding: 0.04,
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
  },
  plotOptions: {
    spline: {
      lineWidth: 2,
    },
    series: {
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
  "30d": {
    label: "30d",
    value: 30,
    xMin: Date.now() - 30 * 24 * 60 * 60 * 1000,
    xMax: Date.now(),
  },
  "90d": {
    label: "90d",
    value: 90,
    xMin: Date.now() - 90 * 24 * 60 * 60 * 1000,
    xMax: Date.now(),
  },
  "180d": {
    label: "180d",
    value: 180,
    xMin: Date.now() - 180 * 24 * 60 * 60 * 1000,
    xMax: Date.now(),
  },
  "365d": {
    label: "1y",
    value: 365,
    xMin: Date.now() - 365 * 24 * 60 * 60 * 1000,
    xMax: Date.now(),
  },
  max: {
    label: "Max",
    value: 0,
    xMin: Date.parse("2020-09-28"),
    xMax: Date.now(),
  },
};

type MainChartProps = {
  data: {
    name: string;
    data: any;
    types: any[];
  };
  dataKeys: string[];
};

export default function ComparisonChart({
  data,
  timeIntervals,
  onTimeIntervalChange,
}: {
  data: any;
  timeIntervals: string[];
  onTimeIntervalChange: (interval: string) => void;
}) {
  // const [data, setData] = useLocalStorage('data', null);
  // const [options, setOptions] = useState<HighchartsReact.Props['options']>(

  // );

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

  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    "selectedTimespan",
    "30d"
  );

  const [selectedScale, setSelectedScale] = useSessionStorage(
    "selectedScale",
    "absolute"
  );

  const [selectedTimeInterval, setSelectedTimeInterval] = useSessionStorage(
    "selectedTimeInterval",
    "daily"
  );

  // const [timeIntervals, setTimeIntervals] = useState<any>([]);

  // const [timespan, setTimespan] = useLocalStorage("timespan", timespans.max);

  const colors: { [key: string]: string[] } = useMemo(() => {
    if (theme === "dark") {
      return {
        ethereum: [zinc[400], zinc[600], zinc[700]],
        arbitrum: [red[400], red[600], red[700]],
        optimism: [blue[400], blue[600], blue[700]],
        polygon: [purple[400], purple[600], purple[700]],
        loopring: [amber[300], amber[500], amber[600]],
      };
    }
    return {
      ethereum: [zinc[400], zinc[700], zinc[700]],
      arbitrum: [red[600], red[700], red[700]],
      optimism: [blue[500], blue[700], blue[700]],
      polygon: [purple[500], purple[700], purple[700]],
      loopring: [amber[400], amber[600], amber[600]],
    };
  }, [theme]);

  // const bgColors: { [key: string]: string[] } = {
  //     ethereum: ['bg-[#141E30]', 'bg-[#344B66]'],
  //     arbitrum: ['bg-[#7F7FD5]', 'bg-[#86A8E7]'],
  //     optimism: ['bg-[#ff9a9e]', 'bg-[#fad0c4]'],
  //     loopring: ['bg-[#f6d365]', 'bg-[#fda085]'],
  // };

  const bgColors: { [key: string]: string[] } = useMemo(() => {
    if (theme === "dark") {
      return {
        ethereum: ["bg-zinc-400", "bg-zinc-500"],
        arbitrum: ["bg-red-300", "bg-red-500"],
        optimism: ["bg-blue-300", "bg-blue-500"],
        polygon: ["bg-purple-300", "bg-purple-500"],
        loopring: ["bg-yellow-300", "bg-yellow-500"],
      };
    }
    return {
      ethereum: [zinc[400], zinc[700]],
      arbitrum: [red[600], red[700]],
      optimism: [blue[500], blue[700]],
      polygon: [purple[500], purple[700]],
      loopring: [amber[400], amber[600]],
    };
  }, [theme]);

  const options = useMemo((): Highcharts.Options => {
    const dynamicOptions: Highcharts.Options = {
      legend: {
        enabled: false,
      },
      xAxis: {
        min: timespans[selectedTimespan].xMin,
        max: timespans[selectedTimespan].xMax,
      },
      series: data.map((series: any) => ({
        name: series.name,
        data:
          !showUsd && series.types.includes("usd")
            ? series.data
                .sort((a: any, b: any) => a[0] - b[0])
                .map((d: any) => [d[0], d[2]])
            : series.data
                .sort((a: any, b: any) => a[0] - b[0])
                .map((d: any) => [d[0], d[1]]),

        type: "spline",
        shadow: {
          color: colors[series.name][1] + "33",
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
            [0, colors[series.name][0]],
            [0.33, colors[series.name][1]],
            [1, colors[series.name][2]],
          ],
        },
        // shadow: {
        // 	color: bgColors[series.name][0],
        // 	width: 15,
        // },
      })),

      // tooltip: {
      // 	// backgroundColor: 'transparent',

      // 	borderWidth: 0,
      // 	shadow: false,
      // 	headerFormat: '',
      // },
    };

    return _merge({}, baseOptions, dynamicOptions);
  }, [data, colors, bgColors, showUsd]);

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
                stacking: undefined,
              },
            },
            yAxis: {
              type: "linear",
            },
            tooltip: {
              pointFormat:
                '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
            },
            series: data.map((series: any) => ({
              ...series,
              type: "spline",
            })),
          });
          break;
        case "log":
          chartComponent.current?.update({
            chart: {
              type: "spline",
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
              pointFormat:
                '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
            },
            series: data.map((series: any) => ({
              ...series,
              type: "spline",
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
              pointFormat:
                '<span style="color:{series.color}">{series.name}</span>: <b>{point.percentage:.1f}%</b><br/>',
            },
            series: data.map((series: any) => ({
              ...series,
              type: "area",
            })),
          });
          break;
        default:
          break;
      }
    }
  }, [selectedScale, chartComponent]);

  useEffect(() => {
    if (chartComponent.current) {
      chartComponent.current.reflow();
    }
  }, [chartComponent, data]);

  const toggleFullScreen = () => {
    // @ts-ignore
    chartComponent.current?.chart?.fullScreen.toggle();
  };

  return (
    <div className="w-full my-12 relative">
      <div className="flex w-full justify-between items-center absolute -top-10 left-0">
        <div className="flex justify-center items-center">
          {timeIntervals.map((timeInterval) => (
            <button
              key={timeInterval}
              className={`rounded-full px-3 py-1.5 mr-2 text-sm font-medium capitalize ${
                selectedTimeInterval === timeInterval
                  ? "bg-forest-800 text-forest-50"
                  : ""
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
          ))}
        </div>
        <div className="flex justify-center items-center">
          {Object.keys(timespans).map((timespan) => (
            <button
              key={timespan}
              className={`rounded-full px-3 py-1.5 mr-2 text-sm font-medium ${
                selectedTimespan === timespan
                  ? "bg-forest-800 text-forest-50"
                  : ""
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
      <div className="w-full p-4 rounded-xl bg-forest-50">
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
      <div className="flex justify-end items-center absolute -bottom-10 -right-2">
        {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}

        <div className="flex justify-center items-center">
          <button
            className={`rounded-full px-2 py-1 mr-2 text-xs font-bold ${
              "absolute" === selectedScale ? "bg-forest-800 text-forest-50" : ""
            }`}
            onClick={() => {
              setSelectedScale("log" === selectedScale ? "absolute" : "log");
            }}
          >
            <span className=" font-bold text-[0.6rem] font-mono mr-0.5">
              {"<>"}
            </span>
            Absolute
          </button>
          <button
            className={`rounded-full px-2 py-1 mr-2 text-xs font-bold ${
              "log" === selectedScale ? "bg-forest-800 text-forest-50" : ""
            }`}
            onClick={() => {
              setSelectedScale("log" === selectedScale ? "absolute" : "log");
            }}
          >
            <ArrowTrendingUpIcon className="w-3 h-3 font-bold inline-block mr-0.5" />
            Log
          </button>
          <button
            className={`rounded-full px-2 py-1 mr-2 text-xs font-bold ${
              "percentage" === selectedScale
                ? "bg-forest-800 text-forest-50"
                : ""
            }`}
            onClick={() => {
              setSelectedScale(
                "percentage" === selectedScale ? "absolute" : "percentage"
              );
            }}
          >
            <span className="font-bold text-[0.6rem]">%</span> Percentage
          </button>
        </div>
      </div>
    </div>
  );
}
