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
  author?: {
    name: string;
    xUsername: string;
  };
  className?: string;
}

const QuickDiveCard: React.FC<QuickDiveCardProps> = ({
  title,
  subtitle,
  date,
  icon,
  slug,
  author,
  className = ''
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    // Prevent the card link from being triggered when clicking on the author
    e.stopPropagation();
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
        <div className="w-full h-[180px] bg-[#B0C4F2] rounded-lg mb-12 flex items-center justify-center">
          <span className="text-forest-700">teaser screenshot</span>
        </div>
        
        {/* Author attribution - moved up with more spacing */}
        {author && (
          <div className="absolute bottom-4 left-4 flex items-center">
            <a 
              href={`https://x.com/${author.xUsername}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={handleAuthorClick}
              className="flex items-center text-xs text-forest-800 dark:text-forest-300 hover:underline"
            >
              <Icon icon="ri:twitter-x-fill" className="w-3.5 h-3.5 mr-1.5" />
              <span>{author.name}</span>
            </a>
          </div>
        )}
        
        {/* Arrow at bottom right */}
        <div className="absolute bottom-4 right-4">
          <Icon icon="feather:arrow-right" className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
};

export default QuickDiveCard;