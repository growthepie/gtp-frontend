// File: components/quick-dives/QuickBitesGrid.tsx
'use client';

import React from 'react';
import QuickBiteCard from './QuickBiteCard';
import { QuickBiteWithSlug } from '@/lib/types/quickBites';

interface QuickBitesGridProps {
  QuickBites: QuickBiteWithSlug[];
}

const QuickBitesGrid: React.FC<QuickBitesGridProps> = ({ QuickBites }) => {
  if (!QuickBites || QuickBites.length === 0) {
    return (
      <div className="w-full py-8 text-center">
        <p>No quick bites available.</p>
      </div>
    );
  }
  
  return (
    <div className='w-full h-[275px] overflow-hidden @container'>
      <div className="w-full grid gap-[10px] grid-cols-1 @[560px]:grid-cols-2 @[845px]:grid-cols-3 h-[275px]">
        {QuickBites.map((QuickBite, index) => (
          <QuickBiteCard 
            key={QuickBite.slug || index}
            title={QuickBite.title}
            bannerImage={QuickBite.image || "https://api.growthepie.com/v1/quick-bites/banners/placeholder.png"}
            subtitle={QuickBite.subtitle}
            date={QuickBite.date}
            icon={QuickBite.icon}
            slug={QuickBite.slug}
            author={QuickBite.author}
            topics={QuickBite.topics}
            
          />
        ))}
      </div>
    </div>
  );
};

export default QuickBitesGrid;