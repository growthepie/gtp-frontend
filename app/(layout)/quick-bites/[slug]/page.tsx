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

  const jsonLdArticle = generateJsonLdArticle(slug, qb, {
    dateModified: qb.date,
    language: 'en',
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
      <ClientQuickBitePage params={{ slug }} />
    </>
  );
}
