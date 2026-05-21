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
  buildShareAcceptedAnswer,
  buildShareAnswerTables,
  buildShareDenseSentence,
  buildShareHeadline,
  buildSharePhrase,
  formatL2SharePct,
  formatL1SharePct,
  type EthereumScalingComparison,
} from './computeEthereumScaling';
import {
  getL2Growth,
  buildGrowthAcceptedAnswer,
  buildGrowthAnswerTables,
  buildGrowthDense,
  formatLeader as formatGrowthLeader,
  formatTopList as formatGrowthTopList,
  type L2Growth,
} from './computeL2Growth';
import {
  getL2TvsRanking,
  buildTvsAcceptedAnswer,
  buildTvsAnswerTables,
  buildTvsDenseSentence,
  formatLeader as formatTvsLeader,
  formatTopList as formatTvsTopList,
  type L2TvsRanking,
} from './computeL2TvsRanking';
import {
  getL2Profit,
  buildProfitAcceptedAnswer,
  buildProfitAnswerTables,
  buildProfitDenseSentence,
  formatLeader30d as formatProfitLeader30d,
  formatTopList as formatProfitTopList,
  formatEcosystemTotal as formatProfitEcosystemTotal,
  type L2Profit,
} from './computeL2Profit';
import {
  getL2RentToMainnet,
  buildRentAcceptedAnswer,
  buildRentAnswerTables,
  buildRentDenseSentence,
  formatContributorLeader as formatRentContributorLeader,
  formatContributorTopList as formatRentContributorTopList,
  formatEcosystemTotal as formatRentEcosystemTotal,
  type L2RentToMainnet,
} from './computeL2RentToMainnet';
import {
  getL2Maturity,
  buildMaturityAcceptedAnswer,
  buildMaturityAnswerTables,
  buildMaturityGroupsMarkdown,
  formatGroupChains as formatMaturityGroupChains,
  countAtLevel as countMaturityAtLevel,
  type L2MaturityRanking,
} from './computeL2Maturity';
import {
  getL2Eip7702Activity,
  buildEip7702AcceptedAnswer,
  buildEip7702AnswerTables,
  buildEip7702DenseSentence,
  formatLeader as formatEip7702Leader,
  formatTopList as formatEip7702TopList,
  formatEthereumMainnet as formatEip7702EthereumMainnet,
  type L2Eip7702Activity,
} from './computeL2Eip7702';
import {
  getDefiL1VsL2,
  buildDefiAcceptedAnswer,
  buildDefiAnswerTables,
  buildDefiDenseSentence,
  formatEthereumSwapFee as formatDefiEthereumSwapFee,
  formatCheapestL2SwapFee as formatDefiCheapestL2SwapFee,
  formatCheapestL2SwapChain as formatDefiCheapestL2SwapChain,
  formatSwapMultiplier as formatDefiSwapMultiplier,
  buildSwapFeePhrase as buildDefiSwapFeePhrase,
  formatStablesL1 as formatDefiStablesL1,
  formatStablesL2 as formatDefiStablesL2,
  formatStablesL2Share,
  formatStablesRatio,
  formatL2ContributorTopList as formatDefiContributorTopList,
  type DefiL1VsL2,
} from './computeDefiL1VsL2';
import {
  getDaProviderComparison,
  buildDaAcceptedAnswer,
  buildDaProviderAnswerTables,
  buildDaDenseSentence,
  formatProviderFee as formatDaProviderFee,
  formatRatio as formatDaRatio,
  type DaProviderComparison,
} from './computeDaProviderComparison';
import {
  getDaLayerAdoption,
  buildAdoptionAcceptedAnswer,
  buildAdoptionAnswerTables,
  buildAdoptionDenseSentence,
  formatAdoptionLeader,
  formatAdoptionTopList,
  formatFees30dLeader,
  formatBucketCount,
  formatBucketFees,
  formatBucketL2List,
  formatBucketCostPerMb,
  type DaLayerAdoption,
} from './computeDaLayerAdoption';
import {
  getEthereumEcosystemTps,
  buildEcosystemTpsAcceptedAnswer,
  buildEcosystemTpsAnswerTables,
  buildEcosystemTpsDenseSentence,
  formatEcosystemLiveTps,
  formatL1LiveTps,
  formatL2LiveTps,
  formatCount as formatEcoCount,
  formatL2Share as formatEcoL2Share,
  type EthereumEcosystemTps,
} from './computeEthereumEcosystemTps';
import {
  getBaseVsArbitrum,
  buildHeadToHeadAcceptedAnswer,
  buildHeadToHeadAnswerTables,
  buildHeadToHeadHeadline,
  buildMetricPhrase as buildHeadToHeadMetricPhrase,
  formatSideValue as formatH2HSideValue,
  formatWinnerName as formatH2HWinnerName,
  formatMultiple as formatH2HMultiple,
  formatOverallWinnerName as formatH2HOverallWinnerName,
  formatChainMeta as formatH2HChainMeta,
  type ChainHeadToHead,
} from './computeChainHeadToHead';
import {
  getL2TokenMarketCap,
  buildL2TokenAcceptedAnswer,
  buildL2TokenAnswerTables,
  buildL2TokenDenseSentence,
  formatLeader as formatL2TokenLeader,
  formatTopList as formatL2TokenTopList,
  formatNoTokenList as formatL2TokenNoTokenList,
  formatEcosystemMarketCap,
  formatEcosystemFdv,
  formatLeaderName as formatL2TokenLeaderName,
  formatLeaderMarketCap as formatL2TokenLeaderMC,
  formatLeaderFdv as formatL2TokenLeaderFdv,
  formatRunnerUp as formatL2TokenRunnerUp,
  formatThirdPlace as formatL2TokenThirdPlace,
  type L2TokenMarketCap,
} from './computeL2TokenMarketCap';
import {
  getL2FeesTrend,
  buildTrendAcceptedAnswer,
  buildTrendAnswerTables,
  buildTrendDenseSentence,
  formatAnchorFee,
  formatAnchorMonth,
  formatPctChangeBetween,
  formatMultipleReduction,
  formatDirection,
  type L2FeesTrend,
} from './computeL2FeesTrend';
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
  | 'l2-scaling'
  | 'l2-growth'
  | 'l2-tvs'
  | 'l2-profit'
  | 'l2-rent'
  | 'l2-maturity'
  | 'l2-eip7702'
  | 'defi-l1-vs-l2'
  | 'da-providers'
  | 'da-adoption'
  | 'ethereum-ecosystem-tps'
  | 'l2-share'
  | 'base-vs-arbitrum'
  | 'l2-token-market-cap'
  | 'l2-fees-trend';
