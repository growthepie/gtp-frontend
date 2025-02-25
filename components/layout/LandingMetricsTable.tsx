"use client";
import {
  GetRankingColor,
  GetRankingScale,
  Get_DefaultChainSelectionKeys,
  Get_SupportedChainKeys,
} from "@/lib/chains";
import { ReactNode, createContext, memo, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
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
import Link from "next/link";
import { useMaster } from "@/contexts/MasterContext";
import { GridTableChainIcon, GridTableHeader, GridTableHeaderCell, GridTableRow } from "./GridTable";
import { LandingURL } from "@/lib/urls";
import useSWR from "swr";
import { LandingPageMetricsResponse } from "@/types/api/LandingPageMetricsResponse";
import { IS_DEVELOPMENT, IS_PREVIEW, IS_PRODUCTION } from "@/lib/helpers";
import { MasterResponse } from "@/types/api/MasterResponse";
import { useRouter } from 'next/navigation'
import { getFundamentalsByKey } from "@/lib/navigation";
import { metricItems } from "@/lib/metrics";
import { GTPIcon, GTPMetricIcon, RankIcon } from "./GTPIcon";
import { useUIContext } from "@/contexts/UIContext";
import { GTPIconName } from "@/icons/gtp-icon-names";

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
    return `${rounded}${Math.abs(number) >= 10000 ? "k" : "k"}`;
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


export default function LandingMetricsTable({
  data,
  master,
  interactable,
}: {
  data: any;
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

        return b.lastVal - a.lastVal;

      });
  }, [data]);

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
      <>
        <GridTableHeader
          gridDefinitionColumns="grid-cols-[26px_125px_190px_95px_minmax(285px,800px)_140px_125px_71px]"
          className="text-[14px] !font-bold gap-x-[15px] z-[2] !pl-[5px] !pr-[15px] !pt-[15px] pb-[5px] select-none overflow-visible"

        >
          <GridTableHeaderCell><></></GridTableHeaderCell>
          <GridTableHeaderCell>Chain</GridTableHeaderCell>
          <GridTableHeaderCell>Purpose</GridTableHeaderCell>
          <GridTableHeaderCell justify="end" className="flex justify-end items-center w-full">
            <div className="w-[65px] text-left flex gap-x-[5px] items-center relative">
              <div>Stage</div>
              <Tooltip placement="right">
                <TooltipTrigger className="absolute  z-[1] right-[5px] top-0 bottom-0">
                  <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                </TooltipTrigger>
                <TooltipContent className="z-[110]">
                  <div className="p-3 text-xs bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex flex-col">
                    <div>
                      I'm happy youre here
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            
          </GridTableHeaderCell>
          <GridTableHeaderCell justify="center">
            <ChainRankHeader />
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
            let maturityExists = master.chains[item.chain.key].maturity !== "NA" && master.chains[item.chain.key].maturity !== undefined;
            let maturityName = maturityExists ? master.maturity_levels[master.chains[item.chain.key].maturity].name.toLowerCase() : "NA";
           
            return (
              <animated.div
                className="absolute w-full"
                style={{
                  zIndex: rows().length - index,
                  ...style,
                }}
              >
                <GridTableRow
                  gridDefinitionColumns="grid-cols-[26px_125px_190px_95px_minmax(285px,800px)_140px_125px_71px]"
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
                    <div
                      className="absolute z-[3] -left-[5px] h-[32px] w-[40px] pl-[9px] flex items-center justify-start rounded-l-full bg-[radial-gradient(circle_at_-32px_16px,_#151A19_0%,_#151A19_72.5%,_transparent_90%)]"
                    >
                      <GridTableChainIcon origin_key={item.chain.key} />
                    </div>
                  </div>
                  <div className="text-xs group-hover:underline">
                    {data.chains[item.chain.key].chain_name}
                  </div>
                  <div className="text-xs w-full ">
                    {data.chains[item.chain.key].purpose && (
                      <>{data.chains[item.chain.key].purpose}</>
                    )}
                  </div>
                  <div className="flex justify-end w-full items-center">
                    <div className="w-[67px] text-left">
                      <GTPIcon  icon={`gtp-layer2-maturity-${maturityName}` as GTPIconName} size="md" />
                    </div>
                  </div>
                  <ChainRankCell item={item} />
                  
                  <div className="flex justify-end items-center">
                    <div className="flex gap-[5px] items-center text-[12px] w-[98px]">
                      <div className="w-1/2 flex justify-end text-right numbers-xs text-[#5A6462]">
                        {(
                          data.chains[item.chain.key].user_share * 100
                        ).toFixed(2)}
                        %
                      </div>
                      <div className="w-1/2 text-right flex justify-end items-center numbers-xs">
                        {Intl.NumberFormat("en-GB", {
                          notation: "compact",
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 0,
                        }).format(lastValsByChainKey[item.chain.key])}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end items-center numbers-xs">
                    {d3.format(
                      data.chains[item.chain.key].cross_chain_activity >
                        0.01
                        ? ".1%"
                        : ".1%",
                    )(data.chains[item.chain.key].cross_chain_activity)}
                  </div>
                  <div className="flex justify-end items-center">
                    {/* {monthsSinceLaunch[item.chain.key][0] && monthsSinceLaunch[item.chain.key][1] % 12 > 0 ? <div className="text-[#5A6462] text-[16px]">+</div> : ""} */}
                    <div className=" numbers-xs">
                      {moment(master.chains[item.chain.key].launch_date).fromNow(
                        true,
                      ).split(" ")[0] === "a" ? "1" : moment(master.chains[item.chain.key].launch_date).fromNow(true).split(" ")[0]}
                      {" "}
                      <span className="numbers-xxs">
                        {moment(master.chains[item.chain.key].launch_date).fromNow(
                          true,
                        ).split(" ")[1]}
                      </span>
                    </div>
                  </div>
                </GridTableRow>
              </animated.div>
            );
          })}
        </div>
        {/* <div className="h-[30px]" /> */}
      </>
    </>
  );
}

