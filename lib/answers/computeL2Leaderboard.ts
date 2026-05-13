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
  byMetric: Record<LeaderboardMetric, LeaderboardEntry[]>;
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

// Build a markdown-fenced ```chart``` block whose series exactly match the
// top-N entries on the named leaderboard. Used to keep the visible chart and
// the prose ranking in sync — adding/removing a chain in the L2 universe
// (e.g. Ronin's L2 transition on 2026-05-12) updates both surfaces at once.
const METRIC_CHART_CONFIG: Record<
  LeaderboardMetric,
  {
    title: string;
    subtitle: string;
    suffix?: string | null;
    tooltipDecimals: number;
    apiPath: string; // path inside `metrics/chains/{key}/{apiPath}`
    seeMetricURL: string;
    caption: string;
  }
> = {
  throughput: {
    title: 'Ethereum L2 Throughput (Mgas/s) — top {{N}}',
    subtitle:
      'Mainnet-equivalent gas processed per second — chains shown match the live leaderboard.',
    suffix: ' Mgas/s',
    tooltipDecimals: 2,
    apiPath: 'throughput.json',
    seeMetricURL: '/fundamentals/throughput',
    caption:
      'Daily throughput in millions of gas per second. Live data from growthepie.',
  },
  txcount: {
    title: 'Daily Transactions on Ethereum L2s — top {{N}}',
    subtitle:
      'Raw transaction count — chains shown match the live leaderboard.',
    suffix: null,
    tooltipDecimals: 0,
    apiPath: 'txcount.json',
    seeMetricURL: '/fundamentals/transaction-count',
    caption: 'Daily transactions per chain. Live data from growthepie.',
  },
  daa: {
    title: 'Daily Active Addresses on Ethereum L2s — top {{N}}',
    subtitle:
      'Unique addresses transacting per day — chains shown match the live leaderboard.',
    suffix: null,
    tooltipDecimals: 0,
    apiPath: 'daa.json',
    seeMetricURL: '/fundamentals/daily-active-addresses',
    caption: 'Daily active addresses per chain. Live data from growthepie.',
  },
};

// Minimum visible x-axis date for every chart on /answers/[slug]. Starting
// the window at 1 Feb 2026 trims the long pre-2026 history (which makes
// recent leader changes hard to read) without filtering the underlying data
// — Highcharts still loads the full series, just zooms to this window by
// default. Update here if the editorial start date changes.
const ANSWER_CHART_MIN_TIMESTAMP_MS = Date.UTC(2026, 1, 1); // Feb is month index 1

export const buildChartFencedBlock = (
  lb: L2Leaderboard,
  metric: LeaderboardMetric,
  count = 5,
): string => {
  const entries = lb.byMetric[metric].slice(0, count);
  if (entries.length === 0) return '';

  const cfg = METRIC_CHART_CONFIG[metric];
  const title = cfg.title.replace('{{N}}', String(entries.length));

  const meta = entries.map((e) => ({
    name: e.name,
    color: e.color,
    xIndex: 0,
    yIndex: 1,
    tooltipDecimals: cfg.tooltipDecimals,
    suffix: cfg.suffix,
    url: `https://api.growthepie.com/v1/metrics/chains/${e.key}/${cfg.apiPath}`,
    pathToData: 'details.timeseries.daily.data',
  }));

  const chartConfig = {
    type: 'line',
    title,
    subtitle: cfg.subtitle,
    showXAsDate: true,
    stacking: null,
    dataAsJson: { meta },
    height: 400,
    caption: cfg.caption,
    // The "See metric page" pill is rendered by ChartWrapper from this URL —
    // no need to duplicate the same CTA in the caption or the prose below.
    seeMetricURL: cfg.seeMetricURL,
    options: {
      xAxis: {
        min: ANSWER_CHART_MIN_TIMESTAMP_MS,
      },
    },
  };

  return ['```chart', JSON.stringify(chartConfig), '```'].join('\n');
};

// Single-sentence answer derived from today's leaderboard. Becomes the
// QAPage `acceptedAnswer.text` if the data file doesn't pin one explicitly.
// Methodology / exclusion details live in the page's methodology section
// and the FAQ ("Where does this answer come from?") so the primary answer
// stays direct and AI-quotable without procedural caveats.
export const buildAcceptedAnswer = (lb: L2Leaderboard): string => {
  const tp = lb.byMetric.throughput[0];
  const tx = lb.byMetric.txcount[0];
  const daa = lb.byMetric.daa[0];
  if (!tp || !tx || !daa) {
    return 'Data currently unavailable. See growthepie.com/fundamentals/throughput for the live Ethereum L2 leaderboards.';
  }
  const sameLeader = tp.key === tx.key && tx.key === daa.key;
  if (sameLeader) {
    return (
      `${tp.name} is currently the most used Ethereum L2 across all three primary usage metrics: ` +
      `throughput (${fmtCompact(tp.value)} Mgas/s), daily transactions (${fmtCompact(tx.value)}), and daily active addresses (${fmtCompact(daa.value)}). ` +
      `Live leaderboards: growthepie.com/fundamentals/throughput.`
    );
  }
  return (
    `By throughput the leader is ${tp.name} (${fmtCompact(tp.value)} Mgas/s); ` +
    `by daily transactions ${tx.name} (${fmtCompact(tx.value)}); ` +
    `by daily active addresses ${daa.name} (${fmtCompact(daa.value)}). ` +
    `Live leaderboards: growthepie.com/fundamentals/throughput.`
  );
};
