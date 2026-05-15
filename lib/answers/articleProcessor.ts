// Per-request processor for /answers/[slug]. Mirrors the Quick Bite version
// but routes URLs and breadcrumbs under /answers, emits QAPage (not
// TechArticle) JSON-LD, raises the article-body ceiling for longer canonical
// answers, and omits dateModified/datePublished so answers read as evergreen.

import { cache } from 'react';
import { getAnswerBySlug } from './index';
import { processDynamicContent } from '@/lib/utils/dynamicContent';
import { processMarkdownContent } from '@/lib/utils/markdownParser';
import {
  generateJsonLdQAPage,
  generateJsonLdBreadcrumbs,
  generateJsonLdDatasetFromContent,
  computeArticleStats,
  extractStructuredProse,
  deriveAcceptedAnswer,
  ANSWER_BODY_CEILING,
  type ProseChunk,
} from '@/lib/quick-bites/seo_helper';
import type { ContentBlock } from '@/lib/types/blockTypes';
import type { QuickBiteData } from '@/lib/types/quickBites';
import {
  getL2UsageLeaderboard,
  buildAcceptedAnswer,
  buildAnswerTables,
  buildDenseSentence,
  formatLeaderEntry,
  formatTopList,
  formatPeriodTopList,
  formatPeriodLeader,
  type AnswerTable,
  type L2Leaderboard,
} from './computeL2Leaderboard';
import {
  getL2FeesLeaderboard,
  buildFeesAcceptedAnswer,
  buildFeesAnswerTables,
  buildHistoricalDenseSentence as buildFeesHistoricalDense,
  buildLiveDenseSentence as buildFeesLiveDense,
  formatLiveTopList as formatFeesLiveTopList,
  formatLiveLeader as formatFeesLiveLeader,
  formatPeriodTopList as formatFeesPeriodTopList,
  formatPeriodLeader as formatFeesPeriodLeader,
  type L2FeesLeaderboard,
} from './computeL2FeesLeaderboard';
import {
  getL2StablesLeaderboard,
  buildStablesAcceptedAnswer,
  buildStablesAnswerTables,
  buildDenseSentence as buildStablesDenseSentence,
  buildVarietyDenseSentence as buildStablesVarietyDense,
  formatPeriodTopList as formatStablesPeriodTopList,
  formatPeriodLeader as formatStablesPeriodLeader,
  formatVarietyTopList as formatStablesVarietyTopList,
  formatVarietyLeader as formatStablesVarietyLeader,
  type L2StablesLeaderboard,
} from './computeL2StablesLeaderboard';
import {
  getL2TxsEcosystem,
  buildTxsAcceptedAnswer,
  buildTxsAnswerTables,
  buildTxsDenseSentence,
  fmtTps as fmtTxsLiveTps,
  fmtCount as fmtTxsCount,
  formatContributorLeader as formatTxsContributorLeader,
  formatContributorTopList as formatTxsContributorTopList,
  type L2TxsEcosystem,
} from './computeL2TxsEcosystem';
import {
  getL2TopApps,
  buildTopAppsAcceptedAnswer,
  buildTopAppsAnswerTables,
  buildCategoryTop5Markdown as buildAppsCategoryTop5Md,
  formatLeader as formatAppLeader,
  formatTopList as formatAppTopList,
  type L2TopApps,
} from './computeL2TopApps';
import {
  getEthereumScaling,
  buildScalingAcceptedAnswer,
  buildScalingAnswerTables,
  buildScalingDense,
  buildYesHeadline as buildScalingYesHeadline,
  formatRatioPhrase as formatScalingRatioPhrase,
  type EthereumScalingComparison,
} from './computeEthereumScaling';
import { getSupportersProseList } from '@/lib/contributors';

const SECTION = 'answers';
const BREADCRUMB_LABEL = 'Answers';