const LEADERBOARD_KIND_BY_SLUG: Record<string, LeaderboardKind> = {
  'most-used-ethereum-l2': 'l2-usage',
  'lowest-fee-ethereum-l2': 'l2-fees',
  'most-stablecoin-activity-ethereum-l2': 'l2-stables',
  'ethereum-l2-transaction-count': 'l2-txs',
  'top-apps-ethereum-l2s': 'l2-apps',
  'is-ethereum-scaling-through-l2s': 'l2-scaling',
  'fastest-growing-ethereum-l2': 'l2-growth',
  'most-value-secured-ethereum-l2': 'l2-tvs',
  'most-profitable-ethereum-l2': 'l2-profit',
  'ethereum-mainnet-revenue-from-l2s': 'l2-rent',
  'ethereum-l2-maturity-stages': 'l2-maturity',
  'most-smart-account-activity-ethereum-l2': 'l2-eip7702',
  'defi-l1-vs-l2': 'defi-l1-vs-l2',
  'what-is-data-availability': 'da-providers',
  'most-popular-da-layer-for-ethereum-l2s': 'da-adoption',
  'ethereum-ecosystem-tps': 'ethereum-ecosystem-tps',
  'percentage-of-ethereum-activity-on-l2s': 'l2-share',
  'base-vs-arbitrum': 'base-vs-arbitrum',
  'highest-market-cap-l2-token': 'l2-token-market-cap',
  'are-ethereum-l2-fees-getting-cheaper': 'l2-fees-trend',
};

// Tagged union so downstream callers can branch on `kind` without re-fetching
// or guessing which builder to call.
type LeaderboardData =
  | { kind: 'l2-usage'; lb: L2Leaderboard }
  | { kind: 'l2-fees'; lb: L2FeesLeaderboard }
  | { kind: 'l2-stables'; lb: L2StablesLeaderboard }
  | { kind: 'l2-txs'; lb: L2TxsEcosystem }
  | { kind: 'l2-growth'; lb: L2Growth }
  | { kind: 'l2-tvs'; lb: L2TvsRanking }
  | { kind: 'l2-profit'; lb: L2Profit }
  | { kind: 'l2-rent'; lb: L2RentToMainnet }
  | { kind: 'l2-maturity'; lb: L2MaturityRanking }
  | { kind: 'l2-eip7702'; lb: L2Eip7702Activity }
  | { kind: 'defi-l1-vs-l2'; lb: DefiL1VsL2 }
  | { kind: 'da-providers'; lb: DaProviderComparison }
  | { kind: 'da-adoption'; lb: DaLayerAdoption }
  | { kind: 'ethereum-ecosystem-tps'; lb: EthereumEcosystemTps }
  | { kind: 'l2-share'; lb: EthereumScalingComparison }
  | { kind: 'base-vs-arbitrum'; lb: ChainHeadToHead }
  | { kind: 'l2-token-market-cap'; lb: L2TokenMarketCap }
  | { kind: 'l2-fees-trend'; lb: L2FeesTrend }
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

// Build the placeholder dictionary for the L2 growth-rate answer page.
// Namespaced `l2_growth_*` so tokens can't collide with the other namespaces.
const buildGrowthReplacements = (
  data: L2Growth,
): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_growth_data_date: dataDate,
    l2_growth_universe_size: String(data.universeSize),
    l2_growth_universe_list: data.universeKeys.join(', '),
    l2_growth_excluded_sidechains:
      data.excludedNonL2Keys.length > 0
        ? data.excludedNonL2Keys.join(', ')
        : 'none',
    // Per-(metric, window) single-leader strings.
    l2_growth_throughput_monthly_leader: formatGrowthLeader(
      data.byMetricByWindow.throughput.monthly,
      'throughput',
    ),
    l2_growth_throughput_quarterly_leader: formatGrowthLeader(
      data.byMetricByWindow.throughput.quarterly,
      'throughput',
    ),
    l2_growth_txcount_monthly_leader: formatGrowthLeader(
      data.byMetricByWindow.txcount.monthly,
      'txcount',
    ),
    l2_growth_txcount_quarterly_leader: formatGrowthLeader(
      data.byMetricByWindow.txcount.quarterly,
      'txcount',
    ),
    l2_growth_daa_monthly_leader: formatGrowthLeader(
      data.byMetricByWindow.daa.monthly,
      'daa',
    ),
    l2_growth_daa_quarterly_leader: formatGrowthLeader(
      data.byMetricByWindow.daa.quarterly,
      'daa',
    ),
    l2_growth_tvl_monthly_leader: formatGrowthLeader(
      data.byMetricByWindow.tvl.monthly,
      'tvl',
    ),
    l2_growth_tvl_quarterly_leader: formatGrowthLeader(
      data.byMetricByWindow.tvl.quarterly,
      'tvl',
    ),
    // Per-(metric, window) top-3 prose strings.
    l2_growth_throughput_monthly_top3: formatGrowthTopList(
      data.byMetricByWindow.throughput.monthly,
      'throughput',
      3,
    ),
    l2_growth_throughput_quarterly_top3: formatGrowthTopList(
      data.byMetricByWindow.throughput.quarterly,
      'throughput',
      3,
    ),
    l2_growth_txcount_monthly_top3: formatGrowthTopList(
      data.byMetricByWindow.txcount.monthly,
      'txcount',
      3,
    ),
    l2_growth_txcount_quarterly_top3: formatGrowthTopList(
      data.byMetricByWindow.txcount.quarterly,
      'txcount',
      3,
    ),
    l2_growth_daa_monthly_top3: formatGrowthTopList(
      data.byMetricByWindow.daa.monthly,
      'daa',
      3,
    ),
    l2_growth_daa_quarterly_top3: formatGrowthTopList(
      data.byMetricByWindow.daa.quarterly,
      'daa',
      3,
    ),
    l2_growth_tvl_monthly_top3: formatGrowthTopList(
      data.byMetricByWindow.tvl.monthly,
      'tvl',
      3,
    ),
    l2_growth_tvl_quarterly_top3: formatGrowthTopList(
      data.byMetricByWindow.tvl.quarterly,
      'tvl',
      3,
    ),
    // Dense quotable sentences — one per window collapsing four metrics.
    l2_growth_monthly_dense: buildGrowthDense(data, 'monthly', dataDate),
    l2_growth_quarterly_dense: buildGrowthDense(data, 'quarterly', dataDate),
  };
};

