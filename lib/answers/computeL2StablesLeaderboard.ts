// Server-side helper that derives the current Ethereum-L2 stablecoin activity
// leaderboard from growthepie's own data. Mirrors computeL2Leaderboard.ts and
// computeL2FeesLeaderboard.ts but combines three data sources:
//
//   1. Stablecoin SUPPLY per chain — from the per-chain stables_mcap
//      timeseries (`/v1/metrics/chains/{key}/stables_mcap.json`), USD col.
//      Daily / weekly / monthly snapshots (a "weekly" supply means "supply
//      at the end of the last completed week", since supply is a stock).
//   2. Stablecoin TRANSACTIONS + GAS SPENT per chain — from blockspace
//      category data (`/v1/blockspace/category_comparison.json`,
//      `data.token_transfers.subcategories.stablecoin`). Daily uses the
//      latest day of `.daily[chain]`; weekly uses `.aggregated["7d"]`;
//      monthly uses `.aggregated["30d"]`.
//   3. Stablecoin VARIETY (distinct stablecoins deployed) per chain — from
//      the quick-bite stablecoins-by-chain table endpoint
//      (`/v1/quick-bites/stablecoins/chains/table_{key}.json`), row count.
//
// Universe filtering matches computeL2Leaderboard so the three answer pages
// can never disagree about which chains they cover.

import { cache } from 'react';
import { MasterURL, BlockspaceURLs } from '@/lib/urls';

const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

// Three flow/stock metrics — period-aware. "Variety" is a separate counter
// (a list of distinct stablecoins, not a period aggregate), so it lives
// outside this enum and rides on `byVariety` in the public payload.
const STABLES_METRICS = ['supply', 'txcount', 'gas_spent'] as const;
export type StablesMetric = (typeof STABLES_METRICS)[number];

export const STABLES_PERIODS = ['daily', 'weekly', 'monthly'] as const;
export type StablesPeriod = (typeof STABLES_PERIODS)[number];

export type StablesEntry = {
  key: string;
  name: string;
  urlKey: string;
  // Units depend on metric: supply + gas_spent in USD, txcount + variety as
  // plain counts.
  value: number;
  color: string;
};

export type L2StablesLeaderboard = {
  generatedAtIso: string;
  universeSize: number;
  universeKeys: string[];
  excludedNonL2Keys: string[];
  byMetricByPeriod: Record<
    StablesMetric,
    Record<StablesPeriod, StablesEntry[]>
  >;
  // Distinct stablecoin count per chain. Period-independent — just the
  // number of stablecoin tokens currently deployed on the chain (from the
  // quick-bite stablecoins-by-chain table). Sorted descending.
  byVariety: StablesEntry[];
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-stables-leaderboard' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// Per-chain stables_mcap timeseries shape: details.timeseries.{period}.{types,data}.
// Types is typically ['unix', 'eth', 'usd']. We resolve USD by name rather
// than index in case the column order changes upstream.
const pickUsdAtPeriod = (block: any, period: StablesPeriod): number | null => {
  const types: any[] | undefined = block?.types;
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(types) || !Array.isArray(data) || data.length === 0)
    return null;
  const usdIdx = types.findIndex((t) => String(t).toLowerCase() === 'usd');
  if (usdIdx < 0) return null;
  // Daily uses the last row; weekly/monthly use the second-to-last so an
  // in-progress period doesn't get reported as "this week" / "this month".
  const idx = period === 'daily' ? data.length - 1 : data.length - 2;
  if (idx < 0) return null;
  const row = data[idx];
  if (!Array.isArray(row) || row.length <= usdIdx) return null;
  const v = row[usdIdx];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
};

const fetchChainStablesMcap = async (
  key: string,
): Promise<Record<StablesPeriod, number | null> | null> => {
  try {
    const url = `https://api.growthepie.com/v1/metrics/chains/${key}/stables_mcap.json`;
    const json = await fetchJson(url);
    const ts = json?.data?.details?.timeseries ?? json?.details?.timeseries;
    if (!ts) return null;
    return {
      daily: pickUsdAtPeriod(ts.daily, 'daily'),
      weekly: pickUsdAtPeriod(ts.weekly, 'weekly'),
      monthly: pickUsdAtPeriod(ts.monthly, 'monthly'),
    };
  } catch {
    return null;
  }
};

// Count rows in the quick-bite stablecoins-by-chain table — that row count
// is the number of distinct stablecoin tokens deployed on the chain.
const fetchChainStablesVariety = async (
  key: string,
): Promise<number | null> => {
  try {
    const url = `https://api.growthepie.com/v1/quick-bites/stablecoins/chains/table_${key}.json`;
    const json = await fetchJson(url);
    const rows = json?.data?.table?.rows;
    return Array.isArray(rows) ? rows.length : null;
  } catch {
    return null;
  }
};

// Pull a single value from blockspace's stablecoin subcategory by period.
// Period mapping:
//   daily   → latest row of `daily[chain]`
//   weekly  → aggregated.7d.data[chain]
//   monthly → aggregated.30d.data[chain]
// Field is either 'txcount_absolute' or 'gas_fees_absolute_usd'.
const readStablesFromBlockspace = (
  stableBlock: any,
  chainKey: string,
  period: StablesPeriod,
  field: 'txcount_absolute' | 'gas_fees_absolute_usd',
): number | null => {
  if (!stableBlock) return null;

  if (period === 'daily') {
    const dailyTypes: any[] | undefined = stableBlock?.daily?.types;
    const dailyRows: any[] | undefined = stableBlock?.daily?.[chainKey];
    if (!Array.isArray(dailyTypes) || !Array.isArray(dailyRows) || dailyRows.length === 0)
      return null;
    const idx = dailyTypes.indexOf(field);
    if (idx < 0) return null;
    const last = dailyRows[dailyRows.length - 1];
    if (!Array.isArray(last) || last.length <= idx) return null;
    const v = last[idx];
    return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
  }

  const aggKey = period === 'weekly' ? '7d' : '30d';
  const agg = stableBlock?.aggregated?.[aggKey]?.data;
  if (!agg) return null;
  const types: any[] | undefined = agg?.types;
  const row: any[] | undefined = agg?.[chainKey];
  if (!Array.isArray(types) || !Array.isArray(row)) return null;
  const idx = types.indexOf(field);
  if (idx < 0) return null;
  const v = row[idx];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
};

