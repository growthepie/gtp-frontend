"use client";
import Link from "next/link";
import { memo, useCallback, useMemo, MouseEvent } from "react";
import { Virtuoso } from "react-virtuoso";
import { useLocalStorage } from "usehooks-ts";
import { GridTableHeader, GridTableHeaderCell, GridTableRow } from "@/components/layout/GridTable";
import Icon from "@/components/layout/Icon";
import { MetricInfo } from "@/types/api/MasterResponse";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { useSearchParams } from "next/navigation";
import { AggregatedDataRow, useApplicationsData } from "../_contexts/ApplicationsDataContext";
import { useProjectsMetadata } from "../_contexts/ProjectsMetadataContext";
import { useSort } from "../_contexts/SortContext";
import { useMetrics } from "../_contexts/MetricsContext";
import { useTimespan } from "../_contexts/TimespanContext";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import {
  ApplicationDisplayName,
  ApplicationIcon,
  ApplicationTooltip,
  Category,
  CategoryTooltipContent,
  Chains,
  MetricTooltip,
  formatNumber,
} from "./Components";

interface ValueProps {
  rowIndex: number;
  rank: number;
  def: MetricInfo;
  value: number;
  change_pct: number;
  maxMetric: number;
  metric: string;
}

const areValuePropsEqual = (prevProps: ValueProps, nextProps: ValueProps) => {
  return (
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.rank === nextProps.rank &&
    prevProps.value === nextProps.value &&
    prevProps.change_pct === nextProps.change_pct &&
    prevProps.maxMetric === nextProps.maxMetric &&
    prevProps.metric === nextProps.metric &&
    prevProps.def === nextProps.def
  );
};

