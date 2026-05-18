// Full-text dump of growthepie's AI-search-optimised /answers section,
// served as a single plaintext document at /llms-full.txt — the companion
// to the index-only /llms.txt and the emerging llmstxt.org "full" standard.
//
// Why this exists:
//   AI crawlers and training pipelines that respect the llms.txt convention
//   look for /llms-full.txt as a single-fetch ingestion point for a site's
//   substantive content. /llms.txt is a link index; /llms-full.txt is the
//   actual prose. Without this route, /llms-full.txt was 404-falling through
//   to the not-found catch-all and returning HTML with status 200 —
//   confusingly registered as "available" by crawlers.
//
// Scope:
//   First version covers the /answers section only — it has a unified
//   processing pipeline (`processAnswer`) that performs live-data
//   substitution against growthepie's API, so the emitted text matches what
//   AI engines see on the rendered pages. Quick-bites and chain/fundamentals
//   pages can be folded in later as their pipelines stabilise.
//
// Freshness:
//   Revalidates hourly to match the underlying leaderboard fetch cadence.
//   `processAnswer` is React-cached, so leaderboards are fetched at most
//   once per revalidation regardless of how many answers share a kind.

import { NextResponse } from 'next/server';
import { getAllAnswers } from '@/lib/answers';
import { processAnswer } from '@/lib/answers/articleProcessor';

export const revalidate = 3600; // 1 hour, matches leaderboard revalidate

const SITE_URL = 'https://www.growthepie.com';

const HEADER = `# growthepie — Full Content

> growthepie is the open analytics platform for the Ethereum ecosystem,
> tracking real-time and historical metrics across Ethereum Mainnet, Layer 2
> networks, and onchain applications. This file is the companion to
> /llms.txt and contains the full prose of the /answers section — direct,
> data-backed answers to common questions about Ethereum and its wider
> ecosystem. Recomputed daily from growthepie's public API.

> Data licensed CC BY-NC 4.0. Source: ${SITE_URL}
`;

// Strip any Mustache placeholders that survived processing (would indicate
// an upstream API failure on a per-answer basis — we don't want to emit
// `{{l2_supply_top_chain}}` style tokens into a document AI engines will
// treat as authoritative).
const stripUnresolvedPlaceholders = (text: string): string =>
  text.replace(/\{\{[^}]+\}\}/g, '').replace(/[ \t]+\n/g, '\n');

export async function GET() {
  try {
    const answers = getAllAnswers().sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Process every answer in parallel. Each `processAnswer` call fetches
    // its leaderboard (deduped across calls by React.cache) and performs
    // placeholder substitution, so the emitted text reflects current data.
    const processed = await Promise.all(
      answers.map(async (a) => ({ raw: a, p: await processAnswer(a.slug) })),
    );

    const sections = processed
      .filter(({ p }) => p !== null)
      .map(({ raw, p }) => {
        const url = `${SITE_URL}/answers/${raw.slug}`;
        const title = raw.title;
        const acceptedAnswer = p!.acceptedAnswer;
        const body = stripUnresolvedPlaceholders(p!.articleBody ?? '');
        const faq = (p!.faq ?? [])
          .map(
            ({ q, a }) =>
              `### ${q}\n\n${stripUnresolvedPlaceholders(a).trim()}\n`,
          )
          .join('\n');

        return [
          `## ${title}`,
          `URL: ${url}`,
          ``,
          `### Direct answer`,
          ``,
          stripUnresolvedPlaceholders(acceptedAnswer).trim(),
          ``,
          body ? `### Full answer\n\n${body.trim()}\n` : '',
          faq ? `### FAQ\n\n${faq}` : '',
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n\n---\n\n');

    const today = new Date().toISOString().slice(0, 10);
    const footer = `\n---\n\nGenerated: ${today} UTC\nIndex: ${SITE_URL}/llms.txt\n`;

    const text = `${HEADER}\n${sections}\n${footer}`;

    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('llms-full.txt error:', error);
    return new NextResponse(
      `# growthepie\n\nTemporarily unavailable — see ${SITE_URL}/llms.txt for the link index.\n`,
      {
        status: 503,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}
