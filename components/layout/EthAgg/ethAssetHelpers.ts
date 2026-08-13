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

/** Compact formatter for the comparison rows (1.99B, 605.0M, 95.0k). */
export const formatCompact = (value: number | null, decimals = 2): string => {
  if (value === null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(decimals)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(decimals)}k`;
  return value.toFixed(decimals);
};

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

// --- Comparison assets ---
//
// Everything below is invented. ETH's own figures come from real endpoints
// (growthepie for supply and issuance, the fee stream for the price anchor),
// but no such feed exists in this app for BTC, SOL or gold, so their anchors
// are seeded constants and their movement is simulated the same way ETH's
// price is. They exist to demonstrate the expanded card layout.
//
// Each asset is quoted, supplied and counted in a single unit so that
// price x supply and supply / population stay internally consistent.

export type SimulatedAsset = {
  key: string;
  name: string;
  color: string;
  unit: string; // Symbol shown after supply and per-person figures.
  priceAnchor: number; // USD per unit.
  priceVolatility: number; // Per-tick standard deviation, as a fraction.
  supplyBase: number;
  supplyBaseTime: number;
  supplyAnnualRate: number;
  supplyDecimals: number;
  perPersonDecimals: number;
  peoplePerUnitDecimals: number;
};

/**
 * ETH as a list entry, so it can be compared in place against the others.
 * Its supply fields are placeholders — the card supplies ETH's real figures
 * from the API rather than reading them from here.
 */
export const ETH_AS_ASSET: SimulatedAsset = {
  key: "eth",
  name: "ETH",
  color: "#1cd3d3",
  unit: "ETH",
  priceAnchor: 0,
  priceVolatility: 0,
  supplyBase: 0,
  supplyBaseTime: 0,
  supplyAnnualRate: 0,
  supplyDecimals: 2,
  perPersonDecimals: 14,
  peoplePerUnitDecimals: 12,
};

export const SIMULATED_ASSETS: SimulatedAsset[] = [
  {
    key: "btc",
    name: "BTC",
    color: "#F7931A",
    unit: "BTC",
    priceAnchor: 95_000,
    priceVolatility: 0.0007,
    supplyBase: 19_950_000,
    supplyBaseTime: Date.UTC(2026, 7, 1),
    supplyAnnualRate: 0.0082, // 3.125 BTC/block after the 2024 halving
    supplyDecimals: 2,
    perPersonDecimals: 14,
    peoplePerUnitDecimals: 10,
  },
  {
    key: "sol",
    name: "SOL",
    color: "#9945FF",
    unit: "SOL",
    priceAnchor: 180,
    priceVolatility: 0.0011,
    supplyBase: 605_000_000,
    supplyBaseTime: Date.UTC(2026, 7, 1),
    // Seeded estimate, gross of the burn. Solana's emission schedule starts at
    // 8% and disinflates 15% a year toward a 1.5% floor, which puts 2026 at
    // roughly 3.5%. Half of each base fee is burned, so true net issuance is
    // lower than this — unlike ETH's rate, nothing here derives it.
    supplyAnnualRate: 0.035,
    supplyDecimals: 2,
    perPersonDecimals: 12,
    peoplePerUnitDecimals: 12,
  },
  {
    key: "usd",
    name: "USD",
    color: "#85BB65",
    unit: "USD",
    // The unit of account, so its price is exactly 1 by definition and it is
    // the one asset here that does not wander.
    priceAnchor: 1,
    priceVolatility: 0,
    supplyBase: 22_000_000_000_000, // M2 money supply
    supplyBaseTime: Date.UTC(2026, 7, 1),
    supplyAnnualRate: 0.04,
    supplyDecimals: 2,
    perPersonDecimals: 6,
    peoplePerUnitDecimals: 14,
  },
  {
    key: "gold",
    name: "Gold",
    color: "#D4AF37",
    unit: "oz",
    priceAnchor: 3_300,
    priceVolatility: 0.0004,
    // ~220,000 tonnes of above-ground stock, expressed in troy ounces so the
    // unit matches how gold is quoted.
    supplyBase: 7_070_000_000,
    supplyBaseTime: Date.UTC(2026, 7, 1),
    supplyAnnualRate: 0.0165, // ~3,600 t/yr of mine production
    supplyDecimals: 2,
    perPersonDecimals: 12,
    peoplePerUnitDecimals: 12,
  },
];

/** Mean-reverting random walks for every comparison asset, in one interval. */
export const useSimulatedAssetPrices = (tickMs = 1000) => {
  // Seeded from the anchors so server and first client render agree.
  const [prices, setPrices] = useState<Record<string, number>>(() =>
    Object.fromEntries(SIMULATED_ASSETS.map((asset) => [asset.key, asset.priceAnchor])),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setPrices((prev) => {
        const next: Record<string, number> = {};
        for (const asset of SIMULATED_ASSETS) {
          const current = prev[asset.key] ?? asset.priceAnchor;
          const pull = PRICE_MEAN_REVERSION * (asset.priceAnchor - current);
          const shock = asset.priceAnchor * asset.priceVolatility * gaussian();
          next[asset.key] = Math.max(current + pull + shock, 0);
        }
        return next;
      });
    }, Math.max(tickMs, 50));

    return () => clearInterval(id);
  }, [tickMs]);

  return prices;
};

/** Supply for every comparison asset, projected at its rounded issuance rate. */
export const useSimulatedAssetSupplies = (nowMs: number | null) =>
  useMemo(() => {
    const supplies: Record<string, number | null> = {};
    for (const asset of SIMULATED_ASSETS) {
      supplies[asset.key] = projectForward(
        asset.supplyBase,
        asset.supplyBaseTime,
        roundRate(asset.supplyAnnualRate),
        nowMs,
      );
    }
    return supplies;
  }, [nowMs]);

// --- Simulated EIP-1559 burn ---
//
// growthepie's supply endpoint publishes net issuance (issuance minus burn),
// not the burn itself, so there is nothing here to read a real figure from.
// Baseline and rate are seeded constants projected forward like the rest of
// this file — the counter moves, but the number is invented.
export const ETH_BURN_BASE = 5_000_000; // cumulative ETH burned since EIP-1559
export const ETH_BURN_BASE_TIME = Date.UTC(2026, 7, 1);
export const ETH_BURN_PER_DAY = 700;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Cumulative ETH burned, projected forward at a constant daily rate. */
export const useProjectedBurn = (nowMs: number | null): number => {
  return useMemo(() => {
    if (nowMs === null) return ETH_BURN_BASE;
    const elapsedDays = (nowMs - ETH_BURN_BASE_TIME) / MS_PER_DAY;
    return elapsedDays > 0 ? ETH_BURN_BASE + ETH_BURN_PER_DAY * elapsedDays : ETH_BURN_BASE;
  }, [nowMs]);
};

export const ETH_MARKET_CAP_URL =
  "https://api.growthepie.com/v1/metrics/chains/ethereum/market_cap.json";

/**
 * Real 24h ETH price change, unlike the per-step move beside it. The daily
 * market cap series carries the value in both USD and ETH, and their ratio is
 * the price per ETH, so the change between the last two days is a genuine
 * figure rather than a simulated one.
 */
export const useEthPrice24hChange = (): number | null => {
  const { data } = useSWR<any>(ETH_MARKET_CAP_URL);

  return useMemo(() => {
    const rows = data?.details?.timeseries?.daily?.data;
    if (!Array.isArray(rows) || rows.length < 2) return null;

    const priceAt = (row: unknown) => {
      if (!Array.isArray(row)) return null;
      const usd = Number(row[1]);
      const eth = Number(row[2]);
      if (!Number.isFinite(usd) || !Number.isFinite(eth) || eth === 0) return null;
      return usd / eth;
    };

    const previous = priceAt(rows[rows.length - 2]);
    const current = priceAt(rows[rows.length - 1]);
    if (previous === null || current === null || previous === 0) return null;

    return (current / previous - 1) * 100;
  }, [data]);
};
