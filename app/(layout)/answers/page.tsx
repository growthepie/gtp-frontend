// Hub page at /answers. Optimised primarily for AI search engines and
// non-JS crawlers — semantic HTML, dense JSON-LD, minimal visual chrome.
// Adding a new entry to `lib/answers/index.ts` automatically lists it here.
//
// SEO surfaces emitted:
//   - `CollectionPage` JSON-LD whose `mainEntity` is an `ItemList` of every
//     QAPage. Each list item embeds the question text and abstract so AI
//     can index the entire section in one fetch.
//   - `BreadcrumbList` JSON-LD (Home → Answers).
//   - Visible semantic HTML: H1, intro <p>, an <ol> of <article> elements,
//     each carrying schema.org microdata (`QAPage` / `Question`).
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

export default function AnswersHubPage() {
  const answers = getAllAnswers().sort((a, b) =>
    // Newest first — when there are many answers, AI engines crawl the top of
    // the list more aggressively, so put the most recent (most likely to be
    // re-quoted) at the top.
    new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

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
              text: (a as any).acceptedAnswer || a.summary || a.subtitle,
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
        </header>

        <ol
          aria-label="Answer pages"
          className="flex flex-col gap-y-[20px] list-none p-0"
        >
          {answers.map((a) => {
            const url = `${SECTION_PATH}/${a.slug}`;
            const snippet = a.summary || a.subtitle;
            return (
              <li key={a.slug} className="list-none">
                <article
                  itemScope
                  itemType="https://schema.org/QAPage"
                  className="border-b border-color-bg-medium pb-[15px]"
                >
                  <link itemProp="url" href={`${SITE_URL}${url}`} />
                  <h2 className="heading-md mb-[6px]">
                    <Link
                      href={url}
                      itemProp="mainEntityOfPage"
                      className="hover:underline"
                    >
                      <span
                        itemProp="name"
                        itemScope
                        itemType="https://schema.org/Question"
                      >
                        <span itemProp="name">{a.title}</span>
                      </span>
                    </Link>
                  </h2>
                  {snippet && (
                    <p
                      itemProp="description"
                      className="text-sm text-color-text-secondary"
                    >
                      {snippet}
                    </p>
                  )}
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
