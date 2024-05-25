"use client";
import Container from "@/components/layout/Container";
import { Chart } from "@/components/charts/chart";
import FeesChart from "@/components/layout/Fees/chart";
import Icon from "@/components/layout/Icon";
import Image from "next/image";
import useSWR from "swr";
import Heading from "@/components/layout/Heading";
import { useMemo, useState, useEffect, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";
import { AllChainsByKeys } from "@/lib/chains";
import { useTheme } from "next-themes";
import { useMediaQuery } from "usehooks-ts";
import { useTransition, animated } from "@react-spring/web";
import ShowLoading from "@/components/layout/ShowLoading";

export default function Eiptracker() {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [selectedTimescale, setSelectedTimescale] = useState("hourly");
  const [selectedTimespan, setSelectedTimespan] = useState("max");
  const [zoomed, setZoomed] = useState(false);
  const [disableZoom, setDisableZoom] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const chartComponent = useRef<Highcharts.Chart | null>(null);
  const { theme } = useTheme();

  const timescales = useMemo(() => {
    return {
      // ten_min: {
      //   label: "10 Minutes",
      // },
      hourly: {
        label: "Hourly",
      },
    };
  }, []);

  const timespans = useMemo(() => {
    return {
      "1d": {
        label: "1 day",
        value: 1,
        xMin: Date.now() - 1 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "7d": {
        label: "7 days",
        value: 7,
        xMin: Date.now() - 7 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      max: {
        label: "All Time",
        value: 0,
      },
    };
  }, []);

  const [selectedChains, setSelectedChains] = useState<{
    [key: string]: boolean;
  }>(
    Object.entries(AllChainsByKeys).reduce((acc, [key, chain]) => {
      if (AllChainsByKeys[key].chainType === "L2") acc[key] = true;
      return acc;
    }, {}),
  );

  const {
    data: feeData,
    error: feeError,
    isLoading: feeLoading,
    isValidating: feeValidating,
  } = useSWR("https://api.growthepie.xyz/v1/fees.json");

  const avgTxCosts = useMemo(() => {
    if (!feeData) return {}; // Return an empty object if feeData is falsy

    // Get an array of chains and sort them based on txcosts_avg data
    const sortedChains = Object.keys(feeData.chain_data).sort((a, b) => {
      const aTxCost =
        feeData.chain_data[a][selectedTimescale].txcosts_avg.data[0][
        showUsd ? 3 : 2
        ];
      const bTxCost =
        feeData.chain_data[b][selectedTimescale].txcosts_avg.data[0][
        showUsd ? 3 : 2
        ];
      return aTxCost - bTxCost;
    });

    // Build the sorted object
    const sortedAvgTxCosts = sortedChains.reduce((acc, chain) => {
      acc[chain] = feeData.chain_data[chain][selectedTimescale].txcosts_avg;
      return acc;
    }, {});

    return sortedAvgTxCosts;
  }, [feeData, selectedTimescale, showUsd]);

  const medianCosts = useMemo(() => {
    if (!feeData) return {}; // Return an empty object if feeData is falsy

    // Get an array of chains and sort them based on txcosts_avg data
    const sortedChains = Object.keys(feeData.chain_data).sort((a, b) => {
      const aTxCost =
        feeData.chain_data[a][selectedTimescale].txcosts_median.data[0][
        showUsd ? 3 : 2
        ];
      const bTxCost =
        feeData.chain_data[b][selectedTimescale].txcosts_median.data[0][
        showUsd ? 3 : 2
        ];
      return aTxCost - bTxCost;
    });

    // Build the sorted object
    const sortedMedianTxCosts = sortedChains.reduce((acc, chain) => {
      acc[chain] = feeData.chain_data[chain][selectedTimescale].txcosts_median;
      return acc;
    }, {});

    return sortedMedianTxCosts;
  }, [feeData, selectedTimescale, showUsd]);

  const sortedMedianCosts = useMemo(() => {
    if (!feeData) return [];

    const sortedChains = Object.keys(feeData.chain_data).sort((a, b) => {
      const isSelectedA = selectedChains[a];
      const isSelectedB = selectedChains[b];

      // If both chains are selected or unselected, sort by median cost
      if (isSelectedA === isSelectedB) {
        const aTxCost =
          feeData.chain_data[a]?.["ten_min"]?.txcosts_median?.data?.[0]?.[
          showUsd ? 2 : 1
          ];
        const bTxCost =
          feeData.chain_data[b]?.["ten_min"]?.txcosts_median?.data?.[0]?.[
          showUsd ? 2 : 1
          ];

        // Handle cases where median costs are not available
        if (typeof aTxCost !== "number" || typeof bTxCost !== "number") {
          return 0; // Keep the order unchanged if median costs are not available
        }

        return aTxCost - bTxCost;
      }

      // Prioritize selected chains
      return isSelectedA ? -1 : 1;
    });

    // Construct sorted median costs object
    const sortedMedianCosts = {};
    sortedChains.forEach((chain) => {
      sortedMedianCosts[chain] =
        feeData.chain_data[chain]?.["ten_min"]?.txcosts_median;
    });

    return sortedMedianCosts;
  }, [feeData, selectedChains, showUsd]);

  const chartSeries = useMemo(() => {
    return Object.keys(medianCosts)
      .filter((chain) => selectedChains[chain]) // Filter out only selected chains
      .map((chain) => ({
        id: chain,
        name: chain,
        unixKey: "unix",
        dataKey: showUsd ? "value_usd" : "value_eth",
        data: medianCosts[chain].data,
      }));
  }, [
    medianCosts,
    selectedChains,
    showUsd,
    selectedTimescale,
    selectedTimespan,
  ]);

  function getDateString(unixPoint) {
    const date = new Date(unixPoint);
    return date.toLocaleDateString("en-GB", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  }

  let height = 0;
  const transitions = useTransition(
    Object.entries(sortedMedianCosts).map(([chain, data], index) => {
      // Check if `data` is an object
      if (typeof data !== "object" || data === null) {
        // Handle the case where `data` is not an object (e.g., if it's null)
        // You can return a default object or handle the error appropriately
        return {
          y: index * 46,
          height: 42,
          chain: { key: chain }, // Assuming `chain` is used as a key
        };
      }

      // Spread `data` only if it's an object
      return {
        ...data,
        y: index * 46,
        height: 42,
        chain: { key: chain }, // Assuming `chain` is used as a key
      };
    }),
    {
      key: (d) => d.chain.key,
      from: { opacity: 0, height: 0 },
      leave: { opacity: 0, height: 0 },
      enter: ({ y, height }) => ({ opacity: 1, y, height }),
      update: ({ y, height }) => ({ opacity: 1, y, height }), // Ensure height change is animated
      config: { mass: 5, tension: 500, friction: 100 },
      trail: 25,
    },
  );

  return (
    <>
      <ShowLoading
        dataLoading={[feeLoading]}
        dataValidating={[feeValidating]}
      />
      {feeData && avgTxCosts && (
        <>
          <Container className="flex w-full mt-[65px] md:mt-[45px]">
            <div className="flex flex-col px-[20px] gap-y-[5px]">
              <div className="flex gap-x-[8px] items-center">
                {/* <Image
                    src="/GTP-Link.svg"
                    alt="GTP Chain"
                    className="object-contain w-[32px] h-[32px] self-center mr-[8px]"
                    height={36}
                    width={36}
                  /> */}
                <div className="w-9 h-9">
                  <Icon
                    icon={`gtp:${AllChainsByKeys["ethereum"].urlKey}-logo-monochrome`}
                    className="w-9 h-9"
                    style={{
                      color: AllChainsByKeys["ethereum"].colors[theme ?? "dark"][1],
                    }}
                  />
                </div>
                <Heading
                  className="text-2xl leading-snug text-[36px] break-inside-avoid"
                  as="h1"
                >
                  {"EIP-4844 Launch"}
                </Heading>
              </div>
              <div className="flex items-center mb-[15px]">
                <div className="text-[16px]">
                  See how the launch of EIP 4844 effects median transaction
                  costs.
                </div>
              </div>
            </div>
          </Container>
          <Container className="flex justify-end mt-[30px] w-[99%] mx-auto">
            <div
              className={`flex items-center justify-between dark:bg-[#1F2726] bg-forest-50  ${isMobile
                ? "flex-col w-[90%] xs:w-[80%] gap-y-[5px] justify-between items-center h-full mx-auto rounded-2xl "
                : "flex-row w-full mx-none h-[60px]  rounded-full py-[2px]"
                }`}
            >
              <div className="flex flex-col rounded-full py-[2px] px-[2px]  dark:bg-[#1F2726]  items-start justify-center w-full">
                <div
                  className={`flex gap-x-[4px]  ${isMobile
                    ? "w-full justify-between text-sm"
                    : "w-auto justify-normal text-base"
                    }`}
                >
                  {Object.keys(timescales).map((timescale) => (
                    <div
                      className={`rounded-full grow px-4 font-medium text-center flex items-center justify-center  hover:cursor-pointer ${selectedTimescale === timescale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                        }
                      ${isMobile
                          ? "grow-0 px-2 py-2 w-[28%] flex items-center justify-center"
                          : "grow py-4 w-[113px]"
                        }`}
                      key={timescale}
                      onClick={() => {
                        setSelectedTimescale(timescale);
                      }}
                    >
                      {timescales[timescale].label}
                    </div>
                  ))}
                </div>
              </div>

              {/* <hr className="border-dotted border-top-[1px] h-[2px] border-forest-400" /> */}
              <div className="flex flex-col rounded-full py-[2px] px-[2px] justify-center w-full items-end ">
                <div
                  className={`flex gap-x-[4px]  ${isMobile
                    ? "w-full justify-between text-sm"
                    : "w-auto justify-normal text-base"
                    }`}
                >
                  {zoomed ? (
                    <button
                      className={`rounded-full flex items-center space-x-3 px-[15px] w-full md:w-auto text-sm md:text-base font-medium border-[0.5px] border-forest-400 leading-snug ${isMobile
                        ? ""
                        : "lg:px-4 lg:py-[11px] xl:px-6 xl:py-[15px] "
                        }`}
                      onClick={() => {
                        setZoomed(false);
                        setDisableZoom(true);
                      }}
                    >
                      <Icon
                        icon="feather:zoom-out"
                        className="w-4 h-4 md:w-6 md:h-6"
                      />
                      <span className="hidden md:block">Reset Zoom</span>
                      <span className="block md:hidden">Reset</span>
                    </button>
                  ) : (
                    Object.keys(timespans).map((timespan) => (
                      <div
                        className={`rounded-full text-center font-medium hover:cursor-pointer ${selectedTimespan === timespan
                          ? "bg-forest-500 dark:bg-forest-1000 visible"
                          : "hover:bg-forest-500/10 invisible"
                          }

                      ${isMobile
                            ? "grow-0 px-2 py-4 w-[30%] flex items-center justify-center"
                            : "grow px-1 py-4 max-w-[113px] w-[113px]"
                          }
 
                      `}
                        key={timespan}
                        onClick={() => {
                          setSelectedTimespan(timespan);
                        }}
                      >
                        {timespans[timespan].label}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Container>
          <Container className="flex flex-col w-[98.5%] mx-auto mt-[30px] ">
            <FeesChart
              chartWidth={"100%"}
              chartHeight={"267px"}
              yScale={"linear"}
              stack={false}
              series={chartSeries}
              chartType={"line"}
              types={
                feeData.chain_data.optimism[selectedTimescale].txcosts_avg.types
              }
              timespan={selectedTimespan}
              setZoomed={setZoomed}
              disableZoom={disableZoom}
              setDisableZoom={setDisableZoom}
            />
          </Container>
          <Container className="mt-[30px] w-[99%] mx-auto ">
            <div className="pb-6 mx-auto overflow-x-scroll h-full scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller w-[99%] ">
              {/*Bar Titles */}
              <div className="w-full mx-auto">
                <div className="flex xl:text-sm text-[13px] font-bold min-w-[674px]  w-[99%]">
                  <div className="w-[4.5%] flex justify-start "></div>
                  <div className="w-[12.5%] flex justify-start  items-center">
                    Chain
                  </div>
                  <div className="w-[18%] flex justify-end items-center ">
                    <div className="xl:w-[80%] w-full text-end flex flex-col">
                      <div>Median </div>
                      <div>Transaction Costs</div>
                    </div>
                  </div>
                  <div className="w-[19%] flex justify-end items-center ">
                    <div className="xl:w-[80%] w-full text-end flex flex-col">
                      <div>Average </div>
                      <div>Transaction Costs</div>
                    </div>
                  </div>
                  <div className="w-[18%] flex justify-end pr-3 items-center">
                    Native Transfer
                  </div>
                  <div className="w-[24%] 2xl:pl-2 lg:pl-0 flex justify-center items-center">
                    Last Updated(UTC)
                  </div>
                  <div className="w-[3%]"></div>
                </div>
              </div>
              <div className="mt-[10px] w-full flex flex-col gap-y-[4px] min-w-[674px] relative min-h-[400px]">
                {transitions((style, item, index) => {
                  return (
                    <animated.div
                      key={item.chain.key}
                      className={`absolute w-full xl:text-base text-sm`}
                      style={{ ...style }}
                    >
                      <div
                        className={`border-black/[16%] dark:border-[#5A6462] border-[1px] rounded-full h-[42px] flex hover:cursor-pointer hover:bg-forest-200 hover:bg-opacity-25 w-[98%]
                        ${selectedChains[item.chain.key]
                            ? "opacity-100"
                            : "opacity-25"
                          }`}
                        onClick={() => {
                          if (
                            !(chartSeries.length <= 1) ||
                            !selectedChains[item.chain.key]
                          ) {
                            setSelectedChains((prevState) => {
                              return {
                                ...prevState,
                                [item.chain.key]: !prevState[item.chain.key],
                              };
                            });
                          }
                        }}
                      >
                        <div className="w-[4.5%] flex justify-center items-center pl-[4px] ">
                          {" "}
                          <Icon
                            icon={`gtp:${AllChainsByKeys[item.chain.key].urlKey
                              }-logo-monochrome`}
                            className="h-[24px] w-[24px]"
                            style={{
                              color:
                                AllChainsByKeys[item.chain.key].colors[
                                theme ?? "dark"
                                ][0],
                            }}
                          />
                        </div>

                        <div className="w-[12.5%] px-[4px] flex justify-start items-center">
                          {AllChainsByKeys[item.chain.key].label}
                        </div>
                        <div className="w-[18.25%] px-[4px] flex justify-end items-center gap-x-[4px]">
                          {Intl.NumberFormat("en-GB", {
                            notation: "compact",
                            maximumFractionDigits: showUsd
                              ? feeData.chain_data[item.chain.key][
                                selectedTimescale
                              ].txcosts_median.data[0][showUsd ? 2 : 1] < 0.01
                                ? 4
                                : 3
                              : 5,
                            minimumFractionDigits: 0,
                          }).format(
                            feeData.chain_data[item.chain.key][
                              selectedTimescale
                            ].txcosts_median.data[0][showUsd ? 2 : 1],
                          )}
                          {`${showUsd ? "$" : "Ξ"}`}
                        </div>
                        <div className="w-[19%] px-[4px] flex justify-end items-center gap-x-[4px] ">
                          {Intl.NumberFormat("en-GB", {
                            notation: "compact",
                            maximumFractionDigits: showUsd
                              ? feeData.chain_data[item.chain.key][
                                selectedTimescale
                              ].txcosts_avg.data[0][showUsd ? 2 : 1] < 0.01
                                ? 4
                                : 3
                              : 5,
                            minimumFractionDigits: 0,
                          }).format(
                            feeData.chain_data[item.chain.key][
                              selectedTimescale
                            ].txcosts_avg.data[0][showUsd ? 2 : 1],
                          )}
                          {`${showUsd ? "$" : "Ξ"}`}
                        </div>
                        <div className="w-[18%] px-[4px] flex justify-end items-center gap-x-[4px] pr-3 ">
                          {feeData.chain_data[item.chain.key][
                            selectedTimescale
                          ]["txcosts_native_median"].data[0]
                            ? Intl.NumberFormat("en-GB", {
                              notation: "compact",
                              maximumFractionDigits: showUsd
                                ? feeData.chain_data[item.chain.key][
                                  selectedTimescale
                                ]["txcosts_native_median"].data[0][
                                  showUsd ? 2 : 1
                                ] < 0.01
                                  ? 4
                                  : 3
                                : 5,
                              minimumFractionDigits: 0,
                            }).format(
                              feeData.chain_data[item.chain.key][
                                selectedTimescale
                              ]["txcosts_native_median"].data[0][
                              showUsd ? 2 : 1
                              ],
                            )
                            : "Not Available"}
                          {`${feeData.chain_data[item.chain.key][
                            selectedTimescale
                          ]["txcosts_native_median"].data[0]
                            ? showUsd
                              ? "$"
                              : "Ξ"
                            : ""
                            }`}
                        </div>
                        <div className="w-[24%] px-[4px] flex justify-center items-center gap-x-[4px] py-2 xl:leading-snug ">
                          {getDateString(
                            feeData.chain_data[item.chain.key][
                              selectedTimescale
                            ].txcosts_avg.data[0][0],
                          )}
                        </div>
                      </div>
                      <div className="w-[4%] flex items-center justify-center">
                        <div
                          className={`absolute left-[96%] xl:left-[97%] bottom-2 right-0 flex items-center z-20 justify-center w-[24px] h-[24px] hover:cursor-pointer bg-forest-50  dark:bg-forest-900  rounded-full transition-all ${selectedChains[item.chain.key]
                            ? ""
                            : "hover:bg-forest-800"
                            }`}
                          onClick={() => {
                            if (
                              !(chartSeries.length <= 1) ||
                              !selectedChains[item.chain.key]
                            ) {
                              setSelectedChains((prevState) => {
                                return {
                                  ...prevState,
                                  [item.chain.key]: !prevState[item.chain.key],
                                };
                              });
                            }
                          }}
                        >
                          <Icon
                            icon="feather:check-circle"
                            className={`w-full h-full transition-all rounded-full ${selectedChains[item.chain.key]
                              ? "opacity-100 bg-white dark:bg-forest-1000 dark:hover:forest-800"
                              : "opacity-0 bg-forest-50 dark:bg-[#1F2726] hover:bg-forest-50"
                              }`}
                            style={{
                              color: selectedChains[item.chain.key]
                                ? undefined
                                : "#5A6462",
                            }}
                          />
                        </div>
                      </div>
                    </animated.div>
                  );
                })}
              </div>
            </div>
          </Container>
        </>
      )}
    </>
  );
}
