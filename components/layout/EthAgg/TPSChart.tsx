import React, { useLayoutEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';
import { throttle } from 'lodash';
import ChartWatermark, { ChartWatermarkWithMetricName } from '../ChartWatermark';
import { useTheme } from 'next-themes';
// It's good practice to define the shape of your data
type HistoryItem = {
  tps: number;
  timestamp: string;
};

interface TPSChartProps {
  // The prop is updated to accept an array of HistoryItem objects
  overrideColor?: string[];
  data: HistoryItem[];
  chainName?: string;
  centerWatermark?: boolean;
}

// Your existing formatNumberWithSI function...
function formatNumberWithSI(num: number): string {
  if (num === 0) {
    return "0";
  }
  const sign = num < 0 ? "-" : "";
  const absNum = Math.abs(num);
  const tiers = [
    { value: 1e12, symbol: "T" },
    { value: 1e9,  symbol: "B" },
    { value: 1e6,  symbol: "M" },
    { value: 1e3,  symbol: "k" },
  ];
  const tier = tiers.find(t => absNum >= t.value);
  if (!tier) {
    return sign + Math.round(absNum).toString();
  }
  const scaledValue = absNum / tier.value;
  let formattedValue: string;
  if (scaledValue < 10) {
    formattedValue = scaledValue.toFixed(1);
  } else {
    formattedValue = Math.round(scaledValue).toString();
  }
  if (formattedValue.endsWith(".0")) {
    formattedValue = formattedValue.slice(0, -2);
  }
  return sign + formattedValue + tier.symbol;
}

// Helper to get resolved CSS variable as rgb() color (Canvas-compatible format)
const getCssVarAsRgb = (name: string): string => {
  if (typeof window === 'undefined') return 'rgb(0, 0, 0)';
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  // Convert space-separated "14 111 122" to comma-separated "rgb(14, 111, 122)"
  const parts = value.split(' ').filter(Boolean);
  return `rgb(${parts.join(', ')})`; 
};

export const TPSChart = React.memo(({ data, overrideColor, chainName, centerWatermark}: TPSChartProps) => {
  const chartRef = React.useRef<ReactECharts>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // This layout effect for resizing is correct and does not need changes.
  useLayoutEffect(() => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    const container = containerRef.current;
    if (!chartInstance || !container) return;

    const handleResize = throttle(() => chartInstance.resize(), 150);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    handleResize(); // Initial resize

    return () => {
      handleResize.cancel();
      resizeObserver.disconnect();
    };
  }, []);

  const option = useMemo<EChartsOption>(() => {
    // Extract TPS values and timestamps from the data prop
    const tpsValues = data.map(item => item.tps);
    const timestamps = data.map(item => item.timestamp);
    const dataCount = tpsValues.length;
    const startIndex = Math.max(0, dataCount - 40);

    const windowed = tpsValues.slice(startIndex);
    const maxInWindow = windowed.length ? Math.max(...windowed) : 0;
    const yAxisMax = Math.ceil(maxInWindow / 5) * 5;

    // const maxValue = Math.max(...tpsValues);
    // const yAxisMax = Math.ceil(maxValue / 5) * 5;


    return {
      backgroundColor: 'transparent',
      grid: { left: 37, right: 0, top: 5, bottom: 5, containLabel: false },
      xAxis: {
        type: 'category',
        show: false,
        // Provide timestamps to the x-axis for the tooltip to use
        data: timestamps,
      },
      yAxis: {
        type: 'value',
        interval: yAxisMax,
        axisLabel: {
          color: theme !== 'dark' ? 'rgb(31 39 38)' : 'rgb(205 216 211)',
          fontSize: 10,
          fontWeight: 700,
          fontFamily: 'var(--font-raleway), var(--font-fira-sans), sans-serif',
          align: 'right',
          margin: 10,
          formatter: (value) => [0, yAxisMax].includes(value) ? formatNumberWithSI(value) : '',
        },
        splitLine: { show: true, lineStyle: { color: '#5A64624F', type: 'solid' } },
        axisLine: { show: false },
        axisTick: { show: false },
        min: 0,
        max: yAxisMax,
      },
      tooltip: {
        trigger: 'axis',
        renderMode: 'html',
        appendToBody: true,
        confine: false,
        axisPointer: { type: 'line', lineStyle: { color: 'rgb(215, 223, 222)', width: 1, type: 'solid' } },
        backgroundColor: getCssVarAsRgb('--bg-default'),
        shadowColor: getCssVarAsRgb('--ui-shadow'),
        shadowBlur: 27,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        borderRadius: 15,
        borderWidth: 0,
        padding: [15, 15, 15, 0], // Adjusted padding
        textStyle: { color: getCssVarAsRgb('--text-primary') },
        // Updated formatter to include the timestamp
        formatter: (params) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          
          const point = params[0];
          if (!point || typeof point.data !== 'number') return '';
          
          const value = point.data as number;
          const timestamp = point.axisValue as string; // Get timestamp from x-axis
          const gradient = (point.color as any);
          const barColor = gradient?.colorStops?.[1]?.color ?? gradient;

          const formattedValue = new Intl.NumberFormat("en-GB", {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
          }).format(value);
         

          // Format the date for display in the tooltip (must be UTC to match the label)
          const formattedDate = new Intl.DateTimeFormat("en-GB", {
            // month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false,
            timeZone: "UTC",
          }).format(new Date(timestamp));

          return `
            <div class="text-xs font-raleway flex flex-col gap-y-[5px] w-[200px]">
            <div class="flex w-full gap-x-[5px] items-center font-medium">
              <div class="heading-small-xs !pl-[20px] !text-left">
                ${formattedDate.replace(',', '  ')} UTC
              </div>
              <div class="flex-1 text-right justify-end flex text-xs">
                TPS
              </div>
            </div>
              <div class="flex w-full gap-x-[5px] items-center font-medium">
                <div class="w-[15px] h-[10px] rounded-r-full" style="background-color: ${barColor}"></div>
                <div class="tooltip-point-name text-xs">${chainName || "Ethereum Ecosystem"}</div>
                <div class="flex-1 text-right justify-end flex numbers-xs">
                  ${formattedValue}
                </div>
              </div>
            </div>`;
        },
      },
      dataZoom: [
        {
          type: 'inside',
          startValue: startIndex,
          endValue: dataCount - 1,
          zoomLock: true,
        },
      ],
      series: [
        {
          id: 'total-tps',
          name: 'Total Ecosystem',
          type: 'bar',
          silent: true,
          // Use the extracted TPS values for the series data
          data: tpsValues,
          animation: false,
          barCategoryGap: '3px',
          itemStyle: {
            borderRadius: 0,
            color: {
              type: 'linear',
              x: 0, y: 1, x2: 0, y2: 0,
              colorStops: [
                { offset: 0, color: overrideColor?.[0] ?? getCssVarAsRgb('--accent-petrol') },
                { offset: 1, color: overrideColor?.[1] ?? getCssVarAsRgb('--accent-turquoise') }
              ],
            },
          },
        },
      ],
      animationDuration: 50,
    };
  }, [data, theme]); // The hook now depends on the `data` prop and theme

  return (
    <div ref={containerRef} className="relative w-full h-[58px] -mt-[5px]">
      <ReactECharts
        ref={chartRef}
        opts={{
          devicePixelRatio: window.devicePixelRatio || 1,
        }}
        option={option}
        notMerge={false}
        lazyUpdate={true}
        style={{ height: '100%' }}
      />
      <div className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-start w-[147px] -space-y-[3.811px] pointer-events-none ${centerWatermark ? 'top-1/2 -translate-y-1/2 z-10' : 'bottom-[-25.353px]'}`}>
        <div className={`w-[147px] ${centerWatermark ? 'opacity-40' : ''}`}>
          {centerWatermark ? (
            <ChartWatermarkWithMetricName className="w-full h-auto" useColor={true} />
          ) : (
            <ChartWatermark className="opacity-20 w-full h-auto" />
          )}
        </div>
      </div>
    </div>
  );
});

TPSChart.displayName = "TPSChart";