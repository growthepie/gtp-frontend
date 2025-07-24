"use client";
import Container from "@/components/layout/Container";
import { useProjectsMetadata } from "../_contexts/ProjectsMetadataContext";
import { useMetrics } from "../_contexts/MetricsContext";
import { ContractDict, useApplicationDetailsData } from "../_contexts/ApplicationDetailsDataContext";
import { useTimespan } from "../_contexts/TimespanContext";
import { useMaster } from "@/contexts/MasterContext";
import { ChartScaleProvider } from "../_contexts/ChartScaleContext";
import ChartScaleControls from "../_components/ChartScaleControls";
import { ApplicationCard, Category } from "../_components/Components";
import { memo, ReactNode, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { GridTableAddressCell, GridTableHeader, GridTableHeaderCell, GridTableRow } from "@/components/layout/GridTable";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useSort } from "../_contexts/SortContext";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { Virtuoso } from "react-virtuoso";
import { useApplicationsData } from "../_contexts/ApplicationsDataContext";
import useDragScroll from "@/hooks/useDragScroll";
import { Sources } from "@/lib/datasources";
import { MetricChainBreakdownBar } from "../_components/MetricChainBreakdownBar";
import { useChartSync } from "../_contexts/GTPChartSyncContext";
import dynamic from "next/dynamic";
import { TitleButtonLink } from "@/components/layout/TextHeadingComponents";
import { GTPTooltipNew, OLIContractTooltip } from "@/components/tooltip/GTPTooltip";

// dynamic import to prevent server-side rendering of the chart component
const ApplicationDetailsChart = dynamic(() => import("../_components/GTPChart").then((mod) => mod.ApplicationDetailsChart), { ssr: false });

type Props = {
  params: { owner_project: string };
};

