"use client";

import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "@/lib/echarts-setup";
import type { EChartsOption } from "echarts";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getGTPTooltipContainerClass, getViewportAwareTooltipLocalPosition } from "../tooltip/tooltipShared";
import { ChartWatermarkWithMetricName } from "../layout/ChartWatermark";
import { useTheme } from "next-themes";
import ChartWatermark from "@/components/layout/ChartWatermark";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import {
  clamp,
  withOpacity,
  withHexOpacity,
  escapeHtml,
  readTailwindTypographyStyle,
  formatCompactNumber,
  resolveSeriesColors,
  DEFAULT_COLORS,
  DEFAULT_GRID,
} from "@/lib/echarts-utils";
import {
  buildTimeXAxisLayout,
  enumerateTickPositions,
  createPlainLabelFormatter,
  computeVisibleXAxisLabels,
  computeSubtickPixelPositions,
  type VisibleLabel,
} from "@/lib/echarts-x-axis-layout";

const TOOLTIP_AUTO_HIDE_MS = 3000;


const DEFAULT_TOOLTIP_CONTAINER_CLASS = getGTPTooltipContainerClass(
  "fit",
  "mt-3 mr-3 mb-3 min-w-60 md:min-w-60 max-w-[min(92vw,420px)] gap-y-[2px] py-[15px] pr-[15px] bg-color-bg-default",
);

const WATERMARK_CLASS =
  "h-auto w-[145px] text-forest-300 opacity-40 mix-blend-darken dark:text-[#EAECEB] ";

// Singleton canvas context for precise text width measurement (avoids char-width heuristics)
let _measureCtx: CanvasRenderingContext2D | null | undefined;
const getMeasureCtx = () => {
  if (_measureCtx !== undefined) return _measureCtx;
  if (typeof document === "undefined") { _measureCtx = null; return null; }
  const c = document.createElement("canvas");
  _measureCtx = c.getContext("2d");
  return _measureCtx;
};

// --- Y-axis tick helpers (module-level so they can be shared by yAxisLayout and chartOption) ---

const Y_AXIS_MAX_POSITIVE_OVERSHOOT_RATIO = 1.15;
const Y_AXIS_PADDING_MULTIPLIER = 1.03;

function getNiceStep(raw: number): number {
  const safeRaw = Math.max(raw, Number.EPSILON);
  const magnitude = Math.pow(10, Math.floor(Math.log10(safeRaw)));
  const normalized = safeRaw / magnitude;
  if (normalized <= 1.5) return 1 * magnitude;
  if (normalized <= 2.25) return 2 * magnitude;
  if (normalized <= 3.75) return 2.5 * magnitude;
  if (normalized <= 7.5) return 5 * magnitude;
  return 10 * magnitude;
}

function tightenPositiveHeadroom({
  paddedPosMax,
  positiveBaseline,
  initialStep,
  minAllowedStep,
}: {
  paddedPosMax: number;
  positiveBaseline: number;
  initialStep: number;
  minAllowedStep: number;
}): { step: number; roundedPosMax: number } {
  let step = initialStep;
  let roundedPosMax = Math.ceil(paddedPosMax / step) * step;
  let previousStep = step;
  while (roundedPosMax / positiveBaseline > Y_AXIS_MAX_POSITIVE_OVERSHOOT_RATIO && step > minAllowedStep) {
    const tightenedStep = getNiceStep(step / 1.6);
    if (tightenedStep >= previousStep) break;
    previousStep = step;
    step = Math.max(tightenedStep, minAllowedStep);
    roundedPosMax = Math.ceil(paddedPosMax / step) * step;
  }
  return { step, roundedPosMax: Math.min(roundedPosMax, positiveBaseline * Y_AXIS_MAX_POSITIVE_OVERSHOOT_RATIO) };
}

function computeYAxisTicks({
  pairedSeries,
  xAxisMin,
  xAxisMax,
  containerHeight,
  percentageMode,
  stack,
  yAxisMin,
  yAxisMaxOverride,
  ySplitNumber,
}: {
  pairedSeries: { pairedData: [number, number | null][] }[];
  xAxisMin: number | undefined;
  xAxisMax: number | undefined;
  containerHeight: number;
  percentageMode: boolean;
  stack: boolean;
  yAxisMin: number;
  yAxisMaxOverride: number | undefined;
  ySplitNumber: number | undefined;
}): { computedYAxisMin: number; computedYAxisMax: number; yAxisStep: number; splitCount: number } {
  const shouldStack = stack || percentageMode;
  const splitCount = ySplitNumber ?? clamp(Math.round((containerHeight || 512) / 120), 4, 5);
  const visibleMinTs = Number.isFinite(xAxisMin) ? Number(xAxisMin) : -Infinity;
  const visibleMaxTs = Number.isFinite(xAxisMax) ? Number(xAxisMax) : Infinity;
  const isWithinVisibleRange = (ts: number) => ts >= visibleMinTs && ts <= visibleMaxTs;

  const allValues = pairedSeries.flatMap((s) =>
    s.pairedData
      .filter(([ts]) => Number.isFinite(Number(ts)) && isWithinVisibleRange(Number(ts)))
      .map((p) => p[1])
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v)),
  );

  const maxSeriesValue =
    shouldStack && pairedSeries.length > 0
      ? pairedSeries[0].pairedData.reduce((maxVal, point, index) => {
          const pointTs = Number(point[0]);
          if (!Number.isFinite(pointTs) || !isWithinVisibleRange(pointTs)) return maxVal;
          const stackedValue = pairedSeries.reduce((sum, s) => {
            const pv = s.pairedData[index]?.[1];
            return typeof pv === "number" && Number.isFinite(pv) ? sum + pv : sum;
          }, 0);
          return Math.max(maxVal, stackedValue);
        }, 0)
      : allValues.length > 0
        ? Math.max(...allValues)
        : 0;

  const minSeriesValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const hasNegativeValues = minSeriesValue < 0;

  // When ySplitNumber is set, compute a clean step that divides evenly
  // into splitCount intervals, then snap max/min to step boundaries.
  if (ySplitNumber !== undefined && !percentageMode && yAxisMaxOverride === undefined) {
    const posMax = Math.max(maxSeriesValue, 0);
    const negMin = Math.min(minSeriesValue, 0);
    const rawRange = (posMax - Math.min(negMin, yAxisMin)) * Y_AXIS_PADDING_MULTIPLIER;
    const rawStep = Math.max(rawRange, Number.EPSILON) / ySplitNumber;
    const step = getNiceStep(rawStep);

    let computedYAxisMax = posMax > 0 ? Math.ceil((posMax * Y_AXIS_PADDING_MULTIPLIER) / step) * step : 0;
    let computedYAxisMin: number;

    if (hasNegativeValues && yAxisMin === 0) {
      computedYAxisMin = Math.floor((negMin * Y_AXIS_PADDING_MULTIPLIER) / step) * step;
    } else {
      computedYAxisMin = yAxisMin;
      // Re-snap max so (max - min) is exactly divisible by step
      const totalSteps = Math.ceil((computedYAxisMax - computedYAxisMin) / step);
      computedYAxisMax = computedYAxisMin + totalSteps * step;
    }

    return { computedYAxisMin, computedYAxisMax, yAxisStep: step, splitCount };
  }

  const rawStep = Math.max(maxSeriesValue, Number.EPSILON) / splitCount;
  const absoluteStep = getNiceStep(rawStep);
  let yAxisStep = percentageMode ? 25 : absoluteStep;

  let computedYAxisMin: number;
  let computedYAxisMax: number;

  if (hasNegativeValues && yAxisMin === 0 && yAxisMaxOverride === undefined && !percentageMode) {
    const posMax = Math.max(maxSeriesValue, 0);
    const negMin = Math.min(minSeriesValue, 0);
    const totalRange = posMax - negMin;
    const rangeRawStep = totalRange / Math.max(splitCount, 1);
    const initialStep = getNiceStep(rangeRawStep);
    const minAllowedStep = getNiceStep(totalRange / Math.max(splitCount * 16, 1));
    const tightened = tightenPositiveHeadroom({
      paddedPosMax: posMax * Y_AXIS_PADDING_MULTIPLIER,
      positiveBaseline: Math.max(posMax, Number.EPSILON),
      initialStep,
      minAllowedStep,
    });
    yAxisStep = tightened.step;
    computedYAxisMax = posMax > 0 ? tightened.roundedPosMax : 0;
    computedYAxisMin = Math.floor((negMin * Y_AXIS_PADDING_MULTIPLIER) / yAxisStep) * yAxisStep;
  } else {
    computedYAxisMin = yAxisMin;
    computedYAxisMax =
      yAxisMaxOverride !== undefined
        ? yAxisMaxOverride
        : percentageMode
          ? 100
          : (() => {
              const posMax = Math.max(maxSeriesValue, 0);
              if (posMax <= 0) return 0;
              const minAllowedStep = getNiceStep(posMax / Math.max(splitCount * 16, 1));
              const tightened = tightenPositiveHeadroom({
                paddedPosMax: posMax * Y_AXIS_PADDING_MULTIPLIER,
                positiveBaseline: posMax,
                initialStep: yAxisStep,
                minAllowedStep,
              });
              yAxisStep = tightened.step;
              return tightened.roundedPosMax;
            })();
  }

  return { computedYAxisMin, computedYAxisMax, yAxisStep, splitCount };
}

// --- Public types ---

export type GTPChartSeriesType = "line" | "area" | "bar";

export interface GTPChartSeries {
  name: string;
  data: [number, number | null][];
  seriesType: GTPChartSeriesType;
  color?: string | [string, string];
  /** When set, bar values below 0 use this color instead of the primary color. */
  negativeColor?: string | [string, string];
  /** When set to 'dashed', bars render with a diagonal stripe decal over the gradient fill. */
  pattern?: "dashed";
  /** When true, line/area charts render their last visible segment as dashed. */
  dashedLastSegment?: boolean;
  /** When true, draws a dotted horizontal markLine at the series' all-time high. */
  showAllTimeHigh?: boolean;
  /** Customize the ATH label prefix; the formatted value is appended automatically. */
  allTimeHighLabel?: string;
}

