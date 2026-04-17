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
  
  const headingClasses = {
    2: 'heading-large-xs md:heading-large-md xl:heading-large-md my-[15px]',
    1: 'heading-large-xs md:heading-large-md xl:heading-large-lg my-[15px]',
  }[block.level];
  
  return (
    <HeadingTag 
      className={`${headingClasses} ${block.className || ''}`}
      dangerouslySetInnerHTML={{ __html: resolvedContent }}
    />
  );
};