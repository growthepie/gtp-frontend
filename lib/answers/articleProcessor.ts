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

// Lookup table mapping slug → leaderboard metric we should derive prose from.
// Centralises the "this answer is data-driven by metric X" mapping so we
// don't sprinkle slug strings throughout the processor.
const LEADERBOARD_DRIVEN_ANSWERS: Record<string, true> = {
  'most-used-ethereum-l2': true,
};

// Build the placeholder dictionary derived from today's L2 leaderboard.
// Same dictionary is reused for content, FAQ answers, and FAQ JSON-LD so
// that what the visible UI quotes, what the static SEO shell renders, and
// what AI consumes in JSON-LD all agree.
const buildLeaderboardReplacements = (
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
  lb: L2Leaderboard | null,
): string[] => {
  const repl: Record<string, string> = {
    ...buildSiteReplacements(),
    ...(lb ? buildLeaderboardReplacements(lb) : {}),
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
  lb: L2Leaderboard | null,
): any => {
  if (!faqJsonLd || typeof faqJsonLd !== 'object') return faqJsonLd;
  const repl: Record<string, string> = {
    ...buildSiteReplacements(),
    ...(lb ? buildLeaderboardReplacements(lb) : {}),
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
  lb: L2Leaderboard | null,
): { q: string; a: string }[] | undefined => {
  if (!faq) return faq;
  const repl: Record<string, string> = {
    ...buildSiteReplacements(),
    ...(lb ? buildLeaderboardReplacements(lb) : {}),
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
    const leaderboard = LEADERBOARD_DRIVEN_ANSWERS[slug]
      ? await getL2UsageLeaderboard()
      : null;

    try {
      // Always apply site-wide placeholders (e.g. {{gtp_supporters}}) so
      // every answer page benefits, regardless of whether it's leaderboard-
      // driven. Leaderboard replacements are merged in when available.
      const rawContent = applyPlaceholders(qb.content, leaderboard);
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
    const acceptedAnswer = leaderboard
      ? buildAcceptedAnswer(leaderboard)
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
    const jsonLdFaq = applyLeaderboardToFaqJsonLd(qb.jsonLdFaq, leaderboard);
    let jsonLdDatasets: any[] = qb.jsonLdDatasets ?? [];
    const faq = applyLeaderboardToFaq(qb.faq, leaderboard);

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

    const tables = leaderboard ? buildAnswerTables(leaderboard) : [];

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
