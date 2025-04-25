// File: components/home/QuickDivesSection.tsx
'use client'; // Add this directive to mark it as a client component

import React from 'react';
import Container from '@/components/layout/Container';
import Heading from '@/components/layout/Heading';
import Subheading from '@/components/layout/Subheading';
import { GTPIcon } from '@/components/layout/GTPIcon';
import QuickDiveCard from '@/components/quick-dives/QuickDiveCard';
import { SectionButtonLink } from '@/components/layout/TextHeadingComponents';

// Mock data for quick dives
const QUICK_DIVES = [
  {
    title: "Pectra: Tx type 4",
    subtitle: "Understanding transaction types and their impacts",
    date: "2025-04-17",
    icon: "gtp-metrics-transactioncount",
    slug: "pectra-tx-type-4"
  },
  {
    title: "Optimism Bedrock",
    subtitle: "A new foundation for Optimism's L2 solution",
    date: "2025-03-20",
    icon: "optimism-logo-monochrome",
    slug: "optimism-bedrock"
  },
  {
    title: "Arbitrum Nitro",
    subtitle: "Exploring Arbitrum's next-generation tech stack",
    date: "2025-01-15",
    icon: "arbitrum-logo-monochrome",
    slug: "arbitrum-nitro"
  }
];

const QuickDivesSection: React.FC = () => {
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
        {QUICK_DIVES.map((quickDive, index) => (
          <QuickDiveCard 
            key={index}
            title={quickDive.title}
            subtitle={quickDive.subtitle}
            date={quickDive.date}
            icon={quickDive.icon}
            slug={quickDive.slug}
          />
        ))}
      </div>
    </Container>
  );
};

export default QuickDivesSection;