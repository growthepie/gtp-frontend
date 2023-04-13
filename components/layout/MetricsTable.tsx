import { AllChainsByKeys } from "@/lib/chains";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage, useMediaQuery, useSessionStorage } from "usehooks-ts";
import { useTheme } from "next-themes";

const MetricsTable = ({
  data,
  chains,
  selectedChains,
  setSelectedChains,
  metric,
  fixedWidth = true,
}: {
  data: any;
  chains: any;
  selectedChains: any;
  setSelectedChains: any;
  metric: string;
  fixedWidth?: boolean;
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

    let clv = [];

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

  return (
    <>
      <div className="flex flex-col mt-12">
        <div
          className={`flex items-center cursor-pointer py-1 pl-2 pr-4 rounded-full font-medium ${
            fixedWidth ? "w-auto" : "w-full"
          } ${isLargeScreen ? "text-sm" : "text-xs"}`}
        >
          <div className={`ml-10 ${fixedWidth ? "w-[80px]" : "w-[25%]"}`}>
            Chain
          </div>
          <div className={`${fixedWidth ? "w-[80px]" : "w-[15%]"} text-right`}>
            {/* {metric} */}
            Current
          </div>
          {["1d", "7d", "30d", "365d"].map((timespan) => (
            <div
              key={timespan}
              className={`${fixedWidth ? "w-[70px]" : "w-[15%]"} ${
                isLargeScreen ? "text-xs" : "text-2xs"
              } font-bold text-xs text-right`}
            >
              {timespan}
            </div>
          ))}
        </div>
        {chains &&
          chainsLastVal &&
          chainsLastVal.map((clv, i) => {
            const chain = clv.chain;
            return (
              <div
                key={chain.key}
                className={`flex items-center space-x-2 cursor-pointer pt-1.5 pb-2 pl-2 pr-4 rounded-full ${
                  isLargeScreen ? "text-sm" : "text-xs"
                } font-[400] border-[1px] border-forest-500 ${
                  i > 0 ? "-mt-[1px]" : ""
                }${
                  selectedChains.includes(chain.key)
                    ? " hover:bg-forest-50 "
                    : "hover:bg-gray-100  opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-100"
                }${fixedWidth ? "w-auto" : "w-full"}`}
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
                <div className="relative -mb-0.5">
                  <div
                    className={`w-8 h-8 rounded-full bg-white border-[5px] ${
                      chain.border[theme][1]
                    } ${selectedChains.includes(chain.key) ? "" : ""}`}
                  ></div>
                  <Image
                    src={chain.icon}
                    alt={chain.label}
                    width={18}
                    height={18}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 "
                  />
                </div>
                <div className="flex flex-1 align-middle items-center">
                  <div className={`${fixedWidth ? "w-[80px]" : "w-[25%]"}`}>
                    {chain.label}
                  </div>
                  {/* <div className="flex flex-1 align-middle items-center"> */}
                  <div
                    className={`${
                      fixedWidth ? "w-[80px]" : "w-[15%]"
                    } relative`}
                  >
                    <div className="flex justify-end">
                      {data[chain.key].daily.types.includes("usd") && (
                        <>
                          {showUsd ? (
                            <div className="">$</div>
                          ) : (
                            <div className="">Ξ</div>
                          )}
                        </>
                      )}
                      {data[chain.key].daily.types.includes("usd")
                        ? Intl.NumberFormat(undefined, {
                            notation: "compact",
                            maximumFractionDigits: 2,
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
                          }).format(
                            data[chain.key].daily.data[
                              data[chain.key].daily.data.length - 1
                            ][1]
                          )}
                    </div>
                    <div className="absolute -bottom-[4px] right-0 w-full h-1 bg-forest-50 rounded-md"></div>
                    <div
                      className={`absolute -bottom-[4px] left-0 h-1 bg-green-500 rounded-md`}
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
                    {/* {data[chain.key].daily.types.includes("eth") && !showUsd && (
                  <div className="ml-1">ETH</div>
                )} */}
                  </div>
                  {["1d", "7d", "30d", "365d"].map((timespan) => (
                    <div
                      key={timespan}
                      className={`${
                        fixedWidth ? "w-[70px]" : "w-[15%]"
                      } text-right flex justify-end align-middle items-center`}
                    >
                      {data[chain.key].changes[timespan][0] > 0 ? (
                        <div className="text-green-500 text-[0.5rem]">▲</div>
                      ) : (
                        <div className="text-red-500 text-[0.5rem]">▼</div>
                      )}
                      <div className="w-12">
                        {Math.round(
                          data[chain.key].changes[timespan][0] * 1000
                        ) / 10}
                        %
                      </div>
                    </div>
                  ))}
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
              </div>
            );
          })}
      </div>
    </>
  );
};

export default MetricsTable;
