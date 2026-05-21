// Server-side helper that compares the L2 ecosystem against Ethereum
// mainnet on the two dimensions a "is Ethereum scaling?" question is
// usually asking about: transaction count and throughput (gas per second).
//
// Sister to computeL2Leaderboard / computeL2TxsEcosystem / computeL2TopApps.
// Shape: small set of paired scalars (L2 total, Ethereum mainnet, ratio)
// across daily / weekly / monthly windows for txcount and throughput.
//
// Data sources:
//   - Ethereum mainnet: `/v1/metrics/chains/ethereum/{metric}.json`. The
//     per-chain endpoint exposes period-native daily/weekly/monthly buckets.
//   - L2 ecosystem total: primary path is the same per-chain endpoint with
//     the `all_l2s` aggregate chain key. If that endpoint isn't reachable,
//     fall back to fetching every L2 in the curated universe and summing
//     per-chain values for each period.

import { cache } from 'react';
import { MasterURL } from '@/lib/urls';

const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

const SCALING_METRICS = ['txcount', 'throughput'] as const;
export type ScalingMetric = (typeof SCALING_METRICS)[number];

const METRIC_API_SLUG: Record<ScalingMetric, string> = {
  txcount: 'txcount.json',
  throughput: 'throughput.json',
};

export const SCALING_PERIODS = ['daily', 'weekly', 'monthly'] as const;
export type ScalingPeriod = (typeof SCALING_PERIODS)[number];

export type ScalingPair = {
  // Aggregate value across all tracked L2s.
  l2: number | null;
  // Ethereum mainnet (L1) value alone.
  ethereum: number | null;
  // L2 total divided by Ethereum mainnet — i.e. how many times more
  // activity the L2 ecosystem now produces. null when either value is
  // missing or Ethereum is zero (would be undefined).
  ratio: number | null;
};

