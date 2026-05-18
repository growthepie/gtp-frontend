// Server-side helper that ranks chains by EIP-7702 (Set Code / Type 4
// transaction) activity. Pulls from growthepie's Pectra tracker data
// (`/v1/quick-bites/pectra-fork.json`), which exposes per-chain daily Type 4
// transaction counts under `data.type4_tx_count.{chain}.daily`.
//
// As of 2026 only ~5 chains have Type 4 tx counts published (Ethereum L1
// plus a handful of OP-Stack chains + Arbitrum). We separate Ethereum L1
// from the L2 ranking so the L2 leaderboard isn't dominated by the L1
// numbers — but quote L1 alongside for context.

import { cache } from 'react';

const PECTRA_URL =
  'https://api.growthepie.com/v1/quick-bites/pectra-fork.json';

export type Eip7702Entry = {
  key: string;
  // Display name for prose. Hand-mapped because the Pectra tracker uses
  // short keys without a separate names table.
  name: string;
  // Latest day's Type 4 transaction count.
  daily: number | null;
  // Sum of the last 30 days.
  last30dCount: number | null;
  // Sum of the entire series since EIP-7702 activated (Pectra, May 7 2025).
  allTimeCount: number | null;
};

// Hand-mapped display names. If the upstream Pectra tracker adds a chain
// not in this map, the chain key is used verbatim as a fallback.
const CHAIN_DISPLAY: Record<string, string> = {
  ethereum: 'Ethereum L1',
  base: 'Base',
  optimism: 'OP Mainnet',
  unichain: 'Unichain',
  arbitrum: 'Arbitrum One',
};

// Chain keys treated as L2s in the ranking. Everything else is shown
// separately as L1 context.
const L2_KEYS = new Set(['base', 'optimism', 'unichain', 'arbitrum']);

export type L2Eip7702Activity = {
  generatedAtIso: string;
  // Sorted by last30dCount descending.
  l2Ranking: Eip7702Entry[];
  // Ethereum L1, exposed separately for "context vs L2" prose.
  ethereumMainnet: Eip7702Entry | null;
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-eip7702-activity' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// Pectra-fork.json columns are [value, unix] — opposite order from the
// standard per-chain endpoint. We resolve "value" by name to defend against
// future column reorders.
const parseChainBlock = (block: any): Eip7702Entry => {
  const types: any[] | undefined = block?.daily?.types;
  const values: any[] | undefined = block?.daily?.values;
  let daily: number | null = null;
  let last30: number | null = null;
  let all: number | null = null;
  if (Array.isArray(types) && Array.isArray(values) && values.length > 0) {
    const valIdx = types.findIndex((t) => String(t).toLowerCase() === 'value');
    if (valIdx >= 0) {
      const last = values[values.length - 1];
      if (Array.isArray(last) && last.length > valIdx) {
        const v = last[valIdx];
        if (typeof v === 'number' && Number.isFinite(v)) daily = v;
      }
      const sumOver = (slice: any[]): number | null => {
        let s = 0;
        let any = false;
        for (const row of slice) {
          if (!Array.isArray(row) || row.length <= valIdx) continue;
          const v = row[valIdx];
          if (typeof v === 'number' && Number.isFinite(v)) {
            s += v;
            any = true;
          }
        }
        return any ? s : null;
      };
      last30 = sumOver(values.slice(Math.max(0, values.length - 30)));
      all = sumOver(values);
    }
  }
  return { key: '', name: '', daily, last30dCount: last30, allTimeCount: all };
};

export const getL2Eip7702Activity = cache(
  async (): Promise<L2Eip7702Activity | null> => {
    let json: any;
    try {
      json = await fetchJson(PECTRA_URL);
    } catch (err) {
      console.error('getL2Eip7702Activity: fetch failed', err);
      return null;
    }

    const block = json?.data?.type4_tx_count;
    if (!block || typeof block !== 'object') return null;

    const entries: Eip7702Entry[] = [];
    let ethereumMainnet: Eip7702Entry | null = null;

    for (const [key, raw] of Object.entries(block)) {
      const parsed = parseChainBlock(raw);
      parsed.key = key;
      parsed.name = CHAIN_DISPLAY[key] ?? key;
      if (key === 'ethereum') {
        ethereumMainnet = parsed;
      } else if (L2_KEYS.has(key)) {
        entries.push(parsed);
      }
      // Skip any other unrecognised keys.
    }
    entries.sort((a, b) => (b.last30dCount ?? -Infinity) - (a.last30dCount ?? -Infinity));

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      l2Ranking: entries,
      ethereumMainnet,
    };
  },
);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmtCount = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return Math.round(n).toString();
};

