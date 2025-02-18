"use client";
import Container from "@/components/layout/Container";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { AggregatedDataRow, useApplicationsData } from "./_contexts/ApplicationsDataContext";
import { useMetrics } from "./_contexts/MetricsContext";
import { memo, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import VerticalVirtuosoScrollContainer from "@/components/VerticalVirtuosoScrollContainer";
import { Virtuoso } from "react-virtuoso";
import { ApplicationDisplayName, ApplicationIcon, Category, Chains, formatNumber, Links, MetricTooltip, TopGainersAndLosersTooltip } from "./_components/Components";
import { useProjectsMetadata } from "./_contexts/ProjectsMetadataContext";
import { useSort } from "./_contexts/SortContext";
import { ApplicationsURLs } from "@/lib/urls";
import { preload } from "react-dom";
import useDragScroll from "@/hooks/useDragScroll";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MetricInfo } from "@/types/api/MasterResponse";
import { useTimespan } from "./_contexts/TimespanContext";


// Preload data for the overview page
["1d", "7d", "30d", "90d", "365d", "max"].forEach((timespan) => {
  preload(ApplicationsURLs.overview.replace('{timespan}', timespan), { as: 'fetch' });
});

export default function Page() {
  const { applicationDataAggregated, isLoading } = useApplicationsData();
  const { selectedMetrics, selectedMetricKeys } = useMetrics();
  const { metricsDef } = useMetrics();
  const { sort } = useSort();
  const { timespans, selectedTimespan } = useTimespan();

  // const [medianMetricKey, setMedianMetricKey] = useState(selectedMetrics[0]);
  const [lastMedianMetric, setLastMedianMetric] = useState(selectedMetrics[0]);
  const [lastMedianMetricKey, setLastMedianMetricKey] = useState(selectedMetricKeys[0]);

  useEffect(() => {
    if(Object.keys(metricsDef).includes(sort.metric)){
      let key = sort.metric;
      if (sort.metric === "gas_fees")
        key = "gas_fees_eth";

      setLastMedianMetric(sort.metric);
      setLastMedianMetricKey(key);
    }
    
  }, [metricsDef, sort.metric]);

  const { topGainers, topLosers } = useMemo(() => {
    // let medianMetricKey = Object.keys(metricsDef).includes(sort.metric) ? sort.metric : "gas_fees";

    const medianMetricValues = applicationDataAggregated.map((application) => application[lastMedianMetricKey])
      .sort((a, b) => a - b);

    const medianValue = medianMetricValues[Math.floor(medianMetricValues.length / 2)];

    // console.log("medianMetricKey", medianMetricKey);
    // console.log("medianValue", medianValue);
    // console.log("applicationDataAggregated", applicationDataAggregated);

    // filter out applications with < median value of selected metric and with previous value of 0
    const filteredApplications = applicationDataAggregated
      .filter((application) => application[lastMedianMetricKey] > medianValue && application["prev_" + lastMedianMetricKey] > 0);
    // console.log("filteredApplications", filteredApplications);

    // top 3 applications with highest change_pct
    return {
      topGainers: [...filteredApplications]
        .sort((a, b) => b[lastMedianMetricKey + "_change_pct"] - a[lastMedianMetricKey + "_change_pct"])
        .slice(0, 3),
      topLosers: [...filteredApplications]
        .sort((a, b) => a[lastMedianMetricKey + "_change_pct"] - b[lastMedianMetricKey + "_change_pct"])
        .slice(0, 3),
    }
  }, [applicationDataAggregated, lastMedianMetricKey]);

  return (
    <>
    <div>
      {/* <Container className="sticky top-[230px] z-10 pt-[30px]"> */}
      {/* <div>{JSON.stringify(sort)}</div>
      <div>metrics: {JSON.stringify(selectedMetrics)}</div>
      <div>metricKeys{JSON.stringify(selectedMetricKeys)}</div> */}
      <div className={`transition-[max-height,opacity] duration-300 ${selectedTimespan === "max" ? "overflow-hidden max-h-0 opacity-0" : "max-h-[calc(78px+150px)] md:max-h-[530px] lg:h-[380px] opacity-100"}`}>
        <Container className={`pt-[30px]`}>
          <div className="flex flex-col gap-y-[10px] ">
            <div className="heading-large">Top Gainers and Losers by {metricsDef[lastMedianMetric].name}</div>
            <div className="flex justify-between items-center gap-x-[10px]">
            <div className="text-xs">
              Projects that saw the biggest change in {metricsDef[lastMedianMetric].name} over the last {timespans[selectedTimespan].label}.
            </div>
            <Tooltip placement="left">
              <TooltipTrigger>
            <div className="size-[15px]">
              <Icon icon="feather:info" className="size-[15px]" />
            </div>
            </TooltipTrigger>
            <TooltipContent className="z-[99]">
              <TopGainersAndLosersTooltip metric={selectedMetrics[0]} />
            </TooltipContent>
            </Tooltip>
            </div>
          </div>
        </Container>
        <Container className={`hidden h-[450px] lg:h-[300px] md:grid md:grid-rows-3 md:grid-flow-col lg:grid-rows-2 lg:grid-flow-row pt-[10px] lg:grid-cols-3 gap-[10px]`}>
          {topGainers.map((application, index) => (
            <ApplicationCard key={application.owner_project} application={application} />
          ))}
          {topLosers.map((application, index) => (
            <ApplicationCard key={application.owner_project} application={application} />
          ))}
          {isLoading && new Array(6).fill(0).map((_, index) => (
            <ApplicationCard key={index} application={undefined} />
          ))}
        </Container>
        </div>
        {/* <Container> */}
        <div className={`block md:hidden h-[150px] pt-[10px]`}>
          <CardSwiper cards={[...topGainers.map((application) => <ApplicationCard key={application.owner_project} application={application} />), ...topLosers.map((application) => <ApplicationCard key={application.owner_project} application={application} />)]} />
        </div>
      </div>
      {/* </Container> */}
      {/* {applicationDataAggregated.length > 0 && <ApplicationCardSwiper />} */}
      <Container className="pt-[30px] pb-[15px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="heading-large">Top Ranked</div>
          <div className="text-xs">
            Applications ranked by {metricsDef[lastMedianMetric].name} and any applied chain or string filter(s). You can apply filters by clicking on the chain icons or by using the search bar.
          </div>
        </div>
      </Container>
      {/* <HorizontalScrollContainer reduceLeftMask={true}> */}
      <HorizontalScrollContainer className="!px-0" reduceLeftMask={true}>
        {/* <div className={`absolute inset-0`}>
          <div
            className="bg-[#151a19] z-[0] absolute inset-0 pointer-events-none"
            style={{
              // -88px if scrolled to top of page, -88px + scrollY if scrolled down (max 0)
              top: `${Math.min(0, -88 + scrollY)}px`,
              backgroundPosition: `top`,
              // maskImage: isMobile ? `linear-gradient(to bottom, white 0, white 120px, transparent 150px` : `linear-gradient(to bottom, white 0, white 200px, transparent 230px`,
              maskImage: `linear-gradient(to bottom, white 0, white 250px, transparent 260px`,
            }}
          >
            <div className="background-gradient-group">
              <div className="background-gradient-yellow"></div>
              <div className="background-gradient-green"></div>
            </div>
          </div>
        </div> */}
        <ApplicationsTable />
      </HorizontalScrollContainer>
      {/* </HorizontalScrollContainer> */}
    </>
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
            className={`transition-[transform,opacity] duration-300 ease-in-out ${
              index === activeIndex ? "scale-100 opacity-100" : "scale-[0.75] opacity-50"
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



const ApplicationCard = memo(({ application, className, width }: { application?: AggregatedDataRow, className?: string, width?: number }) => {
  const { AllChainsByKeys } = useMaster();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedChains, setSelectedChains, } = useApplicationsData();
  const { selectedMetrics, metricsDef } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const router = useRouter();

  const numContractsString = useCallback((application: AggregatedDataRow) => {
    return application.num_contracts.toLocaleString("en-GB");
  }, []);


  const metricKey = useMemo(() => {
    let key = selectedMetrics[0];
    if (selectedMetrics[0] === "gas_fees")
      key = showUsd ? "gas_fees_usd" : "gas_fees_eth";

    return key;
  }, [selectedMetrics, showUsd]);

  const rank = useMemo(() => {
    if (!application) return null;

    return application[`rank_${metricKey}`];

  }, [application, metricKey]);

  const value = useMemo(() => {
    if (!application) return null;

    return application[metricKey];
  }, [application, metricKey]);

  const prefix = useMemo(() => {
    const def = metricsDef[selectedMetrics[0]].units;

    if (Object.keys(def).includes("usd")) {
      return showUsd ? def.usd.prefix : def.eth.prefix;
    } else {
      return Object.values(def)[0].prefix;
    }
  }, [metricsDef, selectedMetrics, showUsd]);

  if (!application) {
    return (
      <div className={`flex flex-col justify-between h-[140px] border-[0.5px] border-[#5A6462] rounded-[15px] px-[15px] pt-[5px] pb-[10px] min-w-[340px] ${className || ""} `} style={{ width: width || undefined }}>
      </div>
    )
  }

  return (
    <div 
      className={`flex flex-col justify-between h-[140px] border-[0.5px] border-[#5A6462] rounded-[15px] px-[15px] pt-[5px] pb-[10px] ${className || ""} group hover:cursor-pointer hover:bg-forest-500/10`} 
      style={{ width: width || undefined }}
      onClick={() => {
        // window.location.href = `/applications/${application.owner_project}`;
        router.push(`/applications/${application.owner_project}`);
      }}
    >
      <div>
        <div className="w-full h-[20px] flex justify-between items-center">
          <div className="flex items-center gap-x-[3px]">
            <div className="numbers-xs text-[#CDD8D3]">{numContractsString(application)}</div>
            <div className="text-xs text-[#5A6462]">contracts</div>
          </div>
          <div className="flex items-end gap-x-[3px]">
            <div className="numbers-xs text-[#5A6462]">Rank</div>
            <div className="numbers-xs text-[#CDD8D3]">{rank}</div>
          </div>
        </div>

        <div className="w-full flex justify-between items-start">
          <div/>
          <div className="flex flex-col items-end gap-y-[2px]">
            <div className="flex flex-col items-end justify-start gap-y-[3px]">
              <div className="flex justify-end numbers-sm text-[#CDD8D3] w-[100px]">
                {prefix}
                {value?.toLocaleString("en-GB")}
              </div>
              <div className="flex items-end gap-x-[3px]">
                {application[`${metricKey}_change_pct`] !== Infinity ? (
                  <div className={`h-[3px] flex justify-end w-[45px] numbers-xxxs ${application[`${metricKey}_change_pct`] < 0 ? 'text-[#FF3838]' : 'text-[#4CFF7E]'}`}>
                    {/* {application[`${metricKey}_change_pct`] < 0 ? '-' : '+'}{formatNumber(Math.abs(application[`${metricKey}_change_pct`]), {defaultDecimals: 1, thresholdDecimals: {base:0}})}% */}
                    {application[`${metricKey}_change_pct`] < 0 ? '-' : '+'}{Math.abs(application[`${metricKey}_change_pct`]).toLocaleString("en-GB",{maximumFractionDigits:0})}%
                  </div>
                ) : (
                  <div className="w-[49px]">&nbsp;</div>
                )}
            </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex items-center gap-x-[5px]">
        <ApplicationIcon owner_project={application.owner_project} size="md" />
        {/* {ownerProjectToProjectData[application.owner_project] ? (
          <div className="heading-large-md flex-1 group-hover:underline"><ApplicationDisplayName owner_project={application.owner_project} /></div>
        ) : (
          <div className="heading-large-md flex-1 opacity-60 group-hover:underline"><ApplicationDisplayName owner_project={application.owner_project} /></div>
        )} */}
        <div className="heading-large-md flex-1 overflow-visible">
          <div className="relative group/tooltip heading-large-md w-fit group-hover:underline min-h-[32px] flex flex-col justify-center overflow-visible">
          <ApplicationDisplayName owner_project={application.owner_project} />
          <ApplicationTooltip application={application} />
          </div>
        </div>
        <Link className="cursor-pointer size-[24px] bg-[#344240] rounded-full flex justify-center items-center" href={`/applications/${application.owner_project}`}>
          <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-[#CDD8D3]" />
        </Link>
      </div>
      <div className="flex items-center justify-between gap-x-[5px]">
        <div className="text-xs">
          <Category category={ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].main_category : ""} />
        </div>
        <div className="h-[20px] flex items-center gap-x-[5px]">
          {/* {application.origin_keys.map((chain, index) => (
            <div
              key={index}
              className={`cursor-pointer ${selectedChains.includes(chain) ? '' : '!text-[#5A6462]'} hover:!text-inherit`} style={{ color: AllChainsByKeys[chain] ? AllChainsByKeys[chain].colors["dark"][0] : '' }}
              onClick={() => {
                if (selectedChains.includes(chain)) {
                  setSelectedChains(selectedChains.filter((c) => c !== chain));
                } else {
                  setSelectedChains([...selectedChains, chain]);
                }
              }}
            >
              {AllChainsByKeys[chain] && (
                <Icon
                  icon={`gtp:${AllChainsByKeys[
                    chain
                  ].urlKey
                    }-logo-monochrome`}
                  className="w-[15px] h-[15px]"
                  style={{
                    color: AllChainsByKeys[chain].colors["dark"][0],
                  }}
                />
              )}
            </div>
          ))} */}
          <Chains origin_keys={application.origin_keys} />
        </div>
        
      </div>
    </div>
  )
});

