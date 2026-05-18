// Server-side helper that pulls live fees-per-megabyte per DA provider from
// growthepie's DA metrics endpoint. Used by the "what is data availability"
// answer page to replace previously hand-written cost claims with actual
// data.
//
// Coverage caveat: as of 2026 `/v1/da_metrics/fees_per_mbyte.json` exposes
// only `da_celestia` and `da_eigenda`. Ethereum blobs and Avail are NOT in
// this endpoint, so the helper returns null for them. The answer-page prose
// handles the missing values explicitly rather than fabricating a number.

import { cache } from 'react';

const FEES_PER_MB_URL =
  'https://api.growthepie.com/v1/da_metrics/fees_per_mbyte.json';

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

// Read one provider's daily series from the fees_per_mbyte payload. The
// series is `[unix, usd, eth]`; we resolve USD by name and take both the
// latest and 30-day-average values.
const parseProvider = (
  layerBlock: any,
): { latest: number | null; avg30d: number | null } => {
  const types: any[] | undefined = layerBlock?.daily?.types;
  const data: any[] | undefined = layerBlock?.daily?.data;
  if (!Array.isArray(types) || !Array.isArray(data) || data.length === 0)
    return { latest: null, avg30d: null };
  const usdIdx = types.findIndex((t) => String(t).toLowerCase() === 'usd');
  if (usdIdx < 0) return { latest: null, avg30d: null };
  const lastRow = data[data.length - 1];
  const latest =
    Array.isArray(lastRow) && lastRow.length > usdIdx && typeof lastRow[usdIdx] === 'number' && Number.isFinite(lastRow[usdIdx])
      ? lastRow[usdIdx]
      : null;
  const slice = data.slice(Math.max(0, data.length - 30));
  let s = 0;
  let n = 0;
  for (const row of slice) {
    if (!Array.isArray(row) || row.length <= usdIdx) continue;
    const v = row[usdIdx];
    if (typeof v === 'number' && Number.isFinite(v)) {
      s += v;
      n += 1;
    }
  }
  const avg30d = n > 0 ? s / n : null;
  return { latest, avg30d };
};

export const getDaProviderComparison = cache(
  async (): Promise<DaProviderComparison | null> => {
    let json: any;
    try {
      json = await fetchJson(FEES_PER_MB_URL);
    } catch (err) {
      console.error('getDaProviderComparison: fetch failed', err);
      return null;
    }
    const chains = json?.data?.chains;
    if (!chains || typeof chains !== 'object') return null;

    const providers: DaProviderEntry[] = PROVIDER_ORDER.map((key) => {
      const block = chains[key];
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
      caption: `Live per-megabyte fees from growthepie's DA metrics endpoint. "unavailable" means growthepie doesn't currently track per-MB cost for that provider in this endpoint. Data: ${dataDate} UTC.`,
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
    `Live per-MB costs from growthepie: ${dense} Note: growthepie's per-MB cost endpoint currently covers Celestia and EigenDA only; Ethereum blobs and Avail are tracked elsewhere (or not yet tracked). ` +
    `Live tracker: growthepie.com/data-availability. Data: ${dataDate} UTC.`
  );
};
