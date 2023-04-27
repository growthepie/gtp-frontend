"use client";

import HighchartsReact from "highcharts-react-official";
import Highcharts, { chart } from "highcharts";
import highchartsAnnotations from "highcharts/modules/annotations";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Card } from "@/components/Card";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import fullScreen from "highcharts/modules/full-screen";
import _merge from "lodash/merge";
import { zinc, red, blue, amber, purple, transparent } from "tailwindcss/colors";
import { BanknotesIcon } from "@heroicons/react/24/solid";
import {
  ArrowTopRightOnSquareIcon,
  LinkIcon,
  AtSymbolIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import _ from "lodash";
import { AllChains } from "@/lib/chains";



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
    xMin: Date.parse("2021-01-01"),
    xMax: Date.now(),
  },
};

export default function ChainChart({
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
  const [hoverIndex, setHoverIndex] = useState(0);
  const [hoverData, setHoverData] = useState({ x:  data.metrics['daa'].daily.data[((data.metrics['daa'].daily.data).length - 1)][0], y: null });
  const [hoverKey, setHoverKey] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(1);



  const chartStyle = useMemo(() => {
    if (!data || !AllChains) return [];

    let result = null;

    AllChains.forEach(chain => {
      if (chain.key === data.chain_id) {
        result = chain;
      }
    });

    return result;
  }, [data]);

  console.log(data)

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


  function hexToRgba(hex, alpha) {
    const hexWithoutHash = hex.replace("#", "");
    const r = parseInt(hexWithoutHash.substring(0, 2), 16);
    const g = parseInt(hexWithoutHash.substring(2, 4), 16);
    const b = parseInt(hexWithoutHash.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }


  function getDate(unix){

    const date = new Date(unix);
    const formattedDate = date.toLocaleString("en-us", { month: "short", day: "numeric", year: "numeric" });
    const dateParts = formattedDate.split(",");
    const [month, day, year] = dateParts[0].split(" ");
    const formattedDateStr = `${day} ${month} ${date.getFullYear()}`;
    return formattedDateStr;

  }

  const handleMouseOverWithKey = (key, event, index) => {
    handleMouseOver(event);
    manageHoverKey(key);
    setHoverIndex(data.metrics[key].daily.data.length - index - 1)
    
    console.log(hoverIndex)
    console.log(key)
  };

  const handleMouseOver = (event) => {
    
    const point = event.target.options;
    setHoverData({ x: point.x, y: point.y });
    
  };


  function manageHoverKey(key) {
    setHoverKey(key);
    
  };

  

  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);

  useEffect(() => {
    if (chartComponent.current) {
      chartComponent.current.xAxis[0].setExtremes(
        timespans[selectedTimespan].xMin,
        timespans[selectedTimespan].xMax
      );
    }
  }, [selectedTimespan, chartComponent]);

  
 
  console.log(chartStyle);
  /*
  const options = {

    title: {
      text: null
    },
    series: [{
      showInLegend: false,
      states: {
        hover: {
          lineWidthPlus: 0 // Disable the hover state for the series as well
        }
      }
    }],
    
    chart: {
      type: 'areaspline',
      backgroundColor: null,
      height: 250,
      margin: [0, 0, 0, 0],
      style: {
        borderRadius: '0 0 12px 12px',
      },
    },
  
    plotOptions: {
      series: {
          color: theme === "dark" ? chartStyle.colors.dark[0] : "rgb(247, 250, 252, 0.3)",
          fillColor: theme === "dark" ?
           `${hexToRgba(chartStyle.colors.dark[0], 0.3)}` : "rgb(247, 250, 252, 0.3)",
           boostThreshold: 1,
      },

      areaspline: {
        marker: {
          enabled: true, 
          symbol: 'circle', 
          radius: 4, 
          fillColor: 'white', 
          lineWidth: 1,
        },
      },
    },

    tooltip: {
      //formatter: tooltipFormatter,
      enabled: false
    },

    xAxis: {
      type: "datetime",
      labels: {
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
        enabled: false
      },
      min: timespans[selectedTimespan].xMin,
      max: timespans[selectedTimespan].xMax,

      tickPositions: getTickPositions(
        timespans[selectedTimespan].xMin,
        timespans[selectedTimespan].xMax
      ),

      lineWidth: 0,
      minorGridLineWidth: 0,
      lineColor: 'transparent',
      minorTickLength: 0,
      tickLength: 0
    },

    yAxis: {
      title: null,
      gridLineColor: transparent,
      labels: {
        enabled: false,
      }

    },

    credits: {
      enabled: false
    },
  

  
  }
  */
    const options: Highcharts.Options = {
      accessibility: { enabled: false },
      exporting: { enabled: false },
      chart: {
        type: 'areaspline',
        backgroundColor: null,
        height: 250,
        margin: [0, 0, 0, 0],
        style: {
          borderRadius: '0 0 12px 12px',
        },
      },
    
      title: undefined,
      yAxis: {
        title: { text: undefined },
        labels: {
          enabled: false,
        },
        gridLineWidth: 0,
        gridLineColor: COLORS.GRID,
      },
      xAxis: {
        type: "datetime",
        lineWidth: 0,
        crosshair: {
          width: 1,
          color: COLORS.PLOT_LINE,
          dashStyle: "LongDash",
        },
        min: timespans[selectedTimespan].xMin,
        max: timespans[selectedTimespan].xMax,
    
        labels: {
          style: { color: COLORS.LABEL },
          enabled: false,
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
        tickWidth: 0,
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
        enabled: false,
      },


      plotOptions: {
        line: {
          lineWidth: 2,
        },
        areaspline: {
          lineWidth: 2,
        },
        series: {
          color: theme === "dark" ? chartStyle.colors.dark[0] : "rgb(247, 250, 252, 0.3)",
          fillColor: theme === "dark" ?
           `${hexToRgba(chartStyle.colors.dark[0], 0.3)}` : "rgb(247, 250, 252, 0.3)",

          events: {
            
            legendItemClick: function () {
              return false;
            },
          },

          animation: false,
        },
      },
    
      credits: {
        enabled: false,
      },
    };
  

  return (

    <div className="w-44[rem] lg:w-[88rem] my-[1rem]">
      <div className="flex w-[40rem] lg:w-[82rem] ml-12 mr-14 justify-center lg:dark:justify-end items-center text-xs rounded-full dark:bg-[#2A3433] p-0.5 lg:justify-center">
        <div className="flex py-2 gap-x-8 justify-start items-center rounded-[999px] h-[60px] pr-6 ">
        {Object.keys(timespans).map((timespan) => (
            <button
            key={timespan}
            className={`rounded-full px-2 py-1.5 text-md lg:px-4 lg:py-3 lg:text-md xl:px-4 xl:py-3 xl:text-lg font-medium ${
                selectedTimespan === timespan
                ? "bg-blue-600 text-white dark:text-forest-900 dark:bg-forest-50"
                : "hover:bg-forest-100"
            }`}

            onClick={() => {
                setSelectedTimespan(timespan);

            }}
            >
            {timespans[timespan].label}
            </button>
        ))}
        </div>
      </div>

        {data && (
          <div className="pt-8">
            <div className="flex flex-col pl-0 gap-x-6 justify-start ml-12 gap-y-8 lg:flex-row lg:pl-[50px] lg:ml-0 lg:gap-y-0 flex-wrap">
              {Object.keys(data.metrics).map((key) => (
                <div key={key} className="relative dark:bg-[#2A3433] bg-blue-600 rounded-xl w-[40rem] h-[20rem] my-4">
                  <div className="absolute inset-0 top-[4.36rem]">
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={{
                        ...options,
                        series: [
                          {
                            data: data.metrics[key].daily.data,
                            showInLegend: false,
                            point: {
                              events: {
                                mouseOver: function(event) { 
                                  const index = this.index;
                                  handleMouseOverWithKey(key, event, index)
                                }

                              }
                            },

                            marker: {
                              enabled: false
                            }

                            
                          },
                        ],
                      }}
                      ref={(chart) => {
                        chartComponent.current = chart?.chart;
                      }}
                    />
                  </div>
                  <div className="relative z-10 pointer-events-none">
                    <div className="flex">
                      <h1 className="pt-[1rem] pl-6 text-3xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#5080ba] dark:text-[#CDD8D3] pointer-events-none">
                        {data.metrics[key].metric_name}
                      </h1>
                      <BanknotesIcon className="absolute h-[75px] w-[94px] text-blue-500 bottom-[11rem] left-[32rem] mr-4 dark:text-[#CDD8D3] pointer-events-none" />
                    </div>
                    <div className="flex pt-44 pl-6 pr-6 justify-between pointer-events-none">
                      <h1 className="text-white text-4xl font-[700] dark:text-[#CDD8D3] pointer-events-none">
                        {(data.metrics[key].daily.data.length) - hoverIndex > 0 ? ((data.metrics[key].daily.data.length) - hoverIndex === data.metrics[key].daily.data.length 
                              ? (data.metrics[key].daily.data[data.metrics[key].daily.data.length - 1][1])
                              : (data.metrics[key].daily.data[data.metrics[key].daily.data.length - hoverIndex][1]))
                            : data.metrics[key].daily.data[0][1]}
                      </h1>
                      {/*Checks if statistic is reaching the beginning or end of the data points */}
                      <h1 className="text-white text-xl font-[700] self-center dark:text-[#CDD8D3] pointer-events-none">
                      {(data.metrics[key].daily.data.length) - hoverIndex > 0 ? ((data.metrics[key].daily.data.length) - hoverIndex === data.metrics[key].daily.data.length 
                            ? getDate(data.metrics[key].daily.data[data.metrics[key].daily.data.length - 1][0])
                            : getDate(data.metrics[key].daily.data[data.metrics[key].daily.data.length - hoverIndex][0]))
                          : getDate(data.metrics[key].daily.data[0][0])}
                        {/*(data.metrics[key].daily.data.length) - hoverIndex >= 0 ? getDate((data.metrics[key].daily.data[(data.metrics[key].daily.data.length) - hoverIndex][0])) : getDate(data.metrics[key].daily.data[0][0])*/}
                      </h1>
                    </div>
                  </div>
                </div>
                ))}
              </div>
          </div>
        )}
                  
    </div>



  );
}
