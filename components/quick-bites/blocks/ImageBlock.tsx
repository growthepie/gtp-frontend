// File: components/quick-dives/blocks/ImageBlock.tsx
import Image from 'next/image';
import React from 'react';
import { ImageBlock as ImageBlockType } from '@/lib/types/blockTypes';
import { GTPIcon } from '@/components/layout/GTPIcon';

interface ImageBlockProps {
  block: ImageBlockType;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({ block }) => {
  // Extract values with proper defaults
  const width = block.width ? (typeof block.width === 'string' ? block.width : `${block.width}px`) : '100%';
  const height = block.height ? (typeof block.height === 'string' ? block.height : `${block.height}px`) : 'auto';
  const alt = block.alt || 'Image';
  const src = block.src || '';
  const caption = block.caption || '';
  
  // Check if it's a development environment or if the image source is available
  const isImageAvailable = process.env.NODE_ENV === 'production' || src.startsWith('http');
  
  return (
    <figure className="my-8 mx-auto">
      <div 
        className={`relative overflow-hidden rounded-lg bg-forest-200 dark:bg-forest-800 mx-auto ${block.className || ''}`}
        style={{ 
          maxWidth: width, 
          width: '100%'
        }}
        aria-hidden={!isImageAvailable}
      >
        {isImageAvailable ? (
          <div style={{ aspectRatio: block.width && block.height ? `${parseInt(block.width.toString())}/${parseInt(block.height.toString())}` : '16/9' }}>
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={true}
            />
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center text-center p-4"
            style={{ aspectRatio: '16/9' }}
            role="img"
            aria-label={alt}
          >
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
        <figcaption className="text-center text-xs mt-2 text-forest-700 dark:text-forest-400 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};