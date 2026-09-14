import { AccentColor, ACCENT_BG } from "./colors";

// A single labeled horizontal bar: label — bar — value.
export function BarRow({
  label,
  value,
  display,
  max,
  color,
  muted = false,
}: {
  label: string;
  value: number;
  display: string;
  max: number;
  color: AccentColor;
  muted?: boolean;
}) {
  return (
    <div className="grid grid-cols-[132px_1fr_76px] gap-x-[10px] items-center">
      <div className={`text-xs truncate ${muted ? "text-color-text-secondary" : "text-color-text-primary"}`}>{label}</div>
      <div className="h-[10px] rounded-full bg-color-bg-medium overflow-hidden">
        <div
          className={`h-full rounded-full ${ACCENT_BG[color]} transition-[width] duration-300`}
          style={{ width: `${Math.max(2, (value / max) * 100)}%` }}
        />
      </div>
      <div className={`numbers-sm text-right ${muted ? "text-color-text-secondary" : "text-color-text-primary"}`}>{display}</div>
    </div>
  );
}

// A single bar split into colored parts (proportional to their values).
export function StackBar({
  parts,
  height = 15,
}: {
  parts: { label: string; value: number; color: AccentColor }[];
  height?: number;
}) {
  const total = parts.reduce((sum, p) => sum + p.value, 0) || 1;
  return (
    <div className="flex rounded-full bg-color-bg-medium overflow-hidden" style={{ height }}>
      {parts.map((p) => (
        <div
          key={p.label}
          title={p.label}
          className={`${ACCENT_BG[p.color]} transition-[width] duration-300`}
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
    <div className={`flex flex-wrap ${compact ? "gap-x-[10px]" : "gap-x-[15px]"} gap-y-[6px]`}>
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-x-[5px]">
          <span className={`w-[8px] h-[8px] rounded-full flex-shrink-0 ${ACCENT_BG[i.color]}`} />
          <span className="heading-caps-xxs text-color-text-secondary">{i.label}</span>
          {i.value && <span className="numbers-xxs">{i.value}</span>}
        </div>
      ))}
    </div>
  );
}
