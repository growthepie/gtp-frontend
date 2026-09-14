"use client";

import { AccentColor, ACCENT_BG } from "./colors";

// Before → after, with the change broken into its contributing forces.
// Each force is a bar spanning the distance it moved the value, so the picture
// carries the decomposition that would otherwise need a paragraph.

export type DumbbellStep = { label: string; delta: number; color: AccentColor };

export default function Dumbbell({
  before,
  after,
  steps,
  format,
  unit,
}: {
  before: { label: string; value: number };
  after: { label: string; value: number };
  steps: DumbbellStep[];
  format: (value: number) => string;
  unit: string;
}) {
  // Running positions: start, then one point after each force is applied.
  const points = steps.reduce<number[]>((acc, step) => [...acc, acc[acc.length - 1] + step.delta], [before.value]);
  const all = [...points, after.value];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const pad = 0.08;
  const pos = (value: number) => (pad + ((value - min) / span) * (1 - 2 * pad)) * 100;

  const signed = (n: number) => (n < 0 ? "−" : "+") + format(Math.abs(n));

  return (
    <div className="flex flex-col gap-y-[10px]">
      {/* One row per contributing force */}
      <div className="flex flex-col gap-y-[10px]">
        {steps.map((step, i) => {
          const from = pos(points[i]);
          const to = pos(points[i + 1]);
          const left = Math.min(from, to);
          const width = Math.abs(to - from);
          return (
            <div key={step.label} className="flex flex-col gap-y-[2px]">
              <div className="flex items-baseline justify-between gap-x-[10px]">
                <span className="text-xs md:text-sm">{step.label}</span>
                <span className="numbers-xs md:numbers-sm whitespace-nowrap">
                  {signed(step.delta)} {unit}
                </span>
              </div>
              <div className="relative h-[10px] rounded-[4px] bg-color-bg-medium">
                <div
                  className={`absolute top-0 h-full rounded-[4px] ${ACCENT_BG[step.color]}`}
                  style={{ left: `${left}%`, width: `${Math.max(1.5, width)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* The before → after axis */}
      <div className="relative h-[42px] mt-[5px]">
        <div className="absolute left-0 right-0 top-[5px] h-px bg-color-ui-hover" />
        {[
          { point: before, value: before.value, align: "start" as const },
          { point: after, value: after.value, align: "end" as const },
        ].map(({ point, value }, i) => (
          <div
            key={point.label}
            className="absolute top-0 flex flex-col items-center gap-y-[4px] -translate-x-1/2"
            style={{ left: `${pos(value)}%` }}
          >
            <span
              className={`w-[11px] h-[11px] rounded-full ring-2 ring-color-bg-default ${
                i === 0 ? "bg-color-ui-hover" : ACCENT_BG.turquoise
              }`}
            />
            <span className="numbers-sm whitespace-nowrap">{format(value)}</span>
            <span className="heading-small-xxxs text-color-text-primary/70 whitespace-nowrap">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
