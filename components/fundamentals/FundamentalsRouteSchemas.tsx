// Server Component that emits per-route JSON-LD scripts at the layout level,
// outside the <Providers> Client Component boundary. This keeps the schema
// in parse-time HTML rather than the RSC stream so non-JS crawlers (Google
// Rich Results Test, Bing, schema validators) can read it.
//
// Rendered as a sibling of <Providers> in app/(layout)/layout.tsx, mirroring
// the QuickBiteRouteSchemas pattern.

import { headers } from "next/headers";
import {
  buildAboutThings,
  buildDatasetJsonLd,
  buildDefinedTermSet,
  buildFaqJsonLd,
  buildKeywords,
  findMetricConfig,
  nodeToString,
} from "@/lib/fundamentals/seo";
import { serializeJsonLd } from "@/utils/json-ld";

const FUNDAMENTALS_RE = /^\/fundamentals\/([^/?#]+)\/?$/;

export default async function FundamentalsRouteSchemas() {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  const m = pathname.match(FUNDAMENTALS_RE);
  if (!m) return null;
  const metric = decodeURIComponent(m[1]);

  const metricConfig = findMetricConfig(metric);
  if (!metricConfig) return null;

  const pageData = metricConfig.page;
  const keywords = buildKeywords(metricConfig);
  const aboutThings = buildAboutThings(metricConfig);
  const description = nodeToString(pageData?.description);

  const datasetJsonLd = buildDatasetJsonLd(metric, pageData, {
    description: description || undefined,
    keywords,
    about: aboutThings,
  });
  const faqJsonLd = buildFaqJsonLd(metric, pageData);
  const definedTermSetJsonLd = buildDefinedTermSet(metric, pageData);

  const graphs = [datasetJsonLd, faqJsonLd, definedTermSetJsonLd].filter(
    Boolean,
  ) as Record<string, unknown>[];
  if (graphs.length === 0) return null;

  return (
    <>
      {graphs.map((graph, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
        />
      ))}
    </>
  );
}
