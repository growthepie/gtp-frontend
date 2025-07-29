'use client';

// File: components/quick-dives/blocks/ChartBlock.tsx
import React from 'react';
import { ChartBlock as ChartBlockType } from '@/lib/types/blockTypes';
import dynamic from 'next/dynamic';
import { useQuickBite } from '@/contexts/QuickBiteContext';
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
    prefix?: string,
    url?: string,
    pathToData?: string,
    dashStyle?: Highcharts.DashStyleValue
  }[]
}

export const ChartBlock: React.FC<ChartBlockProps> = ({ block }) => {
  const { sharedState } = useQuickBite();
  const urls = block.dataAsJson?.meta.map(meta => {
    return meta.url;
  }).filter(Boolean) as string[] || [];

  // Fetch data for all meta entries
  const { data: unProcessedData, error } = useSWR(
    urls.length > 0 ? urls : null,
    urls.length > 0 ? (urls: string[]) => Promise.all(urls.map(url => fetcher(url))) : null
  );
  
  // Get nested data for all meta entries
  const nestedData = block.dataAsJson && unProcessedData 
    ? block.dataAsJson.meta.map((meta, index) => 
        meta.pathToData ? getNestedValue(unProcessedData[index], meta.pathToData) : undefined
      )
    : undefined;

  const passChartData = block.dataAsJson ? unProcessedData : block.data;


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
          showXAsDate={block.showXAsDate}
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