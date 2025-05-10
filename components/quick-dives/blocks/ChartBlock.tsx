'use client';

// File: components/quick-dives/blocks/ChartBlock.tsx
import React from 'react';
import { ChartBlock as ChartBlockType } from '@/lib/types/blockTypes';
import dynamic from 'next/dynamic';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Utility function to safely get nested values using dot notation
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Dynamically import ChartWrapper to avoid SSR issues
const ChartWrapper = dynamic(() => import('../ChartWrapper'), { 
  ssr: false,
  loading: () => <div className="w-full h-[300px] transparent"></div>
});

interface ChartBlockProps {
  block: ChartBlockType & { caption?: string };
}

interface JsonMeta {
  seriesAmount: number,
  meta: {
    name: string,
    color: string,
    xIndex: number,
    yIndex: number,
    suffix?: string,
    prefix?: string
  }[]
}
export const ChartBlock: React.FC<ChartBlockProps> = ({ block }) => {

  // if dataasJson is present collect the data using useSWR handle if data as json doens't exist    
  const { data: unProcessedData, error } = useSWR(block.dataAsJson?.url, fetcher);
  const passChartData = block.dataAsJson ? unProcessedData : block.data;
  
  // Get nested data using the pathToData
  const nestedData = block.dataAsJson && unProcessedData 
    ? getNestedValue(unProcessedData, block.dataAsJson.pathToData)
    : undefined;

  
  return (
    
    <div className={`my-8 ${block.className || ''}`}>
      {passChartData && (
        <ChartWrapper
          chartType={block.chartType}
          data={block.data}
          options={block.options}
          width={block.width || '100%'}
          height={block.height || 400}
          title={block.title}
          subtitle={block.subtitle}
          stacking={block.stacking}
          jsonData={nestedData}
          jsonMeta={
            block.dataAsJson ? {
              meta: block.dataAsJson.meta
            } : undefined
          }
          seeMetricURL={block.seeMetricURL}
        />
      )}
      {block.caption && (
        <figcaption className="text-center text-xs mt-2 text-forest-700 dark:text-forest-400 italic">
          {block.caption}
        </figcaption>
      )}
    </div>
  );
};