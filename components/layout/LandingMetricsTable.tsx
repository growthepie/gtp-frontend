import {
  GetRankingColor,
  // AllChainsByKeys,
  // EnabledChainsByKeys,
  Get_SupportedChainKeys,
} from "@/lib/chains";
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
import Link from "next/link";
import { useMaster } from "@/contexts/MasterContext";
import { GridTableChainIcon, GridTableContainer, GridTableHeader, GridTableHeaderCell, GridTableRow } from "./GridTable";
import HorizontalScrollContainer from "../HorizontalScrollContainer";
import GTPIcon from "./GTPIcon";
import { LandingURL } from "@/lib/urls";
import useSWR from "swr";
import { LandingPageMetricsResponse } from "@/types/api/LandingPageMetricsResponse";
import { IS_DEVELOPMENT, IS_PREVIEW } from "@/lib/helpers";

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
  const { AllChainsByKeys, EnabledChainsByKeys } = useMaster();
  const { data: landing } = useSWR<LandingPageMetricsResponse>(LandingURL);

  const [maxVal, setMaxVal] = useState(0);

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
            return data.chains[chain].users > 0 ? data.chains[chain].users : -1;
          }),
      ),
    );
  }, [data, data.chains]);

  const lastValsByChainKey = useMemo(() => {
    if (!data) return {};
    return Object.keys(data.chains)
      .filter((chain) => {
        return Object.keys(EnabledChainsByKeys).includes(chain);
      })
      .reduce((acc, chain) => {
        acc[chain] =
          data.chains[chain].users > 0 ? data.chains[chain].users : -1;
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
          lastVal: data.chains[chain].users,
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
  }, [data, selectedChains]);

  let height = 0;
  const transitions = useTransition(
    rows()
      .filter((row) => {
        const name = row.chain.key;
        const supportedChainKeys = Get_SupportedChainKeys(master);
        return supportedChainKeys.includes(name);
      })
      .map((data) => ({
        ...data,
        y: (height += 37) - 37,
        height: 37,
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
      {(IS_DEVELOPMENT || IS_PREVIEW) && (
        <>
          <GridTableHeader
            gridDefinitionColumns="grid-cols-[26px_125px_190px_minmax(100px,800px)_140px_125px_71px]"
            className="text-[14px] !font-bold gap-x-[15px] z-[2] !pl-[5px] !pr-[15px] !pt-[15px] pb-[3px] select-none"

          >
            <GridTableHeaderCell><></></GridTableHeaderCell>
            <GridTableHeaderCell>Chain</GridTableHeaderCell>
            <GridTableHeaderCell>Purpose</GridTableHeaderCell>
            <GridTableHeaderCell justify="center">
              <div className="flex items-center gap-x-[10px] px-[15px] h-[36px] rounded-full bg-[#1F2726]">
                {/* ["daa", "throughput", "stables_mcap", "txcosts", "fees", "profit", "fdv"] */}
                <GTPIcon icon="gtp-metrics-activeaddresses" size="sm" />
                {/* <GTPIcon icon="gtp-metrics-transactioncount" size="sm" /> */}
                <GTPIcon icon="gtp-metrics-throughput" size="sm" />
                <GTPIcon icon="gtp-metrics-stablecoinmarketcap" size="sm" />
                {/* <GTPIcon icon="gtp-metrics-totalvaluelocked" size="sm" /> */}
                <GTPIcon icon="gtp-metrics-transactioncosts" size="sm" />
                <GTPIcon icon="gtp-metrics-feespaidbyusers" size="sm" />
                {/* <GTPIcon icon="gtp-metrics-rentpaidtol1" size="sm" /> */}
                <GTPIcon icon="gtp-metrics-onchainprofit" size="sm" />
                <GTPIcon icon="gtp-metrics-fdv" size="sm" />
                {/* <GTPIcon icon="gtp-metrics-marketcap" size="sm" /> */}
              </div>
            </GridTableHeaderCell>
            <GridTableHeaderCell className="relative" justify="end">
              <div className="flex flex-col items-end">
                <div className="whitespace-nowrap">Weekly Active</div>Addresses
              </div>
              <Tooltip placement="left">
                <TooltipTrigger className="absolute z-[1] -right-[25px] top-0 bottom-0">
                  <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                </TooltipTrigger>
                <TooltipContent className="z-[110]">
                  <div className="p-3 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex flex-col">
                    <div>
                      Number of distinct active addresses in last 7 days and share
                      of total L2 addresses.
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </GridTableHeaderCell>
            <GridTableHeaderCell className="relative" justify="end">
              <div className="flex flex-col items-end">
                <div className="whitespace-nowrap">Cross-Chain</div>Activity
              </div>
              <Tooltip placement="left">
                <TooltipTrigger className="absolute  z-[1] -right-[25px] top-0 bottom-0">
                  <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                </TooltipTrigger>
                <TooltipContent className="z-[110]">
                  <div className="p-3 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex flex-col">
                    <div>
                      Percentage of active addresses that also interacted with
                      other chains in the last 7 days.
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </GridTableHeaderCell>
            <GridTableHeaderCell justify="end">Age</GridTableHeaderCell>
          </GridTableHeader>
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
                  <GridTableRow
                    gridDefinitionColumns="grid-cols-[26px_125px_190px_minmax(100px,800px)_140px_125px_71px]"
                    className="relative text-[14px] gap-x-[15px] z-[2] !pl-[5px] !pr-[15px] select-none h-[34px] !pb-0 !pt-0"
                    bar={{
                      origin_key: item.chain.key,
                      width: lastValsByChainKey[item.chain.key] / maxVal,
                      containerStyle: {
                        left: 22,
                        right: 1,
                        top: 0,
                        bottom: 0,
                        borderRadius: "0 9999px 9999px 0",
                        zIndex: -1,
                        overflow: "hidden",
                      },
                    }}
                  >
                    <div className="sticky -left-[12px] md:-left-[48px] w-[26px] flex items-center justify-center overflow-visible">
                      <div className="absolute -left-[5px] h-[32px] w-[40px] pl-[9px] flex items-center justify-start rounded-l-full bg-gradient-to-r from-forest-1000 via-forest-1000 to-transparent">
                        <GridTableChainIcon origin_key={item.chain.key} />
                      </div>
                    </div>
                    <div>
                      {data.chains[item.chain.key].chain_name}
                    </div>
                    <div className="text-[12px]">
                      {data.chains[item.chain.key].purpose && (
                        <>{data.chains[item.chain.key].purpose}</>
                      )}
                    </div>
                    <div className="flex justify-center items-center">
                      {landing && landing.data.metrics.table_visual[item.chain.key].ranking && (
                        <div className="flex items-center justify-end gap-x-[10px] px-[15px]">
                          {["daa", "throughput", "stables_mcap", "txcosts", "fees", "profit", "fdv"].map((metric) => {

                            if (landing.data.metrics.table_visual[item.chain.key].ranking[metric].rank === null) return (
                              <div
                                key={metric}
                                className="flex items-center justify-center w-[15px] h-[15px]"
                              >
                                <div
                                  key={metric}
                                  className="size-[10px] rounded-full flex items-center justify-center"
                                  style={{
                                    background: "#1F272666"
                                  }}>

                                </div>
                              </div>
                            )

                            return (
                              <div
                                key={metric}
                                className="flex items-center justify-center w-[15px] h-[15px]"
                              >
                                <div
                                  key={metric}
                                  className="size-[10px] rounded-full flex items-center justify-center"
                                  style={{
                                    background: GetRankingColor(landing.data.metrics.table_visual[item.chain.key].ranking[metric].color_scale * 100) + "ff"
                                  }}>
                                  <div
                                    className="text-[6.5px] text-[#1F2726] font-black"

                                  >
                                    {landing.data.metrics.table_visual[item.chain.key].ranking[metric].rank}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                      )}
                    </div>
                    <div className="flex justify-end items-center">
                      <div className="flex justify-between items-center text-[12px] w-[88px]">
                        <div className="text-[10px] text-[#5A6462]">
                          {(
                            data.chains[item.chain.key].user_share * 100
                          ).toFixed(2)}
                          %
                        </div>
                        <div className="flex items-center">
                          {Intl.NumberFormat("en-GB", {
                            notation: "compact",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 0,
                          }).format(lastValsByChainKey[item.chain.key])}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end items-center text-[12px]">
                      {d3.format(
                        data.chains[item.chain.key].cross_chain_activity >
                          0.01
                          ? ".1%"
                          : ".1%",
                      )(data.chains[item.chain.key].cross_chain_activity)}
                    </div>
                    <div className="flex justify-end items-center">
                      {/* {monthsSinceLaunch[item.chain.key][0] && monthsSinceLaunch[item.chain.key][1] % 12 > 0 ? <div className="text-[#5A6462] text-[16px]">+</div> : ""} */}
                      <div className="text-[12px]">
                        {moment(master.chains[item.chain.key].launch_date).fromNow(
                          true,
                        )}
                      </div>
                    </div>
                  </GridTableRow>
                </animated.div>
              );
            })}
          </div>
          <div className="h-[30px]" />
        </>

      )}
      {/* <div className={`flex flex-col space-y-[5px] overflow-y-hidden overflow-x-scroll ${isSidebarOpen ? "2xl:overflow-x-hidden" : "min-[1168px]:overflow-x-hidden"} z-100 w-full p-0 pt-3 pb-2 md:pb-0 lg:px-0 md:pt-2 scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller`}> */}
      < div className={`flex flex-col min-w-[1024px] w-full gap-y-[5px]`
      }>
        <div
          className={`h-[40px] flex items-center rounded-full font-semibold text-[0.6rem] text-sm leading-[1.2]`}
        >
          <div className="w-[25%] pl-[59px] lg:pl-[64px]">Chain</div>
          <div className="w-[12%] pl-1.5 xl:pl-8">Age</div>
          <div className="w-[23%]">Purpose</div>
          <div className="w-[12%]">Technology</div>
          <div className="w-[13%] text-right capitalize relative pr-[60px] lg:pr-8">
            <div className="flex flex-col items-end">
              <div className="whitespace-nowrap">Weekly Active</div>Addresses
            </div>
            <Tooltip placement="left">
              <TooltipTrigger className="absolute right-[26px] lg:-right-[2px] top-0 bottom-0">
                <Icon icon="feather:info" className="w-6 h-6" />
              </TooltipTrigger>
              <TooltipContent className="z-[110]">
                <div className="p-3 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex flex-col">
                  <div>
                    Number of distinct active addresses in last 7 days and share
                    of total L2 addresses.
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="w-[15%] pr-14 text-right relative">
            <div className="flex flex-col items-end">
              <div className="whitespace-nowrap">Multi-Chain</div>Activity
            </div>
            <Tooltip placement="left">
              <TooltipTrigger className="absolute right-[22px] top-0 bottom-0">
                <Icon icon="feather:info" className="w-6 h-6" />
              </TooltipTrigger>
              <TooltipContent className="z-[110]">
                <div className="p-3 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex flex-col">
                  <div>
                    Percentage of active addresses that also interacted with
                    other chains in the last 7 days.
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
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
                  <Link
                    key={item.chain.key}
                    href={`/chains/${AllChainsByKeys[item.chain.key].urlKey}`}
                  >
                    <div
                      className={`group flex items-center  ${!interactable
                        ? "cursor-pointer pointer-events-auto"
                        : "cursor-default pointer-events-none"
                        } h-[34px] rounded-full w-full border-[1px] whitespace-nowrap relative ${selectedChains.includes(item.chain.key)
                          ? "border-black/[16%] dark:border-[#5A6462] hover:bg-forest-500/10"
                          : "border-black/[16%] dark:border-[#5A6462] hover:bg-forest-500/5 transition-all duration-100"
                        }`}
                      // onClick={() => {
                      //   if (selectedChains.includes(item.chain.key)) {
                      //     setSelectedChains(
                      //       selectedChains.filter((c) => c !== item.chain.key),
                      //     );
                      //   } else {
                      //     setSelectedChains([
                      //       ...selectedChains,
                      //       item.chain.key,
                      //     ]);
                      //   }
                      // }}
                      style={{
                        color: selectedChains.includes(item.chain.key)
                          ? undefined
                          : "#5A6462",
                      }}
                    >
                      <div className="w-full h-full absolute inset-0 rounded-full overflow-clip">
                        <div className="relative w-full h-full p-[15px]">
                          {item.chain.key !== "ethereum" && (
                            <div
                              className={`absolute right-[10px] left-[10px] bottom-0`}
                            >
                              <div
                                className={`absolute bottom-0 h-[2px] rounded-none font-semibold transition-width duration-300 `}
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
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="relative h-full flex w-[25%] items-center">
                        <div className="absolute top-0 bottom-0 flex items-center left-[21px]">
                          <Icon
                            icon={`gtp:${item.chain.urlKey}-logo-monochrome`}
                            className="h-[24px] w-[24px]"
                            style={{
                              color: selectedChains.includes(item.chain.key)
                                ? item.chain.colors[theme ?? "dark"][1]
                                : "#5A6462",
                            }}
                          />
                        </div>
                        <div className="group-hover:underline break-inside-avoid text-base pl-[59px] lg:pl-[64px] leading-tight">
                          {data.chains[item.chain.key].chain_name}
                        </div>
                      </div>
                      <div className="w-[12%] text-right flex text-sm justify-start items-end leading-[1.4] gap-x-1 pr-10">
                        <div className="ml-auto">
                          {monthsSinceLaunch[item.chain.key][0] || ""}
                        </div>
                        <div className="text-xs font-[350] flex items-end">
                          {monthsSinceLaunch[item.chain.key][0] === 0 && ""}
                          {monthsSinceLaunch[item.chain.key][0] === 1 && (
                            <div className="pr-1.5">Year</div>
                          )}
                          {monthsSinceLaunch[item.chain.key][0] > 1 && "Years"}
                        </div>
                        <div>{monthsSinceLaunch[item.chain.key][1] || ""}</div>
                        <div className="text-xs font-[350]">
                          {monthsSinceLaunch[item.chain.key][1] ? "mo." : ""}
                        </div>
                      </div>
                      <div className="w-[23%] capitalize text-sm">
                        {data.chains[item.chain.key].purpose && (
                          <>{data.chains[item.chain.key].purpose}</>
                        )}
                      </div>
                      <div className="w-[12%] capitalize text-sm">
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

                      <div className="w-[13%] flex justify-end items-center text-sm relative">
                        {/* <div className="flex flex-1 align-middle items-center"> */}
                        <div className="flex w-full justify-end items-center pr-[60px] lg:pr-8 ">
                          <div className="flex items-center">
                            {Intl.NumberFormat("en-GB", {
                              notation: "compact",
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 0,
                            }).format(lastValsByChainKey[item.chain.key])}
                          </div>
                          <div className="absolute flex justify-start w-20">
                            <div className="pl-[90px] leading-[1.8] text-forest-400 text-xs">
                              {" "}
                              {(
                                data.chains[item.chain.key].user_share * 100
                              ).toFixed(1)}
                              %
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-[15%] text-right pr-14 text-sm">
                        {d3.format(
                          data.chains[item.chain.key].cross_chain_activity >
                            0.01
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
                  </Link>
                </animated.div>
              );
            })}
          </div>
        </div>
      </div >
    </>
  );
}
