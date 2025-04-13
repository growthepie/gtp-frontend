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
import { useTransition, animated, useSpring } from "@react-spring/web";
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
import { MasterResponse } from "@/types/api/MasterResponse";
import { useRouter } from 'next/navigation'
import { metricItems } from "@/lib/metrics";
import { GTPIcon, GTPMaturityIcon, GTPMetricIcon, RankIcon } from "./GTPIcon";
import { useUIContext } from "@/contexts/UIContext";
import { SortConfig, sortItems, SortOrder, SortType } from "@/lib/sorter";
import { GTPTooltipNew, TooltipBody, TooltipHeader } from "../tooltip/GTPTooltip";

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

// Define the row type based on your data structure
interface LandingRow {
  data: any;
  chain: any;
  lastVal: number;
}

// Sorter creation function
const createLandingDataSorter = (master: MasterResponse, landing: LandingPageMetricsResponse | undefined, focusEnabled: boolean, centerMetric: string) => {
  return (items: LandingRow[], metric: string, sortOrder: SortOrder): LandingRow[] => {
    const config: SortConfig<LandingRow> = {
      metric: metric as keyof LandingRow,
      sortOrder,
      type: SortType.NUMBER, // Default type, will be overridden as needed
      valueAccessor: (item, met: any) => {
        // Cast 'met' to string to allow comparison with string literals
        const metricKey = met as string;
        
        if (metricKey === "chain_name") {
          return item.data.chain_name;
        } else if (metricKey === "purpose") {
          return item.data.purpose || "";
        } else if (metricKey === "maturity") {
          const maturityExists = master.chains[item.chain.key].maturity !== "NA" && master.chains[item.chain.key].maturity !== undefined;
          return maturityExists ? parseInt(master.chains[item.chain.key].maturity.split("_")[0]) : undefined;
        } else if (metricKey === "table_visual") {
          return focusEnabled
            ? landing?.data.metrics.table_visual[item.chain.key]?.ranking[centerMetric]?.rank ?? Infinity
            : landing?.data.metrics.table_visual[item.chain.key]?.ranking_w_eth[centerMetric]?.rank ?? Infinity;
        } else if (metricKey === "users") {
          return item.data.users;
        } else if (metricKey === "user_share") {
          return item.data.user_share;
        } else if (metricKey === "cross_chain_activity") {
          return item.data.cross_chain_activity;
        } else if (metricKey === "age") {
          return moment(master.chains[item.chain.key].launch_date);
        }
        return item.data[metricKey];
      },
    };

    // Set correct sort type based on metric
    switch (metric) {
      case "chain_name":
      case "purpose":
      
        config.type = SortType.STRING;
        break;
      case "maturity":
      case "table_visual":
      case "users":
      case "user_share":
      case "cross_chain_activity":
        config.type = SortType.NUMBER;
        break;
      case "age":
        config.type = SortType.DATE;
        break;
    }

    return sortItems(items, config);
  };
};

