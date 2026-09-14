import { AccentColor, ACCENT_RGB } from "./colors";

export default function Sparkline({
  points,
  color,
  height = 40,
  fill = true,
}: {
  points: number[];
  color: AccentColor;
  height?: number;
  fill?: boolean;
}) {
  const w = 200;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const d = points
    .map((v, i) => `${i ? "L" : "M"}${(i / (points.length - 1)) * w},${height - ((v - min) / span) * (height - 4) - 2}`)
    .join(" ");
  const rgb = ACCENT_RGB[color];

  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      {fill && <path d={`${d} L${w},${height} L0,${height} Z`} fill={rgb} opacity={0.16} />}
      <path d={d} fill="none" stroke={rgb} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
