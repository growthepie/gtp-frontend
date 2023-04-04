import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";

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

  useEffect(() => {
    if (!data) return;

    let max = 0;
    Object.keys(data).forEach((chain) => {
      // find index with highest timestamp
      let index = 0;
      for (let i = 0; i < data[chain].daily.data.length; i++) {
        if (data[chain].daily.data[i][0] > data[chain].daily.data[index][0]) {
          index = i;
        }
      }
      let last = data[chain].daily.data[index][1];
      if (max < last) max = last;
    });

    setMaxVal(max);
  }, [data]);

  return (
    <>
      <div className="flex flex-col space-y-3">
        <div className="flex items-center cursor-pointer py-1 pl-2 pr-4 rounded-full text-sm font-medium">
          <div className="ml-10 w-[80px]">Chain</div>
          <div className="w-[80px]">{metric}</div>
          {["1d", "7d", "30d", "365d"].map((timespan) => (
            <div
              key={timespan}
              className="w-[70px] font-bold text-xs text-right"
            >
              {timespan}
            </div>
          ))}
        </div>
        {chains.map((chain) => (
          <div
            key={chain.key}
            className={`flex items-center space-x-2 cursor-pointer py-1 pl-2 pr-4 rounded-full text-sm font-[400] ${
              selectedChains.includes(chain.key)
                ? " hover:bg-blue-100 "
                : "hover:bg-gray-100  opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-100"
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
            <div className="relative -mb-0.5">
              <div
                className={`w-8 h-8 rounded-full bg-white border-[5px] ${
                  chain.border[1]
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
              <div className="w-[80px] relative">
                {chain.label}
                <div className="absolute -bottom-[3px] left-0 w-[75px] h-0.5 bg-forest-50 rounded-sm"></div>
                <div
                  className={`absolute -bottom-[3px] left-0 h-0.5 bg-green-500 rounded-sm`}
                  style={{
                    width: `${
                      (data[chain.key].daily.data[
                        data[chain.key].daily.data.length - 1
                      ][1] /
                        maxVal) *
                      75
                    }px`,
                  }}
                ></div>
              </div>
              {/* <div className="flex flex-1 align-middle items-center"> */}
              <div className="w-[80px]">
                {Intl.NumberFormat("en-US", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(
                  data[chain.key].daily.data[
                    data[chain.key].daily.data.length - 1
                  ][
                    !showUsd && data[chain.key].daily.types.includes("usd")
                      ? 2
                      : 1
                  ]
                )}
              </div>
              {["1d", "7d", "30d", "365d"].map((timespan) => (
                <div
                  key={timespan}
                  className="w-[70px] text-right flex justify-end align-middle items-center"
                >
                  {data[chain.key].changes[timespan][0] > 0 ? (
                    <div className="text-green-500 text-[0.5rem]">▲</div>
                  ) : (
                    <div className="text-red-500 text-[0.5rem]">▼</div>
                  )}
                  <div className="w-12">
                    {Math.round(data[chain.key].changes[timespan][0] * 1000) /
                      10}
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
        ))}
      </div>
    </>
  );
};

export default MetricsTable;
