// Server-side helper that produces a side-by-side comparison of two
// Ethereum L2 chains across the metrics AI-search queries most often ask
// about ("which is bigger, Base or Arbitrum?"). Generic over the pair so a
// future Base-vs-OP or Arbitrum-vs-zkSync page can reuse the same builder.
//
// Data sources (per-chain, per-metric):
//   - /v1/metrics/chains/{chain}/{metric}.json — daily / weekly / monthly
//     period-native series. Daily uses the latest available row; weekly /
//     monthly use the period-native aggregate value (the API exposes them
//     directly so we don't have to re-sum daily values).
//   - master.json — chain metadata: display name, url_key, launch date,
//     rollup stack, DA layer, native token symbol.
//
// Outputs: a structured set of paired metric values + leader markers, plus
// builders for accepted-answer / dense-sentence / answer-table prose.

import { cache } from 'react';
import { MasterURL } from '@/lib/urls';

export type HeadToHeadMetricKey =
  | 'txcount_daily'
  | 'txcount_weekly'
  | 'txcount_monthly'
  | 'daa_daily'
  | 'daa_weekly'
  | 'daa_monthly'
  | 'throughput_daily'
  | 'throughput_weekly'
  | 'throughput_monthly'
  | 'tvl_latest'
  | 'stables_mcap_latest'
  | 'fees_30d'
  | 'profit_30d';

export type HeadToHeadMetric = {
  key: HeadToHeadMetricKey;
  label: string;
  // null when no comparable side has data.
  winner: 'a' | 'b' | 'tie' | null;
  aValue: number | null;
  bValue: number | null;
  // Multiple of the larger over the smaller (when both present and >0).
  multiple: number | null;
  aDisplay: string;
  bDisplay: string;
};

export type ChainHeadToHeadSideMeta = {
  key: string;
  name: string;
  urlKey: string;
  launchDate: string | null;
  stack: string | null;
  daLayer: string | null;
  nativeToken: string | null;
};

export type ChainHeadToHead = {
  generatedAtIso: string;
  a: ChainHeadToHeadSideMeta;
  b: ChainHeadToHeadSideMeta;
  metrics: HeadToHeadMetric[];
  // Tally — how many metrics each side leads.
  aWinCount: number;
  bWinCount: number;
  // Overall winner (more wins). null on tie or no data.
  overallWinner: 'a' | 'b' | 'tie' | null;
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-head-to-head' },
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

// Read the period-native value for a per-chain metric endpoint. Daily uses
// the latest row; weekly / monthly use the second-to-last row so an
// in-progress period doesn't get reported. Same convention used by
// computeL2Leaderboard and computeEthereumScaling.
const pickValueAtPeriod = (
  block: any,
  period: 'daily' | 'weekly' | 'monthly',
): number | null => {
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const idx = period === 'daily' ? data.length - 1 : data.length - 2;
  if (idx < 0) return null;
  const row = data[idx];
  if (!Array.isArray(row) || row.length < 2) return null;
  // Most series use [unix, value]. USD series use [unix, usd, eth] — find
  // by name in `types` if available, otherwise fall through to index 1.
  const types: any[] | undefined = block?.types;
  if (Array.isArray(types)) {
    const usdIdx = types.findIndex((t) => String(t).toLowerCase() === 'usd');
    if (usdIdx >= 0 && row.length > usdIdx) {
      const v = row[usdIdx];
      if (typeof v === 'number' && Number.isFinite(v)) return v;
    }
  }
  const v = row[1];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};

// Sum the last N rows of a daily series. For metrics where weekly/monthly
// aren't period-native (rare here), this is the fallback.
const sumLastN = (block: any, n: number): number | null => {
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const types: any[] | undefined = block?.types;
  const usdIdx = Array.isArray(types)
    ? types.findIndex((t) => String(t).toLowerCase() === 'usd')
    : -1;
  const valueIdx = usdIdx >= 0 ? usdIdx : 1;
  const slice = data.slice(Math.max(0, data.length - n));
  let s = 0;
  let any = false;
  for (const row of slice) {
    if (!Array.isArray(row) || row.length <= valueIdx) continue;
    const v = row[valueIdx];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
      s += v;
      any = true;
    }
  }
  return any ? s : null;
};

