"use client";

import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import highchartsAnnotations from "highcharts/modules/annotations";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
// import { Card } from "@/components/Card";
import { useSessionStorage } from "usehooks-ts";
import fullScreen from "highcharts/modules/full-screen";
import _merge from "lodash/merge";
import { BanknotesIcon } from "@heroicons/react/24/solid";
import {
  ArrowTopRightOnSquareIcon,
  LinkIcon,
  AtSymbolIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import _ from "lodash";
import { AllChains } from "@/lib/chains";
import { Icon } from "@iconify/react";
import Image from "next/image";

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
    xMax: Date.now() - 24 * 60 * 60 * 1000 * 2,
  },
  "180d": {
    label: "180 days",
    value: 180,
    xMin: Date.now() - 180 * 24 * 60 * 60 * 1000,
    xMax: Date.now() - 24 * 60 * 60 * 1000 * 2,
  },
  "365d": {
    label: "1 year",
    value: 365,
    xMin: Date.now() - 365 * 24 * 60 * 60 * 1000,
    xMax: Date.now() - 24 * 60 * 60 * 1000 * 2,
  },
  max: {
    label: "Maximum",
    value: 0,
    xMin: Date.parse("2021-01-01"),
    xMax: Date.now() - 24 * 60 * 60 * 1000 * 2,
  },
};