// --- Placeholder builders for the six newer leaderboard kinds -------------

const buildTvsReplacements = (data: L2TvsRanking): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const fmtTotal = (n: number | null): string => {
    if (n == null || !Number.isFinite(n)) return '—';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'k';
    return '$' + n.toFixed(2);
  };
  return {
    l2_tvs_data_date: dataDate,
    l2_tvs_universe_size: String(data.universeSize),
    l2_tvs_universe_list: data.universeKeys.join(', '),
    l2_tvs_excluded_sidechains:
      data.excludedNonL2Keys.length > 0 ? data.excludedNonL2Keys.join(', ') : 'none',
    l2_tvs_leader: formatTvsLeader(data),
    l2_tvs_top10: formatTvsTopList(data, 10),
    l2_tvs_dense: buildTvsDenseSentence(data, dataDate),
    l2_tvs_ecosystem_total: fmtTotal(data.ecosystemTotalUsd),
  };
};

const buildProfitReplacements = (data: L2Profit): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_profit_data_date: dataDate,
    l2_profit_universe_size: String(data.universeSize),
    l2_profit_universe_list: data.universeKeys.join(', '),
    l2_profit_excluded_sidechains:
      data.excludedNonL2Keys.length > 0
        ? data.excludedNonL2Keys.join(', ')
        : 'none',
    l2_profit_leader_30d: formatProfitLeader30d(data),
    l2_profit_top10: formatProfitTopList(data, 10),
    l2_profit_dense: buildProfitDenseSentence(data, dataDate),
    l2_profit_ecosystem_30d: formatProfitEcosystemTotal(data, '30d'),
    l2_profit_ecosystem_90d: formatProfitEcosystemTotal(data, '90d'),
    l2_profit_ecosystem_alltime: formatProfitEcosystemTotal(data, 'allTime'),
  };
};

const buildRentReplacements = (data: L2RentToMainnet): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_rent_data_date: dataDate,
    l2_rent_universe_size: String(data.universeSize),
    l2_rent_universe_list: data.universeKeys.join(', '),
    l2_rent_excluded_sidechains:
      data.excludedNonL2Keys.length > 0 ? data.excludedNonL2Keys.join(', ') : 'none',
    l2_rent_daily: formatRentEcosystemTotal(data, 'daily'),
    l2_rent_30d: formatRentEcosystemTotal(data, '30d'),
    l2_rent_90d: formatRentEcosystemTotal(data, '90d'),
    l2_rent_alltime: formatRentEcosystemTotal(data, 'allTime'),
    l2_rent_top_contributor: formatRentContributorLeader(data),
    l2_rent_top_contributors_top3: formatRentContributorTopList(data, 3),
    l2_rent_dense: buildRentDenseSentence(data, dataDate),
  };
};

const buildMaturityReplacements = (
  data: L2MaturityRanking,
): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_mat_data_date: dataDate,
    l2_mat_universe_size: String(data.universeSize),
    l2_mat_universe_list: data.universeKeys.join(', '),
    l2_mat_excluded_sidechains:
      data.excludedNonL2Keys.length > 0 ? data.excludedNonL2Keys.join(', ') : 'none',
    l2_mat_maturing_chains: formatMaturityGroupChains(data, '3_maturing'),
    l2_mat_developing_chains: formatMaturityGroupChains(data, '2_developing'),
    l2_mat_emerging_chains: formatMaturityGroupChains(data, '1_emerging'),
    l2_mat_early_chains: formatMaturityGroupChains(data, '0_early_phase'),
    l2_mat_maturing_count: String(countMaturityAtLevel(data, '3_maturing')),
    l2_mat_developing_count: String(countMaturityAtLevel(data, '2_developing')),
    l2_mat_emerging_count: String(countMaturityAtLevel(data, '1_emerging')),
    l2_mat_early_count: String(countMaturityAtLevel(data, '0_early_phase')),
    l2_mat_groups_md: buildMaturityGroupsMarkdown(data),
  };
};

const buildEip7702Replacements = (
  data: L2Eip7702Activity,
): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_7702_data_date: dataDate,
    l2_7702_leader: formatEip7702Leader(data),
    l2_7702_top10: formatEip7702TopList(data, 10),
    l2_7702_ethereum: formatEip7702EthereumMainnet(data),
    l2_7702_dense: buildEip7702DenseSentence(data, dataDate),
  };
};

