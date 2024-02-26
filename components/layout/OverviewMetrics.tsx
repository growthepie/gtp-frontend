"use client";
import Image from "next/image";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
  CSSProperties,
} from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { Chains } from "@/types/api/ChainOverviewResponse";
import { AllChainsByKeys } from "@/lib/chains";
import { color } from "highcharts";
import { useHover, useMediaQuery } from "usehooks-ts";
import { Chart } from "../charts/chart";
import Container from "./Container";
import Colors from "tailwindcss/colors";
import { LandingURL, MasterURL } from "@/lib/urls";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { useLocalStorage } from "usehooks-ts";
import ContractLabelModal from "./ContractLabelModal";
import OverviewChart from "./BlockspaceOverview/OverviewChart";
import RowContainer from "./BlockspaceOverview/ChainRows/RowContainer";
import { RowProvider } from "./BlockspaceOverview/ChainRows/RowContext";
// object which contains the allowed modes for chains with mode exceptions
const AllowedModes: {
  [chain: string]: {
    metric: string[];
    scale: string[];
  };
} = {
  imx: {
    metric: ["txcount"],
    scale: ["absolute", "share"],
  },
};

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

export default function OverviewMetrics({
  data,
  selectedTimespan,
  setSelectedTimespan,
  forceSelectedChain,
}: {
  data: Chains;
  selectedTimespan: string;
  setSelectedTimespan: (timespan: string) => void;
  forceSelectedChain?: string;
}) {
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [selectedMode, setSelectedMode] = useState(
    forceSelectedChain === "imx" ? "txcount_share" : "gas_fees_share_usd",
  );
  const [isCategoryMenuExpanded, setIsCategoryMenuExpanded] = useState(true);
  const [contractCategory, setContractCategory] = useState("value");
  const [sortOrder, setSortOrder] = useState(true);
  const [allCats, setAllCats] = useState(forceSelectedChain ? true : false);
  const [showMore, setShowMore] = useState(false);
  const [maxDisplayedContracts, setMaxDisplayedContracts] = useState(10);
  const [contractHover, setContractHover] = useState({});
  const [selectedValue, setSelectedValue] = useState("share");
  const [copyContract, setCopyContract] = useState(false);
  const [isContractLabelModalOpen, setIsContractLabelModalOpen] =
    useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractInfo | null>(
    null,
  );

  const [labelFormMainCategoryKey, setLabelFormMainCategoryKey] = useState<
    string | null
  >("nft");

  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [chainEcosystemFilter, setChainEcosystemFilter] = useLocalStorage(
    "chainEcosystemFilter",
    "all-chains",
  );

  const standardChainKey = forceSelectedChain ? forceSelectedChain : "all_l2s";

  const isMobile = useMediaQuery("(max-width: 1023px)");

  const [sortedContracts, setSortedContracts] = useState<{
    [key: string]: ContractInfo;
  }>({});

  const categories: { [key: string]: string } = useMemo(() => {
    if (master) {
      const result: { [key: string]: string } = {};

      const categoryKeys = Object.keys(
        master.blockspace_categories.main_categories,
      );

      // Remove "unlabeled" if present and store it for later
      const unlabeledIndex = categoryKeys.indexOf("unlabeled");
      let unlabeledCategory = "";
      if (unlabeledIndex !== -1) {
        unlabeledCategory = categoryKeys.splice(unlabeledIndex, 1)[0];
      }

      categoryKeys.forEach((key) => {
        const words =
          master.blockspace_categories.main_categories[key].split(" ");
        const formatted = words
          .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(" ");
        result[key] = formatted;
      });

      // Add "unlabeled" to the end if it was present
      if (unlabeledCategory) {
        const words =
          master.blockspace_categories.main_categories[unlabeledCategory].split(
            " ",
          );
        const formatted = words
          .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(" ");
        result[unlabeledCategory] = formatted;
      }

      return result;
    }

    return {};
  }, [master]);

  const [isCategoryHovered, setIsCategoryHovered] = useState<{
    [key: string]: boolean;
  }>(() => {
    if (master) {
      const initialIsCategoryHovered: { [key: string]: boolean } = {};
      Object.keys(master.blockspace_categories.main_categories).forEach(
        (key) => {
          if (key !== "cross_chain") {
            initialIsCategoryHovered[key] = false;
          }
        },
      );
      return initialIsCategoryHovered;
    }

    return {
      all_chain: false,
      native_transfers: false,
      token_transfers: false,
      nft_fi: false,
      defi: false,
      cefi: false,
      utility: false,
      scaling: false,
      gaming: false,
    };
  });

  const [selectedCategory, setSelectedCategory] = useState("nft");

  // useEffect(() => {
  //   // Process the data and create the contracts object
  //   const result: { [key: string]: ContractInfo } = {};

  //   for (const category of Object.keys(data)) {
  //     if (data) {
  //       const contractsData =
  //         data.all_l2s["overview"][selectedTimespan][selectedCategory].contracts
  //           .data;
  //       const types =
  //         data.all_l2s["overview"][selectedTimespan][selectedCategory].contracts
  //           .types;

  //       for (const contract of Object.keys(contractsData)) {
  //         const dataArray = contractsData[contract];
  //         const key = dataArray[0] + dataArray[4];
  //         const values = dataArray;

  //         // Check if the key already exists in the result object
  //         if (result.hasOwnProperty(key)) {
  //           // If the key exists, update the values
  //           result[key] = {
  //             ...result[key],
  //             address: values[types.indexOf("address")],
  //             project_name: values[types.indexOf("project_name")],
  //             name: values[types.indexOf("name")],
  //             main_category_key: values[types.indexOf("main_category_key")],
  //             sub_category_key: values[types.indexOf("sub_category_key")],
  //             chain: values[types.indexOf("chain")],
  //             gas_fees_absolute_eth:
  //               values[types.indexOf("gas_fees_absolute_eth")],
  //             gas_fees_absolute_usd:
  //               values[types.indexOf("gas_fees_absolute_usd")],
  //             gas_fees_share: values[types.indexOf("gas_fees_share")] ?? "",
  //             txcount_absolute: values[types.indexOf("txcount_absolute")],
  //             txcount_share: values[types.indexOf("txcount_share")] ?? "",
  //           };
  //         } else {
  //           // If the key doesn't exist, create a new entry
  //           result[key] = {
  //             address: values[types.indexOf("address")],
  //             project_name: values[types.indexOf("project_name")],
  //             name: values[types.indexOf("name")],
  //             main_category_key: values[types.indexOf("main_category_key")],
  //             sub_category_key: values[types.indexOf("sub_category_key")],
  //             chain: values[types.indexOf("chain")],
  //             gas_fees_absolute_eth:
  //               values[types.indexOf("gas_fees_absolute_eth")],
  //             gas_fees_absolute_usd:
  //               values[types.indexOf("gas_fees_absolute_usd")],
  //             gas_fees_share: values[types.indexOf("gas_fees_share")] ?? "",
  //             txcount_absolute: values[types.indexOf("txcount_absolute")],
  //             txcount_share: values[types.indexOf("txcount_share")] ?? "",
  //           };
  //         }
  //       }
  //     }
  //   }

  //   // Update the contracts state with the new data
  //   setContracts(result);
  // }, [data, selectedCategory, selectedTimespan]);

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

  const contracts = useMemo<{ [key: string]: ContractInfo }>(() => {
    const result: { [key: string]: ContractInfo } = {};
    for (const category of Object.keys(data)) {
      if (data) {
        const contractsData = allCats
          ? (() => {
              let contractArray = [];

              for (const categoryKey in data[standardChainKey]["overview"][
                selectedTimespan
              ]) {
                const categoryData =
                  data[standardChainKey]["overview"][selectedTimespan][
                    categoryKey
                  ].contracts.data;

                // Concatenate and flatten data to the contractArray
                contractArray = contractArray.concat(categoryData);
              }

              return contractArray;
            })()
          : data[standardChainKey]["overview"][selectedTimespan][
              selectedCategory
            ].contracts.data;

        const types =
          data[standardChainKey]["overview"][selectedTimespan][selectedCategory]
            .contracts.types;

        for (const contract of Object.keys(contractsData)) {
          const dataArray = contractsData[contract];
          const key = dataArray[0] + dataArray[4] + dataArray[5];
          const values = dataArray;

          // Check if the key already exists in the result object
          if (result.hasOwnProperty(key)) {
            // If the key exists, update the values
            result[key] = {
              ...result[key],
              address: values[types.indexOf("address")],
              project_name: values[types.indexOf("project_name")],
              name: values[types.indexOf("name")],
              main_category_key: values[types.indexOf("main_category_key")],
              sub_category_key: values[types.indexOf("sub_category_key")],
              chain: values[types.indexOf("chain")],
              gas_fees_absolute_eth:
                values[types.indexOf("gas_fees_absolute_eth")],
              gas_fees_absolute_usd:
                values[types.indexOf("gas_fees_absolute_usd")],
              gas_fees_share: values[types.indexOf("gas_fees_share")] ?? "",
              txcount_absolute: values[types.indexOf("txcount_absolute")],
              txcount_share: values[types.indexOf("txcount_share")] ?? "",
            };
          } else {
            // If the key doesn't exist, create a new entry
            result[key] = {
              address: values[types.indexOf("address")],
              project_name: values[types.indexOf("project_name")],
              name: values[types.indexOf("name")],
              main_category_key: values[types.indexOf("main_category_key")],
              sub_category_key: values[types.indexOf("sub_category_key")],
              chain: values[types.indexOf("chain")],
              gas_fees_absolute_eth:
                values[types.indexOf("gas_fees_absolute_eth")],
              gas_fees_absolute_usd:
                values[types.indexOf("gas_fees_absolute_usd")],
              gas_fees_share: values[types.indexOf("gas_fees_share")] ?? "",
              txcount_absolute: values[types.indexOf("txcount_absolute")],
              txcount_share: values[types.indexOf("txcount_share")] ?? "",
            };
          }
        }
      }
    }

    // Update the contracts state with the new data
    return result;
  }, [data, selectedCategory, selectedTimespan, allCats]);

  const [selectedChain, setSelectedChain] = useState<string | null>(
    forceSelectedChain ?? null,
  );

  const { theme } = useTheme();
  const timespans = useMemo(() => {
    return {
      "7d": {
        label: "7 days",
        value: 7,
        xMin: Date.now() - 7 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "30d": {
        label: "30 days",
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
        value: 180,
      },
      // "365d": {
      //   label: "1 year",
      //   value: 365,
      // },
      max: {
        label: "All Time",
        value: 0,
      },
    };
  }, []);

  useEffect(() => {
    if (selectedMode.includes("gas_fees_share")) {
      setSelectedMode(showUsd ? "gas_fees_share_usd" : "gas_fees_share_eth");
    } else if (selectedMode.includes("gas_fees")) {
      setSelectedMode(
        showUsd ? "gas_fees_usd_absolute" : "gas_fees_eth_absolute",
      );
    }
  }, [selectedMode, showUsd]);

  useEffect(() => {
    if (!contracts) {
      return;
    }

    const filteredContracts = Object.entries(contracts)
      .filter(([key, contract]) => {
        const isAllChainsSelected = selectedChain === null;
        const isChainSelected =
          isAllChainsSelected || contract.chain === selectedChain;
        const isCategoryMatched = allCats
          ? true
          : contract.main_category_key === selectedCategory;
        const isEcosystemSelected = Object.keys(data).includes(contract.chain);

        return isChainSelected && isCategoryMatched && isEcosystemSelected;
      })
      .reduce((filtered, [key, contract]) => {
        filtered[key] = contract;
        return filtered;
      }, {});

    const sortFunction = (a, b) => {
      const valueA = selectedMode.includes("gas_fees_")
        ? showUsd
          ? filteredContracts[a]?.gas_fees_absolute_usd
          : filteredContracts[a]?.gas_fees_absolute_eth
        : filteredContracts[a]?.txcount_absolute;

      const valueB = selectedMode.includes("gas_fees_")
        ? showUsd
          ? filteredContracts[b]?.gas_fees_absolute_usd
          : filteredContracts[b]?.gas_fees_absolute_eth
        : filteredContracts[b]?.txcount_absolute;

      // Compare the values
      return valueA - valueB;
    };

    const sortedResult = Object.keys(filteredContracts).sort((a, b) => {
      if (contractCategory === "contract") {
        return (
          filteredContracts[a]?.name || filteredContracts[a]?.address
        ).localeCompare(
          filteredContracts[b]?.name || filteredContracts[b]?.address,
        );
      } else if (contractCategory === "category") {
        return filteredContracts[a]?.main_category_key.localeCompare(
          filteredContracts[b]?.main_category_key,
        );
      } else if (
        contractCategory === "subcategory" &&
        selectedCategory !== "unlabeled"
      ) {
        return filteredContracts[a]?.sub_category_key.localeCompare(
          filteredContracts[b]?.sub_category_key,
        );
      } else if (contractCategory === "chain") {
        return filteredContracts[a]?.chain.localeCompare(
          filteredContracts[b]?.chain,
        );
      } else if (contractCategory === "value" || contractCategory === "share") {
        return sortFunction(a, b);
      }
    });

    const sortedContractsObj = sortedResult.reduce((acc, key) => {
      acc[key] = filteredContracts[key];
      return acc;
    }, {});

    if (
      selectedCategory === "unlabeled" &&
      (contractCategory === "category" || contractCategory === "subcategory")
    ) {
      setSortedContracts(sortedContractsObj);
    } else {
      setSortedContracts(sortedContractsObj);
    }
  }, [
    contractCategory,
    contracts,
    selectedCategory,
    selectedChain,
    selectedMode,
    showUsd,
  ]);

  const largestContractValue = useMemo(() => {
    let retValue = 0;
    for (const contract of Object.values(sortedContracts)) {
      const value = selectedMode.includes("gas_fees_")
        ? showUsd
          ? contract.gas_fees_absolute_usd
          : contract.gas_fees_absolute_eth
        : contract.txcount_absolute;

      retValue = Math.max(retValue, value);
    }

    return retValue;
  }, [selectedMode, sortedContracts, showUsd]);

  // Usage: largestChainValue["optimism"] will give you the largest value for the "optimism" chain

  function getWidth(x) {
    let retValue = "0%";

    if (selectedMode.includes("gas_fees")) {
      if (showUsd) {
        retValue =
          String(
            (
              (x.gas_fees_absolute_usd.toFixed(2) / largestContractValue) *
              100
            ).toFixed(1),
          ) + "%";
      } else {
        retValue =
          String(
            (
              (x.gas_fees_absolute_eth.toFixed(2) / largestContractValue) *
              100
            ).toFixed(1),
          ) + "%";
      }
    } else {
      retValue =
        String(((x.txcount_absolute / largestContractValue) * 100).toFixed(1)) +
        "%";
    }

    return retValue;
  }

  return (
    <div className="w-full flex-col relative">
      <Container>
        <div className="flex flex-col rounded-[15px] py-[2px] px-[2px] text-xs lg:text-base lg:flex lg:flex-row w-full justify-between items-center static -top-[8rem] left-0 right-0 lg:rounded-full dark:bg-[#1F2726] bg-forest-50 md:py-[2px]">
          <div className="flex w-full lg:w-auto justify-between lg:justify-center items-stretch lg:items-center mx-4 lg:mx-0 space-x-[4px] lg:space-x-1">
            <button
              disabled={forceSelectedChain === "imx"}
              className={`rounded-full grow px-4 py-1.5 lg:py-4 font-medium disabled:opacity-30 ${
                selectedMode.includes("gas_fees")
                  ? "bg-forest-500 dark:bg-forest-1000"
                  : "hover:bg-forest-500/10"
              }`}
              onClick={() => {
                setSelectedMode(
                  selectedValue === "absolute"
                    ? showUsd
                      ? "gas_fees_usd_absolute"
                      : "gas_fees_eth_absolute"
                    : showUsd
                    ? "gas_fees_share_usd"
                    : "gas_fees_share_eth",
                );
              }}
            >
              Gas Fees
            </button>
            <button
              className={`rounded-full grow px-4 py-1.5 lg:py-4 font-medium ${
                selectedMode.includes("txcount")
                  ? "bg-forest-500 dark:bg-forest-1000"
                  : "hover:bg-forest-500/10"
              }`}
              onClick={() => {
                setSelectedMode(
                  selectedValue === "absolute"
                    ? "txcount_absolute"
                    : "txcount_share",
                );
              }}
            >
              Transaction Count
            </button>
          </div>
          <div className="block lg:hidden w-[70%] mx-auto mt-[5px]">
            <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
          </div>
          <div className="flex w-full lg:w-auto justify-between lg:justify-center items-stretch lg:items-center mx-4 lg:mx-0 space-x-[4px] lg:space-x-1">
            {Object.keys(timespans).map((timespan) => (
              <button
                key={timespan}
                //rounded-full sm:w-full px-4 py-1.5 xl:py-4 font-medium
                className={`rounded-full grow px-4 py-1.5 lg:py-4 font-medium ${
                  selectedTimespan === timespan
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
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
                {timespans[timespan].label}
              </button>
            ))}
          </div>
          <div
            className={`absolute transition-[transform] text-xs  duration-300 ease-in-out -z-10 top-[30px] right-[20px] md:right-[45px] lg:top-0 lg:right-[65px] pr-[15px] w-[calc(50%-34px)] md:w-[calc(50%-56px)] lg:pr-[23px] lg:w-[168px] xl:w-[158px] xl:pr-[23px] ${
              !isMobile
                ? ["max", "180d"].includes(selectedTimespan)
                  ? "translate-y-[calc(-100%+3px)]"
                  : "translate-y-0 "
                : ["max", "180d"].includes(selectedTimespan)
                ? "translate-y-[calc(100%+3px)]"
                : "translate-y-0"
            }`}
          >
            <div className="font-medium bg-forest-100 dark:bg-forest-1000 rounded-b-2xl rounded-t-none lg:rounded-b-none lg:rounded-t-2xl border border-forest-700 dark:border-forest-400 text-center w-full py-1 z-0 ">
              7-day rolling average
            </div>
          </div>
        </div>
      </Container>
      <Container className="block w-full !pr-0 lg:!px-[50px]">
        <RowProvider
          value={{
            data,
            selectedMode,
            forceSelectedChain,
            isCategoryHovered,
            selectedCategory,
            selectedChain,
            selectedTimespan,
            selectedValue,
            categories,
            allCats,
            setSelectedChain,
            setSelectedCategory,
            setAllCats,
            setIsCategoryHovered,
          }}
        >
          <RowContainer />
        </RowProvider>
      </Container>

      {/*Chart Head*/}
      <Container>
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
      </Container>
      {/*Chart*/}
      <Container>
        <OverviewChart
          data={data}
          master={master}
          selectedTimespan={selectedTimespan}
          timespans={timespans}
          setSelectedTimespan={setSelectedTimespan}
          selectedMode={selectedMode}
          selectedValue={selectedValue}
          selectedCategory={selectedCategory}
          selectedChain={selectedChain}
          forceSelectedChain={forceSelectedChain}
          categories={categories}
        />
      </Container>
      {/*Chart Footer*/}
      <Container className="w-[98%] ml-4">
        <div className={`flex flex-wrap items-center w-[100%] gap-y-2 `}>
          <h1 className="font-bold text-sm pr-2 pl-2">
            {!allCats
              ? master &&
                master.blockspace_categories.main_categories[selectedCategory]
              : "All"}
          </h1>
          {!allCats ? (
            master &&
            Object.keys(
              master.blockspace_categories["mapping"][selectedCategory],
            ).map((key) => (
              <p className="text-xs px-[4px] py-[5px] mx-[5px]" key={key}>
                {formatSubcategories(
                  master.blockspace_categories["mapping"][selectedCategory][
                    key
                  ],
                )}
              </p>
            ))
          ) : (
            <p className="text-xs px-[4px] py-[5px] mx-[5px]">
              All Categories Selected
            </p>
          )}
        </div>
      </Container>
      {/*Selected Mode Absolute/Share of chain usage*/}
      <Container>
        {" "}
        <div className="flex flex-row w-[100%] mx-auto justify-center md:items-center items-end md:justify-end rounded-full  text-sm md:text-base  md:rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 px-0.5 md:px-1 mt-8 gap-x-1 text-md py-[4px]">
          {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
          {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
          {/* toggle ETH */}
          <button
            className={`px-[16px] py-[4px]  rounded-full ${
              selectedValue === "absolute"
                ? "bg-forest-500 dark:bg-forest-1000"
                : "hover:bg-forest-500/10"
            }`}
            onClick={() => {
              setSelectedValue("absolute");
              if (!selectedMode.includes("absolute")) {
                if (selectedMode.includes("gas_fees")) {
                  if (showUsd) {
                    setSelectedMode("gas_fees_usd_absolute");
                  } else {
                    setSelectedMode("gas_fees_eth_absolute");
                  }
                } else {
                  setSelectedMode("txcount_absolute");
                }
              }
            }}
          >
            Absolute
          </button>
          <button
            className={`px-[16px] py-[4px]  rounded-full ${
              selectedValue === "share"
                ? "bg-forest-500 dark:bg-forest-1000"
                : "hover:bg-forest-500/10"
            }`}
            onClick={() => {
              setSelectedValue("share");

              if (selectedMode.includes("gas_fees")) {
                if (showUsd) {
                  setSelectedMode("gas_fees_share_usd");
                } else {
                  setSelectedMode("gas_fees_share_eth");
                }
              } else {
                setSelectedMode("txcount_share");
              }
            }}
          >
            Share of Chain Usage
          </button>
        </div>
      </Container>

      {/*Contracts Header */}
      <Container>
        <div className="w-[97%] mx-auto mt-[30px] flex flex-col">
          <h1 className="text-lg font-bold">Most Active Contracts</h1>
          <p className="text-sm mt-[15px]">
            See the most active contracts within the selected timeframe (
            {timespans[selectedTimespan].label}) and for your selected category.{" "}
          </p>
        </div>
      </Container>

      <Container className="lg:overflow-hidden overflow-x-scroll scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller pb-4">
        <div
          className={`fixed inset-0 z-[90] flex items-center justify-center transition-opacity duration-200  ${
            selectedContract ? "opacity-80" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className={`absolute inset-0 bg-white dark:bg-black`}
            onClick={() => setSelectedContract(null)}
          ></div>
        </div>
        <div className="flex flex-col mt-[30px] w-full mx-auto min-w-[880px]">
          <div className="flex exl:text-[14px] text-[12px] font-bold mb-[10px] pl-4 pr-8">
            <div className="flex gap-x-[15px] w-[34%]">
              <button
                className="flex gap-x-1"
                onClick={() => {
                  if (contractCategory !== "chain") {
                    setSortOrder(true);
                  } else {
                    setSortOrder(!sortOrder);
                  }
                  setContractCategory("chain");
                }}
              >
                Chain
                <Icon
                  icon={
                    contractCategory === "chain"
                      ? sortOrder
                        ? "formkit:arrowdown"
                        : "formkit:arrowup"
                      : "formkit:arrowdown"
                  }
                  className={` dark:text-white text-black ${
                    contractCategory === "chain" ? "opacity-100" : "opacity-20"
                  }`}
                />
              </button>

              <button
                className="flex gap-x-1"
                onClick={() => {
                  if (contractCategory !== "contract") {
                    setSortOrder(true);
                  } else {
                    setSortOrder(!sortOrder);
                  }
                  setContractCategory("contract");
                }}
              >
                Contract
                <Icon
                  icon={
                    contractCategory === "contract"
                      ? sortOrder
                        ? "formkit:arrowdown"
                        : "formkit:arrowup"
                      : "formkit:arrowdown"
                  }
                  className={` dark:text-white text-black ${
                    contractCategory === "contract"
                      ? "opacity-100"
                      : "opacity-20"
                  }`}
                />
              </button>
            </div>
            <div className="flex w-[37%] ">
              <button className="flex w-[46%] -ml-2 ">Category</button>
              <button
                className="flex gap-x-1"
                onClick={() => {
                  if (contractCategory !== "subcategory") {
                    setSortOrder(true);
                  } else {
                    setSortOrder(!sortOrder);
                  }
                  setContractCategory("subcategory");
                }}
              >
                Subcategory{" "}
                <Icon
                  icon={
                    contractCategory === "subcategory"
                      ? sortOrder
                        ? "formkit:arrowdown"
                        : "formkit:arrowup"
                      : "formkit:arrowdown"
                  }
                  className={` dark:text-white text-black ${
                    contractCategory === "subcategory"
                      ? "opacity-100"
                      : "opacity-20"
                  }`}
                />
              </button>
            </div>
            <div className="flex w-[29%]">
              <button
                className="flex gap-x-1 w-[49%] justify-end whitespace-nowrap "
                onClick={() => {
                  if (contractCategory !== "value") {
                    setSortOrder(true);
                  } else {
                    setSortOrder(!sortOrder);
                  }
                  setContractCategory("value");
                }}
              >
                {selectedMode.includes("gas_fees")
                  ? "Gas Fees "
                  : "Transaction Count "}
                <p className="font-normal">
                  ({timespans[selectedTimespan].label})
                </p>
                <Icon
                  icon={
                    contractCategory === "value"
                      ? sortOrder
                        ? "formkit:arrowdown"
                        : "formkit:arrowup"
                      : "formkit:arrowdown"
                  }
                  className={` dark:text-white text-black ${
                    contractCategory === "value" ? "opacity-100" : "opacity-20"
                  }`}
                />
              </button>

              <div className="flex w-[51%] justify-end -ml-2 ">
                Block Explorer
              </div>
            </div>
          </div>
          <div>
            {(!sortOrder
              ? Object.keys(sortedContracts)
              : Object.keys(sortedContracts).reverse()
            )
              .slice(0, maxDisplayedContracts)
              .map((key, i) => {
                // if (i >= maxDisplayedContracts) {
                //   return null;
                // }

                if (
                  selectedContract &&
                  selectedContract.address === sortedContracts[key].address
                ) {
                  return (
                    <div key={key + "" + sortOrder}>
                      <div className="flex rounded-[27px] bg-forest-50 dark:bg-[#1F2726] border-forest-200 dark:border-forest-500 border mt-[7.5px] group relative z-[100]">
                        <div className="absolute top-0 left-0 right-0 bottom-[-1px] pointer-events-none">
                          <div className="w-full h-full rounded-[27px] overflow-clip">
                            <div className="relative w-full h-full">
                              <div
                                className={`absolute left-[1px] right-[1px] bottom-[0px] h-[2px] rounded-none font-semibold transition-width duration-300 z-20`}
                                style={{
                                  background:
                                    AllChainsByKeys[sortedContracts[key].chain]
                                      .colors[theme][1],
                                  width: getWidth(sortedContracts[key]),
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center w-full h-full pl-[15px] pr-[30px] py-[10px] space-y-[15px]">
                          <div className="flex space-x-[26px] items-center w-full">
                            <div>
                              <Icon
                                icon="gtp:add-tag"
                                className="w-[34px] h-[34px]"
                              />
                            </div>
                            <div className="text-[16px]">
                              Suggested label for contract{" "}
                              <i>{selectedContract.address}</i>
                            </div>
                          </div>
                          <form
                            className="flex flex-col space-y-[5px] items-start justify-center w-full"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.target as any);

                              // const data = Object.fromEntries(
                              //   formData.entries(),
                              // );

                              setIsFormSubmitting(true);

                              // send POST to /api/contracts
                              const res = fetch("/api/contracts", {
                                method: "POST",
                                body: formData,
                              })
                                .then((res) => res.json())
                                .finally(() => {
                                  setIsFormSubmitting(false);
                                  setSelectedContract(null);
                                });
                            }}
                          >
                            <input
                              type="hidden"
                              name="address"
                              value={selectedContract.address}
                            />
                            <input
                              type="hidden"
                              name="chain"
                              value={selectedContract.chain}
                            />
                            <div className="flex space-x-[26px] items-center w-full">
                              <Icon
                                icon={`gtp:${selectedContract.chain.replace(
                                  "_",
                                  "-",
                                )}-logo-monochrome`}
                                className="w-[34px] h-[34px]"
                                style={{
                                  color:
                                    AllChainsByKeys[selectedContract.chain]
                                      .colors[theme][1],
                                }}
                              />
                              <div className="flex space-x-[15px] items-center w-full">
                                <div className="relative w-[33%]">
                                  <input
                                    type="text"
                                    className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                                    placeholder="Contract Name"
                                    name="name"
                                  />
                                  <div className="absolute right-0.5 top-0.5">
                                    <Tooltip placement="top">
                                      <TooltipTrigger>
                                        <Icon
                                          icon="feather:info"
                                          className="w-6 h-6 text-forest-900 dark:text-forest-500"
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent className="z-[110]">
                                        <div className="p-3 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg w-[420px] flex flex-col">
                                          <div className="font-medium">
                                            This is the Contract name.
                                          </div>
                                          <div>
                                            It should be the name of the
                                            contract, not the name of the
                                            project.
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                                <div className="relative w-[33%]">
                                  <input
                                    type="text"
                                    className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                                    placeholder="Project Name"
                                    name="project_name"
                                  />
                                  <div className="absolute right-0.5 top-0.5">
                                    <Tooltip placement="top">
                                      <TooltipTrigger>
                                        <Icon
                                          icon="feather:info"
                                          className="w-6 h-6 text-forest-900 dark:text-forest-500"
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent className="z-[110]">
                                        <div className="p-3 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg w-[420px] flex flex-col">
                                          <div className="font-medium">
                                            This is the Project name.
                                          </div>
                                          <div>
                                            It should be the name of the
                                            project, not the name of the
                                            contract.
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                                <div className="relative w-[16%]">
                                  <select
                                    className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[4px]"
                                    name="main_category_key"
                                    onChange={(e) => {
                                      setLabelFormMainCategoryKey(
                                        e.target.value,
                                      );
                                    }}
                                  >
                                    <option value="" disabled selected>
                                      Category
                                    </option>
                                    {master &&
                                      Object.keys(
                                        master.blockspace_categories
                                          .main_categories,
                                      ).map((key) => (
                                        <option
                                          key={key}
                                          value={key}
                                          className="bg-forest-50 dark:bg-[#1F2726]"
                                        >
                                          {
                                            master.blockspace_categories
                                              .main_categories[key]
                                          }
                                        </option>
                                      ))}
                                  </select>
                                </div>
                                <div className="relative w-[16%]">
                                  <select
                                    className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[4px]"
                                    name="sub_category_key"
                                  >
                                    <option value="" disabled selected>
                                      Category
                                    </option>
                                    {labelFormMainCategoryKey &&
                                      master &&
                                      master.blockspace_categories["mapping"][
                                        labelFormMainCategoryKey
                                      ].map((key) => (
                                        <option
                                          key={key}
                                          value={key}
                                          className="bg-forest-50 dark:bg-[#1F2726]"
                                        >
                                          {formatSubcategories(key)}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                            <div className="pl-[50px] flex flex-col space-y-[5px] text-[14px] items-start justify-center w-full ml-2 pt-[15px]">
                              <div>
                                Please add your details to participate in ...
                              </div>
                              <div className="flex space-x-[15px] items-center w-full">
                                <input
                                  type="text"
                                  className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                                  placeholder="X Handle (formerly Twitter)"
                                  name="twitter_handle"
                                />
                                <input
                                  type="text"
                                  className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                                  placeholder="Source (optional)"
                                  name="source"
                                />
                              </div>
                            </div>
                            <div className="flex space-x-[15px] items-start justify-center w-full font-medium pt-[15px]">
                              <button
                                className="px-[16px] py-[6px] rounded-full border border-forest-900 dark:border-forest-500 text-forest-900 dark:text-forest-500"
                                onClick={() => setSelectedContract(null)}
                                disabled={isFormSubmitting}
                              >
                                Cancel
                              </button>
                              <button className="px-[16px] py-[6px] rounded-full bg-[#F0995A] text-forest-900">
                                {isFormSubmitting ? (
                                  <Icon
                                    icon="feather:loader"
                                    className="w-4 h-4 animate-spin"
                                  />
                                ) : (
                                  "Submit"
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={key + "" + sortOrder}>
                    <div className="flex rounded-full border-forest-200 dark:border-forest-500 border h-[60px] mt-[7.5px] group hover:bg-forest-300 hover:dark:bg-forest-800 relative">
                      <div className="absolute top-0 left-0 right-0 bottom-[-1px] pointer-events-none">
                        <div className="w-full h-full rounded-full overflow-clip">
                          <div className="relative w-full h-full">
                            <div
                              className={`absolute left-[1px] right-[1px] bottom-[0px] h-[2px] rounded-none font-semibold transition-width duration-300 z-20`}
                              style={{
                                background:
                                  AllChainsByKeys[sortedContracts[key].chain]
                                    .colors[theme][1],
                                width: getWidth(sortedContracts[key]),
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex w-[100%] items-center ml-4 mr-8">
                        <div className="flex items-center h-10 !w-[34%] relative">
                          <div className="absolute right-0 top-0 bottom-0 w-0 group-hover:w-4 bg-gradient-to-r from-transparent to-forest-300 dark:to-forest-800 z-10"></div>
                          <div className="flex-none mr-[36px]">
                            <Icon
                              icon={`gtp:${sortedContracts[key].chain.replace(
                                "_",
                                "-",
                              )}-logo-monochrome`}
                              className="w-[29px] h-[29px]"
                              style={{
                                color:
                                  AllChainsByKeys[sortedContracts[key].chain]
                                    .colors[theme][1],
                              }}
                            />
                            {/* </div> */}
                          </div>
                          <div className="flex flex-grow">
                            <div
                              className={`flex flex-none items-center space-x-2 w-0 ${
                                copyContract ? " delay-1000" : ""
                              } overflow-clip transition-all duration-200 ease-in-out ${
                                sortedContracts[key].name &&
                                sortedContracts[key].project_name
                                  ? "group-hover:w-[48px]"
                                  : "group-hover:w-[96px]"
                              }`}
                            >
                              {!(
                                sortedContracts[key].name &&
                                sortedContracts[key].project_name
                              ) && (
                                <div
                                  className="rounded-full p-2 bg-forest-50 dark:bg-forest-1000 text-black dark:text-white cursor-pointer"
                                  onClick={() => {
                                    setSelectedContract(sortedContracts[key]);
                                    setIsContractLabelModalOpen(true);
                                  }}
                                >
                                  <Icon
                                    icon="gtp:add-tag"
                                    className="w-6 h-6"
                                  />
                                  {/* <Icon
                                      icon="feather:plus"
                                      className="absolute right-0 top-2 stroke-2 stroke-forest-900"
                                    /> */}
                                </div>
                              )}
                              <div
                                className={`rounded-full p-2 ${
                                  copyContract
                                    ? "bg-forest-50/60 dark:bg-forest-1000/60"
                                    : "bg-forest-50 dark:bg-forest-1000"
                                } text-white cursor-pointer`}
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    sortedContracts[key].address,
                                  );
                                  setCopyContract(true);
                                  setTimeout(() => {
                                    setCopyContract(false);
                                  }, 1000);
                                }}
                              >
                                {!copyContract && (
                                  <Icon
                                    icon="feather:copy"
                                    className="w-5 h-5"
                                  />
                                )}
                                {copyContract && (
                                  <Icon
                                    icon="feather:check"
                                    className="w-5 h-5"
                                  />
                                )}
                              </div>
                            </div>
                            <div
                              className={`flex flex-col flex-grow h-full justify-start text-ellipsis overflow-hidden whitespace-nowrap `}
                            >
                              {sortedContracts[key].name ||
                              sortedContracts[key].project_name ? (
                                <>
                                  <div
                                    className={`min-w-full max-w-full text-base ${
                                      sortedContracts[key].project_name
                                        ? "font-bold"
                                        : "opacity-30 italic"
                                    }`}
                                  >
                                    {sortedContracts[key].project_name
                                      ? sortedContracts[key].project_name
                                      : "Project Label Missing"}
                                  </div>

                                  <div
                                    className={`min-w-full max-w-full text-sm ${
                                      sortedContracts[key].name
                                        ? ""
                                        : "opacity-30 italic"
                                    }`}
                                  >
                                    {sortedContracts[key].name
                                      ? sortedContracts[key].name
                                      : "Contract Label Missing"}
                                  </div>
                                </>
                              ) : (
                                <div className="min-w-full max-w-full text-base opacity-30 italic">
                                  {sortedContracts[key].address.substring(
                                    0,
                                    6,
                                  ) +
                                    "..." +
                                    sortedContracts[key].address.substring(
                                      36,
                                      42,
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center text-[14px] !w-[43%] justify-start h-full z-10">
                          <div className="flex w-[40%]">
                            {master &&
                              master.blockspace_categories.main_categories[
                                sortedContracts[key].main_category_key
                              ]}
                          </div>
                          <div className="flex">
                            {" "}
                            {master &&
                            master.blockspace_categories.sub_categories[
                              sortedContracts[key].sub_category_key
                            ]
                              ? master.blockspace_categories.sub_categories[
                                  sortedContracts[key].sub_category_key
                                ]
                              : "Unlabeled"}
                          </div>
                        </div>
                        <div className="flex items-center !w-[23%]  mr-4">
                          <div className="flex flex-col w-[38%] items-end ">
                            <div className="flex gap-x-1 w-[110px] justify-end  ">
                              <div className="flex">
                                {" "}
                                {selectedMode.includes("gas_fees_")
                                  ? showUsd
                                    ? `$`
                                    : `Ξ`
                                  : ""}
                              </div>
                              {selectedMode.includes("gas_fees_")
                                ? showUsd
                                  ? Number(
                                      sortedContracts[
                                        key
                                      ].gas_fees_absolute_usd.toFixed(0),
                                    ).toLocaleString("en-US")
                                  : Number(
                                      sortedContracts[
                                        key
                                      ].gas_fees_absolute_eth.toFixed(2),
                                    ).toLocaleString("en-US")
                                : Number(
                                    sortedContracts[
                                      key
                                    ].txcount_absolute.toFixed(0),
                                  ).toLocaleString("en-US")}
                            </div>

                            {/* <div className="h-[3px] w-[110px] bg-forest-100 dark:bg-forest-900 flex justify-end">
                                  <div
                                    className={`h-full bg-forest-900 dark:bg-forest-50`}
                                    style={{
                                      width: getWidth(sortedContracts[key]),
                                    }}
                                  ></div>
                                </div> */}
                          </div>

                          <div className="flex items-center w-[57%] justify-end ">
                            {master && (
                              <Link
                                href={
                                  master.chains[sortedContracts[key].chain]
                                    .block_explorer +
                                  "address/" +
                                  sortedContracts[key].address
                                }
                                target="_blank"
                              >
                                <Icon
                                  icon="material-symbols:link"
                                  className="w-[30px] h-[30px]"
                                />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            <div className="w-full flex justify-center mb-2">
              <button
                className={`relative mx-auto top-[21px] w-[125px] h-[40px] border-forest-50 border-[1px] rounded-full  hover:bg-forest-700 p-[6px 16px] ${
                  Object.keys(sortedContracts).length <= 10
                    ? "hidden"
                    : "visible"
                } ${
                  Object.keys(sortedContracts).length <=
                    maxDisplayedContracts || maxDisplayedContracts >= 50
                    ? "hidden"
                    : "visible"
                }`}
                onClick={() => {
                  setShowMore(!showMore);
                  if (
                    Object.keys(sortedContracts).length > maxDisplayedContracts
                  ) {
                    setMaxDisplayedContracts(maxDisplayedContracts + 10);
                  } else {
                    setMaxDisplayedContracts(10);
                  }
                }}
              >
                Show More
              </button>
            </div>
          </div>
        </div>
      </Container>
      {/* <ContractLabelModal
        isOpen={isContractLabelModalOpen}
        onClose={() => {
          setIsContractLabelModalOpen(false);
        }}
        contract={selectedContract}
      /> */}
    </div>
  );
}
