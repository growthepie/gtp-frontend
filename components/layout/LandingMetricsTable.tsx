"use client";
import {
  GetRankingColor,
  GetRankingScale,
  Get_DefaultChainSelectionKeys,
  // AllChainsByKeys,
  // EnabledChainsByKeys,
  Get_SupportedChainKeys,
} from "@/lib/chains";
import Image from "next/image";
import { createRef, useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage, useMediaQuery, useSessionStorage } from "usehooks-ts";
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
import GTPIcon, { GTPMetricIcon } from "./GTPIcon";
import { LandingURL } from "@/lib/urls";
import useSWR from "swr";
import { LandingPageMetricsResponse } from "@/types/api/LandingPageMetricsResponse";
import { IS_DEVELOPMENT, IS_PREVIEW } from "@/lib/helpers";
import { MasterResponse } from "@/types/api/MasterResponse";
import { useRouter } from 'next/navigation'
import { getFundamentalsByKey } from "@/lib/navigation";
import { metricItems } from "@/lib/metrics";

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
  master: MasterResponse;
  interactable: boolean;
}) {
  const { AllChainsByKeys, EnabledChainsByKeys } = useMaster();
  const { data: landing } = useSWR<LandingPageMetricsResponse>(LandingURL);

  const [maxVal, setMaxVal] = useState(0);

  const { theme } = useTheme();
  const router = useRouter()

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
        y: (height += 39) - 39,
        height: 39,
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


  const [hoveredChain, setHoveredChain] = useState<string | null>(null);

  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const [selectedFundamentalsChains, setSelectedFundamentalsChains] = useSessionStorage(
    "fundamentalsChains",
    [...Get_DefaultChainSelectionKeys(master), "ethereum"],
  );

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const showGwei = false;

  function formatNumber(number: number, decimals?: number): string {
    if (number === 0) {
      return "0";
    } else if (Math.abs(number) >= 1e9) {
      if (Math.abs(number) >= 1e12) {
        return (number / 1e12).toFixed(2) + "T";
      } else if (Math.abs(number) >= 1e9) {
        return (number / 1e9).toFixed(2) + "B";
      }
    } else if (Math.abs(number) >= 1e6) {
      return (number / 1e6).toFixed(2) + "M";
    } else if (Math.abs(number) >= 1e3) {
      const rounded = (number / 1e3).toFixed(2);
      return `${rounded}${Math.abs(number) >= 10000 ? "K" : "K"}`;
    } else if (Math.abs(number) >= 100) {
      return number.toFixed(decimals ? decimals : 2);
    } else if (Math.abs(number) >= 10) {
      return number.toFixed(decimals ? decimals : 2);
    } else {
      return number.toFixed(decimals ? decimals : 2);
    }

    // Default return if none of the conditions are met
    return "";
  }

  const getDisplayValue = useCallback((metric_id: string, metric_values: number[], value_keys: string[]) => {
    if (!master) return { value: "0", prefix: "", suffix: "" };

    const units = Object.keys(master.metrics[metric_id].units);
    const unitKey =
      units.find((unit) => unit !== "usd" && unit !== "eth") ||
      (showUsd ? "usd" : "eth");
    const valueKey = value_keys.includes("value_eth") ? "value_eth" : "value";

    let prefix = master.metrics[metric_id].units[unitKey].prefix
      ? master.metrics[metric_id].units[unitKey].prefix
      : "";
    let suffix = master.metrics[metric_id].units[unitKey].suffix
      ? master.metrics[metric_id].units[unitKey].suffix
      : "";
    let decimals =
      showGwei && !showUsd
        ? 2
        : master.metrics[metric_id].units[unitKey].decimals;

    let types = value_keys;
    let values = metric_values;


    // if (lastValueTimeIntervalKey === "monthly") {
    //   types = item.data.last_30d.types;
    //   values = item.data.last_30d.data;
    //   // value = formatNumber(values[0]);
    // }

    console.log("types", types);
    console.log("values", values);

    let value = formatNumber(values[types.indexOf(valueKey)], decimals);

    if (types.includes("value_eth")) {
      if (!showUsd) {
        let navItem = metricItems.find((item) => item.key === metric_id);

        if (navItem && navItem.page?.showGwei) {
          decimals = 2;
          prefix = "";
          suffix = " Gwei";
          value = formatNumber(
            values[types.indexOf("value_eth")] * 1000000000,
            decimals,
          );
        }
      } else {
        value = formatNumber(values[types.indexOf("value_usd")], decimals);
      }
    }
    return { value, prefix, suffix };
  },
    [master, showGwei, showUsd],
  );


  return (
    <>
      {(IS_DEVELOPMENT || IS_PREVIEW) && (
        <>
          <GridTableHeader
            gridDefinitionColumns="grid-cols-[26px_125px_190px_minmax(100px,800px)_140px_125px_71px]"
            className="text-[14px] !font-bold gap-x-[15px] z-[2] !pl-[5px] !pr-[15px] !pt-[15px] pb-[5px] select-none overflow-visible"

          >
            <GridTableHeaderCell><></></GridTableHeaderCell>
            <GridTableHeaderCell>Chain</GridTableHeaderCell>
            <GridTableHeaderCell>Purpose</GridTableHeaderCell>
            <GridTableHeaderCell justify="center">

              <div className="flex items-center gap-x-[10px] px-[15px] h-[36px] rounded-full bg-[#1F2726] z-[1] relative overflow-visible">
                {["daa", "throughput", "stables_mcap", "txcosts", "fees", "profit", "fdv"].map((metric) => {
                  return (
                    <div className="relative flex items-center justify-center size-[15px] cursor-pointer"
                      key={metric}
                      onMouseEnter={() => {
                        setHoveredMetric(metric)
                      }}
                      onMouseLeave={() => {
                        setHoveredMetric(null)
                      }}
                    >
                      <GTPMetricIcon key={metric} icon={metric} size="sm" className="z-[2]" />
                      <div className={`absolute -inset-[10.5px] bg-[#151A19] border border-[#5A6462] rounded-full z-[1] ${hoveredMetric === metric ? "opacity-100" : "opacity-0"}`} />
                      <div className={`absolute -top-[44px] z-[11] w-[200px] h-[30px] flex items-end justify-center pointer-events-none ${hoveredMetric === metric ? "opacity-100" : "opacity-0"}`}>
                        <div
                          className="text-[8.5px] leading-[120%] text-center font-bold"
                          style={{
                            textTransform: "uppercase",

                          }}
                        >
                          {master.metrics[metric].name}
                        </div>

                      </div>
                    </div>

                  );
                })}
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
                    className="relative group text-[14px] gap-x-[15px] z-[2] !pl-[5px] !pr-[15px] select-none h-[34px] !pb-0 !pt-0"
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
                    onClick={() => {
                      router.push(`/chains/${item.chain.urlKey}`);
                    }}
                  >
                    <div className="sticky z-[3] -left-[12px] md:-left-[48px] w-[26px] flex items-center justify-center overflow-visible">
                      <div className="absolute z-[3] -left-[5px] h-[32px] w-[40px] pl-[9px] flex items-center justify-start rounded-l-full bg-gradient-to-r from-forest-1000 via-forest-1000 to-transparent">
                        <GridTableChainIcon origin_key={item.chain.key} />
                      </div>
                    </div>
                    <div className="text-[14px] group-hover:underline">
                      {data.chains[item.chain.key].chain_name}
                    </div>
                    <div className="text-[12px]">
                      {data.chains[item.chain.key].purpose && (
                        <>{data.chains[item.chain.key].purpose}</>
                      )}
                    </div>
                    <div className="flex justify-center items-center select-none" onMouseEnter={() => setHoveredChain(item.chain.key)} onMouseLeave={() => setHoveredChain(null)}>
                      {landing && landing.data.metrics.table_visual[item.chain.key].ranking && (
                        <div className="flex items-center justify-end px-[15px]">
                          {["daa", "throughput", "stables_mcap", "txcosts", "fees", "profit", "fdv"].map((metric) => {

                            const metricRanks = Object.values(landing.data.metrics.table_visual).map((chain) => chain.ranking[metric].rank).filter((rank) => rank !== null)
                            const maxRank = Math.max(...metricRanks)
                            const minRank = Math.min(...metricRanks)

                            const valueKeys = Object.keys(landing.data.metrics.table_visual[item.chain.key].ranking[metric]).filter((key) => key.includes("value"));
                            const valueKey = valueKeys.includes("value_eth") ? "value_eth" : "value";
                            const values = valueKeys.map((key) => landing.data.metrics.table_visual[item.chain.key].ranking[metric][key]);
                            // const maxValue = Math.max(...values)
                            // const minValue = Math.min(...values)

                            const color = GetRankingColor(landing.data.metrics.table_visual[item.chain.key].ranking[metric].color_scale * 100);

                            const ref = createRef<SVGElement>();

                            return (
                              <div
                                key={metric}
                                className={`relative flex items-start justify-center size-[25px] ${landing.data.metrics.table_visual[item.chain.key].ranking[metric].rank !== null && "cursor-pointer"}`}

                              >
                                <div
                                  className={`absolute w-[25px] h-[37px] -top-[5px] pt-[2px] flex items-start justify-center rounded-full`}
                                  onMouseEnter={() => {
                                    setHoveredMetric(metric)
                                  }}
                                  onMouseLeave={() => setHoveredMetric(null)}
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    setSelectedFundamentalsChains((prev) => {
                                      if (!prev.includes(item.chain.key)) {
                                        return [...prev, item.chain.key];
                                      }
                                      return prev;
                                    });

                                    // navigate to fundamentals page
                                    router.push(`/fundamentals/${getFundamentalsByKey[metric].urlKey}`);
                                  }}

                                >
                                  {landing.data.metrics.table_visual[item.chain.key].ranking[metric].rank !== null ? (
                                    <div className="relative w-[25px] h-[37px]">
                                      <div
                                        className="absolute left-[-3px] size-[30px] rounded-full flex items-center justify-center pointer-events-none"
                                        style={{
                                          transform:
                                            hoveredMetric === metric ?
                                              `scale(${GetRankingScale(landing.data.metrics.table_visual[item.chain.key].ranking[metric].rank, [minRank, maxRank], [7.33 / 11, 15 / 11].reverse() as [number, number])})`
                                              : "scale(1)",
                                          zIndex: hoveredMetric !== metric ? 2 : 4,
                                        }}>
                                        <div className="size-[15px] rounded-full flex items-center justify-center border transition-colors"
                                          style={{
                                            borderColor: hoveredMetric !== null && hoveredMetric != metric ? "#344240" : color + "7F",
                                          }}>
                                          <div className="size-[11px] rounded-full flex items-center justify-center transition-colors"
                                            style={{
                                              background: hoveredMetric !== null && hoveredMetric != metric ? "#344240" : color,
                                            }}>
                                            <div className="absolute inset-0 flex items-center justify-center font-mono text-[8px] font-bold text-[#1F2726]">
                                              {landing.data.metrics.table_visual[item.chain.key].ranking[metric].rank}
                                            </div>
                                          </div>
                                        </div>

                                      </div>
                                      <div
                                        className={`absolute -left-[6px] -top-[2.5px] w-[36px] h-[36px] bg-transparent rounded-full flex items-center justify-center pointer-events-none`}
                                      >
                                        <div className={`absolute rounded-full flex items-center justify-center bg-[#151A19] border border-[#5A6462]  ${hoveredMetric === metric ? "opacity-100" : "opacity-0"}`}
                                          style={{
                                            left: "0px",
                                            // transform: hoveredMetric === metric ? "translate(32px, 0)" : "translate(0, 0)",
                                            // transform: "translate(32px, 0)",
                                            // transition: hoveredMetric === metric ? "all 0.3s ease-in-out" : "all 0.1s ease-in-out",
                                            // transitionDelay: hoveredMetric === metric ? "0.6s" : "0s",
                                            // width: hoveredMetric === metric ? "100px" : "7.5px",
                                            // height: hoveredMetric === metric ? "36px" : "7.5px",
                                            // width: "100px",
                                            height: "36px",
                                            zIndex: hoveredMetric === metric ? 3 : 0,
                                            transformOrigin: "10% 50%",
                                          }}>
                                          <div
                                            className="flex w-full items-baseline text-[14px] font-bold font-raleway pl-[37px] pr-[15px] min-w-[100px]"
                                            style={{
                                              //     font- variant - numeric: tabular-nums;
                                              // -moz-font-feature-settings: "tnum";
                                              // -webkit-font-feature-settings: "tnum";
                                              // font-feature-settings: "tnum";
                                              fontVariantNumeric: "tabular-nums",
                                              WebkitFontFeatureSettings: "'tnum'",
                                              MozFontFeatureSettings: "'tnum'",
                                              fontFeatureSettings: "'tnum' on, 'lnum' on, 'pnum' on",
                                            }}
                                          >

                                            {getDisplayValue(metric, values, valueKeys).prefix && (
                                              <div className="">
                                                {getDisplayValue(metric, values, valueKeys).prefix}
                                              </div>
                                            )}
                                            {getDisplayValue(metric, values, valueKeys).value}
                                            {getDisplayValue(metric, values, valueKeys).suffix && (
                                              <div className="pl-[5px] font-raleway font-medium">
                                                {getDisplayValue(metric, values, valueKeys).suffix}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className="relative size-[30px] rounded-full flex items-center justify-center transition-transform pointer-events-none"
                                    >
                                      <div
                                        className="size-[10px] rounded-full flex items-center justify-center"
                                        style={{
                                          background: "#1F272666",
                                          transform: hoveredMetric === metric ? "scale(1.1)" : "scale(1)"
                                        }}>

                                      </div>
                                    </div>
                                  )}
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

      )
      }
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
