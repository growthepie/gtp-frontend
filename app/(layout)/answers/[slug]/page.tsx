// Server Component that renders a canonical AI-search answer page.
// Mirrors /quick-bites/[slug] but reads from the answers registry and emits
// /answers/-prefixed canonical URLs and breadcrumbs.

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ClientQuickBitePage from '@/app/(layout)/quick-bites/[slug]/ClientQuickBitePage';
import { getAnswerBySlug } from '@/lib/answers';
import { generateSeo } from '@/lib/quick-bites/seo_helper';
import { processAnswer } from '@/lib/answers/articleProcessor';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const qb = getAnswerBySlug(slug);
  if (!qb) return {};

  const seo = generateSeo(slug, qb, { section: 'answers' });

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
    // Explicit override of the root layout's `nocache: true` default — answer
    // pages are designed to be cached and quoted by AI engines (especially
    // Bing Copilot, which respects `nocache` as "don't show cached snippet").
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const processed = await processAnswer(slug);
  if (!processed) return notFound();

  return (
    <ClientQuickBitePage
      params={{ slug }}
      initialQuickBite={processed.initialQuickBite}
      initialContentBlocks={processed.initialContentBlocks}
    />
  );
}