export interface GTPChartTooltipParams {
  value: [number, number];
  seriesName: string;
  color?: string;
}

export type GTPChartXAxisLine = {
  xValue: number;
  annotationText?: string;
  annotationPositionX?: number;
  annotationPositionY?: number;
  lineStyle?: "Dash" | "Dashed" | "Dotted" | "Dot" | "Solid" | "dash" | "dashed" | "dotted" | "dot" | "solid";
  lineColor?: string;
  lineWidth?: number;
  textColor?: string;
  textFontSize?: number;
  backgroundColor?: string;
};

export interface GTPChartProps {
  series: GTPChartSeries[];
  stack?: boolean;
  percentageMode?: boolean;
  snapToCleanBoundary?: boolean;
  xAxisType?: "time" | "category";
  xAxisLabelFormatter?: (value: number | string) => string;
  yAxisLabelFormatter?: (value: number) => string;
  xAxisMin?: number;
  xAxisMax?: number;
  yAxisMin?: number;
  yAxisMax?: number;
  grid?: { left?: number; right?: number; top?: number; bottom?: number };
  tooltipFormatter?: (params: GTPChartTooltipParams[]) => string;
  /** Limits tooltip rows. Extra rows are collapsed into a final "(X) Others" row with summed value. */
  tooltipTitle?: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  limitTooltipRows?: number;
  showWatermark?: boolean;
  watermarkMetricName?: string | null;
  underChartText?: string | null;
  emptyStateMessage?: string;
  minHeight?: number | null;
  maxHeight?: number | null;
  animation?: boolean;
  smooth?: boolean;
  lineWidth?: number;
  areaOpacity?: number;
  barMaxWidth?: number;
  optionOverrides?: Record<string, unknown>;
  seriesOverrides?: (series: Record<string, unknown>, index: number) => Record<string, unknown>;
  height?: string | number;
  className?: string;
  xAxisLines?: GTPChartXAxisLine[];
  /** Called when the user completes a click-and-drag on the chart. Receives the x-axis values at
   *  the drag start and drag end (always xStart ≤ xEnd). */
  onDragSelect?: (xStart: number, xEnd: number) => void;
  /** Hex color used to tint the drag-selection overlay (background at 10% opacity, border at 40%). Defaults to blue. */
  dragSelectOverlayColor?: string;
  /** Icon rendered in the centre of the drag-selection overlay. */
  dragSelectIcon?: GTPIconName;
  /** Minimum number of data points that must be visible after a drag-select zoom. Defaults to 2. */
  minDragSelectPoints?: number;
  showTooltipTimestamp?: boolean;
  /** When true, appends a "Total" row at the bottom of the default tooltip showing the sum of all displayed data points. */
  showTotal?: boolean;
  /** When true, default tooltip rows are sorted from smallest value to largest value. */
  reverseTooltipOrder?: boolean;
  /** When true, renders a tighter x-axis with shorter ticks, smaller labels, and reduced bottom grid padding. */
  compactXAxis?: boolean;
  /** Overrides the auto-computed split count for y-axis ticks. Controls how many intervals the y-axis is divided into. */
  ySplitNumber?: number;
  /** When true, treats series data as 0–1 decimals and displays as 0%–100%. Caps y-axis at 100%, formats labels and tooltips as percentages. */
  decimalPercentage?: boolean;
  /** When set, all charts sharing the same syncId will display a synchronised axis pointer line on hover.
   *  Only the chart being directly hovered shows the tooltip; all others show the crosshair line only. */
  syncId?: string;
  /** When true, renders an interactive series legend overlaid at the bottom of the chart. */
  showLegend?: boolean;
  /** Optional display name overrides for legend items (key = series.name). Falls back to series.name. */
  legendLabels?: Record<string, string>;
  /** Called when the user toggles a series in the legend. Receives the series name and whether it is now active (true) or inactive (false). */
  onLegendToggle?: (seriesName: string, isActive: boolean) => void;
  /** Controlled list of inactive (hidden) series names. When provided, toggle state is managed externally and internal state is ignored. */
  legendInactiveSeries?: string[];
  /** When true, the watermark will overlap with the legend. */
  watermarkOverlap?: boolean;
}

type EChartsInstance = ReturnType<typeof echarts.init>;

// Moved to module level so it can be referenced both inside the component and in the sync registry.
type AxisPointerPayload = {
  axesInfo?: Array<{ axisDim?: string; value?: number }>;
  dataByCoordSys?: Array<{
    dataByAxis?: Array<{
      axisDim?: string;
      value?: number;
      seriesDataIndices?: Array<{
        seriesIndex?: number;
        dataIndex?: number;
        dataIndexInside?: number;
      }>;
    }>;
  }>;
};

// Registry for cross-chart axis pointer sync (one entry per mounted GTPChart with a syncId).
// The active chart propagates its snapped x-timestamp to all peers; each peer renders a plain
// CSS overlay line — no echarts.connect, no tooltip pipeline involvement, no CSS-transition jumps.
type SyncEntry = {
  setExternalCrosshairX: (x: number | null) => void;
  getTimestampPixelX: (ts: number) => number | null;
};
const syncRegistry = new Map<string, Set<SyncEntry>>();

// --- Component ---

