// File: components/quick-dives/QuickBitesGrid.tsx
'use client';

import React from 'react';
import QuickBiteCard from './QuickBiteCard';
import { QuickBiteWithSlug } from '@/lib/types/quickBites';

interface QuickBitesGridProps {
  QuickBites: QuickBiteWithSlug[];
  IsLanding?: boolean; // Optional prop to indicate if this is the landing page
}

const QuickBitesGrid: React.FC<QuickBitesGridProps> = ({ QuickBites, IsLanding = true }) => {
  if (!QuickBites || QuickBites.length === 0) {
    return (
      <div className="w-full py-8 text-center">
        <p>No quick bites available.</p>
      </div>
    );
  }

  // Filter function to exclude test-bite and respect showInMenu property
  const filterQuickBites = (QuickBite: QuickBiteWithSlug) => {
    return  QuickBite.showInMenu !== false;
  };

  if(!IsLanding) {
    return (
      <div className='w-full @container'>
        <div className="w-full grid gap-[10px] grid-cols-1 @[560px]:grid-cols-2 @[845px]:grid-cols-3">
          {QuickBites.filter(filterQuickBites).map((QuickBite, index) => (
            <QuickBiteCard 
              key={QuickBite.slug || index}
              title={QuickBite.title}
              bannerImage={QuickBite.image || "https://api.growthepie.com/v1/quick-bites/banners/placeholder.png"}
              subtitle={QuickBite.subtitle}
              date={QuickBite.date}
              icon={QuickBite.icon}
              slug={QuickBite.slug}
              author={QuickBite.author}
              topics={QuickBite.topics?.map(topic => ({
                ...topic,
                icon: topic.icon || ""
              }))}
              
            />
          ))}
        </div>
      </div>
    );
}
  
  return (
    <div className='w-full h-[275px] overflow-hidden @container'>
      <div className="w-full grid gap-[10px] grid-cols-1 @[560px]:grid-cols-2 @[845px]:grid-cols-3 h-[275px]">
        {QuickBites.filter(filterQuickBites).map((QuickBite, index) => (
          <QuickBiteCard 
            key={QuickBite.slug || index}
            title={QuickBite.title}
            bannerImage={QuickBite.image || "https://api.growthepie.com/v1/quick-bites/banners/placeholder.png"}
            subtitle={QuickBite.subtitle}
            date={QuickBite.date}
            icon={QuickBite.icon}
            slug={QuickBite.slug}
            author={QuickBite.author}
            topics={QuickBite.topics?.map(topic => ({
              ...topic,
              icon: topic.icon || ""
            }))}
            
          />
        ))}
      </div>
    </div>
  );
};

export default QuickBitesGrid;