"use client";

import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { EChartsOption } from "echarts";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getGTPTooltipContainerClass, getViewportAwareTooltipLocalPosition } from "../tooltip/tooltipShared";
import { ChartWatermarkWithMetricName } from "../layout/ChartWatermark";

// --- Utility helpers (matching GTPUniversalChart patterns) ---

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getCssVarAsRgb = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!value) return fallback;
  const parts = value.split(" ").filter(Boolean);
  return `rgb(${parts.join(", ")})`;
};

const withOpacity = (color: string, opacity: number) => {
  if (!color.startsWith("rgb(")) return color;
  return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
};

const withHexOpacity = (color: string, opacity: number) => {
  if (!color.startsWith("#") || (color.length !== 7 && color.length !== 9)) return color;
  if (color.length === 9) return color;
  const alpha = Math.round(clamp(opacity, 0, 1) * 255).toString(16).padStart(2, "0");
  return `${color}${alpha}`;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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
  if (typeof window === "undefined" || typeof document === "undefined") return fallback;

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

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: Math.abs(value) >= 100_000_000_000 ? 0 : 1,
  }).format(value);

const DEFAULT_TOOLTIP_CONTAINER_CLASS = getGTPTooltipContainerClass(
  "fit",
  "mt-3 mr-3 mb-3 min-w-60 md:min-w-60 max-w-[min(92vw,420px)] gap-y-[2px] py-[10px] pr-[12px] bg-color-bg-default/80",
);

const WATERMARK_CLASS =
  "h-auto w-[145px] text-forest-300 opacity-40 mix-blend-darken dark:text-[#EAECEB] dark:mix-blend-lighten";

const DEFAULT_GRID = { left: 52, right: 0, top: 4, bottom: 22 };
const DEFAULT_COLORS = [
  "#1C1CFF", "#12AAFF", "#FF0420", "#0052FF", "#7B3FE4",
  "#4E529A", "#EC796B", "#61DFFF", "#FFEEDA", "#00DACC",
];

// --- Public types ---

export interface GTPChartSeries {
  name: string;
  data: [number, number | null][];
  color?: string;
}

export interface GTPChartTooltipParams {
  value: [number, number];
  seriesName: string;
  color?: string;
}

export interface GTPChartProps {
  series: GTPChartSeries[];
  chartType?: "line" | "bar";
  showArea?: boolean;
  stack?: boolean;
  percentageMode?: boolean;
  xAxisType?: "time" | "category";
  xAxisLabelFormatter?: (value: number | string) => string;
  yAxisLabelFormatter?: (value: number) => string;
  yAxisMin?: number;
  yAxisMax?: number;
  grid?: { left?: number; right?: number; top?: number; bottom?: number };
  tooltipFormatter?: (params: GTPChartTooltipParams[]) => string;
  showWatermark?: boolean;
  watermarkMetricName?: string;
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
}

// --- Component ---

