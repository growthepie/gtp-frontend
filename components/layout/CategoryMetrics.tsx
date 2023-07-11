"use client";
import Image from "next/image";
import { useMemo, useState, useEffect, useRef, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Switch } from "../Switch";
import { Sources } from "@/lib/datasources";
import Container from "./Container";
import { CategoryComparisonResponseData } from "@/types/api/CategoryComparisonResponse";
import { animated } from "@react-spring/web";
import { Chart } from "../charts/chart";

export default function CategoryMetrics({
  data,
  showEthereumMainnet,
  setShowEthereumMainnet,
  selectedTimespan,
  setSelectedTimespan,
}: {
  data: CategoryComparisonResponseData;
  showEthereumMainnet: boolean;
  setShowEthereumMainnet: (show: boolean) => void;
  selectedTimespan: string;
  setSelectedTimespan: (timespan: string) => void;
}) {
  const [selectedMode, setSelectedMode] = useState("gas_fees_share");
  const [selectedCategory, setSelectedCategory] = useState("native_transfers");
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [openSub, setOpenSub] = useState(false);
  const [selectedValue, setSelectedValue] = useState("absolute");

  useEffect(() => {
    setSelectedChain("arbitrum");
  }, []);

  const chartSeries = useMemo(() => {
    if (selectedChain && data)
      return [
        {
          id: [selectedChain, selectedCategory, selectedMode].join("_"),
          name: selectedChain,
          unixKey: "unix",
          dataKey: selectedMode,
          data: data[selectedCategory].daily[selectedChain],
        },
      ];
    return [
      {
        id: ["arbitrum", selectedCategory, selectedMode].join("_"),
        name: "arbitrum",
        unixKey: "unix",
        dataKey: selectedMode,
        data: data[selectedCategory].daily["arbitrum"],
      },
    ];
  }, [selectedChain, selectedCategory, selectedMode, data]);

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
      },
      // "180d": {
      //   label: "180 days",
      //   value: 180,
      // },
      "365d": {
        label: "1 year",
        value: 365,
      },
      // max: {
      //   label: "Maximum",
      //   value: 0,
      // },
    };
  }, []);

  const categories = useMemo<{ [key: string]: string }>(() => {
    return {
      categories: "Categories",
      native_transfers: "Native Transfer",
      token_transfers: "Token Transfer",
      nft_fi: "NFT",
      defi: "DeFi",
      cefi: "CeFi",
      utility: "Utility",
      scaling: "Scaling",
      gaming: "Gaming",
    };
  }, []);

  const [isCategoryHovered, setIsCategoryHovered] = useState<{
    [key: string]: boolean;
  }>({
    native_transfers: false,
    token_transfers: false,
    nft_fi: false,
    defi: false,
    cefi: false,
    utility: false,
    scaling: false,
    gaming: false,
  });

  const [selectedSubcategories, setSelectedSubcategories] = useState<{
    [key: string]: any[];
  }>(() => {
    const initialSelectedSubcategories = {};
    Object.keys(categories).forEach((category) => {
      if (data[category]?.subcategories?.list) {
        initialSelectedSubcategories[category] = [
          ...data[category].subcategories.list,
        ];
      } else {
        initialSelectedSubcategories[category] = [];
      }
    });
    return initialSelectedSubcategories;
  });

  function formatSubcategories(str) {
    const title = str.replace(/_/g, " ");
    const words = title.split(" ");
    const formatted = words.map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    });

    return formatted.join(" ");
  }

  function handleToggleSubcategory(category, subcategory) {
    setSelectedSubcategories((prevSelectedSubcategories) => {
      const categorySubcategories = prevSelectedSubcategories[category];
      const index = categorySubcategories.indexOf(subcategory);

      if (index !== -1) {
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

  function RenderSubcategory({ category, subcategory, selection }) {
    return selection ? (
      checkSubcategory(category, subcategory) ? (
        <animated.button
          key={subcategory}
          className="flex border-forest-500 rounded-[15px] border-[1.5px] p-[5px] pl-[12px] my-1 justify-between items-center mx-auto w-[130px] hover:bg-white/5 z-10"
          onClick={(e) => {
            handleToggleSubcategory(category, subcategory);
            e.stopPropagation();
          }}
        >
          <div className="pr-[5px]">{formatSubcategories(subcategory)}</div>
          <div className="rounded-full bg-forest-50 dark:bg-forest-900">
            <Icon
              icon="feather:check-circle"
              className="w-[14px] h-[14px] opacity-100"
            />
          </div>
        </animated.button>
      ) : null
    ) : !checkSubcategory(category, subcategory) ? (
      <animated.button
        key={subcategory}
        className="flex border-forest-500 rounded-[15px] border-[1.5px] p-[5px] pl-[12px] my-1 justify-between items-center mx-auto w-[130px] hover:bg-white/5 z-10 opacity-30"
        onClick={(e) => {
          handleToggleSubcategory(category, subcategory);
          e.stopPropagation();
        }}
      >
        <div className="pr-[5px]">{formatSubcategories(subcategory)}</div>
        <div className="rounded-full bg-forest-50 dark:bg-forest-900">
          <Icon
            icon="feather:check-circle"
            className="w-[14px] h-[14px] opacity-0"
          />
        </div>
      </animated.button>
    ) : null;
  }

  return (
    <div className="w-full flex-col relative">
      <Container>
        <div className="flex flex-col rounded-[15px] py-[2px] px-[2px] text-xs xl:text-base xl:flex xl:flex-row w-full justify-between items-center static -top-[8rem] left-0 right-0 xl:rounded-full dark:bg-[#1F2726] bg-forest-50 md:py-[2px]">
          <div className="flex w-full xl:w-auto justify-between xl:justify-center items-stretch xl:items-center mx-4 xl:mx-0 space-x-[4px] xl:space-x-1">
            <button
              className={`rounded-full grow px-4 py-1.5 xl:py-4 font-medium ${
                "gas_fees_share" === selectedMode
                  ? "bg-forest-500 dark:bg-forest-1000"
                  : "hover:bg-forest-500/10"
              }`}
              onClick={() => {
                setSelectedMode("gas_fees_share");
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
          {!openSub ? (
            <div
              className={
                "relative min-w-[820px] md:min-w-[850px] w-[97.5%] h-[67px] m-auto border-x-[1px] border-y-[1px] rounded-[15px] text-forest-50 dark:text-forest-50 border-forest-400 dark:border-forest-800 bg-forest-900 dark:bg-forest-1000 mt-8 overflow-hidden"
              }
            >
              <div className="flex w-full h-full text-[12px]">
                {Object.keys(categories).map((category, i) =>
                  categories[category] !== "Categories" ? (
                    <div
                      key={category}
                      className={`relative flex w-full h-full justify-center items-center ${
                        selectedCategory === category
                          ? "borden-hidden rounded-[0px]"
                          : "h-full"
                      }
                    ${isCategoryHovered[category] ? "bg-white/5" : ""}`}
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
                      <div
                        key={category}
                        className={`w-full h-full flex flex-col text-center items-center first-letter justify-center hover:cursor-pointer ${
                          selectedCategory === category
                            ? ""
                            : "hover:bg-white/5"
                        }`}
                        onClick={() => {
                          if (selectedCategory === category) {
                            setOpenSub(!openSub);
                          }

                          setSelectedCategory(category);
                          setSelectedChain(null);
                        }}
                      >
                        <div
                          className={` ${
                            selectedCategory === category
                              ? "text-sm font-bold"
                              : "text-xs font-medium"
                          }`}
                        >
                          {categories[category]}
                        </div>

                        <button
                          key={i}
                          className="relative top-[8px] h-[24px] w-full"
                          onClick={() => {
                            setOpenSub(!openSub);
                          }}
                        >
                          <Icon
                            icon="icon-park-outline:down"
                            className="w-full h-full"
                          />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Different response for "Chains" category
                    <div
                      key={category}
                      className={
                        "relative flex flex-col w-full h-full justify-center pl-[16px]"
                      }
                    >
                      <div className="text-sm font-bold pb-[10px]">
                        {categories[category]}
                      </div>
                      <div className="text-xs font-medium">Subcategories</div>
                    </div>
                  ),
                )}
              </div>
            </div>
          ) : (
            <div
              className={
                "relative min-w-[820px] md:min-w-[850px] w-[97.5%] h-[230px] m-auto border-x-[1px] border-y-[1px] rounded-[15px] text-forest-50 dark:text-forest-50 border-forest-400 dark:border-forest-800 bg-forest-900 dark:bg-forest-1000 mt-8 overflow-hidden"
              }
            >
              <div className="flex w-full h-full text-[12px]">
                {Object.keys(categories).map((category, i) =>
                  categories[category] !== "Categories" ? (
                    <div
                      key={category}
                      className={`relative flex w-full h-full ${
                        selectedCategory === category
                          ? "borden-hidden rounded-[0px]"
                          : "h-full"
                      }
                ${isCategoryHovered[category] ? "bg-white/5" : ""}
                `}
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
                      <div
                        key={category}
                        className={`h-full flex flex-col items-center first-letter justify-between hover:cursor-pointer  ${
                          selectedCategory === category
                            ? "w-[220px]"
                            : "hover:bg-white/5 w-full"
                        }`}
                        onClick={() => {
                          if (selectedCategory === category) {
                            setOpenSub(!openSub);
                            return;
                          }

                          setSelectedCategory(category);
                          setSelectedChain(null);
                        }}
                      >
                        <div
                          className={`pt-2 ${
                            selectedCategory === category
                              ? "text-sm font-bold"
                              : "text-xs font-medium"
                          }`}
                        >
                          {categories[category]}
                        </div>

                        <div
                          className="flex flex-col gap-x-1 overflow-x-hidden overflow-y-auto scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 
                                    pl-1 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller"
                          style={
                            categories[category] === "Token Transfer"
                              ? { paddingRight: "20px" }
                              : { paddingRight: "4px" }
                          } // Add right padding for the scrollbar width
                        >
                          {selectedCategory === category ? (
                            <div key={data[category].subcategories}>
                              <div
                                key={categories[category]}
                                className={`flex border-forest-500 justify-between rounded-[15px] border-[1.5px] p-[5px] pl-[12px] my-1 items-center mx-auto w-[190px] hover:bg-white/5 z-10    ${
                                  checkAllSelected(category)
                                    ? "opacity-100"
                                    : "opacity-30"
                                }`}
                                onClick={(e) => {
                                  handleSelectAllSubcategories(category);
                                  e.stopPropagation();
                                }}
                              >
                                <div className="">Select All Subcategories</div>
                                <div className="rounded-full bg-forest-50 dark:bg-forest-900 mr-[1px]">
                                  <Icon
                                    icon="feather:check-circle"
                                    className={`w-[14px] h-[14px] ${
                                      checkAllSelected(category)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                </div>
                              </div>

                              {data[category].subcategories.list.map(
                                (subcategory) => (
                                  <RenderSubcategory
                                    key={subcategory}
                                    subcategory={subcategory}
                                    category={category}
                                    selection={true}
                                  />
                                ),
                              )}

                              {data[category].subcategories.list.map(
                                (subcategory) => (
                                  <RenderSubcategory
                                    key={subcategory}
                                    subcategory={subcategory}
                                    category={category}
                                    selection={false}
                                  />
                                ),
                              )}
                            </div>
                          ) : null}
                        </div>

                        <button
                          className="relative bottom-[4px] h-[24px] w-full"
                          onClick={() => {
                            setOpenSub(!openSub);
                          }}
                        >
                          <Icon
                            icon="icon-park-outline:up"
                            className="w-full h-full"
                          />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Different response for "Chains" category
                    <div
                      key={category}
                      className={
                        "relative flex flex-col w-full h-full justify-start pl-[16px] pt-2"
                      }
                    >
                      <div className="text-sm font-bold pb-[10px]">
                        {categories[category]}
                      </div>
                      <div className="text-xs font-medium">Subcategories</div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </Container>
      <Container>
        <div className="flex w-[95%] m-auto mt-[30px]">
          <div className="w-1/2 ">
            <div className="flex flex-wrap items-center w-[87%] gap-y-2">
              <div className="font-bold text-sm pr-2 pl-2">
                {formatSubcategories(selectedCategory)}:{" "}
              </div>

              {selectedSubcategories[selectedCategory].map((subcategory) => (
                <div
                  key={subcategory}
                  className="bg-forest-50 border-forest-900 border-[1px] dark:bg-[#151A19] rounded-full text-xs px-[8px] py-[5px] mx-[5px]"
                >
                  {formatSubcategories(subcategory)}
                </div>
              ))}
            </div>
            <div></div>
            {/*Chains Here */}
          </div>
          <div className="w-1/2">
            <Chart
              types={
                selectedCategory === null
                  ? data["native_transfers"].daily.types
                  : data[selectedCategory].daily.types
              }
              timespan={selectedTimespan}
              series={chartSeries}
              yScale="percentage"
              chartHeight="400px"
              chartWidth="100%"
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row w-full justify-normal md:justify-end items-center text-sm md:text-base rounded-2xl md:rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 px-0.5 md:px-1 mt-8 gap-x-1 text-md py-[4px]">
          {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
          {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
          {/* toggle ETH */}

          <button
            className={`rounded-full text-sm md:text-base py-1 lg:px-4 xl:px-6 font-medium  ${
              selectedValue === "absolute"
                ? "bg-forest-500 dark:bg-forest-1000"
                : "hover:bg-forest-500/10"
            }`}
            onClick={() => {
              setSelectedValue("absolute");
            }}
          >
            Absolute
          </button>
          <button
            className={`rounded-full text-sm md:text-base py-1 lg:px-4 xl:px-6 font-medium  ${
              selectedValue === "absolute_log"
                ? "bg-forest-500 dark:bg-forest-1000"
                : "hover:bg-forest-500/10"
            }`}
            onClick={() => {
              setSelectedValue("absolute_log");
            }}
          >
            Absolute Log
          </button>
          <button
            className={`rounded-full text-sm md:text-base py-1 lg:px-4 xl:px-6 font-medium ${
              selectedValue === "chain_share"
                ? "bg-forest-500 dark:bg-forest-1000"
                : "hover:bg-forest-500/10"
            }`}
            onClick={() => {
              setSelectedValue("chain_share");
            }}
          >
            Share of Chain Usage
          </button>
          <Tooltip placement="left" allowInteract>
            <TooltipTrigger>
              <div className="p-1 z-10">
                <Icon icon="feather:info" className="w-6 h-6" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
              <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-[420px] h-[80px] flex items-center">
                <div className="flex flex-col space-y-1">
                  <div className="font-bold text-sm leading-snug">
                    Data Sources:
                  </div>
                  <div className="flex space-x-1 flex-wrap font-medium text-xs leading-snug"></div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </Container>
    </div>
  );
}
