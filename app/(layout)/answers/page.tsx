// Hub page at /answers. Optimised primarily for AI search engines and
// non-JS crawlers — semantic HTML, dense JSON-LD, minimal visual chrome.
// Adding a new entry to `lib/answers/index.ts` automatically lists it here.
//
// SEO surfaces emitted:
//   - `CollectionPage` JSON-LD whose `mainEntity` is an `ItemList` of every
//     QAPage. Each list item embeds the question text and accepted answer so
//     AI can index the entire section in one fetch.
//   - `BreadcrumbList` JSON-LD (Home → Answers).
//   - Visible semantic HTML: H1, intro <p>, an <ol> of <article> elements,
//     each carrying schema.org microdata (`QAPage` / `Question` /
//     `Answer.text`). The visible accepted-answer paragraph mirrors the
//     JSON-LD `acceptedAnswer.text` so AI extractors see the same answer in
//     both rendered HTML and structured data — visible-text agreement is
//     what turns a schema hint into a confident citation.
//   - Canonical URL + Open Graph metadata.
//   - Plain link list at the bottom for non-JS crawlers and AI bots that
//     prefer flat link discovery over nested microdata.

import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllAnswers } from '@/lib/answers';
import { serializeJsonLd } from '@/utils/json-ld';

const SITE_URL = 'https://www.growthepie.com';
const SECTION_PATH = '/answers';
const HUB_TITLE = 'Answers about Ethereum, L2s and onchain applications';
const HUB_DESCRIPTION =
  "Direct, data-backed answers to common questions about Ethereum and its wider ecosystem. This includes Layer 2s, onchain applications, tokens, and stablecoins. Each answer page is recomputed daily from growthepie's public API and links to the underlying datasets.";

// Stable per-UTC-day stamp so AI crawlers see consistent og:image URLs
// within a day without forfeiting cache busting across days.
const HUB_OG_DATE = new Date().toISOString().split('T')[0];
const HUB_OG_IMAGE = `https://api.growthepie.com/v1/og_images/landing.jpg?date=${HUB_OG_DATE}`;