const fetchChainMetric = async (
  chainKey: string,
  metricSlug: string,
): Promise<{
  daily?: any;
  weekly?: any;
  monthly?: any;
} | null> => {
  const url = `https://api.growthepie.com/v1/metrics/chains/${chainKey}/${metricSlug}.json`;
  const json = await fetchJsonSoft(url);
  if (!json) return null;
  const ts = json?.data?.details?.timeseries ?? json?.details?.timeseries;
  if (!ts) return null;
  return { daily: ts.daily, weekly: ts.weekly, monthly: ts.monthly };
};

const readChainMeta = (
  chains: Record<string, any>,
  key: string,
): ChainHeadToHeadSideMeta => {
  const c = chains[key] ?? {};
  // Surface common variants of "rollup stack" / "rollup type" since
  // master.json fields have changed naming over time. Fall through to the
  // first one that returns a non-empty string.
  const stack: string | null =
    c.rollup_type ?? c.tech_stack ?? c.stack ?? c.rollup ?? c.type ?? null;
  // Launch date may live as `launch_date`, `mainnet_launch`, or inside an
  // events object. Be defensive.
  let launchDate: string | null = null;
  const candidates: any[] = [
    c.launch_date,
    c.mainnet_launch,
    c.launched_on,
    c.events?.mainnet_launch,
    c.events?.launch,
  ];
  for (const v of candidates) {
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
      launchDate = v.slice(0, 10);
      break;
    }
  }
  return {
    key,
    name: c.name ?? key,
    urlKey: c.url_key ?? key.replace(/_/g, '-'),
    launchDate,
    stack: typeof stack === 'string' && stack.length > 0 ? stack : null,
    daLayer: typeof c.da_layer === 'string' && c.da_layer.length > 0 ? c.da_layer : null,
    nativeToken:
      typeof c.symbol === 'string' && c.symbol.length > 0
        ? c.symbol
        : typeof c.token === 'string' && c.token.length > 0
          ? c.token
          : null,
  };
};

// ---------------------------------------------------------------------------
// Formatting helpers (declared up-top so the compute block can use them)
// ---------------------------------------------------------------------------

const fmtCount = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return 'unavailable';
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  if (Math.abs(n) >= 10) return n.toFixed(0);
  return n.toFixed(2);
};

const fmtUsd = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return 'unavailable';
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'k';
  return '$' + n.toFixed(2);
};

const fmtThroughput = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return 'unavailable';
  if (n >= 100) return n.toFixed(0) + ' Mgas/s';
  if (n >= 10) return n.toFixed(1) + ' Mgas/s';
  return n.toFixed(2) + ' Mgas/s';
};

const fmtMultiple = (n: number | null): string => {
  if (n == null || !Number.isFinite(n) || n <= 0) return '—';
  if (n >= 100) return n.toFixed(0) + '×';
  if (n >= 10) return n.toFixed(1) + '×';
  return n.toFixed(2) + '×';
};

const decideWinner = (
  a: number | null,
  b: number | null,
): { winner: 'a' | 'b' | 'tie' | null; multiple: number | null } => {
  if (a == null && b == null) return { winner: null, multiple: null };
  if (a == null) return { winner: 'b', multiple: null };
  if (b == null) return { winner: 'a', multiple: null };
  if (a === b) return { winner: 'tie', multiple: 1 };
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  const multiple = lo > 0 ? hi / lo : null;
  return { winner: a > b ? 'a' : 'b', multiple };
};

