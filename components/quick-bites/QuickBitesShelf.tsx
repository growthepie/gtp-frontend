"use client";

import { useMemo } from "react";
import { SectionTitle, SectionDescription, SectionButtonLink } from "@/components/layout/TextHeadingComponents";
import QuickBitesGrid from "@/components/quick-bites/QuickBitesGrid";
import { QuickBiteTopicKey, getListedQuickBites, getQuickBiteTopic, getQuickBiteTopicUrl } from "@/lib/quick-bites/themes";

/**
 * A row of Quick Bite cards for a page outside Quick Bites (e.g. /eth), picked by slug,
 * with a link to the matching topic page. Renders nothing if none are published.
 */
export default function QuickBitesShelf({
  slugs,
  topic,
  title = "Read more in Quick Bites",
  description,
}: {
  slugs: string[];
  /** Topic page the "more" link goes to. */
  topic: QuickBiteTopicKey;
  title?: string;
  description?: string;
}) {
  const quickBites = useMemo(() => {
    const listed = getListedQuickBites();
    return slugs
      .map((slug) => listed.find((quickBite) => quickBite.slug === slug))
      .filter((quickBite): quickBite is NonNullable<typeof quickBite> => Boolean(quickBite));
  }, [slugs]);

  if (quickBites.length === 0) return null;
  const topicLabel = getQuickBiteTopic(topic)?.label ?? "Quick Bites";

  return (
    <div className="flex flex-col gap-y-[15px]">
      <div className="flex items-center justify-between gap-x-[10px]">
        <SectionTitle icon="gtp-quick-bites" title={title} titleSize="md" as="h2" />
        <SectionButtonLink href={getQuickBiteTopicUrl(topic)} label={`All on ${topicLabel}`} shortLabel="More" />
      </div>
      {description && <SectionDescription>{description}</SectionDescription>}
      <QuickBitesGrid QuickBites={quickBites} IsLanding={false} />
    </div>
  );
}
