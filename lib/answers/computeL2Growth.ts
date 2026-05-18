// Server-side helper that ranks Ethereum L2s by period-over-period growth
// rate. Sister to the other L2 answer-page leaderboard helpers.
//
// "Growing fastest" needs a window. We expose two:
//   - Monthly: last completed month vs the month before. Most responsive.
//   - Quarterly: last completed quarter vs the quarter before. Steadier.
// Both windows come from period-native aggregates served by growthepie's
// per-chain timeseries endpoints (`details.timeseries.monthly.data` and
// `.quarterly.data`) — so we never sum daily values to fake a window, which
// matters for DAA where per-day counts double-count multi-day users.
//
// Three metrics are tracked: throughput (Mgas/s), transaction count, and
// daily active addresses. Same trio as the "most used" leaderboard so the
// "most used" vs "growing fastest" comparison is apples-to-apples.
//
// To prevent tiny-numerator inflation, a chain only qualifies for the
// ranking on a given (metric, period) pair if its CURRENT value clears a
// minimum activity threshold. Without this filter a brand-new L2 that goes
// from 100 daily addresses to 1000 reads as "10× growth" and crowds out
// every chain that matters.

import { cache } from 'react';
import { MasterURL } from '@/lib/urls';

const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

const GROWTH_METRICS = ['throughput', 'txcount', 'daa', 'tvl'] as const;
export type GrowthMetric = (typeof GROWTH_METRICS)[number];

const METRIC_API_SLUG: Record<GrowthMetric, string> = {
  throughput: 'throughput.json',
  txcount: 'txcount.json',
  daa: 'daa.json',
  // TVL endpoint also serves what growthepie's UI labels "TVS"
  // (Total Value Secured). Same underlying data, different presentation.
  tvl: 'tvl.json',
};

export const GROWTH_WINDOWS = ['monthly', 'quarterly'] as const;
export type GrowthWindow = (typeof GROWTH_WINDOWS)[number];

// Minimum current-period value to be eligible for the ranking. Tuned so
// a small but real L2 (e.g. a niche app-specific rollup) still qualifies
// while a brand-new chain with a handful of transactions doesn't crowd out
// the leaderboard with implausible growth percentages.
const MIN_CURRENT_VALUE: Record<GrowthMetric, number> = {
  throughput: 0.05, // 0.05 Mgas/s — a noticeable workload
  txcount: 50_000, // 50k transactions in the period
  daa: 1_000, // 1,000 unique active addresses
  tvl: 10_000_000, // $10M USD — filters out testnet-tier balances
};

export type GrowthEntry = {
  key: string;
  name: string;
  urlKey: string;
  color: string;
  currentValue: number;
  priorValue: number;
  // (current - prior) / prior. null when prior is zero / missing — a
  // chain "appearing from zero" shouldn't claim infinite growth.
  changePct: number | null;
};

export type L2Growth = {
  generatedAtIso: string;
  universeSize: number;
  universeKeys: string[];
  excludedNonL2Keys: string[];
  byMetricByWindow: Record<GrowthMetric, Record<GrowthWindow, GrowthEntry[]>>;
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-growth' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// Return (current, prior) values from the period-native series. Current is
// the last completed period; prior is the period before that. Both must
// exist for the row to be eligible — a chain with only one period of data
// can't be ranked for growth.
const pickCurrentAndPrior = (
  block: any,
): { current: number; prior: number } | null => {
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(data) || data.length < 2) return null;
  // Use the SECOND-TO-LAST as the "current" (most recent completed period)
  // and the THIRD-TO-LAST as "prior" — the last entry can be an in-progress
  // period. Matches the convention used by computeL2Leaderboard for
  // weekly/monthly leaderboards.
  const currentRow = data[data.length - 2];
  const priorRow = data[data.length - 3];
  if (!Array.isArray(currentRow) || !Array.isArray(priorRow)) return null;
  const current = currentRow[1];
  const prior = priorRow[1];
  if (
    typeof current !== 'number' ||
    !Number.isFinite(current) ||
    typeof prior !== 'number' ||
    !Number.isFinite(prior)
  ) {
    return null;
  }
  return { current, prior };
};

