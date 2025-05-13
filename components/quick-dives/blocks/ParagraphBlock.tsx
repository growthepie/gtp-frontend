// File: components/quick-dives/blocks/ParagraphBlock.tsx
import React from 'react';
import { ParagraphBlock as ParagraphBlockType } from '@/lib/types/blockTypes';

interface ParagraphBlockProps {
  block: ParagraphBlockType;
}

export const ParagraphBlock: React.FC<ParagraphBlockProps> = ({ block }) => {
  return (
    <div 
      className={`my-[15px] text-sm leading-[1.5] ${block.className || ''}`} 
      dangerouslySetInnerHTML={{ __html: block.content }} 
    />
  );
};