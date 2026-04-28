'use client';
// File: components/quick-dives/blocks/ParagraphBlock.tsx
import React from 'react';
import { ParagraphBlock as ParagraphBlockType } from '@/lib/types/blockTypes';
import { useQuickBite } from '@/contexts/QuickBiteContext';
import Mustache from 'mustache';

interface ParagraphBlockProps {
  block: ParagraphBlockType;
}

const parseMarkdownLinksToHtml = (text: string): string => {
  if (!text) return '';
  // Regex to find links in markdown format [text](url) or (text)[url]
  const standardLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const reverseLinkRegex = /\(([^)]+)\)\[(https?:\/\/[^\]]+)\]/g;
  
  // Replace standard format [text](url)
  let result = text.replace(
    standardLinkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>'
  );
  
  // Replace reverse format (text)[url]
  result = result.replace(
    reverseLinkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>'
  );
  
  return result;
};

export const ParagraphBlock: React.FC<ParagraphBlockProps> = ({ block }) => {
  const { sharedState } = useQuickBite();
  const resolved = block.content?.includes('{{') ? Mustache.render(block.content, sharedState) : block.content;
  const contentWithLinks = parseMarkdownLinksToHtml(resolved);
  return (
    <div 
      className={`my-[15px] text-xs md:text-sm leading-[1.5] ${block.className || ''}`} 
      dangerouslySetInnerHTML={{ __html: contentWithLinks }}
    />
  );
};