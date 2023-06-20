import { AllChainsByKeys } from "@/lib/chains";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage, useMediaQuery, useSessionStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import { useTransition, animated } from "@react-spring/web";
import { useUIContext } from "@/contexts/UIContext";

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

  const isMobile = useMediaQuery("(max-width: 1023px)");

  const { theme } = useTheme();

  const metric_ids_reverse_performance = ["txcosts"];

  const { isSidebarOpen } = useUIContext();

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
          }),
      ),
    );
  }, [data, showUsd]);

  const rows = useCallback(() => {
    if (!data || maxVal === null) return [];
    return Object.keys(data)
      .filter(
        (chain) =>
          chain !== "ethereum" && Object.keys(AllChainsByKeys).includes(chain),
      )
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
        if (metric_ids_reverse_performance.includes(metric)) {
          if (selectedChains.includes(a.chain.key)) {
            if (selectedChains.includes(b.chain.key)) {
              return a.lastVal - b.lastVal;
            } else {
              return -1;
            }
          } else {
            if (selectedChains.includes(b.chain.key)) {
              return 1;
            } else {
              return a.lastVal - b.lastVal;
            }
          }
        } else {
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
        }
      });
  }, [data, selectedChains, showUsd, maxVal]);

  let height = 0;
  const transitions = useTransition(
    rows().map((data) => ({
      ...data,
      y: (height += isMobile ? 56 : 71) - (isMobile ? 56 : 71),
      height: isMobile ? 56 : 71,
    })),
    {
      key: (d) => d.chain.key,
      from: { opacity: 0, height: 0 },
      leave: { opacity: 0, height: 0 },
      enter: ({ y, height }) => ({ opacity: 1, y, height }),
      update: ({ y, height }) => ({ y, height }),
      config: { mass: 5, tension: 500, friction: 100 },
      trail: 25,
    },
  );

  const timespanLabels = {
    "1d": "24h",
    "7d": "7 days",
    "30d": "30 days",
    "365d": "1 year",
  };

  return (
    <div className="flex flex-col mt-3 md:mt-0 font-semibold space-y-[5px] overflow-x-scroll md:overflow-x-visible z-100 w-full py-5 scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller">
      <div className="min-w-[570px] md:min-w-[600px] lg:min-w-full pr-[20px] md:pr-[50px] lg:pr-0 w-full">
        <div
          className={`flex space-x-5 items-center py-1 pl-2 pr-4 rounded-full font-semibold whitespace-nowrap text-xs lg:text-sm`}
        >
          <div
            className={`${
              isSidebarOpen ? "w-1/4 2xl:basis-1/3" : "basis-1/3"
            } pl-12`}
          >
            Chain
          </div>
          <div
            className={`${
              isSidebarOpen ? "w-3/4 2xl:basis-2/3" : "basis-2/3"
            } flex pr-4`}
          >
            {/* <div className={`basis-1/5 text-right capitalize`}>
              Current
            </div> */}
            {["1d", "7d", "30d", "365d"].map((timespan) => (
              <div
                key={timespan}
                className={`text-right ${
                  isSidebarOpen ? "w-1/3 2xl:basis-1/4" : "basis-1/4"
                }
                ${
                  isSidebarOpen && timespan === "7d"
                    ? "hidden 2xl:block"
                    : "block"
                }`}
              >
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
                className={`flex space-x-5 items-center cursor-pointer p-1.5 py-[4px] lg:p-3 lg:py-[11.5px] rounded-full w-full font-[400] border-[1px] border-black/[16%] dark:border-white/[16%] whitespace-nowrap text-xs lg:text-[0.95rem] group
              ${
                item.chain.key === "ethereum"
                  ? showEthereumMainnet
                    ? "hover:border hover:p-1.5 p-[7px] py-[4px] lg:p-[13px] lg:py-[8px] hover:lg:p-3 hover:lg:py-[7px]"
                    : "opacity-40 hover:opacity-80 p-[7px] py-[4px] lg:p-[13px] lg:py-[8px]"
                  : selectedChains.includes(item.chain.key)
                  ? " hover:bg-forest-500/10"
                  : "opacity-50 grayscale hover:opacity-70 hover:grayscale-20 transition-all duration-100"
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
                        selectedChains.filter((c) => c !== item.chain.key),
                      );
                    } else {
                      setSelectedChains([...selectedChains, item.chain.key]);
                    }
                  }
                  console.log(item);
                }}
              >
                <div
                  className={`flex ${
                    isSidebarOpen ? "w-1/4 2xl:basis-1/3" : "basis-1/3"
                  } items-center space-x-2`}
                >
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
                                !showUsd &&
                                item.data.daily.types.includes("usd")
                                  ? 2
                                  : 1
                              ],
                            )
                          : Intl.NumberFormat(undefined, {
                              notation: "compact",
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 2,
                            }).format(
                              item.data.daily.data[
                                item.data.daily.data.length - 1
                              ][1],
                            )}
                      </div>
                      <div className="relative w-full">
                        {item.chain.key !== "ethereum" && (
                          <>
                            <div className="absolute left-0 -top-[3px] w-full h-1 bg-black/10"></div>
                            <div
                              className={`absolute left-0 -top-[3px] h-1 bg-forest-900 dark:bg-forest-50 rounded-none font-semibold transition-width duration-300 `}
                              style={{
                                width: item.barWidth,
                              }}
                            ></div>
                          </>
                        )}
                      </div>
                      <div
                        className={`font-medium ${
                          isSidebarOpen ? "text-[10px] 2xl:text-xs" : "text-xs"
                        }`}
                      >
                        {item.chain.label}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className={`${
                    isSidebarOpen ? "w-3/4 2xl:basis-2/3" : "basis-2/3"
                  } pr-4 flex font-medium`}
                >
                  {["1d", "7d", "30d", "365d"].map((timespan) => (
                    <div
                      key={timespan}
                      className={`text-right  
                      ${
                        isSidebarOpen
                          ? "basis-1/3 text-sm 2xl:text-base 2xl:basis-1/4"
                          : "basis-1/4 text-base"
                      }
                      ${
                        isSidebarOpen && timespan === "7d"
                          ? "hidden 2xl:block"
                          : "block"
                      }`}
                    >
                      {item.data.changes[timespan][0] === null ? (
                        <span className="text-gray-500 text-center mx-4 inline-block">
                          —
                        </span>
                      ) : (
                        <>
                          {(metric_ids_reverse_performance.includes(metric)
                            ? -1.0
                            : 1.0) *
                            item.data.changes[timespan][0] >=
                          0 ? (
                            <span className="text-[#45AA6F] dark:text-[#4CFF7E]">
                              {metric_ids_reverse_performance.includes(metric)
                                ? "-"
                                : "+"}
                              {Math.abs(
                                Math.round(
                                  item.data.changes[timespan][0] * 1000,
                                ) / 10,
                              ).toFixed(1)}
                              %
                            </span>
                          ) : (
                            <span className="text-[#DD3408] dark:text-[#FF3838]">
                              {metric_ids_reverse_performance.includes(metric)
                                ? "+"
                                : "-"}
                              {Math.abs(
                                Math.round(
                                  item.data.changes[timespan][0] * 1000,
                                ) / 10,
                              ).toFixed(1)}
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
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
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
                  <div className="p-1 rounded-full bg-forest-50 dark:bg-forest-900">
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
              </div>
            </animated.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetricsTable;
