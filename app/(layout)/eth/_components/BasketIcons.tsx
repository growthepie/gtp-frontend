"use client";

import { useId, type ReactElement } from "react";

// Hand-drawn item illustrations for the shopping-basket section.
//
// Why hand-drawn: the `gtp:` icon set (the only collection bundled locally) has
// no consumer-goods vocabulary, and every other Iconify set resolves over the
// network from api.iconify.design at render time — not something to put on a
// public page's critical path. So these are layered inline SVG: a gradient base
// in a brand hue, a highlight, a shading pass and a contact shadow.
//
// Each glyph paints inside a 0 0 48 48 viewBox and takes a `uid` so its gradient
// ids stay unique when the same glyph renders many times on one page
// (the collision gotcha handled the same way in components/sidebar/NewBadge.tsx).

export type GlyphPart = (props: { uid: string }) => ReactElement;

export type BasketGlyph = {
  key: string;
  Defs: GlyphPart;
  Body: GlyphPart;
};

/** React's useId contains colons, which are unsafe inside url(#…) references. */
export const useGlyphId = () => useId().replace(/[^a-zA-Z0-9]/g, "");

const WARM = { from: "rgb(var(--accent-red))", to: "rgb(var(--accent-yellow))" };
const GOLD = { from: "rgb(var(--accent-yellow))", to: "rgb(var(--accent-red))" };
const COOL = { from: "rgb(var(--accent-turquoise))", to: "rgb(var(--accent-petrol))" };

const LinearGradient = ({
  id,
  from,
  to,
  x1 = "0",
  y1 = "0",
  x2 = "0",
  y2 = "1",
}: {
  id: string;
  from: string;
  to: string;
  x1?: string;
  y1?: string;
  x2?: string;
  y2?: string;
}) => (
  <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
    <stop offset="0%" stopColor={from} />
    <stop offset="100%" stopColor={to} />
  </linearGradient>
);

const HIGHLIGHT = "#ffffff";
const SHADE = "#000000";

/* ── Egg ─────────────────────────────────────────────────────────────────── */
const EggDefs: GlyphPart = ({ uid }) => (
  <LinearGradient id={`${uid}-egg`} from="rgb(var(--accent-yellow))" to="rgb(var(--accent-red))" y2="1.1" />
);
const EggBody: GlyphPart = ({ uid }) => (
  <>
    <ellipse cx="24" cy="44" rx="10" ry="2.2" fill={SHADE} opacity="0.25" />
    <path d="M24 5.5C31.2 5.5 38 16 38 26c0 9.2-6.3 16-14 16s-14-6.8-14-16C10 16 16.8 5.5 24 5.5Z" fill={`url(#${uid}-egg)`} />
    <path
      d="M31.8 13.4C35.4 17.8 37 22 37 26.4c0 9-6 15.3-13.2 15.5 5.2-1.9 9.6-7.9 9.6-15.6 0-4.8-.8-9-1.6-12.9Z"
      fill={SHADE}
      opacity="0.2"
    />
    <path
      d="M16.6 13.9c1.9-3 4.8-5.2 7.6-5.6-3.2 2-6.2 5.9-7.6 10.3-.7 2.2-1 4-1.1 5.9-1.3-3.6-.8-7.6 1.1-10.6Z"
      fill={HIGHLIGHT}
      opacity="0.38"
    />
  </>
);

/* ── Bread ───────────────────────────────────────────────────────────────── */
const BreadDefs: GlyphPart = ({ uid }) => <LinearGradient id={`${uid}-bread`} from={WARM.to} to={WARM.from} />;
const BreadBody: GlyphPart = ({ uid }) => (
  <>
    <ellipse cx="24" cy="40.5" rx="15" ry="2.2" fill={SHADE} opacity="0.25" />
    <path
      d="M8 30c0-10.2 5.4-16.5 16-16.5S40 19.8 40 30v4.2c0 2-1.6 3.6-3.6 3.6H11.6C9.6 37.8 8 36.2 8 34.2Z"
      fill={`url(#${uid}-bread)`}
    />
    <path d="M8 32.4h32v1.8c0 2-1.6 3.6-3.6 3.6H11.6C9.6 37.8 8 36.2 8 34.2Z" fill={HIGHLIGHT} opacity="0.16" />
    <path
      d="M31.6 14.9C36.9 17.5 40 22.5 40 30v4.2c0 2-1.6 3.6-3.6 3.6h-3.6c2-.1 3.2-1.6 3.2-3.6V30c0-6.7-1.6-11.7-4.4-15.1Z"
      fill={SHADE}
      opacity="0.2"
    />
    <path
      d="M12.4 27.6c.9-5.6 4.2-9.4 9.6-11-4.9 2.7-7.7 6.9-8.6 12.6-.2 1.3-.3 2.6-.3 3.9h-1.6c0-1.9.2-3.7.9-5.5Z"
      fill={HIGHLIGHT}
      opacity="0.32"
    />
    <g stroke={SHADE} strokeOpacity="0.28" strokeWidth="2" strokeLinecap="round">
      <path d="M15.5 22.5 19 18.6" />
      <path d="M22.8 21.2 26.3 17.3" />
      <path d="M30 22.2 33 19" />
    </g>
  </>
);

