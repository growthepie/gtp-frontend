// Server-side helper that compares DeFi between Ethereum L1 and the L2
// ecosystem. Uses small, cacheable endpoints so SSR stays fast.
//
// Data sources:
//   1. **L1 vs L2 DeFi activity per window + per-L2 contributors** — from the
//      precomputed answer endpoint (`/v1/answers/defi-l1-vs-l2.json`). The
//      backend runs the same finance-category L1-vs-L2 calculation daily
//      (previously read here from `overview.json`'s per-chain
//      `overview[window].finance` rows) and publishes the small result, so we
//      no longer download a blockspace file from SSR.
//   2. **L1 vs L2 stablecoin supply** — per-chain `stables_mcap.json`
//      endpoints (`ethereum` and `all_l2s`, with a per-chain sum fallback).
//      Stablecoins are the single biggest pool of DeFi capital, so this is
//      a clean "where does DeFi money sit" proxy alongside the activity
//      side.
//   3. **Live swap-fee comparison** — `/v1/fees/table.json` per-chain
//      hourly `txcosts_swap` (USD column), same source as
//      /answers/lowest-fee-ethereum-l2.
//
// The per-window split and per-L2 contributor breakdown are now precomputed
// on the backend, so this helper only does the small per-chain stables_mcap
// and hourly-fees fetches itself.

import { cache } from 'react';
import { AnswersURLs, MasterURL, FeesURLs } from '@/lib/urls';

// L2 universe membership check — matches every other answer-page helper so
// "cheapest L2 swap fee" is computed over the same chain set.
const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

// Windows exposed by the precomputed answer file's `byWindow` map.
export const DEFI_WINDOWS = ['7d', '30d', '90d', '180d', '365d', 'max'] as const;
export type DefiWindow = (typeof DEFI_WINDOWS)[number];

export type DefiSplit = {
  l1Txcount: number | null;
  l1GasFeesUsd: number | null;
  l2Txcount: number | null;
  l2GasFeesUsd: number | null;
  // l2Txcount / (l1Txcount + l2Txcount). null when both sides are missing.
  l2ShareTxcount: number | null;
  // l2GasFeesUsd / (l1GasFeesUsd + l2GasFeesUsd).
  l2ShareGasFeesUsd: number | null;
};

export type DefiL1VsL2 = {
  generatedAtIso: string;
  // Per-window L1 vs L2 finance-category activity (transactions + gas).
  // Sourced from blockspace overview's per-chain `overview[window].finance`
  // rows for `ethereum` and `all_l2s`.
  byWindow: Record<DefiWindow, DefiSplit>;
  // Per-L2 contributor breakdown for the headline 30d window.
  topL2Contributors30d: {
    chainKey: string;
    chainName: string;
    txcount: number;
    gasFeesUsd: number;
    shareOfL2Txs: number;
  }[];
  // L1 vs L2 capital via stablecoin supply (the dominant pool of DeFi
  // capital).
  stables: {
    l1Usd: number | null;
    l2EcosystemUsd: number | null;
    l2VsL1Ratio: number | null;
    l2ShareOfTotal: number | null;
  };
  // Live swap-fee comparison (USD per representative swap, latest hour).
  swapFee: {
    ethereumUsd: number | null;
    cheapestL2Usd: number | null;
    cheapestL2ChainName: string | null;
    multiplier: number | null;
  };
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-defi-l1-vs-l2' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// Shape of the precomputed `/v1/answers/defi-l1-vs-l2.json` payload. Only the
// blockspace-derived parts are published here — `byWindow` (L1 vs L2 finance
// activity per window) and `topL2Contributors30d` map 1:1 onto our public
// types. The stablecoin-supply and swap-fee comparisons are still computed
// below from their own lighter endpoints.
type DefiAnswerFile = {
  byWindow?: Partial<Record<DefiWindow, Partial<DefiSplit>>>;
  topL2Contributors30d?: {
    chainKey: string;
    chainName: string;
    txcount: number;
    gasFeesUsd: number;
    shareOfL2Txs: number;
  }[];
};

// Fetch the precomputed defi byWindow + contributor breakdown. Returns null on
// any failure so the stablecoin-supply and swap-fee sections can still render.
const fetchDefiAnswer = async (): Promise<DefiAnswerFile | null> => {
  try {
    const res = await fetch(AnswersURLs['defi-l1-vs-l2'], {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'growthepie/answers-defi-l1-vs-l2' },
    });
    if (!res.ok) {
      throw new Error(
        `Fetch defi-l1-vs-l2 failed: ${res.status} ${res.statusText}`,
      );
    }
    return (await res.json()) as DefiAnswerFile;
  } catch (err) {
    console.error('getDefiL1VsL2: answer fetch failed', err);
    return null;
  }
};