const formatterFor = (
  key: HeadToHeadMetricKey,
): ((n: number | null) => string) => {
  if (key.startsWith('throughput_')) return fmtThroughput;
  if (
    key === 'tvl_latest' ||
    key === 'stables_mcap_latest' ||
    key === 'fees_30d' ||
    key === 'profit_30d'
  )
    return fmtUsd;
  return fmtCount;
};

const labelFor = (
  key: HeadToHeadMetricKey,
): { label: string } => {
  switch (key) {
    case 'txcount_daily':
      return { label: 'Daily transactions' };
    case 'txcount_weekly':
      return { label: 'Weekly transactions' };
    case 'txcount_monthly':
      return { label: 'Monthly transactions' };
    case 'daa_daily':
      return { label: 'Daily active addresses' };
    case 'daa_weekly':
      return { label: 'Weekly active addresses (unique)' };
    case 'daa_monthly':
      return { label: 'Monthly active addresses (unique)' };
    case 'throughput_daily':
      return { label: 'Daily throughput (Mgas/s)' };
    case 'throughput_weekly':
      return { label: 'Weekly throughput (Mgas/s)' };
    case 'throughput_monthly':
      return { label: 'Monthly throughput (Mgas/s)' };
    case 'tvl_latest':
      return { label: 'Total Value Locked (latest)' };
    case 'stables_mcap_latest':
      return { label: 'Stablecoin market cap (latest)' };
    case 'fees_30d':
      return { label: 'User fees collected (30 days)' };
    case 'profit_30d':
      return { label: 'Profit / loss (30 days)' };
  }
};

const buildPairedMetric = (
  key: HeadToHeadMetricKey,
  a: number | null,
  b: number | null,
): HeadToHeadMetric => {
  const fmt = formatterFor(key);
  const { winner, multiple } = decideWinner(a, b);
  return {
    key,
    label: labelFor(key).label,
    winner,
    aValue: a,
    bValue: b,
    multiple,
    aDisplay: fmt(a),
    bDisplay: fmt(b),
  };
};

// ---------------------------------------------------------------------------
// Main compute
// ---------------------------------------------------------------------------

