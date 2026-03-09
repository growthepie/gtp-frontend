// NOTE: This file is a Server Component (no "use client")
import { notFound } from 'next/navigation';
import ClientQuickBitePage from './ClientQuickBitePage';
import { getQuickBiteBySlug } from '@/lib/quick-bites/quickBites';
import type { Metadata } from 'next';
import {
  generateJsonLdArticle,
  generateJsonLdBreadcrumbs,
  generateSeo,
} from '@/lib/quick-bites/seo_helper';

type Props = { params: Promise<{ slug: string }> };

type QbModule = {
  jsonLdFaq?: unknown;
  jsonLdDatasets?: unknown[];
};

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

  const serializeJsonLd = (data: unknown) =>
    JSON.stringify(data, null, 2).replace(/</g, '\\u003c');

  const jsonLdArticle = generateJsonLdArticle(slug, qb, {
    dateModified: qb.date,
    language: 'en',
  });
  const jsonLdBreadcrumbs = generateJsonLdBreadcrumbs(slug, qb);

  const graphs = [
    jsonLdArticle,
    jsonLdBreadcrumbs,
    ...(qb.jsonLdFaq ? [qb.jsonLdFaq] : []),
    ...(qb.jsonLdDatasets ?? []),
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
