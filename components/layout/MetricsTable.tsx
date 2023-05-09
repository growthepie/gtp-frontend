import { AllChainsByKeys } from "@/lib/chains";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage, useMediaQuery, useSessionStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";

const MetricsTable = ({
  data,
  chains,
  selectedChains,
  setSelectedChains,
  metric,
}: {
  data: any;
  chains: any;
  selectedChains: any;
  setSelectedChains: any;
  metric: string;
}) => {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [maxVal, setMaxVal] = useState(0);

  const [lastIndex, setLastIndex] = useState<null | number>(null);

  const [chainsLastVal, setChainsLastVal] = useState<
    { chain: any; lastVal: number }[]
  >([]);

  const { theme } = useTheme();

  // check if screen is large enough to show sidebar
  const isLargeScreen = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (!data) return;

    let clv: any = [];

    let max = 0;
    chains.forEach((chain) => {
      // find index with highest timestamp
      let index = 0;
      for (let i = 0; i < data[chain.key].daily.data.length; i++) {
        if (
          data[chain.key].daily.data[i][0] >
          data[chain.key].daily.data[index][0]
        ) {
          index = i;
        }
      }
      if (!lastIndex) setLastIndex(index);

      let last = data[chain.key].daily.data[index][1];

      clv = [...clv, { chain, lastVal: last }];

      if (max < last) max = last;
    });

    setChainsLastVal(clv.sort((a, b) => b.lastVal - a.lastVal));

    setMaxVal(max);
  }, [chains, data, lastIndex]);

  const timespanLabels = {
    "1d": "24h",
    "7d": "7 days",
    "30d": "30 days",
    "365d": "1 year",
  };

  return (
    <div className="flex flex-col mt-6 font-semibold space-y-[5px] w-full">
      <div
        className={`flex items-center py-1 pl-2 pr-4 rounded-full font-semibold whitespace-nowrap text-xs lg:text-sm`}
      >
        <div className="basis-1/3 pl-12">Chain</div>
        <div className="basis-2/3 flex w-full pr-4">
          {/* <div className={`basis-1/5 text-right capitalize`}>
              Current
            </div> */}
          {["1d", "7d", "30d", "365d"].map((timespan) => (
            <div key={timespan} className="basis-1/4 text-right">
              {timespanLabels[timespan]}
            </div>
          ))}
        </div>
      </div>
      {chains &&
        chainsLastVal &&
        chainsLastVal.map((clv, i) => {
          const chain = clv.chain;
          return (
            <div
              key={chain.key}
              className={`flex relative items-center cursor-pointer p-1.5 lg:p-3 rounded-full w-full font-[400] border-[1px] border-forest-500 whitespace-nowrap text-xs lg:text-[0.95rem] ${
                selectedChains.includes(chain.key)
                  ? " hover:bg-forest-50/10"
                  : "opacity-50 grayscale hover:opacity-70 hover:grayscale-20 transition-all duration-100"
              }`}
              onClick={() => {
                if (selectedChains.includes(chain.key)) {
                  setSelectedChains(
                    selectedChains.filter((c) => c !== chain.key)
                  );
                } else {
                  setSelectedChains([...selectedChains, chain.key]);
                }
              }}
            >
              <div className="flex basis-1/3 items-center space-x-2">
                <div className="relative">
                  <div
                    className={`w-9 h-9 rounded-full bg-white border-[5px] ${
                      chain.border[theme ?? "dark"][1]
                    } ${selectedChains.includes(chain.key) ? "" : ""}`}
                  ></div>
                  <Icon
                    icon={`gtp:${chain.urlKey}-logo-monochrome`}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5"
                    style={{
                      color: chain.colors[theme ?? "dark"][1],
                    }}
                  />
                </div>
                <div className="w-full break-inside-avoid">
                  <div className="w-full flex flex-col space-y-0.5">
                    <div className="flex w-full items-baseline text-sm font-bold">
                      {data[chain.key].daily.types.includes("usd") && (
                        <>
                          {showUsd ? (
                            <div className="text-[13px] font-normal">$</div>
                          ) : (
                            <div className="text-[13px] font-normal">Ξ</div>
                          )}
                        </>
                      )}
                      {data[chain.key].daily.types.includes("usd")
                        ? Intl.NumberFormat(undefined, {
                            notation: "compact",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          }).format(
                            data[chain.key].daily.data[
                              data[chain.key].daily.data.length - 1
                            ][
                              !showUsd &&
                              data[chain.key].daily.types.includes("usd")
                                ? 2
                                : 1
                            ]
                          )
                        : Intl.NumberFormat(undefined, {
                            notation: "compact",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          }).format(
                            data[chain.key].daily.data[
                              data[chain.key].daily.data.length - 1
                            ][1]
                          )}
                    </div>
                    <div className="relative w-full">
                      <div className="absolute left-0 -top-[3px] w-full h-1 bg-black/10"></div>
                      <div
                        className={`absolute left-0 -top-[3px] h-1 bg-forest-400 rounded-none font-semibold`}
                        style={{
                          width: `${
                            (data[chain.key].daily.data[
                              data[chain.key].daily.data.length - 1
                            ][1] /
                              maxVal) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs mt-1">{chain.label}</div>
                  </div>
                </div>
              </div>
              <div className="basis-2/3 pr-4 flex w-full">
                {/* <div className="flex basis-1/5 justify-end items-center">
                    
                    
                  </div> */}
                {["1d", "7d", "30d", "365d"].map((timespan) => (
                  <div
                    key={timespan}
                    className="basis-1/4 text-right text-base"
                  >
                    {/* {data[chain.key].changes[timespan][0] > 0 ? (
                        <div className="text-green-500 text-[0.5rem]">▲</div>
                      ) : (
                        <div className="text-red-500 text-[0.5rem]">▼</div>
                      )} */}
                    {data[chain.key].changes[timespan][0] >= 0 ? (
                      <span className="w-12 text-green-500">
                        +
                        {Math.round(
                          data[chain.key].changes[timespan][0] * 1000
                        ) / 10}
                        %
                      </span>
                    ) : (
                      <span className="w-12 text-red-500">
                        {Math.round(
                          data[chain.key].changes[timespan][0] * 1000
                        ) / 10}
                        %
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {selectedChains.includes(chain.key) ? (
                <div className="absolute -right-[20px]">
                  <div className="p-1 rounded-full bg-forest-50">
                    <Icon icon="feather:check-circle" className="w-6 h-6" />
                  </div>
                </div>
              ) : (
                <div className="absolute -right-[20px]">
                  <div className="p-1 rounded-full bg-forest-50">
                    <Icon icon="feather:circle" className="w-6 h-6" />
                  </div>
                </div>
              )}
              {/* </div> */}
              {/* <div className="w-1/4 text-right">
                      {Math.round(
                        data[chain.key].changes["7d"][0] * 1000
                      ) / 10}
                      %
                    </div>
                    <div className="w-1/4 text-right">
                      {Math.round(
                        data[chain.key].changes["30d"][0] * 1000
                      ) / 10}
                      %
                    </div>
                    <div className="w-1/4 text-right">
                      {Math.round(
                        data[chain.key].changes["365d"][0] * 1000
                      ) / 10}
                      %
                    </div> */}
            </div>
          );
        })}
    </div>
  );
};

export default MetricsTable;
