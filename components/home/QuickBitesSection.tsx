// File: components/home/QuickBitesSection.tsx
'use client';

import React from 'react';
import Container from '@/components/layout/Container';
import Heading from '@/components/layout/Heading';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { SectionButtonLink } from '@/components/layout/TextHeadingComponents';
import QuickBitesGrid from '@/components/quick-bites/QuickBitesGrid';
import { getFeaturedQuickBites } from '@/lib/quick-bites/quickBites';

const QuickBitesSection: React.FC = () => {
  // Get the latest 3 quick bites to feature
  const featuredQuickBites = getFeaturedQuickBites(3);
  
  if (!featuredQuickBites.length) {
    return null;
  }

  return (
    <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[60px] mb-[30px] md:mb-[60px] gap-y-[15px] justify-center">
      <div className="flex justify-between items-center">
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
        <SectionButtonLink href="/quick-bites" label="See all quick bites" shortLabel="More dives" />
      </div>
      
      <div className="text-md px-[5px] lg:px-[45px]">
        <p className="mb-2">
          Short and focused analyses of specific topics or trends in the Ethereum ecosystem
        </p>
      </div>
      
      <QuickBitesGrid QuickBites={featuredQuickBites} />
    </Container>
  );
};

export default QuickBitesSection;