// TVL is a stock metric exposed only as a daily series with `[unix, usd, eth]`
// columns — no period-native monthly/quarterly buckets like the other three
// metrics. We sample the USD column at fixed offsets: latest = current,
// 30 days back = monthly prior, 90 days back = quarterly prior. Point-in-time
// comparison is appropriate for stock metrics; flow metrics would be wrong.
const pickTvlAtOffsets = (
  block: any,
): Record<GrowthWindow, { current: number; prior: number } | null> | null => {
  const types: any[] | undefined = block?.types;
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(types) || !Array.isArray(data) || data.length < 91)
    return null;
  const usdIdx = types.findIndex((t) => String(t).toLowerCase() === 'usd');
  if (usdIdx < 0) return null;
  const valueAt = (i: number): number | null => {
    const row = data[i];
    if (!Array.isArray(row) || row.length <= usdIdx) return null;
    const v = row[usdIdx];
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  };
  const lastIdx = data.length - 1;
  const current = valueAt(lastIdx);
  const monthlyPrior = valueAt(lastIdx - 30);
  const quarterlyPrior = valueAt(lastIdx - 90);
  if (current == null) return null;
  return {
    monthly:
      monthlyPrior != null ? { current, prior: monthlyPrior } : null,
    quarterly:
      quarterlyPrior != null ? { current, prior: quarterlyPrior } : null,
  };
};

const fetchChainSeries = async (
  key: string,
  metric: GrowthMetric,
): Promise<Record<GrowthWindow, { current: number; prior: number } | null> | null> => {
  try {
    const url = `https://api.growthepie.com/v1/metrics/chains/${key}/${METRIC_API_SLUG[metric]}`;
    const json = await fetchJson(url);
    const ts = json?.data?.details?.timeseries ?? json?.details?.timeseries;
    if (!ts) return null;
    if (metric === 'tvl') {
      // TVL endpoint only has the daily series; compute by sampling offsets.
      return pickTvlAtOffsets(ts.daily);
    }
    return {
      monthly: pickCurrentAndPrior(ts.monthly),
      quarterly: pickCurrentAndPrior(ts.quarterly),
    };
  } catch {
    return null;
  }
};

export const getL2Growth = cache(
  async (): Promise<L2Growth | null> => {
    let master: any;
    try {
      master = await fetchJson(MasterURL);
    } catch (err) {
      console.error('getL2Growth: master fetch failed', err);
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

    // Fetch every (chain, metric) pair in parallel — same shape as the usage
    // leaderboard. ~26 chains × 3 metrics = ~78 requests, cached at the
    // fetch layer for an hour.
    const tasks: Promise<{
      key: string;
      metric: GrowthMetric;
      values: Awaited<ReturnType<typeof fetchChainSeries>>;
    }>[] = [];
    for (const key of universeKeys) {
      for (const metric of GROWTH_METRICS) {
        tasks.push(
          fetchChainSeries(key, metric).then((values) => ({
            key,
            metric,
            values,
          })),
        );
      }
    }
    const results = await Promise.all(tasks);

    const byMetricByWindow = {} as Record<
      GrowthMetric,
      Record<GrowthWindow, GrowthEntry[]>
    >;
    for (const metric of GROWTH_METRICS) {
      byMetricByWindow[metric] = { monthly: [], quarterly: [] };
    }

    for (const window of GROWTH_WINDOWS) {
      for (const metric of GROWTH_METRICS) {
        const entries: GrowthEntry[] = [];
        const threshold = MIN_CURRENT_VALUE[metric];
        for (const r of results) {
          if (r.metric !== metric || !r.values) continue;
          const pair = r.values[window];
          if (!pair) continue;
          if (pair.current < threshold) continue;
          const changePct =
            pair.prior > 0 ? (pair.current - pair.prior) / pair.prior : null;
          entries.push({
            key: r.key,
            name: nameFor(r.key),
            urlKey: urlKeyFor(r.key),
            color: colorFor(r.key),
            currentValue: pair.current,
            priorValue: pair.prior,
            changePct,
          });
        }
        // Sort by change %, descending. Null change goes to the bottom so
        // chains with a zero prior (or missing prior) don't fake a top spot.
        entries.sort((a, b) => {
          const av = a.changePct ?? -Infinity;
          const bv = b.changePct ?? -Infinity;
          return bv - av;
        });
        byMetricByWindow[metric][window] = entries.slice(0, 10);
      }
    }

    const sidechainExclusions = Array.from(NON_L2_KEYS)
      .filter((k) => k !== 'ethereum' && k !== 'all_l2s' && k !== 'multiple')
      .map((k) => chains[k]?.name ?? k)
      .sort();

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      universeSize: universeKeys.length,
      universeKeys,
      excludedNonL2Keys: sidechainExclusions,
      byMetricByWindow,
    };
  },
);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmtCompact = (n: number): string => {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(2);
};

