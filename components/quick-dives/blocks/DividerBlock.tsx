// File: components/quick-dives/blocks/DividerBlock.tsx
import React from 'react';
import { DividerBlock as DividerBlockType } from '@/lib/types/blockTypes';

interface DividerBlockProps {
  block: DividerBlockType;
}

export const DividerBlock: React.FC<DividerBlockProps> = ({ block }) => {
  return (
    <hr className={`my-8 border-t border-forest-200 dark:border-forest-800 ${block.className || ''}`} />
  );
};