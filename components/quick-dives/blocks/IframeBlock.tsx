import React from 'react';
import { IframeBlock as IframeBlockType } from '@/lib/types/blockTypes';

interface IframeBlockProps {
  block: IframeBlockType;
}

export const IframeBlock: React.FC<IframeBlockProps> = ({ block }) => {
  // Extract values with proper defaults
  const width = block.width || '100%';
  const height = block.height || '500px';
  const title = block.title || 'Embedded content';
  const src = block.src || '';
  const caption = block.caption || '';
  
  return (
    <figure className={`my-8 mx-auto ${block.className || ''}`}>
      <div 
        className="relative w-full overflow-hidden rounded-lg bg-forest-50 dark:bg-forest-900"
        style={{ 
          maxWidth: typeof width === 'string' ? width : `${width}px`, 
          width: '100%',
          height: typeof height === 'string' ? height : `${height}px`
        }}
      >
        <iframe
          src={src}
          title={title}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="w-full h-full"
        />
      </div>
      {caption && (
        <figcaption className="text-center text-xs mt-2 text-forest-700 dark:text-forest-400 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};