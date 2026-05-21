// Server-side helper that produces the COMBINED Ethereum ecosystem TPS view
// (Ethereum mainnet + every tracked L2 added together) plus per-side
// breakdowns. Distinct from computeL2TxsEcosystem which is L2-only — this
// helper backs the "/answers/ethereum-ecosystem-tps" page that answers the
// AI-search query "how many TPS does Ethereum process".
//
// Data sources:
//   - landing_page.json `data.all_l2s.metrics.txcount.daily.data` for L2
//     ecosystem daily totals (same path computeL2TxsEcosystem uses).
//   - /v1/metrics/chains/ethereum/txcount.json for L1's daily series. Weekly
//     = sum of last 7 daily rows; monthly = sum of last 30; all-time = sum
//     of every row. Same definition as the L2 side so L1+L2 sums are clean.
//   - sse.growthepie.com/api/history for the live ecosystem-total TPS
//     (Ethereum L1 + all L2s combined — same number the
//     /ethereum-ecosystem page's headline card shows).
//   - sse.growthepie.com/api/chain/ethereum for Ethereum L1's current TPS.
//     L2 live TPS is derived as ecosystem - L1.

import { cache } from 'react';
import { LandingURL } from '@/lib/urls';

const L1_TXCOUNT_URL =
  'https://api.growthepie.com/v1/metrics/chains/ethereum/txcount.json';

export type EthereumEcosystemTps = {
  generatedAtIso: string;
  // Live (per-second) figures, latest snapshot.
  l1LiveTps: number | null;
  l2LiveTps: number | null;
  ecosystemLiveTps: number | null;
  // Daily transaction counts (latest completed UTC day).
  l1Daily: number | null;
  l2Daily: number | null;
  ecosystemDaily: number | null;
  // Weekly transaction counts (7-day rolling sum of daily totals).
  l1Weekly: number | null;
  l2Weekly: number | null;
  ecosystemWeekly: number | null;
  // Monthly transaction counts (30-day rolling sum of daily totals).
  l1Monthly: number | null;
  l2Monthly: number | null;
  ecosystemMonthly: number | null;
  // All-time cumulative tx counts.
  l1AllTime: number | null;
  l2AllTime: number | null;
  ecosystemAllTime: number | null;
  // L2 share of the combined daily total (0..1).
  l2ShareDaily: number | null;
  l2ShareWeekly: number | null;
  l2ShareMonthly: number | null;
  l2ShareAllTime: number | null;
  l2ShareLiveTps: number | null;
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-ecosystem-tps' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

const fetchSseSnapshot = async (url: string): Promise<any | null> => {
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { 'User-Agent': 'growthepie/answers-ecosystem-tps' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

const fetchEcosystemTotalTps = async (): Promise<number | null> => {
  const json = await fetchSseSnapshot(
    'https://sse.growthepie.com/api/history',
  );
  const history: any[] | undefined = json?.history;
  if (!Array.isArray(history) || history.length === 0) return null;
  const v = history[0]?.tps;
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
};

const fetchEthereumTps = async (): Promise<number | null> => {
  const json = await fetchSseSnapshot(
    'https://sse.growthepie.com/api/chain/ethereum',
  );
  const v = json?.data?.tps;
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
};

// Sum a [unix, count] daily series over a slice; return null if the slice
// has no numeric rows at all (vs zero, which is a real value we want to
// surface).
const sumDailyCount = (
  data: any[] | undefined,
  start: number,
  end: number,
): number | null => {
  if (!Array.isArray(data)) return null;
  const slice = data.slice(start, end);
  if (slice.length === 0) return null;
  let s = 0;
  let any = false;
  for (const row of slice) {
    if (!Array.isArray(row)) continue;
    const v = row[1];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
      s += v;
      any = true;
    }
  }
  return any ? s : null;
};

const lastDailyCount = (data: any[] | undefined): number | null => {
  if (!Array.isArray(data) || data.length === 0) return null;
  const row = data[data.length - 1];
  if (!Array.isArray(row)) return null;
  const v = row[1];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
};

const safeShare = (l2: number | null, total: number | null): number | null =>
  l2 != null && total != null && total > 0 ? l2 / total : null;

const safeSum = (
  a: number | null,
  b: number | null,
): number | null => {
  if (a == null && b == null) return null;
  return (a ?? 0) + (b ?? 0);
};

export const getEthereumEcosystemTps = cache(
  async (): Promise<EthereumEcosystemTps | null> => {
    let landing: any;
    let l1Txs: any;
    try {
      [landing, l1Txs] = await Promise.all([
        fetchJson(LandingURL),
        fetchJson(L1_TXCOUNT_URL),
      ]);
    } catch (err) {
      console.error('getEthereumEcosystemTps: upstream fetch failed', err);
      return null;
    }

    // --- Historical series ---------------------------------------------------
    const l2Series: any[] | undefined =
      landing?.data?.all_l2s?.metrics?.txcount?.daily?.data;
    const l2Len = Array.isArray(l2Series) ? l2Series.length : 0;
    const l2Daily = lastDailyCount(l2Series);
    const l2Weekly = sumDailyCount(l2Series, Math.max(0, l2Len - 7), l2Len);
    const l2Monthly = sumDailyCount(l2Series, Math.max(0, l2Len - 30), l2Len);
    const l2AllTime = sumDailyCount(l2Series, 0, l2Len);

    const l1Series: any[] | undefined =
      l1Txs?.data?.details?.timeseries?.daily?.data ??
      l1Txs?.details?.timeseries?.daily?.data;
    const l1Len = Array.isArray(l1Series) ? l1Series.length : 0;
    const l1Daily = lastDailyCount(l1Series);
    const l1Weekly = sumDailyCount(l1Series, Math.max(0, l1Len - 7), l1Len);
    const l1Monthly = sumDailyCount(l1Series, Math.max(0, l1Len - 30), l1Len);
    const l1AllTime = sumDailyCount(l1Series, 0, l1Len);

    // --- Live TPS ------------------------------------------------------------
    const [ecosystemTotalTps, ethereumTps] = await Promise.all([
      fetchEcosystemTotalTps(),
      fetchEthereumTps(),
    ]);
    let l1LiveTps: number | null = ethereumTps;
    let ecosystemLiveTps: number | null = ecosystemTotalTps;
    let l2LiveTps: number | null = null;
    if (ecosystemTotalTps != null && ethereumTps != null) {
      const diff = ecosystemTotalTps - ethereumTps;
      l2LiveTps = diff >= 0 ? diff : 0;
    }

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      l1LiveTps,
      l2LiveTps,
      ecosystemLiveTps,
      l1Daily,
      l2Daily,
      ecosystemDaily: safeSum(l1Daily, l2Daily),
      l1Weekly,
      l2Weekly,
      ecosystemWeekly: safeSum(l1Weekly, l2Weekly),
      l1Monthly,
      l2Monthly,
      ecosystemMonthly: safeSum(l1Monthly, l2Monthly),
      l1AllTime,
      l2AllTime,
      ecosystemAllTime: safeSum(l1AllTime, l2AllTime),
      l2ShareDaily: safeShare(l2Daily, safeSum(l1Daily, l2Daily)),
      l2ShareWeekly: safeShare(l2Weekly, safeSum(l1Weekly, l2Weekly)),
      l2ShareMonthly: safeShare(l2Monthly, safeSum(l1Monthly, l2Monthly)),
      l2ShareAllTime: safeShare(l2AllTime, safeSum(l1AllTime, l2AllTime)),
      l2ShareLiveTps: safeShare(l2LiveTps, ecosystemLiveTps),
    };
  },
);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmtCount = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return 'unavailable';
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  if (Math.abs(n) >= 10) return n.toFixed(0);
  return n.toFixed(2);
};

