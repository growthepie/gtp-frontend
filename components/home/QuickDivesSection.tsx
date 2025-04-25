// File: components/home/QuickDivesSection.tsx
'use client'; // Add this directive to mark it as a client component

import React from 'react';
import Container from '@/components/layout/Container';
import Heading from '@/components/layout/Heading';
import Subheading from '@/components/layout/Subheading';
import { GTPIcon } from '@/components/layout/GTPIcon';
import QuickDiveCard from '@/components/quick-dives/QuickDiveCard';
import { SectionButtonLink } from '@/components/layout/TextHeadingComponents';
import { getFeaturedQuickDives } from '@/lib/mock/quickDivesData';

const QuickDivesSection: React.FC = () => {
  // Get featured quick dives (most recent ones) for the landing page
  const featuredQuickDives = getFeaturedQuickDives(3);

  return (
    <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[60px] mb-[15px] md:mb-[15px] gap-y-[15px] justify-center">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
          <GTPIcon
            icon="gtp-project"
            size="lg"
          />
          <Heading
            className="heading-large-lg"
          >
            Quick Dives
          </Heading>
        </div>
        <SectionButtonLink href="/quick-dives" label="See all Quick Dives" shortLabel="More dives" />
      </div>
      <Subheading className="text-md px-[5px] lg:px-[45px]">
        In-depth looks at interesting blockchain development trends and technologies
      </Subheading>
      
      {/* Quick Dives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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