export type ProcessedAnswer = {
  qb: QuickBiteData;
  initialQuickBite: QuickBiteData;
  processedContent: string[];
  initialContentBlocks: ContentBlock[];
  articleBody?: string;
  wordCount?: number;
  prose: ProseChunk[];
  acceptedAnswer: string;
  faq?: { q: string; a: string }[];
  schemas: any[];
  // Structured leaderboard tables rendered by AnswerRouteStaticShell as
  // real <table> elements so AI extractors (Perplexity, AIO, Copilot)
  // can lift them directly. Empty when the answer isn't leaderboard-driven.
  tables: AnswerTable[];
};

// Lookup table mapping slug → the kind of leaderboard that drives this
// answer's placeholders. Centralises the "this answer is data-driven by X"
// mapping so we don't sprinkle slug strings throughout the processor.
type LeaderboardKind =
  | 'l2-usage'
  | 'l2-fees'
  | 'l2-stables'
  | 'l2-txs'
  | 'l2-apps'
  | 'l2-scaling';
const LEADERBOARD_KIND_BY_SLUG: Record<string, LeaderboardKind> = {
  'most-used-ethereum-l2': 'l2-usage',
  'lowest-fee-ethereum-l2': 'l2-fees',
  'most-stablecoin-activity-ethereum-l2': 'l2-stables',
  'ethereum-l2-transaction-count': 'l2-txs',
  'top-apps-ethereum-l2s': 'l2-apps',
  'is-ethereum-scaling-through-l2s': 'l2-scaling',
};

// Tagged union so downstream callers can branch on `kind` without re-fetching
// or guessing which builder to call.
type LeaderboardData =
  | { kind: 'l2-usage'; lb: L2Leaderboard }
  | { kind: 'l2-fees'; lb: L2FeesLeaderboard }
  | { kind: 'l2-stables'; lb: L2StablesLeaderboard }
  | { kind: 'l2-txs'; lb: L2TxsEcosystem }
  | { kind: 'l2-apps'; lb: L2TopApps }
  | { kind: 'l2-scaling'; lb: EthereumScalingComparison };

// Build the placeholder dictionary derived from today's L2 usage leaderboard.
// Same dictionary is reused for content, FAQ answers, and FAQ JSON-LD so
// that what the visible UI quotes, what the static SEO shell renders, and
// what AI consumes in JSON-LD all agree.
const buildUsageReplacements = (
  lb: L2Leaderboard,
): Record<string, string> => {
  const tp = lb.byMetric.throughput;
  const tx = lb.byMetric.txcount;
  const daa = lb.byMetric.daa;
  const dataDate = lb.generatedAtIso.slice(0, 10);
  return {
    l2_universe_size: String(lb.universeSize),
    l2_universe_list: lb.universeKeys.join(', '),
    l2_excluded_sidechains:
      lb.excludedNonL2Keys.length > 0
        ? lb.excludedNonL2Keys.join(', ')
        : 'none',
    // Absolute UTC date the page data was generated for. Used in prose
    // and FAQ so cached AI answers stay attributable to a specific day.
    l2_data_date: dataDate,
    l2_throughput_leader: tp[0] ? formatLeaderEntry(tp[0], 'throughput') : 'unavailable',
    l2_throughput_top3: formatTopList(tp, 'throughput', 3),
    l2_throughput_top5: formatTopList(tp, 'throughput', 5),
    l2_txcount_leader: tx[0] ? formatLeaderEntry(tx[0], 'txcount') : 'unavailable',
    l2_txcount_top3: formatTopList(tx, 'txcount', 3),
    l2_txcount_top5: formatTopList(tx, 'txcount', 5),
    l2_daa_leader: daa[0] ? formatLeaderEntry(daa[0], 'daa') : 'unavailable',
    l2_daa_top3: formatTopList(daa, 'daa', 3),
    l2_daa_top5: formatTopList(daa, 'daa', 5),
    // Period-aware top-3 prose strings used by the SEO shell so AI
    // consumers see the weekly/monthly rankings.
    l2_throughput_daily_top3: formatPeriodTopList(lb, 'throughput', 'daily', 3),
    l2_throughput_weekly_top3: formatPeriodTopList(lb, 'throughput', 'weekly', 3),
    l2_throughput_monthly_top3: formatPeriodTopList(lb, 'throughput', 'monthly', 3),
    l2_txcount_daily_top3: formatPeriodTopList(lb, 'txcount', 'daily', 3),
    l2_txcount_weekly_top3: formatPeriodTopList(lb, 'txcount', 'weekly', 3),
    l2_txcount_monthly_top3: formatPeriodTopList(lb, 'txcount', 'monthly', 3),
    l2_daa_daily_top3: formatPeriodTopList(lb, 'daa', 'daily', 3),
    l2_daa_weekly_top3: formatPeriodTopList(lb, 'daa', 'weekly', 3),
    l2_daa_monthly_top3: formatPeriodTopList(lb, 'daa', 'monthly', 3),
    // Single-leader strings for FAQ answers that name one chain.
    l2_throughput_weekly_leader: formatPeriodLeader(lb, 'throughput', 'weekly'),
    l2_throughput_monthly_leader: formatPeriodLeader(lb, 'throughput', 'monthly'),
    l2_txcount_weekly_leader: formatPeriodLeader(lb, 'txcount', 'weekly'),
    l2_txcount_monthly_leader: formatPeriodLeader(lb, 'txcount', 'monthly'),
    l2_daa_weekly_leader: formatPeriodLeader(lb, 'daa', 'weekly'),
    l2_daa_monthly_leader: formatPeriodLeader(lb, 'daa', 'monthly'),
    // Dense quotable sentence per metric — replaces the three separate
    // daily / weekly / monthly bullet lines with one self-contained claim.
    l2_throughput_dense: buildDenseSentence(lb, 'throughput', dataDate),
    l2_txcount_dense: buildDenseSentence(lb, 'txcount', dataDate),
    l2_daa_dense: buildDenseSentence(lb, 'daa', dataDate),
  };
};

