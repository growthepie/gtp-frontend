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
import { buildTimeXAxisLayout } from "@/lib/echarts-x-axis-layout";

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
  /** When true, line/area charts render their last visible segment as dashed. */
  dashedLastSegment?: boolean;
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
  minHeight?: number | null;
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
  /** Minimum number of data points that must be visible after a drag-select zoom. Defaults to 2. */
  minDragSelectPoints?: number;
  showTooltipTimestamp?: boolean;
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
  minHeight = null,
  showWatermark = true,
  watermarkMetricName = null,
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
  onDragSelect,
  dragSelectOverlayColor = "#3b82f6",
  dragSelectIcon,
  minDragSelectPoints = 2,
  showTooltipTimestamp = false,
}: GTPChartProps) {

  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipHostRef = useRef<HTMLDivElement | null>(null);
  const echartsRef = useRef<InstanceType<typeof ReactECharts> | null>(null);
  const dragStartPixelRef = useRef<number | null>(null);
  const dragStartAxisXRef = useRef<number | null>(null);
  const latestAxisXRef = useRef<number | null>(null);
  const lastDragPixelRef = useRef<number | null>(null);
  const [dragOverlay, setDragOverlay] = useState<{ left: number; width: number } | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const { theme } = useTheme();

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

  // Check if any series is a bar (affects x-axis boundaryGap)
  const hasBarSeries = normalizedSeries.some((s) => s.seriesType === "bar");

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
    echartsRef.current?.getEchartsInstance?.()?.resize();
  }, [containerHeight, minHeight]);

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

  const getSeriesPointXFromOption = useCallback((seriesIndex: number, dataIndex: number): number | null => {
    const option = echartsRef.current?.getEchartsInstance?.()?.getOption?.();
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

  const querySnappedXAtPixel = useCallback((instance: echarts.ECharts, pixelX: number): number | null => {
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
    let subscribedInstance: echarts.ECharts | null = null;
    let axisPointerHandler: ((params: AxisPointerPayload) => void) | null = null;

    const frame = requestAnimationFrame(() => {
      const instance = echartsRef.current?.getEchartsInstance?.();
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
    let zr: ReturnType<echarts.ECharts["getZr"]> | null = null;
    let zrDom: HTMLElement | null = null;
    let mouseUpListener: ((event: MouseEvent) => void) | null = null;
    let onMouseDownHandler: ((event: { event?: { button?: number }; offsetX?: number }) => void) | null = null;
    let onMouseMoveHandler: ((event: { offsetX?: number }) => void) | null = null;
    let onMouseUpHandler: ((event: { offsetX?: number }) => void) | null = null;
    let onGlobalOutHandler: (() => void) | null = null;

    const frame = requestAnimationFrame(() => {
      const instance = echartsRef.current?.getEchartsInstance?.();
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

  // Apply percentage mode transformation if needed
  const pairedSeries = useMemo(() => {
    return normalizedSeries.map((s) => {
      let paired: [number, number | null][] = s.data;

      // Percentage mode transformation
      if (percentageMode) {
        paired = paired.map<[number, number | null]>(([x, value], i) => {
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
    const grid = {
      left: gridOverride?.left ?? DEFAULT_GRID.left,
      right: gridOverride?.right ?? DEFAULT_GRID.right,
      top: gridOverride?.top ?? DEFAULT_GRID.top,
      bottom: gridOverride?.bottom ?? DEFAULT_GRID.bottom,
    };

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
    // X-axis layout is resolved in one pipeline so label width, grid padding, and tick density
    // all derive from the same source of truth.
    const barSeriesData = pairedSeries
      .filter((seriesItem) => seriesItem.seriesType === "bar")
      .map((seriesItem) => seriesItem.pairedData);
    const timeAxisLayout = xAxisType === "time"
      ? buildTimeXAxisLayout({
          timestamps: allTimestamps,
          barSeriesData,
          xAxisMin,
          xAxisMax,
          xAxisLabelFormatter,
          containerWidth,
          grid,
        })
      : undefined;
    const effectiveGrid = timeAxisLayout?.grid ?? grid;
    const effectiveXMin = xAxisType === "time" ? timeAxisLayout?.min : xAxisMin;
    const effectiveXMax = xAxisType === "time" ? timeAxisLayout?.max : xAxisMax;
    const xAxisSplitNumber = xAxisType === "time" ? timeAxisLayout?.splitNumber : undefined;
    const xAxisMinInterval = xAxisType === "time" ? timeAxisLayout?.minInterval : undefined;
    const xAxisFixedInterval = xAxisType === "time" ? timeAxisLayout?.minInterval : undefined;
    const defaultXFormatter = (value: number | string) => {
      if (timeAxisLayout) {
        return timeAxisLayout.defaultLabelFormatter(value);
      }
      return String(value);
    };
    const resolvedXAxisLabelFormatter =
      (timeAxisLayout?.labelFormatter ?? xAxisLabelFormatter ?? defaultXFormatter) as
        (value: number | string) => string;

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

      const timeLabel = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "UTC",
      }).format(timestamp);

      const sortedPoints = validPoints
        .map((p) => ({ ...p, numericValue: Number(p.value[1]) }))
        .sort((a, b) => b.numericValue - a.numericValue);
      const dedupedSortedPoints = sortedPoints.filter(
        (point, pointIdx, collection) =>
          collection.findIndex((candidate) => candidate.seriesName === point.seriesName) === pointIdx,
      );

      const resolvedTooltipRowLimit =
        typeof limitTooltipRows === "number" && Number.isFinite(limitTooltipRows)
          ? Math.max(1, Math.floor(limitTooltipRows))
          : undefined;

      let displayPoints = dedupedSortedPoints;
      if (resolvedTooltipRowLimit !== undefined && dedupedSortedPoints.length > resolvedTooltipRowLimit) {
        const visiblePointCount = Math.max(0, resolvedTooltipRowLimit - 1);
        const visiblePoints = dedupedSortedPoints.slice(0, visiblePointCount);
        const overflowPoints = dedupedSortedPoints.slice(visiblePointCount);
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
          <div class="flex-1 flex ${showTooltipTimestamp ? "items-start" : "items-center"}  justify-between font-bold text-[13px] md:text-[1rem] ml-[18px] mb-1">
          
            <div class="">
              <div>${dateLabel}</div>
              <div class="text-xs font-medium text-color-text-primary ${showTooltipTimestamp ? "block" : "hidden"}">${timeLabel} UTC</div>
            </div>
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

      grid: {
        ...effectiveGrid,
      },
      xAxis: {
        type: xAxisType,
        show: true,
        min: effectiveXMin,
        max: effectiveXMax,
        splitNumber: xAxisSplitNumber,
        interval: xAxisFixedInterval,
        minInterval: xAxisMinInterval,
        boundaryGap: hasBarSeries ? (xAxisType === "time" ? [0, 0] : true) : false,
        axisLine: { lineStyle: { color: withOpacity(textPrimary, 0.45) } },
        axisTick: { show: false },
        axisLabel: {
          color: textPrimary,
          fontSize: textXxsTypography.fontSize,
          fontFamily: textXxsTypography.fontFamily,
          fontWeight: textXxsTypography.fontWeight,
          alignMinLabel: xAxisType === "time" ? "left" : undefined,
          alignMaxLabel: xAxisType === "time" ? "right" : undefined,
          hideOverlap: true,
          margin: 8,
          formatter: resolvedXAxisLabelFormatter,
          rich: {
            yearBold: {
              color: textPrimary,
              fontSize: textSmTypography.fontSize,
              fontFamily: textSmTypography.fontFamily,
              fontWeight: 700,
              lineHeight: textXxsTypography.lineHeight,
            },
            dateBold: {
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
    barMaxWidth,
    chartTooltipPosition,
    containerHeight,
    containerWidth,
    decimals,
    gridOverride,
    hasBarSeries,
    textPrimary,
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
    showTooltipTimestamp,
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
    >
      <div ref={tooltipHostRef} className="relative w-full h-full">
        <ReactECharts
          ref={echartsRef}
          option={chartOption}
          notMerge
          lazyUpdate
          style={{ width: "100%", height: minHeight ? `${minHeight}px` : "100%" }}
          opts={{ devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 2 }}
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
          <div className={watermarkOverlayClassName}>
            <ChartWatermark className={WATERMARK_CLASS} />
          </div>
        )
      ) : null}
    </div>
  );
}
