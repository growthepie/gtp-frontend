// Server-side helper that derives the current Ethereum-L2 fees leaderboard
// from growthepie's own data. Mirrors computeL2Leaderboard.ts but ranks by
// LOWEST values (cheapest first) and combines two data sources:
//
//   1. Live (latest hourly) values from `/v1/fees/table.json`, exposing four
//      fee metrics per chain: median, native-transfer median, swap median,
//      and average. The user-facing /fees page is built on the same payload.
//   2. Historical daily / weekly / monthly median fee from the per-chain
//      txcosts timeseries (`/v1/metrics/chains/{key}/txcosts.json`), USD col.
//
// Transfer / swap / avg are live-only — those facets are exposed only at the
// hourly granularity, so the period-aware leaderboard covers median fee only.
//
// Universe filtering (which chains count as an Ethereum L2) is intentionally
// identical to computeL2Leaderboard so the two answer pages can never disagree
// about which chains they cover.
//
// All values quoted in USD; the helper formatters convert to cents for prose.
//
// See lib/answers/qb-lowest-fee-ethereum-l2.ts for the placeholders this file
// is paired with, and lib/answers/articleProcessor.ts for the wire-up.

import { cache } from 'react';
import { MasterURL, FeesURLs } from '@/lib/urls';

const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

// Four fee facets we expose, mapped to the keys used in fees/table.json.
const FEE_METRICS = ['median', 'transfer', 'swap', 'avg'] as const;
export type FeeMetric = (typeof FEE_METRICS)[number];

const HOURLY_KEY_BY_METRIC: Record<FeeMetric, string> = {
  median: 'txcosts_median',
  transfer: 'txcosts_native_median',
  swap: 'txcosts_swap',
  avg: 'txcosts_avg',
};

export const FEE_PERIODS = ['daily', 'weekly', 'monthly'] as const;
export type FeePeriod = (typeof FEE_PERIODS)[number];

export type FeesEntry = {
  key: string;
  name: string;
  urlKey: string;
  // Always USD, dollars (not cents). Formatters below render in cents.
  valueUsd: number;
  color: string;
};

export type L2FeesLeaderboard = {
  generatedAtIso: string;
  universeSize: number;
  universeKeys: string[];
  excludedNonL2Keys: string[];
  // Latest-hour ranking per fee metric. Sorted cheapest-first.
  byLive: Record<FeeMetric, FeesEntry[]>;
  // Period-aware ranking for median fee only. Sorted cheapest-first.
  byPeriod: Record<FeePeriod, FeesEntry[]>;
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-fees-leaderboard' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// fees/table.json shape: chain_data[key].hourly.{metric}.{types,data}.
// `types` is [normalized, unix, value_eth, value_usd]; we want value_usd, but
// resolve it via the `types` array rather than hard-coding index 3 so a future
// column reorder doesn't silently break the answer page.
// Live hourly values are only meaningful if recent. Reject any row whose
// `unix` timestamp (ms) is more than 30 hours old, so a chain that has stopped
// reporting doesn't surface a stale value as if it were live. Rows without a
// readable timestamp are left as-is — we only drop data we can prove is stale.
const MAX_HOURLY_AGE_MS = 30 * 60 * 60 * 1000;
const isHourlyRowFresh = (types: any[], row: any[]): boolean => {
  const unixIdx = types.findIndex((t) => String(t).toLowerCase() === 'unix');
  if (unixIdx < 0) return true;
  const ts = row[unixIdx];
  if (typeof ts !== 'number' || !Number.isFinite(ts)) return true;
  return Date.now() - ts <= MAX_HOURLY_AGE_MS;
};

const latestUsdFromHourly = (block: any): number | null => {
  const types: any[] | undefined = block?.types;
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(types) || !Array.isArray(data) || data.length === 0)
    return null;
  const usdIdx = types.findIndex((t) => String(t).toLowerCase() === 'value_usd');
  if (usdIdx < 0) return null;
  const last = data[data.length - 1];
  if (!Array.isArray(last) || last.length <= usdIdx) return null;
  if (!isHourlyRowFresh(types, last)) return null;
  const v = last[usdIdx];
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
};