export const getL2StablesLeaderboard = cache(
  async (): Promise<L2StablesLeaderboard | null> => {
    let master: any;
    let blockspace: any;

    try {
      [master, blockspace] = await Promise.all([
        fetchJson(MasterURL),
        fetchJson(BlockspaceURLs['category-comparison']),
      ]);
    } catch (err) {
      console.error('getL2StablesLeaderboard: upstream fetch failed', err);
      return null;
    }

    const chains: Record<string, any> = master?.chains ?? {};
    const stableBlock: any =
      blockspace?.data?.token_transfers?.subcategories?.stablecoin ?? null;

    const isL2 = (key: string): boolean => {
      const c = chains[key];
      if (!c) return false;
      if (c.deployment && c.deployment !== 'PROD') return false;
      if (NON_L2_KEYS.has(key)) return false;
      if (c.bucket === 'Layer 1') return false;
      if (c.bucket === '-') return false;
      return true;
    };

    const universeKeys = Object.keys(chains).filter(isL2).sort();

    const colorFor = (key: string): string => {
      const c = chains[key]?.colors;
      return c?.dark?.[0] ?? c?.light?.[0] ?? '#A3B8D9';
    };
    const nameFor = (key: string): string => chains[key]?.name ?? key;
    const urlKeyFor = (key: string): string =>
      chains[key]?.url_key ?? key.replace(/_/g, '-');

    const mkEntry = (key: string, value: number): StablesEntry => ({
      key,
      name: nameFor(key),
      urlKey: urlKeyFor(key),
      value,
      color: colorFor(key),
    });

    // --- Per-chain supply + variety fetches (parallel) ---------------------
    const perChainResults = await Promise.all(
      universeKeys.map(async (key) => {
        const [supply, variety] = await Promise.all([
          fetchChainStablesMcap(key),
          fetchChainStablesVariety(key),
        ]);
        return { key, supply, variety };
      }),
    );

    // --- Stablecoin supply ranking (per period) ----------------------------
    const supplyByPeriod = {} as Record<StablesPeriod, StablesEntry[]>;
    for (const period of STABLES_PERIODS) {
      const entries: StablesEntry[] = [];
      for (const r of perChainResults) {
        const v = r.supply?.[period];
        if (v == null) continue;
        entries.push(mkEntry(r.key, v));
      }
      entries.sort((a, b) => b.value - a.value);
      supplyByPeriod[period] = entries.slice(0, 5);
    }

    // --- Stablecoin tx count + gas spent rankings (per period) -------------
    const txcountByPeriod = {} as Record<StablesPeriod, StablesEntry[]>;
    const gasByPeriod = {} as Record<StablesPeriod, StablesEntry[]>;
    for (const period of STABLES_PERIODS) {
      const txEntries: StablesEntry[] = [];
      const gasEntries: StablesEntry[] = [];
      for (const key of universeKeys) {
        const tx = readStablesFromBlockspace(
          stableBlock,
          key,
          period,
          'txcount_absolute',
        );
        if (tx != null && tx > 0) txEntries.push(mkEntry(key, tx));
        const gas = readStablesFromBlockspace(
          stableBlock,
          key,
          period,
          'gas_fees_absolute_usd',
        );
        if (gas != null && gas > 0) gasEntries.push(mkEntry(key, gas));
      }
      txEntries.sort((a, b) => b.value - a.value);
      gasEntries.sort((a, b) => b.value - a.value);
      txcountByPeriod[period] = txEntries.slice(0, 5);
      gasByPeriod[period] = gasEntries.slice(0, 5);
    }

    // --- Stablecoin variety ranking ----------------------------------------
    const varietyEntries: StablesEntry[] = [];
    for (const r of perChainResults) {
      if (r.variety == null || r.variety <= 0) continue;
      varietyEntries.push(mkEntry(r.key, r.variety));
    }
    varietyEntries.sort((a, b) => b.value - a.value);
    const byVariety = varietyEntries.slice(0, 5);

    const sidechainExclusions = Array.from(NON_L2_KEYS)
      .filter((k) => k !== 'ethereum' && k !== 'all_l2s' && k !== 'multiple')
      .map((k) => chains[k]?.name ?? k)
      .sort();

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      universeSize: universeKeys.length,
      universeKeys,
      excludedNonL2Keys: sidechainExclusions,
      byMetricByPeriod: {
        supply: supplyByPeriod,
        txcount: txcountByPeriod,
        gas_spent: gasByPeriod,
      },
      byVariety,
    };
  },
);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmtCompactCount = (n: number): string => {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  if (Math.abs(n) >= 10) return n.toFixed(0);
  return n.toFixed(0);
};

// Stablecoin supply on big L2s is in the billions of USD; gas spent is in
// thousands of USD; both read better in "$X.XB" / "$XXk" form than as raw
// digits.
const fmtCompactUsd = (n: number): string => {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'k';
  return '$' + n.toFixed(2);
};

const formatValue = (metric: StablesMetric | 'variety', v: number): string => {
  if (metric === 'supply' || metric === 'gas_spent') return fmtCompactUsd(v);
  if (metric === 'variety')
    return `${v} stablecoin${v === 1 ? '' : 's'}`;
  return fmtCompactCount(v);
};

const METRIC_LABEL: Record<StablesMetric, string> = {
  supply: 'stablecoin supply',
  txcount: 'stablecoin transactions',
  gas_spent: 'gas spent on stablecoins',
};

const METRIC_TITLE: Record<StablesMetric, string> = {
  supply: 'Stablecoin supply',
  txcount: 'Stablecoin transactions',
  gas_spent: 'Gas spent on stablecoins',
};

