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

type Props = { params: { slug: string } };

type QbModule = {
  jsonLdFaq?: unknown;
  jsonLdDatasets?: unknown[];
};

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

  const serializeJsonLd = (data: unknown) =>
    JSON.stringify(data, null, 2).replace(/</g, '\\u003c');

  const jsonLdArticle = generateJsonLdArticle(params.slug, qb, {
    dateModified: qb.date,
    language: 'en',
  });
  const jsonLdBreadcrumbs = generateJsonLdBreadcrumbs(params.slug, qb);

  let jsonLdFaq: unknown;
  let jsonLdDatasets: unknown[] = [];

  try {
    const safeSlug = params.slug.match(/^[\w-]+$/)?.[0]; // basic guard
    if (safeSlug) {
      const mod = (await import(
        /* webpackInclude: /\.\/qb-[\w-]+\.ts$/ */
        '../../../../lib/quick-bites/' + `qb-${safeSlug}.ts`
      )) as QbModule;

      if (mod.jsonLdFaq !== undefined) jsonLdFaq = mod.jsonLdFaq;
      if (Array.isArray(mod.jsonLdDatasets)) jsonLdDatasets = mod.jsonLdDatasets;
    }
  } catch {
    // Optional module exports are best-effort only
  }

  const graphs = [
    jsonLdArticle,
    jsonLdBreadcrumbs,
    ...(jsonLdFaq ? [jsonLdFaq] : []),
    ...jsonLdDatasets,
  ].filter(Boolean);

  return (
    <>
      {graphs.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(obj) }}
        />
      ))}
      <ClientQuickBitePage params={params} />
    </>
  );
}