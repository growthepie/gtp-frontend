"use client";
import Container from "@/components/layout/Container";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { AggregatedDataRow, useApplicationsData } from "./_contexts/ApplicationsDataContext";
import { useMetrics } from "./_contexts/MetricsContext";
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
import { ApplicationCard, ApplicationDisplayName, ApplicationIcon, ApplicationTooltip, Category, CategoryTooltipContent, Chains, formatNumber, Links, MetricTooltip, TopGainersAndLosersTooltip } from "./_components/Components";
import { ProjectsMetadataProvider, useProjectsMetadata } from "./_contexts/ProjectsMetadataContext";
import { useSort } from "./_contexts/SortContext";
import { ApplicationsURLs } from "@/lib/urls";
import { preload } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { MetricInfo } from "@/types/api/MasterResponse";
import { useTimespan } from "./_contexts/TimespanContext";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import { Switch } from "@/components/Switch";
import ApplicationsGrid from "@/components/layout/SingleChains/OverviewCards/ApplicationsGrid";
import ViewToggle from "@/components/ViewToggle";
import { Carousel } from "@/components/Carousel";


// Preload data for the overview page
["1d", "7d", "30d", "90d", "365d", "max"].forEach((timespan) => {
  preload(ApplicationsURLs.overview.replace('{timespan}', timespan), { as: 'fetch', crossOrigin: "anonymous" });
});

// const SCROLL_POS_KEY = 'scrollPos-applications';

