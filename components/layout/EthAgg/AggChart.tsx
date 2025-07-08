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


function formatNumberWithSI(num: number): string {
  if (num === 0) {
    return "0";
  }

  const sign = num < 0 ? "-" : "";
  const absNum = Math.abs(num);

  const tiers = [
    { value: 1e12, symbol: "T" }, // Trillions
    { value: 1e9,  symbol: "B" }, // Billions
    { value: 1e6,  symbol: "M" }, // Millions
    { value: 1e3,  symbol: "k" }, // Thousands
  ];

  const tier = tiers.find(t => absNum >= t.value);

  if (!tier) {
    return sign + Math.round(absNum).toString();
  }

  const scaledValue = absNum / tier.value;
  let formattedValue: string;

  if (scaledValue < 10) {
    // For values like 1.23M, show one decimal place (e.g., "1.2")
    formattedValue = scaledValue.toFixed(1);
  } else {
    // For values like 12.3M or 123B, round to the nearest integer
    formattedValue = Math.round(scaledValue).toString();
  }

  // 7. A final cleanup to remove ".0" if toFixed() created it (e.g., 9.95 -> "10.0")
  if (formattedValue.endsWith(".0")) {
    formattedValue = formattedValue.slice(0, -2);
  }

  // 8. Combine the sign, formatted value, and SI symbol
  return sign + formattedValue + tier.symbol;
}

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

  // Track if user is interacting (touching/moving) on mobile
  const [isInteracting, setIsInteracting] = useState(false);

  // Hide tooltip after a delay on mobile, but only if not interacting
  useEffect(() => {
    if (!isMobile || !customTooltip.visible || isInteracting) return;
    const timeout = setTimeout(() => {
      setCustomTooltip(prev => ({ ...prev, visible: false }));
    }, 2500); // 2.5 seconds
    return () => clearTimeout(timeout);
  }, [isMobile, customTooltip.visible, isInteracting]);

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


  const [lastDataPointPixelCoords, setLastDataPointPixelCoords] = useState<[number, number, number] | null>(null);
  
  useEffect(() => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    const circleElement = circleRef.current;

    if (
      isDebouncing ||
      !chartInstance ||
      !circleElement ||
      !seriesData || seriesData.length === 0 ||
      !categories || categories.length === 0
    ) {
      setLastDataPointPixelCoords(null);
      return;
    }
    
    const timer = setTimeout(() => {
        const lastDataIndex = categories.length - 1;
        let stackedValue = 0;
        seriesData.forEach((series) => {
          const value = series[lastDataIndex];
          if (value != null && value > 0) {
            stackedValue += value;
          }
        });

        if (stackedValue === 0) {
          setLastDataPointPixelCoords(null);
          return;
        }

        const pixelCoords = chartInstance.convertToPixel('grid', [lastDataIndex, stackedValue]);
        if (!pixelCoords) {
            setLastDataPointPixelCoords(null);
            return;
        }

        const circleRect = circleElement.getBoundingClientRect();
        const chartContainer = chartRef.current?.ele;
        if (!chartContainer) {
            setLastDataPointPixelCoords(null);
            return;
        }

        const chartRect = chartContainer.getBoundingClientRect();
        const circleY = circleRect.top + circleRect.height / 2 - chartRect.top;

        // Set the state with the newly calculated coordinates
        setLastDataPointPixelCoords([pixelCoords[0], pixelCoords[1], circleY]);
    }, 50); // A small delay like 50ms is often enough for ECharts to catch up.

    return () => clearTimeout(timer); // Cleanup the timeout

  }, [seriesData, categories, debouncedDimensions, isDebouncing]); // Dependencies remain the same

  // This effect correctly sends updates to the parent component whenever our state changes.
  useEffect(() => {
    let newCoords: { x: number; y: number; circleY: number } | null = null;

    if (lastDataPointPixelCoords && lastDataPointPixelCoords.length === 3) {
      newCoords = {
        x: lastDataPointPixelCoords[0],
        y: lastDataPointPixelCoords[1],
        circleY: lastDataPointPixelCoords[2]
      };
    }

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

  // Custom Tooltip Component
  const CustomTooltip = useCallback(({ data, x, y, metricName }: { data: any[], x: number, y: number, metricName: string }) => {
    if (!data.length) return null;
    const dateStr = moment.utc(data[0].categoryLabel).utc().locale("en-GB").format("DD MMM YYYY");

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
        className={`absolute pointer-events-none z-[999] bg-[#2A3433EE] rounded-[15px] p-3 ${widthClassNames} ${heightClassNames} text-xs font-raleway shadow-lg`}
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
            <div key={index}>
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

            </div>
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
  }, [dataSource, containerWidth, chartKey, prefix, AllChainsByKeys, isMobile]);



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

    const fortyPixelsToPercent = 40 / chartContainerWidth;
    // ensure gradient stop is less than 1 and greater than 0
    const gradientStop = Math.min(Math.max(fortyPixelsToPercent, 0), 1);

    console.log("gradientStop", gradientStop);

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
          lineStyle: { 
            // color: '#5A64624F',
            // top, bottom, left, right
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#5A646200' },
              { offset: gradientStop, color: '#5A64624F' },
              { offset: 1, color: '#5A64624F' }
            ]),
            width: 1
          }
        },
        axisLabel: {
          show: true,
          margin: -1,
          padding: [5, 0, 0, 6],
          color: '#CDD8D3',
          fontSize: isMobile ? 8 : 9,
          fontWeight: 500,
          fontFamily: 'var(--font-fira-sans), sans-serif !important;',
          align: 'left',
          verticalAlign: 'top',
          formatter: (value: number) => {
            return prefix + formatNumberWithSI(value);
          }
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
  }, [seriesConfigs, seriesData, categories, AllChainsByKeys, chartContainerWidth, prefix, showUsd]);



  return (
    <div ref={mainContainerRef} className='group/chart flex flex-col relative rounded-[15px] w-full h-[375px] bg-[#1F2726] pt-[15px]'>
      {/* Header */}
      <div className={`flex h-[56px] pl-[24px] sm:pl-[34px] ${isMobile ? "pr-[2px]" : "pr-[20px]"} items-start w-full`}>
        <div className='flex gap-x-[5px] sm:gap-x-[10px] items-center z-[10] flex-1 sm:pt-0 pt-[5px]'>
          <div className='heading-large-xs sm:heading-large-sm md:heading-large-md'>{title}</div>
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

          <div className={`flex items-center gap-x-[5px] pr-[4px] sm:pr-[4px]`} style={{ marginRight: allChartCoordinates[chartKey]?.x && allChartCoordinates["tps"]?.x ? `${allChartCoordinates["tps"]?.x - allChartCoordinates[chartKey]?.x}px` : "0px" }}>
            <div className='numbers-lg sm:numbers-xl bg-gradient-to-b bg-[#CDD8D3] bg-clip-text text-transparent'>{totalValue}</div>
            <div ref={circleRef} className='w-[9px] h-[9px] sm:w-[9px] sm:h-[9px] rounded-full z-chart bg-[#CDD8D3]' />
          </div>

          {shareValue && (
            <div className='flex items-center gap-x-[5px]'>
              <div className='text-xs sm:text-sm bg-gradient-to-b from-[#FE5468] to-[#FFDF27] bg-clip-text text-transparent'>{shareValue}</div>
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
          setIsInteracting(false);
        }}
        onTouchStart={() => {
          setIsInteracting(true);
        }}
        onTouchMove={(e) => {
          setIsInteracting(true);
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
        onTouchEnd={() => {
          setIsInteracting(false);
        }}
      >
        <ReactECharts
          ref={chartRef}
          option={{...option}}
          style={{ height: '100%', width: '100%', borderRadius: '0 0 15px 15px', overflow: 'hidden' }}
          opts={{
            renderer: 'canvas',
            width: chartContainerWidth || undefined,
            height: 304,
          }}
          notMerge={true}
          lazyUpdate={false}
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
        {lastDataPointPixelCoords && lastDataPointPixelCoords.length === 3 && (
          <svg
            className='absolute top-[-41px] left-0 w-full h-full pointer-events-none z-10'
            // The SVG viewport matches the chart container dimensions
          >
            <line
              x1={lastDataPointPixelCoords[0]} // X position
              y1={lastDataPointPixelCoords[2]} // Start Y (center of the circle in the header)
              x2={lastDataPointPixelCoords[0]} // X position (same for a vertical line)
              y2={lastDataPointPixelCoords[1] + 41} // End Y (the data point on the chart)
              stroke="#CDD8D3" // Line color (kept from your original implementation)
              strokeWidth="1"
              strokeDasharray="2 2" // 2px dash, 2px gap. You can adjust this!
            />
          </svg>
        )}
      </div>

    
      

      {/* Custom X-Axis Timeline */}
      <XAxisLabels xMin={xAxisExtremes.xMin} xMax={xAxisExtremes.xMax} rightMargin={allChartCoordinates[chartKey]?.x && allChartCoordinates["tps"]?.x ? `${allChartCoordinates["tps"]?.x + 1 - allChartCoordinates[chartKey]?.x}px` : "0px"} isMobile={isMobile} />
    </div>

  );
}