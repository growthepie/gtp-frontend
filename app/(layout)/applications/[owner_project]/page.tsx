"use client";
import Container from "@/components/layout/Container";
import { useProjectsMetadata } from "../_contexts/ProjectsMetadataContext";
import { useMetrics } from "../_contexts/MetricsContext";
import { ContractDict, MetricData, useApplicationDetailsData } from "../_contexts/ApplicationDetailsDataContext";
import { useTimespan } from "../_contexts/TimespanContext";
import { useMaster } from "@/contexts/MasterContext";
import { StackedDataBar } from "../_components/GTPChart";
import { ChartScaleProvider } from "../_contexts/ChartScaleContext";
import ChartScaleControls from "../_components/ChartScaleControls";
import { ApplicationDisplayName, ApplicationIcon, Category, Chains, formatNumber, Links, MetricTooltip } from "../_components/Components";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { GridTableAddressCell, GridTableHeader, GridTableHeaderCell, GridTableRow } from "@/components/layout/GridTable";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import { Icon } from "@iconify/react";
import VerticalVirtuosoScrollContainer from "@/components/VerticalVirtuosoScrollContainer";
import Link from "next/link";
import { SortProvider, useSort } from "../_contexts/SortContext";
import { useUIContext } from "@/contexts/UIContext";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { Virtuoso } from "react-virtuoso";
import { useRouter } from "next/navigation";
import { AggregatedDataRow, useApplicationsData } from "../_contexts/ApplicationsDataContext";
import useDragScroll from "@/hooks/useDragScroll";

type Props = {
  params: { owner_project: string };
};

export default function Page({ params: { owner_project } }: Props) {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedMetrics } = useMetrics();

  // const projectData = ownerProjectToProjectData[owner_project];

  return (
    <>
      {selectedMetrics.map((metric, index) => (
        <ChartScaleProvider
          key={index} 
          scaleDefs={{
            absolute: {
              label: 'Absolute',
              value: 'absolute',
            },
            stacked: {
              label: 'Stacked',
              value: 'stacked',
            },
            percentage: {
              label: 'Percentage',
              value: 'percentage',
            },

          }}
        >
          <MetricSection metric={metric} owner_project={owner_project} />
          <ChartScaleControls />
        </ChartScaleProvider>
      ))}
      <Container>
      <div className="pt-[30px] pb-[15px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="heading-large">Most Active Contracts</div>
          <div className="text-xs">
            See the most active contracts within the selected timeframe (Maximum) for 1inch.
          </div>
        </div>
        
          
      </div>
      </Container>
      <ContractsTable />
      <Container>
      {/* <div className="rounded-md bg-forest-1000/60 h-[152px] w-full"></div> */}
      <div className="pt-[30px] pb-[15px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="heading-large">Similar Applications</div>
          <div className="text-xs">
            See other applications similar to 1inch sorted by their performance in terms of gas fees.
          </div>
        </div>
        
      </div>
      {/* <div className="rounded-md bg-forest-1000/60 h-[140px] w-full"></div> */}
      </Container>
      <SimilarApplications owner_project={owner_project} />

    </>
  );
}

const MetricSection = ({ metric, owner_project }: { metric: string; owner_project: string }) => {
  const { metricsDef } = useMetrics();
  const { ownerProjectToProjectData } = useProjectsMetadata();

  const def = metricsDef[metric];

  if (!def) {
    return null;
  }

  return (
    <>
      <Container className="pt-[30px] pb-[15px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="heading-large">{def.name} across different chains</div>
          <div className="text-xs">
            {ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].display_name} is available on multiple chains. Here you see how much usage is on each based on the respective metric.
          </div>
        </div>
      </Container>
      <Container>
      <MetricChainBreakdownBar metric={metric} />
        <div className="rounded-md bg-forest-1000/60 h-[163px] w-full"></div>
      </Container>
    </>
  );
}

interface FloatingTooltipProps {
  content: React.ReactNode;
  offsetX?: number;
  offsetY?: number;
  children: React.ReactNode;
}

