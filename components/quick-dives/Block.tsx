'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { ContentBlock } from '@/lib/types/blockTypes';
import dynamic from 'next/dynamic';
import { GTPIcon } from '@/components/layout/GTPIcon';

// Dynamic import for chart components to avoid SSR issues
const ChartWrapper = dynamic(() => import('./ChartWrapper'), { 
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-forest-50 dark:bg-forest-900 animate-pulse rounded-lg"></div>
});

// Helper function to parse image markdown
const parseImageTag = (markdownString: string) => {
  // Match pattern: ![alt text](/path/to/image.jpg | width=123,height=456,align=center) "caption"
  const regex = /!\[(.*?)\]\((.*?)(?:\s+\|\s+(.*?))?\)(?:\s+"(.*?)")?/;
  const match = markdownString.match(regex);
  
  if (!match) return null;
  
  const [_, alt, src, attributes = '', caption = ''] = match;
  
  // Parse attributes like width=700,height=500,align=center
  const attributeObj: {[key: string]: string | number} = {};
  if (attributes) {
    attributes.split(',').forEach(attr => {
      const [key, value] = attr.trim().split('=');
      if (key && value) {
        // Convert numeric values
        attributeObj[key] = /^\d+$/.test(value) ? parseInt(value) : value;
      }
    });
  }
  
  return {
    alt,
    src: src.trim(),
    width: attributeObj.width || 1200,
    height: attributeObj.height || 600,
    align: attributeObj.align || 'center',
    caption
  };
};

interface BlockProps {
  block: ContentBlock;
}

const Block: React.FC<BlockProps> = ({ block }) => {
  switch (block.type) {
    case 'paragraph': {
      // Check if this paragraph contains an image markdown
      const imageData = block.content.trim().startsWith('![') ? parseImageTag(block.content) : null;
      
      if (imageData) {
        // If this is an image markdown, render it as an image
        return renderImage(imageData);
      }
      
      return (
        <div 
          className={`my-4 text-md leading-relaxed ${block.className || ''}`} 
          dangerouslySetInnerHTML={{ __html: block.content }} 
        />
      );
    }
      
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
      return renderImage(block);
      
    case 'chart':
      return (
        <div className={`my-8 ${block.className || ''}`}>
          <ChartWrapper
            chartType={block.chartType}
            data={block.data}
            options={block.options}
            width={block.width || '100%'}
            height={block.height || 400}
            title={block.title}
            subtitle={block.subtitle}
          />
          {block.caption && (
            <figcaption className="text-center text-xs mt-2 text-forest-700 dark:text-forest-400 italic">
              {block.caption}
            </figcaption>
          )}
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

// Helper function to render an image consistently
function renderImage(imageData: any) {
  // Extract values with proper defaults
  const width = imageData.width ? parseInt(imageData.width.toString()) : 1200;
  const height = imageData.height ? parseInt(imageData.height.toString()) : 600;
  const aspectRatio = width / height;
  const alt = imageData.alt || 'Image';
  const src = imageData.src || '';
  const caption = imageData.caption || '';
  
  // Always center images
  const alignClass = 'mx-auto'; // Center alignment for all images
  
  // Check if it's a development environment or if the image source is available
  const isImageAvailable = process.env.NODE_ENV === 'production' || src.startsWith('http');
  
  return (
    <figure className="my-8 mx-auto flex justify-center w-full">
      <div 
        className="relative overflow-hidden rounded-lg bg-forest-200 dark:bg-forest-800 mx-auto"
        style={{ 
          maxWidth: width, 
          width: '100%',
          aspectRatio: aspectRatio
        }}
      >
        {isImageAvailable ? (
          // Real image when available
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={true}
          />
        ) : (
          // Fallback placeholder
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <GTPIcon icon="gtp-metrics-activeaddresses" size="lg" className="mb-4 opacity-30" />
            <span className="text-forest-700 dark:text-forest-300 text-sm">
              {alt || 'Image placeholder'}
            </span>
            <span className="text-forest-600 dark:text-forest-400 text-xs mt-2 max-w-sm overflow-hidden text-ellipsis">
              {src.split('/').pop()}
            </span>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="text-center text-xs mt-2 text-forest-700 dark:text-forest-400 italic w-full">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export default Block;