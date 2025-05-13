// File: components/quick-dives/QuickDivesGrid.tsx
'use client';

import React from 'react';
import QuickDiveCard from './QuickDiveCard';
import { QuickDiveWithSlug } from '@/lib/types/quickDives';

interface QuickDivesGridProps {
  quickDives: QuickDiveWithSlug[];
}

const QuickDivesGrid: React.FC<QuickDivesGridProps> = ({ quickDives }) => {
  if (!quickDives || quickDives.length === 0) {
    return (
      <div className="w-full py-8 text-center">
        <p>No quick dives available.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quickDives.map((quickDive, index) => (
        <QuickDiveCard 
          key={quickDive.slug || index}
          title={quickDive.title}
          subtitle={quickDive.subtitle}
          date={quickDive.date}
          icon={quickDive.icon}
          slug={quickDive.slug}
          author={quickDive.author}
          topics={quickDive.topics}
          
        />
      ))}
    </div>
  );
};

export default QuickDivesGrid;