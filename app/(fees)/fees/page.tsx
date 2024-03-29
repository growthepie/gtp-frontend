"use client";
import Container from "@/components/layout/Container";
import Icon from "@/components/layout/Icon";
import { AllChainsByKeys } from "@/lib/chains";
import { useTheme } from "next-themes";
import { useMemo, useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { useLocalStorage } from "usehooks-ts";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";

export default function FeesPage() {
  const [selectedTimescale, setSelectedTimescale] = useState("thirty_min");
  const [selectedSort, setSelectedSort] = useState("chain");
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

  const timescales = useMemo(() => {
    return {
      thirty_min: {
        label: "30 Min",
      },
      hourly: {
        label: "1h",
      },
      six_hours: {
        label: "6h",
      },
      twelve_hours: {
        label: "12h",
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

  function dataAvailToArray(x: string): string[] {
    let retString: string[] = [];
    if (typeof x === "string") {
      // Ensure x is a string
      if (x.includes("calldata")) {
        retString.push("calldata");
      }

      if (x.includes("blobs")) {
        retString.push("blobs");
      }
    }
    return retString;
  }

  return (
    <>
      {feeData && master && (
        <>
          <Container className="w-[820px]">
            <div
              className="flex px-[5px] items-center w-[820px] h-[54px] rounded-full mt-[16px] bg-[#5A6462] shadow-none"
              style={{ boxShadow: "0px 0px 25px rgba(0, 0, 0, 0.50)" }}
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
          <Container className="w-full mt-[30px] ">
            <div className="flex w-full justify-between px-[10px] items-center">
              <div className="text-[20px] font-bold">
                Cost of using Ethereum Layer-2s
              </div>
              <div className="w-[171px] h-[34px] flex bg-[#1F2726] px-0.5 items-center justify-evenly pr-[2px] text-[12px] rounded-full ">
                {Object.keys(timescales)
                  .reverse()
                  .map((timescale) => (
                    <div
                      className={`w-[25%] hover:cursor-pointer py-1.5 px-0.5 hover:bg-forest-500/10 rounded-full text-center
                  ${
                    selectedTimescale === timescale
                      ? "bg-[#151A19]"
                      : "bg-inherit"
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
          <Container>
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
                  className={` dark:text-white text-black w-[10px] h-[10px] ${
                    selectedSort === "chain" ? "opacity-100" : "opacity-20"
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
                    className={` dark:text-white text-black w-[10px] h-[10px] ${
                      selectedSort === "availability"
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
                  className={` dark:text-white text-black w-[10px] h-[10px] ${
                    selectedSort === "medianfee" ? "opacity-100" : "opacity-20"
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
                  className={` dark:text-white text-black w-[10px] h-[10px] ${
                    selectedSort === "transfer" ? "opacity-100" : "opacity-20"
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
                  className={` dark:text-white text-black w-[10px] h-[10px] ${
                    selectedSort === "swaptoken" ? "opacity-100" : "opacity-20"
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
            <div className="w-full h-[410px] flex flex-col gap-y-1">
              {Object.entries(sortedFees).map((chain, index) => {
                console.log(dataAvailToArray(master.chains[chain[0]].da_layer));
                return (
                  <div
                    key={index}
                    className="border-forest-700 border-[1px] w-full rounded-full border-black/[16%] dark:border-[#5A6462] h-[34px] pl-[20px] flex items-center text-[15px]"
                  >
                    <div className="flex items-center h-full w-[4%] ">
                      <Icon
                        icon={`gtp:${
                          AllChainsByKeys[chain[0]].urlKey
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
                      <div className="bg-[#344240] flex rounded-full items-center px-[5px] py-[3px] gap-x-[2px]">
                        {dataAvailToArray(master.chains[chain[0]].da_layer).map(
                          (icon, index, array) => [
                            <div key={index} className="w-[12px] h-[12px]">
                              <Icon
                                icon={`gtp:${icon}`}
                                className="h-[12px] w-[12px]"
                                style={{
                                  color: "#5A6462",
                                }}
                              />
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
                          ],
                        )}
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
                                .txcosts_median.data[0][showUsd ? 2 : 1] < 0.01
                              ? 4
                              : 3
                            : 5,
                          minimumFractionDigits: 0,
                        }).format(
                          feeData.chain_data[chain[0]]["hourly"].txcosts_median
                            .data[0][showUsd ? 2 : 1],
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
                    <div className="absolute right-[52px]">
                      <Icon
                        icon="feather:check-circle"
                        className={`w-[22px] h-[22px] transition-all rounded-full ${
                          selectedChains[chain[0]]
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
          </Container>
        </>
      )}
    </>
  );
}