const EMPTY_SPLIT: DefiSplit = {
  l1Txcount: null,
  l1GasFeesUsd: null,
  l2Txcount: null,
  l2GasFeesUsd: null,
  l2ShareTxcount: null,
  l2ShareGasFeesUsd: null,
};

// Coerce a single window's payload into a fully-populated DefiSplit, defaulting
// any missing field to null so downstream formatters stay happy.
const normalizeSplit = (raw: Partial<DefiSplit> | undefined): DefiSplit => {
  const num = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? v : null;
  if (!raw) return { ...EMPTY_SPLIT };
  return {
    l1Txcount: num(raw.l1Txcount),
    l1GasFeesUsd: num(raw.l1GasFeesUsd),
    l2Txcount: num(raw.l2Txcount),
    l2GasFeesUsd: num(raw.l2GasFeesUsd),
    l2ShareTxcount: num(raw.l2ShareTxcount),
    l2ShareGasFeesUsd: num(raw.l2ShareGasFeesUsd),
  };
};

// Read the latest hourly USD value of `txcosts_swap` for one chain in
// fees/table.json. The block columns are `[normalized, unix, value_eth,
// value_usd]`; we resolve `value_usd` by name. Returns null if the chain or
// the block isn't present.
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

const latestSwapFeeUsd = (
  chainData: any,
  chainKey: string,
): number | null => {
  const block = chainData?.[chainKey]?.hourly?.txcosts_swap;
  const types: any[] | undefined = block?.types;
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(types) || !Array.isArray(data) || data.length === 0)
    return null;
  const idx = types.findIndex((t) => String(t).toLowerCase() === 'value_usd');
  if (idx < 0) return null;
  const last = data[data.length - 1];
  if (!Array.isArray(last) || last.length <= idx) return null;
  if (!isHourlyRowFresh(types, last)) return null;
  const v = last[idx];
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
};

