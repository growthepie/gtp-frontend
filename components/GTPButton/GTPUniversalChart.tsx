"use client";

import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { EChartsOption } from "echarts";
import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { iconNames } from "@/icons/gtp-icon-names";
import { useMaster } from "@/contexts/MasterContext";
import { useMetricChartControls } from "@/components/metric/MetricChartControlsContext";
import { useMetricData } from "@/components/metric/MetricDataContext";
import { daMetricItems, metricItems } from "@/lib/metrics";
import ShareDropdownContent from "../layout/FloatingBar/ShareDropdownContent";
import ChainMetricTableRow from "../layout/ChainMetricTableRow";
import { ChartWatermarkWithMetricName } from "../layout/ChartWatermark";
import { GTPIcon } from "../layout/GTPIcon";
import { getGTPTooltipContainerClass, getViewportAwareTooltipLocalPosition } from "../tooltip/tooltipShared";
import { GTPButton, GTPButtonSize } from "./GTPButton";
import GTPButtonDropdown from "./GTPButtonDropdown";
import GTPTabBar from "./GTPTabBar";
import GTPTabButtonSet, { GTPTabButtonSetItem } from "./GTPTabButtonSet";
import { downloadElementAsImage } from "./chartSnapshotHelpers";

const DIVIDER_WIDTH = 18;
const DEFAULT_SPLIT_RATIO = 506 / (506 + 650);
const BOTTOM_TAB_OVERLAY_HEIGHT = 38;
const CHART_TO_BOTTOM_TAB_GAP = 15;
const TABLE_CHAIN_COLUMN_WIDTH = 174;
const TABLE_SIDE_SPACER_WIDTH = 8;
const TABLE_ABSOLUTE_COLUMN_WIDTH = 76;
const TABLE_CHANGE_COLUMN_WIDTH = 66;
const TABLE_CHECK_COLUMN_WIDTH = 22;
const TABLE_GRID_GAP = 6;
const TABLE_GRID_SIDE_PADDING = 10;
const TABLE_CHAIN_MIN_WIDTH_NO_TRUNCATE = 158;
const TABLE_TOP_FADE_HEIGHT = 36;
const TABLE_BOTTOM_FADE_HEIGHT = 54;
const TABLE_BOTTOM_SCROLL_PADDING = 56;
const TABLE_BOTTOM_SCROLL_PADDING_MOBILE = 8;
const MOBILE_LAYOUT_BREAKPOINT = 768;
const UNIVERSAL_CHART_TOOLTIP_CONTAINER_CLASS = getGTPTooltipContainerClass(
  "fit",
  "mt-3 mr-3 mb-3 min-w-60 md:min-w-60 max-w-[min(92vw,420px)] gap-y-[2px] py-[10px] pr-[12px] bg-color-bg-default/80",
);
const UNIVERSAL_CHART_WATERMARK_CLASS =
  "h-auto w-[145px] text-forest-300 opacity-40 mix-blend-darken dark:text-[#EAECEB] dark:mix-blend-lighten";

const DEFAULT_TOP_LEFT_ITEMS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
] satisfies GTPTabButtonSetItem[];

const DAILY_TOP_RIGHT_ITEMS = [
  { id: "1h", label: "1h" },
  { id: "1d", label: "1 day" },
  { id: "7d", label: "7 days" },
  { id: "90d", label: "90 days" },
  { id: "180d", label: "180 days" },
  { id: "1y", label: "1 year" },
  { id: "max", label: "Max" },
] satisfies GTPTabButtonSetItem[];

const WEEKLY_TOP_RIGHT_ITEMS = [
  { id: "3m", label: "3 months" },
  { id: "6m", label: "6 months" },
  { id: "1y", label: "1 year" },
  { id: "max", label: "Max" },
] satisfies GTPTabButtonSetItem[];

const MONTHLY_TOP_RIGHT_ITEMS = [
  { id: "6m", label: "6 months" },
  { id: "1y", label: "1 year" },
  { id: "max", label: "Max" },
] satisfies GTPTabButtonSetItem[];

const CONTEXT_TOP_RIGHT_KEYS_BY_AGGREGATION: Record<AggregationMode, string[]> = {
  daily: ["90d", "180d", "365d", "max"],
  weekly: ["12w", "24w", "52w", "maxW"],
  monthly: ["6m", "12m", "maxM"],
};

const DEFAULT_BOTTOM_RIGHT_ITEMS = [
  { id: "absolute", label: "Absolute" },
  { id: "percentage", label: "Percentage" },
  { id: "stacked", label: "Stacked" },
] satisfies GTPTabButtonSetItem[];

const DEFAULT_TOP_LEFT_SELECTED_ID = "daily";
const DEFAULT_TOP_RIGHT_SELECTED_ID = "max";
const DEFAULT_BOTTOM_RIGHT_SELECTED_ID = "absolute";

interface UniversalChartTableRow {
  chain: string;
  label: string;
  icon: GTPIconName;
  value: number;
  change1d: number;
  change7d: number;
  change28d: number;
  change30d: number;
  change180d: number;
  change365d: number;
  accentColor: string;
  series: [number, number][];
}

type TableSortKey = "absolute" | "change1" | "change2" | "change3";
type TableSortDirection = "asc" | "desc";

type ChartSeriesPoint = [number, number | null];
type ChartSeriesEntry = {
  row: UniversalChartTableRow;
  data: ChartSeriesPoint[];
};


const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getTableGridRequiredWidth = (changeColumns: number, chainMinWidth: number) => {
  const totalColumns = 1 + 1 + 1 + changeColumns + 1;
  const totalGaps = totalColumns - 1;

  return (
    chainMinWidth +
    TABLE_SIDE_SPACER_WIDTH +
    TABLE_ABSOLUTE_COLUMN_WIDTH +
    TABLE_CHANGE_COLUMN_WIDTH * changeColumns +
    TABLE_CHECK_COLUMN_WIDTH +
    totalGaps * TABLE_GRID_GAP
  );
};

const getMinPaneWidth = (availableWidth: number) => {
  if (availableWidth < 520) {
    return 120;
  }

  if (availableWidth < 840) {
    return 180;
  }

  return 240;
};

const getCssVarAsRgb = (name: string, fallback: string) => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!value) {
    return fallback;
  }

  const parts = value.split(" ").filter(Boolean);
  return `rgb(${parts.join(", ")})`;
};

const withOpacity = (color: string, opacity: number) => {
  if (!color.startsWith("rgb(")) {
    return color;
  }

  return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
};

const withHexOpacity = (color: string, opacity: number) => {
  if (!color.startsWith("#") || (color.length !== 7 && color.length !== 9)) {
    return color;
  }

  if (color.length === 9) {
    return color;
  }

  const alpha = Math.round(clamp(opacity, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0");

  return `${color}${alpha}`;
};

const formatCompactCurrency = (value: number) =>
  `$${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 100_000_000_000 ? 0 : 1,
  }).format(value)}`;
const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: Math.abs(value) >= 100_000_000_000 ? 0 : 1,
  }).format(value);
const formatCompactEth = (value: number) => `${formatCompactNumber(value)} ETH`;

const formatPercentValue = (value: number) => `${value.toFixed(1)}%`;
const formatSignedPercent = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
type TailwindTypographyStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: string;
  fontFeatureSettings?: string;
};

const readTailwindTypographyStyle = (
  className: string,
  fallback: TailwindTypographyStyle,
): TailwindTypographyStyle => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return fallback;
  }

  const probe = document.createElement("span");
  probe.className = className;
  probe.textContent = "0";
  probe.style.position = "fixed";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.left = "-9999px";
  probe.style.top = "-9999px";
  document.body.appendChild(probe);

  const computed = window.getComputedStyle(probe);
  const parsedFontSize = Number.parseFloat(computed.fontSize);
  const parsedFontWeight = Number.parseInt(computed.fontWeight, 10);
  const parsedLineHeight = Number.parseFloat(computed.lineHeight);
  const parsedFontFeatureSettings = computed.fontFeatureSettings?.trim();

  const result = {
    fontFamily: computed.fontFamily || fallback.fontFamily,
    fontSize: Number.isFinite(parsedFontSize) ? parsedFontSize : fallback.fontSize,
    fontWeight: Number.isFinite(parsedFontWeight) ? parsedFontWeight : fallback.fontWeight,
    lineHeight: Number.isFinite(parsedLineHeight) ? parsedLineHeight : fallback.lineHeight,
    letterSpacing:
      computed.letterSpacing && computed.letterSpacing !== "normal" ? computed.letterSpacing : fallback.letterSpacing,
    fontFeatureSettings:
      parsedFontFeatureSettings && parsedFontFeatureSettings !== "normal"
        ? parsedFontFeatureSettings
        : fallback.fontFeatureSettings,
  } satisfies TailwindTypographyStyle;

  probe.remove();
  return result;
};

const formatTableNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: Math.abs(value) >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) >= 1_000_000 ? 1 : 2,
  }).format(value);
const TIMEFRAME_LOOKBACK_MS: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "3m": 90 * 24 * 60 * 60 * 1000,
  "12w": 84 * 24 * 60 * 60 * 1000,
  "6m": 180 * 24 * 60 * 60 * 1000,
  "24w": 168 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
  "180d": 180 * 24 * 60 * 60 * 1000,
  "1y": 365 * 24 * 60 * 60 * 1000,
  "365d": 365 * 24 * 60 * 60 * 1000,
  "52w": 364 * 24 * 60 * 60 * 1000,
  "12m": 365 * 24 * 60 * 60 * 1000,
};

type AggregationMode = "daily" | "weekly" | "monthly";
type MetricTimespanMap = Record<
  string,
  {
    label?: string;
    shortLabel?: string;
    xMin?: number;
    xMax?: number;
  }
>;

const getAggregationFromTabId = (tabId: string | undefined): AggregationMode => {
  if (tabId === "weekly") {
    return "weekly";
  }

  if (tabId === "monthly" || tabId === "quarterly") {
    return "monthly";
  }

  return "daily";
};

const getDefaultTopRightItemsForAggregation = (aggregationMode: AggregationMode) => {
  if (aggregationMode === "weekly") {
    return WEEKLY_TOP_RIGHT_ITEMS;
  }

  if (aggregationMode === "monthly") {
    return MONTHLY_TOP_RIGHT_ITEMS;
  }

  return DAILY_TOP_RIGHT_ITEMS;
};

