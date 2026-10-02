import { AccentColor, ACCENT_BG, TRACK_BG } from "./colors";

// Mark specs used across this page's bars:
//   · bar thickness capped (never fills its slot — the leftover band is air)
//   · 4px rounded data-end, square at the baseline
//   · 2px surface-colour gap between touching segments (no stroke around marks)

/** A labelled horizontal bar: label — track+fill — value. */
export function BarRow({
  label,
  value,
  display,
  max,
  color,
  emphasis = false,
}: {
  label: string;
  value: number;
  display: string;
  max: number;
  color: AccentColor;
  /** The row the story is about — everything else stays recessive. */
  emphasis?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(96px,140px)_1fr_64px] gap-x-[10px] items-center">
      <div className={`text-xs md:text-sm truncate ${emphasis ? "font-semibold" : ""}`}>{label}</div>
      <div className={`h-[10px] rounded-[4px] ${TRACK_BG} overflow-hidden`}>
        <div
          className={`h-full rounded-r-[4px] ${ACCENT_BG[color]} transition-[width] duration-300`}
          style={{ width: `${Math.max(2, (value / max) * 100)}%` }}
        />
      </div>
      <div className={`numbers-xs md:numbers-sm text-right ${emphasis ? "" : "text-color-text-primary/70"}`}>{display}</div>
    </div>
  );
}

/**
 * A part-to-whole bar split into coloured segments, separated by 2px of the
 * surface colour. Segments are direct-labelled by the companion <Legend/>.
 */
export function StackBar({
  parts,
  height = 14,
}: {
  parts: { label: string; value: number; color: AccentColor }[];
  height?: number;
}) {
  const total = parts.reduce((sum, p) => sum + p.value, 0) || 1;
  return (
    <div className="flex gap-[2px] w-full" style={{ height }}>
      {parts.map((p, i) => (
        <div
          key={p.label}
          title={`${p.label}: ${p.value}`}
          className={`${ACCENT_BG[p.color]} transition-[width] duration-300 ${i === 0 ? "rounded-l-[4px]" : ""} ${
            i === parts.length - 1 ? "rounded-r-[4px]" : ""
          }`}
          style={{ width: `${(p.value / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

export function Legend({
  items,
  compact = false,
}: {
  items: { label: string; color: AccentColor; value?: string }[];
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap ${compact ? "gap-x-[10px]" : "gap-x-[15px]"} gap-y-[5px]`}>
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-x-[5px]">
          <span className={`w-[8px] h-[8px] rounded-full flex-shrink-0 ${ACCENT_BG[i.color]}`} />
          <span className="heading-small-xxxs text-color-text-primary/70">{i.label}</span>
          {i.value && <span className="numbers-xs">{i.value}</span>}
        </div>
      ))}
    </div>
  );
}

/** Label above, value below — the house KPI pair (MetricsTop.tsx:471-478). */
export function StatPair({
  label,
  value,
  unit,
  valueClassName = "numbers-md",
}: {
  label: string;
  value: string;
  unit?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-y-[2px]">
      <div className="heading-small-xxxs text-color-text-primary/70">{label}</div>
      <div className="flex items-baseline gap-x-[4px]">
        <span className={valueClassName}>{value}</span>
        {unit && <span className="heading-small-xxxs pt-[1px]">{unit}</span>}
      </div>
    </div>
  );
}
