// NOTE: This file is a Server Component (no "use client")
import { notFound } from 'next/navigation';
import ClientQuickBitePage from './ClientQuickBitePage';
import { getQuickBiteBySlug } from '@/lib/quick-bites/quickBites';
import type { Metadata } from 'next';
import { generateSeo, generateJsonLdArticle, generateJsonLdBreadcrumbs } from '@/lib/quick-bites/seo_helper';

type Props = { params: { slug: string } };

// ----- SEO: generate <head> metadata -----
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const qb = getQuickBiteBySlug(params.slug);
  if (!qb) return {};

  const seo = generateSeo(params.slug, qb);

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
  const qb = getQuickBiteBySlug(params.slug);
  if (!qb) return notFound();

  // Build JSON-LD from data
  const jsonLdArticle = generateJsonLdArticle(params.slug, qb, {
    dateModified: qb.date, // or inject commit time at build
    language: 'en',
  });
  const jsonLdBreadcrumbs = generateJsonLdBreadcrumbs(params.slug, qb);

  // Try to load per-QB JSON-LD extras (FAQ, Datasets) if they exist
  let jsonLdFaq: any | undefined;
  let jsonLdDatasets: any[] = [];
  try {
    // dynamic import of the specific QB module to grab its exports (optional)
    const mod = await import(`@/lib/quick-bites/${params.slug}.ts`).catch(() => null as any);
    if (mod.jsonLdFaq) jsonLdFaq = mod.jsonLdFaq;
    if (mod.jsonLdDatasets) jsonLdDatasets = mod.jsonLdDatasets;
  } catch {
    // fallback: none
  }

  const jsonLdObjects = [
    jsonLdArticle,
    jsonLdBreadcrumbs,
    ...(jsonLdFaq ? [jsonLdFaq] : []),
    ...jsonLdDatasets,
  ];

  return (
    <>
      {/* JSON-LD scripts (placed in the body is fine; crawlers will pick them up) */}
      {jsonLdObjects.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}

      {/* Client-side page content */}
      <ClientQuickBitePage params={params} />
    </>
  );
}