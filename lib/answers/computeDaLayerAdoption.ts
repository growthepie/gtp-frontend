// Server-side helper that ranks Data Availability (DA) layers by how many
// Ethereum L2s actually use each one (primary popularity signal), with
// secondary rankings by USD fees paid to each DA over recent windows and
// the per-megabyte cost (reused from the fees_per_mbyte endpoint).
//
// Data sources:
//   - master.json: `da_layer` string per chain (e.g. "Ethereum (blobs)",
//     "Celestia", "EigenDA"). Grouped under the L2 universe filter.
//   - da_overview.json `data.da_breakdown.{provider}.{window}`: both the USD
//     fees paid per DA (`fees`) and the per-MB cost (`fees_per_mb`) for
//     `da_ethereum_blobs`, `da_celestia`, `da_eigenda`, pre-aggregated per
//     window. This single endpoint replaced the dead da_metrics/fees_per_mbyte
//     endpoint (now 403) and the stale daily-series fee shape. Avail isn't in
//     the payload, so it reads 'unavailable' rather than fabricating a value.

import { cache } from 'react';
import { MasterURL } from '@/lib/urls';

const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

const DA_OVERVIEW_URL = 'https://api.growthepie.com/v1/da_overview.json';

// Canonical DA buckets the page ranks by. Raw `da_layer` strings from
// master.json get normalised into these via `normaliseDaLayer` below so
// minor upstream string variation ("Ethereum (blobs)" vs "Ethereum DA
// (blobs)" vs "ethereum_blobs") all funnel to the same bucket.
export type DaBucketKey =
  | 'ethereum_blobs'
  | 'ethereum_calldata'
  | 'celestia'
  | 'eigenda'
  | 'avail'
  | 'other';

const DA_BUCKET_DISPLAY: Record<DaBucketKey, string> = {
  ethereum_blobs: 'Ethereum DA (blobs)',
  ethereum_calldata: 'Ethereum DA (calldata)',
  celestia: 'Celestia',
  eigenda: 'EigenDA',
  avail: 'Avail',
  other: 'Other / Custom DA',
};

// Map a raw `da_layer` string from master.json to one of our canonical
// buckets. Defensive against case and whitespace variation upstream.
const normaliseDaLayer = (raw: unknown): DaBucketKey | null => {
  if (typeof raw !== 'string') return null;
  const s = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  if (s === '' || s === 'null' || s === 'none' || s === '-') return null;
  if (s.includes('ethereum') && s.includes('blob')) return 'ethereum_blobs';
  if (s.includes('ethereum') && s.includes('calldata')) return 'ethereum_calldata';
  if (s.includes('celestia')) return 'celestia';
  if (s.includes('eigen')) return 'eigenda';
  if (s.includes('avail')) return 'avail';
  return 'other';
};

export type DaBucketEntry = {
  key: DaBucketKey;
  name: string;
  // L2 chain keys (master.json keys) that use this DA, sorted.
  l2Keys: string[];
  // Display names for the same L2s in the same order.
  l2Names: string[];
  l2Count: number;
  // USD fees paid TO this DA layer, summed over the window. Only Ethereum
  // blobs / Celestia / EigenDA are exposed by da_overview.json — others read
  // null and the page surfaces 'unavailable'.
  feesUsdDaily: number | null;
  feesUsdLast30d: number | null;
  feesUsdLast90d: number | null;
  feesUsdAllTime: number | null;
  // 30d-average $/MB from da_overview's da_breakdown.fees_per_mb. Ethereum
  // blobs / Celestia / EigenDA are exposed; Avail reads null.
  costPerMbUsd30dAvg: number | null;
};

