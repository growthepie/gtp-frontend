// Shared ECharts utilities — extracted from GTPChart and GTPUniversalChart
// to eliminate duplication across chart components.

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getCssVarAsRgb = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!value) return fallback;
  const parts = value.split(" ").filter(Boolean);
  return `rgb(${parts.join(", ")})`;
};

export const withOpacity = (color: string, opacity: number) => {
  if (!color.startsWith("rgb(")) return color;
  return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
};

export const withHexOpacity = (color: string, opacity: number) => {
  if (!color.startsWith("#") || (color.length !== 7 && color.length !== 9)) return color;
  if (color.length === 9) return color;
  const alpha = Math.round(clamp(opacity, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${color}${alpha}`;
};

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export type TailwindTypographyStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: string;
  fontFeatureSettings?: string;
};

export const readTailwindTypographyStyle = (
  className: string,
  fallback: TailwindTypographyStyle,
): TailwindTypographyStyle => {
  if (typeof window === "undefined" || typeof document === "undefined") return fallback;

  const probe = document.createElement("span");
  probe.className = className;
  probe.textContent = "0";
  probe.style.position = "fixed";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.left = "-9999px";
  probe.style.top = "-9999px";
  document.body.appendChild(probe);

  const computed = window.getComputedStyle(probe);
  const parsedFontSize = Number.parseFloat(computed.fontSize);
  const parsedFontWeight = Number.parseInt(computed.fontWeight, 10);
  const parsedLineHeight = Number.parseFloat(computed.lineHeight);
  const parsedFontFeatureSettings = computed.fontFeatureSettings?.trim();

  const result = {
    fontFamily: computed.fontFamily || fallback.fontFamily,
    fontSize: Number.isFinite(parsedFontSize) ? parsedFontSize : fallback.fontSize,
    fontWeight: Number.isFinite(parsedFontWeight) ? parsedFontWeight : fallback.fontWeight,
    lineHeight: Number.isFinite(parsedLineHeight) ? parsedLineHeight : fallback.lineHeight,
    letterSpacing:
      computed.letterSpacing && computed.letterSpacing !== "normal" ? computed.letterSpacing : fallback.letterSpacing,
    fontFeatureSettings:
      parsedFontFeatureSettings && parsedFontFeatureSettings !== "normal"
        ? parsedFontFeatureSettings
        : fallback.fontFeatureSettings,
  } satisfies TailwindTypographyStyle;

  probe.remove();
  return result;
};

export const formatCompactNumber = (value: number, decimals?: number) => {
  const isCompact = Math.abs(value) >= 1000;
  const defaultMax = Math.abs(value) >= 100_000_000_000 ? 0 : 2;
  const maxDecimals = isCompact
    ? (decimals !== undefined ? Math.max(decimals, defaultMax) : defaultMax)
    : (decimals ?? defaultMax);
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: isCompact ? Math.min(2, maxDecimals) : 0,
  }).format(value);
};

export const DEFAULT_COLORS = [
  "#1C1CFF", "#12AAFF", "#FF0420", "#0052FF", "#7B3FE4",
  "#4E529A", "#EC796B", "#61DFFF", "#FFEEDA", "#00DACC",
];

export const DEFAULT_GRID = { left: 60, right: 0, top: 4, bottom: 27 };

export const resolveSeriesColors = (
  color: string | [string, string] | undefined,
  fallback: string,
): [string, string] => {
  if (!color) return [fallback, fallback];
  if (Array.isArray(color)) return color;
  return [color, color];
};