// Build the placeholder dictionary for the L2 fees answer page. Namespaced
// `l2_fee_*` so tokens can't collide with the `l2_*` usage tokens above.
const buildFeesReplacements = (
  lb: L2FeesLeaderboard,
): Record<string, string> => {
  const dataDate = lb.generatedAtIso.slice(0, 10);
  return {
    l2_fee_data_date: dataDate,
    l2_fee_universe_size: String(lb.universeSize),
    l2_fee_universe_list: lb.universeKeys.join(', '),
    l2_fee_excluded_sidechains:
      lb.excludedNonL2Keys.length > 0
        ? lb.excludedNonL2Keys.join(', ')
        : 'none',
    // Single-leader strings for FAQ answers that name one chain.
    l2_fee_median_daily_leader: formatFeesPeriodLeader(lb, 'daily'),
    l2_fee_median_weekly_leader: formatFeesPeriodLeader(lb, 'weekly'),
    l2_fee_median_monthly_leader: formatFeesPeriodLeader(lb, 'monthly'),
    l2_fee_median_live_leader: formatFeesLiveLeader(lb, 'median'),
    l2_fee_transfer_live_leader: formatFeesLiveLeader(lb, 'transfer'),
    l2_fee_swap_live_leader: formatFeesLiveLeader(lb, 'swap'),
    l2_fee_avg_live_leader: formatFeesLiveLeader(lb, 'avg'),
    // Top-3 prose strings — historical (period) and live (fee type).
    l2_fee_median_daily_top3: formatFeesPeriodTopList(lb, 'daily', 3),
    l2_fee_median_weekly_top3: formatFeesPeriodTopList(lb, 'weekly', 3),
    l2_fee_median_monthly_top3: formatFeesPeriodTopList(lb, 'monthly', 3),
    l2_fee_median_live_top3: formatFeesLiveTopList(lb, 'median', 3),
    l2_fee_transfer_live_top3: formatFeesLiveTopList(lb, 'transfer', 3),
    l2_fee_swap_live_top3: formatFeesLiveTopList(lb, 'swap', 3),
    l2_fee_avg_live_top3: formatFeesLiveTopList(lb, 'avg', 3),
    // Dense quotable sentences — one for the live cross-metric view, one
    // for the historical median-fee view.
    l2_fee_live_dense: buildFeesLiveDense(lb, dataDate),
    l2_fee_historical_dense: buildFeesHistoricalDense(lb, dataDate),
  };
};

