"use client";
import Container from "@/components/layout/Container";
import { useProjectsMetadata } from "../_contexts/ProjectsMetadataContext";
import { useMetrics } from "../_contexts/MetricsContext";
import { ContractDict, useApplicationDetailsData } from "../_contexts/ApplicationDetailsDataContext";
import { useTimespan } from "../_contexts/TimespanContext";
import { useMaster } from "@/contexts/MasterContext";
import { getExplorerAddressUrl } from "@/lib/helpers";
import { ChartScaleProvider } from "../_contexts/ChartScaleContext";
import ChartScaleControls from "../_components/ChartScaleControls";
import { ApplicationCard, Category } from "../_components/Components";
import { memo, ReactNode, useCallback, useEffect, useMemo, useState, use } from "react";
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
import { MetricChainBreakdownBar, TooltipProvider } from "../_components/MetricChainBreakdownBar";
import { useChartSync } from "../_contexts/GTPChartSyncContext";
import dynamic from "next/dynamic";
import { TitleButtonLink } from "@/components/layout/TextHeadingComponents";
import { GTPTooltipNew, OLIContractTooltip } from "@/components/tooltip/GTPTooltip";
import { buildProjectEditHref } from "@/lib/project-edit-intent";
import { writeProjectEditContractSeed, type ProjectEditContractSeedRow } from "@/lib/project-edit-contract-seed";
import { useRouter } from "next/navigation";

// dynamic import to prevent server-side rendering of the chart component
const ApplicationDetailsChart = dynamic(() => import("../_components/GTPChart").then((mod) => mod.ApplicationDetailsChart), { ssr: false });

type Props = {
  params: Promise<{ owner_project: string }>;
};

const buildContractSeedRows = ({
  contracts,
  master,
  owner_project,
}: {
  contracts: ContractDict[];
  master: any;
  owner_project: string;
}): ProjectEditContractSeedRow[] => {
  if (!master) {
    return [];
  }

  const byKey = new Map<string, ProjectEditContractSeedRow>();

  for (const contract of contracts) {
    const address = typeof contract.address === "string" ? contract.address.trim() : "";
    if (!address) {
      continue;
    }

    const originKey = typeof contract.origin_key === "string" ? contract.origin_key : "";
    const evmChainIdRaw = master.chains[originKey]?.evm_chain_id;
    const evmChainId = evmChainIdRaw != null ? String(evmChainIdRaw).trim() : "";
    const chain_id =
      evmChainId && evmChainId !== "null" && evmChainId !== "undefined"
        ? `eip155:${evmChainId}`
        : "";

    const subCategoryKey =
      typeof contract.sub_category_key === "string" ? contract.sub_category_key.trim() : "";
    const usage_category =
      subCategoryKey && master.blockspace_categories.sub_categories[subCategoryKey]
        ? subCategoryKey
        : "";

    const row: ProjectEditContractSeedRow = {
      chain_id,
      address,
      contract_name: typeof contract.name === "string" ? contract.name.trim() : "",
      owner_project,
      usage_category,
    };

    const dedupeKey = `${row.chain_id}::${row.address.toLowerCase()}::${row.owner_project}`;
    if (!byKey.has(dedupeKey)) {
      byKey.set(dedupeKey, row);
    }
  }

  return Array.from(byKey.values());
};

