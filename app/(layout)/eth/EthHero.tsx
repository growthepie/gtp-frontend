"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import GTPMetricCard from "@/components/layout/Applications/AppMetricCard";
import { useSSEMetrics } from "@/components/layout/EthAgg/useSSEMetrics";
import { EthSupplySnapshot, SUPPLY_HISTORY_YEARS } from "@/lib/eth-the-asset/data";
import { getChainMetricURL } from "@/lib/urls";
import { ACCENT_HEX, AccentColor } from "./_components/colors";
import { IllustrativeNote } from "./_components/IllustrativeTag";

// World population is projected forward from a base figure at a yearly growth rate.
// PLACEHOLDER: this endpoint doesn't exist yet. It should return
// { annual_growth_pct: number, base_population?: number, base_date?: string (ISO) };
// any field it leaves out (or the whole response, if the request fails) falls
// back to the WEF-cited UN projection below.
const WORLD_POPULATION_URL = "https://api.growthepie.com/v1/placeholder/world_population.json";

// WEF, citing UN World Population Prospects 2022: 8.0B on 15 Nov 2022, 9.7B by 2050.
// (9.7 / 8.0) ^ (1 / 27.6 years) − 1 ≈ 0.70% a year.
const FALLBACK_BASE_POPULATION = 8.0e9;
const FALLBACK_BASE_DATE = "2022-11-15";
const FALLBACK_ANNUAL_GROWTH_PCT = 0.7;

