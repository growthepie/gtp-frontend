// Server-side helper that computes the long-run trend of Ethereum L2 user
// fees, anchored to the major protocol upgrades that moved the curve
// (Dencun → Pectra → Fusaka). Distinct from computeL2FeesLeaderboard which
// ranks chains at a single snapshot — this one is a time-series question.
//
// Data sources:
//   - Per-chain monthly txcosts USD series from
//     /v1/metrics/chains/{chain}/txcosts.json `details.timeseries.monthly`.
//   - master.json for the L2 universe filter (same as every other answer).
//
// Method: for each completed month in the series, compute the median USD
// txcost across every L2 that has a value for that month. Cross-sectional
// median (across chains within a month), not within-chain. Surfaces anchor
// dates that bracket the upgrades and the % change between them.

import { cache } from 'react';
import { MasterURL } from '@/lib/urls';

const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

// Anchor months bracketing each upgrade. The pre-month is fully before the
// activation; the post-month is fully after. Hard-coded because activation
// dates are public and stable.
//
// Dencun: activated 2024-03-13 (EIP-4844 blobs)
// Pectra: activated 2025-05-07 (blob target 3 → 6)
// Fusaka: activated 2025-12-04 (PeerDAS, blob target step-up)
export const ANCHORS = {
  preDencun: '2024-02', // last full pre-Dencun month
  postDencun: '2024-04', // first full post-Dencun month
  prePectra: '2025-04', // last full pre-Pectra month
  postPectra: '2025-06', // first full post-Pectra month
  preFusaka: '2025-11', // last full pre-Fusaka month
  postFusaka: '2026-01', // first full post-Fusaka (BPO1 + early BPO2) month
} as const;
export type AnchorKey = keyof typeof ANCHORS;

export type MonthlyMedianRow = {
  // YYYY-MM string for stable keying.
  yearMonth: string;
  // First-of-month unix milliseconds for charting.
  unixMs: number;
  // Median USD txcost across every L2 with data for that month.
  medianUsd: number;
  // Number of L2s contributing to the median this month — provides a
  // confidence signal (low N early-period, larger N today).
  contributingChains: number;
};

export type AnchorSnapshot = {
  yearMonth: string;
  medianUsd: number | null;
  contributingChains: number;
};

