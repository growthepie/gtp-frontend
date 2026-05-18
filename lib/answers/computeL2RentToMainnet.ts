// Server-side helper that computes how much Ethereum mainnet earns from L2
// rollups via the L1 settlement fees they pay ("rent paid"). Unlike the
// per-chain ranking helpers, this one is ecosystem-aggregate-shaped: scalar
// totals across windows plus a top-contributors breakdown.
//
// Data source:
//   - Per-chain rent_paid endpoint `/v1/metrics/chains/{chain}/rent_paid.json`,
//     daily-only USD timeseries. We sum daily values per L2 per window, then
//     sum across L2s to get the ecosystem total.

import { cache } from 'react';
import { MasterURL } from '@/lib/urls';

const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

export type RentContributor = {
  key: string;
  name: string;
  urlKey: string;
  color: string;
  daily: number | null;
  last30dUsd: number | null;
  last90dUsd: number | null;
  allTimeUsd: number | null;
  // Share of L2 rent paid over the last 30 days. null when ecosystem total
  // is missing.
  share30d: number | null;
};

export type L2RentToMainnet = {
  generatedAtIso: string;
  universeSize: number;
  universeKeys: string[];
  excludedNonL2Keys: string[];
  ecosystemDailyUsd: number | null;
  ecosystemLast30dUsd: number | null;
  ecosystemLast90dUsd: number | null;
  ecosystemAllTimeUsd: number | null;
  topContributors: RentContributor[];
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-rent-to-mainnet' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

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
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
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
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
};

