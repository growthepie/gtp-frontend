'use client';

// File: components/quick-dives/blocks/ChartBlock.tsx
import React from 'react';
import { ChartBlock as ChartBlockType } from '@/lib/types/blockTypes';
import dynamic from 'next/dynamic';
import { useQuickBite } from '@/contexts/QuickBiteContext';
import useSWR from 'swr';
import Mustache from 'mustache';

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

interface PieSlice {
  name: string;
  y: number;
  color: string;
  tooltipDecimals?: number;
}

interface PieDataConfig {
  url: string;
  pathToData: string;
  xIndex?: number;
  yIndex?: number;
  tooltipDecimals?: number;
  colors: string | string[];
  nameMap?: Record<string, string>;
  showPercentage?: boolean;
}

export const ChartBlock: React.FC<ChartBlockProps> = ({ block }) => {
  const { sharedState } = useQuickBite();
  const dynamicSeriesConfig = block.dataAsJson?.dynamicSeries;
  const rawPieData = block.dataAsJson?.pieData;
  const pieDataConfig = React.useMemo<PieDataConfig | null>(() => {
    if (!rawPieData || Array.isArray(rawPieData)) return null;
    if (typeof rawPieData === "object" && typeof rawPieData.url === "string") {
      return rawPieData as PieDataConfig;
    }
    return null;
  }, [rawPieData]);

  // Process URLs using Mustache to reflect the current sharedState.
  // This makes the `useSWR` key dynamic.
  const processedUrls = React.useMemo(() => {
    if (dynamicSeriesConfig) return [];
    if (dynamicSeriesConfig) return [];
    const metaList = block.dataAsJson?.meta;
    if (!metaList?.length) return [];

    return metaList.map(meta => {
      if (!meta.url) return null;

      // If the URL is a mustache template
      if (meta.url.includes('{{')) {
        const requiredVars = (Mustache.parse(meta.url) || [])
          .filter(tag => tag[0] === 'name')
          .map(tag => tag[1]);
        
        // Ensure all required variables are present in sharedState
        const allVarsAvailable = requiredVars.every(v => sharedState[v] !== null && sharedState[v] !== undefined);

        if (allVarsAvailable) {
          return Mustache.render(meta.url, sharedState);
        }
        
        // If vars are not available, return null to prevent fetching a broken URL.
        if (meta.url && !meta.url.includes("{{")) {
          return meta.url;
        }
        return null;
      }
      
      // If it's not a template, just return the URL
      return meta.url;
    }).filter(Boolean) as string[];
  }, [block.dataAsJson, dynamicSeriesConfig, sharedState]);

  const dynamicSeriesUrl = React.useMemo(() => {
    if (!dynamicSeriesConfig?.url) return null;
    const rawUrl = dynamicSeriesConfig.url;

    if (rawUrl.includes('{{')) {
      const requiredVars = (Mustache.parse(rawUrl) || [])
        .filter(tag => tag[0] === 'name')
        .map(tag => tag[1]);

      const allVarsAvailable = requiredVars.every(v => sharedState[v] !== null && sharedState[v] !== undefined);
      if (!allVarsAvailable) return null;

      return Mustache.render(rawUrl, sharedState);
    }

    return rawUrl;
  }, [dynamicSeriesConfig, sharedState]);

  const pieDataUrl = React.useMemo(() => {
    if (!pieDataConfig?.url) return null;
    const rawUrl = pieDataConfig.url;

    if (rawUrl.includes('{{')) {
      const requiredVars = (Mustache.parse(rawUrl) || [])
        .filter(tag => tag[0] === 'name')
        .map(tag => tag[1]);

      const allVarsAvailable = requiredVars.every(v => sharedState[v] !== null && sharedState[v] !== undefined);
      if (!allVarsAvailable) return null;

      return Mustache.render(rawUrl, sharedState);
    }

    return rawUrl;
  }, [pieDataConfig, sharedState]);

  // The key for useSWR is now `processedUrls`, which is dynamic.
  // SWR will automatically re-fetch when the key changes.
  const swrKey = dynamicSeriesConfig ? dynamicSeriesUrl : (processedUrls.length > 0 ? processedUrls : null);
  const { data: unProcessedData } = useSWR(swrKey);
  const { data: unProcessedPieData } = useSWR(pieDataUrl);

  const dynamicDerived = React.useMemo(() => {
    if (!dynamicSeriesConfig || !unProcessedData) return null;

    const sourceData = unProcessedData;
    const values = getNestedValue(sourceData, dynamicSeriesConfig.pathToData);
    const typeNames = dynamicSeriesConfig.pathToTypes
      ? getNestedValue(sourceData, dynamicSeriesConfig.pathToTypes)
      : null;
    const namesRaw = typeof dynamicSeriesConfig.names === "string"
      ? getNestedValue(sourceData, dynamicSeriesConfig.names)
      : dynamicSeriesConfig.names;
    const colorsRaw = typeof dynamicSeriesConfig.colors === "string"
      ? getNestedValue(sourceData, dynamicSeriesConfig.colors)
      : dynamicSeriesConfig.colors;

    if (!Array.isArray(values)) return null;
    if (!Array.isArray(colorsRaw) || colorsRaw.length === 0) return null;

    const palette = colorsRaw;
    const ystartIndex = dynamicSeriesConfig.ystartIndex ?? 1;
    const names = Array.isArray(namesRaw) ? namesRaw : [];

    const maxColumns = Array.isArray(values[0]) ? values[0].length : 0;
    const availableSeriesCount = Math.max(0, maxColumns - ystartIndex);
    const seriesCount = names.length > 0 ? Math.min(names.length, availableSeriesCount) : availableSeriesCount;

    const hasNonZeroInSeries = (seriesIndex: number) => {
      return values.some((row: any) => {
        if (!Array.isArray(row)) return false;
        const raw = row[seriesIndex];
        const numeric = typeof raw === "number" ? raw : Number(raw);
        return Number.isFinite(numeric) && numeric !== 0;
      });
    };

    const generatedMeta = Array.from({ length: seriesCount })
      .map((_, idx) => {
        const yIndex = ystartIndex + idx;
        const fallbackTypeName = Array.isArray(typeNames) && typeof typeNames[yIndex] === "string" ? typeNames[yIndex] : `Series ${idx + 1}`;
        const seriesName = typeof names[idx] === "string" && names[idx].length > 0 ? names[idx] : fallbackTypeName;
        return {
          yIndex,
          seriesName,
        };
      })
      .filter(({ yIndex }) => hasNonZeroInSeries(yIndex))
      .map(({ yIndex, seriesName }, seriesIdx) => ({
        name: seriesName,
        color: palette[seriesIdx % palette.length],
        type: dynamicSeriesConfig.type || block.chartType,
        stacking: dynamicSeriesConfig.stacking ?? "normal",
        xIndex: dynamicSeriesConfig.xIndex ?? 0,
        yIndex,
        tooltipDecimals: dynamicSeriesConfig.tooltipDecimals ?? 0,
        url: dynamicSeriesUrl || dynamicSeriesConfig.url,
        pathToData: dynamicSeriesConfig.pathToData,
      }));

    return {
      meta: generatedMeta,
      nestedData: generatedMeta.map(() => values),
    };
  }, [block.chartType, dynamicSeriesConfig, dynamicSeriesUrl, unProcessedData]);
  
  // Get nested data for all meta entries
  const metaList = block.dataAsJson?.meta;
  const nestedData = dynamicSeriesConfig
    ? dynamicDerived?.nestedData
    : metaList?.length && unProcessedData 
    ? metaList.map((meta, index) => 
        meta.pathToData ? getNestedValue(unProcessedData[index], meta.pathToData) : unProcessedData[index]
      )
    : undefined;

  const resolvedJsonMeta = React.useMemo(() => {
    if (dynamicSeriesConfig) {
      return dynamicDerived?.meta || null;
    }
    if (!metaList?.length) return null;
    if (!unProcessedData) return metaList;

    return metaList.map((meta, index) => {
      let resolvedName = meta.name;

      if (meta.nameFromPath) {
        const sourceData = unProcessedData[index] ?? unProcessedData[0];
        const nameCandidates = getNestedValue(sourceData, meta.nameFromPath);

        if (Array.isArray(nameCandidates) && typeof nameCandidates[meta.yIndex] === "string") {
          resolvedName = nameCandidates[meta.yIndex];
        }
      }

      return {
        ...meta,
        name: resolvedName,
      };
    });
  }, [dynamicDerived?.meta, dynamicSeriesConfig, metaList, unProcessedData]);

  const resolvedPieData = React.useMemo<PieSlice[]>(() => {
    if (Array.isArray(rawPieData)) return rawPieData;
    if (!pieDataConfig || !unProcessedPieData) return [];

    const sourceData = pieDataConfig.pathToData
      ? getNestedValue(unProcessedPieData, pieDataConfig.pathToData)
      : unProcessedPieData;

    if (!sourceData) return [];

    const rows = Array.isArray(sourceData)
      ? sourceData
      : Array.isArray(sourceData.rows)
        ? sourceData.rows
        : [];

    if (!rows.length) return [];

    const rawPalette = typeof pieDataConfig.colors === "string"
      ? getNestedValue(unProcessedPieData, pieDataConfig.colors)
      : pieDataConfig.colors;

    if (!Array.isArray(rawPalette) || rawPalette.length === 0) return [];

    const palette = rawPalette
      .filter((color): color is string => typeof color === "string" && color.length > 0);

    if (palette.length === 0) return [];

    const columns = Array.isArray(sourceData.columns) ? sourceData.columns : [];
    const xIndex = pieDataConfig.xIndex ?? 0;
    const yIndex = pieDataConfig.yIndex ?? 1;
    const xColumnKey = typeof columns[xIndex] === "string" ? columns[xIndex] : undefined;
    const yColumnKey = typeof columns[yIndex] === "string" ? columns[yIndex] : undefined;

    return rows
      .map((row: any, index: number) => {
        let rawName: unknown;
        let rawValue: unknown;

        if (Array.isArray(row)) {
          rawName = row[xIndex];
          rawValue = row[yIndex];
        } else if (row && typeof row === "object") {
          if (xColumnKey && xColumnKey in row) {
            rawName = row[xColumnKey];
          } else {
            rawName = Object.values(row)[xIndex];
          }

          if (yColumnKey && yColumnKey in row) {
            rawValue = row[yColumnKey];
          } else {
            rawValue = Object.values(row)[yIndex];
          }
        } else {
          return null;
        }

        const y = typeof rawValue === "number" ? rawValue : Number(rawValue);
        if (!Number.isFinite(y)) return null;

        const rawNameStr = String(rawName ?? `Slice ${index + 1}`);
        const name = pieDataConfig.nameMap?.[rawNameStr] ?? rawNameStr;
        const color = palette[index % palette.length];
        const tooltipDecimals = pieDataConfig.tooltipDecimals;

        return { name, y, color, tooltipDecimals };
      })
      .filter((point): point is PieSlice => point !== null);
  }, [pieDataConfig, rawPieData, unProcessedPieData]);

  const passChartData = block.dataAsJson ? unProcessedData : block.data;
  const effectiveMeta = dynamicSeriesConfig ? (dynamicDerived?.meta || []) : (resolvedJsonMeta || metaList || []);
  const hasPieData = block.chartType === 'pie' && resolvedPieData.length > 0;
  const canRenderChart = (Boolean(passChartData) || hasPieData) && (!dynamicSeriesConfig || effectiveMeta.length > 0 || hasPieData);

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
      {canRenderChart && (
        <ChartWrapper
          chartType={block.chartType}
          data={block.data ?? []}
          margins={block.margins || 'normal'}
          options={block.options || {}}
          width={block.width || '100%'}
          height={block.height || 400}
          title={block.title && block.title.includes("{{") ? Mustache.render(block.title, sharedState) : block.title}
          subtitle={block.subtitle && block.subtitle.includes("{{") ? Mustache.render(block.subtitle, sharedState) : block.subtitle}
          jsonData={nestedData}
          showXAsDate={block.showXAsDate}
          showZeroTooltip={block.showZeroTooltip}
          showTotalTooltip={block.showTotalTooltip}
          jsonMeta={
            effectiveMeta.length ? {
              meta: effectiveMeta
            } : undefined
          }
          disableTooltipSort={block.disableTooltipSort}
          seeMetricURL={block.seeMetricURL}
          yAxisLine={block.yAxisLine}
          centerName={block.centerName}
          pieData={resolvedPieData}
          showPiePercentage={pieDataConfig?.showPercentage}
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