export default memo(function LandingMetricsTable({
  data,
  master,
  interactable,
  sort,
  setSort,
}: {
  data: any;
  master: MasterResponse;
  interactable: boolean;
  sort: { metric: string; sortOrder: "asc" | "desc" };
  setSort: (sort: { metric: string; sortOrder: "asc" | "desc" }) => void;
}) {
  const { AllChainsByKeys, EnabledChainsByKeys } = useMaster();
  const { data: landing } = useSWR<LandingPageMetricsResponse>(LandingURL);
  const [centerMetric, setCenterMetric] = useState("daa");
  const [focusEnabled] = useLocalStorage("focusEnabled", false);
  const [maxVal, setMaxVal] = useState(0);
  const { theme } = useTheme();
  const router = useRouter();



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
          .map((chain) => data.chains[chain].users > 0 ? data.chains[chain].users : -1),
      ),
    );
  }, [data, EnabledChainsByKeys]);

  const lastValsByChainKey = useMemo(() => {
    if (!data) return {};
    return Object.keys(data.chains)
      .filter((chain) => Object.keys(EnabledChainsByKeys).includes(chain))
      .reduce((acc, chain) => {
        acc[chain] = data.chains[chain].users > 0 ? data.chains[chain].users : -1;
        return acc;
      }, {});
  }, [data, EnabledChainsByKeys]);

  const landingDataSorter = useMemo(() => createLandingDataSorter(master, landing, focusEnabled, centerMetric), [master, landing, focusEnabled, centerMetric]);

  const rows = useMemo(() => {
    if (!data || !landing) return [];
    const filteredChains = Object.keys(data.chains)
      .filter((chain) =>
        Object.keys(EnabledChainsByKeys).includes(chain) &&
        (!focusEnabled || chain !== "ethereum") &&
        data.chains[chain].users > 0
      )
      .map((chain) => ({
        data: data.chains[chain],
        chain: EnabledChainsByKeys[chain],
        lastVal: data.chains[chain].users,
      }))
      .filter((row) => row.chain.chainType != null);

    return landingDataSorter(filteredChains, sort.metric, sort.sortOrder as SortOrder);
  }, [data, landing, EnabledChainsByKeys, focusEnabled, sort, landingDataSorter]);

  const monthsSinceLaunch = useMemo(() => {
    return Object.keys(master.chains).reduce((acc, chain) => {
      const diff = moment.duration(moment().diff(moment(master.chains[chain].launch_date)));
      acc[chain] = [diff.years(), diff.months()];
      return acc;
    }, {});
  }, [master]);

  const formatAge = useCallback((chain: string) => {
    // example: 2 years 11 months
    const [years, months] = monthsSinceLaunch[chain];
    if (years > 0 && months > 0) {
      return `${years} years ${months} months`;
    } else if (years > 0) {
      return `${years} years`;
    } else if (months > 0) {
      return `${months} months`;
    }
    return "NA";
  }, [monthsSinceLaunch]);

  return (
    <>
      <GridTableHeader
        gridDefinitionColumns="grid-cols-[26px_125px_190px_95px_minmax(300px,800px)_140px_125px_117px]"
        className="mt-[30px] md:mt-[69px] group heading-small-xs gap-x-[15px] z-[2] !pl-[5px] !pr-[15px] select-none h-[34px] !pb-0 !pt-0"
      >
        <GridTableHeaderCell><></></GridTableHeaderCell>
        <GridTableHeaderCell
          className="group cursor-pointer"
          metric="chain_name"
          sort={sort}
          setSort={setSort}
        >
          Chain
        </GridTableHeaderCell>
        <GridTableHeaderCell
          className="group cursor-pointer"
          metric="purpose"
          sort={sort}
          setSort={setSort}
        >
          Purpose
        </GridTableHeaderCell>
        <GridTableHeaderCell
          justify="start"
          className="relative group cursor-pointer mr-0"
          metric="maturity"
          sort={sort}
          setSort={setSort}
          extraRight={
            <Tooltip placement="right" allowInteract={true}>
              <TooltipTrigger className="absolute right-[10px]">
                <Icon icon="feather:info" className="size-[15px]" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col gap-y-[5px] items-center relative ">
                  <div className="p-[15px] text-xs bg-forest-100 dark:bg-[#1F2726] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex gap-y-[5px] max-w-[460px] flex-col z-50">
                    <span>Network maturity as introduced by ethereum.org. We review the network’s progress towards Ethereum alignment (rollup stages 0-2), 
                    total value secured (TVS), time live in production, and risk considerations. 
                    These levels help track network development and provide a standardized way for the community to evaluate progress.
                    </span>
                    <span> Find out more <a className="underline font-semibold" href="https://ethereum.org/en/layer-2/networks/" target="blankspace" rel="_noopener">here.</a> </span>
                  </div>
                </div>
              </TooltipContent>
          </Tooltip>
          }
        >
          Maturity
        </GridTableHeaderCell>
        <GridTableHeaderCell justify="center" className="relative " extraRight={
          <Tooltip placement="right" allowInteract={false}>
              <TooltipTrigger className="absolute right-[25px]">
                <Icon icon="feather:info" className="size-[15px]" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col gap-y-[5px] items-center relative ">
                  <div className="p-[15px] text-xs bg-forest-100 dark:bg-[#1F2726] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex gap-y-[5px] max-w-[460px] flex-col z-50">
                    Chain ranking based on values of the last complete day of data. 
                    The number in the medals represents the ranking (i.e. 1 means that this chain is currently the leader for the selected metric).
                  </div>
                </div>
              </TooltipContent>
          </Tooltip>
        }>
          <ChainRankHeader setCenterMetric={setCenterMetric} centerMetric={centerMetric} setSort={setSort} sort={sort} />
        </GridTableHeaderCell>
        <GridTableHeaderCell
          justify="end"
          className="relative pl-[10px] group cursor-pointer mr-0"
          metric="users"
          sort={sort}
          setSort={setSort}
          extraRight={
            <Tooltip placement="left" allowInteract={false}>
              <TooltipTrigger className="pl-[2px]">
                <Icon icon="feather:info" className="size-[15px]" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col gap-y-[5px] items-center relative">
                  <div className="p-[15px] text-xs bg-forest-100 dark:bg-[#1F2726] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex gap-y-[5px] max-w-[460px] flex-col z-50">
                    <div>Number of distinct active addresses in the last 7 days and share of total Ethereum ecosystem addresses.</div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          }
        >
            <div className="flex flex-col items-end">
              <div className="whitespace-nowrap">Weekly Active</div>Addresses
            </div>
        </GridTableHeaderCell>
        <GridTableHeaderCell
          justify="end"
          className="relative pl-[10px] group cursor-pointer mr-0"
          metric="cross_chain_activity"
          sort={sort}
          setSort={setSort}
          extraRight={
            <Tooltip placement="left" allowInteract={false}>
              <TooltipTrigger className="pl-[2px]">
                <Icon icon="feather:info" className="size-[15px]" />
              </TooltipTrigger>
              <TooltipContent>
              <div className="flex flex-col gap-y-[5px] items-center relative">
                <div className="p-[15px] text-xs bg-forest-100 dark:bg-[#1F2726] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex gap-y-[5px] max-w-[460px] flex-col z-50">
                  <div>Percentage of active addresses that also interacted with other chains in the last 7 days.</div>
                </div>
              </div>
              </TooltipContent>
            </Tooltip>
          }
        >
            <div className="flex flex-col items-end">
              <div className="whitespace-nowrap">Cross-Chain</div>Activity
            </div>
        </GridTableHeaderCell>
        <GridTableHeaderCell
          justify="end"
          className="group cursor-pointer mr-0"
          metric="age"
          sort={sort}
          setSort={setSort}
        >
          Age
        </GridTableHeaderCell>
      </GridTableHeader>
      <div className="flex flex-col gap-y-[5px] w-full relative">
        {rows
          .filter((row) => Get_SupportedChainKeys(master).includes(row.chain.key))
          .map((item, index) => {
            const maturityKey = master.chains[item.chain.key].maturity || "NA";
            const showMaturityTooltip = maturityKey !== "NA" && maturityKey !== "";

            return (
              <GridTableRow
                key={index}
                gridDefinitionColumns="grid-cols-[26px_125px_190px_95px_minmax(300px,800px)_140px_125px_117px]"
                className="relative group text-[14px] gap-x-[15px] z-[2] !pl-[5px] !pr-[15px] select-none h-[34px] !pb-0 !pt-0"
                bar={{
                  origin_key: item.chain.key,
                  width: lastValsByChainKey[item.chain.key] / maxVal,
                  transitionClass: sort.metric === "users" ? "transition-[width] duration-300" : "transition-opacity duration-[100ms]",
                  containerStyle: {
                    left: 22,
                    right: 1,
                    top: 0,
                    bottom: 0,
                    borderRadius: "0 9999px 9999px 0",
                    zIndex: -1,
                    overflow: "hidden",
                    opacity: sort.metric === "users" ? 1 : 0,
                  },
                }}
                onClick={() => router.push(`/chains/${item.chain.urlKey}`)}
              >
                <div className="sticky z-[3] -left-[12px] md:-left-[48px] w-[26px] flex items-center justify-center overflow-visible">
                  <div className="absolute z-[3] -left-[5px] h-[32px] w-[40px] pl-[9px] flex items-center justify-start rounded-l-full bg-[radial-gradient(circle_at_-32px_16px,_#151A19_0%,_#151A19_72.5%,_transparent_90%)]">
                    <GridTableChainIcon origin_key={item.chain.key} />
                  </div>
                </div>
                <div className="text-xs group-hover:underline">{data.chains[item.chain.key].chain_name}</div>
                <div className="text-xs w-full">{data.chains[item.chain.key].purpose || ""}</div>
                <div className="justify-start w-full items-center group rounded-full">
                  <MaturityWithTooltip maturityKey={maturityKey} showTooltip={showMaturityTooltip} />
                </div>
                <ChainRankCell item={item} setCenterMetric={setCenterMetric} centerMetric={centerMetric} setSort={setSort} sort={sort} />
                <div className="flex justify-end items-center">
                  <div className="flex gap-[5px] items-center text-[12px] w-[98px]">
                    <div className="w-1/2 flex justify-end text-right numbers-xs text-[#5A6462]">
                      {(data.chains[item.chain.key].user_share * 100).toFixed(2)}%
                    </div>
                    <div className="w-1/2 text-right flex justify-end items-center numbers-xs">
                      {Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(lastValsByChainKey[item.chain.key])}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end items-center numbers-xs">
                  {d3.format(data.chains[item.chain.key].cross_chain_activity > 0.01 ? ".1%" : ".1%")(data.chains[item.chain.key].cross_chain_activity)}
                </div>
                <div className="flex justify-end items-center numbers-xs">
                  {formatAge(item.chain.key)}
                </div>
              </GridTableRow>
            );
          })}
      </div>
    </>
  );
});

