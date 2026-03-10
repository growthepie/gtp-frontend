"use client";

import Heading from "../layout/Heading";
import { useEffect, useMemo, useRef, useState } from "react";
import { GTPIcon } from "../layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import Link from "next/link";
import GTPCardLayout from "../GTPButton/GTPCardLayout";
import GTPChart, { GTPChartSeries } from "../GTPButton/GTPChart";
import { GTPButton } from "../GTPButton/GTPButton";
import GTPButtonContainer from "../GTPButton/GTPButtonContainer";
import GTPButtonRow from "../GTPButton/GTPButtonRow";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { ALL_EVENT_DATA_URLS, EVENTS_BY_ID, FEATURED_EVENT_IDS_MAX, type EventId } from "../../lib/landing-events";
import { EventOption, EventSeriesMeta } from "../../lib/landing-events/types";
import { ApplicationsURLs } from "@/lib/urls";
import { DEFAULT_COLORS } from "@/lib/echarts-utils";
import { AppOverviewResponse } from "@/types/applications/AppOverviewResponse";
import { ProjectsMetadataProvider, useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { ApplicationIcon } from "@/app/(layout)/applications/_components/Components";

const EMPTY_OPTIONS: EventOption[] = [];

const getNestedValue = (obj: unknown, path: string) => {
  return path.split(".").reduce((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, obj as unknown);
};

const buildSeriesFromSource = (
  values: unknown,
  seriesMeta: EventSeriesMeta[] | undefined,
  xIndex = 0,
): GTPChartSeries[] => {
  if (!Array.isArray(values) || !seriesMeta?.length) return [];

  return seriesMeta.map((meta) => {
    const data = values
      .map<[number, number | null] | null>((row) => {
        if (!Array.isArray(row)) return null;
        const rawX = row[xIndex];
        const rawY = row[meta.yIndex];
        const timestamp = typeof rawX === "number" ? rawX : Number(rawX);
        if (!Number.isFinite(timestamp)) return null;
        const value = typeof rawY === "number" ? rawY : Number(rawY);
        return [timestamp, Number.isFinite(value) ? value : null];
      })
      .filter((point): point is [number, number | null] => Boolean(point));

    return {
      name: meta.name,
      color: meta.color,
      seriesType: meta.seriesType ?? "line",
      data,
    };
  });
};

const buildDynamicSeriesFromSource = (
  values: unknown,
  dynamicConfig: NonNullable<EventOption["dataSource"]>["dynamicSeries"],
  sourceData: unknown,
): GTPChartSeries[] => {
  if (!dynamicConfig || !Array.isArray(values)) return [];

  const namesRaw = getNestedValue(sourceData, dynamicConfig.namesPath);
  const colorsRaw = getNestedValue(sourceData, dynamicConfig.colorsPath);
  const names = Array.isArray(namesRaw) ? namesRaw : [];
  const colors = Array.isArray(colorsRaw)
    ? colorsRaw.filter((color): color is string => typeof color === "string" && color.length > 0)
    : [];

  if (colors.length === 0) return [];

  const ystartIndex = dynamicConfig.ystartIndex ?? 1;
  const xIndex = dynamicConfig.xIndex ?? 0;
  const seriesType = dynamicConfig.seriesType ?? "bar";

  const firstRow = values.find((row) => Array.isArray(row));
  const maxColumns = Array.isArray(firstRow) ? firstRow.length : 0;
  const availableSeriesCount = Math.max(0, maxColumns - ystartIndex);
  const seriesCount = names.length > 0 ? Math.min(names.length, availableSeriesCount) : availableSeriesCount;

  const hasNonZeroInSeries = (yIndex: number) => {
    return values.some((row) => {
      if (!Array.isArray(row)) return false;
      const raw = row[yIndex];
      const numeric = typeof raw === "number" ? raw : Number(raw);
      return Number.isFinite(numeric) && numeric !== 0;
    });
  };

  const seriesList: GTPChartSeries[] = [];

  for (let idx = 0; idx < seriesCount; idx += 1) {
    const yIndex = ystartIndex + idx;
    if (!hasNonZeroInSeries(yIndex)) continue;

    const seriesName = typeof names[idx] === "string" && names[idx].length > 0
      ? names[idx]
      : `Series ${idx + 1}`;
    const color = colors[idx % colors.length];

    const data = values
      .map<[number, number | null] | null>((row) => {
        if (!Array.isArray(row)) return null;
        const rawX = row[xIndex];
        const rawY = row[yIndex];
        const timestamp = typeof rawX === "number" ? rawX : Number(rawX);
        if (!Number.isFinite(timestamp)) return null;
        const value = typeof rawY === "number" ? rawY : Number(rawY);
        return [timestamp, Number.isFinite(value) ? value : null];
      })
      .filter((point): point is [number, number | null] => Boolean(point));

    seriesList.push({
      name: seriesName,
      color,
      seriesType,
      data,
    });
  }

  return seriesList;
};

const EventCard = ({
  event,
  isSelected,
  hasInteracted,
  setSelectedEvent,
}: {
  event: EventId;
  isSelected: boolean;
  hasInteracted: boolean;
  setSelectedEvent: (event: EventId) => void;
}) => {
  return (
    <motion.div
      layout
      className={`relative flex w-full overflow-hidden border-[1px] border-color-bg-medium rounded-[15px] py-[10px] px-[15px] gap-x-[10px] cursor-pointer ${isSelected ? "flex-1 min-h-0 bg-color-ui-active items-start" : "h-[54px] bg-color-bg-default hover:bg-color-ui-hover items-center"}`}
      onClick={() => setSelectedEvent(event)}
      transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
    >
      {/* Icon — layout="position" so it animates from center to top-left as card expands */}
      <motion.div layout="position" className={`shrink-0 ${isSelected ? "" : "pt-[6px]"}`}>
        <GTPIcon
          icon={EVENTS_BY_ID[event].image as GTPIconName}
          className={isSelected ? "!size-[24px]" : "!size-[16px]"}
          containerClassName="!size-[24px]"
        />
      </motion.div>

      {/* Content — AnimatePresence swaps between the two text states with opacity only.
          The card's own layout animation handles the height change, so no height
          animation is needed here (which was causing the squishing/pushing effect). */}
      <div className={`flex flex-col w-full min-w-0 ${isSelected ? "h-full" : "justify-center"}`}>
        <AnimatePresence mode="wait" initial={false}>
          {isSelected ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.15, ease: "easeOut" } }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="flex flex-col gap-y-[10px] h-full"
            >
              <p className="heading-small-md">{EVENTS_BY_ID[event].title}</p>
              <div className="flex h-full items-center pb-[30px]"><p className="text-xs">{EVENTS_BY_ID[event].description}</p></div>
            </motion.div>
          ) : (
            <motion.p
              key="question"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.25, ease: "easeOut" } }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="heading-small-xs"
            >
              {EVENTS_BY_ID[event].question}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Chevron — layout="position" mirrors the icon treatment */}
      <motion.div layout="position" className={`shrink-0 ${isSelected ? "flex items-center justify-center h-full" : ""}`}>
        <Link className="flex items-center justify-center" href={EVENTS_BY_ID[event].link}>
          <GTPIcon icon={isSelected ? "gtp-chevronright" : "gtp-chevronright-monochrome"} className="!size-[16px]" containerClassName="!size-[16px]" />
        </Link>
      </motion.div>

      {/* Auto-rotation progress bar — shrinks from full width to zero over 10 s.
          Uses border-b on a 15px-tall element with rounded-bl-[15px] so the border
          traces a visible quarter-circle arc on the left end, matching the card's
          own corner radius. border-b follows element geometry; background fills do not. */}
      {isSelected && !hasInteracted && (
        <div
          className="absolute bottom-0 left-0 h-[15px] rounded-bl-[15px] border-b-2 border-color-text-primary"
          style={{ animation: "event-progress-shrink 10s linear forwards" }}
        />
      )}
    </motion.div>
  );
};

