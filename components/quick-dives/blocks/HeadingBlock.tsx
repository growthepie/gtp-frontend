// File: components/quick-dives/blocks/HeadingBlock.tsx
import React from 'react';
import { HeadingBlock as HeadingBlockType } from '@/lib/types/blockTypes';

interface HeadingBlockProps {
  block: HeadingBlockType;
}

export const HeadingBlock: React.FC<HeadingBlockProps> = ({ block }) => {
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
};