export const getDefiL1VsL2 = cache(
  async (): Promise<DefiL1VsL2 | null> => {
    // --- L1 vs L2 finance activity per window + per-L2 contributors -----
    // Both come straight from the precomputed answer file (the backend runs
    // the same finance-category calculation daily). On failure we fall back
    // to empty splits / no contributors so the rest of the page still renders.
    const defiAnswer = await fetchDefiAnswer();
    const byWindow = {} as Record<DefiWindow, DefiSplit>;
    for (const w of DEFI_WINDOWS) {
      byWindow[w] = normalizeSplit(defiAnswer?.byWindow?.[w]);
    }
    const topL2Contributors30d = (defiAnswer?.topL2Contributors30d ?? [])
      .filter(
        (c) => c && typeof c.txcount === 'number' && c.txcount > 0,
      )
      .slice(0, 10);

    // --- Live swap-fee comparison ----------------------------------------
    // Pull fees/table.json (same source as /answers/lowest-fee-ethereum-l2)
    // and master.json (to know which chains are L2s). Find Ethereum L1's
    // live txcosts_swap and the cheapest L2's value.
    let ethereumSwapUsd: number | null = null;
    let cheapestL2Usd: number | null = null;
    let cheapestL2Name: string | null = null;
    let masterChainsCache: Record<string, any> = {};
    try {
      const [master, feeTable] = await Promise.all([
        fetchJson(MasterURL),
        fetchJson(FeesURLs.table),
      ]);
      const masterChains: Record<string, any> = master?.chains ?? {};
      masterChainsCache = masterChains;
      const chainData: Record<string, any> = feeTable?.chain_data ?? {};

      ethereumSwapUsd = latestSwapFeeUsd(chainData, 'ethereum');

      const isL2 = (key: string): boolean => {
        const c = masterChains[key];
        if (!c) return false;
        if (c.deployment && c.deployment !== 'PROD') return false;
        if (NON_L2_KEYS.has(key)) return false;
        if (c.bucket === 'Layer 1') return false;
        if (c.bucket === '-') return false;
        return true;
      };
      const universeKeys = Object.keys(masterChains).filter(isL2);
      for (const key of universeKeys) {
        const v = latestSwapFeeUsd(chainData, key);
        if (v == null) continue;
        if (cheapestL2Usd == null || v < cheapestL2Usd) {
          cheapestL2Usd = v;
          cheapestL2Name = masterChains[key]?.name ?? key;
        }
      }
    } catch (err) {
      console.error('getDefiL1VsL2: swap-fee fetch failed', err);
    }

    const swapMultiplier =
      ethereumSwapUsd != null && cheapestL2Usd != null && cheapestL2Usd > 0
        ? ethereumSwapUsd / cheapestL2Usd
        : null;

    // --- L1 vs L2 stablecoin-supply comparison --------------------------
    // Stablecoins are the single biggest pool of DeFi capital, so this is
    // the cleanest "where does DeFi money sit" comparison we can get with
    // growthepie's per-chain endpoints. Per-chain `stables_mcap.json`
    // exposes a daily timeseries with `[unix, usd, eth]` columns; we read
    // the most recent USD value for `ethereum` and `all_l2s`.
    let l1StablesUsd: number | null = null;
    let l2StablesUsd: number | null = null;
    const fetchLatestStablesUsd = async (
      chainKey: string,
    ): Promise<number | null> => {
      try {
        const stablesJson: any = await fetchJson(
          `https://api.growthepie.com/v1/metrics/chains/${chainKey}/stables_mcap.json`,
        );
        const ts =
          stablesJson?.data?.details?.timeseries ?? stablesJson?.details?.timeseries;
        const daily = ts?.daily;
        const types: any[] | undefined = daily?.types;
        const data: any[] | undefined = daily?.data;
        if (!Array.isArray(types) || !Array.isArray(data) || data.length === 0)
          return null;
        const usdIdx = types.findIndex((t) => String(t).toLowerCase() === 'usd');
        if (usdIdx < 0) return null;
        const last = data[data.length - 1];
        if (!Array.isArray(last) || last.length <= usdIdx) return null;
        const v = last[usdIdx];
        return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
      } catch {
        return null;
      }
    };
    // Try the all_l2s aggregate endpoint first. If missing, sum per-chain
    // stablecoin supply across the L2 universe.
    [l1StablesUsd, l2StablesUsd] = await Promise.all([
      fetchLatestStablesUsd('ethereum'),
      fetchLatestStablesUsd('all_l2s'),
    ]);
    if (l2StablesUsd == null && Object.keys(masterChainsCache).length > 0) {
      const isL2 = (key: string): boolean => {
        const c = masterChainsCache[key];
        if (!c) return false;
        if (c.deployment && c.deployment !== 'PROD') return false;
        if (NON_L2_KEYS.has(key)) return false;
        if (c.bucket === 'Layer 1') return false;
        if (c.bucket === '-') return false;
        return true;
      };
      const l2Keys = Object.keys(masterChainsCache).filter(isL2);
      const results = await Promise.all(l2Keys.map(fetchLatestStablesUsd));
      let s = 0;
      let any = false;
      for (const v of results) {
        if (v != null) {
          s += v;
          any = true;
        }
      }
      l2StablesUsd = any ? s : null;
    }
    const stablesRatio =
      l1StablesUsd != null && l2StablesUsd != null && l1StablesUsd > 0
        ? l2StablesUsd / l1StablesUsd
        : null;
    const stablesTotal = (l1StablesUsd ?? 0) + (l2StablesUsd ?? 0);
    const l2StablesShare =
      l2StablesUsd != null && stablesTotal > 0 ? l2StablesUsd / stablesTotal : null;

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      byWindow,
      topL2Contributors30d,
      stables: {
        l1Usd: l1StablesUsd,
        l2EcosystemUsd: l2StablesUsd,
        l2VsL1Ratio: stablesRatio,
        l2ShareOfTotal: l2StablesShare,
      },
      swapFee: {
        ethereumUsd: ethereumSwapUsd,
        cheapestL2Usd,
        cheapestL2ChainName: cheapestL2Name,
        multiplier: swapMultiplier,
      },
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

const fmtUsd = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'k';
  return '$' + (n ?? 0).toFixed(2);
};

const fmtShare = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 0.1) return (n * 100).toFixed(0) + '%';
  return (n * 100).toFixed(1) + '%';
};

