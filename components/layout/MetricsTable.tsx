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
      <div className="flex flex-col mt-12 font-semibold">
        <div
          className={`flex items-center p-1.5 lg:py-1.5 lg:pl-3 pr-6 rounded-full gap-x-2 lg:gap-x-8 font-semibold whitespace-nowrap text-xs lg:text-sm`}
        >
          <div className={`basis-1/3 pl-14`}>Chain</div>
          <div className="basis-2/3 flex w-full">
            <div className={`basis-1/5 text-right capitalize`}>
              {/* {metric} */}
              Current
            </div>
            {["1d", "7d", "30d", "365d"].map((timespan) => (
              <div key={timespan} className="basis-1/5 text-right">
                {timespan}
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
                className={`flex gap-x-2 lg:gap-x-8 items-center cursor-pointer p-1.5 lg:py-3 lg:pl-3 pr-6 rounded-full w-full font-[400] border-[1px] border-forest-500 whitespace-nowrap text-xs lg:text-sm ${
                  i > 0 ? "-mt-[1px]" : ""
                } ${
                  selectedChains.includes(chain.key)
                    ? " hover:bg-forest-50"
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
                <div className="flex basis-1/3 items-center space-x-4">
                  <div className="relative">
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
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    />
                  </div>
                  <div className="break-inside-avoid text-xs md:text-sm lg:text-lg">
                    {chain.label}
                  </div>
                </div>
                <div className="basis-2/3 flex w-full">
                  <div className="flex basis-1/5 justify-end items-center">
                    {/* <div className="flex flex-1 align-middle items-center"> */}
                    <div className={`relative w-full`}>
                      <div className="flex w-full justify-end">
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
                      <div className="absolute -bottom-[4px] right-0 w-full h-1 bg-black/30 rounded-md"></div>
                      <div
                        className={`absolute -bottom-[4px] right-0 h-1 bg-green-500 rounded-md font-semibold`}
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
                  </div>
                  {["1d", "7d", "30d", "365d"].map((timespan) => (
                    <div key={timespan} className="basis-1/5 text-right">
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
    </>
  );
};

export default MetricsTable;
