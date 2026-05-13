// Server Component that emits per-route JSON-LD scripts at the layout level,
// outside the <Providers> Client Component boundary. This keeps the schema
// in parse-time HTML rather than the RSC stream so non-JS crawlers (Google
// Rich Results Test, Bing, schema validators) can read it.
//
// Rendered as a sibling of <Providers> in app/(layout)/layout.tsx.

import { headers } from "next/headers";
import { processArticle } from "@/lib/quick-bites/articleProcessor";
import { serializeJsonLd } from "@/utils/json-ld";

const QUICK_BITE_RE = /^\/quick-bites\/([^/?#]+)\/?$/;

export default async function QuickBiteRouteSchemas() {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  const m = pathname.match(QUICK_BITE_RE);
  if (!m) return null;
  const slug = decodeURIComponent(m[1]);
  if (slug === "index") return null;

  let processed;
  try {
    processed = await processArticle(slug);
  } catch (e) {
    console.error(`QuickBiteRouteSchemas failed for "${slug}":`, e);
    return null;
  }
  if (!processed) return null;

  return (
    <>
      {processed.schemas.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(obj) }}
        />
      ))}
    </>
  );
}