export default function Page(props: Props) {
  const params = use(props.params);

  const {
    owner_project
  } = params;
  const { contracts } = useApplicationDetailsData();
  const editContractsHref = buildProjectEditHref({
    mode: "edit",
    source: "application-page",
    project: owner_project,
    focus: "contracts",
    start: "contracts",
  });

  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedMetrics } = useMetrics();
  const { data: master } = useMaster();
  const { selectedTimespan } = useTimespan();

  const contractsSeedRows = useMemo<ProjectEditContractSeedRow[]>(
    () => buildContractSeedRows({ contracts, master, owner_project }),
    [contracts, master, owner_project],
  );

  const seedContractsForEdit = useCallback(() => {
    writeProjectEditContractSeed({
      version: 1,
      source: "application-page",
      owner_project,
      created_at: Date.now(),
      rows: contractsSeedRows,
    });
  }, [contractsSeedRows, owner_project]);

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
              className="hover:text-color-text-primary dark:hover:text-color-text-primary underline"
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
      <TooltipProvider>
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
      </TooltipProvider>

      <Container>
        <div className="pt-[30px] pb-[15px]">
          <div className="flex flex-col gap-y-[10px]">
            <div className="flex items-start justify-between">
              <h2 className="heading-large-md">Most Active Contracts</h2>
              <div className="hidden md:block">
                <TitleButtonLink
                  label="Label more using OLI"
                  icon={"oli-open-labels-initiative" as GTPIconName}
                  iconSize="md"
                  iconBackground="bg-transparent"
                  rightIcon={"feather:arrow-right" as GTPIconName}
                  href={editContractsHref}
                  onClick={seedContractsForEdit}
                  gradientClass="bg-[linear-gradient(4.17deg,#5C44C2_-14.22%,#69ADDA_42.82%,#FF1684_93.72%)]"
                  className="w-fit hidden md:block"
                />
              </div>
              <div className="block md:hidden">
                <TitleButtonLink
                  label={<div className="heading-small-xxs">Label here.</div>}
                  icon={"oli-open-labels-initiative" as GTPIconName}
                  iconSize="md"
                  iconBackground="bg-transparent"
                  href={editContractsHref}
                  onClick={seedContractsForEdit}
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
      <ContractsTable editContractsHref={editContractsHref} />
      <Container>
        {/* <div className="rounded-md bg-color-ui-active/60 h-[152px] w-full"></div> */}
        <div className="pt-[30px] pb-[15px]">
          <div className="flex flex-col gap-y-[10px]">
            <div className="heading-lg">Similar Applications</div>
            <div className="text-xs">
              See other applications similar to {ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].display_name : ""} sorted by their performance in terms of gas fees.
            </div>
          </div>

        </div>
        {/* <div className="rounded-md bg-color-ui-active/60 h-[140px] w-full"></div> */}
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
  const overTimeValues = Object.values(data.metrics[metric].over_time);
  const hasOverTimeData = overTimeValues.some((v) => v.daily.data.length > 0);
  const firstWithData = overTimeValues.find((v) => v.daily.data.length > 0);

  if (metricDefinition.units.eth) {
    prefix = showUsd ? metricDefinition.units.usd.prefix || "" : metricDefinition.units.eth.prefix || "";
    suffix = showUsd ? metricDefinition.units.usd.suffix || "" : metricDefinition.units.eth.suffix || "";
    valueKey = showUsd ? "usd" : "eth";
    valueIndex = firstWithData ? firstWithData.daily.types.indexOf(valueKey) : 1;
    decimals = metricDefinition.units[valueKey].decimals || 0;
  } else {
    prefix = Object.values(metricDefinition.units)[0].prefix || "";
    suffix = Object.values(metricDefinition.units)[0].suffix || "";
    valueKey = Object.keys(metricDefinition.units)[0];
    valueIndex = firstWithData ? firstWithData.daily.types.indexOf(valueKey) : 1;
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
        {hasOverTimeData ? (
          <>
            <MetricChainBreakdownBar metric={metric} />
            <div className={`${selectedTimespan === "1d" ? "max-h-0" : "h-[168px]"} transition-all duration-300 overflow-hidden`}>
              <ApplicationDetailsChart
                metric={metric}
                prefix={prefix}
                suffix={suffix}
                decimals={decimals}
                seriesTypes={firstWithData!.daily.types}
                seriesData={
                  sortedChainKeys.map((chain) => ({
                    name: chain,
                    data: data.metrics[metric].over_time[chain].daily.data.map((d: number[]) => [d[0], d[valueIndex]])
                  })
                )}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[168px] text-sm text-forest-400">
            No chart data available for this metric
          </div>
        )}
      </Container>
    </>
  );
}

