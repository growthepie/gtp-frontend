// File: components/quick-dives/RelatedQuickDives.tsx
'use client';

import React from 'react';
import QuickDiveCard from './QuickDiveCard';
import { QuickDiveWithSlug } from '@/lib/types/quickDives';
import Heading from '@/components/layout/Heading';

interface RelatedQuickDivesProps {
  relatedQuickDives: QuickDiveWithSlug[];
}

const RelatedQuickDives: React.FC<RelatedQuickDivesProps> = ({ relatedQuickDives }) => {
  if (!relatedQuickDives || relatedQuickDives.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 mb-8">
      <Heading as="h2" className="heading-large-lg mb-8">
        Related Quick Dives
      </Heading>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedQuickDives.map((quickDive) => (
          <QuickDiveCard 
            key={quickDive.slug}
            title={quickDive.title}
            subtitle={quickDive.subtitle}
            date={quickDive.date}
            icon={quickDive.icon}
            slug={quickDive.slug}
            author={quickDive.author}
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedQuickDives;