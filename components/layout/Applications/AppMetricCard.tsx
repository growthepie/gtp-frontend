"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "@/lib/echarts-setup";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import dayjs from "@/lib/dayjs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Cap on escalated precision for sub-unit values (e.g. token price in ETH)
const MAX_SMALL_DECIMALS = 8;

const formatLargeNumber = (value: number, decimals = 2): string => {
  if (value == null || isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e9) return (value / 1e9).toFixed(decimals) + "B";
  if (abs >= 1e6) return (value / 1e6).toFixed(decimals) + "M";
  if (abs >= 1e3) return (value / 1e3).toFixed(decimals) + "K";
  // Escalate decimals for small non-zero values so they don't render as "0.00".
  // Show at least 2 significant figures, capped at MAX_SMALL_DECIMALS.
  if (abs > 0 && abs < 0.5 * Math.pow(10, -decimals)) {
    const needed = Math.ceil(-Math.log10(abs)) + 1;
    return value.toFixed(Math.min(MAX_SMALL_DECIMALS, Math.max(decimals, needed)));
  }
  return value.toFixed(decimals);
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GTPMetricCardProps {
  label: string;
  /** Default icon — used when leftIcon is not provided. */
  icon?: GTPIconName;
  /** Latest value */
  value: number;
  /** Value one week ago — used to compute WoW %. Ignored when wowChange is provided. */
  prevValue?: number;
  /** Pre-computed WoW % change (e.g. 5.2 for +5.2%). Takes precedence over prevValue. */
  wowChange?: number;
  prefix?: string;
  suffix?: string;
  /** Raw array of values, newest last */
  sparkline: number[];
  /** Timestamps aligned with sparkline values. Generated if not provided. */
  timestamps?: string[];
  /** Brand / accent color for the chart line and value */
  color: string;
  onClick?: () => void;
  /** Custom left-side element. Replaces the default GTPIcon when provided. */
  leftIcon?: React.ReactNode;
  /** Decimal places for the value and sparkline tooltip. Defaults to 2. */
  decimals?: number;
  /** Move the suffix onto its own line when the card is narrower than 400px, instead of wrapping by chance. */
  stackSuffixWhenNarrow?: boolean;
  /**
   * Let the sparkline fill the card instead of stopping at 160px. The value column is
   * then a fixed width, so every card's sparkline starts and ends at the same points
   * (measured from the card edges) whatever the length of its value.
   */
  fillSparkline?: boolean;
  /**
   * For cards that don't link anywhere: no hover background, pointer cursor, chevron,
   * value shift (the 20px that makes room for the chevron) or value colour change.
   */
  nonInteractive?: boolean;
}

// ─── Sparkline chart ──────────────────────────────────────────────────────────

interface SparklineChartProps {
  values: number[];
  timestamps: string[];
  color: string;
  label: string;
  prefix: string;
  suffix: string;
  height?: number;
  decimals?: number;
  /**
   * Draw the line from the very first to the very last pixel. By default ECharts leaves
   * half a category of padding at each end, so series with fewer points look shorter.
   */
  edgeToEdge?: boolean;
}

export const SparklineChart = ({ values, timestamps, color, label, prefix, suffix, height = 40, decimals = 2, edgeToEdge = false }: SparklineChartProps) => {
  const chartRef = useRef<ReactEChartsCore>(null);

  const [circlePosition, setCirclePosition] = useState<{ x: number; y: number } | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const [customTooltip, setCustomTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    value: number;
    date: string;
  }>({ visible: false, x: 0, y: 0, value: 0, date: "" });

  const updateCirclePosition = useCallback(
    (index: number) => {
      const chart = chartRef.current?.getEchartsInstance();
      if (!chart || index < 0 || index >= values.length) return;
      const px = chart.convertToPixel("grid", [index, values[index]]);
      if (px) setCirclePosition({ x: px[0], y: px[1] });
    },
    [values],
  );

  useEffect(() => {
    if (isHovering) return;
    const id = setTimeout(() => updateCirclePosition(values.length - 1), 100);
    return () => clearTimeout(id);
  }, [values, updateCirclePosition, isHovering]);

  // ECharts doesn't reliably notice when only its container (not the window) changes
  // size — e.g. a grid switching column count — so the canvas kept its old width and
  // spilled over the value. Resize it ourselves and move the end-point dot with it.
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      chartRef.current?.getEchartsInstance().resize();
      updateCirclePosition(values.length - 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateCirclePosition, values.length]);

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const yAxisMin =
    minValue > 0
      ? Math.max(0, minValue - (maxValue - minValue) * 0.15)
      : minValue - (maxValue - minValue) * 0.15;

  const option = {
    xAxis: { type: "category", data: timestamps, show: false, ...(edgeToEdge ? { boundaryGap: false } : {}) },
    yAxis: { type: "value", show: false, min: yAxisMin },
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    tooltip: {
      show: true,
      trigger: "axis",
      formatter: () => "",
      backgroundColor: "transparent",
      borderWidth: 0,
      axisPointer: { type: "line", lineStyle: { color: "#CDD8D3", width: 1, type: "solid" } },
    },
    series: [
      {
        data: values,
        type: "line",
        silent: true,
        smooth: false,
        symbolSize: 0,
        lineStyle: { color, width: 2 },
        itemStyle: { color },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + "33" },
              { offset: 1, color: color + "00" },
            ],
          },
        },
      },
    ],
  };

  const handleInteract = (clientX: number, clientY: number, rect: DOMRect) => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) return;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const dp = chart.convertFromPixel("grid", [x, y]);
    if (dp && dp[0] >= 0 && dp[0] < values.length) {
      const idx = Math.round(dp[0]);
      updateCirclePosition(idx);
      setCustomTooltip({ visible: true, x, y, value: values[idx], date: timestamps[idx] });
      setIsHovering(true);
    } else {
      setCustomTooltip((p) => ({ ...p, visible: false }));
    }
  };

  const handleEnd = () => {
    setIsHovering(false);
    setCustomTooltip((p) => ({ ...p, visible: false }));
    updateCirclePosition(values.length - 1);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full z-10 overflow-visible"
      style={{ height }}
      onMouseMove={(e) => handleInteract(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => handleInteract(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget.getBoundingClientRect())}
      onTouchEnd={handleEnd}
    >
      <ReactEChartsCore
        echarts={echarts}
        ref={chartRef}
        option={option}
        style={{ height: "100%", width: "100%" }}
        opts={{
          renderer: "canvas",
          devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
        }}
      />

      {/* Dot at current / hovered data point */}
      {circlePosition && (
        <div
          className="absolute w-[10px] h-[10px] rounded-full pointer-events-none z-[60]"
          style={{
            left: circlePosition.x - 5,
            top: circlePosition.y - 5,
            backgroundColor:
              typeof window !== "undefined"
                ? getComputedStyle(document.documentElement).getPropertyValue("--color-text-primary").trim() || "#fff"
                : "#fff",
            opacity: 0.6,
          }}
        />
      )}

      {/* Tooltip */}
      {customTooltip.visible && (
        <div
          className="absolute pointer-events-none z-[999] bg-color-bg-default/95 rounded-[15px] px-3 pt-3 pb-4 min-w-[150px] text-xs font-raleway"
          style={{
            left: customTooltip.x + 8,
            top: customTooltip.y - 60,
            boxShadow: "0px 0px 27px 0px var(--color-ui-shadow, #151A19)",
          }}
        >
          <div className="heading-small-xs text-color-text-primary mb-2 pl-[21px]">
            {dayjs.utc(customTooltip.date).format("DD MMM YYYY")}
          </div>
          <div className="flex justify-between items-center gap-x-[10px] h-[12px]">
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 rounded-r-full" style={{ backgroundColor: color }} />
              <span className="text-xs whitespace-nowrap text-color-text-primary">{label}</span>
            </div>
            <span className={`numbers-xs text-color-text-primary font-medium ${edgeToEdge ? "whitespace-nowrap" : ""}`}>
              {prefix}{formatLargeNumber(customTooltip.value, decimals)}{suffix}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────

// fillSparkline sizing, measured against the card itself (not the label/value text).
// The sparkline area spans from the label column to 20px before the 100px value column,
// and the line is centred in it at clamp(25% of the card, the whole area, 300px).
// 25cqw = 25% of the card's width (the card is an @container). Keep the minimum at or
// below the area on the narrowest card, or the line spills over the label/value:
// at 420px (/eth's narrowest 2-column card) the area is 105px = 25%. Written out in full so
// Tailwind can see the classes.
const FILL_SPARKLINE_AREA =
  "absolute top-0 bottom-0 left-[95px] xs:left-[90px] md:left-[185px] right-[135px] xs:right-[130px] flex justify-center items-center overflow-visible";
const FILL_SPARKLINE_WIDTH = "w-[clamp(25cqw,100%,300px)]";

export default function GTPMetricCard({
  label,
  icon,
  value,
  wowChange: wowChangeProp,
  prefix = "",
  suffix = "",
  sparkline,
  timestamps: timestampsProp,
  color,
  onClick,
  leftIcon,
  decimals = 2,
  stackSuffixWhenNarrow = false,
  fillSparkline = false,
  nonInteractive = false,
}: GTPMetricCardProps) {
  const computedWowChange =
    wowChangeProp !== undefined
      ? wowChangeProp
      : 0;
  const isPositive = computedWowChange >= 0;

  const timestamps =
    timestampsProp ??
    sparkline.map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (sparkline.length - 1 - i));
      return d.toISOString().slice(0, 10);
    });

  return (
    <div
      className={`@container group relative rounded-[15px] bg-color-bg-default ${nonInteractive ? "" : "hover:bg-color-ui-hover cursor-pointer"} xs:p-[10px] p-[15px]  flex justify-between h-2xl transition-colors duration-200`}
      onClick={onClick}
    >
      {/* Left: icon + label */}
      <div className="flex items-center gap-x-[10px] w-[80px] md:min-w-[175px] ">
        {leftIcon ?? (icon && (
          <GTPIcon
            icon={icon}
            className="!w-[15px] !h-[15px] xs:!w-[24px] xs:!h-[24px]"
            containerClassName="!size-[28px] flex items-center justify-center"
          />
        ))}
        <div className="heading-large-xxs xs:heading-large-xs">{label}</div>
      </div>

      {/* Middle: sparkline. With fillSparkline its area is pinned to fixed distances from
          the card's own edges and the line is centred in it, so the label and value text
          can't move it and every card's line starts and ends at the same x. */}
      {fillSparkline ? (
        <div className={FILL_SPARKLINE_AREA}>
          <div className={FILL_SPARKLINE_WIDTH}>
            <SparklineChart
              values={sparkline}
              timestamps={timestamps}
              color={color}
              label={label}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
              edgeToEdge
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-w-0 flex justify-center items-center max-w-[95px] xs:max-w-[160px] overflow-visible">
          <SparklineChart
            values={sparkline}
            timestamps={timestamps}
            color={color}
            label={label}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
          />
        </div>
      )}

      {/* Right: value + WoW */}
      <div
        className={`flex flex-col gap-y-[2px] justify-center items-end pl-[5px] ${nonInteractive ? "" : "group-hover:pr-[20px]"} transition-all duration-200 ${
          fillSparkline ? "w-[100px] shrink-0" : "min-w-[80px] md:min-w-[90px]"
        }`}
      >
        <div
          className={`numbers-sm xs:numbers-md ${nonInteractive ? "" : "group-hover:!text-color-text-primary"} ${fillSparkline ? "whitespace-nowrap" : ""}`}
          style={{ color }}
        >
          {stackSuffixWhenNarrow ? (
            <>
              <span className="whitespace-nowrap">{prefix}{formatLargeNumber(value, decimals)}</span>
              <span className="block @[400px]:inline whitespace-nowrap text-right">{suffix}</span>
            </>
          ) : (
            <>{prefix}{formatLargeNumber(value, decimals)}{suffix}</>
          )}
        </div>
        <div
          className="numbers-xxs"
          style={{ color: isPositive ? "rgb(var(--positive))" : "rgb(var(--negative))" }}
        >
          {Intl.NumberFormat("en-US", {
            maximumFractionDigits: 2,
            minimumFractionDigits: 1,
            signDisplay: "exceptZero",
          }).format(computedWowChange)}%
        </div>
      </div>

      {/* Hover chevron */}
      {!nonInteractive && (
        <div className="absolute right-[10px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none" className="text-color-text-primary">
            <path d="M0.662115 2.29808C0.293362 1.89949 0.278805 1.2785 0.645793 0.862551C1.01283 0.44657 1.63111 0.383401 2.07253 0.699746L2.15833 0.767964L7.62295 5.58974C9.02778 6.82932 9.07141 8.99007 7.75437 10.2872L7.62295 10.4103L2.15833 15.232L2.07253 15.3003C1.63111 15.6166 1.01283 15.5534 0.645793 15.1375C0.278805 14.7215 0.293362 14.1005 0.662115 13.7019L0.740378 13.6249L6.205 8.80356L6.24895 8.76255C6.68803 8.33017 6.67331 7.60965 6.205 7.19644L0.740378 2.37508L0.662115 2.29808Z" fill="currentColor"/>
          </svg>
        </div>
      )}
    </div>
  );
}
