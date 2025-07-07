// components/layout/EthAgg/DashboardChart.tsx
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useId } from 'react';
import { ChartWatermarkWithMetricName } from '../ChartWatermark';
import { useLocalStorage, useMediaQuery, useResizeObserver } from 'usehooks-ts';
import { useElementSizeObserver } from '@/hooks/useElementSizeObserver';
import { useMaster } from '@/contexts/MasterContext';
import { AggChartProps } from './MetricsCharts';
import { GTPTooltipNew, TooltipBody } from '@/components/tooltip/GTPTooltip';
import { GTPIcon } from '../GTPIcon';
import moment from 'moment';

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

const UNLISTED_CHAIN_COLORS = ["#7D8887", "#717D7C", "#667170", "#5A6665", "#4F5B5A", "#43504F", "#384443", "#2C3938"]


const XAxisLabels = React.memo(({ xMin, xMax, rightMargin, isMobile }: { xMin: number, xMax: number, rightMargin?: string, isMobile: boolean }) => (
  <div className={`absolute bottom-0 left-0 right-0 flex w-full justify-between items-center pl-[15px] ${isMobile ? "pr-[3px]" : "pr-[19px]"} opacity-100 transition-opacity duration-[900ms] group-hover/chart:opacity-0 pointer-events-none`}>
    <div className='text-xxs flex gap-x-[2px] items-center bg-[#34424080] rounded-full px-[5px] py-[2px]'>
      <div className='w-[6px] rounded-full h-[6px] bg-[#CDD8D3]' />
      {new Date(xMin).getFullYear()}
    </div>
    <div className='text-xxs flex gap-x-[2px] items-center bg-[#34424080] rounded-full px-[5px] py-[2px]'
      style={{ marginRight: rightMargin }}
    >
      {new Date(xMax).getFullYear()}
      <div className='w-[6px] rounded-full h-[6px] bg-[#CDD8D3]' />
    </div>
  </div>
));