export type DaLayerAdoption = {
  generatedAtIso: string;
  universeSize: number;
  universeKeys: string[];
  excludedNonL2Keys: string[];
  // L2 chain keys whose master.json `da_layer` was missing/unknown.
  unknownDaL2Keys: string[];
  // Buckets sorted descending by L2 count (the headline ranking).
  buckets: DaBucketEntry[];
  // Convenience: which bucket leads each ranking dimension.
  leaderByL2Count: DaBucketKey | null;
  leaderByFees30d: DaBucketKey | null;
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-da-adoption' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// Read a USD scalar from a da_breakdown window block's metric — `fees`
// (window total USD) or `fees_per_mb` (window-average $/MB) — both shaped
// `{ types: ["usd","eth"], total: [usdValue, ethValue] }`. Resolves the USD
// column by name so an upstream column reorder can't silently misread.
const readBreakdownUsd = (
  windowBlock: any,
  metric: 'fees' | 'fees_per_mb',
): number | null => {
  const m = windowBlock?.[metric];
  const types: any[] | undefined = m?.types;
  const total: any[] | undefined = m?.total;
  if (!Array.isArray(types) || !Array.isArray(total)) return null;
  const usdIdx = types.findIndex((t) => String(t).toLowerCase() === 'usd');
  if (usdIdx < 0) return null;
  const v = total[usdIdx];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
};

// Read DA-overview fees for one provider's da_breakdown entry. The windows are
// pre-aggregated upstream, so we map them directly (max == all-time).
const readOverviewFees = (
  layerBreakdown: any,
): {
  daily: number | null;
  last30d: number | null;
  last90d: number | null;
  allTime: number | null;
} => ({
  daily: readBreakdownUsd(layerBreakdown?.['1d'], 'fees'),
  last30d: readBreakdownUsd(layerBreakdown?.['30d'], 'fees'),
  last90d: readBreakdownUsd(layerBreakdown?.['90d'], 'fees'),
  allTime: readBreakdownUsd(layerBreakdown?.['max'], 'fees'),
});

// Read the 30-day-average $/MB for a provider from its da_breakdown entry.
// Returns null for providers the payload doesn't cover (e.g. Avail).
const readCostPerMb30dAvg = (layerBreakdown: any): number | null =>
  readBreakdownUsd(layerBreakdown?.['30d'], 'fees_per_mb');

export const getDaLayerAdoption = cache(
  async (): Promise<DaLayerAdoption | null> => {
    let master: any;
    try {
      master = await fetchJson(MasterURL);
    } catch (err) {
      console.error('getDaLayerAdoption: master fetch failed', err);
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

    const nameFor = (key: string): string => chains[key]?.name ?? key;

    const buckets: Record<DaBucketKey, DaBucketEntry> = {
      ethereum_blobs: emptyBucket('ethereum_blobs'),
      ethereum_calldata: emptyBucket('ethereum_calldata'),
      celestia: emptyBucket('celestia'),
      eigenda: emptyBucket('eigenda'),
      avail: emptyBucket('avail'),
      other: emptyBucket('other'),
    };

    const unknownDaL2Keys: string[] = [];
    for (const key of universeKeys) {
      const raw = chains[key]?.da_layer;
      const bucket = normaliseDaLayer(raw);
      if (!bucket) {
        unknownDaL2Keys.push(key);
        continue;
      }
      buckets[bucket].l2Keys.push(key);
      buckets[bucket].l2Names.push(nameFor(key));
    }

    // Pull the DA overview (fees + per-MB cost both live in da_breakdown).
    // Failure falls through to nulls so the page can still render the
    // L2-count ranking.
    const overview = await fetchJson(DA_OVERVIEW_URL).catch((err) => {
      console.error('getDaLayerAdoption: da_overview fetch failed', err);
      return null;
    });

    // da_overview.json keys provider blocks under data.da_breakdown by `da_*`
    // keys (da_celestia, da_eigenda, da_ethereum_blobs); Avail is absent and
    // resolves to null below.
    const breakdown: Record<string, any> = overview?.data?.da_breakdown ?? {};

    const applyFees = (
      bucketKey: DaBucketKey,
      daKey: string,
    ): void => {
      const f = readOverviewFees(breakdown?.[daKey]);
      buckets[bucketKey].feesUsdDaily = f.daily;
      buckets[bucketKey].feesUsdLast30d = f.last30d;
      buckets[bucketKey].feesUsdLast90d = f.last90d;
      buckets[bucketKey].feesUsdAllTime = f.allTime;
    };
    applyFees('ethereum_blobs', 'da_ethereum_blobs');
    applyFees('celestia', 'da_celestia');
    applyFees('eigenda', 'da_eigenda');

    const applyCost = (bucketKey: DaBucketKey, daKey: string): void => {
      buckets[bucketKey].costPerMbUsd30dAvg = readCostPerMb30dAvg(
        breakdown?.[daKey],
      );
    };
    applyCost('ethereum_blobs', 'da_ethereum_blobs');
    applyCost('celestia', 'da_celestia');
    applyCost('eigenda', 'da_eigenda');
    applyCost('avail', 'da_avail');

    // Finalise counts and stable-sort keys/names within each bucket.
    for (const b of Object.values(buckets)) {
      b.l2Keys.sort();
      // Sort names by matching key order so the two arrays remain aligned.
      const idx = new Map(b.l2Keys.map((k, i) => [k, i]));
      const paired = b.l2Names
        .map((_, i) => ({ k: b.l2Keys[i], n: b.l2Names[i] }))
        .sort((a, z) => (idx.get(a.k) ?? 0) - (idx.get(z.k) ?? 0));
      b.l2Names = paired.map((p) => p.n);
      b.l2Count = b.l2Keys.length;
    }

    const sorted = Object.values(buckets).sort((a, z) => {
      if (z.l2Count !== a.l2Count) return z.l2Count - a.l2Count;
      // Tie-break on 30d fees so a bucket with zero L2s but tracked fees
      // doesn't outrank one with the same count.
      const af = a.feesUsdLast30d ?? -Infinity;
      const zf = z.feesUsdLast30d ?? -Infinity;
      return zf - af;
    });

    const leaderByL2Count = sorted[0] && sorted[0].l2Count > 0 ? sorted[0].key : null;
    const leaderByFees30d =
      [...sorted]
        .filter((b) => b.feesUsdLast30d != null)
        .sort(
          (a, z) => (z.feesUsdLast30d ?? -Infinity) - (a.feesUsdLast30d ?? -Infinity),
        )[0]?.key ?? null;

    const sidechainExclusions = Array.from(NON_L2_KEYS)
      .filter((k) => k !== 'ethereum' && k !== 'all_l2s' && k !== 'multiple')
      .map((k) => chains[k]?.name ?? k)
      .sort();

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      universeSize: universeKeys.length,
      universeKeys,
      excludedNonL2Keys: sidechainExclusions,
      unknownDaL2Keys: unknownDaL2Keys.sort(),
      buckets: sorted,
      leaderByL2Count,
      leaderByFees30d,
    };
  },
);

const emptyBucket = (key: DaBucketKey): DaBucketEntry => ({
  key,
  name: DA_BUCKET_DISPLAY[key],
  l2Keys: [],
  l2Names: [],
  l2Count: 0,
  feesUsdDaily: null,
  feesUsdLast30d: null,
  feesUsdLast90d: null,
  feesUsdAllTime: null,
  costPerMbUsd30dAvg: null,
});

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmtUsd = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return 'unavailable';
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'k';
  return '$' + n.toFixed(2);
};

