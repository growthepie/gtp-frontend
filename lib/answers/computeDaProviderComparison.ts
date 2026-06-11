// Server-side helper that pulls live fees-per-megabyte per DA provider from
// growthepie's DA overview endpoint. Used by the "what is data availability"
// answer page to replace previously hand-written cost claims with actual
// data.
//
// Source: `/v1/da_overview.json` → `data.da_breakdown.{provider}.{window}
// .fees_per_mb` (`{ types: ["usd","eth"], total: [...] }`), pre-aggregated per
// window. We read `1d` as the latest value and `30d` as the smoothed average.
// (Previously this read `/v1/da_metrics/fees_per_mbyte.json`, which now 403s.)
//
// Coverage: da_breakdown exposes `da_celestia`, `da_eigenda` and
// `da_ethereum_blobs`. Avail is NOT in the payload, so the helper returns null
// for it and the answer-page prose handles the gap explicitly.

import { cache } from 'react';

const DA_OVERVIEW_URL = 'https://api.growthepie.com/v1/da_overview.json';

export type DaProviderKey =
  | 'da_celestia'
  | 'da_eigenda'
  | 'da_ethereum_blobs'
  | 'da_avail';

export type DaProviderEntry = {
  key: DaProviderKey;
  name: string;
  // Most recent daily USD per MB. null when this provider isn't covered by
  // the upstream endpoint.
  feePerMbUsdLatest: number | null;
  // 30-day average USD per MB — smoother than the latest day.
  feePerMbUsdAvg30d: number | null;
};

export type DaProviderComparison = {
  generatedAtIso: string;
  providers: DaProviderEntry[];
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-da-providers' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

const PROVIDER_DISPLAY: Record<DaProviderKey, string> = {
  da_celestia: 'Celestia',
  da_eigenda: 'EigenDA',
  da_ethereum_blobs: 'Ethereum DA (blobs)',
  da_avail: 'Avail',
};

const PROVIDER_ORDER: DaProviderKey[] = [
  'da_celestia',
  'da_eigenda',
  'da_ethereum_blobs',
  'da_avail',
];

// Read a USD scalar from a da_breakdown window block's `fees_per_mb` metric,
// shaped `{ types: ["usd","eth"], total: [usdValue, ethValue] }`. Resolves the
// USD column by name so an upstream column reorder can't silently misread.
const readFeesPerMbUsd = (windowBlock: any): number | null => {
  const m = windowBlock?.fees_per_mb;
  const types: any[] | undefined = m?.types;
  const total: any[] | undefined = m?.total;
  if (!Array.isArray(types) || !Array.isArray(total)) return null;
  const usdIdx = types.findIndex((t) => String(t).toLowerCase() === 'usd');
  if (usdIdx < 0) return null;
  const v = total[usdIdx];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
};

// Read one provider's per-MB cost from its da_breakdown entry: `1d` is the
// latest value, `30d` the smoothed 30-day average.
const parseProvider = (
  layerBreakdown: any,
): { latest: number | null; avg30d: number | null } => ({
  latest: readFeesPerMbUsd(layerBreakdown?.['1d']),
  avg30d: readFeesPerMbUsd(layerBreakdown?.['30d']),
});

export const getDaProviderComparison = cache(
  async (): Promise<DaProviderComparison | null> => {
    let json: any;
    try {
      json = await fetchJson(DA_OVERVIEW_URL);
    } catch (err) {
      console.error('getDaProviderComparison: fetch failed', err);
      return null;
    }
    // da_overview.json keys provider blocks under data.da_breakdown by the
    // same `da_*` keys this module already uses (da_celestia, da_eigenda,
    // da_ethereum_blobs); Avail is absent and resolves to null below.
    const breakdown = json?.data?.da_breakdown;
    if (!breakdown || typeof breakdown !== 'object') return null;

    const providers: DaProviderEntry[] = PROVIDER_ORDER.map((key) => {
      const block = breakdown[key];
      if (!block) {
        return {
          key,
          name: PROVIDER_DISPLAY[key],
          feePerMbUsdLatest: null,
          feePerMbUsdAvg30d: null,
        };
      }
      const { latest, avg30d } = parseProvider(block);
      return {
        key,
        name: PROVIDER_DISPLAY[key],
        feePerMbUsdLatest: latest,
        feePerMbUsdAvg30d: avg30d,
      };
    });

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      providers,
    };
  },
);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