// Swap fees can range from ~$0.005 (cheap L2) to ~$50+ (Ethereum at peak).
// Adapt to magnitude to preserve ~2 significant figures across the range.
const fmtSwapUsd = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return 'unavailable';
  if (n >= 10) return '$' + n.toFixed(0);
  if (n >= 1) return '$' + n.toFixed(2);
  // Sub-dollar → render in cents.
  const cents = n * 100;
  if (cents >= 10) return cents.toFixed(0) + '¢';
  if (cents >= 1) return cents.toFixed(1) + '¢';
  if (cents >= 0.1) return cents.toFixed(2) + '¢';
  return cents.toFixed(3) + '¢';
};

const fmtMultiplier = (n: number | null): string => {
  if (n == null || !Number.isFinite(n) || n <= 0) return '—';
  if (n >= 100) return n.toFixed(0) + '×';
  if (n >= 10) return n.toFixed(1) + '×';
  return n.toFixed(2) + '×';
};

export const formatEthereumSwapFee = (data: DefiL1VsL2): string =>
  fmtSwapUsd(data.swapFee.ethereumUsd);

export const formatCheapestL2SwapFee = (data: DefiL1VsL2): string =>
  fmtSwapUsd(data.swapFee.cheapestL2Usd);

export const formatCheapestL2SwapChain = (data: DefiL1VsL2): string =>
  data.swapFee.cheapestL2ChainName ?? 'unavailable';

export const formatSwapMultiplier = (data: DefiL1VsL2): string =>
  fmtMultiplier(data.swapFee.multiplier);

export const buildSwapFeePhrase = (data: DefiL1VsL2): string => {
  const eth = data.swapFee.ethereumUsd;
  const l2 = data.swapFee.cheapestL2Usd;
  const name = data.swapFee.cheapestL2ChainName;
  if (eth == null && l2 == null) return 'Live swap-fee data unavailable.';
  const ethPart = eth != null ? `Ethereum L1: **${fmtSwapUsd(eth)}**` : null;
  const l2Part =
    l2 != null && name
      ? `cheapest L2 (${name}): **${fmtSwapUsd(l2)}**`
      : l2 != null
        ? `cheapest L2: **${fmtSwapUsd(l2)}**`
        : null;
  const multPart =
    data.swapFee.multiplier != null
      ? ` — L1 currently costs **${fmtMultiplier(data.swapFee.multiplier)}** more than the cheapest L2`
      : '';
  return [ethPart, l2Part].filter(Boolean).join('; ') + multPart + '.';
};

export const formatStablesL1 = (data: DefiL1VsL2): string =>
  fmtUsd(data.stables.l1Usd);
export const formatStablesL2 = (data: DefiL1VsL2): string =>
  fmtUsd(data.stables.l2EcosystemUsd);
export const formatStablesL2Share = (data: DefiL1VsL2): string =>
  fmtShare(data.stables.l2ShareOfTotal);
export const formatStablesRatio = (data: DefiL1VsL2): string =>
  fmtMultiplier(data.stables.l2VsL1Ratio);

export const formatL2ContributorTopList = (
  data: DefiL1VsL2,
  count = 5,
): string => {
  if (!data.topL2Contributors30d || data.topL2Contributors30d.length === 0)
    return 'unavailable';
  return data.topL2Contributors30d
    .slice(0, count)
    .map(
      (e, i) =>
        `${i + 1}. ${e.chainName} (${fmtCount(e.txcount)} txs, ${fmtShare(e.shareOfL2Txs)} of L2 DeFi)`,
    )
    .join('; ');
};

const WINDOW_LABEL: Record<DefiWindow, string> = {
  '7d': '7-day',
  '30d': '30-day',
  '90d': '90-day',
  '180d': '180-day',
  '365d': '1-year',
  max: 'all-time',
};

export const buildDefiDenseSentence = (
  data: DefiL1VsL2,
  dataDateUtc: string,
): string => {
  const s30 = data.byWindow['30d'];
  const haveActivity = s30 && (s30.l1Txcount != null || s30.l2Txcount != null);
  const haveStables = data.stables.l1Usd != null && data.stables.l2EcosystemUsd != null;
  if (!haveActivity && !haveStables) {
    return `**L1 vs L2 DeFi** (data ${dataDateUtc} UTC): unavailable.`;
  }
  const parts: string[] = [];
  if (haveActivity) {
    parts.push(
      `Over the last 30 days, **L2s processed ${fmtCount(s30.l2Txcount)} DeFi transactions** ` +
        `(${fmtShare(s30.l2ShareTxcount)} of L1+L2 total), vs **${fmtCount(s30.l1Txcount)} on Ethereum L1**. ` +
        `By gas fees paid: L2s ${fmtUsd(s30.l2GasFeesUsd)} (${fmtShare(s30.l2ShareGasFeesUsd)}), ` +
        `L1 ${fmtUsd(s30.l1GasFeesUsd)} (${fmtShare(s30.l2ShareGasFeesUsd != null ? 1 - s30.l2ShareGasFeesUsd : null)})`,
    );
  }
  if (haveStables) {
    parts.push(
      `By stablecoin liquidity (the dominant pool of DeFi capital), **L1 holds ${fmtUsd(data.stables.l1Usd)}** ` +
        `vs **${fmtUsd(data.stables.l2EcosystemUsd)}** across all L2s (L2 share: ${fmtShare(data.stables.l2ShareOfTotal)})`,
    );
  }
  return `As of ${dataDateUtc} UTC, ${parts.join('. ')}. `;
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildDefiAnswerTables = (data: DefiL1VsL2): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const tables: AnswerTable[] = [];

  // L1 vs L2 DeFi (finance category) activity per window.
  tables.push({
    title: 'DeFi (finance category) activity — Ethereum L1 vs L2 ecosystem',
    caption: `Transactions and USD gas fees paid in the "finance" category (DeFi) per window. Source: \`/v1/answers/defi-l1-vs-l2.json\` (precomputed daily from the blockspace finance-category L1-vs-L2 rollups). Data: ${dataDate} UTC.`,
    headers: [
      'Window',
      'L2 DeFi txs',
      'L1 DeFi txs',
      'L2 share (txs)',
      'L2 DeFi gas',
      'L1 DeFi gas',
      'L2 share (gas)',
    ],
    rows: DEFI_WINDOWS.map((w) => {
      const s = data.byWindow[w];
      return [
        WINDOW_LABEL[w],
        fmtCount(s?.l2Txcount ?? null),
        fmtCount(s?.l1Txcount ?? null),
        fmtShare(s?.l2ShareTxcount ?? null),
        fmtUsd(s?.l2GasFeesUsd ?? null),
        fmtUsd(s?.l1GasFeesUsd ?? null),
        fmtShare(s?.l2ShareGasFeesUsd ?? null),
      ];
    }),
  });

  if (data.topL2Contributors30d.length > 0) {
    tables.push({
      title: 'Top 10 L2s by DeFi transactions (last 30 days)',
      caption: `Per-L2 contribution to L2 DeFi transaction count over the last 30 days, with share of the L2 DeFi total. Source: \`/v1/answers/defi-l1-vs-l2.json\` \`topL2Contributors30d\` (precomputed daily from blockspace finance-category rows). Data: ${dataDate} UTC.`,
      headers: ['Rank', 'Chain', 'DeFi txs (30d)', 'DeFi gas (30d)', 'Share of L2 DeFi'],
      rows: data.topL2Contributors30d.slice(0, 10).map((e, i) => [
        String(i + 1),
        e.chainName,
        fmtCount(e.txcount),
        fmtUsd(e.gasFeesUsd),
        fmtShare(e.shareOfL2Txs),
      ]),
    });
  }

  // L1 vs L2 capital via stablecoin supply.
  tables.push({
    title: 'L1 vs L2 capital comparison (stablecoin supply)',
    caption: `Total stablecoin supply on Ethereum mainnet vs the L2 ecosystem. Stablecoins are the single biggest pool of DeFi capital, so this is the cleanest "where does DeFi money sit" signal we can directly read for both L1 and L2 sides. Data: ${dataDate} UTC.`,
    headers: ['Layer', 'Stablecoin supply (USD)', 'Share of L1+L2 total', 'L2 / L1 ratio'],
    rows: [
      [
        'Ethereum L1',
        fmtUsd(data.stables.l1Usd),
        data.stables.l2ShareOfTotal != null ? fmtShare(1 - data.stables.l2ShareOfTotal) : '—',
        '—',
      ],
      [
        'L2 ecosystem (all_l2s)',
        fmtUsd(data.stables.l2EcosystemUsd),
        fmtShare(data.stables.l2ShareOfTotal),
        fmtMultiplier(data.stables.l2VsL1Ratio),
      ],
    ],
  });

  // Live swap-fee comparison.
  tables.push({
    title: 'Live swap-fee comparison — Ethereum L1 vs cheapest L2',
    caption: `Live (latest hour) median swap cost in USD on Ethereum mainnet vs the cheapest tracked L2. Source: \`/v1/fees/table.json\` \`txcosts_swap\`. Data: ${dataDate} UTC.`,
    headers: ['Layer', 'Live swap fee', 'Multiplier (L1 vs cheapest L2)'],
    rows: [
      ['Ethereum L1', fmtSwapUsd(data.swapFee.ethereumUsd), '—'],
      [
        data.swapFee.cheapestL2ChainName
          ? `Cheapest L2 (${data.swapFee.cheapestL2ChainName})`
          : 'Cheapest L2',
        fmtSwapUsd(data.swapFee.cheapestL2Usd),
        fmtMultiplier(data.swapFee.multiplier),
      ],
    ],
  });

  return tables;
};

export const buildDefiAcceptedAnswer = (data: DefiL1VsL2): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const s30 = data.byWindow['30d'];
  const haveActivity = s30 && (s30.l1Txcount != null || s30.l2Txcount != null);
  const haveStables = data.stables.l1Usd != null && data.stables.l2EcosystemUsd != null;
  if (!haveActivity && !haveStables && data.swapFee.ethereumUsd == null) {
    return 'Data currently unavailable. See growthepie.com/applications for the live L2 DeFi-apps leaderboard.';
  }
  const activityPart = haveActivity
    ? `Over the last 30 days, L2s processed ${fmtCount(s30.l2Txcount)} DeFi transactions (${fmtShare(s30.l2ShareTxcount)} of L1+L2 total) vs ${fmtCount(s30.l1Txcount)} on Ethereum L1. By gas fees paid: L2s ${fmtUsd(s30.l2GasFeesUsd)} (${fmtShare(s30.l2ShareGasFeesUsd)}), L1 ${fmtUsd(s30.l1GasFeesUsd)}. `
    : '';
  const stablesPart = haveStables
    ? `By stablecoin liquidity (the dominant pool of DeFi capital), L1 holds ${fmtUsd(data.stables.l1Usd)} vs ${fmtUsd(data.stables.l2EcosystemUsd)} across all L2s (L2 share ${fmtShare(data.stables.l2ShareOfTotal)}). `
    : '';
  const swapPart =
    data.swapFee.multiplier != null
      ? `On per-transaction cost, a live swap on L1 costs ${fmtSwapUsd(data.swapFee.ethereumUsd)} vs ${fmtSwapUsd(data.swapFee.cheapestL2Usd)} on the cheapest L2 (${fmtMultiplier(data.swapFee.multiplier)} more expensive on L1). `
      : '';
  return (
    `DeFi activity has moved to L2s, but DeFi capital still concentrates on L1. ${activityPart}${stablesPart}${swapPart}` +
    `Data: ${dataDate} UTC. Live per-app DeFi rankings: growthepie.com/applications.`
  );
};
