'use client';

// File: components/quick-dives/blocks/ChartBlock.tsx
import React from 'react';
import { ChartBlock as ChartBlockType } from '@/lib/types/blockTypes';
import dynamic from 'next/dynamic';
import { useQuickBite } from '@/contexts/QuickBiteContext';
import useSWR from 'swr';
import Mustache from 'mustache';
import { GTPIcon } from '@/components/layout/GTPIcon';
import GTPButtonRow from '@/components/GTPComponents/ButtonComponents/GTPButtonRow';
import { GTPButton } from '@/components/GTPComponents/ButtonComponents/GTPButton';
import fiatData from '@/public/dicts/fiat.json';

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
  chainQuickBitesTopBar?: React.ReactNode;
  chainQuickBitesTitleSuffix?: string;
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

const CHAIN_QUICK_BITES_TAB_BLOCK_CLASS = "chain-quick-bites-tab-block";
const CHAIN_QUICK_BITES_TAB_RIGHT_FLUSH_CLASS = "chain-quick-bites-tab-right-flush";
const CHAIN_QUICK_BITES_TAB_LEFT_FLUSH_CLASS = "chain-quick-bites-tab-left-flush";
const CHAIN_QUICK_BITES_TAB_CONTAINER_HEIGHT = 587;
const CHAIN_QUICK_BITES_TAB_HEADER_HEIGHT = 81;

