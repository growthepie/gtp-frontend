// Server Component that emits per-route JSON-LD for /answers/[slug] outside
// the <Providers> client boundary, so schema lives in parse-time HTML.

import { headers } from 'next/headers';
import { processAnswer } from '@/lib/answers/articleProcessor';
import { serializeJsonLd } from '@/utils/json-ld';

const ANSWER_RE = /^\/answers\/([^/?#]+)\/?$/;

export default async function AnswerRouteSchemas() {
  const h = await headers();
  const pathname = h.get('x-pathname') || '';
  const m = pathname.match(ANSWER_RE);
  if (!m) return null;
  const slug = decodeURIComponent(m[1]);
  if (slug === 'index') return null;

  let processed;
  try {
    processed = await processAnswer(slug);
  } catch (e) {
    console.error(`AnswerRouteSchemas failed for "${slug}":`, e);
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
