// Server-side helper that ranks Ethereum L2s by profit (a flow metric — sum
// over windows, not point-in-time). Profit is fees collected by the chain
// minus its L1 settlement cost — i.e. what the chain actually earns.
//
// Data source:
//   - Per-chain profit endpoint `/v1/metrics/chains/{chain}/profit.json`.
//     Daily-only timeseries with `[unix, usd, eth]` columns. We sum to
//     produce 30d / 90d / all-time totals. Daily is the latest row.

import { cache } from 'react';
import { MasterURL } from '@/lib/urls';

const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

export type ProfitEntry = {
  key: string;
  name: string;
  urlKey: string;
  color: string;
  // USD totals across various windows. null when the chain doesn't have
  // enough history for the window.
  daily: number | null;
  last30dUsd: number | null;
  last90dUsd: number | null;
  allTimeUsd: number | null;
};

export type L2Profit = {
  generatedAtIso: string;
  universeSize: number;
  universeKeys: string[];
  excludedNonL2Keys: string[];
  // Ecosystem totals (sum across L2 universe) per window.
  ecosystemLast30dUsd: number | null;
  ecosystemLast90dUsd: number | null;
  ecosystemAllTimeUsd: number | null;
  // Sorted descending by last30dUsd — the headline ranking.
  topByLast30d: ProfitEntry[];
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-profit-ranking' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// Resolve USD column by name, sum rows over a sliced window.
const sumUsd = (block: any, sliceStart: number, sliceEnd: number): number | null => {
  const types: any[] | undefined = block?.types;
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(types) || !Array.isArray(data)) return null;
  const usdIdx = types.findIndex((t) => String(t).toLowerCase() === 'usd');
  if (usdIdx < 0) return null;
  const slice = data.slice(sliceStart, sliceEnd);
  if (slice.length === 0) return null;
  let s = 0;
  let any = false;
  for (const row of slice) {
    if (!Array.isArray(row) || row.length <= usdIdx) continue;
    const v = row[usdIdx];
    if (typeof v === 'number' && Number.isFinite(v)) {
      s += v;
      any = true;
    }
  }
  return any ? s : null;
};

const lastUsd = (block: any): number | null => {
  const types: any[] | undefined = block?.types;
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(types) || !Array.isArray(data) || data.length === 0) return null;
  const usdIdx = types.findIndex((t) => String(t).toLowerCase() === 'usd');
  if (usdIdx < 0) return null;
  const row = data[data.length - 1];
  if (!Array.isArray(row) || row.length <= usdIdx) return null;
  const v = row[usdIdx];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};

const fetchChainProfit = async (
  key: string,
): Promise<{
  daily: number | null;
  last30d: number | null;
  last90d: number | null;
  allTime: number | null;
} | null> => {
  try {
    const url = `https://api.growthepie.com/v1/metrics/chains/${key}/profit.json`;
    const json = await fetchJson(url);
    const ts = json?.data?.details?.timeseries ?? json?.details?.timeseries;
    const daily = ts?.daily;
    if (!daily) return null;
    const data: any[] | undefined = daily?.data;
    if (!Array.isArray(data) || data.length === 0) return null;
    return {
      daily: lastUsd(daily),
      last30d: sumUsd(daily, Math.max(0, data.length - 30), data.length),
      last90d: sumUsd(daily, Math.max(0, data.length - 90), data.length),
      allTime: sumUsd(daily, 0, data.length),
    };
  } catch {
    return null;
  }
};

export const getL2Profit = cache(
  async (): Promise<L2Profit | null> => {
    let master: any;
    try {
      master = await fetchJson(MasterURL);
    } catch (err) {
      console.error('getL2Profit: master fetch failed', err);
      return null;
    }

    const chains: Record<string, any> = master?.chains ?? {};

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

    const results = await Promise.all(
      universeKeys.map((key) => fetchChainProfit(key).then((v) => ({ key, v }))),
    );

    const entries: ProfitEntry[] = [];
    let eco30 = 0;
    let any30 = false;
    let eco90 = 0;
    let any90 = false;
    let ecoAll = 0;
    let anyAll = false;
    for (const r of results) {
      if (!r.v) continue;
      entries.push({
        key: r.key,
        name: nameFor(r.key),
        urlKey: urlKeyFor(r.key),
        color: colorFor(r.key),
        daily: r.v.daily,
        last30dUsd: r.v.last30d,
        last90dUsd: r.v.last90d,
        allTimeUsd: r.v.allTime,
      });
      if (r.v.last30d != null) {
        eco30 += r.v.last30d;
        any30 = true;
      }
      if (r.v.last90d != null) {
        eco90 += r.v.last90d;
        any90 = true;
      }
      if (r.v.allTime != null) {
        ecoAll += r.v.allTime;
        anyAll = true;
      }
    }
    // Headline ranking: last 30 days. A negative-profit chain (subsidising
    // its users) still belongs in the table, just at the bottom.
    entries.sort((a, b) => (b.last30dUsd ?? -Infinity) - (a.last30dUsd ?? -Infinity));

    const sidechainExclusions = Array.from(NON_L2_KEYS)
      .filter((k) => k !== 'ethereum' && k !== 'all_l2s' && k !== 'multiple')
      .map((k) => chains[k]?.name ?? k)
      .sort();

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      universeSize: universeKeys.length,
      universeKeys,
      excludedNonL2Keys: sidechainExclusions,
      ecosystemLast30dUsd: any30 ? eco30 : null,
      ecosystemLast90dUsd: any90 ? eco90 : null,
      ecosystemAllTimeUsd: anyAll ? ecoAll : null,
      topByLast30d: entries.slice(0, 10),
    };
  },
);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmtUsd = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (abs >= 1e9) return sign + '$' + (abs / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return sign + '$' + (abs / 1e3).toFixed(1) + 'k';
  return sign + '$' + abs.toFixed(2);
};

