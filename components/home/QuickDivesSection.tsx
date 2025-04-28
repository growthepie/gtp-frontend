// File: components/home/QuickDivesSection.tsx
'use client';

import React from 'react';
import Container from '@/components/layout/Container';
import Heading from '@/components/layout/Heading';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { SectionButtonLink } from '@/components/layout/TextHeadingComponents';
import QuickDivesGrid from '@/components/quick-dives/QuickDivesGrid';
import { getFeaturedQuickDives } from '@/lib/mock/quickDivesData';

const QuickDivesSection: React.FC = () => {
  // Get the latest 3 quick dives to feature
  const featuredQuickDives = getFeaturedQuickDives(3);
  
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
      
      <QuickDivesGrid quickDives={featuredQuickDives} />
    </Container>
  );
};

export default QuickDivesSection;