export default function Page({ params: { owner_project } }: Props) {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedMetrics } = useMetrics();
  const { data: master } = useMaster();
  const { selectedTimespan } = useTimespan();

  const SourcesDisplay = useMemo(() => {
    if (!master)
      return null;
    let sourcesByMetric = {};
    selectedMetrics.forEach((metric) => {
      const sources = master.app_metrics[metric].source;
      sourcesByMetric[metric] = sources && sources.length > 0 ? (
        sources
          .map<ReactNode>((s) => (
            <Link
              key={s}
              rel="noopener noreferrer"
              target="_blank"
              href={Sources[s] ?? ""}
              className="hover:text-forest-500 dark:hover:text-forest-500 underline"
            >
              {s}
            </Link>
          ))
          .reduce((prev, curr) => [prev, ", ", curr])
      ) : (
        <>Unavailable</>
      );
    })

    return sourcesByMetric;
  }, [master, selectedMetrics]);

  return (
    <>
      <ChartScaleProvider
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
        {selectedMetrics.map((metric, index) => (
          <MetricSection metric={metric} owner_project={owner_project} key={index} />
        ))}
        <Container className="pt-[30px]">
          <ChartScaleControls sources={SourcesDisplay && SourcesDisplay["gas_fees"]} />
        </Container>
      </ChartScaleProvider>

      <Container>
        <div className="pt-[30px] pb-[15px]">
          <div className="flex flex-col gap-y-[10px]">
            <div className="flex items-start justify-between">
              <h2 className="heading-large-md">Most Active Contracts</h2>
              <div className="hidden md:block">
                <TitleButtonLink
                  label="Label more using OLI"
                  icon="gtp-oli-logo"
                  iconSize="md"
                  iconBackground="bg-transparent"
                  rightIcon={"feather:arrow-right" as GTPIconName}
                  href="https://www.openlabelsinitiative.org/?gtp.applications"
                  newTab
                  gradientClass="bg-[linear-gradient(4.17deg,#5C44C2_-14.22%,#69ADDA_42.82%,#FF1684_93.72%)]"
                  className="w-fit hidden md:block"
                />
              </div>
              <div className="block md:hidden">
                <TitleButtonLink
                  label={<div className="heading-small-xxs">Label here.</div>}
                  icon="gtp-oli-logo"
                  iconSize="md"
                  iconBackground="bg-transparent"
                  href="https://www.openlabelsinitiative.org/?gtp.applications"
                  newTab
                  gradientClass="bg-[linear-gradient(4.17deg,#5C44C2_-14.22%,#69ADDA_42.82%,#FF1684_93.72%)]"
                  className="w-fit"
                  containerClassName=""
                />
              </div>
            </div>
            <div className="text-xs">
              See the most active contracts for {ownerProjectToProjectData[owner_project] ? ` ${ownerProjectToProjectData[owner_project].display_name}` : ""} ({selectedTimespan === "max" ? "All Time" : `last  ${selectedTimespan.replace("d", "")} days`}).
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
  const { metricsDef, metricIcons } = useMetrics();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { data } = useApplicationDetailsData();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { selectedTimespan } = useTimespan();
  const { selectedSeriesName } = useChartSync();
  const { AllChainsByKeys } = useMaster();

  const def = metricsDef[metric];

  // create a list of the chain keys sorted by the aggregate value for the selected timespan
  const sortedChainKeys = Object.keys(data.metrics[metric].aggregated.data).sort((a, b) => {
    const hasUsd = data.metrics[metric].aggregated.types.includes("usd");
    let metricKey = "value";
    if (hasUsd) {
      metricKey = showUsd ? "usd" : "eth";
    }

    const aVal = data.metrics[metric].aggregated.data[a][selectedTimespan][data.metrics[metric].aggregated.types.indexOf(metricKey)];
    const bVal = data.metrics[metric].aggregated.data[b][selectedTimespan][data.metrics[metric].aggregated.types.indexOf(metricKey)];
    return aVal - bVal;
  });

  const metricDefinition = metricsDef[metric];
  let prefix = "";
  let suffix = "";
  let valueKey = "value";
  let valueIndex = 1;
  let decimals = 0;
  if (metricDefinition.units.eth) {
    prefix = showUsd ? metricDefinition.units.usd.prefix || "" : metricDefinition.units.eth.prefix || "";
    suffix = showUsd ? metricDefinition.units.usd.suffix || "" : metricDefinition.units.eth.suffix || "";
    valueKey = showUsd ? "usd" : "eth";
    valueIndex = Object.values(data.metrics[metric].over_time)[0].daily.types.indexOf(valueKey);
    decimals = metricDefinition.units[valueKey].decimals || 0;
  } else {
    prefix = Object.values(metricDefinition.units)[0].prefix || "";
    suffix = Object.values(metricDefinition.units)[0].suffix || "";
    valueKey = Object.keys(metricDefinition.units)[0];
    valueIndex = Object.values(data.metrics[metric].over_time)[0].daily.types.indexOf(valueKey);
    decimals = Object.values(metricDefinition.units)[0].decimals || 0;
  }

  // Filter out chains with no data
  const chainsWithData = sortedChainKeys.filter(chain => {
    const valueTypeIndex = data.metrics[metric].aggregated.types.indexOf(valueKey);
    const value = data.metrics[metric].aggregated.data[chain][selectedTimespan][valueTypeIndex];
    return value !== null && value !== undefined && value !== 0;
  });

  if (!def) {
    return null;
  }

  return (
    <>
      <Container className="pt-[30px] pb-[15px]">
        <div className="flex flex-col gap-y-[15px]">
          <div className="flex gap-x-[10px] items-center">
            <GTPIcon icon={metricIcons[metric] as GTPIconName} size="md" />
            <div className="text-sm md:text-xl">
              <span className="heading-large-sm md:heading-large-md">{def.name}</span> {selectedSeriesName ? `on ${AllChainsByKeys[selectedSeriesName].label}` : "across different chains"}
            </div>
          </div>
          <div className="text-xs">
            {ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].display_name}{' '}
            {chainsWithData.length === 1
              ? `is available on ${AllChainsByKeys[chainsWithData[0]]?.label || chainsWithData[0]}. Here you see the usage based on the respective metric.`
              : "is available on multiple chains. Here you see how much usage is on each based on the respective metric."}
          </div>
        </div>
      </Container>
      <Container>
        <MetricChainBreakdownBar metric={metric} />
        <div className={`${selectedTimespan === "1d" ? "max-h-0" : "h-[168px]"} transition-all duration-300 overflow-hidden`}>
          <ApplicationDetailsChart
            metric={metric}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            seriesTypes={data.metrics[metric].over_time[sortedChainKeys[0]].daily.types}
            seriesData={
              sortedChainKeys.map((chain) => ({
                name: chain,
                data: data.metrics[metric].over_time[chain].daily.data.map((d: number[]) => [d[0], d[valueIndex]])
              })
              )}
          />
        </div>
      </Container>
    </>
  );
}

