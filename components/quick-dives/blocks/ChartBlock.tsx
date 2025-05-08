// File: components/quick-dives/blocks/ChartBlock.tsx
import React from 'react';
import { ChartBlock as ChartBlockType } from '@/lib/types/blockTypes';
import dynamic from 'next/dynamic';

// Dynamically import ChartWrapper to avoid SSR issues
const ChartWrapper = dynamic(() => import('../ChartWrapper'), { 
  ssr: false,
  loading: () => <div className="w-full h-[300px] transparent"></div>
});

interface ChartBlockProps {
  block: ChartBlockType & { caption?: string };
}

export const ChartBlock: React.FC<ChartBlockProps> = ({ block }) => {
  return (
    <div className={`my-8 ${block.className || ''}`}>
      <ChartWrapper
        chartType={block.chartType}
        data={block.data}
        options={block.options}
        width={block.width || '100%'}
        height={block.height || 400}
        title={block.title}
        subtitle={block.subtitle}
      />
      {block.caption && (
        <figcaption className="text-center text-xs mt-2 text-forest-700 dark:text-forest-400 italic">
          {block.caption}
        </figcaption>
      )}
    </div>
  );
};