const fmtCompactUsd = (n: number): string => {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'k';
  return '$' + n.toFixed(2);
};

// Format a metric value for prose. TVS renders as compact USD; the other
// three render as compact counts plus their per-metric suffix.
const fmtValue = (metric: GrowthMetric, n: number): string =>
  metric === 'tvl' ? fmtCompactUsd(n) : `${fmtCompact(n)}${METRIC_SUFFIX[metric]}`;

const METRIC_SUFFIX: Record<GrowthMetric, string> = {
  throughput: ' Mgas/s',
  txcount: '',
  daa: '',
  tvl: '',
};

const METRIC_LABEL: Record<GrowthMetric, string> = {
  throughput: 'throughput',
  txcount: 'transaction count',
  daa: 'active addresses',
  tvl: 'total value secured (TVS)',
};

const WINDOW_LABEL: Record<GrowthWindow, string> = {
  monthly: 'month-over-month',
  quarterly: 'quarter-over-quarter',
};

export const fmtPct = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return '—';
  const pct = n * 100;
  const sign = pct >= 0 ? '+' : '';
  if (Math.abs(pct) >= 1000) return `${sign}${pct.toFixed(0)}%`;
  if (Math.abs(pct) >= 100) return `${sign}${pct.toFixed(0)}%`;
  if (Math.abs(pct) >= 10) return `${sign}${pct.toFixed(1)}%`;
  return `${sign}${pct.toFixed(1)}%`;
};

export const formatGrowthEntry = (
  e: GrowthEntry,
  metric: GrowthMetric,
): string =>
  `${e.name} (${fmtPct(e.changePct)}; ${fmtValue(metric, e.currentValue)} now vs ${fmtValue(metric, e.priorValue)} prior)`;

export const formatTopList = (
  entries: GrowthEntry[],
  metric: GrowthMetric,
  count = 3,
): string => {
  if (!entries || entries.length === 0) return 'unavailable';
  return entries
    .slice(0, count)
    .map((e, i) => `${i + 1}. ${formatGrowthEntry(e, metric)}`)
    .join('; ');
};

export const formatLeader = (
  entries: GrowthEntry[],
  metric: GrowthMetric,
): string =>
  entries && entries[0] ? formatGrowthEntry(entries[0], metric) : 'unavailable';