const ContractsTable = () => {
  const { data, owner_project, contracts, sort, setSort } = useApplicationDetailsData();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedTimespan } = useTimespan();
  const { AllChainsByKeys } = useMaster();
  const { metricsDef, selectedMetrics, setSelectedMetrics, selectedMetricKeys, } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [showMore, setShowMore] = useState(false);

  const metricKey = useMemo(() => {
    let key = selectedMetrics[0];
    if (selectedMetrics[0] === "gas_fees")
      key = showUsd ? "gas_fees_usd" : "gas_fees_eth";

    return key;
  }, [selectedMetrics, showUsd]);

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() =>
    `26px 280px 110px minmax(135px,800px) ${selectedMetricKeys.map(() => `140px`).join(" ")}`,
    [selectedMetricKeys]
  );

  return (
    <>
      <HorizontalScrollContainer reduceLeftMask={true}>
        <GridTableHeader
          gridDefinitionColumns={gridColumns}
          className="group text-[14px] !pl-[5px] !pr-[30px] !py-0 gap-x-[15px] !pb-[4px]"
          style={{
            gridTemplateColumns: gridColumns,
          }}
        >
          <div />
          <GridTableHeaderCell
            metric="name"
            className="heading-small-xs pl-[0px]"
            sort={sort}
            setSort={setSort}
          >
            Contract Name
          </GridTableHeaderCell>
          <GridTableHeaderCell
            metric="main_category_key"
            className="heading-small-xs"
            sort={sort}
            setSort={setSort}
          >
            Category
          </GridTableHeaderCell>
          <GridTableHeaderCell
            metric="sub_category_key"
            className="heading-small-xs"
            sort={sort}
            setSort={setSort}
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
                className="heading-small-xs z-[0] whitespace-nowrap"
                justify="end"
                sort={sort}
                setSort={setSort}
              >
                {metricsDef[metric].name} {Object.keys(metricsDef[metric].units).includes("eth") && <>({showUsd ? "USD" : "ETH"})</>}
              </GridTableHeaderCell>
            )
          })}
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
        <div className="flex flex-col transition-[max-height] duration-300 overflow-hidden" style={{ maxHeight: showMore ? contracts.length * 34 + (contracts.length - 1) * 5 : 5 * 34 + 5 * 4 }}>

          <Virtuoso
            totalCount={contracts.length}
            itemContent={(index) => (
              <div key={index} className={index < contracts.length - 1 ? "pb-[5px]" : ""}>
                <ContractsTableRow contract={contracts[index]} />
              </div>
            )}
            useWindowScroll
            increaseViewportBy={{ top: 0, bottom: 400 }}
            overscan={50}
          />
        </div>

      </HorizontalScrollContainer>
      {contracts.length > 5 && (
        <div className="flex items-center justify-center pt-[21px]">
          <div className="flex items-center justify-center rounded-full h-[36px] w-[117px] border border-[#CDD8D3] text-[#CDD8D3] cursor-pointer text-md" onClick={() => setShowMore(!showMore)}>
            {showMore ? "Show less" : "Show more"}
          </div>
        </div>
      )}
    </>
  )
}


