"use client";

import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  useLocalStorage,
  useWindowSize,
  useIsMounted,
  useMediaQuery,
} from "usehooks-ts";
import "highcharts/modules/full-screen";
import _merge from "lodash/merge";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import d3 from "d3";
import Link from "next/link";
import { Get_SupportedChainKeys } from "@/lib/chains";
import {
  navigationItems,
  navigationCategories,
  getFundamentalsByKey,
} from "@/lib/navigation";
import { useUIContext } from "@/contexts/UIContext";
import { ChainsBaseURL, MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import useSWR, { preload } from "swr";
import ChartWatermark from "@/components/layout/ChartWatermark";
import { ChainsData } from "@/types/api/ChainResponse";

import ChainSectionHead from "@/components/layout/SingleChains/ChainSectionHead";
import {
  TopRowContainer,
  TopRowChild,
  TopRowParent,
} from "@/components/layout/TopRow";
import "@/app/highcharts.axis.css";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/layout/Tooltip";
import { useSWRConfig } from "swr";
import ShowLoading from "@/components/layout/ShowLoading";
import {
  displayValuesHelper,
  compChainsHelper,
  getOptionsHelper,
  pointHoverHelper,
  updateSeriesHelper,
} from "./chainHelpers";
import { useMaster } from "../../../contexts/MasterContext";
import { metricCategories, metricItems } from "@/lib/metrics";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ChainChart({
  chainData,
  master,
  chain,
  defaultChainKey,
}: {
  chainData: ChainsData;
  master: MasterResponse;
  chain: string;
  defaultChainKey: string;
}) {
  // Keep track of the mounted state
  const isMounted = useIsMounted();
  // const { compareChain, setCompareChain } = useChain();

  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");

  const { AllChainsByKeys } = useMaster();

  const [data, setData] = useState<ChainsData[]>([chainData]);

  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chainKey, setChainKey] = useState<string[]>([defaultChainKey]);

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", "M", "B", "T", "P", "E"],
      },
    });
  }, []);

  const { theme } = useTheme();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [selectedTimespan, setSelectedTimespan] = useState("365d");
  const [selectedScale, setSelectedScale] = useState("log");
  const [compareTo, setCompareTo] = useState(false);
  // const [compChain, setCompChain] = useState<string | null>(null);
  // const [compChainIndex, setCompChainIndex] = useState<number>(-1);
  const [zoomed, setZoomed] = useState(false);
  const [zoomMin, setZoomMin] = useState<number | null>(null);
  const [zoomMax, setZoomMax] = useState<number | null>(null);

  const { isSidebarOpen } = useUIContext();

  const isMobile = useMediaQuery("(max-width: 767px)");

  const zoomedMargin = [49, 15, 0, 0];
  const defaultMargin = [49, 15, 0, 0];

  const CompChains = useMemo(() => {
    return compChainsHelper(master, chainKey);
  }, [master]);

  const { cache, mutate } = useSWRConfig();

  const fetchChainData = useCallback(async () => {
    if (chainKey.length === 0) {
      return;
    }

    try {
      const fetchPromises = chainKey.map(async (key) => {
        // check if the chain is in the cache
        const cachedData = cache.get(`${ChainsBaseURL}${key}.json`);

        if (cachedData) {
          return cachedData.data;
        }

        // if not, fetch the data
        const response = await fetch(
          `${ChainsBaseURL}${key}.json`.replace("/v1/", `/${apiRoot}/`),
        );
        const responseData = await response.json();

        // store the data in the cache
        mutate(`${ChainsBaseURL}${key}.json`, responseData, false);

        return responseData;
      });

      const responseData = await Promise.all(fetchPromises);

      // Flatten the structure by removing the "data" layer
      const flattenedData = responseData.map((item) => item.data);

      setData(flattenedData);
      setError(null);
    } catch (error) {
      setData([]);
      setError(error);
    } finally {
      setValidating(false);
      setLoading(false);
    }
  }, [chainKey, cache, apiRoot, mutate]);

  useEffect(() => {
    if (data.length === 0) {
      setLoading(true);
      setValidating(true);
    }
    fetchChainData();
  }, [data.length, chainKey, fetchChainData]);

  const timespans = useMemo(() => {
    let max = 0;
    let min = Infinity;
    const now = Date.now();

    data.forEach((item) => {
      Object.keys(item.metrics).forEach((key) => {
        max = Math.max(
          max,
          ...item.metrics[key].daily.data.map((d: any) => d[0]),
        );

        min = Math.min(
          min,
          ...item.metrics[key].daily.data.map((d: any) => d[0]),
        );
      });
    });

    return {
      "90d": {
        label: "90 days",
        shortLabel: "90d",
        value: 90,
        xMin: max - 90 * 24 * 60 * 60 * 1000,
        xMax: max,
        daysDiff: 90,
      },
      "180d": {
        label: "180 days",
        shortLabel: "180d",
        value: 180,
        xMin: max - 180 * 24 * 60 * 60 * 1000,
        xMax: max,
        daysDiff: 180,
      },
      "365d": {
        label: "1 year",
        shortLabel: "365d",
        value: 365,
        xMin: max - 365 * 24 * 60 * 60 * 1000,
        xMax: max,
        daysDiff: 365,
      },
      max: {
        label: "Maximum",
        shortLabel: "Max",
        value: 0,
        xMin: min,
        xMax: max,
        daysDiff: Math.round((now - min) / (1000 * 60 * 60 * 24)),
      },
    };
  }, [data]);

  const minUnixAll = useMemo(() => {
    const minUnixtimes: number[] = [];

    data.forEach((item) => {
      Object.keys(item.metrics).forEach((key) => {
        minUnixtimes.push(item.metrics[key].daily.data[0][0]);
      });
    });

    return Math.min(...minUnixtimes);
  }, [data]);

  const maxUnixAll = useMemo(() => {
    const maxUnixtimes: number[] = [];

    data.forEach((item) => {
      Object.keys(item.metrics).forEach((key) => {
        maxUnixtimes.push(
          item.metrics[key].daily.data[
            item.metrics[key].daily.data.length - 1
          ][0],
        );
      });
    });

    return Math.max(...maxUnixtimes);
  }, [data]);

  const chartComponents = useRef<Highcharts.Chart[]>([]);

  const showGwei = useCallback((metric_id: string) => {
    const item = navigationItems[1].options.find(
      (item) => item.key === metric_id,
    );

    return item?.page?.showGwei;
  }, []);

  //const [prefixes, setPrefixes] = useState<string[]>([]);

  const prefixes = useMemo(() => {
    if (!data) return [];

    const p: {
      [key: string]: string;
    } = {};

    data.forEach((item) => {
      Object.keys(item.metrics).forEach((key) => {
        const types = item.metrics[key].daily.types;
        if (types.length > 2) {
          if (showUsd && types.includes("usd")) p[key] = "$";
          else p[key] = "Ξ";
        } else {
          p[key] = "";
        }
      });
    });
    return p;
  }, [data, showUsd]);

  const formatNumber = useCallback(
    (key: string, value: number | string, isAxis = false) => {
      const units = Object.keys(master.metrics[key].units);
      const unitKey =
        units.find((unit) => unit !== "usd" && unit !== "eth") ||
        (showUsd ? "usd" : "eth");
      const prefix = master.metrics[key].units[unitKey].prefix
        ? master.metrics[key].units[unitKey].prefix
        : "";
      let suffix = master.metrics[key].units[unitKey].suffix
        ? master.metrics[key].units[unitKey].suffix
        : "";

      if (showGwei(key) && !showUsd) {
        suffix = " Gwei";
      }

      let val = parseFloat(value as string);

      let number = d3.format(`.2~s`)(val).replace(/G/, "B");

      if (isAxis) {
        if (selectedScale === "percentage") {
          number = d3.format(".2~s")(val).replace(/G/, "B") + "%";
        } else {
          if (showGwei(key) && showUsd) {
            // for small USD amounts, show 2 decimals
            if (val < 1) number = prefix + val.toFixed(2) + suffix;
            else if (val < 10)
              number =
                prefix + d3.format(".3s")(val).replace(/G/, "B") + suffix;
            else if (val < 100)
              number =
                prefix + d3.format(".4s")(val).replace(/G/, "B") + suffix;
            else
              number =
                prefix + d3.format(".2s")(val).replace(/G/, "B") + suffix;
          } else {
            number = prefix + d3.format(".2s")(val).replace(/G/, "B") + suffix;
          }
        }
      }

      return number;
    },
    [data, prefixes, selectedScale, showGwei, showUsd],
  );

  const getTickPositions = useCallback(
    (xMin: any, xMax: any): number[] => {
      const tickPositions: number[] = [];
      const xMinDate = new Date(xMin);
      const xMaxDate = new Date(xMax);

      tickPositions.push(xMinDate.getTime());
      tickPositions.push(xMaxDate.getTime());

      return tickPositions;
    },
    [selectedTimespan],
  );

  const [intervalShown, setIntervalShown] = useState<{
    min: number;
    max: number;
    num: number;
    label: string;
  } | null>(null);

  const onXAxisSetExtremes =
    useCallback<Highcharts.AxisSetExtremesEventCallbackFunction>(
      function (e: Highcharts.AxisSetExtremesEventObject) {
        // if (e.trigger === "pan") return;

        const { min, max } = e;

        // set to nearest day at 08:00 UTC
        let minDay = new Date(min);
        let maxDay = new Date(max);

        let minHours = minDay.getUTCHours();
        let maxHours = maxDay.getUTCHours();

        minDay.setUTCHours(0, 0, 0, 0);

        if (maxHours > 12) {
          maxDay.setDate(maxDay.getDate() + 1);
          maxDay.setUTCHours(0, 0, 0, 0);
        } else {
          maxDay.setUTCHours(0, 0, 0, 0);
        }

        let minStartOfDay = minDay.getTime();
        let maxStartOfDay = maxDay.getTime();

        let numMilliseconds = maxStartOfDay - minStartOfDay;

        let paddingMilliseconds = 0;
        if (e.trigger === "zoom" || e.trigger === "pan") {
          if (minStartOfDay < minUnixAll) minStartOfDay = minUnixAll;

          if (maxStartOfDay > maxUnixAll) maxStartOfDay = maxUnixAll;

          numMilliseconds = maxStartOfDay - minStartOfDay;

          setZoomed(true);
          setZoomMin(minStartOfDay);
          setZoomMax(maxStartOfDay);
          chartComponents.current.forEach((chart) => {
            if (chart) {
              const xAxis = chart.xAxis[0];
              const pixelsPerMillisecond = chart.plotWidth / numMilliseconds;

              // 15px padding on left side
              paddingMilliseconds = 15 / pixelsPerMillisecond;

              xAxis.setExtremes(
                minStartOfDay - paddingMilliseconds,
                maxStartOfDay,
              );
            }
          });
        }

        const numDays = numMilliseconds / (24 * 60 * 60 * 1000);

        setIntervalShown({
          min: minStartOfDay,
          max: maxStartOfDay,
          num: numDays,
          label: `${Math.round(numDays)} day${numDays > 1 ? "s" : ""}`,
        });
      },
      [maxUnixAll, minUnixAll],
    );

  const displayValues = useMemo(() => {
    const p: {
      [key: string]: {
        value: string;
        prefix: string;
        suffix: string;
      };
    }[] = [];

    data.forEach((item, chainIndex) => {
      if (!p[chainIndex]) {
        p[chainIndex] = {}; // Ensure p[chainIndex] is an object
      }

      Object.keys(item.metrics).forEach((key) => {
        p[chainIndex][key] = displayValuesHelper(
          data,
          master,
          showUsd,
          intervalShown,
          key,
          p,
          item,
          showGwei(key),
          chainIndex,
        );
      });
    });
    return p;
  }, [data, master, showUsd, intervalShown]);

  const tooltipFormatter = useCallback(
    function (this: any) {
      if (!master) return;
      const { x, points } = this;

      if (!points || !x) return;

      // const series = points[0].series;

      const date = new Date(x);

      // const prefix = prefixes[series.name] ?? "";

      const dateString = date.toLocaleDateString("en-GB", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-36 text-xs font-raleway"><div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2">${dateString}</div>`;
      const tooltipEnd = `</div>`;

      let pointsSum = 0;
      if (selectedScale !== "percentage")
        pointsSum = points.reduce((acc: number, point: any) => {
          acc += point.y;
          return pointsSum;
        }, 0);

      let num = 0;
      const tooltipData = points
        .sort((a: any, b: any) => b.y - a.y)
        .map((point: any) => {
          num = num += 1;

          const { series, y } = point;
          const { name } = series;

          const dataTypes = series.options.custom.types;
          const metricKey = series.options.custom.metric;
          const units = Object.keys(master.metrics[metricKey].units);
          const unitKey =
            units.find((unit) => unit !== "usd" && unit !== "eth") ||
            (showUsd ? "usd" : "eth");

          const prefix =
            showGwei(metricKey) && !showUsd
              ? ""
              : master.metrics[metricKey].units[unitKey].prefix;
          const suffix =
            showGwei(metricKey) && !showUsd
              ? "Gwei"
              : master.metrics[metricKey].units[unitKey].suffix;
          let value = y;

          const decimals =
            master.metrics[metricKey].units[unitKey].decimals_tooltip;

          // if (series.name === item.chain_name) {
          return `
                <div class="flex w-full space-x-2 items-center font-medium mb-1">
                  <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${
                    AllChainsByKeys[name].colors[theme ?? "dark"][0]
                  }"></div>
                  <div class="flex-1 text-left justify-start font-inter flex">
                      <div class="opacity-70 mr-0.5 ${
                        !prefix && "hidden"
                      }">${prefix}</div>
                      ${parseFloat(value).toLocaleString("en-GB", {
                        minimumFractionDigits:
                          showGwei(metricKey) && !showUsd ? 2 : decimals,
                        maximumFractionDigits:
                          showGwei(metricKey) && !showUsd ? 2 : decimals,
                      })}
                      <div class="opacity-70 ml-0.5 ${
                        !suffix && "hidden"
                      }">${suffix}</div>
                  </div>
                </div>`;
          // } else {
          //   return "";
          // }
        })
        .join("");

      return tooltip + tooltipData + tooltipEnd;
    },
    [displayValues, selectedScale, showGwei, showUsd, theme],
  );

  const tooltipPositioner =
    useCallback<Highcharts.TooltipPositionerCallbackFunction>(
      function (this, width, height, point) {
        const chart = this.chart;
        const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
        const tooltipWidth = width;
        const tooltipHeight = height;
        const distance = 20;
        const pointX = point.plotX + plotLeft;
        const pointY = point.plotY + plotTop;
        let tooltipX =
          pointX - distance - tooltipWidth < plotLeft - 120
            ? pointX + distance
            : pointX - tooltipWidth - distance;

        const tooltipY = pointY - tooltipHeight / 2;

        if (isMobile) {
          if (tooltipX < plotLeft) {
            tooltipX = pointX + distance;
          }
          return {
            x: tooltipX,
            y: 50,
          };
        }

        return {
          x: tooltipX,
          y: tooltipY,
        };
      },
      [isMobile],
    );

  const pointHover = useCallback(pointHoverHelper(chartComponents), [
    chartComponents,
  ]);

  const [isVisible, setIsVisible] = useState(true);
  const resizeTimeout = useRef<null | ReturnType<typeof setTimeout>>(null);
  const [isAnimate, setIsAnimate] = useState(false);
  const animationTimeout = useRef<null | ReturnType<typeof setTimeout>>(null);

  const handleResize = () => {
    // Hide the element
    setIsVisible(false);

    // Set animation to false
    setIsAnimate(false);

    // Clear any existing timeouts
    if (resizeTimeout.current) {
      clearTimeout(resizeTimeout.current);
    }

    if (animationTimeout.current) {
      clearTimeout(animationTimeout.current);
    }

    // Set a timeout to show the element again after 500ms of no resizing
    resizeTimeout.current = setTimeout(() => {
      setIsVisible(true);
    }, 200);

    // Set a timeout to show the element again after 500ms of no resizing
    animationTimeout.current = setTimeout(() => {
      setIsAnimate(true);
    }, 500);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    animationTimeout.current = setTimeout(() => {
      setIsAnimate(true);
    }, 500);

    return () => {
      // Cleanup
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }

      if (animationTimeout.current) {
        clearTimeout(animationTimeout.current);
      }
    };
  }, []);

  const options: Highcharts.Options = getOptionsHelper(
    data,
    isAnimate,
    timespans,
    selectedTimespan,
    theme,
    tooltipFormatter,
    tooltipPositioner,
    getTickPositions(
      timespans[selectedTimespan].xMin,
      timespans[selectedTimespan].xMax,
    ),
    onXAxisSetExtremes,
  );

  const getNavIcon = useCallback(
    (key: string) => {
      const navItem = metricItems.find((item) => item.urlKey === key);

      if (!navItem || !navItem.category) return null;

      return metricCategories[navItem.category]
        ? metricCategories[navItem.category].icon
        : null;
    },
    [metricItems],
  );

  const lastPointLines = useMemo<{
    [key: string]: Highcharts.SVGElement[];
  }>(() => ({}), []);

  const lastPointCircles = useMemo<{
    [key: string]: Highcharts.SVGElement[];
  }>(() => ({}), []);

  const resetXAxisExtremes = useCallback(() => {
    if (chartComponents.current && !zoomed) {
      chartComponents.current.forEach((chart) => {
        if (!chart) return;

        const pixelsPerDay =
          chart.plotWidth / timespans[selectedTimespan].daysDiff;

        // 15px padding on each side
        const paddingMilliseconds = (15 / pixelsPerDay) * 24 * 60 * 60 * 1000;

        // if (!zoomed) {
        chart.xAxis[0].setExtremes(
          timespans[selectedTimespan].xMin - paddingMilliseconds,
          timespans[selectedTimespan].xMax,
          isAnimate,
        );
        // } else {
        // const currentXMin = chart.xAxis[0].getExtremes().min;
        // const currentXMax = chart.xAxis[0].getExtremes().max;

        // chart.xAxis[0].setExtremes(currentXMin, currentXMax, isAnimate);
        // }
      });
    }
  }, [isAnimate, selectedTimespan, timespans, zoomed]);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const resituateChart = useCallback(async () => {
    if (chartComponents.current) {
      await chartComponents.current.forEach(async (chart) => {
        await delay(0)
          .then(() => {
            chart?.setSize(null, null, isAnimate);
            // chart.reflow();
          })
          .then(() => {
            delay(0).then(() => chart.reflow());
          });
      });
      resetXAxisExtremes();
    }
  }, [isAnimate, resetXAxisExtremes]);

  useEffect(() => {
    resetXAxisExtremes();
  }, [resetXAxisExtremes, selectedTimespan]);

  useEffect(() => {
    handleResize();
  }, [isSidebarOpen]);

  const enabledFundamentalsKeys = useMemo<string[]>(() => {
    return navigationItems[1].options.map((option) => option.key ?? "");
  }, []);

  useEffect(() => {
    updateSeriesHelper(
      chartComponents,
      data,
      enabledFundamentalsKeys,
      pointHover,
      showGwei,
      showUsd,
      theme,
    );
  }, [data, enabledFundamentalsKeys, pointHover, showGwei, showUsd, theme]);
  {
    /*Handles updating of series data for adding comparison chains */
  }

  const compChain = useMemo(() => {
    return chainKey.length > 1 ? chainKey[1] : null;
  }, [chainKey]);
  {
    /*Get comparison chain data*/
  }

  const nextChainKey = useMemo(() => {
    if (!compChain) return CompChains[0].key;

    const currentIndex = CompChains.findIndex(
      (chain) => chain.key === compChain,
    );

    if (currentIndex === CompChains.length - 1) {
      return CompChains[0].key;
    } else {
      return CompChains[currentIndex + 1].key;
    }
  }, [compChain, CompChains]);

  const prevChainKey = useMemo(() => {
    if (!compChain) return CompChains[CompChains.length - 1].key;

    const currentIndex = CompChains.findIndex(
      (chain) => chain.key === compChain,
    );

    if (currentIndex === 0) {
      return CompChains[CompChains.length - 1].key;
    } else {
      return CompChains[currentIndex - 1].key;
    }
  }, [compChain, CompChains]);

  const handleNextCompChain = () => {
    setChainKey([chainKey[0], nextChainKey]);
    //setCompareChain(nextChainKey);
  };

  const handlePrevCompChain = () => {
    setChainKey([chainKey[0], prevChainKey]);
  };

  const getNoDataMessage = useCallback(
    (chainKey, metricKey) => {
      if (!master) return "";

      if (
        chainKey === "ethereum" &&
        ["tvl", "rent_paid", "profit"].includes(metricKey)
      )
        return `Data is not available for ${master.chains[chainKey].name}`;

      if (chainKey === "imx" && metricKey === "txcosts")
        return `${master.chains[chainKey].name} does not charge Transaction Costs`;

      return `Data is not available for ${master.chains[chainKey].name}`;
    },
    [master],
  );

  const categoriesMissingData = useMemo(() => {
    // check: !Object.keys(data[0].metrics).includes(key)
    // message: getNoDataMessage(data[0].chain_id, key)

    const missingData: { [key: string]: { key: string; message: string }[] } =
      {};

    Object.keys(navigationCategories)
      .filter((group) => {
        return (
          group !== "gtpmetrics" &&
          group !== "public-goods-funding" &&
          group !== "developer"
        );
      })
      .forEach((category) => {
        if (!category) return;

        missingData[category] = navigationItems[1].options
          .filter(
            (option) =>
              option.key &&
              !Object.keys(data[0].metrics).includes(option.key) &&
              option.category === category,
          )
          .map((option) => ({
            key: option.key ?? "",
            message: getNoDataMessage(data[0].chain_id, option.key),
          }));
      });

    return missingData;
  }, [data, getNoDataMessage]);

  if (!master || !data) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ShowLoading />
      </div>
    );
  }

  return (
    <div className="w-full flex-col relative " id="chains-content-container">
      <style>
        {`
        .highcharts-tooltip-container {
          z-index: 9999 !important;
        }
        .highcharts-grid.highcharts-yaxis-grid > .highcharts-grid-line:first-child {
          stroke-width: 0px !important;
        `}
      </style>
      <TopRowContainer
        className={`mb-[15px] flex w-full justify-between gap-y-3 lg:gap-y-0 items-center text-xs bg-forest-50 dark:bg-[#1F2726] lg:z-30 flex-col-reverse rounded-t-[15px] md:rounded-t-[20px] rounded-b-[30px] p-[3px] lg:p-0 lg:flex-row lg:rounded-full transition-shadow duration-300  ${
          compareTo &&
          "shadow-[0px_4px_4px_#00000033] dark:shadow-[0px_4px_4px_#0000003F] lg:shadow-none lg:dark:shadow-none"
        } `}
      >
        <div className="flex flex-col relative h-full lg:h-[54px] w-full lg:w-[271px] -my-[1px]">
          <div
            className={`relative flex rounded-full h-full w-full lg:z-30 p-[5px] cursor-pointer ${
              isMobile ? "w-full" : "w-[271px]"
            }`}
            style={{
              backgroundColor: compChain
                ? AllChainsByKeys[compChain].colors[theme ?? "dark"][0]
                : "#151A19",
            }}
          >
            <div
              className="rounded-[40px] w-[54px] h-[44px] bg-forest-50 dark:bg-[#1F2726] flex items-center justify-center z-[15] hover:cursor-pointer"
              onClick={handlePrevCompChain}
              onMouseOver={() => {
                preload(`${ChainsBaseURL}${prevChainKey}.json`, fetcher);
              }}
            >
              <Icon icon="feather:arrow-left" className="w-6 h-6" />
            </div>
            <div
              className="flex flex-1 flex-col items-center justify-self-center  gap-y-[1px]"
              onClick={() => {
                setCompareTo(!compareTo);
              }}
            >
              <div
                className={` font-[500] leading-[150%] text-[12px] ${
                  compChain
                    ? !AllChainsByKeys[compChain].darkTextOnBackground ||
                      (theme === "light" &&
                        (compChain === "ethereum" || compChain === "imx"))
                      ? "text-forest-50"
                      : "text-[#1F2726]"
                    : "text-forest-400 dark:text-[#5A6462]"
                }`}
              >
                Compare to
              </div>
              <div
                className={`flex font-[550] ${
                  compChain
                    ? !AllChainsByKeys[compChain].darkTextOnBackground ||
                      (theme === "light" &&
                        (compChain === "ethereum" || compChain === "imx"))
                      ? "text-forest-50"
                      : "text-[#1F2726]"
                    : ""
                } gap-x-[5px] justify-center items-center w-32`}
              >
                {compChain && (
                  <Icon
                    icon={`gtp:${AllChainsByKeys[compChain].urlKey}-logo-monochrome`}
                    className="w-[22px] h-[22px]"
                  />
                )}
                <div className="text-sm overflow-ellipsis truncate whitespace-nowrap">
                  {compChain ? master.chains[compChain].name : "None"}
                </div>
              </div>
            </div>
            <div
              className="rounded-[40px] w-[54px] h-[44px] bg-forest-50 dark:bg-[#1F2726] flex items-center justify-center z-[15] hover:cursor-pointer"
              onClick={handleNextCompChain}
              onMouseOver={() => {
                preload(`${ChainsBaseURL}${nextChainKey}.json`, fetcher);
              }}
            >
              <Icon icon="feather:arrow-right" className="w-6 h-6" />
            </div>
          </div>
          <div
            className={`flex flex-col relative lg:absolute lg:top-[27px] bottom-auto lg:left-0 lg:right-0 bg-forest-50 dark:bg-[#1F2726] rounded-t-none border-0 lg:border-b lg:border-l lg:border-r transition-all ease-in-out duration-300 ${
              compareTo
                ? `max-h-[${
                    CompChains.length * 30 + 40
                  }px] lg:z-[25] border-transparent rounded-b-[30px] lg:border-forest-200 lg:dark:border-forest-500 lg:rounded-b-2xl lg:shadow-[0px_4px_46.2px_#00000066] lg:dark:shadow-[0px_4px_46.2px_#000000]`
                : "max-h-0 z-20 overflow-hidden border-transparent rounded-b-[22px]"
            } `}
          >
            <div className="pb-[20px] lg:pb-[10px]">
              <div className="h-[10px] lg:h-[28px]"></div>
              <div
                className="flex pl-[21px] pr-[19px] lg:pr-[15px] py-[5px] gap-x-[10px] items-center text-base leading-[150%] cursor-pointer hover:bg-forest-200/30 dark:hover:bg-forest-500/10"
                onClick={() => {
                  setCompareTo(false);
                  delay(300).then(() => setChainKey([chainKey[0]]));
                }}
              >
                <Icon
                  icon="feather:arrow-right-circle"
                  className="w-6 h-6"
                  visibility={compChain === null ? "visible" : "hidden"}
                />
                <div className="flex w-[22px] h-[22px] items-center justify-center">
                  <Icon
                    icon="feather:x"
                    className={`transition-all duration-300 ${
                      compChain === null
                        ? "w-[22px] h-[22px]"
                        : "w-[15px] h-[15px]"
                    }`}
                    style={{
                      color: compChain === null ? "" : "#5A6462",
                    }}
                  />
                </div>
                <div className="">None</div>
              </div>
              {CompChains.sort((chain1, chain2) => {
                const nameA = master.chains[chain1.key].name.toLowerCase();
                const nameB = master.chains[chain2.key].name.toLowerCase();

                if (nameA < nameB) {
                  return -1;
                }
                if (nameA > nameB) {
                  return 1;
                }
                return 0;
              }).map((chain, index) => (
                <div
                  className="flex pl-[21px] pr-[15px] py-[5px] gap-x-[10px] items-center text-base leading-[150%] cursor-pointer hover:bg-forest-200/30 dark:hover:bg-forest-500/10"
                  onClick={() => {
                    setCompareTo(false);
                    delay(400).then(() =>
                      setChainKey([chainKey[0], chain.key]),
                    );
                  }}
                  key={index}
                  onMouseOver={() => {
                    preload(`${ChainsBaseURL}${chain.key}.json`, fetcher);
                  }}
                >
                  <Icon
                    icon="feather:arrow-right-circle"
                    className="w-6 h-6"
                    visibility={compChain === chain.key ? "visible" : "hidden"}
                  />
                  <div className="flex w-[22px] h-[22px] items-center justify-center">
                    <Icon
                      icon={`gtp:${chain.urlKey}-logo-monochrome`}
                      className={`transition-all duration-300 ${
                        compChain === chain.key
                          ? "w-[22px] h-[22px]"
                          : "w-[15px] h-[15px]"
                      }`}
                      style={{
                        color:
                          compChain === chain.key
                            ? AllChainsByKeys[chain.key].colors[
                                theme ?? "dark"
                              ][0]
                            : "#5A6462",
                      }}
                    />
                  </div>
                  <div>{master.chains[chain.key].name}</div>
                </div>
              ))}
            </div>
          </div>
          {compareTo && (
            <div
              className={`hidden lg:block lg:fixed inset-0 z-20`}
              onClick={() => {
                setCompareTo(false);
              }}
            />
          )}
        </div>

        <TopRowParent>
          {!zoomed ? (
            Object.keys(timespans).map((timespan) => (
              <TopRowChild
                key={timespan}
                isSelected={selectedTimespan === timespan}
                onClick={() => {
                  setSelectedTimespan(timespan);
                }}
                style={{
                  fontSize: isMobile ? "16px" : "",
                  paddingTop: isMobile ? "6px" : "",
                  paddingBottom: isMobile ? "6px" : "",
                }}
                className={`py-[4px] xl:py-[13px]`}
              >
                <span className="hidden sm:block">
                  {timespans[timespan].label}
                </span>
                <span className="block text-xs sm:hidden">
                  {timespans[timespan].shortLabel}
                </span>
              </TopRowChild>
            ))
          ) : (
            <div className="flex w-full gap-x-1">
              <button
                className={`rounded-full flex items-center justify-center space-x-1 md:space-x-3 px-[16px] py-[3px] md:px-[15px] md:py-[6px] leading-[20px] md:leading-normal lg:px-[16px] lg:py-[11px] w-full lg:w-auto text-xs md:text-base font-medium border-[0.5px] border-forest-400`}
                onClick={() => {
                  //chartComponent?.current?.xAxis[0].setExtremes(
                  //timespans[selectedTimespan].xMin,
                  //</div>timespans[selectedTimespan].xMax,
                  //);
                  setZoomed(false);
                  resituateChart();
                }}
              >
                <Icon
                  icon="feather:zoom-out"
                  className="w-4 h-4 md:w-5 md:h-5"
                />
                <div className="hidden md:block">Reset Zoom</div>
                <div className="block md:hidden">Reset</div>
              </button>
              <button
                className={`rounded-full px-[16px] py-[4px] md:px-[15px] md:py-[7px] leading-[20px] md:leading-normal lg:px-[16px] lg:py-[12px] w-full lg:w-auto text-xs md:text-base bg-forest-100 dark:bg-forest-1000`}
              >
                {intervalShown?.label}
              </button>
            </div>
          )}
        </TopRowParent>
      </TopRowContainer>

      <div className="flex flex-col gap-y-[15px]">
        {Object.keys(navigationCategories)
          .filter((group) => {
            return (
              group !== "gtpmetrics" &&
              group !== "public-goods-funding" &&
              group !== "developer"
            );
          })
          .map((categoryKey) => (
            <ChainSectionHead
              title={navigationCategories[categoryKey].label}
              enableDropdown={true}
              defaultDropdown={true}
              key={categoryKey}
              icon={"gtp:" + categoryKey}
              childrenHeight={
                Math.round(
                  enabledFundamentalsKeys.filter((key) => {
                    return getFundamentalsByKey[key].category === categoryKey;
                  }).length / (isMobile ? 1 : 2),
                ) * 195
              }
              rowEnd={
                categoriesMissingData[categoryKey].length > 0 && (
                  <Tooltip placement="left">
                    <TooltipTrigger>
                      <Icon icon="feather:alert-circle" className="w-6 h-6" />
                    </TooltipTrigger>
                    <TooltipContent className="z-50 flex items-center justify-center">
                      <div className="px-3 py-4 text-xs font-medium bg-forest-100 dark:bg-[#4B5553] rounded-xl shadow-lg z-50 w-auto flex flex-col items-center">
                        {categoriesMissingData[categoryKey].map((missing) => (
                          <div key={missing.key}>
                            <div className="font-semibold">
                              {getFundamentalsByKey[missing.key].label}
                            </div>
                            <div className="text-[0.6rem] text-forest-600 dark:text-forest-300">
                              {missing.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              }
              disabled={
                enabledFundamentalsKeys.filter((key) => {
                  return getFundamentalsByKey[key].category === categoryKey;
                }).length === categoriesMissingData[categoryKey].length
              }
            >
              <div className="wrapper h-auto w-full ">
                <div className="grid grid-cols-1 sm:grid-cols-2 items-start relative gap-2">
                  {enabledFundamentalsKeys
                    .filter((key) => {
                      return getFundamentalsByKey[key].category === categoryKey;
                    })
                    .map((key, i) => {
                      const isAllZeroValues = data[0].metrics[key]
                        ? data[0].metrics[key].daily.data.every(
                            (d) => d[1] === 0,
                          )
                        : false;

                      if (!Object.keys(data[0].metrics).includes(key))
                        return null;

                      return (
                        <div key={key}>
                          <div className="group/chart w-full h-[176px] rounded-2xl bg-[#1F2726] relative">
                            {!Object.keys(data[0].metrics).includes(key) ? (
                              <div key={key} className="w-full relative">
                                <div className="w-full h-[60px] lg:h-[176px] relative  pointer-events-none">
                                  <div className="absolute w-full h-full bg-forest-50 dark:bg-[#1F2726] text-forest-50 rounded-[15px] opacity-30 z-30"></div>
                                  <div className="absolute w-full h-[191px] top-[0px]"></div>
                                  <div className="absolute top-[15px] w-full flex justify-between items-center space-x-4 px-[15px] opacity-30">
                                    <div className="text-[16px] font-bold leading-snug break-inside-avoid">
                                      {
                                        navigationItems[1].options.find(
                                          (o) => o.key === key,
                                        )?.page?.title
                                      }
                                    </div>
                                    <div className="lg:hidden text-xs flex-1 text-right leading-snug">
                                      {!Object.keys(data[0].metrics).includes(
                                        key,
                                      ) &&
                                        getNoDataMessage(data[0].chain_id, key)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="absolute inset-0 hidden lg:flex font-medium opacity-30 select-none justify-center items-center text-xs lg:text-sm">
                                      {!Object.keys(data[0].metrics).includes(
                                        key,
                                      ) &&
                                        getNoDataMessage(data[0].chain_id, key)}
                                    </div>
                                    {Object.keys(data[0].metrics).includes(
                                      key,
                                    ) && (
                                      <Icon
                                        icon={getNavIcon(key)}
                                        className="absolute h-[40px] w-[40px] top-[116px] left-[24px] dark:text-[#CDD8D3] opacity-20 pointer-events-none"
                                      />
                                    )}
                                  </div>
                                </div>

                                {!zoomed
                                  ? (key === "market_cap" ||
                                      key === "txcosts") && (
                                      <div
                                        className={`w-full h-[15px] absolute -bottom-[15px] text-[10px] text-forest-600/80 dark:text-forest-500/80 ${
                                          key === "txcosts"
                                            ? "hidden lg:block"
                                            : ""
                                        }`}
                                      ></div>
                                    )
                                  : (key === "profit" || key === "txcosts") &&
                                    intervalShown && (
                                      <div
                                        className={`w-full h-[15px] absolute -bottom-[15px] text-[10px] text-forest-600/80 dark:text-forest-500/80 ${
                                          key === "txcosts"
                                            ? "hidden lg:block"
                                            : ""
                                        }`}
                                      >
                                        <div className="absolute left-[15px] align-bottom flex items-end z-10">
                                          {new Date(
                                            intervalShown.min,
                                          ).toLocaleDateString("en-GB", {
                                            timeZone: "UTC",
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })}
                                        </div>
                                        <div className="absolute right-[15px] align-bottom flex items-end z-10">
                                          {new Date(
                                            intervalShown.max,
                                          ).toLocaleDateString("en-GB", {
                                            timeZone: "UTC",
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })}
                                        </div>
                                      </div>
                                    )}
                              </div>
                            ) : (
                              <div className="absolute left-[15px] top-[15px] flex items-center justify-between w-full">
                                <Link
                                  href={`/fundamentals/${getFundamentalsByKey[key].urlKey}`}
                                  className="relative z-10 -top-[3px] text-[16px] font-bold flex gap-x-2 items-center cursor-pointer"
                                >
                                  <div>{getFundamentalsByKey[key].label}</div>
                                  <div className="rounded-full w-[15px] h-[15px] bg-[#344240] flex items-center justify-center text-[10px] z-10">
                                    <Icon
                                      icon="feather:arrow-right"
                                      className="w-[11px] h-[11px]"
                                    />
                                  </div>
                                </Link>
                                <div className="relative text-[18px] leading-snug font-medium flex space-x-[2px] right-[40px]">
                                  <div>{displayValues[0][key].prefix}</div>
                                  <div>{displayValues[0][key].value}</div>
                                  <div className="text-base pl-0.5">
                                    {displayValues[0][key].suffix}
                                  </div>
                                </div>
                                <div className="absolute top-[27px] right-[17px] w-full flex justify-end items-center pl-[23px] pr-[23px] text-[#5A6462]">
                                  {displayValues[1] &&
                                    displayValues[1][key] && (
                                      <div className="text-[14px] leading-snug font-medium flex space-x-[2px]">
                                        <div>
                                          {displayValues[1][key].prefix}
                                        </div>
                                        <div>{displayValues[1][key].value}</div>
                                        <div className="text-base pl-0.5">
                                          {displayValues[1][key].suffix}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </div>
                            )}

                            <HighchartsReact
                              // containerProps={{
                              //   className: isVisible
                              //     ? "w-full h-[127px]"
                              //     : "w-full h-[127px] hidden",
                              // }}
                              highcharts={Highcharts}
                              options={{
                                ...options,
                                chart: {
                                  ...options.chart,
                                  animation: isAnimate
                                    ? {
                                        duration: 500,
                                        delay: 0,
                                        easing: "easeOutQuint",
                                      }
                                    : false,
                                  index: enabledFundamentalsKeys.indexOf(key),
                                  margin: zoomed ? zoomedMargin : defaultMargin,
                                  events: {
                                    load: function () {
                                      const chart = this;
                                      // chart.reflow();
                                    },
                                    render: function () {
                                      const chart: Highcharts.Chart = this;

                                      // destroy the last point lines and circles
                                      lastPointLines[
                                        enabledFundamentalsKeys.indexOf(key)
                                      ]?.length > 0 &&
                                        lastPointLines[
                                          enabledFundamentalsKeys.indexOf(key)
                                        ].forEach((line) => {
                                          line.destroy();
                                        });

                                      // destroy the last point lines and circles
                                      lastPointCircles[
                                        enabledFundamentalsKeys.indexOf(key)
                                      ]?.length > 0 &&
                                        lastPointCircles[
                                          enabledFundamentalsKeys.indexOf(key)
                                        ].forEach((circle) => {
                                          circle.destroy();
                                        });

                                      lastPointLines[
                                        enabledFundamentalsKeys.indexOf(key)
                                      ] = [];
                                      lastPointCircles[
                                        enabledFundamentalsKeys.indexOf(key)
                                      ] = [];

                                      // calculate the fraction that 15px is in relation to the pixel width of the chart
                                      const linesXPos =
                                        chart.chartWidth *
                                        (1 - 15 / chart.chartWidth);

                                      let primaryLineStartPos =
                                        chart.plotTop - 24;
                                      let primaryLineEndPos: number | null =
                                        null;

                                      let secondaryLineStartPos = chart.plotTop;
                                      let secondaryLineEndPos: number | null =
                                        null;

                                      let lastPointYDiff = 0;

                                      if (chart.series.length > 0) {
                                        const lastPoint =
                                          chart.series[0].points[
                                            chart.series[0].points.length - 1
                                          ];
                                        if (lastPoint && lastPoint.plotY) {
                                          primaryLineEndPos =
                                            chart.plotTop + lastPoint.plotY;
                                        }

                                        if (chart.series.length > 1) {
                                          const lastPoint =
                                            chart.series[1].points[
                                              chart.series[1].points.length - 1
                                            ];
                                          if (
                                            lastPoint &&
                                            lastPoint.plotY &&
                                            primaryLineEndPos
                                          ) {
                                            secondaryLineEndPos =
                                              chart.plotTop + lastPoint.plotY;

                                            lastPointYDiff =
                                              primaryLineEndPos -
                                              secondaryLineEndPos;
                                          }
                                        }
                                      }

                                      // loop through the series and create the last point lines and circles
                                      chart.series.forEach(
                                        (series, seriesIndex) => {
                                          const lastPoint =
                                            series.points[
                                              series.points.length - 1
                                            ];

                                          if (!lastPoint || !lastPoint.plotY)
                                            return;

                                          // create a bordered line from the last point to the top of the chart's container
                                          if (
                                            seriesIndex === 0 &&
                                            secondaryLineEndPos !== null
                                          ) {
                                            lastPointLines[
                                              enabledFundamentalsKeys.indexOf(
                                                key,
                                              )
                                            ][
                                              lastPointLines[
                                                enabledFundamentalsKeys.indexOf(
                                                  key,
                                                )
                                              ].length
                                            ] = chart.renderer
                                              .path(
                                                chart.renderer.crispLine(
                                                  [
                                                    //@ts-ignore
                                                    "M",
                                                    //@ts-ignore
                                                    linesXPos,
                                                    //@ts-ignore
                                                    primaryLineStartPos,
                                                    //@ts-ignore
                                                    "L",
                                                    //@ts-ignore
                                                    linesXPos,
                                                    //@ts-ignore
                                                    chart.plotTop,
                                                  ],
                                                  1,
                                                ),
                                              )
                                              .attr({
                                                stroke:
                                                  AllChainsByKeys[series.name]
                                                    .colors[theme ?? "dark"][0],
                                                "stroke-width": 1,
                                                "stroke-dasharray": 2,
                                                zIndex:
                                                  seriesIndex === 0
                                                    ? 9997
                                                    : 9998,
                                                rendering: "crispEdges",
                                              })
                                              .add();

                                            lastPointLines[
                                              enabledFundamentalsKeys.indexOf(
                                                key,
                                              )
                                            ][
                                              lastPointLines[
                                                enabledFundamentalsKeys.indexOf(
                                                  key,
                                                )
                                              ].length
                                            ] = chart.renderer
                                              .path(
                                                chart.renderer.crispLine(
                                                  [
                                                    //@ts-ignore
                                                    "M",
                                                    //@ts-ignore
                                                    linesXPos,
                                                    //@ts-ignore
                                                    secondaryLineStartPos,
                                                    //@ts-ignore
                                                    "L",
                                                    //@ts-ignore
                                                    linesXPos,
                                                    //@ts-ignore
                                                    lastPointYDiff > 0
                                                      ? secondaryLineEndPos
                                                      : primaryLineEndPos,
                                                  ],
                                                  1,
                                                ),
                                              )
                                              .attr({
                                                stroke:
                                                  AllChainsByKeys[series.name]
                                                    .colors[theme ?? "dark"][0],
                                                "stroke-width": 1,
                                                zIndex:
                                                  seriesIndex === 0
                                                    ? 9997
                                                    : 9998,
                                                rendering: "crispEdges",
                                              })
                                              .add();

                                            if (lastPointYDiff > 0) {
                                              lastPointLines[
                                                enabledFundamentalsKeys.indexOf(
                                                  key,
                                                )
                                              ][
                                                lastPointLines[
                                                  enabledFundamentalsKeys.indexOf(
                                                    key,
                                                  )
                                                ].length
                                              ] = chart.renderer
                                                .path(
                                                  chart.renderer.crispLine(
                                                    [
                                                      //@ts-ignore
                                                      "M",
                                                      //@ts-ignore
                                                      linesXPos,
                                                      //@ts-ignore
                                                      secondaryLineEndPos,
                                                      //@ts-ignore
                                                      "L",
                                                      //@ts-ignore
                                                      linesXPos,
                                                      //@ts-ignore
                                                      primaryLineEndPos,
                                                    ],
                                                    1,
                                                  ),
                                                )
                                                .attr({
                                                  stroke:
                                                    AllChainsByKeys[series.name]
                                                      .colors[
                                                      theme ?? "dark"
                                                    ][0],
                                                  "stroke-width": 1,
                                                  "stroke-dasharray": 2,
                                                  zIndex:
                                                    seriesIndex === 0
                                                      ? 9997
                                                      : 9998,
                                                  rendering: "crispEdges",
                                                })
                                                .add();
                                            }
                                          } else {
                                            lastPointLines[
                                              enabledFundamentalsKeys.indexOf(
                                                key,
                                              )
                                            ][
                                              lastPointLines[
                                                enabledFundamentalsKeys.indexOf(
                                                  key,
                                                )
                                              ].length
                                            ] = chart.renderer
                                              .path(
                                                chart.renderer.crispLine(
                                                  [
                                                    //@ts-ignore
                                                    "M",
                                                    //@ts-ignore
                                                    linesXPos,
                                                    //@ts-ignore
                                                    seriesIndex === 0
                                                      ? primaryLineStartPos
                                                      : secondaryLineStartPos,
                                                    //@ts-ignore
                                                    "L",
                                                    //@ts-ignore
                                                    linesXPos,
                                                    //@ts-ignore
                                                    seriesIndex === 0
                                                      ? primaryLineEndPos
                                                      : secondaryLineEndPos,
                                                  ],
                                                  1,
                                                ),
                                              )
                                              .attr({
                                                stroke:
                                                  AllChainsByKeys[series.name]
                                                    .colors[theme ?? "dark"][0],
                                                "stroke-width": 1,
                                                "stroke-dasharray": 2,
                                                zIndex:
                                                  seriesIndex === 0
                                                    ? 9997
                                                    : 9998,
                                                rendering: "crispEdges",
                                              })
                                              .add();
                                          }

                                          lastPointCircles[
                                            enabledFundamentalsKeys.indexOf(key)
                                          ][seriesIndex] = chart.renderer
                                            .circle(
                                              linesXPos,
                                              chart.plotTop -
                                                (seriesIndex === 0 ? 24 : 0),
                                              3,
                                            )
                                            .attr({
                                              fill: AllChainsByKeys[series.name]
                                                .colors[theme ?? "dark"][0],

                                              r: seriesIndex === 0 ? 4.5 : 4.5,
                                              zIndex: 9999,
                                              rendering: "crispEdges",
                                            })
                                            .add();
                                        },
                                      );

                                      // lastPointCircles[i] =
                                    },
                                  },
                                },
                                yAxis: {
                                  ...options.yAxis,
                                  // if all values are 0, set the min to 0
                                  min:
                                    isAllZeroValues && data.length === 1
                                      ? 0
                                      : undefined,
                                  max:
                                    isAllZeroValues && data.length === 1
                                      ? 1
                                      : undefined,

                                  labels: {
                                    ...(
                                      options.yAxis as Highcharts.YAxisOptions
                                    ).labels,

                                    formatter: function (
                                      t: Highcharts.AxisLabelsFormatterContextObject,
                                    ) {
                                      return formatNumber(key, t.value, true);
                                    },
                                  },
                                },
                                xAxis: {
                                  ...options.xAxis,
                                  min: zoomed
                                    ? zoomMin
                                    : timespans[selectedTimespan].xMin,
                                  max: zoomed
                                    ? zoomMax
                                    : timespans[selectedTimespan].xMax,
                                },
                              }}
                              ref={(chart) => {
                                if (chart) {
                                  chartComponents.current[
                                    enabledFundamentalsKeys.indexOf(key)
                                  ] = chart.chart;
                                }
                              }}
                            />
                            <div className="absolute bottom-[43.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-40">
                              <ChartWatermark className="w-[102.936px] h-[24.536px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
                            </div>
                            {/*Date Left Side*/}
                            <div className="opacity-100 transition-opacity duration-[900ms] group-hover/chart:opacity-0 absolute left-[7px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-forest-50/50 dark:bg-[#344240]/50 pointer-events-none">
                              <div className="w-[5px] h-[5px] bg-[#CDD8D3] rounded-full"></div>
                              {zoomed && zoomMin !== null && (
                                <div className="text-[#CDD8D3] text-[8px] font-medium leading-[150%]">
                                  {new Date(zoomMin).toLocaleDateString(
                                    "en-GB",
                                    {
                                      timeZone: "UTC",
                                      month: "short",
                                      // day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </div>
                              )}
                              {!zoomed && (
                                <div className="text-[#CDD8D3] text-[8px] font-medium leading-[150%]">
                                  {selectedTimespan &&
                                    new Date(
                                      timespans[selectedTimespan].xMin,
                                    ).toLocaleDateString("en-GB", {
                                      timeZone: "UTC",
                                      month: "short",
                                      // day: "numeric",
                                      year: "numeric",
                                    })}
                                </div>
                              )}
                            </div>
                            {/*Date Right Side*/}
                            <div className="opacity-100 transition-opacity duration-[900ms] group-hover/chart:opacity-0 absolute right-[9px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-forest-50/50 dark:bg-[#344240]/50 pointer-events-none">
                              {zoomed && zoomMax !== null && (
                                <div className="text-[#CDD8D3] text-[8px] font-medium leading-[150%]">
                                  {new Date(zoomMax).toLocaleDateString(
                                    "en-GB",
                                    {
                                      timeZone: "UTC",
                                      month: "short",
                                      // day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </div>
                              )}
                              {!zoomed && (
                                <div className="text-[#CDD8D3] text-[8px] font-medium leading-[150%]">
                                  {new Date(
                                    timespans[selectedTimespan].xMax,
                                  ).toLocaleDateString("en-GB", {
                                    timeZone: "UTC",
                                    month: "short",
                                    // day: "numeric",
                                    year: "numeric",
                                  })}
                                </div>
                              )}
                              <div className="w-[5px] h-[5px] bg-[#CDD8D3] rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </ChainSectionHead>
          ))}
      </div>

      {/* <div className="flex w-full justify-end mt-6 items-center">
        <Share />
      </div> */}
    </div>
  );
}
