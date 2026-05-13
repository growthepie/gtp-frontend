// Server Component that emits JSON-LD for the /answers hub outside the
// <Providers> client boundary. Mirrors AnswerRouteSchemas (which handles
// /answers/[slug]) so the hub gets its CollectionPage + BreadcrumbList in
// parse-time HTML for AI crawlers, instead of streaming through Suspense.

import { headers } from 'next/headers';
import { getAllAnswers } from '@/lib/answers';
import { serializeJsonLd } from '@/utils/json-ld';

const ANSWER_HUB_RE = /^\/answers\/?$/;

const SITE_URL = 'https://www.growthepie.com';
const SECTION_PATH = '/answers';
const HUB_TITLE = 'Answers about Ethereum, L2s and onchain applications';
const HUB_DESCRIPTION =
  "Direct, data-backed answers to common questions about Ethereum and its wider ecosystem. This includes Layer 2s, onchain applications, tokens, and stablecoins. Each answer page is recomputed daily from growthepie's public API and links to the underlying datasets.";

export default async function AnswerHubSchemas() {
  const h = await headers();
  const pathname = h.get('x-pathname') || '';
  if (!ANSWER_HUB_RE.test(pathname)) return null;

  const answers = getAllAnswers().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
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
          description: (a as any).summary || a.subtitle,
          inLanguage: 'en',
          mainEntity: {
            '@type': 'Question',
            name: a.title,
            text: a.title,
            answerCount: 1,
            acceptedAnswer: {
              '@type': 'Answer',
              text: (a as any).acceptedAnswer || (a as any).summary || a.subtitle,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(collectionPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbs) }}
      />
    </>
  );
}
