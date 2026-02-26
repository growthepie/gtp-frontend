"use client";
import Container from "@/components/layout/Container";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { AggregatedDataRow, useApplicationsData } from "@/app/(layout)/applications/_contexts/ApplicationsDataContext";
import { useMetrics } from "@/app/(layout)/applications/_contexts/MetricsContext";
import { memo, use, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMaster } from "@/contexts/MasterContext";
import {
  GridTableHeader,
  GridTableHeaderCell,
  GridTableRow,
} from "@/components/layout/GridTable";
import { GTPIconName } from "@/icons/gtp-icon-names";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { useLocalStorage } from "usehooks-ts";
import VerticalVirtuosoScrollContainer from "@/components/VerticalVirtuosoScrollContainer";
import { Virtuoso } from "react-virtuoso";
import { ApplicationCard, ApplicationDisplayName, ApplicationIcon, ApplicationTooltip, Category, CategoryTooltipContent, formatNumber, Links, MetricTooltip, TopGainersAndLosersTooltip } from "@/app/(layout)/applications/_components/Components";
import { useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { useSort } from "@/app/(layout)/applications/_contexts/SortContext";
import { ApplicationsURLs } from "@/lib/urls";
import { preload } from "react-dom";
import useDragScroll from "@/hooks/useDragScroll";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { MetricInfo, ChainInfo } from "@/types/api/MasterResponse";
import { useTimespan } from "@/app/(layout)/applications/_contexts/TimespanContext";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import ChainSearch from "./ChainSearch";
import Controls from "@/app/(layout)/applications/_components/Controls";

interface AppsChainProps {
  chainInfo: ChainInfo;
  chainKey: string;
  defaultQuery?: string;
}

export default function AppsChain({ chainInfo, chainKey, defaultQuery = "" }: AppsChainProps) {
  const { applicationDataAggregatedAndFiltered, isLoading, selectedStringFilters, setSelectedChains, medianMetric, medianMetricKey } = useApplicationsData();
  const { selectedMetrics, selectedMetricKeys } = useMetrics();
  const { metricsDef } = useMetrics();
  const { timespans, selectedTimespan } = useTimespan();

  const [topGainersRef, { height: topGainersHeight }] = useElementSizeObserver<HTMLDivElement>();


  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  // Filter applications by the specific chain
  const chainFilteredApplications = useMemo(() => {
    if (!chainKey) return applicationDataAggregatedAndFiltered;
    
    return applicationDataAggregatedAndFiltered.filter(application => 
      application.origin_keys.includes(chainKey)
    );
  }, [applicationDataAggregatedAndFiltered, chainKey]);


  useEffect(() => {
    if (!chainKey) return;
    setSelectedChains([chainKey]);
  }, [chainKey, setSelectedChains]);

  const { topGainers } = useMemo(() => {
    if (!chainFilteredApplications.length) {
      return { topGainers: [] as AggregatedDataRow[] };
    }

    const medianMetricValues = [...chainFilteredApplications]
      .map((application) => application[medianMetricKey])
      .sort((a, b) => a - b);

    const medianValue = medianMetricValues[Math.floor(medianMetricValues.length / 2)];
    const convertToETH = showUsd ? true : false;
    const changePctKey = `${medianMetricKey}_change_pct`;

    const filteredApplications = chainFilteredApplications
      .filter(
        (application) =>
          application[medianMetricKey] > medianValue &&
          application[`prev_${convertToETH ? "gas_fees_eth" : medianMetricKey}`] > 0,
      );

    const gainers = filteredApplications
      .filter((application) => application[changePctKey] > 0 && application[changePctKey] !== Infinity)
      .sort((a, b) => b[changePctKey] - a[changePctKey])
      .slice(0, 6);

    return { topGainers: gainers };
  }, [chainFilteredApplications, medianMetricKey, showUsd]);

  const hideTopGainers = useMemo(() => {
    return selectedTimespan === "max" || selectedStringFilters.length > 0 || topGainers.length === 0;
  }, [selectedTimespan, selectedStringFilters, topGainers.length]);

  return (
    <div className="">
    
      <ChainSearch chainInfo={chainInfo} chainKey={chainKey} />
      <div className="pt-[15px]">
         <Controls />
      </div>
      {!hideTopGainers && (
        <div>
          <div
            className={``}

          >
            <div className={`pt-[30px]`}>
              <div className="flex flex-col gap-y-[10px] ">
                <div className="heading-lg">Top Gainers on {chainInfo?.name} by {metricsDef[medianMetric].name}</div>
                <div className="flex justify-between items-center gap-x-[10px]">
                  <div className="text-xs">
                    Projects on {chainInfo?.name} that saw the biggest positive change in {metricsDef[medianMetric].name} over the last {timespans[selectedTimespan].label}.
                  </div>
                  <GTPTooltipNew
                    placement="left"
                    allowInteract={false}
                    unstyled
                    containerClass="z-[99]"
                    trigger={
                      <div className="size-[15px]">
                        <Icon icon="feather:info" className="size-[15px]" />
                      </div>
                    }
                  >
                    <TopGainersAndLosersTooltip metric={selectedMetrics[0]} scopeLabel={chainInfo?.name} />
                  </GTPTooltipNew>
                </div>
              </div>
            </div>
            
            <div ref={topGainersRef}>
              <div className={`hidden md:flex md:flex-wrap pt-[10px] gap-[10px]`}>
                {topGainers.map((application, index) => (
                  <ApplicationCard key={index} application={application} chainsPage={true} chainKey={chainKey} className="md:w-[calc(50%-5px)] lg:w-[calc(33.33%-7px)]" />
                ))}
                {isLoading && new Array(6).fill(0).map((_, index) => (
                  <ApplicationCard key={`loading-${index}`} application={undefined} chainsPage={true} chainKey={chainKey} className="md:w-[calc(50%-5px)] lg:w-[calc(33.33%-7px)]" />
                ))}
              </div>
            
              <div className={`block md:hidden`}>
                <div className="pt-[10px]">
                  <CardSwiper cards={topGainers.map((application, index) => <ApplicationCard key={index} application={application } chainsPage={true} chainKey={chainKey} />)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="pt-[30px] pb-[15px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="heading-lg">Top Ranked Apps on {chainInfo?.name}</div>
          <div className="text-xs">
            Applications on {chainInfo?.name} ranked by {metricsDef[medianMetric].name} {selectedTimespan === "max" ? "(all-time)" : `in the last ${timespans[selectedTimespan].label}`}. You can apply filters by using the search bar.
          </div>
        </div>
      </div>
      <div>
        <ApplicationsTable chainFilteredApplications={chainFilteredApplications} />
      </div>
    </div>
  )
}

const CardSwiper = ({ cards }: { cards: React.ReactNode[] }) => {
  // const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFirst, setIsFirst] = useState(true);
  const [isLast, setIsLast] = useState(false);
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(2);

  const { containerRef, showLeftGradient, showRightGradient } =
    useDragScroll("horizontal", 0.96, { snap: true, snapThreshold: 0.2 });

  const onScroll = () => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const children = Array.from(containerRef.current.children);
      let closestIndex = 0;
      let closestDistance = Infinity;
      children.forEach((child, index) => {
        const rect = child.getBoundingClientRect();
        const childCenter = rect.left + rect.width / 2;
        const distance = Math.abs(childCenter - containerCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      setActiveIndex(closestIndex);
      setLeftIndex(Math.max(0, closestIndex - 1));
      setRightIndex(Math.min(children.length - 1, closestIndex + 1));
      setIsFirst(closestIndex === 0);
      setIsLast(closestIndex === children.length - 1);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", onScroll);
    // Run once on mount to set the active index correctly.
    onScroll();
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex overflow-x-scroll scrollbar-none px-[20px]"
    >
      {cards.map((card, index) => {
        return (
          <div
            key={index}
            className={`transition-[transform,opacity] duration-300 ease-in-out ${index === activeIndex ? "scale-100 opacity-100" : "scale-[0.75] opacity-50"
              }`}
            style={{
              minWidth: "calc(100% - 40px)",
              marginRight: !isLast && index === leftIndex ? "-40px" : 0,
              marginLeft: !isFirst && index === rightIndex ? "-40px" : 0,
            }}
          >
            {card}
          </div>
        )
      })}
    </div>
  );
};

const ApplicationsTable = memo(({ chainFilteredApplications }: { chainFilteredApplications: AggregatedDataRow[] }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { sort, setSort } = useSort();
  const { metricsDef, selectedMetrics, setSelectedMetrics, selectedMetricKeys, } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const numTotalMetrics = Object.keys(metricsDef).length;

  const maxMetrics = useMemo(() => {
    return selectedMetricKeys.map((metric) => {
      return chainFilteredApplications.reduce((acc, application) => {
        return Math.max(acc, application[metric]);
      }, 0);
    });
  }, [chainFilteredApplications, selectedMetricKeys]);
  const { selectedTimespan } = useTimespan();
  
  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() => {
    const applicationColumnWidth = selectedMetricKeys.length > 2 ? "minmax(156px, 1fr)" : "minmax(285px, 1fr)";
    const metricColumnWidth = selectedMetricKeys.length > 2 ? "242px" : "262px";
    return [
      "26px",
      applicationColumnWidth,
      "150px",
      "95px",
      ...selectedMetricKeys.map(() => metricColumnWidth),
      ...new Array(numTotalMetrics - selectedMetricKeys.length).fill("0px"),
      "29px"
    ].join(" ");
  }, [numTotalMetrics, selectedMetricKeys]
  );

  // Optimize row rendering with a memoized item renderer
  const renderItem = useCallback((index) => {
    return (
      <div key={index} className="pb-[5px]">
        <ApplicationTableRow
          rowIndex={index}
          application={chainFilteredApplications[index]}
          maxMetrics={maxMetrics}
        />
      </div>
    );
  }, [chainFilteredApplications, maxMetrics]);

  return (
    <>
      <GridTableHeader
        className="group text-[14px] !px-[5px] !py-0 !gap-x-0 !pb-[4px] !z-[10] !items-start transition-all duration-300"
        style={{
          gridTemplateColumns: gridColumns,
        }}
      >
        <div />
        <GridTableHeaderCell
          metric="owner_project"
          className="heading-small-xs pl-[15px] pr-[15px] "
          sort={sort}
          setSort={setSort}
        >
          Application
        </GridTableHeaderCell>
        {/* <GridTableHeaderCell
          metric="origin_keys"
          className="heading-small-xs pl-[3px] pr-[15px] "
          sort={sort}
          setSort={setSort}
        >
          Chains
        </GridTableHeaderCell> */}
        <GridTableHeaderCell
          metric="category"
          className="heading-small-xs pr-[15px] pl-[2.5px] "
          sort={sort}
          setSort={setSort}

        >
          <div className="flex items-center gap-x-[5px]">
            <GTPIcon icon="gtp-categories" size="sm" />
            Main Category
          </div>
        </GridTableHeaderCell>
        <GridTableHeaderCell
          metric="num_contracts"
          className="heading-small-xs pr-[15px] "
          justify="end"
          sort={sort}
          setSort={setSort}
        >
          # Contracts
        </GridTableHeaderCell>
        {selectedMetrics.map((metric, index) => {
          return (
            <div key={index} className={`flex justify-end pr-[15px] `}>
              <GridTableHeaderCell
                metric={metric}
                className="heading-small-xs z-[0] flex whitespace-nowrap"
                justify="end"
                sort={sort}
                setSort={setSort}
                extraRight={
                  <div className="flex items-end gap-x-[5px] pl-[5px] cursor-default z-[10]">
                    <div
                      className={`cursor-pointer items-center rounded-full bg-color-bg-medium text-color-text-primary gap-x-[2px] px-[5px] h-[18px] ${selectedTimespan === "max" ? "hidden" : "flex"}`}
                      onClick={() => {
                        setSort({
                          metric: `${selectedMetricKeys[index]}_change_pct`,
                          sortOrder:
                            sort.metric === `${selectedMetricKeys[index]}_change_pct`
                              ? sort.sortOrder === "asc"
                                ? "desc"
                                : "asc"
                              : "desc",
                        });
                      }}
                    >
                      <div className="text-xxxs !leading-[14px]">Change</div>
                      <Icon
                        icon={
                          sort.metric === `${selectedMetricKeys[index]}_change_pct` && sort.sortOrder === "asc"
                            ? "feather:arrow-up"
                            : "feather:arrow-down"
                        }
                        className="w-[15px] h-[15px]"
                        style={{
                          opacity: sort.metric === `${selectedMetricKeys[index]}_change_pct` ? 1 : 0.2,
                        }}
                      />
                    </div>
                    <GTPTooltipNew
                      placement="bottom"
                      allowInteract={false}
                      unstyled
                      containerClass="z-[99]"
                      trigger={<Icon icon="feather:info" className="w-[15px] h-[15px]" />}
                    >
                      <MetricTooltip metric={metric} />
                    </GTPTooltipNew>
                  </div>
                }
              >
                {metricsDef[metric].name} {Object.keys(metricsDef[metric].units).includes("eth") && <>({showUsd ? "USD" : "ETH"})</>}
              </GridTableHeaderCell>
            </div>
          )
        })}
        {selectedMetricKeys.length < numTotalMetrics && (new Array(numTotalMetrics - selectedMetricKeys.length).fill(0).map((_, index) => (
          <div key={index} className="w-[0px]" />
        )))}
        <div />
      </GridTableHeader>
      <div className="flex flex-col" style={{ height: `${chainFilteredApplications.length * 34 + chainFilteredApplications.length * 5}px` }}>
        <Virtuoso
          totalCount={chainFilteredApplications.length}
          itemContent={renderItem}
          useWindowScroll
          increaseViewportBy={{ top: 200, bottom: 400 }}
          overscan={100}
        />
      </div>
    </>
  )
});

ApplicationsTable.displayName = 'ApplicationsTable';

interface ValueProps {
  rowIndex: number;
  rank: number;
  def: MetricInfo;
  value: number;
  change_pct: number;
  maxMetric: number;
  metric: string;
}

// Create areEqual function for memo optimization
const areValuePropsEqual = (prevProps: ValueProps, nextProps: ValueProps) => {
  return (
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.rank === nextProps.rank &&
    prevProps.value === nextProps.value &&
    prevProps.change_pct === nextProps.change_pct &&
    prevProps.maxMetric === nextProps.maxMetric &&
    prevProps.metric === nextProps.metric &&
    // For def, we don't need deep comparison if it's the same reference
    prevProps.def === nextProps.def
  );
};

const Value = memo(({
  rowIndex,
  rank,
  def,
  value,
  change_pct,
  maxMetric,
  metric
}: ValueProps) => {
  const { sort } = useSort();
  const [showUsd] = useLocalStorage("showUsd", true);
  const { selectedMetrics } = useMetrics();
  const { selectedTimespan } = useTimespan();
  // Determine if this metric is the currently selected sort metric
  const isSelectedMetric = useMemo(() =>
    sort.metric === metric,
    [sort.metric, metric]
  );

  // Calculate progress bar width once
  const progressWidth = useMemo(() =>
    maxMetric > 0 ? `${(value / maxMetric) * 100}%` : '0%',
    [value, maxMetric]
  );

  // Format displayed value once
  const displayValue = useMemo(() => {
    // Get the appropriate unit from the metric definition
    const unitType = Object.keys(def.units).includes("usd")
      ? showUsd ? "usd" : "eth"
      : Object.keys(def.units)[0];

    const unit = def.units[unitType];
    const prefix = unit.prefix || "";
    const decimals = unit.decimals;

    return prefix + value.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }, [def, showUsd, value]);

  // Format percentage change once
  const changePctDisplayValue = useMemo(() => {
    if (change_pct === Infinity) return " ";

    return `${change_pct < 0 ? '-' : '+'}${formatNumber(Math.abs(change_pct), {
      defaultDecimals: 1,
      thresholdDecimals: { base: 0 }
    })}%`;
  }, [change_pct]);

  return (
    <div className="w-full flex items-center justify-end gap-[10px]">
      {/* Rank display (only show if this metric is the current sort metric) */}
      <div className="numbers-xs text-[#5A6462] w-[calc(7.33*4px+10px)] pl-[10px]">
        {isSelectedMetric && rank}
      </div>

      {/* Value container */}
      <div className="w-full flex flex-col items-end gap-y-[2px]">
        {/* Value display */}
        <div className="flex justify-end  items-center gap-x-[2px]">
          <div className="numbers-xs">
            {displayValue}
          </div>
          <div className={`numbers-xxs w-[49px] text-right ${change_pct < 0 ? 'text-color-negative' : 'text-color-positive'
            } ${selectedTimespan === "max" ? "hidden" : ""}`}>
            {changePctDisplayValue}
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-[4px] rounded-full">
          <div
            className="absolute h-[4px] right-0 transition-[width]"
            style={{
              width: progressWidth,
              background: "linear-gradient(145deg, #FE5468 0%, #FFDF27 100%)",
              borderRadius: "999px",
            }}
          />
        </div>
      </div>
    </div>
  );
}, areValuePropsEqual);

Value.displayName = 'Value';

// Create a separate areEqual function for the memo optimization
const areTableRowPropsEqual = (
  prevProps: { application: AggregatedDataRow, maxMetrics: number[], rowIndex: number },
  nextProps: { application: AggregatedDataRow, maxMetrics: number[], rowIndex: number }
) => {
  // Compare rowIndex
  if (prevProps.rowIndex !== nextProps.rowIndex) return false;

  // Compare maxMetrics array
  if (prevProps.maxMetrics.length !== nextProps.maxMetrics.length) return false;
  for (let i = 0; i < prevProps.maxMetrics.length; i++) {
    if (prevProps.maxMetrics[i] !== nextProps.maxMetrics[i]) return false;
  }

  // Compare relevant application properties (avoid deep comparison of the entire object)
  const prevApp = prevProps.application;
  const nextApp = nextProps.application;

  if (
    prevApp.owner_project !== nextApp.owner_project ||
    prevApp.num_contracts !== nextApp.num_contracts ||
    // Compare metrics (this list would need to include all possible metrics you display)
    prevApp.gas_fees_eth !== nextApp.gas_fees_eth ||
    prevApp.gas_fees_usd !== nextApp.gas_fees_usd ||
    prevApp.txcount !== nextApp.txcount ||
    prevApp.daa !== nextApp.daa ||
    // Compare change percentages
    prevApp.gas_fees_eth_change_pct !== nextApp.gas_fees_eth_change_pct ||
    prevApp.gas_fees_usd_change_pct !== nextApp.gas_fees_usd_change_pct ||
    prevApp.txcount_change_pct !== nextApp.txcount_change_pct ||
    prevApp.daa_change_pct !== nextApp.daa_change_pct
  ) {
    return false;
  }

  // Compare origin_keys arrays
  if (prevApp.origin_keys.length !== nextApp.origin_keys.length) return false;
  for (let i = 0; i < prevApp.origin_keys.length; i++) {
    if (prevApp.origin_keys[i] !== nextApp.origin_keys[i]) return false;
  }

  // If we got here, the props are considered equal
  return true;
};

const ApplicationTableRow = memo(({ application, maxMetrics, rowIndex }: { application: AggregatedDataRow, maxMetrics: number[], rowIndex: number }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { metricsDef, selectedMetrics, selectedMetricKeys, } = useMetrics();
  const { selectedTimespan } = useTimespan();
  const { sort } = useSort();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);

  const numTotalMetrics = Object.keys(metricsDef).length;

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() => {
    const applicationColumnWidth = selectedMetricKeys.length > 2 ? "minmax(156px, 1fr)" : "minmax(285px, 1fr)";
    const metricColumnWidth = selectedMetricKeys.length > 2 ? "242px" : "262px";
    return [
      "26px",
      applicationColumnWidth,
      "150px",
      "95px",
      ...selectedMetricKeys.map(() => metricColumnWidth),
      ...new Array(numTotalMetrics - selectedMetricKeys.length).fill("0px"),
      "29px"
    ].join(" ");
  }, [numTotalMetrics, selectedMetricKeys]
  );

  return (
    <Link href={{ pathname: `/applications/${application.owner_project}`, query: searchParams.toString().replace(/%2C/g, ",") }}>
      <GridTableRow
        className={`group text-[14px] !px-[5px] !py-0 h-[34px] !gap-x-0 transition-all duration-300`}
        style={{
          gridTemplateColumns: gridColumns,
        }}
        onClick={() => {
          // must define onclick so we have hover effect from GridTableRow component
          return;
        }}
      >
        <div className="sticky z-[100] -left-[12px] md:-left-[46px] w-[30px] flex items-center justify-center overflow-visible">
          <div
            className="absolute z-[3] -left-[6px] h-[34px] w-[35px] pl-[5px] flex items-center justify-start bg-[radial-gradient(circle_at_-32px_16px,_var(--bg-medium)_0%,_var(--bg-medium)_72.5%,_transparent_90%)] group-hover:bg-[radial-gradient(circle_at_-32px_16px,_transparent_0%,_transparent_72.5%,_transparent_90%)] rounded-l-full border-[0.5px] border-r-0 border-color-bg-medium"
          >
            <ApplicationIcon owner_project={application.owner_project} size="sm" />
          </div>
        </div>
        <div
          className="flex items-center gap-x-[5px] group-hover:underline pl-[15px] pr-[15px] "
        >
          <GTPTooltipNew
            placement="bottom-start"
            allowInteract={true}
            size="md"
            trigger={
              <div className="min-w-0 h-[32px] flex items-center">
                <div className="truncate w-full">
                  <ApplicationDisplayName owner_project={application.owner_project} />
                </div>
              </div>
            }
            containerClass="flex flex-col gap-y-[10px]"
            positionOffset={{ mainAxis: 0, crossAxis: 20 }}
          >
            <ApplicationTooltip application={application} />
          </GTPTooltipNew>
        </div>
        <div className="text-xs pr-[15px]">
          <GTPTooltipNew
            placement="bottom-start"
            allowInteract={true}
            size="md"
            trigger={
              <div className="flex-1 min-w-0 h-[32px] flex items-center">
                <div className="truncate w-full">
                  {ownerProjectToProjectData[application.owner_project] && ownerProjectToProjectData[application.owner_project]?.main_category ?
                  <Category category={ownerProjectToProjectData[application.owner_project]?.main_category || ""} /> :
                  <Category category={"unknown"} />
                  }
                </div>
              </div>
            }
            containerClass="flex flex-col gap-y-[10px] !w-[230px]"
            positionOffset={{ mainAxis: 0, crossAxis: 78 }}
          >
            <CategoryTooltipContent application={application} />
          </GTPTooltipNew>
        </div>
        <div className="numbers-xs text-right pr-[15px]">
          {application.num_contracts}
        </div>
        {selectedMetrics.map((metric, index) => {
          const metricKey = selectedMetricKeys[index];
          let bgColor = "bg-transparent";

          // starting from the last metric column, the bg should be bg-color-bg-medium/30 and every other column should be bg-transparent
          if (index === selectedMetrics.length - 1) {
            bgColor = "bg-color-bg-medium/30";
          } else if (selectedMetrics.length % 2 === 0) {
            bgColor = index % 2 === 1 ? "bg-color-bg-medium/30" : "bg-transparent";
          } else {
            bgColor = index % 2 === 0 ? "bg-color-bg-medium/30" : "bg-transparent";
          }

          return (
            <div
              key={index}
              className={`flex justify-end items-center text-right h-full pr-[15px] transition-colors duration-300 ${bgColor}`}
            >
              <Value rowIndex={rowIndex} rank={application[`rank_${metricKey}`]} def={metricsDef[metric]} value={application[metricKey]} change_pct={application[`${metricKey}_change_pct`]} maxMetric={maxMetrics[index]} metric={selectedMetrics[index]} />
            </div>
          )
        })}
        {selectedMetricKeys.length < numTotalMetrics && (new Array(numTotalMetrics - selectedMetricKeys.length).fill(0).map((_, index) => (
          <div key={index} className="w-[0px]" />
        )))}
        <div className="relative flex justify-end items-center pr-[0px]">
          <div className="absolute cursor-pointer size-[24px] bg-color-bg-medium rounded-full flex justify-center items-center">
            <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-color-text-primary" />
          </div>
        </div>
      </GridTableRow>
    </Link>
  )
}, areTableRowPropsEqual);

ApplicationTableRow.displayName = 'ApplicationTableRow';
