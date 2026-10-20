import { FAKE_TILE_BG, FALLBACK_TILE_BG } from "./colors";

export default function Card({
  children,
  className = "",
  padded = true,
  fake = false,
  fallback = false,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  /** Shows fake (not-from-JSON) data: dark purple background while SHOW_FAKE_DATA is on. */
  fake?: boolean;
  /** Shows a fallback value (the real one didn't arrive): purple background on dev, nothing in production. */
  fallback?: boolean;
}) {
  return (
    <div
      className={`rounded-[15px] bg-color-bg-default shadow-standard flex flex-col gap-y-[10px] ${padded ? "p-[15px]" : ""} ${fake ? FAKE_TILE_BG : ""} ${fallback ? FALLBACK_TILE_BG : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/** The house callout shape (CalloutBlock.tsx): tinted panel + left rule, full-size text. */
export function Callout({
  children,
  color = "border-color-ui-hover",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className={`p-[15px] bg-color-bg-medium rounded-[15px] border-l-4 ${color} text-xs md:text-sm`}>{children}</div>
  );
}
