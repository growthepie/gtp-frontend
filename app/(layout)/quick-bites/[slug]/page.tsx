// NOTE: This file is a Server Component (no "use client")
import { notFound } from 'next/navigation';
import ClientQuickBitePage from './ClientQuickBitePage';
import { getQuickBiteBySlug } from '@/lib/quick-bites/quickBites';
import type { Metadata } from 'next';
import { generateSeo } from '@/lib/quick-bites/seo_helper';
import { processArticle } from '@/lib/quick-bites/articleProcessor';

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
  // Shared, request-cached: same call also runs from <QuickBiteRouteSchemas />
  // in the root layout to emit JSON-LD as parse-time HTML.
  const processed = await processArticle(slug);
  if (!processed) return notFound();

  return (
    <ClientQuickBitePage
      params={{ slug }}
      initialQuickBite={processed.initialQuickBite}
      initialContentBlocks={processed.initialContentBlocks}
    />
  );
}