export const getChainHeadToHead = cache(
  async (aKey: string, bKey: string): Promise<ChainHeadToHead | null> => {
    let master: any;
    try {
      master = await fetchJson(MasterURL);
    } catch (err) {
      console.error('getChainHeadToHead: master fetch failed', err);
      return null;
    }
    const chains: Record<string, any> = master?.chains ?? {};
    const aMeta = readChainMeta(chains, aKey);
    const bMeta = readChainMeta(chains, bKey);

    // Fetch every needed metric for both chains in parallel.
    const metricSlugs: { slug: string; tag: 'txcount' | 'daa' | 'throughput' | 'tvl' | 'stables_mcap' | 'fees' | 'profit' }[] = [
      { slug: 'txcount', tag: 'txcount' },
      { slug: 'daa', tag: 'daa' },
      { slug: 'throughput', tag: 'throughput' },
      { slug: 'tvl', tag: 'tvl' },
      { slug: 'stables_mcap', tag: 'stables_mcap' },
      { slug: 'fees', tag: 'fees' },
      { slug: 'profit', tag: 'profit' },
    ];

    const allFetches = await Promise.all(
      [aKey, bKey].flatMap((chain) =>
        metricSlugs.map((m) =>
          fetchChainMetric(chain, m.slug).then((data) => ({ chain, tag: m.tag, data })),
        ),
      ),
    );

    const byChain: Record<
      string,
      Record<string, { daily?: any; weekly?: any; monthly?: any } | null>
    > = { [aKey]: {}, [bKey]: {} };
    for (const r of allFetches) {
      byChain[r.chain][r.tag] = r.data;
    }

    const pickPeriod = (
      chain: string,
      tag: string,
      period: 'daily' | 'weekly' | 'monthly',
    ): number | null => {
      const m = byChain[chain]?.[tag];
      if (!m) return null;
      const block = period === 'daily' ? m.daily : period === 'weekly' ? m.weekly : m.monthly;
      return pickValueAtPeriod(block, period);
    };

    const sum30dDailyUsd = (chain: string, tag: string): number | null => {
      const m = byChain[chain]?.[tag];
      if (!m) return null;
      return sumLastN(m.daily, 30);
    };

    const metrics: HeadToHeadMetric[] = [
      buildPairedMetric(
        'txcount_daily',
        pickPeriod(aKey, 'txcount', 'daily'),
        pickPeriod(bKey, 'txcount', 'daily'),
      ),
      buildPairedMetric(
        'txcount_weekly',
        pickPeriod(aKey, 'txcount', 'weekly'),
        pickPeriod(bKey, 'txcount', 'weekly'),
      ),
      buildPairedMetric(
        'txcount_monthly',
        pickPeriod(aKey, 'txcount', 'monthly'),
        pickPeriod(bKey, 'txcount', 'monthly'),
      ),
      buildPairedMetric(
        'daa_daily',
        pickPeriod(aKey, 'daa', 'daily'),
        pickPeriod(bKey, 'daa', 'daily'),
      ),
      buildPairedMetric(
        'daa_weekly',
        pickPeriod(aKey, 'daa', 'weekly'),
        pickPeriod(bKey, 'daa', 'weekly'),
      ),
      buildPairedMetric(
        'daa_monthly',
        pickPeriod(aKey, 'daa', 'monthly'),
        pickPeriod(bKey, 'daa', 'monthly'),
      ),
      buildPairedMetric(
        'throughput_daily',
        pickPeriod(aKey, 'throughput', 'daily'),
        pickPeriod(bKey, 'throughput', 'daily'),
      ),
      buildPairedMetric(
        'throughput_weekly',
        pickPeriod(aKey, 'throughput', 'weekly'),
        pickPeriod(bKey, 'throughput', 'weekly'),
      ),
      buildPairedMetric(
        'throughput_monthly',
        pickPeriod(aKey, 'throughput', 'monthly'),
        pickPeriod(bKey, 'throughput', 'monthly'),
      ),
      buildPairedMetric(
        'tvl_latest',
        pickPeriod(aKey, 'tvl', 'daily'),
        pickPeriod(bKey, 'tvl', 'daily'),
      ),
      buildPairedMetric(
        'stables_mcap_latest',
        pickPeriod(aKey, 'stables_mcap', 'daily'),
        pickPeriod(bKey, 'stables_mcap', 'daily'),
      ),
      buildPairedMetric(
        'fees_30d',
        sum30dDailyUsd(aKey, 'fees'),
        sum30dDailyUsd(bKey, 'fees'),
      ),
      buildPairedMetric(
        'profit_30d',
        sum30dDailyUsd(aKey, 'profit'),
        sum30dDailyUsd(bKey, 'profit'),
      ),
    ];

    let aWinCount = 0;
    let bWinCount = 0;
    for (const m of metrics) {
      if (m.winner === 'a') aWinCount += 1;
      else if (m.winner === 'b') bWinCount += 1;
    }
    const overallWinner: 'a' | 'b' | 'tie' | null =
      aWinCount === 0 && bWinCount === 0
        ? null
        : aWinCount === bWinCount
          ? 'tie'
          : aWinCount > bWinCount
            ? 'a'
            : 'b';

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      a: aMeta,
      b: bMeta,
      metrics,
      aWinCount,
      bWinCount,
      overallWinner,
    };
  },
);

// Stable wrappers for each known pair so the caller doesn't have to know
// which chain key goes on which side. Order matters for table layout —
// "side A" is always the first one named in the page.
export const getBaseVsArbitrum = cache(
  async (): Promise<ChainHeadToHead | null> => getChainHeadToHead('base', 'arbitrum'),
);

// ---------------------------------------------------------------------------
// Lookup + formatting for the answer page
// ---------------------------------------------------------------------------