const Value = memo(({
  rowIndex: _rowIndex,
  rank,
  def,
  value,
  change_pct,
  maxMetric,
  metric
}: ValueProps) => {
  const { sort } = useSort();
  const [showUsd] = useLocalStorage("showUsd", true);
  const { selectedTimespan } = useTimespan();

  const isSelectedMetric = useMemo(
    () => sort.metric === metric,
    [sort.metric, metric]
  );

  const progressWidth = useMemo(
    () => (maxMetric > 0 ? `${(value / maxMetric) * 100}%` : "0%"),
    [value, maxMetric]
  );

  const displayValue = useMemo(() => {
    if (!def) return value;

    const unitKey = Object.prototype.hasOwnProperty.call(def.units, "usd")
      ? (showUsd ? "usd" : "eth")
      : Object.keys(def.units)[0];

    const unit = def.units[unitKey];
    const prefix = unit?.prefix ?? "";
    const decimals = unit?.decimals ?? 0;

    return `${prefix}${value.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }, [def, showUsd, value]);

  const changePctDisplayValue = useMemo(() => {
    if (change_pct === Infinity) return " ";

    return `${change_pct < 0 ? "-" : "+"}${formatNumber(Math.abs(change_pct), {
      defaultDecimals: 1,
      thresholdDecimals: { base: 0 },
    })}%`;
  }, [change_pct]);

  return (
    <div className="w-full flex items-center justify-end gap-[10px]">
      <div className="numbers-xs text-[#5A6462] w-[calc(7.33*4px+10px)] pl-[10px]">
        {isSelectedMetric ? rank : ""}
      </div>

      <div className="w-full flex flex-col items-end gap-y-[2px]">
        <div className="flex justify-end items-center gap-x-[2px]">
          <div className="numbers-xs">
            {displayValue}
          </div>
          <div
            className={`numbers-xxs w-[49px] text-right ${
              change_pct < 0 ? "text-color-negative" : "text-color-positive"
            } ${selectedTimespan === "max" ? "hidden" : ""}`}
          >
            {changePctDisplayValue}
          </div>
        </div>

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

Value.displayName = "Value";

const areTableRowPropsEqual = (
  prevProps: { application: AggregatedDataRow; maxMetrics: number[]; rowIndex: number },
  nextProps: { application: AggregatedDataRow; maxMetrics: number[]; rowIndex: number }
) => {
  if (prevProps.rowIndex !== nextProps.rowIndex) return false;

  if (prevProps.maxMetrics.length !== nextProps.maxMetrics.length) return false;
  for (let i = 0; i < prevProps.maxMetrics.length; i++) {
    if (prevProps.maxMetrics[i] !== nextProps.maxMetrics[i]) return false;
  }

  const prevApp = prevProps.application;
  const nextApp = nextProps.application;

  if (
    prevApp.owner_project !== nextApp.owner_project ||
    prevApp.num_contracts !== nextApp.num_contracts ||
    prevApp.gas_fees_eth !== nextApp.gas_fees_eth ||
    prevApp.gas_fees_usd !== nextApp.gas_fees_usd ||
    prevApp.txcount !== nextApp.txcount ||
    prevApp.daa !== nextApp.daa ||
    prevApp.gas_fees_eth_change_pct !== nextApp.gas_fees_eth_change_pct ||
    prevApp.gas_fees_usd_change_pct !== nextApp.gas_fees_usd_change_pct ||
    prevApp.txcount_change_pct !== nextApp.txcount_change_pct ||
    prevApp.daa_change_pct !== nextApp.daa_change_pct
  ) {
    return false;
  }

  if (prevApp.origin_keys.length !== nextApp.origin_keys.length) return false;
  for (let i = 0; i < prevApp.origin_keys.length; i++) {
    if (prevApp.origin_keys[i] !== nextApp.origin_keys[i]) return false;
  }

  return true;
};

const ApplicationTableRow = memo(
  ({ application, maxMetrics, rowIndex }: { application: AggregatedDataRow; maxMetrics: number[]; rowIndex: number }) => {
    const { ownerProjectToProjectData } = useProjectsMetadata();
    const { metricsDef, selectedMetrics, selectedMetricKeys } = useMetrics();
    const { selectedTimespan } = useTimespan();
    const { sort } = useSort();
  const { viewOptions } = useApplicationsData();
  const searchParams = useSearchParams();

  const defaultHref = {
    pathname: `/applications/${application.owner_project}`,
    query: searchParams.toString().replace(/%2C/g, ","),
  };

  const handleRowClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (
      viewOptions.onSelectApplication &&
      e.button === 0 &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey
    ) {
      e.preventDefault();
      viewOptions.onSelectApplication(application.owner_project);
    }
  };

  const numTotalMetrics = Object.keys(metricsDef).length;

    const gridColumns = useMemo(() => {
      const applicationColumnWidth = selectedMetricKeys.length > 2 ? "minmax(156px, 1fr)" : "minmax(285px, 1fr)";
      const metricColumnWidth = selectedMetricKeys.length > 2 ? "242px" : "262px";
      const columns = ["26px", applicationColumnWidth];
      if (!viewOptions.hideChainsColumn) {
        columns.push("166px");
      }
      columns.push(
        "150px",
        "95px",
        ...selectedMetricKeys.map(() => metricColumnWidth),
        ...new Array(numTotalMetrics - selectedMetricKeys.length).fill("0px"),
        "29px"
      );
      return columns.join(" ");
    }, [numTotalMetrics, selectedMetricKeys, viewOptions.hideChainsColumn]);

    return (
      <Link href={defaultHref} onClick={handleRowClick}>
        <GridTableRow
          className="group text-[14px] !px-[5px] !py-0 h-[34px] !gap-x-0 transition-all duration-300"
          style={{ gridTemplateColumns: gridColumns }}
          onClick={() => undefined}
        >
          <div className="sticky z-[100] -left-[12px] md:-left-[46px] w-[30px] flex items-center justify-center overflow-visible">
            <div className="absolute z-[3] -left-[6px] h-[34px] w-[35px] pl-[5px] flex items-center justify-start bg-[radial-gradient(circle_at_-32px_16px,_var(--ui-active)_0%,_var(--ui-active)_72.5%,_transparent_90%)] group-hover:bg-[radial-gradient(circle_at_-32px_16px,_transparent_0%,_transparent_72.5%,_transparent_90%)] rounded-l-full border-[0.5px] border-r-0 border-[#5A6462]">
              <ApplicationIcon owner_project={application.owner_project} size="sm" />
            </div>
          </div>
          <div className="flex items-center gap-x-[5px] group-hover:underline pl-[15px] pr-[15px] ">
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
          {!viewOptions.hideChainsColumn && (
            <div className="flex items-center gap-x-[5px] pr-[15px] ">
              <Chains origin_keys={application.origin_keys} />
            </div>
          )}
          <div className="text-xs pr-[15px]">
            <GTPTooltipNew
              placement="bottom-start"
              allowInteract={true}
              size="md"
              trigger={
                <div className="flex-1 min-w-0 h-[32px] flex items-center">
                  <div className="truncate w-full">
                    <Category category={ownerProjectToProjectData[application.owner_project].main_category || ""} />
                  </div>
                </div>
              }
              containerClass="flex flex-col gap-y-[10px] !w-[230px]"
              positionOffset={{ mainAxis: 0, crossAxis: 78 }}
            >
              <CategoryTooltipContent application={application} />
            </GTPTooltipNew>
          </div>
          <div className="numbers-xs text-right pr-[15px]">{application.num_contracts}</div>
          {selectedMetrics.map((metric, index) => {
            const metricKey = selectedMetricKeys[index];
            let bgColor = "bg-transparent";

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
                <Value
                  rowIndex={rowIndex}
                  rank={application[`rank_${metricKey}`]}
                  def={metricsDef[metric]}
                  value={application[metricKey]}
                  change_pct={application[`${metricKey}_change_pct`]}
                  maxMetric={maxMetrics[index]}
                  metric={selectedMetrics[index]}
                />
              </div>
            );
          })}
          {selectedMetricKeys.length < numTotalMetrics &&
            new Array(numTotalMetrics - selectedMetricKeys.length).fill(0).map((_, index) => (
              <div key={`metric-spacer-row-${index}`} className="w-[0px]" />
            ))}
          <div className="relative flex justify-end items-center pr-[0px]">
            <div className="absolute cursor-pointer size-[24px] bg-color-bg-medium rounded-full flex justify-center items-center">
              <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-color-text-primary" />
            </div>
          </div>
        </GridTableRow>
      </Link>
    );
  },
  areTableRowPropsEqual
);

ApplicationTableRow.displayName = "ApplicationTableRow";

export const ApplicationsTable = memo(() => {
  const { applicationDataAggregatedAndFiltered, viewOptions } = useApplicationsData();
  const { sort, setSort } = useSort();
  const { metricsDef, selectedMetrics, selectedMetricKeys } = useMetrics();
  const [showUsd] = useLocalStorage("showUsd", true);

  const numTotalMetrics = Object.keys(metricsDef).length;

  const maxMetrics = useMemo(() => {
    return selectedMetricKeys.map((metric) => {
      return applicationDataAggregatedAndFiltered.reduce((acc, application) => {
        return Math.max(acc, application[metric]);
      }, 0);
    });
  }, [applicationDataAggregatedAndFiltered, selectedMetricKeys]);

  const { selectedTimespan } = useTimespan();

  const gridColumns = useMemo(() => {
    const applicationColumnWidth = selectedMetricKeys.length > 2 ? "minmax(156px, 1fr)" : "minmax(285px, 1fr)";
    const metricColumnWidth = selectedMetricKeys.length > 2 ? "242px" : "262px";
    const columns = ["26px", applicationColumnWidth];
    if (!viewOptions.hideChainsColumn) {
      columns.push("166px");
    }
    columns.push(
      "150px",
      "95px",
      ...selectedMetricKeys.map(() => metricColumnWidth),
      ...new Array(numTotalMetrics - selectedMetricKeys.length).fill("0px"),
      "29px"
    );
    return columns.join(" ");
  }, [numTotalMetrics, selectedMetricKeys, viewOptions.hideChainsColumn]);

  const renderItem = useCallback(
    (index: number) => (
      <div key={index} className="pb-[5px]">
        <ApplicationTableRow
          rowIndex={index}
          application={applicationDataAggregatedAndFiltered[index]}
          maxMetrics={maxMetrics}
        />
      </div>
    ),
    [applicationDataAggregatedAndFiltered, maxMetrics]
  );

  return (
    <>
      <GridTableHeader
        className="group text-[14px] !px-[5px] !py-0 !gap-x-0 !pb-[4px] !z-[10] !items-start transition-all duration-300"
        style={{ gridTemplateColumns: gridColumns }}
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
        {!viewOptions.hideChainsColumn && (
          <GridTableHeaderCell
            metric="origin_keys"
            className="heading-small-xs pl-[3px] pr-[15px] "
            sort={sort}
            setSort={setSort}
          >
            Chains
          </GridTableHeaderCell>
        )}
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
        {selectedMetrics.map((metric, index) => (
          <div key={index} className="flex justify-end pr-[15px] ">
            <GridTableHeaderCell
              metric={metric}
              className="heading-small-xs z-[0] flex whitespace-nowrap"
              justify="end"
              sort={sort}
              setSort={setSort}
              extraRight={
                <div className="flex items-end gap-x-[5px] pl-[5px] cursor-default z-[10]">
                  <div
                    className={`cursor-pointer items-center rounded-full bg-color-bg-medium text-color-text-primary gap-x-[2px] px-[5px] h-[18px] ${
                      selectedTimespan === "max" ? "hidden" : "flex"
                    }`}
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
              {metricsDef[metric].name}{" "}
              {Object.keys(metricsDef[metric].units).includes("eth") && <>{showUsd ? "(USD)" : "(ETH)"}</>}
            </GridTableHeaderCell>
          </div>
        ))}
        {selectedMetricKeys.length < numTotalMetrics &&
          new Array(numTotalMetrics - selectedMetricKeys.length).fill(0).map((_, index) => (
            <div key={`metric-spacer-${index}`} className="w-[0px]" />
          ))}
        <div />
      </GridTableHeader>
      <div
        className="flex flex-col"
        style={{ height: `${applicationDataAggregatedAndFiltered.length * 34 + applicationDataAggregatedAndFiltered.length * 5}px` }}
      >
        <Virtuoso
          totalCount={applicationDataAggregatedAndFiltered.length}
          itemContent={renderItem}
          useWindowScroll
          increaseViewportBy={{ top: 200, bottom: 400 }}
          overscan={100}
        />
      </div>
    </>
  );
});

ApplicationsTable.displayName = "ApplicationsTable";