// Build the placeholder dictionary for the L2 stablecoin-activity answer
// page. Namespaced `l2_stables_*` so tokens can't collide with `l2_*` or
// `l2_fee_*`.
const buildStablesReplacements = (
  lb: L2StablesLeaderboard,
): Record<string, string> => {
  const dataDate = lb.generatedAtIso.slice(0, 10);
  return {
    l2_stables_data_date: dataDate,
    l2_stables_universe_size: String(lb.universeSize),
    l2_stables_universe_list: lb.universeKeys.join(', '),
    l2_stables_excluded_sidechains:
      lb.excludedNonL2Keys.length > 0
        ? lb.excludedNonL2Keys.join(', ')
        : 'none',
    // Per-metric single-leader strings (FAQ answers that name one chain).
    l2_stables_supply_daily_leader: formatStablesPeriodLeader(lb, 'supply', 'daily'),
    l2_stables_supply_weekly_leader: formatStablesPeriodLeader(lb, 'supply', 'weekly'),
    l2_stables_supply_monthly_leader: formatStablesPeriodLeader(lb, 'supply', 'monthly'),
    l2_stables_txcount_daily_leader: formatStablesPeriodLeader(lb, 'txcount', 'daily'),
    l2_stables_txcount_weekly_leader: formatStablesPeriodLeader(lb, 'txcount', 'weekly'),
    l2_stables_txcount_monthly_leader: formatStablesPeriodLeader(lb, 'txcount', 'monthly'),
    l2_stables_gas_spent_daily_leader: formatStablesPeriodLeader(lb, 'gas_spent', 'daily'),
    l2_stables_gas_spent_weekly_leader: formatStablesPeriodLeader(lb, 'gas_spent', 'weekly'),
    l2_stables_gas_spent_monthly_leader: formatStablesPeriodLeader(lb, 'gas_spent', 'monthly'),
    l2_stables_variety_leader: formatStablesVarietyLeader(lb),
    // Per-(metric, period) top-3 prose strings.
    l2_stables_supply_daily_top3: formatStablesPeriodTopList(lb, 'supply', 'daily', 3),
    l2_stables_supply_weekly_top3: formatStablesPeriodTopList(lb, 'supply', 'weekly', 3),
    l2_stables_supply_monthly_top3: formatStablesPeriodTopList(lb, 'supply', 'monthly', 3),
    l2_stables_txcount_daily_top3: formatStablesPeriodTopList(lb, 'txcount', 'daily', 3),
    l2_stables_txcount_weekly_top3: formatStablesPeriodTopList(lb, 'txcount', 'weekly', 3),
    l2_stables_txcount_monthly_top3: formatStablesPeriodTopList(lb, 'txcount', 'monthly', 3),
    l2_stables_gas_spent_daily_top3: formatStablesPeriodTopList(lb, 'gas_spent', 'daily', 3),
    l2_stables_gas_spent_weekly_top3: formatStablesPeriodTopList(lb, 'gas_spent', 'weekly', 3),
    l2_stables_gas_spent_monthly_top3: formatStablesPeriodTopList(lb, 'gas_spent', 'monthly', 3),
    l2_stables_variety_top3: formatStablesVarietyTopList(lb, 3),
    // Dense quotable sentences — one per metric, plus one for variety.
    l2_stables_supply_dense: buildStablesDenseSentence(lb, 'supply', dataDate),
    l2_stables_txcount_dense: buildStablesDenseSentence(lb, 'txcount', dataDate),
    l2_stables_gas_spent_dense: buildStablesDenseSentence(lb, 'gas_spent', dataDate),
    l2_stables_variety_dense: buildStablesVarietyDense(lb, dataDate),
  };
};