const findMetric = (
  data: ChainHeadToHead,
  key: HeadToHeadMetricKey,
): HeadToHeadMetric | undefined => data.metrics.find((m) => m.key === key);

export const formatSideValue = (
  data: ChainHeadToHead,
  side: 'a' | 'b',
  key: HeadToHeadMetricKey,
): string => {
  const m = findMetric(data, key);
  if (!m) return 'unavailable';
  return side === 'a' ? m.aDisplay : m.bDisplay;
};

export const formatWinnerName = (
  data: ChainHeadToHead,
  key: HeadToHeadMetricKey,
): string => {
  const m = findMetric(data, key);
  if (!m || m.winner == null) return 'unavailable';
  if (m.winner === 'tie') return 'tied';
  return m.winner === 'a' ? data.a.name : data.b.name;
};

export const formatMultiple = (
  data: ChainHeadToHead,
  key: HeadToHeadMetricKey,
): string => {
  const m = findMetric(data, key);
  return fmtMultiple(m?.multiple ?? null);
};

export const formatOverallWinnerName = (data: ChainHeadToHead): string => {
  if (data.overallWinner === 'a') return data.a.name;
  if (data.overallWinner === 'b') return data.b.name;
  if (data.overallWinner === 'tie') return 'tied across metrics';
  return 'unavailable';
};

// Build a self-contained "X leads on N of M metrics" prose phrase, suitable
// for the AI-quotable headline.
export const buildHeadToHeadHeadline = (
  data: ChainHeadToHead,
  dataDateUtc: string,
): string => {
  const total = data.metrics.length;
  const aName = data.a.name;
  const bName = data.b.name;
  if (data.aWinCount === 0 && data.bWinCount === 0) {
    return `**${aName} vs ${bName}** (data ${dataDateUtc} UTC): head-to-head data currently unavailable.`;
  }
  if (data.overallWinner === 'tie') {
    return `As of ${dataDateUtc} UTC, ${aName} and ${bName} are **tied** ${data.aWinCount}–${data.bWinCount} across the ${total} headline metrics tracked here — different chains lead on different dimensions.`;
  }
  const leader = data.overallWinner === 'a' ? aName : bName;
  return `As of ${dataDateUtc} UTC, **${leader}** leads ${aName} vs ${bName} **${data.aWinCount}–${data.bWinCount}** across the ${total} headline metrics tracked here, but several individual metrics go the other way — see the table below.`;
};

// Per-metric one-line prose used for FAQ answers.
export const buildMetricPhrase = (
  data: ChainHeadToHead,
  key: HeadToHeadMetricKey,
): string => {
  const m = findMetric(data, key);
  if (!m) return 'unavailable';
  if (m.winner == null) return 'unavailable for this metric';
  if (m.winner === 'tie')
    return `${data.a.name} and ${data.b.name} are tied at ${m.aDisplay}`;
  const leader = m.winner === 'a' ? data.a.name : data.b.name;
  const trailer = m.winner === 'a' ? data.b.name : data.a.name;
  const leaderVal = m.winner === 'a' ? m.aDisplay : m.bDisplay;
  const trailerVal = m.winner === 'a' ? m.bDisplay : m.aDisplay;
  const mult = m.multiple != null ? ` (${fmtMultiple(m.multiple)} ${leader}/${trailer})` : '';
  return `${leader} leads at ${leaderVal} vs ${trailerVal} on ${trailer}${mult}`;
};