XAxisLabels.displayName = 'XAxisLabels';

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
  chartKey,
  onCoordinatesUpdate,
  allChartCoordinates,
}: AggChartProps) {
  const uniqueId = useId();
  const { AllChainsByKeys } = useMaster();
  const [showUsd] = useLocalStorage("showUsd", true);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const chartRef = useRef<ReactECharts>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const prevCoordinatesRef = useRef<{ x: number; y: number; circleY: number } | null>(null);
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

  // Custom tooltip state
  const [customTooltip, setCustomTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: any[];
  }>({ visible: false, x: 0, y: 0, data: [] });

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

  // Update coordinates in parent component when they change
  useEffect(() => {
    let newCoords: { x: number; y: number; circleY: number } | null = null;

    if (lastDataPointPixelCoords && lastDataPointPixelCoords.length === 3) {
      newCoords = {
        x: lastDataPointPixelCoords[0],
        y: lastDataPointPixelCoords[1],
        circleY: lastDataPointPixelCoords[2]
      };
    }

    // Only update if coordinates have actually changed
    const prevCoords = prevCoordinatesRef.current;
    const coordsChanged =
      (!newCoords && prevCoords) ||
      (!prevCoords && newCoords) ||
      (newCoords && prevCoords && (
        prevCoords.x !== newCoords.x ||
        prevCoords.y !== newCoords.y ||
        prevCoords.circleY !== newCoords.circleY
      ));

    if (coordsChanged) {
      prevCoordinatesRef.current = newCoords;
      onCoordinatesUpdate(chartKey, newCoords);
    }
  }, [lastDataPointPixelCoords, chartKey, onCoordinatesUpdate]);

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





  // Memoized series colors
  // const seriesColors = useMemo(() => ({
  //   "Total L2s": AllChainsByKeys["all_l2s"]?.colors.dark[0], 
  //   "Ethereum Mainnet": AllChainsByKeys["ethereum"]?.colors.dark[0],
  //   "Layer 2s": AllChainsByKeys["all_l2s"]?.colors.dark[0],
  // }), [AllChainsByKeys]);

  // Custom Tooltip Component
  const CustomTooltip = useCallback(({ data, x, y, metricName }: { data: any[], x: number, y: number, metricName: string }) => {
    if (!data.length) return null;
    const dateStr = moment.utc(data[0].categoryLabel).utc().locale("en-GB").format("DD MMM YYYY");


    const isMobile = useMediaQuery("(max-width: 768px)");

    // sum of all values
    const pointsSum = data.reduce((acc: number, point: any) => acc + point.value, 0);

    const maxPoint = data.reduce((max: number, point: any) =>
      Math.max(max, point.value), 0);

    const maxPercentage = data.reduce((max: number, point: any) =>
      Math.max(max, point.percentage), 0);


    // Sort by value (highest first)
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    // Get layer2Data for "Total L2s" series
    const hasDaily = 'daily' in dataSource && dataSource.daily;
    const layer2Index = hasDaily
      ? dataSource.daily.values.findIndex(dataItem =>
        new Date(dataItem[dataSource.daily.types.indexOf("unix")]).toISOString().split('T')[0] === data[0].categoryLabel
      )
      : -1;

    const layer2Data = hasDaily && layer2Index >= 0
      ? dataSource.daily.values[layer2Index][dataSource.daily.types.indexOf("l2s_launched")]
      : null;

    const totalL2sItem = sortedData.find(item => item.seriesName === "Layer 2s Live");
    const showL2List = totalL2sItem && layer2Data && Array.isArray(layer2Data) && layer2Data.length > 0;

    let tooltipWidth = 256; // max-w-64 = 256px
    if (metricName === "# Layer 2s Live") {
      tooltipWidth = 300;
    }
    let baseHeight = 50; // base tooltip height
    if (metricName === "# Layer 2s Live") {
      baseHeight = 50;
    }

    const itemHeight = 20; // height per data item
    const l2SectionHeight = showL2List ? 60 + (layer2Data.length * 32) : 0; // L2 section height
    const tooltipHeight = baseHeight + (sortedData.length * itemHeight) + l2SectionHeight;

    const containerW = containerWidth || 800;
    const containerH = 304; // chart height
    const margin = 10; // margin from edges
    const cursorOffset = 12; // offset from cursor

    // Chart grid area (accounting for ECharts margins)
    const gridLeft = 0;
    const gridRight = containerW - 42; // ECharts right margin
    const gridTop = 20; // ECharts top margin  
    const gridBottom = containerH;

    // Initial positioning - prefer top-right of cursor
    let tooltipX = x + cursorOffset;
    let tooltipY = y - tooltipHeight - cursorOffset;

    // Horizontal positioning logic
    if (tooltipX + tooltipWidth > gridRight - margin) {
      // Not enough space on right, try left
      tooltipX = x - tooltipWidth - cursorOffset;
      // If still doesn't fit on left, clamp to right edge
      if (tooltipX < gridLeft + margin) {
        tooltipX = gridRight - tooltipWidth - margin;
      }
    }

    // Vertical positioning logic  
    if (tooltipY < gridTop + margin) {
      // Not enough space above, position below cursor
      tooltipY = y + cursorOffset;
      // If doesn't fit below either, position at bottom of available space
      if (tooltipY + tooltipHeight > gridBottom - margin) {
        tooltipY = gridBottom - tooltipHeight - margin;
      }
    }

    // Final bounds checking
    tooltipX = Math.max(gridLeft + margin, Math.min(tooltipX, gridRight - tooltipWidth - margin));
    tooltipY = y - tooltipHeight / 3;
    if (metricName === "# Layer 2s Live") {
      tooltipY = y - 50;
    }

    let widthClassNames = "min-w-[250px] max-w-80";

    if (metricName === "# Layer 2s Live") {
      widthClassNames = "w-[300px]";
    }

    let heightClassNames = "min-h-[50px]";
    if (metricName === "# Layer 2s Live") {
      heightClassNames = "min-h-[50px]";
    }

    return (
      <div
        className={`absolute pointer-events-none z-[999] bg-[#2A3433EE] rounded-xl p-3 ${widthClassNames} ${heightClassNames} text-xs font-raleway shadow-lg`}
        style={{
          left: tooltipX,
          top: tooltipY,
        }}
      >
        <div className="flex items-center gap-x-[5px] justify-between mb-2 pl-2.5">
          <div className="heading-small-xs">{dateStr}</div>
          <div className="text-xs h-[18px] flex items-center">
            {metricName}
          </div>
        </div>

        {sortedData.map((item, index) => {
          const maxValue = Math.max(...sortedData.map(d => d.value));
          const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

          return (
            <>
              <div key={index} className="flex w-full h-[15px] space-x-2 items-center font-medium mb-0.5">
                <div className="w-[15px] h-[10px] rounded-r-full relative overflow-hidden -ml-3" style={{ backgroundColor: item.color }}>
                  <div className="h-full rounded-r-full" style={{ backgroundColor: item.color, width: `${barWidth}%` }}></div>
                </div>
                <div className="text-xs flex-1 text-left text-nowrap">{item.seriesName}</div>
                <div className="text-right numbers-xs">
                  {prefix}{Intl.NumberFormat('en-US', { notation: 'standard', maximumFractionDigits: chartKey === "tps" ? 2 : 0 }).format(item.value)}
                </div>
              </div>
              <div className="flex ml-3 w-[calc(100% - 1rem)] relative mb-1 mt-1">
                <div className="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
                <div className="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50"
                  style={{ width: `${(Math.max(0, item.value) / maxPoint) * 100}%`, backgroundColor: `${item.color}99` }}></div>
              </div>

            </>
          );
        })}

        {/* Only show this list for the l2 count chart */}
        {chartKey != "l2Count" && (
          <div className="flex w-full h-[15px] space-x-2 items-center font-medium mt-2 pl-3">
            <div className="text-xs flex-1 text-left text-nowrap">Total</div>
            <div className="text-right numbers-xs">
              {prefix}{Intl.NumberFormat('en-US', { notation: 'standard', maximumFractionDigits: chartKey === "tps" ? 2 : 0 }).format(sortedData.reduce((sum, item) => sum + item.value, 0))}
            </div>
          </div>
        )}

        {/* {showL2List && ( */}
        <div className={`pl-3 transition-all duration-50 ${showL2List ? 'max-h-[120px]' : 'max-h-0 overflow-y-hidden'}`}>
          <div className="heading-small-xxs mt-3">Launched this Month</div>
          <div className="flex flex-wrap items-center gap-x-[5px] gap-y-[5px] h-fit mt-2 mb-1">
            {layer2Data && typeof layer2Data === 'object' && (layer2Data as any[]).length > 0 && (layer2Data as any[]).map((l2Item: any, index: number) => {
              const chainInfo = AllChainsByKeys[l2Item.origin_key];
              const chainIcon = chainInfo ? `${chainInfo.urlKey}-logo-monochrome` : "chain-dark";
              const chainColor = chainInfo?.colors.dark[0] || UNLISTED_CHAIN_COLORS[index % UNLISTED_CHAIN_COLORS.length];

              return (
                <div key={index} className="flex items-center bg-[#344240] text-[10px] rounded-full pl-[3px] pr-[6px] py-[3px] gap-x-[4px] max-w-full">
                  <div className="flex items-center justify-center w-[12px] h-[12px]">
                    <GTPIcon
                      icon={chainIcon as any}
                      style={{ color: chainColor }}
                      size="sm"
                      className="w-[10px] h-[10px]"
                    />
                  </div>
                  <div className="text-[#CDD8D3] leading-[120%] text-[10px] truncate">
                    {l2Item.l2beat_name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* )} */}
      </div>
    );
  }, [dataSource, containerWidth, chartKey, prefix, AllChainsByKeys]);



  // Memoized ECharts option configuration
  const option = useMemo(() => {
    const series = seriesConfigs.map((config, index) => {
      const colors = AllChainsByKeys[config.key]?.colors.dark ?? AllChainsByKeys["all_l2s"]?.colors.dark;

      const baseConfig: any = {
        name: config.name,
        type: config.type === 'column' ? 'bar' : 'line',
        data: seriesData[index] || [],
        stack: config.stacking,
        smooth: true,
        symbol: 'circle',
        symbolSize: 12,
        lineStyle: { width: 2 },
        itemStyle: {
          color: config.type === 'column'
            ? new echarts.graphic.LinearGradient(0, 1, 0, 0, [
              { offset: 0, color: colors[1] },
              { offset: 1, color: colors[0] }
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
      grid: { left: 0, right: isMobile ? 10   : 28, top: 20, bottom: 0 },
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
        show: true,
        trigger: 'axis',
        formatter: () => '', // Return empty string to hide tooltip content but keep axisPointer
        backgroundColor: 'transparent',
        borderWidth: 0,
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: COLORS.PLOT_LINE,
            width: 1,
            type: 'solid'
          }
        }
      }
    };
  }, [seriesConfigs, seriesData, categories, AllChainsByKeys, chartContainerWidth, formatNumberCallback]);



  return (
    <div ref={mainContainerRef} className='group/chart flex flex-col relative rounded-[15px] w-full h-[375px] bg-[#1F2726] pt-[15px]'>
      {/* Header */}
      <div className={`flex h-[56px] pl-[34px] ${isMobile ? "pr-[2px]" : "pr-[20px]"} items-start w-full`}>
        <div className='flex gap-x-[10px] items-center z-[10] flex-1'>
          <div className='heading-large-sm md:heading-large-md'>{title}</div>
          <GTPTooltipNew
            placement="top-start"
            trigger={
              <div>
                <GTPIcon icon="gtp-info-monochrome" size='sm' className='pointer-events-auto' />
              </div>
            }
            containerClass="flex flex-col gap-y-[10px]"
            positionOffset={{ mainAxis: 0, crossAxis: 0 }}
            size='md'
          >
            <TooltipBody>
              <div className="pl-[20px]">{tooltipContent}</div>
            </TooltipBody>
          </GTPTooltipNew>
        </div>
        <div className='flex flex-col h-full items-end pt-[5px]'>

          <div className={`flex items-center gap-x-[5px]`} style={{ marginRight: allChartCoordinates[chartKey]?.x && allChartCoordinates["tps"]?.x ? `${allChartCoordinates["tps"]?.x - allChartCoordinates[chartKey]?.x}px` : "0px" }}>
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
      <div className="absolute bottom-[39.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-20">
        <ChartWatermarkWithMetricName className="w-[128.67px] h-[36px] md:w-[193px] md:h-[58px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten z-30" metricName={title} />
      </div>

      {/* ECharts Chart */}
      <div
        className='w-full absolute bottom-0 left-0 right-0'
        style={{ height: '304px' }}
        ref={chartContainerRef}
        onMouseMove={(e) => {
          const chartInstance = chartRef.current?.getEchartsInstance();
          if (chartInstance && chartContainerRef.current) {
            const rect = chartContainerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const dataPoint = chartInstance.convertFromPixel('grid', [x, y]);

            if (dataPoint && dataPoint[0] >= 0 && dataPoint[0] < categories.length) {
              const categoryIndex = Math.round(dataPoint[0]);
              const tooltipData = seriesConfigs.map((config, seriesIndex) => ({
                seriesName: config.name,
                value: seriesData[seriesIndex]?.[categoryIndex] || 0,
                color: AllChainsByKeys[config.key]?.colors.dark?.[0] || '#CDD8D3',
                categoryIndex,
                categoryLabel: categories[categoryIndex]
              })).filter(item => item.value > 0);

              setCustomTooltip({
                visible: tooltipData.length > 0,
                x: x,
                y: y,
                data: tooltipData
              });
            } else {
              setCustomTooltip(prev => ({ ...prev, visible: false }));
            }
          }
        }}
        onMouseLeave={() => {
          setCustomTooltip(prev => ({ ...prev, visible: false }));
        }}
        onTouchMove={(e) => {
          const chartInstance = chartRef.current?.getEchartsInstance();
          if (chartInstance && chartContainerRef.current) {
            const rect = chartContainerRef.current.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const y = e.touches[0].clientY - rect.top;

            const dataPoint = chartInstance.convertFromPixel('grid', [x, y]);

            if (dataPoint && dataPoint[0] >= 0 && dataPoint[0] < categories.length) {
              const categoryIndex = Math.round(dataPoint[0]);
              const tooltipData = seriesConfigs.map((config, seriesIndex) => ({
                seriesName: config.name,
                value: seriesData[seriesIndex]?.[categoryIndex] || 0,
                color: AllChainsByKeys[config.key]?.colors.dark?.[0] || '#CDD8D3',
                categoryIndex,
                categoryLabel: categories[categoryIndex]
              })).filter(item => item.value > 0);

              setCustomTooltip({
                visible: tooltipData.length > 0,
                x: x,
                y: y,
                data: tooltipData
              });
            } else {
              setCustomTooltip(prev => ({ ...prev, visible: false }));
            }
          }
        }}
      >
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: '100%', width: '100%', borderRadius: '0 0 15px 15px', overflow: 'hidden' }}
          opts={{
            renderer: 'canvas',
            width: chartContainerWidth || undefined,
            height: 304,
          }}
          notMerge={true}
          lazyUpdate={true}
        />

        {/* Custom React Tooltip */}
        {customTooltip.visible && (
          <CustomTooltip
            data={customTooltip.data}
            x={customTooltip.x}
            y={customTooltip.y}
            metricName={title}
          />
        )}
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
      <XAxisLabels xMin={xAxisExtremes.xMin} xMax={xAxisExtremes.xMax} rightMargin={allChartCoordinates[chartKey]?.x && allChartCoordinates["tps"]?.x ? `${allChartCoordinates["tps"]?.x + 1 - allChartCoordinates[chartKey]?.x}px` : "0px"} isMobile={isMobile} />
    </div>
  );
}