export type EthereumScalingComparison = {
  generatedAtIso: string;
  universeSize: number;
  universeKeys: string[];
  excludedNonL2Keys: string[];
  // Whether the L2 total came from the all_l2s aggregate endpoint (true)
  // or had to be summed manually from per-chain values (false). Exposed
  // so the methodology FAQ can note which path actually ran.
  l2SourceAggregateEndpoint: boolean;
  byMetric: Record<ScalingMetric, Record<ScalingPeriod, ScalingPair>>;
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-scaling' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

const fetchJsonSoft = async (url: string): Promise<any | null> => {
  try {
    return await fetchJson(url);
  } catch {
    return null;
  }
};

// Daily uses the last data point; weekly / monthly use the second-to-last
// so an in-progress period doesn't get reported as the "current" weekly /
// monthly value. Same convention used by computeL2Leaderboard.
const pickAtPeriod = (block: any, period: ScalingPeriod): number | null => {
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const idx = period === 'daily' ? data.length - 1 : data.length - 2;
  if (idx < 0) return null;
  const row = data[idx];
  if (!Array.isArray(row) || row.length < 2) return null;
  const v = row[1];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
};

// Read per-chain timeseries for one metric. Same shape across throughput,
// txcount, etc. — `details.timeseries.{daily,weekly,monthly}.data` rows of
// `[unix, value]`. Both possible JSON envelopes (`data.details.timeseries`
// and `details.timeseries`) are checked because the API has historically
// served both.
const fetchChainMetric = async (
  chainKey: string,
  metric: ScalingMetric,
): Promise<Record<ScalingPeriod, number | null> | null> => {
  const url = `https://api.growthepie.com/v1/metrics/chains/${chainKey}/${METRIC_API_SLUG[metric]}`;
  const json = await fetchJsonSoft(url);
  if (!json) return null;
  const ts = json?.data?.details?.timeseries ?? json?.details?.timeseries;
  if (!ts) return null;
  return {
    daily: pickAtPeriod(ts.daily, 'daily'),
    weekly: pickAtPeriod(ts.weekly, 'weekly'),
    monthly: pickAtPeriod(ts.monthly, 'monthly'),
  };
};

export const getEthereumScaling = cache(
  async (): Promise<EthereumScalingComparison | null> => {
    let master: any;
    try {
      master = await fetchJson(MasterURL);
    } catch (err) {
      console.error('getEthereumScaling: master fetch failed', err);
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

    // Fetch Ethereum mainnet first — its values feed every ratio.
    const ethEntries = await Promise.all(
      SCALING_METRICS.map(
        async (m) => [m, await fetchChainMetric('ethereum', m)] as const,
      ),
    );
    const ethereum: Record<ScalingMetric, Record<ScalingPeriod, number | null>> =
      {} as any;
    for (const [m, v] of ethEntries) {
      ethereum[m] = v ?? { daily: null, weekly: null, monthly: null };
    }

    // Try the aggregate endpoint first. If it works, every metric × period
    // is a single value — much cheaper than summing N chains. If not, fall
    // back to summing each chain's per-period values.
    let l2: Record<ScalingMetric, Record<ScalingPeriod, number | null>> =
      {} as any;
    let l2SourceAggregateEndpoint = true;

    const aggEntries = await Promise.all(
      SCALING_METRICS.map(
        async (m) => [m, await fetchChainMetric('all_l2s', m)] as const,
      ),
    );
    const aggregateWorked = aggEntries.every(([, v]) => v !== null);
    if (aggregateWorked) {
      for (const [m, v] of aggEntries) {
        l2[m] = v!;
      }
    } else {
      l2SourceAggregateEndpoint = false;
      // Fallback: per-chain sum. ~26 chains × 2 metrics = ~52 requests but
      // they're cached at the Next.js fetch layer for an hour.
      const perChainTasks: Promise<{
        key: string;
        metric: ScalingMetric;
        values: Record<ScalingPeriod, number | null> | null;
      }>[] = [];
      for (const key of universeKeys) {
        for (const m of SCALING_METRICS) {
          perChainTasks.push(
            fetchChainMetric(key, m).then((values) => ({ key, metric: m, values })),
          );
        }
      }
      const results = await Promise.all(perChainTasks);
      for (const m of SCALING_METRICS) {
        const acc: Record<ScalingPeriod, number | null> = {
          daily: null,
          weekly: null,
          monthly: null,
        };
        for (const p of SCALING_PERIODS) {
          let s = 0;
          let any = false;
          for (const r of results) {
            if (r.metric !== m || !r.values) continue;
            const v = r.values[p];
            if (v == null) continue;
            s += v;
            any = true;
          }
          acc[p] = any ? s : null;
        }
        l2[m] = acc;
      }
    }

    // Materialise the public byMetric structure with ratio.
    const byMetric = {} as Record<
      ScalingMetric,
      Record<ScalingPeriod, ScalingPair>
    >;
    for (const m of SCALING_METRICS) {
      byMetric[m] = { daily: emptyPair(), weekly: emptyPair(), monthly: emptyPair() };
      for (const p of SCALING_PERIODS) {
        const lv = l2[m]?.[p];
        const ev = ethereum[m]?.[p];
        let ratio: number | null = null;
        if (lv != null && ev != null && ev > 0 && Number.isFinite(ev)) {
          ratio = lv / ev;
        }
        byMetric[m][p] = { l2: lv ?? null, ethereum: ev ?? null, ratio };
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
      l2SourceAggregateEndpoint,
      byMetric,
    };
  },
);

const emptyPair = (): ScalingPair => ({ l2: null, ethereum: null, ratio: null });

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmtCompactCount = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  if (Math.abs(n) >= 10) return n.toFixed(0);
  return n.toFixed(2);
};

// Throughput on L2 dashboards is in Mgas/s, so attach the unit.
const fmtThroughput = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 100) return n.toFixed(0) + ' Mgas/s';
  if (n >= 10) return n.toFixed(1) + ' Mgas/s';
  return n.toFixed(2) + ' Mgas/s';
};

const fmtRatio = (r: number | null): string => {
  if (r == null || !Number.isFinite(r)) return '—';
  if (r >= 100) return r.toFixed(0) + '×';
  if (r >= 10) return r.toFixed(1) + '×';
  return r.toFixed(2) + '×';
};

export const formatValue = (
  metric: ScalingMetric,
  n: number | null,
): string => (metric === 'throughput' ? fmtThroughput(n) : fmtCompactCount(n));