export default function Page() {
  const { applicationDataAggregatedAndFiltered, isLoading, selectedStringFilters, medianMetric, medianMetricKey } = useApplicationsData();
  const { data } = useMaster();
  const { selectedMetrics, selectedMetricKeys } = useMetrics();
  const { metricsDef } = useMetrics();
  const { timespans, selectedTimespan } = useTimespan();

  const [topGainersRef, { height: topGainersHeight }] = useElementSizeObserver<HTMLDivElement>();


  // useEffect(() => {
  //   const handleScroll = () => {
  //     sessionStorage.setItem(SCROLL_POS_KEY, window.scrollY.toString());
  //   };

  //   window.addEventListener('scroll', handleScroll);
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, []);

  // useLayoutEffect(() => {
  //   const restoreScroll = () => {
  //     const savedScroll = sessionStorage.getItem(SCROLL_POS_KEY);

  //     if (!savedScroll) {
  //       return;
  //     }

  //     console.log("Attempting to restore scroll with scroll position:", savedScroll);
  //     const scrollY = parseInt(savedScroll);

  //     // Track start time for the 1-second attempt window
  //     const startTime = Date.now();
  //     const maxDuration = 1000; // 1 second in milliseconds

  //     // Function to attempt scrolling with retries
  //     const attemptScroll = () => {
  //       const pageHeight = document.documentElement.scrollHeight;
  //       const currentTime = Date.now();
  //       const timeElapsed = currentTime - startTime;

  //       if (scrollY < pageHeight) {
  //         // Page is tall enough, perform scroll
  //         window.scrollTo(0, scrollY);
  //         sessionStorage.removeItem(SCROLL_POS_KEY);
  //         return true; // Success
  //       } else if (timeElapsed < maxDuration) {
  //         // Still within time window, retry soon
  //         setTimeout(attemptScroll, 50); // Check every 50ms
  //         return false; // Still trying
  //       } else {
  //         // Time's up, couldn't scroll
  //         sessionStorage.removeItem(SCROLL_POS_KEY);
  //         return false; // Failed
  //       }
  //     };

  //     // Start the attempt cycle
  //     attemptScroll();
  //   };

  //   const referrer = document.referrer;
  //   // if the referrer is the applications page, restore the scroll
  //   if (referrer.includes("/applications/")) {
  //     restoreScroll();
  //   }

  // }, []);

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [showGrid, setShowGrid] = useLocalStorage("showGrid", true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [clearSelectedCategory, setClearSelectedCategory] = useState(false);


  const { topGainers } = useMemo(() => {
    const medianMetricValues = applicationDataAggregatedAndFiltered.map((application) => application[medianMetricKey])
      .sort((a, b) => a - b);

    const medianValue = medianMetricValues[Math.floor(medianMetricValues.length / 2)];
    const convertToETH = showUsd ? true : false;

    // filter out applications with < median value of selected metric and with previous value of 0
    const filteredApplications = applicationDataAggregatedAndFiltered
      .filter((application) => application[medianMetricKey] > medianValue && application["prev_" + (convertToETH ? "gas_fees_eth" : medianMetricKey)] > 0);

    const changePctKey = medianMetricKey + "_change_pct";

    // top 6 applications with highest positive change_pct only
    const gainers = [...filteredApplications]
      .filter((application) => application[changePctKey] > 0 && application[changePctKey] !== Infinity)
      .sort((a, b) => b[changePctKey] - a[changePctKey])
      .slice(0, 6);

    return {
      topGainers: gainers,
    }
  }, [applicationDataAggregatedAndFiltered, medianMetricKey, showUsd]);



  const hideTopGainers = useMemo(() => {
    return selectedTimespan === "max" || selectedStringFilters.length > 0 || topGainers.length === 0;
  }, [selectedTimespan, selectedStringFilters, topGainers.length]);



  return (
    <>
      {!hideTopGainers && (
        <div>
          <div
            className={``}

          >
            <Container className={`pt-[30px]`}>
              <div className="flex flex-col gap-y-[10px] ">
                <div className="heading-lg">Top Gainers by {metricsDef[medianMetric].name}</div>
                <div className="flex justify-between items-center gap-x-[10px]">
                  <div className="text-xs">
                    Projects that saw the biggest positive change in {metricsDef[medianMetric].name} over the last {timespans[selectedTimespan].label}.
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
                    <TopGainersAndLosersTooltip metric={selectedMetrics[0]} />
                  </GTPTooltipNew>
                </div>
              </div>
            </Container>
            <div ref={topGainersRef}>
              <Container className={`hidden md:flex md:flex-wrap pt-[10px] gap-[10px]`}>
                {topGainers.map((application, index) => (
                  <ApplicationCard key={index} application={application} className="md:w-[calc(50%-5px)] lg:w-[calc(33.33%-7px)]" />
                ))}
                {isLoading && new Array(6).fill(0).map((_, index) => (
                  <ApplicationCard key={index} application={undefined} className="md:w-[calc(50%-5px)] lg:w-[calc(33.33%-7px)]" />
                ))}
              </Container>
            
              <div className={`block md:hidden`}>
                <div className="pt-[10px]">
                  <Carousel
                    heightClass="h-[150px]"
                    focusMode={true}
                    focusOpacity={0.5}
                    arrows={false}
                    gap={0} // reduce gap in focus mode
                    pagination="dots"
                  >
                    {topGainers.map((application, index) => (
                      <div key={index}>
                        <ApplicationCard application={application} />
                      </div>
                    ))}
                  </Carousel>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Container className="pt-[30px] pb-[15px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="w-full flex justify-between items-center">
            <div className="heading-lg flex items-center gap-x-[5px]">
              {showGrid ? "Top Ranked Apps" : `Top Applications ${selectedCategory ? `> ${data?.blockspace_categories.main_categories[selectedCategory]}` : ""}`}
              {selectedCategory && (
                <button className="bg-color-bg-default rounded-full size-[26px] flex items-center justify-center" onClick={() => setClearSelectedCategory(true)}>
                  <Image src="/In-Button-Close.svg" alt="Close" className="relative left-[0.5px] bottom-[0.5px]"  width={16} height={16} />
                </button>
              )}
            </div>
            <ViewToggle
              showTable={showGrid}
              setShowTable={setShowGrid}
            />
          </div>
          <div className="text-xs">
            {showGrid ? (
              <div>
                Applications ranked by {metricsDef[medianMetric].name} {selectedTimespan === "max" ? "(all-time)" : `in the last ${timespans[selectedTimespan].label}`}. You can apply filters by clicking on the chain icons or by using the search bar.
              </div>
            ) : (
              <div>
                Applications ranked by Transaction Count
              </div>
            )}
          </div>
        </div>
      </Container>
      <HorizontalScrollContainer className="!px-0" reduceLeftMask={true} enableDragScroll={true}>
        <div style={{ display: showGrid ? "block" : "none" }}>
          <ApplicationsTable />
        </div>
        <div className={`flex flex-col w-full rounded-[15px] bg-color-bg-default relative`}

        style={{ display: showGrid ? "none" : "flex" }}>

          <ProjectsMetadataProvider>
            <ApplicationsGrid chainKey="all" appsPage={true} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} clearSelectedCategory={clearSelectedCategory} setClearSelectedCategory={setClearSelectedCategory} />
          </ProjectsMetadataProvider>
        </div>

      </HorizontalScrollContainer>
    </>
  )
}

const ApplicationsTable = memo(() => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { applicationDataAggregatedAndFiltered } = useApplicationsData();
  const { sort, setSort } = useSort();
  const { metricsDef, selectedMetrics, setSelectedMetrics, selectedMetricKeys, } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const numTotalMetrics = Object.keys(metricsDef).length;

  const maxMetrics = useMemo(() => {
    return selectedMetricKeys.map((metric) => {
      return applicationDataAggregatedAndFiltered.reduce((acc, application) => {
        return Math.max(acc, application[metric]);
      }, 0);
    });
  }, [applicationDataAggregatedAndFiltered, selectedMetricKeys]);
  const { selectedTimespan } = useTimespan();
  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() => {
    const applicationColumnWidth = selectedMetricKeys.length > 2 ? "minmax(156px, 1fr)" : "minmax(285px, 1fr)";
    const metricColumnWidth = selectedMetricKeys.length > 2 ? "242px" : "262px";
    return [
      "26px",
      applicationColumnWidth,
      "166px",
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
          application={applicationDataAggregatedAndFiltered[index]}
          maxMetrics={maxMetrics}
        />
      </div>
    );
  }, [applicationDataAggregatedAndFiltered, maxMetrics]);

  return (
    <>
      {/* <div>{numTotalMetrics} {selectedMetricKeys.length} {(new Array(numTotalMetrics - selectedMetricKeys.length).fill(0).map(() => "0px").join(" "))}</div> */}
      {/* <HorizontalScrollContainer reduceLeftMask={true}> */}
      <GridTableHeader
        // gridDefinitionColumns={gridColumns}
        // className="sticky top-[250px] group text-[14px] !px-[5px] !py-0 gap-x-[15px] !pb-[4px] !z-[10]"
        className="group text-[14px] !px-[5px] !py-0 !gap-x-0 !pb-[4px] !z-[10] !it ems-start transition-all duration-300"
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
        <GridTableHeaderCell
          metric="origin_keys"
          className="heading-small-xs pl-[3px] pr-[15px] "
          sort={sort}
          setSort={setSort}
        >
          Chains
        </GridTableHeaderCell>
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
          // let key = selectedMetricKeys[index];


          return (
            <div key={index} className={`flex justify-end pr-[15px] `}>
              <GridTableHeaderCell

                metric={metric}
                className="heading-small-xs z-[0] flex whitespace-nowrap"
                justify="end"
                sort={sort}
                setSort={setSort}
                // onSort={() => {
                //   // if (selectedMetrics[0] !== metric) {
                //     // reorder selectedMetrics array so that the first metric is the one that was clicked
                //     const newSelectedMetrics = [metric, ...selectedMetrics.filter((m) => m !== metric)];
                //     console.log("newSelectedMetrics", newSelectedMetrics);
                //     setSelectedMetrics(newSelectedMetrics);

                //     console.log("selectedMetrics", selectedMetrics);
                //   // }
                // }}
                extraRight={
                  <div className="flex items-end gap-x-[5px] pl-[5px] cursor-default z-[10]">
                    <div
                      className={`cursor-pointer items-center rounded-full bg-color-bg-medium text-color-text-primary gap-x-[2px] px-[5px] h-[18px] ${selectedTimespan === "max" ? "hidden" : "flex"}`}
                      onClick={() => {
                        setSort({
                          metric: `${selectedMetricKeys[index]}_change_pct`, //"gas_fees_change_pct",
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
                      {/* <Icon icon="feather:arrow-down" className="w-[10px] h-[10px]" /> */}
                      <Icon
                        icon={
                          sort.metric === `${selectedMetricKeys[index]}_change_pct` && sort.sortOrder === "asc"
                            ? "feather:arrow-up"
                            : "feather:arrow-down"
                        }
                        className="w-[10px] h-[10px]"
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
      <div className="flex flex-col" style={{ height: `${applicationDataAggregatedAndFiltered.length * 34 + applicationDataAggregatedAndFiltered.length * 5}px` }}>
        {/* <VerticalVirtuosoScrollContainer
          height={800}
          totalCount={applicationDataAggregatedAndFiltered.length}
          itemContent={(index) => (
            <ApplicationTableRow key={applicationDataAggregatedAndFiltered[index].owner_project} application={applicationDataAggregatedAndFiltered[index]} maxMetrics={maxMetrics} />
          )}
        /> */}
        <Virtuoso
          totalCount={applicationDataAggregatedAndFiltered.length}
          itemContent={renderItem}
          useWindowScroll
          increaseViewportBy={{ top: 200, bottom: 400 }}
          overscan={100}
        />
      </div>
      {/* </HorizontalScrollContainer> */}
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
      <div className="numbers-xs text-color-text-secondary w-[calc(7.33*4px+10px)] pl-[10px]">
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
      "166px",
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
        // gridDefinitionColumns={gridColumns}
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
            className="absolute z-[3] -left-[6px] h-[34px] w-[35px] pl-[5px] flex items-center justify-start bg-[radial-gradient(circle_at_-32px_16px,_var(--ui-active)_0%,_var(--ui-active)_72.5%,_transparent_90%)] group-hover:bg-[radial-gradient(circle_at_-32px_16px,_transparent_0%,_transparent_72.5%,_transparent_90%)] rounded-l-full border-[0.5px] border-r-0 border-color-bg-medium"
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
              <div className="min-w-0 h-[32px] flex items-center"> {/* Keep flex items-center here to vertically center */}
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
        <div className="flex items-center gap-x-[5px] pr-[15px] ">
          <Chains origin_keys={application.origin_keys} />
        </div>
        <div className="text-xs pr-[15px]">
          <GTPTooltipNew
            placement="bottom-start"
            allowInteract={true}
            size="md"
            trigger={
              <div className="flex-1 min-w-0 h-[32px] flex items-center"> {/* Keep flex items-center here to vertically center */}
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

          // if(metric === sort.metric){
          //   bgColor = "bg-color-ui-active";
          // }


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
        {/* #344240/30 */}
      </GridTableRow>
    </Link>
  )
}, areTableRowPropsEqual);

ApplicationTableRow.displayName = 'ApplicationTableRow';