ApplicationCard.displayName = 'ApplicationCard';



const ApplicationsTable = () => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { applicationDataAggregated} = useApplicationsData();
  const { sort, setSort } = useSort();
  const { metricsDef, selectedMetrics, setSelectedMetrics, selectedMetricKeys, } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const metricKey = useMemo(() => {
    let key = selectedMetrics[0];
    if (selectedMetrics[0] === "gas_fees")
      key = showUsd ? "gas_fees_usd" : "gas_fees_eth";

    return key;
  }, [selectedMetrics, showUsd]);


  const maxMetrics = useMemo(() => {
    return selectedMetricKeys.map((metric) => {
      return applicationDataAggregated.reduce((acc, application) => {
        return Math.max(acc, application[metric]);
      }, 0);
    });
  }, [applicationDataAggregated, selectedMetricKeys]);


  const rowData = useMemo(() => {
    return applicationDataAggregated.map((application) => {
      return {
        logo_path: ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].logo_path : "",
        owner_project: application.owner_project,
        display_name: ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].display_name : application.owner_project,
        origin_keys: application.origin_keys,
        category: ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].main_category : "",
        num_contracts: application.num_contracts,
        gas_fees: application[metricKey],
        gas_fees_eth: application.gas_fees_eth,
        gas_fees_usd: application.gas_fees_usd,
        gas_fees_change_pct: application[metricKey + "_change_pct"],
        rank_gas_fees: application[`rank_${metricKey}`],


      };
    });
  }, [applicationDataAggregated, metricKey, ownerProjectToProjectData]);

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() =>
    `26px 255px 95px minmax(135px,800px) 95px ${selectedMetricKeys.map(() => `247px`).join(" ")} 20px`,
    [selectedMetricKeys]
  );


  return (
    <>
    {/* <HorizontalScrollContainer reduceLeftMask={true}> */}
      <GridTableHeader
        gridDefinitionColumns={gridColumns}
        // className="sticky top-[250px] group text-[14px] !px-[5px] !py-0 gap-x-[15px] !pb-[4px] !z-[10]"
        className="group text-[14px] !px-[5px] !py-0 gap-x-[15px] !pb-[4px] !z-[10]"
        style={{
          gridTemplateColumns: gridColumns,
        }}
      >
        <div />
        <GridTableHeaderCell
          metric="owner_project"
          className="heading-small-xs pl-[0px]"
          sort={sort}
          setSort={setSort}
        >
          Application
        </GridTableHeaderCell>
        <GridTableHeaderCell
          metric="origin_keys"
          className="heading-small-xs"
          sort={sort}
          setSort={setSort}
        >
          Chains
        </GridTableHeaderCell>
        <GridTableHeaderCell
          metric="category"
          className="heading-small-xs"
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
          className="heading-small-xs"
          justify="end"
          sort={sort}
          setSort={setSort}
        >
          # Contracts
        </GridTableHeaderCell>
        {selectedMetrics.map((metric, index) => {
          // let key = selectedMetricKeys[index];
          return (
            <GridTableHeaderCell
              key={index}
              metric={metric}
              className="heading-small-xs pl-[25px] pr-[15px] z-[0] whitespace-nowrap"
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
                <div className="flex items-center gap-x-[5px] pl-[5px] cursor-default z-[10]">
                  <div
                    className="cursor-pointer flex items-center rounded-full bg-[#344240] text-[#CDD8D3] gap-x-[2px] px-[5px] h-[18px]"
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
                  <Tooltip placement="bottom">
                    <TooltipTrigger>
                      <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                    </TooltipTrigger>
                    <TooltipContent className="z-[99]">
                      <MetricTooltip metric={metric} />
                    </TooltipContent>
                  </Tooltip>
                </div>
              }
            >
              {metricsDef[metric].name} {Object.keys(metricsDef[metric].units).includes("eth") && <>({showUsd ? "USD" : "ETH"})</>}
            </GridTableHeaderCell>
          )
        })}
        <div />
      </GridTableHeader>
      <div className="flex flex-col" style={{ height: `${applicationDataAggregated.length * 34 + applicationDataAggregated.length * 5}px` }}>
        {/* <VerticalVirtuosoScrollContainer
          height={800}
          totalCount={applicationDataAggregated.length}
          itemContent={(index) => (
            <ApplicationTableRow key={applicationDataAggregated[index].owner_project} application={applicationDataAggregated[index]} maxMetrics={maxMetrics} />
          )}
        /> */}
        <Virtuoso
          totalCount={applicationDataAggregated.length}
          itemContent={(index) => (
            <div key={applicationDataAggregated[index].owner_project} className="pb-[5px]">
            <ApplicationTableRow application={applicationDataAggregated[index]} maxMetrics={maxMetrics} />
            </div>
          )}
          useWindowScroll
          increaseViewportBy={{top:0, bottom: 400}}
          overscan={50}
          />
      </div>
      {/* </HorizontalScrollContainer> */}
      </>
    
  )
}