export const metadata: Metadata = {
  title: `${HUB_TITLE} | growthepie`,
  description: HUB_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${SECTION_PATH}` },
  openGraph: {
    type: 'website',
    title: HUB_TITLE,
    description: HUB_DESCRIPTION,
    url: `${SITE_URL}${SECTION_PATH}`,
    images: [
      {
        url: HUB_OG_IMAGE,
        width: 1200,
        height: 627,
        alt: 'growthepie — Answers about Ethereum L2s',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: HUB_TITLE,
    description: HUB_DESCRIPTION,
    images: [HUB_OG_IMAGE],
  },
  // Explicit override of the root layout's `nocache: true` default — answer
  // pages are designed to be cached and quoted by AI engines.
  robots: {
    index: true,
    follow: true,
  },
};

// Count Q&As an answer page exposes: 1 for the headline question (the page
// title itself) plus each sub-question in the FAQ. Surfaced on the hub as a
// "X questions answered" label so AI engines see a concrete depth signal
// without us listing bare questions (which would read as thin content).
const countQuestions = (a: { faq?: { q: string; a: string }[] }): number =>
  1 + (a.faq?.length ?? 0);

// Count FAQ-only sub-questions (the core question is the page title itself
// and is counted separately at the hub level).
const countSubQuestions = (a: { faq?: { q: string; a: string }[] }): number =>
  a.faq?.length ?? 0;

export default function AnswersHubPage() {
  const answers = getAllAnswers().sort((a, b) =>
    // Newest first — when there are many answers, AI engines crawl the top of
    // the list more aggressively, so put the most recent (most likely to be
    // re-quoted) at the top.
    new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // The hub is a discovery/index page: it lists each question with its
  // evergreen one-line summary and links to the canonical answer page, where
  // the live, citable data + QAPage schema live. We deliberately do NOT run
  // the per-answer leaderboard computation here. Doing so for all ~20 answers
  // fanned out into hundreds of upstream fetches (~15s render) which overran
  // the RSC stream and crashed the page client-side ("Connection closed").
  // Questions + summaries + links are sufficient for GEO — AI engines follow
  // the links and cite the deep pages — so the snippet/answer text below uses
  // each answer's static `summary` (never the "Data currently unavailable"
  // acceptedAnswer stub).
  const coreCount = answers.length;
  const subCount = answers.reduce((sum, a) => sum + countSubQuestions(a), 0);

  const collectionPage = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: HUB_TITLE,
    description: HUB_DESCRIPTION,
    url: `${SITE_URL}${SECTION_PATH}`,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'growthepie',
      url: SITE_URL,
    },
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: answers.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: answers.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}${SECTION_PATH}/${a.slug}`,
        item: {
          '@type': 'QAPage',
          '@id': `${SITE_URL}${SECTION_PATH}/${a.slug}`,
          url: `${SITE_URL}${SECTION_PATH}/${a.slug}`,
          name: a.title,
          headline: a.title,
          description: a.summary || a.subtitle,
          inLanguage: 'en',
          mainEntity: {
            '@type': 'Question',
            name: a.title,
            text: a.title,
            answerCount: 1,
            acceptedAnswer: {
              '@type': 'Answer',
              text: a.summary || a.subtitle,
              url: `${SITE_URL}${SECTION_PATH}/${a.slug}`,
            },
          },
        },
      })),
    },
  };

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Answers',
        item: `${SITE_URL}${SECTION_PATH}`,
      },
    ],
  };

  return (
    <>
      {/* JSON-LD lives before the visible content so AI parsers reading
          parse-time HTML see the structured data first. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(collectionPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbs) }}
      />

      <div className="pt-[15px] px-[15px] md:px-[50px] pb-[60px] max-w-[1000px] mx-auto">
        <nav aria-label="Breadcrumb">
          <ol className="flex gap-x-[6px] text-xs text-color-text-secondary mb-[10px]">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page">Answers</li>
          </ol>
        </nav>

        <header>
          <h1 className="heading-large-md md:heading-large-lg mb-[10px]">
            {HUB_TITLE}
          </h1>
          <p className="text-md text-color-text-secondary mb-[24px]">
            {HUB_DESCRIPTION}
          </p>
          <p className="text-sm text-color-text-secondary mb-[24px]">
            Answers to {coreCount} core question
            {coreCount === 1 ? '' : 's'} with a total of {subCount} sub question
            {subCount === 1 ? '' : 's'}.
          </p>
        </header>

        <ol
          aria-label="Answer pages"
          className="flex flex-col gap-y-[20px] list-none p-0"
        >
          {answers.map((a) => {
            const url = `${SECTION_PATH}/${a.slug}`;
            const snippet = a.summary || a.subtitle;
            const qCount = countQuestions(a);
            return (
              <li key={a.slug} className="list-none">
                <article
                  itemScope
                  itemType="https://schema.org/QAPage"
                  className="border-b border-color-bg-medium pb-[15px]"
                >
                  <link itemProp="url" href={`${SITE_URL}${url}`} />
                  <div
                    itemProp="mainEntity"
                    itemScope
                    itemType="https://schema.org/Question"
                  >
                    <h2 className="heading-md mb-[6px]">
                      <Link href={url} className="hover:underline">
                        <span itemProp="name">{a.title}</span>
                      </Link>
                    </h2>
                    {snippet && (
                      <div
                        itemProp="acceptedAnswer"
                        itemScope
                        itemType="https://schema.org/Answer"
                      >
                        <p
                          itemProp="text"
                          className="text-md text-color-text-primary mb-[8px]"
                        >
                          {snippet}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-color-text-secondary mt-[6px]">
                    {qCount} question{qCount === 1 ? '' : 's'} answered
                  </p>
                  {a.topics && a.topics.length > 0 && (
                    <p className="text-xs text-color-text-secondary mt-[6px]">
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

        {/* Plain flat link list at the bottom — duplicates the URLs above in a
            shape AI bots that prefer simple anchor lists (e.g. when traversing
            site structure) can ingest without parsing the article cards. */}
        <section aria-label="All answer URLs" className="mt-[40px]">
          <h2 className="heading-md mb-[10px]">All answers</h2>
          <ul>
            {answers.map((a) => (
              <li key={`flat-${a.slug}`}>
                <Link href={`${SECTION_PATH}/${a.slug}`}>{a.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