// DA per-MB costs span many orders of magnitude — keep ~3 significant figs.
const fmtCostPerMb = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return 'unavailable';
  if (n === 0) return '$0';
  const abs = Math.abs(n);
  if (abs >= 100) return '$' + n.toFixed(0);
  if (abs >= 10) return '$' + n.toFixed(1);
  if (abs >= 1) return '$' + n.toFixed(2);
  if (abs >= 0.1) return '$' + n.toFixed(3);
  if (abs >= 0.01) return '$' + n.toFixed(4);
  if (abs >= 0.001) return '$' + n.toFixed(5);
  return '$' + n.toFixed(6);
};

const getBucket = (
  data: DaLayerAdoption,
  key: DaBucketKey,
): DaBucketEntry | undefined => data.buckets.find((b) => b.key === key);

export const formatAdoptionLeader = (data: DaLayerAdoption): string => {
  const top = data.buckets[0];
  if (!top || top.l2Count === 0) return 'unavailable';
  const sample = top.l2Names.slice(0, 3).join(', ');
  return `${top.name} (${top.l2Count} L2s — e.g. ${sample})`;
};

export const formatAdoptionTopList = (
  data: DaLayerAdoption,
  count = 5,
): string => {
  const ranked = data.buckets
    .filter((b) => b.l2Count > 0)
    .slice(0, count);
  if (ranked.length === 0) return 'unavailable';
  return ranked
    .map((b, i) => {
      const sample = b.l2Names.slice(0, 3).join(', ');
      const tail = b.l2Names.length > 3 ? ` and ${b.l2Names.length - 3} more` : '';
      return `${i + 1}. ${b.name}: ${b.l2Count} L2s (${sample}${tail})`;
    })
    .join('; ');
};

export const formatFees30dLeader = (data: DaLayerAdoption): string => {
  if (!data.leaderByFees30d) return 'unavailable';
  const b = getBucket(data, data.leaderByFees30d);
  if (!b) return 'unavailable';
  return `${b.name} (${fmtUsd(b.feesUsdLast30d)} over 30 days)`;
};

export const formatBucketL2List = (
  data: DaLayerAdoption,
  key: DaBucketKey,
): string => {
  const b = getBucket(data, key);
  if (!b || b.l2Count === 0) return 'none';
  return b.l2Names.join(', ');
};

export const formatBucketCount = (
  data: DaLayerAdoption,
  key: DaBucketKey,
): string => {
  const b = getBucket(data, key);
  return b ? String(b.l2Count) : '0';
};

export const formatBucketFees = (
  data: DaLayerAdoption,
  key: DaBucketKey,
  window: 'daily' | '30d' | '90d' | 'allTime',
): string => {
  const b = getBucket(data, key);
  if (!b) return 'unavailable';
  const v =
    window === 'daily'
      ? b.feesUsdDaily
      : window === '30d'
        ? b.feesUsdLast30d
        : window === '90d'
          ? b.feesUsdLast90d
          : b.feesUsdAllTime;
  return fmtUsd(v);
};

export const formatBucketCostPerMb = (
  data: DaLayerAdoption,
  key: DaBucketKey,
): string => {
  const b = getBucket(data, key);
  return fmtCostPerMb(b?.costPerMbUsd30dAvg ?? null);
};