export const formatStablesEntry = (
  e: StablesEntry,
  metric: StablesMetric | 'variety',
): string => `${e.name} (${formatValue(metric, e.value)})`;

export const formatPeriodTopList = (
  lb: L2StablesLeaderboard,
  metric: StablesMetric,
  period: StablesPeriod,
  count = 3,
): string => {
  const entries = lb.byMetricByPeriod?.[metric]?.[period];
  if (!entries || entries.length === 0) return 'unavailable';
  return entries
    .slice(0, count)
    .map((e, i) => `${i + 1}. ${formatStablesEntry(e, metric)}`)
    .join(', ');
};

export const formatPeriodLeader = (
  lb: L2StablesLeaderboard,
  metric: StablesMetric,
  period: StablesPeriod,
): string => {
  const e = lb.byMetricByPeriod?.[metric]?.[period]?.[0];
  return e ? formatStablesEntry(e, metric) : 'unavailable';
};

export const formatVarietyTopList = (
  lb: L2StablesLeaderboard,
  count = 3,
): string => {
  const entries = lb.byVariety;
  if (!entries || entries.length === 0) return 'unavailable';
  return entries
    .slice(0, count)
    .map((e, i) => `${i + 1}. ${formatStablesEntry(e, 'variety')}`)
    .join(', ');
};

export const formatVarietyLeader = (lb: L2StablesLeaderboard): string => {
  const e = lb.byVariety?.[0];
  return e ? formatStablesEntry(e, 'variety') : 'unavailable';
};

// Dense quotable sentence per metric — collapses daily / weekly / monthly
// into one self-contained claim. Same shape as buildDenseSentence in the
// usage leaderboard so AI extractors get a consistent prose pattern across
// answer pages.
export const buildDenseSentence = (
  lb: L2StablesLeaderboard,
  metric: StablesMetric,
  dataDateUtc: string,
): string => {
  const label = METRIC_LABEL[metric];
  const d = lb.byMetricByPeriod?.[metric]?.daily?.[0];
  const w = lb.byMetricByPeriod?.[metric]?.weekly?.[0];
  const m = lb.byMetricByPeriod?.[metric]?.monthly?.[0];

  if (!d || !w || !m) {
    return (
      `**Top Ethereum L2s by ${label}** (data ${dataDateUtc} UTC): ` +
      `daily — ${formatPeriodTopList(lb, metric, 'daily', 3)}; ` +
      `weekly — ${formatPeriodTopList(lb, metric, 'weekly', 3)}; ` +
      `monthly — ${formatPeriodTopList(lb, metric, 'monthly', 3)}.`
    );
  }

  const allSame = d.key === w.key && w.key === m.key;
  const lead = allSame
    ? `As of ${dataDateUtc} UTC, **${d.name}** leads Ethereum L2 ${label} at ` +
      `${formatValue(metric, d.value)} daily, ` +
      `${formatValue(metric, w.value)} weekly, ` +
      `${formatValue(metric, m.value)} monthly.`
    : `As of ${dataDateUtc} UTC, top Ethereum L2 by ${label}: ` +
      `${d.name} ${formatValue(metric, d.value)} daily, ` +
      `${w.name} ${formatValue(metric, w.value)} weekly, ` +
      `${m.name} ${formatValue(metric, m.value)} monthly.`;

  return (
    `${lead} ` +
    `Daily top 3: ${formatPeriodTopList(lb, metric, 'daily', 3)}. ` +
    `Weekly top 3: ${formatPeriodTopList(lb, metric, 'weekly', 3)}. ` +
    `Monthly top 3: ${formatPeriodTopList(lb, metric, 'monthly', 3)}.`
  );
};

