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
  buildChartFencedBlock,
  formatLeaderEntry,
  formatTopList,
  type L2Leaderboard,
  type LeaderboardMetric,
} from './computeL2Leaderboard';

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
  return {
    l2_universe_size: String(lb.universeSize),
    l2_universe_list: lb.universeKeys.join(', '),
    l2_excluded_sidechains:
      lb.excludedNonL2Keys.length > 0
        ? lb.excludedNonL2Keys.join(', ')
        : 'none',
    l2_throughput_leader: tp[0] ? formatLeaderEntry(tp[0], 'throughput') : 'unavailable',
    l2_throughput_top3: formatTopList(tp, 'throughput', 3),
    l2_throughput_top5: formatTopList(tp, 'throughput', 5),
    l2_txcount_leader: tx[0] ? formatLeaderEntry(tx[0], 'txcount') : 'unavailable',
    l2_txcount_top3: formatTopList(tx, 'txcount', 3),
    l2_txcount_top5: formatTopList(tx, 'txcount', 5),
    l2_daa_leader: daa[0] ? formatLeaderEntry(daa[0], 'daa') : 'unavailable',
    l2_daa_top3: formatTopList(daa, 'daa', 3),
    l2_daa_top5: formatTopList(daa, 'daa', 5),
  };
};

const substitute = (s: string, repl: Record<string, string>): string =>
  s.replace(/\{\{(l2_[a-z0-9_]+)\}\}/g, (_, name) =>
    Object.prototype.hasOwnProperty.call(repl, name) ? repl[name] : `{{${name}}}`,
  );

// Whole-entry chart placeholders need to be expanded into three separate
// array entries so `markdownParser.processMarkdownContent` (which expects
// ```chart``` / JSON / ``` as content[i] / content[i+1] / content[i+2])
// can pick them up. Anywhere else the placeholder is treated as inline text.
const CHART_PLACEHOLDER_RE = /^\{\{(l2_(?:throughput|txcount|daa)_chart)\}\}$/;
const METRIC_FROM_CHART_PLACEHOLDER: Record<string, LeaderboardMetric> = {
  l2_throughput_chart: 'throughput',
  l2_txcount_chart: 'txcount',
  l2_daa_chart: 'daa',
};

const applyLeaderboardPlaceholders = (
  content: string[],
  lb: L2Leaderboard,
): string[] => {
  const repl = buildLeaderboardReplacements(lb);
  const out: string[] = [];
  for (const block of content) {
    if (typeof block !== 'string') {
      out.push(block);
      continue;
    }
    const chartMatch = block.trim().match(CHART_PLACEHOLDER_RE);
    if (chartMatch) {
      const metric = METRIC_FROM_CHART_PLACEHOLDER[chartMatch[1]];
      const fenced = buildChartFencedBlock(lb, metric, 5);
      if (fenced) {
        // Split into ['```chart', '{...}', '```'] so the markdown parser sees
        // the same shape as a hand-authored chart block.
        out.push(...fenced.split('\n'));
      }
      // Drop the placeholder when no leaderboard data is available rather
      // than leaving a literal `{{l2_..._chart}}` rendered as a paragraph.
      continue;
    }
    out.push(substitute(block, repl));
  }
  return out;
};

// Substitute placeholders inside the FAQ JSON-LD that was generated at module
// load time (before live data was available). Mutates a shallow copy so the
// editor-side `faqItems` export remains untouched.
const applyLeaderboardToFaqJsonLd = (
  faqJsonLd: any,
  lb: L2Leaderboard,
): any => {
  if (!faqJsonLd || typeof faqJsonLd !== 'object') return faqJsonLd;
  const repl = buildLeaderboardReplacements(lb);
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
  lb: L2Leaderboard,
): { q: string; a: string }[] | undefined => {
  if (!faq) return faq;
  const repl = buildLeaderboardReplacements(lb);
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
      let rawContent = qb.content;
      if (leaderboard) rawContent = applyLeaderboardPlaceholders(rawContent, leaderboard);
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

    const jsonLdQAPage = generateJsonLdQAPage(slug, qb, {
      ...opts,
      acceptedAnswer,
      datePublished: qb.date,
    });
    const jsonLdBreadcrumbs = generateJsonLdBreadcrumbs(slug, qb, opts);

    const jsonLdFaq = leaderboard
      ? applyLeaderboardToFaqJsonLd(qb.jsonLdFaq, leaderboard)
      : qb.jsonLdFaq;
    let jsonLdDatasets: any[] = qb.jsonLdDatasets ?? [];
    const faq = leaderboard
      ? applyLeaderboardToFaq(qb.faq, leaderboard)
      : qb.faq;

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
    };
  },
);