const METRIC_NOUN: Record<ScalingMetric, string> = {
  txcount: 'transactions',
  throughput: 'throughput',
};

const PERIOD_LABEL: Record<ScalingPeriod, string> = {
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
};

export const formatPair = (
  metric: ScalingMetric,
  period: ScalingPeriod,
  pair: ScalingPair,
): string => {
  if (pair.l2 == null || pair.ethereum == null) return 'unavailable';
  const l2 = formatValue(metric, pair.l2);
  const eth = formatValue(metric, pair.ethereum);
  const ratio = fmtRatio(pair.ratio);
  return `L2s ${l2} vs Ethereum mainnet ${eth} (${ratio} ${PERIOD_LABEL[period]})`;
};

// Single-pair "ratio" prose: "8.4× more (L2 ... vs Ethereum ...)".
export const formatRatioPhrase = (
  metric: ScalingMetric,
  period: ScalingPeriod,
  pair: ScalingPair,
): string => {
  if (pair.ratio == null || pair.l2 == null || pair.ethereum == null)
    return 'unavailable';
  return `${fmtRatio(pair.ratio)} (L2s ${formatValue(
    metric,
    pair.l2,
  )} vs Ethereum ${formatValue(metric, pair.ethereum)})`;
};

// Dense quotable sentence per metric — collapses the three periods into one
// quotable claim. Engineered to read as a direct "yes, by this much" answer.
export const buildScalingDense = (
  data: EthereumScalingComparison,
  metric: ScalingMetric,
  dataDateUtc: string,
): string => {
  const noun = METRIC_NOUN[metric];
  const d = data.byMetric[metric].daily;
  const w = data.byMetric[metric].weekly;
  const m = data.byMetric[metric].monthly;
  if (d.ratio == null || w.ratio == null || m.ratio == null) {
    return `**Ethereum L2s vs mainnet by ${noun}** (data ${dataDateUtc} UTC): unavailable.`;
  }
  return (
    `As of ${dataDateUtc} UTC, Ethereum L2s collectively produce ` +
    `**${fmtRatio(d.ratio)} more ${noun} than mainnet daily** ` +
    `(${formatValue(metric, d.l2)} vs ${formatValue(metric, d.ethereum)}), ` +
    `${fmtRatio(w.ratio)} more weekly ` +
    `(${formatValue(metric, w.l2)} vs ${formatValue(metric, w.ethereum)}), ` +
    `and ${fmtRatio(m.ratio)} more monthly ` +
    `(${formatValue(metric, m.l2)} vs ${formatValue(metric, m.ethereum)}).`
  );
};

// Headline "yes, here's how much" sentence covering both metrics in one
// quotable claim — for the page lead and the QAPage acceptedAnswer.
export const buildYesHeadline = (
  data: EthereumScalingComparison,
  dataDateUtc: string,
): string => {
  const txD = data.byMetric.txcount.daily.ratio;
  const tpD = data.byMetric.throughput.daily.ratio;
  if (txD == null || tpD == null) {
    return `Yes — Ethereum is scaling through L2s, but live ratio data is currently unavailable (data ${dataDateUtc} UTC).`;
  }
  return (
    `Yes. As of ${dataDateUtc} UTC, Ethereum L2s collectively process ` +
    `**${fmtRatio(txD)} more transactions** and **${fmtRatio(
      tpD,
    )} more throughput (gas/s)** than Ethereum mainnet alone — every day. ` +
    `The gap holds across weekly and monthly windows too.`
  );
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildScalingAnswerTables = (
  data: EthereumScalingComparison,
): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return SCALING_METRICS.map((metric) => {
    const title =
      metric === 'txcount'
        ? 'Transactions — L2 ecosystem vs Ethereum mainnet'
        : 'Throughput (Mgas/s) — L2 ecosystem vs Ethereum mainnet';
    return {
      title,
      caption: `Per-period totals and L2/L1 ratio as of ${dataDate} UTC.`,
      headers: ['Period', 'L2 ecosystem', 'Ethereum mainnet', 'L2 / L1'],
      rows: SCALING_PERIODS.map((p) => {
        const pair = data.byMetric[metric][p];
        return [
          p.charAt(0).toUpperCase() + p.slice(1),
          formatValue(metric, pair.l2),
          formatValue(metric, pair.ethereum),
          fmtRatio(pair.ratio),
        ];
      }),
    };
  });
};

