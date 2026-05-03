// NOTE: This file is a Server Component (no "use client")
import { notFound } from 'next/navigation';
import ClientQuickBitePage from './ClientQuickBitePage';
import { getQuickBiteBySlug } from '@/lib/quick-bites/quickBites';
import type { Metadata } from 'next';
import {
  generateSeo,
  generateJsonLdArticle,
  generateJsonLdBreadcrumbs,
} from '@/lib/quick-bites/seo_helper';
import { serializeJsonLd } from '@/utils/json-ld';
import { processDynamicContent } from '@/lib/utils/dynamicContent';
import { processMarkdownContent } from '@/lib/utils/markdownParser';
import type { ContentBlock } from '@/lib/types/blockTypes';
import type { QuickBiteData } from '@/lib/types/quickBites';

// Strip markdown / fenced data blocks so AI consumers see only the prose.
const ARTICLE_BODY_MAX_CHARS = 5000;
const extractPlainText = (content: string[]): string => {
  const joined = content.join('\n\n');
  const stripped = joined
    .replace(/```[\s\S]*?```/g, ' ') // fenced blocks (chart configs, KPIs, faq json)
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ') // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → label
    .replace(/^\s{0,3}>\s?/gm, '') // blockquote markers
    .replace(/^#{1,6}\s+/gm, '') // heading markers
    .replace(/[*_~]+/g, '') // emphasis markers
    .replace(/\s+/g, ' ')
    .trim();
  return stripped;
};

type Props = { params: Promise<{ slug: string }> };

// ----- SEO: generate <head> metadata -----
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const qb = getQuickBiteBySlug(slug);
  if (!qb) return {};

  const seo = generateSeo(slug, qb);

  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    alternates: { canonical: seo.canonical },
    openGraph: {
      type: 'article',
      title: seo.og.title,
      description: seo.og.description,
      images: seo.og.image ? [{ url: seo.og.image }] : undefined,
    },
    twitter: {
      card: seo.twitter.card,
      title: seo.twitter.title,
      description: seo.twitter.description,
      images: seo.twitter.image ? [seo.twitter.image] : undefined,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const qb = getQuickBiteBySlug(slug);
  if (!qb) return notFound();

  // Pre-process content server-side so headings, paragraphs, lists and other
  // static text appear in the initial HTML for crawlers and AI readers.
  // Dynamic blocks (charts, live metrics) still hydrate on the client.
  let initialQuickBite: QuickBiteData = qb;
  let initialContentBlocks: ContentBlock[] = [];
  let articleBody: string | undefined;
  let wordCount: number | undefined;
  try {
    const processedContent = await processDynamicContent(qb.content);
    initialQuickBite = { ...qb, content: processedContent };
    initialContentBlocks = await processMarkdownContent(processedContent);

    const plainText = extractPlainText(processedContent);
    if (plainText) {
      articleBody = plainText.slice(0, ARTICLE_BODY_MAX_CHARS);
      wordCount = plainText.split(/\s+/).filter(Boolean).length;
    }
  } catch (error) {
    console.error(`Failed to pre-process quick bite "${slug}" on server:`, error);
  }

  const jsonLdArticle = generateJsonLdArticle(slug, qb, {
    dateModified: qb.date,
    language: 'en',
    articleBody,
    wordCount,
  });
  const jsonLdBreadcrumbs = generateJsonLdBreadcrumbs(slug, qb);

  // Try optional per-QB exports (prefer data embedded in qb)
  let jsonLdFaq: any | undefined = qb.jsonLdFaq;
  let jsonLdDatasets: any[] = qb.jsonLdDatasets ?? [];
  try {
    // This import must also be server-safe
    const mod = require(`@/lib/quick-bites/${slug}.ts`);
    if (!jsonLdFaq && mod.jsonLdFaq) jsonLdFaq = mod.jsonLdFaq;
    if (jsonLdDatasets.length === 0 && mod.jsonLdDatasets) {
      jsonLdDatasets = mod.jsonLdDatasets;
    }
  } catch {}

  const graphs = [
    jsonLdArticle,
    jsonLdBreadcrumbs,
    ...(jsonLdFaq ? [jsonLdFaq] : []),
    ...jsonLdDatasets,
  ];

  return (
    <>
      {graphs.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(obj) }}
        />
      ))}
      <ClientQuickBitePage
        params={{ slug }}
        initialQuickBite={initialQuickBite}
        initialContentBlocks={initialContentBlocks}
      />
    </>
  );
}
