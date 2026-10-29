import { AccentColor, ACCENT_RGB } from "./colors";

// Micro-trend for a stat tile: 2px line, ~10% area wash, no axes or chrome.
// Section-level charts that need hover/crosshair use GTPChart instead.
// pulseEnd adds a pulsing dot on the latest point (for a value that updates live),
// styled like the end dot of the metric cards' sparklines.
export default function Sparkline({
  points,
  color,
  height = 40,
  fill = true,
  pulseEnd = false,
}: {
  points: number[];
  color: AccentColor;
  height?: number;
  fill?: boolean;
  pulseEnd?: boolean;
}) {
  const w = 200;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const y = (v: number) => height - ((v - min) / span) * (height - 4) - 2;
  const d = points.map((v, i) => `${i ? "L" : "M"}${(i / (points.length - 1)) * w},${y(v)}`).join(" ");
  const rgb = ACCENT_RGB[color];

  const svg = (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: pulseEnd ? "100%" : height, display: "block" }}
      aria-hidden="true"
    >
      {fill && <path d={`${d} L${w},${height} L0,${height} Z`} fill={rgb} opacity={0.1} />}
      <path d={d} fill="none" stroke={rgb} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
  if (!pulseEnd) return svg;

  // The svg stretches (preserveAspectRatio="none"), so the dot is an HTML element
  // placed by percentage rather than an svg circle, which would stretch with it.
  const endTop = points.length ? (y(points[points.length - 1]) / height) * 100 : 50;
  return (
    <div className="relative" style={{ height }}>
      {svg}
      <div
        aria-hidden="true"
        className="absolute size-[10px] -translate-x-1/2 -translate-y-1/2 opacity-60 pointer-events-none"
        style={{ left: "100%", top: `${endTop}%` }}
      >
        <div className="absolute inset-0 rounded-full bg-color-text-primary motion-safe:animate-ping" />
        <div className="absolute inset-0 rounded-full bg-color-text-primary" />
      </div>
    </div>
  );
}
