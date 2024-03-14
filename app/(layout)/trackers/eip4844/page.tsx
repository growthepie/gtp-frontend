"use client";
import Container from "@/components/layout/Container";
import { Chart } from "@/components/charts/chart";
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
  const [selectedTimescale, setSelectedTimescale] = useState("ten_min");
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
    return Object.keys(feeData.chain_data).reduce((acc, chain) => {
      acc[chain] =
        selectedTimescale === "ten_min"
          ? feeData.chain_data[chain].ten_min.txcosts_avg
          : feeData.chain_data[chain].hourly.txcosts_avg;
      return acc;
    }, {});
  }, [feeData, selectedTimescale]);

  const chartSeries = useMemo(() => {
    return Object.keys(avgTxCosts).map((chain) => ({
      id: chain,
      name: chain,
      unixKey: "unix",
      dataKey: showUsd ? "value_usd" : "value_eth",
      data: avgTxCosts[chain].data,
    }));
  }, [avgTxCosts, showUsd, selectedTimescale]);

  console.log(feeData);

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
          <Container className="flex flex-col w-[98%] mx-auto mt-[30px]">
            <Chart
              chartType={"line"}
              types={avgTxCosts["optimism"].types}
              timespan={"max"}
              series={chartSeries}
              chartHeight={"259px"}
              chartWidth={"100%"}
              chartRef={chartComponent}
              forceEIP={true}
            />
          </Container>
          <Container className="mt-[30px]">
            {/*Bar Titles */}
            <div className="flex px-[20px] text-sm font-bold w-[97%] mx-auto">
              <div className="w-[2.5%] flex justify-start"></div>
              <div className="w-[22.5%] flex justify-start">Chain</div>
              <div className="w-[25%] flex justify-center">
                Average Transaction Costs
              </div>
              <div className="w-[25%] flex justify-center">
                Median Transaction Costs
              </div>
              <div className="w-[25%] flex justify-center">Native Transfer</div>
            </div>
            <div className="px-[20px] mt-[10px] w-full flex flex-col gap-y-[4px]">
              {Object.keys(avgTxCosts).map((chain) => (
                <div
                  key={chain}
                  className="border-forest-800 border-[1px] rounded-full h-[42px] flex w-fll"
                >
                  <div className="w-[3.5%] flex justify-center items-center px-[8px]">
                    {" "}
                    <Icon
                      icon={`gtp:${AllChainsByKeys[chain].urlKey}-logo-monochrome`}
                      className="h-[24px] w-[24px]"
                      style={{
                        color: AllChainsByKeys[chain].colors[theme][0],
                      }}
                    />
                  </div>

                  <div className="w-[25%] px-[4px] flex justify-start items-center ">
                    {AllChainsByKeys[chain].label}
                  </div>
                  <div className="w-[17%] px-[4px] flex justify-end items-center gap-x-[4px]">
                    {Intl.NumberFormat(undefined, {
                      notation: "compact",
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 0,
                    }).format(
                      feeData.chain_data[chain][selectedTimescale].txcosts_avg
                        .data[0][showUsd ? 2 : 1],
                    )}
                    {`${showUsd ? "$" : "Ξ"}`}
                  </div>
                  <div className="w-[24%] px-[4px] flex justify-end items-center gap-x-[4px]">
                    {Intl.NumberFormat(undefined, {
                      notation: "compact",
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 0,
                    }).format(
                      feeData.chain_data[chain][selectedTimescale]
                        .txcosts_median.data[0][showUsd ? 2 : 1],
                    )}
                    {`${showUsd ? "$" : "Ξ"}`}
                  </div>
                  <div className="w-[21%] px-[4px] flex justify-end items-center gap-x-[4px]">
                    {Intl.NumberFormat(undefined, {
                      notation: "compact",
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 0,
                    }).format(
                      feeData.chain_data[chain][selectedTimescale][
                        "txcosts_native_median"
                      ].data[0]
                        ? feeData.chain_data[chain][selectedTimescale][
                            "txcosts_native_median"
                          ].data[0][showUsd ? 2 : 1]
                        : "",
                    )}
                    {`${showUsd ? "$" : "Ξ"}`}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </>
      )}
    </>
  );
}