const buildDefiReplacements = (data: DefiL1VsL2): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const fmtCount = (n: number | null): string => {
    if (n == null || !Number.isFinite(n)) return 'unavailable';
    if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
    return Math.round(n).toString();
  };
  const fmtUsd = (n: number | null): string => {
    if (n == null || !Number.isFinite(n)) return 'unavailable';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'k';
    return '$' + n.toFixed(2);
  };
  const fmtShare = (n: number | null): string => {
    if (n == null || !Number.isFinite(n)) return '—';
    if (n >= 0.1) return (n * 100).toFixed(0) + '%';
    return (n * 100).toFixed(1) + '%';
  };
  return {
    l2_defi_data_date: dataDate,
    l2_defi_dense: buildDefiDenseSentence(data, dataDate),
    // L1 vs L2 finance-category activity (blockspace overview).
    l2_defi_l1_txs_30d: fmtCount(data.byWindow['30d']?.l1Txcount ?? null),
    l2_defi_l2_txs_30d: fmtCount(data.byWindow['30d']?.l2Txcount ?? null),
    l2_defi_l1_gas_30d: fmtUsd(data.byWindow['30d']?.l1GasFeesUsd ?? null),
    l2_defi_l2_gas_30d: fmtUsd(data.byWindow['30d']?.l2GasFeesUsd ?? null),
    l2_defi_l2_share_txs_30d: fmtShare(data.byWindow['30d']?.l2ShareTxcount ?? null),
    l2_defi_l2_share_gas_30d: fmtShare(data.byWindow['30d']?.l2ShareGasFeesUsd ?? null),
    l2_defi_top_l2s_30d: formatDefiContributorTopList(data, 5),
    // L1 vs L2 capital via stablecoin supply.
    l2_defi_stables_l1: formatDefiStablesL1(data),
    l2_defi_stables_l2: formatDefiStablesL2(data),
    l2_defi_stables_l2_share: formatStablesL2Share(data),
    l2_defi_stables_l2_vs_l1_ratio: formatStablesRatio(data),
    // Live swap-fee comparison.
    l2_defi_eth_swap_fee: formatDefiEthereumSwapFee(data),
    l2_defi_l2_swap_fee: formatDefiCheapestL2SwapFee(data),
    l2_defi_l2_swap_chain: formatDefiCheapestL2SwapChain(data),
    l2_defi_swap_multiplier: formatDefiSwapMultiplier(data),
    l2_defi_swap_phrase: buildDefiSwapFeePhrase(data),
  };
};

const buildDaProvidersReplacements = (
  data: DaProviderComparison,
): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_da_data_date: dataDate,
    l2_da_celestia_per_mb: formatDaProviderFee(data, 'da_celestia', '30d'),
    l2_da_eigenda_per_mb: formatDaProviderFee(data, 'da_eigenda', '30d'),
    l2_da_ethereum_per_mb: formatDaProviderFee(data, 'da_ethereum_blobs', '30d'),
    l2_da_avail_per_mb: formatDaProviderFee(data, 'da_avail', '30d'),
    l2_da_celestia_vs_eigenda: formatDaRatio(data, 'da_celestia', 'da_eigenda', '30d'),
    l2_da_eigenda_vs_celestia: formatDaRatio(data, 'da_eigenda', 'da_celestia', '30d'),
    l2_da_dense: buildDaDenseSentence(data, dataDate),
  };
};

const buildDaAdoptionReplacements = (
  data: DaLayerAdoption,
): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_da_adopt_data_date: dataDate,
    l2_da_adopt_universe_size: String(data.universeSize),
    l2_da_adopt_universe_list: data.universeKeys.join(', '),
    l2_da_adopt_excluded_sidechains:
      data.excludedNonL2Keys.length > 0
        ? data.excludedNonL2Keys.join(', ')
        : 'none',
    l2_da_adopt_unknown_chains:
      data.unknownDaL2Keys.length > 0
        ? data.unknownDaL2Keys.join(', ')
        : 'none',
    // Headline ranking.
    l2_da_adopt_leader: formatAdoptionLeader(data),
    l2_da_adopt_top5: formatAdoptionTopList(data, 5),
    l2_da_adopt_fees30d_leader: formatFees30dLeader(data),
    l2_da_adopt_dense: buildAdoptionDenseSentence(data, dataDate),
    // Per-bucket scalar strings for FAQ answers / table prose.
    l2_da_adopt_eth_blobs_count: formatBucketCount(data, 'ethereum_blobs'),
    l2_da_adopt_celestia_count: formatBucketCount(data, 'celestia'),
    l2_da_adopt_eigenda_count: formatBucketCount(data, 'eigenda'),
    l2_da_adopt_avail_count: formatBucketCount(data, 'avail'),
    l2_da_adopt_other_count: formatBucketCount(data, 'other'),
    l2_da_adopt_eth_blobs_chains: formatBucketL2List(data, 'ethereum_blobs'),
    l2_da_adopt_celestia_chains: formatBucketL2List(data, 'celestia'),
    l2_da_adopt_eigenda_chains: formatBucketL2List(data, 'eigenda'),
    l2_da_adopt_avail_chains: formatBucketL2List(data, 'avail'),
    l2_da_adopt_other_chains: formatBucketL2List(data, 'other'),
    l2_da_adopt_eth_blobs_fees_30d: formatBucketFees(data, 'ethereum_blobs', '30d'),
    l2_da_adopt_celestia_fees_30d: formatBucketFees(data, 'celestia', '30d'),
    l2_da_adopt_eigenda_fees_30d: formatBucketFees(data, 'eigenda', '30d'),
    l2_da_adopt_eth_blobs_fees_alltime: formatBucketFees(data, 'ethereum_blobs', 'allTime'),
    l2_da_adopt_celestia_fees_alltime: formatBucketFees(data, 'celestia', 'allTime'),
    l2_da_adopt_eigenda_fees_alltime: formatBucketFees(data, 'eigenda', 'allTime'),
    l2_da_adopt_eth_blobs_cost_per_mb: formatBucketCostPerMb(data, 'ethereum_blobs'),
    l2_da_adopt_celestia_cost_per_mb: formatBucketCostPerMb(data, 'celestia'),
    l2_da_adopt_eigenda_cost_per_mb: formatBucketCostPerMb(data, 'eigenda'),
    l2_da_adopt_avail_cost_per_mb: formatBucketCostPerMb(data, 'avail'),
  };
};

