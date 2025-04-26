'use client';

import React from 'react';
import Image from 'next/image';
import { ContentBlock } from '@/lib/types/blockTypes';
import dynamic from 'next/dynamic';
import { GTPIcon } from '@/components/layout/GTPIcon';

// Dynamic import for chart components to avoid SSR issues
const ChartWrapper = dynamic(() => import('./ChartWrapper'), { 
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-forest-50 dark:bg-forest-900 animate-pulse rounded-lg"></div>
});

interface BlockProps {
  block: ContentBlock;
}

const Block: React.FC<BlockProps> = ({ block }) => {
  switch (block.type) {
    case 'paragraph':
      return (
        <div className={`my-4 text-md leading-relaxed ${block.className || ''}`} 
             dangerouslySetInnerHTML={{ __html: block.content }} />
      );
      
    case 'heading':
      const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
      const headingClasses = {
        1: 'heading-large-xl my-6',
        2: 'heading-large-lg my-4',
        3: 'heading-large-md my-3',
        4: 'heading-large-sm my-2',
        5: 'heading-small-sm my-2 text-forest-700 dark:text-forest-400',
        6: 'heading-small-xs my-1 text-forest-700 dark:text-forest-400',
      }[block.level];
      
      return (
        <HeadingTag 
          className={`${headingClasses} ${block.className || ''}`}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );
      
    case 'image':
      return (
        <figure className={`my-6 ${block.className || ''}`}>
          <div className="relative overflow-hidden rounded-lg">
            <Image
              src={block.src}
              alt={block.alt}
              width={block.width || 1200}
              height={block.height || 600}
              className="w-full h-auto object-cover"
            />
          </div>
          {block.caption && (
            <figcaption className="text-center text-xs mt-2 text-forest-700 dark:text-forest-400">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
      
    case 'chart':
      return (
        <div className={`my-6 ${block.className || ''}`}>
          <ChartWrapper
            chartType={block.chartType}
            data={block.data}
            options={block.options}
            width={block.width}
            height={block.height || 400}
          />
        </div>
      );
      
    case 'callout':
      return (
        <div className={`my-6 p-4 bg-forest-50 dark:bg-forest-900 rounded-lg border-l-4 ${block.color ? `border-${block.color}` : 'border-forest-400'} ${block.className || ''}`}>
          <div className="flex items-start gap-3">
            {block.icon && (
              <div className="flex-shrink-0 mt-1">
                <GTPIcon icon={block.icon as any} size="sm" />
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
        </div>
      );
      
    case 'code':
      return (
        <pre className={`my-6 p-4 bg-forest-900 dark:bg-forest-1000 text-forest-50 rounded-lg overflow-x-auto ${block.className || ''}`}>
          <code>{block.content}</code>
        </pre>
      );
      
    case 'quote':
      return (
        <blockquote className={`my-6 pl-4 border-l-4 border-forest-300 dark:border-forest-700 italic ${block.className || ''}`}>
          <p dangerouslySetInnerHTML={{ __html: block.content }} />
          {block.attribution && (
            <cite className="block mt-2 text-right text-forest-700 dark:text-forest-400">
              — {block.attribution}
            </cite>
          )}
        </blockquote>
      );
      
    case 'divider':
      return (
        <hr className={`my-8 border-t border-forest-200 dark:border-forest-800 ${block.className || ''}`} />
      );
      
    case 'container':
      return (
        <div 
          className={`my-6 flex flex-col md:flex-row gap-${block.spacing || 4} items-${block.alignment || 'start'} ${block.className || ''}`}
        >
          {block.blocks.map(childBlock => (
            <div key={childBlock.id} className="flex-1">
              <Block block={childBlock} />
            </div>
          ))}
        </div>
      );
      
    case 'spacer':
      return <div style={{ height: `${block.height}px` }} />;
      
    default:
      return null;
  }
};

export default Block;