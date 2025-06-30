// components/layout/EthAgg/DashboardChart.tsx
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useId } from 'react';
import { ChartWatermarkWithMetricName } from '../ChartWatermark';
import { useLocalStorage, useResizeObserver } from 'usehooks-ts';
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
  const circleRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth, height: containerHeight } = useResizeObserver({
    ref: mainContainerRef,
    box: 'border-box',
  });
  
  // Debounced dimensions to allow chart to finish readjusting
  const [debouncedDimensions, setDebouncedDimensions] = useState({ 
    width: containerWidth, 
    height: containerHeight 
  });
  const [isDebouncing, setIsDebouncing] = useState(false);
  
  useEffect(() => {
    setIsDebouncing(true);
    const timeout = setTimeout(() => {
      setDebouncedDimensions({ width: containerWidth, height: containerHeight });
      setIsDebouncing(false);
    }, 150); // 150ms delay to allow chart to finish adjusting
    
    return () => clearTimeout(timeout);
  }, [containerWidth, containerHeight]);

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

  // Function to get pixel coordinates from data values
  const getPixelCoordinates = useCallback((seriesIndex: number, dataIndex: number) => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance) return null;
    
    // Convert data coordinates to pixel coordinates
    const pixelCoords = chartInstance.convertToPixel('grid', [dataIndex, seriesData[seriesIndex]?.[dataIndex]]);
    return pixelCoords; // Returns [x, y] in pixels
  }, [seriesData]);

  // Function to get data coordinates from pixel coordinates
  const getDataCoordinates = useCallback((x: number, y: number) => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance) return null;
    
    // Convert pixel coordinates to data coordinates
    const dataCoords = chartInstance.convertFromPixel('grid', [x, y]);
    return dataCoords; // Returns [categoryIndex, value]
  }, []);

    
  const lastDataPointPixelCoords = useMemo(() => {
    if (!seriesData || seriesData.length === 0 || !categories || categories.length === 0) return null;

    const chartInstance = chartRef.current?.getEchartsInstance();
    const circleElement = circleRef.current;
    if (!chartInstance || !circleElement) return null;
    
    // Get the last data point index (rightmost on x-axis)
    const lastDataIndex = categories.length - 1;
    
    // Calculate the stacked/cumulative value at the last data point
    // This gives us the topmost visual point of the stack
    let stackedValue = 0;
    seriesData.forEach((series) => {
      const value = series[lastDataIndex];
      if (value != null && value > 0) {
        stackedValue += value;
      }
    });
    
    if (stackedValue === 0) return null;
    
    // Convert data coordinates to pixel coordinates
    const pixelCoords = chartInstance.convertToPixel('grid', [lastDataIndex, stackedValue]);
    
    // Get circle position relative to chart container
    const circleRect = circleElement.getBoundingClientRect();
    const chartContainer = chartRef.current?.ele;
    if (!chartContainer) return pixelCoords;
    
    const chartRect = chartContainer.getBoundingClientRect();
    const circleY = circleRect.top + circleRect.height / 2 - chartRect.top;
    
    return [...pixelCoords, circleY]; // Returns [x, y, circleY] in pixels
  }, [seriesData, categories, debouncedDimensions.width, debouncedDimensions.height]); 

  


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

  

  // Advanced tooltip formatter similar to Highcharts version
  const createEchartsTooltipFormatter = useCallback((options: {
    maxPointsToShow?: number;
    enableTotal?: boolean;
  } = {}) => {
    const { maxPointsToShow = 10, enableTotal = false } = options;
    const SERIES_COLORS = {
      "Total L2s": "#1DF7EF", 
      "Ethereum Mainnet": AllChainsByKeys["ethereum"]?.colors.dark[0],
      "Layer 2s": AllChainsByKeys["all_l2s"]?.colors.dark[0],
    }
    return (params: any[]) => {
      if (!params?.length) return '';
      
      // Format the date for the header
      const date = new Date(params[0].axisValueLabel);
      const dateStr = date.toLocaleDateString("en-GB", {
        year: "numeric", month: "short", day: "numeric"
      });

     
      // Sort points by value (highest first)
      const sortedParams = [...params]
        .filter(param => param.value != null)
        .sort((a, b) => b.value - a.value);
      
      const visibleParams = sortedParams.slice(0, maxPointsToShow);
      const restParams = sortedParams.slice(maxPointsToShow);
      
     
      // Calculate max value for bar scaling
      const maxValue = Math.max(...sortedParams.map(param => param.value));
      
      // Start building tooltip
      let tooltip = `
        <div class="mt-2 mr-2 mb-3 -ml-2.5 min-w-60 text-xs font-raleway">
          <div class="flex-1 heading-small-xs ml-6 mb-2">${dateStr}</div>
      `;

      // Add visible points
      visibleParams.forEach(param => {
        // Type guard to check if dataSource has daily property (CountLayer2s type)
        const hasDaily = 'daily' in dataSource && dataSource.daily;

                 let layer2Index = param.seriesName === "Total L2s" && hasDaily 
           ? dataSource.daily.values.findIndex(data => {
             
             return new Date(data[dataSource.daily.types.indexOf("unix")]).toISOString().split('T')[0] === params[0].axisValueLabel
           })       
           
           : null;
         const barWidth = maxValue > 0 ? (param.value / maxValue) * 100 : 0;
         const layer2Data = param.seriesName === "Total L2s" && hasDaily && layer2Index !== null && layer2Index >= 0
           ? dataSource.daily.values[layer2Index][dataSource.daily.types.indexOf("l2s_launched")]
           : null;
        
                tooltip += `
          <div class="flex w-full h-[15px] space-x-2 items-center font-medium mb-0.5">
            <div class="w-[15px] h-[10px] rounded-r-full relative overflow-hidden" style="background-color: ${SERIES_COLORS[param.seriesName]};">
              <div class="h-full rounded-r-full" style="background-color: ${param.color}; width: ${barWidth}%;"></div>
            </div>
            <div class="text-xs flex-1 text-left">${param.seriesName}</div>
            <div class="text-right numbers-xs">${Intl.NumberFormat('en-US', { notation: 'standard', maximumFractionDigits: 2 }).format(param.value)}</div>
          </div>
        `;
        
        // Add additional layer2 info if available
        if (layer2Data && Array.isArray(layer2Data) && layer2Data.length > 0) {
          layer2Data.forEach((l2Item, index) => {
           
            const l2Name = l2Item.l2beat_name;
            tooltip += `
              <div class="flex w-full h-[15px] space-x-2 items-center font-medium mb-0.5 opacity-80">
                <div class="w-[15px] h-[10px] rounded-r-full relative overflow-hidden" style="background-color: transparent;">
                  <div class="h-full rounded-r-full" style="background-color: transparent; width: 50%;"></div>
                </div>
                <div class="text-xs flex-1 text-left">${l2Name}</div>
             
              </div>
            `;
          });
        } else if (layer2Data && typeof layer2Data === 'number' && layer2Data > 0) {
          // Fallback for when layer2Data is just a count
          tooltip += `
            <div class="flex w-full h-[15px] space-x-2 items-center font-medium mb-0.5 opacity-80">
              <div class="w-[15px] h-[10px] rounded-r-full relative overflow-hidden" style="background-color: ${SERIES_COLORS[param.seriesName]};">
                <div class="h-full rounded-r-full" style="background-color: ${param.color}; width: 50%;"></div>
              </div>
              <div class="text-xs flex-1 text-left">L2s Launched</div>
              <div class="text-right numbers-xs">${layer2Data}</div>
            </div>
          `;
        }
        
      });
      
      // Add "Others" row if necessary
      if (restParams.length > 0) {
        const othersTotal = restParams.reduce((sum, param) => sum + param.value, 0);
        const othersValue = formatNumberCallback(othersTotal);
        const othersBarWidth = maxValue > 0 ? (othersTotal / maxValue) * 100 : 0;
        
        tooltip += `
          <div class="flex w-full h-[15px] space-x-2 items-center font-medium mb-0.5 opacity-70">
            <div class="w-4 h-1.5 rounded-r-full relative overflow-hidden" style="background-color: #94a3b820;">
              <div class="h-full rounded-r-full" style="background-color: #94a3b8; width: ${othersBarWidth}%;"></div>
            </div>
            <div class="tooltip-point-name flex-1 text-left">Others (${restParams.length})</div>
            <div class="text-right numbers-xs">${othersValue}</div>
          </div>
        `;
      }

     
      
      // Add total if enabled and multiple series
      if (enableTotal && visibleParams.length > 1) {
        const totalValue = visibleParams.reduce((sum, param) => sum + param.value, 0);
        const totalFormatted = formatNumberCallback(totalValue);
        
        tooltip += `
          <div class="flex w-full h-[15px] mt-[5px] space-x-2 items-center font-medium mb-0.5 border-t border-gray-600 pt-1">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: transparent;"></div>
            <div class="tooltip-point-name flex-1 text-left font-bold">Total</div>
            <div class="text-right numbers-xs font-bold">${totalFormatted}</div>
          </div>
        `;
      }
      
      tooltip += `</div>`;
      return tooltip;
    };
  }, [formatNumberCallback]);

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
        symbolSize: 12,
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
          symbolSize: 8,
          symbol: 'circle',
          itemStyle: {
            color: colors[1] + "80", // Series color with 50% opacity
            borderWidth: 0,
            shadowBlur: 0,
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
      grid: { left: 0, right: 42, top: 20, bottom: 0 },
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
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          show: true,
          lineStyle: { color: '#5A64624F', width: 1 }
        },
        axisLabel: {
          show: true,
          margin: -1,
          padding: [3, 0, 0, 0],
          color: '#CDD8D3',
          fontSize: 9,
          fontWeight: 500,
          fontFamily: 'Raleway, sans-serif',
          align: 'left',
          verticalAlign: 'top',
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
          lineStyle: { color: COLORS.PLOT_LINE, width: 1, type: 'solid' }
        },
        formatter: createEchartsTooltipFormatter({
          maxPointsToShow: 10,
          enableTotal: false
        })
      }
    };
  }, [seriesConfigs, seriesData, categories, AllChainsByKeys, chartContainerWidth, formatNumberCallback]);

  return (
    <div ref={mainContainerRef} className='group/chart flex flex-col relative rounded-[15px] w-full h-[375px] bg-[#1F2726] pt-[15px] overflow-hidden'>
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
            <div ref={circleRef} className='w-[16px] h-[16px] rounded-full z-chart bg-[#CDD8D3]' />
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
      <div className='w-full absolute bottom-0 left-0 right-0' style={{ height: '304px' }} ref={chartContainerRef}>
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ 
            renderer: 'canvas',
            width: chartContainerWidth || undefined,
            height: 304,
          }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
  
      {lastDataPointPixelCoords && lastDataPointPixelCoords.length === 3 && !isDebouncing && (
        <div 
          className='absolute w-[1px] bg-[#CDD8D3] pointer-events-none z-10' 
          style={{ 
            left: `${lastDataPointPixelCoords[0]}px`,
            bottom: `${304 - lastDataPointPixelCoords[1]}px`,
            height: `${lastDataPointPixelCoords[1] - lastDataPointPixelCoords[2]}px`,
            transform: 'translateX(-50%)'
          }}
        />
      )}

      {/* Custom X-Axis Timeline */}
      <XAxisLabels xMin={xAxisExtremes.xMin} xMax={xAxisExtremes.xMax} />
    </div>
  );
}