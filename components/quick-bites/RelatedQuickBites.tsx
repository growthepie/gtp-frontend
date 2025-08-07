// File: components/quick-dives/RelatedQuickBites.tsx
'use client';

import React from 'react';
import QuickBiteCard from './QuickBiteCard';
import { QuickBiteWithSlug } from '@/lib/types/quickBites';
import Heading from '@/components/layout/Heading';

interface RelatedQuickBitesProps {
  relatedQuickBites: QuickBiteWithSlug[];
  mainTopics: {
    icon: string;
    color?: string;
    name: string;
    url: string;
  }[];  
}

const RelatedQuickBites: React.FC<RelatedQuickBitesProps> = ({ relatedQuickBites, mainTopics }) => {
  if (!relatedQuickBites || relatedQuickBites.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 mb-8">
      <Heading as="h2" className="heading-large-lg mb-8">
        Related Quick Bites
      </Heading>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedQuickBites.map((QuickBite) => (
          <QuickBiteCard 
            key={QuickBite.slug}
            title={QuickBite.title}
            subtitle={QuickBite.subtitle}
            bannerImage={QuickBite.image || "https://api.growthepie.com/v1/quick-bites/banners/placeholder.png"}
            date={QuickBite.date}
            icon={QuickBite.icon}
            slug={QuickBite.slug}
            author={QuickBite.author}
            topics={QuickBite.topics?.map(topic => ({
              ...topic,
              icon: topic.icon || ""
            }))}
            isRelatedPage={true}
            mainTopics={mainTopics}
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedQuickBites;