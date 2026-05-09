// File: components/quick-dives/blocks/CalloutBlock.tsx
import React from 'react';
import { ContainerBlock as ContainerBlockType } from '@/lib/types/blockTypes';
import { GTPIcon } from '@/components/layout/GTPIcon';
import Block from '../Block';

interface ContainerBlockProps {
  block: ContainerBlockType;
}

export const ContainerBlock: React.FC<ContainerBlockProps> = ({ block }) => {
  const className = block.className || '';

  // `block.blocks` is now an array of arrays, like: [[...highlights], [...image]]
  // Outer @container wrapper turns this into a query container so children
  // (including the inner div with the user's className) can use @[Xpx]:
  // breakpoints — needed because container queries reference an ancestor, not
  // the same element.
  return (
    <div className="@container">
      <div className={`${className}`}>
        {/* 1. Map over the outer array (the groups) */}
        {block.blocks.map((blockGroup, index) => (
          // 2. Create the wrapper div for each group. This is what your grid will see.
          <div key={index}>
            {/* 3. Map over the inner array (the blocks within the group) */}
            {blockGroup.map((innerBlock) => (
              <Block key={innerBlock.id} block={innerBlock} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};