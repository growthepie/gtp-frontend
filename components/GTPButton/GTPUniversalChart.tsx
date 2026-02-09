"use client";

import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { EChartsOption } from "echarts";
import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { iconNames } from "@/icons/gtp-icon-names";
import { useMaster } from "@/contexts/MasterContext";
import { useMetricChartControls } from "@/components/metric/MetricChartControlsContext";
import { useMetricData } from "@/components/metric/MetricDataContext";
import { daMetricItems, metricItems } from "@/lib/metrics";
import ChainMetricTableRow from "../layout/ChainMetricTableRow";
import ChartWatermark from "../layout/ChartWatermark";
import { GTPIcon } from "../layout/GTPIcon";
import { GTPButton, GTPButtonSize } from "./GTPButton";
import GTPTabBar from "./GTPTabBar";
import GTPTabButtonSet, { GTPTabButtonSetItem } from "./GTPTabButtonSet";

const DIVIDER_WIDTH = 18;
const DEFAULT_SPLIT_RATIO = 506 / (506 + 650);
const BOTTOM_TAB_OVERLAY_HEIGHT = 38;
const TABLE_CHAIN_COLUMN_WIDTH = 174;
const TABLE_SIDE_SPACER_WIDTH = 8;
const TABLE_ABSOLUTE_COLUMN_WIDTH = 76;
const TABLE_CHANGE_COLUMN_WIDTH = 66;
const TABLE_CHECK_COLUMN_WIDTH = 22;
const TABLE_GRID_GAP = 6;
const TABLE_GRID_SIDE_PADDING = 10;
const TABLE_CHAIN_MIN_WIDTH_NO_TRUNCATE = 158;
const TABLE_BOTTOM_FADE_HEIGHT = 54;
const TABLE_BOTTOM_SCROLL_PADDING = 56;

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

