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
      // Calculate dimensions while maintaining aspect ratio
      const width = block.width ? parseInt(block.width.toString()) : 1200;
      const height = block.height ? parseInt(block.height.toString()) : 600;
      const aspectRatio = width / height;
      
      // Determine alignment class based on block.className
      let alignClass = 'mx-auto'; // Default center alignment
      if (block.className?.includes('text-left')) alignClass = 'ml-0';
      if (block.className?.includes('text-right')) alignClass = 'ml-auto';
      
      return (
        <figure className={`my-8 ${alignClass} max-w-full`}>
          {/* Image container with proper dimensions */}
          <div 
            className={`relative overflow-hidden rounded-lg bg-forest-200 dark:bg-forest-800`}
            style={{ 
              maxWidth: width, 
              width: '100%',
              aspectRatio: aspectRatio
            }}
          >
            {/* Fallback placeholder for when actual images aren't available */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <GTPIcon icon="gtp-metrics-activeaddresses" size="lg" className="mb-4 opacity-30" />
              <span className="text-forest-700 dark:text-forest-300 text-sm">
                {block.alt || 'Image placeholder'}
              </span>
              <span className="text-forest-600 dark:text-forest-400 text-xs mt-2 max-w-sm overflow-hidden text-ellipsis">
                {block.src.split('/').pop()}
              </span>
            </div>
            
            {/* In a production environment, this would display actual images */}
            {/* 
            <Image
              src={block.src}
              alt={block.alt || 'Image'}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={true}
            />
            */}
          </div>
          {block.caption && (
            <figcaption className="text-center text-xs mt-2 text-forest-700 dark:text-forest-400 italic max-w-full">
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