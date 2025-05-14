// File: components/quick-dives/blocks/QuoteBlock.tsx
import React from 'react';
import { QuoteBlock as QuoteBlockType } from '@/lib/types/blockTypes';

interface QuoteBlockProps {
  block: QuoteBlockType;
}

export const QuoteBlock: React.FC<QuoteBlockProps> = ({ block }) => {
  return (
    <blockquote className={`my-6 pl-4 border-l-4 border-forest-300 dark:border-forest-700 italic ${block.className || ''}`}>
      <p dangerouslySetInnerHTML={{ __html: block.content }} />
      {block.attribution && (
        <cite className="block mt-2 text-right text-forest-700 dark:text-forest-400">
          — {block.attribution}
        </cite>
      )}
    </blockquote>
  );
};