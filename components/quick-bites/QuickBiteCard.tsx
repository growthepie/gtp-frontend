// File: components/quick-dives/QuickBiteCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { Icon } from '@iconify/react';
import { GTPIconName } from '@/icons/gtp-icon-names';
import { formatDate } from '@/lib/utils/formatters';
import { url } from 'inspector';
import Image from 'next/image';
import ChartWatermark from '../layout/ChartWatermark';
import { useMaster } from '@/contexts/MasterContext';
import { getChainInfoFromUrl } from '@/lib/chains';

interface QuickBiteCardProps {
  title: string;
  subtitle: string;
  date: string;
  icon: string;
  slug: string;
  bannerImage: string;
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
  topicFilter?: string[];
}

const QuickBiteCard: React.FC<QuickBiteCardProps> = ({
  title,
  subtitle,
  date,
  icon,
  slug,
  bannerImage,
  author,
  topics,
  className = '',
  isRelatedPage = false,
  mainTopics,
  topicFilter
}) => {
  const { AllChainsByKeys } = useMaster();
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };


  return (
    <Link
      href={`/quick-bites/${slug}`}
      className={`block h-full ${className} min-w-[275px] !h-[275px] select-none group`}
      aria-labelledby={`card-title-${slug}`}
    >
      <div className='flex flex-col w-full h-full p-[15px] gap-y-[10px] border border-[#5A6462] rounded-[15px]'>
        <div className='flex flex-col'>
          <div className='flex justify-between h-[51px] gap-x-[15px]'>
            <div className='heading-small-xs group-hover:underline line-clamp-3'>{title}</div>
            <div className="text-xs align-start whitespace-nowrap">
              <time dateTime={date}>{formatDate(date)}</time>
            </div>
          </div>
          <div className='text-xs h-[30px]'>{subtitle}</div>
        </div>
        <div className='flex flex-1 justify-between items-center gap-x-[15px]'>
          <div className='relative bg-[#5A6462] rounded-[15px] w-full h-full'>
            <Image
              src={bannerImage}
              alt={title}
              objectFit='cover'
              fill
              className='w-full h-full object-cover rounded-[15px]'
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-50">
              <ChartWatermark className="w-[78px] text-[#EAECEB]" />
            </div>
          </div>
          <div className='min-w-[24px] min-h-[24px] bg-[#344240] rounded-full flex items-center justify-center'>
            <Icon icon={'fluent:arrow-right-32-filled'} className={`w-[15px] h-[15px]`} />
          </div>
        </div>
        <div className='flex justify-between items-center relative h-fit'>
          {author && author.length > 0 && (

            <div className="flex items-center gap-x-[5px] h-fit">
              <GTPIcon icon="twitter" size="sm" />
              {author.map((authorItem, index) => (
                <React.Fragment key={authorItem.name}>
                  {index === 1 ? (
                    <div className=" hover:underline text-xxs h-[15px] pt-[1px]">{`+${(author.length - 1)} More`}</div>
                  ) : index === 0 ? (
                    <div
                      onClick={(e) => {
                        handleAuthorClick(e);
                        window.open(`https://x.com/${authorItem.xUsername}`, '_blank', 'noopener,noreferrer');
                      }}
                      className="text-xs hover:underline h-[15px]"
                      aria-label={`Author: ${authorItem.name} (opens in a new tab)`}
                    >
                      {authorItem.name}
                    </div>
                  ) : null}
                </React.Fragment>
              ))}
            </div>
          )}
          <div className='flex justify-end'>
            {topics && topics.length > 0 && (() => {
              const compareTopics = (mainTopics && mainTopics.length && isRelatedPage)

              return (
                <div className="flex gap-x-[5px]">
                  {topics.filter(topic => topicFilter ? topicFilter.includes(topic.name) : true).map((topic) => {
                    const showColor = compareTopics ? mainTopics.some(mainTopic => topic.name === mainTopic.name) : true;
                  
                    // Resolve chain information if this is a chain URL
                    let resolvedIcon = topic.icon;
                    let resolvedColor = topic.color;
                    
                    if (topic.url.startsWith('/chains/') && !topic.icon) {
                      const chainInfo = getChainInfoFromUrl(topic.url, AllChainsByKeys);
                      if (chainInfo) {
                        resolvedIcon = chainInfo.icon;
                        resolvedColor = chainInfo.color;
                      }
                    }
                    
                    return (
                      <Link
                        key={topic.name}
                        href={topic.url}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center rounded-full text-xs"
                        style={{
                          color: showColor ? resolvedColor || '#344240' : '#344240'
                        }}
                      >
                        <GTPIcon icon={(resolvedIcon || "chain-dark") as GTPIconName} size="sm" />
                      </Link>
                    );
                  })}
                </div>
              );
            })()}
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