export const formatChainMeta = (
  data: ChainHeadToHead,
  side: 'a' | 'b',
  field: 'launchDate' | 'stack' | 'daLayer' | 'nativeToken',
): string => {
  const m = side === 'a' ? data.a : data.b;
  const v = m[field];
  if (v == null || v === '') return 'unavailable';
  return v;
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildHeadToHeadAnswerTables = (
  data: ChainHeadToHead,
): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const winnerCell = (m: HeadToHeadMetric): string => {
    if (m.winner == null) return '—';
    if (m.winner === 'tie') return 'tied';
    return m.winner === 'a' ? data.a.name : data.b.name;
  };
  const comparison: AnswerTable = {
    title: `${data.a.name} vs ${data.b.name} — head-to-head metrics`,
    caption: `Side-by-side comparison across activity, value, and economics. "Lead × multiplier" shows how many times the leader's value exceeds the trailer's. Data: ${dataDate} UTC.`,
    headers: ['Metric', data.a.name, data.b.name, 'Leader', 'Lead × multiplier'],
    rows: data.metrics.map((m) => [
      m.label,
      m.aDisplay,
      m.bDisplay,
      winnerCell(m),
      fmtMultiple(m.multiple),
    ]),
  };
  const metadata: AnswerTable = {
    title: `${data.a.name} vs ${data.b.name} — chain metadata`,
    caption: `Architectural context — useful when the per-metric numbers don't tell the whole story. Source: growthepie master.json. Data: ${dataDate} UTC.`,
    headers: ['Attribute', data.a.name, data.b.name],
    rows: [
      [
        'Mainnet launch',
        formatChainMeta(data, 'a', 'launchDate'),
        formatChainMeta(data, 'b', 'launchDate'),
      ],
      [
        'Rollup stack',
        formatChainMeta(data, 'a', 'stack'),
        formatChainMeta(data, 'b', 'stack'),
      ],
      [
        'DA layer',
        formatChainMeta(data, 'a', 'daLayer'),
        formatChainMeta(data, 'b', 'daLayer'),
      ],
      [
        'Native token',
        formatChainMeta(data, 'a', 'nativeToken'),
        formatChainMeta(data, 'b', 'nativeToken'),
      ],
    ],
  };
  return [comparison, metadata];
};

export const buildHeadToHeadAcceptedAnswer = (
  data: ChainHeadToHead,
): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  if (data.aWinCount === 0 && data.bWinCount === 0) {
    return `${data.a.name} vs ${data.b.name} comparison data currently unavailable. See growthepie.com/chains/${data.a.urlKey} and growthepie.com/chains/${data.b.urlKey} for the live per-chain views.`;
  }
  const lead =
    data.overallWinner === 'tie'
      ? `${data.a.name} and ${data.b.name} are tied ${data.aWinCount}–${data.bWinCount} across the ${data.metrics.length} headline metrics tracked here`
      : `${data.overallWinner === 'a' ? data.a.name : data.b.name} leads ${data.a.name} vs ${data.b.name} ${data.aWinCount}–${data.bWinCount} across the ${data.metrics.length} headline metrics tracked here`;
  // Pick three of the most-quotable metrics for the prose body.
  const txDaily = findMetric(data, 'txcount_daily');
  const daaDaily = findMetric(data, 'daa_daily');
  const tvl = findMetric(data, 'tvl_latest');
  const lines: string[] = [];
  if (txDaily)
    lines.push(
      `Daily transactions: ${data.a.name} ${txDaily.aDisplay} vs ${data.b.name} ${txDaily.bDisplay}`,
    );
  if (daaDaily)
    lines.push(
      `Daily active addresses: ${data.a.name} ${daaDaily.aDisplay} vs ${data.b.name} ${daaDaily.bDisplay}`,
    );
  if (tvl)
    lines.push(
      `TVL: ${data.a.name} ${tvl.aDisplay} vs ${data.b.name} ${tvl.bDisplay}`,
    );
  const detail = lines.length > 0 ? ` ${lines.join('; ')}.` : '';
  return (
    `${lead} as of ${dataDate} UTC, with the lead reversed on individual metrics.${detail} Live per-chain views: growthepie.com/chains/${data.a.urlKey} and growthepie.com/chains/${data.b.urlKey}. Data: ${dataDate} UTC.`
  );
};