export const useMaturityNameAndDescription = (maturityKey: string) => {
  const { data: master } = useMaster();
  if (!master) return { maturityName: "", maturityDescription: "" };

  if(maturityKey === "NA" || maturityKey === "" || maturityKey === undefined || maturityKey === "0_early_phase" || maturityKey === "10_foundational"){
    return { maturityName: "N/A", maturityDescription: "N/A" };
  }

  const maturityName = master.maturity_levels[maturityKey] ? master.maturity_levels[maturityKey].name : "";
  const maturityDescription = master.maturity_levels[maturityKey] ? master.maturity_levels[maturityKey].description : "";
  return { maturityName, maturityDescription };
}

type MaturityWithTooltipProps = {
  maturityKey: string;
  size?: "sm" | "md";
  showTooltip?: boolean;
}
export const MaturityWithTooltip = memo(function MaturityWithTooltip({ maturityKey, size = "md", showTooltip = true }: MaturityWithTooltipProps) {
  const { maturityName, maturityDescription } = useMaturityNameAndDescription(maturityKey);

  if (maturityName === "N/A") {
    return <GTPMaturityIcon maturityKey={maturityKey} size={size} />
  }

  return (
    <>
      <GTPTooltipNew
        placement="bottom-start"
        size="lg"
        allowInteract={true}
        trigger={
          <div>
          <GTPMaturityIcon maturityKey={maturityKey} size={size} />
          </div>
        }
        containerClass="flex flex-col gap-y-[10px]"
        positionOffset={{ mainAxis: 0, crossAxis: 10 }}
      >
        <TooltipHeader title={maturityName} icon={<GTPMaturityIcon maturityKey={maturityKey} size="sm" />} />
        <TooltipBody className="pl-[20px]">
          {maturityDescription}
        </TooltipBody>
      </GTPTooltipNew>

    </>
  );
});




