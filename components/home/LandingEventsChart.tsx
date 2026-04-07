"use client";

import Heading from "../layout/Heading";
import { useEffect, useMemo, useRef, useState } from "react";
import { GTPIcon, sizeClassMap } from "../layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import Link from "next/link";
import Image from "next/image";
import GTPCardLayout from "../GTPComponents/GTPLayout/GTPCardLayout";
import GTPChart, { GTPChartSeries, GTPChartXAxisLine } from "../GTPComponents/GTPChart";
import { GTPButton } from "../GTPComponents/ButtonComponents/GTPButton";
import GTPButtonContainer from "../GTPComponents/ButtonComponents/GTPButtonContainer";
import GTPButtonRow from "../GTPComponents/ButtonComponents/GTPButtonRow";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import type { EmblaCarouselType } from "embla-carousel";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { ALL_EVENT_DATA_URLS, EVENTS_BY_ID, FEATURED_EVENT_IDS_MAX, type EventId } from "../../lib/landing-events";
import { EventExample, EventOption, EventSeriesMeta } from "../../lib/landing-events/types";
import { ApplicationsURLs, getChainMetricURL, MetricURLKeyToAPIKey } from "@/lib/urls";
import { DEFAULT_COLORS } from "@/lib/echarts-utils";
import { AppOverviewResponse } from "@/types/applications/AppOverviewResponse";
import { ProjectsMetadataProvider, useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { ApplicationIcon } from "@/app/(layout)/applications/_components/Components";
import { Carousel } from "@/components/Carousel";
import { MasterProvider, useMaster } from "@/contexts/MasterContext";
import { metricItems } from "@/lib/metrics";
import HorizontalScrollContainer from "../HorizontalScrollContainer";
import { chain, size } from "lodash";
import { useTheme } from "next-themes";

const EMPTY_OPTIONS: EventOption[] = [];

const CARD_COLLAPSED_H = 54;
const CARD_GAP = 10;
const SIDE_CONTAINER_H = 442;
const CARD_EXPANDED_H =
  SIDE_CONTAINER_H -
  (FEATURED_EVENT_IDS_MAX.length - 1) * (CARD_COLLAPSED_H + CARD_GAP);

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

type AllTimeHighMeta = {
  chainKey: string;
  chainLabel: string;
  metricKey: string;
  metricApiKey: string;
  metricLabel: string;
  metricUrlKey: string;
  color?: string;
};

type ResolvedEventExample = EventExample & {
  title: string;
  description: string;
  question: string;
  image: string;
  link: string;
  athMeta?: AllTimeHighMeta;
};

const ATH_VALUES_PATH = "details.timeseries.daily.data";
const ATH_TYPES_PATH = "details.timeseries.daily.types";
const ATH_MARK_LINE_LABEL = "ATH";

const formatKeyLabel = (value: string) => {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const resolveMetricItem = (metricKey: string) => {
  if (!metricKey) return undefined;
  return metricItems.find((item) => item.urlKey === metricKey || item.key === metricKey);
};

const resolveMetricUrlKey = (metricKey: string) => {
  const metricItem = resolveMetricItem(metricKey);
  return metricItem?.urlKey ?? metricKey;
};

const getChainMetricUrlSafe = (chainKey: string, metricUrlKey: string) => {
  try {
    return getChainMetricURL(chainKey, metricUrlKey);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[LandingEvents] Failed to build chain metric URL:", error);
    }
    return null;
  }
};

const resolveEventExample = (
  event: EventExample,
  allChainsByKeys: Record<string, { label?: string; colors?: { light?: string[] } }> | null | undefined,
): ResolvedEventExample => {
  if (!event.allTimeHigh) {
    return {
      ...event,
      title: event.title ?? "Untitled Event",
      description: event.description ?? "",
      question: event.question ?? "",
      image: event.image ?? "gtp-ethereumlogo",
      link: event.link ?? "/",
    };
  }

  const { chainKey, metricKey } = event.allTimeHigh;
  const metricItem = resolveMetricItem(metricKey);
  const metricUrlKey = resolveMetricUrlKey(metricKey);
  const metricApiKey = MetricURLKeyToAPIKey[metricUrlKey] ?? metricItem?.key ?? metricKey;
  const metricLabel = metricItem?.label ?? formatKeyLabel(metricKey);
  const chainLabel = allChainsByKeys?.[chainKey]?.label ?? formatKeyLabel(chainKey);
  const chainColor = allChainsByKeys?.[chainKey]?.colors?.light?.[0];

  const title = event.title ?? `All-Time High: ${metricLabel} for ${chainLabel}`;
  const description =
    event.description ?? `Daily ${metricLabel} on ${chainLabel}, highlighting its all-time high.`;
  const question =
    event.question ?? `Which chain has recently reached a new high in ${metricLabel}?`;
  const image = event.image ?? metricItem?.icon ?? "gtp-metrics-transaction-count";
  const link = event.link ?? `/fundamentals/${metricUrlKey}`;

  const athMeta: AllTimeHighMeta = {
    chainKey,
    chainLabel,
    metricKey,
    metricApiKey,
    metricLabel,
    metricUrlKey,
    color: chainColor,
  };

  let options = event.options;
  let defaultOptionId = event.defaultOptionId;
  if (!options || options.length === 0) {
    const url = getChainMetricUrlSafe(chainKey, metricUrlKey);
    if (url) {
      const optionId = `ath-${chainKey}-${metricUrlKey}`;
      options = [
        {
          id: optionId,
          label: metricLabel,
          dataSource: {
            url,
            pathToData: ATH_VALUES_PATH,
            xIndex: 0,
          },
        },
      ];
      defaultOptionId = defaultOptionId ?? optionId;
    }
  }

  return {
    ...event,
    title,
    description,
    question,
    image,
    link,
    options,
    defaultOptionId,
    athMeta,
  };
};

const resolveAthIndices = (typesRaw: unknown, valuesRaw: unknown) => {
  const types = Array.isArray(typesRaw)
    ? typesRaw.map((type) => String(type).toLowerCase())
    : [];
  const fallbackRow = Array.isArray(valuesRaw)
    ? valuesRaw.find((row) => Array.isArray(row))
    : null;
  const fallbackLength = Array.isArray(fallbackRow) ? fallbackRow.length : 0;
  const xIndex = types.indexOf("unix") >= 0 ? types.indexOf("unix") : 0;

  let yIndex = -1;
  if (types.length > 0) {
    yIndex = types.indexOf("usd");
    if (yIndex < 0) yIndex = types.indexOf("eth");
    if (yIndex < 0) yIndex = types.findIndex((_, idx) => idx !== xIndex);
  } else if (fallbackLength > 1) {
    yIndex = xIndex === 0 ? 1 : 0;
  }

  return { xIndex, yIndex: yIndex >= 0 ? yIndex : null };
};

const resolveTypesPathFromValuesPath = (pathToData: string | undefined) => {
  if (!pathToData) return null;
  if (pathToData.endsWith(".values")) return pathToData.replace(/\.values$/, ".types");
  if (pathToData.endsWith(".data")) return pathToData.replace(/\.data$/, ".types");
  return null;
};

const toTypeToken = (value: unknown) => String(value ?? "").trim().toLowerCase();

const matchesUnitToken = (typeToken: string, unit: "usd" | "eth") => {
  const token = typeToken.toLowerCase();
  return (
    token === unit ||
    token.startsWith(`${unit}_`) ||
    token.endsWith(`_${unit}`) ||
    token.includes(`_${unit}_`)
  );
};

const buildAthSeriesFromSource = (
  sourceData: unknown,
  athMeta: AllTimeHighMeta | undefined,
): GTPChartSeries[] => {
  if (!athMeta) return [];
  const values = getNestedValue(sourceData, ATH_VALUES_PATH);
  const types = getNestedValue(sourceData, ATH_TYPES_PATH);
  const { xIndex, yIndex } = resolveAthIndices(types, values);
  if (yIndex === null) return [];

  const seriesMeta: EventSeriesMeta[] = [
    {
      name: athMeta.metricLabel,
      color: athMeta.color ?? DEFAULT_COLORS[0],
      yIndex,
      seriesType: "area",
    },
  ];

  return buildSeriesFromSource(values, seriesMeta, xIndex).map((series) => ({
    ...series,
    showAllTimeHigh: true,
    allTimeHighLabel: ATH_MARK_LINE_LABEL,
  }));
};

const buildAthXAxisLines = (
  series: GTPChartSeries[],
  athMeta: AllTimeHighMeta | undefined,
): GTPChartXAxisLine[] => {
  if (!athMeta || series.length === 0) return [];
  const data = series[0]?.data ?? [];
  let maxValue = -Infinity;
  let maxTimestamp: number | null = null;

  data.forEach(([timestamp, value]) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    if (value > maxValue || (value === maxValue && (maxTimestamp === null || timestamp > maxTimestamp))) {
      maxValue = value;
      maxTimestamp = timestamp;
    }
  });

  if (maxTimestamp === null) return [];
  const seriesColor = Array.isArray(series[0]?.color) ? series[0]?.color[0] : series[0]?.color;

  return [
    {
      xValue: maxTimestamp,
      annotationText: "All-time high",
      lineStyle: "dashed",
      lineColor: seriesColor ?? athMeta.color,
      textColor: seriesColor ?? athMeta.color,
    },
  ];
};