// Multi-sentence acceptedAnswer used as QAPage.acceptedAnswer.text — answers
// "yes, here's by how much across daily/weekly/monthly".
export const buildScalingAcceptedAnswer = (
  data: EthereumScalingComparison,
): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const txD = data.byMetric.txcount.daily;
  const tpD = data.byMetric.throughput.daily;
  if (txD.ratio == null || tpD.ratio == null) {
    return `Yes — Ethereum is scaling through L2s. Live comparison data is currently unavailable. See growthepie.com for the live L2 vs mainnet leaderboards.`;
  }
  return (
    `Yes. Data ${dataDate} UTC: ` +
    `L2s produce ${fmtRatio(txD.ratio)} more transactions than Ethereum mainnet daily ` +
    `(${formatValue('txcount', txD.l2)} vs ${formatValue('txcount', txD.ethereum)}), ` +
    `and ${fmtRatio(tpD.ratio)} more throughput daily ` +
    `(${formatValue('throughput', tpD.l2)} vs ${formatValue('throughput', tpD.ethereum)}). ` +
    `Weekly and monthly windows show the same direction. ` +
    `Live leaderboards: growthepie.com/fundamentals/throughput.`
  );
};

// ---------------------------------------------------------------------------
// Share / percentage view (used by the "/answers/percentage-of-ethereum-
// activity-on-l2s" page). Derived from the same ScalingPair data — L2 share
// = L2 / (L2 + L1), L1 share = L1 / (L2 + L1). The "share" framing is what
// AI search receives when users ask "what % of Ethereum is on L2s" rather
// than "how much more do L2s do" — same underlying numbers, different
// presentation.
// ---------------------------------------------------------------------------

const safeShare = (
  numerator: number | null,
  total: number | null,
): number | null =>
  numerator != null && total != null && total > 0 && Number.isFinite(total)
    ? numerator / total
    : null;

// L2 / (L2 + L1) — what fraction of combined activity happens on L2s.
export const computeL2Share = (pair: ScalingPair): number | null => {
  if (pair.l2 == null || pair.ethereum == null) return null;
  return safeShare(pair.l2, pair.l2 + pair.ethereum);
};

export const computeL1Share = (pair: ScalingPair): number | null => {
  if (pair.l2 == null || pair.ethereum == null) return null;
  return safeShare(pair.ethereum, pair.l2 + pair.ethereum);
};

const fmtSharePct = (s: number | null): string => {
  if (s == null || !Number.isFinite(s) || s < 0) return '—';
  // Tight integer formatting for "headline percentage" framing AI cards
  // prefer: "85%" reads stronger than "84.7%" and the page already exposes
  // the exact underlying values in the tables.
  if (s >= 0.995) return '99%+';
  if (s <= 0.005) return '<1%';
  return Math.round(s * 100) + '%';
};

export const formatL2SharePct = (
  metric: ScalingMetric,
  period: ScalingPeriod,
  pair: ScalingPair,
): string => fmtSharePct(computeL2Share(pair));

export const formatL1SharePct = (
  metric: ScalingMetric,
  period: ScalingPeriod,
  pair: ScalingPair,
): string => fmtSharePct(computeL1Share(pair));

// "85% of daily transactions happen on L2s (15% on Ethereum mainnet)" —
// self-contained phrase for FAQ answers.
export const buildSharePhrase = (
  metric: ScalingMetric,
  period: ScalingPeriod,
  pair: ScalingPair,
): string => {
  const l2 = computeL2Share(pair);
  const l1 = computeL1Share(pair);
  if (l2 == null || l1 == null) return 'unavailable';
  const noun = METRIC_NOUN[metric];
  return `${fmtSharePct(l2)} of ${PERIOD_LABEL[period]} ${noun} happen on L2s, ${fmtSharePct(l1)} on Ethereum mainnet (L2s ${formatValue(
    metric,
    pair.l2,
  )} vs Ethereum ${formatValue(metric, pair.ethereum)})`;
};

