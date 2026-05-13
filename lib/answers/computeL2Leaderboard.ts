// Server-side helper that derives the current Ethereum-L2 usage leaderboard
// from growthepie's own data. Used by /answers/[slug] to keep canonical
// answer prose, FAQ values, and the QAPage `acceptedAnswer` in sync with
// today's leaderboard — no hand-written "Base leads throughput" claims.
//
// The L2 universe is computed by combining two sources of truth:
//   1. master.json `chains[].bucket` — drops chains where bucket === "Layer 1"
//      (Ethereum) or "-" (aggregate keys like all_l2s, multiple).
//   2. An explicit non-L2 exclusion list — chains with their own validator
//      sets that don't post data to Ethereum (Polygon PoS, Ronin). These have
//      `bucket: "Others"` so a bucket filter alone wouldn't catch them.
//
// The metric values come from `landing_page.json` `data.metrics.table_visual`
// — the same payload the homepage leaderboards use, so the answer page can
// never disagree with what the homepage shows.

import { cache } from 'react';
import { LandingURL, MasterURL } from '@/lib/urls';

// Chain keys excluded from the L2 leaderboards. Ethereum is L1, Polygon PoS
// is a sidechain with its own validator set, all_l2s/multiple are aggregate
// keys (not individual chains). If a chain migrates from sidechain to L2 in
// the future, simply remove its key from this set.
const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

const SUPPORTED_METRICS = ['throughput', 'txcount', 'daa'] as const;
export type LeaderboardMetric = (typeof SUPPORTED_METRICS)[number];

export const SUPPORTED_PERIODS = ['daily', 'weekly', 'monthly'] as const;
export type LeaderboardPeriod = (typeof SUPPORTED_PERIODS)[number];

export type LeaderboardEntry = {
  key: string;
  name: string;
  urlKey: string;
  value: number;
  // Brand colour pulled from master.json for chart series consistency.
  // Falls back to a neutral grey if missing.
  color: string;
};

export type L2Leaderboard = {
  generatedAtIso: string;
  universeSize: number;
  universeKeys: string[];
  // Chain keys excluded today (Ethereum is always excluded as L1; sidechains
  // appear here only while they remain non-L2). Used by the answer prose to
  // name what's out and why, instead of hard-coding "Polygon PoS, Ronin".
  excludedNonL2Keys: string[];
  // Daily-only leaderboard derived from landing_page.json (kept for the
  // single-leader / FAQ acceptedAnswer placeholders). Equivalent to
  // byMetricByPeriod[metric].daily but cheaper to compute.
  byMetric: Record<LeaderboardMetric, LeaderboardEntry[]>;
  // Period-aware leaderboards derived from per-chain timeseries endpoints.
  // For DAA the API's weekly/monthly are unique-address aggregates (NOT a
  // sum of daily values), so they avoid the double-counting that summing
  // dailies would introduce.
  byMetricByPeriod: Record<
    LeaderboardMetric,
    Record<LeaderboardPeriod, LeaderboardEntry[]>
  >;
};

// Helper — fetch JSON via Next.js `fetch` so the response is cached at the
// server level for an hour. Combined with React's `cache()` wrapper around
// the public function below, that means at most one origin hit per hour and
// at most one in-flight request per server-render.
const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    // 1 hour — landing_page.json updates hourly upstream, master.json daily.
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-leaderboard' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// Per-chain metric endpoint path. The same shape is used for daa/txcount/
// throughput — only the URL slug changes.
const METRIC_API_SLUG: Record<LeaderboardMetric, string> = {
  throughput: 'throughput.json',
  txcount: 'txcount.json',
  daa: 'daa.json',
};

// Pick the most recent value for a given period. Daily uses the very last
// data point; weekly/monthly use the second-to-last so partial in-progress
// periods (e.g. a week with only one day of data) don't end up represented
// as the "weekly" or "monthly" value. The growthepie API exposes
// daily/weekly/monthly aggregates that are computed natively for the period
// — so for DAA the weekly value is unique addresses over the week, NOT a
// sum of daily DAAs (which would double-count addresses transacting on
// multiple days).
const pickLatestValue = (
  series: any,
  period: LeaderboardPeriod,
): number | null => {
  const data: any[] | undefined = series?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const idx = period === 'daily' ? data.length - 1 : data.length - 2;
  if (idx < 0) return null;
  const row = data[idx];
  if (!Array.isArray(row) || row.length < 2) return null;
  const v = row[1];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};