const FloatingTooltip: React.FC<FloatingTooltipProps> = ({
  content,
  offsetX = 20,
  offsetY = 20,
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [adjustedCoords, setAdjustedCoords] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const newCoords = {
      x: e.clientX + offsetX,
      y: e.clientY + offsetY,
    };
    setCoords(newCoords);
  };

  useEffect(() => {
    if (visible && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      let newX = coords.x;
      let newY = coords.y;
      // Prevent overflow on the right edge.
      if (coords.x + tooltipRect.width > window.innerWidth) {
        newX = window.innerWidth - tooltipRect.width - 10;
      }
      // Prevent overflow on the bottom edge.
      if (coords.y + tooltipRect.height > window.innerHeight) {
        newY = window.innerHeight - tooltipRect.height - 10;
      }
      setAdjustedCoords({ x: newX, y: newY });
    }
  }, [coords, visible]);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onMouseMove={handleMouseMove}
    >
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          style={{
            left: adjustedCoords.x,
            top: adjustedCoords.y,
          }}
          className="fixed mt-3 mr-3 mb-3 w-52 md:w-60 text-xs font-raleway bg-[#2A3433EE] text-white rounded-[17px] px-3 py-2 shadow-lg pointer-events-none z-50"
        >
          {content}
        </div>
      )}
    </div>
  );
};

const MetricChainBreakdownBar = ({ metric }: { metric: string }) => {
  const { data, owner_project} = useApplicationDetailsData();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedTimespan } = useTimespan();
  const {AllChainsByKeys} = useMaster();
  const { metricsDef } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { isSidebarOpen } = useUIContext();

  const containerRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, [containerRef.current]);

  const handleResize = () => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  };

  useEffect(() => {
    // on sidebar open/close (timeout to wait for sidebar animation)
    const timeout = setTimeout(() => {
        handleResize();
      }, 300);
    return () => {
      clearTimeout(timeout);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [containerRef.current]);

  const metricDefinition = metricsDef[metric];

  let prefix = "";
  let valueKey = "value";
  if(metricDefinition.units.eth) {
    prefix = showUsd ? metricDefinition.units.usd.prefix || "" : metricDefinition.units.eth.prefix || "";
    valueKey = showUsd ? "usd" : "eth";
  } else {
    prefix = Object.values(metricDefinition.units)[0].prefix || "";
    valueKey = Object.keys(metricDefinition.units)[0];
  }



  const metricData = data.metrics[metric] as MetricData;
  // filter out chains with 0 value
  const chainsData = Object.entries(metricData.aggregated.data).filter(([chain, valsByTimespan]) => valsByTimespan[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)] > 0)
  // sort by chain asc
  .sort(([chainA], [chainB]) => chainA.localeCompare(chainB));
  const values = chainsData.map(([chain, valsByTimespan]) => valsByTimespan[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)]);
  const total = Object.values(values).reduce((acc, v) => acc + v, 0);
  const percentages = values.map((v) => (v / total) * 100);
  
  const cumulativePercentages = percentages.reduce((acc, v, i) => {
    const prev = acc[i - 1] || 0;
    return [...acc, prev + v];
  }, [] as number[]);

  console.log("cumulativePercentages", cumulativePercentages);

  if (!metricData) {
    return null;
  }

  return (
    
    <div className="pb-[15px]">
      <div className="flex items-center h-[34px] rounded-full bg-[#344240] p-[2px]">
        <div className="flex items-center h-[30px] w-full rounded-full overflow-hidden bg-black/60 relative" ref={containerRef}>
          <div className="absolute left-0 flex gap-x-[10px] items-center h-full w-[140px] bg-[#1F2726] p-[2px] rounded-full" style={{zIndex: chainsData.length + 1}}>
            <ApplicationIcon owner_project={owner_project} size="sm" />
            <div className="flex flex-col -space-y-[2px] mt-[2px]">
              <div className="numbers-sm">{prefix}{formatNumber(values.reduce((acc, v) => acc + v, 0), {defaultDecimals: 2, thresholdDecimals: {base:5}})}</div>
              <div className="text-xxs">{ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].display_name || ""}</div>
            </div>
          </div>
          <div className="flex flex-1 h-full">
          {chainsData.map(([chain, values], i) => {
            const zIndex = chainsData.length - i;
            let lastPercentagesTotal = i === 0 ? 0 : percentages.slice(0, i).reduce((acc, v) => acc + v, 0);
            let thisPercentage = percentages[i];
            
            
            if(thisPercentage < 0.15) {
              thisPercentage = 0.15;
            }
            let thisPercentageWidth = thisPercentage + (i === 0 ? 0 : lastPercentagesTotal);
            const thisRenderWidth = (thisPercentageWidth/100) * (containerWidth - 140);

            // Example tooltip content – adjust as needed
            const tooltipContent = (
              <>
              {/* <div className="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2">
                20 Jan 2025
              </div> */}
              <div className="flex w-full space-x-2 items-center font-medium mb-0.5">
                <div
                  className="w-4 h-1.5 rounded-r-full"
                  style={{ backgroundColor: AllChainsByKeys[chain].colors.dark[0] }}
                ></div>
                <div className="tooltip-point-name text-xs">{AllChainsByKeys[chain].label}</div>
                <div className="flex-1 text-right justify-end numbers-xs flex">
                  <div className="hidden"></div>
                  {prefix}{values[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)].toLocaleString("en-GB", { maximumFractionDigits: 2 })}
                  <div className="ml-0.5 hidden"></div>
                </div>
              </div>
              {/* Additional lines for other points… */}
            </>
            );
            
            return (
              <FloatingTooltip key={chain} content={tooltipContent}>
            <div 
              className="absolute h-full rounded-full transition-all"
              style={{
                background: AllChainsByKeys[chain].colors.dark[0],
                // take containerWidth and 140px into account
                width: `calc(${thisRenderWidth}px + 135px)`,
                left: '5px',
                zIndex: zIndex,
              }}
              >
                <div className="@container absolute inset-0 left-[135px] right-[15px] flex items-center justify-end text-[#1F2726] truncate" 
                style={{

                  zIndex:zIndex + 1,
                }}
                >
                  <div className="flex items-center gap-x-[5px]"
                  style={{color: AllChainsByKeys[chain].darkTextOnBackground ? "#1F2726" : "#CDD8D3"}}
                  >
                    <div className="text-xs !font-semibold hidden @[80px]:block truncate">
                    {AllChainsByKeys[chain].name_short}
                    </div>
                    <div className="numbers-xs hidden @[30px]:block ">
                      {percentages[i].toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
              </FloatingTooltip>
              )
          })}
          </div>
        </div>
      </div>
      </div>
  );
}


