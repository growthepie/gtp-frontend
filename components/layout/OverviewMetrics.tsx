"use client";
import Image from "next/image";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  CSSProperties,
} from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { Chains } from "@/types/api/ChainOverviewResponse";
import { AllChainsByKeys } from "@/lib/chains";
import { color } from "highcharts";
import { useHover } from "usehooks-ts";
import { Chart } from "../charts/chart";
import Container from "./Container";
import Colors from "tailwindcss/colors";
import { LandingURL, MasterURL } from "@/lib/urls";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { useLocalStorage } from "usehooks-ts";

const DisabledStates: {
  [mode: string]: {
    [chain: string]: {
      text: string;
      reason: string;
    };
  };
} = {
  gas_fees_share_eth: {
    imx: {
      text: "No Gas Fees",
      reason: "IMX does not charge Gas Fees",
    },
  },
  gas_fees_share_usd: {
    imx: {
      text: "No Gas Fees",
      reason: "IMX does not charge Gas Fees",
    },
  },
};

export default function OverviewMetrics({
  data,
  showEthereumMainnet,
  setShowEthereumMainnet,
  selectedTimespan,
  setSelectedTimespan,
}: {
  data: Chains;
  showEthereumMainnet: boolean;
  setShowEthereumMainnet: (show: boolean) => void;
  selectedTimespan: string;
  setSelectedTimespan: (timespan: string) => void;
}) {
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [selectedMode, setSelectedMode] = useState("txcount_share");
  const [isCategoryMenuExpanded, setIsCategoryMenuExpanded] = useState(true);

  const categories: { [key: string]: string } = useMemo(() => {
    // if (master) {
    //   const result: { [key: string]: string } = {};

    //   Object.keys(master.blockspace_categories.main_categories).forEach(
    //     (key) => {
    //       // if (key !== "cross_chain") {
    //       const words =
    //         master.blockspace_categories.main_categories[key].split(" ");
    //       const formatted = words
    //         .map((word) => {
    //           return word.charAt(0).toUpperCase() + word.slice(1);
    //         })
    //         .join(" ");
    //       result[key] = formatted;
    //       // }
    //     },
    //   );

    //   // result.scaling = "Scaling";

    //   return result;
    // }

    return {
      native_transfers: "Native Transfers",
      token_transfers: "Token Transfers",
      nft_fi: "NFT Fi",
      defi: "DeFi",
      cefi: "CeFi",
      utility: "Utility",
      cross_chain: "Cross Chain",
      gaming: "Gaming",
      unlabeled: "Unlabeled",
    };
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

  const [selectedCategory, setSelectedCategory] = useState("native_transfers");

  const [selectedChain, setSelectedChain] = useState<string | null>(null);

  const [relativePercentage, setRelativePercentage] = useState(
    100 -
      (Object.keys(data["arbitrum"].overview[selectedTimespan]).length - 1) * 2,
    // For right now determine the amount of categories  based on gasfees length
    // In the future if different categories have different amount of value will refactor.
  );

  const relativePercentageByChain = useMemo(() => {
    return Object.keys(data).reduce((acc, chainKey) => {
      return {
        ...acc,
        [chainKey]:
          100 -
          (Object.keys(data[chainKey].overview[selectedTimespan]).length - 1) *
            2,
      };
    }, {});
    // return {
    //   optimism:
    //     100 -
    //     (Object.keys(data["optimism"].overview[selectedTimespan]).length - 1) *
    //       2,
    //   arbitrum:
    //     100 -
    //     (Object.keys(data["arbitrum"].overview[selectedTimespan]).length - 1) *
    //       2,
    //   imx:
    //     100 -
    //     (Object.keys(data["imx"].overview[selectedTimespan]).length - 1) * 2,
    // };
  }, [data, selectedTimespan]);

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
      "90d": {
        label: "90 days",
        value: 90,
        xMin: Date.now() - 90 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      // "180d": {
      //   label: "180 days",
      //   value: 180,
      // },
      "365d": {
        label: "1 year",
        value: 365,
        xMin: Date.now() - 365 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      // max: {
      //   label: "Maximum",
      //   value: 0,
      // },
    };
  }, []);

  const chartSeries = useMemo(() => {
    const dataKey = selectedMode + "_all_l2s";
    if (selectedChain) {
      console.log(selectedChain, {
        id: [selectedChain, selectedCategory, selectedMode].join("_"),
        name: selectedChain,
        unixKey: "unix",
        dataKey: dataKey,
        data: data[selectedChain].daily[selectedCategory].data.length,
      });
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
    console.log(
      selectedChain,
      Object.keys(data)
        .filter((chainKey) => chainKey !== "all_l2s")
        .map((chainKey) => {
          return {
            id: [chainKey, selectedCategory, selectedMode].join("_"),
            name: chainKey,
            unixKey: "unix",
            dataKey: dataKey,
            data: data[chainKey].daily[selectedCategory].data.length,
          };
        }),
    );
    return Object.keys(data)
      .filter(
        (chainKey) =>
          chainKey !== "all_l2s" &&
          data[chainKey].daily[selectedCategory].data.length > 0,
      )
      .map((chainKey) => {
        return {
          id: [chainKey, selectedCategory, selectedMode].join("_"),
          name: chainKey,
          unixKey: "unix",
          dataKey: dataKey,
          data: data[chainKey].daily[selectedCategory].data,
        };
      });
    // return [
    //   {
    //     id: ["all_l2s", selectedCategory, selectedMode].join("_"),
    //     name: "all_l2s",
    //     unixKey: "unix",
    //     dataKey: selectedMode,
    //     data: data.all_l2s.daily[selectedCategory].data,
    //   },
    // ];
  }, [selectedMode, selectedChain, data, selectedCategory]);

  useEffect(() => {
    if (selectedMode.includes("gas_fees_share")) {
      setSelectedMode(showUsd ? "gas_fees_share_usd" : "gas_fees_share_eth");
    }
  }, [selectedMode, showUsd]);

  // console.log(data["optimism"].overview.types.indexOf("gas_fees_share"));
  // console.log(relativePercentage);

  const getBarSectionStyle = useCallback(
    (
      chainKey: string,
      categoryKey: string, // dataIndex: number,
    ) => {
      const style: CSSProperties = {
        backgroundColor: "white",
        // width: "0px",
        borderRadius: "0px",
      };

      const categoriesKey = Object.keys(categories).indexOf(categoryKey);
      const dataKeys = Object.keys(data[chainKey].overview[selectedTimespan]);
      const dataKeysIntersectCategoriesKeys = Object.keys(categories).filter(
        (key) => dataKeys.includes(key),
      );
      const dataIndex = dataKeysIntersectCategoriesKeys.indexOf(categoryKey);

      const categoryData =
        data[chainKey].overview[selectedTimespan][categoryKey];

      // const isLastCategory =
      //   dataIndex === dataKeysIntersectCategoriesKeys.length - 1;

      const isLastCategory = categoryKey === "unlabeled";

      const dataTypes = data[chainKey].overview.types;

      const isSelectedCategory = selectedCategory === categoryKey;

      const isSelectedChainOrNoSelectedChain =
        selectedChain === chainKey || !selectedChain;

      // default transition
      style.transition = "all 0.165s ease-in-out";

      if (isLastCategory)
        style.borderRadius = "20000px 99999px 99999px 20000px";

      if (!categoryData) {
        if (
          (isSelectedCategory && isSelectedChainOrNoSelectedChain) ||
          isCategoryHovered[categoryKey]
        ) {
          if (isSelectedCategory && isSelectedChainOrNoSelectedChain) {
            style.backgroundColor = "rgba(255,255,255, 0.88)";
            style.color = "rgba(0, 0, 0, 0.66)";
            // style.marginRight = "-5px";
          } else {
            style.backgroundColor = "rgba(255,255,255, 0.6)";
            style.color = "rgba(0, 0, 0, 0.33)";
          }
          if (isLastCategory) {
            style.borderRadius = "25% 125% 125% 25%";
          } else {
            style.borderRadius = "5px";
          }
          style.transform =
            isCategoryHovered[categoryKey] && !isSelectedCategory
              ? "scale(1.2)"
              : isSelectedChainOrNoSelectedChain
              ? "scale(1.30)"
              : "scale(1.2)";
          style.zIndex = isCategoryHovered[categoryKey] ? 2 : 5;
        } else {
          style.backgroundColor = "rgba(255,255,255, 0.60)";
          if (isLastCategory) {
            style.borderRadius = "20000px 9999999px 9999999px 20000px";
            style.paddingRight = "30px";
          } else {
            style.borderRadius = "2px";
          }
        }
        style.paddingTop = "0px";
        style.paddingBottom = "0px";
        style.width =
          isCategoryHovered[categoryKey] || selectedCategory === categoryKey
            ? "45px"
            : "10px";

        style.margin = "0px 1px";

        return style;
      }
      if (
        (isSelectedCategory && isSelectedChainOrNoSelectedChain) ||
        isCategoryHovered[categoryKey]
      ) {
        if (isLastCategory) {
          style.borderRadius = "20000px 99999px 99999px 20000px";
        } else {
          style.borderRadius = "5px";
        }

        style.width = categoryData
          ? categoryData[dataTypes.indexOf(selectedMode)] *
              relativePercentageByChain[chainKey] +
            8 +
            "%"
          : "0px";
        // if()
        style.transform =
          isCategoryHovered[categoryKey] && !isSelectedCategory
            ? "scale(1.02)"
            : isSelectedChainOrNoSelectedChain
            ? "scale(1.03)"
            : "scale(1.02)";

        style.outline =
          isSelectedCategory && isSelectedChainOrNoSelectedChain
            ? "3px solid rgba(255,255,255, 1)"
            : "3px solid rgba(255,255,255, 0.33)";

        style.zIndex = isCategoryHovered[categoryKey] ? 2 : 5;

        style.backgroundColor = "";
      } else {
        style.width = categoryData
          ? categoryData[dataTypes.indexOf(selectedMode)] *
              relativePercentageByChain[chainKey] +
            8 +
            "%"
          : "0px";

        // if(isCategoryHovered[categoryKey])
        // style.transform =
        //   isCategoryHovered[categoryKey] && !isSelectedCategory
        //     ? "scale(1)"
        //     : "scale(1.05)";

        if (isLastCategory) {
          style.borderRadius = "0px 99999px 99999px 0px";
        } else {
          style.borderRadius = "0px";
        }

        if (categoryKey === "unlabeled" && categoryData) {
          // style.backgroundColor = "rgba(88, 88, 88, 0.55)";
          style.background =
            "linear-gradient(-45deg, rgba(0, 0, 0, .88) 25%, rgba(0, 0, 0, .99) 25%, rgba(0, 0, 0, .99) 50%, rgba(0, 0, 0, .88) 50%, rgba(0, 0, 0, .88) 75%, rgba(0, 0, 0, .99) 75%, rgba(0, 0, 0, .99))";
          // style.background = undefined;
          //   "linear-gradient(to right, #e5405e 0%, #ffdb3a 45%, #3fffa2 100%)";
          // style.backgroundPosition = "75% 0%";
          // style.backgroundRepeat = "repeat";
          style.animation = "unlabeled-gradient 20s linear infinite";
          style.backgroundSize = "10px 10px";
        } else {
          style.backgroundColor = `rgba(0, 0, 0, ${
            0.06 + (dataIndex / (Object.keys(categories).length - 1)) * 0.94
          })`;
        }
      }
      return style;
    },
    [
      selectedCategory,
      selectedMode,
      selectedChain,
      data,
      relativePercentageByChain,
      isCategoryHovered,
      categories,
      selectedTimespan,
    ],
  );

  return (
    <div className="w-full flex-col relative">
      <div>{selectedMode}</div>
      <Container>
        <div className="flex flex-col rounded-[15px] py-[2px] px-[2px] text-xs xl:text-base xl:flex xl:flex-row w-full justify-between items-center static -top-[8rem] left-0 right-0 xl:rounded-full dark:bg-[#1F2726] bg-forest-50 md:py-[2px]">
          <div className="flex w-full xl:w-auto justify-between xl:justify-center items-stretch xl:items-center mx-4 xl:mx-0 space-x-[4px] xl:space-x-1">
            <button
              className={`rounded-full grow px-4 py-1.5 xl:py-4 font-medium ${
                selectedMode.includes("gas_fees_share")
                  ? "bg-forest-500 dark:bg-forest-1000"
                  : "hover:bg-forest-500/10"
              }`}
              onClick={() => {
                setSelectedMode(
                  showUsd ? "gas_fees_share_usd" : "gas_fees_share_eth",
                );
              }}
            >
              Gas Fees
            </button>
            <button
              className={`rounded-full grow px-4 py-1.5 xl:py-4 font-medium ${
                "txcount_share" === selectedMode
                  ? "bg-forest-500 dark:bg-forest-1000"
                  : "hover:bg-forest-500/10"
              }`}
              onClick={() => {
                setSelectedMode("txcount_share");
              }}
            >
              Transaction Count
            </button>
          </div>
          <div className="block xl:hidden w-[70%] mx-auto my-[10px]">
            <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
          </div>
          <div className="flex w-full xl:w-auto justify-between xl:justify-center items-stretch xl:items-center mx-4 xl:mx-0 space-x-[4px] xl:space-x-1">
            {Object.keys(timespans).map((timespan) => (
              <button
                key={timespan}
                //rounded-full sm:w-full px-4 py-1.5 xl:py-4 font-medium
                className={`rounded-full grow px-4 py-1.5 xl:py-4 font-medium ${
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
        </div>
      </Container>
      <Container className="block w-full !pr-0 lg:!px-[50px]">
        <div className="overflow-x-scroll lg:overflow-x-visible z-100 w-full scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller">
          <div
            className={
              "min-w-[820px] md:min-w-[850px] overflow-hidden px-[16px]"
            }
          >
            <div
              className={
                "relative h-[50px] border-x-[1px] border-t-[1px] rounded-t-[15px] text-forest-50 dark:text-forest-50 border-forest-400 dark:border-forest-800 bg-forest-900 dark:bg-forest-1000 mt-8 overflow-hidden"
              }
            >
              <div className="flex w-full h-full text-[12px]">
                <div
                  className={`relative flex w-[138px] h-full justify-center items-center`}
                >
                  <button className="flex flex-col flex-1 h-full justify-center items-center border-x border-transparent overflow-hidden">
                    <div
                      className={`relative -left-[39px] top-[17px] text-xs font-medium`}
                    >
                      Chains
                    </div>
                    <div
                      className={`relative left-[30px] -top-[17px] text-xs font-medium`}
                    >
                      Categories
                    </div>
                  </button>
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <line
                      strokeDasharray="2, 2"
                      x1="0"
                      y1="0"
                      x2="100%"
                      y2="100%"
                      style={{
                        stroke: theme === "dark" ? "#5a6462" : "#eaeceb",
                        strokeWidth: 1,
                      }}
                    />
                  </svg>
                </div>
                <div className="flex flex-1">
                  {Object.keys(categories).map(
                    (category, i) =>
                      categories[category] !== "Chains" && (
                        <div
                          key={category}
                          className={`relative flex h-full justify-center items-center 
                          ${category === "unlabeled" ? "flex-1" : "flex-1"}
                          ${
                            selectedCategory === category
                              ? "borden-hidden rounded-[0px]"
                              : "h-full"
                          }`}
                          onMouseEnter={() => {
                            setIsCategoryHovered((prev) => ({
                              ...prev,
                              [category]: true,
                            }));
                          }}
                          onMouseLeave={() => {
                            setIsCategoryHovered((prev) => ({
                              ...prev,
                              [category]: false,
                            }));
                          }}
                          style={{
                            backgroundColor:
                              selectedCategory === category
                                ? "#5A6462"
                                : `rgba(0, 0, 0, ${
                                    0.06 +
                                    (i / Object.keys(categories).length) * 0.94
                                  })`,
                          }}
                        >
                          <button
                            key={category}
                            className={`flex flex-col w-full h-full justify-center items-center overflow-hidden border-l border-[
                          1px 
                        ] border-forest-50 dark:border-forest-800
                          ${
                            selectedCategory === category
                              ? "bg-forest-800/[0.025]"
                              : ""
                          } 
                          ${
                            isCategoryHovered[category]
                              ? "bg-forest-800/50"
                              : ""
                          }`}
                            onClick={() => {
                              setSelectedCategory(category);
                              setSelectedChain(null);
                            }}
                          >
                            <div
                              className={`${
                                selectedCategory === category
                                  ? "text-sm font-semibold"
                                  : "text-xs font-medium"
                              }`}
                            >
                              {categories[category]}
                            </div>
                          </button>
                        </div>
                      ),
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* <colorful rows> */}
          {/* {selectedScale === "gasfees" ? ( */}
          <div className="flex flex-col space-y-[10px] min-w-[820px] md:min-w-[850px] mb-8">
            {
              //chain name is key
              Object.keys(data)
                .filter((c) => c !== "all_l2s")
                .map((chainKey, index) => {
                  return (
                    <div key={index} className="w-full h-full relative">
                      {DisabledStates[selectedMode] &&
                      DisabledStates[selectedMode][chainKey] ? (
                        <>
                          <div
                            className={`flex flex-row flex-grow h-full items-center rounded-full text-xs font-medium ${
                              ["arbitrum", "imx", "all_l2s"].includes(chainKey)
                                ? "text-white dark:text-black"
                                : "text-white"
                            } ${
                              AllChainsByKeys[chainKey].backgrounds[theme][1]
                            }`}
                          >
                            <div className="flex items-center h-[45px] pl-[20px] w-[155px] min-w-[155px] z-10">
                              <div className="flex justify-center items-center w-[30px]">
                                <Icon
                                  icon={`gtp:${chainKey}-logo-monochrome`}
                                  className="w-[15px] h-[15px]"
                                />
                              </div>
                              <div className="-mb-0.5">
                                {AllChainsByKeys[chainKey].label}
                              </div>
                            </div>
                            <div className="flex flex-col w-full h-[41px] justify-center items-center px-4 py-5 z-10">
                              <div className="flex flex-row w-full justify-center items-center text-sm">
                                {DisabledStates[selectedMode][chainKey].text}
                                <Tooltip placement="right" allowInteract>
                                  <TooltipTrigger>
                                    <div className="p-1 z-10 mr-0 md:-mr-0.5">
                                      <Icon
                                        icon="feather:info"
                                        className="w-4 h-4"
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
                                    <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-autow-[420px] h-[80px] flex items-center">
                                      {
                                        DisabledStates[selectedMode][chainKey]
                                          .reason
                                      }
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <div className="absolute w-full h-full p-[2px]">
                              <div className="w-full h-full bg-white/60 rounded-full"></div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div
                          className={`flex flex-row flex-grow h-full items-center rounded-full text-xs font-medium ${
                            ["arbitrum", "imx", "all_l2s"].includes(chainKey)
                              ? "text-white dark:text-black"
                              : "text-white"
                          } ${AllChainsByKeys[chainKey].backgrounds[theme][1]}`}
                        >
                          <div className="flex items-center h-[45px] pl-[20px] w-[155px] min-w-[155px]">
                            <div className="flex justify-center items-center w-[30px]">
                              <Icon
                                icon={`gtp:${chainKey}-logo-monochrome`}
                                className="w-[15px] h-[15px]"
                              />
                            </div>
                            <div className="-mb-0.5">
                              {AllChainsByKeys[chainKey].label}
                            </div>
                          </div>
                          <div className="flex w-full pr-[2px] py-[2px] relative">
                            {/* {(DisabledStates[selectedMode] &&
                            DisabledStates[selectedMode][chainKey]) && (
                              <div className="flex flex-col w-full h-[41px] justify-center items-center px-4 py-5 ">
                                <div className="flex flex-row w-full justify-center items-center text-sm">
                                  No Gas Fees{" "}
                                  <Tooltip placement="right" allowInteract>
                                    <TooltipTrigger>
                                      <div className="p-1 z-10 mr-0 md:-mr-0.5">
                                        <Icon
                                          icon="feather:info"
                                          className="w-4 h-4"
                                        />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
                                      <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-autow-[420px] h-[80px] flex items-center">
                                        IMX does not charge gas fees.
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            )} */}
                            {Object.keys(categories).map((categoryKey, i) => {
                              // if (
                              //   !(
                              //     categoryKey in
                              //     data[chainKey].overview[selectedTimespan]
                              //   )
                              // )
                              //   return (
                              //     <div
                              //       key={categoryKey}
                              //       className="w-1"
                              //       style={getBarSectionStyle(
                              //         chainKey,
                              //         categoryKey,
                              //       )}
                              //     >
                              //       {/* <div className="w-1 h-full bg-white border-1 border-black rounded-full"></div> */}
                              //     </div>
                              //   );

                              const rawChainCategories = Object.keys(
                                data[chainKey].overview[selectedTimespan],
                              );

                              const chainCategories = Object.keys(
                                categories,
                              ).filter((x) => rawChainCategories.includes(x));

                              const categoryIndex =
                                chainCategories.indexOf(categoryKey);

                              return (
                                <div
                                  key={categoryKey}
                                  onClick={() => {
                                    if (selectedCategory === categoryKey) {
                                      if (
                                        !data[chainKey].overview[
                                          selectedTimespan
                                        ][categoryKey]
                                      ) {
                                        return;
                                      }
                                      if (selectedChain === chainKey) {
                                        // setSelectedCategory(categoryKey);
                                        setSelectedChain(null);
                                      } else {
                                        // setSelectedCategory(categoryKey);
                                        setSelectedChain(chainKey);
                                      }
                                    } else {
                                      setSelectedCategory(categoryKey);
                                      setSelectedChain(null);
                                    }
                                  }}
                                  onMouseEnter={() => {
                                    setIsCategoryHovered((prev) => ({
                                      ...prev,
                                      [categoryKey]: true,
                                    }));
                                  }}
                                  onMouseLeave={() => {
                                    setIsCategoryHovered((prev) => ({
                                      ...prev,
                                      [categoryKey]: false,
                                    }));
                                  }}
                                  className={`flex flex-col h-[41px] justify-center items-center py-5 cursor-pointer relative transition-all duration-200 ease-in-out
                                    ${
                                      data[chainKey].overview[selectedTimespan][
                                        categoryKey
                                      ]
                                        ? (selectedCategory === categoryKey &&
                                            (selectedChain === chainKey ||
                                              selectedChain === null)) ||
                                          isCategoryHovered[categoryKey]
                                          ? isCategoryHovered[categoryKey] &&
                                            selectedCategory !== categoryKey
                                            ? `py-[23px] -my-[0px] z-[2] shadow-lg ${AllChainsByKeys[chainKey].backgrounds[theme][1]}`
                                            : `py-[25px] -my-[5px] z-[2] shadow-lg ${AllChainsByKeys[chainKey].backgrounds[theme][1]}`
                                          : `z-[1]`
                                        : "py-[23px] -my-[0px] z-[2] shadow-lg"
                                    } 
                                    ${
                                      categoryIndex ===
                                      Object.keys(categories).length - 1
                                        ? selectedCategory === categoryKey &&
                                          (selectedChain === chainKey ||
                                            selectedChain === null)
                                          ? ""
                                          : "rounded-r-full"
                                        : ""
                                    }`}
                                  style={getBarSectionStyle(
                                    chainKey,
                                    categoryKey,
                                  )}
                                >
                                  {/* highlight on hover div */}
                                  {/* {isCategoryHovered[categoryKey] &&
                                    !(
                                      selectedCategory === categoryKey &&
                                      selectedChain === null
                                    ) && (
                                      <div
                                        className={`absolute inset-0 bg-white/30 mix-blend-hard-light`}
                                        style={{
                                          borderRadius: `${
                                            (selectedCategory === categoryKey &&
                                              (selectedChain === chainKey ||
                                                selectedChain === null)) ||
                                            isCategoryHovered[categoryKey]
                                              ? categoryIndex ===
                                                Object.keys(
                                                  data[chainKey].overview[
                                                    selectedTimespan
                                                  ],
                                                ).length -
                                                  1
                                                ? "20000px 99999px 99999px 20000px"
                                                : "5px"
                                              : categoryIndex ===
                                                Object.keys(
                                                  data[chainKey].overview[
                                                    selectedTimespan
                                                  ],
                                                ).length -
                                                  1
                                              ? "0px 99999px 99999px 0px"
                                              : "0px"
                                          }`,
                                        }}
                                      />
                                    )} */}

                                  <div
                                    className={`mix-blend-luminosity font-medium w-full absolute inset-0 flex items-center justify-center ${
                                      (selectedCategory === categoryKey &&
                                        (selectedChain === chainKey ||
                                          selectedChain === null)) ||
                                      isCategoryHovered[categoryKey]
                                        ? `${
                                            isCategoryHovered[categoryKey] &&
                                            selectedCategory !== categoryKey
                                              ? "text-xs"
                                              : "text-sm font-semibold"
                                          } ${
                                            [
                                              "arbitrum",
                                              "imx",
                                              "all_l2s",
                                            ].includes(chainKey)
                                              ? "text-black"
                                              : "text-white"
                                          }`
                                        : [
                                            "arbitrum",
                                            "imx",
                                            "all_l2s",
                                          ].includes(chainKey)
                                        ? i > 4
                                          ? "text-white/60 text-xs"
                                          : "text-black text-xs"
                                        : i > 4
                                        ? "text-white/60 text-xs"
                                        : "text-white/80 text-xs"
                                    }`}
                                  >
                                    {data[chainKey].overview[selectedTimespan][
                                      categoryKey
                                    ] ? (
                                      <>
                                        {(
                                          data[chainKey].overview[
                                            selectedTimespan
                                          ][categoryKey][
                                            data[
                                              chainKey
                                            ].overview.types.indexOf(
                                              selectedMode,
                                            )
                                          ] * 100.0
                                        ).toFixed(2)}
                                        %
                                      </>
                                    ) : (
                                      <div
                                        className={`text-black/80
                                        ${
                                          isCategoryHovered[categoryKey] ||
                                          selectedCategory === categoryKey
                                            ? "opacity-100 py-8"
                                            : "opacity-0"
                                        } transition-opacity duration-300 ease-in-out`}
                                      >
                                        0%
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
                .concat(
                  <div className="relative pl-[155px] w-full flex justify-between h-[15px] -top-[10px] text-[10px]">
                    {[0, 20, 40, 60, 80, 100].map((x, i) => (
                      <div key={x} className="relative">
                        <div className="h-[15px] border-r border-forest-900 dark:border-forest-500"></div>
                        {x === 0 && (
                          <div className="text-forest-900 dark:text-forest-500 absolute top-[110%] left-0">
                            {x}%
                          </div>
                        )}
                        {x === 100 && (
                          <div className="text-forest-900 dark:text-forest-500 absolute top-[110%] right-0">
                            {x}%
                          </div>
                        )}
                        {x !== 0 && x !== 100 && (
                          <div className="text-forest-900 dark:text-forest-500 absolute w-8 top-[110%] -left-2">
                            {x}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>,
                )
            }
          </div>
        </div>
      </Container>
      <Container>
        <div className="mt-[20px] lg:mt-[50px] mb-[38px]">
          <h2 className="text-[20px] font-bold">
            {selectedChain
              ? AllChainsByKeys[selectedChain].label
              : "All Chains"}
            : {categories[selectedCategory]}
          </h2>
        </div>
        <Chart
          types={
            selectedChain === null
              ? data.all_l2s.daily.types
              : data[selectedChain].daily.types
          }
          chartType="area"
          stack
          timespan={selectedTimespan}
          series={chartSeries}
          yScale="percentage"
          chartHeight="196px"
          chartWidth="100%"
        />
        <Chart
          types={
            selectedChain === null
              ? data.all_l2s.daily.types
              : data[selectedChain].daily.types
          }
          timespan={selectedTimespan}
          series={[
            {
              id: "all_l2s",
              name: "all_l2s",
              unixKey: "unix",
              dataKey: selectedMode,
              data: data.all_l2s.daily[selectedCategory].data,
            },
          ]}
          yScale="percentage"
          chartHeight="196px"
          chartWidth="100%"
        />
      </Container>
    </div>
  );
}
