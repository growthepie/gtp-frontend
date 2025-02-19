"use client";
import Image from "next/image";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";

import { useLocalStorage, useSessionStorage, useMediaQuery } from "usehooks-ts";
import { useSearchParams } from "next/navigation";
import Container from "@/components/layout/Container";
import { CategoryComparisonResponseData } from "@/types/api/CategoryComparisonResponse";
import { animated, useTransition } from "@react-spring/web";
import { Chart } from "@/components/charts/chart";
import { Get_SupportedChainKeys } from "@/lib/chains";
import CategoryContracts from "./CategoryContracts";
import { MasterURL } from "@/lib/urls";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import ChainAnimations from "@/components/layout/ChainAnimations";
import { useUIContext } from "@/contexts/UIContext";
import CategoryBar from "@/components/layout/CategoryBar";
import {
  TopRowContainer,
  TopRowChild,
  TopRowParent,
} from "@/components/layout/TopRow";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { useCategory } from "../../../../contexts/CategoryCompContext";
import { useMaster } from "@/contexts/MasterContext";

export default function CategoryMetrics({
  data,
  selectedTimespan,
  setSelectedTimespan,
}: {
  data: CategoryComparisonResponseData;
  selectedTimespan: string;
  setSelectedTimespan: (timespan: string) => void;
}) {
  const { AllChainsByKeys } = useMaster();
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const searchParams = useSearchParams();

  // get the category from the url
  const queryCategory = searchParams?.get("category");
  // subcategories is an array of strings
  const querySubcategories = searchParams?.get("subcategories")?.split(",");

  type ContractInfo = {
    address: string;
    project_name: string;
    name: string;
    main_category_key: string;
    sub_category_key: string;
    chain: string;
    gas_fees_absolute_eth: number;
    gas_fees_absolute_usd: number;
    gas_fees_share: number;
    txcount_absolute: number;
    txcount_share: number;
  };

  type ChainData = {
    id: string;
    name: string;
    unixKey: string;
    dataKey: string;
    data: any[];
  };

  const { isSidebarOpen } = useUIContext();
  const [selectedMode, setSelectedMode] = useState("gas_fees_");
  const [selectedCategory, setSelectedCategory] = useState(
    queryCategory ?? "nft",
  );
  const [contractHover, setContractHover] = useState({});

  const [animationFinished, setAnimationFinished] = useState(true);
  const [exitAnimation, setExitAnimation] = useState(false);

  const [selectedValue, setSelectedValue] = useState("absolute");
  const [selectedChartType, setSelectedChartType] = useState("absolute");

  const [chainValues, setChainValues] = useState<any[][] | null>(null);

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [chainEcosystemFilter, setChainEcosystemFilter] = useSessionStorage(
    "chainEcosystemFilter",
    "all-chains",
  );

  const [selectedChains, setSelectedChains] = useState<{
    [key: string]: boolean;
  }>(
    Object.entries(AllChainsByKeys).reduce((acc, [key, chain]) => {
      if (AllChainsByKeys[key].chainType === "L2") acc[key] = true;
      return acc;
    }, {}),
  );

  const { categories } = useCategory();

  const dailyKey = useMemo(() => {
    if (["180d", "max"].includes(selectedTimespan)) {
      return "daily_7d_rolling";
    } else {
      return "daily";
    }
  }, [selectedTimespan]);

  const selectedType = useMemo(() => {
    let retVal;

    if (selectedValue === "share" || selectedMode === "txcount_") {
      retVal = selectedMode + selectedValue;
    } else if (showUsd) {
      if (selectedValue === "absolute_log") {
        retVal = selectedMode + "absolute" + "_usd";
      } else {
        retVal = selectedMode + selectedValue + "_usd";
      }
    } else {
      if (selectedValue === "absolute_log") {
        retVal = selectedMode + "absolute" + "_eth";
      } else {
        retVal = selectedMode + selectedValue + "_eth";
      }
    }

    return retVal;
  }, [selectedMode, selectedValue, showUsd]);

  //Calculate type to hand off to chart and find index selectedValue for data

  const sortedChainValues = useMemo(() => {
    if (!chainValues || !selectedChains) return null;

    return chainValues
      .filter(([item]) => {
        const supportedChainKeys = Get_SupportedChainKeys(master);
        const isSupported =
          item === "all_l2s" ? true : supportedChainKeys.includes(item);
        const isMaster = master?.chains[item] ? true : false;
        const passEcosystem =
          item === "all_l2s"
            ? true
            : isMaster
              ? chainEcosystemFilter === "all-chains"
                ? true
                : master?.chains[item].bucket.includes(chainEcosystemFilter)
              : false;

        return item !== "types" && isSupported && passEcosystem;
      })
      .sort((a, b) => b[1] - a[1])
      .sort(([itemA], [itemB]) =>
        selectedChains[itemA] === selectedChains[itemB]
          ? 0
          : selectedChains[itemA]
            ? -1
            : 1,
      );
  }, [chainValues, selectedChains, chainEcosystemFilter]);

  const timespans = useMemo(() => {
    return {
      "7d": {
        label: "7 days",
        shortLabel: "7d",
        value: 7,
        xMin: Date.now() - 7 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "30d": {
        label: "30 days",
        shortLabel: "30d",
        value: 30,
        xMin: Date.now() - 30 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      // "90d": {
      //   label: "90 days",
      //   value: 90,
      // },
      "180d": {
        label: "180 days",
        shortLabel: "180d",
        value: 180,
      },
      // "365d": {
      //   label: "1 year",
      //   value: 365,
      // },
      max: {
        label: "All Time",
        shortLabel: "Max",
        value: 0,
      },
    };
  }, []);

  const updatedSubcategories = useMemo(() => {
    const initialSelectedSubcategories = {};
    Object.keys(categories).forEach((category) => {
      if (
        queryCategory === category &&
        querySubcategories &&
        querySubcategories.length > 0
      ) {
        const intersection = data[category].subcategories.list.filter(
          (subcategory) => {
            return querySubcategories.includes(subcategory);
          },
        );

        if (intersection.length > 0) {
          initialSelectedSubcategories[category] = intersection;
          return;
        }
      }

      // else use the default subcategories
      if (data[category]?.subcategories?.list) {
        initialSelectedSubcategories[category] = [
          ...data[category].subcategories.list,
        ];
      } else {
        initialSelectedSubcategories[category] = [];
      }
    });
    return initialSelectedSubcategories;
  }, [categories, queryCategory, data, querySubcategories]);

  const [selectedSubcategories, setSelectedSubcategories] =
    useState(updatedSubcategories);

  // const chartData = useMemo(() => {
  //   if (!selectedSubcategories) return [];

  //   let chartData = [];

  //   return chartData;
  // }, [selectedSubcategories]);

  const chartReturn = useMemo(() => {
    const chainArray: ChainData[] = [];

    if (!selectedSubcategories) return [];

    // get list of selectedSubcategories for the selected category
    const selectedSubcategoriesList = selectedSubcategories[selectedCategory];

    for (const currChain in selectedChains) {
      const supportedChainKeys = Get_SupportedChainKeys(master);
      const isSupported =
        currChain === "all_l2s" ? true : supportedChainKeys.includes(currChain);
      const isMaster = master?.chains[currChain] ? true : false;
      const passEcosystem =
        currChain === "all_l2s"
          ? true
          : isMaster
            ? chainEcosystemFilter === "all-chains"
              ? true
              : master?.chains[currChain].bucket.includes(chainEcosystemFilter)
            : false;
      if (
        isSupported &&
        passEcosystem &&
        selectedChains[currChain] === true &&
        data[selectedCategory][dailyKey][String(currChain)]
      ) {
        if (selectedMode.includes("gas_fees") && String(currChain) === "imx") {
          // Skip this iteration
          continue;
        }

        let selectedFilter =
          selectedMode +
          selectedValue +
          (selectedMode.includes("gas_fees")
            ? showUsd
              ? "_usd"
              : "_eth"
            : "");

        let chartData = data[selectedCategory][dailyKey][String(currChain)];

        const dataCategorySubcategoriesList =
          data[selectedCategory].subcategories.list;

        // if we have the number of selectedSubcategories don't match the number of subcategories in the data
        // we need to merge the data for the dailyKey data for the selected subcategories
        if (
          selectedSubcategoriesList.length !==
          dataCategorySubcategoriesList.length
        ) {
          // get the data for the selected subcategories and filter out the undefined values
          const selectedSubcategoriesData: any[][] = selectedSubcategoriesList
            .map((subcategory) => {
              return data[selectedCategory].subcategories[subcategory][
                dailyKey
              ][currChain];
            })
            .filter((item) => item);

          // get a sorted list of all the unix timestamps with duplicates removed
          const unixList = selectedSubcategoriesData
            .reduce((acc, curr) => {
              return [...acc, ...curr.map((item) => item[0])];
            }, [])
            .sort((a, b) => a - b)
            .filter((item, i, arr) => {
              return i === 0 || item !== arr[i - 1];
            });

          // create a new array of arrays with the unix timestamp as the key and the values for each subcategory as the value
          const unixData = unixList
            .map((unix) => {
              const unixValues = selectedSubcategoriesData.map((data) => {
                const index = data.findIndex((item) => item[0] === unix);
                return index !== -1 ? data[index] : null;
              });

              return unixValues;
            })
            .map((unixValues) => unixValues.filter((item) => item));

          chartData = unixData.map((unixDataList, unixIndex) => {
            const unix = unixList[unixIndex];
            const unixDataListFiltered = unixDataList.filter((item) => item);

            // add up the values for each subcategory (ignore first item which is the unix timestamp)
            return unixDataListFiltered.reduce((acc, curr) => {
              if (acc.length === 0) return curr;

              return acc.map((col, i) => {
                return i === 0 ? col : col + curr[i];
              });
            }, []);
          });
        }

        if (chartData.length > 0) {
          const obj = {
            id: [String(currChain), selectedType].join("_"),
            name: String(currChain),
            unixKey: "unix",
            dataKey: selectedType,
            data: chartData,
          };

          chainArray.push(obj);
        }
      }
    }
    return chainArray;
  }, [
    selectedSubcategories,
    selectedChains,
    data,
    selectedCategory,
    dailyKey,
    selectedMode,
    selectedValue,
    showUsd,
    selectedType,
    chainEcosystemFilter,
  ]);

  const chartSeries = useMemo(() => {
    const today = new Date().getTime();

    if (selectedCategory && data) return chartReturn;
    return Object.keys(data["native_transfers"][dailyKey]).map((chain) => ({
      id: [chain, "native_transfers", selectedType].join("||"),
      name: chain,
      unixKey: "unix",
      dataKey: selectedType,
      data: data["native_transfers"][dailyKey][chain],
      type: selectedChartType,
    }));
  }, [
    selectedCategory,
    data,
    chartReturn,
    dailyKey,
    selectedType,
    selectedChartType,
  ]);

  useEffect(() => {
    let updatedChainValues: [string, number][] | null = null;
    setChainValues(null);

    if (selectedSubcategories[selectedCategory]) {
      Object.keys(selectedSubcategories[selectedCategory])?.forEach(
        (subcategory) => {
          const subcategoryData =
            data[selectedCategory].subcategories[
              selectedSubcategories[selectedCategory][subcategory]
            ];
          const subcategoryChains =
            subcategoryData.aggregated[selectedTimespan].data;
          const index = subcategoryChains["types"].indexOf(selectedType);

          Object.keys(subcategoryChains).forEach((chain) => {
            if (chain !== "types" && AllChainsByKeys.hasOwnProperty(chain)) {
              const chainValue = subcategoryChains[chain][index];

              if (updatedChainValues === null) {
                updatedChainValues = [[chain, chainValue]];
              } else {
                const existingIndex = updatedChainValues.findIndex(
                  ([prevChain]) => prevChain === chain,
                );
                if (existingIndex !== -1) {
                  updatedChainValues[existingIndex][1] += chainValue;
                } else {
                  updatedChainValues.push([chain, chainValue]);
                }
              }
            }
          });
        },
      );
    }

    if (updatedChainValues !== null) {
      setChainValues(updatedChainValues);
    }
  }, [
    selectedSubcategories,
    data,
    setChainValues,
    selectedCategory,
    selectedTimespan,
    selectedType,
  ]);
  {
    /*Gathers values for chain rows*/
  }

  const formatSubcategories = useCallback(
    (str: string) => {
      const masterStr =
        master && master.blockspace_categories.sub_categories[str]
          ? master.blockspace_categories.sub_categories[str]
          : str;

      const title = masterStr.replace(/_/g, " ");
      const words = title.split(" ");
      const formatted = words.map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      });

      return formatted.join(" ");
    },
    [master],
  );

  function handleToggleSubcategory(category, subcategory) {
    setSelectedSubcategories((prevSelectedSubcategories) => {
      const categorySubcategories = prevSelectedSubcategories[category];
      const index = categorySubcategories.indexOf(subcategory);

      // Check if the subcategory exists in the list
      if (index !== -1) {
        // Check if it's the last subcategory in the list
        if (categorySubcategories.length === 1) {
          // If it's the last subcategory, don't remove it
          return prevSelectedSubcategories;
        }

        // Value exists, remove it
        const updatedSubcategories = [...categorySubcategories];
        updatedSubcategories.splice(index, 1);
        return {
          ...prevSelectedSubcategories,
          [category]: updatedSubcategories,
        };
      } else {
        // Value doesn't exist, insert it
        return {
          ...prevSelectedSubcategories,
          [category]: [...categorySubcategories, subcategory],
        };
      }
    });
  }

  function checkSubcategory(category, subcategory) {
    return selectedSubcategories[category].includes(subcategory);
  }

  function handleSelectAllSubcategories(category) {
    data[category].subcategories.list.forEach((subcategory) => {
      if (!selectedSubcategories[category].includes(subcategory)) {
        setSelectedSubcategories((prevSelectedSubcategories) => ({
          ...prevSelectedSubcategories,
          [category]: [...prevSelectedSubcategories[category], subcategory],
        }));
      }
    });
  }

  function checkAllSelected(category) {
    if (data[category].subcategories.list) {
      return data[category].subcategories.list.every((subcategory) =>
        selectedSubcategories[category].includes(subcategory),
      );
    }
    return false;
  }

  let height = 0;
  const rowHeight = 52;
  const transitions = useTransition(
    sortedChainValues
      ?.filter(([item]) => !(item === "imx" && selectedMode === "gas_fees_"))
      .map(([item, value], index) => ({
        item,
        value,
        index,
        y: (height += rowHeight) - rowHeight,
        height: rowHeight,
      })) || [],
    {
      key: (item: any) => item.item, // Use item as the key
      from: { opacity: 0, height: 0 },
      leave: null,
      enter: ({ y, height, item }) => ({
        y: y,
        height: height,
        opacity: selectedChains[item] ? 1.0 : 0.3,
      }),
      update: ({ y, height, item }) => ({
        y: y,
        height: height,
        opacity: selectedChains[item] ? 1.0 : 0.3,
      }),
      config: { mass: 5, tension: 500, friction: 100 },
    },
  );

  return (
    <>
      {selectedSubcategories && (
        <div className="relative w-full flex-col">
          <Container>
            <TopRowContainer>
              <TopRowParent>
                <TopRowChild
                  isSelected={"gas_fees_" === selectedMode}
                  onClick={() => {
                    setSelectedMode("gas_fees_");
                  }}
                >
                  Gas Fees
                </TopRowChild>
                <TopRowChild
                  isSelected={"txcount_" === selectedMode}
                  onClick={() => {
                    setSelectedMode("txcount_");
                  }}
                >
                  Transaction Count
                </TopRowChild>
              </TopRowParent>
              <div className="mx-auto my-[10px] block w-[70%] lg:hidden">
                <hr className="border-top-[1px] h-[0.5px] border-dotted border-forest-400" />
              </div>
              <TopRowParent>
                {Object.keys(timespans).map((timespan) => (
                  <TopRowChild
                    key={timespan}
                    isSelected={selectedTimespan === timespan}
                    onClick={() => {
                      setSelectedTimespan(timespan);

                      // setXAxis();
                      // chartComponent?.current?.xAxis[0].update({
                      //   min: timespans[selectedTimespan].xMin,
                      //   max: timespans[selectedTimespan].xMax,
                      //   // calculate tick positions based on the selected time interval so that the ticks are aligned to the first day of the month
                      //   tickPositions: getTickPositions(
                      //     timespans.max.xMin,
                      //     timespans.max.xMax,
                      //   ),
                      // });
                    }}
                  >
                    <span className="hidden md:block">
                      {timespans[timespan].label}
                    </span>
                    <span className="block md:hidden">
                      {timespans[timespan].shortLabel}
                    </span>
                  </TopRowChild>
                ))}
                <div
                  className={`absolute right-[22px] top-[63px] -z-10 w-[calc(50%-34px)] pr-[15px] text-xs transition-[transform] duration-300 ease-in-out md:right-[65px] md:top-[68px] md:w-[calc(50%-56px)] lg:right-[65px] lg:top-0 lg:w-[168px] lg:pr-[23px] xl:w-[158px] xl:pr-[23px] ${
                    !isMobile
                      ? ["max", "180d"].includes(selectedTimespan)
                        ? "translate-y-[calc(-100%+3px)]"
                        : "translate-y-0"
                      : ["max", "180d"].includes(selectedTimespan)
                        ? "translate-y-[calc(40%+3px)]"
                        : "-translate-y-[calc(40%+3px)]"
                  }`}
                >
                  <div className="z-0 w-full rounded-b-2xl rounded-t-none border border-forest-700 bg-forest-100 py-1 text-center font-medium dark:border-forest-400 dark:bg-forest-1000 lg:rounded-b-none lg:rounded-t-2xl">
                    7-day rolling average
                  </div>
                </div>
              </TopRowParent>
            </TopRowContainer>
          </Container>

          <div id="content-container" className="w-full">
            <HorizontalScrollContainer
              forcedMinWidth={isMobile ? 990 : 1050}
              paddingBottom={8}
            >
              <CategoryBar
                data={data}
                master={master}
                categories={categories}
                querySubcategories={querySubcategories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                checkSubcategory={checkSubcategory}
                formatSubcategories={formatSubcategories}
                checkAllSelected={checkAllSelected}
                handleSelectAllSubcategories={handleSelectAllSubcategories}
                handleToggleSubcategory={handleToggleSubcategory}
              />
            </HorizontalScrollContainer>

            <Container>
              <div className="mx-auto mb-[20px] mt-[20px] flex w-[98.5%] flex-col justify-between gap-y-8 lg:mb-0 lg:mt-[30px] lg:flex-row">
                <div className="flex w-full flex-col justify-between lg:w-[44%]">
                  <div
                    className="relative mt-4"
                    style={{
                      height: height,
                      minHeight: isMobile ? undefined : "500px",
                    }}
                  >
                    {sortedChainValues &&
                      master &&
                      transitions((style, item) => (
                        <animated.div
                          className="absolute w-full"
                          key={item.item}
                          style={{
                            ...style,
                          }}
                        >
                          <ChainAnimations
                            chain={item.item}
                            value={item.value}
                            index={item.index}
                            sortedValues={sortedChainValues}
                            selectedValue={selectedValue}
                            selectedMode={selectedMode}
                            selectedChains={selectedChains}
                            setSelectedChains={setSelectedChains}
                            selectedCategory={selectedCategory}
                            master={master}
                            parentContainerWidth={0}
                          />
                        </animated.div>
                      ))}
                  </div>
                </div>
                <div className="relative bottom-2 mb-[30px] mt-6 h-[320px] w-full lg:mt-0 lg:h-auto lg:w-[56%]">
                  {chartSeries && (
                    <Chart
                      chartType={
                        selectedChartType === "absolute" ? "line" : "area"
                      }
                      stack={selectedChartType !== "absolute"}
                      types={
                        selectedCategory === null ||
                        selectedCategory === "Chains"
                          ? data.native_transfers[dailyKey].types
                          : data[selectedCategory][dailyKey].types
                      }
                      timespan={selectedTimespan}
                      series={chartSeries}
                      yScale={
                        selectedChartType === "percentage"
                          ? "percentage"
                          : "linear"
                      }
                      // yScale="linear"
                      chartHeight={isMobile ? "400" : "560"}
                      chartWidth="100%"
                      decimals={selectedMode === "txcount_" ? 0 : 2}
                    />
                  )}
                </div>
                <div className="mt-8 flex w-[100%] flex-wrap items-center gap-y-2 lg:hidden">
                  <div className="pl-2 pr-2 text-sm font-bold">
                    {formatSubcategories(selectedCategory)}:{" "}
                  </div>

                  {selectedSubcategories[selectedCategory] &&
                    selectedSubcategories[selectedCategory].map(
                      (subcategory) => (
                        <div
                          key={subcategory}
                          className="mx-[5px] px-[2px] py-[5px] text-xs"
                        >
                          {formatSubcategories(subcategory)}
                        </div>
                      ),
                    )}
                </div>
              </div>
              <div>
                {" "}
                <div className="invisible mx-auto flex w-[98%] flex-wrap items-center gap-y-2 lg:visible">
                  <div className="pl-2 pr-2 text-sm font-bold">
                    {formatSubcategories(selectedCategory)}:{" "}
                  </div>

                  {selectedSubcategories[selectedCategory] &&
                    selectedSubcategories[selectedCategory].map(
                      (subcategory) => (
                        <div
                          key={subcategory}
                          className="mx-[5px] px-[4px] py-[5px] text-xs"
                        >
                          {formatSubcategories(subcategory)}
                        </div>
                      ),
                    )}
                </div>{" "}
              </div>
            </Container>
          </div>
          <Container>
            {" "}
            <div className="mx-auto mt-8 flex w-[100%] flex-row items-end justify-center gap-x-1 rounded-full bg-forest-50 p-0.5 px-0.5 py-[4px] text-md text-sm dark:bg-[#1F2726] md:items-center md:justify-end md:rounded-full md:px-1 md:text-base">
              {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
              {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
              {/* toggle ETH */}
              <button
                className={`rounded-full px-[16px] py-[4px] ${
                  selectedChartType === "absolute"
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedChartType("absolute");
                }}
              >
                Absolute
              </button>
              <button
                className={`rounded-full px-[16px] py-[4px] ${
                  selectedChartType === "stacked"
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedChartType("stacked");
                }}
              >
                Stacked
              </button>
              <button
                className={`rounded-full px-[16px] py-[4px] ${
                  selectedChartType === "percentage"
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedChartType("percentage");
                }}
              >
                Percentage
              </button>
            </div>
          </Container>
          <Container>
            <div className="mx-auto mt-[5px] flex w-[97%] flex-col lg:mt-[30px]">
              <h1 className="text-lg font-bold">Most Active Contracts</h1>
              <p className="mt-[15px] text-sm">
                See the most active contracts within the selected timeframe (
                {timespans[selectedTimespan].label}) and for your selected
                category/subcategories.{" "}
              </p>
            </div>
          </Container>
          <CategoryContracts
            data={data}
            selectedCategory={selectedCategory}
            selectedSubcategories={selectedSubcategories}
            selectedMode={selectedMode}
            selectedChains={selectedChains}
            selectedTimespan={selectedTimespan}
            chainEcosystemFilter={chainEcosystemFilter}
            showUsd={showUsd}
            timespans={timespans}
            formatSubcategories={formatSubcategories}
          />
        </div>
      )}
    </>
  );
}
