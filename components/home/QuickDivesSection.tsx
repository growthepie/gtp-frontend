'use client';

import React from 'react';
import Container from '@/components/layout/Container';
import Heading from '@/components/layout/Heading';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { SectionButtonLink } from '@/components/layout/TextHeadingComponents';
import QuickDiveCard from '@/components/quick-dives/QuickDiveCard';
import { getFeaturedQuickDives } from '@/lib/mock/quickDivesData';

const QuickDivesSection: React.FC = () => {
  // Get the latest 3 quick dives to feature
  const featuredQuickDives = getFeaturedQuickDives(3).map(dive => ({
    ...dive,
    slug: dive.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
  }));
  
  if (!featuredQuickDives.length) {
    return null;
  }

  return (
    <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[60px] mb-[30px] md:mb-[60px] gap-y-[15px] justify-center">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
          <GTPIcon
            icon="gtp-metrics-activeaddresses"
            size="lg"
          />
          <Heading
            className="heading-large-lg"
          >
            Quick Dives
          </Heading>
        </div>
        <SectionButtonLink href="/quick-dives" label="See all quick dives" shortLabel="More dives" />
      </div>
      
      <div className="text-md px-[5px] lg:px-[45px] mb-8">
        <p className="mb-2">
          Get in-depth knowledge on specific technologies and developments in the Ethereum ecosystem through 
          our focused, visual explanations.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-[5px] lg:px-[45px]">
        {featuredQuickDives.map((quickDive, index) => (
          <QuickDiveCard
            key={index}
            title={quickDive.title}
            subtitle={quickDive.subtitle}
            date={quickDive.date}
            icon={quickDive.icon}
            slug={quickDive.slug}
            author={quickDive.author}
          />
        ))}
      </div>
    </Container>
  );
};

export default QuickDivesSection;