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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {QuickBites.map((QuickBite, index) => (
        <QuickBiteCard 
          key={QuickBite.slug || index}
          title={QuickBite.title}
          subtitle={QuickBite.subtitle}
          date={QuickBite.date}
          icon={QuickBite.icon}
          slug={QuickBite.slug}
          author={QuickBite.author}
          topics={QuickBite.topics}
          
        />
      ))}
    </div>
  );
};

export default QuickBitesGrid;