const getContextTopRightItemsForAggregation = (
  aggregationMode: AggregationMode,
  timespans: MetricTimespanMap | undefined,
) =>
  CONTEXT_TOP_RIGHT_KEYS_BY_AGGREGATION[aggregationMode]
    .filter((id) => Boolean(timespans?.[id]))
    .map((id) => ({
      id,
      label: timespans?.[id]?.label ?? timespans?.[id]?.shortLabel ?? id,
    }));

const getContextTimespanCandidates = (
  aggregationMode: AggregationMode,
  timespans: MetricTimespanMap | undefined,
) =>
  CONTEXT_TOP_RIGHT_KEYS_BY_AGGREGATION[aggregationMode].filter((id) => Boolean(timespans?.[id]));

const mapContextTimespanForAggregation = ({
  nextAggregation,
  currentTimespan,
  timespans,
}: {
  nextAggregation: AggregationMode;
  currentTimespan: string | undefined;
  timespans: MetricTimespanMap | undefined;
}) => {
  const candidates = getContextTimespanCandidates(nextAggregation, timespans);
  const fallback = candidates[candidates.length - 1] ?? "";
  if (!currentTimespan) {
    return fallback;
  }

  if (nextAggregation === "daily") {
    if (["12w"].includes(currentTimespan) && candidates.includes("90d")) return "90d";
    if (["6m", "24w"].includes(currentTimespan) && candidates.includes("180d")) return "180d";
    if (["12m", "52w"].includes(currentTimespan) && candidates.includes("365d")) return "365d";
    if (["maxM", "maxW"].includes(currentTimespan) && candidates.includes("max")) return "max";
  } else if (nextAggregation === "weekly") {
    if (["90d"].includes(currentTimespan) && candidates.includes("12w")) return "12w";
    if (["180d", "6m"].includes(currentTimespan) && candidates.includes("24w")) return "24w";
    if (["365d", "12m"].includes(currentTimespan) && candidates.includes("52w")) return "52w";
    if (["max", "maxM"].includes(currentTimespan) && candidates.includes("maxW")) return "maxW";
  } else {
    if (["180d", "24w"].includes(currentTimespan) && candidates.includes("6m")) return "6m";
    if (["365d", "52w"].includes(currentTimespan) && candidates.includes("12m")) return "12m";
    if (["max", "maxW"].includes(currentTimespan) && candidates.includes("maxM")) return "maxM";
  }

  if (candidates.includes(currentTimespan)) {
    return currentTimespan;
  }

  if (timespans?.[currentTimespan]?.xMax !== undefined && candidates.length > 0) {
    const targetXMax = Number(timespans[currentTimespan].xMax);
    return candidates.reduce((closest, candidate) => {
      const candidateXMax = Number(timespans?.[candidate]?.xMax ?? 0);
      const closestXMax = Number(timespans?.[closest]?.xMax ?? 0);
      return Math.abs(candidateXMax - targetXMax) < Math.abs(closestXMax - targetXMax) ? candidate : closest;
    }, candidates[0]);
  }

  return fallback;
};

const getChangePercent = (changesBucket: Record<string, unknown> | undefined, valueIndex: number, keys: string[]) => {
  if (!changesBucket) {
    return 0;
  }

  for (const key of keys) {
    const entry = changesBucket[key];
    if (Array.isArray(entry)) {
      const rawValue = Number(entry[valueIndex] ?? entry[0] ?? 0);
      if (Number.isFinite(rawValue)) {
        return rawValue * 100;
      }
    } else if (typeof entry === "number" && Number.isFinite(entry)) {
      return entry * 100;
    }
  }

  return 0;
};

const downsampleSeries = (series: [number, number][], step: number) => {
  if (step <= 1 || series.length <= 1) {
    return series;
  }

  const sampled = series.filter((_, index) => index === 0 || index % step === 0);
  const lastPoint = series[series.length - 1];
  const lastSampledPoint = sampled[sampled.length - 1];
  if (!lastSampledPoint || lastSampledPoint[0] !== lastPoint[0]) {
    sampled.push(lastPoint);
  }

  return sampled;
};

const GTP_ICON_NAMES_SET = new Set<string>(iconNames);

const normalizeMetricIcon = (value: unknown): GTPIconName | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const rawIcon = value.trim();
  if (!rawIcon) {
    return undefined;
  }

  if (rawIcon.startsWith("gtp:")) {
    const iconKey = rawIcon.slice(4);
    return GTP_ICON_NAMES_SET.has(iconKey) ? (iconKey as GTPIconName) : undefined;
  }

  if (rawIcon.includes(":")) {
    return rawIcon as GTPIconName;
  }

  return GTP_ICON_NAMES_SET.has(rawIcon) ? (rawIcon as GTPIconName) : undefined;
};