// Build the placeholder dictionary for the L2 ecosystem-transactions answer
// page. Namespaced `l2_txs_*`. Unlike the other leaderboards this page
// quotes ecosystem totals rather than rankings, so most placeholders are
// scalar strings.
const buildTxsReplacements = (
  data: L2TxsEcosystem,
): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_txs_data_date: dataDate,
    l2_txs_universe_size: String(data.universeSize),
    l2_txs_universe_list: data.universeKeys.join(', '),
    l2_txs_excluded_sidechains:
      data.excludedNonL2Keys.length > 0
        ? data.excludedNonL2Keys.join(', ')
        : 'none',
    // Headline scalars.
    l2_txs_live_tps: fmtTxsLiveTps(data.liveTps),
    l2_txs_daily: fmtTxsCount(data.daily),
    l2_txs_weekly: fmtTxsCount(data.weekly),
    l2_txs_monthly: fmtTxsCount(data.monthly),
    l2_txs_all_time: fmtTxsCount(data.allTime),
    // Top contributor strings.
    l2_txs_top_contributor: formatTxsContributorLeader(data),
    l2_txs_top_contributors_top3: formatTxsContributorTopList(data, 3),
    // Dense quotable sentence collapsing live + daily/weekly/monthly/all-time.
    l2_txs_dense: buildTxsDenseSentence(data, dataDate),
  };
};

// Build the placeholder dictionary for the L2 top-apps answer page.
// Namespaced `l2_apps_*` so tokens can't collide with `l2_*`, `l2_fee_*`,
// `l2_stables_*`, or `l2_txs_*`. The category top-5 is rendered as
// pre-formatted markdown (one section per category) and substituted whole
// — categories are dynamic so we can't enumerate placeholders per category.
const buildAppsReplacements = (
  data: L2TopApps,
): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_apps_data_date: dataDate,
    l2_apps_window: data.window,
    l2_apps_window_label: data.windowLabel,
    l2_apps_universe_size: String(data.universeSize),
    l2_apps_universe_list: data.universeKeys.join(', '),
    l2_apps_excluded_sidechains:
      data.excludedNonL2Keys.length > 0
        ? data.excludedNonL2Keys.join(', ')
        : 'none',
    // Single-leader strings (FAQ answers that name one app).
    l2_apps_leader_txcount: formatAppLeader(data.topByTxcount, 'txcount'),
    l2_apps_leader_daa: formatAppLeader(data.topByDaa, 'daa'),
    l2_apps_leader_gas_fees: formatAppLeader(
      data.topByGasFees,
      'gas_fees_usd',
    ),
    // Top-10 prose lists.
    l2_apps_top10_txcount: formatAppTopList(data.topByTxcount, 'txcount', 10),
    l2_apps_top10_daa: formatAppTopList(data.topByDaa, 'daa', 10),
    l2_apps_top10_gas_fees: formatAppTopList(
      data.topByGasFees,
      'gas_fees_usd',
      10,
    ),
    // Per-category top-5 as pre-formatted markdown — substituted into the
    // body where `{{l2_apps_category_top5_md}}` appears.
    l2_apps_category_top5_md: buildAppsCategoryTop5Md(data),
  };
};

// Build the placeholder dictionary for the L2 scaling-comparison answer
// page. Namespaced `l2_scale_*` so tokens can't collide with the other five
// namespaces in use.
const buildScalingReplacements = (
  data: EthereumScalingComparison,
): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_scale_data_date: dataDate,
    l2_scale_universe_size: String(data.universeSize),
    l2_scale_universe_list: data.universeKeys.join(', '),
    l2_scale_excluded_sidechains:
      data.excludedNonL2Keys.length > 0
        ? data.excludedNonL2Keys.join(', ')
        : 'none',
    // Headline "yes, by this much" sentence.
    l2_scale_yes_headline: buildScalingYesHeadline(data, dataDate),
    // Per-metric dense sentences.
    l2_scale_txcount_dense: buildScalingDense(data, 'txcount', dataDate),
    l2_scale_throughput_dense: buildScalingDense(data, 'throughput', dataDate),
    // Per-(metric, period) ratio phrases — used in bullets and FAQ answers
    // so each window's L2 vs L1 claim can stand on its own.
    l2_scale_txcount_daily_phrase: formatScalingRatioPhrase(
      'txcount',
      'daily',
      data.byMetric.txcount.daily,
    ),
    l2_scale_txcount_weekly_phrase: formatScalingRatioPhrase(
      'txcount',
      'weekly',
      data.byMetric.txcount.weekly,
    ),
    l2_scale_txcount_monthly_phrase: formatScalingRatioPhrase(
      'txcount',
      'monthly',
      data.byMetric.txcount.monthly,
    ),
    l2_scale_throughput_daily_phrase: formatScalingRatioPhrase(
      'throughput',
      'daily',
      data.byMetric.throughput.daily,
    ),
    l2_scale_throughput_weekly_phrase: formatScalingRatioPhrase(
      'throughput',
      'weekly',
      data.byMetric.throughput.weekly,
    ),
    l2_scale_throughput_monthly_phrase: formatScalingRatioPhrase(
      'throughput',
      'monthly',
      data.byMetric.throughput.monthly,
    ),
  };
};

