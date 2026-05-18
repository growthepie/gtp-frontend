// Server-side helper that ranks Ethereum L2s by current Total Value Secured
// (TVS / TVL — same data, growthepie surfaces both labels for the same
// metric). Smaller cousin to computeL2Leaderboard: just one metric, one
// period (latest snapshot), one ranking.
//
// Data source:
//   - Per-chain TVL endpoint `/v1/metrics/chains/{chain}/tvl.json`. Only
//     exposes a daily series; we use the latest USD value as the current
//     TVS and the value 30 days ago for a "30-day change" stat.

import { cache } from 'react';
import { MasterURL } from '@/lib/urls';

const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

export type TvsEntry = {
  key: string;
  name: string;
  urlKey: string;
  color: string;
  // Latest day's USD value.
  currentUsd: number;
  // USD value 30 days ago. May be null if the chain doesn't have 30+ days
  // of history.
  priorUsd: number | null;
  // Change percentage; null when prior is missing or zero.
  changePct: number | null;
};

export type L2TvsRanking = {
  generatedAtIso: string;
  universeSize: number;
  universeKeys: string[];
  excludedNonL2Keys: string[];
  // Ecosystem total TVS — sum of per-chain currentUsd across the L2
  // universe. Useful as a denominator for "Base = X% of L2 TVS".
  ecosystemTotalUsd: number | null;
  // Sorted descending by currentUsd, top 10.
  topByTvs: TvsEntry[];
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-tvs-ranking' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// Resolve USD column by name (not index) — the daily series is
// `[unix, usd, eth]` today but defending against a future column reorder.
const pickUsdAt = (block: any, index: number): number | null => {
  const types: any[] | undefined = block?.types;
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(types) || !Array.isArray(data)) return null;
  if (index < 0 || index >= data.length) return null;
  const usdIdx = types.findIndex((t) => String(t).toLowerCase() === 'usd');
  if (usdIdx < 0) return null;
  const row = data[index];
  if (!Array.isArray(row) || row.length <= usdIdx) return null;
  const v = row[usdIdx];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
};

const fetchChainTvs = async (
  key: string,
): Promise<{ current: number; prior30: number | null } | null> => {
  try {
    const url = `https://api.growthepie.com/v1/metrics/chains/${key}/tvl.json`;
    const json = await fetchJson(url);
    const ts = json?.data?.details?.timeseries ?? json?.details?.timeseries;
    const daily = ts?.daily;
    const data: any[] | undefined = daily?.data;
    if (!Array.isArray(data) || data.length === 0) return null;
    const last = data.length - 1;
    const current = pickUsdAt(daily, last);
    if (current == null) return null;
    const prior30 = data.length > 30 ? pickUsdAt(daily, last - 30) : null;
    return { current, prior30 };
  } catch {
    return null;
  }
};

