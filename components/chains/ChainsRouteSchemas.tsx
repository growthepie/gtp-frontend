// Server Component that emits per-route JSON-LD for /chains/[chain] outside
// the <Providers> client boundary, so schema lives in parse-time HTML for
// non-JS AI crawlers and schema validators. Mirrors FundamentalsRouteSchemas
// and AnswerRouteSchemas.

import { headers } from "next/headers";
import { buildChainGraphs } from "@/lib/chainSeo";
import { serializeJsonLd } from "@/utils/json-ld";

const CHAIN_RE = /^\/chains\/([^/?#]+)\/?$/;

export default async function ChainsRouteSchemas() {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  const m = pathname.match(CHAIN_RE);
  if (!m) return null;
  const urlKey = decodeURIComponent(m[1]);

  let graphs: Record<string, unknown>[] | null;
  try {
    graphs = await buildChainGraphs(urlKey);
  } catch (e) {
    console.error(`ChainsRouteSchemas failed for "${urlKey}":`, e);
    return null;
  }
  if (!graphs || graphs.length === 0) return null;

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
