"use client";
import Container from "@/components/layout/Container";
import { useProjectsMetadata } from "../_contexts/ProjectsMetadataContext";
import { MetricDef, useMetrics } from "../_contexts/MetricsContext";
import { ContractDict, useApplicationDetailsData } from "../_contexts/ApplicationDetailsDataContext";
import { useTimespan } from "../_contexts/TimespanContext";
import { useMaster } from "@/contexts/MasterContext";
import { StackedDataBar } from "../_components/GTPChart";
import { ChartScaleProvider } from "../_contexts/ChartScaleContext";
import ChartScaleControls from "../_components/ChartScaleControls";
import { ApplicationDisplayName, ApplicationIcon, Category, Chains, Links, MetricTooltip } from "../_components/Components";
import { memo, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { GridTableAddressCell, GridTableHeader, GridTableHeaderCell, GridTableRow } from "@/components/layout/GridTable";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import { Icon } from "@iconify/react";
import VerticalVirtuosoScrollContainer from "@/components/VerticalVirtuosoScrollContainer";
import Link from "next/link";
import { SortProvider, useSort } from "../_contexts/SortContext";

type Props = {
  params: { owner_project: string };
};

export default function Page({ params: { owner_project } }: Props) {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedMetrics } = useMetrics();

  // const projectData = ownerProjectToProjectData[owner_project];

  return (
    <>
      {selectedMetrics.map((metric) => (
        <ChartScaleProvider
          key={metric} 
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
      <div className="rounded-md bg-forest-1000/60 h-[152px] w-full"></div>
      <div className="pt-[30px] pb-[15px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="heading-large">Similar Applications</div>
          <div className="text-xs">
            See other applications similar to 1inch sorted by their performance in terms of gas fees.
          </div>
        </div>
        
      </div>
      <div className="rounded-md bg-forest-1000/60 h-[140px] w-full"></div>
      </Container>
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

const MetricChainBreakdownBar = ({ metric }: { metric: string }) => {
  const { data, owner_project} = useApplicationDetailsData();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedTimespan } = useTimespan();
  const {AllChainsByKeys} = useMaster();
  const { metricsDef } = useMetrics();

  console.log("metric", metric);
  console.log("data", data);

  const metricToKey = {
    "daa": "daa",
    "gas_fees": "fees",
    "txcount": "txcount",
  };

  const metricData = data.metrics[metricToKey[metric]];

  const values = Object.values(metricData.aggregated.data).map((v) => v[metricData.aggregated.types.indexOf(selectedTimespan)]);
  const total = values.reduce((acc, v) => acc + v, 0);
  const percentages = values.map((v) => (v / total) * 100);

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const prefix = useMemo(() => {
    const def = metricsDef[metric].units;

    if (Object.keys(def).includes("usd")) {
      return showUsd ? def.usd.prefix : def.eth.prefix;
    } else {
      return Object.values(def)[0].prefix;
    }
  }, [metricsDef, metric, showUsd]);

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

  if (!metricData) {
    return null;
  }

  return (
    <div className="pb-[15px]">
      <div className="flex items-center h-[30px] rounded-full overflow-hidden bg-black/60">
        <div className="flex gap-x-[10px] items-center h-full w-[140px] bg-forest-1000 p-[2px] rounded-l-full">
          <ApplicationIcon owner_project={owner_project} size="sm" />
          <div className="flex flex-col -space-y-[1px]">
            <div className="numbers-sm">{prefix}{formatNumber(values.reduce((acc, v) => acc + v, 0))}</div>
            <div className="text-xxs">{ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].display_name || ""}</div>
          </div>
        </div>
        <div className="flex flex-1 h-full">
        {Object.entries(metricData.aggregated.data).filter(([chain, values]) => values[metricData.aggregated.types.indexOf(selectedTimespan)] > 0).map(([chain, values], i) => (
          <div 
          key={chain} 
          className="h-full relative transition-[width] duration-300"
          style={{
            background: AllChainsByKeys[chain].colors.dark[0],
            width: `${(values[metricData.aggregated.types.indexOf(selectedTimespan)] / total) * 100}%`,
            minWidth: '2px',
          }}

          >
            <div className="@container absolute inset-0 flex items-center justify-center text-[#1F2726] truncate">
              <div className="flex items-center gap-x-[5px]">
                <div className="text-xs font-semibold hidden @[150px]:block truncate">
                {AllChainsByKeys[chain].label}
                </div>
                <div className="numbers-xs hidden @[50px]:block ">
                  {percentages[Object.keys(metricData.aggregated.data).indexOf(chain)].toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        ))}
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

  const metricKey = useMemo(() => {
    let key = selectedMetrics[0];
    if (selectedMetrics[0] === "gas_fees")
      key = showUsd ? "gas_fees_usd" : "gas_fees_eth";

    return key;
  }, [selectedMetrics, showUsd]);


  // const maxMetrics = useMemo(() => {
  //   return selectedMetricKeys.map((metric) => {
  //     return applicationDataAggregated.reduce((acc, application) => {
  //       return Math.max(acc, application[metric]);
  //     }, 0);
  //   });
  // }, [applicationDataAggregated, selectedMetricKeys]);


  // const rowData = useMemo(() => {
  //   return applicationDataAggregated.map((application) => {
  //     return {
  //       logo_path: ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].logo_path : "",
  //       owner_project: application.owner_project,
  //       display_name: ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].display_name : application.owner_project,
  //       origin_keys: application.origin_keys,
  //       category: ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].main_category : "",
  //       num_contracts: application.num_contracts,
  //       gas_fees: application[metricKey],
  //       gas_fees_eth: application.gas_fees_eth,
  //       gas_fees_usd: application.gas_fees_usd,
  //       gas_fees_change_pct: application[metricKey + "_change_pct"],
  //       rank_gas_fees: application[`rank_${metricKey}`],


  //     };
  //   });
  // }, [applicationDataAggregated, metricKey, ownerProjectToProjectData]);

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() =>
    `26px 280px 95px minmax(95px,800px) ${selectedMetricKeys.map(() => `237px`).join(" ")} 20px`,
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
              // extraRight={
              //   <div className="flex items-center gap-x-[5px] pl-[5px] cursor-default z-[10]">
              //     <div
              //       className="cursor-pointer flex items-center rounded-full bg-[#344240] text-[#CDD8D3] gap-x-[2px] px-[5px] h-[18px]"
              //       onClick={() => {
              //         setSort({
              //           metric: `${metricKey}`, //"gas_fees_change_pct",
              //           sortOrder:
              //             sort.metric === `${metricKey}`
              //               ? sort.sortOrder === "asc"
              //                 ? "desc"
              //                 : "asc"
              //               : "desc",
              //         });
              //       }}
              //     >
              //       <div className="text-xxxs !leading-[14px]">Change</div>
              //       <Icon
              //         icon={
              //           sort.metric === `${metricKey}` && sort.sortOrder === "asc"
              //             ? "feather:arrow-up"
              //             : "feather:arrow-down"
              //         }
              //         className="w-[10px] h-[10px]"
              //         style={{
              //           opacity: sort.metric === `${metricKey}` ? 1 : 0.2,
              //         }}
              //       />
              //     </div>
              //     <Tooltip placement="bottom">
              //       <TooltipTrigger>
              //         <Icon icon="feather:info" className="w-[15px] h-[15px]" />
              //       </TooltipTrigger>
              //       <TooltipContent className="z-[99]">
              //         <MetricTooltip metric={metric} />
              //       </TooltipContent>
              //     </Tooltip>
              //   </div>
              // }
            >
              {metricsDef[metric].name} {Object.keys(metricsDef[metric].units).includes("eth") && <>({showUsd ? "USD" : "ETH"})</>}
            </GridTableHeaderCell>
          )
        })}
        <div />
      </GridTableHeader>
      <div className="flex flex-col gap-y-[5px]">
        <VerticalVirtuosoScrollContainer
          height={800}
          totalCount={contracts.length}
          itemContent={(index) => (
            <ContractsTableRow key={index} contract={contracts[index]} />
          )}
        />
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

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() =>
    `26px 280px 95px minmax(95px,800px) ${selectedMetricKeys.map(() => `237px`).join(" ")} 20px`,
    [selectedMetricKeys]
  );

  return (
    <GridTableRow
      gridDefinitionColumns={gridColumns}
      className={`group text-[14px] !px-[5px] !py-0 h-[34px] gap-x-[15px] mb-[5px]`}
      style={{
        gridTemplateColumns: gridColumns,
      }}
    >
      <div className="sticky z-[3] -left-[12px] md:-left-[48px] w-[26px] flex items-center justify-center overflow-visible">
        <div
          className="absolute z-[3] -left-[5px] h-[32px] w-[35px] pl-[5px] flex items-center justify-start rounded-l-full bg-[radial-gradient(circle_at_-32px_16px,_#151A19_0%,_#151A19_72.5%,_transparent_90%)]"
        >
          <ApplicationIcon owner_project={owner_project} size="sm" />
        </div>
      </div>
      <div className="flex items-center gap-x-[5px] justify-between">
        {/* <ApplicationDisplayName owner_project={application.owner_project} /> */}
        {contract.name || (<GridTableAddressCell address={contract.address as string} />)}
        <Links owner_project={owner_project} />
      </div>
      {/* <div className="flex items-center gap-x-[5px]">
        <Chains origin_keys={application.origin_keys} />
      </div> */}
      <div className="text-xs">
        <Category category={ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].main_category : ""} />
      </div>
      <div className="numbers-xs text-right">
        {contract.sub_category_key}
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