type AltApplicationTableRowProps = {
  logo_path: string;
  owner_project: string;
  display_name: string;
  origin_keys: string[];
  category: string;
  num_contracts: number;
  gas_fees: number;
  gas_fees_eth: number;
  gas_fees_usd: number;
  gas_fees_change_pct: number;
  rank_gas_fees: number;
};


const Value = memo(({ rank, def, value, change_pct, maxMetric, metric}: { rank: number, def: MetricInfo, value: number, change_pct: number, maxMetric: number, metric: string }) => {
  const { sort } = useSort();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const {selectedMetrics} = useMetrics();

  const isSelectedMetric = useMemo(() =>
    sort.metric === metric,
    [sort.metric, metric]
  );
  

  const progressWidth = useMemo(() =>
    `${(value / maxMetric) * 100}%`,
    [value, maxMetric]
  );

  return (
    <div className="flex items-center justify-end gap-[10px]">
      <div className="numbers-xs text-[#5A6462]">{isSelectedMetric && rank}</div>
      <div className="w-[178px] flex flex-col items-end gap-y-[2px]">

        <div className="flex justify-end items-center gap-x-[2px]">
          <div className="numbers-xs">
            {Object.keys(def.units).includes("eth") ? showUsd ? def.units.usd.prefix : def.units.eth.prefix : Object.values(def.units)[0].prefix}
            {Object.keys(def.units).includes("eth") ? showUsd ? value.toLocaleString("en-GB", { minimumFractionDigits: def.units.usd.decimals, maximumFractionDigits: def.units.usd.decimals }) : value.toLocaleString("en-GB", { minimumFractionDigits: def.units.eth.decimals, maximumFractionDigits: def.units.eth.decimals }) : value.toLocaleString("en-GB", { minimumFractionDigits: Object.values(def.units)[0].decimals, maximumFractionDigits: Object.values(def.units)[0].decimals })}
          </div>
          {change_pct !== Infinity ? (
            <div className={`numbers-xxs w-[49px] text-right ${change_pct < 0 ? 'text-[#FF3838]' : 'text-[#4CFF7E]'}`}>
              {change_pct < 0 ? '-' : '+'}{Math.abs(change_pct).toFixed(0)}%
            </div>
            ) : (
            <div className="w-[49px]">&nbsp;</div>
          )}
        </div>
        <div className="relative w-full h-[4px] rounded-full">
          <div className="absolute h-[4px] right-0 transition-[width]"
            style={{
              width: progressWidth,
              background: "linear-gradient(145deg, #FE5468 0%, #FFDF27 100%)",
              borderRadius: "999px",
            }}
          />

          {/* {maxMetric} */}
        </div>
      </div>
    </div>
  )
});

