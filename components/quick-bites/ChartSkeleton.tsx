"use client";

import ChartCardWatermark from "./ChartCardWatermark";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";

const PULSE = "bg-color-bg-medium animate-pulse rounded-full";

/**
 * Placeholder with the same layout as a Quick Bite chart card (ChartWrapper): title,
 * axes and gridlines with the watermark, legend pills and the bottom tab bar, shown
 * while the chart's data or code loads, or while the chart is still drawing.
 */
export default function ChartSkeleton({
  height,
  className = "",
  inset = false,
  chartHeight,
}: {
  height?: number | string;
  /** The chart card's height, when `height` is relative (e.g. "100%" as an overlay). */
  chartHeight?: number | string;
  className?: string;
  /** Standalone placeholder: the same side inset ChartWrapper gives the card (md:px-[35px]). */
  inset?: boolean;
}) {
  const card = (
    <div
      role="status"
      aria-live="polite"
      className={`relative flex w-full flex-col gap-y-[12px] overflow-hidden rounded-[18px] bg-color-bg-default px-[8px] pt-[8px] pb-[42px] ${className}`}
      style={{ height }}
    >
      <span className="sr-only">Loading chart…</span>

      {/* Title row, as in the chart header */}
      <div aria-hidden className="flex items-center gap-x-[6px] pt-[4px] pl-[6px] pb-[4px]">
        <div className={`size-[12px] ${PULSE}`} />
        <div className={`h-[8px] w-[45%] max-w-[260px] ${PULSE}`} />
      </div>

      {/* Same component and position as the loaded chart's watermark, so it doesn't jump */}
      <ChartCardWatermark height={chartHeight ?? height} />

      {/* Plot: y-axis labels, gridlines and a pulsing area */}
      <div aria-hidden className="relative flex min-h-0 flex-1 gap-x-[10px] pl-[6px] pr-[10px]">
        <div className="flex w-[28px] shrink-0 flex-col justify-between py-[2px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-[6px] w-[22px] ${PULSE}`} />
          ))}
        </div>
        <div className="relative flex-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="absolute inset-x-0 h-px bg-color-bg-medium" style={{ top: `calc(${(i / 4) * 100}% + 2px)` }} />
          ))}
          <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full animate-pulse">
            <path
              d="M0 72 C40 62 70 76 110 58 S180 34 220 48 S300 24 340 32 S390 18 400 20 V100 H0 Z"
              fill="rgb(var(--bg-medium))"
              opacity="0.5"
            />
          </svg>
        </div>
      </div>

      {/* X-axis labels */}
      <div aria-hidden className="flex justify-between pl-[44px] pr-[10px]">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-[6px] w-[36px] ${PULSE}`} />
        ))}
      </div>

      {/* Legend pills, centred like the chart's legend */}
      <div aria-hidden className="flex min-h-[24px] items-center justify-center gap-[5px]">
        {[90, 110, 100].map((w, i) => (
          <div key={i} className="flex h-[20px] items-center gap-x-[6px] rounded-full bg-color-bg-medium px-[8px]" style={{ width: w }}>
            <div className="size-[6px] rounded-full bg-color-ui-hover" />
            <div className="h-[5px] flex-1 rounded-full bg-color-ui-hover animate-pulse" />
          </div>
        ))}
      </div>

      {/* Bottom bar: the same tab bar container as the chart's share / export / replay bar */}
      <div aria-hidden className="absolute inset-x-0 bottom-0">
        <GTPButtonContainer>
          <div className="flex h-[32px] items-center gap-x-[14px] px-[12px]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="size-[14px] rounded-full bg-color-ui-hover animate-pulse" />
            ))}
          </div>
        </GTPButtonContainer>
      </div>
    </div>
  );
  return inset ? <div className="md:px-[35px]">{card}</div> : card;
}
