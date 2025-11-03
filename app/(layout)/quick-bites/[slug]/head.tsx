// app/(layout)/quick-bites/[slug]/head.tsx
import { getQuickBiteBySlug } from "@/lib/quick-bites/quickBites";
import {
  generateSeo,
  generateJsonLdArticle,
  generateJsonLdBreadcrumbs,
} from "@/lib/quick-bites/seo_helper";

type Props = { params: { slug: string } };

export default async function Head({ params }: Props) {
  const qb = getQuickBiteBySlug(params.slug);
  if (!qb) return null;

  const seo = generateSeo(params.slug, qb);
  const jsonLdArticle = generateJsonLdArticle(params.slug, qb, {
    dateModified: qb.date,
    language: "en",
  });
  const jsonLdBreadcrumbs = generateJsonLdBreadcrumbs(params.slug, qb);

  // Try to load per-QB extras (FAQ, Datasets) from the module, but
  // restrict the dynamic import to .ts to avoid README.md getting bundled.
  let jsonLdFaq: any | undefined;
  let jsonLdDatasets: any[] = [];
  try {
    const mod = await import(`@/lib/quick-bites/${params.slug}.ts`).catch(() => null as any);
    if (mod) {
      if (mod.jsonLdFaq) jsonLdFaq = mod.jsonLdFaq;
      if (mod.jsonLdDatasets) jsonLdDatasets = mod.jsonLdDatasets;
    }
  } catch {
    // ignore
  }

  const jsonLdObjects = [
    jsonLdArticle,
    jsonLdBreadcrumbs,
    ...(jsonLdFaq ? [jsonLdFaq] : []),
    ...jsonLdDatasets,
  ];

  return (
    <>
      {/* Canonical (you can also rely on generateMetadata, but this is fine) */}
      <link rel="canonical" href={seo.canonical} />

      {/* Open Graph / Twitter images often live in Metadata; leaving here is optional */}

      {/* Route-specific JSON-LD in HEAD */}
      {jsonLdObjects.map((obj, i) => (
        <script
          // id is optional but helps debugging
          id={`qb-jsonld-${i}`}
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
    </>
  );
}