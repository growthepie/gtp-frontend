"use client";
import {
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useTheme } from "next-themes";
import { Chains } from "@/types/api/ChainOverviewResponse";
import {  useMediaQuery } from "usehooks-ts";
import Container from "./Container";

import { MasterResponse } from "@/types/api/MasterResponse";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";

import OverviewChart from "./BlockspaceOverview/OverviewChart";
import RowContainer from "./BlockspaceOverview/ChainRows/RowContainer";
import { RowProvider } from "./BlockspaceOverview/ChainRows/RowContext";
import ContractContainer from "./BlockspaceOverview/Contracts/ContractContainer";
import { ContractProvider } from "./BlockspaceOverview/Contracts/ContractContext";
import {
  TopRowContainer,
  TopRowChild,
  TopRowParent,
} from "@/components/layout/TopRow";
import HorizontalScrollContainer from "../HorizontalScrollContainer";
import { useMaster } from "@/contexts/MasterContext";
import { TitleButtonLink } from "./TextHeadingComponents";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { ProjectsMetadataProvider } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";

export default function OverviewMetrics({
  data,
  master,
  selectedTimespan,
  setSelectedTimespan,
  forceSelectedChain,
  forceCategory,
}: {
  data: Chains;
  master: MasterResponse;
  selectedTimespan: string;
  setSelectedTimespan: (timespan: string) => void;
  forceSelectedChain?: string;
  forceCategory?: string;
}) {
  const { theme } = useTheme();
  const { AllChainsByKeys } = useMaster();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [selectedMode, setSelectedMode] = useState(
  "txcount_share"
  );
  const [isCategoryMenuExpanded, setIsCategoryMenuExpanded] = useState(true);
  const [allCats, setAllCats] = useState(forceSelectedChain ? true : false);
  const [selectedCategory, setSelectedCategory] = useState(
    forceCategory
      ? forceCategory
      : Object.keys(master.blockspace_categories.main_categories)[0],
  );

  const [selectedValue, setSelectedValue] = useState("share");
  const [chainEcosystemFilter, setChainEcosystemFilter] = useSessionStorage(
    "chainEcosystemFilter",
    "all-chains",
  );

  const invalidTimespan = forceSelectedChain ? "" : "1d";
  const standardChainKey = forceSelectedChain ? forceSelectedChain : "all_l2s";
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const [hoveredSeriesId, setHoveredSeriesId] = useState<string>("");
  const [hoveredChartSeriesId, setHoveredChartSeriesId] = useState<string>("");
  const [hoveredCategories, setHoveredCategories] = useState<string[]>([]);

  const [selectedChain, setSelectedChain] = useState<string | null>(
    forceSelectedChain ?? null,
  );

  const hoverCategory = (category: string) => {
    if (!hoveredCategories.includes(category)) {
      setHoveredCategories([category]);
    }
  };

  const unhoverCategory = (category: string) => {
    if (hoveredCategories.includes(category)) {
      setHoveredCategories(hoveredCategories.filter((c) => c !== category));
    }
  };

  const isCategoryHovered = (category: string) => {
    return hoveredCategories.includes(category);
  };

  useEffect(() => {
    if (!hoveredSeriesId) {
      setHoveredCategories([]);
    }

    if (allCats && hoveredSeriesId) {
      const hoveredChartSeriesCategory = hoveredSeriesId.split("::")[1];
      setHoveredCategories([hoveredChartSeriesCategory]);
    }
  }, [allCats, hoveredSeriesId]);

  useEffect(() => {
    if (!forceCategory) return;

    const newState = { category: `${selectedCategory}` };
    window.history.replaceState(
      newState,
      "",
      `/blockspace/chain-overview/${selectedCategory}`,
    );
  }, [forceCategory, selectedCategory]);

  const forceHoveredChartSeriesId = useMemo(() => {
    if (allCats && hoveredCategories.length > 0) {
      return selectedChain + "::" + hoveredCategories[0] + "::" + selectedMode;
    }

    return "";
  }, [allCats, hoveredCategories, selectedChain, selectedMode]);

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

  const timespans = useMemo(() => {
    if (forceSelectedChain) {
      return {
        "1d": {
          label: "Yesterday",
          shortLabel: "1d",
          value: 1,
          xMin: Date.now() - 1 * 24 * 60 * 60 * 1000,
          xMax: Date.now(),
        },
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
        "180d": {
          label: "180 days",
          shortLabel: "180d",
          value: 180,
          xMin: Date.now() - 180 * 24 * 60 * 60 * 1000,
          xMax: Date.now(),
        },
        max: {
          label: "Max",
          shortLabel: "Max",
          value: 0,
        },
      };
    } else {
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
        "180d": {
          label: "180 days",
          shortLabel: "180d",
          value: 180,
          xMin: Date.now() - 180 * 24 * 60 * 60 * 1000,
          xMax: Date.now(),
        },
        max: {
          label: "Max",
          shortLabel: "Max",
          value: 0,
        },
      };
    }
  }, [forceSelectedChain]);

  useEffect(() => {
    if (selectedMode.includes("gas_fees_share")) {
      setSelectedMode(showUsd ? "gas_fees_share_usd" : "gas_fees_share_eth");
    } else if (selectedMode.includes("gas_fees")) {
      setSelectedMode(
        showUsd ? "gas_fees_usd_absolute" : "gas_fees_eth_absolute",
      );
    }
  }, [selectedMode, showUsd]);

  // console.log(hoveredChartSeriesId);
  // console.log(hoveredCategories);

  return (
    <>
      {invalidTimespan !== selectedTimespan && (
        <div className="w-full flex-col relative">
          <Container>
            <TopRowContainer>
              <TopRowParent>
                <TopRowChild
                  isSelected={selectedMode.includes("gas_fees")}
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
                </TopRowChild>
                <TopRowChild
                  isSelected={selectedMode.includes("txcount")}
                  onClick={() => {
                    setSelectedMode(
                      selectedValue === "absolute"
                        ? "txcount_absolute"
                        : "txcount_share",
                    );
                  }}
                >
                  Transaction Count
                </TopRowChild>
              </TopRowParent>
              <div className="block lg:hidden w-[70%] mx-auto my-[2.5px]">
                <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
              </div>
              <TopRowParent>
                {Object.keys(timespans).map((timespan) => (
                  <TopRowChild
                    key={timespan}
                    isSelected={selectedTimespan === timespan}
                    onClick={() => {
                      setSelectedTimespan(timespan);
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
              </TopRowParent>
            </TopRowContainer>
          </Container>
          {/*Chain Rows/List */}
          <div id="content-container" className="block w-full">
            <RowProvider
              value={{
                master,
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
                hoverCategory,
                unhoverCategory,
              }}
            >
              <RowContainer />
            </RowProvider>
          </div>
          {/*Chart Head*/}
          <Container>
            <div className=" ">
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
          {selectedTimespan === "1d" ? (
            <></>
          ) : (
            <Container className="mb-1">
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
                hoveredCategories={hoveredCategories}
                allCats={allCats}
                setHoveredChartSeriesId={setHoveredChartSeriesId}
                hoveredChartSeriesId={hoveredChartSeriesId}
                forceHoveredChartSeriesId={forceHoveredChartSeriesId}
              />
            </Container>
          )}
          {/*Chart Footer*/}
          <Container className="w-[100%] ml-[22px]">
            <div className={`flex flex-wrap items-center w-[100%] gap-y-2 `}>
              <h1 className="font-bold text-sm pr-2 pl-2">
                {!allCats
                  ? master &&
                    master.blockspace_categories.main_categories[
                      selectedCategory
                    ]
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
            <div className="flex flex-row w-[100%] mx-auto justify-center md:items-center items-end md:justify-end rounded-full  text-sm md:text-base  md:rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 px-0.5 md:px-1 mt-[8px] gap-x-1 text-md py-[4px]">
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
            <div className="w-[100%] mx-auto mt-[30px] flex flex-col">
              <div className="flex items-start justify-between">
                <h2 className="heading-large-md">Most Active Contracts</h2>
                <div className="hidden md:block">
                <TitleButtonLink
                  label="Don’t see your app? Label here."
                  icon="gtp-oli-logo"
                  iconSize="md"
                  iconBackground="bg-transparent"
                  rightIcon={"feather:arrow-right" as GTPIconName}
                  href="https://www.openlabelsinitiative.org/?gtp.applications"
                  newTab
                  gradientClass="bg-[linear-gradient(4.17deg,#5C44C2_-14.22%,#69ADDA_42.82%,#FF1684_93.72%)]"
                  className="w-fit hidden md:block"
                  />
                </div>
                <div className="block md:hidden">
                  <TitleButtonLink
                    label={<div className="heading-small-xxs">Label here.</div>}
                    icon="gtp-oli-logo"
                    iconSize="md"
                    iconBackground="bg-transparent"
                    href="https://www.openlabelsinitiative.org/?gtp.applications"
                    newTab
                    gradientClass="bg-[linear-gradient(4.17deg,#5C44C2_-14.22%,#69ADDA_42.82%,#FF1684_93.72%)]"
                    className="w-fit"
                    containerClassName=""
                  />
                </div>
              </div>
              <p className="text-sm mt-[15px]">
                See the most active contracts within the selected timeframe (
                {timespans[selectedTimespan].label}) and for your selected
                category.{" "}
              </p>
            </div>
          </Container>
          {/*Contracts Label and Rows */}
          <HorizontalScrollContainer>
            <ProjectsMetadataProvider>
              <ContractProvider
                value={{
                  data: data,
                  master: master,
                  selectedMode: selectedMode,
                  selectedCategory: selectedCategory,
                  selectedTimespan: selectedTimespan,
                  timespans: timespans,
                  categories: categories,
                  formatSubcategories: formatSubcategories,
                  showUsd: showUsd,
                  selectedValue: selectedValue,
                  forceSelectedChain: forceSelectedChain,
                  selectedChain: selectedChain,
                  allCats: allCats,
                  standardChainKey: standardChainKey,
                  setAllCats: setAllCats,
                  setSelectedChain: setSelectedChain,
                  setSelectedCategory: setSelectedCategory,
                  selectedChains: undefined,
                  selectedSubcategories: undefined,
                  chainEcosystemFilter: chainEcosystemFilter,
                  focusEnabled: false,
                }}
              >
                <ContractContainer />
              </ContractProvider>
            </ProjectsMetadataProvider>
          </HorizontalScrollContainer>
        </div>
      )}
    </>
  );
}
