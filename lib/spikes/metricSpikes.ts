// Spike detection + shared types for the "why did it spike?" insights on the
// fundamentals pages (transaction count, chain revenue). Detection runs client-side
// on the daily series already loaded for the chart; attribution (apps / blockspace /
// events / activity / economics / market) is computed server-side in
// app/api/metrics/spike/route.ts because the underlying blockspace + app files are
// far too heavy to ship to the browser.

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Fundamentals metrics that get spike insights, keyed by API metric id. */
export const SPIKE_METRICS = {
  txcount: { label: "transactions", icon: "gtp-metrics-transactioncount" },
  fees: { label: "revenue", icon: "gtp-metrics-feespaidbyusers" },
} as const;
export type SpikeMetricKey = keyof typeof SPIKE_METRICS;

export const isSpikeMetric = (metricId: string): metricId is SpikeMetricKey => metricId in SPIKE_METRICS;

/** Ignore the first N days of a chain's history (launch ramp-up is not a spike). */
const SKIP_LAUNCH_DAYS = 30;
/** A day must be at least this much above the previous data point to count as a spike. */
export const MIN_SPIKE_INCREASE = 0.1;
/** Two spikes on the same chain must be at least this far apart. */
const MIN_SPIKE_SEPARATION_DAYS = 14;

export type MetricSpike = {
  chainKey: string;
  /** Unix ms (UTC midnight) of the spike day. */
  timestamp: number;
  /** YYYY-MM-DD (UTC). */
  date: string;
  /** In the unit the chart shows (count, USD or ETH). */
  value: number;
  /** Previous day's value — the spike is measured against this. */
  baseline: number;
  increase: number;
};

export const toUtcDateString = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);

/**
 * Baseline = the previous day's value (missing day counts as 0). Shared by client
 * detection and server attribution so "increase" means the same thing everywhere.
 */
export const baselineAt = (valuesByDay: Map<number, number>, timestamp: number) =>
  valuesByDay.get(timestamp - DAY_MS) ?? 0;

/**
 * Finds up to `count` of the largest upward spikes across the given chains within
 * [xMin, xMax]: ranked by absolute day-over-day increase, and only days at least
 * MIN_SPIKE_INCREASE (10%) above the previous data point qualify — so fewer than
 * `count` may be returned.
 */
export function detectSpikes(
  seriesByChain: Record<string, [number, number | null][]>,
  xMin: number,
  xMax: number,
  count = 3,
): MetricSpike[] {
  const candidates: MetricSpike[] = [];

  Object.entries(seriesByChain).forEach(([chainKey, rows]) => {
    if (!rows?.length) return;
    const firstTs = rows[0][0];

    rows.forEach(([ts, value], index) => {
      if (index === 0 || typeof value !== "number" || ts < xMin || ts > xMax) return;
      if (ts < firstTs + SKIP_LAUNCH_DAYS * DAY_MS) return;
      const baseline = rows[index - 1][1];
      if (typeof baseline !== "number" || baseline <= 0) return;
      if (value < baseline * (1 + MIN_SPIKE_INCREASE)) return;
      candidates.push({
        chainKey,
        timestamp: ts,
        date: toUtcDateString(ts),
        value,
        baseline,
        increase: value - baseline,
      });
    });
  });

  candidates.sort((a, b) => b.increase - a.increase);

  const picked: MetricSpike[] = [];
  for (const candidate of candidates) {
    const tooClose = picked.some(
      (p) =>
        p.chainKey === candidate.chainKey &&
        Math.abs(p.timestamp - candidate.timestamp) < MIN_SPIKE_SEPARATION_DAYS * DAY_MS,
    );
    if (tooClose) continue;
    picked.push(candidate);
    if (picked.length === count) break;
  }
  return picked;
}

// --- Attribution response (from /api/metrics/spike) ---

export type SpikeEvent = {
  date: string;
  type: string;
  title: string;
  description: string;
  source: string | null;
};

/** Increase is in the metric's server unit: tx count, or USD for revenue. */
export type SpikeCategoryDriver = {
  main_category: string;
  sub_category: string;
  increase: number;
};

export type SpikeAppDriver = {
  owner_project: string;
  increase: number;
  value: number;
  baseline: number;
};

export type SpikeContract = {
  address: string;
  name: string | null;
  project_name: string | null;
  main_category: string;
  sub_category: string;
  txcount: number;
  fees_usd: number;
};

export type SpikeActiveAddresses = {
  value: number;
  baseline: number;
  increase: number;
  /** Transactions per active address on the spike day / the day before. */
  txPerAddress: number | null;
  txPerAddressBaseline: number;
};

/**
 * Classifies how active addresses moved relative to transactions:
 * - "users": addresses grew at least half as fast as txs → more people
 * - "mixed": addresses grew, but much slower than txs
 * - "same-wallets": addresses flat or down → existing wallets sending more txs
 */
export function addressSignal(
  txIncreasePct: number,
  addresses: SpikeActiveAddresses | null | undefined,
): "users" | "mixed" | "same-wallets" | null {
  if (!addresses || addresses.baseline <= 0) return null;
  // Only meaningful when transactions actually rose (revenue can spike on flat/falling txs).
  if (txIncreasePct < 0.03) return null;
  const addrPct = addresses.increase / addresses.baseline;
  if (addrPct < 0.03) return "same-wallets";
  if (addrPct >= txIncreasePct * 0.5) return "users";
  return "mixed";
}

export type SpikePriceMove = {
  symbol: string;
  /** USD price on the spike day (null for chain tokens — only the % change is known). */
  value: number | null;
  /** Price change spike day vs previous day (0.05 = +5%). */
  change: number;
  /** Largest single-day move in the 3 days up to and including the spike. */
  largestRecentMove: number;
};

export type SpikeMetricMove = {
  value: number;
  baseline: number;
  /** value / baseline − 1 (null when there is no baseline). */
  change: number | null;
};

/** Daily moves at least this large count as "volatile" for the summary. */
export const VOLATILE_MOVE = { ETH: 0.05, token: 0.1 } as const;

export type MetricSpikeExplanation = {
  metric: SpikeMetricKey;
  chain: string;
  date: string;
  /** The spiking metric itself, in its server unit (tx count, or USD for revenue). */
  value: number;
  baseline: number;
  increase: number;
  /** Active addresses on the spike day vs the day before (null if unavailable). */
  activeAddresses: SpikeActiveAddresses | null;
  /** ETH price, plus the chain's own token when it has one (ARB, POL, MNT…). */
  prices: { eth: SpikePriceMove | null; token: SpikePriceMove | null };
  /** Chain activity: transactions, throughput (Mgas/s), median tx cost (USD). */
  activity: {
    txcount: SpikeMetricMove | null;
    throughput: SpikeMetricMove | null;
    txCost: SpikeMetricMove | null;
  };
  /** Chain economics: revenue (USD + ETH), rent paid to L1 (USD), onchain profit (USD). */
  economics: {
    revenue: SpikeMetricMove | null;
    revenueEth: SpikeMetricMove | null;
    rentPaid: SpikeMetricMove | null;
    profit: SpikeMetricMove | null;
  };
  events: SpikeEvent[];
  categories: SpikeCategoryDriver[];
  apps: SpikeAppDriver[];
  /** Top contracts without an owner app in the driving sub-categories. */
  unownedContracts: SpikeContract[];
  /** Aggregation window the contract lists come from ("7d" | "30d" | "180d" | "max"). */
  contractsWindow: string;
};
