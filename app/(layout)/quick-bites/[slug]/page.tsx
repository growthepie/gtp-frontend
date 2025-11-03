// NOTE: This file is a Server Component (no "use client")
import { notFound } from 'next/navigation';
import ClientQuickBitePage from './ClientQuickBitePage';
import { getQuickBiteBySlug } from '@/lib/quick-bites/quickBites';
import type { Metadata } from 'next';
import { generateSeo } from '@/lib/quick-bites/seo_helper';

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

  // JSON-LD is injected in app/(layout)/quick-bites/[slug]/head.tsx
  return <ClientQuickBitePage params={params} />;
}