const buildEcosystemTpsReplacements = (
  data: EthereumEcosystemTps,
): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_ecotps_data_date: dataDate,
    // Live TPS values.
    l2_ecotps_live_ecosystem: formatEcosystemLiveTps(data),
    l2_ecotps_live_l1: formatL1LiveTps(data),
    l2_ecotps_live_l2: formatL2LiveTps(data),
    l2_ecotps_live_l2_share: formatEcoL2Share(data, 'liveTps'),
    // Daily / weekly / monthly / all-time counts per layer.
    l2_ecotps_l1_daily: formatEcoCount(data, 'l1', 'daily'),
    l2_ecotps_l1_weekly: formatEcoCount(data, 'l1', 'weekly'),
    l2_ecotps_l1_monthly: formatEcoCount(data, 'l1', 'monthly'),
    l2_ecotps_l1_alltime: formatEcoCount(data, 'l1', 'allTime'),
    l2_ecotps_l2_daily: formatEcoCount(data, 'l2', 'daily'),
    l2_ecotps_l2_weekly: formatEcoCount(data, 'l2', 'weekly'),
    l2_ecotps_l2_monthly: formatEcoCount(data, 'l2', 'monthly'),
    l2_ecotps_l2_alltime: formatEcoCount(data, 'l2', 'allTime'),
    l2_ecotps_eco_daily: formatEcoCount(data, 'ecosystem', 'daily'),
    l2_ecotps_eco_weekly: formatEcoCount(data, 'ecosystem', 'weekly'),
    l2_ecotps_eco_monthly: formatEcoCount(data, 'ecosystem', 'monthly'),
    l2_ecotps_eco_alltime: formatEcoCount(data, 'ecosystem', 'allTime'),
    // L2 share of the combined total per window.
    l2_ecotps_l2_share_daily: formatEcoL2Share(data, 'daily'),
    l2_ecotps_l2_share_weekly: formatEcoL2Share(data, 'weekly'),
    l2_ecotps_l2_share_monthly: formatEcoL2Share(data, 'monthly'),
    l2_ecotps_l2_share_alltime: formatEcoL2Share(data, 'allTime'),
    // Dense quotable sentence.
    l2_ecotps_dense: buildEcosystemTpsDenseSentence(data, dataDate),
  };
};

const buildShareReplacements = (
  data: EthereumScalingComparison,
): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_share_data_date: dataDate,
    l2_share_universe_size: String(data.universeSize),
    l2_share_universe_list: data.universeKeys.join(', '),
    l2_share_excluded_sidechains:
      data.excludedNonL2Keys.length > 0
        ? data.excludedNonL2Keys.join(', ')
        : 'none',
    // Headline sentence + per-metric dense summaries.
    l2_share_headline: buildShareHeadline(data, dataDate),
    l2_share_txcount_dense: buildShareDenseSentence(data, 'txcount', dataDate),
    l2_share_throughput_dense: buildShareDenseSentence(data, 'throughput', dataDate),
    // Per-(metric, period) L2 share percentages.
    l2_share_txcount_daily: formatL2SharePct('txcount', 'daily', data.byMetric.txcount.daily),
    l2_share_txcount_weekly: formatL2SharePct('txcount', 'weekly', data.byMetric.txcount.weekly),
    l2_share_txcount_monthly: formatL2SharePct('txcount', 'monthly', data.byMetric.txcount.monthly),
    l2_share_throughput_daily: formatL2SharePct('throughput', 'daily', data.byMetric.throughput.daily),
    l2_share_throughput_weekly: formatL2SharePct('throughput', 'weekly', data.byMetric.throughput.weekly),
    l2_share_throughput_monthly: formatL2SharePct('throughput', 'monthly', data.byMetric.throughput.monthly),
    // Mirror L1 share strings so prose can render "85% on L2s, 15% on
    // mainnet" without arithmetic in the markdown. Kept inside the `l2_*`
    // namespace so the articleProcessor placeholder regex picks them up.
    l2_share_l1_txcount_daily: formatL1SharePct('txcount', 'daily', data.byMetric.txcount.daily),
    l2_share_l1_txcount_weekly: formatL1SharePct('txcount', 'weekly', data.byMetric.txcount.weekly),
    l2_share_l1_txcount_monthly: formatL1SharePct('txcount', 'monthly', data.byMetric.txcount.monthly),
    l2_share_l1_throughput_daily: formatL1SharePct('throughput', 'daily', data.byMetric.throughput.daily),
    l2_share_l1_throughput_weekly: formatL1SharePct('throughput', 'weekly', data.byMetric.throughput.weekly),
    l2_share_l1_throughput_monthly: formatL1SharePct('throughput', 'monthly', data.byMetric.throughput.monthly),
    // Per-(metric, period) full prose phrase.
    l2_share_txcount_daily_phrase: buildSharePhrase('txcount', 'daily', data.byMetric.txcount.daily),
    l2_share_txcount_weekly_phrase: buildSharePhrase('txcount', 'weekly', data.byMetric.txcount.weekly),
    l2_share_txcount_monthly_phrase: buildSharePhrase('txcount', 'monthly', data.byMetric.txcount.monthly),
    l2_share_throughput_daily_phrase: buildSharePhrase('throughput', 'daily', data.byMetric.throughput.daily),
    l2_share_throughput_weekly_phrase: buildSharePhrase('throughput', 'weekly', data.byMetric.throughput.weekly),
    l2_share_throughput_monthly_phrase: buildSharePhrase('throughput', 'monthly', data.byMetric.throughput.monthly),
  };
};

