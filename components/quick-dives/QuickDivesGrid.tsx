// File: components/quick-dives/QuickDivesGrid.tsx
'use client';

import React from 'react';
import QuickDiveCard from './QuickDiveCard';

interface QuickDiveData {
  title: string;
  subtitle: string;
  content: string[];
  image: string;
  date: string;
  icon: string;
  slug: string;
  related: string[];
  author?: {
    name: string;
    xUsername: string;
  };
}

interface QuickDivesGridProps {
  quickDives: QuickDiveData[];
}

const QuickDivesGrid: React.FC<QuickDivesGridProps> = ({ quickDives }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quickDives.map((quickDive, index) => (
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
  );
};

export default QuickDivesGrid;