'use client';

import React from 'react';
import Link from 'next/link';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { Icon } from '@iconify/react';
import { GTPIconName } from '@/icons/gtp-icon-names';
import { formatDate } from '@/lib/utils/formatters';

interface Author {
  name: string;
  xUsername: string;
}

interface QuickDiveCardProps {
  title: string;
  subtitle: string;
  date: string;
  icon: string;
  slug: string;
  authors?: Author[];
  className?: string;
}

const QuickDiveCard: React.FC<QuickDiveCardProps> = ({
  title,
  subtitle,
  date,
  icon,
  slug,
  authors,
  className = ''
}) => {
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // Display only the first author on the card, with a "+X more" indicator if there are multiple
  const displayAuthor = authors && authors.length > 0 ? authors[0] : null;
  const additionalAuthors = authors && authors.length > 1 ? authors.length - 1 : 0;

  return (
    <Link 
      href={`/quick-dives/${slug}`} 
      className={`block h-full ${className}`}
      aria-labelledby={`card-title-${slug}`}
    >
      <div className="h-full rounded-[15px] bg-forest-50 dark:bg-[#1F2726] p-4 overflow-hidden transition-all duration-200 hover:shadow-md relative focus-within:ring-2 focus-within:ring-forest-500">
        <div className="flex justify-between items-start mb-2">
          <h3 id={`card-title-${slug}`} className="heading-small-md font-bold">
            {title}
          </h3>
          <div className="ml-2" aria-hidden="true">
            <GTPIcon icon={icon as GTPIconName} size="sm" />
          </div>
        </div>
        
        <div className="text-xs text-forest-800 dark:text-forest-300 mb-3">
          <time dateTime={date}>{formatDate(date)}</time>
        </div>
        
        <p className="text-sm mb-8 line-clamp-2">{subtitle}</p>
        
        {/* Teaser image with proper alt text */}
        <div 
          className="w-full h-[180px] bg-[#B0C4F2] rounded-lg mb-12 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-forest-700">teaser screenshot</span>
        </div>
        
        {/* Author attribution - now with better accessibility */}
        {displayAuthor && (
          <div className="absolute bottom-4 left-4 flex items-center">
            <a 
              href={`https://x.com/${displayAuthor.xUsername}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={handleAuthorClick}
              className="flex items-center text-xs text-forest-800 dark:text-forest-300 hover:underline"
              aria-label={`Author: ${displayAuthor.name} (opens in a new tab)`}
            >
              <Icon icon="ri:twitter-x-fill" className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
              <span>{displayAuthor.name}</span>
              {additionalAuthors > 0 && (
                <span className="ml-1 text-xs text-forest-600 dark:text-forest-400">
                  +{additionalAuthors} more
                </span>
              )}
            </a>
          </div>
        )}
        
        {/* Arrow at bottom right - hide from screen readers */}
        <div className="absolute bottom-4 right-4" aria-hidden="true">
          <Icon icon="feather:arrow-right" className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
};

export default QuickDiveCard;