// Server-side helper that derives current L2 ECOSYSTEM-WIDE transaction
// stats — total volume across all tracked L2s rather than a per-chain
// ranking. Sister to computeL2Leaderboard / computeL2FeesLeaderboard /
// computeL2StablesLeaderboard, but the shape is different: a handful of
// scalar numbers plus an optional top-contributors breakdown, not a set of
// rankings.
//
// Data sources:
//   - Daily / weekly / monthly / all-time transaction counts come from the
//     pre-aggregated ecosystem series at landing_page.json
//     `data.all_l2s.metrics.txcount.daily.data` (rows of `[unix, value]`).
//     Weekly = sum of last 7 rows; monthly = sum of last 30; all-time = sum
//     of every row in the series.
//   - Live TPS uses the same source as the /ethereum-ecosystem page —
//     `sse.growthepie.com/api/history` for the latest ecosystem total
//     (Ethereum L1 + all L2s combined) minus `sse.growthepie.com/api/ethereum`
//     for Ethereum L1's current TPS. The difference is L2-only TPS, the
//     figure this page actually wants to quote. Falls back to summing
//     `fees/table.json` per-chain hourly TPS across the L2 universe if
//     either SSE-snapshot fetch fails.
//   - Per-chain "top contributors today" comes from
//     landing_page.json's `data.metrics.table_visual` (same payload the
//     usage leaderboard uses), filtered to the L2 universe.
//
// Universe filtering is identical to the other answer pages so this page
// can never disagree about which chains count as an Ethereum L2.

import { cache } from 'react';
import { LandingURL, MasterURL, FeesURLs } from '@/lib/urls';

const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

export type ContributorEntry = {
  key: string;
  name: string;
  urlKey: string;
  // Daily transactions on this chain (raw count).
  value: number;
  // Share of the ecosystem-wide daily total, 0..1.
  share: number;
  color: string;
};