Value.displayName = 'Value';



const ApplicationTableRow = memo(({ application, maxMetrics }: { application: AggregatedDataRow, maxMetrics: number[] }) => {
  const { ownerProjectToProjectData  } = useProjectsMetadata();
  const { metricsDef, selectedMetrics, selectedMetricKeys, } = useMetrics();
  const router = useRouter();
  

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() =>
    `26px 255px 95px minmax(135px,800px) 95px ${selectedMetricKeys.map(() => `247px`).join(" ")} 20px`,
    [selectedMetricKeys]
  );

  return (
    <GridTableRow
      gridDefinitionColumns={gridColumns}
      className={`group text-[14px] !px-[5px] !py-0 h-[34px] gap-x-[15px]`}
      style={{
        gridTemplateColumns: gridColumns,
      }}
      onClick={() => {
        // window.location.href = `/applications/${application.owner_project}`;
        router.push(`/applications/${application.owner_project}`);
      }}
    >
      <div className="sticky z-[100] -left-[12px] md:-left-[46px] w-[30px] flex items-center justify-center overflow-visible">
        <div
          className="absolute z-[3] -left-[6px] h-[34px] w-[35px] pl-[5px] flex items-center justify-start bg-[radial-gradient(circle_at_-32px_16px,_#151A19_0%,_#151A19_72.5%,_transparent_90%)] group-hover:bg-[radial-gradient(circle_at_-32px_16px,_transparent_0%,_transparent_72.5%,_transparent_90%)] rounded-l-full border-[0.5px] border-r-0 border-[#5A6462]"
        >
          <ApplicationIcon owner_project={application.owner_project} size="sm" />
        </div>
      </div>
      <div className="flex items-center gap-x-[5px] justify-between group-hover:underline">
        <div className="relative group/tooltip min-h-[32px] flex flex-col justify-center">
          <ApplicationDisplayName owner_project={application.owner_project} />
          <ApplicationTooltip application={application} />
        </div>
      </div>
      <div className="flex items-center gap-x-[5px]">
        <Chains origin_keys={application.origin_keys} />
      </div>
      <div className="text-xs">
        <Category category={ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].main_category : ""} />
      </div>
      <div className="numbers-xs text-right">
        {application.num_contracts}
      </div>
      {selectedMetrics.map((metric, index) => {
      const metricKey = selectedMetricKeys[index];
      return (
        <div
          key={index}
          className={`flex justify-end pr-[15px] items-center text-right h-full ${selectedMetricKeys.length == 1 || (selectedMetricKeys.length > 1 && (index + 1) % 2 == 0) ? 'bg-[#344240]/30' : ''} `}
        >
          <Value rank={application[`rank_${metricKey}`]} def={metricsDef[metric]} value={application[metricKey]} change_pct={application[`${metricKey}_change_pct`]} maxMetric={maxMetrics[index]} metric={selectedMetrics[index]} />
        </div>
      )})}
      <div className="relative flex justify-end items-center pr-[0px]">
        <Link className="absolute cursor-pointer size-[24px] bg-[#344240] rounded-full flex justify-center items-center" href={`/applications/${application.owner_project}`}>
          <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-[#CDD8D3]" />
        </Link>
      </div>
      {/* #344240/30 */}
    </GridTableRow>
  )
});

