// File: components/quick-dives/blocks/ContainerBlock.tsx
import React from 'react';
import { ContainerBlock as ContainerBlockType } from '@/lib/types/blockTypes';
import Block from '../Block';

interface ContainerBlockProps {
  block: ContainerBlockType;
}

export const ContainerBlock: React.FC<ContainerBlockProps> = ({ block }) => {
  return (
    <div 
      className={`my-6 flex flex-col md:flex-row gap-${block.spacing || 4} items-${block.alignment || 'start'} ${block.className || ''}`}
    >
      {block.blocks.map(childBlock => (
        <div key={childBlock.id} className="flex-1">
          <Block block={childBlock} />
        </div>
      ))}
    </div>
  );
};