// Dispatch on leaderboard kind so processAnswer doesn't care which subtype
// it has.
const buildLeaderboardReplacements = (
  data: LeaderboardData,
): Record<string, string> => {
  switch (data.kind) {
    case 'l2-usage':
      return buildUsageReplacements(data.lb);
    case 'l2-fees':
      return buildFeesReplacements(data.lb);
    case 'l2-stables':
      return buildStablesReplacements(data.lb);
    case 'l2-txs':
      return buildTxsReplacements(data.lb);
    case 'l2-apps':
      return buildAppsReplacements(data.lb);
    case 'l2-scaling':
      return buildScalingReplacements(data.lb);
  }
};

// Site-wide placeholders that don't depend on per-page data. Synced from
// canonical sources (e.g. `Supporters` in lib/contributors) so edits there
// flow into every answer page's prose automatically.
const buildSiteReplacements = (): Record<string, string> => ({
  gtp_supporters: getSupportersProseList(),
});

const substitute = (s: string, repl: Record<string, string>): string =>
  s.replace(/\{\{((?:l2|gtp)_[a-z0-9_]+)\}\}/g, (_, name) =>
    Object.prototype.hasOwnProperty.call(repl, name) ? repl[name] : `{{${name}}}`,
  );

const applyPlaceholders = (
  content: string[],
  data: LeaderboardData | null,
): string[] => {
  const repl: Record<string, string> = {
    ...buildSiteReplacements(),
    ...(data ? buildLeaderboardReplacements(data) : {}),
  };
  return content.map((block) =>
    typeof block === 'string' ? substitute(block, repl) : block,
  );
};

// Substitute placeholders inside the FAQ JSON-LD that was generated at module
// load time (before live data was available). Mutates a shallow copy so the
// editor-side `faqItems` export remains untouched.
const applyLeaderboardToFaqJsonLd = (
  faqJsonLd: any,
  data: LeaderboardData | null,
): any => {
  if (!faqJsonLd || typeof faqJsonLd !== 'object') return faqJsonLd;
  const repl: Record<string, string> = {
    ...buildSiteReplacements(),
    ...(data ? buildLeaderboardReplacements(data) : {}),
  };
  const mainEntity = Array.isArray(faqJsonLd.mainEntity)
    ? faqJsonLd.mainEntity.map((q: any) => ({
        ...q,
        name: typeof q?.name === 'string' ? substitute(q.name, repl) : q?.name,
        acceptedAnswer:
          q?.acceptedAnswer && typeof q.acceptedAnswer === 'object'
            ? {
                ...q.acceptedAnswer,
                text:
                  typeof q.acceptedAnswer.text === 'string'
                    ? substitute(q.acceptedAnswer.text, repl)
                    : q.acceptedAnswer.text,
              }
            : q?.acceptedAnswer,
      }))
    : faqJsonLd.mainEntity;
  return { ...faqJsonLd, mainEntity };
};

const applyLeaderboardToFaq = (
  faq: { q: string; a: string }[] | undefined,
  data: LeaderboardData | null,
): { q: string; a: string }[] | undefined => {
  if (!faq) return faq;
  const repl: Record<string, string> = {
    ...buildSiteReplacements(),
    ...(data ? buildLeaderboardReplacements(data) : {}),
  };
  return faq.map((item) => ({
    q: substitute(item.q, repl),
    a: substitute(item.a, repl),
  }));
};

