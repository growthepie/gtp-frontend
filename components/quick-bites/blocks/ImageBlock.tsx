// File: components/quick-dives/blocks/ImageBlock.tsx
import Image from 'next/image';
import React from 'react';
import { ImageBlock as ImageBlockType } from '@/lib/types/blockTypes';
import { GTPIcon } from '@/components/layout/GTPIcon';

interface ImageBlockProps {
  block: ImageBlockType;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({ block }) => {
  const getCssDimension = (value: string | number | undefined, defaultValue: string): string => {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    if (typeof value === 'number') {
      return `${value}px`;
    }
    // value is a string
    if (/^[0-9]+(\.[0-9]+)?$/.test(String(value))) { // Matches "800" or "800.0" etc.
      return `${String(value)}px`;
    }
    return String(value); // Assumed to be "100%", "auto", "50vw", etc.
  };

  // Extract values with proper defaults
  const width = getCssDimension(block.width, '100%');
  const alt = block.alt || 'Image';
  const src = block.src || '';
  const caption = block.caption || '';

  // Check if the image source is available
  const isImageAvailable = src && (process.env.NODE_ENV === 'production' || src.startsWith('http') || src.startsWith('/'));
  
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
        
      </div>
      {caption && (
        <figcaption className="text-center text-xs mt-2 text-forest-700 dark:text-forest-400 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};