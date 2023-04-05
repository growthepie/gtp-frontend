import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";

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
  const [showUsd, setShowUsd] = useSessionStorage("showUsd", true);

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
      <div className="flex flex-col mt-12">
        <div
          className={`flex items-center cursor-pointer py-1 pl-2 pr-4 rounded-full text-sm font-medium ${
            fixedWidth ? "w-auto" : "w-full"
          }`}
        >
          <div className={`ml-10 ${fixedWidth ? "w-[80px]" : "w-[25%]"}`}>
            Chain
          </div>
          <div className={`${fixedWidth ? "w-[80px]" : "w-[15%]"}`}>
            {metric}
          </div>
          {["1d", "7d", "30d", "365d"].map((timespan) => (
            <div
              key={timespan}
              className={`${
                fixedWidth ? "w-[70px]" : "w-[15%]"
              } font-bold text-xs text-right`}
            >
              {timespan}
            </div>
          ))}
        </div>
        {chains.map((chain, i) => (
          <div
            key={chain.key}
            className={`flex items-center space-x-2 cursor-pointer pt-1.5 pb-2 pl-2 pr-4 rounded-full text-sm font-[400] border-[1px] border-forest-500 ${
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
              <div className={`${fixedWidth ? "w-[80px]" : "w-[25%]"}`}>
                {chain.label}
              </div>
              {/* <div className="flex flex-1 align-middle items-center"> */}
              <div
                className={`${fixedWidth ? "w-[80px]" : "w-[15%]"} relative`}
              >
                <div className="flex">
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
                    ? Intl.NumberFormat("en-US", {
                        notation: "compact",
                        maximumFractionDigits: 1,
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
                    : Intl.NumberFormat("en-US", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(
                        data[chain.key].daily.data[
                          data[chain.key].daily.data.length - 1
                        ][1]
                      )}
                </div>
                <div className="absolute -bottom-[4px] left-0 w-[75px] h-1 bg-forest-50 rounded-md"></div>
                <div
                  className={`absolute -bottom-[4px] left-0 h-1 bg-green-500 rounded-md`}
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