export const formatProfitEntry = (e: ProfitEntry): string =>
  `${e.name} (30d: ${fmtUsd(e.last30dUsd)}; 90d: ${fmtUsd(e.last90dUsd)}; all-time: ${fmtUsd(e.allTimeUsd)})`;

export const formatTopList = (data: L2Profit, count = 10): string => {
  if (!data.topByLast30d || data.topByLast30d.length === 0) return 'unavailable';
  return data.topByLast30d
    .slice(0, count)
    .map((e, i) => `${i + 1}. ${formatProfitEntry(e)}`)
    .join('; ');
};

export const formatLeader = (data: L2Profit): string => {
  const e = data.topByLast30d?.[0];
  return e ? formatProfitEntry(e) : 'unavailable';
};

export const formatLeader30d = (data: L2Profit): string => {
  const e = data.topByLast30d?.[0];
  return e ? `${e.name} (${fmtUsd(e.last30dUsd)})` : 'unavailable';
};

export const formatEcosystemTotal = (
  data: L2Profit,
  window: '30d' | '90d' | 'allTime',
): string => {
  const v =
    window === '30d'
      ? data.ecosystemLast30dUsd
      : window === '90d'
        ? data.ecosystemLast90dUsd
        : data.ecosystemAllTimeUsd;
  return fmtUsd(v);
};

export const buildProfitDenseSentence = (
  data: L2Profit,
  dataDateUtc: string,
): string => {
  const top = data.topByLast30d?.[0];
  if (!top) {
    return `**Top Ethereum L2s by profit** (data ${dataDateUtc} UTC): unavailable.`;
  }
  return (
    `As of ${dataDateUtc} UTC, **${top.name}** is the most profitable Ethereum L2 ` +
    `with ${fmtUsd(top.last30dUsd)} in profit over the last 30 days ` +
    `(${fmtUsd(top.last90dUsd)} over 90 days; ${fmtUsd(top.allTimeUsd)} all-time). ` +
    `Ecosystem total last 30 days: ${fmtUsd(data.ecosystemLast30dUsd)}; ` +
    `all-time: ${fmtUsd(data.ecosystemAllTimeUsd)}.`
  );
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildProfitAnswerTables = (data: L2Profit): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return [
    {
      title: 'Top 10 Ethereum L2s by profit',
      caption: `Profit = chain revenue (fees collected) minus L1 settlement cost (rent paid), summed over each window. Sorted by 30-day profit. Negative profit = the chain is subsidising its users. Data: ${dataDate} UTC.`,
      headers: ['Rank', 'Chain', '30d profit', '90d profit', 'All-time profit'],
      rows: data.topByLast30d.slice(0, 10).map((e, i) => [
        String(i + 1),
        e.name,
        fmtUsd(e.last30dUsd),
        fmtUsd(e.last90dUsd),
        fmtUsd(e.allTimeUsd),
      ]),
    },
  ];
};

export const buildProfitAcceptedAnswer = (data: L2Profit): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const top = data.topByLast30d?.[0];
  if (!top) {
    return 'Data currently unavailable. See growthepie.com/economics for the live Ethereum L2 profit leaderboard.';
  }
  return (
    `By profit over the last 30 days, the most profitable Ethereum L2 is **${top.name}** ` +
    `at ${fmtUsd(top.last30dUsd)} (${fmtUsd(top.last90dUsd)} over 90 days; ` +
    `${fmtUsd(top.allTimeUsd)} all-time). ` +
    `The L2 ecosystem collectively earned ${fmtUsd(data.ecosystemLast30dUsd)} in the last 30 days. ` +
    `Top 10: ${formatTopList(data, 10)}. ` +
    `Data: ${dataDate} UTC. Profit = revenue (fees) − L1 settlement cost (rent). ` +
    `Live leaderboards: growthepie.com/economics.`
  );
};