const SideEventsContainer = ({
  selectedEvent,
  hasInteracted,
  setSelectedEvent,
}: {
  selectedEvent: EventId;
  hasInteracted: boolean;
  setSelectedEvent: (event: EventId) => void;
}) => {
  return (
    <div className="flex flex-col gap-y-[10px] w-[390px] h-[442px] min-w-[300px] shrink min-h-0 self-stretch overflow-y-auto">
      {FEATURED_EVENT_IDS_MAX.map((event) => (
        <EventCard key={event} event={event} isSelected={selectedEvent === event} hasInteracted={hasInteracted} setSelectedEvent={setSelectedEvent} />
      ))}
    </div>
  );
};


type ProjectMetricData = {
  value: number;
  prev_value: number;
  change_pct: number;
  rank: number;
  num_contracts: number;
};

type AggregatedProjectData = {
  owner_project: string;
  metrics: Record<string, ProjectMetricData>;
};

function calcPctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : Infinity;
  return ((current - previous) / previous) * 100;
}

const METRIC_COLS = ["gas_fees_eth", "gas_fees_usd", "txcount", "daa"] as const;
type MetricKey = typeof METRIC_COLS[number];

const LandingEventsCardContent = ({ selectedEvent }: { selectedEvent: EventId }) => {
  const { data: appOverviewData } = useSWR<AppOverviewResponse>(
    ApplicationsURLs.overview.replace("{timespan}", "7d"),
  );
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const projectDataMap = useMemo<Record<string, AggregatedProjectData>>(() => {
    if (!appOverviewData) return {};

    const types = appOverviewData.data.types as string[];
    const col = {
      owner_project:     types.indexOf("owner_project"),
      num_contracts:     types.indexOf("num_contracts"),
      gas_fees_eth:      types.indexOf("gas_fees_eth"),
      prev_gas_fees_eth: types.indexOf("prev_gas_fees_eth"),
      gas_fees_usd:      types.indexOf("gas_fees_usd"),
      prev_gas_fees_usd: types.indexOf("prev_gas_fees_usd"),
      txcount:           types.indexOf("txcount"),
      prev_txcount:      types.indexOf("prev_txcount"),
      daa:               types.indexOf("daa"),
      prev_daa:          types.indexOf("prev_daa"),
    };

    // Raw accumulator shape per owner
    type RawAcc = { num_contracts: number } & Record<MetricKey | `prev_${MetricKey}`, number>;
    const aggregated = new Map<string, RawAcc>();

    for (const row of appOverviewData.data.data) {
      const owner = row[col.owner_project] as string;
      if (!owner) continue;
      if (!aggregated.has(owner)) {
        aggregated.set(owner, { num_contracts: 0, gas_fees_eth: 0, prev_gas_fees_eth: 0, gas_fees_usd: 0, prev_gas_fees_usd: 0, txcount: 0, prev_txcount: 0, daa: 0, prev_daa: 0 });
      }
      const acc = aggregated.get(owner)!;
      acc.num_contracts     += (row[col.num_contracts]     as number) || 0;
      acc.gas_fees_eth      += (row[col.gas_fees_eth]      as number) || 0;
      acc.prev_gas_fees_eth += (row[col.prev_gas_fees_eth] as number) || 0;
      acc.gas_fees_usd      += (row[col.gas_fees_usd]      as number) || 0;
      acc.prev_gas_fees_usd += (col.prev_gas_fees_usd >= 0 ? (row[col.prev_gas_fees_usd] as number) : 0) || 0;
      acc.txcount           += (row[col.txcount]           as number) || 0;
      acc.prev_txcount      += (row[col.prev_txcount]      as number) || 0;
      acc.daa               += (row[col.daa]               as number) || 0;
      acc.prev_daa          += (row[col.prev_daa]          as number) || 0;
    }

    // Build per-metric objects (rank filled in after sorting)
    const rows: (AggregatedProjectData & { _raw: RawAcc })[] = Array.from(aggregated.entries()).map(([owner, raw]) => ({
      owner_project: owner,
      _raw: raw,
      metrics: {
        gas_fees_eth: { value: raw.gas_fees_eth, prev_value: raw.prev_gas_fees_eth, change_pct: calcPctChange(raw.gas_fees_eth, raw.prev_gas_fees_eth), rank: 0, num_contracts: raw.num_contracts },
        gas_fees_usd: { value: raw.gas_fees_usd, prev_value: raw.prev_gas_fees_usd, change_pct: calcPctChange(raw.gas_fees_usd, raw.prev_gas_fees_usd), rank: 0, num_contracts: raw.num_contracts },
        txcount:      { value: raw.txcount,       prev_value: raw.prev_txcount,      change_pct: calcPctChange(raw.txcount, raw.prev_txcount),           rank: 0, num_contracts: raw.num_contracts },
        daa:          { value: raw.daa,           prev_value: raw.prev_daa,          change_pct: calcPctChange(raw.daa, raw.prev_daa),                   rank: 0, num_contracts: raw.num_contracts },
      },
    }));

    // Assign ranks per metric
    for (const metricKey of METRIC_COLS) {
      const sorted = [...rows].sort((a, b) => b.metrics[metricKey].value - a.metrics[metricKey].value);
      let rank = 1;
      sorted.forEach((item, i) => {
        if (i > 0 && item.metrics[metricKey].value < sorted[i - 1].metrics[metricKey].value) rank = i + 1;
        item.metrics[metricKey].rank = rank;
      });
    }

    return Object.fromEntries(rows.map(({ _raw: _, ...r }) => [r.owner_project, r]));
  }, [appOverviewData]);

  

  return (
    <div className="flex flex-col gap-y-[10px] h-[442px] flex-1 overflow-y-auto">
      <div className="grid grid-cols-3 h-full gap-x-[10px] gap-y-[10px]">
        {EVENTS_BY_ID[selectedEvent].cards?.map((card, index) => {
          const projectData = projectDataMap[card.owner_project];
          const metadata = ownerProjectToProjectData[card.owner_project];
          const isGasFees = card.metric === "gas_fees";
          const metricData = isGasFees ? projectData?.metrics[`gas_fees_${showUsd ? "usd" : "eth"}`] : projectData?.metrics[card.metric];
          const positiveChangeColor = metricData?.change_pct && metricData.change_pct > 0
          const metricSuffix = (() => {
            switch (card.metric) {
              case "gas_fees":
                return "Gas Fees";
              case "txcount":
                return "Transactions";
              case "daa":
                return "Active Addresses";
              default:
                return "";
            }
          })();

          return (
            <Link
              href={`/applications/${card.owner_project}`}
              key={card.owner_project + index}
              className="px-[15px] pt-[5px] h-full pb-[10px] bg-transparent hover:bg-color-ui-hover rounded-[15px] border-[0.5px] border-color-bg-medium flex flex-col"
            >
              <div className="flex w-full justify-between items-end">
                <div className="">
                  <span className="numbers-xs">{metricData ? metricData.num_contracts.toLocaleString("en-GB") : "—"}</span>
                  <span className="text-xs text-color-text-secondary">&nbsp;contracts</span>
                </div>
                <div className="">
                  <span className="text-xs text-color-text-secondary">Rank&nbsp;</span>
                  <span className="numbers-xs">{metricData ? metricData.rank : "—" }&nbsp;
                    <span className={`numbers-xs ${positiveChangeColor ? "text-color-positive" : "text-color-negative"}`}>
                      {metricData?.change_pct && metricData.change_pct !== Infinity ? `${positiveChangeColor ? "+" : "-"}${metricData.change_pct.toFixed(0)}%` : metricData?.change_pct === Infinity ? "+999%" : ""}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex w-full justify-end items-center">
                <div className="">
                  <span className="numbers-sm">
                    {metricData
                      ? `${isGasFees ? (showUsd ? "$" : "Ξ") : ""}${metricData.value.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`
                      : "—"}
                  </span>
                  <span className="text-xs text-color-text-secondary">&nbsp;{metricSuffix}</span>
                </div>
              </div>
              <div className="flex w-full h-full gap-x-[5px] justify-between items-center">
                <ApplicationIcon owner_project={card.owner_project} size="sm" />
                <span className="heading-small-md text-color-text-primary">
                  {metadata?.display_name || card.owner_project}
                </span>
                <div className="p-[5px] bg-color-bg-medium rounded-full flex items-center justify-center">
                  <GTPIcon icon="gtp-chevronright-monochrome" className="!size-[11px]" containerClassName="!size-[16px] flex items-center justify-center" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
const LandingEventsChartContent = ({ selectedEvent, onInteract }: { selectedEvent: EventId; onInteract: () => void }) => {
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
  const [isWrapping, setIsWrapping] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const eventData = EVENTS_BY_ID[selectedEvent];
  const options = eventData.options ?? EMPTY_OPTIONS;
  const hasOptions = options.length > 0;
  const showOptions = options.length > 1;
  const resolvedDefaultOptionId = hasOptions
    ? options.some((option) => option.id === eventData.defaultOptionId)
      ? eventData.defaultOptionId ?? options[0].id
      : options[0].id
    : null;
  const [activeOptionId, setActiveOptionId] = useState<string | null>(resolvedDefaultOptionId);

  const activeOption = hasOptions
    ? options.find((option) => option.id === activeOptionId) ?? options[0]
    : null;
  const activeDataSource = activeOption?.dataSource;
  const activeXAxisLines = activeOption?.xAxisLines ?? eventData.xAxisLines ?? [];
  const { data: activeSourceData } = useSWR(activeDataSource?.url ?? null);

  const selectedSeries = useMemo(() => {
    if (activeOption?.series?.length) {
      return activeOption.series;
    }

    if (activeDataSource?.dynamicSeries && activeSourceData) {
      const values = getNestedValue(activeSourceData, activeDataSource.pathToData);
      return buildDynamicSeriesFromSource(values, activeDataSource.dynamicSeries, activeSourceData);
    }

    if (activeDataSource && activeSourceData) {
      const values = getNestedValue(activeSourceData, activeDataSource.pathToData);
      return buildSeriesFromSource(values, activeDataSource.series, activeDataSource.xIndex ?? 0);
    }

    return eventData.series ?? [];
  }, [activeOption?.series, activeDataSource, activeSourceData, eventData.series]);

  const allSeriesNames = useMemo(() => selectedSeries.map((series) => series.name), [selectedSeries]);
  const [inactiveSeriesNames, setInactiveSeriesNames] = useState<Set<string>>(new Set());
  const [hoverSeriesName, setHoverSeriesName] = useState<string | null>(null);

  const validSeriesNamesSet = useMemo(() => new Set(allSeriesNames), [allSeriesNames]);
  const effectiveInactiveSeriesNames = useMemo(() => {
    if (inactiveSeriesNames.size === 0) return inactiveSeriesNames;
    const filtered = new Set<string>();
    inactiveSeriesNames.forEach((name) => {
      if (validSeriesNamesSet.has(name)) filtered.add(name);
    });
    return filtered;
  }, [inactiveSeriesNames, validSeriesNamesSet]);

  const activeSeries = useMemo(() => {
    if (effectiveInactiveSeriesNames.size === 0) return selectedSeries;
    return selectedSeries.filter((series) => !effectiveInactiveSeriesNames.has(series.name));
  }, [effectiveInactiveSeriesNames, selectedSeries]);

  const legendItems = useMemo(() => {
    return selectedSeries.map((series, index) => {
      const resolvedColor = Array.isArray(series.color)
        ? series.color[0]
        : series.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
      return {
        name: series.name,
        color: resolvedColor,
      };
    });
  }, [selectedSeries]);

  const visibleLegendItems = legendItems.slice(0, 9);
  const inactiveLegendCount = effectiveInactiveSeriesNames.size;

  const emptyStateMessage = activeDataSource
    ? activeSourceData
      ? activeSeries.length === 0
        ? "Select series to show data"
        : "No data available"
      : "Loading chart data..."
    : selectedSeries.length === 0
      ? "No chart data available"
      : activeSeries.length === 0
        ? "Select series to show data"
        : "";

  
  return (
    <div className="relative flex-1 min-w-[300px] h-[442px] overflow-hidden" onMouseEnter={onInteract}>
      <GTPCardLayout className="h-[442px]"
       topBar={
        showOptions ? (
          <GTPButtonContainer style={{ borderRadius: isWrapping ? "15px" : "inherit" }}>
              <GTPButtonRow wrap onWrapChange={setIsWrapping} style={{ borderRadius: isWrapping ? "15px" : "inherit" }}>
                {options.map((option) => {
                  const isActive = option.id === activeOptionId;

                  return (
                    <GTPButton
                      key={option.id}
                      label={option.label}
                      size="sm"
                      variant={isActive ? "primary" : "no-background"}
                      visualState={isActive ? "active" : "default"}
                      clickHandler={() => {
                        setActiveOptionId(option.id);
                        setSelectedRange(null);
                      }}
                    />
                  );
                })}
              </GTPButtonRow>
            <GTPButton
                label={!selectedRange ? undefined : ""}
                leftIcon={selectedRange ? "feather:zoom-out" as GTPIconName : "feather:zoom-in" as GTPIconName}
                leftIconClassname={"text-color-text-primary"}
                size={isMobile ? "xs" : "sm"}
                className={!selectedRange ? "hidden" : "block"}
                variant={!selectedRange ? "no-background" : "highlight"}
                visualState="default"
                clickHandler={() => setSelectedRange(null)}
            />
          </GTPButtonContainer>
       ) : (
        <GTPButtonContainer style={{ borderRadius: isWrapping ? "15px" : "inherit" }}>
            <GTPButtonRow wrap onWrapChange={setIsWrapping} style={{ borderRadius: isWrapping ? "15px" : "inherit" }}>
              
             

            
                  <GTPButton
                    key={eventData.title + "top-tab-button"}
                    label={eventData.title}
                    size="sm"
                    variant={"primary"}
                    visualState={"active"}
                    clickHandler={() => {
                      setActiveOptionId(eventData.title);
                      setSelectedRange(null);
                    }}
                  />
      
            </GTPButtonRow>
          <GTPButton
              label={!selectedRange ? undefined : ""}
              leftIcon={selectedRange ? "feather:zoom-out" as GTPIconName : "feather:zoom-in" as GTPIconName}
              leftIconClassname={"text-color-text-primary"}
              size={isMobile ? "xs" : "sm"}
              className={!selectedRange ? "hidden" : "block"}
              variant={!selectedRange ? "no-background" : "highlight"}
              visualState="default"
              clickHandler={() => setSelectedRange(null)}
          />
        </GTPButtonContainer>
       )
       }
      >
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 min-h-0 w-full py-[15px]  -overflow-hidden">
            <GTPChart
              series={activeSeries}

              stack={activeOption?.stack ?? false}
              snapToCleanBoundary={false}
              xAxisMin={selectedRange ? selectedRange[0] : undefined}
              xAxisMax={selectedRange ? selectedRange[1] : undefined}
              emptyStateMessage={emptyStateMessage}
              xAxisLines={activeXAxisLines}
              onDragSelect={(xStart, xEnd) => {
                if(xStart < xEnd) {
                  setSelectedRange([Math.floor(xStart), Math.floor(xEnd)]);
                } else {
                  setSelectedRange([Math.floor(xEnd), Math.floor(xStart)]);
                }
              }}
              dragSelectOverlayColor="rgb(var(--text-secondary) / 50%)"
              dragSelectIcon={"feather:zoom-in" as GTPIconName}
              minDragSelectPoints={2}
            />
          </div>
          {legendItems.length > 0 && (
            <div className="h-[30px] w-full relative bottom-[6px] flex items-center justify-center gap-[5px]">
              {visibleLegendItems.map((item) => (
                <GTPButton
                  key={item.name}
                  label={item.name}
                  variant={effectiveInactiveSeriesNames.has(item.name) ? "no-background" : "primary"}
                  size="xs"
                  clickHandler={() => {
                    setInactiveSeriesNames((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.name)) {
                        next.delete(item.name);
                      } else {
                        next.add(item.name);
                      }
                      return next;
                    });
                  }}
                  onMouseEnter={() => setHoverSeriesName(item.name)}
                  onMouseLeave={() => setHoverSeriesName(null)}
                  rightIcon={
                    hoverSeriesName === item.name
                      ? effectiveInactiveSeriesNames.has(item.name)
                        ? "in-button-plus"
                        : "in-button-close"
                      : undefined
                  }
                  rightIconClassname="!w-[12px] !h-[12px]"
                  textClassName={effectiveInactiveSeriesNames.has(item.name) ? "text-color-text-secondary" : undefined}
                  className={effectiveInactiveSeriesNames.has(item.name) ? "border border-color-bg-medium" : undefined}
                  leftIconOverride={(
                    <div
                      className="min-w-[6px] min-h-[6px] rounded-full"
                      style={{ backgroundColor: item.color, opacity: effectiveInactiveSeriesNames.has(item.name) ? 0.35 : 1 }}
                    />
                  )}
                />
              ))}
              {legendItems.length > 1 && (
                <GTPButton
                  key="legend-toggle-all"
                  label={inactiveLegendCount === 0 ? "Deselect All" : "Select All"}
                  variant="primary"
                  size="xs"
                  clickHandler={() => {
                    if (inactiveLegendCount === 0) {
                      setInactiveSeriesNames(new Set(allSeriesNames));
                    } else {
                      setInactiveSeriesNames(new Set());
                    }
                  }}
                />
              )}
            </div>
          )}
        </div>
      </GTPCardLayout>
    </div>
  );
};

/**
 * Eagerly fetches every event data URL on page load so the SWR cache is warm
 * before the user clicks an event. ALL_EVENT_DATA_URLS is a static module-level
 * constant, so the number of useSWR calls never changes between renders.
 */
const EventDataPrefetcher = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  ALL_EVENT_DATA_URLS.forEach((url) => useSWR(url));
  return null;
};

export default function LandingEventsChart() {
  const [selectedEvent, setSelectedEvent] = useState<EventId>(FEATURED_EVENT_IDS_MAX[0]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const hasInteractedRef = useRef(false);

  const handleInteract = () => {
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      setHasInteracted(true);
    }
  };

  // Auto-advance to the next event every 10 seconds until the user interacts
  useEffect(() => {
    if (hasInteracted) return;
    const interval = setInterval(() => {
      if (hasInteractedRef.current) {
        clearInterval(interval);
        return;
      }
      setSelectedEvent((current) => {
        const currentIndex = FEATURED_EVENT_IDS_MAX.indexOf(current);
        const nextIndex = (currentIndex + 1) % FEATURED_EVENT_IDS_MAX.length;
        return FEATURED_EVENT_IDS_MAX[nextIndex];
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [hasInteracted]);

  return (
    <ProjectsMetadataProvider>
      <EventDataPrefetcher />
      <div className="flex flex-col gap-y-[15px] w-full pb-[30px] h-full min-h-0 overflow-hidden">
          {/*Heading */}
        <div className="flex items-center gap-x-[8px]">
          <GTPIcon icon="gtp-ethereumlogo" className="!size-[24px]" containerClassName="!size-[24px]" />
          <Heading className="heading-large-lg">Trending Topics in the Ecosystem</Heading>

        </div>
        <div className="flex flex-wrap items-stretch gap-[15px] flex-1 min-h-0 overflow-y-auto">
          <SideEventsContainer
            selectedEvent={selectedEvent}
            hasInteracted={hasInteracted}
            setSelectedEvent={(event) => {
              handleInteract();
              setSelectedEvent(event);
            }}
          />
          {(EVENTS_BY_ID[selectedEvent].bodyType ?? "chart") === "chart" ? (
            <LandingEventsChartContent key={selectedEvent} selectedEvent={selectedEvent} onInteract={handleInteract} />
          ) : (
            <LandingEventsCardContent key={selectedEvent} selectedEvent={selectedEvent} />
          )}
        </div>
      </div>
    </ProjectsMetadataProvider>
  );
}
