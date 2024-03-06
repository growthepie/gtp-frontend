import { EnabledChainsByKeys } from "@/lib/chains";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { useTheme } from "next-themes";
import d3 from "d3";
import moment from "moment";
import { Icon } from "@iconify/react";
import { useTransition, animated } from "@react-spring/web";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/layout/Tooltip";
import { useUIContext } from "@/contexts/UIContext";

export default function LandingMetricsTable({
  data,
  chains,
  selectedChains,
  setSelectedChains,
  metric,
  master,
  interactable,
}: {
  data: any;
  chains: any;
  selectedChains: any;
  setSelectedChains: any;
  metric: string;
  master: any;
  interactable: boolean;
}) {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [maxVal, setMaxVal] = useState(0);

  const isMobile = useMediaQuery("(max-width: 1023px)");

  const {
    isSidebarOpen,
  } = useUIContext();

  const { theme } = useTheme();

  // set maxVal
  useEffect(() => {
    if (!data) return;

    setMaxVal(
      Math.max(
        ...Object.keys(data.chains)
          .filter(
            (chain) =>
              Object.keys(EnabledChainsByKeys).includes(chain) &&
              EnabledChainsByKeys[chain].chainType != null &&
              EnabledChainsByKeys[chain].chainType != "L1" &&
              data.chains[chain].users > 0,
          )
          .map((chain) => {
            return data.chains[chain].users > 0
              ? data.chains[chain].users
              : -1;
          }),
      ),
    );
  }, [data, data.chains, showUsd]);

  const lastValsByChainKey = useMemo(() => {
    if (!data) return {};
    return Object.keys(data.chains)
      .filter((chain) => {
        return Object.keys(EnabledChainsByKeys).includes(chain);
      })
      .reduce((acc, chain) => {
        acc[chain] =
          data.chains[chain].users > 0
            ? data.chains[chain].users
            : -1;
        return acc;
      }, {});
  }, [data]);

  const rows = useCallback(() => {
    if (!data) return [];
    return Object.keys(data.chains)
      .filter((chain) => {
        return (
          Object.keys(EnabledChainsByKeys).includes(chain) &&
          data.chains[chain].users > 0
        );
      })
      .map((chain: any) => {
        return {
          data: data[chain],
          chain: EnabledChainsByKeys[chain],
          lastVal: data.chains[chain].users
        };
      })
      .filter(
        (row) => row.chain.chainType != null && row.chain.chainType != "L1",
      )
      .sort((a, b) => {
        // // always show multiple at the bottom
        // if (a.chain.key === "multiple") return 1;
        // if (b.chain.key === "multiple") return -1;

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
  }, [data, lastValsByChainKey, selectedChains]);

  let height = 0;
  const transitions = useTransition(
    rows()
      // .filter((row) => row.chain.key != "multiple")
      .map((data) => ({
        ...data,
        y: (height += isMobile ? 43 : 39) - (isMobile ? 43 : 39),
        height: isMobile ? 43 : 39,
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

  const monthsSinceLaunch = useMemo(() => {
    let result = {};
    for (const chain of Object.keys(master.chains)) {
      const diff = moment.duration(
        moment().diff(moment(master.chains[chain].launch_date)),
      );
      result[chain] = [diff.years(), diff.months()];
    }
    return result;
  }, [master]);

  return (
    <>
      <div className={`flex flex-col space-y-[5px] overflow-y-hidden overflow-x-scroll ${isSidebarOpen ? "2xl:overflow-x-hidden" : "min-[1168px]:overflow-x-hidden"} z-100 w-full p-0 pt-3 pb-2 md:pb-0 lg:px-0 md:pt-2 scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller`}>
        <div
          className={`min-w-[920px] min-[1168px]:min-w-[980px] pr-[20px] ${isSidebarOpen ? "2xl:pr-[50px]" : "min-[1168px]:pr-[50px]"}  w-full`}
        >
          <div
            className={`flex items-end rounded-full font-semibold text-[0.6rem] lg:text-sm pr-0 py-1`}
          >
            <div className="w-[20%] pl-[59px] lg:pl-[64px]">Chain</div>
            <div className="w-[10%]">Age</div>
            <div className="w-[20%]">Purpose</div>
            <div className="w-[20%]">Technology</div>
            <div className="w-[15%] text-right capitalize relative pr-[60px] lg:pr-8">
              <div className="flex flex-col items-end"><div className="whitespace-nowrap">Weekly Active</div>Addresses</div>
              <Tooltip placement="left">
                <TooltipTrigger className="absolute right-[26px] lg:-right-[2px] top-0 bottom-0">
                  <Icon icon="feather:info" className="w-6 h-6" />
                </TooltipTrigger>
                <TooltipContent className="z-[110]">
                  <div className="p-3 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg w-[420px] flex flex-col">
                    <div>
                      Number of Distinct Weekly Active Addresses minus the Addresses with Cross-Chain Activity.
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="w-[15%] pr-14 text-right relative">
              <div className="flex flex-col items-end"><div className="whitespace-nowrap">Cross-Chain</div>Activity</div>
              <Tooltip placement="left">
                <TooltipTrigger className="absolute right-[22px] top-0 bottom-0">
                  <Icon icon="feather:info" className="w-6 h-6" />
                </TooltipTrigger>
                <TooltipContent className="z-[110]">
                  <div className="p-3 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg w-[420px] flex flex-col">
                    <div>
                      Number of Distinct Weekly Active Addresses minus the Addresses with Cross-Chain Activity.
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip></div>
          </div>
          <div className="flex flex-col">
            <div className="w-full relative" style={{ height }}>
              {transitions((style, item, t, index) => {
                return (
                  <animated.div
                    className="absolute w-full"
                    style={{
                      zIndex: rows().length - index,
                      ...style,
                    }}
                  >
                    <div
                      key={item.chain.key}
                      className={`flex items-center  ${interactable ? "cursor-pointer pointer-events-auto" : "cursor-default pointer-events-none"} pl-0 pr-0 py-[10px] sm:py-[10px] md:py-[9px] lg:pl-0 lg:py-[4px] rounded-full w-full font-[400] border-[1px] whitespace-nowrap text-xs lg:text-[0.95rem] relative ${index > 0 ? "-mt-[1px]" : ""
                        } ${selectedChains.includes(item.chain.key)
                          ? "border-black/[16%] dark:border-[#5A6462] hover:bg-forest-500/10"
                          : "border-black/[16%] dark:border-[#5A6462] hover:bg-forest-500/5 transition-all duration-100"
                        }`}
                      onClick={() => {
                        if (selectedChains.includes(item.chain.key)) {
                          setSelectedChains(
                            selectedChains.filter((c) => c !== item.chain.key),
                          );
                        } else {
                          setSelectedChains([
                            ...selectedChains,
                            item.chain.key,
                          ]);
                        }
                      }}
                      style={{
                        color: selectedChains.includes(item.chain.key)
                          ? undefined
                          : "#5A6462",
                      }}
                    >
                      {/* <div
                        className={`absolute -bottom-[6px] right-0 h-1 bg-forest-900 dark:bg-forest-50 rounded-none`}
                        style={{
                          background: item.chain.colors[theme ?? "dark"][1],
                          width: `${
                            (data.chains[item.chain.key].data.data[
                              data.chains[item.chain.key].data.data.length - 1
                            ][1] /
                              maxVal) *
                            100
                          }%`,
                        }}
                      ></div> */}
                      <div className="w-full h-full absolute inset-0 rounded-full overflow-clip">
                        <div className="relative w-full h-full">
                          {item.chain.key !== "ethereum" && (
                            <>
                              <div
                                className={`absolute left-[15px] right-[15px] lg:left-[18px] lg:right-[18px] bottom-[1px] h-[1px] md:bottom-0 md:h-[2px] lg:h-[1px] rounded-none font-semibold transition-width duration-300 `}
                                style={{
                                  background: selectedChains.includes(
                                    item.chain.key,
                                  )
                                    ? item.chain.colors[theme ?? "dark"][1]
                                    : "#5A6462",
                                  width: `${(lastValsByChainKey[item.chain.key] /
                                    maxVal) *
                                    100
                                    }%`,
                                }}
                              ></div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex w-[20%] items-center">
                        <div className="relative h-full">
                          {/* <div
                            className={`w-9 h-9 rounded-full border-[5px] ${
                              item.chain.border[theme ?? "dark"][1]
                            }`}
                          ></div> */}
                          <Icon
                            icon={`gtp:${item.chain.urlKey}-logo-monochrome`}
                            className="absolute left-[13.5px] -top-[13.5px] xl:left-[14.5px] xl:-top-[14.5px] w-[27px] h-[27px] xl:w-[29px] xl:h-[29px]"
                            style={{
                              color: selectedChains.includes(item.chain.key)
                                ? item.chain.colors[theme ?? "dark"][1]
                                : "#5A6462",
                            }}
                          />
                          {/* <Icon
                            icon={`gtp:${item.chain.urlKey}-logo-monochrome`}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5"
                            style={{
                              color: item.chain.colors[theme ?? "dark"][1],
                            }}
                          /> */}
                        </div>
                        <div className="break-inside-avoid text-xs md:text-sm lg:text-base pl-[59px] lg:pl-[64px]">
                          {data.chains[item.chain.key].chain_name}
                        </div>
                      </div>
                      <div className="w-[10%] text-right flex">
                        {/* format as 1 year 2 months */}

                        {item.chain.chainType === "L2" && (
                          <>
                            <div className="mr-1">
                              {/* {monthsSinceLaunch[item.chain.key][0] > 0 && (
                                <> */}
                              {monthsSinceLaunch[item.chain.key][0] > 0 ? (
                                monthsSinceLaunch[item.chain.key][0]
                              ) : (
                                <>&nbsp;</>
                              )}
                              <span className="font-[350] text-[9px] md:text-[11px] inline-block pl-0.5">
                                {monthsSinceLaunch[item.chain.key][0] > 0 ? (
                                  monthsSinceLaunch[item.chain.key][0] > 1 ? (
                                    <>Years</>
                                  ) : (
                                    <>
                                      Year<span className="opacity-0">s</span>
                                    </>
                                  )
                                ) : (
                                  <span className="opacity-0">Years</span>
                                )}
                              </span>
                              {/* </>
                              )}{" "} */}
                            </div>
                            <div className="">
                              {monthsSinceLaunch[item.chain.key][1] > 0 ? (
                                <>
                                  {monthsSinceLaunch[item.chain.key][1]}
                                  <span className="font-[350] text-[9px] md:text-[11px] inline-block pl-0.5">
                                    mo.
                                  </span>
                                </>
                              ) : (
                                <>
                                  {item.chain.key === "base" ? "0" : "\u00A0"}
                                  <span className="font-[350] text-[9px] md:text-[11px] inline-block pl-0.5">
                                    {item.chain.key === "base"
                                      ? " mo."
                                      : "\u00A0"}
                                  </span>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="w-[20%] capitalize">
                        {data.chains[item.chain.key].purpose && (
                          <>{data.chains[item.chain.key].purpose}</>
                        )}
                      </div>
                      <div className="w-[20%] capitalize text-left">
                        {item.chain.chainType === "L2" &&

                          data.chains[item.chain.key].rollup === "-" ? (
                          " - "
                        ) : (
                          <>
                            {item.chain.chainType === "L2" && (
                              <>
                                {data.chains[item.chain.key].rollup}{" "}
                                {data.chains[item.chain.key].technology}
                              </>
                            )}
                          </>
                        )}
                      </div>

                      <div className="w-[15%] flex justify-end items-center  pr-[60px] lg:pr-8">
                        {/* <div className="flex flex-1 align-middle items-center"> */}
                        <div className="flex w-full justify-end">
                          {Intl.NumberFormat(undefined, {
                            notation: "compact",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          }).format(lastValsByChainKey[item.chain.key])}
                          {/* <div className="absolute -bottom-[6px] right-0 w-full h-1 bg-black/10 rounded-none"></div>
                          <div
                            className={`absolute -bottom-[6px] right-0 h-1 bg-forest-900 dark:bg-forest-50 rounded-none`}
                            style={{
                              width: `${
                                (data.chains[item.chain.key].data.data[
                                  data.chains[item.chain.key].data.data.length -
                                    1
                                ][1] /
                                  maxVal) *
                                100
                              }%`,
                            }}
                          ></div> */}
                        </div>
                      </div>
                      <div className="w-[15%] text-right pr-14">
                        {d3.format(
                          data.chains[item.chain.key].cross_chain_activity > 0.01
                            ? ".1%"
                            : ".1%",
                        )(data.chains[item.chain.key].cross_chain_activity)}
                      </div>
                      {interactable && (
                        <div className={`absolute  ${"-right-[20px]"}`}>
                          <div
                            className="absolute rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                            style={{
                              color: selectedChains.includes(item.chain.key)
                                ? undefined
                                : "#5A6462",
                            }}
                          >
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
                              className={`w-6 h-6 ${selectedChains.includes(item.chain.key)
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
                          <div
                            className={`p-1 rounded-full ${selectedChains.includes(item.chain.key)
                              ? "bg-white dark:bg-forest-1000"
                              : "bg-forest-50 dark:bg-[#1F2726]"
                              }`}
                          >
                            <Icon
                              icon="feather:check-circle"
                              className={`w-6 h-6 ${selectedChains.includes(item.chain.key)
                                ? "opacity-100"
                                : "opacity-0"
                                }`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </animated.div>
                );
              })}
            </div>
            {/* {rows().length > 0 &&
              rows()
                .filter((row) => row.chain.key === "multiple")
                .map((item, index) => (
                  
                ))} */}
          </div>
        </div>
      </div >
    </>
  );
}