// Variety leaderboard reads naturally as one short sentence — no period to
// expand across, just a single ranked claim.
export const buildVarietyDenseSentence = (
  lb: L2StablesLeaderboard,
  dataDateUtc: string,
): string => {
  const top = lb.byVariety?.[0];
  if (!top) {
    return `**Stablecoin variety per Ethereum L2** (data ${dataDateUtc} UTC): unavailable.`;
  }
  return (
    `As of ${dataDateUtc} UTC, **${top.name}** hosts the most distinct stablecoins ` +
    `of any tracked Ethereum L2 with ${top.value} tokens deployed. ` +
    `Top 3: ${formatVarietyTopList(lb, 3)}.`
  );
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildStablesAnswerTables = (
  lb: L2StablesLeaderboard,
): AnswerTable[] => {
  const dataDate = lb.generatedAtIso.slice(0, 10);

  const periodTables: AnswerTable[] = STABLES_METRICS.map((metric) => {
    const cell = (e?: StablesEntry) =>
      e ? `${e.name} (${formatValue(metric, e.value)})` : '—';
    return {
      title: `${METRIC_TITLE[metric]} leaderboard`,
      caption: `Top 3 Ethereum L2s by ${METRIC_LABEL[metric]} as of ${dataDate} UTC.`,
      headers: ['Period', '#1', '#2', '#3'],
      rows: STABLES_PERIODS.map((p) => {
        const arr = (lb.byMetricByPeriod?.[metric]?.[p] ?? []).slice(0, 3);
        return [
          p.charAt(0).toUpperCase() + p.slice(1),
          cell(arr[0]),
          cell(arr[1]),
          cell(arr[2]),
        ];
      }),
    };
  });

  const cellVariety = (e?: StablesEntry) =>
    e ? `${e.name} (${formatValue('variety', e.value)})` : '—';
  const varietyTable: AnswerTable = {
    title: 'Most stablecoin variety (distinct tokens deployed)',
    caption: `Top 3 Ethereum L2s by distinct stablecoin count as of ${dataDate} UTC.`,
    headers: ['Rank', 'Chain'],
    rows: lb.byVariety
      .slice(0, 5)
      .map((e, i) => [`${i + 1}`, cellVariety(e)]),
  };

  return [...periodTables, varietyTable];
};

// Multi-sentence acceptedAnswer that names the leader across every metric
// and time horizon this page covers. AI engines that quote only the accepted
// answer still hand the reader the full picture.
export const buildStablesAcceptedAnswer = (
  lb: L2StablesLeaderboard,
): string => {
  const dataDate = lb.generatedAtIso.slice(0, 10);
  const hasMinimum = STABLES_METRICS.every(
    (m) =>
      lb.byMetricByPeriod?.[m]?.daily?.[0] &&
      lb.byMetricByPeriod?.[m]?.weekly?.[0] &&
      lb.byMetricByPeriod?.[m]?.monthly?.[0],
  );
  if (!hasMinimum) {
    return 'Data currently unavailable. See growthepie.com/quick-bites/stables-by-chain for the live Ethereum L2 stablecoin leaderboards.';
  }

  const sentenceFor = (metric: StablesMetric, prefix: string): string => {
    const d = lb.byMetricByPeriod[metric].daily[0];
    const w = lb.byMetricByPeriod[metric].weekly[0];
    const m = lb.byMetricByPeriod[metric].monthly[0];
    return (
      `${prefix} the daily leader is ${d.name} (${formatValue(metric, d.value)}); ` +
      `weekly leader: ${w.name} (${formatValue(metric, w.value)}); ` +
      `monthly leader: ${m.name} (${formatValue(metric, m.value)}).`
    );
  };

  const varietyTop = lb.byVariety?.[0];
  const varietyPart = varietyTop
    ? ` By distinct stablecoin variety, ${varietyTop.name} hosts the most (${varietyTop.value} tokens).`
    : '';

  return (
    sentenceFor('supply', 'By stablecoin supply,') +
    ' ' +
    sentenceFor('txcount', 'By stablecoin transactions,') +
    ' ' +
    sentenceFor('gas_spent', 'By gas spent on stablecoins,') +
    varietyPart +
    ` Data: ${dataDate} UTC. Live leaderboards: growthepie.com/fundamentals/stablecoin-market-cap.`
  );
};
