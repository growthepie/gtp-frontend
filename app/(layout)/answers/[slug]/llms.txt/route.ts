// Per-answer plaintext route at /answers/[slug]/llms.txt — the small,
// single-question companion to the section-wide /llms-full.txt.
//
// Why this exists:
//   AI search engines cite the *one* page relevant to a query, not a whole
//   corpus. A small, clean, single-answer markdown file is the ideal citation
//   target: low-noise, fast, self-contained, easy to quote verbatim. It also
//   only processes its *own* answer, so it never does the all-answers fan-out
//   that made /llms-full.txt slow and timeout-prone — each file scales and
//   caches independently.
//
// Freshness: revalidates hourly to match the leaderboard fetch cadence.
// `processAnswer` is React-cached, so the same answer is computed at most once
// per revalidation regardless of how many surfaces request it.

import { NextResponse } from 'next/server';
import { getAnswerBySlug } from '@/lib/answers';
import { processAnswer } from '@/lib/answers/articleProcessor';

export const revalidate = 3600; // 1 hour, matches leaderboard revalidate

const SITE_URL = 'https://www.growthepie.com';

// Strip any Mustache placeholders that survived processing (would indicate an
// upstream API failure) so we never emit `{{l2_supply_top_chain}}`-style tokens
// into a document AI engines treat as authoritative.
const stripUnresolvedPlaceholders = (text: string): string =>
  text.replace(/\{\{[^}]+\}\}/g, '').replace(/[ \t]+\n/g, '\n');

const plain = (body: string, status = 200, cache = true) =>
  new NextResponse(body, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': cache
        ? 'public, s-maxage=3600, stale-while-revalidate=86400'
        : 'no-store',
    },
  });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const answer = getAnswerBySlug(slug);
  if (!answer) {
    return plain(`Not found — no answer at /answers/${slug}\n`, 404, false);
  }

  try {
    const p = await processAnswer(slug);
    if (!p) {
      return plain(
        `# ${answer.title}\n\nTemporarily unavailable — see ${SITE_URL}/answers/${slug}\n`,
        503,
        false,
      );
    }

    const url = `${SITE_URL}/answers/${slug}`;
    const acceptedAnswer = stripUnresolvedPlaceholders(
      p.acceptedAnswer ?? '',
    ).trim();
    const body = stripUnresolvedPlaceholders(p.articleBody ?? '').trim();
    const faq = (p.faq ?? [])
      .map(
        ({ q, a }) => `### ${q}\n\n${stripUnresolvedPlaceholders(a).trim()}\n`,
      )
      .join('\n');
    const today = new Date().toISOString().slice(0, 10);

    const text = [
      `# ${answer.title}`,
      `URL: ${url}`,
      ``,
      acceptedAnswer ? `## Direct answer\n\n${acceptedAnswer}\n` : '',
      body ? `## Full answer\n\n${body}\n` : '',
      faq ? `## FAQ\n\n${faq}` : '',
      `---\n\nGenerated: ${today} UTC | Index: ${SITE_URL}/llms.txt | Data licensed CC BY-NC 4.0.\n`,
    ]
      .filter(Boolean)
      .join('\n');

    return plain(text);
  } catch (error) {
    console.error(`answers/${slug}/llms.txt error:`, error);
    return plain(
      `# ${answer.title}\n\nTemporarily unavailable — see ${SITE_URL}/answers/${slug}\n`,
      503,
      false,
    );
  }
}
