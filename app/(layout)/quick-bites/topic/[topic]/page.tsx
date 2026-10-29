// File: app/(layout)/quick-bites/topic/[topic]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/Container";
import { Title } from "@/components/layout/TextHeadingComponents";
import QuickBitesBrowser from "@/components/quick-bites/QuickBitesBrowser";
import {
  QUICK_BITE_TOPICS,
  getQuickBiteTopic,
  getQuickBiteTopicUrl,
  getQuickBitesForTopic,
} from "@/lib/quick-bites/themes";
import { serializeJsonLd } from "@/utils/json-ld";

const SITE_ORIGIN = "https://www.growthepie.com";

type Props = { params: Promise<{ topic: string }> };

// One static page per topic; anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return QUICK_BITE_TOPICS.map((topic) => ({ topic: topic.key }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: key } = await params;
  const topic = getQuickBiteTopic(key);
  if (!topic) return {};
  const canonical = `${SITE_ORIGIN}${getQuickBiteTopicUrl(topic.key)}`;
  return {
    title: `${topic.label} | Quick Bites | growthepie`,
    description: topic.description,
    alternates: { canonical },
    openGraph: {
      title: `${topic.label} | Quick Bites | growthepie`,
      description: topic.description,
      url: canonical,
    },
  };
}

export default async function QuickBitesTopicPage({ params }: Props) {
  const { topic: key } = await params;
  const topic = getQuickBiteTopic(key);
  if (!topic) notFound();

  const quickBites = getQuickBitesForTopic(topic.key);
  const url = `${SITE_ORIGIN}${getQuickBiteTopicUrl(topic.key)}`;

  // A collection page listing its Quick Bites, so search engines and AI crawlers can
  // see the topic and what belongs to it without running the page.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${topic.label} – Quick Bites`,
    description: topic.description,
    url,
    isPartOf: { "@type": "WebSite", name: "growthepie", url: SITE_ORIGIN },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: quickBites.length,
      itemListElement: quickBites.map((quickBite, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_ORIGIN}/quick-bites/${quickBite.slug}`,
        name: quickBite.title,
      })),
    },
  };

  return (
    <div className="pt-[15px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <PageContainer>
        {/* !h-auto: the title can wrap to two lines on phones without covering the intro. */}
        <Title title={`Quick Bites: ${topic.label}`} icon={topic.icon} as="h1" containerClassName="!h-auto min-h-[43px]" />
        <p className="text-md mb-4">{topic.description}</p>
        <QuickBitesBrowser quickBites={quickBites} activeTopic={topic.key} />
      </PageContainer>
    </div>
  );
}