const buildHeadToHeadReplacements = (
  data: ChainHeadToHead,
): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_h2h_data_date: dataDate,
    l2_h2h_a_name: data.a.name,
    l2_h2h_b_name: data.b.name,
    l2_h2h_headline: buildHeadToHeadHeadline(data, dataDate),
    l2_h2h_overall_winner: formatH2HOverallWinnerName(data),
    l2_h2h_a_wins: String(data.aWinCount),
    l2_h2h_b_wins: String(data.bWinCount),
    l2_h2h_total_metrics: String(data.metrics.length),
    // Per-metric phrases for FAQ answers.
    l2_h2h_txcount_daily_phrase: buildHeadToHeadMetricPhrase(data, 'txcount_daily'),
    l2_h2h_txcount_weekly_phrase: buildHeadToHeadMetricPhrase(data, 'txcount_weekly'),
    l2_h2h_txcount_monthly_phrase: buildHeadToHeadMetricPhrase(data, 'txcount_monthly'),
    l2_h2h_daa_daily_phrase: buildHeadToHeadMetricPhrase(data, 'daa_daily'),
    l2_h2h_daa_weekly_phrase: buildHeadToHeadMetricPhrase(data, 'daa_weekly'),
    l2_h2h_daa_monthly_phrase: buildHeadToHeadMetricPhrase(data, 'daa_monthly'),
    l2_h2h_throughput_daily_phrase: buildHeadToHeadMetricPhrase(data, 'throughput_daily'),
    l2_h2h_throughput_weekly_phrase: buildHeadToHeadMetricPhrase(data, 'throughput_weekly'),
    l2_h2h_throughput_monthly_phrase: buildHeadToHeadMetricPhrase(data, 'throughput_monthly'),
    l2_h2h_tvl_phrase: buildHeadToHeadMetricPhrase(data, 'tvl_latest'),
    l2_h2h_stables_phrase: buildHeadToHeadMetricPhrase(data, 'stables_mcap_latest'),
    l2_h2h_fees_30d_phrase: buildHeadToHeadMetricPhrase(data, 'fees_30d'),
    l2_h2h_profit_30d_phrase: buildHeadToHeadMetricPhrase(data, 'profit_30d'),
    // Per-side, per-metric raw display values for in-line markdown ("X txs vs Y txs").
    l2_h2h_a_txcount_daily: formatH2HSideValue(data, 'a', 'txcount_daily'),
    l2_h2h_b_txcount_daily: formatH2HSideValue(data, 'b', 'txcount_daily'),
    l2_h2h_a_daa_daily: formatH2HSideValue(data, 'a', 'daa_daily'),
    l2_h2h_b_daa_daily: formatH2HSideValue(data, 'b', 'daa_daily'),
    l2_h2h_a_throughput_daily: formatH2HSideValue(data, 'a', 'throughput_daily'),
    l2_h2h_b_throughput_daily: formatH2HSideValue(data, 'b', 'throughput_daily'),
    l2_h2h_a_tvl: formatH2HSideValue(data, 'a', 'tvl_latest'),
    l2_h2h_b_tvl: formatH2HSideValue(data, 'b', 'tvl_latest'),
    l2_h2h_a_stables: formatH2HSideValue(data, 'a', 'stables_mcap_latest'),
    l2_h2h_b_stables: formatH2HSideValue(data, 'b', 'stables_mcap_latest'),
    l2_h2h_a_fees_30d: formatH2HSideValue(data, 'a', 'fees_30d'),
    l2_h2h_b_fees_30d: formatH2HSideValue(data, 'b', 'fees_30d'),
    l2_h2h_a_profit_30d: formatH2HSideValue(data, 'a', 'profit_30d'),
    l2_h2h_b_profit_30d: formatH2HSideValue(data, 'b', 'profit_30d'),
    // Winners per metric (chain names).
    l2_h2h_txcount_daily_winner: formatH2HWinnerName(data, 'txcount_daily'),
    l2_h2h_daa_daily_winner: formatH2HWinnerName(data, 'daa_daily'),
    l2_h2h_throughput_daily_winner: formatH2HWinnerName(data, 'throughput_daily'),
    l2_h2h_tvl_winner: formatH2HWinnerName(data, 'tvl_latest'),
    l2_h2h_stables_winner: formatH2HWinnerName(data, 'stables_mcap_latest'),
    l2_h2h_fees_30d_winner: formatH2HWinnerName(data, 'fees_30d'),
    l2_h2h_profit_30d_winner: formatH2HWinnerName(data, 'profit_30d'),
    // Multiples per metric ("X×" — how many times the leader exceeds the trailer).
    l2_h2h_txcount_daily_multiple: formatH2HMultiple(data, 'txcount_daily'),
    l2_h2h_daa_daily_multiple: formatH2HMultiple(data, 'daa_daily'),
    l2_h2h_throughput_daily_multiple: formatH2HMultiple(data, 'throughput_daily'),
    l2_h2h_tvl_multiple: formatH2HMultiple(data, 'tvl_latest'),
    // Chain metadata.
    l2_h2h_a_launch: formatH2HChainMeta(data, 'a', 'launchDate'),
    l2_h2h_b_launch: formatH2HChainMeta(data, 'b', 'launchDate'),
    l2_h2h_a_stack: formatH2HChainMeta(data, 'a', 'stack'),
    l2_h2h_b_stack: formatH2HChainMeta(data, 'b', 'stack'),
    l2_h2h_a_da: formatH2HChainMeta(data, 'a', 'daLayer'),
    l2_h2h_b_da: formatH2HChainMeta(data, 'b', 'daLayer'),
    l2_h2h_a_token: formatH2HChainMeta(data, 'a', 'nativeToken'),
    l2_h2h_b_token: formatH2HChainMeta(data, 'b', 'nativeToken'),
  };
};

