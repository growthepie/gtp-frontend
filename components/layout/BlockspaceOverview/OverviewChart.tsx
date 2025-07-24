"use client";
import {
  useMemo,
  useCallback,
  useEffect,
  useRef,
  MutableRefObject,
} from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";

import { chart, charts, color } from "highcharts";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { Chains } from "@/types/api/ChainOverviewResponse";
import { animated, useSpring } from "@react-spring/web";
import { MasterResponse } from "@/types/api/MasterResponse";
import {
  HighchartsProvider,
  HighchartsChart,
  Chart,
  XAxis,
  YAxis,
  Title,
  Subtitle,
  Legend,
  LineSeries,
  SplineSeries,
  AreaSplineSeries,
  Tooltip,
  AreaRangeSeries,
  PlotBand,
  PlotLine,
  withHighcharts,
  AreaSeries,
  ColumnSeries,
} from "react-jsx-highcharts";

import { useUIContext } from "@/contexts/UIContext";
import Highcharts from "highcharts/highstock";
import highchartsPatternFill from "highcharts/modules/pattern-fill";
import { fill } from "lodash";
import { useMaster } from "@/contexts/MasterContext";
import { fullBrowserVersion } from "react-device-detect";
import "@/app/highcharts.axis.css";
import ChartWatermark from "../ChartWatermark";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

