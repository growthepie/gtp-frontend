"use client";
import Container from "@/components/layout/Container";
import Icon from "@/components/layout/Icon";
import { AllChainsByKeys } from "@/lib/chains";
import { useTheme } from "next-themes";
import { useMemo, useState, useEffect, useLayoutEffect, useRef } from "react";
import useSWR from "swr";
import { useLocalStorage } from "usehooks-ts";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import Header from "./Header";

interface HoveredItems {
  hoveredChain: string | null;
  hoveredDA: string | null;
}

interface DAvailability {
  icon: string;
  label: string;
}

export default function FeesPage() {
  const [selectedTimescale, setSelectedTimescale] = useState("thirty_min");
  const [selectedSort, setSelectedSort] = useState("chain");
  const [hoveredItems, setHoveredItems] = useState<HoveredItems>({
    hoveredChain: null,
    hoveredDA: null,
  });
  const [sortOrder, setSortOrder] = useState(true);
  //True is default descending false ascending
  const { theme } = useTheme();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [selectedChains, setSelectedChains] = useState<{
    [key: string]: boolean;
  }>(
    Object.entries(AllChainsByKeys).reduce((acc, [key, chain]) => {
      if (AllChainsByKeys[key].chainType === "L2") acc[key] = true;
      return acc;
    }, {}),
  );

  // start Bottom Chart state
  const [isChartOpen, setIsChartOpen] = useState(false);


  const timescales = useMemo(() => {
    return {
      thirty_min: {
        label: "Last 30 Minutes",
      },
      hourly: {
        label: "Last Hour",
      },
      six_hours: {
        label: "Last 6 Hours",
      },
      twelve_hours: {
        label: "Last 12 Hours",
      },
    };
  }, []);

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: feeData,
    error: feeError,
    isLoading: feeLoading,
    isValidating: feeValidating,
  } = useSWR("https://api.growthepie.xyz/v1/fees.json");

  const sortedFees = useMemo(() => {
    if (!feeData) return [];

    const sortedChains = Object.keys(feeData.chain_data).sort((a, b) => {
      const isSelectedA = selectedChains[a];
      const isSelectedB = selectedChains[b];

      // If both chains are selected or unselected, sort by median cost
      if (isSelectedA === isSelectedB) {
        const aTxCost =
          feeData.chain_data[a]["ten_min"].txcosts_median.data[0][
          showUsd ? 2 : 1
          ];
        const bTxCost =
          feeData.chain_data[b]["ten_min"].txcosts_median.data[0][
          showUsd ? 2 : 1
          ];
        return aTxCost - bTxCost;
      }

      // Prioritize selected chains
      return isSelectedA ? -1 : 1;
    });

    const sortedMedianCosts = sortedChains.reduce((acc, chain) => {
      acc[chain] = feeData.chain_data[chain]["ten_min"].txcosts_median;
      return acc;
    }, {});

    return sortedMedianCosts;
  }, [feeData, selectedChains, showUsd]);

  const [screenHeight, setScreenHeight] = useState(0);

  useLayoutEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight - 120);
    };

    setScreenHeight(window.innerHeight - 120);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getGradientColor = (percentage) => {
    const colors = [
      { percent: 0, color: "#1DF7EF" },
      { percent: 20, color: "#76EDA0" },
      { percent: 50, color: "#FFDF27" },
      { percent: 70, color: "#FF9B47" },
      { percent: 100, color: "#FE5468" },
    ];

    let lowerBound = colors[0];
    let upperBound = colors[colors.length - 1];

    for (let i = 0; i < colors.length - 1; i++) {
      if (
        percentage >= colors[i].percent &&
        percentage <= colors[i + 1].percent
      ) {
        lowerBound = colors[i];
        upperBound = colors[i + 1];
        break;
      }
    }

    const percentDiff =
      (percentage - lowerBound.percent) /
      (upperBound.percent - lowerBound.percent);

    const r = Math.floor(
      parseInt(lowerBound.color.substring(1, 3), 16) +
      percentDiff *
      (parseInt(upperBound.color.substring(1, 3), 16) -
        parseInt(lowerBound.color.substring(1, 3), 16)),
    );

    const g = Math.floor(
      parseInt(lowerBound.color.substring(3, 5), 16) +
      percentDiff *
      (parseInt(upperBound.color.substring(3, 5), 16) -
        parseInt(lowerBound.color.substring(3, 5), 16)),
    );

    const b = Math.floor(
      parseInt(lowerBound.color.substring(5, 7), 16) +
      percentDiff *
      (parseInt(upperBound.color.substring(5, 7), 16) -
        parseInt(lowerBound.color.substring(5, 7), 16)),
    );

    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  function dataAvailToArray(x: string): DAvailability[] {
    let retObject: DAvailability[] = [];
    if (typeof x === "string") {
      // Ensure x is a string
      if (x.includes("calldata")) {
        retObject.push({
          icon: "calldata",
          label: "Calldata",
        });
      }

      if (x.includes("blobs")) {
        retObject.push({
          icon: "blobs",
          label: "Blobs",
        });
      }
    }
    return retObject;
  }

  return (
    <>
      {feeData && master && (
        <div
        // className={`overflow-y-scroll overflow-x-hidden w-full gap-y-1 `}
        // style={{
        //   maxHeight: screenHeight,
        // }}
        >
          <Header />
          <Container className="w-[820px]">
            <div
              className="flex px-[5px] items-center w-[820px] h-[54px] rounded-full mt-[16px] bg-[#344240]  shadow-[0px_0px_50px_0px_#000000]"
            >
              <a
                className="flex items-center w-[162px] h-[44px] bg-[#1F2726] gap-x-[10px] rounded-full px-2 gap"
                href="https://www.growthepie.xyz/"
                target="_blank"
              >
                <Icon icon="gtp:house" className="h-6 w-6" />
                <div className="font-bold">Main platform</div>
              </a>
            </div>
          </Container>
          {/* <div className="w-full h-[70px]" /> */}
          <Container className="w-full mt-[30px] ">
            <div className="flex w-full justify-between px-[10px] items-center">
              <div className="text-[20px] font-bold">
                Cost of using Ethereum Layer-2s
              </div>
              <div className="w-[165px] h-[25px] flex bg-[#344240] px-0.5 items-center justify-between pr-[2px] rounded-full ">
                <div
                  className="flex items-center justify-center w-[29px] h-[21px] bg-[#1F2726] rounded-full hover:cursor-pointer z-20"
                  onClick={() => {
                    const currentIndex =
                      Object.keys(timescales).indexOf(selectedTimescale);
                    const nextIndex =
                      currentIndex - 1 < 0
                        ? 3
                        : (currentIndex - 1) % Object.keys(timescales).length;

                    setSelectedTimescale(Object.keys(timescales)[nextIndex]);
                  }}
                >
                  <Icon
                    icon="feather:arrow-left"
                    className="font-thin w-[15px] h-[15px]"
                  />
                </div>
                <div className="flex items-center justify-center relative w-[70%] h-full">
                  <div className="w-full ">
                    {Object.keys(timescales).map((timescale, index) => {
                      return (
                        <div
                          key={timescales[timescale].label}
                          className={`absolute w-full duration-200 ease-linear transition-all z-10 ${selectedTimescale !== timescale
                            ? "opacity-0"
                            : "opacity-100"
                            }`}
                          style={{
                            left: `${(index -
                              Object.keys(timescales).indexOf(
                                selectedTimescale,
                              )) *
                              100
                              }%`,
                          }}
                        >
                          <div className="absolute flex items-center justify-center gap-x-1 w-full text-center font-semibold text-[10px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <Icon
                              icon="feather:clock"
                              className="font-thin w-[12px] h-[12px]"
                            />
                            {timescales[timescale].label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* <div class="hidden duration-200 ease-linear">
            <img src="/docs/images/carousel/carousel-5.svg" class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="...">
        </div> */}
                <div
                  className="flex items-center justify-center w-[29px] h-[21px] bg-[#1F2726] rounded-full z-20 hover:cursor-pointer"
                  onClick={() => {
                    const currentIndex =
                      Object.keys(timescales).indexOf(selectedTimescale);
                    const nextIndex =
                      (currentIndex + 1) % Object.keys(timescales).length;

                    setSelectedTimescale(Object.keys(timescales)[nextIndex]);
                  }}
                >
                  <Icon
                    icon="feather:arrow-right"
                    className="font-thin w-[15px] h-[15px]"
                  />
                </div>
              </div>
            </div>
          </Container>
          <Container className={`${isChartOpen ? "pb-[235px]" : "pb-[20px]"}`}>
            <div className="relative">
              <div className="w-full mt-[8px] flex h-[26px] justify-start pl-[52px] mb-1 text-[12px] font-bold ">
                <div
                  className="flex items-center gap-x-0.5 w-[29.25%]  "
                  onClick={() => {
                    if (selectedSort === "chain") {
                      setSortOrder(!sortOrder);
                    } else {
                      setSelectedSort("chain");
                    }
                  }}
                >
                  Chain{" "}
                  <Icon
                    icon={
                      selectedSort === "chain"
                        ? sortOrder
                          ? "formkit:arrowdown"
                          : "formkit:arrowup"
                        : "formkit:arrowdown"
                    }
                    className={` dark:text-white text-black w-[10px] h-[10px] ${selectedSort === "chain" ? "opacity-100" : "opacity-20"
                      }`}
                  />{" "}
                  <div
                    className="bg-[#344240] text-[8px] flex rounded-full font-normal items-center px-[5px] py-[3px] gap-x-[2px]"
                    onClick={() => {
                      if (selectedSort === "availability") {
                        setSortOrder(!sortOrder);
                      } else {
                        setSelectedSort("availability");
                      }
                    }}
                  >
                    Data Availability{" "}
                    <Icon
                      icon={
                        selectedSort === "availability"
                          ? sortOrder
                            ? "formkit:arrowdown"
                            : "formkit:arrowup"
                          : "formkit:arrowdown"
                      }
                      className={` dark:text-white text-black w-[10px] h-[10px] ${selectedSort === "availability"
                        ? "opacity-100"
                        : "opacity-20"
                        }`}
                    />{" "}
                  </div>
                </div>

                <div
                  className="flex items-center justify-end gap-x-0.5 w-[18.5%] "
                  onClick={() => {
                    if (selectedSort === "medianfee") {
                      setSortOrder(!sortOrder);
                    } else {
                      setSelectedSort("medianfee");
                    }
                  }}
                >
                  Median Fee{" "}
                  <Icon
                    icon={
                      selectedSort === "medianfee"
                        ? sortOrder
                          ? "formkit:arrowdown"
                          : "formkit:arrowup"
                        : "formkit:arrowdown"
                    }
                    className={` dark:text-white text-black w-[10px] h-[10px] ${selectedSort === "medianfee"
                      ? "opacity-100"
                      : "opacity-20"
                      }`}
                  />{" "}
                </div>
                <div
                  className=" flex items-center justify-end gap-x-0.5 w-[16%]"
                  onClick={() => {
                    if (selectedSort === "transfer") {
                      setSortOrder(!sortOrder);
                    } else {
                      setSelectedSort("transfer");
                    }
                  }}
                >
                  Transfer ETH{" "}
                  <Icon
                    icon={
                      selectedSort === "transfer"
                        ? sortOrder
                          ? "formkit:arrowdown"
                          : "formkit:arrowup"
                        : "formkit:arrowdown"
                    }
                    className={` dark:text-white text-black w-[10px] h-[10px] ${selectedSort === "transfer" ? "opacity-100" : "opacity-20"
                      }`}
                  />{" "}
                </div>
                <div
                  className="flex items-center justify-end gap-x-0.5 w-[13.5%] mr-[9.5px]"
                  onClick={() => {
                    if (selectedSort === "swaptoken") {
                      setSortOrder(!sortOrder);
                    } else {
                      setSelectedSort("swaptoken");
                    }
                  }}
                >
                  <div>Swap Token </div>
                  <Icon
                    icon={
                      selectedSort === "swaptoken"
                        ? sortOrder
                          ? "formkit:arrowdown"
                          : "formkit:arrowup"
                        : "formkit:arrowdown"
                    }
                    className={` dark:text-white text-black w-[10px] h-[10px] ${selectedSort === "swaptoken"
                      ? "opacity-100"
                      : "opacity-20"
                      }`}
                  />{" "}
                </div>
                <div className="relative top-1 flex items-end space-x-[1px]">
                  {Array.from({ length: 23 }, (_, index) => (
                    <div
                      key={index}
                      className="w-[5px] bg-[#344240] rounded-t-full h-[8px]"
                    ></div>
                  ))}
                  <div className="w-[8px] border-[#344240] border-t-[1px] border-x-[1px] rounded-t-full h-[23px]"></div>
                </div>
              </div>
              <div className={`gap-y-1`}>
                {[...Object.entries(sortedFees), ...Object.entries(sortedFees)].map((chain, index) => {
                  return (
                    <div
                      key={index}
                      className="border-forest-700 border-[1px] mb-1 w-[820px] rounded-full border-black/[16%] dark:border-[#5A6462] min-h-[34px] pl-[20px] flex items-center relative text-[15px]"
                    >
                      <div className="flex items-center h-full w-[4%] ">
                        <Icon
                          icon={`gtp:${AllChainsByKeys[chain[0]].urlKey
                            }-logo-monochrome`}
                          className="h-[24px] w-[24px]"
                          style={{
                            color: AllChainsByKeys[chain[0]].colors[theme][0],
                          }}
                        />
                      </div>
                      <div className="flex justify-start items-center h-full w-[33%] ">
                        <div className="mr-[5px]">
                          {AllChainsByKeys[chain[0]].label}
                        </div>
                        <div
                          className={`bg-[#344240] flex rounded-full  items-center px-[5px] py-[3px] gap-x-[2px] transition-width overflow-hidden duration-300`}
                          onMouseEnter={() => {
                            setHoveredItems({
                              hoveredChain: chain[0],
                              hoveredDA: hoveredItems.hoveredDA,
                            });
                          }}
                          onMouseLeave={() => {
                            setHoveredItems({
                              hoveredChain: null,
                              hoveredDA: hoveredItems.hoveredDA,
                            });
                          }}
                        >
                          {dataAvailToArray(
                            master.chains[chain[0]].da_layer,
                          ).map((item, index, array) => [
                            <div
                              key={index}
                              className={`flex relative items-center gap-x-0.5`}
                              onMouseEnter={() => {
                                setHoveredItems({
                                  hoveredChain: hoveredItems.hoveredChain,
                                  hoveredDA: item.label,
                                });
                              }}
                              onMouseLeave={() => {
                                setHoveredItems({
                                  hoveredChain: hoveredItems.hoveredChain,
                                  hoveredDA: null,
                                });
                              }}
                            >
                              <Icon
                                icon={`gtp:${item.icon}`}
                                className="h-[12px] w-[12px]"
                                style={{
                                  color: "#5A6462",
                                }}
                              />
                              <div
                                className={`text-[8px] text-center font-semibold text-[#5A6462] overflow-hidden `}
                                style={{
                                  maxWidth:
                                    hoveredItems.hoveredDA === item.label &&
                                      hoveredItems.hoveredChain === chain[0]
                                      ? "50px"
                                      : "0px",
                                  transition: "max-width 0.3s ease", // Adjust duration and timing function as needed
                                }}
                              >
                                {item.label}
                              </div>
                            </div>,
                            index !== array.length - 1 && (
                              /* Content to render when index is not the last element */
                              <div
                                key={index}
                                className="w-[12px] h-[12px] flex items-center justify-center"
                                style={{
                                  color: "#5A6462",
                                }}
                              >
                                +
                              </div>
                            ),
                          ])}
                        </div>
                      </div>

                      <div className="h-full w-[15%] flex justify-center items-center">
                        <div
                          className="px-[8px] border-[1.5px] rounded-full flex items-center"
                          style={{
                            borderColor: getGradientColor(
                              Math.floor(
                                (sortedFees[chain[0]].data[0][showUsd ? 2 : 1] /
                                  sortedFees[
                                    Object.keys(sortedFees)[
                                    Object.keys(sortedFees).length - 1
                                    ]
                                  ].data[0][showUsd ? 2 : 1]) *
                                100,
                              ),
                            ),
                          }}
                        >
                          {Intl.NumberFormat(undefined, {
                            notation: "compact",
                            maximumFractionDigits: showUsd
                              ? feeData.chain_data[chain[0]]["hourly"]
                                .txcosts_median.data[0][showUsd ? 2 : 1] <
                                0.01
                                ? 4
                                : 3
                              : 5,
                            minimumFractionDigits: 0,
                          }).format(
                            feeData.chain_data[chain[0]]["hourly"]
                              .txcosts_median.data[0][showUsd ? 2 : 1],
                          )}
                          {`${showUsd ? "$" : "Ξ"}`}
                        </div>
                      </div>
                      <div className="h-full w-[12.5%] flex justify-end items-center">
                        {feeData.chain_data[chain[0]]["hourly"][
                          "txcosts_native_median"
                        ].data[0]
                          ? Intl.NumberFormat(undefined, {
                            notation: "compact",
                            maximumFractionDigits: showUsd
                              ? feeData.chain_data[chain[0]]["hourly"][
                                "txcosts_native_median"
                              ].data[0][showUsd ? 2 : 1] < 0.01
                                ? 4
                                : 3
                              : 5,
                            minimumFractionDigits: 0,
                          }).format(
                            feeData.chain_data[chain[0]]["hourly"][
                              "txcosts_native_median"
                            ].data[0][showUsd ? 2 : 1],
                          )
                          : "Not Available"}
                      </div>
                      <div className="h-full w-[13%] flex justify-end items-center mr-[10px]">
                        {"$0.054"}
                      </div>
                      <div className="relative w-[19%] flex items-center justify-end h-full space-x-[1px]">
                        {Array.from({ length: 23 }, (_, index) => (
                          <div
                            key={index}
                            className="w-[5px] h-[5px] rounded-full opacity-50"
                            style={{
                              backgroundColor: getGradientColor(
                                Math.random() * 100,
                              ),
                            }}
                          ></div>
                        ))}
                        <div
                          className="w-[8px]  h-[8px] rounded-full"
                          style={{
                            backgroundColor: getGradientColor(
                              Math.random() * 100,
                            ),
                          }}
                        ></div>
                      </div>
                      <div className="absolute left-[99%]">
                        <Icon
                          icon="feather:check-circle"
                          className={`w-[22px] h-[22px] transition-all rounded-full ${selectedChains[chain[0]]
                            ? "opacity-100 bg-white dark:bg-forest-1000 dark:hover:forest-800"
                            : "opacity-0 bg-forest-50 dark:bg-[#1F2726] hover:bg-forest-50"
                            }`}
                          style={{
                            color: selectedChains[chain[0]]
                              ? undefined
                              : "#5A6462",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </Container>
          {/* <Container className="fixed bottom-[20px] left-[15px] right-0 pl-[52px] z-50">
            <div className="w-[835px] mx-auto h-[54px] bg-[#1F2726] rounded-t-[30px] z-50" >
            </div>
          </Container> */}
          <Container className={`fixed bottom-0 flex flex-col gap-y-[70px] transition-transform duration-300 ${isChartOpen ? "translate-y-0" : "translate-y-[215px]"}`}>
            <div className="border-forest-700 w-[835px] border-[1px] rounded-full border-black/[16%] dark:border-forest-50 h-[34px] pl-[20px] flex items-center text-[15px] sticky bottom-0 bg-forest-900 shadow-[0px_0px_50px_0px_#00000033] dark:shadow-[0px_0px_20px_0px_#000000]">
              <div className="flex items-center h-full w-[4%] ">
                <Icon
                  icon={`gtp:ethereum-logo-monochrome`}
                  className="h-[24px] w-[24px]"
                  style={{ color: "#5A6462" }}
                />
              </div>
              <div className="flex justify-start items-center h-full w-[33%] ">
                <div className="mr-[5px]">
                  {AllChainsByKeys['ethereum'].label}
                </div>
                <div
                  className={`bg-[#344240] flex rounded-full  items-center px-[5px] py-[3px] gap-x-[2px] transition-width overflow-hidden duration-300`}
                // onMouseEnter={() => {
                //   setHoveredItems({
                //     hoveredChain: chain[0],
                //     hoveredDA: hoveredItems.hoveredDA,
                //   });
                // }}
                // onMouseLeave={() => {
                //   setHoveredItems({
                //     hoveredChain: null,
                //     hoveredDA: hoveredItems.hoveredDA,
                //   });
                // }}
                >
                  {dataAvailToArray(
                    master.chains["optimism"].da_layer,
                  ).map((item, index, array) => [
                    <div
                      key={index}
                      className={`flex relative items-center gap-x-0.5`}
                      onMouseEnter={() => {
                        setHoveredItems({
                          hoveredChain: hoveredItems.hoveredChain,
                          hoveredDA: item.label,
                        });
                      }}
                      onMouseLeave={() => {
                        setHoveredItems({
                          hoveredChain: hoveredItems.hoveredChain,
                          hoveredDA: null,
                        });
                      }}
                    >
                      <Icon
                        icon={`gtp:${item.icon}`}
                        className="h-[12px] w-[12px]"
                        style={{
                          color: "#5A6462",
                        }}
                      />
                      <div
                        className={`text-[8px] text-center font-semibold text-[#5A6462] overflow-hidden `}
                        style={{
                          maxWidth:
                            hoveredItems.hoveredDA === item.label &&
                              hoveredItems.hoveredChain === "ethereum"
                              ? "50px"
                              : "0px",
                          transition: "max-width 0.3s ease", // Adjust duration and timing function as needed
                        }}
                      >
                        {item.label}
                      </div>
                    </div>,
                    index !== array.length - 1 && (
                      /* Content to render when index is not the last element */
                      <div
                        key={index}
                        className="w-[12px] h-[12px] flex items-center justify-center"
                        style={{
                          color: "#5A6462",
                        }}
                      >
                        +
                      </div>
                    ),
                  ])}
                </div>
              </div>

              <div className="h-full w-[15%] flex justify-center items-center">
                <div
                  className="px-[8px] border-[1.5px] rounded-full flex items-center"
                  style={{
                    borderColor: getGradientColor(
                      Math.floor(
                        (sortedFees["optimism"].data[0][showUsd ? 2 : 1] /
                          sortedFees[
                            Object.keys(sortedFees)[
                            Object.keys(sortedFees).length - 1
                            ]
                          ].data[0][showUsd ? 2 : 1]) *
                        100,
                      ),
                    ),
                  }}
                >
                  {Intl.NumberFormat(undefined, {
                    notation: "compact",
                    maximumFractionDigits: showUsd
                      ? feeData.chain_data["optimism"]["hourly"]
                        .txcosts_median.data[0][showUsd ? 2 : 1] <
                        0.01
                        ? 4
                        : 3
                      : 5,
                    minimumFractionDigits: 0,
                  }).format(
                    feeData.chain_data["optimism"]["hourly"]
                      .txcosts_median.data[0][showUsd ? 2 : 1],
                  )}
                  {`${showUsd ? "$" : "Ξ"}`}
                </div>
              </div>
              <div className="h-full w-[12.5%] flex justify-end items-center">
                {feeData.chain_data["optimism"]["hourly"][
                  "txcosts_native_median"
                ].data[0]
                  ? Intl.NumberFormat(undefined, {
                    notation: "compact",
                    maximumFractionDigits: showUsd
                      ? feeData.chain_data["optimism"]["hourly"][
                        "txcosts_native_median"
                      ].data[0][showUsd ? 2 : 1] < 0.01
                        ? 4
                        : 3
                      : 5,
                    minimumFractionDigits: 0,
                  }).format(
                    feeData.chain_data["optimism"]["hourly"][
                      "txcosts_native_median"
                    ].data[0][showUsd ? 2 : 1],
                  )
                  : "Not Available"}
              </div>
              <div className="h-full w-[13%] flex justify-end items-center mr-[10px]">
                {"$0.054"}
              </div>
              <div className="relative w-[19%] flex items-center justify-end h-full space-x-[1px]">
                {Array.from({ length: 23 }, (_, index) => (
                  <div
                    key={index}
                    className="w-[5px] h-[5px] rounded-full opacity-50"
                    style={{
                      backgroundColor: getGradientColor(
                        Math.random() * 100,
                      ),
                    }}
                  ></div>
                ))}
                <div
                  className="w-[8px]  h-[8px] rounded-full"
                  style={{
                    backgroundColor: getGradientColor(
                      Math.random() * 100,
                    ),
                  }}
                ></div>
              </div>
              {/* <div className="absolute left-[99%]">
                <Icon
                  icon="feather:check-circle"
                  className={`w-[22px] h-[22px] transition-all rounded-full ${selectedChains["optimism"]
                    ? "opacity-100 bg-white dark:bg-forest-1000 dark:hover:forest-800"
                    : "opacity-0 bg-forest-50 dark:bg-[#1F2726] hover:bg-forest-50"
                    }`}
                  style={{
                    color: selectedChains["optimism"]
                      ? undefined
                      : "#5A6462",
                  }}
                />
              </div> */}
            </div>
            <div className="relative w-full h-[296px] bg-[#1F2726] rounded-t-[30px] pt-[15px] pb-[30px]">
              <div className="absolute -top-[12px] left-0 right-0 flex justify-center z-50">
                <div className="flex items-center gap-x-[10px] text-[10px] px-[15px] py-[4px] leading-[150%] rounded-full bg-[#1F2726] shadow-[0px_0px_50px_0px_#00000033] dark:shadow-[0px_0px_50px_0px_#000000] cursor-pointer" onClick={() => setIsChartOpen(!isChartOpen)}>
                  <div className="w-[16px] h-[16px]"><Icon icon="feather:chevron-up" className={`w-[16px] h-[16px] ${isChartOpen ? 'transform rotate-180' : ''}`} /></div>
                  <div className="">{isChartOpen ? "Close Chart" : "Open Chart for “Median fees over time”"}</div>
                </div>
              </div>

              <div className="w-full h-[182px] flex flex-col gap-y-[5px]">
                <div className="w-full flex justify-between px-[15px]">
                  <div className="flex gap-x-1 text-[20px] leading-[120%]">
                    <div className="font-bold">Swap Token</div><div>fees over time</div>
                  </div>
                  <div className="bg-[#344240] rounded-full px-[5px] py-[3px] flex items-center gap-x-[2px] w-[165px] justify-evenly">
                    <div className="flex gap-x-[5px] items-center text-[#CDD8D3]">
                      <Icon
                        icon="feather:clock"
                        className="w-[10px] h-[10px]"
                      />
                      <div className="text-[10px] font-semibold">Last 24 Hours</div>
                    </div>
                  </div>
                </div>
                <div className="px-[5px]">
                  <div className="border border-[#5A6462] rounded-[15px] h-[150px] w-full"></div>
                </div>
              </div>
            </div>
          </Container>

        </div >
      )
      }
    </>
  );
}
