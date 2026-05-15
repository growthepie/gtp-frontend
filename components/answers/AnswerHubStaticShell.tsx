// Server Component that emits the static, SEO-only shell for the /answers
// hub. The interactive React UI from app/(layout)/answers/page.tsx lives
// inside <Providers> and streams through a Suspense boundary, so AI crawlers
// see an empty body. This shell lives outside <Providers> in the root layout
// and renders semantic HTML + microdata in parse-time HTML.
//
// Visually hidden via sr-only style + aria-hidden so it doesn't duplicate
// the interactive hub UI for sighted/AT users.

import { headers } from 'next/headers';
import Link from 'next/link';
import { getAllAnswers } from '@/lib/answers';

const ANSWER_HUB_RE = /^\/answers\/?$/;

const SECTION_PATH = '/answers';
const SITE_URL = 'https://www.growthepie.com';
const HUB_TITLE = 'Answers about Ethereum, L2s and onchain applications';
const HUB_DESCRIPTION =
  "Direct, data-backed answers to common questions about Ethereum and its wider ecosystem. This includes Layer 2s, onchain applications, tokens, and stablecoins. Each answer page is recomputed daily from growthepie's public API and links to the underlying datasets.";

const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

// Total Q&A count per answer page: 1 for the headline question (the page
// title) plus each sub-question in the FAQ. Used by the per-card "X questions
// answered" label so AI crawlers see the same depth signal as users.
const countQuestions = (a: { faq?: { q: string; a: string }[] }): number =>
  1 + (a.faq?.length ?? 0);

// FAQ-only sub-question count, used for the hub-level summary which treats
// the page title as the "core" question and the FAQ as "sub" questions.
const countSubQuestions = (a: { faq?: { q: string; a: string }[] }): number =>
  a.faq?.length ?? 0;

export default async function AnswerHubStaticShell() {
  const h = await headers();
  const pathname = h.get('x-pathname') || '';
  if (!ANSWER_HUB_RE.test(pathname)) return null;

  const answers = getAllAnswers().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const coreCount = answers.length;
  const subCount = answers.reduce((sum, a) => sum + countSubQuestions(a), 0);

  return (
    <div
      id="answer-hub-static-shell"
      aria-hidden="true"
      style={SR_ONLY}
      data-prerender="answer-hub"
    >
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>Answers</li>
        </ol>
      </nav>

      <header>
        <h1>{HUB_TITLE}</h1>
        <p>{HUB_DESCRIPTION}</p>
        <p>
          Answers to {coreCount} core question
          {coreCount === 1 ? '' : 's'} with a total of {subCount} sub question
          {subCount === 1 ? '' : 's'}.
        </p>
      </header>

      <ol aria-label="Answer pages">
        {answers.map((a) => {
          const url = `${SECTION_PATH}/${a.slug}`;
          const snippet = (a as any).summary || a.subtitle;
          const qCount = countQuestions(a);
          return (
            <li key={a.slug}>
              <article
                itemScope
                itemType="https://schema.org/QAPage"
              >
                <link itemProp="url" href={`${SITE_URL}${url}`} />
                <h2>
                  <Link href={url} itemProp="mainEntityOfPage">
                    <span
                      itemProp="name"
                      itemScope
                      itemType="https://schema.org/Question"
                    >
                      <span itemProp="name">{a.title}</span>
                    </span>
                  </Link>
                </h2>
                {snippet && <p itemProp="description">{snippet}</p>}
                <p>
                  {qCount} question{qCount === 1 ? '' : 's'} answered
                </p>
                {a.topics && a.topics.length > 0 && (
                  <p>
                    Topics:{' '}
                    {a.topics.map((t, i) => (
                      <span key={`${t.name}-${i}`}>
                        {i > 0 && ', '}
                        {t.url ? <Link href={t.url}>{t.name}</Link> : t.name}
                      </span>
                    ))}
                  </p>
                )}
              </article>
            </li>
          );
        })}
      </ol>

      {/* Flat link list for AI bots that prefer simple anchor lists over
          nested microdata. Mirrors the same surface from the visible page. */}
      <section aria-label="All answer URLs">
        <h2>All answers</h2>
        <ul>
          {answers.map((a) => (
            <li key={`flat-${a.slug}`}>
              <Link href={`${SECTION_PATH}/${a.slug}`}>{a.title}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
