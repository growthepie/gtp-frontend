"use client";

import HighchartsReact from "highcharts-react-official";
import Highcharts, { chart } from "highcharts";
import highchartsAnnotations from "highcharts/modules/annotations";
import { useEffect, useMemo, useRef } from "react";
// import { Card } from "@/components/Card";
// import { useLocalStorage } from "usehooks-ts";
import fullScreen from "highcharts/modules/full-screen";
import _merge from "lodash/merge";
import { zinc, red, blue, amber } from "tailwindcss/colors";
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

type MainChartProps = {
  data: any;
};

export default function MainChart({ data }: { data: any }) {
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

  const colors: { [key: string]: string[] } = useMemo(() => {
    if (theme === "dark") {
      return {
        ethereum: [zinc[400], zinc[600], zinc[700]],
        arbitrum: [red[400], red[600], red[700]],
        optimism: [blue[400], blue[600], blue[700]],
        loopring: [amber[300], amber[500], amber[600]],
      };
    }
    return {
      ethereum: [zinc[400], zinc[700], zinc[700]],
      arbitrum: [red[600], red[700], red[700]],
      optimism: [blue[500], blue[700], blue[700]],
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
        loopring: ["bg-yellow-300", "bg-yellow-500"],
      };
    }
    return {
      ethereum: [zinc[400], zinc[700]],
      arbitrum: [red[600], red[700]],
      optimism: [blue[500], blue[700]],
      loopring: [amber[400], amber[600]],
    };
  }, [theme]);

  const options = useMemo((): Highcharts.Options => {
    const dynamicOptions: Highcharts.Options = {
      legend: {
        enabled: false,
      },
      series: data.map((series: any) => ({
        name: series.name,
        data: series.data.sort((a: any, b: any) => a[0] - b[0]),
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
  }, [data, colors, bgColors]);

  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);

  const toggleFullScreen = () => {
    // @ts-ignore
    chartComponent.current?.chart?.fullScreen.toggle();
  };

  return (
    <div className="w-full">
      <div className="w-full h-[26rem] relative">
        <div className="absolute w-full h-96">
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
      {chartComponent.current && (
        <div className="flex justify-between items-center">
          {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
          <div className="flex justify-center items-center">
            <button
              className="bg-zinc-100 text-zinc-600   rounded-xl px-2 py-1 mr-2 text-xs font-bold"
              onClick={() => {
                chartComponent.current?.xAxis[0].setExtremes(
                  Date.now() - 1000 * 60 * 60 * 24 * 30,
                  Date.now()
                );
              }}
            >
              30d
            </button>
            <button
              className="bg-zinc-100 text-zinc-600   rounded-xl px-2 py-1 mr-2 text-xs font-bold"
              onClick={() => {
                chartComponent.current?.xAxis[0].setExtremes(
                  Date.now() - 1000 * 60 * 60 * 24 * 30 * 6,
                  Date.now()
                );
              }}
            >
              6m
            </button>
            <button
              className="bg-zinc-100 text-zinc-600   rounded-xl px-2 py-1 mr-2 text-xs font-bold"
              onClick={() => {
                chartComponent.current?.xAxis[0].setExtremes(
                  Date.now() - 1000 * 60 * 60 * 24 * 30 * 12,
                  Date.now()
                );
              }}
            >
              1y
            </button>
            <button
              className="bg-zinc-100 text-zinc-600   rounded-xl px-2 py-1 mr-2 text-xs font-bold"
              onClick={() => chartComponent.current?.xAxis[0].setExtremes()}
            >
              Max
            </button>
          </div>
          <div className="flex justify-center items-center">
            <button
              className="bg-zinc-100 text-zinc-600   rounded-xl px-2 py-1 mr-2 text-xs font-bold"
              onClick={() => {
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
                    pointFormat:
                      '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
                  },
                  series: data.map((series: any) => ({
                    ...series,
                    type: "spline",
                  })),
                });
              }}
            >
              <span className=" font-bold text-[0.6rem] font-mono mr-0.5">
                {"<>"}
              </span>
              Absolute
            </button>
            <button
              className="bg-zinc-100 text-zinc-600   rounded-xl px-2 py-1 mr-2 text-xs font-bold"
              onClick={() => {
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
              }}
            >
              <ArrowTrendingUpIcon className="w-3 h-3 font-bold inline-block mr-0.5" />
              Log
            </button>
            <button
              className="bg-zinc-100 text-zinc-600   rounded-xl px-2 py-1 mr-2 text-xs font-bold"
              onClick={() =>
                chartComponent.current?.update({
                  chart: {
                    type: "area",
                  },
                  plotOptions: {
                    // series: {
                    // 	stacking: 'percent',
                    // },
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
                })
              }
            >
              <span className="font-bold text-[0.6rem]">%</span> Percentage
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
