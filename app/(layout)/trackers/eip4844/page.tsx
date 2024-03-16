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

export default function Eiptracker() {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [selectedTimescale, setSelectedTimescale] = useState("hourly");
  const chartComponent = useRef<Highcharts.Chart | null>(null);
  const { theme } = useTheme();

  const timescales = useMemo(() => {
    return {
      ten_min: {
        label: "10 Minutes",
      },
      hourly: {
        label: "Hourly",
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

  const sortedMedianCosts = useMemo(() => {
    if (!feeData) return [];
    const sortedChains = Object.keys(feeData.chain_data).sort((a, b) => {
      const aTxCost =
        feeData.chain_data[a][selectedTimescale].txcosts_median.data[0][
          showUsd ? 2 : 1
        ];

      const bTxCost =
        feeData.chain_data[b][selectedTimescale].txcosts_median.data[0][
          showUsd ? 2 : 1
        ];

      return aTxCost - bTxCost;
    });

    const sortedMedianCosts = sortedChains.reduce((acc, chain) => {
      acc[chain] = feeData.chain_data[chain][selectedTimescale].txcosts_median;
      return acc;
    }, {});

    return sortedMedianCosts;
  }, [feeData]);

  const chartSeries = useMemo(() => {
    return Object.keys(avgTxCosts).map((chain) => ({
      id: chain,
      name: chain,
      unixKey: "unix",
      dataKey: showUsd ? "value_usd" : "value_eth",
      data: avgTxCosts[chain].data,
    }));
  }, [avgTxCosts, showUsd, selectedTimescale]);

  function getDateString(unixPoint) {
    const date = new Date(unixPoint);
    return date.toLocaleDateString(undefined, {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  }

  return (
    <>
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
                      color: AllChainsByKeys["ethereum"].colors[theme][1],
                    }}
                  />
                </div>
                <Heading
                  className="text-2xl leading-snug text-[36px] break-inside-avoid"
                  as="h1"
                >
                  {"EIP 4844 Launch"}
                </Heading>
              </div>
              <div className="flex items-center mb-[15px]">
                <div className="text-[16px]">
                  See how the launch of EIP 4844 effects transaction costs.
                </div>
              </div>
            </div>
          </Container>
          <Container className="flex justify-end mt-[30px] w-[98.5%] mx-auto">
            <div className="flex flex-col rounded-full py-[2px] px-[2px] text-base dark:bg-[#1F2726] h-[40px] items-end justify-center">
              <div className="flex gap-x-[4px]">
                {Object.keys(timescales).map((timescale) => (
                  <div
                    className={`rounded-full grow px-4 py-1.5 lg:py-2] font-medium hover:cursor-pointer ${
                      selectedTimescale === timescale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
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
          </Container>
          <Container className="flex flex-col w-[98.5%] mx-auto mt-[30px] ">
            <FeesChart
              chartWidth={"100%"}
              chartHeight={"267px"}
              series={chartSeries}
              types={
                feeData.chain_data.optimism[selectedTimescale].txcosts_avg.types
              }
            />
          </Container>
          <Container className="mt-[30px] w-[98.5%] mx-auto">
            <div className="pb-3 overflow-x-scroll h-full scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller">
              {/*Bar Titles */}
              <div className="flex text-sm font-bold w-full min-w-[1024px] mx-auto ">
                <div className="w-[4%] flex justify-start "></div>
                <div className="w-[17.5%] flex justify-start  items-center">
                  Chain
                </div>
                <div className="w-[19%] flex justify-end items-center">
                  Median Transaction Costs
                </div>
                <div className="w-[25%] flex justify-end  items-center">
                  Average Transaction Costs
                </div>
                <div className="w-[19%] flex justify-end pr-3 items-center">
                  Native Transfer
                </div>
                <div className="w-[15%] 2xl:pl-2 lg:pl-0 flex justify-center items-center">
                  Last Updated(UTC)
                </div>
              </div>
              <div className="mt-[10px] w-full flex flex-col gap-y-[4px] min-w-[1024px] ">
                {Object.keys(sortedMedianCosts).map((chain) => (
                  <div
                    key={chain}
                    className="border-forest-800 border-[1px] rounded-full h-[42px] flex w-full "
                  >
                    <div className="w-[4%] flex justify-center items-center px-[8px] ">
                      {" "}
                      <Icon
                        icon={`gtp:${AllChainsByKeys[chain].urlKey}-logo-monochrome`}
                        className="h-[24px] w-[24px]"
                        style={{
                          color: AllChainsByKeys[chain].colors[theme][0],
                        }}
                      />
                    </div>

                    <div className="w-[17.5%] px-[4px] flex justify-start items-center ">
                      {AllChainsByKeys[chain].label}
                    </div>
                    <div className="w-[19%] px-[4px] flex justify-end items-center gap-x-[4px] ">
                      {Intl.NumberFormat(undefined, {
                        notation: "compact",
                        maximumFractionDigits: showUsd ? 3 : 5,
                        minimumFractionDigits: 0,
                      }).format(
                        feeData.chain_data[chain][selectedTimescale]
                          .txcosts_median.data[0][showUsd ? 2 : 1],
                      )}
                      {`${showUsd ? "$" : "Ξ"}`}
                    </div>
                    <div className="w-[25%] px-[4px] flex justify-end items-center gap-x-[4px] ">
                      {Intl.NumberFormat(undefined, {
                        notation: "compact",
                        maximumFractionDigits: showUsd ? 3 : 5,
                        minimumFractionDigits: 0,
                      }).format(
                        feeData.chain_data[chain][selectedTimescale].txcosts_avg
                          .data[0][showUsd ? 2 : 1],
                      )}
                      {`${showUsd ? "$" : "Ξ"}`}
                    </div>
                    <div className="w-[19%] px-[4px] flex justify-end items-center gap-x-[4px] pr-3 ">
                      {feeData.chain_data[chain][selectedTimescale][
                        "txcosts_native_median"
                      ].data[0]
                        ? Intl.NumberFormat(undefined, {
                            notation: "compact",
                            maximumFractionDigits: showUsd ? 3 : 5,
                            minimumFractionDigits: 0,
                          }).format(
                            feeData.chain_data[chain][selectedTimescale][
                              "txcosts_native_median"
                            ].data[0][showUsd ? 2 : 1],
                          )
                        : "Not Available"}
                      {`${
                        feeData.chain_data[chain][selectedTimescale][
                          "txcosts_native_median"
                        ].data[0]
                          ? showUsd
                            ? "$"
                            : "Ξ"
                          : ""
                      }`}
                    </div>
                    <div className="w-[15%] px-[4px] flex justify-end items-center gap-x-[4px] py-2 xl:leading-snug">
                      {getDateString(
                        feeData.chain_data[chain][selectedTimescale].txcosts_avg
                          .data[0][0],
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </>
      )}
    </>
  );
}
