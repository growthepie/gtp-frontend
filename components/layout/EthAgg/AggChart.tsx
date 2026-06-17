// components/layout/EthAgg/AggChart.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ChartWatermarkWithMetricName } from '../ChartWatermark';
import { useLocalStorage, useMediaQuery } from 'usehooks-ts';
import { useMaster } from '@/contexts/MasterContext';
import { AggChartProps } from './MetricsCharts';
import { GTPTooltipNew } from '@/components/tooltip/GTPTooltip';
import { GTPTooltipGeneral } from '@/components/GTPComponents/GTPTooltip';
import { GTPIcon } from '../GTPIcon';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import GTPChart, { type GTPChartSeries, type GTPChartTooltipParams } from '@/components/GTPComponents/GTPChart';
import { echarts } from "@/lib/echarts-setup";

export function formatNumberWithSI(num: number): string {
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

const UNLISTED_CHAIN_COLORS = ["#7D8887", "#717D7C", "#667170", "#5A6665", "#4F5B5A", "#43504F", "#384443", "#2C3938"];

// Converts API unix timestamps (seconds or ms) to milliseconds for GTPChart's time axis.
const toMs = (ts: number) => ts > 1e10 ? ts : ts * 1000;

const XAxisLabels = React.memo(({ xMin, xMax, rightMargin, isMobile }: { xMin: number, xMax: number, rightMargin?: string, isMobile: boolean }) => (
  <div className={`absolute bottom-[10px] left-0 right-0 flex w-full justify-between items-center pl-[15px] ${isMobile ? "pr-[3px]" : "pr-[19px]"} opacity-100 transition-opacity duration-[900ms] group-hover/chart:opacity-0 pointer-events-none`}>
    <div className='text-xxs flex gap-x-[2px] items-center bg-color-bg-medium/50 rounded-full px-[5px] py-[2px]'>
      <div className='w-[6px] rounded-full h-[6px] bg-color-text-primary' />
      {new Date(xMin).getFullYear()}
    </div>
    <div className='text-xxs flex gap-x-[2px] items-center bg-color-bg-medium/50 rounded-full px-[5px] py-[2px]'
      style={{ marginRight: rightMargin }}
    >
      {new Date(xMax).getFullYear()}
      <div className='w-[6px] rounded-full h-[6px] bg-color-text-primary' />
    </div>
  </div>
));
XAxisLabels.displayName = 'XAxisLabels';

export function AggChart({
  title,
  tooltipContent,
  prefix,
  urlKey,
  dataSource,
  seriesConfigs,
  totalValueExtractor,
  shareValueExtractor,
  chartKey,
  onCoordinatesUpdate,
  allChartCoordinates,
}: AggChartProps) {
  const { AllChainsByKeys } = useMaster();
  const [showUsd] = useLocalStorage("showUsd", true);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { theme } = useTheme();

  const mainContainerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const prevCoordinatesRef = useRef<{ x: number; y: number; circleY: number } | null>(null);

  // State for the SVG overlay (circle + dashed line at last data point)
  const [lastPointCoords, setLastPointCoords] = useState<{ x: number; y: number; circleY: number } | null>(null);

  // Build GTPChart series from seriesConfigs
  const gtpSeries = useMemo<GTPChartSeries[]>(() => {
    return seriesConfigs.map((config) => {
      const colors = AllChainsByKeys[config.key]?.colors[theme ?? "dark"]
        ?? AllChainsByKeys["all_l2s"]?.colors[theme ?? "dark"];

      const rawData = config.dataExtractor(dataSource, showUsd);
      return {
        name: config.name ?? config.key,
        // Convert timestamps to milliseconds (GTPChart time axis requires ms)
        data: rawData.map(([ts, v]) => [toMs(ts), v] as [number, number]),
        seriesType: config.type === 'column' ? 'bar' : 'area',
        color: colors ? [colors[0], colors[1]] as [string, string] : undefined,
      };
    });
  }, [seriesConfigs, dataSource, showUsd, AllChainsByKeys, theme]);

  const isStacked = useMemo(
    () => seriesConfigs.some(c => c.stacking !== undefined),
    [seriesConfigs],
  );

  const { totalValue, shareValue, xAxisMin, xAxisMax } = useMemo(() => {
    const total = totalValueExtractor(dataSource, showUsd);
    const share = shareValueExtractor?.(dataSource, showUsd);

    let minX = Infinity;
    let maxX = -Infinity;

    seriesConfigs.forEach(config => {
      const dataPoints = config.dataExtractor(dataSource, showUsd);
      if (dataPoints.length > 0) {
        minX = Math.min(minX, toMs(dataPoints[0][0]));
        maxX = Math.max(maxX, toMs(dataPoints[dataPoints.length - 1][0]));
      }
    });

    return {
      totalValue: total,
      shareValue: share,
      xAxisMin: isFinite(minX) ? minX : null,
      xAxisMax: isFinite(maxX) ? maxX : null,
    };
  }, [dataSource, seriesConfigs, showUsd, totalValueExtractor, shareValueExtractor]);

  const xAxisExtremes = useMemo(() => ({
    xMin: xAxisMin ?? 0,
    xMax: xAxisMax ?? 0,
  }), [xAxisMin, xAxisMax]);

  // Callback from GTPChart: provides pixel coords of the last visible data point
  const handleLastDataPointCoords = useCallback((coords: { pixelX: number; pixelY: number } | null) => {
    if (!coords) {
      const prev = prevCoordinatesRef.current;
      if (prev !== null) {
        prevCoordinatesRef.current = null;
        setLastPointCoords(null);
        onCoordinatesUpdate(chartKey, null);
      }
      return;
    }

    const circleElement = circleRef.current;
    const chartContainer = chartAreaRef.current;
    if (!circleElement || !chartContainer) {
      setLastPointCoords(null);
      onCoordinatesUpdate(chartKey, null);
      return;
    }

    const circleRect = circleElement.getBoundingClientRect();
    const chartRect = chartContainer.getBoundingClientRect();
    const circleY = circleRect.top + circleRect.height / 2 - chartRect.top;

    const newCoords = { x: coords.pixelX, y: coords.pixelY, circleY };

    // Only update state and notify parent when coordinates actually changed
    const prev = prevCoordinatesRef.current;
    if (
      !prev ||
      prev.x !== newCoords.x ||
      prev.y !== newCoords.y ||
      prev.circleY !== newCoords.circleY
    ) {
      prevCoordinatesRef.current = newCoords;
      setLastPointCoords(newCoords);
      onCoordinatesUpdate(chartKey, newCoords);
    }
  }, [chartKey, onCoordinatesUpdate]);

  // Map series name → solid primary color for tooltip markers
  const seriesColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    gtpSeries.forEach(s => {
      if (s.color && Array.isArray(s.color) && typeof s.color[0] === 'string') {
        map[s.name] = s.color[0];
      }
    });
    return map;
  }, [gtpSeries]);

  // Custom tooltip HTML for GTPChart
  const tooltipFormatter = useCallback((params: GTPChartTooltipParams[]) => {
    const validParams = params.filter(p => {
      const v = Number(p.value[1]);
      return Number.isFinite(v) && Math.abs(v) > 0;
    });
    if (!validParams.length) return "";

    const timestamp = validParams[0].value[0];
    const dateLabel = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
    }).format(timestamp);

    const sortedParams = [...validParams].sort((a, b) => b.value[1] - a.value[1]);
    const maxValue = Math.max(...sortedParams.map(p => Math.abs(p.value[1])));
    const decimalDigits = chartKey === "tps" ? 2 : 0;

    const rows = sortedParams.map(point => {
      const value = point.value[1];
      const color = seriesColorMap[point.seriesName] ?? "#CDD8D3";
      const barWidth = maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0;
      const formattedValue = prefix + Intl.NumberFormat("en-US", {
        notation: "standard",
        maximumFractionDigits: decimalDigits,
      }).format(value);

      return `
        <div class="flex w-full h-[15px] space-x-2 items-center font-medium mb-0.5">
          <div class="w-[15px] h-[10px] rounded-r-full relative overflow-hidden -ml-3" style="background-color:${color}"></div>
          <div class="text-xs flex-1 text-left text-nowrap">${point.seriesName}</div>
          <div class="text-right numbers-xs">${formattedValue}</div>
        </div>
        <div class="flex ml-3 relative mb-1 mt-1">
          <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full" style="background-color:transparent"></div>
          <div class="h-[2px] rounded-none absolute right-0 -top-[2px]" style="width:${barWidth}%;background-color:${color}99"></div>
        </div>
      `;
    }).join("");

    const totalRow = chartKey !== "l2Count" ? `
      <div class="flex w-full h-[15px] space-x-2 items-center font-medium mt-2 pl-3">
        <div class="text-xs flex-1 text-left text-nowrap">Total</div>
        <div class="text-right numbers-xs">
          ${prefix}${Intl.NumberFormat("en-US", { notation: "standard", maximumFractionDigits: decimalDigits }).format(sortedParams.reduce((sum, p) => sum + p.value[1], 0))}
        </div>
      </div>
    ` : "";

    // L2 launched/archived list for the # Layer 2s Live chart
    let l2Section = "";
    if (chartKey === "l2Count" && "daily" in dataSource && dataSource.daily) {
      const dateStr = new Date(timestamp).toISOString().split("T")[0];
      const types: string[] = dataSource.daily.types;
      const unixIdx = types.indexOf("unix");
      const launchedIdx = types.indexOf("l2s_launched");
      const archivedIdx = types.indexOf("l2s_archived");

      const rowIndex = (dataSource.daily.values as any[][]).findIndex((row: any[]) => {
        const rowTs = row[unixIdx];
        const rowDate = new Date(rowTs > 1e10 ? rowTs : rowTs * 1000).toISOString().split("T")[0];
        return rowDate === dateStr;
      });

      if (rowIndex >= 0) {
        const launched: any[] = (dataSource.daily.values as any[][])[rowIndex][launchedIdx];
        const archived: any[] = (dataSource.daily.values as any[][])[rowIndex][archivedIdx];

        if (Array.isArray(launched) && launched.length > 0) {
          const items = launched.map((l2: any, idx: number) => {
            const chainInfo = AllChainsByKeys[l2.origin_key];
            const color = chainInfo?.colors.dark[0] || UNLISTED_CHAIN_COLORS[idx % UNLISTED_CHAIN_COLORS.length];
            return `<div class="flex items-center bg-color-bg-medium text-[10px] rounded-full pl-[3px] pr-[6px] py-[3px] gap-x-[4px]"><div class="w-[6px] h-[6px] rounded-full" style="background-color:${color}"></div>${l2.l2beat_name}</div>`;
          }).join("");
          l2Section += `<div class="pl-3 mt-2"><div class="heading-small-xxs mb-1">Launched this Month</div><div class="flex flex-wrap items-center gap-x-[5px] gap-y-[5px] mt-1">${items}</div></div>`;
        }

        if (Array.isArray(archived) && archived.length > 0) {
          const items = archived.map((l2: any, idx: number) => {
            const chainInfo = AllChainsByKeys[l2.origin_key];
            const color = chainInfo?.colors.dark[0] || UNLISTED_CHAIN_COLORS[idx % UNLISTED_CHAIN_COLORS.length];
            return `<div class="flex items-center bg-color-bg-medium text-[10px] rounded-full pl-[3px] pr-[6px] py-[3px] gap-x-[4px]"><div class="w-[6px] h-[6px] rounded-full" style="background-color:${color}"></div>${l2.l2beat_name}</div>`;
          }).join("");
          l2Section += `<div class="pl-3 mt-2"><div class="heading-small-xxs mb-1">Shutdown this Month</div><div class="flex flex-wrap items-center gap-x-[5px] gap-y-[5px] mt-1">${items}</div></div>`;
        }
      }
    }

    const widthClass = chartKey === "l2Count" ? "w-[300px]" : "min-w-[250px] max-w-80";

    return `
      <div class="bg-color-bg-default rounded-[15px] p-3 ${widthClass} min-h-[50px] text-xs font-raleway" style="box-shadow:0 4px 24px rgba(0,0,0,0.15)">
        <div class="flex items-center gap-x-[5px] justify-between mb-2 pl-2.5">
          <div class="heading-small-xs">${dateLabel}</div>
          <div class="text-xs h-[18px] flex items-center">${title}</div>
        </div>
        ${rows}
        ${totalRow}
        ${l2Section}
      </div>
    `;
  }, [dataSource, prefix, chartKey, title, AllChainsByKeys, seriesColorMap]);

  const yAxisLabelFormatter = useCallback(
    (value: number) => value === 0 ? "" : prefix + formatNumberWithSI(value),
    [prefix],
  );

  const l2Colors = useMemo(() => {
    const colors = AllChainsByKeys["all_l2s"]?.colors[theme ?? "dark"];
    return colors ?? ["#FFDF27", "#FE5468"];
  }, [AllChainsByKeys, theme]);

  const seriesOverrides = useCallback((series: Record<string, unknown>) => {
    const name = series.name as string | undefined;
    if (name === "Layer 2s") {
      // Horizontal gradient left→right: yellow → red on the area line stroke
      return {
        ...series,
        lineStyle: {
          ...(series.lineStyle as Record<string, unknown> | undefined),
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: l2Colors[0] },
            { offset: 1, color: l2Colors[1] },
          ]),
        },
      };
    }
    if (name === "Layer 2s Live") {
      // Vertical gradient top→bottom: yellow → red on bars
      return {
        ...series,
        itemStyle: {
          ...(series.itemStyle as Record<string, unknown> | undefined),
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: l2Colors[0] },
            { offset: 1, color: l2Colors[1] },
          ]),
        },
      };
    }
    return series;
  }, [l2Colors]);

  return (
    <div ref={mainContainerRef} className='group/chart flex flex-col relative rounded-[15px] w-full h-[375px] bg-color-bg-default pt-[15px]'>
      {/* Header */}
      <div className={`flex h-[56px] pl-[24px] sm:pl-[34px] ${isMobile ? "pr-[2px]" : "pr-[20px]"} items-start w-full`}>
        <div className='flex gap-x-[5px] sm:gap-x-[10px] items-center z-[10] flex-1 sm:pt-0 pt-[5px]'>
          {urlKey ? (
            <Link href={`/fundamentals/${urlKey}`} className='heading-large-xs sm:heading-large-sm hover:underline md:heading-large-md'>{title}</Link>
          ) : (
            <div className='heading-large-xs sm:heading-large-sm md:heading-large-md'>{title}</div>
          )}
          <GTPTooltipNew
            placement="top-start"
            unstyled
            trigger={
              <div className='hover:cursor-pointer'>
                <GTPIcon icon="gtp-info-monochrome" size='sm' className='pointer-events-auto' style={{ color: "rgb(var(--text-secondary))" }} />
              </div>
            }
            positionOffset={{ mainAxis: 0, crossAxis: 0 }}
          >
            <GTPTooltipGeneral width={350}>
              <div className="pl-[20px]">{tooltipContent}</div>
            </GTPTooltipGeneral>
          </GTPTooltipNew>
        </div>
        <div className='flex flex-col h-full items-end pt-[5px]'>
          <div
            className={`flex items-center gap-x-[5px] pr-[4px] sm:pr-[4px]`}
            style={{
              marginRight: allChartCoordinates[chartKey]?.x && allChartCoordinates["tps"]?.x
                ? `${allChartCoordinates["tps"]?.x - allChartCoordinates[chartKey]?.x}px`
                : "0px",
            }}
          >
            <div className='numbers-lg sm:numbers-xl bg-gradient-to-b bg-color-text-primary bg-clip-text text-transparent'>{totalValue}</div>
            {/* Invisible placeholder used only to measure circleY for the SVG overlay */}
            <div ref={circleRef} className='w-[9px] h-[9px] sm:w-[9px] sm:h-[9px] rounded-full z-chart bg-transparent' />
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

      {/* Chart area */}
      <div
        ref={chartAreaRef}
        className='w-full absolute bottom-0 left-0 right-0'
        style={{ height: '304px' }}
      >
        <GTPChart
          series={gtpSeries}
          stack={isStacked}
          xAxisType="time"
          prefix={prefix}
          height={304}
          showWatermark={false}
          // bottom:0 hides GTPChart's built-in x-axis overlay (we use our own XAxisLabels)
          // compactXAxis required for the bottom grid override to take effect
          compactXAxis
          grid={{ bottom: 0, top: 20, right: isMobile ? 10 : 28 }}
          tooltipFormatter={tooltipFormatter}
          onLastDataPointCoords={handleLastDataPointCoords}
          yAxisLabelFormatter={yAxisLabelFormatter}
          ySplitNumber={3}
          seriesOverrides={seriesOverrides}
        />

        {/* SVG overlay: circle in header + dashed vertical line to last data point */}
        {lastPointCoords && (
          <svg
            className='absolute top-[-46px] left-0 w-full pointer-events-none z-10'
            style={{ height: 'calc(100% + 46px)' }}
          >
            <circle
              cx={lastPointCoords.x}
              cy={5}
              r={4.5}
              className='text-color-text-primary fill-color-text-primary stroke-color-text-primary'
              strokeWidth="1"
            />
            <line
              x1={lastPointCoords.x}
              y1={9.5}
              x2={lastPointCoords.x}
              y2={lastPointCoords.y + 46}
              className='text-color-text-primary stroke-color-text-primary'
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          </svg>
        )}
      </div>

      {/* X-axis year labels */}
      <XAxisLabels
        xMin={xAxisExtremes.xMin}
        xMax={xAxisExtremes.xMax}
        rightMargin={
          allChartCoordinates[chartKey]?.x && allChartCoordinates["tps"]?.x
            ? `${allChartCoordinates["tps"]?.x + 1 - allChartCoordinates[chartKey]?.x}px`
            : "0px"
        }
        isMobile={isMobile}
      />
    </div>
  );
}