// Per-chain txcosts.json shape: details.timeseries.{period}.{types,data}.
// types is typically ['unix', 'eth', 'usd']; same resolve-by-name strategy.
// Daily uses the last row; weekly/monthly use the second-to-last so an
// in-progress period doesn't show up as the "current" weekly/monthly value.
const pickUsdAtPeriod = (block: any, period: FeePeriod): number | null => {
  const types: any[] | undefined = block?.types;
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(types) || !Array.isArray(data) || data.length === 0)
    return null;
  const usdIdx = types.findIndex((t) => String(t).toLowerCase() === 'usd');
  if (usdIdx < 0) return null;
  const idx = period === 'daily' ? data.length - 1 : data.length - 2;
  if (idx < 0) return null;
  const row = data[idx];
  if (!Array.isArray(row) || row.length <= usdIdx) return null;
  const v = row[usdIdx];
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
};

const fetchChainTxcosts = async (
  key: string,
): Promise<Record<FeePeriod, number | null> | null> => {
  try {
    const url = `https://api.growthepie.com/v1/metrics/chains/${key}/txcosts.json`;
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

export const getL2FeesLeaderboard = cache(
  async (): Promise<L2FeesLeaderboard | null> => {
    let master: any;
    let feeTable: any;

    try {
      [master, feeTable] = await Promise.all([
        fetchJson(MasterURL),
        fetchJson(FeesURLs.table),
      ]);
    } catch (err) {
      console.error('getL2FeesLeaderboard: upstream fetch failed', err);
      return null;
    }

    const chains: Record<string, any> = master?.chains ?? {};
    const chainData: Record<string, any> = feeTable?.chain_data ?? {};

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

    // --- Live ranking per fee metric ---------------------------------------
    const byLive = {} as Record<FeeMetric, FeesEntry[]>;
    for (const metric of FEE_METRICS) {
      const hourlyKey = HOURLY_KEY_BY_METRIC[metric];
      const entries: FeesEntry[] = [];
      for (const key of universeKeys) {
        const block = chainData[key]?.hourly?.[hourlyKey];
        const usd = latestUsdFromHourly(block);
        if (usd == null) continue;
        entries.push({
          key,
          name: nameFor(key),
          urlKey: urlKeyFor(key),
          valueUsd: usd,
          color: colorFor(key),
        });
      }
      // Cheapest-first — that's the headline this page answers.
      entries.sort((a, b) => a.valueUsd - b.valueUsd);
      byLive[metric] = entries.slice(0, 5);
    }

    // --- Historical median fee per period ----------------------------------
    const txcostsResults = await Promise.all(
      universeKeys.map((key) =>
        fetchChainTxcosts(key).then((values) => ({ key, values })),
      ),
    );

    const byPeriod = {} as Record<FeePeriod, FeesEntry[]>;
    for (const period of FEE_PERIODS) {
      const entries: FeesEntry[] = [];
      for (const r of txcostsResults) {
        if (!r.values) continue;
        const v = r.values[period];
        if (v == null) continue;
        entries.push({
          key: r.key,
          name: nameFor(r.key),
          urlKey: urlKeyFor(r.key),
          valueUsd: v,
          color: colorFor(r.key),
        });
      }
      entries.sort((a, b) => a.valueUsd - b.valueUsd);
      byPeriod[period] = entries.slice(0, 5);
    }

    const sidechainExclusions = Array.from(NON_L2_KEYS)
      .filter((k) => k !== 'ethereum' && k !== 'all_l2s' && k !== 'multiple')
      .map((k) => chains[k]?.name ?? k)
      .sort();

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      universeSize: universeKeys.length,
      universeKeys,
      excludedNonL2Keys: sidechainExclusions,
      byLive,
      byPeriod,
    };
  },
);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

// Fees on L2s are almost always sub-cent — quoting them in cents reads better
// in prose ("0.18¢") than in dollars ("$0.0018"). We escalate to dollar form
// once a single tx crosses 100¢ ($1), which is rare for L2s but possible for
// swap fees on busy L1 days.
//
// Decimal count adapts to magnitude so we always preserve ~3 significant
// figures — Mantle / Polygon zkEVM can sit at ~0.0001¢ where a fixed 2-dp
// formatter would collapse every chain to "0.00¢" and erase the ranking.
// Capped at 6 decimals so very-low-fee chains still render in a single line.
export const fmtUsdShort = (usd: number): string => {
  if (!Number.isFinite(usd)) return '—';
  if (usd === 0) return '0¢';
  const cents = usd * 100;
  if (cents >= 100) return `$${usd.toFixed(2)}`;
  // Pick decimal count to keep 3 significant figures:
  // log10(cents)= 1 → decimals=1 ("12.3¢"), 0 → 2 ("1.23¢"),
  // -1 → 3 ("0.123¢"), -2 → 4 ("0.0123¢"), etc.
  const log10 = Math.floor(Math.log10(Math.abs(cents)));
  const decimals = Math.min(6, Math.max(0, 2 - log10));
  return `${cents.toFixed(decimals)}¢`;
};

// Per-metric short labels used in dense prose ("median fee", "transfer fee").
const METRIC_LABEL: Record<FeeMetric, string> = {
  median: 'median fee',
  transfer: 'native transfer fee',
  swap: 'token swap fee',
  avg: 'average fee',
};

const METRIC_TITLE: Record<FeeMetric, string> = {
  median: 'Median fee',
  transfer: 'Native transfer fee',
  swap: 'Token swap fee',
  avg: 'Average fee',
};

export const formatFeesEntry = (e: FeesEntry): string =>
  `${e.name} (${fmtUsdShort(e.valueUsd)})`;

export const formatLiveTopList = (
  lb: L2FeesLeaderboard,
  metric: FeeMetric,
  count = 3,
): string => {
  const entries = lb.byLive?.[metric];
  if (!entries || entries.length === 0) return 'unavailable';
  return entries
    .slice(0, count)
    .map((e, i) => `${i + 1}. ${formatFeesEntry(e)}`)
    .join(', ');
};

export const formatLiveLeader = (
  lb: L2FeesLeaderboard,
  metric: FeeMetric,
): string => {
  const e = lb.byLive?.[metric]?.[0];
  return e ? formatFeesEntry(e) : 'unavailable';
};

export const formatPeriodTopList = (
  lb: L2FeesLeaderboard,
  period: FeePeriod,
  count = 3,
): string => {
  const entries = lb.byPeriod?.[period];
  if (!entries || entries.length === 0) return 'unavailable';
  return entries
    .slice(0, count)
    .map((e, i) => `${i + 1}. ${formatFeesEntry(e)}`)
    .join(', ');
};

export const formatPeriodLeader = (
  lb: L2FeesLeaderboard,
  period: FeePeriod,
): string => {
  const e = lb.byPeriod?.[period]?.[0];
  return e ? formatFeesEntry(e) : 'unavailable';
};

// Dense quotable sentence for the historical (median fee) leaderboard.
// Engineered to fit under ~155 chars in the common "Base leads at all
// horizons" branch so AI answer cards don't truncate the monthly figure.
export const buildHistoricalDenseSentence = (
  lb: L2FeesLeaderboard,
  dataDateUtc: string,
): string => {
  const d = lb.byPeriod?.daily?.[0];
  const w = lb.byPeriod?.weekly?.[0];
  const m = lb.byPeriod?.monthly?.[0];

  if (!d || !w || !m) {
    return (
      `**Cheapest Ethereum L2s by median fee** (data ${dataDateUtc} UTC): ` +
      `daily — ${formatPeriodTopList(lb, 'daily', 3)}; ` +
      `weekly — ${formatPeriodTopList(lb, 'weekly', 3)}; ` +
      `monthly — ${formatPeriodTopList(lb, 'monthly', 3)}.`
    );
  }

  const allSame = d.key === w.key && w.key === m.key;
  const lead = allSame
    ? `As of ${dataDateUtc} UTC, **${d.name}** is the cheapest Ethereum L2 by median fee at ` +
      `${fmtUsdShort(d.valueUsd)} daily, ${fmtUsdShort(w.valueUsd)} weekly, ` +
      `${fmtUsdShort(m.valueUsd)} monthly.`
    : `As of ${dataDateUtc} UTC, cheapest Ethereum L2 by median fee: ` +
      `${d.name} ${fmtUsdShort(d.valueUsd)} daily, ` +
      `${w.name} ${fmtUsdShort(w.valueUsd)} weekly, ` +
      `${m.name} ${fmtUsdShort(m.valueUsd)} monthly.`;

  return (
    `${lead} ` +
    `Daily top 3: ${formatPeriodTopList(lb, 'daily', 3)}. ` +
    `Weekly top 3: ${formatPeriodTopList(lb, 'weekly', 3)}. ` +
    `Monthly top 3: ${formatPeriodTopList(lb, 'monthly', 3)}.`
  );
};

// Dense quotable sentence for the live (hourly) per-fee-type leaderboards.
// Names the cheapest chain for each of median / transfer / swap / avg, in one
// sentence — that's the new information this page adds over /answers/most-
// used-ethereum-l2.
export const buildLiveDenseSentence = (
  lb: L2FeesLeaderboard,
  dataDateUtc: string,
): string => {
  const parts: string[] = [];
  for (const metric of FEE_METRICS) {
    const e = lb.byLive?.[metric]?.[0];
    if (!e) continue;
    parts.push(`${METRIC_LABEL[metric]}: ${e.name} (${fmtUsdShort(e.valueUsd)})`);
  }
  if (parts.length === 0) {
    return `Live L2 fee data temporarily unavailable (data ${dataDateUtc} UTC).`;
  }
  return (
    `**Live L2 fee leaders** (latest hour, ${dataDateUtc} UTC) — ` +
    parts.join('; ') +
    '.'
  );
};

// Tables rendered by the static SEO shell as real <table> elements. One for
// the historical median ranking, one for the live cross-metric ranking.
export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildFeesAnswerTables = (lb: L2FeesLeaderboard): AnswerTable[] => {
  const dataDate = lb.generatedAtIso.slice(0, 10);
  const cell = (e?: FeesEntry) =>
    e ? `${e.name} (${fmtUsdShort(e.valueUsd)})` : '—';

  const historical: AnswerTable = {
    title: 'Cheapest L2 — median fee, by period',
    caption: `Top 3 cheapest Ethereum L2s by median transaction fee as of ${dataDate} UTC.`,
    headers: ['Period', '#1', '#2', '#3'],
    rows: FEE_PERIODS.map((p) => {
      const arr = (lb.byPeriod?.[p] ?? []).slice(0, 3);
      return [
        p.charAt(0).toUpperCase() + p.slice(1),
        cell(arr[0]),
        cell(arr[1]),
        cell(arr[2]),
      ];
    }),
  };

  const live: AnswerTable = {
    title: 'Cheapest L2 — live (latest hour), by fee type',
    caption: `Top 3 cheapest Ethereum L2s by live fee type (last completed hour, ${dataDate} UTC).`,
    headers: ['Fee type', '#1', '#2', '#3'],
    rows: FEE_METRICS.map((metric) => {
      const arr = (lb.byLive?.[metric] ?? []).slice(0, 3);
      return [METRIC_TITLE[metric], cell(arr[0]), cell(arr[1]), cell(arr[2])];
    }),
  };

  return [historical, live];
};

// Multi-sentence acceptedAnswer used as QAPage.acceptedAnswer.text. Names the
// cheapest L2 across every dimension this page covers so AI engines that quote
// only the accepted answer still hand readers the full picture.
export const buildFeesAcceptedAnswer = (lb: L2FeesLeaderboard): string => {
  const dataDate = lb.generatedAtIso.slice(0, 10);
  const d = lb.byPeriod?.daily?.[0];
  const w = lb.byPeriod?.weekly?.[0];
  const m = lb.byPeriod?.monthly?.[0];

  if (!d || !w || !m) {
    return 'Data currently unavailable. See growthepie.com/fees for the live Ethereum L2 fee leaderboards.';
  }

  const liveBits: string[] = [];
  for (const metric of FEE_METRICS) {
    const e = lb.byLive?.[metric]?.[0];
    if (!e) continue;
    liveBits.push(`${METRIC_LABEL[metric]}: ${e.name} (${fmtUsdShort(e.valueUsd)})`);
  }
  const livePart = liveBits.length
    ? ` Live (latest hour) — ${liveBits.join('; ')}.`
    : '';

  return (
    `By median transaction fee, the daily-cheapest Ethereum L2 is ` +
    `${d.name} (${fmtUsdShort(d.valueUsd)}); weekly-cheapest: ` +
    `${w.name} (${fmtUsdShort(w.valueUsd)}); monthly-cheapest: ` +
    `${m.name} (${fmtUsdShort(m.valueUsd)}).${livePart}` +
    ` Data: ${dataDate} UTC. Live leaderboards: growthepie.com/fees.`
  );
};
