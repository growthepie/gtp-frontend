import React, { useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';
import { throttle } from 'lodash'; // Make sure lodash is installed: npm install lodash @types/lodash

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


interface TPSChartProps {
  totalTPSLive: number[];
}

export const TPSChart = React.memo(({ totalTPSLive }: TPSChartProps) => {
  const chartRef = React.useRef<ReactECharts>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the container div

  useLayoutEffect(() => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    const container = containerRef.current;

    if (!chartInstance || !container) {
      return;
    }

    // Throttle the resize function to avoid performance issues on rapid changes
    const handleResize = throttle(() => {
      chartInstance.resize();
    }, 150, { leading: true, trailing: true });

    // Initial resize
    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      handleResize.cancel();
      resizeObserver.disconnect();
    };
  }, []);

  const option = useMemo<EChartsOption>(() => {
    const dataCount = totalTPSLive.length;
    const startIndex = Math.max(0, dataCount - 40);

    const maxValue = Math.max(...totalTPSLive);
    const yAxisMax = Math.ceil(maxValue / 100) * 100; // Round up to the nearest 100

    return {
      backgroundColor: 'transparent',
      grid: {
        left: 37,
        right: 0,
        top: 5,
        bottom: 5,
        containLabel: false, 
      },
      xAxis: {
        type: 'category',
        show: false,
      },
      yAxis: {
        type: 'value',
        
        minorSplitLine: {
          show: false,
        },
        // splitNumber: 1,
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
        splitLine: {
          show: true,
          lineStyle: {
            color: '#5A6462',
            type: 'solid',
          },
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        min: 0,
        max: yAxisMax, // Round up to the nearest 100
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
        padding: 0,
        textStyle: { color: 'rgb(215, 223, 222)' },
        formatter: (params) => {
          if (!Array.isArray(params) || params.length === 0) {
            return '';
          }
          
          const point = params[0];
          if (!point || typeof point.data !== 'number') {
            return '';
          }
          const series = point.seriesName;
          const value = point.data as number;
          const gradient = (point.color as any);
          const barColor = gradient?.colorStops?.[1]?.color ?? gradient;
          
          const valueSuffix = "TPS";
          
          const formattedValue = new Intl.NumberFormat("en-GB", {
            notation: "standard",
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          }).format(value);
          
          return `
            <div class="p-3 pl-0 text-xs font-raleway">
              <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${barColor}"></div>
                <div class="tooltip-point-name text-xs">${series}</div>
                <div class="flex-1 text-right justify-end flex numbers-xs">
                  <div class="flex justify-end text-right w-full">
                    ${formattedValue}
                    <div class="pl-1">${valueSuffix}</div>
                  </div>
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
          data: totalTPSLive,
          animation: false,
          barCategoryGap: '3px',
          itemStyle: {
            borderRadius: 0,
            color: {
              type: 'linear',
              x: 0, y: 1, x2: 0, y2: 0,
              colorStops: [
                { offset: 0, color: '#10808C' },
                { offset: 1, color: '#1DF7EF' }
              ],
            },
            shadowBlur: 5,
            shadowColor: 'rgba(205, 216, 211, 0.05)',
            shadowOffsetX: 0,
            shadowOffsetY: 0,
          },
        },
      ],
      animationDuration: 50,
    };
  }, [totalTPSLive, containerRef.current]);

  return (
    <div ref={containerRef} className="w-full h-[58px] -mt-[5px]">
      <ReactECharts
        ref={chartRef}
        option={option}
        notMerge={false}
        lazyUpdate={true}
        style={{ height: '100%' }}
      />
    </div>
  );
});

TPSChart.displayName = "TPSChart";