type WorldPopulationResponse = {
  annual_growth_pct?: number;
  base_population?: number;
  base_date?: string;
};

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function projectWorldPopulation(data: WorldPopulationResponse | undefined, now: number) {
  const isValid = (n?: number): n is number => typeof n === "number" && Number.isFinite(n);
  const growthPct = isValid(data?.annual_growth_pct) ? data.annual_growth_pct : FALLBACK_ANNUAL_GROWTH_PCT;
  const basePopulation = isValid(data?.base_population) && data.base_population > 0 ? data.base_population : FALLBACK_BASE_POPULATION;
  const parsedBaseDate = data?.base_date ? Date.parse(data.base_date) : NaN;
  const baseDate = Number.isFinite(parsedBaseDate) ? parsedBaseDate : Date.parse(FALLBACK_BASE_DATE);
  const yearsSinceBase = Math.max(0, (now - baseDate) / MS_PER_YEAR);
  return basePopulation * Math.pow(1 + growthPct / 100, yearsSinceBase);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Supply is only published daily, so carry it forward from the latest point at
// the net pace of the last 30 days (issuance minus burn), not the gross rate.
function projectEthSupply(snapshot: EthSupplySnapshot, now: number) {
  const latestTimestamp = snapshot.recentTimestamps[snapshot.recentTimestamps.length - 1];
  if (!Number.isFinite(latestTimestamp)) return snapshot.totalSupply;
  const daysSinceLatest = Math.max(0, (now - latestTimestamp) / MS_PER_DAY);
  return snapshot.totalSupply + (snapshot.netIssuance30d / 30) * daysSinceLatest;
}

// Both sides move by tiny amounts per second, so the figure needs ~12 decimals
// before the change is visible.
const ETH_PER_PERSON_DECIMALS = 12;

// Lifetime active addresses on Ethereum Mainnet — the same figure the chain page's
// "Lifetime" achievements show ("X addresses were active on this chain").
const ETHEREUM_OVERVIEW_URL = "https://api.growthepie.com/v1/chains/ethereum/overview.json";

type EthereumOverviewResponse = {
  last_updated_utc?: string;
  data?: {
    achievements?: {
      lifetime?: { daa?: { value?: { total_value?: number } } };
    };
  };
};

// The API only publishes the total as of its last daily run, so tick it forward
// at the recent pace. Measured from two snapshots of the overview file, 14 days
// apart: 317,777,172 (21 Sep 2026) → 320,030,822 (5 Oct 2026) ≈ 161k new/day.
const NEW_WALLETS_PER_DAY = 161_000;

// The backend counts addresses on days before the run date (date < current_date),
// so the total is as of 00:00 UTC on the day the file was generated.
function projectLifetimeWallets(overview: EthereumOverviewResponse | undefined, now: number) {
  const total = overview?.data?.achievements?.lifetime?.daa?.value?.total_value;
  if (!total || total <= 0) return null;
  const updated = overview?.last_updated_utc ? Date.parse(overview.last_updated_utc.replace(" ", "T") + "Z") : NaN;
  if (!Number.isFinite(updated)) return total;
  const asOf = new Date(updated).setUTCHours(0, 0, 0, 0);
  const daysSince = Math.max(0, (now - asOf) / MS_PER_DAY);
  return Math.round(total + NEW_WALLETS_PER_DAY * daysSince);
}

// Imperva (Thales) Bad Bot Report 2026: automated share of web traffic in 2025.
// Static — the report is annual; update when the next edition comes out.
const BOT_TRAFFIC_SHARE_PCT = 53;

type MarketCapResponse = {
  details?: {
    timeseries?: {
      daily?: { types: string[]; data: number[][] };
    };
  };
};

// Every hero sparkline covers the same 60 daily points, matching the chain page's
// KPI cards, so the lines have the same density and none looks stretched or sparse.
const SPARKLINE_DAYS = 60;

// Illustrative series for the tiles with no live source yet. A seeded random walk
// (fixed seed, so server and client markup match on hydration) that drifts from
// `start` to `end` with day-to-day noise of about `noise`, ending exactly on `end`.
function illustrativeTrend(start: number, end: number, noise: number, seed: number) {
  // mulberry32: tiny deterministic PRNG
  let t = seed >>> 0;
  const rand = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  let offset = 0;
  return Array.from({ length: SPARKLINE_DAYS }, (_, i) => {
    const progress = i / (SPARKLINE_DAYS - 1);
    // Mean-reverting walk, pulled back to the drift line so it lands on `end`.
    offset = offset * 0.8 + (rand() - 0.5) * 2 * noise;
    const drift = start + (end - start) * progress;
    return i === SPARKLINE_DAYS - 1 ? end : drift + offset * (1 - Math.pow(progress, 8));
  });
}
const TREND_UP = illustrativeTrend(2.95, 3.12, 0.03, 11);
const TREND_FLAT = illustrativeTrend(29.4, 30.4, 0.08, 23);
const TREND_BURN = illustrativeTrend(380, 412, 40, 37);

// Pointer-reactive diamond built from plain CSS/SVG (no 3D library). A slow
// autorotate loop plus a pointer-driven tilt combine into one transform.
function EtherDiamond({ height = 380 }: { height?: number }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [autoAngle, setAutoAngle] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let raf: number;
    const tick = () => {
      setAutoAngle((a) => (a + 0.15) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -30, y: px * 40 });
  };

  return (
    <div
      ref={wrapperRef}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      className="relative w-full flex items-center justify-center cursor-grab select-none"
      style={{ height, perspective: 900 }}
    >
      <div
        className="absolute inset-0 m-auto rounded-full blur-3xl opacity-30"
        style={{
          width: height * 0.8,
          height: height * 0.8,
          background: "radial-gradient(circle, rgb(var(--accent-turquoise)) 0%, transparent 70%)",
        }}
      />
      <div
        className="relative transition-transform duration-200 ease-out"
        style={{
          width: height * 0.55,
          height: height * 0.85,
          transformStyle: "preserve-3d",
          transform: `rotateX(${tilt.x}deg) rotateY(${autoAngle + tilt.y}deg)`,
        }}
      >
        <svg viewBox="0 0 100 154" width="100%" height="100%" style={{ overflow: "visible" }} aria-hidden="true">
          <defs>
            <linearGradient id="eth-face-1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent-turquoise))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="rgb(var(--bg-default))" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="eth-face-2" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent-yellow))" stopOpacity="0.55" />
              <stop offset="100%" stopColor="rgb(var(--bg-default))" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <polygon points="50,0 95,77 50,60" fill="url(#eth-face-1)" stroke="rgb(var(--accent-turquoise))" strokeWidth="0.6" />
          <polygon points="50,0 5,77 50,60" fill="url(#eth-face-2)" stroke="rgb(var(--accent-turquoise))" strokeWidth="0.6" opacity="0.85" />
          <polygon points="50,60 95,77 50,154" fill="url(#eth-face-2)" stroke="rgb(var(--accent-turquoise))" strokeWidth="0.6" opacity="0.85" />
          <polygon points="50,60 5,77 50,154" fill="url(#eth-face-1)" stroke="rgb(var(--accent-turquoise))" strokeWidth="0.6" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-[15px] text-xs text-color-text-primary/70">drag to spin</div>
    </div>
  );
}

