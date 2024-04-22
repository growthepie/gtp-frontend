import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  CSSProperties,
} from "react";
import { useLocalStorage } from "usehooks-ts";
import { Chart } from "../../charts/chart";
import { color } from "highcharts";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { Chains } from "@/types/api/ChainOverviewResponse";
import { animated, useSpring } from "@react-spring/web";
import { AllChainsByKeys } from "@/lib/chains";
import { MasterResponse } from "@/types/api/MasterResponse";

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
  chartComponent,
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
  chartComponent: React.MutableRefObject<Highcharts.Chart | null | undefined>;
}) {
  const standardChainKey = forceSelectedChain ? forceSelectedChain : "all_l2s";
  const [chainEcosystemFilter, setChainEcosystemFilter] = useLocalStorage(
    "chainEcosystemFilter",
    "all-chains",
  );
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const { theme } = useTheme();
  const categoryKeyToFillOpacity = {
    nft: 1 - 0,
    token_transfers: 1 - 0.196,
    defi: 1 - 0.33,
    social: 1 - 0.463,
    cefi: 1 - 0.596,
    utility: 1 - 0.733,
    cross_chain: 1 - 0.867,
    unlabeled: 1 - 0.92,
  };

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
  }, [data, selectedCategory, selectedMode]);

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
    selectedTimespan,
    selectedMode,
    selectedCategory,
    selectedChain,
    chainEcosystemFilter,
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
    selectedTimespan,
    selectedCategory,
    selectedMode,
    selectedChain,
    chainEcosystemFilter,
  ]);

  const categoriesList = useMemo(() => {
    return Object.keys(data[standardChainKey].daily)
      .filter((category) => category !== "types")
      .reverse();
  }, [data, standardChainKey]);

  const categoriesAllCatChartListOrder = useMemo(() => {
    return categoriesList.reverse();
  }, [categoriesList]);

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
          .map((categoryCheck) => ({
            id: [selectedChain, categoryCheck, selectedMode].join("::"),
            name: selectedChain,
            unixKey: "unix",
            dataKey: dataKey,
            data: data[selectedChain]?.daily[categoryCheck]?.data || [],
            fillOpacity: categoryKeyToFillOpacity[categoryCheck],
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
    categoriesAllCatChartListOrder,
    categories,
  ]);

  const avgHeight = useSpring({
    y:
      chartAvg && chartMax
        ? -1 *
          ((forceSelectedChain ? 200 : 163) * (chartAvg / chartMax) +
            (chartAvg / chartMax > 0.45
              ? chartAvg / chartMax > 0.5
                ? 7
                : 10
              : 14))
        : 0,
    config: { mass: 1, tension: 70, friction: 20 },
  });

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
      return `${rounded}${Math.abs(number) >= 10000 ? "K" : "k"}`;
    } else if (Math.abs(number) >= 100) {
      return number.toFixed(0);
    } else if (Math.abs(number) >= 10) {
      return number.toFixed(1);
    } else {
      return number.toFixed(2);
    }
  }

  console.log(chartComponent.current ? chartComponent.current : "");
  console.log(chartSeries ? chartSeries : "");

  return (
    <>
      <div className="flex items-center w-full ">
        <Chart
          types={
            selectedChain === null
              ? data[standardChainKey].daily.types
              : data[selectedChain].daily.types
          }
          chartType="area"
          stack
          timespan={selectedTimespan}
          series={chartSeries}
          yScale={selectedValue === "share" ? "percentageDecimal" : "linear"}
          chartHeight={forceSelectedChain ? "259px" : "196px"}
          chartWidth="100%"
          maxY={chartMax}
          chartAvg={!allCats ? chartAvg || undefined : undefined}
          forceHoveredChartSeriesId={forceHoveredChartSeriesId}
          setHoveredChartSeriesId={setHoveredChartSeriesId}
          hoveredChartSeriesId={hoveredChartSeriesId}
          allCats={allCats}
          chartRef={chartComponent}
        />
        {chartAvg && (
          <div
            className={` items-end relative top-[2px] min-w-[50px] lg:min-w-[70px] ${
              allCats ? "hidden" : "flex"
            } ${forceSelectedChain ? "h-[230px]" : "h-[180px]"}`}
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
