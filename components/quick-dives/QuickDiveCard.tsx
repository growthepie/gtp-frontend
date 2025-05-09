// File: components/quick-dives/QuickDiveCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { Icon } from '@iconify/react';
import { GTPIconName } from '@/icons/gtp-icon-names';
import { formatDate } from '@/lib/utils/formatters';

interface QuickDiveCardProps {
  title: string;
  subtitle: string;
  date: string;
  icon: string;
  slug: string;
  author?: {
    name: string;
    xUsername: string;
  }[];
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
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <Link 
      href={`/quick-dives/${slug}`} 
      className={`block h-full ${className}`}
      aria-labelledby={`card-title-${slug}`}
    >
      <div className="h-full rounded-[15px] bg-forest-50 dark:bg-[#1F2726] p-4 overflow-hidden transition-all duration-200 hover:shadow-md relative focus-within:ring-2 focus-within:ring-forest-500">
        {/* Card header */}
        <div className="flex justify-between items-start mb-2">
          <h3 id={`card-title-${slug}`} className="heading-small-md font-bold">
            {title}
          </h3>
          <div className="ml-2" aria-hidden="true">
            <GTPIcon icon={icon as GTPIconName} size="sm" />
          </div>
        </div>
        
        {/* Date */}
        <div className="text-xs text-forest-800 dark:text-forest-300 mb-2">
          <time dateTime={date}>{formatDate(date)}</time>
        </div>
        
        {/* Content section with fixed height to ensure teaser alignment */}
        <div className="h-[60px] mb-2">
          <p className="text-sm line-clamp-2">{subtitle}</p>
        </div>
        
        <div 
          className="w-full h-[180px] bg-[#B0C4F2] rounded-lg mb-4 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-forest-700">teaser screenshot</span>
        </div>
        
        {/* Footer section with fixed height */}
        <div className="h-[28px] relative">
          {/* Author attribution */}
          {author && author.length > 0 && (
            <div className="absolute bottom-0 left-0 flex items-center gap-x-2">
              {author.map((author, index) => (
                <div key={author.name} className="flex items-center">
                  {index > 0 && (
                    <span className="mx-1.5 text-forest-800 dark:text-forest-300">•</span>
                  )}
                  <a 
                    href={`https://x.com/${author.xUsername}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={handleAuthorClick}
                    className="flex items-center text-xs text-forest-800 dark:text-forest-300 hover:underline"
                    aria-label={`Author: ${author.name} (opens in a new tab)`}
                  >
                    <Icon icon="ri:twitter-x-fill" className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    <span>{author.name}</span>
                  </a>
                </div>
              ))}
            </div>
          )}
          
          {/* Arrow at bottom right */}
          <div className="absolute bottom-0 right-0" aria-hidden="true">
            <Icon icon="feather:arrow-right" className="w-5 h-5" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default QuickDiveCard;