const resolveTabSelection = (
  currentSelection: string | undefined,
  items: GTPTabButtonSetItem[],
  fallbackSelection?: string,
) => {
  const itemIds = new Set(items.map((item) => item.id));

  if (currentSelection && itemIds.has(currentSelection)) {
    return currentSelection;
  }

  if (fallbackSelection && itemIds.has(fallbackSelection)) {
    return fallbackSelection;
  }

  return items[0]?.id ?? "";
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const isFiniteTimespanRange = (range: MetricTimespanMap[string] | undefined) => {
  const xMin = Number(range?.xMin);
  const xMax = Number(range?.xMax);
  return Number.isFinite(xMin) && Number.isFinite(xMax) && xMax >= xMin;
};

export interface GTPUniversalChartTabSetConfig {
  items?: GTPTabButtonSetItem[];
  defaultSelectedId?: string;
  selectedId?: string;
  onChange?: (id: string, item: GTPTabButtonSetItem) => void;
}

export interface GTPUniversalChartTabSetsConfig {
  topLeft?: GTPUniversalChartTabSetConfig | null;
  topRight?: GTPUniversalChartTabSetConfig | null;
  bottomRight?: GTPUniversalChartTabSetConfig | null;
}

export default function GTPUniversalChart({
  className,
  tabSize = "sm",
  fullBleed = true,
  tabSets,
}: {
  className?: string;
  tabSize?: GTPButtonSize;
  fullBleed?: boolean;
  tabSets?: GTPUniversalChartTabSetsConfig;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const tablePaneRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const tableScrollbarTrackRef = useRef<HTMLDivElement | null>(null);
  const chartTooltipHostRef = useRef<HTMLDivElement | null>(null);
  const hasAutoSelectedContextChainsRef = useRef(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [tablePaneHeight, setTablePaneHeight] = useState(0);
  const [splitRatio, setSplitRatio] = useState(DEFAULT_SPLIT_RATIO);
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
  const [isDownloadingChartSnapshot, setIsDownloadingChartSnapshot] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [tableScrollbarDragging, setTableScrollbarDragging] = useState(false);
  const [tableScrollbarDragOffset, setTableScrollbarDragOffset] = useState(0);
  const [tableScrollTop, setTableScrollTop] = useState(0);
  const [tableScrollHeight, setTableScrollHeight] = useState(1);
  const [tableClientHeight, setTableClientHeight] = useState(1);
  const [tableScrollbarTrackHeight, setTableScrollbarTrackHeight] = useState(0);
  const tableScrollSyncRafRef = useRef<number | null>(null);
  const isMobileLayout = contentWidth > 0 && contentWidth < MOBILE_LAYOUT_BREAKPOINT;

  const topLeftConfig = tabSets?.topLeft;
  const topRightConfig = tabSets?.topRight;
  const bottomRightConfig = tabSets?.bottomRight;

  const topLeftItems = useMemo(
    () => (topLeftConfig === null ? [] : topLeftConfig?.items ?? DEFAULT_TOP_LEFT_ITEMS),
    [topLeftConfig],
  );
  const topRightItems = useMemo(
    () => (topRightConfig === null ? [] : topRightConfig?.items),
    [topRightConfig],
  );
  const bottomRightItems = useMemo(
    () => (bottomRightConfig === null ? [] : bottomRightConfig?.items ?? DEFAULT_BOTTOM_RIGHT_ITEMS),
    [bottomRightConfig],
  );

  const topLeftFallback = topLeftConfig?.defaultSelectedId ?? DEFAULT_TOP_LEFT_SELECTED_ID;
  const topRightFallback = topRightConfig?.defaultSelectedId ?? DEFAULT_TOP_RIGHT_SELECTED_ID;
  const bottomRightFallback = bottomRightConfig?.defaultSelectedId ?? DEFAULT_BOTTOM_RIGHT_SELECTED_ID;

  const [topLeftSelection, setTopLeftSelection] = useState(() =>
    resolveTabSelection(undefined, topLeftItems, topLeftFallback),
  );
  const [topRightSelection, setTopRightSelection] = useState(() =>
    resolveTabSelection(undefined, DAILY_TOP_RIGHT_ITEMS, topRightFallback),
  );
  const [bottomRightSelection, setBottomRightSelection] = useState(() =>
    resolveTabSelection(undefined, bottomRightItems, bottomRightFallback),
  );
  const [localSelectedChains, setLocalSelectedChains] = useState<string[]>([]);
  const [tableSort, setTableSort] = useState<{ key: TableSortKey; direction: TableSortDirection }>({
    key: "absolute",
    direction: "desc",
  });

  const syncTableScrollMetrics = useCallback(() => {
    const scrollElement = tableScrollRef.current;
    if (!scrollElement) {
      return;
    }

    const nextScrollTop = scrollElement.scrollTop;
    const nextScrollHeight = Math.max(scrollElement.scrollHeight, 1);
    const nextClientHeight = Math.max(scrollElement.clientHeight, 1);

    setTableScrollTop((current) => (Math.abs(current - nextScrollTop) < 0.5 ? current : nextScrollTop));
    setTableScrollHeight((current) => (current === nextScrollHeight ? current : nextScrollHeight));
    setTableClientHeight((current) => (current === nextClientHeight ? current : nextClientHeight));
  }, []);

  const scheduleTableScrollMetricsSync = useCallback(() => {
    if (tableScrollSyncRafRef.current !== null) {
      return;
    }

    tableScrollSyncRafRef.current = window.requestAnimationFrame(() => {
      tableScrollSyncRafRef.current = null;
      syncTableScrollMetrics();
    });
  }, [syncTableScrollMetrics]);


  const { AllChainsByKeys, AllDALayersByKeys, metrics, da_metrics } = useMaster();
  const {
    data: metricData,
    chainKeys: metricChainKeys,
    metric_id: metricId,
    timespans: metricTimespans,
    allChainsByKeys: metricAllChainsByKeys,
    type: metricContextType,
  } = useMetricData();
  const {
    selectedChains: contextSelectedChains,
    setSelectedChains: setContextSelectedChains,
    selectedTimeInterval: contextSelectedTimeInterval,
    setSelectedTimeInterval: setContextSelectedTimeInterval,
    selectedTimespan: contextSelectedTimespan,
    setSelectedTimespan: setContextSelectedTimespan,
    timeIntervalKey: contextTimeIntervalKey,
    selectedScale: contextSelectedScale,
    setSelectedScale: setContextSelectedScale,
  } = useMetricChartControls();
  const metricInfo =
    metricContextType === "data-availability" ? da_metrics?.[metricId] : metrics?.[metricId];
  const metricLabel = metricData?.metric_name ?? "Market Cap";
  const handleDownloadChartSnapshot = useCallback(async () => {
    if (isDownloadingChartSnapshot) {
      return;
    }

    const cardElement = cardRef.current;
    if (!cardElement || typeof window === "undefined") {
      return;
    }

    setIsDownloadingChartSnapshot(true);
    try {
      await downloadElementAsImage(cardElement, metricLabel);
    } finally {
      setIsDownloadingChartSnapshot(false);
    }
  }, [isDownloadingChartSnapshot, metricLabel]);
  const metricCatalogIcon =
    (metricContextType === "data-availability" ? daMetricItems : metricItems).find((item) => item.key === metricId)?.icon;
  const metricIcon =
    normalizeMetricIcon(metricInfo?.icon) ??
    normalizeMetricIcon(metricCatalogIcon) ??
    (metricContextType === "data-availability" ? "gtp-data-availability" : "gtp-metrics-marketcap");

  const isMetricContextActive = useMemo(
    () =>
      Boolean(metricData && metricChainKeys.length > 0 && Object.keys(metricData.chains ?? {}).length > 0),
    [metricData, metricChainKeys],
  );

  const selectedTopLeftId =
    topLeftConfig?.selectedId !== undefined
      ? resolveTabSelection(topLeftConfig.selectedId, topLeftItems, topLeftFallback)
      : resolveTabSelection(topLeftSelection, topLeftItems, topLeftFallback);
  const selectedBottomRightId =
    bottomRightConfig?.selectedId !== undefined
      ? resolveTabSelection(bottomRightConfig.selectedId, bottomRightItems, bottomRightFallback)
      : resolveTabSelection(bottomRightSelection, bottomRightItems, bottomRightFallback);

  const contextTopLeftId = useMemo(() => {
    if (contextSelectedTimeInterval === "weekly") {
      return topLeftItems.some((item) => item.id === "weekly") ? "weekly" : topLeftItems[0]?.id ?? "weekly";
    }

    if (contextSelectedTimeInterval === "monthly" || contextSelectedTimeInterval === "quarterly") {
      if (topLeftItems.some((item) => item.id === "monthly")) {
        return "monthly";
      }
      if (topLeftItems.some((item) => item.id === "quarterly")) {
        return "quarterly";
      }
      return topLeftItems[0]?.id ?? "monthly";
    }

    return topLeftItems.some((item) => item.id === "daily") ? "daily" : topLeftItems[0]?.id ?? "daily";
  }, [contextSelectedTimeInterval, topLeftItems]);

  const contextBottomRightId = useMemo(() => {
    if (["absolute", "percentage", "stacked"].includes(contextSelectedScale)) {
      return contextSelectedScale;
    }

    return DEFAULT_BOTTOM_RIGHT_SELECTED_ID;
  }, [contextSelectedScale]);

  const effectiveTopLeftSelectedId =
    isMetricContextActive && topLeftConfig?.selectedId === undefined
      ? resolveTabSelection(contextTopLeftId, topLeftItems, topLeftFallback)
      : selectedTopLeftId;
  const effectiveAggregation = getAggregationFromTabId(effectiveTopLeftSelectedId);
  const contextTopRightItems = useMemo(
    () => getContextTopRightItemsForAggregation(effectiveAggregation, metricTimespans as MetricTimespanMap | undefined),
    [effectiveAggregation, metricTimespans],
  );
  const usesContextTimeframeTabs = isMetricContextActive && topRightItems === undefined && topRightConfig !== null;
  const effectiveTopRightItems =
    topRightConfig === null
      ? []
      : topRightItems !== undefined
        ? topRightItems
        : usesContextTimeframeTabs
          ? contextTopRightItems
          : getDefaultTopRightItemsForAggregation(effectiveAggregation);
  const contextTopRightFallback = effectiveTopRightItems[effectiveTopRightItems.length - 1]?.id ?? topRightFallback;
  const selectedTopRightId =
    topRightConfig?.selectedId !== undefined
      ? resolveTabSelection(topRightConfig.selectedId, effectiveTopRightItems, topRightFallback)
      : usesContextTimeframeTabs
        ? resolveTabSelection(contextSelectedTimespan, effectiveTopRightItems, contextTopRightFallback)
        : resolveTabSelection(topRightSelection, effectiveTopRightItems, topRightFallback);

  useEffect(() => {
    if (!usesContextTimeframeTabs || topRightConfig?.selectedId !== undefined) {
      return;
    }

    if (selectedTopRightId && selectedTopRightId !== contextSelectedTimespan) {
      setContextSelectedTimespan(selectedTopRightId);
    }
  }, [
    contextSelectedTimespan,
    selectedTopRightId,
    setContextSelectedTimespan,
    topRightConfig?.selectedId,
    usesContextTimeframeTabs,
  ]);

  const effectiveBottomRightSelectedId =
    isMetricContextActive && bottomRightConfig?.selectedId === undefined
      ? resolveTabSelection(contextBottomRightId, bottomRightItems, bottomRightFallback)
      : selectedBottomRightId;

  const contextRows = useMemo<UniversalChartTableRow[]>(() => {
    if (!isMetricContextActive || !metricData) {
      return [];
    }

    const chainsByKey = metricAllChainsByKeys as Record<string, any>;
    const masterChainsByKey = { ...(AllChainsByKeys as Record<string, any>), ...(AllDALayersByKeys as Record<string, any>) };
    const intervalKey = contextTimeIntervalKey || "daily";
    const summaryKey = intervalKey === "weekly" ? "last_7d" : intervalKey === "monthly" ? "last_30d" : "last_1d";

    const rows = metricChainKeys
      .map((chainKey) => {
        const chainData = (metricData.chains as Record<string, any>)[chainKey];
        if (!chainData) {
          return null;
        }

        const intervalData = (chainData[intervalKey] as { types: string[]; data: number[][] } | undefined) ?? chainData.daily;
        if (!intervalData || !Array.isArray(intervalData.data) || intervalData.data.length === 0) {
          return null;
        }

        const valueTypes = intervalData.types ?? [];
        const usdValueIndex = valueTypes.indexOf("usd");
        const ethValueIndex = valueTypes.indexOf("eth");
        const valueIndex = usdValueIndex >= 0 ? usdValueIndex : ethValueIndex >= 0 ? ethValueIndex : Math.min(1, valueTypes.length - 1);

        const series = intervalData.data
          .filter((point) => point.length > valueIndex)
          .map((point) => [point[0], Number(point[valueIndex] ?? 0)] as [number, number]);

        const summary = chainData.summary?.[summaryKey];
        const summaryTypes: string[] = summary?.types ?? valueTypes;
        const summaryUsdIndex = summaryTypes.indexOf("usd");
        const summaryEthIndex = summaryTypes.indexOf("eth");
        const summaryValueIndex =
          summaryUsdIndex >= 0
            ? summaryUsdIndex
            : summaryEthIndex >= 0
              ? summaryEthIndex
              : Math.min(valueIndex, Math.max((summary?.data?.length ?? 1) - 1, 0));
        const value = Number(summary?.data?.[summaryValueIndex] ?? series[series.length - 1]?.[1] ?? 0);

        const changesBucket =
          chainData.changes?.[intervalKey] ??
          chainData.changes?.daily ??
          chainData.changes?.weekly ??
          chainData.changes?.monthly;
        const changeTypes: string[] = changesBucket?.types ?? [];
        const changeUsdIndex = changeTypes.indexOf("usd");
        const changeEthIndex = changeTypes.indexOf("eth");
        const changeValueIndex = changeUsdIndex >= 0 ? changeUsdIndex : changeEthIndex >= 0 ? changeEthIndex : 0;
        const change1d = getChangePercent(changesBucket, changeValueIndex, ["1d", "24h"]);
        const change7d = getChangePercent(changesBucket, changeValueIndex, ["7d", "1w"]);
        const change28d = getChangePercent(changesBucket, changeValueIndex, ["28d", "4w", "30d", "1m"]);
        const change30d = getChangePercent(changesBucket, changeValueIndex, ["30d", "1m", "4w", "28d"]);
        const change180d = getChangePercent(changesBucket, changeValueIndex, ["180d", "6m"]);
        const change365d = getChangePercent(changesBucket, changeValueIndex, ["365d", "1y"]);

        const chainMeta = chainsByKey?.[chainKey] ?? masterChainsByKey?.[chainKey];
        const urlKey = chainMeta?.urlKey ?? chainMeta?.url_key ?? chainKey.replace(/_/g, "-");
        const icon = `${urlKey}-logo-monochrome` as GTPIconName;

        return {
          chain: chainKey,
          label: chainMeta?.label ?? chainKey,
          icon,
          value,
          change1d,
          change7d,
          change28d,
          change30d,
          change180d,
          change365d,
          accentColor: chainMeta?.colors?.dark?.[0] ?? "#5A6462",
          series,
        } satisfies UniversalChartTableRow;
      })
      .filter(Boolean) as UniversalChartTableRow[];

    return rows.sort((a, b) => b.value - a.value);
  }, [AllChainsByKeys, AllDALayersByKeys, contextTimeIntervalKey, isMetricContextActive, metricAllChainsByKeys, metricChainKeys, metricData]);

  const sourceRows = contextRows;
  const displayRows = useMemo(() => {
    if (isMetricContextActive) {
      return sourceRows;
    }

    if (effectiveAggregation === "weekly") {
      return sourceRows.map((row) => {
        const sampledSeries = downsampleSeries(row.series, 7);
        return {
          ...row,
          series: sampledSeries,
          value: sampledSeries[sampledSeries.length - 1]?.[1] ?? row.value,
        };
      });
    }

    if (effectiveAggregation === "monthly") {
      return sourceRows.map((row) => {
        const sampledSeries = downsampleSeries(row.series, 30);
        return {
          ...row,
          series: sampledSeries,
          value: sampledSeries[sampledSeries.length - 1]?.[1] ?? row.value,
        };
      });
    }

    return sourceRows;
  }, [effectiveAggregation, isMetricContextActive, sourceRows]);

  useEffect(() => {
    hasAutoSelectedContextChainsRef.current = false;
  }, [metricId]);

  useEffect(() => {
    if (!isMetricContextActive || hasAutoSelectedContextChainsRef.current || displayRows.length === 0) {
      return;
    }

    if (contextSelectedChains.length === 0) {
      setContextSelectedChains(displayRows.map((row) => row.chain));
    }

    hasAutoSelectedContextChainsRef.current = true;
  }, [contextSelectedChains.length, displayRows, isMetricContextActive, setContextSelectedChains]);

  const selectedChains =
    isMetricContextActive ? contextSelectedChains : localSelectedChains;

  const selectedChainSet = useMemo(() => new Set(selectedChains), [selectedChains]);
  const selectedChainCount = useMemo(
    () => displayRows.filter((row) => selectedChainSet.has(row.chain)).length,
    [displayRows, selectedChainSet],
  );
  const isPercentageMode = effectiveBottomRightSelectedId === "percentage";
  const isStackedMode = effectiveBottomRightSelectedId === "stacked";
  const allChainsSelected = displayRows.length > 0 && selectedChainCount === displayRows.length;

  const activeChainRows = useMemo(
    () => displayRows.filter((row) => selectedChainSet.has(row.chain)),
    [displayRows, selectedChainSet],
  );

  const chartSeriesData = useMemo<ChartSeriesEntry[]>(() => {
    const lookbackMs = TIMEFRAME_LOOKBACK_MS[selectedTopRightId];
    const selectedTimespanRange = (metricTimespans as MetricTimespanMap | undefined)?.[selectedTopRightId];
    const hasExplicitTimespanRange = isMetricContextActive && isFiniteTimespanRange(selectedTimespanRange);
    const filteredSeries = activeChainRows.map((row) => {
      let data = row.series;
      if (hasExplicitTimespanRange && row.series.length > 0) {
        const rangeFilteredData = row.series.filter(
          ([timestamp]) =>
            timestamp >= Number(selectedTimespanRange?.xMin) && timestamp <= Number(selectedTimespanRange?.xMax),
        );
        if (rangeFilteredData.length > 0) {
          data = rangeFilteredData;
        } else if (lookbackMs) {
          const latestTimestamp = row.series[row.series.length - 1][0];
          const minTimestamp = latestTimestamp - lookbackMs;
          const lookbackFilteredData = row.series.filter(([timestamp]) => timestamp >= minTimestamp);
          data = lookbackFilteredData.length > 0 ? lookbackFilteredData : row.series;
        }
      } else if (lookbackMs && row.series.length > 0) {
        const latestTimestamp = row.series[row.series.length - 1][0];
        const minTimestamp = latestTimestamp - lookbackMs;
        const lookbackFilteredData = row.series.filter(([timestamp]) => timestamp >= minTimestamp);
        data = lookbackFilteredData.length > 0 ? lookbackFilteredData : row.series;
      }

      return {
        row,
        data,
      };
    });

    if (filteredSeries.length === 0) {
      return [];
    }

    const sharedTimestamps = Array.from(
      new Set(filteredSeries.flatMap((entry) => entry.data.map(([timestamp]) => timestamp))),
    ).sort((a, b) => a - b);

    const baseSeries = filteredSeries.map((entry) => {
      const valueByTimestamp = new Map(entry.data);
      const alignedData = sharedTimestamps.map(
        (timestamp) => {
          const rawValue = valueByTimestamp.get(timestamp);
          if (rawValue === undefined || rawValue === null) {
            return [timestamp, null] as ChartSeriesPoint;
          }
          const numericValue = Number(rawValue);
          return [timestamp, Number.isFinite(numericValue) ? numericValue : null] as ChartSeriesPoint;
        },
      );

      return {
        row: entry.row,
        data: alignedData,
      };
    });

    if (!isPercentageMode) {
      return baseSeries;
    }

    return baseSeries.map((entry) => ({
      row: entry.row,
      data: entry.data.map(([timestamp], index) => {
        const sourceValue = entry.data[index]?.[1];
        if (sourceValue === null || sourceValue === undefined || !Number.isFinite(sourceValue)) {
          return [timestamp, null] as ChartSeriesPoint;
        }
        const total = baseSeries.reduce((sum, item) => {
          const pointValue = item.data[index]?.[1];
          return typeof pointValue === "number" && Number.isFinite(pointValue) ? sum + pointValue : sum;
        }, 0);
        const value = total > 0 ? (sourceValue / total) * 100 : null;
        return [timestamp, value] as ChartSeriesPoint;
      }),
    }));
  }, [activeChainRows, isMetricContextActive, isPercentageMode, metricTimespans, selectedTopRightId]);

  const tableColumnLabels = useMemo(() => {
    if (effectiveAggregation === "weekly") {
      return {
        absolute: "Last 7 days",
        change1: "1 week",
        change2: "4 weeks",
        change3: "1 year",
      };
    }

    if (effectiveAggregation === "monthly") {
      return {
        absolute: "Last 30d",
        change1: "1 month",
        change2: "6 months",
        change3: "1 year",
      };
    }

    return {
      absolute: "Yesterday",
      change1: "24 hours",
      change2: "30 days",
      change3: "1 year",
    };
  }, [effectiveAggregation]);

  const tableRows = useMemo(() => {
    const maxValue = Math.max(...displayRows.map((row) => row.value), 1);
    const mappedRows = displayRows.map((row) => {
      const change1 = effectiveAggregation === "weekly" ? row.change7d : effectiveAggregation === "monthly" ? row.change30d : row.change1d;
      const change2 = effectiveAggregation === "weekly" ? row.change28d : effectiveAggregation === "monthly" ? row.change180d : row.change30d;
      const change3 = row.change365d;

      return {
        ...row,
        selected: selectedChainSet.has(row.chain),
        absoluteLabel: formatTableNumber(row.value),
        change1Label: formatSignedPercent(change1),
        change2Label: formatSignedPercent(change2),
        change3Label: formatSignedPercent(change3),
        change1,
        change2,
        change3,
        barWidth: `${Math.max((row.value / maxValue) * 100, 8)}%`,
      };
    });

    const directionMultiplier = tableSort.direction === "asc" ? 1 : -1;
    return [...mappedRows].sort((a, b) => {
      const aValue =
        tableSort.key === "absolute"
          ? a.value
          : tableSort.key === "change1"
            ? a.change1
            : tableSort.key === "change2"
              ? a.change2
              : a.change3;
      const bValue =
        tableSort.key === "absolute"
          ? b.value
          : tableSort.key === "change1"
            ? b.change1
            : tableSort.key === "change2"
              ? b.change2
              : b.change3;

      if (aValue !== bValue) {
        return (aValue - bValue) * directionMultiplier;
      }

      if (a.value !== b.value) {
        return b.value - a.value;
      }

      return a.label.localeCompare(b.label);
    });
  }, [displayRows, effectiveAggregation, selectedChainSet, tableSort.direction, tableSort.key]);

  const selectedTableRows = useMemo(() => tableRows.filter((row) => row.selected), [tableRows]);
  const deselectedTableRows = useMemo(() => tableRows.filter((row) => !row.selected), [tableRows]);
  const hasSelectionDivider = selectedTableRows.length > 0 && deselectedTableRows.length > 0;
  const metricValueUnitKey = useMemo(() => {
    if (!isMetricContextActive || !metricData || metricChainKeys.length === 0) {
      return "usd";
    }

    const intervalKey = contextTimeIntervalKey || "daily";
    for (const chainKey of metricChainKeys) {
      const chainData = (metricData.chains as Record<string, any>)?.[chainKey];
      const intervalData = (chainData?.[intervalKey] as { types?: string[] } | undefined) ?? chainData?.daily;
      const types = intervalData?.types ?? [];
      if (types.includes("usd")) {
        return "usd";
      }
      if (types.includes("eth")) {
        return "eth";
      }
    }

    const availableUnits = metricInfo?.units ? Object.keys(metricInfo.units) : [];
    if (availableUnits.includes("usd")) {
      return "usd";
    }
    if (availableUnits.includes("eth")) {
      return "eth";
    }
    return availableUnits[0] ?? "value";
  }, [contextTimeIntervalKey, isMetricContextActive, metricChainKeys, metricData, metricInfo]);
  const formatChartMetricValue = useCallback(
    (value: number, { compact = false }: { compact?: boolean } = {}) => {
      if (isPercentageMode) {
        return formatPercentValue(value);
      }

      const unitConfig = metricInfo?.units?.[metricValueUnitKey];
      if (unitConfig) {
        const absValue = Math.abs(value);
        const useCompact = compact || absValue >= 1_000_000;
        const decimals = useCompact ? Math.min(unitConfig.decimals ?? 1, 1) : (unitConfig.decimals_tooltip ?? unitConfig.decimals ?? 2);
        const numberFormatter = new Intl.NumberFormat("en-US", {
          notation: useCompact ? "compact" : "standard",
          minimumFractionDigits: useCompact ? 0 : decimals,
          maximumFractionDigits: decimals,
        });
        return `${unitConfig.prefix ?? ""}${numberFormatter.format(value)}${unitConfig.suffix ?? ""}`;
      }

      if (metricValueUnitKey === "eth") {
        return formatCompactEth(value);
      }
      if (metricValueUnitKey === "usd") {
        return formatCompactCurrency(value);
      }
      return formatCompactNumber(value);
    },
    [isPercentageMode, metricInfo, metricValueUnitKey],
  );
  const chartTooltipPosition = useCallback(
    (
      point: number | number[],
      _params: unknown,
      _el: unknown,
      _rect: unknown,
      size?: { contentSize?: number[] },
    ) => {
      const pointX = Array.isArray(point) ? Number(point[0] ?? 0) : Number(point ?? 0);
      const pointY = Array.isArray(point) ? Number(point[1] ?? 0) : 0;
      const contentWidth = Array.isArray(size?.contentSize) ? Number(size.contentSize[0] ?? 0) : 0;
      const contentHeight = Array.isArray(size?.contentSize) ? Number(size.contentSize[1] ?? 0) : 0;
      return getViewportAwareTooltipLocalPosition({
        anchorLocalX: pointX,
        anchorLocalY: pointY,
        contentWidth,
        contentHeight,
        hostRect: chartTooltipHostRef.current?.getBoundingClientRect(),
      });
    },
    [],
  );

  const textXxsTypography = useMemo(
    () =>
      readTailwindTypographyStyle("text-xs", {
        fontFamily: "var(--font-raleway), sans-serif",
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 16,
        letterSpacing: "normal",
      }),
    [],
  );
  const numbersXxsTypography = useMemo(
    () =>
      readTailwindTypographyStyle("numbers-xxs", {
        fontFamily: "var(--font-fira-sans), sans-serif",
        fontSize: 10,
        fontWeight: 500,
        lineHeight: 10,
        letterSpacing: "0.05em",
        fontFeatureSettings: '"tnum" on, "lnum" on',
      }),
    [],
  );

  const chartOption = useMemo<EChartsOption>(() => {
    const textPrimary = getCssVarAsRgb("--text-primary", "rgb(205, 216, 211)");
    const textSecondary = getCssVarAsRgb("--text-secondary", "rgb(121, 139, 137)");
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const splitCount = clamp(Math.round((contentHeight || 512) / 88), 3, 7);
    const shouldStackSeries = isStackedMode || isPercentageMode;
    const sortedSeries = isPercentageMode
      ? [...chartSeriesData].sort((a, b) => {
          const aLast = [...a.data].reverse().find((point) => typeof point[1] === "number")?.[1] ?? 0;
          const bLast = [...b.data].reverse().find((point) => typeof point[1] === "number")?.[1] ?? 0;
          return aLast - bLast;
        })
      : chartSeriesData;
    const allValues = chartSeriesData.flatMap((series) =>
      series.data
        .map((point) => point[1])
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value)),
    );
    const maxSeriesValue =
      shouldStackSeries && chartSeriesData.length > 0
        ? chartSeriesData[0].data.reduce((maxValue, _, index) => {
          const stackedValue = chartSeriesData.reduce((sum, series) => {
              const pointValue = series.data[index]?.[1];
              return typeof pointValue === "number" && Number.isFinite(pointValue) ? sum + pointValue : sum;
            }, 0);
            return Math.max(maxValue, stackedValue);
          }, 0)
        : allValues.length > 0
          ? Math.max(...allValues)
          : 0;
    const rawStep = Math.max(maxSeriesValue, 1) / splitCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
    const normalizedStep = rawStep / Math.max(magnitude, 1);
    const niceStepBase = normalizedStep > 5 ? 10 : normalizedStep > 2 ? 5 : normalizedStep > 1 ? 2 : 1;
    const absoluteStep = niceStepBase * Math.max(magnitude, 1);
    const yAxisStep = isPercentageMode ? 25 : absoluteStep;
    const yAxisMin = 0;
    const yAxisMax = isPercentageMode
      ? 100
      : Math.max(yAxisStep, Math.ceil((Math.max(maxSeriesValue, 1) * 1.06) / yAxisStep) * yAxisStep);
    const allTimestamps = chartSeriesData.flatMap((series) =>
      series.data
        .map((point) => Number(point[0]))
        .filter((timestamp): timestamp is number => Number.isFinite(timestamp)),
    );
    const minTimestamp = allTimestamps.length > 0 ? Math.min(...allTimestamps) : undefined;
    const maxTimestamp = allTimestamps.length > 0 ? Math.max(...allTimestamps) : undefined;
    const xAxisRangeMs =
      minTimestamp !== undefined && maxTimestamp !== undefined ? maxTimestamp - minTimestamp : undefined;
    const isLongerThan7Days = typeof xAxisRangeMs === "number" && xAxisRangeMs > sevenDaysMs;

    const formatXAxisTick = (value: number | string) => {
      const numValue = typeof value === "string" ? Number(value) : value;
      if (!Number.isFinite(numValue)) {
        return String(value);
      }

      const date = new Date(numValue);
      const isJanFirst = date.getUTCMonth() === 0 && date.getUTCDate() === 1;

      if (isLongerThan7Days && isJanFirst) {
        const yearLabel = new Intl.DateTimeFormat("en-GB", {
          year: "numeric",
          timeZone: "UTC",
        }).format(numValue);
        return `{yearBold|${yearLabel}}`;
      }

      return new Intl.DateTimeFormat("en-GB", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(numValue);
    };

    return {
      animation: false,
      backgroundColor: "transparent",
      graphic:
        chartSeriesData.length === 0
          ? [
              {
                type: "text",
                left: "center",
                top: "middle",
                silent: true,
                style: {
                  text: "Select chains in the table to plot values",
                  fill: textSecondary,
                  font: "12px var(--font-raleway), sans-serif",
                },
              },
            ]
          : undefined,
      grid: {
        left: 52,
        right: 0,
        top: 4,
        bottom: 22,
      },
      xAxis: {
        type: "time",
        show: true,
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: withOpacity(textPrimary, 0.45),
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: textPrimary,
          fontSize: textXxsTypography.fontSize,
          fontFamily: textXxsTypography.fontFamily,
          fontWeight: textXxsTypography.fontWeight,
          hideOverlap: true,
          margin: 8,
          formatter: (value: number) => formatXAxisTick(value),
          rich: {
            yearBold: {
              color: textPrimary,
              fontSize: textXxsTypography.fontSize,
              fontFamily: textXxsTypography.fontFamily,
              fontWeight: 700,
              lineHeight: textXxsTypography.lineHeight,
            },
          },
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: "value",
        min: yAxisMin,
        max: yAxisMax,
        interval: yAxisStep,
        splitNumber: splitCount,
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: textPrimary,
          fontSize: numbersXxsTypography.fontSize,
          fontFamily: numbersXxsTypography.fontFamily,
          fontWeight: numbersXxsTypography.fontWeight,
          formatter: (value: number) =>
            `{num|${isPercentageMode ? `${Math.round(value)}%` : formatChartMetricValue(value, { compact: true })}}`,
          rich: {
            num: {
              color: textPrimary,
              fontSize: numbersXxsTypography.fontSize,
              fontFamily: numbersXxsTypography.fontFamily,
              fontWeight: numbersXxsTypography.fontWeight,
              lineHeight: numbersXxsTypography.lineHeight,
              letterSpacing: numbersXxsTypography.letterSpacing,
              fontFeatureSettings: numbersXxsTypography.fontFeatureSettings,
            },
          },
        },
        splitLine: {
          lineStyle: {
            color: withOpacity(textPrimary, 0.11),
            width: 1,
          },
        },
      },
      tooltip: {
        trigger: "axis",
        renderMode: "html",
        appendToBody: true,
        confine: false,
        position: chartTooltipPosition,
        axisPointer: {
          type: "line",
          lineStyle: {
            color: withOpacity(textPrimary, 0.45),
            width: 1,
          },
        },
        backgroundColor: "transparent",
        borderWidth: 0,
        padding: 0,
        extraCssText: "box-shadow:none; border:none; z-index:2147483647;",
        textStyle: {
          color: textPrimary,
          fontFamily: "var(--font-raleway), sans-serif",
          fontSize: 12,
        },
        formatter: (params: unknown) => {
          const points = Array.isArray(params) ? params : [params];
          const validPoints = points
            .filter(Boolean)
            .map((point) => point as {
              value: [number, number | string | null];
              seriesName: string;
              color?: string;
            })
            .filter((point) => {
              const value = Number(point.value?.[1]);
              return Number.isFinite(value) && Math.abs(value) > 0;
            }) as Array<{
              value: [number, number];
              seriesName: string;
              color?: string;
            }>;
          if (validPoints.length === 0) {
            return "";
          }

          const timestamp = validPoints[0].value[0];
          const dateLabel = new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          }).format(timestamp);

          const sortedPoints = validPoints
            .map((point) => ({
              ...point,
              numericValue: Number(point.value[1]),
            }))
            .sort((a, b) => b.numericValue - a.numericValue);
          const maxTooltipValue = Math.max(...sortedPoints.map((point) => Math.abs(point.numericValue)), 0);

          const rows = sortedPoints
            .map((point) => {
              const value = Number(point.numericValue);
              if (!Number.isFinite(value)) {
                return "";
              }
              const rowMeta = displayRows.find((row) => row.label === point.seriesName);
              const lineColor = rowMeta?.accentColor ?? point.color ?? textPrimary;
              const formattedValue = formatChartMetricValue(value);
              const barWidth = maxTooltipValue > 0 ? clamp((Math.abs(value) / maxTooltipValue) * 100, 0, 100) : 0;
              return `
                <div class="flex w-full space-x-1.5 items-center font-medium leading-tight">
                  <div class="w-3 h-1 rounded-r-full" style="background-color:${lineColor}"></div>
                  <div class="tooltip-point-name text-xs">${escapeHtml(point.seriesName)}</div>
                  <div class="flex-1 text-right justify-end flex numbers-xs">${formattedValue}</div>
                </div>
                <div class="ml-[18px] mr-[1px] h-px relative mb-[2px] overflow-hidden">
                  <div class="h-px rounded-none absolute right-0 top-0" style="width:${barWidth}%; background-color:${lineColor}"></div>
                </div>
              `;
            })
            .join("");

          return `
            <div class="${UNIVERSAL_CHART_TOOLTIP_CONTAINER_CLASS}">
              <div class="flex-1 font-bold text-[13px] md:text-[1rem] ml-[18px] mb-1 flex justify-between">
                <span>${dateLabel}</span>
                <span class="text-xs font-medium text-color-text-primary">${escapeHtml(metricLabel)}</span>
              </div>
              <div class="flex flex-col w-full">
                ${rows}
              </div>
            </div>
          `;
        },
      },
      series: sortedSeries.map((series, index) => ({
        name: series.row.label,
        type: "line" as const,
        data: series.data,
        stack: shouldStackSeries ? "total" : undefined,
        showSymbol: false,
        smooth: false,
        lineStyle: {
          width: 2,
          color: series.row.accentColor,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: withHexOpacity(series.row.accentColor, shouldStackSeries ? 0.36 : 0.22) },
            { offset: 1, color: withHexOpacity(series.row.accentColor, 0.04) },
          ]),
        },
        markLine:
          index === 0
            ? {
                silent: true,
                symbol: "none",
                label: { show: false },
                lineStyle: {
                  color: withOpacity(textPrimary, 0.35),
                  width: 1,
                },
                data: [{ yAxis: 0 }],
              }
            : undefined,
      })),
    };
  }, [
    chartSeriesData,
    chartTooltipPosition,
    contentHeight,
    displayRows,
    formatChartMetricValue,
    isPercentageMode,
    isStackedMode,
    metricLabel,
    numbersXxsTypography,
    textXxsTypography,
  ]);

  useLayoutEffect(() => {
    if (!contentRef.current) {
      return;
    }

    const contentElement = contentRef.current;
    const syncContentMetrics = () => {
      const rect = contentElement.getBoundingClientRect();
      setContentWidth(rect.width);
      setContentHeight(rect.height);
    };

    syncContentMetrics();
    const frame = window.requestAnimationFrame(syncContentMetrics);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setContentWidth(entry.contentRect.width);
      setContentHeight(entry.contentRect.height);
    });

    observer.observe(contentElement);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    if (!tablePaneRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setTablePaneHeight(entry.contentRect.height);
    });

    observer.observe(tablePaneRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!tableScrollRef.current) {
      return;
    }

    const scrollElement = tableScrollRef.current;
    const observer = new ResizeObserver(() => {
      scheduleTableScrollMetricsSync();
    });

    observer.observe(scrollElement);
    scheduleTableScrollMetricsSync();

    return () => {
      if (tableScrollSyncRafRef.current !== null) {
        window.cancelAnimationFrame(tableScrollSyncRafRef.current);
        tableScrollSyncRafRef.current = null;
      }
      observer.disconnect();
    };
  }, [scheduleTableScrollMetricsSync]);

  useEffect(() => {
    scheduleTableScrollMetricsSync();
  }, [contentWidth, hasSelectionDivider, scheduleTableScrollMetricsSync, splitRatio, tablePaneHeight, tableRows.length]);

  useEffect(() => {
    if (isMobileLayout || !tableScrollbarTrackRef.current) {
      return;
    }

    const trackElement = tableScrollbarTrackRef.current;
    const syncTrackHeight = () => {
      const rect = trackElement.getBoundingClientRect();
      setTableScrollbarTrackHeight((current) => (Math.abs(current - rect.height) < 0.5 ? current : rect.height));
    };
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setTableScrollbarTrackHeight((current) =>
        Math.abs(current - entry.contentRect.height) < 0.5 ? current : entry.contentRect.height,
      );
    });

    syncTrackHeight();
    observer.observe(trackElement);
    window.addEventListener("resize", syncTrackHeight);

    return () => {
      window.removeEventListener("resize", syncTrackHeight);
      observer.disconnect();
    };
  }, [isMobileLayout]);

  const updateSplitFromClientX = (clientX: number) => {
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const availableWidth = Math.max(rect.width - DIVIDER_WIDTH, 1);
    const minPaneWidth = getMinPaneWidth(availableWidth);
    const minRatio = minPaneWidth / availableWidth;
    const maxRatio = 1 - minPaneWidth / availableWidth;
    const rawRatio = (clientX - rect.left - DIVIDER_WIDTH / 2) / availableWidth;
    const nextRatio = clamp(rawRatio, minRatio, maxRatio);

    setSplitRatio(nextRatio);
  };

  const handleDividerPointerDown = (event: ReactPointerEvent) => {
    event.preventDefault();
    setDragging(true);
    updateSplitFromClientX(event.clientX);
  };

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      updateSplitFromClientX(event.clientX);
    };

    const handlePointerUp = () => {
      setDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragging]);

  const tableScrollMax = Math.max(tableScrollHeight - tableClientHeight, 0);
  const tableCanScroll = tableScrollMax > 0;
  const tableScrollbarThumbHeight =
    tableCanScroll && tableScrollbarTrackHeight > 0
      ? clamp((tableClientHeight / tableScrollHeight) * tableScrollbarTrackHeight, 30, tableScrollbarTrackHeight)
      : Math.max(Math.min(tableScrollbarTrackHeight || 92, 92), 30);
  const tableScrollbarThumbTop =
    tableCanScroll && tableScrollbarTrackHeight > tableScrollbarThumbHeight
      ? (tableScrollTop / tableScrollMax) * (tableScrollbarTrackHeight - tableScrollbarThumbHeight)
      : 0;
  const tableScrollBottom = tableScrollTop + tableClientHeight;
  const tableHasMoreRowsAbove = tableCanScroll && tableScrollTop > 1;
  const tableHasMoreRowsBelow = tableCanScroll && tableScrollBottom < tableScrollHeight - 1;
  const tableBottomScrollPadding = isMobileLayout ? TABLE_BOTTOM_SCROLL_PADDING_MOBILE : TABLE_BOTTOM_SCROLL_PADDING;

  const updateTableScrollFromPointer = useCallback(
    (clientY: number, dragOffset: number) => {
      const trackRect = tableScrollbarTrackRef.current?.getBoundingClientRect();
      const tableElement = tableScrollRef.current;
      if (!trackRect || !tableElement) {
        return;
      }

      const currentScrollMax = Math.max(tableElement.scrollHeight - tableElement.clientHeight, 0);
      if (currentScrollMax <= 0) {
        return;
      }

      const currentThumbHeight =
        trackRect.height > 0
          ? clamp((tableElement.clientHeight / Math.max(tableElement.scrollHeight, 1)) * trackRect.height, 30, trackRect.height)
          : 30;
      const availableTrack = Math.max(trackRect.height - currentThumbHeight, 1);
      const nextThumbTop = clamp(clientY - trackRect.top - dragOffset, 0, availableTrack);
      const nextScrollRatio = nextThumbTop / availableTrack;
      tableElement.scrollTop = nextScrollRatio * currentScrollMax;
      syncTableScrollMetrics();
    },
    [syncTableScrollMetrics],
  );

  const handleTableScrollbarPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const trackRect = tableScrollbarTrackRef.current?.getBoundingClientRect();
    const tableElement = tableScrollRef.current;
    if (!trackRect) {
      return;
    }
    if (!tableElement) {
      return;
    }

    const currentScrollMax = Math.max(tableElement.scrollHeight - tableElement.clientHeight, 0);
    if (currentScrollMax <= 0) {
      return;
    }

    const currentThumbHeight =
      trackRect.height > 0
        ? clamp((tableElement.clientHeight / Math.max(tableElement.scrollHeight, 1)) * trackRect.height, 30, trackRect.height)
        : 30;
    const availableTrack = Math.max(trackRect.height - currentThumbHeight, 1);
    const currentThumbTop = (tableElement.scrollTop / currentScrollMax) * availableTrack;

    const pointerY = event.clientY - trackRect.top;
    const thumbStart = currentThumbTop;
    const thumbEnd = thumbStart + currentThumbHeight;
    const dragOffset =
      pointerY >= thumbStart && pointerY <= thumbEnd ? pointerY - thumbStart : currentThumbHeight / 2;

    setTableScrollbarDragOffset(dragOffset);
    setTableScrollbarDragging(true);
    updateTableScrollFromPointer(event.clientY, dragOffset);
  };

  useEffect(() => {
    if (!tableScrollbarDragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      updateTableScrollFromPointer(event.clientY, tableScrollbarDragOffset);
    };

    const handlePointerUp = () => {
      setTableScrollbarDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [tableScrollbarDragOffset, tableScrollbarDragging, updateTableScrollFromPointer]);

  const setActiveSelectedChains = (chains: string[]) => {
    if (isMetricContextActive) {
      setContextSelectedChains(chains);
      return;
    }

    setLocalSelectedChains(chains);
  };

  const toggleChainSelection = (chain: string) => {
    const nextChains = selectedChains.includes(chain)
      ? selectedChains.filter((selectedChain) => selectedChain !== chain)
      : [...selectedChains, chain];
    setActiveSelectedChains(nextChains);
  };

  const selectAllChains = () => {
    setActiveSelectedChains(displayRows.map((row) => row.chain));
  };

  const clearSelectedChains = () => {
    setActiveSelectedChains([]);
  };
  const getChainPageHref = useCallback(
    (chainKey: string) => {
      const chainMeta =
        (AllChainsByKeys as Record<string, any>)?.[chainKey] ??
        (AllDALayersByKeys as Record<string, any>)?.[chainKey];
      const urlKey = chainMeta?.urlKey ?? chainMeta?.url_key ?? chainKey.replace(/_/g, "-");
      return `/chains/${urlKey}`;
    },
    [AllChainsByKeys, AllDALayersByKeys],
  );
  const handleTableSortClick = (key: TableSortKey) => {
    setTableSort((current) =>
      current.key === key
        ? {
            key,
            direction: current.direction === "desc" ? "asc" : "desc",
          }
        : {
            key,
            direction: "desc",
          },
    );
  };
  const getTableSortIcon = (key: TableSortKey): GTPIconName =>
    tableSort.key === key && tableSort.direction === "asc"
      ? "in-button-up-monochrome"
      : "in-button-down-monochrome";
  const isTableSortKeyActive = (key: TableSortKey) => tableSort.key === key;
  const showTablePane = !isTableCollapsed;

  const availableWidth = isMobileLayout
    ? Math.max(contentWidth, 0)
    : Math.max(contentWidth - DIVIDER_WIDTH, 0);
  const tableWidth = isMobileLayout
    ? availableWidth
    : showTablePane
      ? availableWidth * splitRatio
      : 0;
  const tablePaneWidth = isMobileLayout
    ? "100%"
    : showTablePane
      ? `calc(${(splitRatio * 100).toFixed(4)}% - ${DIVIDER_WIDTH / 2}px)`
      : "0px";
  const chartPaneWidth = isMobileLayout
    ? "100%"
    : showTablePane
      ? `calc(${((1 - splitRatio) * 100).toFixed(4)}% - ${DIVIDER_WIDTH / 2}px)`
      : "100%";
  const tableGridAvailableWidth = Math.max(tableWidth - TABLE_GRID_SIDE_PADDING, 0);
  const requiredWidthFor3ChangeColumns = getTableGridRequiredWidth(3, TABLE_CHAIN_MIN_WIDTH_NO_TRUNCATE);
  const requiredWidthFor2ChangeColumns = getTableGridRequiredWidth(2, TABLE_CHAIN_MIN_WIDTH_NO_TRUNCATE);
  const requiredWidthFor1ChangeColumn = getTableGridRequiredWidth(1, TABLE_CHAIN_MIN_WIDTH_NO_TRUNCATE);

  const visibleChangeColumns =
    tableGridAvailableWidth >= requiredWidthFor3ChangeColumns
      ? 3
      : tableGridAvailableWidth >= requiredWidthFor2ChangeColumns
        ? 2
        : 1;

  const show24hColumn = visibleChangeColumns >= 1;
  const show30dColumn = visibleChangeColumns >= 2;
  const show1yColumn = visibleChangeColumns >= 3;
  const tableDataColumnCount = 2 + Number(show24hColumn) + Number(show30dColumn) + Number(show1yColumn);
  const tableDataColumnIndexes = useMemo(
    () => Array.from({ length: tableDataColumnCount }, (_, index) => index),
    [tableDataColumnCount],
  );
  const truncateChainLabel = tableGridAvailableWidth < requiredWidthFor1ChangeColumn;
  const tableGridTemplateColumns = useMemo(() => {
    const columns = [
      `minmax(0, ${TABLE_CHAIN_COLUMN_WIDTH}px)`,
      `${TABLE_SIDE_SPACER_WIDTH}px`,
      `minmax(${TABLE_ABSOLUTE_COLUMN_WIDTH}px, 1fr)`,
    ];

    if (show24hColumn) {
      columns.push(`minmax(${TABLE_CHANGE_COLUMN_WIDTH}px, 1fr)`);
    }
    if (show30dColumn) {
      columns.push(`minmax(${TABLE_CHANGE_COLUMN_WIDTH}px, 1fr)`);
    }
    if (show1yColumn) {
      columns.push(`minmax(${TABLE_CHANGE_COLUMN_WIDTH}px, 1fr)`);
    }

    columns.push(`${TABLE_CHECK_COLUMN_WIDTH}px`);
    return columns.join(" ");
  }, [show1yColumn, show24hColumn, show30dColumn]);
  const chartRenderHeight = isMobileLayout
    ? `${Math.max(Math.floor((contentHeight || 420) * 0.46), 210)}px`
    : showTablePane && tablePaneHeight > 0
      ? `${Math.floor(tablePaneHeight)}px`
      : "100%";
  const tableWatermarkOverlayClassName = "pointer-events-none absolute inset-0 z-[40] flex items-center justify-center";
  const chartWatermarkOverlayClassName = isMobileLayout
    ? "pointer-events-none absolute inset-0 z-[40] flex items-center justify-center"
    : "pointer-events-none absolute inset-y-0 left-[52px] right-0 z-[40] flex items-center justify-center";
  const freshnessLabel = isMetricContextActive ? "Sourced from growthepie data" : "Updated 32 minutes ago";

  const wrapperClassName = fullBleed ? "relative w-screen" : "relative w-full";
  const wrapperStyle = fullBleed
    ? {
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }
    : undefined;
  const hasBottomLeftControls = true;
  const hasBottomTabBar = hasBottomLeftControls || bottomRightItems.length > 0;
  const bottomLeftControls = hasBottomLeftControls ? (
    <GTPTabButtonSet size={tabSize}>
      <div title={showTablePane ? "Close table" : "Show table"}>
        <GTPButton
          label={showTablePane ? undefined : "Open Table"}
          leftIcon={showTablePane ? "gtp-side-close-monochrome" : "gtp-side-open-monochrome"}
          size={tabSize}
          variant={showTablePane ? "no-background" : "highlight"}
          visualState="default"
          clickHandler={() => {
            setIsTableCollapsed((current) => !current);
            setIsSharePopoverOpen(false);
          }}
        />
      </div>
      <div title="Share">
        <GTPButtonDropdown
          openDirection="top"
          matchTriggerWidthToDropdown
          buttonProps={{
            label: "Share",
            labelDisplay: "active",
            leftIcon: "gtp-share-monochrome",
            size: tabSize,
            variant: "no-background",
          }}
          isOpen={isSharePopoverOpen}
          onOpenChange={setIsSharePopoverOpen}
          dropdownContent={<ShareDropdownContent onClose={() => setIsSharePopoverOpen(false)} />}
        />
      </div>
      <div title="Download image">
        <GTPButton
          leftIcon="gtp-download-monochrome"
          size={tabSize}
          variant="no-background"
          visualState={isDownloadingChartSnapshot ? "disabled" : "default"}
          disabled={isDownloadingChartSnapshot}
          clickHandler={handleDownloadChartSnapshot}
        />
      </div>
    </GTPTabButtonSet>
  ) : null;
  const bottomTabBar = hasBottomTabBar ? (
    <GTPTabBar
      mobileVariant="inline"
      leftClassName="!flex-none shrink-0"
      rightClassName={isMobileLayout ? "min-w-0 flex-1" : undefined}
      className="border-[0.5px] border-color-bg-default bg-color-bg-default/95 backdrop-blur-[2px]"
      left={bottomLeftControls}
      right={(
        bottomRightItems.length > 0 ? (
          <GTPTabButtonSet
            items={bottomRightItems}
            selectedId={effectiveBottomRightSelectedId}
            size={tabSize}
            fill={isMobileLayout ? "full" : "none"}
            onChange={(id, item) => {
              if (bottomRightConfig?.selectedId === undefined) {
                setBottomRightSelection(id);
              }

              if (
                isMetricContextActive &&
                bottomRightConfig?.selectedId === undefined &&
                ["absolute", "percentage", "stacked"].includes(id)
              ) {
                setContextSelectedScale(id);
              }

              bottomRightConfig?.onChange?.(id, item);
            }}
          />
        ) : null
      )}
    />
  ) : null;

  return (
    <div className={`${wrapperClassName} ${className ?? ""}`} style={wrapperStyle}>
      <div
        ref={cardRef}
        className="w-full rounded-[18px] bg-color-bg-default flex flex-col overflow-hidden"
      >
        <GTPTabBar
          mobileVariant="stacked"
          className="border-[0.5px] border-color-bg-default"
          left={
            topLeftItems.length > 0 ? (
              <GTPTabButtonSet
                items={topLeftItems}
                selectedId={effectiveTopLeftSelectedId}
                size={tabSize}
                fill="mobile"
                onChange={(id, item) => {
                  if (topLeftConfig?.selectedId === undefined) {
                    setTopLeftSelection(id);
                  }

                  if (isMetricContextActive && topLeftConfig?.selectedId === undefined) {
                    if (id === "daily") {
                      setContextSelectedTimeInterval("daily");
                    } else if (id === "weekly") {
                      setContextSelectedTimeInterval("weekly");
                    } else if (id === "monthly" || id === "quarterly") {
                      setContextSelectedTimeInterval("monthly");
                    }

                    if (usesContextTimeframeTabs) {
                      const nextAggregation = getAggregationFromTabId(id);
                      const nextTimespanId = mapContextTimespanForAggregation({
                        nextAggregation,
                        currentTimespan: contextSelectedTimespan,
                        timespans: metricTimespans as MetricTimespanMap | undefined,
                      });
                      if (nextTimespanId) {
                        setContextSelectedTimespan(nextTimespanId);
                      }
                    }
                  }

                  topLeftConfig?.onChange?.(id, item);
                }}
              />
            ) : null
          }
          right={
            effectiveTopRightItems.length > 0 ? (
              <GTPTabButtonSet
                items={effectiveTopRightItems}
                selectedId={selectedTopRightId}
                size={tabSize}
                fill="mobile"
                onChange={(id, item) => {
                  if (topRightConfig?.selectedId === undefined) {
                    if (usesContextTimeframeTabs) {
                      setContextSelectedTimespan(id);
                    } else {
                      setTopRightSelection(id);
                    }
                  }
                  topRightConfig?.onChange?.(id, item);
                }}
              />
            ) : null
          }
        />

        <div className="relative px-[5px] pb-0 h-[538px] overflow-hidden">
          <div
            className="flex h-full flex-col gap-[5px]"
            style={{
              paddingBottom: isMobileLayout
                ? "0px"
                : `${hasBottomTabBar ? BOTTOM_TAB_OVERLAY_HEIGHT + CHART_TO_BOTTOM_TAB_GAP : 0}px`,
            }}
          >
            <div className="flex items-center justify-between gap-x-[8px] pt-[4px] pr-[10px] pl-[6px] pb-[4px]">
              <div className="flex items-center gap-x-[6px]">
                <GTPIcon
                  icon={metricIcon}
                  className="!w-[12px] !h-[12px] text-color-text-primary"
                  containerClassName="!w-[12px] !h-[12px]"
                />
                <span className="text-xxs text-color-text-primary/85">{metricLabel}</span>
              </div>

              <div className="flex items-center gap-x-[4px]">
                <GTPIcon
                  icon="gtp-realtime"
                  className="!w-[12px] !h-[12px] text-color-text-primary"
                  containerClassName="!w-[12px] !h-[12px]"
                />
                <span className="text-xxs text-color-text-primary/75">{freshnessLabel}</span>
              </div>
            </div>

            <div
              ref={contentRef}
              className={`flex items-stretch flex-1 min-h-0 gap-[5px] ${isMobileLayout ? "flex-col" : ""}`}
            >
            {showTablePane ? (
              <div
                className={`flex min-w-0 h-full min-h-0 ${isMobileLayout ? "order-3 flex-1" : ""}`}
                style={{
                  width: tablePaneWidth,
                }}
              >
              <div
                ref={tablePaneRef}
                className="relative h-full min-h-0 w-full min-w-[160px] rounded-[14px] overflow-hidden"
              >
                <div className={tableWatermarkOverlayClassName}>
                  <ChartWatermarkWithMetricName metricName={metricLabel} className={UNIVERSAL_CHART_WATERMARK_CLASS} />
                </div>
                <div className="relative z-[1] h-[37px] px-[6px] py-[4px]">
                  <div
                    className="relative grid h-full items-center gap-x-[6px] text-[12px] font-semibold text-color-text-primary"
                    style={{ gridTemplateColumns: tableGridTemplateColumns }}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 grid"
                      style={{ gridTemplateColumns: tableGridTemplateColumns }}
                    >
                      {tableDataColumnIndexes.slice(0, 1).map((index) => (
                        <div
                          key={`header-col-bg-${index}`}
                          className="bg-transparent"
                        />
                      ))}
                      <div />
                      {tableDataColumnIndexes.slice(1).map((index) => (
                        <div
                          key={`header-col-bg-${index}`}
                          className={index % 2 === 0 ? "bg-color-bg-medium/32" : "bg-color-bg-default/8"}
                        />
                      ))}
                      <div />
                    </div>
                    <div className="relative z-[1] flex h-full items-center pl-[10px]">Chain</div>
                    <div
                      aria-hidden
                      className="relative z-[1] h-full"
                    />
                    <div className="relative z-[1] flex h-full w-full items-center justify-end pr-[2px]">
                      <GTPButton
                        label={tableColumnLabels.absolute}
                        rightIcon={getTableSortIcon("absolute")}
                        variant="no-background"
                        visualState={isTableSortKeyActive("absolute") ? "active" : "default"}
                        size="xs"
                        clickHandler={() => handleTableSortClick("absolute")}
                      />
                    </div>
                    {show24hColumn ? (
                      <div className="relative z-[1] flex h-full w-full items-center justify-end pr-[2px]">
                        <GTPButton
                          label={tableColumnLabels.change1}
                          rightIcon={getTableSortIcon("change1")}
                          variant="no-background"
                          visualState={isTableSortKeyActive("change1") ? "active" : "default"}
                          size="xs"
                          clickHandler={() => handleTableSortClick("change1")}
                        />
                      </div>
                    ) : null}
                    {show30dColumn ? (
                      <div className="relative z-[1] flex h-full w-full items-center justify-end pr-[2px]">
                        <GTPButton
                          label={tableColumnLabels.change2}
                          rightIcon={getTableSortIcon("change2")}
                          variant="no-background"
                          visualState={isTableSortKeyActive("change2") ? "active" : "default"}
                          size="xs"
                          clickHandler={() => handleTableSortClick("change2")}
                        />
                      </div>
                    ) : null}
                    {show1yColumn ? (
                      <div className="relative z-[1] flex h-full w-full items-center justify-end pr-[2px]">
                        <GTPButton
                          label={tableColumnLabels.change3}
                          rightIcon={getTableSortIcon("change3")}
                          variant="no-background"
                          visualState={isTableSortKeyActive("change3") ? "active" : "default"}
                          size="xs"
                          clickHandler={() => handleTableSortClick("change3")}
                        />
                      </div>
                    ) : null}
                    <div className="relative z-[3] flex h-full w-full items-center justify-center translate-x-[6px] rounded-full">
                      <GTPButton
                        leftIcon={allChainsSelected ? "gtp-checkmark-checked-monochrome" : "gtp-checkmark-unchecked-monochrome"}
                        variant="primary"
                        visualState="default"
                        size="xs"
                        clickHandler={allChainsSelected ? clearSelectedChains : selectAllChains}
                      />
                    </div>
                  </div>
                </div>
                <div className="relative h-[calc(100%-37px)]">
                  <div
                    ref={tableScrollRef}
                    onScroll={scheduleTableScrollMetricsSync}
                    className="relative z-[1] h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-[6px] pt-[1px] space-y-[2px]"
                    style={{ paddingBottom: `${tableBottomScrollPadding}px` }}
                  >
                    {selectedTableRows.map((row) => (
                      <ChainMetricTableRow
                        key={row.chain}
                        id={row.chain}
                        label={row.label}
                        icon={row.icon}
                        chainHref={getChainPageHref(row.chain)}
                        accentColor={row.accentColor}
                        selected={row.selected}
                        gridTemplateColumns={tableGridTemplateColumns}
                        truncateChainLabel={truncateChainLabel}
                        show24h={show24hColumn}
                        show30d={show30dColumn}
                        show1y={show1yColumn}
                        barWidth={row.barWidth}
                        yesterdayValue={row.absoluteLabel}
                        hours24Value={row.change1Label}
                        hours24Change={row.change1}
                        days30Value={row.change2Label}
                        days30Change={row.change2}
                        year1Value={row.change3Label}
                        year1Change={row.change3}
                        onToggle={toggleChainSelection}
                      />
                    ))}
                    {hasSelectionDivider ? (
                      <div className="h-[18px] flex items-center gap-x-[8px] px-[2px]">
                        <div className="h-[1px] flex-1 bg-color-bg-medium/80" />
                        <span className="text-[10px] font-semibold tracking-[0.06em] text-color-text-secondary">
                          NOT SHOWING IN CHART
                        </span>
                        <div className="h-[1px] flex-1 bg-color-bg-medium/80" />
                      </div>
                    ) : null}
                    {deselectedTableRows.map((row) => (
                      <ChainMetricTableRow
                        key={row.chain}
                        id={row.chain}
                        label={row.label}
                        icon={row.icon}
                        chainHref={getChainPageHref(row.chain)}
                        accentColor={row.accentColor}
                        selected={row.selected}
                        gridTemplateColumns={tableGridTemplateColumns}
                        truncateChainLabel={truncateChainLabel}
                        show24h={show24hColumn}
                        show30d={show30dColumn}
                        show1y={show1yColumn}
                        barWidth={row.barWidth}
                        yesterdayValue={row.absoluteLabel}
                        hours24Value={row.change1Label}
                        hours24Change={row.change1}
                        days30Value={row.change2Label}
                        days30Change={row.change2}
                        year1Value={row.change3Label}
                        year1Change={row.change3}
                        onToggle={toggleChainSelection}
                      />
                    ))}
                  </div>
                  {tableRows.length > 0 && tableHasMoreRowsAbove ? (
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 z-[30]"
                      style={{
                        height: `${TABLE_TOP_FADE_HEIGHT}px`,
                        background:
                          "linear-gradient(to bottom, rgb(var(--bg-default) / 1) 0%, rgb(var(--bg-default) / 0.9) 38%, rgb(var(--bg-default) / 0) 100%)",
                      }}
                    />
                  ) : null}
                  {tableRows.length > 0 && tableHasMoreRowsBelow ? (
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 z-[30]"
                      style={{
                        height: `${TABLE_BOTTOM_FADE_HEIGHT}px`,
                        background:
                          "linear-gradient(to top, rgb(var(--bg-default) / 1) 0%, rgb(var(--bg-default) / 0.94) 36%, rgb(var(--bg-default) / 0.64) 68%, rgb(var(--bg-default) / 0) 100%)",
                      }}
                    />
                  ) : null}
                </div>
              </div>
              </div>
            ) : null}

            {!isMobileLayout && showTablePane ? (
              <div className="relative z-[35] w-[18px] h-full flex flex-col items-center gap-[5px] pt-[7px] pb-[10px] select-none touch-none">
                <div className="cursor-col-resize mt-[1px]" onPointerDown={handleDividerPointerDown}>
                  <GTPButton size="xs" variant="primary" leftIcon="gtp-move-side-monochrome" />
                </div>
                <div
                  ref={tableScrollbarTrackRef}
                  className={`group w-[8px] flex-1 rounded-full bg-color-bg-medium p-[1px] transition-colors ${
                    tableCanScroll ? "cursor-pointer hover:bg-color-ui-hover/35" : "cursor-default opacity-60"
                  }`}
                  onPointerDown={handleTableScrollbarPointerDown}
                >
                  <div
                    className={`w-[6px] rounded-full transition-colors ${
                      tableCanScroll
                        ? "bg-color-ui-active group-hover:bg-color-ui-hover"
                        : "bg-color-ui-active/70"
                    }`}
                    style={{
                      height: `${tableScrollbarThumbHeight}px`,
                      transform: `translateY(${tableScrollbarThumbTop}px)`,
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div
              className={`flex min-w-0 ${isMobileLayout ? "order-1 w-full shrink-0" : "h-full"}`}
              style={{
                width: chartPaneWidth,
              }}
            >
              <div className={`min-w-0 flex-1 min-h-0 ${isMobileLayout ? "pl-0" : showTablePane ? "h-full pl-[5px]" : "h-full"}`}>
                <div
                  ref={chartTooltipHostRef}
                  className="relative w-full rounded-[14px] overflow-hidden"
                  style={{ height: isMobileLayout ? chartRenderHeight : "100%" }}
                >
                  <ReactECharts
                    option={chartOption}
                    notMerge
                    lazyUpdate
                    style={{ width: "100%", height: "100%" }}
                  />
                  <div className={chartWatermarkOverlayClassName}>
                    <ChartWatermarkWithMetricName metricName={metricLabel} className={UNIVERSAL_CHART_WATERMARK_CLASS} />
                  </div>
                </div>
              </div>
            </div>
            {isMobileLayout && hasBottomTabBar ? (
              <div
                className="order-2 -mx-[5px] w-[calc(100%+10px)]"
                style={{ marginTop: `${Math.max(CHART_TO_BOTTOM_TAB_GAP - 5, 0)}px` }}
              >
                {bottomTabBar}
              </div>
            ) : null}
            </div>
          </div>
          {!isMobileLayout && hasBottomTabBar ? (
            <div className="absolute inset-x-0 bottom-0 z-[30]">
              {bottomTabBar}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
