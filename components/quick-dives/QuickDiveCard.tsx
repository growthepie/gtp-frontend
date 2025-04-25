// File: components/quick-dives/QuickDiveCard.tsx
'use client'; // Add this directive to mark it as a client component

import React from 'react';
import Link from 'next/link';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { Icon } from '@iconify/react';
import { GTPIconName } from '@/icons/gtp-icon-names';

interface QuickDiveCardProps {
  title: string;
  subtitle: string;
  date: string;
  icon: string;
  slug: string;
  className?: string;
}

const QuickDiveCard: React.FC<QuickDiveCardProps> = ({
  title,
  subtitle,
  date,
  icon,
  slug,
  className = ''
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Link href={`/quick-dives/${slug}`} className={className}>
      <div className="h-full rounded-[15px] bg-forest-50 dark:bg-[#1F2726] p-4 overflow-hidden transition-all duration-200 hover:shadow-md relative">
        <div className="flex justify-between items-start mb-2">
          <h3 className="heading-small-md font-bold">{title}</h3>
          <div className="ml-2">
            <GTPIcon icon={icon as GTPIconName} size="sm" />
          </div>
        </div>
        
        <div className="text-xs text-forest-800 dark:text-forest-300 mb-3">
          {formatDate(date)}
        </div>
        
        <p className="text-sm mb-8 line-clamp-2">{subtitle}</p>
        
        {/* Placeholder for teaser screenshot - can be replaced with actual image */}
        <div className="w-full h-[140px] bg-[#B0C4F2] rounded-lg mb-4 flex items-center justify-center">
          <span className="text-forest-700">teaser screenshot</span>
        </div>
        
        {/* Arrow at bottom right */}
        <div className="absolute bottom-4 right-4">
          <Icon icon="feather:arrow-right" className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
};

export default QuickDiveCard;