export default function ChainChart({ data }: { data: any }) {
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
  const [currentIndex, setCurrentIndex] = useState(1);

  const chartStyle = useMemo(() => {
    if (!AllChains || !data) return [];

    let result: any = null;

    AllChains.forEach((chain) => {
      if (chain.key === data.chain_id) {
        result = chain;
      }
    });

    return result;
  }, [data]);

  console.log(chartStyle);

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

  function getDate(unix) {
    const date = new Date(unix);
    const formattedDate = date.toLocaleString("en-us", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const dateParts = formattedDate.split(",");
    const [month, day, year] = dateParts[0].split(" ");
    const formattedDateStr = `${day} ${month} ${date.getFullYear()}`;
    return formattedDateStr;
  }

  const handleMouseOverWithKey = (key, index) => {
    setHoverIndex(data.metrics[key].daily.data.length - index - 1);
    //Hover index is set to distance from the highest index
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

  const options = {
    accessibility: { enabled: false },
    exporting: { enabled: false },
    chart: {
      type: "areaspline",
      backgroundColor: null,
      height: 250,
      margin: [0, 0, 0, 0],
      style: {
        borderRadius: "0 0 12px 12px",
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
    },
    tooltip: {
      enabled: false,
    },

    plotOptions: {
      line: {
        lineWidth: 2,
      },
      areaspline: {
        lineWidth: 2,
        marker: {
          radius: 12,
          lineWidth: 4,
        },
      },
      series: {
        color:
          chartStyle &&
          (theme === "dark"
            ? chartStyle.colors.dark[0]
            : "rgb(247, 250, 252, 0.3)"),
        fillColor:
          chartStyle &&
          (theme === "dark"
            ? `${hexToRgba(chartStyle.colors.dark[0], 0.3)}`
            : "rgb(247, 250, 252, 0.3)"),

        animation: false,
      },
    },

    credits: {
      enabled: false,
    },
  };
  //) : key === "txcount" ? (
  //   <Icon
  //     icon="feather:clock"
  //     className="absolute h-[60px] w-[74px] text-blue-500 bottom-[11.5rem] left-[32rem] mr-4 dark:text-[#CDD8D3] opacity-30 pointer-events-none"
  //   />
  // ) : key === "stables_mcap" ? (
  //   <Icon
  //     icon="feather:dollar-sign"
  //     className="absolute h-[60px] w-[74px] text-blue-500 bottom-[11.5rem] left-[32rem] mr-4 dark:text-[#CDD8D3] opacity-30 pointer-events-none"
  //   />
  // ) : key === "fees" ? (
  //   <Icon
  //     icon="feather:credit-card"
  //     className="absolute h-[60px] w-[74px] text-blue-500 bottom-[11.5rem] left-[32rem] mr-4 dark:text-[#CDD8D3] opacity-30 pointer-events-none"
  //   />
  // ) : (
  //   <Icon
  //     icon="feather:sunrise"
  //     className="absolute h-[60px] w-[74px] text-blue-500 bottom-[11.5rem] left-[32rem] mr-4 dark:text-[#CDD8D3] opacity-30 pointer-events-none"
  //   />
  // )}

  const getIcon = (key) => {
    switch (key) {
      case "tvl":
        return (
          <Icon
            icon="feather:star"
            className="absolute h-[60px] w-[74px] top-5 right-5 dark:text-[#CDD8D3] opacity-30 pointer-events-none"
          />
        );
      case "txcount":
        return (
          <Icon
            icon="feather:clock"
            className="absolute h-[60px] w-[74px] top-5 right-5 dark:text-[#CDD8D3] opacity-30 pointer-events-none"
          />
        );
      case "stables_mcap":
        return (
          <Icon
            icon="feather:dollar-sign"
            className="absolute h-[60px] w-[74px] top-5 right-5 dark:text-[#CDD8D3] opacity-30 pointer-events-none"
          />
        );
      case "fees":
        return (
          <Icon
            icon="feather:credit-card"
            className="absolute h-[60px] w-[74px] top-5 right-5 dark:text-[#CDD8D3] opacity-30 pointer-events-none"
          />
        );
      default:
        return (
          <Icon
            icon="feather:sunrise"
            className="absolute h-[60px] w-[74px] top-5 right-5 dark:text-[#CDD8D3] opacity-30 pointer-events-none"
          />
        );
    }
  };

  if (!chartStyle || !data) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
        <div>{JSON.stringify(chartStyle)}</div>
        <div>{JSON.stringify(data)}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex w-full justify-between items-center text-xs rounded-full bg-forest-50 p-0.5">
        <div className="flex justify-center items-center space-x-2">
          <Image
            src="/GTP-Metrics.png"
            alt="pie slice"
            width={36}
            height={36}
            className="ml-4"
          />
          <h2 className="text-[30px] font-bold">All Chain Metrics</h2>
        </div>
        <div className="flex justify-center items-center space-x-1">
          {Object.keys(timespans).map((timespan) => (
            <button
              key={timespan}
              className={`rounded-full px-2 py-1.5 text-md lg:px-4 lg:py-3 lg:text-md xl:px-4 xl:py-3 xl:text-lg font-medium ${
                selectedTimespan === timespan
                  ? "bg-forest-500 dark:bg-[#151A19]"
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.keys(data.metrics).map((key) => (
              <div
                key={key}
                className="relative dark:bg-[#2A3433] bg-blue-600 rounded-xl w-full h-[20rem] my-4"
              >
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
                              mouseOver: function (event) {
                                const index = this.index;
                                handleMouseOverWithKey(key, index);
                              },
                            },
                          },

                          marker: {
                            enabled: false,
                          },
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
                    {getIcon(key)}
                  </div>
                  <div className="flex pt-44 pl-6 pr-6 justify-between pointer-events-none">
                    <h1 className="text-white text-4xl font-[700] dark:text-[#CDD8D3] pointer-events-none">
                      {data.metrics[key].daily.data.length - hoverIndex > 0
                        ? data.metrics[key].daily.data.length - hoverIndex ===
                          data.metrics[key].daily.data.length
                          ? data.metrics[key].daily.data[
                              data.metrics[key].daily.data.length - 1
                            ][1]
                          : data.metrics[key].daily.data[
                              data.metrics[key].daily.data.length - hoverIndex
                            ][1]
                        : data.metrics[key].daily.data[0][1]}
                    </h1>
                    {/*Checks if statistic is reaching the beginning or end of the data points */}
                    <h1 className="text-white text-xl font-[700] self-center dark:text-[#CDD8D3] pointer-events-none">
                      {data.metrics[key].daily.data.length - hoverIndex > 0
                        ? data.metrics[key].daily.data.length - hoverIndex ===
                          data.metrics[key].daily.data.length
                          ? getDate(
                              data.metrics[key].daily.data[
                                data.metrics[key].daily.data.length - 1
                              ][0]
                            )
                          : getDate(
                              data.metrics[key].daily.data[
                                data.metrics[key].daily.data.length - hoverIndex
                              ][0]
                            )
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