/* ── Coffee ──────────────────────────────────────────────────────────────── */
const CoffeeDefs: GlyphPart = ({ uid }) => (
  <>
    <LinearGradient id={`${uid}-cup`} from="rgb(var(--accent-red))" to="rgb(var(--accent-yellow))" x2="1" y2="0.6" />
    <LinearGradient id={`${uid}-brew`} from={SHADE} to="rgb(var(--accent-red))" />
  </>
);
const CoffeeBody: GlyphPart = ({ uid }) => (
  <>
    <g stroke="rgb(var(--text-primary))" strokeOpacity="0.45" strokeWidth="1.8" strokeLinecap="round" fill="none">
      <path d="M19.5 13.5c2-2.2-.6-4 1.4-6.3" />
      <path d="M27 13.5c2-2.2-.6-4 1.4-6.3" />
    </g>
    <ellipse cx="24" cy="42.2" rx="15.5" ry="2.6" fill={SHADE} opacity="0.25" />
    <ellipse cx="24" cy="41.4" rx="15.5" ry="2.6" fill="rgb(var(--bg-medium))" />
    <path
      d="M36 20.5c4.1 0 6.6 2.6 6.6 5.9 0 3.3-2.5 5.9-6.6 5.9h-2.2v-2.9H36c2.3 0 3.7-1.2 3.7-3s-1.4-3-3.7-3h-2.2v-2.9Z"
      fill={`url(#${uid}-cup)`}
    />
    <path d="M12.6 19.4h22.8l-2.5 17.1c-.2 1.9-1.6 3-3.6 3H18.7c-2 0-3.4-1.1-3.6-3Z" fill={`url(#${uid}-cup)`} />
    <ellipse cx="24" cy="19.8" rx="11.4" ry="2.8" fill={`url(#${uid}-brew)`} opacity="0.85" />
    <path d="M29.6 19.4h5.8l-2.5 17.1c-.2 1.9-1.6 3-3.6 3h-3.4c1.7-.2 2.8-1.2 3-3Z" fill={SHADE} opacity="0.2" />
    <path d="M16.4 21.8 18.8 38h-1.6c-1.4-.4-2-1.2-2.1-2.3l-2-13.9Z" fill={HIGHLIGHT} opacity="0.3" />
  </>
);

/* ── Fuel ────────────────────────────────────────────────────────────────── */
const FuelDefs: GlyphPart = ({ uid }) => (
  <>
    <LinearGradient id={`${uid}-pump`} from="rgb(var(--accent-red))" to="rgb(var(--accent-yellow))" y2="1.2" />
    <LinearGradient id={`${uid}-screen`} from={COOL.from} to={COOL.to} />
  </>
);
const FuelBody: GlyphPart = ({ uid }) => (
  <>
    <ellipse cx="21" cy="43.4" rx="13" ry="2.2" fill={SHADE} opacity="0.25" />
    <path
      d="M30.4 17.6h4.4c2.4 0 4.3 1.9 4.3 4.3v9.4c0 1 .8 1.7 1.7 1.7s1.7-.8 1.7-1.7v-6.8"
      stroke="rgb(var(--accent-turquoise))"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M10.6 11.4c0-2.3 1.9-4.2 4.2-4.2h11.4c2.3 0 4.2 1.9 4.2 4.2V40H10.6Z" fill={`url(#${uid}-pump)`} />
    <path d="M25.4 7.4c2.9.5 4.9 2.3 4.9 4.9V40h-4.9Z" fill={SHADE} opacity="0.2" />
    <rect x="8.2" y="40" width="24.6" height="3.6" rx="1.6" fill={`url(#${uid}-pump)`} />
    <rect x="8.2" y="40" width="24.6" height="3.6" rx="1.6" fill={SHADE} opacity="0.18" />
    <rect x="14" y="12.4" width="13" height="9" rx="1.8" fill={SHADE} opacity="0.35" />
    <rect x="15.2" y="13.6" width="10.6" height="6.6" rx="1.2" fill={`url(#${uid}-screen)`} opacity="0.9" />
    <rect x="14" y="26" width="13" height="2.2" rx="1.1" fill={HIGHLIGHT} opacity="0.28" />
    <rect x="14" y="30.4" width="8.4" height="2.2" rx="1.1" fill={HIGHLIGHT} opacity="0.2" />
    <rect x="12.4" y="10.4" width="2.4" height="27" rx="1.2" fill={HIGHLIGHT} opacity="0.26" />
  </>
);

