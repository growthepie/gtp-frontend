// File: components/quick-dives/blocks/SpacerBlock.tsx
import React from 'react';
import { SpacerBlock as SpacerBlockType } from '@/lib/types/blockTypes';

interface SpacerBlockProps {
  block: SpacerBlockType;
}

export const SpacerBlock: React.FC<SpacerBlockProps> = ({ block }) => {
  return <div style={{ height: `${block.height}px` }} />;
};