export const ChartBlock: React.FC<ChartBlockProps> = ({ block, chainQuickBitesTopBar, chainQuickBitesTitleSuffix }) => {
  const { sharedState } = useQuickBite();
  const isChainQuickBitesTabChart = (block.className || "").split(/\s+/).includes(CHAIN_QUICK_BITES_TAB_BLOCK_CLASS);
  const isChainQuickBitesTabRightFlush = (block.className || "").split(/\s+/).includes(CHAIN_QUICK_BITES_TAB_RIGHT_FLUSH_CLASS);
  const isChainQuickBitesTabLeftFlush = (block.className || "").split(/\s+/).includes(CHAIN_QUICK_BITES_TAB_LEFT_FLUSH_CLASS);
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
  const {
    data: unProcessedData,
    isLoading: isChartLoading,
    isValidating: isChartValidating,
  } = useSWR(swrKey, { keepPreviousData: true });
  const {
    data: unProcessedPieData,
    isLoading: isPieLoading,
    isValidating: isPieValidating,
  } = useSWR(pieDataUrl, { keepPreviousData: true });

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
    const namesTransform = dynamicSeriesConfig.namesTransform;
    const names = Array.isArray(namesRaw)
      ? namesRaw.map((n: string) => namesTransform === "uppercase" ? String(n).toUpperCase() : n)
      : [];

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
        ...((() => {
          if (dynamicSeriesConfig.prefixFiatSymbolFromPath) {
            const fiatCode = getNestedValue(sourceData, dynamicSeriesConfig.prefixFiatSymbolFromPath);
            const symbol = typeof fiatCode === 'string'
              ? fiatData[fiatCode.toUpperCase() as keyof typeof fiatData]?.symbol
              : undefined;
            if (symbol) return { prefix: symbol };
          }
          if (dynamicSeriesConfig.prefix !== undefined) {
            return {
              prefix: dynamicSeriesConfig.prefix.includes('{{')
                ? Mustache.render(dynamicSeriesConfig.prefix, sharedState)
                : dynamicSeriesConfig.prefix,
            };
          }
          return {};
        })()),
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
  const showInitialLoadingState =
    (Boolean(swrKey) && isChartLoading && !unProcessedData) ||
    (Boolean(pieDataUrl) && isPieLoading && !unProcessedPieData);
  const showUpdatingState =
    (Boolean(swrKey) && isChartValidating && !isChartLoading && Boolean(unProcessedData)) ||
    (Boolean(pieDataUrl) && isPieValidating && !isPieLoading && Boolean(unProcessedPieData));

  // Don't render the chart if there's a filter key but no data yet.
  // This handles the initial state where a dropdown selection is needed.
  if (block.filterOnStateKey && !unProcessedData && !showInitialLoadingState) {
    const title = block.title && block.title.includes("{{") ? Mustache.render(block.title, sharedState) : block.title;
    const emptyStateWrapperClassName = `${isChainQuickBitesTabChart ? '' : 'my-8'} ${block.className || ''}`.trim();
    return (
      <div className={emptyStateWrapperClassName}>
        <div
          className="w-full flex flex-col items-center justify-center bg-forest-50 dark:bg-forest-900/50 rounded-lg"
          style={{ height: block.height ?? 400 }}
        >
          <h3 className="text-lg font-bold text-forest-900 dark:text-forest-100">{title}</h3>
          <p className="text-forest-700 dark:text-forest-400">Please make a selection to view the chart.</p>
        </div>
      </div>
    );
  }

  const wrapperClassName = `${(block.suppressWrapperSpacing || isChainQuickBitesTabChart) ? '' : 'my-8'} ${block.className || ''}`.trim();
  const resolvedTitle = block.title && block.title.includes("{{") ? Mustache.render(block.title, sharedState) : block.title;
  const resolvedSubtitle = block.subtitle && block.subtitle.includes("{{") ? Mustache.render(block.subtitle, sharedState) : block.subtitle;
  const resolvedCaption = block.caption && block.caption.includes("{{") ? Mustache.render(block.caption, sharedState) : block.caption;
  const isChainQuickBitesTabSideBySide =
    isChainQuickBitesTabChart && (isChainQuickBitesTabRightFlush || isChainQuickBitesTabLeftFlush);
  const inferredTimeIntervalLabel = (() => {
    const aggregationLabelByKey: Record<string, string> = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    };

    const firstAggregation = Array.isArray(effectiveMeta)
      ? effectiveMeta
          .map((metaEntry) => {
            if (typeof metaEntry !== "object" || metaEntry === null || !("aggregation" in metaEntry)) {
              return undefined;
            }
            const aggregationValue = (metaEntry as { aggregation?: unknown }).aggregation;
            return typeof aggregationValue === "string" ? aggregationValue : undefined;
          })
          .find((aggregationValue): aggregationValue is string => typeof aggregationValue === "string")
      : undefined;

    if (firstAggregation) {
      const normalizedAggregation = String(firstAggregation).toLowerCase();
      if (aggregationLabelByKey[normalizedAggregation]) {
        return aggregationLabelByKey[normalizedAggregation];
      }
    }

    const classifyCadence = (deltaMs: number) => {
      const dayMs = 24 * 60 * 60 * 1000;
      const days = deltaMs / dayMs;
      if (days < 0.75) return "Hourly";
      if (days <= 1.5) return "Daily";
      if (days <= 10) return "Weekly";
      if (days <= 18) return "Bi-weekly";
      if (days <= 45) return "Monthly";
      if (days <= 100) return "Quarterly";
      return "Yearly";
    };

    const xIndex = (() => {
      const firstMeta = Array.isArray(effectiveMeta) ? effectiveMeta[0] : undefined;
      if (typeof firstMeta?.xIndex === "number") {
        return firstMeta.xIndex;
      }
      return 0;
    })();

    if (Array.isArray(nestedData)) {
      for (const seriesRows of nestedData) {
        if (!Array.isArray(seriesRows)) {
          continue;
        }

        const timestamps = seriesRows
          .map((row: any) => (Array.isArray(row) ? Number(row[xIndex]) : NaN))
          .filter((timestamp: number) => Number.isFinite(timestamp));

        if (timestamps.length < 2) {
          continue;
        }

        const uniqueSortedTimestamps = Array.from(new Set(timestamps)).sort((a, b) => a - b);
        if (uniqueSortedTimestamps.length < 2) {
          continue;
        }

        const deltas = uniqueSortedTimestamps
          .slice(1)
          .map((timestamp, index) => timestamp - uniqueSortedTimestamps[index])
          .filter((delta) => Number.isFinite(delta) && delta > 0)
          .sort((a, b) => a - b);

        if (deltas.length === 0) {
          continue;
        }

        const medianDelta = deltas[Math.floor(deltas.length / 2)];
        if (Number.isFinite(medianDelta) && medianDelta > 0) {
          return classifyCadence(medianDelta);
        }
      }
    }

    return "Interval";
  })();
  const fallbackChainQuickBitesTopBar = (() => {
    if (!isChainQuickBitesTabSideBySide || chainQuickBitesTopBar) {
      return undefined;
    }

    return (
      <GTPButtonRow wrap className="!w-auto">
        <GTPButton
          label={inferredTimeIntervalLabel}
          size="sm"
          variant="primary"
          visualState="active"
          className="justify-center"
        />
      </GTPButtonRow>
    );
  })();
  const effectiveChainQuickBitesTopBar = chainQuickBitesTopBar ?? fallbackChainQuickBitesTopBar;
  const hasTemplateDrivenSelection =
    (typeof block.title === "string" && block.title.includes("{{")) ||
    (typeof block.subtitle === "string" && block.subtitle.includes("{{")) ||
    (Array.isArray(block.dataAsJson?.meta) &&
      block.dataAsJson.meta.some((metaEntry) => typeof metaEntry.url === "string" && metaEntry.url.includes("{{"))) ||
    (typeof block.dataAsJson?.dynamicSeries?.url === "string" &&
      block.dataAsJson.dynamicSeries.url.includes("{{")) ||
    (!Array.isArray(block.dataAsJson?.pieData) &&
      typeof block.dataAsJson?.pieData?.url === "string" &&
      block.dataAsJson.pieData.url.includes("{{"));
  const shouldAppendChainNameToTitle =
    isChainQuickBitesTabChart &&
    Boolean(chainQuickBitesTitleSuffix?.trim()) &&
    (Boolean(block.filterOnStateKey?.stateKey) || hasTemplateDrivenSelection);
  const resolvedTitleWithChainSuffix = (() => {
    if (!shouldAppendChainNameToTitle) {
      return resolvedTitle;
    }

    const titleText = typeof resolvedTitle === "string" ? resolvedTitle.trim() : "";
    const chainSuffix = chainQuickBitesTitleSuffix?.trim() || "";

    if (!titleText || !chainSuffix) {
      return resolvedTitle;
    }

    const normalizedTitle = titleText.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normalizedSuffix = chainSuffix.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (normalizedSuffix && normalizedTitle.includes(normalizedSuffix)) {
      return resolvedTitle;
    }

    return `${titleText} ${chainSuffix}`;
  })();
  const chainTabHeaderText = resolvedCaption || resolvedSubtitle;
  const chainTabHeaderClassName = "px-[2px] pb-[8px]";

  return (
    <>
    <div
      className={`${wrapperClassName} relative ${isChainQuickBitesTabChart ? "flex flex-col" : ""}`}
      style={isChainQuickBitesTabChart ? { height: `${CHAIN_QUICK_BITES_TAB_CONTAINER_HEIGHT}px` } : undefined}
      aria-busy={showUpdatingState}
    >
      {isChainQuickBitesTabChart && (resolvedTitleWithChainSuffix || chainTabHeaderText) ? (
        <div
          className={chainTabHeaderClassName}
          style={isChainQuickBitesTabChart ? { minHeight: `${CHAIN_QUICK_BITES_TAB_HEADER_HEIGHT}px` } : undefined}
        >
          {resolvedTitleWithChainSuffix ? (
            <div className="flex items-center gap-x-[8px]">
              <GTPIcon icon="gtp-quick-bites" size="sm" />
              <h3 className="heading-small-sm text-color-text-primary">
                {resolvedTitleWithChainSuffix}
              </h3>
            </div>
          ) : null}
          {chainTabHeaderText ? (
            <p className="text-sm text-color-text-primary mt-[15px]">
              {chainTabHeaderText}
            </p>
          ) : null}
        </div>
      ) : null}
      {showInitialLoadingState && !canRenderChart ? (
        <div
          className="w-full flex items-center justify-center rounded-[15px] bg-color-bg-default text-xs text-color-text-secondary"
          style={{ height: block.height ?? 400 }}
        >
          Loading chart...
        </div>
      ) : null}
      {canRenderChart && (
        <div className={`transition-opacity duration-200 ${showUpdatingState ? 'opacity-60' : 'opacity-100'} ${isChainQuickBitesTabChart ? 'flex-1 min-h-0' : ''}`}>
          <ChartWrapper
            chartType={block.chartType}
            data={block.data ?? []}
            margins={block.margins || 'normal'}
            options={block.options || {}}
            width={isChainQuickBitesTabChart ? '100%' : (block.width || '100%')}
            height={block.height || 400}
            title={resolvedTitleWithChainSuffix}
            subtitle={resolvedSubtitle}
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
            useNewChart={block.useNewChart}
            snapToCleanBoundary={block.snapToCleanBoundary}
            timeAxisTickIntervalDays={block.timeAxisTickIntervalDays}
            timeAxisTickAlignToCleanBoundary={block.timeAxisTickAlignToCleanBoundary}
            timeAxisBarEdgePaddingRatio={block.timeAxisBarEdgePaddingRatio}
            seeMetricURL={block.seeMetricURL}
            yAxisLine={block.yAxisLine}
            centerName={block.centerName}
            pieData={resolvedPieData}
            showPiePercentage={pieDataConfig?.showPercentage}
            isChainQuickBitesTabChart={isChainQuickBitesTabChart}
            defaultFilteredSeriesNames={block.defaultFilteredSeriesNames}
            top10ByMetric={block.top10ByMetric}
            scatterTrendline={block.scatterTrendline}
            chainQuickBitesTopBar={effectiveChainQuickBitesTopBar}
            quickBiteTabRightEdgeFlush={isChainQuickBitesTabRightFlush}
            quickBiteTabLeftEdgeFlush={isChainQuickBitesTabLeftFlush}
          />
        </div>
      )}
      {showUpdatingState && (
        <div className="pointer-events-none absolute right-[10px] top-[10px] z-[2] rounded-full border border-color-ui-hover bg-color-bg-default/90 px-[10px] py-[4px] text-xxs text-color-text-secondary backdrop-blur-[2px]">
          Updating...
        </div>
      )}
      {block.caption && !isChainQuickBitesTabChart && (
        <figcaption className="text-center text-xs mt-2 text-forest-700 dark:text-forest-400 italic">
          {resolvedCaption}
        </figcaption>
      )}
    </div>
    </>
  );
};
