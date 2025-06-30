// components/layout/EthAgg/DashboardChart.tsx
import React, { useCallback, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useId } from 'react';
import { ChartWatermarkWithMetricName } from '../ChartWatermark';
import { useLocalStorage } from 'usehooks-ts';
import { useElementSizeObserver } from '@/hooks/useElementSizeObserver';
import { useMaster } from '@/contexts/MasterContext';
import { AggChartProps } from './MetricsCharts';
import { GTPTooltipNew, TooltipBody } from '@/components/tooltip/GTPTooltip';
import { GTPIcon } from '../GTPIcon';

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

const XAxisLabels = React.memo(({ xMin, xMax }: { xMin: number, xMax: number }) => (
  <div className="absolute bottom-0 left-0 right-0 flex w-full justify-between items-center pl-[15px] pr-[34px] opacity-100 transition-opacity duration-[900ms] group-hover/chart:opacity-0 pointer-events-none">      
    <div className='text-xxs flex gap-x-[2px] items-center bg-[#34424080] rounded-full px-[5px] py-[2px]'>
      <div className='w-[6px] rounded-full h-[6px] bg-[#CDD8D3]' />
      {new Date(xMin).getFullYear()}
    </div>
    <div className='text-xxs flex gap-x-[2px] items-center bg-[#34424080] rounded-full px-[5px] py-[2px]'>
      {new Date(xMax).getFullYear()}
      <div className='w-[6px] rounded-full h-[6px] bg-[#CDD8D3]' />
    </div>
  </div>
));

// Optimized number formatting function
const formatNumber = (number: number, prefix = "", showUsd = true): string => {
  if (number === 0) return "0";
  
  const absNumber = Math.abs(number);
  let formatted: string;
  
  if (absNumber >= 1e12) formatted = (number / 1e12).toFixed(2) + "T";
  else if (absNumber >= 1e9) formatted = (number / 1e9).toFixed(2) + "B";
  else if (absNumber >= 1e6) formatted = (number / 1e6).toFixed(2) + "M";
  else if (absNumber >= 1e3) formatted = (number / 1e3).toFixed(2) + "k";
  else formatted = number.toFixed(2);

  return prefix + formatted;
};

// Optimized data processing functions
const extractCategories = (seriesData: [number, number][][]): string[] => {
  const timestampSet = new Set<number>();
  seriesData.forEach(series => {
    series.forEach(([timestamp]) => timestampSet.add(timestamp));
  });
  
  return Array.from(timestampSet)
    .sort((a, b) => a - b)
    .map(timestamp => {
      const date = timestamp > 1e10 ? new Date(timestamp) : new Date(timestamp * 1000);
      return date.toISOString().split('T')[0];
    });
};

const alignDataForStacking = (seriesData: [number, number][][], categories: string[]): number[][] => {
  const timestampToIndex = new Map(
    categories.map((category, index) => [category, index])
  );
  
  return seriesData.map(series => {
    const alignedData = new Array(categories.length).fill(null);
    series.forEach(([timestamp, value]) => {
      const date = timestamp > 1e10 ? new Date(timestamp) : new Date(timestamp * 1000);
      const formattedDate = date.toISOString().split('T')[0];
      const index = timestampToIndex.get(formattedDate);
      if (index !== undefined) {
        alignedData[index] = value;
      }
    });
    return alignedData;
  });
};

