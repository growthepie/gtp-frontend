// File: components/quick-dives/RelatedQuickDives.tsx
'use client'; // Add this directive to mark it as a client component

import React from 'react';
import QuickDiveCard from './QuickDiveCard';
import { useTheme } from 'next-themes';

interface QuickDiveData {
  title: string;
  subtitle: string;
  content: string[];
  image: string;
  date: string;
  icon: string;
  related: string[];
  author?: {
    name: string;
    xUsername: string;
  };
}

interface RelatedQuickDivesProps {
  relatedQuickDives: QuickDiveData[];
}

const RelatedQuickDives: React.FC<RelatedQuickDivesProps> = ({ relatedQuickDives }) => {
  const { theme } = useTheme();
  
  if (!relatedQuickDives || relatedQuickDives.length === 0) {
    return null;
  }

  return (
    <div className="mt-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedQuickDives.map((quickDive, index) => (
          <QuickDiveCard 
            key={index}
            title={quickDive.title}
            subtitle={quickDive.subtitle}
            date={quickDive.date}
            icon={quickDive.icon}
            slug={quickDive.title.toLowerCase().replace(/\s+/g, '-')}
            author={quickDive.author}
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedQuickDives;