// Server component only (no "use client")
import { getQuickBiteBySlug } from '@/lib/quick-bites/quickBites';
import {
  generateJsonLdArticle,
  generateJsonLdBreadcrumbs,
} from '@/lib/quick-bites/seo_helper';

type Props = { params: { slug: string } };

export default function Head({ params }: Props) {
  const qb = getQuickBiteBySlug(params.slug);
  if (!qb) return null;

  const serializeJsonLd = (data: unknown) =>
    JSON.stringify(data, null, 2).replace(/</g, '\\u003c');

  const jsonLdArticle = generateJsonLdArticle(params.slug, qb, {
    dateModified: qb.date,
    language: 'en',
  });
  const jsonLdBreadcrumbs = generateJsonLdBreadcrumbs(params.slug, qb);

  // Try optional per-QB exports
  let jsonLdFaq: any | undefined;
  let jsonLdDatasets: any[] = [];
  try {
    // This import must also be server-safe
    const mod = require(`@/lib/quick-bites/${params.slug}.ts`);
    if (mod.jsonLdFaq) jsonLdFaq = mod.jsonLdFaq;
    if (mod.jsonLdDatasets) jsonLdDatasets = mod.jsonLdDatasets;
  } catch {}

  const graphs = [
    jsonLdArticle,
    jsonLdBreadcrumbs,
    ...(jsonLdFaq ? [jsonLdFaq] : []),
    ...jsonLdDatasets,
  ].filter(Boolean);

  if (!graphs.length) return null;

  return (
    <>
      {graphs.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          // IMPORTANT: stringify here so it's SSR in the HEAD HTML
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(obj) }}
        />
      ))}
    </>
  );
}