const ChainRankHeader = memo(function ChainRankHeader({
  setCenterMetric,
  centerMetric,
  sort,
  setSort,
}: {

  setCenterMetric: (metric: string) => void;
  centerMetric: string;
  sort,
  setSort: (sort: { metric: string; sortOrder: string }) => void;
}) {
  {
    const { hoveredMetric, setHoveredMetric, rankingKeys } = useTableRanking();
    const { data: master } = useMaster();

    if (!master) return null;

    return (
      <div className="flex items-center gap-x-[10px] px-[10px] h-[36px] rounded-full bg-[#1F2726] z-[1] relative overflow-visible">
        {rankingKeys.map((metric) => {
          return (
            <div className="relative flex items-center justify-center size-[16px] cursor-pointer"
              key={metric}
              onMouseEnter={() => {
                setHoveredMetric(metric)
              }}
              onMouseLeave={() => {
                setHoveredMetric(null)
              }}
              onClick={(e) => {
                e.stopPropagation();
                setCenterMetric(metric);
                setSort({
                  metric: "table_visual",
                  sortOrder:
                    sort.metric === "table_visual" && centerMetric === metric
                      ? sort.sortOrder === "desc"
                        ? "asc"
                        : "desc"
                      : "asc", // Default sort order when changing metrics
                });
              }}
              
            >
              <GTPMetricIcon key={metric} icon={metric} size={hoveredMetric === metric ? "md" : "sm"} className="absolute z-[2]" />
              <GTPIcon icon="chevron-down" size={"sm"}  className={`absolute z-[3] w-[10px] h-[4px] top-[18px] ${(centerMetric === metric && sort.sortOrder === "asc" && sort.metric === "table_visual" && hoveredMetric !== centerMetric ) ? "opacity-100" : "opacity-0"}`} />
              <GTPIcon icon="chevron-down" size={"sm"}  className={`absolute z-[3] w-[10px] -right-[0px] h-[4px] bottom-[17px] rotate-180 ${(centerMetric === metric && sort.sortOrder === "desc" && sort.metric === "table_visual" && hoveredMetric !== centerMetric ) ? "opacity-100" : "opacity-0"}`} />

              <div className={`absolute -inset-[10.5px] bg-[#151A19] border border-[#5A6462] rounded-full z-[1] ${hoveredMetric === metric ? "opacity-100" : "opacity-0"}`} />
              <div className={`absolute -top-[44px] z-[11] w-[200px] h-[30px] flex items-end justify-center pointer-events-none ${(hoveredMetric === metric || (centerMetric === metric && hoveredMetric === null && sort.metric === "table_visual")) ? "opacity-100" : "opacity-0"}`}>
                <div
                  className="text-[10px] leading-[120%] text-center font-bold text-nowrap"
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


const ChainRankCell = memo(function ChainRankCell({
  item,
  setCenterMetric,
  centerMetric,
  sort,
  setSort,
}: {
  item: any;
  setCenterMetric: (metric: string) => void;
  centerMetric: string;
  sort,
  setSort: (sort: { metric: string; sortOrder: string }) => void;
}) {
  // component logic here...

  const { hoveredMetric, setHoveredMetric, rankingKeys } = useTableRanking();

  const { data: landing } = useSWR<LandingPageMetricsResponse>(LandingURL);
  const { data: master } = useMaster();

  const router = useRouter();
  const { isMobile } = useUIContext();
  const [focusEnabled] = useLocalStorage("focusEnabled", false);
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
        <div className="flex items-center justify-end h-full  gap-x-[10px]">
          {rankingKeys.map((metric) => {
            const metricRanks = landing ? Object.values(landing.data.metrics.table_visual).map((chain) => chain.ranking[metric].rank).filter((rank) => rank !== null) : [];
            const maxRank = Math.max(...metricRanks)
            const minRank = Math.min(...metricRanks)

            const valueKeys = landing ? Object.keys(landing.data.metrics.table_visual[item.chain.key][focusEnabled ? "ranking" : "ranking_w_eth"][metric]).filter((key) => key.includes("value")) : [];
            const values = landing ? valueKeys.map((key) => landing.data.metrics.table_visual[item.chain.key][focusEnabled ? "ranking" : "ranking_w_eth"][metric][key]) : [];

            const colorScale = landing ? landing.data.metrics.table_visual[item.chain.key][focusEnabled ? "ranking" : "ranking_w_eth"][metric].color_scale : 0;
            return (
              <div
                key={metric}
                className={`relative flex items-start justify-center size-[16px] ${landing.data.metrics.table_visual[item.chain.key][focusEnabled ? "ranking" : "ranking_w_eth"][metric].rank !== null && "cursor-pointer"}`}

              >
                <div
                  className={`absolute -inset-y-[10px] -inset-x-[5px] flex items-start justify-center rounded-full`}
                  onMouseEnter={() => {
                    setHoveredMetric(metric)
                  }}
                  onMouseLeave={() => setHoveredMetric(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCenterMetric(metric);
                    setSort({
                      metric: "table_visual",
                      sortOrder:
                        sort.metric === "table_visual" && centerMetric === metric
                          ? sort.sortOrder === "desc"
                            ? "asc"
                            : "desc"
                          : "asc", // Default sort order when changing metrics
                    });
                  }}

                  // }}
                  // onClick={(e) => {
                  //   e.stopPropagation();

                  //   if (isMobile && hoveredMetric !== metric) return;

                  //   setSelectedFundamentalsChains((prev: string[]) => {
                  //     if (!prev.includes(item.chain.key)) {
                  //       return [...prev, item.chain.key];
                  //     }
                  //     return prev;
                  //   });

                  //   // navigate to fundamentals page
                  //   router.push(`/fundamentals/${getFundamentalsByKey[metric].urlKey}`);
                  // }}

                >
                  {landing.data.metrics.table_visual[item.chain.key][focusEnabled ? "ranking" : "ranking_w_eth"][metric].rank !== null ? (
                    <div className="relative h-full w-full">
                      <div
                        className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none"
                        style={{
                          transform:
                            hoveredMetric === metric ?
                              `scale(${GetRankingScale(landing.data.metrics.table_visual[item.chain.key][focusEnabled ? "ranking" : "ranking_w_eth"][metric].rank, [minRank, maxRank], [7.33 / 11, 15 / 11].reverse() as [number, number])})`
                              : "scale(1)",
                          zIndex: hoveredMetric !== metric ? 2 : 4,
                        }}>
                        <RankIcon colorScale={colorScale} size="sm" isIcon={false}>
                          {landing.data.metrics.table_visual[item.chain.key][focusEnabled ? "ranking" : "ranking_w_eth"][metric].rank}
                        </RankIcon>

                      </div>
                      <div
                        className={`absolute inset-0 bg-transparent rounded-full flex items-center justify-end pointer-events-none`}
                      >
                        <div className={`h-[36px] left-[-3px] absolute rounded-full flex items-center justify-center bg-[#151A19] border border-[#5A6462] px-[5px]  ${hoveredMetric === metric ? "opacity-100" : "opacity-0"}`}
                          style={{
                            zIndex: hoveredMetric === metric ? 3 : 0,
                          }}
                        >
                          <div
                            className={`flex w-full items-end justify-end numbers-sm pr-[15px] pl-[37px] text-nowrap ${getDisplayValue(metric, values, valueKeys).suffix ? "min-w-[145px]" : "min-w-[115px]"} `}
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
                        isIcon={false}
                      >
                        {landing.data.metrics.table_visual[item.chain.key][focusEnabled ? "ranking" : "ranking_w_eth"][metric].rank}
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