export const fmtTps = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return 'unavailable';
  if (n >= 1000) return n.toFixed(0) + ' TPS';
  if (n >= 10) return n.toFixed(1) + ' TPS';
  return n.toFixed(2) + ' TPS';
};

const fmtShare = (s: number | null): string => {
  if (s == null || !Number.isFinite(s) || s <= 0) return '—';
  if (s >= 0.1) return (s * 100).toFixed(0) + '%';
  return (s * 100).toFixed(1) + '%';
};

export const formatEcosystemLiveTps = (data: EthereumEcosystemTps): string =>
  fmtTps(data.ecosystemLiveTps);
export const formatL1LiveTps = (data: EthereumEcosystemTps): string =>
  fmtTps(data.l1LiveTps);
export const formatL2LiveTps = (data: EthereumEcosystemTps): string =>
  fmtTps(data.l2LiveTps);

export const formatCount = (
  data: EthereumEcosystemTps,
  side: 'l1' | 'l2' | 'ecosystem',
  window: 'daily' | 'weekly' | 'monthly' | 'allTime',
): string => {
  const map = {
    l1: {
      daily: data.l1Daily,
      weekly: data.l1Weekly,
      monthly: data.l1Monthly,
      allTime: data.l1AllTime,
    },
    l2: {
      daily: data.l2Daily,
      weekly: data.l2Weekly,
      monthly: data.l2Monthly,
      allTime: data.l2AllTime,
    },
    ecosystem: {
      daily: data.ecosystemDaily,
      weekly: data.ecosystemWeekly,
      monthly: data.ecosystemMonthly,
      allTime: data.ecosystemAllTime,
    },
  } as const;
  return fmtCount(map[side][window]);
};

export const formatL2Share = (
  data: EthereumEcosystemTps,
  window: 'daily' | 'weekly' | 'monthly' | 'allTime' | 'liveTps',
): string => {
  const v =
    window === 'daily'
      ? data.l2ShareDaily
      : window === 'weekly'
        ? data.l2ShareWeekly
        : window === 'monthly'
          ? data.l2ShareMonthly
          : window === 'allTime'
            ? data.l2ShareAllTime
            : data.l2ShareLiveTps;
  return fmtShare(v);
};