const ContractValue = memo(({ contract, metric }: { contract: ContractDict, metric: string }) => {
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

  const decimals = metricsDef[metric].units[Object.keys(metricsDef[metric].units).includes("usd") ? showUsd ? "usd" : "eth" : Object.keys(metricsDef[metric].units)[0]].decimals;

  const metricKey = `${metricMap[metric]}${metric === "gas_fees" ? (showUsd ? "usd" : "eth") : ""}`;



  return (
    <div className="flex items-center justify-end gap-[5px] numbers-xs">
      {prefix}{contract[metricKey].toLocaleString("en-GB", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
    </div>
  )
});

ContractValue.displayName = 'Value';



const ContractsTableRow = memo(({ contract }: { contract: ContractDict }) => {
  const { owner_project } = useApplicationDetailsData();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { metricsDef, selectedMetrics, selectedMetricKeys, } = useMetrics();
  const { AllChainsByKeys, data: masterData } = useMaster();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => {
      setCopiedAddress(null);
    }, 1000);
  };

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() =>
    `26px 280px 110px minmax(135px,800px) ${selectedMetricKeys.map(() => `140px`).join(" ")}`,
    [selectedMetricKeys]
  );

  if (!masterData)
    return null;

  return (
    <GridTableRow
      gridDefinitionColumns={gridColumns}
      className={`group text-[14px] !pl-[5px] !pr-[30px] !py-0 h-[34px] gap-x-[15px] whitespace-nowrap`}
      style={{
        gridTemplateColumns: gridColumns,
      }}
    >
      <div className="sticky z-[3] -left-[12px] md:-left-[48px] w-[26px] flex items-center justify-center overflow-visible">
        <div
          className="absolute z-[3] -left-[5px] h-[32px] w-[35px] pl-[5px] flex items-center justify-start rounded-l-full bg-[radial-gradient(circle_at_-32px_16px,_#151A19_0%,_#151A19_72.5%,_transparent_90%)]"
        >
          <div className="size-[26px] flex items-center justify-center">
            <GTPIcon icon={`${contract.origin_key}-logo-monochrome` as GTPIconName} size="sm" style={{ color: AllChainsByKeys[contract.origin_key].colors.dark[0] }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-x-[15px] justify-between w-full truncate">

        {contract.name ? (<div>{contract.name}</div>) : (
          <GTPTooltipNew
            placement="bottom-start"
            allowInteract={true}
            trigger={<div className="w-full h-[30px] flex items-center"><GridTableAddressCell address={contract.address as string} showCopyIcon={false} /></div>}
          >
            <OLIContractTooltip 
              icon="gtp-project-monochrome" 
              iconClassName="text-[#5A6462]" 
              project_name={owner_project} 
              message="Contract information not available."
              contractAddress={contract.address as string}
              chain={contract.origin_key}
            />
          </GTPTooltipNew>
        )}
        <div className="flex items-center gap-x-[5px]">
          <div className="h-[15px] w-[15px]">
            <div
              className="group flex items-center cursor-pointer gap-x-[5px] text-xs"
              onClick={() => handleCopyAddress(contract.address as string)}
            >
              <Icon
                icon={copiedAddress ? "feather:check" : "feather:copy"}
                className="w-[15px] h-[15px]"
              />
            </div>
          </div>
          <Link
            href={`${masterData.chains[contract.origin_key].block_explorer
              }address/${contract.address}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Icon
              icon="gtp:gtp-block-explorer-alt"
              className="w-[15px] h-[15px]"
            />
          </Link>
        </div>
      </div>
      <div className="text-xs">
        <Category category={ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].main_category : ""} />
      </div>
      <div className="text-xs">
        {contract.sub_category_key ? (masterData.blockspace_categories.sub_categories[contract.sub_category_key] ? masterData.blockspace_categories.sub_categories[contract.sub_category_key] : contract.sub_category_key) : <span className="text-[#5A6462]">Unknown</span>}
      </div>
      {selectedMetrics.map((key, index) => (
        <div
          key={key}
        >
          <ContractValue contract={contract} metric={selectedMetrics[index]} />
        </div>
      ))}
    </GridTableRow>
  )
});

ContractsTableRow.displayName = 'ApplicationTableRow';

const SimilarApplications = ({ owner_project }: { owner_project: string }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { applicationDataAggregated, isLoading } = useApplicationsData();
  const { selectedMetrics } = useMetrics();
  const { metricsDef } = useMetrics();
  const { sort } = useSort();

  const [medianMetricKey, setMedianMetricKey] = useState(selectedMetrics[0]);
  const [medianMetric, setMedianMetric] = useState(selectedMetrics[0]);
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  useEffect(() => {
    if (Object.keys(metricsDef).includes(sort.metric)) {
      let key = sort.metric;
      if (sort.metric === "gas_fees")
        key = showUsd ? "gas_fees_usd" : "gas_fees_eth";

      setMedianMetricKey(key);
      setMedianMetric(sort.metric);
    }

  }, [metricsDef, sort.metric, showUsd]);



  const similarApps = useMemo(() => {
    if (!ownerProjectToProjectData || !ownerProjectToProjectData[owner_project] || !applicationDataAggregated || !applicationDataAggregated.length)
      return [];
    // filter out applications with previous value of 0 and that are not the same owner project
    const filteredApplications = applicationDataAggregated
      .filter((application) => ownerProjectToProjectData[application.owner_project] && ownerProjectToProjectData[application.owner_project].main_category === ownerProjectToProjectData[owner_project].main_category && application.owner_project !== owner_project);

    const medianMetricValues = filteredApplications.map((application) => application[medianMetricKey])
      .sort((a, b) => a - b);

    const medianValue = medianMetricValues[Math.floor(medianMetricValues.length / 2)];

    // top 3 applications with highest change_pct after filtering out applications with < median value
    return filteredApplications
      .filter((application) => application[medianMetricKey] >= medianValue)
      .sort((a, b) => b[medianMetricKey + "_change_pct"] - a[medianMetricKey + "_change_pct"])
      .slice(0, 6);
  }, [applicationDataAggregated, medianMetricKey, ownerProjectToProjectData, owner_project]);

  return (
    <>
      <div>
        <Container className="hidden md:grid md:grid-rows-3 md:grid-flow-col lg:grid-rows-2 lg:grid-flow-row pt-[10px] lg:grid-cols-3 gap-[10px]">
          {similarApps.map((application, index) => (
            <ApplicationCard key={application.owner_project} application={application} />
          ))}
          {isLoading && new Array(6).fill(0).map((_, index) => (
            <ApplicationCard key={index} application={undefined} />
          ))}
        </Container>
      </div>
      <div className="block md:hidden pt-[10px]">
        <CardSwiper cards={[...similarApps.map((application) => <ApplicationCard key={application.owner_project} application={application} />)]} />
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