export function AggChart({
  title,
  tooltipContent,
  prefix,
  dataSource,
  seriesConfigs,
  totalValueExtractor,
  shareValueExtractor,
}: AggChartProps) {
  const uniqueId = useId();
  const { AllChainsByKeys } = useMaster();
  const [showUsd] = useLocalStorage("showUsd", true);
  const chartRef = useRef<ReactECharts>(null);

  const { totalValue, shareValue, seriesData, categories, xAxisMin, xAxisMax } = useMemo(() => {
    const total = totalValueExtractor(dataSource, showUsd);
    const share = shareValueExtractor?.(dataSource, showUsd);

    let minX = Infinity;
    let maxX = -Infinity;

    const rawSeriesData = seriesConfigs.map(config => {
      const dataPoints = config.dataExtractor(dataSource, showUsd);
      if (dataPoints.length > 0) {
        minX = Math.min(minX, dataPoints[0][0]);
        maxX = Math.max(maxX, dataPoints[dataPoints.length - 1][0]);
      }
      return dataPoints;
    });

    const categories = extractCategories(rawSeriesData);
    const alignedData = alignDataForStacking(rawSeriesData, categories);

    return {
      totalValue: total,
      shareValue: share,
      seriesData: alignedData,
      categories,
      xAxisMin: isFinite(minX) ? minX : null,
      xAxisMax: isFinite(maxX) ? maxX : Date.now(),
    };
  }, [dataSource, seriesConfigs, showUsd, totalValueExtractor, shareValueExtractor]);

  const isColumnChart = useMemo(() => 
    seriesConfigs.some(config => config.type === 'column'), 
    [seriesConfigs]
  );

  const [chartContainerRef, { width: chartContainerWidth }] = useElementSizeObserver<HTMLDivElement>();

  const xAxisExtremes = useMemo(() => ({
    xMin: xAxisMin ?? 0,
    xMax: xAxisMax ?? Date.now()
  }), [xAxisMin, xAxisMax]);

  const formatNumberCallback = useCallback(
    (value: number | string) => formatNumber(parseFloat(value as string), prefix, showUsd),
    [showUsd, prefix]
  );

  // Memoized ECharts option configuration
  const option = useMemo(() => {
    const series = seriesConfigs.map((config, index) => {
      const colors = AllChainsByKeys[config.key]?.colors.dark ?? ["#10808C", "#1DF7EF"];
      
      const baseConfig: any = {
        name: config.name,
        type: config.type === 'column' ? 'bar' : 'line',
        data: seriesData[index] || [],
        stack: config.stacking,
        smooth: true,
        symbol: 'circle',
        symbolSize: 0,
        lineStyle: { width: 1.5 },
        itemStyle: {
          color: config.type === 'column' 
            ? new echarts.graphic.LinearGradient(0, 1, 0, 0, [
                { offset: 0, color: colors[0] },
                { offset: 1, color: colors[1] }
              ])
            : new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: colors[0] + "CC" },
                { offset: 1, color: colors[1] + "CC" }
              ])
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 5,
            shadowColor: colors[1] + "CC",
          }
        }
      };

      if (config.type !== 'column') {
        baseConfig.areaStyle = {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors[1] + "33" },
            { offset: 1, color: colors[0] + "33" }
          ])
        };
      }

      if (config.type === 'column' && chartContainerWidth) {
        baseConfig.barWidth = (chartContainerWidth - 44) / (categories?.length || 1) * 0.7;
      }

      return baseConfig;
    });

    return {
      animation: false,
      backgroundColor: 'transparent',
      grid: { left: 15, right: 34, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: categories || [],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        splitNumber: 4,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          show: true,
          lineStyle: { color: '#5A64624F', width: 1 }
        },
        axisLabel: {
          show: true,
          margin: 5,
          color: '#CDD8D3',
          fontSize: 9,
          fontWeight: 500,
          fontFamily: 'var(--font-raleway), sans-serif',
          formatter: formatNumberCallback,
        }
      },
      series,
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#2A3433EE',
        borderWidth: 0,
        borderRadius: 17,
        textStyle: { color: 'rgb(215, 223, 222)', fontSize: 12 },
        axisPointer: {
          type: 'line',
          lineStyle: { color: COLORS.PLOT_LINE, width: 0.5 }
        },
        formatter: (params: any) => {
          if (!params?.length) return '';
          
          const date = new Date(params[0].axisValueLabel);
          const dateStr = date.toLocaleDateString("en-GB", {
            year: "numeric", month: "short", day: "numeric"
          });
          
          let content = `<div style="margin-bottom: 5px; font-weight: bold;">${dateStr}</div>`;
          
          params.forEach((param: any) => {
            if (param.value != null) {
              const value = formatNumberCallback(param.value);
              content += `
                <div style="display: flex; align-items: center; margin: 2px 0;">
                  <span style="display: inline-block; width: 10px; height: 10px; background: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
                  <span>${param.seriesName}: ${value}</span>
                </div>
              `;
            }
          });
          
          return content;
        }
      }
    };
  }, [seriesConfigs, seriesData, categories, AllChainsByKeys, chartContainerWidth, formatNumberCallback]);

  return (
    <div className='group/chart flex flex-col relative rounded-[15px] w-full h-[375px] bg-[#1F2726] pt-[15px] overflow-hidden'>
      {/* Header */}
      <div className='flex h-[56px] px-[34px] items-start w-full'>
        <div className='flex gap-x-[10px] items-center z-[10]'>
          <div className='heading-large-md text-nowrap'>{title}</div>
          <GTPTooltipNew
            placement="top-start"
            allowInteract={true}
            trigger={
              <div>
                <GTPIcon icon="gtp-info-monochrome" size='sm' className='pointer-events-auto' />
              </div>
            }
            containerClass="flex flex-col gap-y-[10px]"
            positionOffset={{ mainAxis: 0, crossAxis: 20 }}
            size='md'
          >
            <TooltipBody>
              <div className="pl-[20px]">{tooltipContent}</div>
            </TooltipBody>
          </GTPTooltipNew>
        </div>
        <div className='flex flex-col h-full items-end pt-[5px] w-full'>
          <div className='flex items-center gap-x-[5px]'>
            <div className='numbers-xl bg-gradient-to-b bg-[#CDD8D3] bg-clip-text text-transparent'>{totalValue}</div>
            <div className='w-[16px] h-[16px] rounded-full z-chart bg-[#CDD8D3]' />
          </div>
          {shareValue && (
            <div className='flex items-center gap-x-[5px]'>
              <div className='text-sm bg-gradient-to-b from-[#FE5468] to-[#FFDF27] bg-clip-text text-transparent'>{shareValue}</div>
              <div className='w-[16px] h-[16px] rounded-full bg-transparent' />
            </div>
          )}
        </div>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-[40.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-20">
        <ChartWatermarkWithMetricName className="w-[128.67px] h-[36px] md:w-[193px] md:h-[58px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten z-30" metricName={title} />
      </div>
      
      {/* ECharts Chart */}
      <div className='w-full absolute bottom-0' ref={chartContainerRef}>
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: '380px', width: '100%' }}
          opts={{ 
            renderer: 'canvas',
            width: chartContainerWidth || undefined,
            height: 380 
          }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
      
      {/* Custom X-Axis Timeline */}
      <XAxisLabels xMin={xAxisExtremes.xMin} xMax={xAxisExtremes.xMax} />
    </div>
  );
}