export type L2TxsEcosystem = {
  generatedAtIso: string;
  universeSize: number;
  universeKeys: string[];
  excludedNonL2Keys: string[];
  // Latest-hour aggregated TPS across the L2 ecosystem.
  liveTps: number | null;
  // Latest day's total transactions on L2s (raw count).
  daily: number | null;
  // Sum of the last 7 days of daily totals.
  weekly: number | null;
  // Sum of the last 30 days of daily totals.
  monthly: number | null;
  // Sum of every day in the daily series — cumulative ecosystem total.
  allTime: number | null;
  // Top contributors today, sorted descending by daily tx count.
  topContributors: ContributorEntry[];
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-txs-ecosystem' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// SSE-snapshot endpoints update every few seconds upstream, so we don't want
// the hour-long revalidate window the rest of this file uses. 5 minutes
// keeps the answer page's live-TPS number reasonably fresh without hammering
// the upstream every render.
const fetchSseSnapshot = async (url: string): Promise<any | null> => {
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { 'User-Agent': 'growthepie/answers-txs-ecosystem' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

// Read the latest aggregate TPS from `sse.growthepie.com/api/history`.
// The endpoint returns `{ history: HistoryItem[], summary }`; history[0] is
// the most recent point (the same data the /ethereum-ecosystem page chart
// initialises from). `tps` here is the Ethereum-ecosystem total — Ethereum
// L1 + every tracked L2 — so we subtract Ethereum's own TPS below.
const fetchEcosystemTotalTps = async (): Promise<number | null> => {
  const json = await fetchSseSnapshot(
    'https://sse.growthepie.com/api/history',
  );
  const history: any[] | undefined = json?.history;
  if (!Array.isArray(history) || history.length === 0) return null;
  const v = history[0]?.tps;
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
};

// Read Ethereum L1's current TPS from `sse.growthepie.com/api/chain/ethereum`.
// The endpoint returns `{ data: { tps, block_time, ... }, metrics, timestamp }`.
// NB: the URL form is `/api/chain/{chain}` — the bare `/api/ethereum` form
// 404s, which is why this used to silently fall through to the per-chain
// fees/table.json sum and read ~10× lower than the ecosystem page.
const fetchEthereumTps = async (): Promise<number | null> => {
  const json = await fetchSseSnapshot(
    'https://sse.growthepie.com/api/chain/ethereum',
  );
  const v = json?.data?.tps;
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
};

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

// Pick a numeric value out of an hourly fees/table.json block by column
// name. fees/table.json's tps block has `types: ['normalized','unix','value']`
// so we resolve by name rather than index in case the column order changes.
const latestTpsFromHourly = (block: any): number | null => {
  const types: any[] | undefined = block?.types;
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(types) || !Array.isArray(data) || data.length === 0)
    return null;
  const idx = types.findIndex((t) => String(t).toLowerCase() === 'value');
  if (idx < 0) return null;
  const last = data[data.length - 1];
  if (!Array.isArray(last) || last.length <= idx) return null;
  if (!isHourlyRowFresh(types, last)) return null;
  const v = last[idx];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
};

export const getL2TxsEcosystem = cache(
  async (): Promise<L2TxsEcosystem | null> => {
    let master: any;
    let landing: any;
    let feeTable: any;

    try {
      [master, landing, feeTable] = await Promise.all([
        fetchJson(MasterURL),
        fetchJson(LandingURL),
        fetchJson(FeesURLs.table),
      ]);
    } catch (err) {
      console.error('getL2TxsEcosystem: upstream fetch failed', err);
      return null;
    }

    const chains: Record<string, any> = master?.chains ?? {};
    const tableVisual: Record<string, any> =
      landing?.data?.metrics?.table_visual ?? {};
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
    const nameFor = (key: string): string =>
      tableVisual[key]?.chain_name ?? chains[key]?.name ?? key;
    const urlKeyFor = (key: string): string =>
      chains[key]?.url_key ?? key.replace(/_/g, '-');

    // --- Ecosystem timeseries (daily / weekly / monthly / all-time) --------
    const series: any[] | undefined =
      landing?.data?.all_l2s?.metrics?.txcount?.daily?.data;
    let daily: number | null = null;
    let weekly: number | null = null;
    let monthly: number | null = null;
    let allTime: number | null = null;
    if (Array.isArray(series) && series.length > 0) {
      const valueOf = (row: any): number | null =>
        Array.isArray(row) && typeof row[1] === 'number' && Number.isFinite(row[1])
          ? row[1]
          : null;
      const last = valueOf(series[series.length - 1]);
      daily = last;

      const sumLastN = (n: number): number | null => {
        const slice = series.slice(-n);
        let s = 0;
        let any = false;
        for (const row of slice) {
          const v = valueOf(row);
          if (v != null) {
            s += v;
            any = true;
          }
        }
        return any ? s : null;
      };
      weekly = sumLastN(7);
      monthly = sumLastN(30);

      let total = 0;
      let any = false;
      for (const row of series) {
        const v = valueOf(row);
        if (v != null) {
          total += v;
          any = true;
        }
      }
      allTime = any ? total : null;
    }

    // --- Live aggregated TPS (L2 ecosystem total) --------------------------
    // Primary path: match the /ethereum-ecosystem page exactly. That page's
    // "Ethereum Ecosystem TPS" card is the SSE `global_metrics.total_tps`,
    // which includes Ethereum L1. We fetch the HTTP snapshot equivalent
    // (history[0].tps from /api/history) and subtract Ethereum L1's current
    // TPS (/api/ethereum). The result is L2-only ecosystem TPS — what this
    // answer page is actually answering.
    let liveTps: number | null = null;
    const [ecosystemTotalTps, ethereumTps] = await Promise.all([
      fetchEcosystemTotalTps(),
      fetchEthereumTps(),
    ]);
    if (ecosystemTotalTps != null && ethereumTps != null) {
      const diff = ecosystemTotalTps - ethereumTps;
      liveTps = diff >= 0 ? diff : 0;
    } else {
      // Fallback: sum latest-hour per-chain TPS from fees/table.json across
      // the L2 universe. Coarser (hourly, not real-time) but never depends
      // on the SSE service being reachable.
      let s = 0;
      let any = false;
      for (const key of universeKeys) {
        const block = chainData[key]?.hourly?.tps;
        const v = latestTpsFromHourly(block);
        if (v != null) {
          s += v;
          any = true;
        }
      }
      liveTps = any ? s : null;
    }

    // --- Top contributors (today, by daily tx count) -----------------------
    const contributors: ContributorEntry[] = [];
    const dailyDenom =
      daily && Number.isFinite(daily) && daily > 0 ? daily : null;
    for (const [key, row] of Object.entries(tableVisual)) {
      if (!isL2(key)) continue;
      const r = row?.ranking?.txcount;
      const value = typeof r?.value === 'number' ? r.value : null;
      if (value == null || value <= 0) continue;
      contributors.push({
        key,
        name: nameFor(key),
        urlKey: urlKeyFor(key),
        value,
        share: dailyDenom ? value / dailyDenom : 0,
        color: colorFor(key),
      });
    }
    contributors.sort((a, b) => b.value - a.value);

    const sidechainExclusions = Array.from(NON_L2_KEYS)
      .filter((k) => k !== 'ethereum' && k !== 'all_l2s' && k !== 'multiple')
      .map((k) => chains[k]?.name ?? k)
      .sort();

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      universeSize: universeKeys.length,
      universeKeys,
      excludedNonL2Keys: sidechainExclusions,
      liveTps,
      daily,
      weekly,
      monthly,
      allTime,
      topContributors: contributors.slice(0, 5),
    };
  },
);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmtCompactCount = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return 'unavailable';
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  if (Math.abs(n) >= 10) return n.toFixed(0);
  return n.toFixed(2);
};