// DA per-MB costs span many orders of magnitude — Celestia at fractions of a
// cent vs Ethereum blobs at potentially dollars during peak load. Keep ~3
// significant figures across the range.
const fmtUsdAdaptive = (n: number | null): string => {
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

const fmtMultiplier = (n: number | null): string => {
  if (n == null || !Number.isFinite(n) || n <= 0) return '—';
  if (n >= 100) return n.toFixed(0) + '×';
  if (n >= 10) return n.toFixed(1) + '×';
  return n.toFixed(2) + '×';
};

const getEntry = (
  data: DaProviderComparison,
  key: DaProviderKey,
): DaProviderEntry | undefined => data.providers.find((p) => p.key === key);

export const formatProviderFee = (
  data: DaProviderComparison,
  key: DaProviderKey,
  window: 'latest' | '30d' = '30d',
): string => {
  const e = getEntry(data, key);
  if (!e) return 'unavailable';
  const v = window === '30d' ? e.feePerMbUsdAvg30d : e.feePerMbUsdLatest;
  return fmtUsdAdaptive(v);
};

// Multiplier between two providers — useful for "X is N× cheaper than Y"
// prose. Returns the *cheaper / more-expensive* ratio for stable framing.
export const formatRatio = (
  data: DaProviderComparison,
  cheaperKey: DaProviderKey,
  moreExpensiveKey: DaProviderKey,
  window: 'latest' | '30d' = '30d',
): string => {
  const a = getEntry(data, cheaperKey);
  const b = getEntry(data, moreExpensiveKey);
  if (!a || !b) return '—';
  const va = window === '30d' ? a.feePerMbUsdAvg30d : a.feePerMbUsdLatest;
  const vb = window === '30d' ? b.feePerMbUsdAvg30d : b.feePerMbUsdLatest;
  if (va == null || vb == null || va <= 0) return '—';
  return fmtMultiplier(vb / va);
};

// Dense sentence summarising the comparison. Skips providers with no data.
export const buildDaDenseSentence = (
  data: DaProviderComparison,
  dataDateUtc: string,
): string => {
  const cel = getEntry(data, 'da_celestia');
  const eig = getEntry(data, 'da_eigenda');
  const eth = getEntry(data, 'da_ethereum_blobs');
  const avail = getEntry(data, 'da_avail');

  const lines: string[] = [];
  const fmt = (e: DaProviderEntry | undefined) =>
    e ? `${e.name}: ${fmtUsdAdaptive(e.feePerMbUsdAvg30d)} per MB (30d avg)` : null;
  for (const e of [cel, eig, eth, avail]) {
    const v = fmt(e);
    if (v != null && e && e.feePerMbUsdAvg30d != null) lines.push(v);
  }
  if (lines.length === 0) {
    return `**DA provider cost comparison** (data ${dataDateUtc} UTC): unavailable.`;
  }
  return (
    `As of ${dataDateUtc} UTC (30-day average), per-megabyte data-availability costs ` +
    `are: ${lines.join('; ')}.`
  );
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildDaProviderAnswerTables = (
  data: DaProviderComparison,
): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return [
    {
      title: 'DA provider cost comparison ($ per MB posted)',
      caption: `Live per-megabyte fees from growthepie's da_overview endpoint (data.da_breakdown.fees_per_mb). "unavailable" means growthepie doesn't currently track per-MB cost for that provider. Data: ${dataDate} UTC.`,
      headers: ['Provider', 'Latest day ($/MB)', '30-day average ($/MB)'],
      rows: data.providers.map((p) => [
        p.name,
        fmtUsdAdaptive(p.feePerMbUsdLatest),
        fmtUsdAdaptive(p.feePerMbUsdAvg30d),
      ]),
    },
  ];
};

export const buildDaAcceptedAnswer = (data: DaProviderComparison): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const dense = buildDaDenseSentence(data, dataDate);
  return (
    `Data Availability (DA) is the guarantee that a chain's transaction data is publicly accessible so anyone can reconstruct the chain's state — foundational to how Ethereum L2s work. The main DA providers for Ethereum L2s are Ethereum mainnet (via blobs since the Dencun upgrade in March 2024), Celestia, EigenDA, and Avail. They differ on cost, throughput, and security model. ` +
    `Live per-MB costs from growthepie: ${dense} Note: growthepie's per-MB cost data currently covers Ethereum blobs, Celestia and EigenDA; Avail is not yet tracked. ` +
    `Live tracker: growthepie.com/data-availability. Data: ${dataDate} UTC.`
  );
};
