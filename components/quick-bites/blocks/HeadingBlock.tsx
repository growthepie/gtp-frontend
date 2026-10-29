'use client';
// File: components/quick-dives/blocks/HeadingBlock.tsx
import React from 'react';
import { HeadingBlock as HeadingBlockType } from '@/lib/types/blockTypes';
import { useQuickBite } from '@/contexts/QuickBiteContext';
import Mustache from 'mustache';

interface HeadingBlockProps {
  block: HeadingBlockType;
}

export const HeadingBlock: React.FC<HeadingBlockProps> = ({ block }) => {
  const { sharedState } = useQuickBite();
  const resolvedContent = block.content?.includes('{{') ? Mustache.render(block.content, sharedState) : block.content;
  const HeadingTag = `h${block.level}` as keyof React.JSX.IntrinsicElements;
  
  // One clear step per level; more space above than below so a heading sits with
  // the text it introduces.
  const headingClasses = {
    1: 'heading-large-md md:heading-large-lg mt-[30px] mb-[10px]',
    2: 'heading-large-sm md:heading-large-md mt-[30px] mb-[10px]',
    3: 'heading-large-xs md:heading-large-sm mt-[20px] mb-[10px]',
  }[block.level] ?? 'heading-large-xs md:heading-large-sm mt-[20px] mb-[10px]';
  
  return (
    <HeadingTag 
      className={`${headingClasses} ${block.className || ''}`}
      dangerouslySetInnerHTML={{ __html: resolvedContent }}
    />
  );
};