// Fetch the per-chain timeseries for one metric. Soft-fails (returns null)
// so a single bad chain doesn't break the whole leaderboard.
const fetchChainSeries = async (
  key: string,
  metric: LeaderboardMetric,
): Promise<{
  daily: number | null;
  weekly: number | null;
  monthly: number | null;
} | null> => {
  try {
    const url = `https://api.growthepie.com/v1/metrics/chains/${key}/${METRIC_API_SLUG[metric]}`;
    const json = await fetchJson(url);
    const ts = json?.data?.details?.timeseries ?? json?.details?.timeseries;
    if (!ts) return null;
    return {
      daily: pickLatestValue(ts.daily, 'daily'),
      weekly: pickLatestValue(ts.weekly, 'weekly'),
      monthly: pickLatestValue(ts.monthly, 'monthly'),
    };
  } catch {
    return null;
  }
};

export const getL2UsageLeaderboard = cache(
  async (): Promise<L2Leaderboard | null> => {
    let master: any;
    let landing: any;

    try {
      [master, landing] = await Promise.all([
        fetchJson(MasterURL),
        fetchJson(LandingURL),
      ]);
    } catch (err) {
      console.error('getL2UsageLeaderboard: upstream fetch failed', err);
      return null;
    }

    const chains: Record<string, any> = master?.chains ?? {};
    const tableVisual: Record<string, any> =
      landing?.data?.metrics?.table_visual ?? {};

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
      // Prefer dark[0] then light[0] then a neutral so chart series always
      // get a recognisable colour even for newly-tracked chains.
      return c?.dark?.[0] ?? c?.light?.[0] ?? '#A3B8D9';
    };

    const nameFor = (key: string): string =>
      tableVisual[key]?.chain_name ?? chains[key]?.name ?? key;
    const urlKeyFor = (key: string): string =>
      chains[key]?.url_key ?? key.replace(/_/g, '-');

    const byMetric = {} as Record<LeaderboardMetric, LeaderboardEntry[]>;
    for (const metric of SUPPORTED_METRICS) {
      const entries: LeaderboardEntry[] = [];
      for (const [key, row] of Object.entries(tableVisual)) {
        if (!isL2(key)) continue;
        const r = row?.ranking?.[metric];
        const value = typeof r?.value === 'number' ? r.value : null;
        if (value == null) continue;
        entries.push({
          key,
          name: row.chain_name ?? chains[key]?.name ?? key,
          urlKey: chains[key]?.url_key ?? key.replace(/_/g, '-'),
          value,
          color: colorFor(key),
        });
      }
      entries.sort((a, b) => b.value - a.value);
      byMetric[metric] = entries.slice(0, 5);
    }

    // Fetch per-chain daily/weekly/monthly values for every L2 in the
    // universe across every supported metric. ~26 chains × 3 metrics = ~78
    // requests, fired in parallel and cached at the Next.js fetch layer for
    // an hour, so the cold-start cost amortizes across the whole UTC day.
    const fetchTasks: Promise<{
      key: string;
      metric: LeaderboardMetric;
      values: { daily: number | null; weekly: number | null; monthly: number | null } | null;
    }>[] = [];
    for (const key of universeKeys) {
      for (const metric of SUPPORTED_METRICS) {
        fetchTasks.push(
          fetchChainSeries(key, metric).then((values) => ({ key, metric, values })),
        );
      }
    }
    const results = await Promise.all(fetchTasks);

    const byMetricByPeriod = {} as Record<
      LeaderboardMetric,
      Record<LeaderboardPeriod, LeaderboardEntry[]>
    >;
    for (const metric of SUPPORTED_METRICS) {
      byMetricByPeriod[metric] = { daily: [], weekly: [], monthly: [] };
    }
    for (const period of SUPPORTED_PERIODS) {
      for (const metric of SUPPORTED_METRICS) {
        const entries: LeaderboardEntry[] = [];
        for (const r of results) {
          if (r.metric !== metric || !r.values) continue;
          const v = r.values[period];
          if (v == null) continue;
          entries.push({
            key: r.key,
            name: nameFor(r.key),
            urlKey: urlKeyFor(r.key),
            value: v,
            color: colorFor(r.key),
          });
        }
        entries.sort((a, b) => b.value - a.value);
        byMetricByPeriod[metric][period] = entries.slice(0, 5);
      }
    }

    // Report the sidechain exclusions in display-name form so prose can
    // render them without hard-coding chain keys. Ethereum is always
    // implicitly excluded (it's L1) and isn't reported here.
    const sidechainExclusions = Array.from(NON_L2_KEYS)
      .filter((k) => k !== 'ethereum' && k !== 'all_l2s' && k !== 'multiple')
      .map((k) => chains[k]?.name ?? k)
      .sort();

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      universeSize: universeKeys.length,
      universeKeys,
      excludedNonL2Keys: sidechainExclusions,
      byMetric,
      byMetricByPeriod,
    };
  },
);