export const formatEntry = (e: Eip7702Entry): string =>
  `${e.name} (${fmtCount(e.last30dCount)} over 30d; ${fmtCount(e.allTimeCount)} all-time)`;

export const formatTopList = (data: L2Eip7702Activity, count = 10): string => {
  if (!data.l2Ranking || data.l2Ranking.length === 0) return 'unavailable';
  return data.l2Ranking
    .slice(0, count)
    .map((e, i) => `${i + 1}. ${formatEntry(e)}`)
    .join('; ');
};

export const formatLeader = (data: L2Eip7702Activity): string => {
  const e = data.l2Ranking?.[0];
  return e ? formatEntry(e) : 'unavailable';
};

export const formatEthereumMainnet = (data: L2Eip7702Activity): string => {
  return data.ethereumMainnet ? formatEntry(data.ethereumMainnet) : 'unavailable';
};

export const buildEip7702DenseSentence = (
  data: L2Eip7702Activity,
  dataDateUtc: string,
): string => {
  const top = data.l2Ranking?.[0];
  if (!top) {
    return `**EIP-7702 (smart account) activity on Ethereum L2s** (data ${dataDateUtc} UTC): unavailable.`;
  }
  const ethPart = data.ethereumMainnet
    ? ` For comparison, Ethereum L1 sees ${fmtCount(data.ethereumMainnet.last30dCount)} Type 4 transactions over 30 days.`
    : '';
  return (
    `As of ${dataDateUtc} UTC, **${top.name}** leads Ethereum L2s in EIP-7702 (smart-account / Type 4) ` +
    `transactions with ${fmtCount(top.last30dCount)} over the last 30 days ` +
    `(${fmtCount(top.allTimeCount)} all-time since Pectra activated in May 2025).${ethPart}`
  );
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildEip7702AnswerTables = (data: L2Eip7702Activity): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const rows = data.l2Ranking.map((e, i) => [
    String(i + 1),
    e.name,
    fmtCount(e.daily),
    fmtCount(e.last30dCount),
    fmtCount(e.allTimeCount),
  ]);
  if (data.ethereumMainnet) {
    rows.push([
      '—',
      `${data.ethereumMainnet.name} (L1, for reference)`,
      fmtCount(data.ethereumMainnet.daily),
      fmtCount(data.ethereumMainnet.last30dCount),
      fmtCount(data.ethereumMainnet.allTimeCount),
    ]);
  }
  return [
    {
      title: 'EIP-7702 (smart account) Type 4 transactions per chain',
      caption: `Daily / last-30-days / all-time Type 4 transaction counts since Pectra activated EIP-7702 on May 7, 2025. L2s ranked by 30-day count; Ethereum L1 shown for reference. Data: ${dataDate} UTC.`,
      headers: ['Rank', 'Chain', 'Latest day', 'Last 30 days', 'All-time'],
      rows,
    },
  ];
};

export const buildEip7702AcceptedAnswer = (data: L2Eip7702Activity): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const top = data.l2Ranking?.[0];
  if (!top) {
    return 'Data currently unavailable. See growthepie.com/quick-bites/pectra-upgrade for the live EIP-7702 adoption tracker.';
  }
  const ethPart = data.ethereumMainnet
    ? ` For reference, Ethereum L1 sees ${fmtCount(data.ethereumMainnet.last30dCount)} Type 4 transactions over the last 30 days (${fmtCount(data.ethereumMainnet.allTimeCount)} all-time).`
    : '';
  return (
    `Among Ethereum L2s, **${top.name}** leads EIP-7702 (smart account / Type 4) transaction activity with ` +
    `${fmtCount(top.last30dCount)} over the last 30 days, ${fmtCount(top.allTimeCount)} all-time since Pectra. ` +
    `Full L2 ranking: ${formatTopList(data, 10)}.${ethPart} ` +
    `Data: ${dataDate} UTC. Live tracker: growthepie.com/quick-bites/pectra-upgrade.`
  );
};
