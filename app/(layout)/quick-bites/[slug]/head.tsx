// Server component only (no "use client")
import { getQuickBiteBySlug } from '@/lib/quick-bites/quickBites';
import {
  generateJsonLdArticle,
  generateJsonLdBreadcrumbs,
} from '@/lib/quick-bites/seo_helper';
import { serializeJsonLd } from '@/utils/json-ld';

type Props = { params: { slug: string } };

export default function Head({ params }: Props) {
  const qb = getQuickBiteBySlug(params.slug);
  if (!qb) return null;

  const jsonLdArticle = generateJsonLdArticle(params.slug, qb, {
    dateModified: qb.date,
    language: 'en',
  });
  const jsonLdBreadcrumbs = generateJsonLdBreadcrumbs(params.slug, qb);

  // Try optional per-QB exports (prefer data embedded in qb)
  let jsonLdFaq: any | undefined = qb.jsonLdFaq;
  let jsonLdDatasets: any[] = qb.jsonLdDatasets ?? [];
  try {
    // This import must also be server-safe
    const mod = require(`@/lib/quick-bites/${params.slug}.ts`);
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
          // IMPORTANT: stringify here so it's SSR in the HEAD HTML
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(obj) }}
        />
      ))}
    </>
  );
}