// Pretty-format helpers used when injecting leaderboard data into prose.

const fmtCompact = (n: number): string => {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(2);
};

const unitForMetric = (metric: LeaderboardMetric): string =>
  metric === 'throughput' ? ' Mgas/s' : '';

export const formatLeaderEntry = (
  e: LeaderboardEntry,
  metric: LeaderboardMetric,
): string => `${e.name} (${fmtCompact(e.value)}${unitForMetric(metric)})`;

export const formatTopList = (
  entries: LeaderboardEntry[],
  metric: LeaderboardMetric,
  count = 3,
): string =>
  entries
    .slice(0, count)
    .map((e, i) => `${i + 1}. ${formatLeaderEntry(e, metric)}`)
    .join(', ');

// Per-metric display config: the unit suffix shown next to numbers and a
// short human label used in the dense leader sentence.
const METRIC_DISPLAY: Record<
  LeaderboardMetric,
  { suffix: string; label: string }
> = {
  throughput: { suffix: ' Mgas/s', label: 'throughput' },
  txcount: { suffix: '', label: 'transaction count' },
  daa: { suffix: '', label: 'active addresses' },
};

// Build the top-3 prose string for a (metric, period) pair so the SEO
// shell's text-only output exposes weekly/monthly rankings to AI consumers.
export const formatPeriodTopList = (
  lb: L2Leaderboard,
  metric: LeaderboardMetric,
  period: LeaderboardPeriod,
  count = 3,
): string => {
  const entries = lb.byMetricByPeriod?.[metric]?.[period];
  if (!entries || entries.length === 0) return 'unavailable';
  const suffix = METRIC_DISPLAY[metric].suffix;
  return entries
    .slice(0, count)
    .map((e, i) => `${i + 1}. ${e.name} (${fmtCompact(e.value)}${suffix})`)
    .join(', ');
};

export const formatPeriodLeader = (
  lb: L2Leaderboard,
  metric: LeaderboardMetric,
  period: LeaderboardPeriod,
): string => {
  const e = lb.byMetricByPeriod?.[metric]?.[period]?.[0];
  if (!e) return 'unavailable';
  return `${e.name} (${fmtCompact(e.value)}${METRIC_DISPLAY[metric].suffix})`;
};

