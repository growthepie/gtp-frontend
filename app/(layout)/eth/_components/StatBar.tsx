import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import { AccentColor, ACCENT_BG, ACCENT_TEXT, TRACK_BG, FAKE_TEXT, fakeColor } from "./colors";

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
  hint,
  fake = false,
  accentLabel = false,
  icon,
  iconInvertDark = false,
  className = "",
}: {
  label: string;
  value: number;
  display: string;
  max: number;
  color: AccentColor;
  /** The row the story is about — everything else stays recessive. */
  emphasis?: boolean;
  /** Shown in the site's tooltip on hover, e.g. how the value is estimated. */
  hint?: string;
  /** Fake (not-from-JSON) value: brown bar and number while SHOW_FAKE_DATA is on. */
  fake?: boolean;
  /** Colour the label and value like the bar. */
  accentLabel?: boolean;
  /** Logo URL, shown before the label. */
  icon?: string;
  /** Logo is plain black, so flip it to white in dark mode. */
  iconInvertDark?: boolean;
  className?: string;
}) {
  // A value past `max` fills the track and fades out at the end, to show it runs off the scale.
  const overflows = value > max;
  const row = (
    <div
      className={`grid ${icon ? "grid-cols-[minmax(118px,162px)_1fr_64px]" : "grid-cols-[minmax(96px,140px)_1fr_64px]"} gap-x-[10px] items-center ${className}`}
    >
      <div className="flex items-center gap-x-[6px] min-w-0">
        {icon && (
          <Image
            src={icon}
            alt=""
            width={16}
            height={16}
            className={`size-[16px] flex-shrink-0 object-contain ${iconInvertDark ? "dark:invert" : ""}`}
          />
        )}
        <div className={`text-xs md:text-sm truncate ${emphasis ? "font-semibold" : ""} ${accentLabel ? ACCENT_TEXT[color] : ""}`}>
          {label}
        </div>
      </div>
      <div className={`h-[10px] rounded-[4px] ${TRACK_BG} overflow-hidden`}>
        <div
          className={`h-full ${overflows ? "[mask-image:linear-gradient(to_right,black_80%,transparent)]" : "rounded-r-[4px]"} ${ACCENT_BG[fake ? fakeColor(color) : color]} transition-[width] duration-300`}
          style={{ width: `${overflows ? 100 : Math.max(2, (value / max) * 100)}%` }}
        />
      </div>
      <div
        className={`numbers-xs md:numbers-sm text-right ${emphasis ? "" : "text-color-text-primary/70"} ${accentLabel ? ACCENT_TEXT[color] : ""} ${fake ? FAKE_TEXT : ""}`}
      >
        {display}
      </div>
    </div>
  );
  if (!hint) return row;
  // Same tooltip style as the info buttons on the "6 things" cards.
  return (
    <Tooltip placement="top">
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent className="z-50 max-w-[300px] rounded-[8px] bg-color-bg-default p-[12px] shadow-standard text-xs md:text-sm">
        {hint}
      </TooltipContent>
    </Tooltip>
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
  /** `fake`: the value isn't from the JSONs, so it's brown while SHOW_FAKE_DATA is on. */
  items: { label: string; color: AccentColor; value?: string; fake?: boolean }[];
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap ${compact ? "gap-x-[10px]" : "gap-x-[15px]"} gap-y-[5px]`}>
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-x-[5px]">
          <span className={`w-[8px] h-[8px] rounded-full flex-shrink-0 ${ACCENT_BG[i.color]}`} />
          <span className="heading-small-xxxs text-color-text-primary/70">{i.label}</span>
          {i.value && <span className={`numbers-xs ${i.fake ? FAKE_TEXT : ""}`}>{i.value}</span>}
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
