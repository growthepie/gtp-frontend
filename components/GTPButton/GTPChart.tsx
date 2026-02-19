"use client";

import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { EChartsOption } from "echarts";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getGTPTooltipContainerClass, getViewportAwareTooltipLocalPosition } from "../tooltip/tooltipShared";
import { ChartWatermarkWithMetricName } from "../layout/ChartWatermark";
import { useTheme } from "next-themes";
import ChartWatermark from "@/components/layout/ChartWatermark";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
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

const DEFAULT_TOOLTIP_CONTAINER_CLASS = getGTPTooltipContainerClass(
  "fit",
  "mt-3 mr-3 mb-3 min-w-60 md:min-w-60 max-w-[min(92vw,420px)] gap-y-[2px] py-[15px] pr-[15px] bg-color-bg-default",
);

const WATERMARK_CLASS =
  "h-auto w-[145px] text-forest-300 opacity-40 mix-blend-darken dark:text-[#EAECEB] dark:mix-blend-lighten";

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
}

export interface GTPChartTooltipParams {
  value: [number, number];
  seriesName: string;
  color?: string;
}

export interface GTPChartProps {
  series: GTPChartSeries[];
  stack?: boolean;
  percentageMode?: boolean;
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
  emptyStateMessage?: string;
  animation?: boolean;
  smooth?: boolean;
  lineWidth?: number;
  areaOpacity?: number;
  barMaxWidth?: number;
  optionOverrides?: Record<string, unknown>;
  seriesOverrides?: (series: Record<string, unknown>, index: number) => Record<string, unknown>;
  height?: string | number;
  className?: string;
  /** Called when the user completes a click-and-drag on the chart. Receives the x-axis values at
   *  the drag start and drag end (always xStart ≤ xEnd). */
  onDragSelect?: (xStart: number, xEnd: number) => void;
  /** Hex color used to tint the drag-selection overlay (background at 10% opacity, border at 40%). Defaults to blue. */
  dragSelectOverlayColor?: string;
  /** Icon rendered in the centre of the drag-selection overlay. */
  dragSelectIcon?: GTPIconName;
}

// --- Component ---

