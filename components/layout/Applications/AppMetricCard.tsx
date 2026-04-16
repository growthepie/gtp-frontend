"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "@/lib/echarts-setup";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import dayjs from "@/lib/dayjs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatLargeNumber = (value: number, decimals = 2): string => {
  if (value == null || isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e9) return (value / 1e9).toFixed(decimals) + "B";
  if (abs >= 1e6) return (value / 1e6).toFixed(decimals) + "M";
  if (abs >= 1e3) return (value / 1e3).toFixed(decimals) + "K";
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
}

// ─── Sparkline chart ──────────────────────────────────────────────────────────

interface SparklineChartProps {
  values: number[];
  timestamps: string[];
  color: string;
  label: string;
  prefix: string;
  suffix: string;
}

const SparklineChart = ({ values, timestamps, color, label, prefix, suffix }: SparklineChartProps) => {
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

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const yAxisMin =
    minValue > 0
      ? Math.max(0, minValue - (maxValue - minValue) * 0.15)
      : minValue - (maxValue - minValue) * 0.15;

  const option = {
    xAxis: { type: "category", data: timestamps, show: false },
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
      className="h-[40px] relative w-full z-10 overflow-visible"
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
            <span className="numbers-xs text-color-text-primary font-medium">
              {prefix}{formatLargeNumber(customTooltip.value, 2)}{suffix}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────

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
      className="group relative rounded-[15px] bg-color-bg-default hover:bg-color-ui-hover xs:p-[10px] p-[15px]  flex justify-between h-2xl transition-colors duration-200 cursor-pointer"
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

      {/* Middle: sparkline */}
      <div className="flex-1 flex justify-center items-center max-w-[95px] xs:max-w-[160px] overflow-visible ">
        <SparklineChart
          values={sparkline}
          timestamps={timestamps}
          color={color}
          label={label}
          prefix={prefix}
          suffix={suffix}
        />
      </div>

      {/* Right: value + WoW */}
      <div className="flex flex-col gap-y-[2px] justify-center items-end min-w-[80px] md:min-w-[90px] pl-[5px] group-hover:pr-[20px] transition-all duration-200 ">
        <div className="numbers-sm xs:numbers-md group-hover:!text-color-text-primary" style={{ color }}>
          {prefix}{formatLargeNumber(value, 2)}{suffix}
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
      <div className="absolute right-[10px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none" className="text-color-text-primary">
          <path d="M0.662115 2.29808C0.293362 1.89949 0.278805 1.2785 0.645793 0.862551C1.01283 0.44657 1.63111 0.383401 2.07253 0.699746L2.15833 0.767964L7.62295 5.58974C9.02778 6.82932 9.07141 8.99007 7.75437 10.2872L7.62295 10.4103L2.15833 15.232L2.07253 15.3003C1.63111 15.6166 1.01283 15.5534 0.645793 15.1375C0.278805 14.7215 0.293362 14.1005 0.662115 13.7019L0.740378 13.6249L6.205 8.80356L6.24895 8.76255C6.68803 8.33017 6.67331 7.60965 6.205 7.19644L0.740378 2.37508L0.662115 2.29808Z" fill="currentColor"/>
        </svg>
      </div>
    </div>
  );
}
