// Simulation helpers for the "ETH the Asset" ecosystem tab.
//
// Every number this file produces is either projected or invented, and the tab
// that consumes it is gated to non-production builds. Nothing here should be
// wired into a page that ships to growthepie.com without relabelling.

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

export const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/** Decimal places used for every annualised rate shown on this tab. */
export const RATE_DECIMALS = 4;

/**
 * Rounds a rate held as a fraction to RATE_DECIMALS places of its percentage
 * form (0.008706638… -> 0.0087066, shown as 0.8707%). Projections run on the
 * rounded value so the counters advance at exactly the rate on screen.
 */
export const roundRate = (rate: number | null | undefined): number | null => {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return null;
  const factor = 100 * 10 ** RATE_DECIMALS;
  return Math.round(rate * factor) / factor;
};

/** Formats a fractional rate as a percentage string at RATE_DECIMALS places. */
export const formatRatePercent = (rate: number | null | undefined): string | null => {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return null;
  return `${(rate * 100).toFixed(RATE_DECIMALS)}%`;
};

// World Bank "Population, total" (SP.POP.TOTL) for the world aggregate, two
// most recent observations. Keyless and CORS-enabled, unlike the UN Data
// Portal API, which answers 401 without a bearer token.
export const WORLD_BANK_POPULATION_URL =
  "https://api.worldbank.org/v2/country/WLD/indicator/SP.POP.TOTL?format=json&mrv=2";

// Random-walk parameters for the simulated price. Volatility is per tick, and
// mean reversion pulls the walk back toward the live anchor so it wanders
// without drifting away from reality.
const PRICE_VOLATILITY = 0.0006;
const PRICE_MEAN_REVERSION = 0.02;
const PRICE_HISTORY_LIMIT = 60;

/**
 * Extrapolates a reading forward from when it was taken at a constant
 * annualised rate. Returns the base unchanged when inputs are unusable.
 */
export const projectForward = (
  base: number | null | undefined,
  baseTime: number | null | undefined,
  annualRate: number | null | undefined,
  nowMs: number | null,
): number | null => {
  if (base === null || base === undefined || !Number.isFinite(base)) return null;
  if (nowMs === null) return base;
  if (baseTime === null || baseTime === undefined || !Number.isFinite(baseTime)) return base;
  if (annualRate === null || annualRate === undefined || !Number.isFinite(annualRate)) return base;

  const elapsedMs = nowMs - baseTime;
  if (elapsedMs <= 0) return base;

  return base + base * annualRate * (elapsedMs / MS_PER_YEAR);
};

/**
 * Re-renders on an interval so projected values visibly count. Returns null
 * until after mount so server and first client render agree.
 */
export const useTicker = (intervalMs = 1000): number | null => {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), Math.max(intervalMs, 50));
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
};

type WorldBankObservation = { date?: string; value?: number | null };

// The app-wide SWR fetcher attaches Cache-Control/Pragma/Expires, which are not
// CORS-safelisted and so force a preflight. World Bank answers OPTIONS with a
// bare 404, and the browser blocks the request — so this endpoint needs a
// plain, header-free fetch.
const worldBankFetcher = (url: string) => fetch(url).then((response) => {
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response.json();
});

/**
 * World population projected forward from the latest World Bank annual
 * observation, growing at the rate implied by the two most recent years.
 * World Bank figures are midyear estimates, so the baseline is anchored to
 * 1 July of its reporting year.
 */
export const useProjectedPopulation = (nowMs: number | null) => {
  const { data } = useSWR<[unknown, WorldBankObservation[]]>(
    WORLD_BANK_POPULATION_URL,
    worldBankFetcher,
  );

  const baseline = useMemo(() => {
    const observations = Array.isArray(data) ? data[1] : null;
    if (!Array.isArray(observations)) return null;

    // The API returns newest first, but sort defensively and drop empty years.
    const usable = observations
      .filter((row) => typeof row?.value === "number" && Number.isFinite(row.value))
      .map((row) => ({ year: Number(row.date), value: row.value as number }))
      .filter((row) => Number.isFinite(row.year))
      .sort((a, b) => b.year - a.year);

    const [latest, previous] = usable;
    if (!latest) return null;

    const rawAnnualRate =
      previous && previous.value > 0 && latest.year > previous.year
        ? (latest.value / previous.value - 1) / (latest.year - previous.year)
        : null;

    return {
      base: latest.value,
      baseTime: Date.UTC(latest.year, 6, 1), // midyear estimate
      baseYear: latest.year,
      annualRate: roundRate(rawAnnualRate),
    };
  }, [data]);

  const population = useMemo(
    () => projectForward(baseline?.base, baseline?.baseTime, baseline?.annualRate, nowMs),
    [baseline, nowMs],
  );

  return {
    population,
    annualRate: baseline?.annualRate ?? null,
    baseYear: baseline?.baseYear ?? null,
  };
};

/** Box-Muller transform: one draw from a standard normal distribution. */
const gaussian = () => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

export type SimulatedPricePoint = { timestamp: number; value: number };

/**
 * A mean-reverting random walk seeded from a live anchor price. The shape of
 * the movement is invented; only the level it orbits is real.
 */
export const useSimulatedPrice = (anchorPrice: number | null, tickMs = 1000) => {
  const [price, setPrice] = useState<number | null>(null);
  const [history, setHistory] = useState<SimulatedPricePoint[]>([]);

  // Held in a ref so a refreshed anchor does not restart the interval.
  const anchorRef = useRef<number | null>(anchorPrice);
  useEffect(() => {
    anchorRef.current = anchorPrice;
  }, [anchorPrice]);

  const hasAnchor = anchorPrice !== null && Number.isFinite(anchorPrice);

  useEffect(() => {
    if (!hasAnchor) return;
    setPrice((prev) => prev ?? anchorRef.current);
  }, [hasAnchor]);

  useEffect(() => {
    if (!hasAnchor) return;

    const id = setInterval(() => {
      setPrice((prev) => {
        const anchor = anchorRef.current;
        if (anchor === null || !Number.isFinite(anchor)) return prev;

        const current = prev ?? anchor;
        const pull = PRICE_MEAN_REVERSION * (anchor - current);
        const shock = anchor * PRICE_VOLATILITY * gaussian();
        return Math.max(current + pull + shock, 0);
      });
    }, Math.max(tickMs, 50));

    return () => clearInterval(id);
  }, [hasAnchor, tickMs]);

  useEffect(() => {
    if (price === null) return;
    setHistory((prev) => [...prev, { timestamp: Date.now(), value: price }].slice(-PRICE_HISTORY_LIMIT));
  }, [price]);

  return { price, history };
};
