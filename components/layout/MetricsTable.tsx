import { AllChainsByKeys } from "@/lib/chains";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage, useMediaQuery, useSessionStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import { useTransition, animated } from "@react-spring/web";

const MetricsTable = ({
  data,
  chains,
  selectedChains,
  setSelectedChains,
  metric,
  showEthereumMainnet,
  setShowEthereumMainnet,
}: {
  data: any;
  chains: any;
  selectedChains: any;
  setSelectedChains: any;
  metric: string;
  showEthereumMainnet: boolean;
  setShowEthereumMainnet: (show: boolean) => void;
}) => {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [maxVal, setMaxVal] = useState<number | null>(null);

  const { theme } = useTheme();

  // set maxVal
  useEffect(() => {
    if (!data) return;

    setMaxVal(
      Math.max(
        ...Object.keys(data)
          .filter((chain) => chain !== "ethereum")
          .map((chain) => {
            return data[chain].daily.data[data[chain].daily.data.length - 1][
              data[chain].daily.types.length > 2
                ? showUsd && data[chain].daily.types.includes("usd")
                  ? data[chain].daily.types.indexOf("usd")
                  : data[chain].daily.types.indexOf("eth")
                : 1
            ];
          })
      )
    );
  }, [data, showUsd]);

  const rows = useCallback(() => {
    if (!data || maxVal === null) return [];
    return Object.keys(data)
      .filter((chain) => chain !== "ethereum")
      .map((chain: any) => {
        const lastVal =
          data[chain].daily.data[data[chain].daily.data.length - 1][
            data[chain].daily.types.length > 2
              ? showUsd && data[chain].daily.types.includes("usd")
                ? data[chain].daily.types.indexOf("usd")
                : data[chain].daily.types.indexOf("eth")
              : 1
          ];
        return {
          data: data[chain],
          chain: AllChainsByKeys[chain],
          lastVal: lastVal,
          barWidth: `${(lastVal / maxVal) * 100}%`,
        };
      })
      .sort((a, b) => {
        // always show ethereum at the bottom
        if (a.chain.key === "ethereum") return 1;
        if (b.chain.key === "ethereum") return -1;

        // sort by last value in daily data array and keep unselected chains at the bottom in descending order
        if (selectedChains.includes(a.chain.key)) {
          if (selectedChains.includes(b.chain.key)) {
            return b.lastVal - a.lastVal;
          } else {
            return -1;
          }
        } else {
          if (selectedChains.includes(b.chain.key)) {
            return 1;
          } else {
            return b.lastVal - a.lastVal;
          }
        }
      });
  }, [data, selectedChains, showUsd, maxVal]);

  let height = 0;
  const transitions = useTransition(
    rows().map((data) => ({ ...data, y: (height += 66) - 66, height: 66 })),
    {
      key: (d) => d.chain.key,
      from: { opacity: 0, height: 0 },
      leave: { opacity: 0, height: 0 },
      enter: ({ y, height }) => ({ opacity: 1, y, height }),
      update: ({ y, height }) => ({ y, height }),
      config: { mass: 5, tension: 500, friction: 100 },
      trail: 25,
    }
  );

  const timespanLabels = {
    "1d": "24h",
    "7d": "7 days",
    "30d": "30 days",
    "365d": "1 year",
  };

  return (
    <div className="flex flex-col font-semibold space-y-[5px] w-full transition-all duration-300">
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
      <div className="w-full relative" style={{ height }}>
        {transitions((style, item, t, index) => (
          <animated.div
            className="absolute w-full"
            style={{ zIndex: Object.keys(data).length - index, ...style }}
          >
            <div
              key={item.chain.key}
              className={`flex relative items-center cursor-pointer rounded-full w-full font-[400] border-forest-500 whitespace-nowrap text-xs lg:text-[0.95rem] group
              ${
                item.chain.key === "ethereum"
                  ? showEthereumMainnet
                    ? "hover:border hover:p-1.5 p-[7px] py-[4px] lg:p-[13px] lg:py-[8px] hover:lg:p-3 hover:lg:py-[7px]"
                    : "opacity-40 hover:opacity-80 p-[7px] py-[4px] lg:p-[13px] lg:py-[8px]"
                  : selectedChains.includes(item.chain.key)
                  ? " hover:bg-forest-50/5 p-1.5 py-[4px] lg:p-3 lg:py-[8px] border"
                  : "opacity-40 hover:opacity-80 p-1.5 py-[4px] lg:p-3 lg:py-[8px] border"
              } `}
              onClick={() => {
                if (item.chain.key === "ethereum") {
                  if (showEthereumMainnet) {
                    setShowEthereumMainnet(false);
                  } else {
                    setShowEthereumMainnet(true);
                  }
                } else {
                  if (selectedChains.includes(item.chain.key)) {
                    setSelectedChains(
                      selectedChains.filter((c) => c !== item.chain.key)
                    );
                  } else {
                    setSelectedChains([...selectedChains, item.chain.key]);
                  }
                }
              }}
            >
              <div className="flex basis-1/3 items-center space-x-2">
                <div className="relative">
                  <div
                    className={`w-9 h-9 rounded-full border-[5px] ${
                      item.chain.border[theme ?? "dark"][1]
                    } ${selectedChains.includes(item.chain.key) ? "" : ""}`}
                  ></div>
                  <Icon
                    icon={`gtp:${item.chain.urlKey}-logo-monochrome`}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5"
                    style={{
                      color: item.chain.colors[theme ?? "dark"][1],
                    }}
                  />
                </div>
                <div className="w-full break-inside-avoid">
                  <div className="w-full flex flex-col space-y-0.5">
                    <div className="flex w-full items-baseline text-sm font-bold pb-0.5">
                      {item.data.daily.types.includes("usd") && (
                        <>
                          {showUsd ? (
                            <div className="text-[13px] font-normal">$</div>
                          ) : (
                            <div className="text-[13px] font-normal">Ξ</div>
                          )}
                        </>
                      )}
                      {item.data.daily.types.includes("usd")
                        ? Intl.NumberFormat(undefined, {
                            notation: "compact",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          }).format(
                            item.data.daily.data[
                              item.data.daily.data.length - 1
                            ][
                              !showUsd && item.data.daily.types.includes("usd")
                                ? 2
                                : 1
                            ]
                          )
                        : Intl.NumberFormat(undefined, {
                            notation: "compact",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          }).format(
                            item.data.daily.data[
                              item.data.daily.data.length - 1
                            ][1]
                          )}
                    </div>
                    <div className="relative w-full">
                      {item.chain.key !== "ethereum" && (
                        <>
                          <div className="absolute left-0 -top-[3px] w-full h-1 bg-black/10"></div>
                          <div
                            className={`absolute left-0 -top-[3px] h-1 bg-forest-400 rounded-none font-semibold transition-width duration-300 `}
                            style={{
                              width: item.barWidth,
                            }}
                          ></div>
                        </>
                      )}
                    </div>
                    <div className="text-xs font-medium">
                      {item.chain.label}
                    </div>
                  </div>
                </div>
              </div>
              <div className="basis-2/3 pr-4 flex w-full">
                {["1d", "7d", "30d", "365d"].map((timespan) => (
                  <div
                    key={timespan}
                    className="basis-1/4 text-right text-base"
                  >
                    {item.data.changes[timespan][0] === null ? (
                      <span className="text-gray-500 text-center mx-4 inline-block">
                        —
                      </span>
                    ) : (
                      <>
                        {item.data.changes[timespan][0] >= 0 ? (
                          <span className="text-green-500">
                            +
                            {Math.round(item.data.changes[timespan][0] * 1000) /
                              10}
                            %
                          </span>
                        ) : (
                          <span className="text-red-500">
                            {Math.round(item.data.changes[timespan][0] * 1000) /
                              10}
                            %
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div
                className={`absolute  ${
                  item.chain.key === "ethereum"
                    ? showEthereumMainnet
                      ? "-right-[19px] group-hover:-right-[20px]"
                      : "-right-[19px]"
                    : "-right-[20px]"
                }`}
              >
                <div className="absolute rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className={`w-6 h-6 ${
                      item.chain.key === "ethereum"
                        ? showEthereumMainnet
                          ? "opacity-0"
                          : "opacity-100"
                        : selectedChains.includes(item.chain.key)
                        ? "opacity-0"
                        : "opacity-100"
                    }`}
                  >
                    <circle
                      xmlns="http://www.w3.org/2000/svg"
                      cx="12"
                      cy="12"
                      r="10"
                    />
                  </svg>
                </div>
                <div className="p-1 rounded-full bg-forest-50">
                  <Icon
                    icon="feather:check-circle"
                    className={`w-6 h-6 ${
                      item.chain.key === "ethereum"
                        ? showEthereumMainnet
                          ? "opacity-100"
                          : "opacity-0"
                        : selectedChains.includes(item.chain.key)
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                </div>
              </div>
              {/* {item.chain.key === "ethereum" ? (
                <>
                  {showEthereumMainnet ? (
                    <div className="absolute -right-[20px]">
                      <div className="p-1 rounded-full bg-forest-50">
                        <Icon icon="feather:check-circle " className="w-6 h-6" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute -right-[20px]">
                      <div className="p-1 rounded-full bg-forest-50">
                        <Icon icon="feather:circle" className="w-6 h-6" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {selectedChains.includes(item.chain.key) ? (
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
                </>
              )} */}
            </div>
          </animated.div>
        ))}
      </div>
    </div>
  );
};

export default MetricsTable;