const ChainRankHeader = memo(function ChainRankHeader(

) {
  {
    const { hoveredMetric, setHoveredMetric, rankingKeys } = useTableRanking();
    const { data: master } = useMaster();

    if (!master) return null;

    return (
      <div className="flex items-center gap-x-[10px] px-[10px] h-[36px] rounded-full bg-[#1F2726] z-[1] relative overflow-visible">
        {rankingKeys.map((metric) => {
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
              <GTPMetricIcon key={metric} icon={metric} size={hoveredMetric === metric ? "md" : "sm"} className="absolute z-[2]" />
              <div className={`absolute -inset-[10.5px] bg-[#151A19] border border-[#5A6462] rounded-full z-[1] ${hoveredMetric === metric ? "opacity-100" : "opacity-0"}`} />
              <div className={`absolute -top-[44px] z-[11] w-[200px] h-[30px] flex items-end justify-center pointer-events-none ${hoveredMetric === metric ? "opacity-100" : "opacity-0"}`}>
                <div
                  className="text-[10px] leading-[120%] text-center font-bold"
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
    )
  }
});


const ChainRankCell = memo(function ChainRankIcon(
  { item }: {
    item: any,
  }
) {
  const { hoveredMetric, setHoveredMetric, rankingKeys } = useTableRanking();

  const { data: landing } = useSWR<LandingPageMetricsResponse>(LandingURL);
  const { data: master } = useMaster();

  const router = useRouter();
  const { isMobile } = useUIContext();

  const [selectedFundamentalsChains, setSelectedFundamentalsChains] = useSessionStorage(
    "fundamentalsChains",
    master ? [...Get_DefaultChainSelectionKeys(master), "ethereum"] : [],
  );

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const showGwei = false;

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

    let rawValue = values[types.indexOf(valueKey)];
    let isNegative = rawValue < 0;
    let value = formatNumber(Math.abs(rawValue), decimals);
    let absoluteValue = formatNumber(Math.abs(rawValue), decimals);

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
          absoluteValue = formatNumber(
            Math.abs(values[types.indexOf("value_eth")]) * 1000000000,
            decimals,
          );
        }
      } else {
        value = formatNumber(values[types.indexOf("value_usd")], decimals);
        absoluteValue = formatNumber(
          Math.abs(values[types.indexOf("value_usd")]),
          decimals,
        );
      }
    }
    return { value, prefix, suffix, isNegative, absoluteValue };
  },
    [master, showGwei, showUsd],
  );



  if (!landing)
    return null;

  return (
    <div className="flex justify-center items-center select-none h-full">
      {landing && landing.data.metrics.table_visual[item.chain.key].ranking && (
        <div className="flex items-center justify-end px-[10px] h-full">
          {rankingKeys.map((metric) => {
            const metricRanks = landing ? Object.values(landing.data.metrics.table_visual).map((chain) => chain.ranking[metric].rank).filter((rank) => rank !== null) : [];
            const maxRank = Math.max(...metricRanks)
            const minRank = Math.min(...metricRanks)

            const valueKeys = landing ? Object.keys(landing.data.metrics.table_visual[item.chain.key].ranking[metric]).filter((key) => key.includes("value")) : [];
            const values = landing ? valueKeys.map((key) => landing.data.metrics.table_visual[item.chain.key].ranking[metric][key]) : [];

            const colorScale = landing ? landing.data.metrics.table_visual[item.chain.key].ranking[metric].color_scale : 0;
            return (
              <div
                key={metric}
                className={`relative flex items-start justify-center size-[25px] ${landing.data.metrics.table_visual[item.chain.key].ranking[metric].rank !== null && "cursor-pointer"}`}

              >
                <div
                  className={`absolute -inset-y-[10px] -inset-x-[5px] flex items-start justify-center rounded-full`}
                  onMouseEnter={() => {
                    setHoveredMetric(metric)
                  }}
                  onMouseLeave={() => setHoveredMetric(null)}
                  onClick={(e) => {
                    e.stopPropagation();

                    if (isMobile && hoveredMetric !== metric) return;

                    setSelectedFundamentalsChains((prev: string[]) => {
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
                    <div className="relative h-full w-full">
                      <div
                        className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none"
                        style={{
                          transform:
                            hoveredMetric === metric ?
                              `scale(${GetRankingScale(landing.data.metrics.table_visual[item.chain.key].ranking[metric].rank, [minRank, maxRank], [7.33 / 11, 15 / 11].reverse() as [number, number])})`
                              : "scale(1)",
                          zIndex: hoveredMetric !== metric ? 2 : 4,
                        }}>
                        <RankIcon
                          colorScale={colorScale}
                          size="sm"
                        >
                          <span className="font-mono text-[9px] font-bold text-[#1F2726]">{landing.data.metrics.table_visual[item.chain.key].ranking[metric].rank}</span>
                        </RankIcon>

                      </div>
                      <div
                        className={`absolute inset-0 bg-transparent rounded-full flex items-center justify-end pointer-events-none`}
                      >
                        <div className={`h-[36px] left-[-3px] absolute rounded-full flex items-center justify-center bg-[#151A19] border border-[#5A6462]  ${hoveredMetric === metric ? "opacity-100" : "opacity-0"}`}
                          style={{
                            zIndex: hoveredMetric === metric ? 3 : 0,
                          }}
                        >
                          <div
                            className={`flex w-full items-end justify-end numbers-sm pr-[15px] pl-[37px] ${getDisplayValue(metric, values, valueKeys).suffix ? "min-w-[145px]" : "min-w-[115px]"} `}
                          >
                            {getDisplayValue(metric, values, valueKeys).isNegative && (
                              <div className="">
                                {"-"}
                              </div>
                            )}
                            {getDisplayValue(metric, values, valueKeys).prefix && (
                              <div className="">
                                {getDisplayValue(metric, values, valueKeys).prefix}
                              </div>
                            )}
                            {getDisplayValue(metric, values, valueKeys).absoluteValue}
                            {getDisplayValue(metric, values, valueKeys).suffix && (
                              <div className="pl-[5px]">
                                {getDisplayValue(metric, values, valueKeys).suffix}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="absolute inset-0 rounded-full flex items-center justify-center transition-transform pointer-events-none"
                    >
                      <RankIcon
                        colorScale={-1}
                        size="sm"
                      >
                        {landing.data.metrics.table_visual[item.chain.key].ranking[metric].rank}
                      </RankIcon>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )
      }
    </div >
  );
});



const TableRankingContext = createContext<{
  hoveredMetric: string | null;
  setHoveredMetric: (metric: string | null) => void;
  rankingKeys: string[];
}>({
  hoveredMetric: null,
  setHoveredMetric: () => { },
  rankingKeys: [],
});

export const useTableRanking = () => {
  return useContext(TableRankingContext);
};

export const TableRankingProvider = ({ children }: { children: ReactNode }) => {
  const { data: landing } = useSWR<LandingPageMetricsResponse>(LandingURL);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const rankingKeys = landing ? Object.keys(landing.data.metrics.table_visual[Object.keys(landing.data.metrics.table_visual)[0]].ranking) : [];

  return (
    <TableRankingContext.Provider value={{ hoveredMetric, setHoveredMetric, rankingKeys }}>
      {children}
    </TableRankingContext.Provider>
  );
};