const buildL2TokenReplacements = (
  data: L2TokenMarketCap,
): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_token_data_date: dataDate,
    l2_token_universe_size: String(data.universeSize),
    l2_token_universe_list: data.universeKeys.join(', '),
    l2_token_excluded_sidechains:
      data.excludedNonL2Keys.length > 0
        ? data.excludedNonL2Keys.join(', ')
        : 'none',
    l2_token_no_token_list: formatL2TokenNoTokenList(data),
    l2_token_no_token_count: String(data.noTokenL2s.length),
    l2_token_tracked_count: String(
      data.ranked.filter((e) => e.marketCapUsd != null).length,
    ),
    // Headline / dense.
    l2_token_leader: formatL2TokenLeader(data),
    l2_token_leader_name: formatL2TokenLeaderName(data),
    l2_token_leader_mc: formatL2TokenLeaderMC(data),
    l2_token_leader_fdv: formatL2TokenLeaderFdv(data),
    l2_token_runner_up: formatL2TokenRunnerUp(data),
    l2_token_third_place: formatL2TokenThirdPlace(data),
    l2_token_top10: formatL2TokenTopList(data, 10),
    l2_token_top5: formatL2TokenTopList(data, 5),
    l2_token_dense: buildL2TokenDenseSentence(data, dataDate),
    l2_token_ecosystem_mc: formatEcosystemMarketCap(data),
    l2_token_ecosystem_fdv: formatEcosystemFdv(data),
  };
};