const EventCard = ({
  event,
  eventData,
  isSelected,
  hasInteracted,
  setSelectedEvent,
}: {
  event: EventId;
  eventData: ResolvedEventExample;
  isSelected: boolean;
  hasInteracted: boolean;
  setSelectedEvent: (event: EventId) => void;
}) => {
  const isMobile = useMediaQuery("(max-width: 1024px)");
  // On mobile the card lives inside a fixed-height carousel slide, so always
  // show the expanded state and skip the layout height animation.
  const showExpanded = isSelected || isMobile;

  return (
    <motion.div
      initial={!isMobile ? { height: isSelected ? CARD_EXPANDED_H : CARD_COLLAPSED_H } : undefined}
      animate={!isMobile ? { height: isSelected ? CARD_EXPANDED_H : CARD_COLLAPSED_H } : undefined}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{ borderRadius: "15px" }}
      className={`relative flex w-full shrink-0 overflow-hidden border-[1px] border-color-bg-medium py-[10px] px-[15px] gap-x-[10px] cursor-pointer ${
        isMobile
          ? "h-full bg-color-ui-active items-start"
          : isSelected
            ? "bg-color-ui-active items-start"
            : "bg-color-bg-default hover:bg-color-ui-hover items-center"
      }`}
      onClick={() => setSelectedEvent(event)}
    >
      {/* Icon */}
      <div className="shrink-0">
        <GTPIcon
          icon={eventData.image as GTPIconName}
          className={isSelected ? "!size-[24px]" : "!size-[16px]"}
          containerClassName="!size-[24px] flex items-center justify-center"
        />
      </div>

      {/* Content */}
      <div className={`flex flex-col w-full min-w-0 ${isMobile ? "h-full" : ""}`}>
        <AnimatePresence mode="wait" initial={false}>
          {showExpanded ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.3, delay: 0.15, ease: "easeOut" } }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className={`flex flex-col gap-y-[10px] ${isMobile ? "h-full" : ""}`}
            >
              <p className="heading-small-md">{eventData.title}</p>
              <div className={`flex ${isMobile ? "h-full" : ""} items-center pb-[30px]`}><p className="text-xs">{eventData.description}</p></div>
            </motion.div>
          ) : (
            <motion.p
              key="question"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.3, delay: 0.25, ease: "easeOut" } }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="heading-small-xs self-start"
            >
              {eventData.question}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Chevron */}
      <div className={`shrink-0 ${isSelected ? "flex items-center justify-center h-full" : ""}`}>
        <div className="flex items-center justify-center" >
          <GTPIcon icon={isSelected ? "gtp-chevronright" : "gtp-chevronright-monochrome"} className="!size-[16px]" containerClassName="!size-[16px]" />
        </div>
      </div>

      {/* Auto-rotation progress bar */}
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
  eventsById,
}: {
  selectedEvent: EventId;
  hasInteracted: boolean;
  setSelectedEvent: (event: EventId) => void;
  eventsById: Record<EventId, ResolvedEventExample>;
}) => {
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const emblaApiRef = useRef<EmblaCarouselType | null>(null);
  const slideChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When selectedEvent changes externally (e.g. auto-advance), scroll the carousel to match
  useEffect(() => {
    const index = FEATURED_EVENT_IDS_MAX.indexOf(selectedEvent);
    if (index !== -1) emblaApiRef.current?.scrollTo(index);
  }, [selectedEvent]);

  const handleSlideChange = (index: number) => {
    if (slideChangeTimerRef.current) clearTimeout(slideChangeTimerRef.current);
    slideChangeTimerRef.current = setTimeout(() => {
      setSelectedEvent(FEATURED_EVENT_IDS_MAX[index]);
    }, 300);
  };

  if (isMobile) {
    return (
      <div className="w-full pb-[15px] lg:pb-0">
        <Carousel
          ariaId="events-carousel"
          heightClass="h-[120px] sm:h-[100px]"
          breakpoints={{ 0: { slidesPerView: 0, centered: false, gap: 15 } }}
          pagination="dots"
          arrows={false}
          padding={{ mobile: 5, desktop: 0 }}
          bottomOffset={-20}
          onInit={(api) => { emblaApiRef.current = api; }}
          onSlideChange={handleSlideChange}
          noFade
        >
          {FEATURED_EVENT_IDS_MAX.map((event) => (
            <div key={event} className="h-full flex items-center w-full">
              <EventCard
                event={event}
                eventData={eventsById[event]}
                isSelected={selectedEvent === event}
                hasInteracted={hasInteracted}
                setSelectedEvent={setSelectedEvent}
              />
            </div>
          ))}
        </Carousel>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-[10px] min-w-[390px] h-[442px] w-[30%] overflow-hidden">
      {FEATURED_EVENT_IDS_MAX.map((event) => (
        <EventCard
          key={event}
          event={event}
          eventData={eventsById[event]}
          isSelected={selectedEvent === event}
          hasInteracted={hasInteracted}
          setSelectedEvent={setSelectedEvent}
        />
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

const LandingEventsCardContent = ({ eventData }: { eventData: ResolvedEventExample }) => {
  const { data: appOverviewData } = useSWR<AppOverviewResponse>(
    ApplicationsURLs.overview.replace("{timespan}", "7d"),
  );
  const isMobile = useMediaQuery("(max-width: 1364px)");
  const reduceIcons = useMediaQuery("(max-width: 1120px)");
  const finalShrink = useMediaQuery("(max-width: 624px)");

  const { ownerProjectToProjectData } = useProjectsMetadata();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { data: master, AllChainsByKeys } = useMaster();

  const { theme } = useTheme();


  const projectDataMap = useMemo<Record<string, AggregatedProjectData>>(() => {
    if (!appOverviewData || !ownerProjectToProjectData ) return {};

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
  }, [appOverviewData, ownerProjectToProjectData]);


  

  const resolvedCards = useMemo(() => {
    if (eventData.topAppsMetric && Object.keys(projectDataMap).length > 0) {
      const metricKey = eventData.topAppsMetric as MetricKey;
      return Object.values(projectDataMap)
        .filter((p) => p.metrics[metricKey])
        .sort((a, b) => a.metrics[metricKey].rank - b.metrics[metricKey].rank)
        .slice(0, 9)
        .map((p) => ({ owner_project: p.owner_project, metric: eventData.topAppsMetric! }));
    }
    return eventData.cards ?? [];
  }, [eventData.topAppsMetric, eventData.cards, projectDataMap]);


  const showIcons = useMemo(() => {
    return reduceIcons ? 3 : 5;
  }, [reduceIcons]);




  return (
    <div className="flex-1 min-w-[300px] 2xs:mt-0 mt-[30px] ">
      <HorizontalScrollContainer
        includeMargin={false}
        enableDragScroll={true}
        paddingRight={0}
        hideScrollbar={false}
  
        forcedMinWidth={360}
        className="h-full "
      >
        <div className="grid grid-cols-3 gap-x-[10px] gap-y-[10px] h-[442px]">
        {resolvedCards.map((card, index) => {
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
              className="px-[10px]  h-full pt-[5px] pb-[10px] bg-transparent group hover:bg-color-ui-hover rounded-[15px] border-[0.5px] border-color-bg-medium flex flex-col"
            >
              <div className="flex w-full justify-between items-end">
                <div className="">
                <span className={` group-hover:text-color-text-primary text-color-text-secondary ${!isMobile ? "text-xs" : "text-xxs "}`}
                style={{
                  fontSize: finalShrink ? "8px" : "",
                }}
                >Rank&nbsp;</span>
                  <span className={`${!isMobile ? "numbers-xs" : "numbers-xxs "}`}
                  style={{
                    fontSize: finalShrink ? "8px" : "",
                  }}
                  >{metricData ? metricData.rank : "—" }&nbsp;
                    <span className={`numbers-xxs ${positiveChangeColor ? "text-color-positive" : "text-color-negative"}`}
                    style={{
                      fontSize: finalShrink ? "8px" : "",
                    }}
                    >
                      {metricData?.change_pct && metricData.change_pct !== Infinity ? `${positiveChangeColor ? "+" : ""}${metricData.change_pct.toFixed(0)}%` : metricData?.change_pct === Infinity ? "+999%" : ""}
                    </span>
                  </span>
                </div>
                <div className="">
                  <div className="">
                    <span className={`${!isMobile ? "numbers-xs" : "numbers-xxs "}`}
                    style={{
                      fontSize: finalShrink ? "8px" : "",
                    }}
                    >
                      {metricData
                        ? `${isGasFees ? (showUsd ? "$" : "Ξ") : ""}${metricData.value.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`
                        : "—"}
                    </span>   
                  </div>
                </div>
              </div>
              <div className="flex w-full justify-end items-center -mt-[5px]">
                <span className={`group-hover:text-color-text-primary text-color-text-secondary ${!isMobile ? "text-xs" : "text-xxs "}`}
                style={{
                  fontSize: finalShrink ? "8px" : "",
                }}
                >{metricSuffix}</span>
              </div>
              <div className="flex w-full h-full gap-x-[5px] justify-between items-center">
              <div className={`flex items-center justify-center select-none rounded-full min-w-[16px] `}>
                  {ownerProjectToProjectData[card.owner_project] && ownerProjectToProjectData[card.owner_project].logo_path ? (
                    <div className="p-[4.5px] group-hover:bg-color-ui-hover bg-color-bg-medium rounded-full flex items-center justify-center">
                      <Image
                        src={`https://api.growthepie.com/v1/apps/logos/${ownerProjectToProjectData[card.owner_project].logo_path}`}
                        width={18} height={18}
                        className="select-none rounded-full"
                        alt={card.owner_project}
                        onDragStart={(e) => e.preventDefault()}
                        loading="eager"
                        priority={true}
                      />
                    </div>
                  ) : (
                    <div className={`flex items-center justify-center size-[26px] bg-color-ui-active !bg-transparent rounded-full`}>
                      <GTPIcon icon="gtp-project-monochrome" size="sm" className="text-color-ui-hover" />
                    </div>
                  )}
                </div>
                <span className={`text-left text-color-text-primary w-full ${isMobile ? "heading-small-xxs" : "heading-small-sm "}`}
                style={{
                  fontSize: finalShrink ? "8px" : "",
                  lineHeight: finalShrink ? "10px" : "",
                }}
                >
                  {metadata?.display_name || card.owner_project}
                </span>
                <div className="p-[5px] group-hover:bg-color-ui-hover bg-color-bg-medium rounded-full flex items-center justify-center">
                  <GTPIcon icon="gtp-chevronright-monochrome" className={`${isMobile ? finalShrink ? "!size-[7px]" : "!size-[11px]" : "!size-[11px]"}`} containerClassName={`${isMobile ? finalShrink ? "!size-[7px]" : "!size-[11px]" : "!size-[11px]"} flex items-center justify-center`} />
                </div>
                
              </div>
              <div className="justify-between items-center flex w-full gap-x-[2px] ">
                <div className="flex items-center gap-x-[5px]">
                  <GTPIcon icon={`gtp-${master?.app_metrics[card.metric]?.icon}` as GTPIconName} className={`${isMobile ? "!size-[10px]" : "!size-[16px]"}`} containerClassName="!size-[16px] flex items-center justify-center" />
                </div>
                <div className={`flex items-center ${isMobile ? "gap-x-[3px]" : "gap-x-[5px]"} overflow-hidden pr-[5px]`}>
                  {Object.keys(ownerProjectToProjectData[card.owner_project]?.active_on ?? {}).slice(0, showIcons).map((chain) => (
                    <div key={chain + "event-card-icon"} className="flex items-center">
                      <GTPIcon icon={`gtp:${AllChainsByKeys[chain].urlKey}-logo-monochrome` as GTPIconName} className={` ${isMobile ? "!size-[10px]" : "!size[16px]"}`} containerClassName={` flex items-center justify-center ${isMobile ? "!size-[10px]" : "!size-[16px]"}`} 
                      style={{
                        color: AllChainsByKeys[chain].colors[theme ?? "dark"][0],
                      }}
                      />
                      
                    </div>
                  ))}
                  {Object.keys(ownerProjectToProjectData[card.owner_project]?.active_on ?? {}).length > showIcons && (
                    <div className={`items-center justify-center bg-color-bg-medium rounded-full px-[3px] py-[3px] text-xxxs group-hover:bg-color-ui-hover ${finalShrink ? "hidden" : "flex"}`}
                    style={{
                      fontSize: isMobile ? "7px" : "8px",
                    }}
                    >
                      +{Object.keys(ownerProjectToProjectData[card.owner_project]?.active_on ?? {}).length - showIcons} More
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
        </div>
      </HorizontalScrollContainer>
    </div>
  );
};
const LandingEventsChartContent = ({ eventData, onInteract }: { eventData: ResolvedEventExample; onInteract: () => void }) => {
  const { metrics } = useMaster();
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
  const [isWrapping, setIsWrapping] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
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
  const { data: activeSourceData } = useSWR(activeDataSource?.url ?? null);

  const selectedSeries = useMemo(() => {
    if (activeOption?.series?.length) {
      return activeOption.series;
    }

    if (eventData.athMeta && activeSourceData) {
      return buildAthSeriesFromSource(activeSourceData, eventData.athMeta);
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
  }, [activeOption?.series, activeDataSource, activeSourceData, eventData.athMeta, eventData.series]);

  const athXAxisLines = useMemo(() => {
    if (!eventData.athMeta) return [];
    return buildAthXAxisLines(selectedSeries, eventData.athMeta);
  }, [eventData.athMeta, selectedSeries]);

  const activeXAxisLines = useMemo(() => {
    const baseLines = activeOption?.xAxisLines ?? eventData.xAxisLines ?? [];
    // Disable ATH marker line for now.
    // if (!eventData.athMeta || athXAxisLines.length === 0) return baseLines;
    // return [...baseLines, ...athXAxisLines];
    return baseLines;
  }, [activeOption?.xAxisLines, eventData.xAxisLines]);

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

  const selectedTypeTokens = useMemo(() => {
    if (!activeSourceData) return [] as string[];

    const typesPath = eventData.athMeta
      ? ATH_TYPES_PATH
      : resolveTypesPathFromValuesPath(activeDataSource?.pathToData);
    if (!typesPath) return [] as string[];

    const rawTypes = getNestedValue(activeSourceData, typesPath);
    if (!Array.isArray(rawTypes)) return [] as string[];

    const normalizedTypes = rawTypes.map(toTypeToken);
    let selectedIndexes: number[] = [];

    if (eventData.athMeta) {
      const values = getNestedValue(activeSourceData, ATH_VALUES_PATH);
      const { yIndex } = resolveAthIndices(rawTypes, values);
      if (yIndex !== null) {
        selectedIndexes = [yIndex];
      }
    } else if (activeDataSource?.series?.length) {
      selectedIndexes = activeDataSource.series.map((seriesMeta) => seriesMeta.yIndex);
    } else if (activeDataSource?.dynamicSeries) {
      const yStartIndex = activeDataSource.dynamicSeries.ystartIndex ?? 1;
      selectedIndexes = normalizedTypes.map((_, index) => index).filter((index) => index >= yStartIndex);
    } else {
      const xIndex = activeDataSource?.xIndex ?? 0;
      selectedIndexes = normalizedTypes.map((_, index) => index).filter((index) => index !== xIndex);
    }

    return selectedIndexes
      .map((index) => normalizedTypes[index])
      .filter((token): token is string => Boolean(token));
  }, [activeDataSource, activeSourceData, eventData.athMeta]);

  const resolvedValueFormat = (() => {
    const detectedUnit = selectedTypeTokens.some((token) => matchesUnitToken(token, "usd"))
      ? "usd"
      : selectedTypeTokens.some((token) => matchesUnitToken(token, "eth"))
        ? "eth"
        : null;

    const athMetricInfo = eventData.athMeta?.metricApiKey
      ? metrics?.[eventData.athMeta.metricApiKey]
      : undefined;
    if (athMetricInfo?.units) {
      const unitCandidates = [detectedUnit, "value", "usd", "eth"]
        .filter((candidate): candidate is string => typeof candidate === "string")
        .filter((candidate, index, arr) => arr.indexOf(candidate) === index);

      for (const unitKey of unitCandidates) {
        const unit = athMetricInfo.units[unitKey];
        if (!unit) continue;
        return {
          prefix: unit.prefix ?? undefined,
          suffix: unit.suffix ?? undefined,
          decimals: unit.decimals_tooltip ?? unit.decimals,
        };
      }
    }

    if (detectedUnit === "usd") {
      return { prefix: "$", suffix: undefined, decimals: 2 };
    }
    if (detectedUnit === "eth") {
      return { prefix: undefined, suffix: " ETH", decimals: 4 };
    }
    return undefined;
  })();

  
  return (
    <div className="relative flex-1 min-w-[300px] h-[442px] overflow-hidden xs:mt-[0px] mt-[30px] " onMouseEnter={onInteract} >
      <GTPCardLayout className="h-[442px]" mobileBreakpoint={0}
       topBar={
        showOptions ? (
          <GTPButtonContainer style={{ borderRadius: isWrapping ? "15px" : "inherit" }}>
              <GTPButtonRow wrap onWrapChange={setIsWrapping} className={`${isWrapping ? "justify-center items-center" : ""}`} style={{ borderRadius: isWrapping ? "15px" : "inherit" }}>
                {options.map((option) => {
                  const isActive = option.id === activeOptionId;

                  return (
                    <GTPButton
                      key={option.id}
                      label={option.label}
                      innerStyle={{ width: "100%" }}  
                      size={"sm"}
                      className={`${isWrapping ? "w-full justify-center md:w-auto md:justify-normal" : ""}`}
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
                      setActiveOptionId(resolvedDefaultOptionId);
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
       bottomBar={
        <GTPButtonContainer className="flex items-center justify-center">
          <GTPButtonRow>
            <Link href={eventData.link} className="flex w-full items-center justify-end">
              <GTPButton
                label="See More"
                variant="primary"
                size="sm"
                clickHandler={() => {
                  setActiveOptionId(resolvedDefaultOptionId);
                  setSelectedRange(null);
                }}
                rightIcon={"gtp-chevronright-monochrome" as GTPIconName}
                rightIconClassname="!w-[10px] !h-[10px]"
                rightIconContainerClassName="!w-[16px] !h-[16px]"
               />
            </Link>
          </GTPButtonRow>

        </GTPButtonContainer>
       }
      >
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 min-h-0 w-full pt-[15px] pb-[30px]  -overflow-hidden">
            <GTPChart
              series={activeSeries}
              prefix={resolvedValueFormat?.prefix}
              suffix={resolvedValueFormat?.suffix}
              decimals={resolvedValueFormat?.decimals}
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
          {legendItems.length > 1 && (
            <div className="h-[30px] w-full relative bottom-[26px] flex items-center justify-center gap-[5px]">
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
                  animateRightIcon
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
  const { AllChainsByKeys } = useMaster();
  const [selectedEvent, setSelectedEvent] = useState<EventId>(FEATURED_EVENT_IDS_MAX[0]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const hasInteractedRef = useRef(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolvedEventsById = useMemo(() => {
    const entries = (Object.entries(EVENTS_BY_ID) as [EventId, EventExample][]).map(
      ([id, event]) => [id, resolveEventExample(event, AllChainsByKeys)],
    );
    return Object.fromEntries(entries) as Record<EventId, ResolvedEventExample>;
  }, [AllChainsByKeys]);

  const selectedEventData = resolvedEventsById[selectedEvent];

  const handleInteract = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      setHasInteracted(true);
    }
  };

  const handleMouseLeave = () => {
    if (!hasInteractedRef.current) return;
    resetTimerRef.current = setTimeout(() => {
      hasInteractedRef.current = false;
      setHasInteracted(false);
      resetTimerRef.current = null;
    }, 3000);
  };

  const handleMouseEnter = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

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
      <div className="flex flex-col gap-y-[15px] w-full pt-[60px] pb-[30px] h-full min-h-0 overflow-hidden">
          {/*Heading */}
        <div className="flex items-center gap-x-[8px]">
          <GTPIcon icon="gtp-ethereumlogo" className="!size-[24px]" containerClassName="!size-[24px]" />
          <Heading className="heading-large-lg">Trending Topics in the Ecosystem</Heading>

        </div>
        <div className="flex flex-wrap items-stretch gap-[15px] flex-1 min-h-0 overflow-y-auto" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <SideEventsContainer
            selectedEvent={selectedEvent}
            hasInteracted={hasInteracted}
            eventsById={resolvedEventsById}
            setSelectedEvent={(event) => {
              handleInteract();
              setSelectedEvent(event);
            }}
          />
          {(selectedEventData.bodyType ?? "chart") === "chart" ? (
            <LandingEventsChartContent key={selectedEvent} eventData={selectedEventData} onInteract={handleInteract} />
          ) : (
            <LandingEventsCardContent key={selectedEvent} eventData={selectedEventData} />
          )}
        </div>
      </div>
    </ProjectsMetadataProvider>
  );
}