const ContractsTable = () => {
  const { data, owner_project, contracts} = useApplicationDetailsData();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedTimespan } = useTimespan();
  const {AllChainsByKeys} = useMaster();
  const { metricsDef, selectedMetrics, setSelectedMetrics, selectedMetricKeys, } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const {sort, setSort} = useSort();
  const [showMore, setShowMore] = useState(false);

  const metricKey = useMemo(() => {
    let key = selectedMetrics[0];
    if (selectedMetrics[0] === "gas_fees")
      key = showUsd ? "gas_fees_usd" : "gas_fees_eth";

    return key;
  }, [selectedMetrics, showUsd]);

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() =>
    `26px 280px 95px minmax(135px,800px) ${selectedMetricKeys.map(() => `237px`).join(" ")} 20px`,
    [selectedMetricKeys]
  );

  return (
    <HorizontalScrollContainer reduceLeftMask={true}>
      <GridTableHeader
        gridDefinitionColumns={gridColumns}
        className="group text-[14px] !px-[5px] !py-0 gap-x-[15px] !pb-[4px]"
        style={{
          gridTemplateColumns: gridColumns,
        }}
      >
        <div />
        <GridTableHeaderCell
          metric="name"
          className="heading-small-xs pl-[0px]"
        >
          Application
        </GridTableHeaderCell>
        <GridTableHeaderCell
          metric="main_category_key"
          className="heading-small-xs"
        >
          Category
        </GridTableHeaderCell>
        <GridTableHeaderCell
          metric="sub_category_key"
          className="heading-small-xs"
          justify="end"
        >
          Subcategory
        </GridTableHeaderCell>
        {selectedMetrics.map((metric, index) => {
            const metricMap = {
              "gas_fees": "fees_paid_",
              "txcount": "txcount",
              "daa": "daa",
            }
            const metricKey = `${metricMap[metric]}${metric === "gas_fees" && (showUsd ? "usd" : "eth")}`;
          return (
            <GridTableHeaderCell
              key={metric}
              metric={metric}
              className="heading-small-xs pl-[25px] pr-[15px] z-[0] whitespace-nowrap"
              justify="end"
              sort={sort}
              setSort={setSort}
            >
              {metricsDef[metric].name} {Object.keys(metricsDef[metric].units).includes("eth") && <>({showUsd ? "USD" : "ETH"})</>}
            </GridTableHeaderCell>
          )
        })}
        <div />
      </GridTableHeader>
      {/* <div className="flex flex-col" style={{ height: `${contracts.length * 34 + contracts.length * 5}px` }}>
        <VerticalVirtuosoScrollContainer
          height={800}
          totalCount={contracts.length}
          itemContent={(index) => (
            <div key={index} className="pb-[5px]">
            <ContractsTableRow contract={contracts[index]} />
            </div>
          )}
        />
      </div> */}
      <div className="flex flex-col" style={{ height: `${contracts.slice(0,showMore ? contracts.length : 5).length * 34 + contracts.slice(0,showMore ? contracts.length : 5).length * 5}px` }}>
        <Virtuoso
          totalCount={contracts.slice(0,showMore ? contracts.length : 5).length}
          itemContent={(index) => (
            <div key={index} className="pb-[5px]">
            <ContractsTableRow contract={contracts.slice(0,showMore ? contracts.length : 5)[index]} />
            </div>
          )}
          useWindowScroll
          increaseViewportBy={{top:0, bottom: 400}}
          overscan={50}
          />
      </div>
      <div className="flex items-center justify-center pt-[21px]">
        <div className="flex items-center justify-center rounded-full h-[36px] w-[117px] border border-[#CDD8D3] text-[#CDD8D3] cursor-pointer text-md" onClick={() => setShowMore(!showMore)}>
          {showMore ? "Show less" : "Show more"}
        </div>
      </div>
    </HorizontalScrollContainer>
  )
}