export default function OverviewChart({
  data,
  master,
  selectedTimespan,
  timespans,
  setSelectedTimespan,
  selectedMode,
  selectedValue,
  selectedCategory,
  selectedChain,
  forceSelectedChain,
  categories,
  hoveredCategories,
  allCats,
  forceHoveredChartSeriesId,
  setHoveredChartSeriesId,
  hoveredChartSeriesId,
}: {
  data: Chains;
  master: MasterResponse | undefined;
  selectedTimespan: string;
  timespans: Object;
  setSelectedTimespan: (timespan: string) => void;
  selectedMode: string;
  selectedValue: string;
  selectedCategory: string;
  selectedChain: string | null;
  forceSelectedChain?: string;
  categories: Object;
  hoveredCategories: string[];
  allCats: boolean;
  hoveredChartSeriesId: string;
  forceHoveredChartSeriesId: string;
  setHoveredChartSeriesId: (series: string) => void;
}) {
  const { AllChainsByKeys } = useMaster();
  const standardChainKey = forceSelectedChain ? forceSelectedChain : "all_l2s";
  const chartComponent: MutableRefObject<Highcharts.Chart | null | undefined> =
    useRef<Highcharts.Chart | null | undefined>(null);
  const [chainEcosystemFilter, setChainEcosystemFilter] = useSessionStorage(
    "chainEcosystemFilter",
    "all-chains",
  );
  const reversePerformer = false;
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { isMobile } = useUIContext();
  const { theme } = useTheme();
  const types =
    selectedChain === null
      ? data[standardChainKey].daily.types
      : data[selectedChain].daily.types;

  const valuePrefix = useMemo(() => {
    if (showUsd) return "$";
    // eth symbol
    return "Ξ";
  }, [showUsd]);

  // const categoryKeyToFillOpacity = {
  //   nft: 1 - 0,
  //   token_transfers: 1 - 0.196,
  //   defi: 1 - 0.33,
  //   social: 1 - 0.463,
  //   cefi: 1 - 0.596,
  //   utility: 1 - 0.733,
  //   cross_chain: 1 - 0.867,
  //   unlabeled: 1 - 0.92,
  // };

  const chartStack = useMemo(() => {
    let ecosystemData: any[][] = [];

    const txIndex = data[standardChainKey].daily.types.findIndex(
      (item) => item === "txcount_absolute",
    );
    const gasIndex = data[standardChainKey].daily.types.findIndex(
      (item) =>
        item ===
        (selectedMode.includes("usd")
          ? "gas_fees_usd_absolute"
          : "gas_fees_share_eth"),
    );

    for (const chain in data) {
      if (chain !== "all_l2s") {
        const ecosystemFilter: any[][] =
          data[chain].daily[selectedCategory].data;
        ecosystemData.push(ecosystemFilter);
      }
    }

    const unixList = ecosystemData
      .reduce((acc, curr) => {
        return [...acc, ...curr.map((item) => item[0])];
      }, [])
      .sort((a, b) => a - b)
      .filter((item, i, arr) => {
        return i === 0 || item !== arr[i - 1];
      });

    const unixData = unixList
      .map((unix) => {
        const unixValues = ecosystemData.map((data) => {
          const index = data.findIndex((item) => item[0] === unix);
          return index !== -1 ? data[index] : null;
        });

        return unixValues;
      })
      .map((unixValues) => unixValues.filter((item) => item));

    const chartData = unixData.map((unixDataList: any[][]) => {
      //Get absolute index for share calculation
      const numArrays = unixDataList.length;
      const calculatedData: any[] = [];

      for (let i = 0; i < unixDataList[0].length; i++) {
        if (i === 0) {
          calculatedData.push(unixDataList[0][i]);
        } else {
          let retValue;
          let allTotal = 0;
          const sum = unixDataList.reduce(
            (acc, curr) => acc + (curr[i] || 0),
            0,
          );

          if (selectedMode.includes("share")) {
            let txTotal = 0;
            let findUnix = unixDataList[0][0];
            for (let j = 0; j < numArrays; j++) {
              txTotal +=
                unixDataList[j][
                selectedMode.includes("txcount") ? txIndex : gasIndex
                ];
            }

            for (let category in data[standardChainKey].daily) {
              if (category !== "types") {
                let checkIndex = data[standardChainKey].daily[
                  category
                ].data.findIndex((item) => item[0] === findUnix);
                allTotal +=
                  checkIndex !== -1
                    ? data[standardChainKey].daily[selectedCategory].data[
                    data[standardChainKey].daily[
                      selectedCategory
                    ].data.findIndex((item) => item[0] === findUnix)
                    ][selectedMode.includes("txcount") ? txIndex : gasIndex]
                    : 0;
              }
            }
            retValue = txTotal / allTotal;
          } else {
            retValue = sum;
          }

          calculatedData.push(retValue);
        }
      }

      return calculatedData;
    });

    return chartData;
  }, [data, selectedCategory, selectedMode, standardChainKey]);

  const chartAvg = useMemo(() => {
    let typeIndex = data[standardChainKey].daily["types"].indexOf(selectedMode);
    let overviewIndex =
      data[standardChainKey]["overview"]["types"].indexOf(selectedMode);

    let returnValue = 0;

    if (selectedMode.includes("absolute")) {
      return null;
    }

    if (selectedChain) {
      let sum = 0;
      if (selectedMode.includes("share")) {
        returnValue = data[selectedChain].overview[selectedTimespan][
          selectedCategory
        ].data
          ? data[selectedChain].overview[selectedTimespan][selectedCategory]
            .data[overviewIndex]
          : [];
      } else {
        for (
          let i = 0;
          i <
          (selectedTimespan === "max"
            ? data[selectedChain].daily[selectedCategory].data.length
            : timespans[selectedTimespan].value);
          i++
        ) {
          if (
            data[selectedChain].daily[selectedCategory].data.length - (i + 1) >=
            0
          ) {
            sum +=
              data[selectedChain].daily[selectedCategory].data[
              data[selectedChain].daily[selectedCategory].data.length -
              (i + 1)
              ][typeIndex];
          }
        }
        returnValue =
          sum /
          (selectedTimespan === "max"
            ? data[selectedChain].daily[selectedCategory].data.length
            : timespans[selectedTimespan].value >=
              data[selectedChain].daily[selectedCategory].data.length
              ? data[selectedChain].daily[selectedCategory].data.length
              : timespans[selectedTimespan].value);
      }
    } else {
      if (chainEcosystemFilter === "all-chains") {
        let sum = 0;
        for (
          let i = 0;
          i <
          (selectedTimespan === "max"
            ? data[standardChainKey].daily[selectedCategory].data.length
            : timespans[selectedTimespan].value);
          i++
        ) {
          if (
            data[standardChainKey].daily[selectedCategory].data.length -
            (i + 1) >=
            0
          ) {
            sum +=
              data[standardChainKey].daily[selectedCategory].data[
              data[standardChainKey].daily[selectedCategory].data.length -
              (i + 1)
              ][typeIndex];
          }
        }

        returnValue =
          sum /
          (selectedTimespan === "max"
            ? data[standardChainKey].daily[selectedCategory].data.length
            : timespans[selectedTimespan].value >=
              data[standardChainKey].daily[selectedCategory].data.length
              ? data[standardChainKey].daily[selectedCategory].data.length
              : timespans[selectedTimespan].value);
      } else {
        let sum = 0;
        for (
          let i = 0;
          i <
          (selectedTimespan === "max"
            ? chartStack.length
            : timespans[selectedTimespan].value);
          i++
        ) {
          if (chartStack.length - (i + 1) >= 0) {
            sum += chartStack[chartStack.length - (i + 1)][typeIndex];
          }

          returnValue =
            sum /
            (selectedTimespan === "max"
              ? chartStack.length
              : timespans[selectedTimespan].value >= chartStack.length
                ? chartStack.length
                : timespans[selectedTimespan].value);
        }
      }
    }

    return returnValue;
  }, [
    data,
    standardChainKey,
    selectedMode,
    selectedChain,
    selectedTimespan,
    selectedCategory,
    timespans,
    chainEcosystemFilter,
    chartStack,
  ]);

  const chartMax = useMemo(() => {
    let returnValue = 0;
    let typeIndex = data[standardChainKey].daily["types"].indexOf(selectedMode);

    //define data set to be used
    const selectedData = selectedChain
      ? data[selectedChain].daily[selectedCategory].data
      : chainEcosystemFilter === "all-chains"
        ? data[standardChainKey].daily[selectedCategory].data
        : chartStack;

    //Determine array length based on selection
    const length =
      selectedTimespan === "max"
        ? selectedData.length
        : timespans[selectedTimespan].value;

    if (forceSelectedChain) {
      // if share mode, return 100
      if (selectedMode.includes("share")) {
        return 1;
      }

      // if absolute mode, return undefined so that the chart can auto-scale
      return undefined;
    }

    for (let i = 0; i < length; i++) {
      const traverse = selectedData[selectedData.length - (i + 1)];
      if (traverse && traverse[typeIndex] > returnValue) {
        returnValue = traverse[typeIndex];
      }
    }

    let roundingFactor = selectedMode.includes("share") ? 0.05 : 1; // 0.05 for percentages, 1000 for absolute values
    returnValue = returnValue / roundingFactor;
    returnValue = Math.ceil(returnValue) * roundingFactor;

    if (!selectedMode.includes("share") && returnValue > 10000) {
      returnValue = Math.ceil(returnValue / 10000) * 10000;
    }

    return returnValue;
  }, [
    data,
    standardChainKey,
    selectedMode,
    selectedChain,
    selectedCategory,
    chainEcosystemFilter,
    chartStack,
    selectedTimespan,
    timespans,
    forceSelectedChain,
  ]);

  const categoriesList = useMemo(() => {
    return Object.keys(master?.blockspace_categories.main_categories || {})
      .filter((category) => category !== "types")
      .reverse();
  }, [master]);



  const categoriesAllCatChartListOrder = useMemo(() => {
    return categoriesList.reverse();
  }, [categoriesList]);

  const getFillOpacity = useCallback(
    (index: number) => {
      let x = categoriesAllCatChartListOrder.length - 1 - index;
      return 0.02 * Math.pow(x, 2) - 0.28 * x + 1.27;
    },
    [categoriesAllCatChartListOrder],
  );

  const chartSeries = useMemo(() => {
    const dataKey = selectedMode;
    if (selectedChain) {
      //   id: [selectedChain, selectedCategory, selectedMode].join("_"),
      //   name: selectedChain,
      //   unixKey: "unix",
      //   dataKey: dataKey,
      //   data: data[selectedChain].daily[selectedCategory].data.length,
      // });

      if (allCats) {
        return categoriesList
          .filter((categoryCheck) => {
            let dataRet = data[selectedChain]?.daily[categoryCheck]?.data || [];
            return dataRet.length > 0;
          })
          .map((categoryCheck, i) => ({
            id: [selectedChain, categoryCheck, selectedMode].join("::"),
            name: selectedChain,
            unixKey: "unix",
            dataKey: dataKey,
            data: data[selectedChain]?.daily[categoryCheck]?.data || [],
            // fillOpacity: categoryKeyToFillOpacity[categoryCheck],
            fillOpacity:
              categoryCheck === "unlabeled" ? undefined : getFillOpacity(i),
            pattern:
              categoryCheck === "unlabeled"
                ? {
                  color: AllChainsByKeys[standardChainKey].colors["dark"][0],
                  path: {
                    d: "M 10 0 L 0 10 M 9 11 L 11 9 M -1 1 L 1 -1",
                    strokeWidth: 3,
                  },
                  width: 10,
                  height: 10,
                  opacity: 0.33,
                }
                : undefined,
            lineWidth: 0,
            custom: {
              tooltipLabel: categories[categoryCheck],
            },
          }));
      } else {
        return [
          {
            id: [selectedChain, selectedCategory, selectedMode].join("::"),
            name: selectedChain,
            unixKey: "unix",
            dataKey: dataKey,
            data: data[selectedChain].daily[selectedCategory].data,
            fillOpacity: 0.25,
            pattern:
              selectedCategory === "unlabeled"
                ? {
                  color: AllChainsByKeys[standardChainKey].colors["dark"][0],
                  path: {
                    d: "M 10 0 L 0 10 M 9 11 L 11 9 M -1 1 L 1 -1",
                    strokeWidth: 3,
                  },
                  width: 10,
                  height: 10,
                  opacity: 0.33,
                }
                : undefined,
            custom: {
              tooltipLabel: categories[selectedCategory],
            },
          },
        ];
      }
    }

    // return Object.keys(data)
    //   .filter(
    //     (chainKey) =>
    //       chainKey !== "all_l2s" &&
    //       data[chainKey].daily[selectedCategory].data.length > 0,
    //   )
    //   .map((chainKey) => {
    //     return {
    //       id: [chainKey, selectedCategory, selectedMode].join("_"),
    //       name: chainKey,
    //       unixKey: "unix",
    //       dataKey: dataKey,
    //       data: data[chainKey].daily[selectedCategory].data,
    //     };
    //   });
    return [
      {
        id: ["all_l2s", selectedCategory, selectedMode].join("::"),
        name: "all_l2s",
        unixKey: "unix",
        dataKey: selectedMode,
        data:
          chainEcosystemFilter === "all-chains"
            ? data.all_l2s.daily[selectedCategory].data
            : chartStack,
        custom: { tooltipLabel: "All L2s" },
      },
    ];
  }, [
    selectedMode,
    selectedChain,
    selectedCategory,
    chainEcosystemFilter,
    data,
    chartStack,
    allCats,
    categoriesList,
    getFillOpacity,
    AllChainsByKeys,
    standardChainKey,
    categories,
  ]);

  const avgHeight = useSpring({
    y: chartAvg && chartMax ? `${chartAvg * -169}px` : "0%",
    config: { mass: 1, tension: 70, friction: 20 },
  });

  const tooltipPositioner =
    useCallback<Highcharts.TooltipPositionerCallbackFunction>(
      function (this, width, height, point) {
        const chart = this.chart;
        const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
        const tooltipWidth = width;
        const tooltipHeight = height;

        const distance = 40;
        const pointX = point.plotX + plotLeft;
        const pointY = point.plotY + plotTop;
        let tooltipX =
          pointX - distance - tooltipWidth < plotLeft
            ? pointX + distance
            : pointX - tooltipWidth - distance;

        const tooltipY =
          pointY - tooltipHeight / 2 < plotTop
            ? pointY + distance
            : pointY - tooltipHeight / 2;

        return {
          x: tooltipX,
          y: tooltipY,
        };
      },
      [isMobile],
    );

  function formatNumber(number: number): string {
    if (number === 0) {
      return "0";
    } else if (Math.abs(number) >= 1e6) {
      if (Math.abs(number) >= 1e9) {
        return (number / 1e9).toFixed(1) + "B";
      } else {
        return (number / 1e6).toFixed(1) + "M";
      }
    } else if (Math.abs(number) >= 1e3) {
      const rounded =
        Math.abs(number) >= 10000
          ? Math.round(number / 1e3)
          : (number / 1e3).toFixed(1);
      return `${rounded}${Math.abs(number) >= 10000 ? "k" : "k"}`;
    } else if (Math.abs(number) >= 100) {
      return number.toFixed(0);
    } else if (Math.abs(number) >= 10) {
      return number.toFixed(1);
    } else {
      return number.toFixed(2);
    }
  }

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points } = this;
      const date = new Date(x);
      let dateString = date.toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const chartTitle = this.series.chart.title.textStr;

      // check if data steps are less than 1 day
      // if so, add the time to the tooltip
      const timeDiff = points[0].series.xData[1] - points[0].series.xData[0];
      if (timeDiff < 1000 * 60 * 60 * 24) {
        dateString +=
          " " +
          date.toLocaleTimeString("en-GB", {
            hour: "numeric",
            minute: "2-digit",
          });
      }

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-52 md:w-60 text-xs font-raleway">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2 ">${dateString}</div>`;
      const tooltipEnd = `</div>`;

      // let pointsSum = 0;
      // if (selectedScale !== "percentage")
      let pointsSum = points.reduce((acc: number, point: any) => {
        acc += point.y;
        return acc;
      }, 0);

      let pointSumNonNegative = points.reduce((acc: number, point: any) => {
        if (point.y > 0) acc += point.y;
        return acc;
      }, 0);

      const maxPoint = points.reduce((max: number, point: any) => {
        if (point.y > max) max = point.y;
        return max;
      }, 0);

      const maxPercentage = points.reduce((max: number, point: any) => {
        if (point.percentage > max) max = point.percentage;
        return max;
      }, 0);

      const tooltipPoints = points
        .sort((a: any, b: any) => {
          return b.y - a.y;
        })

        .map((point: any, index: number) => {
          const { series, y, percentage } = point;
          const { name } = series;
          const fillOpacity = series.options.fillOpacity;

          const showPrice = selectedMode.includes("gas_fees");
          const showPercentage = selectedValue === "share";
          const color =
            AllChainsByKeys[selectedChain ? selectedChain : "all_l2s"].colors[
            theme ?? "dark"
            ][0];



          let prefix =
            showPercentage || !showPrice || selectedMode.includes("txcount")
              ? ""
              : valuePrefix;
          let suffix = showPercentage ? "%" : "";
          let value = y;
          let displayValue = y;

          return `
          <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
        <div class="relative w-4 h-1.5 rounded-r-full bg-white dark:bg-forest-1000">

          <div class="absolute w-4 h-1.5 rounded-r-full" style="
            background-color: ${color};
            opacity: ${fillOpacity};
          ">
          </div>
        
        </div>
        <div class="tooltip-point-name">${name}</div>
         <div class="flex-1 text-right justify-end flex numbers-xs">
        <div>${prefix}</div>
          <div>${Intl.NumberFormat("en-GB", {
            notation: "compact",
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          }).format(showPercentage ? 100 * Number(value) : value)}</div>
          <div>${suffix}</div>
          </div>
      </div>
      <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
        <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white dark:bg-forest-1000" style="
          width: ${(percentage / maxPercentage) * 100}%;
        ">
        </div>

        <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" style="
          width: ${(percentage / maxPercentage) * 100}%;
          background-color: ${color};
          opacity: ${fillOpacity};
        ">
        </div>
      </div>`;
        })
        .join("");

      return tooltip + tooltipPoints + tooltipEnd;
    },
    [valuePrefix, reversePerformer, showUsd, selectedValue, selectedChain, selectedMode],
  );

  const decimalPercentageToHex = (percentage: number) => {
    const hex = Math.round(percentage * 255).toString(16);

    return hex.length === 1 ? "0" + hex : hex;
  };

  useEffect(() => {
    if (allCats === true && chartComponent.current && chartSeries.length > 1) {
      if (
        !forceHoveredChartSeriesId ||
        forceHoveredChartSeriesId.includes("all_chain")
      ) {
        chartComponent.current.series.forEach((s: Highcharts.Series) => {
          s.setState("normal");
          if (s.options.custom) {
            s.options["fillColor"] = s.options.custom.fillColor;
          }
        });
      } else {
        chartComponent.current.series.forEach(
          (s: Highcharts.Series, i: number) => {
            if (s.options.id === forceHoveredChartSeriesId) {
              s.setState("hover");
              if (s.name === "unlabeled") {
                s.options["pattern"] = {
                  color: AllChainsByKeys[standardChainKey].colors["dark"][0],
                  path: {
                    d: "M 10 0 L 0 10 M 9 11 L 11 9 M -1 1 L 1 -1",
                    strokeWidth: 3,
                  },
                  width: 10,
                  height: 10,
                  opacity: 1,
                };
                s.options["fillOpacity"] = undefined;
              } else {
                s.options["fillOpacity"] = 1;
              }
              if (s.options.custom) {
                // s.options["fillColor"] = s.options.custom.chainColor;
              }
            } else {
              s.setState("inactive");
              if (s.name === "unlabeled") {
                s.options["pattern"] = {
                  color: AllChainsByKeys[standardChainKey].colors["dark"][0],
                  path: {
                    d: "M 10 0 L 0 10 M 9 11 L 11 9 M -1 1 L 1 -1",
                    strokeWidth: 3,
                  },
                  width: 10,
                  height: 10,
                  opacity: 0.33,
                };
                s.options["fillOpacity"] = undefined;
              } else {
                s.options["fillOpacity"] = getFillOpacity(i);
              }

              if (s.options.custom) {
                // s.options["fillColor"] = s.options.custom.fillColor;
              }
            }
          },
        );
      }
    }
  }, [
    forceHoveredChartSeriesId,
    chartSeries,
    allCats,
    hoveredCategories,
    AllChainsByKeys,
    standardChainKey,
    getFillOpacity,
  ]);

  useEffect(() => {
    // set numeric symbols for highcharts
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });
    // apply highcharts pattern fill module
    highchartsPatternFill(Highcharts);
  }, []);


  return (
    <>
      <div className="w-full h-[249px] flex items-center">
        <div
          className={`relative bg-blend-lighten h-full ${!allCats && selectedValue === "share" ? "w-[96%]" : "w-full"
            }`}
        >
          <HighchartsProvider Highcharts={Highcharts}>
            <HighchartsChart
              containerProps={{
                style: {
                  height: "100%",
                  width: "100%",
                  marginLeft: "auto",
                  marginRight: "auto",
                  overflow: "visible",
                },
              }}
              plotOptions={{
                area: {
                  lineWidth: 2,
                  // marker: {
                  //   radius: 12,
                  //   lineWidth: 4,
                  // },
                  fillOpacity: 1,
                  stacking: "normal",

                  // shadow: {
                  //   color:
                  //     AllChainsByKeys[data.chain_id]?.colors[theme ?? "dark"][1] + "33",
                  //   width: 10,
                  // },

                  // borderColor: AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][0],
                  // borderWidth: 1,
                },
                series: {
                  zIndex: 10,
                  animation: false,
                  marker: {
                    lineColor: "white",
                    radius: 0,
                    symbol: "circle",
                  },
                },
              }}
            >
              <Chart
                backgroundColor={"transparent"}
                type="area"
                panning={{ enabled: true }}
                panKey="shift"
                zooming={{ type: undefined }}
                style={{ borderRadius: 15 }}
                animation={{ duration: 50 }}
                // margin={[0, 15, 0, 0]} // Use the array form for margin
                margin={[30, 10, 50, 50]}
                spacingBottom={30}
                spacingTop={40}
                spacingLeft={10}
                spacingRight={10}
                height={249}
                onRender={(chart) => {
                  if (chart && chart.target) {
                    chartComponent.current =
                      chart.target as unknown as Highcharts.Chart;
                  }
                }}
              />
              <Tooltip
                useHTML={true}
                shared={true}
                split={false}
                followPointer={true}
                followTouchMove={true}
                backgroundColor={"#2A3433EE"}
                padding={0}
                hideDelay={300}
                stickOnContact={true}
                shape="rect"
                borderRadius={17}
                borderWidth={0}
                outside={true}
                shadow={{
                  color: "black",
                  opacity: 0.015,
                  offsetX: 2,
                  offsetY: 2,
                }}
                style={{
                  color: "rgb(215, 223, 222)",
                }}
                //formatter={tooltipFormatter}
                // ensure tooltip is always above the chart
                positioner={tooltipPositioner}
                valuePrefix={"$"}
                valueSuffix={""}
                formatter={tooltipFormatter}
              />
              <XAxis
                title={undefined}
                type="datetime"
                crosshair={{
                  width: 0.5,
                  color: COLORS.PLOT_LINE,
                  snap: true,
                }}
                zoomEnabled={false}
                tickWidth={1}
                tickLength={25}
                tickColor={"#CDD8D34C"}
                ordinal={false}
                gridLineWidth={0}
                minorTicks={false}
                minTickInterval={
                  timespans[selectedTimespan].xMax -
                    timespans[selectedTimespan].xMin <=
                    40 * 24 * 3600 * 1000
                    ? 24 * 3600 * 1000
                    : 30 * 24 * 3600 * 1000
                }
                min={
                  timespans[selectedTimespan].xMin
                    ? timespans[selectedTimespan].xMin
                    : undefined
                }
                labels={{
                  y: 40,
                  align: undefined,
                  rotation: 0,
                  allowOverlap: false,

                  reserveSpace: true,
                  overflow: "justify",
                  useHTML: true,
                  style: {
                    textAlign: "bottom",
                    color: "#CDD8D3",
                    fontSize: "12px",
                    marginTop: "10px",
                  },

                  formatter: (function () {
                    return function () {
                      if (
                        timespans[selectedTimespan].xMax -
                        timespans[selectedTimespan].xMin <=
                        40 * 24 * 3600 * 1000
                      ) {
                        let isBeginningOfWeek =
                          new Date(this.value).getUTCDay() === 1;
                        let showMonth =
                          this.isFirst ||
                          new Date(this.value).getUTCDate() === 1;
                        return new Date(this.value).toLocaleDateString(
                          "en-GB",
                          {
                            timeZone: "UTC",
                            month: "short",
                            day: "numeric",
                            year: this.isFirst ? "numeric" : undefined,
                          },
                        );
                      } else {
                        // if Jan 1st, show year
                        if (new Date(this.value).getUTCMonth() === 0) {
                          return `<span style="font-size: 14px; font-weight: 600;">
                  ${new Date(this.value).toLocaleDateString("en-GB", {
                            timeZone: "UTC",
                            year: "numeric",
                          })}
                </span>`;
                        }
                        return new Date(this.value).toLocaleDateString(
                          "en-GB",
                          {
                            timeZone: "UTC",
                            month: "short",
                            year: "numeric",
                          },
                        );
                      }
                    };
                  })(),
                }}
              >
                <XAxis.Title></XAxis.Title>
              </XAxis>
              <YAxis
                opposite={false}
                // showFirstLabel={true}
                // showLastLabel={true}

                type="linear"
                max={selectedValue === "share" ? 1 : undefined}
                min={selectedValue === "share" ? 0 : undefined}
                gridLineWidth={1}
                gridLineColor={"#5A64624F"}
                zoomEnabled={false}
                tickAmount={3}
                labels={{
                  align: "right",
                  y: 2,
                  x: -4,
                  style: {
                    color: "rgb(215, 223, 222)",
                    fontSize: "10px",
                    fontWeight: "700",
                  },
                  formatter: function () {
                    const value = this.value as number | bigint;
                    const isPercentage = selectedValue === "share";
                    const prefix =
                      isPercentage || selectedMode.includes("txcount")
                        ? ""
                        : valuePrefix;
                    const suffix = isPercentage ? "%" : "";
                    return (
                      prefix +
                      Intl.NumberFormat("en-GB", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                        minimumFractionDigits: 0,
                      }).format(isPercentage ? 100 * Number(value) : value) +
                      suffix
                    );
                  },
                }}
              >
                <PlotLine
                  color={
                    AllChainsByKeys[selectedChain ? selectedChain : "all_l2s"]
                      .colors[theme ?? "dark"][0]
                  }
                  value={!allCats && chartAvg ? chartAvg : undefined}
                  width={1}
                  dashStyle={"Dash"}
                />
                {chartSeries.map((series, index) => {
                  const isUnlabelled =
                    series.custom.tooltipLabel === "Unlabeled";
                  const pattern = series.pattern;
                  const fillHexColorOpacity = series.fillOpacity
                    ? decimalPercentageToHex(series.fillOpacity)
                    : "40";
                  let fillColor =
                    allCats === true
                      ? undefined
                      : AllChainsByKeys[standardChainKey].colors[
                      theme ?? "dark"
                      ][0] + fillHexColorOpacity;

                  return (
                    series && (
                      <AreaSeries
                        key={index} // Add a key to each element in the list
                        name={series.custom.tooltipLabel}
                        id={series.id}
                        color={
                          !selectedChain
                            ? {
                              linearGradient: {
                                x1: 0,
                                x2: 0,
                                y1: 0,
                                y2: 1,
                              },
                              stops:
                                theme === "dark"
                                  ? [
                                    [
                                      0,
                                      AllChainsByKeys[
                                        selectedChain
                                          ? selectedChain
                                          : "all_l2s"
                                      ]?.colors[theme ?? "dark"][0] + "F9",
                                    ],
                                    [
                                      1,
                                      AllChainsByKeys[
                                        selectedChain
                                          ? selectedChain
                                          : "all_l2s"
                                      ]?.colors[theme ?? "dark"][1] + "F9",
                                    ],
                                  ]
                                  : [],
                            }
                            : AllChainsByKeys[series.name].colors[
                            theme ?? "dark"
                            ][0]
                        }
                        lineWidth={allCats ? 0 : 2}
                        data={series.data.map((d: any) => [
                          d[types.indexOf("unix")],
                          d[types.indexOf(series.dataKey)],
                        ])}
                        fillOpacity={
                          !isUnlabelled
                            ? series.fillOpacity
                            : allCats
                              ? 0.05
                              : series.fillOpacity
                        }
                        fillColor={
                          !isUnlabelled && !selectedChain
                            ? {
                              linearGradient: {
                                x1: 0,
                                x2: 0,
                                y1: 0,
                                y2: 1,
                              },
                              stops:
                                theme === "dark"
                                  ? [
                                    [
                                      0,
                                      AllChainsByKeys[
                                        selectedChain
                                          ? selectedChain
                                          : "all_l2s"
                                      ]?.colors[theme ?? "dark"][0] + "33",
                                    ],
                                    [
                                      1,
                                      AllChainsByKeys[
                                        selectedChain
                                          ? selectedChain
                                          : "all_l2s"
                                      ]?.colors[theme ?? "dark"][1] + "33",
                                    ],
                                  ]
                                  : [],
                            }
                            : isUnlabelled && allCats
                              ? {
                                pattern: {
                                  ...pattern,
                                  opacity:
                                    forceHoveredChartSeriesId === series.id
                                      ? 1
                                      : 0.33,
                                },
                              }
                              : undefined
                        }
                      />
                    )
                  );
                })}
              </YAxis>
            </HighchartsChart>
          </HighchartsProvider>
          <div className="absolute bottom-[60px] top-[30px] left-[43px] right-[10px] flex items-center justify-center pointer-events-none z-0 opacity-20">
            <ChartWatermark className="w-[128.67px] md:w-[192.87px] text-forest-300 dark:text-[#EAECEB]" />
          </div>
        </div>
        {chartAvg && (
          <div
            className={` items-end relative top-[2px] min-w-[50px] h-[169px]  lg:min-w-[70px] ${allCats ? "hidden" : "flex"
              }`}
          >
            <animated.div
              className="flex h-[28px] relative items-center justify-center rounded-full w-full px-2.5 lg:text-base text-sm font-medium"
              style={{
                backgroundColor:
                  AllChainsByKeys[selectedChain ? selectedChain : "all_l2s"]
                    ?.colors[theme ?? "dark"][0],
                color: selectedChain
                  ? selectedChain === "arbitrum" || "linea"
                    ? "black"
                    : "white"
                  : "black",
                ...avgHeight,
              }}
            >
              {selectedMode.includes("share")
                ? (chartAvg * 100).toFixed(2) + "%"
                : (showUsd ? "$ " : "Ξ ") + formatNumber(chartAvg)}
            </animated.div>
          </div>
        )}
      </div>
    </>
  );
}
