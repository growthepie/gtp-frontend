import { IS_PRODUCTION } from "@/lib/helpers";

// Shared color mapping for the "ETH the Asset" page's hand-rolled visuals.
// Ties every mark to the site's real accent tokens (tailwind.config.js
// `color-accent-*`) instead of ad-hoc hex values.
//
// Palette note: validating the four dark-theme accents as a *categorical* set
// shows petrol (#10808c) below the chroma floor (reads gray on the dark
// surface) and petrol↔red at CVD ΔE 5.8. So this page caps categorical
// encoding at three hues (turquoise / yellow / red) and uses `neutral` for
// context marks — the "emphasis" form: subject in accent, everything else gray.

// `fake` is the brown used to mark data that isn't from the eth_asset JSONs yet —
// see the fake-data markers at the bottom of this file.
export type AccentColor = "turquoise" | "yellow" | "red" | "petrol" | "neutral" | "fake";

export const ACCENT_BG: Record<AccentColor, string> = {
  turquoise: "bg-color-accent-turquoise",
  yellow: "bg-color-accent-yellow",
  red: "bg-color-accent-red",
  petrol: "bg-color-accent-petrol",
  neutral: "bg-color-ui-hover",
  fake: "bg-[#8a5a2b] dark:bg-[#b07a45]",
};

export const ACCENT_TEXT: Record<AccentColor, string> = {
  turquoise: "text-color-accent-turquoise",
  yellow: "text-color-accent-yellow",
  red: "text-color-accent-red",
  petrol: "text-color-accent-petrol",
  neutral: "text-color-text-primary",
  fake: "text-[#8a5a2b] dark:text-[#b07a45]",
};

// Raw paint values for inline SVG fills/strokes, which can't take a class.
export const ACCENT_RGB: Record<AccentColor, string> = {
  turquoise: "rgb(var(--accent-turquoise))",
  yellow: "rgb(var(--accent-yellow))",
  red: "rgb(var(--accent-red))",
  petrol: "rgb(var(--accent-petrol))",
  neutral: "rgb(var(--ui-hover))",
  fake: "#b07a45",
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
    fake: "#8a5a2b",
  },
  dark: {
    turquoise: "#1df7ef",
    yellow: "#ffdf27",
    red: "#fe5468",
    petrol: "#10808c",
    neutral: "#5a6462",
    fake: "#b07a45",
  },
};

// ─── Fake-data markers (temporary) ────────────────────────────────────────────
// While the page is being wired to the eth_asset JSONs, anything still showing
// made-up data is marked: its tile gets a dark purple background, and the fake
// numbers and chart marks turn brown. Fixed facts that aren't from the JSONs
// (12s blocks, settlement times, 24/7, market hours) are marked the same way.
//
// To switch back, set SHOW_FAKE_DATA to false: every marker then falls back to
// the real colour, which is also written at each use, e.g. fakeColor("yellow").
//   · tile background → bg-color-bg-default (Card's normal background)
//   · fake text       → its normal text colour (no extra class)
//   · fake chart mark → the AccentColor passed to fakeColor()
export const SHOW_FAKE_DATA = true;

/** Tile background for tiles with fake data. Real: bg-color-bg-default. */
export const FAKE_TILE_BG = SHOW_FAKE_DATA ? "!bg-[#e6daf5] dark:!bg-[#2a1745]" : "";
/** Selected/hovered state of a fake tile. Real: bg-color-ui-hover. */
export const FAKE_TILE_BG_ACTIVE = SHOW_FAKE_DATA ? "!bg-[#d5c2ee] dark:!bg-[#3d2263]" : "";
/** Hover state of a clickable fake tile. Real: hover:bg-color-ui-hover. */
export const FAKE_TILE_BG_HOVER = SHOW_FAKE_DATA ? "hover:!bg-[#d5c2ee] dark:hover:!bg-[#3d2263]" : "";
/** Text colour for fake numbers. Real: the element's normal text colour. */
export const FAKE_TEXT = SHOW_FAKE_DATA ? "!text-[#8a5a2b] dark:!text-[#b07a45]" : "";
/** Tints full-colour artwork (icons, pictograms) brown. Real: no filter. */
export const FAKE_ART = SHOW_FAKE_DATA ? "sepia" : "";
/** A chart mark's colour: brown while it shows fake data, otherwise `real`. */
export const fakeColor = (real: AccentColor): AccentColor => (SHOW_FAKE_DATA ? "fake" : real);
/** Pick one of the above only when `isFake` (for tiles that are fake in some modes). */
export const ifFake = (isFake: boolean, marker: string) => (isFake ? marker : "");

// ─── Fallback markers (dev only) ──────────────────────────────────────────────
// A fallback is a value shown because the real one didn't arrive: "—" for a value
// whose JSON loaded without it (or failed), or the hourly price standing in for the
// live one. Off in production; anywhere else (local dev, the dev and preview
// deployments) these get the same purple tile and brown text as fake data, so a
// missing value is easy to spot instead of passing for a real one.
export const SHOW_FALLBACK_MARKERS = !IS_PRODUCTION;

/** Tile background for a tile showing a fallback. Production: none. */
export const FALLBACK_TILE_BG = SHOW_FALLBACK_MARKERS ? "!bg-[#e6daf5] dark:!bg-[#2a1745]" : "";
/** Text colour for a fallback value. Production: the element's normal text colour. */
export const FALLBACK_TEXT = SHOW_FALLBACK_MARKERS ? "!text-[#8a5a2b] dark:!text-[#b07a45]" : "";
/** Pick one of the above only when `isFallback`. */
export const ifFallback = (isFallback: boolean, marker: string) => (isFallback ? marker : "");
