// Shared accent-color mapping for the "ETH the Asset" page's small hand-rolled
// visuals (bars, donut, sparklines). Ties every visual to the site's real accent
// tokens (tailwind.config.js `color-accent-*`) instead of ad-hoc hex values.

export type AccentColor = "turquoise" | "yellow" | "red" | "petrol" | "muted";

export const ACCENT_BG: Record<AccentColor, string> = {
  turquoise: "bg-color-accent-turquoise",
  yellow: "bg-color-accent-yellow",
  red: "bg-color-accent-red",
  petrol: "bg-color-accent-petrol",
  muted: "bg-color-bg-medium",
};

export const ACCENT_TEXT: Record<AccentColor, string> = {
  turquoise: "text-color-accent-turquoise",
  yellow: "text-color-accent-yellow",
  red: "text-color-accent-red",
  petrol: "text-color-accent-petrol",
  muted: "text-color-text-secondary",
};

// Raw rgb() values for contexts that need an actual paint color (inline SVG
// fill/stroke), sourced from the dark-theme accent values in app/globals.css.
export const ACCENT_RGB: Record<AccentColor, string> = {
  turquoise: "rgb(var(--accent-turquoise))",
  yellow: "rgb(var(--accent-yellow))",
  red: "rgb(var(--accent-red))",
  petrol: "rgb(var(--accent-petrol))",
  muted: "rgb(var(--bg-medium))",
};