const ContractValue = memo(({ contract, metric } : { contract: ContractDict, metric: string }) => {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { metricsDef } = useMetrics();

  const metricMap = {
    "gas_fees": "fees_paid_",
    "txcount": "txcount",
    "daa": "daa",
  }
    
  const prefix = useMemo(() => {
    const def = metricsDef[metric].units;

    if (Object.keys(def).includes("usd")) {
      return showUsd ? def.usd.prefix : def.eth.prefix;
    } else {
      return Object.values(def)[0].prefix;
    }
  }, [metricsDef, metric, showUsd]);

  const metricKey = `${metricMap[metric]}${metric === "gas_fees" ? (showUsd ? "usd" : "eth") : ""}`;

  return (
    <div className="flex items-center justify-end gap-[5px] numbers-xs">
      {prefix}{contract[metricKey].toLocaleString("en-GB", { maximumFractionDigits: metric === "gas_fees" ? 2 : 0 })}
    </div>
  )
});

ContractValue.displayName = 'Value';



const ContractsTableRow = memo(({ contract }: { contract: ContractDict}) => {
  const { owner_project } = useApplicationDetailsData();
  const { ownerProjectToProjectData  } = useProjectsMetadata();
  const { metricsDef, selectedMetrics, selectedMetricKeys, } = useMetrics();
  const { AllChainsByKeys, data: masterData } = useMaster();

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() =>
    `26px 280px 95px minmax(135px,800px) ${selectedMetricKeys.map(() => `237px`).join(" ")} 20px`,
    [selectedMetricKeys]
  );

  if(!masterData)
    return null;

  return (
    <GridTableRow
      gridDefinitionColumns={gridColumns}
      className={`group text-[14px] !px-[5px] !py-0 h-[34px] gap-x-[15px]`}
      style={{
        gridTemplateColumns: gridColumns,
      }}
    >
      <div className="sticky z-[3] -left-[12px] md:-left-[48px] w-[26px] flex items-center justify-center overflow-visible">
        <div
          className="absolute z-[3] -left-[5px] h-[32px] w-[35px] pl-[5px] flex items-center justify-start rounded-l-full bg-[radial-gradient(circle_at_-32px_16px,_#151A19_0%,_#151A19_72.5%,_transparent_90%)]"
        >
          {/* <ApplicationIcon owner_project={owner_project} size="sm" /> */}
          <div className="size-[26px] flex items-center justify-center">
          <GTPIcon icon={`${contract.origin_key}-logo-monochrome` as GTPIconName} size="sm" style={{color: AllChainsByKeys[contract.origin_key].colors.dark[0]}} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-x-[5px] justify-between">
        {/* <ApplicationDisplayName owner_project={application.owner_project} /> */}
        {contract.name || (<GridTableAddressCell address={contract.address as string} />)}
        {/* <Links owner_project={owner_project} /> */}
      </div>
      {/* <div className="flex items-center gap-x-[5px]">
        <Chains origin_keys={application.origin_keys} />
      </div> */}
      <div className="text-xs">
        <Category category={ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].main_category : ""} />
      </div>
      <div className="text-xs text-right">
        {masterData.blockspace_categories.sub_categories[contract.sub_category_key] ? masterData.blockspace_categories.sub_categories[contract.sub_category_key] : contract.sub_category_key}
      </div>
      {selectedMetrics.map((key, index) => (
        <div
          key={key}
        >
          <ContractValue contract={contract} metric={selectedMetrics[index]} />
        </div>
      ))}
      <div className="relative flex justify-end items-center pr-[0px]">
        <Link className="absolute cursor-pointer size-[24px] bg-[#344240] rounded-full flex justify-center items-center" href={`/applications/${owner_project}`}>
          <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-[#CDD8D3]" />
        </Link>
      </div>
      {/* #344240/30 */}
    </GridTableRow>
  )
});

