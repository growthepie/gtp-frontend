// File: components/quick-dives/blocks/ParagraphBlock.tsx
import React from 'react';
import { ParagraphBlock as ParagraphBlockType } from '@/lib/types/blockTypes';

interface ParagraphBlockProps {
  block: ParagraphBlockType;
}

export const ParagraphBlock: React.FC<ParagraphBlockProps> = ({ block }) => {
  return (
    <div 
      className={`my-4 text-md leading-relaxed ${block.className || ''}`} 
      dangerouslySetInnerHTML={{ __html: block.content }} 
    />
  );
};