/* ── Gold bar ────────────────────────────────────────────────────────────── */
const GoldDefs: GlyphPart = ({ uid }) => (
  <>
    <LinearGradient id={`${uid}-gold-top`} from="rgb(var(--accent-yellow))" to={GOLD.to} x2="1" y2="0.4" />
    <LinearGradient id={`${uid}-gold-front`} from={GOLD.from} to={GOLD.to} y2="1.4" />
  </>
);
const GoldBody: GlyphPart = ({ uid }) => (
  <>
    <ellipse cx="24" cy="39.4" rx="15" ry="2.2" fill={SHADE} opacity="0.25" />
    <path d="M13.6 16.6h20.8L39 23.4H9Z" fill={`url(#${uid}-gold-top)`} />
    <path d="M9 23.4h30l-2.2 12.2c-.2 1.2-1.1 1.9-2.4 1.9H13.6c-1.3 0-2.2-.7-2.4-1.9Z" fill={`url(#${uid}-gold-front)`} />
    <path d="M30.4 23.4H39l-2.2 12.2c-.2 1.2-1.1 1.9-2.4 1.9h-6.2c1.2 0 2-.7 2.2-1.9Z" fill={SHADE} opacity="0.22" />
    <path d="M13.6 16.6h20.8l1.4 2.2H12.2Z" fill={HIGHLIGHT} opacity="0.34" />
    <g fill={SHADE} opacity="0.26">
      <rect x="15.4" y="27" width="11" height="1.8" rx="0.9" />
      <rect x="15.4" y="30.8" width="7.6" height="1.8" rx="0.9" />
    </g>
  </>
);

/* ── Home (rent) ─────────────────────────────────────────────────────────── */
const HomeDefs: GlyphPart = ({ uid }) => (
  <>
    <LinearGradient id={`${uid}-roof`} from="rgb(var(--accent-turquoise))" to={COOL.to} />
    <LinearGradient id={`${uid}-wall`} from={COOL.to} to="rgb(var(--accent-petrol))" y2="1.3" />
  </>
);
const HomeBody: GlyphPart = ({ uid }) => (
  <>
    <ellipse cx="24" cy="42.6" rx="16" ry="2.2" fill={SHADE} opacity="0.25" />
    <rect x="31.4" y="10.6" width="4.6" height="8.2" rx="1.2" fill={`url(#${uid}-wall)`} />
    <path d="M24 6.4 43.4 22.6h-5.2L24 11.2 9.8 22.6H4.6Z" fill={`url(#${uid}-roof)`} />
    <path d="M24 6.4 43.4 22.6h-5.2L24 11.2Z" fill={SHADE} opacity="0.18" />
    <path d="M9.8 22.6h28.4v16.6c0 1.6-1.2 2.8-2.8 2.8H12.6c-1.6 0-2.8-1.2-2.8-2.8Z" fill={`url(#${uid}-wall)`} />
    <path d="M32.4 22.6h5.8v16.6c0 1.6-1.2 2.8-2.8 2.8h-5.4c1.5 0 2.4-1.2 2.4-2.8Z" fill={SHADE} opacity="0.2" />
    <rect x="11.6" y="24.4" width="2.4" height="15.6" rx="1.2" fill={HIGHLIGHT} opacity="0.22" />
    <path d="M19.8 42V31.2c0-1.6 1.2-2.8 2.8-2.8h2.8c1.6 0 2.8 1.2 2.8 2.8V42Z" fill={SHADE} opacity="0.34" />
    <rect x="30.2" y="26.6" width="6.2" height="6.2" rx="1.2" fill={HIGHLIGHT} opacity="0.3" />
  </>
);

export const EGG: BasketGlyph = { key: "egg", Defs: EggDefs, Body: EggBody };
export const BREAD: BasketGlyph = { key: "bread", Defs: BreadDefs, Body: BreadBody };
export const COFFEE: BasketGlyph = { key: "coffee", Defs: CoffeeDefs, Body: CoffeeBody };
export const FUEL: BasketGlyph = { key: "fuel", Defs: FuelDefs, Body: FuelBody };
export const GOLD_BAR: BasketGlyph = { key: "gold", Defs: GoldDefs, Body: GoldBody };
export const HOME: BasketGlyph = { key: "home", Defs: HomeDefs, Body: HomeBody };

/** A single item illustration at an arbitrary size. */
export function BasketIcon({
  glyph,
  size = 48,
  className = "",
}: {
  glyph: BasketGlyph;
  size?: number;
  className?: string;
}) {
  const uid = useGlyphId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} role="presentation" aria-hidden="true">
      <defs>
        <glyph.Defs uid={uid} />
      </defs>
      <glyph.Body uid={uid} />
    </svg>
  );
}