ApplicationTableRow.displayName = 'ApplicationTableRow';

const ApplicationTooltip = memo(({application}: {application: AggregatedDataRow}) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { applicationDataAggregated } = useApplicationsData();

  const descriptionPreview = useMemo(() => {
    if (!application || !ownerProjectToProjectData[application.owner_project] || !ownerProjectToProjectData[application.owner_project].description) return "";
    const chars = ownerProjectToProjectData[application.owner_project].description.length;
    const firstPart = ownerProjectToProjectData[application.owner_project].description.slice(0, Math.min(100, chars));

    return firstPart.split(" ").slice(0, -1).join(" ");
    
  }, [application, ownerProjectToProjectData]);

  // const [mouseOffsetX, setMouseOffsetX] = useState(0);

  // // get the mouse position on mount
  // useEffect(() => {
  //   const handleMouseMove = (e: MouseEvent) => {
  //     setMouseOffsetX(e.offsetX);
  //   };

  //   window.addEventListener("mousemove", handleMouseMove);
  //   return () => window.removeEventListener("mousemove", handleMouseMove);
  // }, []);

  

  if(!application || !ownerProjectToProjectData) return null;

  return (
    <div
      className="cursor-default z-[20] absolute p-[15px] left-[30px] w-[345px] top-[32px] bg-[#1F2726] rounded-[15px] transition-opacity duration-300 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none group-hover/tooltip:pointer-events-auto hover:pointer-events-auto"
      style={{
        boxShadow: "0px 0px 30px #000000",
        // left: `${mouseOffsetX}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="flex flex-col pl-[5px] gap-y-[10px]">
        {/* {mouseOffsetX} */}
        <div className="flex gap-x-[5px] items-center w-max">
          {ownerProjectToProjectData[application.owner_project] && ownerProjectToProjectData[application.owner_project].logo_path ? (
            <Image
              src={`https://api.growthepie.xyz/v1/apps/logos/${ownerProjectToProjectData[application.owner_project].logo_path}`}
              width={15} height={15}
              className="select-none rounded-full size-[15px]"
              alt={application.owner_project}
              onDragStart={(e) => e.preventDefault()}
              loading="eager"
              priority={true}
            />
          ) : (
            <div className={`flex items-center justify-center size-[15px] bg-[#151A19] rounded-full`}>
              <GTPIcon icon="gtp-project-monochrome" size="sm" className="!size-[12px] text-[#5A6462]" containerClassName="flex items-center justify-center" />
            </div>
          )}
          <div className="heading-small-xs whitespace-nowrap">{ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].display_name : application.owner_project}</div>
        </div>
        <div className="text-xs">
          {descriptionPreview}...
        </div>
          <Links owner_project={application.owner_project} showUrl={true} />
      </div>

    </div>
  )
});

ApplicationTooltip.displayName = 'ApplicationTooltip';

