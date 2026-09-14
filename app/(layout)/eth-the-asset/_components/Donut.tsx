import { AccentColor, ACCENT_RGB } from "./colors";

export default function Donut({
  segments,
  size = 104,
  thickness = 13,
  center,
}: {
  segments: { label: string; value: number; color: AccentColor }[];
  size?: number;
  thickness?: number;
  center?: React.ReactNode;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;

  // Precompute each segment's cumulative offset (no in-render mutation).
  const arcs = segments.reduce<{ label: string; color: AccentColor; len: number; offset: number }[]>((acc, s) => {
    const len = (s.value / total) * circumference;
    const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].len : 0;
    acc.push({ label: s.label, color: s.color, len, offset });
    return acc;
  }, []);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--bg-medium))" strokeWidth={thickness} />
        {arcs.map((s) => (
          <circle
            key={s.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={ACCENT_RGB[s.color]}
            strokeWidth={thickness}
            strokeDasharray={`${s.len} ${circumference - s.len}`}
            strokeDashoffset={-s.offset}
          />
        ))}
      </svg>
      {center && <div className="absolute inset-0 grid place-items-center text-center leading-tight">{center}</div>}
    </div>
  );
}