const MOCK_TABLE_ROWS: Omit<UniversalChartTableRow, "series">[] = [
  {
    chain: "ethereum",
    label: "Ethereum",
    icon: "ethereum-logo-monochrome",
    value: 375_600_000_000,
    change1d: 2.3,
    change7d: 3.9,
    change28d: 16.7,
    change30d: 18.2,
    change180d: 37.6,
    change365d: 64.1,
    accentColor: "#8E97BF",
  },
  {
    chain: "base",
    label: "Base",
    icon: "base-logo-monochrome",
    value: 86_400_000_000,
    change1d: 4.1,
    change7d: 8.2,
    change28d: 21.5,
    change30d: 23.8,
    change180d: 58.4,
    change365d: 119.3,
    accentColor: "#4E7BFF",
  },
  {
    chain: "arbitrum",
    label: "Arbitrum",
    icon: "arbitrum-logo-monochrome",
    value: 73_200_000_000,
    change1d: 1.2,
    change7d: 2.1,
    change28d: 9.1,
    change30d: 9.8,
    change180d: 21.4,
    change365d: 41.4,
    accentColor: "#4EC6FF",
  },
  {
    chain: "optimism",
    label: "Optimism",
    icon: "optimism-logo-monochrome",
    value: 58_100_000_000,
    change1d: -0.6,
    change7d: -1.5,
    change28d: 3.5,
    change30d: 4.9,
    change180d: 19.2,
    change365d: 36.8,
    accentColor: "#FF5A67",
  },
  {
    chain: "zksync_era",
    label: "ZKsync Era",
    icon: "zksync-era-logo-monochrome",
    value: 22_900_000_000,
    change1d: 3.4,
    change7d: 5.2,
    change28d: 10.8,
    change30d: 11.1,
    change180d: 18.7,
    change365d: 28.7,
    accentColor: "#A095FF",
  },
  {
    chain: "starknet",
    label: "Starknet",
    icon: "starknet-logo-monochrome",
    value: 19_700_000_000,
    change1d: 0.8,
    change7d: 1.7,
    change28d: 6.8,
    change30d: 7.3,
    change180d: 14.6,
    change365d: 22.2,
    accentColor: "#FF9163",
  },
  {
    chain: "scroll",
    label: "Scroll",
    icon: "scroll-logo-monochrome",
    value: 11_500_000_000,
    change1d: 5.9,
    change7d: 10.1,
    change28d: 14.1,
    change30d: 14.9,
    change180d: 17.2,
    change365d: 18.1,
    accentColor: "#FFD861",
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const SERIES_POINTS = 180;
const SERIES_START = Date.UTC(2025, 6, 1);

const TOTAL_MARKET_CAP_SERIES: [number, number][] = Array.from({ length: SERIES_POINTS }, (_, index) => {
  const timestamp = SERIES_START + index * DAY_MS;
  const trend = 155_000_000_000 + index * 1_250_000_000;
  const waveA = Math.sin(index / 8) * 11_000_000_000;
  const waveB = Math.cos(index / 19) * 5_200_000_000;

  return [timestamp, Math.max(trend + waveA + waveB, 32_000_000_000)];
});

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

const formatPercentValue = (value: number) => `${value.toFixed(1)}%`;
const formatSignedPercent = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
const NUMBER_FONT_FAMILY = "var(--font-fira-sans), sans-serif";
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
  const contentRef = useRef<HTMLDivElement | null>(null);
  const tablePaneRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const tableScrollbarTrackRef = useRef<HTMLDivElement | null>(null);
  const hasAutoSelectedContextChainsRef = useRef(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [tablePaneHeight, setTablePaneHeight] = useState(0);
  const [splitRatio, setSplitRatio] = useState(DEFAULT_SPLIT_RATIO);
  const [dragging, setDragging] = useState(false);
  const [tableScrollbarDragging, setTableScrollbarDragging] = useState(false);
  const [tableScrollbarDragOffset, setTableScrollbarDragOffset] = useState(0);
  const [tableScrollTop, setTableScrollTop] = useState(0);
  const [tableScrollHeight, setTableScrollHeight] = useState(1);
  const [tableClientHeight, setTableClientHeight] = useState(1);
  const [tableScrollbarTrackHeight, setTableScrollbarTrackHeight] = useState(0);

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
  const [localSelectedChains, setLocalSelectedChains] = useState<string[]>(() =>
    MOCK_TABLE_ROWS.map((row) => row.chain),
  );
  const [tableSort, setTableSort] = useState<{ key: TableSortKey; direction: TableSortDirection }>({
    key: "absolute",
    direction: "desc",
  });

  const syncTableScrollMetrics = useCallback(() => {
    const scrollElement = tableScrollRef.current;
    if (!scrollElement) {
      return;
    }

    setTableScrollTop(scrollElement.scrollTop);
    setTableScrollHeight(Math.max(scrollElement.scrollHeight, 1));
    setTableClientHeight(Math.max(scrollElement.clientHeight, 1));
  }, []);

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

  const mockRows = useMemo<UniversalChartTableRow[]>(() => {
    const totalBaseValue = MOCK_TABLE_ROWS.reduce((sum, row) => sum + row.value, 0);

    return MOCK_TABLE_ROWS.map((row, rowIndex) => {
      const baseShare = row.value / Math.max(totalBaseValue, 1);
      const series = TOTAL_MARKET_CAP_SERIES.map(([timestamp, total], pointIndex) => {
        const seasonalDrift =
          1 + Math.sin(pointIndex / 13 + rowIndex * 0.9) * 0.07 + Math.cos(pointIndex / 29 + rowIndex * 0.55) * 0.04;
        const momentum = 1 + (row.change1d / 100) * ((pointIndex / SERIES_POINTS) - 0.5);
        const value = Math.max(total * baseShare * seasonalDrift * momentum, 0);
        return [timestamp, value] as [number, number];
      });

      return { ...row, series };
    });
  }, []);

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

  const sourceRows =
    isMetricContextActive && contextRows.length > 0
      ? contextRows
      : mockRows;
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

  const chartOption = useMemo<EChartsOption>(() => {
    const textPrimary = getCssVarAsRgb("--text-primary", "rgb(205, 216, 211)");
    const textSecondary = getCssVarAsRgb("--text-secondary", "rgb(121, 139, 137)");

    const splitCount = clamp(Math.round((contentHeight || 512) / 88), 3, 7);
    const allValues = chartSeriesData.flatMap((series) =>
      series.data
        .map((point) => point[1])
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value)),
    );
    const maxSeriesValue =
      isStackedMode && chartSeriesData.length > 0
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
    const yAxisStep = isPercentageMode ? 20 : absoluteStep;
    const yAxisMin = 0;
    const yAxisMax = isPercentageMode
      ? 100
      : Math.max(yAxisStep, Math.ceil((Math.max(maxSeriesValue, 1) * 1.06) / yAxisStep) * yAxisStep);

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
            color: withOpacity(textSecondary, 0.45),
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: textSecondary,
          fontSize: 10,
          fontFamily: "var(--font-raleway), sans-serif",
          hideOverlap: true,
          margin: 8,
          formatter: (value: number) =>
            new Intl.DateTimeFormat("en-GB", {
              month: "short",
              year: "2-digit",
              timeZone: "UTC",
            }).format(value),
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
          color: textSecondary,
          fontSize: 10,
          fontFamily: NUMBER_FONT_FAMILY,
          formatter: (value: number) => (isPercentageMode ? formatPercentValue(value) : formatCompactCurrency(value)),
        },
        splitLine: {
          lineStyle: {
            color: withOpacity(textSecondary, 0.11),
            width: 1,
          },
        },
      },
      tooltip: {
        trigger: "axis",
        renderMode: "html",
        appendToBody: true,
        confine: false,
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
              return Number.isFinite(value);
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

          const rows = sortedPoints
            .map((point) => {
              const value = Number(point.numericValue);
              if (!Number.isFinite(value)) {
                return "";
              }
              const rowMeta = displayRows.find((row) => row.label === point.seriesName);
              const lineColor = rowMeta?.accentColor ?? point.color ?? textPrimary;
              const formattedValue = isPercentageMode ? formatPercentValue(value) : formatCompactCurrency(value);
              return `
                <div class="flex w-full items-center space-x-2 font-medium mb-0.5 pl-[20px]">
                  <div class="w-4 h-1.5 rounded-r-full" style="background-color:${lineColor}"></div>
                  <div class="tooltip-point-name text-xs">${escapeHtml(point.seriesName)}</div>
                  <div class="flex-1 text-right justify-end numbers-xs flex">${formattedValue}</div>
                </div>
              `;
            })
            .join("");

          return `
            <div class="flex flex-col gap-y-[5px] w-fit min-w-[230px] py-[15px] pr-[15px] rounded-[15px] bg-color-bg-default text-color-text-primary text-xs shadow-standard">
              <div class="flex w-full gap-x-[10px] pl-[20px] h-[18px] items-center">
                <div class="heading-small-xs h-[18px] flex items-center">${dateLabel}</div>
              </div>
              <div class="flex flex-col w-full">
                ${rows}
              </div>
            </div>
          `;
        },
      },
      series: chartSeriesData.map((series) => ({
        name: series.row.label,
        type: "line" as const,
        data: series.data,
        stack: isStackedMode ? "total" : undefined,
        showSymbol: false,
        smooth: false,
        lineStyle: {
          width: 2,
          color: series.row.accentColor,
        },
        areaStyle:
          isPercentageMode && !isStackedMode
            ? undefined
            : {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: withHexOpacity(series.row.accentColor, isStackedMode ? 0.36 : 0.22) },
                  { offset: 1, color: withHexOpacity(series.row.accentColor, 0.04) },
                ]),
              },
        markLine:
          series.row.chain === chartSeriesData[0]?.row.chain
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
  }, [chartSeriesData, contentHeight, displayRows, isPercentageMode, isStackedMode]);

  useEffect(() => {
    if (!contentRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setContentWidth(entry.contentRect.width);
      setContentHeight(entry.contentRect.height);
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
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
      syncTableScrollMetrics();
    });

    observer.observe(scrollElement);
    scrollElement.addEventListener("scroll", syncTableScrollMetrics, { passive: true });
    const frame = window.requestAnimationFrame(syncTableScrollMetrics);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      scrollElement.removeEventListener("scroll", syncTableScrollMetrics);
    };
  }, [syncTableScrollMetrics]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(syncTableScrollMetrics);
    return () => window.cancelAnimationFrame(frame);
  }, [contentWidth, hasSelectionDivider, splitRatio, syncTableScrollMetrics, tablePaneHeight, tableRows.length]);

  useEffect(() => {
    if (!tableScrollbarTrackRef.current) {
      return;
    }

    const trackElement = tableScrollbarTrackRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setTableScrollbarTrackHeight(entry.contentRect.height);
    });

    observer.observe(trackElement);
    return () => observer.disconnect();
  }, []);

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

  const availableWidth = Math.max(contentWidth - DIVIDER_WIDTH, 0);
  const tableWidth = availableWidth * splitRatio;
  const chartWidth = availableWidth - tableWidth;
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
  const chartRenderHeight = tablePaneHeight > 0 ? `${Math.floor(tablePaneHeight)}px` : "100%";
  const metricLabel = metricData?.metric_name ?? "Market Cap";
  const metricInfo =
    metricContextType === "data-availability" ? da_metrics?.[metricId] : metrics?.[metricId];
  const metricCatalogIcon =
    (metricContextType === "data-availability" ? daMetricItems : metricItems).find((item) => item.key === metricId)?.icon;
  const metricIcon =
    normalizeMetricIcon(metricInfo?.icon) ??
    normalizeMetricIcon(metricCatalogIcon) ??
    (metricContextType === "data-availability" ? "gtp-data-availability" : "gtp-metrics-marketcap");
  const freshnessLabel = isMetricContextActive ? "Sourced from growthepie data" : "Updated 32 minutes ago";

  const wrapperClassName = fullBleed ? "relative w-screen" : "relative w-full";
  const wrapperStyle = fullBleed
    ? {
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }
    : undefined;

  return (
    <div className={`${wrapperClassName} ${className ?? ""}`} style={wrapperStyle}>
      <div className="w-full rounded-[18px] bg-color-bg-default flex flex-col overflow-hidden">
        <GTPTabBar
          className="border-[0.5px] border-color-bg-default"
          left={
            topLeftItems.length > 0 ? (
              <GTPTabButtonSet
                items={topLeftItems}
                selectedId={effectiveTopLeftSelectedId}
                size={tabSize}
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
          <div className="flex h-full flex-col gap-[5px]" style={{ paddingBottom: `${BOTTOM_TAB_OVERLAY_HEIGHT}px` }}>
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

            <div ref={contentRef} className="flex items-stretch flex-1 min-h-0 gap-[5px]">
            <div
              className="flex min-w-0 h-full"
              style={{
                width: tableWidth > 0 ? `${tableWidth}px` : undefined,
              }}
            >
              <div
                ref={tablePaneRef}
                className="relative h-full w-full min-w-[160px] rounded-[14px] overflow-hidden"
              >
                <div className="h-[37px] px-[6px] py-[4px]">
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
                <div
                  ref={tableScrollRef}
                  className="h-[calc(100%-37px)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-[6px] pt-[1px] space-y-[2px]"
                  style={{ paddingBottom: `${TABLE_BOTTOM_SCROLL_PADDING}px` }}
                >
                  {selectedTableRows.map((row) => (
                    <ChainMetricTableRow
                      key={row.chain}
                      id={row.chain}
                      label={row.label}
                      icon={row.icon}
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
                {tableRows.length > 0 && tableCanScroll ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-[20]"
                    style={{
                      height: `${TABLE_BOTTOM_FADE_HEIGHT}px`,
                      background:
                        "linear-gradient(to top, rgb(var(--bg-default) / 1) 0%, rgb(var(--bg-default) / 0.9) 34%, rgb(var(--bg-default) / 0.58) 64%, rgb(var(--bg-default) / 0) 100%)",
                    }}
                  />
                ) : null}
              </div>
            </div>

            <div className="w-[18px] h-full flex flex-col items-center gap-[5px] pt-[7px] pb-[10px] select-none touch-none">
              <div className="cursor-col-resize" onPointerDown={handleDividerPointerDown}>
                <GTPButton size="xs" variant="primary" leftIcon="gtp-move-side-monochrome" />
              </div>
              <div
                ref={tableScrollbarTrackRef}
                className={`w-[8px] flex-1 rounded-full bg-color-bg-medium p-[1px] ${
                  tableCanScroll ? "cursor-row-resize" : "cursor-default opacity-60"
                }`}
                onPointerDown={handleTableScrollbarPointerDown}
              >
                <div
                  className="w-[6px] rounded-full bg-color-ui-active"
                  style={{
                    height: `${tableScrollbarThumbHeight}px`,
                    transform: `translateY(${tableScrollbarThumbTop}px)`,
                  }}
                />
              </div>
            </div>

            <div
              className="flex min-w-0 h-full"
              style={{
                width: chartWidth > 0 ? `${chartWidth}px` : undefined,
              }}
            >
              <div className="min-w-0 flex-1 h-full min-h-0 pl-[5px]">
                <div className="relative h-full w-full rounded-[14px] overflow-hidden">
                  <ReactECharts
                    option={chartOption}
                    notMerge
                    lazyUpdate
                    style={{ width: "100%", height: chartRenderHeight }}
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <ChartWatermark className="h-auto w-[145px] text-color-text-secondary opacity-[0.18] mix-blend-darken dark:mix-blend-lighten" />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-[30]">
            <GTPTabBar
              leftClassName="hidden"
              className="border-[0.5px] border-color-bg-default bg-color-bg-default/95 backdrop-blur-[2px]"
              left={null}
              right={
                bottomRightItems.length > 0 ? (
                  <GTPTabButtonSet
                    items={bottomRightItems}
                    selectedId={effectiveBottomRightSelectedId}
                    size={tabSize}
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
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
