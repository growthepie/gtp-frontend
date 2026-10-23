// File: components/home/QuickBitesSection.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Container from '@/components/layout/Container';
import Heading from '@/components/layout/Heading';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { SectionButtonLink } from '@/components/layout/TextHeadingComponents';
import QuickBiteCard from '@/components/quick-bites/QuickBiteCard';
import QuickBitesTopicBar from '@/components/quick-bites/QuickBitesTopicBar';
import { Carousel } from '@/components/Carousel';
import { getListedQuickBites, getQuickBiteTopicUrl } from '@/lib/quick-bites/themes';
import { QuickBiteWithSlug } from '@/lib/types/quickBites';
import { TRACKER_HEADLINES } from '@/lib/quick-bites/trackerHeadlines';
import useSWR from 'swr';

const LATEST_COUNT = 6;
// On phones the tracker list stops here; the "All live trackers" link leads to the rest.
const TRACKERS_ON_PHONE = 3;

// The landing page's Quick Bites: the topic tab bar, the live trackers (always shown,
// whatever their publish date, so they don't drop out behind newer articles), and a
// carousel of the newest articles and reports.
const QuickBitesSection: React.FC = () => {
  const listed = getListedQuickBites();
  const trackers = mixByTopic(listed.filter((quickBite) => quickBite.kind === 'tracker'));
  const latest = listed.filter((quickBite) => quickBite.kind !== 'tracker').slice(0, LATEST_COUNT);

  if (!listed.length) {
    return null;
  }

  return (
    <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[60px] mb-[30px] md:mb-[60px] gap-y-[15px] justify-center !px-0">
      <div className="flex justify-between items-center px-[20px] md:px-[50px]">
        <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
          <GTPIcon icon="gtp-quick-bites" size="lg" />
          <Heading className="heading-large-lg">Quick Bites</Heading>
        </div>
        <SectionButtonLink href="/quick-bites" label="See all Quick Bites" shortLabel="More Bites" />
      </div>
      <div className="text-md px-[20px] lg:px-[50px]">
        <p>Data stories and live trackers on Ethereum and its Layer 2s.</p>
      </div>

      <div className="px-[20px] md:px-[50px]">
        <QuickBitesTopicBar activeTopic={null} />
      </div>

      {trackers.length > 0 && (
        <div className="flex flex-col gap-y-[10px] px-[20px] md:px-[50px] pt-[15px]">
          <div className="flex items-center justify-between gap-x-[10px]">
            <h3 className="heading-caps-xs text-color-text-secondary">Live trackers</h3>
            <Link href={getQuickBiteTopicUrl('trackers')} className="text-xs text-color-text-secondary hover:text-color-text-primary hover:underline">
              All live trackers →
            </Link>
          </div>
          <div className="@container">
            <div className="grid grid-cols-1 @[560px]:grid-cols-2 @[845px]:grid-cols-3 gap-[10px]">
              {trackers.map((tracker, index) => (
                <LiveTrackerTile
                  key={tracker.slug}
                  quickBite={tracker}
                  className={index >= TRACKERS_ON_PHONE ? 'hidden @[560px]:flex' : 'flex'}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {latest.length > 0 && (
        <>
          <h3 className="heading-caps-xs text-color-text-secondary px-[20px] md:px-[50px] pt-[15px]">Latest</h3>
          <Carousel
            ariaId="quick-bites-carousel"
            heightClass="h-[275px]"
            minSlideWidth={{ 0: 275, 768: 300, 1280: 320 }}
            pagination="dots"
            arrows={false}
            bottomOffset={-28}
          >
            {latest.map((quickBite, index) => (
              <QuickBiteCard
                key={quickBite.slug || index}
                title={quickBite.title}
                bannerImage={quickBite.image || "https://api.growthepie.com/v1/quick-bites/banners/placeholder.png"}
                subtitle={quickBite.subtitle}
                date={quickBite.date}
                icon={quickBite.icon}
                slug={quickBite.slug}
                kind={quickBite.kind}
                author={quickBite.author}
                topics={quickBite.topics?.map(topic => ({
                  ...topic,
                  icon: topic.icon || ""
                }))}
              />
            ))}
          </Carousel>
        </>
      )}
    </Container>
  );
};

/**
 * Newest first, but taking turns between topics (newest stablecoin tracker, newest
 * token-economics tracker, …), so the first tiles, all a phone shows, aren't all
 * the same subject.
 */
const mixByTopic = (quickBites: QuickBiteWithSlug[]) => {
  const groups = new Map<string, QuickBiteWithSlug[]>();
  quickBites.forEach((quickBite) => {
    const key = quickBite.themes?.[0] ?? 'other';
    groups.set(key, [...(groups.get(key) ?? []), quickBite]);
  });
  const mixed: QuickBiteWithSlug[] = [];
  for (let round = 0; mixed.length < quickBites.length; round++) {
    groups.forEach((group) => {
      if (group[round]) mixed.push(group[round]);
    });
  }
  return mixed;
};

/** A compact tile for a live tracker: pulsing real-time icon, title and one line of context. */
const LiveTrackerTile = ({ quickBite, className = 'flex' }: { quickBite: QuickBiteWithSlug; className?: string }) => (
  <Link
    href={`/quick-bites/${quickBite.slug}`}
    className={`group ${className} items-center gap-x-[10px] h-full min-h-[72px] px-[15px] py-[10px] rounded-[15px] border border-color-bg-medium transition-colors duration-200 hover:bg-color-bg-medium`}
  >
    <GTPIcon icon="gtp-realtime" size="sm" className="shrink-0 animate-pulse" />
    {/* Small title over a large number (as on the metric cards), so the two read apart. */}
    <div className="flex flex-col min-w-0 flex-1 gap-y-[6px]">
      <div className="heading-small-xxs truncate group-hover:underline">{quickBite.shortTitle}</div>
      {TRACKER_HEADLINES[quickBite.slug] ? (
        <TrackerHeadlineLine source={TRACKER_HEADLINES[quickBite.slug]} fallback={quickBite.subtitle} />
      ) : (
        <div className="text-xs text-color-text-secondary line-clamp-2">{quickBite.subtitle}</div>
      )}
    </div>
    <div className="shrink-0 size-[24px] bg-color-bg-medium rounded-full flex items-center justify-center transition-colors duration-200 group-hover:bg-color-ui-hover">
      <GTPIcon icon="gtp-chevronright-monochrome" size="sm" className="!size-[12px]" containerClassName="!size-[12px]" />
    </div>
  </Link>
);

/**
 * The tracker's live number ("122.15M ETH  supply · +0.79%/yr"). A placeholder bar holds
 * the line's height while it loads; if the data can't be read, the subtitle shows instead.
 */
const TrackerHeadlineLine = ({
  source,
  fallback,
}: {
  source: (typeof TRACKER_HEADLINES)[string];
  fallback: string;
}) => {
  const { data, error } = useSWR(source.url);
  const headline = data ? source.read(data) : null;

  if (error || (data && !headline)) {
    return <div className="text-xs text-color-text-secondary truncate">{fallback}</div>;
  }
  if (!headline) {
    return <div className="h-[20px] w-[160px] max-w-full rounded-full bg-color-bg-medium animate-pulse" aria-hidden />;
  }
  return (
    <div className="flex items-baseline gap-x-[8px] min-w-0 h-[20px]">
      <span className="numbers-xl whitespace-nowrap">{headline.value}</span>
      {headline.change && (
        <span className={`numbers-xs whitespace-nowrap ${headline.change.percent < 0 ? 'text-color-negative' : 'text-color-positive'}`}>
          {headline.change.percent >= 0 ? '+' : ''}{headline.change.percent.toFixed(1)}% {headline.change.period}
        </span>
      )}
      <span className="heading-small-xxxs text-color-text-secondary truncate">{headline.label}</span>
    </div>
  );
};

export default QuickBitesSection;