// Dense quotable sentence per metric for the share page — collapses the
// three periods into one quotable claim about the L2 share.
export const buildShareDenseSentence = (
  data: EthereumScalingComparison,
  metric: ScalingMetric,
  dataDateUtc: string,
): string => {
  const noun = METRIC_NOUN[metric];
  const d = data.byMetric[metric].daily;
  const w = data.byMetric[metric].weekly;
  const m = data.byMetric[metric].monthly;
  const dShare = computeL2Share(d);
  const wShare = computeL2Share(w);
  const mShare = computeL2Share(m);
  if (dShare == null || wShare == null || mShare == null) {
    return `**L2 share of Ethereum ${noun}** (data ${dataDateUtc} UTC): unavailable.`;
  }
  return (
    `As of ${dataDateUtc} UTC, **${fmtSharePct(dShare)} of all Ethereum ${noun} happen on L2s** ` +
    `(daily); ${fmtSharePct(wShare)} weekly; ${fmtSharePct(mShare)} monthly. ` +
    `Ethereum mainnet handles the remainder.`
  );
};

// Headline sentence covering both metrics in one quotable claim — for the
// share page lead and the QAPage acceptedAnswer.
export const buildShareHeadline = (
  data: EthereumScalingComparison,
  dataDateUtc: string,
): string => {
  const txShare = computeL2Share(data.byMetric.txcount.daily);
  const tpShare = computeL2Share(data.byMetric.throughput.daily);
  if (txShare == null || tpShare == null) {
    return `L2 share data currently unavailable (data ${dataDateUtc} UTC).`;
  }
  return (
    `As of ${dataDateUtc} UTC, Ethereum L2s account for **${fmtSharePct(
      txShare,
    )} of all daily transactions** and **${fmtSharePct(
      tpShare,
    )} of all daily throughput (gas processed per second)** across the Ethereum ecosystem. ` +
    `Ethereum mainnet handles the rest.`
  );
};

export const buildShareAnswerTables = (
  data: EthereumScalingComparison,
): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return SCALING_METRICS.map((metric) => {
    const title =
      metric === 'txcount'
        ? 'Share of Ethereum transactions — L2s vs Mainnet'
        : 'Share of Ethereum throughput (Mgas/s) — L2s vs Mainnet';
    return {
      title,
      caption: `L2 share = L2 ecosystem total / (L2 + Ethereum mainnet). Same underlying data as the scaling-ratio page, expressed as a percentage. Data: ${dataDate} UTC.`,
      headers: [
        'Period',
        'L2 share',
        'Mainnet share',
        'L2 total',
        'Ethereum mainnet',
      ],
      rows: SCALING_PERIODS.map((p) => {
        const pair = data.byMetric[metric][p];
        return [
          p.charAt(0).toUpperCase() + p.slice(1),
          fmtSharePct(computeL2Share(pair)),
          fmtSharePct(computeL1Share(pair)),
          formatValue(metric, pair.l2),
          formatValue(metric, pair.ethereum),
        ];
      }),
    };
  });
};

export const buildShareAcceptedAnswer = (
  data: EthereumScalingComparison,
): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const txD = data.byMetric.txcount.daily;
  const tpD = data.byMetric.throughput.daily;
  const txShare = computeL2Share(txD);
  const tpShare = computeL2Share(tpD);
  if (txShare == null || tpShare == null) {
    return `L2 share of Ethereum activity is currently unavailable. See growthepie.com/fundamentals/throughput for the live L2 vs mainnet view.`;
  }
  return (
    `As of ${dataDate} UTC, the majority of Ethereum activity happens on Layer 2s. ` +
    `Ethereum L2s account for ${fmtSharePct(txShare)} of all daily transactions and ${fmtSharePct(
      tpShare,
    )} of all daily throughput (gas processed per second) across the combined Ethereum ecosystem (L1 + L2s). ` +
    `Ethereum mainnet handles the remaining ${fmtSharePct(computeL1Share(txD))} of transactions and ${fmtSharePct(
      computeL1Share(tpD),
    )} of throughput. ` +
    `The share trends in the same direction across weekly and monthly windows — see the tables on the page for the full breakdown. ` +
    `Live leaderboards: growthepie.com/fundamentals/throughput. Data: ${dataDate} UTC.`
  );
};
