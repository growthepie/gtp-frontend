'use client';

// File: components/quick-dives/blocks/ChartBlock.tsx
import React from 'react';
import { ChartBlock as ChartBlockType } from '@/lib/types/blockTypes';
import dynamic from 'next/dynamic';
import { useQuickBite } from '@/contexts/QuickBiteContext';
import useSWR from 'swr';
import Mustache from 'mustache';
import ShowLoading from '@/components/layout/ShowLoading';

/* 
Mustache.js example for dynamic values

const view = {
   title: "Joe",
   calc: () => ( 2 + 4 )
 };
 const output = Mustache.render("{{title}} spends {{calc}}", view);

*/
 
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
    type?: string,
    name: string,
    color: string,
    stacking?: string,
    xIndex: number,
    yIndex: number,
    yaxis?: number,
    suffix?: string,
    prefix?: string,
    url?: string,
    pathToData?: string,
    dashStyle?: Highcharts.DashStyleValue,
    makeNegative?: boolean
  }[]
}

export const ChartBlock: React.FC<ChartBlockProps> = ({ block }) => {
  const { sharedState } = useQuickBite();

  // Process URLs using Mustache to reflect the current sharedState.
  // This makes the `useSWR` key dynamic.
  // For scatter plots, we need to handle xUrl and yUrl separately
  const processedUrls = React.useMemo(() => {
    if (!block.dataAsJson?.meta) return [];

    const urls: string[] = [];
    
    block.dataAsJson.meta.forEach(meta => {
      // For scatter plots with xUrl and yUrl, fetch both
      if (meta.xUrl && meta.yUrl) {
        // Process xUrl
        let xUrl = meta.xUrl;
        if (xUrl.includes('{{')) {
          const requiredVars = (Mustache.parse(xUrl) || [])
            .filter(tag => tag[0] === 'name')
            .map(tag => tag[1]);
          const allVarsAvailable = requiredVars.every(v => sharedState[v] !== null && sharedState[v] !== undefined);
          if (allVarsAvailable) {
            xUrl = Mustache.render(xUrl, sharedState);
          } else {
            return; // Skip if vars not available
          }
        }
        urls.push(xUrl);
        
        // Process yUrl
        let yUrl = meta.yUrl;
        if (yUrl.includes('{{')) {
          const requiredVars = (Mustache.parse(yUrl) || [])
            .filter(tag => tag[0] === 'name')
            .map(tag => tag[1]);
          const allVarsAvailable = requiredVars.every(v => sharedState[v] !== null && sharedState[v] !== undefined);
          if (allVarsAvailable) {
            yUrl = Mustache.render(yUrl, sharedState);
          } else {
            return; // Skip if vars not available
          }
        }
        urls.push(yUrl);
      } else if (meta.url) {
        // Standard single URL
        let url = meta.url;
        if (url.includes('{{')) {
          const requiredVars = (Mustache.parse(url) || [])
            .filter(tag => tag[0] === 'name')
            .map(tag => tag[1]);
          const allVarsAvailable = requiredVars.every(v => sharedState[v] !== null && sharedState[v] !== undefined);
          if (allVarsAvailable) {
            url = Mustache.render(url, sharedState);
          } else {
            return; // Skip if vars not available
          }
        }
        urls.push(url);
      }
    });
    
    return urls.filter(Boolean);
  }, [block.dataAsJson, sharedState]);

  // The key for useSWR is now `processedUrls`, which is dynamic.
  // SWR will automatically re-fetch when the key changes.
  const { data: unProcessedData, error } = useSWR(processedUrls.length > 0 ? processedUrls : null);
  
  // Get nested data for all meta entries
  // For scatter plots with xUrl/yUrl, combine the data
  const nestedData = React.useMemo(() => {
    if (!block.dataAsJson?.meta || !unProcessedData) return undefined;
    
    let urlIndex = 0;
    return block.dataAsJson.meta.map((meta) => {
      // For scatter plots with xUrl and yUrl, combine data from two endpoints
      if (meta.xUrl && meta.yUrl && unProcessedData[urlIndex] && unProcessedData[urlIndex + 1]) {
        const xData = meta.xPathToData 
          ? getNestedValue(unProcessedData[urlIndex], meta.xPathToData)
          : unProcessedData[urlIndex];
        const yData = meta.yPathToData
          ? getNestedValue(unProcessedData[urlIndex + 1], meta.yPathToData)
          : unProcessedData[urlIndex + 1];
        
        urlIndex += 2;
        
        // Combine x and y data: get most recent day from each and create scatter points
        if (Array.isArray(xData) && Array.isArray(yData) && xData.length > 0 && yData.length > 0) {
          // Get the most recent day (last item in array)
          const latestX = xData[xData.length - 1];
          const latestY = yData[yData.length - 1];
          
          // Create scatter point: [xValue, yValue]
          // xData format: [timestamp, value] or [value]
          // yData format: [timestamp, value] or [value]
          // For fundamentals API, format is typically [timestamp, value] where value is at index 1
          let xValue: number;
          let yValue: number;
          
          if (Array.isArray(latestX)) {
            // If it's [timestamp, value], get the value (usually index 1, but could be last)
            xValue = latestX.length > 1 ? latestX[1] : latestX[0];
          } else {
            xValue = latestX;
          }
          
          if (Array.isArray(latestY)) {
            // If it's [timestamp, value], get the value (usually index 1, but could be last)
            yValue = latestY.length > 1 ? latestY[1] : latestY[0];
          } else {
            yValue = latestY;
          }
          
          // Return as array with single point for scatter: [x, y]
          return [[xValue, yValue]];
        }
        return [];
      } else {
        // Standard single URL
        const data = unProcessedData[urlIndex];
        urlIndex += 1;
        return meta.pathToData ? getNestedValue(data, meta.pathToData) : data;
      }
    });
  }, [block.dataAsJson, unProcessedData]);

  const passChartData = block.dataAsJson ? unProcessedData : block.data;

  // Don't render the chart if there's a filter key but no data yet.
  // This handles the initial state where a dropdown selection is needed.
  if (block.filterOnStateKey && !unProcessedData) {
    const title = block.title && block.title.includes("{{") ? Mustache.render(block.title, sharedState) : block.title;
    return (
      <div className={`my-8 ${block.className || ''}`}>
        <div className="w-full h-[400px] flex flex-col items-center justify-center bg-forest-50 dark:bg-forest-900/50 rounded-lg">
          <h3 className="text-lg font-bold text-forest-900 dark:text-forest-100">{title}</h3>
          <p className="text-forest-700 dark:text-forest-400">Please make a selection to view the chart.</p>
        </div>
      </div>
    );
  }

  const wrapperClassName = `${block.suppressWrapperSpacing ? '' : 'my-8'} ${block.className || ''}`.trim();

  return (
    <>
    <div className={wrapperClassName}>
      {(passChartData !== undefined && passChartData !== null) && (
        <ChartWrapper
          chartType={block.chartType}
          data={block.data}
          margins={block.margins || 'normal'}
          options={block.options}
          width={block.width || '100%'}
          height={block.height || 400}
          title={block.title && block.title.includes("{{") ? Mustache.render(block.title, sharedState) : block.title}
          subtitle={block.subtitle && block.subtitle.includes("{{") ? Mustache.render(block.subtitle, sharedState) : block.subtitle}
          jsonData={nestedData}
          showXAsDate={block.showXAsDate}
          jsonMeta={
            block.dataAsJson ? {
              meta: block.dataAsJson.meta
            } : undefined
          }
          disableTooltipSort={block.disableTooltipSort}
          seeMetricURL={block.seeMetricURL}
          yAxisLine={block.yAxisLine}
        />
      )}
      {block.caption && (
        <figcaption className="text-center text-xs mt-2 text-forest-700 dark:text-forest-400 italic">
          {block.caption}
        </figcaption>
      )}
    </div>
    </>
  );
};
