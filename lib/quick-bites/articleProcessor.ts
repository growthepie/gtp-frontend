// Shared per-request article processor. Wrapped in React's cache() so the
// root layout's <QuickBiteRouteSchemas /> and the route page don't duplicate
// processDynamicContent work — they share the same memoised result within
// a single request.

import { cache } from "react";
import { getQuickBiteBySlug } from "./quickBites";
import { processDynamicContent } from "@/lib/utils/dynamicContent";
import { processMarkdownContent } from "@/lib/utils/markdownParser";
import {
  generateJsonLdArticle,
  generateJsonLdBreadcrumbs,
  generateJsonLdDatasetFromContent,
  computeArticleStats,
} from "./seo_helper";
import type { ContentBlock } from "@/lib/types/blockTypes";
import type { QuickBiteData } from "@/lib/types/quickBites";

export type ProcessedArticle = {
  qb: QuickBiteData;
  initialQuickBite: QuickBiteData;
  processedContent: string[];
  initialContentBlocks: ContentBlock[];
  articleBody?: string;
  wordCount?: number;
  schemas: any[]; // ordered: Article, Breadcrumbs, [FAQ], [...Datasets]
};

export const processArticle = cache(
  async (slug: string): Promise<ProcessedArticle | null> => {
    const qb = getQuickBiteBySlug(slug);
    if (!qb) return null;

    let processedContent: string[] = qb.content;
    let initialContentBlocks: ContentBlock[] = [];
    let articleBody: string | undefined;
    let wordCount: number | undefined;

    try {
      processedContent = await processDynamicContent(qb.content);
      initialContentBlocks = await processMarkdownContent(processedContent);
      const stats = computeArticleStats(processedContent);
      articleBody = stats.articleBody;
      wordCount = stats.wordCount;
    } catch (error) {
      console.error(`processArticle failed for "${slug}":`, error);
    }

    const initialQuickBite: QuickBiteData = { ...qb, content: processedContent };

    const jsonLdArticle = generateJsonLdArticle(slug, qb, {
      dateModified: qb.date,
      language: "en",
      articleBody,
      wordCount,
    });
    const jsonLdBreadcrumbs = generateJsonLdBreadcrumbs(slug, qb);

    let jsonLdFaq: any | undefined = qb.jsonLdFaq;
    let jsonLdDatasets: any[] = qb.jsonLdDatasets ?? [];

    // Optional per-QB module exports kept for backward compatibility.
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(`@/lib/quick-bites/${slug}.ts`);
      if (!jsonLdFaq && mod.jsonLdFaq) jsonLdFaq = mod.jsonLdFaq;
      if (jsonLdDatasets.length === 0 && mod.jsonLdDatasets) {
        jsonLdDatasets = mod.jsonLdDatasets;
      }
    } catch {
      // file not present or no extra exports — fine.
    }

    if (jsonLdDatasets.length === 0) {
      const auto = generateJsonLdDatasetFromContent(slug, qb, processedContent, {
        dateModified: qb.date,
      });
      if (auto) jsonLdDatasets = [auto];
    }

    const schemas: any[] = [
      jsonLdArticle,
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
      schemas,
    };
  },
);
