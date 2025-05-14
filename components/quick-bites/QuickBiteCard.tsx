// File: components/quick-dives/QuickBiteCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { Icon } from '@iconify/react';
import { GTPIconName } from '@/icons/gtp-icon-names';
import { formatDate } from '@/lib/utils/formatters';
import { url } from 'inspector';

interface QuickBiteCardProps {
  title: string;
  subtitle: string;
  date: string;
  icon: string;
  slug: string;
  author?: {
    name: string;
    xUsername: string;
  }[];
  topics?: {
    icon: string;
    name: string;
    url: string;
    color?: string;
  }[];
  className?: string;
  isRelatedPage?: boolean;
  mainTopics?: {
    icon: string;
    color?: string;
    name: string;
    url: string;
  }[];  
}

const QuickBiteCard: React.FC<QuickBiteCardProps> = ({
  title,
  subtitle,
  date,
  icon,
  slug,
  author,
  topics,
  className = '',
  isRelatedPage = false,
  mainTopics
}) => {
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };
  
  return (
    <Link 
      href={`/quick-bites/${slug}`} 
      className={`block h-full ${className}`}
      aria-labelledby={`card-title-${slug}`}
    >
      <div className='w-full h-full p-[15px] bg-transparent border border-[#5A6462] rounded-[15px]'>
        <div className='flex flex-col gap-y-[15px]'>
          <div className='flex justify-between'>
            <span className='heading-small-xs'>{title}</span>
            <div className="text-xs align-start">
              <time dateTime={date}>{formatDate(date)}</time>
            </div>
          </div>
          <div className='flex justify-between items-center gap-x-[15px]'>
            <div className='bg-[#5A6462] rounded-[15px] w-full min-h-[100px] lg:min-h-[150px]'></div>
            <div className='min-w-[24px] min-h-[24px] bg-[#344240] rounded-full flex items-center justify-center'>
              <Icon icon={'fluent:arrow-right-32-filled'} className={`w-[15px] h-[15px]`}  />
            </div>
          </div>
          <div className='flex justify-between items-center relative '>
            {author && author.length > 0 && (
            
              <div className=" flex items-center gap-x-2 ">
                {author.map((authorItem, index) => (
                  <div key={authorItem.name}>
                    <div className="flex items-center gap-x-0.5 -mr-[5px] relative">
                      {index > 0 ? (
                        <span className=" hover:underline mt-[1px] text-xxs">{`+${(author.length - 1)} More`}</span>
                      ) : (
                        <button 
                          onClick={(e) => {
                            handleAuthorClick(e);
                            window.open(`https://x.com/${authorItem.xUsername}`, '_blank', 'noopener,noreferrer');
                          }}
                          className="flex items-center text-xs  hover:underline"
                          aria-label={`Author: ${authorItem.name} (opens in a new tab)`}
                        >
                          <Icon icon="ri:twitter-x-fill" className="w-[15px] h-[15px] mr-[5px]" aria-hidden="true" />
                          <span>{authorItem.name}</span>
                        </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            )}
            <div className='flex justify-end'>
              {topics && topics.length > 0 && (() => {
                const compareTopics = (mainTopics && mainTopics.length && isRelatedPage)

                return (
                  <div className="flex gap-x-[5px]">
                    {topics.map((topic) => {
                      const showColor = compareTopics ? mainTopics.some(mainTopic => topic.name === mainTopic.name) : true;
                      return (
                        <Link
                          key={topic.name}
                          href={topic.url}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center py-1 rounded-full text-xs"
                          style={{
                            color: showColor ? topic.color || '#344240' : '#344240'
                          }}
                        >
                          <GTPIcon icon={topic.icon as GTPIconName} size="sm" />
                        </Link>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
          
        </div>
      </div>
    </Link>
  );
};

        {/* {topics && topics.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {topics.map((topic) => (
              <Link
                key={topic.name}
                href={topic.url}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-x-1 px-2 py-1 rounded-full text-xs"
                style={{
                  backgroundColor: topic.color ? `${topic.color}20` : '#34424020',
                  color: topic.color || '#344240'
                }}
              >
                <GTPIcon icon={topic.icon as GTPIconName} size="sm" />
                <span>{topic.name}</span>
              </Link>
            ))}
          </div>
        )} */}

        {/* {author && author.length > 0 && (
          <div className="absolute bottom-4 left-4 flex items-center gap-x-2">
            {author.map((authorItem, index) => (
              <div key={authorItem.name}>
                <div className="flex items-center gap-x-0.5">
                  {index > 0 ? (
                    <span className="text-forest-800 dark:text-forest-300 hover:underline text-xs">{`+${(author.length - 1)} More`}</span>
                  ) : (
                    <button 
                      onClick={(e) => {
                        handleAuthorClick(e);
                        window.open(`https://x.com/${authorItem.xUsername}`, '_blank', 'noopener,noreferrer');
                      }}
                      className="flex items-center text-xs text-forest-800 dark:text-forest-300 hover:underline"
                      aria-label={`Author: ${authorItem.name} (opens in a new tab)`}
                    >
                      <Icon icon="ri:twitter-x-fill" className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                      <span>{authorItem.name}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )} */}
export default QuickBiteCard;