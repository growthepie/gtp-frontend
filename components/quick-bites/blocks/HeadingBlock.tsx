// File: components/quick-dives/blocks/HeadingBlock.tsx
import React from 'react';
import { HeadingBlock as HeadingBlockType } from '@/lib/types/blockTypes';

interface HeadingBlockProps {
  block: HeadingBlockType;
}

export const HeadingBlock: React.FC<HeadingBlockProps> = ({ block }) => {
  const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
  
  const headingClasses = {
    1: 'heading-large-xs md:heading-large-md my-[15px]',
    2: 'heading-large-xs md:heading-large-lg my-[15px]',
  }[block.level];
  
  return (
    <HeadingTag 
      className={`${headingClasses} ${block.className || ''}`}
      dangerouslySetInnerHTML={{ __html: block.content }}
    />
  );
};