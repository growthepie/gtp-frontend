// Shared color mapping for the "ETH the Asset" page's hand-rolled visuals.
// Ties every mark to the site's real accent tokens (tailwind.config.js
// `color-accent-*`) instead of ad-hoc hex values.
//
// Palette note: validating the four dark-theme accents as a *categorical* set
// shows petrol (#10808c) below the chroma floor (reads gray on the dark
// surface) and petrol↔red at CVD ΔE 5.8. So this page caps categorical
// encoding at three hues (turquoise / yellow / red) and uses `neutral` for
// context marks — the "emphasis" form: subject in accent, everything else gray.

export type AccentColor = "turquoise" | "yellow" | "red" | "petrol" | "neutral";

export const ACCENT_BG: Record<AccentColor, string> = {
  turquoise: "bg-color-accent-turquoise",
  yellow: "bg-color-accent-yellow",
  red: "bg-color-accent-red",
  petrol: "bg-color-accent-petrol",
  neutral: "bg-color-ui-hover",
};

export const ACCENT_TEXT: Record<AccentColor, string> = {
  turquoise: "text-color-accent-turquoise",
  yellow: "text-color-accent-yellow",
  red: "text-color-accent-red",
  petrol: "text-color-accent-petrol",
  neutral: "text-color-text-primary",
};

// Raw paint values for inline SVG fills/strokes, which can't take a class.
export const ACCENT_RGB: Record<AccentColor, string> = {
  turquoise: "rgb(var(--accent-turquoise))",
  yellow: "rgb(var(--accent-yellow))",
  red: "rgb(var(--accent-red))",
  petrol: "rgb(var(--accent-petrol))",
  neutral: "rgb(var(--ui-hover))",
};

// The surface a mark sits on — used for the 2px gaps that separate stacked
// segments (white space does the separating, never a stroke around the mark).
export const SURFACE_RGB = "rgb(var(--bg-default))";
export const TRACK_BG = "bg-color-bg-medium";

// Literal hex per theme, for the few consumers that need a real colour string
// rather than a CSS var — GTPMetricCard builds its sparkline gradient by
// concatenating hex opacity onto this value, so `rgb(var(--…))` won't work.
// Mirrors app/globals.css.
export const ACCENT_HEX: Record<"light" | "dark", Record<AccentColor, string>> = {
  light: {
    turquoise: "#00cfc5",
    yellow: "#e5b300",
    red: "#e83c52",
    petrol: "#0e6f7a",
    neutral: "#cdd8d3",
  },
  dark: {
    turquoise: "#1df7ef",
    yellow: "#ffdf27",
    red: "#fe5468",
    petrol: "#10808c",
    neutral: "#5a6462",
  },
};