export default function GTPChart({
  series,
  stack = false,
  percentageMode = false,
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

  showWatermark = true,
  watermarkMetricName = null,
  emptyStateMessage = "No data to display",
  animation = false,
  smooth = false,
  lineWidth = 2,
  areaOpacity: areaOpacityOverride,
  barMaxWidth = 50,
  optionOverrides,
  seriesOverrides,
  height = "100%",
  className,
  onDragSelect,
  dragSelectOverlayColor = "#3b82f6",
  dragSelectIcon,
}: GTPChartProps) {

  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipHostRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const echartsRef = useRef<any>(null);
  const dragStartPixelRef = useRef<number | null>(null);
  const [dragOverlay, setDragOverlay] = useState<{ left: number; width: number } | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const { theme } = useTheme();

  const textPrimary = theme === "light" ? "rgb(31, 39, 38)" : "rgb(205, 216, 211)";
  const textSecondary = theme === "light" ? "rgb(121, 139, 137)" : "rgb(75, 83, 79)";

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
        data: sharedTimestamps.map((timestamp) => [
          timestamp,
          valueByTimestamp.has(timestamp) ? (valueByTimestamp.get(timestamp) ?? null) : null,
        ]),
      };
    });
  }, [series, xAxisType]);

  // Check if any series is a bar (affects x-axis boundaryGap)
  const hasBarSeries = normalizedSeries.some((s) => s.seriesType === "bar");

  // Track container height for dynamic split count
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    const sync = () => {
      const rect = element.getBoundingClientRect();
      setContainerHeight(rect.height);
    };

    sync();
    const frame = window.requestAnimationFrame(sync);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerHeight(entry.contentRect.height);
    });

    observer.observe(element);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  // Typography
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
  const textSmTypography = useMemo(
    () =>
      readTailwindTypographyStyle("text-sm", {
        fontFamily: "var(--font-raleway), sans-serif",
        fontSize: 14,
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
  // Stable ref so the document mouseup handler always sees the latest callback
  const onDragSelectRef = useRef(onDragSelect);
  useEffect(() => { onDragSelectRef.current = onDragSelect; }, [onDragSelect]);

  const handleDragMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onDragSelect) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    dragStartPixelRef.current = e.clientX - rect.left;
    setDragOverlay(null);
  }, [onDragSelect]);

  const handleDragMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragStartPixelRef.current === null) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const currentPixel = e.clientX - rect.left;
    const startPixel = dragStartPixelRef.current;
    if (Math.abs(currentPixel - startPixel) > 4) {
      setDragOverlay({
        left: Math.min(startPixel, currentPixel),
        width: Math.abs(currentPixel - startPixel),
      });
    }
  }, []);

  // All drag completion is handled at the document level so it fires regardless of
  // where the mouse is released — this also prevents onMouseLeave from cancelling
  // an active drag when the cursor briefly exits the container.
  useEffect(() => {
    if (!onDragSelect) return;

    const handleDocumentMouseUp = (e: MouseEvent) => {
      if (dragStartPixelRef.current === null) return;
      const startPixel = dragStartPixelRef.current;
      dragStartPixelRef.current = null;
      setDragOverlay(null);

      if (!containerRef.current || !onDragSelectRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const endPixel = e.clientX - rect.left;
      if (Math.abs(endPixel - startPixel) <= 4) return;

      const instance = echartsRef.current?.getEchartsInstance?.();
      if (!instance) return;

      // Derive the x-axis pixel↔data mapping directly from the axis model.
      // convertFromPixel returns NaN for pixels outside the grid area, so we
      // read the axis extents ourselves and do a simple linear interpolation.
      const xAxisModel = instance.getModel?.()?.getComponent?.("xAxis", 0);
      if (!xAxisModel) return;
      const pixelExtent: [number, number] | undefined = xAxisModel.axis?.getExtent?.();
      const dataExtent: [number, number] | undefined = xAxisModel.axis?.scale?.getExtent?.();
      if (!pixelExtent || !dataExtent) return;

      const [pixMin, pixMax] = pixelExtent;
      const [dataMin, dataMax] = dataExtent;
      if (pixMax === pixMin) return;

      const pixelToData = (px: number): number => {
        const clamped = Math.max(pixMin, Math.min(pixMax, px));
        return dataMin + ((clamped - pixMin) / (pixMax - pixMin)) * (dataMax - dataMin);
      };

      const xStart = pixelToData(Math.min(startPixel, endPixel));
      const xEnd = pixelToData(Math.max(startPixel, endPixel));

      if (Number.isFinite(xStart) && Number.isFinite(xEnd)) {
        onDragSelectRef.current(xStart, xEnd);
      }
    };

    document.addEventListener("mouseup", handleDocumentMouseUp);
    return () => document.removeEventListener("mouseup", handleDocumentMouseUp);
  }, [onDragSelect]);

  // Apply percentage mode transformation if needed
  const pairedSeries = useMemo(() => {
    return normalizedSeries.map((s) => {
      let paired = s.data;

      // Percentage mode transformation
      if (percentageMode) {
        paired = paired.map(([x, value], i) => {
          if (value === null || !Number.isFinite(value)) return [x, null];
          const total = normalizedSeries.reduce((sum, other) => {
            const otherY = other.data[i]?.[1] ?? null;
            return typeof otherY === "number" && Number.isFinite(otherY) ? sum + otherY : sum;
          }, 0);
          return [x, total > 0 ? (value / total) * 100 : null];
        });
      }

      return { ...s, pairedData: paired };
    });
  }, [normalizedSeries, percentageMode]);

  // Build ECharts option
  const chartOption = useMemo<EChartsOption>(() => {
    const shouldStack = stack || percentageMode;
    const grid = { ...DEFAULT_GRID, ...gridOverride };
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    // Y-axis smart scaling
    const splitCount = clamp(Math.round((containerHeight || 512) / 120), 4, 5);
    const visibleMinTs = Number.isFinite(xAxisMin) ? Number(xAxisMin) : -Infinity;
    const visibleMaxTs = Number.isFinite(xAxisMax) ? Number(xAxisMax) : Infinity;
    const isWithinVisibleRange = (timestamp: number) => timestamp >= visibleMinTs && timestamp <= visibleMaxTs;

    const allValues = pairedSeries.flatMap((s) =>
      s.pairedData
        .filter(([timestamp]) => Number.isFinite(Number(timestamp)) && isWithinVisibleRange(Number(timestamp)))
        .map((p) => p[1])
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v)),
    );
    const allTimestamps = pairedSeries.flatMap((s) =>
      s.pairedData
        .map((p) => Number(p[0]))
        .filter((timestamp): timestamp is number => Number.isFinite(timestamp)),
    );
    const minTimestamp = allTimestamps.length > 0 ? Math.min(...allTimestamps) : undefined;
    const maxTimestamp = allTimestamps.length > 0 ? Math.max(...allTimestamps) : undefined;
    const inferredRangeMs =
      minTimestamp !== undefined && maxTimestamp !== undefined ? maxTimestamp - minTimestamp : undefined;
    const explicitRangeMs =
      Number.isFinite(xAxisMin) && Number.isFinite(xAxisMax) ? Number(xAxisMax) - Number(xAxisMin) : undefined;
    const xAxisRangeMs = explicitRangeMs ?? inferredRangeMs;
    const isLongerThan7Days = typeof xAxisRangeMs === "number" && xAxisRangeMs > sevenDaysMs;

    // For time-based bar series, bars are centered on the timestamp. If the axis min/max sits
    // exactly on the first/last point, edge bars can protrude outside the grid. We pad the
    // internal bounds using edge intervals computed across all bar series.
    let effectiveXMin = xAxisMin;
    let effectiveXMax = xAxisMax;
    if (hasBarSeries && xAxisType === "time") {
      const sortedBarTs = Array.from(
        new Set(
          pairedSeries
            .filter((s) => s.seriesType === "bar")
            .flatMap((s) =>
              s.pairedData
                .filter((p) => typeof p[1] === "number" && Number.isFinite(p[1]))
                .map((p) => Number(p[0]))
                .filter((timestamp) => Number.isFinite(timestamp)),
            ),
        ),
      ).sort((a, b) => a - b);

      if (sortedBarTs.length > 0) {
        const intervals: number[] = [];
        for (let i = 1; i < sortedBarTs.length; i += 1) {
          const diff = sortedBarTs[i] - sortedBarTs[i - 1];
          if (diff > 0 && Number.isFinite(diff)) intervals.push(diff);
        }

        const inferredEdgeInterval =
          intervals.length > 0
            ? intervals[Math.floor(intervals.length / 2)]
            : typeof xAxisRangeMs === "number" && xAxisRangeMs > 0
              ? xAxisRangeMs / 20
              : undefined;

        const firstInterval = intervals[0] ?? inferredEdgeInterval;
        const lastInterval = intervals[intervals.length - 1] ?? inferredEdgeInterval;
        const minBase = Number(xAxisMin ?? sortedBarTs[0]);
        const maxBase = Number(xAxisMax ?? sortedBarTs[sortedBarTs.length - 1]);

        if (Number.isFinite(minBase) && Number.isFinite(maxBase)) {
          const leftPad = Number.isFinite(firstInterval) ? Number(firstInterval) / 2 : 0;
          const rightPad = Number.isFinite(lastInterval) ? Number(lastInterval) / 2 : 0;
          effectiveXMin = minBase - leftPad;
          effectiveXMax = maxBase + rightPad;
        }
      }
    }

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

    const maxSeriesValue =
      shouldStack && pairedSeries.length > 0
        ? pairedSeries[0].pairedData.reduce((maxVal, point, index) => {
            const pointTimestamp = Number(point[0]);
            if (!Number.isFinite(pointTimestamp) || !isWithinVisibleRange(pointTimestamp)) return maxVal;
            const stackedValue = pairedSeries.reduce((sum, s) => {
              const pointValue = s.pairedData[index]?.[1];
              return typeof pointValue === "number" && Number.isFinite(pointValue) ? sum + pointValue : sum;
            }, 0);
            return Math.max(maxVal, stackedValue);
          }, 0)
        : allValues.length > 0
          ? Math.max(...allValues)
          : 0;

    // Detect whether the data contains negative values
    const minSeriesValue = allValues.length > 0 ? Math.min(...allValues) : 0;
    const hasNegativeValues = minSeriesValue < 0;
    const maxPositiveOvershootRatio = 1.15;

    const getNiceStep = (raw: number) => {
      const safeRaw = Math.max(raw, Number.EPSILON);
      const magnitude = Math.pow(10, Math.floor(Math.log10(safeRaw)));
      const normalized = safeRaw / magnitude;

      if (normalized <= 1.5) return 1 * magnitude;
      if (normalized <= 2.25) return 2 * magnitude;
      if (normalized <= 3.75) return 2.5 * magnitude;
      if (normalized <= 7.5) return 5 * magnitude;
      return 10 * magnitude;
    };

    const tightenPositiveHeadroom = ({
      paddedPosMax,
      positiveBaseline,
      initialStep,
      minAllowedStep,
    }: {
      paddedPosMax: number;
      positiveBaseline: number;
      initialStep: number;
      minAllowedStep: number;
    }) => {
      let step = initialStep;
      let roundedPosMax = Math.ceil(paddedPosMax / step) * step;
      let previousStep = step;

      while (roundedPosMax / positiveBaseline > maxPositiveOvershootRatio && step > minAllowedStep) {
        const tightenedStep = getNiceStep(step / 1.6);
        if (tightenedStep >= previousStep) break;
        previousStep = step;
        step = Math.max(tightenedStep, minAllowedStep);
        roundedPosMax = Math.ceil(paddedPosMax / step) * step;
      }

      return {
        step,
        roundedPosMax: Math.min(roundedPosMax, positiveBaseline * maxPositiveOvershootRatio),
      };
    };

    const axisPaddingMultiplier = 1.03;
    const rawStep = Math.max(maxSeriesValue, Number.EPSILON) / splitCount;
    const absoluteStep = getNiceStep(rawStep);
    let yAxisStep = percentageMode ? 25 : absoluteStep;

    // For data with negatives, compute independent min/max with capped positive headroom.
    let computedYAxisMin: number;
    let computedYAxisMax: number;

    if (hasNegativeValues && yAxisMin === 0 && yAxisMaxOverride === undefined && !percentageMode) {
      const posMax = Math.max(maxSeriesValue, 0);
      const negMin = Math.min(minSeriesValue, 0);
      const totalRange = posMax - negMin;
      const rangeRawStep = totalRange / Math.max(splitCount, 1);
      const initialStep = getNiceStep(rangeRawStep);
      const minAllowedStep = getNiceStep(totalRange / Math.max(splitCount * 16, 1));
      const paddedPosMax = posMax * axisPaddingMultiplier;
      const positiveBaseline = Math.max(posMax, Number.EPSILON);

      const tightened = tightenPositiveHeadroom({
        paddedPosMax,
        positiveBaseline,
        initialStep,
        minAllowedStep,
      });

      yAxisStep = tightened.step;
      computedYAxisMax = posMax > 0 ? tightened.roundedPosMax : 0;
      computedYAxisMin = Math.floor((negMin * axisPaddingMultiplier) / yAxisStep) * yAxisStep;
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

                const paddedPosMax = posMax * axisPaddingMultiplier;
                const minAllowedStep = getNiceStep(posMax / Math.max(splitCount * 16, 1));
                const tightened = tightenPositiveHeadroom({
                  paddedPosMax,
                  positiveBaseline: posMax,
                  initialStep: yAxisStep,
                  minAllowedStep,
                });

                yAxisStep = tightened.step;
                return tightened.roundedPosMax;
              })();
    }

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

    // Build series configs — each series determines its own type
    const echartsSeriesConfigs = sortedSeries.map((s, index) => {
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
          { offset: 1, color: "transparent" },
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

        const lastIdx = s.pairedData.length - 1;

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

          config.data = s.pairedData.map((point, idx) => {
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
          config.data = s.pairedData.map((point, idx) => {
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

      if (seriesOverrides) {
        config = seriesOverrides(config, index);
      }

      return config;
    });

    // Default X-axis formatter
    const defaultXFormatter = (value: number | string) => formatXAxisTick(value);

    // Default Y-axis formatter
    const defaultYFormatter = (value: number) =>
      percentageMode ? `${Math.round(value)}%` : formatCompactNumber(value, decimals);

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

      const sortedPoints = validPoints
        .map((p) => ({ ...p, numericValue: Number(p.value[1]) }))
        .sort((a, b) => b.numericValue - a.numericValue);

      const resolvedTooltipRowLimit =
        typeof limitTooltipRows === "number" && Number.isFinite(limitTooltipRows)
          ? Math.max(1, Math.floor(limitTooltipRows))
          : undefined;

      let displayPoints = sortedPoints;
      if (resolvedTooltipRowLimit !== undefined && sortedPoints.length > resolvedTooltipRowLimit) {
        const visiblePointCount = Math.max(0, resolvedTooltipRowLimit - 1);
        const visiblePoints = sortedPoints.slice(0, visiblePointCount);
        const overflowPoints = sortedPoints.slice(visiblePointCount);
        const overflowSum = overflowPoints.reduce((sum, point) => sum + point.numericValue, 0);
        const othersColor = withOpacity(textPrimary, 0.55);

        displayPoints = [
          ...visiblePoints,
          {
            value: [timestamp, overflowSum] as [number, number],
            seriesName: `${overflowPoints.length} Others`,
            color: othersColor,
            numericValue: overflowSum,
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
          const formattedValue = percentageMode ? `${v.toFixed(1)}%` : formatCompactNumber(v, decimals);
          const barWidth = maxTooltipValue > 0 ? clamp((Math.abs(v) / maxTooltipValue) * 100, 0, 100) : 0;
          return `
            <div class="flex w-full space-x-1.5 items-center font-medium leading-tight">
              <div class="w-[15px] h-[10px] rounded-r-full" style="background-color:${lineColor}"></div>
              <div class="tooltip-point-name text-xs">${escapeHtml(point.seriesName)}</div>
              <div class="flex-1 text-right justify-end flex numbers-xs">${prefix ?? ""}${formattedValue}${suffix ?? ""}</div>
            </div>
            <div class="ml-[18px] mr-[1px] h-[2px] relative mb-[2px] overflow-hidden">
              <div class="h-[2px] rounded-none absolute right-0 top-0" style="width:${barWidth}%; background-color:${lineColor}"></div>
            </div>
          `;
        })
        .join("");

      return `
        <div class="${DEFAULT_TOOLTIP_CONTAINER_CLASS}">
          <div class="flex-1 flex items-center justify-between font-bold text-[13px] md:text-[1rem] ml-[18px] mb-1">
            <span>${dateLabel}</span>
            <span class="text-xs font-medium text-color-text-primary">${tooltipTitle ?? ""}</span>
          </div>
          <div class="flex flex-col w-full">
            ${rows}
          </div>
        </div>
      `;
    };

    const baseOption: EChartsOption = {
      animation,
      backgroundColor: "transparent",
      graphic:
        pairedSeries.length === 0
          ? [
              {
                type: "text",
                left: "center",
                top: "middle",
                silent: true,
                style: {
                  text: emptyStateMessage,
                  fill: textSecondary,
                  font: "12px var(--font-raleway), sans-serif",
                },
              },
            ]
          : undefined,
      grid: {
        ...grid,
      },
      xAxis: {
        type: xAxisType,
        show: true,
        min: effectiveXMin,
        max: effectiveXMax,
        boundaryGap: hasBarSeries ? (xAxisType === "time" ? [0, 0] : true) : false,
        axisLine: { lineStyle: { color: withOpacity(textPrimary, 0.45) } },
        axisTick: { show: false },
        axisLabel: {
          color: textPrimary,
          fontSize: textXxsTypography.fontSize,
          fontFamily: textXxsTypography.fontFamily,
          fontWeight: textXxsTypography.fontWeight,
          hideOverlap: true,
          margin: 8,
          formatter: (xAxisLabelFormatter ?? defaultXFormatter) as (value: number | string) => string,
          rich: {
            yearBold: {
              color: textPrimary,
              fontSize: textSmTypography.fontSize,
              fontFamily: textSmTypography.fontFamily,
              fontWeight: 700,
              lineHeight: textXxsTypography.lineHeight,
            },
          },
        },
        splitLine: { show: false },
      } as any,
      yAxis: {
        type: "value",
        min: computedYAxisMin,
        max: computedYAxisMax,
        interval: yAxisStep,
        splitNumber: splitCount,
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
              : defaultYFormatter(value);
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
    barMaxWidth,
    chartTooltipPosition,
    containerHeight,
    decimals,
    emptyStateMessage,
    gridOverride,
    hasBarSeries,
    textPrimary,
    textSecondary,
    lineWidth,
    numbersXxsTypography,
    optionOverrides,
    prefix,
    suffix,
    percentageMode,
    pairedSeries,
    normalizedSeries,
    seriesOverrides,
    smooth,
    stack,
    textSmTypography,
    textXxsTypography,
    tooltipFormatter,
    tooltipTitle,
    limitTooltipRows,
    xAxisLabelFormatter,
    xAxisMin,
    xAxisMax,
    xAxisType,
    yAxisLabelFormatter,
    yAxisMaxOverride,
    yAxisMin,
  ]);

  const containerStyle: React.CSSProperties = {
    height: typeof height === "number" ? `${height}px` : height,
  };

  const watermarkOverlayClassName =
    "pointer-events-none absolute inset-y-0 left-[52px] bottom-[5%] right-0 z-[40] flex items-center justify-center";

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${onDragSelect ? "cursor-crosshair" : ""} ${className ?? ""}`}
      style={containerStyle}
      onMouseDown={onDragSelect ? handleDragMouseDown : undefined}
      onMouseMove={onDragSelect ? handleDragMouseMove : undefined}
    >
      <div ref={tooltipHostRef} className="relative w-full h-full">
        <ReactECharts
          ref={echartsRef}
          option={chartOption}
          notMerge
          lazyUpdate
          style={{ width: "100%", height: "100%" }}
        />
      </div>
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
      {showWatermark ? (

        watermarkMetricName ? (
          <div className={watermarkOverlayClassName}>
            <ChartWatermarkWithMetricName metricName={watermarkMetricName} className={WATERMARK_CLASS} />
          </div>
        ) : (
          <div className={watermarkOverlayClassName}>
            <ChartWatermark className={WATERMARK_CLASS} />
          </div>
        )
      ) : null}
    </div>
  );
}
