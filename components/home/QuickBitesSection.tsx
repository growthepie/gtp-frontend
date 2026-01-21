// File: components/home/QuickBitesSection.tsx
'use client';

import React from 'react';
import Container from '@/components/layout/Container';
import Heading from '@/components/layout/Heading';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { SectionButtonLink } from '@/components/layout/TextHeadingComponents';
import QuickBiteCard from '@/components/quick-bites/QuickBiteCard';
import { Carousel } from '@/components/Carousel';
import { getFeaturedQuickBites } from '@/lib/quick-bites/quickBites';

const QuickBitesSection: React.FC = () => {
  // Get the latest 6 quick bites to feature (more for carousel)
  const featuredQuickBites = getFeaturedQuickBites(6);

  if (!featuredQuickBites.length) {
    return null;
  }

  // Filter out quick bites that shouldn't be shown in menu
  const filteredQuickBites = featuredQuickBites.filter(qb => qb.showInMenu !== false);

  return (
    <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[60px] mb-[30px] md:mb-[60px] gap-y-[15px] justify-center !px-0">
      <div className="flex justify-between items-center px-[30px] md:px-[50px]">
        <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
          <GTPIcon
            icon="gtp-quick-bites"
            size="lg"
          />
          <Heading
            className="heading-large-lg"
          >
            Quick Bites
          </Heading>
        </div>
        <SectionButtonLink href="/quick-bites" label="See all Quick Bites" shortLabel="More Bites" />
      </div>

      <div className="text-md px-[35px] lg:px-[95px]">
        <p className="mb-2">
          Short data-driven articles on specific topics or trends in the Ethereum ecosystem.
        </p>
      </div>

      <Carousel
        ariaId="quick-bites-carousel"
        heightClass="h-[275px]"
        minSlideWidth={{ 0: 275, 768: 300, 1280: 320 }}
        pagination="dots"
        arrows={false}
        bottomOffset={-28}
      >
        {filteredQuickBites.map((quickBite, index) => (
          <QuickBiteCard
            key={quickBite.slug || index}
            title={quickBite.title}
            bannerImage={quickBite.image || "https://api.growthepie.com/v1/quick-bites/banners/placeholder.png"}
            subtitle={quickBite.subtitle}
            date={quickBite.date}
            icon={quickBite.icon}
            slug={quickBite.slug}
            author={quickBite.author}
            topics={quickBite.topics?.map(topic => ({
              ...topic,
              icon: topic.icon || ""
            }))}
          />
        ))}
      </Carousel>
    </Container>
  );
};

export default QuickBitesSection;