// TPS values cluster around a few hundred for the whole L2 ecosystem today;
// show one decimal under 1000 and round above.
export const fmtTps = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return 'unavailable';
  if (n >= 1000) return n.toFixed(0) + ' TPS';
  if (n >= 10) return n.toFixed(1) + ' TPS';
  return n.toFixed(2) + ' TPS';
};

export const fmtCount = fmtCompactCount;

const fmtShare = (s: number): string => {
  if (!Number.isFinite(s) || s <= 0) return '—';
  if (s >= 0.1) return (s * 100).toFixed(0) + '%';
  return (s * 100).toFixed(1) + '%';
};

export const formatContributorTopList = (
  data: L2TxsEcosystem,
  count = 3,
): string => {
  const c = data.topContributors;
  if (!c || c.length === 0) return 'unavailable';
  return c
    .slice(0, count)
    .map(
      (e, i) =>
        `${i + 1}. ${e.name} (${fmtCompactCount(e.value)}${
          e.share > 0 ? `, ${fmtShare(e.share)} of L2 total` : ''
        })`,
    )
    .join(', ');
};

export const formatContributorLeader = (data: L2TxsEcosystem): string => {
  const e = data.topContributors?.[0];
  if (!e) return 'unavailable';
  return `${e.name} (${fmtCompactCount(e.value)}${
    e.share > 0 ? `, ${fmtShare(e.share)}` : ''
  })`;
};

// Single dense sentence: live TPS + daily + weekly + monthly + all-time.
// Engineered to fit in the ~155-char range AI answer cards prefer (the lead
// before the comma list) so the headline numbers don't get truncated.
// Note: live TPS covers every L2 the ecosystem stream tracks (broader than
// the curated universe), while the historical figures are over the curated
// universe — kept here as one sentence because the scope footnote lives in
// the surrounding prose / FAQ.
export const buildTxsDenseSentence = (
  data: L2TxsEcosystem,
  dataDateUtc: string,
): string => {
  const tps = fmtTps(data.liveTps);
  const d = fmtCompactCount(data.daily);
  const w = fmtCompactCount(data.weekly);
  const m = fmtCompactCount(data.monthly);
  const all = fmtCompactCount(data.allTime);
  return (
    `As of ${dataDateUtc} UTC, Ethereum L2s collectively process ${tps} live, ` +
    `${d} transactions per day, ${w} per week, ${m} per month, ` +
    `and ${all} all-time across the ${data.universeSize}-chain curated universe ` +
    `(live TPS includes additional L2s tracked by the ecosystem stream).`
  );
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildTxsAnswerTables = (data: L2TxsEcosystem): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);

  const totals: AnswerTable = {
    title: 'Ethereum L2 transactions — ecosystem totals',
    caption: `Live TPS covers every L2 the ecosystem stream tracks (broader); daily / weekly / monthly / all-time use the ${data.universeSize}-chain curated universe. Data: ${dataDate} UTC.`,
    headers: ['Window', 'Total transactions'],
    rows: [
      ['Live (now, all-L2 ecosystem)', fmtTps(data.liveTps)],
      ['Daily (latest day, curated universe)', fmtCompactCount(data.daily)],
      ['Weekly (last 7 days, curated universe)', fmtCompactCount(data.weekly)],
      ['Monthly (last 30 days, curated universe)', fmtCompactCount(data.monthly)],
      ['All-time (cumulative, curated universe)', fmtCompactCount(data.allTime)],
    ],
  };

  const contributors: AnswerTable = {
    title: 'Top L2 contributors to daily transactions',
    caption: `Top 5 Ethereum L2s by daily transactions and share of the ecosystem total, ${dataDate} UTC.`,
    headers: ['Rank', 'Chain', 'Daily txs', 'Share of L2 total'],
    rows: data.topContributors.slice(0, 5).map((e, i) => [
      String(i + 1),
      e.name,
      fmtCompactCount(e.value),
      e.share > 0 ? fmtShare(e.share) : '—',
    ]),
  };

  return [totals, contributors];
};

// Multi-sentence acceptedAnswer. AI engines that quote only the accepted
// answer still hand the reader the five headline numbers + the top
// contributor for context.
export const buildTxsAcceptedAnswer = (data: L2TxsEcosystem): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  if (
    data.daily == null &&
    data.weekly == null &&
    data.monthly == null &&
    data.allTime == null
  ) {
    return 'Data currently unavailable. See growthepie.com/fundamentals/transaction-count for live Ethereum L2 transaction counts.';
  }
  const lead = buildTxsDenseSentence(data, dataDate);
  const top = data.topContributors?.[0];
  const topSentence = top
    ? ` The single largest contributor today is ${top.name} (${fmtCompactCount(
        top.value,
      )}${top.share > 0 ? `, ${fmtShare(top.share)} of the L2 total` : ''}).`
    : '';
  return `${lead}${topSentence} Data: ${dataDate} UTC. Live leaderboards: growthepie.com/fundamentals/transaction-count.`;
};