export type L2FeesTrend = {
  generatedAtIso: string;
  universeSize: number;
  universeKeys: string[];
  excludedNonL2Keys: string[];
  // Full monthly time series, oldest first. Each entry is the cross-L2
  // median txcost for that month, in USD.
  monthly: MonthlyMedianRow[];
  // Latest available month's median (typically the latest completed
  // month). Used as "today" in the trend.
  latestMonth: AnchorSnapshot | null;
  // Anchor snapshots for the upgrades that moved the curve.
  preDencun: AnchorSnapshot | null;
  postDencun: AnchorSnapshot | null;
  prePectra: AnchorSnapshot | null;
  postPectra: AnchorSnapshot | null;
  preFusaka: AnchorSnapshot | null;
  postFusaka: AnchorSnapshot | null;
  // 12-month-ago snapshot (relative to the latest month).
  oneYearAgo: AnchorSnapshot | null;
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-fees-trend' },
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

// Read a monthly USD series from a per-chain txcosts response. Returns a
// map keyed by YYYY-MM so we can align series across chains by month.
const readMonthlyUsd = (json: any): Map<string, number> => {
  const out = new Map<string, number>();
  const ts =
    json?.data?.details?.timeseries?.monthly ??
    json?.details?.timeseries?.monthly;
  if (!ts) return out;
  const types: any[] | undefined = ts?.types;
  const data: any[] | undefined = ts?.data;
  if (!Array.isArray(types) || !Array.isArray(data)) return out;
  const usdIdx = types.findIndex((t) => String(t).toLowerCase() === 'usd');
  const unixIdx = types.findIndex((t) => String(t).toLowerCase() === 'unix');
  if (usdIdx < 0 || unixIdx < 0) return out;
  for (const row of data) {
    if (!Array.isArray(row) || row.length <= Math.max(usdIdx, unixIdx)) continue;
    const unix = row[unixIdx];
    const usd = row[usdIdx];
    if (
      typeof unix !== 'number' ||
      !Number.isFinite(unix) ||
      typeof usd !== 'number' ||
      !Number.isFinite(usd) ||
      usd <= 0
    ) {
      continue;
    }
    const d = new Date(unix);
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    out.set(ym, usd);
  }
  return out;
};

const median = (xs: number[]): number => {
  const sorted = [...xs].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return NaN;
  if (n % 2 === 1) return sorted[(n - 1) / 2];
  return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
};

const ymToUnixMs = (ym: string): number => {
  const [y, m] = ym.split('-').map((s) => parseInt(s, 10));
  return Date.UTC(y, m - 1, 1);
};

const subtractMonths = (ym: string, n: number): string => {
  const [y, m] = ym.split('-').map((s) => parseInt(s, 10));
  let yy = y;
  let mm = m - n;
  while (mm < 1) {
    mm += 12;
    yy -= 1;
  }
  return `${yy}-${String(mm).padStart(2, '0')}`;
};

const findRow = (
  monthly: MonthlyMedianRow[],
  ym: string,
): AnchorSnapshot | null => {
  const r = monthly.find((x) => x.yearMonth === ym);
  if (!r) return null;
  return {
    yearMonth: r.yearMonth,
    medianUsd: r.medianUsd,
    contributingChains: r.contributingChains,
  };
};

export const getL2FeesTrend = cache(
  async (): Promise<L2FeesTrend | null> => {
    let master: any;
    try {
      master = await fetchJson(MasterURL);
    } catch (err) {
      console.error('getL2FeesTrend: master fetch failed', err);
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

    // Pull every L2's monthly txcosts series in parallel. ~30 chains × 1
    // request each, all cached at the Next.js fetch layer for 1 hour.
    const perChain = await Promise.all(
      universeKeys.map((key) =>
        fetchJsonSoft(
          `https://api.growthepie.com/v1/metrics/chains/${key}/txcosts.json`,
        ).then((json) => ({ key, monthly: readMonthlyUsd(json) })),
      ),
    );

    // Build the union of months any chain reports, then compute the
    // cross-chain median for each month.
    const allMonths = new Set<string>();
    for (const r of perChain) {
      for (const ym of r.monthly.keys()) allMonths.add(ym);
    }
    const monthly: MonthlyMedianRow[] = [];
    for (const ym of allMonths) {
      const values: number[] = [];
      for (const r of perChain) {
        const v = r.monthly.get(ym);
        if (typeof v === 'number' && Number.isFinite(v) && v > 0) values.push(v);
      }
      if (values.length === 0) continue;
      monthly.push({
        yearMonth: ym,
        unixMs: ymToUnixMs(ym),
        medianUsd: median(values),
        contributingChains: values.length,
      });
    }
    monthly.sort((a, b) => a.unixMs - b.unixMs);

    // Drop the in-progress trailing month — it can read artificially low or
    // high because the data is incomplete. Keep it only if it's the only
    // recent row available.
    if (monthly.length >= 2) {
      const last = monthly[monthly.length - 1];
      const nowMs = Date.now();
      const lastEndMs = ymToUnixMs(subtractMonths(last.yearMonth, -1)); // next month's start = this month's end
      if (lastEndMs > nowMs) {
        // Last month is still ongoing — drop it.
        monthly.pop();
      }
    }

    const latestMonth: AnchorSnapshot | null =
      monthly.length > 0
        ? {
            yearMonth: monthly[monthly.length - 1].yearMonth,
            medianUsd: monthly[monthly.length - 1].medianUsd,
            contributingChains: monthly[monthly.length - 1].contributingChains,
          }
        : null;

    const oneYearAgo =
      latestMonth != null
        ? findRow(monthly, subtractMonths(latestMonth.yearMonth, 12))
        : null;

    const sidechainExclusions = Array.from(NON_L2_KEYS)
      .filter((k) => k !== 'ethereum' && k !== 'all_l2s' && k !== 'multiple')
      .map((k) => chains[k]?.name ?? k)
      .sort();

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      universeSize: universeKeys.length,
      universeKeys,
      excludedNonL2Keys: sidechainExclusions,
      monthly,
      latestMonth,
      preDencun: findRow(monthly, ANCHORS.preDencun),
      postDencun: findRow(monthly, ANCHORS.postDencun),
      prePectra: findRow(monthly, ANCHORS.prePectra),
      postPectra: findRow(monthly, ANCHORS.postPectra),
      preFusaka: findRow(monthly, ANCHORS.preFusaka),
      postFusaka: findRow(monthly, ANCHORS.postFusaka),
      oneYearAgo,
    };
  },
);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

// L2 fees span six orders of magnitude (sub-cent on Base today, dollars on
// L1 pre-Dencun). Keep ~3 significant figures across the range.
const fmtUsdFee = (n: number | null): string => {
  if (n == null || !Number.isFinite(n) || n <= 0) return 'unavailable';
  if (n >= 100) return '$' + n.toFixed(0);
  if (n >= 10) return '$' + n.toFixed(1);
  if (n >= 1) return '$' + n.toFixed(2);
  if (n >= 0.1) return '$' + n.toFixed(3);
  if (n >= 0.01) return '$' + n.toFixed(3); // 1.23¢ → "$0.012"
  if (n >= 0.001) return '$' + n.toFixed(4);
  return '$' + n.toFixed(5);
};

// Sub-dollar fees read more clearly as cents.
const fmtFee = (n: number | null): string => {
  if (n == null || !Number.isFinite(n) || n <= 0) return 'unavailable';
  if (n >= 1) return '$' + n.toFixed(2);
  const cents = n * 100;
  if (cents >= 10) return cents.toFixed(0) + '¢';
  if (cents >= 1) return cents.toFixed(1) + '¢';
  return cents.toFixed(2) + '¢';
};

const fmtPctChange = (a: number | null, b: number | null): string => {
  if (a == null || b == null || a <= 0 || b <= 0) return '—';
  const change = (b - a) / a;
  if (!Number.isFinite(change)) return '—';
  const pct = change * 100;
  const sign = pct > 0 ? '+' : '';
  if (Math.abs(pct) >= 100) return sign + pct.toFixed(0) + '%';
  return sign + pct.toFixed(1) + '%';
};

const fmtMultipleReduction = (a: number | null, b: number | null): string => {
  if (a == null || b == null || a <= 0 || b <= 0) return '—';
  // How many times smaller b is than a (e.g. a=$0.50, b=$0.01 → 50×).
  if (b > a) {
    // Got more expensive — reverse direction.
    const ratio = b / a;
    return ratio.toFixed(1) + '× more expensive';
  }
  const ratio = a / b;
  if (ratio >= 100) return ratio.toFixed(0) + '× cheaper';
  if (ratio >= 10) return ratio.toFixed(1) + '× cheaper';
  return ratio.toFixed(2) + '× cheaper';
};

export const formatAnchorFee = (anchor: AnchorSnapshot | null): string =>
  fmtFee(anchor?.medianUsd ?? null);

export const formatAnchorMonth = (anchor: AnchorSnapshot | null): string =>
  anchor?.yearMonth ?? '—';

export const formatPctChangeBetween = (
  a: AnchorSnapshot | null,
  b: AnchorSnapshot | null,
): string => fmtPctChange(a?.medianUsd ?? null, b?.medianUsd ?? null);

export const formatMultipleReduction = (
  a: AnchorSnapshot | null,
  b: AnchorSnapshot | null,
): string => fmtMultipleReduction(a?.medianUsd ?? null, b?.medianUsd ?? null);

// Direction word — "cheaper" / "more expensive" / "about the same".
export const formatDirection = (
  a: AnchorSnapshot | null,
  b: AnchorSnapshot | null,
): string => {
  if (a?.medianUsd == null || b?.medianUsd == null) return 'unavailable';
  const change = (b.medianUsd - a.medianUsd) / a.medianUsd;
  if (Math.abs(change) < 0.05) return 'about the same';
  return change < 0 ? 'cheaper' : 'more expensive';
};

export const buildTrendDenseSentence = (
  data: L2FeesTrend,
  dataDateUtc: string,
): string => {
  const t = data.latestMonth;
  const pre = data.preDencun;
  const oy = data.oneYearAgo;
  if (!t || pre == null) {
    return `**Ethereum L2 fee trend** (data ${dataDateUtc} UTC): unavailable.`;
  }
  return (
    `As of ${dataDateUtc} UTC, the median Ethereum L2 user fee is **${fmtFee(t.medianUsd)}** per transaction (${t.yearMonth}). ` +
    `Pre-Dencun (${pre.yearMonth}) the same median was ${fmtFee(pre.medianUsd)} — fees are now **${fmtMultipleReduction(pre.medianUsd, t.medianUsd)}** than before the March 2024 Dencun upgrade. ` +
    (oy
      ? `Year-over-year (${oy.yearMonth} → ${t.yearMonth}): ${fmtMultipleReduction(oy.medianUsd, t.medianUsd)} (${fmtPctChange(oy.medianUsd, t.medianUsd)}).`
      : '')
  );
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildTrendAnswerTables = (data: L2FeesTrend): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const anchorsTable: AnswerTable = {
    title: 'Median Ethereum L2 user fee — upgrade anchor snapshots',
    caption: `Cross-chain median USD txcost in each anchor month, derived from per-L2 monthly txcosts series. "Cheaper since" = how many times smaller the latest value is than the anchor. Data: ${dataDate} UTC.`,
    headers: ['Anchor', 'Month', 'Median L2 fee', '×, vs latest'],
    rows: [
      [
        'Pre-Dencun (Feb 2024)',
        formatAnchorMonth(data.preDencun),
        formatAnchorFee(data.preDencun),
        formatMultipleReduction(data.preDencun, data.latestMonth),
      ],
      [
        'Post-Dencun (Apr 2024)',
        formatAnchorMonth(data.postDencun),
        formatAnchorFee(data.postDencun),
        formatMultipleReduction(data.postDencun, data.latestMonth),
      ],
      [
        'Pre-Pectra (Apr 2025)',
        formatAnchorMonth(data.prePectra),
        formatAnchorFee(data.prePectra),
        formatMultipleReduction(data.prePectra, data.latestMonth),
      ],
      [
        'Post-Pectra (Jun 2025)',
        formatAnchorMonth(data.postPectra),
        formatAnchorFee(data.postPectra),
        formatMultipleReduction(data.postPectra, data.latestMonth),
      ],
      [
        'Pre-Fusaka (Nov 2025)',
        formatAnchorMonth(data.preFusaka),
        formatAnchorFee(data.preFusaka),
        formatMultipleReduction(data.preFusaka, data.latestMonth),
      ],
      [
        'Post-Fusaka (Jan 2026)',
        formatAnchorMonth(data.postFusaka),
        formatAnchorFee(data.postFusaka),
        formatMultipleReduction(data.postFusaka, data.latestMonth),
      ],
      [
        '1 year ago',
        formatAnchorMonth(data.oneYearAgo),
        formatAnchorFee(data.oneYearAgo),
        formatMultipleReduction(data.oneYearAgo, data.latestMonth),
      ],
      [
        'Latest available month',
        formatAnchorMonth(data.latestMonth),
        formatAnchorFee(data.latestMonth),
        '—',
      ],
    ],
  };
  // Recent 18 months of the monthly median series for the chart-friendly
  // table. 18 rows fits in AI-extractor cards without truncation.
  const recent = data.monthly.slice(-18);
  const seriesTable: AnswerTable = {
    title: 'Median Ethereum L2 user fee — last 18 months',
    caption: `Cross-chain monthly median USD txcost. "Contributing chains" indicates how many L2s had data for that month (more = higher confidence). Data: ${dataDate} UTC.`,
    headers: ['Month', 'Median L2 fee', 'Contributing chains'],
    rows: recent.map((r) => [
      r.yearMonth,
      fmtFee(r.medianUsd),
      String(r.contributingChains),
    ]),
  };
  return [anchorsTable, seriesTable];
};

export const buildTrendAcceptedAnswer = (data: L2FeesTrend): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const t = data.latestMonth;
  const pre = data.preDencun;
  if (!t || !pre || pre.medianUsd == null || t.medianUsd == null) {
    return `Ethereum L2 fee trend data currently unavailable. See growthepie.com/fees for the live tracker.`;
  }
  const decisive = pre.medianUsd > t.medianUsd;
  const lead = decisive
    ? `Yes — Ethereum L2 user fees have gotten dramatically cheaper over time.`
    : `Ethereum L2 fees are currently above the pre-Dencun baseline — they have not, on net, gotten cheaper over the long run.`;
  return (
    `${lead} Data ${dataDate} UTC: ` +
    `the median L2 user fee in ${pre.yearMonth} (pre-Dencun) was ${fmtFee(pre.medianUsd)}; in ${t.yearMonth} (latest available month) it is ${fmtFee(t.medianUsd)} — ${fmtMultipleReduction(pre.medianUsd, t.medianUsd)}. ` +
    `The single largest step-down was the Dencun upgrade in March 2024 (EIP-4844 blobs); Pectra (May 2025) and Fusaka (December 2025) compounded the effect. ` +
    `See the page for the per-upgrade anchor table. Live tracker: growthepie.com/fees.`
  );
};