export default function GTPChart({
  series,
  chartType = "line",
  showArea = true,
  stack = false,
  percentageMode = false,
  xAxisType = "time",
  xAxisLabelFormatter,
  yAxisLabelFormatter,
  yAxisMin = 0,
  yAxisMax: yAxisMaxOverride,
  grid: gridOverride,
  tooltipFormatter,
  showWatermark = false,
  watermarkMetricName,
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
}: GTPChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipHostRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);

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
      readTailwindTypographyStyle("text-xxs", {
        fontFamily: "var(--font-raleway), sans-serif",
        fontSize: 10,
        fontWeight: 500,
        lineHeight: 15,
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

  // Percentage mode data transformation
  const processedSeries = useMemo(() => {
    if (!percentageMode) return series;

    return series.map((s) => ({
      ...s,
      data: s.data.map(([x, value], index) => {
        if (value === null || !Number.isFinite(value)) return [x, null] as [number, number | null];
        const total = series.reduce((sum, other) => {
          const otherValue = other.data[index]?.[1];
          return typeof otherValue === "number" && Number.isFinite(otherValue) ? sum + otherValue : sum;
        }, 0);
        return [x, total > 0 ? (value / total) * 100 : null] as [number, number | null];
      }),
    }));
  }, [percentageMode, series]);

  // Build ECharts option
  const chartOption = useMemo<EChartsOption>(() => {
    const textPrimary = getCssVarAsRgb("--text-primary", "rgb(205, 216, 211)");
    const textSecondary = getCssVarAsRgb("--text-secondary", "rgb(121, 139, 137)");

    const shouldStack = stack || percentageMode;
    const grid = { ...DEFAULT_GRID, ...gridOverride };

    // Y-axis smart scaling
    const splitCount = clamp(Math.round((containerHeight || 512) / 88), 3, 7);

    const allValues = processedSeries.flatMap((s) =>
      s.data.map((p) => p[1]).filter((v): v is number => typeof v === "number" && Number.isFinite(v)),
    );

    const maxSeriesValue =
      shouldStack && processedSeries.length > 0
        ? processedSeries[0].data.reduce((maxVal, _, index) => {
            const stackedValue = processedSeries.reduce((sum, s) => {
              const pointValue = s.data[index]?.[1];
              return typeof pointValue === "number" && Number.isFinite(pointValue) ? sum + pointValue : sum;
            }, 0);
            return Math.max(maxVal, stackedValue);
          }, 0)
        : allValues.length > 0
          ? Math.max(...allValues)
          : 0;

    const rawStep = Math.max(maxSeriesValue, 1) / splitCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
    const normalizedStep = rawStep / Math.max(magnitude, 1);
    const niceStepBase = normalizedStep > 5 ? 10 : normalizedStep > 2 ? 5 : normalizedStep > 1 ? 2 : 1;
    const absoluteStep = niceStepBase * Math.max(magnitude, 1);
    const yAxisStep = percentageMode ? 25 : absoluteStep;
    const computedYAxisMin = yAxisMin;
    const computedYAxisMax =
      yAxisMaxOverride !== undefined
        ? yAxisMaxOverride
        : percentageMode
          ? 100
          : Math.max(yAxisStep, Math.ceil((Math.max(maxSeriesValue, 1) * 1.06) / yAxisStep) * yAxisStep);

    // Sort series for percentage mode (ascending by last value so smallest is on top)
    const sortedSeries = percentageMode
      ? [...processedSeries].sort((a, b) => {
          const aLast = [...a.data].reverse().find((p) => typeof p[1] === "number")?.[1] ?? 0;
          const bLast = [...b.data].reverse().find((p) => typeof p[1] === "number")?.[1] ?? 0;
          return (aLast ?? 0) - (bLast ?? 0);
        })
      : processedSeries;

    const defaultAreaOpacity = shouldStack ? 0.36 : 0.22;
    const resolvedAreaOpacity = areaOpacityOverride ?? defaultAreaOpacity;

    // Build series configs
    const echartsSeriesConfigs = sortedSeries.map((s, index) => {
      const seriesColor = s.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];

      let config: Record<string, unknown> = {
        name: s.name,
        type: chartType,
        data: s.data,
        stack: shouldStack ? "total" : undefined,
        showSymbol: false,
        smooth,
      };

      if (chartType === "line") {
        config.lineStyle = { width: lineWidth, color: seriesColor };

        if (showArea) {
          config.areaStyle = {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: withHexOpacity(seriesColor, resolvedAreaOpacity) },
              { offset: 1, color: withHexOpacity(seriesColor, 0.04) },
            ]),
          };
        }
      } else {
        // Bar chart
        config.barMaxWidth = barMaxWidth;
        config.itemStyle = {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: withHexOpacity(seriesColor, 0.85) },
            { offset: 1, color: withHexOpacity(seriesColor, 0.25) },
          ]),
        };
      }

      // Mark line on first series only
      if (index === 0) {
        config.markLine = {
          silent: true,
          symbol: "none",
          label: { show: false },
          lineStyle: { color: withOpacity(textPrimary, 0.35), width: 1 },
          data: [{ yAxis: 0 }],
        };
      }

      if (seriesOverrides) {
        config = seriesOverrides(config, index);
      }

      return config;
    });

    // Default X-axis formatter
    const defaultXFormatter = (value: number | string) => {
      const numValue = typeof value === "string" ? Number(value) : value;
      return new Intl.DateTimeFormat("en-GB", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }).format(numValue);
    };

    // Default Y-axis formatter
    const defaultYFormatter = (value: number) =>
      percentageMode ? `${Math.round(value)}%` : formatCompactNumber(value);

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
      const maxTooltipValue = Math.max(...sortedPoints.map((p) => Math.abs(p.numericValue)), 0);

      if (tooltipFormatter) {
        return tooltipFormatter(
          sortedPoints.map((p) => ({
            value: p.value,
            seriesName: p.seriesName,
            color: p.color,
          })),
        );
      }

      const rows = sortedPoints
        .map((point) => {
          const v = point.numericValue;
          if (!Number.isFinite(v)) return "";
          const meta = series.find((s) => s.name === point.seriesName);
          const lineColor = meta?.color ?? point.color ?? textPrimary;
          const formattedValue = percentageMode ? `${v.toFixed(1)}%` : formatCompactNumber(v);
          const barWidth = maxTooltipValue > 0 ? clamp((Math.abs(v) / maxTooltipValue) * 100, 0, 100) : 0;
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
        <div class="${DEFAULT_TOOLTIP_CONTAINER_CLASS}">
          <div class="flex-1 font-bold text-[13px] md:text-[1rem] ml-[18px] mb-1">
            <span>${dateLabel}</span>
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
        processedSeries.length === 0
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
      grid,
      xAxis: {
        type: xAxisType,
        show: true,
        boundaryGap: chartType === "bar" ? true : false,
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
    chartType,
    containerHeight,
    emptyStateMessage,
    gridOverride,
    lineWidth,
    numbersXxsTypography,
    optionOverrides,
    percentageMode,
    processedSeries,
    series,
    seriesOverrides,
    showArea,
    smooth,
    stack,
    textXxsTypography,
    tooltipFormatter,
    xAxisLabelFormatter,
    xAxisType,
    yAxisLabelFormatter,
    yAxisMaxOverride,
    yAxisMin,
  ]);

  const containerStyle: React.CSSProperties = {
    height: typeof height === "number" ? `${height}px` : height,
  };

  const watermarkOverlayClassName =
    "pointer-events-none absolute inset-y-0 left-[52px] right-0 z-[40] flex items-center justify-center";

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-[14px] overflow-hidden ${className ?? ""}`}
      style={containerStyle}
    >
      <div ref={tooltipHostRef} className="relative w-full h-full">
        <ReactECharts
          option={chartOption}
          notMerge
          lazyUpdate
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      {showWatermark ? (
        <div className={watermarkOverlayClassName}>
          <ChartWatermarkWithMetricName metricName={watermarkMetricName} className={WATERMARK_CLASS} />
        </div>
      ) : null}
    </div>
  );
}
