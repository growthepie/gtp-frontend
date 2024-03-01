"use client";
import Image from "next/image";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
  CSSProperties,
} from "react";
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

import OverviewChart from "./BlockspaceOverview/OverviewChart";
import RowContainer from "./BlockspaceOverview/ChainRows/RowContainer";
import { RowProvider } from "./BlockspaceOverview/ChainRows/RowContext";
import ContractContainer from "./BlockspaceOverview/Contracts/ContractContainer";
import { ContractProvider } from "./BlockspaceOverview/Contracts/ContractContext";

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
  const { theme } = useTheme();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [selectedMode, setSelectedMode] = useState(
    forceSelectedChain === "imx" ? "txcount_share" : "gas_fees_share_usd",
  );
  const [isCategoryMenuExpanded, setIsCategoryMenuExpanded] = useState(true);
  const [allCats, setAllCats] = useState(forceSelectedChain ? true : false);
  const [selectedCategory, setSelectedCategory] = useState("nft");
  const [selectedValue, setSelectedValue] = useState("share");
  const [chainEcosystemFilter, setChainEcosystemFilter] = useLocalStorage(
    "chainEcosystemFilter",
    "all-chains",
  );
  const standardChainKey = forceSelectedChain ? forceSelectedChain : "all_l2s";
  const isMobile = useMediaQuery("(max-width: 1023px)");

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

  const [selectedChain, setSelectedChain] = useState<string | null>(
    forceSelectedChain ?? null,
  );

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
          {/* <div
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
          </div> */}
        </div>
      </Container>
      {/*Chain Rows/List */}
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
      {/*Contracts Label and Rows */}
      <Container className="lg:overflow-hidden overflow-x-scroll scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller pb-4">
        <ContractProvider
          value={{
            data,
            master,
            selectedMode,
            forceSelectedChain,
            selectedCategory,
            selectedChain,
            selectedTimespan,
            selectedValue,
            categories,
            allCats,
            timespans,
            standardChainKey,
            setSelectedChain,
            setSelectedCategory,
            setAllCats,
            formatSubcategories,
          }}
        >
          <ContractContainer />
        </ContractProvider>
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