// Single dense sentence per metric. Collapses the three "Daily / Weekly /
// Monthly top 3" prose lines into one quotable claim that AI extractors
// can lift verbatim. Branches on whether one chain leads at all horizons
// (the common case — Base today) or the leader rotates per period.
export const buildDenseSentence = (
  lb: L2Leaderboard,
  metric: LeaderboardMetric,
  dataDateUtc: string,
): string => {
  const cfg = METRIC_DISPLAY[metric];
  const dailyLeader = lb.byMetricByPeriod?.[metric]?.daily?.[0];
  const weeklyLeader = lb.byMetricByPeriod?.[metric]?.weekly?.[0];
  const monthlyLeader = lb.byMetricByPeriod?.[metric]?.monthly?.[0];

  if (!dailyLeader || !weeklyLeader || !monthlyLeader) {
    const dailyList = formatPeriodTopList(lb, metric, 'daily', 3);
    const weeklyList = formatPeriodTopList(lb, metric, 'weekly', 3);
    const monthlyList = formatPeriodTopList(lb, metric, 'monthly', 3);
    return (
      `**Top Ethereum L2s by ${cfg.label}** (data ${dataDateUtc} UTC): ` +
      `daily — ${dailyList}; weekly — ${weeklyList}; monthly — ${monthlyList}.`
    );
  }

  const valueTriple =
    `daily ${fmtCompact(dailyLeader.value)}${cfg.suffix}, ` +
    `weekly ${fmtCompact(weeklyLeader.value)}${cfg.suffix}, ` +
    `monthly ${fmtCompact(monthlyLeader.value)}${cfg.suffix}`;

  const allSame =
    dailyLeader.key === weeklyLeader.key &&
    weeklyLeader.key === monthlyLeader.key;

  if (allSame) {
    return (
      `**${dailyLeader.name}** leads Ethereum L2 ${cfg.label} across all three time horizons ` +
      `(${valueTriple}; data ${dataDateUtc} UTC). ` +
      `Daily top 3: ${formatPeriodTopList(lb, metric, 'daily', 3)}. ` +
      `Weekly top 3: ${formatPeriodTopList(lb, metric, 'weekly', 3)}. ` +
      `Monthly top 3: ${formatPeriodTopList(lb, metric, 'monthly', 3)}.`
    );
  }

  return (
    `**Top Ethereum L2 by ${cfg.label}** (data ${dataDateUtc} UTC) — ` +
    `daily: ${dailyLeader.name} (${fmtCompact(dailyLeader.value)}${cfg.suffix}); ` +
    `weekly: ${weeklyLeader.name} (${fmtCompact(weeklyLeader.value)}${cfg.suffix}); ` +
    `monthly: ${monthlyLeader.name} (${fmtCompact(monthlyLeader.value)}${cfg.suffix}). ` +
    `Daily top 3: ${formatPeriodTopList(lb, metric, 'daily', 3)}. ` +
    `Weekly top 3: ${formatPeriodTopList(lb, metric, 'weekly', 3)}. ` +
    `Monthly top 3: ${formatPeriodTopList(lb, metric, 'monthly', 3)}.`
  );
};

// Multi-sentence acceptedAnswer that names the leader at daily, weekly,
// AND monthly horizons across every metric. This is what AI engines pull
// out via QAPage.acceptedAnswer.text — so we make it self-contained: a
// reader who quotes just this paragraph still gets the full answer.
export const buildAcceptedAnswer = (lb: L2Leaderboard): string => {
  const dataDate = lb.generatedAtIso.slice(0, 10);
  const hasMinimum = (['throughput', 'txcount', 'daa'] as LeaderboardMetric[]).every(
    (m) =>
      lb.byMetricByPeriod?.[m]?.daily?.[0] &&
      lb.byMetricByPeriod?.[m]?.weekly?.[0] &&
      lb.byMetricByPeriod?.[m]?.monthly?.[0],
  );
  if (!hasMinimum) {
    return 'Data currently unavailable. See growthepie.com/fundamentals/throughput for the live Ethereum L2 leaderboards.';
  }
  const sentenceFor = (metric: LeaderboardMetric, prefix: string): string => {
    const d = lb.byMetricByPeriod[metric].daily[0];
    const w = lb.byMetricByPeriod[metric].weekly[0];
    const m = lb.byMetricByPeriod[metric].monthly[0];
    const suffix = METRIC_DISPLAY[metric].suffix;
    return (
      `${prefix} the daily leader is ${d.name} (${fmtCompact(d.value)}${suffix}); ` +
      `weekly leader: ${w.name} (${fmtCompact(w.value)}${suffix}); ` +
      `monthly leader: ${m.name} (${fmtCompact(m.value)}${suffix}).`
    );
  };
  return (
    sentenceFor('throughput', 'By throughput,') +
    ' ' +
    sentenceFor('txcount', 'By transaction count,') +
    ' ' +
    sentenceFor('daa', 'By active addresses (unique per period for weekly/monthly, not summed daily values),') +
    ` Data: ${dataDate} UTC. Live leaderboards: growthepie.com/fundamentals/throughput.`
  );
};