export default function GTPChart({
  series,
  stack = false,
  percentageMode = false,
  snapToCleanBoundary = true,
  xAxisType = "time",
  xAxisMin,
  xAxisMax,
  xAxisLabelFormatter,
  yAxisLabelFormatter,
  yAxisMin = 0,
  yAxisMax: yAxisMaxOverride,
  grid: gridOverride,
  tooltipFormatter,
  tooltipTitle,
  suffix,
  prefix,
  decimals,
  limitTooltipRows,
  minHeight = null,
  maxHeight = null,
  showWatermark = true,
  watermarkMetricName = null,
  underChartText = null,
  emptyStateMessage = "",
  animation = false,
  smooth = false,
  lineWidth = 2,
  areaOpacity: areaOpacityOverride,
  barMaxWidth = 50,
  optionOverrides,
  seriesOverrides,
  height = "100%",
  className,
  xAxisLines,
  onDragSelect,
  dragSelectOverlayColor = "#3b82f6",
  dragSelectIcon,
  minDragSelectPoints = 2,
  showTooltipTimestamp = false,
  showTotal = false,
  reverseTooltipOrder = false,
  compactXAxis = false,
  ySplitNumber,
  decimalPercentage = false,
  syncId,
  showLegend = false,
  legendLabels,
  onLegendToggle,
  legendInactiveSeries: legendInactiveSeriesProp,
  watermarkOverlap = false,
}: GTPChartProps) {

  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipHostRef = useRef<HTMLDivElement | null>(null);
  const echartsRef = useRef<InstanceType<typeof ReactEChartsCore> | null>(null);
  // Stable ref to syncId so event-handler closures always read the latest value without deps.
  const syncIdRef = useRef(syncId);
  useEffect(() => { syncIdRef.current = syncId; }, [syncId]);
  // Current pixel-space axis map — kept as a ref so the sync effect can read the latest value
  // without being re-subscribed every time the chart resizes or its time range changes.
  const axisPixelMapRef = useRef<{ timestampToPixel: (ts: number) => number } | null>(null);
  // Current snapped-x extractor — ref avoids adding it to the sync effect's dep array.
  const extractSnappedXRef = useRef<((payload: AxisPointerPayload) => number | null) | null>(null);
  // DOM node for the external crosshair overlay — updated imperatively to avoid React re-renders.
  const externalCrosshairRef = useRef<HTMLDivElement | null>(null);
  const dragStartPixelRef = useRef<number | null>(null);
  const dragStartAxisXRef = useRef<number | null>(null);
  const latestAxisXRef = useRef<number | null>(null);
  const lastDragPixelRef = useRef<number | null>(null);
  const [dragOverlay, setDragOverlay] = useState<{ left: number; width: number } | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const { theme } = useTheme();

  // Legend state
  const [internalInactiveSeries, setInternalInactiveSeries] = useState<Set<string>>(new Set());
  const [hoverLegendSeries, setHoverLegendSeries] = useState<string | null>(null);
  const legendRef = useRef<HTMLDivElement>(null);

  // Resolved inactive set: controlled (prop) or uncontrolled (internal state)
  const inactiveLegendSeries = useMemo(
    () => (legendInactiveSeriesProp ? new Set(legendInactiveSeriesProp) : internalInactiveSeries),
    [legendInactiveSeriesProp, internalInactiveSeries],
  );

  const handleLegendToggle = useCallback((seriesName: string) => {
    if (legendInactiveSeriesProp !== undefined) {
      // Controlled mode: signal the parent; it is responsible for updating legendInactiveSeries
      const willBeActive = new Set(legendInactiveSeriesProp).has(seriesName);
      onLegendToggle?.(seriesName, willBeActive);
      return;
    }
    // Uncontrolled mode: flip internal state and optionally notify parent
    const willBeActive = internalInactiveSeries.has(seriesName);
    onLegendToggle?.(seriesName, willBeActive);
    setInternalInactiveSeries((prev) => {
      const next = new Set(prev);
      if (next.has(seriesName)) {
        next.delete(seriesName);
      } else {
        next.add(seriesName);
      }
      return next;
    });
  }, [legendInactiveSeriesProp, internalInactiveSeries, onLegendToggle]);

  const textPrimary = theme === "light" ? "rgb(31, 39, 38)" : "rgb(205, 216, 211)";

  const normalizedSeries = useMemo(() => {
    if (xAxisType !== "time" || series.length <= 1) {
      return series;
    }

    // Align all series to a shared timestamp domain so stacked/percentage math compares
    // values at the same x-coordinate, not just the same array index.
    const sharedTimestamps = Array.from(
      new Set(
        series.flatMap((entry) =>
          entry.data
            .map(([timestamp]) => Number(timestamp))
            .filter((timestamp) => Number.isFinite(timestamp)),
        ),
      ),
    ).sort((a, b) => a - b);

    if (sharedTimestamps.length === 0) {
      return series;
    }

    return series.map((entry) => {
      const valueByTimestamp = new Map<number, number | null>();
      entry.data.forEach(([timestamp, value]) => {
        const numericTimestamp = Number(timestamp);
        if (!Number.isFinite(numericTimestamp)) {
          return;
        }

        if (typeof value === "number" && Number.isFinite(value)) {
          valueByTimestamp.set(numericTimestamp, value);
          return;
        }

        valueByTimestamp.set(numericTimestamp, null);
      });

      return {
        ...entry,
        data: sharedTimestamps.map<[number, number | null]>((timestamp) => [
          timestamp,
          valueByTimestamp.has(timestamp) ? (valueByTimestamp.get(timestamp) ?? null) : null,
        ]),
      };
    });
  }, [series, xAxisType]);

  // Filter out legend-inactive series so the chart only renders active ones
  const chartNormalizedSeries = useMemo(
    () => showLegend && inactiveLegendSeries.size > 0
      ? normalizedSeries.filter((s) => !inactiveLegendSeries.has(s.name))
      : normalizedSeries,
    [showLegend, normalizedSeries, inactiveLegendSeries],
  );

  // Check if any series is a bar (affects x-axis boundaryGap)
  const hasBarSeries = chartNormalizedSeries.some((s) => s.seriesType === "bar");

  // Track container height for dynamic split count
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    const sync = () => {
      const rect = element.getBoundingClientRect();
      setContainerHeight(rect.height);
      setContainerWidth(rect.width);
    };

    sync();
    const frame = window.requestAnimationFrame(sync);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(element);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  // Resize when container height settles — fixes charts that mount before their container has a final height.
  useEffect(() => {
    if (containerHeight <= 0) return;
    (echartsRef.current?.getEchartsInstance?.() as EChartsInstance | undefined)?.resize();
  }, [containerHeight, minHeight, maxHeight]);

  // Typography
  const textXxsTypography = useMemo(
    () =>
      readTailwindTypographyStyle("text-xxs", {
        fontFamily: "var(--font-raleway), sans-serif",
        fontSize: 10,
        fontWeight: 500,
        lineHeight: 16,
        letterSpacing: "normal",
      }),
    [],
  );
  const textSmTypography = useMemo(
    () =>
      readTailwindTypographyStyle("text-xs", {
        fontFamily: "var(--font-raleway), sans-serif",
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 20,
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

  // Tooltip positioning
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
        hostRect: tooltipHostRef.current?.getBoundingClientRect(),
      });
    },
    [],
  );

  // Drag-select helpers
  const onDragSelectRef = useRef(onDragSelect);
  useEffect(() => { onDragSelectRef.current = onDragSelect; }, [onDragSelect]);
  const normalizedSeriesRef = useRef(normalizedSeries);
  useEffect(() => { normalizedSeriesRef.current = normalizedSeries; }, [normalizedSeries]);
  const minDragSelectPointsRef = useRef(minDragSelectPoints);
  useEffect(() => { minDragSelectPointsRef.current = minDragSelectPoints; }, [minDragSelectPoints]);

  const getSeriesPointXFromOption = useCallback((seriesIndex: number, dataIndex: number): number | null => {
    const option = (echartsRef.current?.getEchartsInstance?.() as EChartsInstance | undefined)?.getOption?.();
    const optionSeries = Array.isArray(option?.series) ? option.series[seriesIndex] : undefined;
    if (!optionSeries) return null;
    const data = (optionSeries as { data?: unknown[] }).data;
    if (!Array.isArray(data)) return null;
    const point = data[dataIndex];
    if (!point) return null;

    if (Array.isArray(point)) {
      const x = Number(point[0]);
      return Number.isFinite(x) ? x : null;
    }
    if (typeof point === "object" && point !== null && "value" in point) {
      const value = (point as { value?: unknown }).value;
      if (Array.isArray(value)) {
        const x = Number(value[0]);
        return Number.isFinite(x) ? x : null;
      }
    }
    return null;
  }, []);

  const snapToNearestDataX = useCallback((axisValue: number): number | null => {
    if (!Number.isFinite(axisValue)) return null;
    const allX = Array.from(
      new Set(
        normalizedSeriesRef.current.flatMap((s) =>
          s.data.map(([x]) => Number(x)).filter(Number.isFinite),
        ),
      ),
    ).sort((a, b) => a - b);
    if (allX.length === 0) return null;

    let lo = 0;
    let hi = allX.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (allX[mid] < axisValue) lo = mid + 1;
      else hi = mid;
    }
    if (hi === 0) return allX[0];
    const before = allX[hi - 1];
    const after = allX[hi];
    return Math.abs(axisValue - before) <= Math.abs(axisValue - after) ? before : after;
  }, []);

  const extractSnappedXFromAxisPointer = useCallback((payload: AxisPointerPayload): number | null => {
    const coordSystems = Array.isArray(payload.dataByCoordSys) ? payload.dataByCoordSys : [];
    for (const coordSys of coordSystems) {
      const axes = Array.isArray(coordSys?.dataByAxis) ? coordSys.dataByAxis : [];
      for (const axis of axes) {
        if (axis?.axisDim !== "x") continue;

        const seriesIndices = Array.isArray(axis.seriesDataIndices) ? axis.seriesDataIndices : [];
        for (const item of seriesIndices) {
          const seriesIndex = Number(item?.seriesIndex);
          const dataIndex = Number(item?.dataIndexInside ?? item?.dataIndex);
          if (!Number.isFinite(seriesIndex) || !Number.isFinite(dataIndex)) continue;
          const pointX = getSeriesPointXFromOption(seriesIndex, dataIndex);
          if (Number.isFinite(pointX)) return pointX;
        }

        const axisValue = Number(axis?.value);
        if (Number.isFinite(axisValue)) {
          const snapped = snapToNearestDataX(axisValue);
          if (Number.isFinite(snapped)) return snapped;
        }
      }
    }

    const axesInfo = Array.isArray(payload.axesInfo) ? payload.axesInfo : [];
    const xInfo = axesInfo.find((axis) => axis?.axisDim === "x");
    const xValue = Number(xInfo?.value);
    if (Number.isFinite(xValue)) {
      const snapped = snapToNearestDataX(xValue);
      if (Number.isFinite(snapped)) return snapped;
    }

    return null;
  }, [getSeriesPointXFromOption, snapToNearestDataX]);
  useEffect(() => { extractSnappedXRef.current = extractSnappedXFromAxisPointer; }, [extractSnappedXFromAxisPointer]);

  const querySnappedXAtPixel = useCallback((instance: EChartsInstance, pixelX: number): number | null => {
    const chartWidth = instance.getWidth();
    if (!Number.isFinite(chartWidth) || chartWidth <= 0) {
      return latestAxisXRef.current;
    }
    const clampedX = Math.max(0, Math.min(pixelX, chartWidth));

    const chartHeight = instance.getHeight();
    const queryY = Number.isFinite(chartHeight) ? chartHeight / 2 : NaN;
    if (!Number.isFinite(queryY)) return latestAxisXRef.current;

    let captured: number | null = null;
    const handler = (params: AxisPointerPayload) => {
      captured = extractSnappedXFromAxisPointer(params);
    };
    instance.on("updateAxisPointer", handler);
    instance.dispatchAction({
      type: "updateAxisPointer",
      currTrigger: "mousemove",
      x: clampedX,
      y: queryY,
    });
    instance.off("updateAxisPointer", handler);

    if (Number.isFinite(captured)) {
      latestAxisXRef.current = Number(captured);
    }
    return Number.isFinite(captured) ? Number(captured) : latestAxisXRef.current;
  }, [extractSnappedXFromAxisPointer]);

  useEffect(() => {
    if (!onDragSelect) return;
    let subscribedInstance: EChartsInstance | null = null;
    let axisPointerHandler: ((params: AxisPointerPayload) => void) | null = null;

    const frame = requestAnimationFrame(() => {
      const instance = (echartsRef.current?.getEchartsInstance?.() as EChartsInstance | undefined);
      if (!instance) return;

      const handler = (params: AxisPointerPayload) => {
        const snapped = extractSnappedXFromAxisPointer(params);
        if (Number.isFinite(snapped)) {
          latestAxisXRef.current = Number(snapped);
        }
      };
      subscribedInstance = instance;
      axisPointerHandler = handler;
      instance.on("updateAxisPointer", handler);
    });

    return () => {
      cancelAnimationFrame(frame);
      if (subscribedInstance && axisPointerHandler) {
        subscribedInstance.off("updateAxisPointer", axisPointerHandler);
      }
      latestAxisXRef.current = null;
    };
  }, [onDragSelect, extractSnappedXFromAxisPointer]);

  useEffect(() => {
    if (!onDragSelect) return;
    const DRAG_THRESHOLD = 4;
    let isDragging = false;
    let zr: ReturnType<EChartsInstance["getZr"]> | null = null;
    let zrDom: HTMLElement | null = null;
    let mouseUpListener: ((event: MouseEvent) => void) | null = null;
    let onMouseDownHandler: ((event: { event?: { button?: number }; offsetX?: number }) => void) | null = null;
    let onMouseMoveHandler: ((event: { offsetX?: number }) => void) | null = null;
    let onMouseUpHandler: ((event: { offsetX?: number }) => void) | null = null;
    let onGlobalOutHandler: (() => void) | null = null;

    const frame = requestAnimationFrame(() => {
      const instance = (echartsRef.current?.getEchartsInstance?.() as EChartsInstance | undefined);
      if (!instance) return;
      zr = instance.getZr();
      zrDom = (zr?.dom as HTMLElement | undefined) ?? null;
      if (!zr || !zrDom) return;

      const finalizeDrag = (rawEndPixel?: number) => {
        if (!isDragging || dragStartPixelRef.current === null) return;
        isDragging = false;

        const startPixel = dragStartPixelRef.current;
        const endPixel = Number.isFinite(rawEndPixel) ? Number(rawEndPixel) : (lastDragPixelRef.current ?? startPixel);

        dragStartPixelRef.current = null;
        lastDragPixelRef.current = null;
        setDragOverlay(null);

        if (Math.abs(endPixel - startPixel) <= DRAG_THRESHOLD) {
          dragStartAxisXRef.current = null;
          return;
        }

        const startX = Number.isFinite(dragStartAxisXRef.current)
          ? Number(dragStartAxisXRef.current)
          : querySnappedXAtPixel(instance, startPixel);
        const endX = querySnappedXAtPixel(instance, endPixel);
        dragStartAxisXRef.current = null;

        if (!onDragSelectRef.current || startX === null || endX === null) return;

        const orderedStart = Math.min(startX, endX);
        const orderedEnd = Math.max(startX, endX);

        const minPoints = minDragSelectPointsRef.current;
        if (minPoints > 1) {
          const allX = Array.from(
            new Set(
              normalizedSeriesRef.current.flatMap((s) =>
                s.data.map(([x]) => Number(x)).filter(Number.isFinite),
              ),
            ),
          ).sort((a, b) => a - b);

          if (allX.length >= minPoints) {
            const inRange = allX.filter((x) => x >= orderedStart && x <= orderedEnd);
            if (inRange.length < minPoints) return;
          }
        }

        onDragSelectRef.current(orderedStart, orderedEnd);
      };

      const onMouseDown = (event: { event?: { button?: number }; offsetX?: number }) => {
        if (event?.event?.button !== 0) return;
        const startPixel = Number(event?.offsetX);
        if (!Number.isFinite(startPixel)) return;

        isDragging = true;
        dragStartPixelRef.current = startPixel;
        lastDragPixelRef.current = startPixel;
        setDragOverlay(null);
        dragStartAxisXRef.current = querySnappedXAtPixel(instance, startPixel);
      };

      const onMouseMove = (event: { offsetX?: number }) => {
        if (!isDragging || dragStartPixelRef.current === null) return;
        const currentPixel = Number(event?.offsetX);
        if (!Number.isFinite(currentPixel)) return;

        lastDragPixelRef.current = currentPixel;
        querySnappedXAtPixel(instance, currentPixel);

        const startPixel = dragStartPixelRef.current;
        if (Math.abs(currentPixel - startPixel) > DRAG_THRESHOLD) {
          setDragOverlay({
            left: Math.min(startPixel, currentPixel),
            width: Math.abs(currentPixel - startPixel),
          });
        } else {
          setDragOverlay(null);
        }
      };

      const onMouseUp = (event: { offsetX?: number }) => {
        finalizeDrag(Number(event?.offsetX));
      };

      const onGlobalOut = () => {
        finalizeDrag(lastDragPixelRef.current ?? undefined);
      };

      zr.on("mousedown", onMouseDown);
      zr.on("mousemove", onMouseMove);
      zr.on("mouseup", onMouseUp);
      zr.on("globalout", onGlobalOut);
      onMouseDownHandler = onMouseDown;
      onMouseMoveHandler = onMouseMove;
      onMouseUpHandler = onMouseUp;
      onGlobalOutHandler = onGlobalOut;

      mouseUpListener = (event: MouseEvent) => {
        if (!isDragging || !zrDom) return;
        const rect = zrDom.getBoundingClientRect();
        finalizeDrag(event.clientX - rect.left);
      };
      document.addEventListener("mouseup", mouseUpListener);
    });

    return () => {
      cancelAnimationFrame(frame);
      if (zr) {
        if (onMouseDownHandler) zr.off("mousedown", onMouseDownHandler);
        if (onMouseMoveHandler) zr.off("mousemove", onMouseMoveHandler);
        if (onMouseUpHandler) zr.off("mouseup", onMouseUpHandler);
        if (onGlobalOutHandler) zr.off("globalout", onGlobalOutHandler);
      }
      if (mouseUpListener) {
        document.removeEventListener("mouseup", mouseUpListener);
      }
      dragStartPixelRef.current = null;
      dragStartAxisXRef.current = null;
      lastDragPixelRef.current = null;
      setDragOverlay(null);
    };
  }, [onDragSelect, querySnappedXAtPixel]);

  // Tooltip auto-hide after inactivity and mobile outside-tap dismissal
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let zr: ReturnType<EChartsInstance["getZr"]> | null = null;
    let onMoveHandler: (() => void) | null = null;

    const clearHideTimer = () => {
      if (hideTimer !== null) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const scheduleHide = () => {
      clearHideTimer();
      hideTimer = setTimeout(() => {
        const instance = echartsRef.current?.getEchartsInstance?.();
        instance?.dispatchAction({ type: "hideTip" });
      }, TOOLTIP_AUTO_HIDE_MS);
    };

    const frame = requestAnimationFrame(() => {
      const instance = echartsRef.current?.getEchartsInstance?.();
      if (!instance) return;
      zr = instance.getZr() as unknown as ReturnType<EChartsInstance["getZr"]>;
      if (!zr) return;
      onMoveHandler = scheduleHide;
      zr.on("mousemove", onMoveHandler);
    });

    const handleOutsideTap = (e: TouchEvent) => {
      if (!containerRef.current) return;
      const touch = e.touches[0] ?? e.changedTouches[0];
      if (!touch) return;
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!containerRef.current.contains(target)) {
        clearHideTimer();
        const instance = echartsRef.current?.getEchartsInstance?.();
        instance?.dispatchAction({ type: "hideTip" });
      }
    };

    document.addEventListener("touchstart", handleOutsideTap, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      clearHideTimer();
      document.removeEventListener("touchstart", handleOutsideTap);
      if (zr && onMoveHandler) {
        zr.off("mousemove", onMoveHandler);
      }
    };
  }, []);

  // Cross-chart axis pointer sync — no echarts.connect, no tooltip pipeline involvement.
  //
  // Strategy:
  //  • Each chart registers a SyncEntry in the module-level syncRegistry.
  //  • When the user hovers a chart, that chart's ECharts `updateAxisPointer` event fires with
  //    the already-snapped x timestamp.  We forward it to all peer charts via their
  //    `getTimestampPixelX` → `setExternalCrosshairX` pair, which imperatively updates a plain
  //    <div> overlay — zero React re-renders, zero CSS-transition artifacts.
  //  • On `globalout` we clear all peer overlays.
  //  • This chart's own ECharts native axis pointer is untouched.
  useEffect(() => {
    if (!syncId) return;

    // Build and register the sync entry for this chart.
    const syncEntry: SyncEntry = {
      setExternalCrosshairX: (x) => {
        const el = externalCrosshairRef.current;
        if (!el) return;
        if (x === null) {
          el.style.display = "none";
        } else {
          el.style.display = "block";
          el.style.left = `${x}px`;
        }
      },
      getTimestampPixelX: (ts) => {
        const map = axisPixelMapRef.current;
        if (!map) return null;
        const px = map.timestampToPixel(ts);
        return Number.isFinite(px) ? px : null;
      },
    };

    if (!syncRegistry.has(syncId)) syncRegistry.set(syncId, new Set());
    syncRegistry.get(syncId)!.add(syncEntry);

    let zr: ReturnType<EChartsInstance["getZr"]> | null = null;
    let subscribedInstance: EChartsInstance | null = null;
    let onMouseMoveHandler: (() => void) | null = null;
    let onGlobalOutHandler: (() => void) | null = null;
    let updateAxisPointerHandler: ((params: AxisPointerPayload) => void) | null = null;

    const frame = requestAnimationFrame(() => {
      const instance = echartsRef.current?.getEchartsInstance?.() as EChartsInstance | undefined;
      if (!instance) return;

      subscribedInstance = instance;
      zr = instance.getZr() as unknown as ReturnType<EChartsInstance["getZr"]>;

      // ZRender mousemove only fires on the chart under the pointer (not on peers).
      // Hide our own external crosshair while the user is directly hovering this chart
      // (the native ECharts axis pointer already handles it).
      onMouseMoveHandler = () => {
        syncEntry.setExternalCrosshairX(null);
      };

      // updateAxisPointer fires with the snapped x value whenever the axis pointer moves.
      // Forward that timestamp to all peer charts as a pixel-x overlay position.
      updateAxisPointerHandler = (params: AxisPointerPayload) => {
        const snapped = extractSnappedXRef.current?.(params);
        if (!Number.isFinite(snapped)) return;
        syncRegistry.get(syncId)?.forEach((entry) => {
          if (entry === syncEntry) return;
          entry.setExternalCrosshairX(entry.getTimestampPixelX(snapped!));
        });
      };

      onGlobalOutHandler = () => {
        // Clear all peer crosshair overlays when the mouse leaves this chart.
        syncRegistry.get(syncId)?.forEach((entry) => {
          if (entry !== syncEntry) entry.setExternalCrosshairX(null);
        });
      };

      zr.on("mousemove", onMouseMoveHandler);
      instance.on("updateAxisPointer", updateAxisPointerHandler);
      instance.on("globalout", onGlobalOutHandler);
    });

    return () => {
      cancelAnimationFrame(frame);
      syncRegistry.get(syncId)?.delete(syncEntry);
      if (syncRegistry.get(syncId)?.size === 0) syncRegistry.delete(syncId);
      if (zr && onMouseMoveHandler) zr.off("mousemove", onMouseMoveHandler);
      if (subscribedInstance) {
        if (updateAxisPointerHandler) subscribedInstance.off("updateAxisPointer", updateAxisPointerHandler);
        if (onGlobalOutHandler) subscribedInstance.off("globalout", onGlobalOutHandler);
      }
      // Clear any residual crosshair on peers when this chart unmounts.
      syncRegistry.get(syncId)?.forEach((entry) => entry.setExternalCrosshairX(null));
    };
  }, [syncId]);

  // Apply percentage mode transformation if needed
  const pairedSeries = useMemo(() => {
    return chartNormalizedSeries.map((s) => {
      let paired: [number, number | null][] = s.data;

      // Percentage mode transformation
      if (percentageMode) {
        paired = paired.map<[number, number | null]>(([x, value], i) => {
          if (value === null || !Number.isFinite(value)) return [x, null];
          const total = chartNormalizedSeries.reduce((sum, other) => {
            const otherY = other.data[i]?.[1] ?? null;
            return typeof otherY === "number" && Number.isFinite(otherY) ? sum + otherY : sum;
          }, 0);
          return [x, total > 0 ? (value / total) * 100 : null];
        });
      }

      return { ...s, pairedData: paired };
    });
  }, [chartNormalizedSeries, percentageMode]);

  const formatDefaultYAxisTick = useCallback(
    (value: number) => {
      if (percentageMode) return `${Math.round(value)}%`;
      if (decimalPercentage) {
        const pct = value * 100;
        return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
      }
      return `${prefix ?? ""}${formatCompactNumber(value, decimals)}${suffix ?? ""}`;
    },
    [decimals, percentageMode, decimalPercentage, prefix, suffix],
  );

  // Compute the actual rendered x-axis bounds before yAxisLayout so the y-max
  // calculation accounts for data in the expanded range (clean-boundary snap
  // can pull effectiveXMin earlier than the raw xAxisMin prop; bar padding can
  // extend effectiveXMax beyond xAxisMax). A dummy grid is fine here because
  // buildTimeXAxisLayout's min/max output does not depend on the grid argument.
  const effectiveXBounds = useMemo(() => {
    if (xAxisType !== "time") return { min: xAxisMin, max: xAxisMax };
    const allTs = pairedSeries.flatMap((s) =>
      s.pairedData.map((p) => Number(p[0])).filter(Number.isFinite),
    );
    const barData = pairedSeries
      .filter((s) => s.seriesType === "bar")
      .map((s) => s.pairedData);
    const layout = buildTimeXAxisLayout({
      timestamps: allTs,
      barSeriesData: barData,
      xAxisMin,
      xAxisMax,
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      snapToCleanBoundary,
    });
    return { min: layout.min, max: layout.max };
  }, [pairedSeries, xAxisType, xAxisMin, xAxisMax, snapToCleanBoundary]);

  // --- Y-axis tick layout (shared by dynamicGridLeft and chartOption) ---
  const effectiveYMaxOverride = decimalPercentage && yAxisMaxOverride === undefined ? 1 : yAxisMaxOverride;
  const yAxisLayout = useMemo(
    () =>
      computeYAxisTicks({
        pairedSeries,
        xAxisMin: effectiveXBounds.min,
        xAxisMax: effectiveXBounds.max,
        containerHeight,
        percentageMode,
        stack,
        yAxisMin,
        yAxisMaxOverride: effectiveYMaxOverride,
        ySplitNumber,
      }),
    [pairedSeries, effectiveXBounds, containerHeight, percentageMode, stack, yAxisMin, effectiveYMaxOverride, ySplitNumber],
  );

  // --- Dynamic grid.left based on measured y-axis label widths ---
  const dynamicGridLeft = useMemo(() => {
    if (gridOverride?.left !== undefined) return gridOverride.left;

    const { computedYAxisMin, computedYAxisMax, yAxisStep, splitCount } = yAxisLayout;
    const tickCount = splitCount + 1;
    const step = yAxisStep > 0 ? yAxisStep : Math.max((computedYAxisMax - computedYAxisMin) / splitCount, Number.EPSILON);

    const ticks: number[] = [];
    for (let i = 0; i < tickCount; i++) {
      const v = computedYAxisMin + i * step;
      if (v > computedYAxisMax + step * 0.01) break;
      ticks.push(v);
    }
    // Always include the max tick
    if (ticks[ticks.length - 1] < computedYAxisMax) ticks.push(computedYAxisMax);

    const labels = ticks.map((v) =>
      yAxisLabelFormatter ? yAxisLabelFormatter(v) : formatDefaultYAxisTick(v),
    );

    const ctx = getMeasureCtx();
    const font = `500 10px Fira Sans, sans-serif`;
    const maxLabelWidth = labels.reduce((max, label) => {
      let w: number;
      if (ctx) {
        ctx.font = font;
        w = ctx.measureText(label).width;
      } else {
        w = label.length * 6;
      }
      return Math.max(max, w);
    }, 0);

    // 6px left margin inside the grid + 8px gap between label and axis line
    return Math.ceil(maxLabelWidth) + 14;
  }, [formatDefaultYAxisTick, gridOverride, yAxisLayout, yAxisLabelFormatter]);

  // --- X-axis layout (extracted so both chartOption and the label overlay can use it) ---
  const timeAxisLayout = useMemo(() => {
    if (xAxisType !== "time") return undefined;
    const allTs = pairedSeries.flatMap((s) =>
      s.pairedData.map((p) => Number(p[0])).filter(Number.isFinite),
    );
    const barData = pairedSeries.filter((s) => s.seriesType === "bar").map((s) => s.pairedData);
    const g = {
      left: dynamicGridLeft,
      right: gridOverride?.right ?? DEFAULT_GRID.right,
      top: gridOverride?.top ?? DEFAULT_GRID.top,
      bottom: gridOverride?.bottom ?? DEFAULT_GRID.bottom,
    };
    return buildTimeXAxisLayout({
      timestamps: allTs,
      barSeriesData: barData,
      xAxisMin,
      xAxisMax,
      grid: g,
      snapToCleanBoundary,
    });
  }, [pairedSeries, xAxisType, gridOverride, xAxisMin, xAxisMax, snapToCleanBoundary, dynamicGridLeft]);

  const effectiveGrid = useMemo(() => {
    const defaultBottom = compactXAxis ? 24 : DEFAULT_GRID.bottom;
    const resolvedBottom = gridOverride?.bottom ?? defaultBottom;
    const base = {
      left: dynamicGridLeft,
      right: gridOverride?.right ?? DEFAULT_GRID.right,
      top: gridOverride?.top ?? DEFAULT_GRID.top,
      bottom: resolvedBottom,
    };
    if (!timeAxisLayout?.grid) return base;
    return compactXAxis
      ? { ...timeAxisLayout.grid, bottom: resolvedBottom }
      : timeAxisLayout.grid;
  }, [dynamicGridLeft, gridOverride, timeAxisLayout, compactXAxis]);

  const effectiveXMin = xAxisType === "time" ? timeAxisLayout?.min : xAxisMin;
  const effectiveXMax = xAxisType === "time" ? timeAxisLayout?.max : xAxisMax;

  // --- Shared pixel mapper for overlay labels and subticks ---
  const axisPixelMap = useMemo(() => {
    const aMin = Number.isFinite(Number(effectiveXMin)) ? Number(effectiveXMin) : NaN;
    const aMax = Number.isFinite(Number(effectiveXMax)) ? Number(effectiveXMax) : NaN;
    if (!Number.isFinite(aMin) || !Number.isFinite(aMax) || aMax <= aMin) return null;

    const plotLeft = effectiveGrid.left;
    const plotWidth = Math.round(containerWidth) - effectiveGrid.left - effectiveGrid.right;
    if (plotWidth <= 0) return null;

    const axisRange = aMax - aMin;
    const timestampToPixel = (ts: number): number => plotLeft + ((ts - aMin) / axisRange) * plotWidth;

    return { aMin, aMax, plotLeft, plotWidth, timestampToPixel };
  }, [effectiveXMin, effectiveXMax, effectiveGrid, containerWidth]);
  useEffect(() => { axisPixelMapRef.current = axisPixelMap ?? null; }, [axisPixelMap]);

  // --- Custom x-axis label overlay ---
  const overlayLabels = useMemo<VisibleLabel[]>(() => {
    if (xAxisType !== "time" || !timeAxisLayout || !axisPixelMap) return [];
    const { firstTick, lastTick, minInterval, rangeDays } = timeAxisLayout;
    if (firstTick === undefined || lastTick === undefined) return [];

    const ticks = enumerateTickPositions(firstTick, lastTick, minInterval, axisPixelMap.aMax);

    const formatter = xAxisLabelFormatter
      ? ((ts: number, _isFirst: boolean) => ({ text: (xAxisLabelFormatter as (v: number) => string)(ts), isBold: false }))
      : createPlainLabelFormatter(rangeDays);

    const measureText = (text: string, isBold: boolean): number => {
      const ctx = getMeasureCtx();
      if (ctx) {
        ctx.font = isBold
          ? `bold ${textSmTypography.fontSize}px ${textSmTypography.fontFamily}`
          : `${textXxsTypography.fontWeight} ${textXxsTypography.fontSize}px ${textXxsTypography.fontFamily}`;
        return ctx.measureText(text).width + 2;
      }
      return text.length * (isBold ? 7.5 : 5.5) + 4;
    };

    return computeVisibleXAxisLabels({
      ticks, containerWidth, labelFormatter: formatter, measureText, timestampToPixel: axisPixelMap.timestampToPixel, minGap: 16,
    });
  }, [xAxisType, timeAxisLayout, axisPixelMap, containerWidth, textSmTypography, textXxsTypography, xAxisLabelFormatter]);

  // --- Subtick positions (unlabeled intermediate tick marks) ---
  const subtickPixels = useMemo<number[]>(() => {
    if (xAxisType !== "time" || !timeAxisLayout || !axisPixelMap || overlayLabels.length === 0) return [];

    const labeledTimestamps = new Set(overlayLabels.map((l) => l.timestamp));
    return computeSubtickPixelPositions({
      mainIntervalMs: timeAxisLayout.minInterval,
      axisMin: axisPixelMap.aMin,
      axisMax: axisPixelMap.aMax,
      plotLeft: axisPixelMap.plotLeft,
      plotWidth: axisPixelMap.plotWidth,
      labeledTimestamps,
      timestampToPixel: axisPixelMap.timestampToPixel,
    });
  }, [xAxisType, timeAxisLayout, axisPixelMap, overlayLabels]);

  // Build ECharts option
  const chartOption = useMemo<EChartsOption>(() => {
    const shouldStack = stack || percentageMode;

    // Y-axis tick values come from the shared yAxisLayout memo
    const { computedYAxisMin, computedYAxisMax, yAxisStep, splitCount } = yAxisLayout;

    // Sort series for percentage mode (ascending by last value so smallest is on top)
    const sortedSeries = percentageMode
      ? [...pairedSeries].sort((a, b) => {
          const aLast = [...a.pairedData].reverse().find((p) => typeof p[1] === "number")?.[1] ?? 0;
          const bLast = [...b.pairedData].reverse().find((p) => typeof p[1] === "number")?.[1] ?? 0;
          return (aLast ?? 0) - (bLast ?? 0);
        })
      : pairedSeries;

    const defaultAreaOpacity = shouldStack ? 0.36 : 0.22;
    const resolvedAreaOpacity = areaOpacityOverride ?? defaultAreaOpacity;

    const resolvedXAxisLines = (xAxisLines ?? []).filter((line) => Number.isFinite(line.xValue));
    const mapLineStyle = (lineStyle?: GTPChartXAxisLine["lineStyle"]) => {
      const normalized = lineStyle?.toLowerCase();
      if (normalized === "dash" || normalized === "dashed") return "dashed";
      if (normalized === "dot" || normalized === "dotted") return "dotted";
      if (normalized === "solid") return "solid";
      return "solid";
    };
    const formatTooltipValue = (value: number) => {
      if (percentageMode) return `${value.toFixed(1)}%`;
      if (decimalPercentage) return `${(value * 100).toFixed(1)}%`;
      const resolvedPrefix = prefix ?? "";
      const resolvedSuffix = suffix ?? "";
      const resolvedDecimals =
        typeof decimals === "number" && Number.isFinite(decimals)
          ? Math.max(0, Math.floor(decimals))
          : 2;

      if (
        resolvedPrefix === "$" &&
        resolvedSuffix.trim().length === 0 &&
        resolvedDecimals >= 4 &&
        Number.isFinite(value) &&
        value > 0
      ) {
        const threshold = 10 ** -resolvedDecimals;
        if (value < threshold) {
          return `< $${threshold.toFixed(resolvedDecimals)}`;
        }
      }

      return `${prefix ?? ""}${formatCompactNumber(value, decimals)}${suffix ?? ""}`;
    };
    const measureAthLabelWidth = (labelText: string) => {
      const ctx = getMeasureCtx();
      if (ctx) {
        ctx.font = `${numbersXxsTypography.fontWeight} ${numbersXxsTypography.fontSize}px ${numbersXxsTypography.fontFamily}`;
        return ctx.measureText(labelText).width + 24;
      }
      return labelText.length * 7 + 24;
    };
    const getAthLabelOffsetX = (labelText: string, timestamp: number) => {
      if (!axisPixelMap) return 0;
      const anchorX = axisPixelMap.timestampToPixel(timestamp);
      if (!Number.isFinite(anchorX)) return 0;

      const plotLeft = axisPixelMap.plotLeft;
      const plotRight = axisPixelMap.plotLeft + axisPixelMap.plotWidth;
      const labelHalfWidth = measureAthLabelWidth(labelText) / 2;
      const edgePadding = 8;
      const minCenterX = plotLeft + labelHalfWidth + edgePadding;
      const maxCenterX = plotRight - labelHalfWidth - edgePadding;

      if (!Number.isFinite(minCenterX) || !Number.isFinite(maxCenterX) || maxCenterX <= minCenterX) {
        return 0;
      }

      const clampedCenterX = clamp(anchorX, minCenterX, maxCenterX);
      return Math.round(clampedCenterX - anchorX);
    };

    // Build series configs — each series determines its own type
    const echartsSeriesConfigs = sortedSeries.flatMap((s, index) => {
      const fallbackColor = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
      const [primary, secondary] = resolveSeriesColors(s.color, fallbackColor);
      const type = s.seriesType;

      let config: Record<string, unknown> = {
        name: s.name,
        data: s.pairedData,
        stack: shouldStack ? "total" : undefined,
        smooth,
      };

      if (type === "line" || type === "area") {
        config.type = "line";
        config.lineStyle = { width: lineWidth, color: primary };

        // Hover halo — invisible symbols normally, visible circle on emphasis
        config.symbol = "circle";
        config.symbolSize = 8;
        config.showSymbol = true;
        config.itemStyle = { color: "transparent", borderWidth: 0 };
        config.emphasis = {
          symbolSize: 8,
          symbol: "circle",
          itemStyle: {
            color: withHexOpacity(secondary, 0.5),
            borderWidth: 0,
            shadowBlur: 0,
          },
        };

        if (type === "area") {
          config.areaStyle = {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: withHexOpacity(primary, resolvedAreaOpacity) },
              { offset: 1, color: withHexOpacity(secondary, 0.04) },
            ]),
          };
        }
      } else {
        // Bar
        config.type = "bar";
        config.clip = true;
        config.barMaxWidth = barMaxWidth;

        const posGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: withHexOpacity(primary, 0.85) },
          { offset: 0.5, color: withHexOpacity(primary, 0.6) },
          { offset: 1, color: withHexOpacity(primary, 0.15) },
        ]);
        const posGradientEmphasis = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: withHexOpacity(primary, 1.0) },
          { offset: 1, color: withHexOpacity(secondary, 0.5) },
        ]);

        const decal = s.pattern === "dashed"
          ? {
              symbol: "rect" as const,
              symbolSize: 0.7,
              color: withHexOpacity(primary, 1.0),
              backgroundColor: "transparent",
              dashArrayX: [1, 0] as [number, number],
              dashArrayY: [2, 5] as [number, number],
              rotation: Math.PI / 4,
            }
          : undefined;

        // Filter to the visible axis range so bars from long-history series (e.g. Ethereum
        // from 2020) don't appear clipped at the edge when the selected window is short.
        const barTsMin = Number.isFinite(effectiveXMin) ? Number(effectiveXMin) : -Infinity;
        const barTsMax = Number.isFinite(effectiveXMax) ? Number(effectiveXMax) : Infinity;
        const visibleBarData = s.pairedData.filter((p) => {
          const ts = Number(p[0]);
          return Number.isFinite(ts) && ts >= barTsMin && ts <= barTsMax;
        });
        const lastIdx = visibleBarData.length - 1;

        // Zone-based coloring: if negativeColor is set, apply per-data-point styles
        if (s.negativeColor) {
          const [negPrimary, negSecondary] = resolveSeriesColors(s.negativeColor, primary);
          const negGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: withHexOpacity(negPrimary, 1.0) },
            { offset: 1, color: withHexOpacity(negSecondary, 1.0) },
          ]);
          const negGradientEmphasis = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: withHexOpacity(negPrimary, 1.0) },
            { offset: 1, color: withHexOpacity(negSecondary, 0.7) },
          ]);

          config.data = visibleBarData.map((point, idx) => {
            const yVal = point[1];
            const isNeg = typeof yVal === "number" && yVal < 0;
            const applyPattern = s.pattern === "dashed" && idx === lastIdx;
            return {
              value: point,
              itemStyle: {
                color: applyPattern ? "transparent" : (isNeg ? negGradient : posGradient),
                decal: applyPattern ? decal : undefined,
              },
              emphasis: {
                itemStyle: applyPattern
                  ? { color: "transparent", shadowBlur: 12, shadowColor: withHexOpacity(isNeg ? negPrimary : primary, 0.5) }
                  : { color: isNeg ? negGradientEmphasis : posGradientEmphasis },
              },
            };
          });
          config.itemStyle = { color: posGradient };
        } else if (s.pattern === "dashed") {
          config.data = visibleBarData.map((point, idx) => {
            const isLast = idx === lastIdx;
            return {
              value: point,
              itemStyle: {
                color: isLast ? "transparent" : posGradient,
                decal: isLast ? decal : undefined,
              },
              emphasis: {
                itemStyle: isLast
                  ? { color: "transparent", shadowBlur: 12, shadowColor: withHexOpacity(primary, 0.5) }
                  : { color: posGradientEmphasis },
              },
            };
          });
          config.itemStyle = { color: posGradient };
        } else {
          config.itemStyle = { color: posGradient };
          config.emphasis = { itemStyle: { color: posGradientEmphasis } };
        }
      }

      const markLineData: unknown[] = [];
      let athMarkPointData:
        | {
            coord: [number, number];
            symbolSize: number;
            tooltip: { show: false };
            itemStyle: { color: string };
            label: Record<string, unknown>;
          }
        | null = null;

      if (s.showAllTimeHigh) {
        const allPoints = s.pairedData.filter((point): point is [number, number] => {
          const ts = Number(point[0]);
          const value = point[1];
          if (!Number.isFinite(ts)) return false;
          return typeof value === "number" && Number.isFinite(value);
        });

        const athPoint = allPoints.reduce<[number, number] | null>((current, [timestamp, value]) => {
          if (!current) return [timestamp, value];
          if (value > current[1]) return [timestamp, value];
          if (value === current[1] && timestamp > current[0]) return [timestamp, value];
          return current;
        }, null);

        if (athPoint) {
          const [lineColor] = resolveSeriesColors(s.color, fallbackColor);
          const [athTimestamp, athValue] = athPoint;
          const isAthVisible =
            (!Number.isFinite(effectiveXMin) || athTimestamp >= Number(effectiveXMin)) &&
            (!Number.isFinite(effectiveXMax) || athTimestamp <= Number(effectiveXMax));

          if (isAthVisible) {
            const lineStartTimestamp = Number.isFinite(effectiveXMin)
              ? Number(effectiveXMin)
              : allPoints[0]?.[0] ?? athTimestamp;
            const athLabelPrefix = s.allTimeHighLabel?.trim();
            const formattedAthValue = formatTooltipValue(athValue);
            const athLabelText = athLabelPrefix
              ? `${athLabelPrefix} ${formattedAthValue}`
              : formattedAthValue;
            const athLabelOffsetX = getAthLabelOffsetX(athLabelText, athTimestamp);

            markLineData.push([
              {
                coord: [lineStartTimestamp, athValue],
                symbol: "none",
              },
              {
                coord: [athTimestamp, athValue],
                symbol: "none",
                lineStyle: {
                  type: "dashed",
                  color: withOpacity(lineColor, 0.45),
                  opacity: 0.45,
                  width: 1,
                },
                label: { show: false },
              },
            ]);

            athMarkPointData = {
              coord: [athTimestamp, athValue],
              symbolSize: 0,
              tooltip: { show: false },
              itemStyle: { color: "transparent" },
              label: {
                show: true,
                formatter: athLabelText,
                position: "top",
                distance: 6,
                offset: [athLabelOffsetX, 2],
                align: "center",
                padding: [3, 6, 2, 6],
                borderRadius: 999,
                backgroundColor: lineColor.startsWith("#")
                  ? withHexOpacity(lineColor, 0.66)
                  : withOpacity(lineColor, 0.66),
                fontSize: numbersXxsTypography.fontSize,
                fontFamily: numbersXxsTypography.fontFamily,
                lineHeight: numbersXxsTypography.lineHeight,
                fontWeight: "medium",
                color: textPrimary,
                opacity: 1,
              },
            };
          }
        }
      }

      if (index === 0 && resolvedXAxisLines.length > 0) {
        markLineData.push(
          ...resolvedXAxisLines.map((line) => ({
            xAxis: line.xValue,
            lineStyle: {
              color: line.lineColor ?? withOpacity(textPrimary, 0.7),
              width: line.lineWidth ?? 1,
              type: mapLineStyle(line.lineStyle),
            },
            label: line.annotationText
              ? {
                  show: true,
                  formatter: line.annotationText,
                  position: "insideEndTop",
                  rotate: 0,
                  distance: -8,
                  align: "left",
                  verticalAlign: "middle",
                  color: line.textColor ?? textPrimary,
                  fontSize: line.textFontSize ?? 9,
                  fontFamily: "var(--font-raleway), sans-serif",
                  fontWeight: 500,
                  textStyle: {
                    color: line.textColor ?? textPrimary,
                    fontSize: line.textFontSize ?? 9,
                    fontFamily: "var(--font-raleway), sans-serif",
                    fontWeight: 500,
                  },
                  backgroundColor: line.backgroundColor ?? "transparent",
                  padding: [2, 6],
                  offset: [line.annotationPositionX ?? 0, line.annotationPositionY ?? 0],
                }
              : { show: false },
          })),
        );
      }

      if (markLineData.length > 0) {
        config.markLine = {
          silent: true,
          symbol: ["none", "none"],
          label: {
            show: false,
            position: "insideEndTop",
            rotate: 0,
            fontFamily: "var(--font-raleway), sans-serif",
            fontWeight: 500,
            textStyle: {
              fontFamily: "var(--font-raleway), sans-serif",
              fontWeight: 500,
            },
          },
          labelLayout: {
            hideOverlap: false,
          },
          data: markLineData,
        };
      }

      if (athMarkPointData) {
        config.markPoint = {
          silent: true,
          symbol: "circle",
          symbolSize: 0,
          tooltip: { show: false },
          data: [athMarkPointData],
        };
      }

      if (seriesOverrides) {
        config = seriesOverrides(config, index);
      }

      const shouldRenderDashedTail =
        Boolean(s.dashedLastSegment) &&
        (type === "line" || type === "area") &&
        xAxisType === "time";

      if (!shouldRenderDashedTail) {
        return [config];
      }

      const lineTsMin = Number.isFinite(effectiveXMin) ? Number(effectiveXMin) : -Infinity;
      const lineTsMax = Number.isFinite(effectiveXMax) ? Number(effectiveXMax) : Infinity;
      const visibleValueIndexes = s.pairedData
        .map((point, pointIndex) => {
          const ts = Number(point[0]);
          const value = point[1];
          if (!Number.isFinite(ts) || ts < lineTsMin || ts > lineTsMax) return -1;
          if (typeof value !== "number" || !Number.isFinite(value)) return -1;
          return pointIndex;
        })
        .filter((pointIndex) => pointIndex >= 0);

      if (visibleValueIndexes.length < 2) {
        return [config];
      }

      const lastVisibleIdx = visibleValueIndexes[visibleValueIndexes.length - 1];
      const secondLastVisibleIdx = visibleValueIndexes[visibleValueIndexes.length - 2];
      if (lastVisibleIdx - secondLastVisibleIdx !== 1) {
        return [config];
      }

      const secondLastPoint = s.pairedData[secondLastVisibleIdx];
      const lastPoint = s.pairedData[lastVisibleIdx];
      if (!secondLastPoint || !lastPoint) {
        return [config];
      }

      const secondLastValue = secondLastPoint[1];
      const lastValue = lastPoint[1];
      if (
        typeof secondLastValue !== "number" ||
        !Number.isFinite(secondLastValue) ||
        typeof lastValue !== "number" ||
        !Number.isFinite(lastValue)
      ) {
        return [config];
      }

      const solidData = s.pairedData.map<[number, number | null]>((point, pointIdx) =>
        pointIdx === lastVisibleIdx ? [point[0], null] : point,
      );
      const solidConfig = {
        ...config,
        data: solidData,
      };
      const dashedTailConfig: Record<string, unknown> = {
        ...config,
        data: [
          {
            value: [secondLastPoint[0], secondLastValue],
            symbolSize: 0,
            tooltip: { show: false },
          },
          {
            value: [lastPoint[0], lastValue],
          },
        ],
        areaStyle: undefined,
        stack: undefined,
        symbol: "circle",
        symbolSize: 8,
        showSymbol: true,
        lineStyle: {
          width: lineWidth,
          color: primary,
          type: "dashed",
        },
        itemStyle: { color: "transparent", borderWidth: 0 },
        emphasis: {
          symbolSize: 8,
          symbol: "circle",
          itemStyle: {
            color: withHexOpacity(secondary, 0.5),
            borderWidth: 0,
            shadowBlur: 0,
          },
        },
      };

      return [solidConfig, dashedTailConfig];
    });

    // Default tooltip formatter
    const defaultTooltipFormatter = (params: unknown) => {
      const points = Array.isArray(params) ? params : [params];
      const validPoints = points
        .filter(Boolean)
        .map((p) => p as { value: [number, number | string | null]; seriesName: string; color?: string })
        .filter((p) => {
          const v = Number(p.value?.[1]);
          return Number.isFinite(v) && Math.abs(v) > 0;
        }) as Array<{ value: [number, number]; seriesName: string; color?: string }>;

      if (validPoints.length === 0) return "";

      const timestamp = validPoints[0].value[0];
      const dateLabel = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(timestamp);

      const timeLabel = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "UTC",
      }).format(timestamp);

      const sortedPoints = validPoints
        .map((p) => ({ ...p, numericValue: Number(p.value[1]) }))
        .sort((a, b) =>
          reverseTooltipOrder
            ? a.numericValue - b.numericValue
            : b.numericValue - a.numericValue,
        );
      const dedupedSortedPoints = sortedPoints.filter(
        (point, pointIdx, collection) =>
          collection.findIndex((candidate) => candidate.seriesName === point.seriesName) === pointIdx,
      );
      type TooltipDisplayPoint = {
        value: [number, number];
        seriesName: string;
        color?: string;
        numericValue: number;
        showUpToPrefix?: boolean;
      };

      const resolvedTooltipRowLimit =
        typeof limitTooltipRows === "number" && Number.isFinite(limitTooltipRows)
          ? Math.max(1, Math.floor(limitTooltipRows))
          : undefined;

      let displayPoints: TooltipDisplayPoint[] = dedupedSortedPoints;
      if (resolvedTooltipRowLimit !== undefined && dedupedSortedPoints.length > resolvedTooltipRowLimit) {
        const visiblePointCount = Math.max(0, resolvedTooltipRowLimit - 1);
        const visiblePoints = dedupedSortedPoints.slice(0, visiblePointCount);
        const overflowPoints = dedupedSortedPoints.slice(visiblePointCount);
        const overflowValue = reverseTooltipOrder
          ? overflowPoints.reduce(
              (maxValue, point) => Math.max(maxValue, point.numericValue),
              Number.NEGATIVE_INFINITY,
            )
          : overflowPoints.reduce((sum, point) => sum + point.numericValue, 0);
        const othersColor = withOpacity(textPrimary, 0.55);

        displayPoints = [
          ...visiblePoints,
          {
            value: [timestamp, overflowValue] as [number, number],
            seriesName: `${overflowPoints.length} Others`,
            color: othersColor,
            numericValue: overflowValue,
            showUpToPrefix: reverseTooltipOrder,
          },
        ];
      }

      const maxTooltipValue = Math.max(...displayPoints.map((p) => Math.abs(p.numericValue)), 0);

      if (tooltipFormatter) {
        return tooltipFormatter(
          displayPoints.map((p) => ({
            value: p.value,
            seriesName: p.seriesName,
            color: p.color,
          })),
        );
      }

      const rows = displayPoints
        .map((point) => {
          const v = point.numericValue;
          if (!Number.isFinite(v)) return "";
          const meta = normalizedSeries.find((s) => s.name === point.seriesName);
          const [lineColor] = resolveSeriesColors(meta?.color, point.color ?? textPrimary);
          const formattedValue = formatTooltipValue(v);
          const valueWithPrefix = point.showUpToPrefix
            ? `<span class="font-bold">Up to&nbsp;</span>${formattedValue}`
            : formattedValue;
          const barWidth = maxTooltipValue > 0 ? clamp((Math.abs(v) / maxTooltipValue) * 100, 0, 100) : 0;

          return `
            <div class="flex w-full space-x-1.5 items-center font-medium leading-tight">
              <div class="w-[15px] h-[10px] rounded-r-full" style="background-color:${lineColor}"></div>
              <div class="tooltip-point-name text-xs">${escapeHtml(point.seriesName)}</div>
              <div class="flex-1 text-right justify-end flex numbers-xs">${valueWithPrefix}</div>
            </div>
            <div class="ml-[18px] mr-[1px] h-[2px] relative mb-[2px] overflow-hidden">
              <div class="h-[2px] rounded-none absolute right-0 top-0" style="width:${barWidth}%; background-color:${lineColor}"></div>
            </div>
          `;
        })
        .join("");

      const totalRow = (() => {
        if (!showTotal) return "";
        const total = dedupedSortedPoints.reduce((sum, p) => sum + p.numericValue, 0);
        const formattedTotal = percentageMode ? `${total.toFixed(1)}%` : formatCompactNumber(total, decimals);
        const prefixStd = percentageMode ? "" : (prefix ?? "");
        const suffixStd = percentageMode ? "" : (suffix ?? "");
        return `
          <div class="flex w-full space-x-1.5 items-center font-bold leading-tight pt-[0px]">
            <div class="w-[15px] h-[10px]"></div>
            <div class="tooltip-point-name heading-small-xxs">Total:</div>
            <div class="flex-1 text-right justify-end flex numbers-xs">${prefixStd}${formattedTotal}${suffixStd}</div>
          </div>
        `;
      })();

      return `
        <div class="${DEFAULT_TOOLTIP_CONTAINER_CLASS}">
          <div class="flex-1 flex ${showTooltipTimestamp ? "items-start" : "items-center"}  justify-between font-bold text-[13px] md:text-[1rem] ml-[18px] mb-1">

            <div class="">
              <div>${dateLabel}</div>
              <div class="text-xs font-medium text-color-text-primary ${showTooltipTimestamp ? "block" : "hidden"}">${timeLabel} UTC</div>
            </div>
            <span class="text-xs font-medium text-color-text-primary">${tooltipTitle ?? ""}</span>
          </div>
          <div class="flex flex-col w-full">
            ${rows}
            ${totalRow}
          </div>
        </div>
      `;
    };
    const baseOption: EChartsOption = {
      animation,
      backgroundColor: "transparent",
      grid: {
        ...effectiveGrid,
      },
      xAxis: {
        type: xAxisType,
        show: true,
        min: effectiveXMin,
        max: effectiveXMax,
        boundaryGap: hasBarSeries ? (xAxisType === "time" ? [0, 0] : true) : false,
        axisLine: { lineStyle: { color: withOpacity(textPrimary, 0.45) } },
        axisTick: { show: xAxisType !== "time" },
        axisLabel: { show: xAxisType !== "time" },
        splitLine: { show: false },
      } as any,
      yAxis: {
        type: "value",
        min: computedYAxisMin,
        max: computedYAxisMax,
        interval: yAxisStep,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: textPrimary,
          fontSize: numbersXxsTypography.fontSize,
          fontFamily: numbersXxsTypography.fontFamily,
          fontWeight: numbersXxsTypography.fontWeight,
          formatter: (value: number) => {
            const formatted = yAxisLabelFormatter
              ? yAxisLabelFormatter(value)
              : formatDefaultYAxisTick(value);
            return `{num|${formatted}}`;
          },
          rich: {
            num: {
              color: textPrimary,
              fontSize: numbersXxsTypography.fontSize,
              fontFamily: numbersXxsTypography.fontFamily,
              fontWeight: numbersXxsTypography.fontWeight,
              lineHeight: numbersXxsTypography.lineHeight,
            },
          },
        },
        splitLine: {
          lineStyle: { color: withOpacity(textPrimary, 0.11), width: 1 },
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
          snap: true,
          lineStyle: { color: withOpacity(textPrimary, 0.45), width: 1 },
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
        formatter: defaultTooltipFormatter,
      },
      series: echartsSeriesConfigs,
    };

    if (optionOverrides) {
      return { ...baseOption, ...optionOverrides } as EChartsOption;
    }

    return baseOption;
  }, [
    animation,
    areaOpacityOverride,
    axisPixelMap,
    barMaxWidth,
    chartTooltipPosition,
    decimals,
    effectiveGrid,
    effectiveXMin,
    effectiveXMax,
    hasBarSeries,
    textPrimary,
    lineWidth,
    numbersXxsTypography,
    optionOverrides,
    prefix,
    suffix,
    percentageMode,
    xAxisLines,
    pairedSeries,
    normalizedSeries,
    seriesOverrides,
    smooth,
    stack,
    tooltipFormatter,
    tooltipTitle,
    showTooltipTimestamp,
    showTotal,
    reverseTooltipOrder,
    limitTooltipRows,
    xAxisType,
    yAxisLabelFormatter,
    formatDefaultYAxisTick,
    yAxisLayout,
    decimalPercentage
  ]);

  const watermarkOverlayClassName =
    `pointer-events-none absolute inset-y-0 left-[52px] bottom-[5%] right-0 flex items-center justify-center ${watermarkOverlap ? "z-[0]" : "z-[40]"}`;

  return (
    <div className="flex flex-col w-full" style={{ height: typeof height === "number" ? `${height}px` : height }}>
    <div
      ref={containerRef}
      className={`relative w-full flex-1 min-h-0 overflow-hidden ${onDragSelect ? "cursor-crosshair" : ""} ${className ?? ""}`}
    >
      <div ref={tooltipHostRef} className="relative w-full h-full">
        <ReactEChartsCore
          ref={echartsRef}
          echarts={echarts}
          option={chartOption}
          notMerge
          lazyUpdate
          style={{ width: "100%", height: minHeight ? `${minHeight}px` : maxHeight ? `${maxHeight}px` : "100%" }}
          opts={{ devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 2 }}
        />
      </div>
      {/* External crosshair overlay — shown by peer charts in the same syncId group.
          Updated imperatively (no React state) to avoid re-renders on every mouse move.
          Uses repeating-linear-gradient with the exact zrender dash formula:
          dashed + lineWidth 1 → [4*1, 2*1] = 4px on / 2px gap (CSS pixels, dpr-independent). */}
      {syncId && (
        <div
          ref={externalCrosshairRef}
          className="pointer-events-none absolute z-[5]"
          style={{
            display: "none",
            top: effectiveGrid.top,
            bottom: effectiveGrid.bottom,
            width: 1,
            backgroundImage: `repeating-linear-gradient(to bottom, ${withOpacity(textPrimary, 0.45)} 0px, ${withOpacity(textPrimary, 0.45)} 4px, transparent 4px, transparent 6px)`,
          }}
        />
      )}
      {xAxisType === "time" && overlayLabels.length > 0 && (
        <div
          className="pointer-events-none absolute left-0 right-0 bottom-0"
          style={{ height: effectiveGrid.bottom }}
        >
          {subtickPixels.map((px) => (
            <div
              key={`sub-${px}`}
              className="absolute top-0"
              style={{
                left: px,
                width: 1,
                height: compactXAxis ? 3 : 3,
                backgroundColor: withOpacity(textPrimary, 0.3),
              }}
            />
          ))}
          {overlayLabels.map((label) => {
            const snappedX = Math.round(label.pixelX);
            return (
              <div
                key={`tick-${label.timestamp}`}
                className="absolute top-0"
                style={{
                  left: snappedX,
                  width: 1,
                  height: compactXAxis ? 8 : 8,
                  backgroundColor: withOpacity(textPrimary, 0.3),
                }}
              />
            );
          })}
          {overlayLabels.map((label) => (
            <span
              key={`label-${label.timestamp}`}
              className={`absolute whitespace-nowrap ${compactXAxis ? "text-xxs" : label.isBold ? "text-xxs !font-bold" : "text-xxs"} ${label.align === "left" ? "text-left translate-x-0" : label.align === "right" ? "text-right -translate-x-full" : "text-center -translate-x-1/2"}`}
              style={{
                left: Math.round(label.pixelX),
                top: compactXAxis ? (label.isBold ? 10 : 10) : (label.isBold ? 14 : 14),
                color: textPrimary,
              }}
            >
              {label.text}
            </span>
          ))}
        </div>
      )}
      {onDragSelect && dragOverlay && (
        <div
          className="pointer-events-none absolute inset-y-0 z-30 flex items-center justify-center border-x"
          style={{
            left: dragOverlay.left,
            width: dragOverlay.width,
            backgroundColor: withHexOpacity(dragSelectOverlayColor, 0.1),
            borderColor: withHexOpacity(dragSelectOverlayColor, 0.4),
          }}
        >
          {dragSelectIcon && (
            <GTPIcon icon={dragSelectIcon} className="!size-[24px]" containerClassName="!size-[24px]" />
          )}
        </div>
      )}
      {emptyStateMessage && pairedSeries.length === 0 && (
        <div className="absolute inset-0 top-[35px] left-[45px] flex items-center justify-center">
          <div className="text-xxs text-color-text-secondary">{emptyStateMessage}</div>
        </div>
      )}
      {showWatermark ? (

        watermarkMetricName ? (
          <div className={watermarkOverlayClassName}>
            <ChartWatermarkWithMetricName metricName={watermarkMetricName} className={WATERMARK_CLASS} />
          </div>
        ) : (
          <div className={`${watermarkOverlayClassName} ${"flex flex-col gap-y-[2px] z-30"}`}>
            <ChartWatermark className={WATERMARK_CLASS} />
            <div className="text-xxs text-color-text-secondary">
              {underChartText}
            </div>
          </div>
        )
      ) : null}
    </div>
    {showLegend && series.length > 0 && (
      <div ref={legendRef} className="relative flex flex-wrap justify-center  bottom-[30px] gap-x-[5px] gap-y-[1px]">
        {series.map((s, index) => {
          const fallbackColor = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
          const [dotColor] = resolveSeriesColors(s.color, fallbackColor);
          const isInactive = inactiveLegendSeries.has(s.name);
          const label = legendLabels?.[s.name] ?? s.name;

          return (
            <div
              key={s.name + "-gtp-chart-legend"}
              onMouseEnter={() => setHoverLegendSeries(s.name)}
              onMouseLeave={() => setHoverLegendSeries(null)}
            >
              <GTPButton
                label={label}
                variant="primary"
                size="xs"
                clickHandler={() => handleLegendToggle(s.name)}
                rightIcon={
                  hoverLegendSeries === s.name
                    ? isInactive ? "in-button-plus" : "in-button-close"
                    : undefined
                }
                animateRightIcon
                rightIconClassname="!w-[12px] !h-[12px]"
                textClassName={isInactive ? "text-color-text-secondary" : undefined}
                className={isInactive ? "border border-color-bg-medium" : undefined}
                leftIconOverride={
                  <div
                    className="min-w-[6px] min-h-[6px] rounded-full"
                    style={{ backgroundColor: dotColor, opacity: isInactive ? 0.35 : 1 }}
                  />
                }
              />
            </div>
          );
        })}
      </div>
    )}
    </div>
  );
}