export const getL2TvsRanking = cache(
  async (): Promise<L2TvsRanking | null> => {
    let master: any;
    try {
      master = await fetchJson(MasterURL);
    } catch (err) {
      console.error('getL2TvsRanking: master fetch failed', err);
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
      universeKeys.map((key) => fetchChainTvs(key).then((v) => ({ key, v }))),
    );

    const entries: TvsEntry[] = [];
    let ecosystemTotal = 0;
    let anyTotal = false;
    for (const r of results) {
      if (!r.v) continue;
      const { current, prior30 } = r.v;
      const changePct =
        prior30 != null && prior30 > 0 ? (current - prior30) / prior30 : null;
      entries.push({
        key: r.key,
        name: nameFor(r.key),
        urlKey: urlKeyFor(r.key),
        color: colorFor(r.key),
        currentUsd: current,
        priorUsd: prior30,
        changePct,
      });
      ecosystemTotal += current;
      anyTotal = true;
    }
    entries.sort((a, b) => b.currentUsd - a.currentUsd);

    const sidechainExclusions = Array.from(NON_L2_KEYS)
      .filter((k) => k !== 'ethereum' && k !== 'all_l2s' && k !== 'multiple')
      .map((k) => chains[k]?.name ?? k)
      .sort();

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      universeSize: universeKeys.length,
      universeKeys,
      excludedNonL2Keys: sidechainExclusions,
      ecosystemTotalUsd: anyTotal ? ecosystemTotal : null,
      topByTvs: entries.slice(0, 10),
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

const fmtPct = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return '—';
  const pct = n * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
};

const fmtShare = (entry: TvsEntry, total: number | null): string => {
  if (!total || total <= 0) return '—';
  const share = entry.currentUsd / total;
  if (share >= 0.1) return `${(share * 100).toFixed(0)}%`;
  return `${(share * 100).toFixed(1)}%`;
};

export const formatTvsEntry = (e: TvsEntry, total: number | null): string =>
  `${e.name} (${fmtUsd(e.currentUsd)}${
    total ? `, ${fmtShare(e, total)} of L2 TVS` : ''
  }${e.changePct != null ? `; ${fmtPct(e.changePct)} 30d` : ''})`;

export const formatTopList = (
  data: L2TvsRanking,
  count = 10,
): string => {
  if (!data.topByTvs || data.topByTvs.length === 0) return 'unavailable';
  return data.topByTvs
    .slice(0, count)
    .map((e, i) => `${i + 1}. ${formatTvsEntry(e, data.ecosystemTotalUsd)}`)
    .join('; ');
};

export const formatLeader = (data: L2TvsRanking): string =>
  data.topByTvs?.[0] ? formatTvsEntry(data.topByTvs[0], data.ecosystemTotalUsd) : 'unavailable';

export const buildTvsDenseSentence = (
  data: L2TvsRanking,
  dataDateUtc: string,
): string => {
  const top = data.topByTvs?.[0];
  if (!top) {
    return `**Top Ethereum L2s by total value secured (TVS)** (data ${dataDateUtc} UTC): unavailable.`;
  }
  return (
    `As of ${dataDateUtc} UTC, **${top.name}** leads Ethereum L2s by total value secured ` +
    `at ${fmtUsd(top.currentUsd)}` +
    (data.ecosystemTotalUsd
      ? ` (${fmtShare(top, data.ecosystemTotalUsd)} of the L2 ecosystem total ` +
        `${fmtUsd(data.ecosystemTotalUsd)})`
      : '') +
    `. Top 10: ${formatTopList(data, 10)}.`
  );
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildTvsAnswerTables = (data: L2TvsRanking): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const total = data.ecosystemTotalUsd;
  return [
    {
      title: 'Top 10 Ethereum L2s by total value secured (TVS)',
      caption: `Top 10 by current TVS as of ${dataDate} UTC. Share = chain TVS / total tracked L2 TVS. 30d change is point-in-time today vs 30 days ago.`,
      headers: ['Rank', 'Chain', 'TVS', 'Share of L2 total', '30d change'],
      rows: data.topByTvs.slice(0, 10).map((e, i) => [
        String(i + 1),
        e.name,
        fmtUsd(e.currentUsd),
        fmtShare(e, total),
        fmtPct(e.changePct),
      ]),
    },
  ];
};

export const buildTvsAcceptedAnswer = (data: L2TvsRanking): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const top = data.topByTvs?.[0];
  if (!top) {
    return 'Data currently unavailable. See growthepie.com/chains for the live Ethereum L2 leaderboards.';
  }
  return (
    `By total value secured (TVS), the largest Ethereum L2 is **${top.name}** ` +
    `at ${fmtUsd(top.currentUsd)}` +
    (data.ecosystemTotalUsd
      ? ` — ${fmtShare(top, data.ecosystemTotalUsd)} of the ` +
        `${fmtUsd(data.ecosystemTotalUsd)} L2 ecosystem total.`
      : '.') +
    ` Top 10: ${formatTopList(data, 10)}. ` +
    `Data: ${dataDate} UTC. Live leaderboards: growthepie.com/chains.`
  );
};