export default function EthHero({ ethSnapshot }: { ethSnapshot: EthSupplySnapshot | null }) {
  const { globalMetrics } = useSSEMetrics();
  const { data: marketCapData } = useSWR<MarketCapResponse>(getChainMetricURL("ethereum", "market-cap"));
  const { resolvedTheme } = useTheme();
  const hex = ACCENT_HEX[(resolvedTheme as "light" | "dark") ?? "dark"];
  const { data: populationData } = useSWR<WorldPopulationResponse>(WORLD_POPULATION_URL, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    // The endpoint is a placeholder that doesn't exist yet, so a failure is expected
    // and the fallback projection is used. Don't let the global handler log it.
    onError: () => {},
  });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const worldPopulation = projectWorldPopulation(populationData, now);
  const ethPerPerson = ethSnapshot ? projectEthSupply(ethSnapshot, now) / worldPopulation : null;
  const { data: ethereumOverview } = useSWR<EthereumOverviewResponse>(ETHEREUM_OVERVIEW_URL);

  const lifetimeWallets = projectLifetimeWallets(ethereumOverview, now);
  const price = globalMetrics.eth_price_usd;
  const dailyMarketCap = marketCapData?.details?.timeseries?.daily;
  const priceHistory = useMemo(() => {
    const usdColumn = dailyMarketCap?.types.indexOf("usd") ?? -1;
    const ethColumn = dailyMarketCap?.types.indexOf("eth") ?? -1;
    if (!dailyMarketCap || usdColumn < 0 || ethColumn < 0) return { values: [], timestamps: [] };

    const points = dailyMarketCap.data.slice(-SPARKLINE_DAYS).flatMap((row) => {
      const [timestamp] = row;
      const usd = row[usdColumn];
      const eth = row[ethColumn];
      return Number.isFinite(timestamp) && Number.isFinite(usd) && Number.isFinite(eth) && eth > 0
        ? [{ timestamp, price: usd / eth }]
        : [];
    });
    return {
      values: points.map((point) => point.price),
      timestamps: points.map((point) => new Date(point.timestamp).toISOString().slice(0, 10)),
    };
  }, [dailyMarketCap]);
  const latestHistoricalPrice = priceHistory.values[priceHistory.values.length - 1];
  const latestHistoricalDate = priceHistory.timestamps[priceHistory.timestamps.length - 1];
  const isLivePrice = !!price && price > 0;
  const displayedPrice = isLivePrice ? price : latestHistoricalPrice;
  const weekAgoPrice = priceHistory.values[priceHistory.values.length - 8];
  const priceChange = weekAgoPrice ? ((latestHistoricalPrice / weekAgoPrice) - 1) * 100 : 0;

  const tile = (color: AccentColor) => hex[color];

  return (
    <div className="@container flex flex-col gap-y-[30px]">
      {/* Hero columns switch at the same widths as the metric-card grid below (both are
          measured on this same-width container): 1 column → stacked, 2 card columns →
          1fr 1fr, 3 card columns → 2fr 1fr. Keep these in step with that grid. */}
      <div className="grid grid-cols-1 @[850px]:grid-cols-2 @[1295px]:grid-cols-[2fr_1fr] gap-[10px] items-center">
        <div className="flex flex-col gap-y-[15px]">
          <div className="heading-small-xs text-color-accent-turquoise">ETH — the asset</div>
          <h1 className="heading-large-xl md:heading-large-2xl">The asset that pays you for holding it.</h1>
          <div className="text-md lg:text-lg">
            ETH secures Ethereum, earns a yield, and backs loans.
          </div>
          <div className="flex items-baseline gap-x-[12px] flex-wrap">
            {displayedPrice ? (
              <span className="numbers-5xl">
                {displayedPrice.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            ) : (
              <span className="numbers-5xl text-color-text-primary/40">—</span>
            )}
            {/* The SSE stream doesn't currently send eth_price_usd, so the headline usually
                falls back to the latest daily close — only claim "live" when it really is. */}
            {isLivePrice ? (
              <span className="heading-small-xs flex items-center gap-x-[5px]">
                <span className="relative flex h-[6px] w-[6px]">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-color-positive opacity-75" />
                  <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-color-positive" />
                </span>
                1 ETH · live
              </span>
            ) : (
              displayedPrice && (
                <span className="heading-small-xs text-color-text-primary/70">
                  1 ETH · daily close {latestHistoricalDate}
                </span>
              )
            )}
          </div>
          {/* The two stat pills sit on one row. They step down in size as the row narrows —
              full from 600px, compact from 500px, extra-compact below — so they still fit
              (the 2-column hero's heading can be as narrow as 420px). Only on small phones,
              where even the extra-compact pills don't fit, does the second one wrap.
              When shrunk, hovering a pill scales it back to full size (full ÷ shrunk
              width: ≈1.19 compact, ≈1.4 extra-compact), growing from its outer edge over
              the other pill so it never leaves the row. Once the second pill has wrapped
              onto its own row (< 419px) it grows rightward instead.
              Meanwhile the other pill shrinks toward its own outer edge so they never
              overlap. Sized for the narrowest row at each step: hovered full width + gap +
              shrunk sibling ≤ 500px (×0.8) or ≤ 419px (×0.58). Not needed once wrapped. */}
          <div className="@container">
          <div className="flex flex-wrap items-center gap-x-[6px] @[500px]:gap-x-[10px] gap-y-[8px]">
          {lifetimeWallets && lifetimeWallets > 0 && (
            <div className="flex flex-wrap items-center gap-x-[4px] @[500px]:gap-x-[6px] @[600px]:gap-x-[8px] min-h-[26px] @[500px]:min-h-[30px] @[600px]:min-h-[36px] px-[8px] @[500px]:px-[10px] @[600px]:px-[15px] py-[4px] @[500px]:py-[5px] @[600px]:py-[6px] rounded-full bg-color-bg-medium w-fit origin-left relative z-0 hover:z-10 transition-transform duration-200 hover:scale-[1.4] @[500px]:hover:scale-[1.19] @[600px]:hover:scale-100 @[419px]:[:has(>*:hover)>&:not(:hover)]:scale-[0.58] @[500px]:[:has(>*:hover)>&:not(:hover)]:scale-[0.8] @[600px]:[:has(>*:hover)>&:not(:hover)]:scale-100">
              <GTPIcon icon="gtp-wallet" size="sm" className="text-color-accent-turquoise" />
              <span className="flex items-center gap-x-[3px] @[500px]:gap-x-[4px] @[600px]:gap-x-[5px]">
                <span className="numbers-xxs @[500px]:numbers-xs @[600px]:numbers-sm tabular-nums">{lifetimeWallets.toLocaleString("en-US")}</span>
                <span className="heading-small-xxxs @[500px]:heading-small-xxs @[600px]:heading-small-xs">wallets used ETH</span>
              </span>
              <Tooltip placement="bottom">
                <TooltipTrigger asChild>
                  <button type="button" aria-label="About wallets that have used ETH" className="flex items-center justify-center">
                    <GTPIcon icon="gtp-info" size="sm" className="text-color-text-primary/70" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="z-50 max-w-[300px] rounded-[8px] bg-color-bg-default p-[12px] shadow-standard text-xs md:text-sm flex flex-col gap-y-[8px]">
                  <span>
                    Every address that has ever been active on Ethereum Mainnet. Wallets aren&apos;t people — one person can
                    have many, and exchanges hold ETH for millions of users in a few. Addresses that have only used Layer 2s
                    aren&apos;t counted.
                  </span>
                  <span>
                    Not every wallet is a person, either: online, {BOT_TRAFFIC_SHARE_PCT}% of web traffic is bots — 40%
                    malicious and 13% benign ones like search crawlers, against 47% humans (Imperva Bad Bot Report 2026,
                    measured across sites Imperva protects).
                  </span>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          {ethSnapshot && (
            <div className="flex flex-wrap items-center gap-x-[4px] @[500px]:gap-x-[6px] @[600px]:gap-x-[8px] min-h-[26px] @[500px]:min-h-[30px] @[600px]:min-h-[36px] px-[8px] @[500px]:px-[10px] @[600px]:px-[15px] py-[4px] @[500px]:py-[5px] @[600px]:py-[6px] rounded-full bg-color-bg-medium w-fit origin-left @[419px]:origin-right relative z-0 hover:z-10 transition-transform duration-200 hover:scale-[1.4] @[500px]:hover:scale-[1.19] @[600px]:hover:scale-100 @[419px]:[:has(>*:hover)>&:not(:hover)]:scale-[0.58] @[500px]:[:has(>*:hover)>&:not(:hover)]:scale-[0.8] @[600px]:[:has(>*:hover)>&:not(:hover)]:scale-100">
              <GTPIcon icon="gtp-users-monochrome" size="sm" className="text-color-accent-yellow" />
              <span className="flex items-center gap-x-[3px] @[500px]:gap-x-[4px] @[600px]:gap-x-[5px]">
                <span className="numbers-xxs @[500px]:numbers-xs @[600px]:numbers-sm tabular-nums">{ethPerPerson?.toFixed(ETH_PER_PERSON_DECIMALS)}</span>
                <span className="heading-small-xxxs @[500px]:heading-small-xxs @[600px]:heading-small-xs">ETH per person</span>
              </span>
              <Tooltip placement="bottom">
                <TooltipTrigger asChild>
                  <button type="button" aria-label="About ETH per person" className="flex items-center justify-center">
                    <GTPIcon icon="gtp-info" size="sm" className="text-color-text-primary/70" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="z-50 max-w-[300px] rounded-[8px] bg-color-bg-default p-[12px] shadow-standard text-xs md:text-sm flex flex-col gap-y-[8px]">
                  <span>
                    If all ETH were split evenly across the world&apos;s{" "}
                    <span className="numbers-xs tabular-nums">{Math.round(worldPopulation).toLocaleString("en-US")}</span>{" "}
                    people, each would have {ethPerPerson?.toFixed(4)} ETH. Most people hold none, so owning even a small
                    amount puts you in a meaningful percentile of holders.
                  </span>
                  <span>
                    World population is a projection, not a live count: 8.0 billion people on 15 Nov 2022, growing about
                    0.7% a year, in line with the UN projections cited by the World Economic Forum (9.7 billion by 2050).
                  </span>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          </div>
          </div>
        </div>
        <EtherDiamond height={380} />
      </div>

      {/* Columns follow the grid's own width (not the viewport), so the sidebar being
          open or closed doesn't matter. 3 columns from 1295px (cards ≥ 425px, sparkline ≥ 110px) — low enough for a
          14" MacBook Pro (1512px) with the sidebar hidden, which gives a ~1321px grid. 2 columns
          from 850px: cards ≥ 420px, which still leaves the sparkline 105px between the
          label column and the value (see FILL_SPARKLINE_* in AppMetricCard). */}
      <div className="@container flex flex-col gap-y-[10px]">
        <div className="grid grid-cols-1 @[850px]:grid-cols-2 @[1295px]:grid-cols-3 gap-[10px]">
          {priceHistory.values.length > 1 && displayedPrice ? (
            <GTPMetricCard
              fillSparkline
              nonInteractive
              label={`ETH price ${SPARKLINE_DAYS}d`}
              icon="gtp-tokeneth"
              value={displayedPrice}
              wowChange={priceChange}
              prefix="$"
              sparkline={priceHistory.values}
              timestamps={priceHistory.timestamps}
              color={tile("turquoise")}
            />
          ) : (
            <div className="flex h-2xl items-center justify-between gap-x-[10px] rounded-[15px] bg-color-bg-default p-[15px]">
              <span className="flex items-center gap-x-[10px]">
                <GTPIcon icon="gtp-tokeneth" size="md" />
                <span className="heading-large-xxs xs:heading-large-xs">ETH price</span>
              </span>
              <span className="numbers-sm xs:numbers-md text-color-accent-turquoise">
                {displayedPrice?.toLocaleString("en-US", { style: "currency", currency: "USD" }) ?? "—"}
              </span>
            </div>
          )}
          {ethSnapshot && (
            <GTPMetricCard
              fillSparkline
              nonInteractive
              label={`Supply ${SUPPLY_HISTORY_YEARS}y`}
              decimals={1}
              stackSuffixWhenNarrow
              icon="gtp-realtime"
              value={ethSnapshot.totalSupply}
              // Change over the same period the sparkline shows (net of burn).
              wowChange={ethSnapshot.historyChangePct}
              suffix=" ETH"
              sparkline={ethSnapshot.historySupply}
              timestamps={ethSnapshot.historyTimestamps
                .map((ts) => new Date(ts).toISOString().slice(0, 10))}
              color={tile("yellow")}
            />
          )}
          <GTPMetricCard
            fillSparkline
            nonInteractive
            label={`Staking yield ${SPARKLINE_DAYS}d`}
            icon="gtp-metrics-fdv"
            value={3.12}
            wowChange={0.08}
            suffix="% APR"
            sparkline={TREND_UP}
            color={tile("turquoise")}
          />
          <GTPMetricCard
            fillSparkline
            nonInteractive
            label={`Supply staked ${SPARKLINE_DAYS}d`}
            decimals={1}
            icon="gtp-lock"
            value={30.4}
            wowChange={0.6}
            suffix="%"
            sparkline={TREND_FLAT}
            color={tile("turquoise")}
          />
          <GTPMetricCard
            fillSparkline
            nonInteractive
            label="ETH burned 24h"
            decimals={1}
            stackSuffixWhenNarrow
            icon="gtp-metrics-feespaidbyusers"
            value={412}
            wowChange={11}
            suffix=" ETH"
            sparkline={TREND_BURN}
            color={tile("red")}
          />
          <Link
            href="/ethereum-ecosystem/metrics"
            className="group flex h-2xl items-center justify-between gap-x-[10px] rounded-[15px] bg-color-bg-default p-[15px] shadow-standard transition-colors hover:bg-color-ui-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-color-accent-turquoise"
          >
            <span className="flex items-center gap-x-[10px]">
              <GTPIcon icon="gtp-metrics-activity" size="md" />
              <span className="heading-large-xxs xs:heading-large-xs">Ecosystem activity</span>
            </span>
            <GTPIcon icon="gtp-chevronright" size="sm" className="shrink-0 transition-transform group-hover:translate-x-[3px]" />
          </Link>
        </div>
        <IllustrativeNote>
          Supply and ETH price are live from growthepie data, with the annualised issuance rate as supply&apos;s change.
          Staking yield, staked share and burn are illustrative — we don&apos;t track those yet.
        </IllustrativeNote>
      </div>
    </div>
  );
}