export const processAnswer = cache(
  async (slug: string): Promise<ProcessedAnswer | null> => {
    const qb = getAnswerBySlug(slug);
    if (!qb) return null;

    let processedContent: string[] = qb.content;
    let initialContentBlocks: ContentBlock[] = [];
    let articleBody: string | undefined;
    let wordCount: number | undefined;

    // Pull the live leaderboard before content processing so placeholders are
    // substituted with current values, the same way Mustache placeholders for
    // chart data are. Failures fall through silently — the page will still
    // render, just with `{{l2_*}}` tokens visible (which is a clear signal
    // to the editor that something upstream broke).
    const leaderboardKind: LeaderboardKind | undefined =
      LEADERBOARD_KIND_BY_SLUG[slug];
    let leaderboardData: LeaderboardData | null = null;
    if (leaderboardKind === 'l2-usage') {
      const lb = await getL2UsageLeaderboard();
      if (lb) leaderboardData = { kind: 'l2-usage', lb };
    } else if (leaderboardKind === 'l2-fees') {
      const lb = await getL2FeesLeaderboard();
      if (lb) leaderboardData = { kind: 'l2-fees', lb };
    } else if (leaderboardKind === 'l2-stables') {
      const lb = await getL2StablesLeaderboard();
      if (lb) leaderboardData = { kind: 'l2-stables', lb };
    } else if (leaderboardKind === 'l2-txs') {
      const lb = await getL2TxsEcosystem();
      if (lb) leaderboardData = { kind: 'l2-txs', lb };
    } else if (leaderboardKind === 'l2-apps') {
      const lb = await getL2TopApps();
      if (lb) leaderboardData = { kind: 'l2-apps', lb };
    } else if (leaderboardKind === 'l2-scaling') {
      const lb = await getEthereumScaling();
      if (lb) leaderboardData = { kind: 'l2-scaling', lb };
    }

    try {
      // Always apply site-wide placeholders (e.g. {{gtp_supporters}}) so
      // every answer page benefits, regardless of whether it's leaderboard-
      // driven. Leaderboard replacements are merged in when available.
      const rawContent = applyPlaceholders(qb.content, leaderboardData);
      processedContent = await processDynamicContent(rawContent);
      initialContentBlocks = await processMarkdownContent(processedContent);
      const stats = computeArticleStats(processedContent, ANSWER_BODY_CEILING);
      articleBody = stats.articleBody;
      wordCount = stats.wordCount;
    } catch (error) {
      console.error(`processAnswer failed for "${slug}":`, error);
    }

    const initialQuickBite: QuickBiteData = { ...qb, content: processedContent };
    const prose = extractStructuredProse(processedContent);
    // Prefer the live-data-derived answer when we have a leaderboard, falling
    // back to the editor-pinned `acceptedAnswer` field, then to the first
    // prose paragraph.
    const acceptedAnswer =
      leaderboardData?.kind === 'l2-usage'
        ? buildAcceptedAnswer(leaderboardData.lb)
        : leaderboardData?.kind === 'l2-fees'
          ? buildFeesAcceptedAnswer(leaderboardData.lb)
          : leaderboardData?.kind === 'l2-stables'
            ? buildStablesAcceptedAnswer(leaderboardData.lb)
            : leaderboardData?.kind === 'l2-txs'
              ? buildTxsAcceptedAnswer(leaderboardData.lb)
              : leaderboardData?.kind === 'l2-apps'
                ? buildTopAppsAcceptedAnswer(leaderboardData.lb)
                : leaderboardData?.kind === 'l2-scaling'
                  ? buildScalingAcceptedAnswer(leaderboardData.lb)
                  : deriveAcceptedAnswer(qb, prose);

    // The data backing every chart/dataset on an answer page refreshes daily
    // from growthepie's API, so stamp `dateModified` to today's UTC date.
    // Stable within a single UTC day so AI engines don't see a "modified just
    // now" timestamp every request (which can read as gamed). The
    // `datePublished` is the original authoring date from the data file.
    const todayUtcIso = `${new Date().toISOString().slice(0, 10)}T00:00:00Z`;

    const opts = {
      section: SECTION,
      breadcrumbLabel: BREADCRUMB_LABEL,
      language: 'en',
      articleBody,
      wordCount,
      dateModified: todayUtcIso,
    } as const;

    // Collect @ids from author-supplied Datasets so the QAPage can declare
    // `mentions` referencing them — ties the answer and its source datasets
    // into one connected graph node for AI knowledge-graph builders.
    const datasetMentions = (qb.jsonLdDatasets ?? [])
      .map((d: any) => (d && typeof d === 'object' && typeof d['@id'] === 'string' ? { '@id': d['@id'] } : null))
      .filter((m): m is { '@id': string } => m !== null);

    const jsonLdQAPage = generateJsonLdQAPage(slug, qb, {
      ...opts,
      acceptedAnswer,
      datePublished: qb.date,
      ...(datasetMentions.length > 0 ? { mentions: datasetMentions } : {}),
    });
    const jsonLdBreadcrumbs = generateJsonLdBreadcrumbs(slug, qb, opts);

    // Run both JSON-LD FAQ and visible FAQ through the placeholder layer
    // unconditionally so site-wide tokens (e.g. {{gtp_supporters}}) expand
    // even on answers that aren't leaderboard-driven.
    const jsonLdFaq = applyLeaderboardToFaqJsonLd(qb.jsonLdFaq, leaderboardData);
    let jsonLdDatasets: any[] = qb.jsonLdDatasets ?? [];
    const faq = applyLeaderboardToFaq(qb.faq, leaderboardData);

    // Stamp every Dataset with today's dateModified so AI consumers see the
    // underlying data as actively maintained. We also set creativeWorkStatus
    // and accrualPeriodicity to make the daily-refresh cadence explicit.
    jsonLdDatasets = jsonLdDatasets.map((d) =>
      d && typeof d === 'object'
        ? {
            dateModified: todayUtcIso,
            creativeWorkStatus: 'Published',
            // ISO 8601 duration: "P1D" = "every 1 day".
            // schema.org Dataset doesn't have a typed `accrualPeriodicity`
            // property but the field is widely consumed by data catalogs.
            accrualPeriodicity: 'P1D',
            ...d,
            // Don't let the spread above overwrite the stamped dateModified.
            ...(d.dateModified ? {} : { dateModified: todayUtcIso }),
          }
        : d,
    );

    if (jsonLdDatasets.length === 0) {
      const auto = generateJsonLdDatasetFromContent(slug, qb, processedContent, opts);
      if (auto) {
        jsonLdDatasets = [
          {
            ...auto,
            dateModified: todayUtcIso,
            creativeWorkStatus: 'Published',
            accrualPeriodicity: 'P1D',
          },
        ];
      }
    }

    const schemas: any[] = [
      jsonLdQAPage,
      jsonLdBreadcrumbs,
      ...(jsonLdFaq ? [jsonLdFaq] : []),
      ...jsonLdDatasets,
    ];

    const tables =
      leaderboardData?.kind === 'l2-usage'
        ? buildAnswerTables(leaderboardData.lb)
        : leaderboardData?.kind === 'l2-fees'
          ? buildFeesAnswerTables(leaderboardData.lb)
          : leaderboardData?.kind === 'l2-stables'
            ? buildStablesAnswerTables(leaderboardData.lb)
            : leaderboardData?.kind === 'l2-txs'
              ? buildTxsAnswerTables(leaderboardData.lb)
              : leaderboardData?.kind === 'l2-apps'
                ? buildTopAppsAnswerTables(leaderboardData.lb)
                : leaderboardData?.kind === 'l2-scaling'
                  ? buildScalingAnswerTables(leaderboardData.lb)
                  : [];

    return {
      qb,
      initialQuickBite,
      processedContent,
      initialContentBlocks,
      articleBody,
      wordCount,
      prose,
      acceptedAnswer,
      faq,
      schemas,
      tables,
    };
  },
);
