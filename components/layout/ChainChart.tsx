"use client";

import HighchartsReact from "highcharts-react-official";
import Highcharts, { chart } from "highcharts";
import highchartsAnnotations from "highcharts/modules/annotations";

import { useState, useEffect, useMemo, useRef } from "react";
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

  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);

  useEffect(() => {
    if (chartComponent.current) {
      chartComponent.current.xAxis[0].setExtremes(
        timespans[selectedTimespan].xMin,
        timespans[selectedTimespan].xMax
      );
    }
  }, [selectedTimespan, chartComponent]);

  const options = {

    title: {
      text: null
    },
    series: [{
      data: data.metrics['daa'].daily.data,
      showInLegend: false
    }],
    
    chart: {
      type: 'areaspline',
      backgroundColor: null,
      width: null,
      height: 250,
      margin: [0, 0, 0, 0],
      style: {
        borderRadius: '0 0 16px 12px',
      },
    },
  
    plotOptions: {
      series: {
          color: '#5A6462',
          fillColor: '#5A6462',
      }
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
    }
  
  
  }

  console.log(data);
  console.log(timespans[selectedTimespan].xMax)
  console.log(getTickPositions(timespans[selectedTimespan].xMin, timespans[selectedTimespan].xMax))

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
                /*  ? "bg-blue-600 text-white dark:bg-forest-500 dark:text-forest-50 hover:bg-forest-200"
                : "hover:bg-forest-100" */
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
        {/*<HighchartsReact
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
            */}


        {data && (
          <div className="pt-8">
            <div className="flex-col gap-x-6 justify-start ml-12 gap-y-8 lg:flex-row lg:justify-center lg:ml-0 lg:gap-y-0">
              {Object.keys(data.metrics).map((key) => (
                <div key={key} className="relative dark:bg-[#2A3433] bg-blue-600 rounded-xl w-[40rem] h-[20rem] ">
                  <div className="absolute inset-0 top-[4.3rem]">
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={{
                        ...options,
                        series: [
                          {
                            data: data.metrics[key].daily.data,
                            showInLegend: false
                          },
                        ],
                      }}
                      ref={(chart) => {
                        chartComponent.current = chart?.chart;
                      }}
                    />
                  </div>
                  <div className="relative z-10">
                    <div className="flex">
                      <h1 className="pt-[1rem] pl-6 text-3xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282] dark:text-[#CDD8D3]">
                        {data.metrics[key].metric_name}
                      </h1>
                      <BanknotesIcon className="absolute h-[75px] w-[94px] text-blue-500 bottom-[11rem] left-[32rem] mr-4 dark:text-[#CDD8D3]" />
                    </div>
                    <div className="flex pt-44 pl-6 pr-6 justify-between">
                      <h1 className="text-white text-4xl font-[700] dark:text-[#CDD8D3]">
                        10,000,000
                      </h1>
                      <h1 className="text-white text-xl font-[700] self-center dark:text-[#CDD8D3]">
                        5 April 2023
                      </h1>
                    </div>
                  </div>
                </div>
                ))}
              </div>
          </div>
        )}
        {/** 
        <div className="flex-col pt-8">
        <div className="flex flex-col gap-x-6 justify-start ml-12 gap-y-8 lg:flex-row lg:justify-center lg:ml-0 lg:gap-y-0">
        <div className="relative dark:bg-[#2A3433] bg-blue-600 rounded-xl w-[40rem] h-[20rem] ">
            <div className="absolute inset-0 top-[4.3rem]">
              <HighchartsReact
                highcharts={Highcharts}
                options={options}
                ref={(chart) => {
                  chartComponent.current = chart?.chart;
                }}
              />
            </div>
            <div className="relative z-10">
              <div className="flex">
                <h1 className="pt-[1rem] pl-6 text-3xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282] dark:text-[#CDD8D3]">
                  Metric Title
                </h1>
                <BanknotesIcon className="absolute h-[75px] w-[94px] text-blue-500 bottom-[10.5rem] left-[32rem] mr-4 dark:text-[#CDD8D3]" />
              </div>
              <div className="flex pt-44 pl-6 pr-6 justify-between">
                <h1 className="text-white text-4xl font-[700] dark:text-[#CDD8D3]">
                  10,000,000
                </h1>
                <h1 className="text-white text-xl font-[700] self-center dark:text-[#CDD8D3]">
                  5 April 2023
                </h1>
              </div>
            </div>
          </div>
          <div className="dark:bg-[#2A3433] bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <div className="dark:bg-[#2A3433] bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
              <h1 className="pt-[1rem] pl-6 text-3xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282] dark:text-[#CDD8D3]">
                Metric Title
              </h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col pt-8 gap-x-6 justify-start ml-12 gap-y-8 lg:flex-row lg:justify-center lg:ml-0">
          <div className="dark:bg-[#2A3433] bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <div className="dark:bg-[#2A3433]bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
              <h1 className="pt-[1rem] pl-6 text-3xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282] dark:text-[#CDD8D3]">
                Metric Title
              </h1>
            </div>
          </div>
          <div className="dark:bg-[#2A3433] bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <div className="dark:bg-[#2A3433] bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
              <h1 className="pt-[1rem] pl-6 text-3xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282] dark:text-[#CDD8D3]">
                Metric Title
              </h1>
            </div>
          </div>
        </div>
       
      </div>
      */}
    </div>

  );
}