// Single dense sentence — drops the four headline numbers (combined TPS,
// L1 TPS, L2 TPS, ecosystem daily count) into the lead so AI cards quoting
// the first sentence get every angle. Adds an explicit pointer to the
// /ethereum-ecosystem dashboard for the real-time updating view, because
// the values quoted on this answer page are a daily snapshot, not a live
// ticker — without that caveat AI-quoted snippets could mislead readers
// into thinking this page updates second-by-second.
export const buildEcosystemTpsDenseSentence = (
  data: EthereumEcosystemTps,
  dataDateUtc: string,
): string => {
  return (
    `As of ${dataDateUtc} UTC, the Ethereum ecosystem processes ${fmtTps(
      data.ecosystemLiveTps,
    )} (Ethereum L1 + all tracked L2s combined). Of that, Ethereum mainnet contributes ${fmtTps(
      data.l1LiveTps,
    )} and L2s collectively contribute ${fmtTps(
      data.l2LiveTps,
    )} (${formatL2Share(data, 'liveTps')} of the combined throughput). Daily transaction count across the ecosystem is ${fmtCount(
      data.ecosystemDaily,
    )} (L1: ${fmtCount(data.l1Daily)}; L2s: ${fmtCount(
      data.l2Daily,
    )} — ${formatL2Share(data, 'daily')} of the daily total). The values quoted here are a snapshot; the live, second-by-second ecosystem tracker is at growthepie.com/ethereum-ecosystem.`
  );
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildEcosystemTpsAnswerTables = (
  data: EthereumEcosystemTps,
): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const live: AnswerTable = {
    title: 'Live Ethereum ecosystem throughput (TPS)',
    caption: `Live TPS for Ethereum mainnet and the L2 ecosystem, plus the combined total. Source: growthepie's real-time ecosystem stream. Data: ${dataDate} UTC.`,
    headers: ['Layer', 'Live TPS', 'Share of combined'],
    rows: [
      ['Ethereum L1 (mainnet)', fmtTps(data.l1LiveTps), '—'],
      [
        'Ethereum L2s (combined)',
        fmtTps(data.l2LiveTps),
        formatL2Share(data, 'liveTps'),
      ],
      ['Ethereum ecosystem (L1 + L2s)', fmtTps(data.ecosystemLiveTps), '100%'],
    ],
  };
  const txs: AnswerTable = {
    title: 'Ethereum ecosystem transactions — daily / weekly / monthly / all-time',
    caption: `Transaction counts across windows. Combined = L1 + L2s; L2 share is the L2 contribution to the combined total. Data: ${dataDate} UTC.`,
    headers: [
      'Window',
      'Ethereum L1',
      'L2s combined',
      'Ecosystem (L1 + L2s)',
      'L2 share',
    ],
    rows: [
      [
        'Daily (latest day)',
        fmtCount(data.l1Daily),
        fmtCount(data.l2Daily),
        fmtCount(data.ecosystemDaily),
        formatL2Share(data, 'daily'),
      ],
      [
        'Weekly (last 7 days)',
        fmtCount(data.l1Weekly),
        fmtCount(data.l2Weekly),
        fmtCount(data.ecosystemWeekly),
        formatL2Share(data, 'weekly'),
      ],
      [
        'Monthly (last 30 days)',
        fmtCount(data.l1Monthly),
        fmtCount(data.l2Monthly),
        fmtCount(data.ecosystemMonthly),
        formatL2Share(data, 'monthly'),
      ],
      [
        'All-time (cumulative)',
        fmtCount(data.l1AllTime),
        fmtCount(data.l2AllTime),
        fmtCount(data.ecosystemAllTime),
        formatL2Share(data, 'allTime'),
      ],
    ],
  };
  return [live, txs];
};

export const buildEcosystemTpsAcceptedAnswer = (
  data: EthereumEcosystemTps,
): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  if (
    data.ecosystemLiveTps == null &&
    data.ecosystemDaily == null &&
    data.ecosystemAllTime == null
  ) {
    return 'Ethereum ecosystem TPS data currently unavailable. See growthepie.com/ethereum-ecosystem for the live tracker.';
  }
  return (
    `The Ethereum ecosystem (Ethereum mainnet + all tracked L2s combined) processes approximately ${fmtTps(
      data.ecosystemLiveTps,
    )} as of ${dataDate} UTC. Of that, Ethereum mainnet (L1) contributes ${fmtTps(
      data.l1LiveTps,
    )} and the L2 ecosystem collectively contributes ${fmtTps(
      data.l2LiveTps,
    )} (${formatL2Share(data, 'liveTps')} of the combined throughput). ` +
    `On the latest UTC day the ecosystem processed ${fmtCount(
      data.ecosystemDaily,
    )} transactions (L1: ${fmtCount(data.l1Daily)}; L2s: ${fmtCount(
      data.l2Daily,
    )}). Cumulatively all-time: ${fmtCount(
      data.ecosystemAllTime,
    )} transactions across the Ethereum ecosystem. ` +
    `These figures are a snapshot at ${dataDate} UTC — for the real-time, second-by-second updating tracker, see growthepie.com/ethereum-ecosystem (the underlying live source these numbers come from). Data: ${dataDate} UTC.`
  );
};