// Dense quotable sentence collapsing all four metrics' fastest-growers into
// one self-contained claim — what AI engines lift from QAPage.acceptedAnswer.
export const buildGrowthDense = (
  data: L2Growth,
  window: GrowthWindow,
  dataDateUtc: string,
): string => {
  const tp = data.byMetricByWindow.throughput[window]?.[0];
  const tx = data.byMetricByWindow.txcount[window]?.[0];
  const daa = data.byMetricByWindow.daa[window]?.[0];
  const tvl = data.byMetricByWindow.tvl[window]?.[0];
  if (!tp || !tx || !daa) {
    return `**Fastest-growing Ethereum L2s** (${WINDOW_LABEL[window]}, data ${dataDateUtc} UTC): unavailable.`;
  }
  const tvlPart = tvl ? `, **${tvl.name}** by TVS (${fmtPct(tvl.changePct)})` : '';
  return (
    `As of ${dataDateUtc} UTC (${WINDOW_LABEL[window]}), the fastest-growing ` +
    `Ethereum L2s are **${tp.name}** by throughput (${fmtPct(tp.changePct)}), ` +
    `**${tx.name}** by transactions (${fmtPct(tx.changePct)}), ` +
    `**${daa.name}** by active addresses (${fmtPct(daa.changePct)})${tvlPart}.`
  );
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildGrowthAnswerTables = (data: L2Growth): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const tables: AnswerTable[] = [];
  for (const metric of GROWTH_METRICS) {
    for (const window of GROWTH_WINDOWS) {
      const entries = data.byMetricByWindow[metric][window] ?? [];
      tables.push({
        title: `Fastest-growing L2s by ${METRIC_LABEL[metric]} (${WINDOW_LABEL[window]})`,
        caption: `Top 10 Ethereum L2s by ${WINDOW_LABEL[window]} growth in ${METRIC_LABEL[metric]} as of ${dataDate} UTC. Eligibility filtered for minimum current-period activity to avoid tiny-numerator noise.`,
        headers: ['Rank', 'Chain', 'Growth', 'Now', 'Prior'],
        rows: entries.slice(0, 10).map((e, i) => [
          String(i + 1),
          e.name,
          fmtPct(e.changePct),
          fmtValue(metric, e.currentValue),
          fmtValue(metric, e.priorValue),
        ]),
      });
    }
  }
  return tables;
};

// Multi-sentence acceptedAnswer used as QAPage.acceptedAnswer.text. Names a
// "fastest-growing" leader per metric AND per window so AI engines that quote
// only the accepted answer hand the reader a complete picture.
export const buildGrowthAcceptedAnswer = (data: L2Growth): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const has = (m: GrowthMetric, w: GrowthWindow) =>
    !!data.byMetricByWindow[m]?.[w]?.[0];
  // Require the three activity metrics; TVS is included opportunistically
  // since the per-chain TVL endpoint occasionally lacks 90 days of history
  // for newer chains.
  const hasCore = (['throughput', 'txcount', 'daa'] as const).every(
    (m) => has(m, 'monthly') && has(m, 'quarterly'),
  );
  if (!hasCore) {
    return 'Data currently unavailable. See growthepie.com for the live Ethereum L2 leaderboards.';
  }
  const sentenceFor = (window: GrowthWindow): string => {
    const tp = data.byMetricByWindow.throughput[window][0];
    const tx = data.byMetricByWindow.txcount[window][0];
    const daa = data.byMetricByWindow.daa[window][0];
    const tvl = data.byMetricByWindow.tvl[window]?.[0];
    const tvlPart = tvl
      ? `, ${tvl.name} leads TVS (${fmtPct(tvl.changePct)})`
      : '';
    return (
      `${WINDOW_LABEL[window]}: ${tp.name} leads throughput growth ` +
      `(${fmtPct(tp.changePct)}), ${tx.name} leads transactions ` +
      `(${fmtPct(tx.changePct)}), ${daa.name} leads active addresses ` +
      `(${fmtPct(daa.changePct)})${tvlPart}`
    );
  };
  return (
    `By month-over-month and quarter-over-quarter growth across throughput, ` +
    `transactions, active addresses, and total value secured: ` +
    `${sentenceFor('monthly')}. ${sentenceFor('quarterly')}. ` +
    `Data: ${dataDate} UTC. Live leaderboards: growthepie.com/fundamentals/throughput.`
  );
};
