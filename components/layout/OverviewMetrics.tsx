"use client";
import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { Chains } from "@/types/api/ChainOverviewResponse";
import { AllChainsByKeys } from "@/lib/chains";
import { color } from "highcharts";

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
  const [selectedScale, setSelectedScale] = useState("gasfees");
  const [nativeTransfer, setNativeTransfer] = useState(true);

  /*
  utility: number[];
  scaling: number[];
  defi: number[];
  native_transfers: number[];
  gaming: number[];
  token_transfers: number[];
  nft_fi: number[];
  cefi: number[];
  */
  const categories = useMemo<{ [key: string]: string }>(() => {
    return {
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

  const [selectedCategory, setSelectedCategory] = useState("native_transfers");

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

  console.log(data["optimism"].overview.types.indexOf(
    "gas_fees_share",
  ))

  return (
    <>
      <div className={`flex w-full justify-between items-center text-xs rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 z-10
        ${nativeTransfer
            ? "mb-0"
            : "mb-8"
        }`}>
        <div className="hidden md:flex justify-center items-center ml-0.5">
          {/* <Icon icon="gtp:chain" className="w-7 h-7 lg:w-9 lg:h-9" /> */}
          <button
            className={`rounded-full px-[16px] py-[8px] grow text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium 
                ${
                  nativeTransfer
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                } `}
            onClick={() => {
              setNativeTransfer(!nativeTransfer);

            }}
          >
            <div className="flex items-center space-x-1">
              <div>
                <h1>Native Transfer</h1>
              </div>
              <div className="pt-1">
                {nativeTransfer ? (
                  <Icon
                    icon="feather:chevron-down"
                    className="w-[13px] h-[13px] block"
                  />
                ) : (
                  <Icon
                    icon="feather:chevron-left"
                    className="w-[13px] h-[13px] block"
                  />
                )}
              </div>
            </div>
          </button>
        </div>

        <div className="flex w-full md:w-auto justify-between md:justify-center items-stretch md:items-center space-x-[4px] md:space-x-1">
          {Object.keys(timespans).map((timespan) => (
            <button
              key={timespan}
              className={`rounded-full px-[16px] py-[8px] grow text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium ${
                selectedTimespan === timespan
                  ? "bg-forest-500 dark:bg-forest-1000"
                  : "hover:bg-forest-500/10"
              }`}
              onClick={() => {
                setSelectedTimespan(timespan);
                // setXAxis();
              }}
            >
              {timespans[timespan].label}
            </button>
          ))}
        </div>
      </div>
      <div
        className={`relative bottom-1 w-[97.5%] h-[60px] m-auto border-x-[1px] border-b-[1px] rounded-bl-xl rounded-br-xl border-forest-400 dark:border-forest-800 bg-forest-1000 pt-[5px] mb-8 overflow-hidden
        ${nativeTransfer ? "flex" : "hidden"}`}
      >
        <div className="flex w-full h-full text-[12px]">
          {Object.keys(categories).map((category, i) => (
            <div
              className={`relative flex flex-grow h-full justify-center items-center ${
                selectedCategory === category
                  ? "borden-hidden rounded-[5px]"
                  : "h-full" 
              }`}
              key={category}
              style={{
                backgroundColor: 
                selectedCategory === category
                ? "#5A6462"
                : `rgba(0, 0, 0, ${
                  0.06 + (i / Object.keys(categories).length) * 0.94
                })`,
              }}
            >
              <button
                key={category}
                className={`flex flex-col flex-grow h-full justify-center items-center border-x border-transparent overflow-hidden ${
                  selectedCategory === category
                    ? ""
                    : "hover:bg-white/5 hover:border-white/30"
                }`}
                onClick={() => {
                  setSelectedCategory(category);
                }}
              >
                {categories[category]}
                <Icon
                  icon="gtp:smiley"
                  className={`w-[10px] h-[10px] ${
                    selectedCategory === category
                      ? "text-white"
                      : "text-white/40"
                  }`}
                />
              </button>
            </div>
          ))}
         
        </div>
      </div>
      {/* <colorful rows> */}
      <div className="flex flex-col space-y-[10px]">
        {
          //chain name is key
          Object.keys(data)
            .filter((c) => c !== "all_l2s")
            .map((chainKey, index) => {
              return (
                <div
                  key={index}
                  className={`flex flex-row flex-grow h-full items-center rounded-full text-xs font-medium ${
                    ["arbitrum", "imx", "all_l2s"].includes(chainKey)
                      ? "text-black"
                      : "text-white"
                  } ${AllChainsByKeys[chainKey].backgrounds["light"][1]}`}
                >
                  <div className="flex items-center h-[45px] pl-[20px] w-[150px]">
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
                  <div className="flex w-full pr-[2px] py-[2px] ">
                    {Object.keys(categories).map((categoryKey, i) => {
                      return (
                        <div
                          key={categoryKey}
                          className={`flex flex-col h-[41px] justify-center items-center border-x px-4 py-5 ${
                            selectedCategory === categoryKey
                              ? `py-[25px] -my-[5px] z-10 rounded-[10px] border-transparent shadow-lg ${AllChainsByKeys[chainKey].backgrounds["light"][1]} `
                              : "border-transparent"
                          } ${
                            i ===
                            Object.keys(
                              data[chainKey].overview[selectedTimespan],
                            ).length -
                              1
                              ? selectedCategory === categoryKey
                                ? ""
                                : "rounded-r-full"
                              : ""
                          }`}
                          style={{
                            
                            backgroundColor: 
                            selectedCategory === categoryKey
                            ? ""
                            : `rgba(0, 0, 0, ${
                              0.06 + (i / Object.keys(categories).length) * 0.94
                            })`,
                            width: `${
                              selectedCategory === categoryKey
                              ?
                                0.08 >= data[chainKey].overview[selectedTimespan][
                                  categoryKey
                                ][
                                  data[chainKey].overview.types.indexOf(
                                    "gas_fees_share",
                                  )
                                ] ? 8
                                  : data[chainKey].overview[selectedTimespan][
                                    categoryKey
                                  ][
                                    data[chainKey].overview.types.indexOf(
                                      "gas_fees_share",
                                    )
                                  ] * 100.0 * 1.2
                              : data[chainKey].overview[selectedTimespan][
                                categoryKey
                              ][
                                data[chainKey].overview.types.indexOf(
                                  "gas_fees_share",
                                )
                              ] * 100.0
                            }%`,
                          }}
                        >
                          <div
                            className={`${
                              ["arbitrum", "imx", "all_l2s"].includes(chainKey)
                                ? i > 5
                                  ? "text-white/60"
                                  : "text-black"
                                : i > 5
                                ? "text-white/60"
                                : "text-white/80"
                            } mix-blend-luminosity font-medium 
                            ${
                              selectedCategory === categoryKey
                                ? "text-lg"
                                : "text-xs"
                            }`}
                          >
                            {(
                              data[chainKey].overview[selectedTimespan][
                                categoryKey
                              ][
                                data[chainKey].overview.types.indexOf(
                                  "gas_fees_share",
                                )
                              ] * 100.0
                            ).toFixed(2)}
                            %
                          </div>
                        </div>
                      );
                    })}
                    {/* <div className="flex flex-col w-10 h-[41px] bg-black/10"></div> */}
                  </div>
                </div>
              );
            })
        }
      </div>
      {/* </colorful rows> */}
      <div className="flex w-full justify-between md:w-auto bg-forest-50 dark:bg-[#1F2726] rounded-full p-0.5 mt-8">
        <div className="flex justify-normal md:justify-start">
          {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
          {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
          {/* toggle ETH */}

          <div className="flex justify-center items-center pl-0 md:pl-0 w-full md:w-auto ">
            <div className="flex justify-between md:justify-center items-center  space-x-[4px] md:space-x-1 mr-0 md:mr-2.5 w-full md:w-auto ">
              <button
                className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                  "gasfees" === selectedScale
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedScale("gasfees");
                }}
              >
                Gas Fees
              </button>
              <button
                className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base  lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                  "txcount" === selectedScale
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedScale("txcount");
                }}
              >
                Transaction Count
              </button>
            </div>
          </div>
        </div>
        <div className="flex -my-7 -mx-3  rounded-xl px-1.5 py-1.5 md:px-3 md:py-1.5 items-center">
          <div className="flex bg-forest-100 dark:bg-[#4B5553] rounded-xl px-3 py-1.5 items-center mr-5">
            <Icon
              icon="feather:users"
              className="w-8 h-8 lg:w-14 lg:h-14 mr-2"
            />
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs font-medium leading-tight">Total Eth</div>
              <div className="text-3xl font-[650]">X</div>
              <div className="text-xs font-medium leading-tight">
                <span
                  className="text-green-500 dark:text-green-400 font-semibold"
                  style={{
                    textShadow:
                      theme === "dark"
                        ? "1px 1px 4px #00000066"
                        : "1px 1px 4px #ffffff99",
                  }}
                >
                  +%
                </span>
                % in last week
              </div>
            </div>
          </div>
          <div className="flex bg-forest-100 dark:bg-[#4B5553] rounded-xl px-3 py-1.5 items-center mr-5">
            <Icon
              icon="feather:layers"
              className="w-8 h-8 lg:w-14 lg:h-14 mr-2"
            />
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs font-medium leading-tight">
                Average Share
              </div>
              <div className="text-3xl font-[650]">x</div>
              <div className="text-xs font-medium leading-tight">
                <span
                  className="text-green-500 dark:text-green-400 font-semibold"
                  style={{
                    textShadow:
                      theme === "dark"
                        ? "1px 1px 4px #00000066"
                        : "1px 1px 4px #ffffff99",
                  }}
                >
                  +%
                </span>
                in last week
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
