// File: components/quick-dives/blocks/ParagraphBlock.tsx
import React from 'react';
import { ParagraphBlock as ParagraphBlockType } from '@/lib/types/blockTypes';

interface ParagraphBlockProps {
  block: ParagraphBlockType;
}

const parseMarkdownLinksToHtml = (text: string): string => {
  if (!text) return '';
  // Regex to find links in markdown format [text](url)
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  // Replace with HTML anchor tags, adding styling and security attributes
  return text.replace(
    linkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 dark:text-blue-400 hover:underline">$1</a>'
  );
};

export const ParagraphBlock: React.FC<ParagraphBlockProps> = ({ block }) => {
  const contentWithLinks = parseMarkdownLinksToHtml(block.content);
  return (
    <div 
      className={`my-[15px] text-xs md:text-sm leading-[1.5] ${block.className || ''}`} 
      dangerouslySetInnerHTML={{ __html: contentWithLinks }}
    />
  );
};