const ContractsTable = ({ editContractsHref }: { editContractsHref: string }) => {
  const { data, owner_project, contracts, sort, setSort, setSelectedSeriesName: setSelectedSeriesNameApps } = useApplicationDetailsData();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedTimespan } = useTimespan();
  const { AllChainsByKeys, data: master } = useMaster();
  const { metricsDef, selectedMetrics, setSelectedMetrics, selectedMetricKeys, } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [showMore, setShowMore] = useState(false);
  const [isSelectingContracts, setIsSelectingContracts] = useState(false);
  const [selectedContractIndices, setSelectedContractIndices] = useState<Set<number>>(new Set());
  const router = useRouter();

  const {selectedSeriesName, setSelectedSeriesName} = useChartSync();


  useEffect(() => {
      setSelectedSeriesNameApps(selectedSeriesName);
  }, [selectedSeriesName]);

  const metricKey = useMemo(() => {
    let key = selectedMetrics[0];
    if (selectedMetrics[0] === "gas_fees")
      key = showUsd ? "gas_fees_usd" : "gas_fees_eth";

    return key;
  }, [selectedMetrics, showUsd]);

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() =>
    `26px 280px 110px minmax(135px,1fr) ${selectedMetricKeys.map(() => `140px`).join(" ")}`,
    [selectedMetricKeys]
  );

  useEffect(() => {
    setSelectedContractIndices((prev) => {
      const next = new Set(Array.from(prev).filter((index) => index >= 0 && index < contracts.length));
      return next.size === prev.size ? prev : next;
    });
  }, [contracts.length]);

  const toggleContractSelection = useCallback((contractIndex: number) => {
    setSelectedContractIndices((prev) => {
      const next = new Set(prev);
      if (next.has(contractIndex)) {
        next.delete(contractIndex);
      } else {
        next.add(contractIndex);
      }
      return next;
    });
  }, []);

  const selectedContractSeedRows = useMemo<ProjectEditContractSeedRow[]>(() => {
    if (!master || selectedContractIndices.size === 0) {
      return [];
    }

    const selectedContracts = Array.from(selectedContractIndices)
      .sort((a, b) => a - b)
      .map((index) => contracts[index])
      .filter((contract): contract is ContractDict => Boolean(contract));

    return buildContractSeedRows({
      contracts: selectedContracts,
      master,
      owner_project,
    });
  }, [contracts, master, owner_project, selectedContractIndices]);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectingContracts((prev) => {
      if (prev) {
        setSelectedContractIndices(new Set());
      }
      return !prev;
    });
  }, []);

  const moveSelectedContractsToQueue = useCallback(() => {
    if (selectedContractSeedRows.length === 0) {
      return;
    }

    writeProjectEditContractSeed({
      version: 1,
      source: "application-page",
      owner_project,
      created_at: Date.now(),
      rows: selectedContractSeedRows,
    });

    router.push(editContractsHref);
  }, [editContractsHref, owner_project, router, selectedContractSeedRows]);

  return (
    <>
      <Container className="pb-[10px]">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={toggleSelectionMode}
            className={`h-[32px] rounded-full border px-[14px] text-xs font-medium transition-colors ${
              isSelectingContracts
                ? "border-color-text-primary bg-color-ui-active text-color-text-primary"
                : "border-[#CDD8D3] text-color-text-primary hover:bg-color-ui-hover"
            }`}
          >
            {isSelectingContracts ? "Cancel contract selection" : "Select contracts to edit"}
          </button>
        </div>
      </Container>
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
            itemContent={(index) => {
           

              return (
                <div key={index} className={index < contracts.length - 1 ? "pb-[5px]" : ""}>
                  <ContractsTableRow
                    contract={contracts[index]}
                    showSelectionControl={isSelectingContracts}
                    isSelected={selectedContractIndices.has(index)}
                    onToggleSelection={() => toggleContractSelection(index)}
                  />
                </div>
              )
            }}
            useWindowScroll
            increaseViewportBy={{ top: 0, bottom: 400 }}
            overscan={50}
          />
        </div>

      </HorizontalScrollContainer>
      {contracts.length > 5 && (
        <div className="flex items-center justify-center pt-[21px]">
          <div className="flex items-center justify-center rounded-full h-[36px] w-[117px] border border-[#CDD8D3] text-color-text-primary cursor-pointer text-md" onClick={() => setShowMore(!showMore)}>
            {showMore ? "Show less" : "Show more"}
          </div>
        </div>
      )}
      {isSelectingContracts && (
        <Container className="pt-[16px]">
          <div className="flex flex-col items-center gap-y-[10px]">
            <div className="text-xs text-color-text-secondary">
              {selectedContractSeedRows.length} contract{selectedContractSeedRows.length === 1 ? "" : "s"} selected
            </div>
            <button
              type="button"
              onClick={moveSelectedContractsToQueue}
              disabled={selectedContractSeedRows.length === 0}
              className={`h-[36px] rounded-full border px-[16px] text-sm font-medium transition-colors ${
                selectedContractSeedRows.length === 0
                  ? "cursor-not-allowed border-color-ui-hover text-color-text-secondary"
                  : "border-[#CDD8D3] text-color-text-primary hover:bg-color-ui-hover"
              }`}
            >
              Move selected contracts to edit queue
            </button>
          </div>
        </Container>
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



const ContractsTableRow = memo(({
  contract,
  showSelectionControl = false,
  isSelected = false,
  onToggleSelection,
}: {
  contract: ContractDict;
  showSelectionControl?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}) => {
  const { data } = useApplicationDetailsData();
  const { owner_project } = useApplicationDetailsData();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { applicationDataAggregated } = useApplicationsData();
  const { metricsDef, selectedMetrics, selectedMetricKeys, } = useMetrics();
  const { AllChainsByKeys, data: masterData } = useMaster();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const { data: master } = useMaster();



  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => {
      setCopiedAddress(null);
    }, 1000);
  };

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() =>
    `26px 280px 110px minmax(135px,1fr) ${selectedMetricKeys.map(() => `140px`).join(" ")}`,
    [selectedMetricKeys]
  );

  if (!masterData)
    return null;

  

  
  return (
    <GridTableRow
      gridDefinitionColumns={gridColumns}
      className={`group relative text-[14px] !pl-[5px] !pr-[30px] !py-0 h-[34px] gap-x-[15px] whitespace-nowrap`}
      style={{
        gridTemplateColumns: gridColumns,
      }}
    >
      <div className="sticky z-[3] -left-[12px] md:-left-[48px] w-[26px] flex items-center justify-center overflow-visible">
        <div
          className="absolute z-[3] -left-[5px] h-[32px] w-[35px] pl-[5px] flex items-center justify-start rounded-l-full bg-[radial-gradient(circle_at_-32px_16px,_var(--ui-active)_0%,_var(--ui-active)_72.5%,_transparent_90%)]"
        >
          <div className="size-[26px] flex items-center justify-center">
            <GTPIcon icon={`${(contract.origin_key as string).replaceAll("_", "-")}-logo-monochrome` as GTPIconName} size="sm" style={{ color: AllChainsByKeys[contract.origin_key].colors.dark[0] }} />
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
                className="w-[14px] h-[14px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              />
            </div>
          </div>
          <Link
            href={getExplorerAddressUrl(masterData.chains[contract.origin_key].block_explorer, String(contract.address))}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Icon
              icon="gtp:gtp-block-explorer-alt"
              className="w-[14px] h-[14px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            />
          </Link>
        </div>
      </div>
      <div className="text-xs">
        <Category category={master?.blockspace_categories.main_categories[contract.main_category_key] || ""} />
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
      {showSelectionControl && onToggleSelection && (
        <button
          type="button"
          className="absolute -right-[15px] top-0 cursor-pointer"
          onClick={onToggleSelection}
          aria-label={isSelected ? "Deselect contract" : "Select contract"}
        >
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full"
            style={{
              color: isSelected ? undefined : "#5A6462",
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
              className={`h-6 w-6 ${isSelected ? "opacity-0" : "opacity-100"}`}
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
            className={`rounded-full p-1 ${
              isSelected
                ? "bg-white dark:bg-color-ui-active"
                : "bg-color-bg-medium group-hover:bg-color-ui-hover"
            }`}
          >
            <Icon
              icon="feather:check-circle"
              className={`h-[24px] w-[24px] ${isSelected ? "opacity-100" : "opacity-0"}`}
              style={{
                color: isSelected ? undefined : "#5A6462",
              }}
            />
          </div>
        </button>
      )}
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

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const medianMetricKey = useMemo(() => {
    if (!Object.keys(metricsDef).includes(sort.metric)) {
      return selectedMetrics[0];
    }

    if (sort.metric === "gas_fees") {
      return showUsd ? "gas_fees_usd" : "gas_fees_eth";
    }

    return sort.metric;
  }, [metricsDef, selectedMetrics, showUsd, sort.metric]);



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

  const onScroll = useCallback(() => {
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
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [containerRef, onScroll]);

  useEffect(() => {
    const frameId = requestAnimationFrame(onScroll);
    return () => cancelAnimationFrame(frameId);
  }, [onScroll]);

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
