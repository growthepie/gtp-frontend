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

export default function OverviewChart({
  data,
  master,
  selectedTimespan,
  setSelectedTimespan,
  selectedMode,
  selectedValue,
  selectedCategory,
  selectedChain,
  forceSelectedChain,
  categories,
}: {
  data: Chains;
  master: Object;
  selectedTimespan: string;
  setSelectedTimespan: (timespan: string) => void;
  selectedMode: string;
  selectedValue: string;
  selectedCategory: string;
  selectedChain: string;
  forceSelectedChain?: string;
  categories: Object;
}) {
  const standardChainKey = forceSelectedChain ? forceSelectedChain : "all_l2s";
  const [chainEcosystemFilter, setChainEcosystemFilter] = useLocalStorage(
    "chainEcosystemFilter",
    "all-chains",
  );

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

    if (forceSelectedChain) {
      // if share mode, return 100
      if (selectedMode.includes("share")) {
        return 1;
      }

      // if absolute mode, return undefined so that the chart can auto-scale
      return undefined;
    }

    if (selectedChain) {
      for (
        let i = 0;
        i <
        (selectedTimespan === "max"
          ? data[selectedChain].daily[selectedCategory].data.length
          : timespans[selectedTimespan].value);
        i++
      ) {
        const traverse = data[selectedChain].daily[selectedCategory];
        if (traverse.data.length - (i + 1) >= 0) {
          if (
            traverse.data[
              data[selectedChain].daily[selectedCategory].data.length - (i + 1)
            ][typeIndex] > returnValue
          ) {
            returnValue =
              traverse.data[
                data[selectedChain].daily[selectedCategory].data.length -
                  (i + 1)
              ][typeIndex];
          }
        }
      }
    } else {
      if (chainEcosystemFilter === "all-chains") {
        for (
          let i = 0;
          i <
          (selectedTimespan === "max"
            ? data[standardChainKey].daily[selectedCategory].data.length
            : timespans[selectedTimespan].value);
          i++
        ) {
          const traverse = data[standardChainKey].daily[selectedCategory];
          if (traverse.data.length - (i + 1) >= 0) {
            if (
              traverse.data[
                data[standardChainKey].daily[selectedCategory].data.length -
                  (i + 1)
              ][typeIndex] > returnValue
            ) {
              returnValue =
                traverse.data[
                  data[standardChainKey].daily[selectedCategory].data.length -
                    (i + 1)
                ][typeIndex];
            }
          }
        }
      } else {
        for (
          let i = 0;
          i <
          (selectedTimespan === "max"
            ? chartStack.length
            : timespans[selectedTimespan].value);
          i++
        ) {
          if (chartStack.length - (i + 1) >= 0) {
            if (
              chartStack[chartStack.length - (i + 1)][typeIndex] > returnValue
            ) {
              returnValue = chartStack[chartStack.length - (i + 1)][typeIndex];
            }
          }
        }
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

  const chartSeries = useMemo(() => {
    const dataKey = selectedMode;
    if (selectedChain) {
      //   id: [selectedChain, selectedCategory, selectedMode].join("_"),
      //   name: selectedChain,
      //   unixKey: "unix",
      //   dataKey: dataKey,
      //   data: data[selectedChain].daily[selectedCategory].data.length,
      // });
      if (forceSelectedChain) {
        return [
          ...Object.keys(data[selectedChain]?.daily || {})
            .filter((category) => category !== "types") // Exclude the "types" category
            .reverse()
            .map((category) => ({
              id: [selectedChain, category, selectedMode].join("_"),
              name: selectedChain,
              unixKey: "unix",
              dataKey: dataKey,
              data: data[selectedChain]?.daily[category]?.data || [],
              fillOpacity: categoryKeyToFillOpacity[category],
              lineWidth: 0,
              custom: {
                tooltipLabel: categories[category],
              },
            })),
        ];
      } else {
        return [
          {
            id: [selectedChain, selectedCategory, selectedMode].join("_"),
            name: selectedChain,
            unixKey: "unix",
            dataKey: dataKey,
            data: data[selectedChain].daily[selectedCategory].data,
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
        id: ["all_l2s", selectedCategory, selectedMode].join("_"),
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
    categoryKeyToFillOpacity,
    forceSelectedChain,
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

  return (
    <>
      <div className="mt-[20px] lg:mt-[50px] mb-[38px] ">
        <h2 className="text-[20px] font-bold">
          {!forceSelectedChain ? (
            (selectedChain
              ? AllChainsByKeys[selectedChain].label
              : chainEcosystemFilter === "all-chains"
              ? "All Chains"
              : chainEcosystemFilter === "op-stack"
              ? "OP Stack Chains"
              : "OP Superchain") +
            (": " + categories[selectedCategory])
          ) : (
            <></>
          )}
        </h2>
      </div>
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
          chartAvg={!forceSelectedChain ? chartAvg || undefined : undefined}
        />
        {chartAvg && (
          <div
            className={` items-end relative top-[2px] min-w-[50px] lg:min-w-[70px] ${
              forceSelectedChain ? "hidden" : "flex"
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
