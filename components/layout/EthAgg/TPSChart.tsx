import React, { useLayoutEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';
import { throttle } from 'lodash';

// It's good practice to define the shape of your data
type HistoryItem = {
  tps: number;
  timestamp: string;
};

interface TPSChartProps {
  // The prop is updated to accept an array of HistoryItem objects
  overrideColor?: string[];
  data: HistoryItem[];
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

export const TPSChart = React.memo(({ data, overrideColor }: TPSChartProps) => {
  const chartRef = React.useRef<ReactECharts>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

    const maxValue = Math.max(...tpsValues);
    const yAxisMax = Math.ceil(maxValue / 100) * 100;

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
          color: 'rgb(215, 223, 222)',
          fontSize: 10,
          fontWeight: 700,
          fontFamily: 'var(--font-raleway), var(--font-fira-sans), sans-serif',
          align: 'right',
          margin: 10,
          formatter: (value) => [0, yAxisMax].includes(value) ? formatNumberWithSI(value) : '',
        },
        splitLine: { show: true, lineStyle: { color: '#5A6462', type: 'solid' } },
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
        backgroundColor: '#2A3433EE',
        borderRadius: 15,
        borderWidth: 0,
        padding: [15, 15, 15, 0], // Adjusted padding
        textStyle: { color: 'rgb(215, 223, 222)' },
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

          // Format the date for display in the tooltip
          const formattedDate = new Intl.DateTimeFormat("en-GB", {
            // month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false,
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
                <div class="tooltip-point-name text-xs">Ethereum Ecosystem</div>
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
                { offset: 0, color: overrideColor?.[0] ?? '#10808C' },
                { offset: 1, color: overrideColor?.[1] ?? '#1DF7EF' }
              ],
            },
          },
        },
      ],
      animationDuration: 50,
    };
  }, [data]); // The hook now depends on the `data` prop

  return (
    <div ref={containerRef} className="w-full h-[58px] -mt-[5px]">
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
    </div>
  );
});

TPSChart.displayName = "TPSChart";