export const buildAdoptionDenseSentence = (
  data: DaLayerAdoption,
  dataDateUtc: string,
): string => {
  const ranked = data.buckets.filter((b) => b.l2Count > 0);
  if (ranked.length === 0) {
    return `**DA-layer adoption** (data ${dataDateUtc} UTC): unavailable.`;
  }
  const parts = ranked
    .slice(0, 5)
    .map((b) => `${b.name}: ${b.l2Count} L2s`);
  const leader30d = data.leaderByFees30d
    ? getBucket(data, data.leaderByFees30d)
    : null;
  const feesTail = leader30d
    ? ` By USD fees paid over 30 days the leader is ${leader30d.name} (${fmtUsd(leader30d.feesUsdLast30d)}).`
    : '';
  return (
    `As of ${dataDateUtc} UTC, ${data.universeSize} tracked Ethereum L2s split across DA layers as follows: ${parts.join('; ')}.${feesTail}`
  );
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildAdoptionAnswerTables = (
  data: DaLayerAdoption,
): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const adoption: AnswerTable = {
    title: 'DA-layer adoption among Ethereum L2s',
    caption: `Number of growthepie-tracked Ethereum L2s using each Data Availability layer, plus a sample of the chains. Data: ${dataDate} UTC.`,
    headers: ['Rank', 'DA layer', '# L2s', 'Example chains'],
    rows: data.buckets
      .filter((b) => b.l2Count > 0)
      .map((b, i) => [
        String(i + 1),
        b.name,
        String(b.l2Count),
        b.l2Names.slice(0, 5).join(', ') +
          (b.l2Names.length > 5 ? `, +${b.l2Names.length - 5} more` : ''),
      ]),
  };
  const fees: AnswerTable = {
    title: 'USD fees paid to each DA layer',
    caption: `Total USD fees paid by L2s to each DA layer over recent windows. growthepie's da_overview endpoint covers Ethereum blobs, Celestia, and EigenDA. Data: ${dataDate} UTC.`,
    headers: ['DA layer', 'Last 24h', 'Last 30 days', 'Last 90 days', 'All-time'],
    rows: (['ethereum_blobs', 'celestia', 'eigenda', 'avail'] as DaBucketKey[]).map(
      (k) => {
        const b = getBucket(data, k);
        return [
          b?.name ?? DA_BUCKET_DISPLAY[k],
          fmtUsd(b?.feesUsdDaily ?? null),
          fmtUsd(b?.feesUsdLast30d ?? null),
          fmtUsd(b?.feesUsdLast90d ?? null),
          fmtUsd(b?.feesUsdAllTime ?? null),
        ];
      },
    ),
  };
  const cost: AnswerTable = {
    title: 'Cost per MB posted ($/MB, 30-day average)',
    caption: `Live per-megabyte fees from growthepie's da_overview endpoint (data.da_breakdown.fees_per_mb). "unavailable" means growthepie doesn't currently track per-MB cost for that DA layer. Data: ${dataDate} UTC.`,
    headers: ['DA layer', '$/MB (30d avg)'],
    rows: (['ethereum_blobs', 'celestia', 'eigenda', 'avail'] as DaBucketKey[]).map(
      (k) => {
        const b = getBucket(data, k);
        return [
          b?.name ?? DA_BUCKET_DISPLAY[k],
          fmtCostPerMb(b?.costPerMbUsd30dAvg ?? null),
        ];
      },
    ),
  };
  return [adoption, fees, cost];
};

export const buildAdoptionAcceptedAnswer = (data: DaLayerAdoption): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const ranked = data.buckets.filter((b) => b.l2Count > 0);
  if (ranked.length === 0) {
    return `DA-layer adoption data currently unavailable. See growthepie.com/data-availability for the live tracker.`;
  }
  const top = ranked[0];
  const restPhrase = ranked
    .slice(1, 4)
    .map((b) => `${b.name} (${b.l2Count})`)
    .join(', ');
  const feesLine = data.leaderByFees30d
    ? (() => {
        const b = getBucket(data, data.leaderByFees30d!);
        return b
          ? ` By USD fees paid over 30 days the leader is ${b.name} at ${fmtUsd(b.feesUsdLast30d)}.`
          : '';
      })()
    : '';
  return (
    `The most popular Data Availability (DA) layer for Ethereum L2s is **${top.name}**, used by ${top.l2Count} of ${data.universeSize} growthepie-tracked L2s including ${top.l2Names.slice(0, 3).join(', ')}. ` +
    `Other DA layers in use: ${restPhrase || 'none'}.${feesLine} ` +
    `Data: ${dataDate} UTC. Live tracker: growthepie.com/data-availability.`
  );
};