const fetchChainRent = async (
  key: string,
): Promise<{
  daily: number | null;
  last30d: number | null;
  last90d: number | null;
  allTime: number | null;
} | null> => {
  try {
    const url = `https://api.growthepie.com/v1/metrics/chains/${key}/rent_paid.json`;
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

export const getL2RentToMainnet = cache(
  async (): Promise<L2RentToMainnet | null> => {
    let master: any;
    try {
      master = await fetchJson(MasterURL);
    } catch (err) {
      console.error('getL2RentToMainnet: master fetch failed', err);
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
      universeKeys.map((key) => fetchChainRent(key).then((v) => ({ key, v }))),
    );

    let ecoDaily = 0,
      anyDaily = false,
      eco30 = 0,
      any30 = false,
      eco90 = 0,
      any90 = false,
      ecoAll = 0,
      anyAll = false;

    const rawContribs: RentContributor[] = [];
    for (const r of results) {
      if (!r.v) continue;
      rawContribs.push({
        key: r.key,
        name: nameFor(r.key),
        urlKey: urlKeyFor(r.key),
        color: colorFor(r.key),
        daily: r.v.daily,
        last30dUsd: r.v.last30d,
        last90dUsd: r.v.last90d,
        allTimeUsd: r.v.allTime,
        share30d: null,
      });
      if (r.v.daily != null) {
        ecoDaily += r.v.daily;
        anyDaily = true;
      }
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

    const denom30 = any30 ? eco30 : null;
    const contribs = rawContribs
      .map((c) => ({
        ...c,
        share30d:
          denom30 && c.last30dUsd != null && denom30 > 0
            ? c.last30dUsd / denom30
            : null,
      }))
      .sort((a, b) => (b.last30dUsd ?? -Infinity) - (a.last30dUsd ?? -Infinity));

    const sidechainExclusions = Array.from(NON_L2_KEYS)
      .filter((k) => k !== 'ethereum' && k !== 'all_l2s' && k !== 'multiple')
      .map((k) => chains[k]?.name ?? k)
      .sort();

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      universeSize: universeKeys.length,
      universeKeys,
      excludedNonL2Keys: sidechainExclusions,
      ecosystemDailyUsd: anyDaily ? ecoDaily : null,
      ecosystemLast30dUsd: any30 ? eco30 : null,
      ecosystemLast90dUsd: any90 ? eco90 : null,
      ecosystemAllTimeUsd: anyAll ? ecoAll : null,
      topContributors: contribs.slice(0, 10),
    };
  },
);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmtUsd = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'k';
  return '$' + n.toFixed(2);
};

const fmtShare = (n: number | null): string => {
  if (n == null || !Number.isFinite(n) || n <= 0) return '—';
  if (n >= 0.1) return (n * 100).toFixed(0) + '%';
  return (n * 100).toFixed(1) + '%';
};

export const formatContributorEntry = (e: RentContributor): string =>
  `${e.name} (${fmtUsd(e.last30dUsd)} over 30d, ${fmtShare(e.share30d)} of L2 total)`;

export const formatContributorTopList = (data: L2RentToMainnet, count = 5): string => {
  if (!data.topContributors || data.topContributors.length === 0) return 'unavailable';
  return data.topContributors
    .slice(0, count)
    .map((e, i) => `${i + 1}. ${formatContributorEntry(e)}`)
    .join('; ');
};

export const formatContributorLeader = (data: L2RentToMainnet): string => {
  const e = data.topContributors?.[0];
  return e ? formatContributorEntry(e) : 'unavailable';
};

export const formatEcosystemTotal = (
  data: L2RentToMainnet,
  window: 'daily' | '30d' | '90d' | 'allTime',
): string => {
  const v =
    window === 'daily'
      ? data.ecosystemDailyUsd
      : window === '30d'
        ? data.ecosystemLast30dUsd
        : window === '90d'
          ? data.ecosystemLast90dUsd
          : data.ecosystemAllTimeUsd;
  return fmtUsd(v);
};

export const buildRentDenseSentence = (
  data: L2RentToMainnet,
  dataDateUtc: string,
): string => {
  return (
    `As of ${dataDateUtc} UTC, Ethereum L2s pay Ethereum mainnet **${fmtUsd(
      data.ecosystemDailyUsd,
    )}** per day in settlement fees ("rent"), **${fmtUsd(
      data.ecosystemLast30dUsd,
    )}** per month, **${fmtUsd(
      data.ecosystemLast90dUsd,
    )}** over 90 days, and **${fmtUsd(
      data.ecosystemAllTimeUsd,
    )}** all-time across ${data.universeSize} tracked L2s.`
  );
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildRentAnswerTables = (data: L2RentToMainnet): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const totals: AnswerTable = {
    title: 'Ethereum mainnet earnings from L2s — ecosystem totals',
    caption: `Total L1 settlement fees paid by every tracked Ethereum L2 to Ethereum mainnet. Data: ${dataDate} UTC.`,
    headers: ['Window', 'L2 → mainnet rent (USD)'],
    rows: [
      ['Daily (latest day)', fmtUsd(data.ecosystemDailyUsd)],
      ['Last 30 days', fmtUsd(data.ecosystemLast30dUsd)],
      ['Last 90 days', fmtUsd(data.ecosystemLast90dUsd)],
      ['All-time (cumulative)', fmtUsd(data.ecosystemAllTimeUsd)],
    ],
  };
  const contributors: AnswerTable = {
    title: 'Top 10 L2s by rent paid to Ethereum mainnet (last 30 days)',
    caption: `Top 10 Ethereum L2s by L1 settlement fees paid over the last 30 days, with each chain's share of the L2 ecosystem total. Data: ${dataDate} UTC.`,
    headers: ['Rank', 'Chain', '30d rent paid', 'Share of L2 total', 'All-time rent paid'],
    rows: data.topContributors.slice(0, 10).map((e, i) => [
      String(i + 1),
      e.name,
      fmtUsd(e.last30dUsd),
      fmtShare(e.share30d),
      fmtUsd(e.allTimeUsd),
    ]),
  };
  return [totals, contributors];
};

export const buildRentAcceptedAnswer = (data: L2RentToMainnet): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return (
    `Ethereum mainnet earns ${fmtUsd(data.ecosystemDailyUsd)} per day, ` +
    `${fmtUsd(data.ecosystemLast30dUsd)} per month, ${fmtUsd(
      data.ecosystemLast90dUsd,
    )} over 90 days, and ${fmtUsd(
      data.ecosystemAllTimeUsd,
    )} all-time in settlement fees ("rent") from Ethereum L2s. ` +
    `Top contributors over the last 30 days: ${formatContributorTopList(data, 5)}. ` +
    `Data: ${dataDate} UTC. Live leaderboards: growthepie.com/economics.`
  );
};