const buildFeesTrendReplacements = (
  data: L2FeesTrend,
): Record<string, string> => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return {
    l2_trend_data_date: dataDate,
    l2_trend_universe_size: String(data.universeSize),
    l2_trend_universe_list: data.universeKeys.join(', '),
    l2_trend_excluded_sidechains:
      data.excludedNonL2Keys.length > 0
        ? data.excludedNonL2Keys.join(', ')
        : 'none',
    l2_trend_dense: buildTrendDenseSentence(data, dataDate),
    // Anchor fee values.
    l2_trend_latest_fee: formatAnchorFee(data.latestMonth),
    l2_trend_latest_month: formatAnchorMonth(data.latestMonth),
    l2_trend_pre_dencun_fee: formatAnchorFee(data.preDencun),
    l2_trend_pre_dencun_month: formatAnchorMonth(data.preDencun),
    l2_trend_post_dencun_fee: formatAnchorFee(data.postDencun),
    l2_trend_post_dencun_month: formatAnchorMonth(data.postDencun),
    l2_trend_pre_pectra_fee: formatAnchorFee(data.prePectra),
    l2_trend_pre_pectra_month: formatAnchorMonth(data.prePectra),
    l2_trend_post_pectra_fee: formatAnchorFee(data.postPectra),
    l2_trend_post_pectra_month: formatAnchorMonth(data.postPectra),
    l2_trend_pre_fusaka_fee: formatAnchorFee(data.preFusaka),
    l2_trend_pre_fusaka_month: formatAnchorMonth(data.preFusaka),
    l2_trend_post_fusaka_fee: formatAnchorFee(data.postFusaka),
    l2_trend_post_fusaka_month: formatAnchorMonth(data.postFusaka),
    l2_trend_one_year_ago_fee: formatAnchorFee(data.oneYearAgo),
    l2_trend_one_year_ago_month: formatAnchorMonth(data.oneYearAgo),
    // Change-per-upgrade prose strings.
    l2_trend_dencun_change_pct: formatPctChangeBetween(data.preDencun, data.postDencun),
    l2_trend_dencun_multiple: formatMultipleReduction(data.preDencun, data.postDencun),
    l2_trend_pectra_change_pct: formatPctChangeBetween(data.prePectra, data.postPectra),
    l2_trend_pectra_multiple: formatMultipleReduction(data.prePectra, data.postPectra),
    l2_trend_fusaka_change_pct: formatPctChangeBetween(data.preFusaka, data.postFusaka),
    l2_trend_fusaka_multiple: formatMultipleReduction(data.preFusaka, data.postFusaka),
    // Long-run summaries vs the latest month.
    l2_trend_vs_pre_dencun_pct: formatPctChangeBetween(data.preDencun, data.latestMonth),
    l2_trend_vs_pre_dencun_multiple: formatMultipleReduction(data.preDencun, data.latestMonth),
    l2_trend_vs_one_year_ago_pct: formatPctChangeBetween(data.oneYearAgo, data.latestMonth),
    l2_trend_vs_one_year_ago_multiple: formatMultipleReduction(data.oneYearAgo, data.latestMonth),
    // Direction word ("cheaper" / "more expensive" / "about the same") for
    // long-run framing.
    l2_trend_long_run_direction: formatDirection(data.preDencun, data.latestMonth),
    l2_trend_one_year_direction: formatDirection(data.oneYearAgo, data.latestMonth),
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
    case 'l2-growth':
      return buildGrowthReplacements(data.lb);
    case 'l2-tvs':
      return buildTvsReplacements(data.lb);
    case 'l2-profit':
      return buildProfitReplacements(data.lb);
    case 'l2-rent':
      return buildRentReplacements(data.lb);
    case 'l2-maturity':
      return buildMaturityReplacements(data.lb);
    case 'l2-eip7702':
      return buildEip7702Replacements(data.lb);
    case 'defi-l1-vs-l2':
      return buildDefiReplacements(data.lb);
    case 'da-providers':
      return buildDaProvidersReplacements(data.lb);
    case 'da-adoption':
      return buildDaAdoptionReplacements(data.lb);
    case 'ethereum-ecosystem-tps':
      return buildEcosystemTpsReplacements(data.lb);
    case 'l2-share':
      return buildShareReplacements(data.lb);
    case 'base-vs-arbitrum':
      return buildHeadToHeadReplacements(data.lb);
    case 'l2-token-market-cap':
      return buildL2TokenReplacements(data.lb);
    case 'l2-fees-trend':
      return buildFeesTrendReplacements(data.lb);
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
    } else if (leaderboardKind === 'l2-growth') {
      const lb = await getL2Growth();
      if (lb) leaderboardData = { kind: 'l2-growth', lb };
    } else if (leaderboardKind === 'l2-tvs') {
      const lb = await getL2TvsRanking();
      if (lb) leaderboardData = { kind: 'l2-tvs', lb };
    } else if (leaderboardKind === 'l2-profit') {
      const lb = await getL2Profit();
      if (lb) leaderboardData = { kind: 'l2-profit', lb };
    } else if (leaderboardKind === 'l2-rent') {
      const lb = await getL2RentToMainnet();
      if (lb) leaderboardData = { kind: 'l2-rent', lb };
    } else if (leaderboardKind === 'l2-maturity') {
      const lb = await getL2Maturity();
      if (lb) leaderboardData = { kind: 'l2-maturity', lb };
    } else if (leaderboardKind === 'l2-eip7702') {
      const lb = await getL2Eip7702Activity();
      if (lb) leaderboardData = { kind: 'l2-eip7702', lb };
    } else if (leaderboardKind === 'defi-l1-vs-l2') {
      const lb = await getDefiL1VsL2();
      if (lb) leaderboardData = { kind: 'defi-l1-vs-l2', lb };
    } else if (leaderboardKind === 'da-providers') {
      const lb = await getDaProviderComparison();
      if (lb) leaderboardData = { kind: 'da-providers', lb };
    } else if (leaderboardKind === 'da-adoption') {
      const lb = await getDaLayerAdoption();
      if (lb) leaderboardData = { kind: 'da-adoption', lb };
    } else if (leaderboardKind === 'ethereum-ecosystem-tps') {
      const lb = await getEthereumEcosystemTps();
      if (lb) leaderboardData = { kind: 'ethereum-ecosystem-tps', lb };
    } else if (leaderboardKind === 'l2-share') {
      const lb = await getEthereumScaling();
      if (lb) leaderboardData = { kind: 'l2-share', lb };
    } else if (leaderboardKind === 'base-vs-arbitrum') {
      const lb = await getBaseVsArbitrum();
      if (lb) leaderboardData = { kind: 'base-vs-arbitrum', lb };
    } else if (leaderboardKind === 'l2-token-market-cap') {
      const lb = await getL2TokenMarketCap();
      if (lb) leaderboardData = { kind: 'l2-token-market-cap', lb };
    } else if (leaderboardKind === 'l2-fees-trend') {
      const lb = await getL2FeesTrend();
      if (lb) leaderboardData = { kind: 'l2-fees-trend', lb };
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
                  : leaderboardData?.kind === 'l2-growth'
                    ? buildGrowthAcceptedAnswer(leaderboardData.lb)
                    : leaderboardData?.kind === 'l2-tvs'
                      ? buildTvsAcceptedAnswer(leaderboardData.lb)
                      : leaderboardData?.kind === 'l2-profit'
                        ? buildProfitAcceptedAnswer(leaderboardData.lb)
                        : leaderboardData?.kind === 'l2-rent'
                          ? buildRentAcceptedAnswer(leaderboardData.lb)
                          : leaderboardData?.kind === 'l2-maturity'
                            ? buildMaturityAcceptedAnswer(leaderboardData.lb)
                            : leaderboardData?.kind === 'l2-eip7702'
                              ? buildEip7702AcceptedAnswer(leaderboardData.lb)
                              : leaderboardData?.kind === 'defi-l1-vs-l2'
                                ? buildDefiAcceptedAnswer(leaderboardData.lb)
                                : leaderboardData?.kind === 'da-providers'
                                  ? buildDaAcceptedAnswer(leaderboardData.lb)
                                  : leaderboardData?.kind === 'da-adoption'
                                    ? buildAdoptionAcceptedAnswer(leaderboardData.lb)
                                    : leaderboardData?.kind === 'ethereum-ecosystem-tps'
                                      ? buildEcosystemTpsAcceptedAnswer(leaderboardData.lb)
                                      : leaderboardData?.kind === 'l2-share'
                                        ? buildShareAcceptedAnswer(leaderboardData.lb)
                                        : leaderboardData?.kind === 'base-vs-arbitrum'
                                          ? buildHeadToHeadAcceptedAnswer(leaderboardData.lb)
                                          : leaderboardData?.kind === 'l2-token-market-cap'
                                            ? buildL2TokenAcceptedAnswer(leaderboardData.lb)
                                            : leaderboardData?.kind === 'l2-fees-trend'
                                              ? buildTrendAcceptedAnswer(leaderboardData.lb)
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
                  : leaderboardData?.kind === 'l2-growth'
                    ? buildGrowthAnswerTables(leaderboardData.lb)
                    : leaderboardData?.kind === 'l2-tvs'
                      ? buildTvsAnswerTables(leaderboardData.lb)
                      : leaderboardData?.kind === 'l2-profit'
                        ? buildProfitAnswerTables(leaderboardData.lb)
                        : leaderboardData?.kind === 'l2-rent'
                          ? buildRentAnswerTables(leaderboardData.lb)
                          : leaderboardData?.kind === 'l2-maturity'
                            ? buildMaturityAnswerTables(leaderboardData.lb)
                            : leaderboardData?.kind === 'l2-eip7702'
                              ? buildEip7702AnswerTables(leaderboardData.lb)
                              : leaderboardData?.kind === 'defi-l1-vs-l2'
                                ? buildDefiAnswerTables(leaderboardData.lb)
                                : leaderboardData?.kind === 'da-providers'
                                  ? buildDaProviderAnswerTables(leaderboardData.lb)
                                  : leaderboardData?.kind === 'da-adoption'
                                    ? buildAdoptionAnswerTables(leaderboardData.lb)
                                    : leaderboardData?.kind === 'ethereum-ecosystem-tps'
                                      ? buildEcosystemTpsAnswerTables(leaderboardData.lb)
                                      : leaderboardData?.kind === 'l2-share'
                                        ? buildShareAnswerTables(leaderboardData.lb)
                                        : leaderboardData?.kind === 'base-vs-arbitrum'
                                          ? buildHeadToHeadAnswerTables(leaderboardData.lb)
                                          : leaderboardData?.kind === 'l2-token-market-cap'
                                            ? buildL2TokenAnswerTables(leaderboardData.lb)
                                            : leaderboardData?.kind === 'l2-fees-trend'
                                              ? buildTrendAnswerTables(leaderboardData.lb)
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
