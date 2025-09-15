"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  memo,
} from "react";
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useLocalStorage } from "usehooks-ts";
import { useMaster } from "@/contexts/MasterContext";
import { format as d3Format } from "d3";
import { useTimespan } from "../_contexts/TimespanContext";
import { useChartScale } from "../_contexts/ChartScaleContext";
import { useMetrics } from "../_contexts/MetricsContext";
import { useApplicationDetailsData } from "../_contexts/ApplicationDetailsDataContext";
import moment from "moment";
import { useChartSync } from "../_contexts/GTPChartSyncContext";
import { throttle } from "lodash";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

type SeriesData = {
  name: string;
  data: number[][]; // [timestamp, value]
}

export const ApplicationDetailsChart = memo(({
  seriesData,
  seriesTypes,
  metric,
  prefix,
  suffix,
  decimals
}: {
  seriesData: SeriesData[],
  seriesTypes: string[],
  metric: string,
  prefix: string,
  suffix: string,
  decimals: number
}) => {
  const { selectedScale, selectedYAxisScale } = useChartScale();
  const { data } = useApplicationDetailsData();
  const { metricsDef } = useMetrics();
  const [showUsd] = useLocalStorage("showUsd", true);
  const [showGwei] = useLocalStorage("showGwei", false);
  const { selectedTimespan, timespans } = useTimespan();
  const { hoveredSeriesName, selectedSeriesName, registerChart, unregisterChart } = useChartSync();

  const chartRef = useRef<ReactECharts>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom tooltip state
  const [customTooltip, setCustomTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: any[];
  }>({ visible: false, x: 0, y: 0, data: [] });

  // State for syncing across charts
  const [syncTooltipData, setSyncTooltipData] = useState<{
    visible: boolean;
    categoryIndex: number;
    data: any[];
    x: number;
    y: number;
  }>({ visible: false, categoryIndex: -1, data: [], x: 0, y: 0 });

  // Register chart when it's created
  const handleChartCreated = useCallback(() => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (chartInstance) {
      // Create a mock Highcharts-like chart object for compatibility
      const mockChart = {
        container: containerRef.current,
        series: seriesData.map((series, index) => ({
          name: series.name,
          visible: !selectedSeriesName || series.name === selectedSeriesName,
          update: (options: any, redraw: boolean = true) => {
            // Handle series updates through ECharts
            const chartOption = chartInstance.getOption();
            if (chartOption.series && chartOption.series[index]) {
              chartOption.series[index] = { ...chartOption.series[index], ...options };
              if (redraw) {
                chartInstance.setOption(chartOption);
              }
            }
          }
        })),
        redraw: (animation?: boolean) => {
          // ECharts equivalent of redraw
          chartInstance.resize();
        }
      };
      registerChart(mockChart as any);
    }
  }, [registerChart, seriesData, selectedSeriesName]);

  // Unregister chart on unmount
  useEffect(() => {
    return () => {
      unregisterChart();
    };
  }, [unregisterChart]);

  const { minUnix, maxUnix } = useMemo(() => {
    if (!seriesData.length) return { minUnix: 0, maxUnix: Date.now() };
    return {
      minUnix: Math.min(...seriesData.map((series) => series.data[0]?.[0] || Date.now())),
      maxUnix: Math.max(...seriesData.map((series) => series.data[series.data.length - 1]?.[0] || Date.now()))
    };
  }, [seriesData]);

  // Calculate the visible range based on selectedTimespan
  const visibleRange = useMemo(() => {
    const end = maxUnix;
    const start = timespans[selectedTimespan].value > 0
      ? end - (timespans[selectedTimespan].value * 24 * 3600 * 1000)
      : minUnix;
    return { start, end };
  }, [maxUnix, minUnix, selectedTimespan, timespans]);

  const formatNumber = useCallback((value: number | string, options: {
    isAxis: boolean;
    selectedScale: string;
  }) => {
    const { isAxis, selectedScale } = options;
    let val = parseFloat(value as string);
    const metricDef = metricsDef[metric];
    const units = metricDef.units;
    const unitKeys = Object.keys(units);
    const unitKey =
      unitKeys.find((unit) => unit !== "usd" && unit !== "eth") ||
      (showUsd ? "usd" : "eth");

    let prefixLocal = metricDef.units[unitKey].prefix || "";
    let suffixLocal = metricDef.units[unitKey].suffix || "";

    if (!showUsd && seriesTypes.includes("eth") && selectedScale !== "percentage") {
      if (showGwei) {
        prefixLocal = "";
        suffixLocal = " Gwei";
      }
    }

    let number = d3Format(`.2~s`)(val).replace(/G/, "B");
    let absVal = Math.abs(val);

    if (isAxis) {
      if (selectedScale === "percentage") {
        number = d3Format(".2~s")(val).replace(/G/, "B") + "%";
      } else {
        if (prefixLocal || suffixLocal) {
          if (absVal === 0) number = "0";
          else if (absVal < 1) number = val.toFixed(2);
          else if (absVal < 10)
            number = units[unitKey].currency ? val.toFixed(2) : d3Format(`~.3s`)(val).replace(/G/, "B");
          else if (absVal < 100)
            number = units[unitKey].currency ? d3Format(`s`)(val).replace(/G/, "B") : d3Format(`~.4s`)(val).replace(/G/, "B");
          else
            number = units[unitKey].currency ? d3Format(`s`)(val).replace(/G/, "B") : d3Format(`~.2s`)(val).replace(/G/, "B");
        } else {
          if (absVal === 0) number = "0";
          else if (absVal < 1) number = val.toFixed(2);
          else if (absVal < 10) number = d3Format(`.2s`)(val).replace(/G/, "B");
          else number = d3Format(`s`)(val).replace(/G/, "B");
        }
        number = `${prefixLocal}${number} ${suffixLocal}`.replace(`${prefixLocal}-`, `\u2212${prefixLocal}`);
      }
    }

    return number;
  }, [metricsDef, metric, showUsd, seriesTypes, showGwei]);

  const { data: master, AllChainsByKeys } = useMaster();

  const getSeriesType = useCallback((name: string) => {
    if (selectedScale === "percentage") return "line";
    if (selectedScale === "stacked") return "line";
    return "line";
  }, [selectedScale]);

  // Convert data to ECharts format
  const { categories, echartsSeriesData } = useMemo(() => {
    if (!seriesData.length) return { categories: [], echartsSeriesData: [] };

    // Extract all unique timestamps and filter by visible range
    const timestampSet = new Set<number>();
    seriesData.forEach(series => {
      series.data.forEach(([timestamp]) => {
        if (timestamp >= visibleRange.start && timestamp <= visibleRange.end) {
          timestampSet.add(timestamp);
        }
      });
    });

    const sortedTimestamps = Array.from(timestampSet).sort((a, b) => a - b);
    const categories = sortedTimestamps.map(timestamp => new Date(timestamp).toISOString().split('T')[0]);

    // Align data for each series within visible range
    const echartsSeriesData = seriesData.map(series => {
      const timestampToValue = new Map(series.data.map(data => [data[0], data[1]]));
      return sortedTimestamps.map(timestamp => timestampToValue.get(timestamp) || null);
    });

    return { categories, echartsSeriesData };
  }, [seriesData, visibleRange]);

  // Handle chart sync hover
  const handleChartHover = useCallback((categoryIndex: number, show: boolean, x?: number, y?: number) => {
    if (show && categoryIndex >= 0 && categoryIndex < categories.length) {
        const tooltipData = seriesData.map((series, seriesIndex) => ({
            seriesName: series.name,
            value: echartsSeriesData[seriesIndex]?.[categoryIndex] || 0,
            color: AllChainsByKeys[series.name]?.colors.dark?.[0] || '#CDD8D3',
            categoryIndex,
            categoryLabel: categories[categoryIndex]
        })).filter(item => item.value > 0);

        // Use the smooth coordinates from the event directly.
        const tooltipX = x !== undefined ? x : 0;
        const tooltipY = y !== undefined ? y : 0;

        setSyncTooltipData({
            visible: true,
            categoryIndex,
            data: tooltipData,
            x: tooltipX,
            y: tooltipY
        });
    } else {
        setSyncTooltipData({ visible: false, categoryIndex: -1, data: [], x: 0, y: 0 });
    }
  }, [categories, seriesData, echartsSeriesData, AllChainsByKeys]);

  // Listen for external sync events
  useEffect(() => {
    const handleExternalSync = (event: CustomEvent) => {
      const { categoryIndex, show, x, y } = event.detail;
      handleChartHover(categoryIndex, show, x, y);
    };

    window.addEventListener('chart-sync-hover', handleExternalSync as EventListener);
    return () => {
      window.removeEventListener('chart-sync-hover', handleExternalSync as EventListener);
    };
  }, [handleChartHover]);

  // Create a throttled event dispatcher
  const throttledDispatch = useMemo(() =>
    throttle((detail: any) => {
      const syncEvent = new CustomEvent('chart-sync-hover', { detail });
      window.dispatchEvent(syncEvent);
    }, 16), // Throttle to ~60fps
    []
  );

  // Enhanced mouse event handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (chartInstance && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dataPoint = chartInstance.convertFromPixel('grid', [x, y]);

      if (dataPoint && dataPoint[0] >= 0 && dataPoint[0] < categories.length) {
        const categoryIndex = Math.round(dataPoint[0]);

        // Update local tooltip
        const tooltipData = seriesData.map((series, seriesIndex) => ({
          seriesName: series.name,
          value: echartsSeriesData[seriesIndex]?.[categoryIndex] || 0,
          color: AllChainsByKeys[series.name]?.colors.dark?.[0] || '#CDD8D3',
          categoryIndex,
          categoryLabel: categories[categoryIndex]
        })).filter(item => item.value > 0);

        setCustomTooltip({
          visible: tooltipData.length > 0,
          x: x,
          y: y,
          data: tooltipData
        });

        // Dispatch throttled sync event to other charts with smooth coordinates
        throttledDispatch({ categoryIndex, show: true, x, y });
      } else {
        setCustomTooltip(prev => ({ ...prev, visible: false }));

        // Dispatch hide event
        throttledDispatch({ categoryIndex: -1, show: false });
      }
    }
  }, [categories, seriesData, echartsSeriesData, AllChainsByKeys, throttledDispatch]);

  const handleMouseLeave = useCallback(() => {
    setCustomTooltip(prev => ({ ...prev, visible: false }));
    setSyncTooltipData({ visible: false, categoryIndex: -1, data: [], x: 0, y: 0 });

    // Dispatch hide event to all charts immediately
    const syncEvent = new CustomEvent('chart-sync-hover', {
      detail: { categoryIndex: -1, show: false }
    });
    window.dispatchEvent(syncEvent);
  }, []);

  // Custom Tooltip Component with smart positioning
  const CustomTooltip = useCallback(({ data, x, y }: { data: any[], x: number, y: number }) => {
    if (!data.length) return null;

    const dateStr = moment.utc(data[0].categoryLabel).format("DD MMM YYYY");
    const maxPoint = Math.max(...data.map(point => point.value));

    // Sort by value (highest first)
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    // Smart positioning to prevent going off screen
    const tooltipWidth = 256; // min-w-52 = 208px, md:min-w-60 = 240px
    const tooltipHeight = 120 + (sortedData.length * 40); // Estimate height
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = 168;
    const margin = 10;

    let tooltipX = x + 10;
    let tooltipY = y - 10;

    // Horizontal positioning
    if (tooltipX + tooltipWidth > containerWidth - margin) {
      tooltipX = x - tooltipWidth - 10;
    }
    if (tooltipX < margin) {
      tooltipX = margin;
    }

    // Vertical positioning
    if (tooltipY + tooltipHeight > containerHeight - margin) {
      tooltipY = containerHeight - tooltipHeight - margin;
    }
    if (tooltipY < margin) {
      tooltipY = margin;
    }

    return (
      <div
        className="absolute pointer-events-none z-[999] bg-[#2A3433EE] rounded-[15px] p-3 min-w-52 md:min-w-72 text-xs font-raleway shadow-lg"
        style={{
          left: 0,
          top: 0,
          transform: `translate(${tooltipX}px, ${tooltipY}px)`,
          transition: 'transform 0.1s ease-out', // This is the magic part!
        }}
      >
        <div className="flex justify-between items-center font-bold text-[13px] md:text-[1rem] ml-6 mb-2">
          <div>{dateStr}</div>
          <div className="text-xs">{metricsDef[metric].name}</div>
        </div>

        {sortedData.map((item, index) => (
          <div key={index}>
            <div className="flex w-full space-x-2 items-center font-medium mb-0.5">
              <div className="w-4 h-1.5 rounded-r-full" style={{ backgroundColor: item.color }}></div>
              <div className="tooltip-point-name text-xs">{AllChainsByKeys[item.seriesName]?.label || item.seriesName}</div>
              <div className="flex-1 text-right justify-end numbers-xs flex">
                <div className={!prefix ? "hidden" : ""}>{prefix}</div>
                {item.value.toLocaleString("en-GB", {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                })}
                <div className={`ml-0.5 ${!suffix && "hidden"}`}>{suffix}</div>
              </div>
            </div>
            <div className="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
              <div className="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
              <div
                className="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50"
                style={{
                  width: `${(Math.max(0, item.value) / maxPoint) * 100}%`,
                  backgroundColor: `${item.color}99`
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  }, [metricsDef, metric, AllChainsByKeys, prefix, suffix, decimals]);

  // ECharts option configuration
  const option = useMemo(() => {
    const series = seriesData.map((seriesConfig, index) => {
      const colors = AllChainsByKeys[seriesConfig.name]?.colors.dark || ["#CDD8D3", "#CDD8D3"];
      const isVisible = !selectedSeriesName || seriesConfig.name === selectedSeriesName;
      const opacity = hoveredSeriesName && hoveredSeriesName !== seriesConfig.name ? 0.3 : 1;

      const baseConfig: any = {
        name: seriesConfig.name,
        type: getSeriesType(seriesConfig.name) === 'line' ? 'line' : 'bar',
        data: echartsSeriesData[index] || [],
        stack: selectedScale === 'stacked' ? 'total' : undefined,
        symbol: 'circle',
        symbolSize: 1,
        lineStyle: { width: 2 },
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: colors[0] + "CC" },
            { offset: 1, color: colors[1] + "CC" }
          ]),
          opacity: opacity
        },
        emphasis: {
          symbolSize: 12,
          symbol: 'circle',
          itemStyle: {
            color: colors[0] + "80", // Series color with 50% opacity
            borderWidth: 0,
            shadowBlur: 0,
          }
        }
      };

      if (getSeriesType(seriesConfig.name) !== 'line') {
        baseConfig.areaStyle = {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors[0] + "33" },
            { offset: 1, color: colors[1] + "33" }
          ]),
          opacity: opacity
        };
      }

      return baseConfig;
    });

    return {
      animation: false,
      backgroundColor: 'transparent',
      grid: {
        left: 40,
        right: 5,
        top: 5,
        bottom: 30,
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: categories || [],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          show: true,
          color: '#CDD8D3',
          fontSize: 10,
          fontFamily: 'var(--font-fira-sans), sans-serif !important;',
          margin: 15,
          formatter: (value: string) => {
            const date = new Date(value);
            const range = maxUnix - minUnix;
            const dayInMs = 24 * 60 * 60 * 1000;

            if (range <= 40 * dayInMs) {
              return date.toLocaleDateString("en-GB", {
                timeZone: "UTC",
                month: "short",
                day: "numeric",
              });
            } else {
              if (date.getUTCMonth() === 0 && date.getUTCDate() === 1) {
                return date.getFullYear().toString();
              }
              return date.toLocaleDateString("en-GB", {
                timeZone: "UTC",
                month: "short",
                year: "numeric",
              });
            }
          }
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: selectedYAxisScale === "logarithmic" && selectedScale === "absolute" ? 'log' : 'value',
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#5A6462A7',
            width: 1
          }
        },
        axisLabel: {
          show: true,
          color: '#CDD8D3',
          fontSize: 10,
          fontWeight: 700,
          fontFamily: 'var(--font-fira-sans), sans-serif !important;',
          margin: 9,
          formatter: (value: number) => {
            return formatNumber(value, {
              isAxis: true,
              selectedScale: selectedScale,
            });
          }
        }
      },
      series,
      tooltip: {
        show: true,
        trigger: 'axis',
        formatter: () => '', // Return empty string to hide tooltip content
        backgroundColor: 'transparent',
        borderWidth: 0,
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: COLORS.PLOT_LINE,
            width: 0.5,
            type: 'solid'
          }
        }
      }
    };
  }, [seriesData, echartsSeriesData, categories, AllChainsByKeys, selectedSeriesName, hoveredSeriesName, selectedScale, selectedYAxisScale, getSeriesType, formatNumber, maxUnix, minUnix]);

  // Register chart when option changes (chart is ready)
  useEffect(() => {
    if (chartRef.current?.getEchartsInstance()) {
      handleChartCreated();
    }
  }, [option, handleChartCreated]);

  // Update chart option when sync state changes
  useEffect(() => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (chartInstance) {
      if (syncTooltipData.visible) {
        // Show crosshair at the correct data point index
        chartInstance.dispatchAction({
          type: 'showTip',
          seriesIndex: 0,
          dataIndex: syncTooltipData.categoryIndex
        });
      } else {
        // Hide crosshair when not hovering
        chartInstance.dispatchAction({
          type: 'hideTip'
        });
      }
    }
  }, [syncTooltipData]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[168px] relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{
          renderer: 'canvas',
          height: 168,
          devicePixelRatio: window.devicePixelRatio || 1,
        }}
        notMerge={true}
        lazyUpdate={false}
      />

      {/* Custom React Tooltip for local hover */}
      {customTooltip.visible && (
        <CustomTooltip
          data={customTooltip.data}
          x={customTooltip.x}
          y={customTooltip.y}
        />
      )}

      {/* Synced tooltip from other charts */}
      {syncTooltipData.visible && !customTooltip.visible && (
        <CustomTooltip
          data={syncTooltipData.data}
          x={syncTooltipData.x}
          y={syncTooltipData.y}
        />
      )}
    </div>
  );
});

ApplicationDetailsChart.displayName = "ApplicationDetailsChart";