ContractsTableRow.displayName = 'ApplicationTableRow';

const SimilarApplications = ({ owner_project }: { owner_project: string }) => {
  const {ownerProjectToProjectData} = useProjectsMetadata();
  const { applicationDataAggregated, isLoading } = useApplicationsData();
  const { selectedMetrics } = useMetrics();
  const { metricsDef } = useMetrics();
  const { sort } = useSort();

  const [medianMetricKey, setMedianMetricKey] = useState(selectedMetrics[0]);

  useEffect(() => {
    if(Object.keys(metricsDef).includes(sort.metric)){
      let key = sort.metric;
      if (sort.metric === "gas_fees")
        key = "gas_fees_eth";

      setMedianMetricKey(key);
    }
    
  }, [metricsDef, sort.metric]);

  const { topGainers, topLosers } = useMemo(() => {

    if(!ownerProjectToProjectData || !ownerProjectToProjectData[owner_project] || !applicationDataAggregated || !applicationDataAggregated.length)
      return { topGainers: [], topLosers: [] };
    // let medianMetricKey = Object.keys(metricsDef).includes(sort.metric) ? sort.metric : "gas_fees";

    const medianMetricValues = applicationDataAggregated.map((application) => application[medianMetricKey])
      .sort((a, b) => a - b);

    const medianValue = medianMetricValues[Math.floor(medianMetricValues.length / 2)];

    // console.log("medianMetricKey", medianMetricKey);
    // console.log("medianValue", medianValue);
    // console.log("applicationDataAggregated", applicationDataAggregated);

    // filter out applications with < median value of selected metric and with previous value of 0
    const filteredApplications = applicationDataAggregated
      .filter((application) => application[medianMetricKey] > medianValue && application["prev_" + medianMetricKey] > 0 && ownerProjectToProjectData[application.owner_project].main_category === ownerProjectToProjectData[owner_project].main_category)
    // console.log("filteredApplications", filteredApplications);

    // top 3 applications with highest change_pct
    return {
      topGainers: [...filteredApplications]
        .sort((a, b) => b[medianMetricKey + "_change_pct"] - a[medianMetricKey + "_change_pct"])
        .slice(0, 3),
      topLosers: [...filteredApplications]
        .sort((a, b) => a[medianMetricKey + "_change_pct"] - b[medianMetricKey + "_change_pct"])
        .slice(0, 3),
    }
  }, [applicationDataAggregated, medianMetricKey, ownerProjectToProjectData, owner_project]);

  return (
    <>
      <div>
        <Container className="hidden md:grid md:grid-rows-3 md:grid-flow-col lg:grid-rows-2 lg:grid-flow-row pt-[10px] lg:grid-cols-3 gap-[10px]">
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
      <div className="block md:hidden pt-[10px]">
        <CardSwiper cards={[...topGainers.map((application) => <ApplicationCard key={application.owner_project} application={application} />), ...topLosers.map((application) => <ApplicationCard key={application.owner_project} application={application} />)]} />
      </div>
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
          <div className="h-[20px] flex items-center gap-x-[5px]">
            {/* {JSON.stringify( application)} */}
            {application.origin_keys.map((chain, index) => (
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
            ))}
          </div>
          <div className="flex flex-col items-end gap-y-[2px]">
            <div className="flex flex-col items-end justify-start gap-y-[3px]">
              <div className="flex justify-end numbers-sm text-[#CDD8D3] w-[100px]">
                {prefix}
                {value?.toLocaleString("en-GB")}
              </div>
              <div className="flex items-end gap-x-[3px]">
              {application[`${metricKey}_change_pct`] !== Infinity ? (
                <div className={`flex justify-end w-[45px] numbers-xxxs ${application[`${metricKey}_change_pct`] < 0 ? 'text-[#FF3838]' : 'text-[#4CFF7E]'}`}>
                  {/* {application[`${metricKey}_change_pct`] < 0 ? '-' : '+'}{formatNumber(Math.abs(application[`${metricKey}_change_pct`]), {defaultDecimals: 1, thresholdDecimals: {base:0}})}% */}
                  {application[`${metricKey}_change_pct`] < 0 ? '-' : '+'}{Math.abs(application[`${metricKey}_change_pct`]).toLocaleString("en-GB",{maximumFractionDigits:0})}%
                </div>
              ) : <div className="w-[49px]">&nbsp;</div>}
            </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex items-center gap-x-[5px]">
        <ApplicationIcon owner_project={application.owner_project} size="md" />
        {ownerProjectToProjectData[application.owner_project] ? (
          <div className="heading-large-md flex-1 group-hover:underline"><ApplicationDisplayName owner_project={application.owner_project} /></div>
        ) : (
          <div className="heading-large-md flex-1 opacity-60 group-hover:underline"><ApplicationDisplayName owner_project={application.owner_project} /></div>
        )}
        <Link className="cursor-pointer size-[24px] bg-[#344240] rounded-full flex justify-center items-center" href={`/applications/${application.owner_project}`}>
          <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-[#CDD8D3]" />
        </Link>
      </div>
      <div className="flex items-center justify-between gap-x-[5px]">
        <div className="text-xs">{ownerProjectToProjectData[application.owner_project] && ownerProjectToProjectData[application.owner_project].main_category}</div>
        {/* <div className="flex items-center gap-x-[5px]">
          {getLinks(application).map((item, index) => (
            <div key={index} className="h-[15px] w-[15px]">
              {item.link && <Link
                href={item.link.includes("http") ? item.link : `https://${item.link}`}
                target="_blank"
              >
                <Icon
                  icon={item.icon}
                  className="w-[15px] h-[15px] select-none"
                />
              </Link>}
            </div>
          ))}
        </div> */}
        <Links owner_project={application.owner_project} />
      </div>
    </div>
  )
});

ApplicationCard.displayName = 'ApplicationCard';