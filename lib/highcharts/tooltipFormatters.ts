// src/lib/charts/tooltipFormatters.ts
import * as d3 from 'd3';
import Highcharts from 'highcharts';
import { BACKEND_SIMULATION_CONFIG, type BACKEND_SIMULATION_CONFIG as BACKEND_SIMULATION_CONFIG_TYPE, GradientConfig, PatternConfig } from '@/components/layout/LandingChart';
import { PatternRegistry } from '../highcharts/svgPatterns';

// Types
interface TooltipFormatterOptions {
  selectedScale?: 'absolute' | 'percentage';
  selectedMetric?: string;
  theme?: 'light' | 'dark';
  focusEnabled?: boolean;
  showEthereumMainnet?: boolean;
  customDateFormat?: boolean;
  weeklyFormat?: boolean;
  colorMap?: Record<string, string>; // Simplified: maps series name to color
  maxPointsToShow?: number;
  seriesNameMap?: Record<string, string>; // Optional: maps series name to display name
  patternRegistry?: PatternRegistry;
  compositionTypes?: BACKEND_SIMULATION_CONFIG_TYPE['compositionTypes'];
}

interface TooltipPoint {
  series: { name: string; [key: string]: any };
  y: number;
  percentage: number;
  [key: string]: any;
}

/**
 * Formats numbers for display in tooltips and axes
 */
export const formatNumber = (
  value: number | string, 
  isAxis = false, 
  selectedScale: 'absolute' | 'percentage' = 'absolute'
): string => {
  if (typeof value === 'string') {
    value = parseFloat(value);
  }
  
  return isAxis
    ? selectedScale !== 'percentage'
      ? d3.format('.2s')(value)
      : d3.format('.2s')(value) + '%'
    : d3.format(',.2~s')(value);
};

/**
 * Creates a date string for the tooltip header
 */
export const formatDateHeader = (
  date: Date, 
  weeklyFormat = true
): string => {
  if (!weeklyFormat) {
    return date.toLocaleDateString('en-GB', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  
  // For weekly format, show range
  const endDate = new Date(date.valueOf() + 6 * 24 * 60 * 60 * 1000);
  
  return `
    <div>
      ${date.toLocaleDateString('en-GB', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}
    </div>
    <div>-</div>
    <div>
      ${endDate.toLocaleDateString(undefined, {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}
    </div>`;
};

function injectTooltipMaskStyles(maskId: string) {
  if (document.getElementById('tooltip-mask')) return;
  const style = document.createElement('style');
  style.id = 'tooltip-mask';
  style.innerHTML = `
    .diagonal-mask-right {
      --pattern-width: 5px;
      --pattern-height: 6px;
      --pattern-scale: 2;
      
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'%3E%3Cdefs%3E%3Cpattern id='diagonalPattern' patternUnits='userSpaceOnUse' width='5' height='6' patternTransform='scale(2)'%3E%3Cpath d='M0 0V0.707108L0.589256 0H0Z' fill='white'%3E%3C/path%3E%3Cpath d='M1.91074 0L0 2.29289V3.70711L3.08926 0H1.91074Z' fill='white'%3E%3C/path%3E%3Cpath d='M4.41074 0L0 5.29289V6H0.589256L5 0.707108V0H4.41074Z' fill='white'%3E%3C/path%3E%3Cpath d='M1.91074 6H3.08926L5 3.70711V2.29289L1.91074 6Z' fill='white'%3E%3C/path%3E%3Cpath d='M5 5.29289L4.41074 6H5L5 5.29289Z' fill='white'%3E%3C/path%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23diagonalPattern)'%3E%3C/rect%3E%3C/svg%3E");
      
      -webkit-mask-size: calc(var(--pattern-width) * var(--pattern-scale)) calc(var(--pattern-height) * var(--pattern-scale));
      mask-size: calc(var(--pattern-width) * var(--pattern-scale)) calc(var(--pattern-height) * var(--pattern-scale));
      
      -webkit-mask-repeat: repeat;
      mask-repeat: repeat;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Renders an individual point row in the tooltip
 */
export const renderPointRow = (
  point: TooltipPoint,
  maxValue: number,
  maxPercentage: number,
  options: TooltipFormatterOptions
): string => {
  const { series, y, percentage } = point;
  const { name } = series;
  const { 
    selectedScale = 'absolute',
    compositionTypes = {},
    patternRegistry
  } = options;

  // Get the composition type configuration
  const compositionType = Object.entries(compositionTypes).find(([key, config]) => 
    config.name === name || name.toLowerCase() === key.toLowerCase()
  );
  
  if (!compositionType) {
    console.warn(`No composition type found for series ${name}`);
    return '';
  }

  const [seriesKey, typeConfig] = compositionType;
  const displayName = typeConfig.name || name;

  const fillId = `${seriesKey}_fill_tooltip`;
  const maskId = typeConfig.mask ? `${seriesKey}_mask_tooltip` : '';

  injectTooltipMaskStyles(maskId);

  // Create the SVG marker
  const markerSvg = `
    <svg width="16px" height="6px" viewBox="0 0 16 6" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <rect ${maskId ? 'class="diagonal-mask-right"' : ''}  width="16" height="6" fill="url(#${fillId})"></rect>
    </svg>
  `;

  // Create the bar SVG
  const barSvg = `
    <svg width="100%" height="2px" viewBox="0 0 100 2" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <rect ${maskId ? 'class="diagonal-mask-right"' : ''} width="100%" height="2px" fill="url(#${fillId})"></rect>
    </svg>
  `;


  if (selectedScale === 'percentage') {
    const barWidth = (percentage / maxPercentage) * 100;

    return `
      
      <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
        <div class="w-4 h-1.5 rounded-r-full overflow-hidden" style="position: relative;">
          ${markerSvg}
        </div>
        <div class="tooltip-point-name text-xs">${displayName}</div>
        <div class="flex-1 text-right numbers-xs">${Highcharts.numberFormat(percentage, 2)}%</div>
      </div>
      <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
        <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
        <div class="h-[2px] rounded-none absolute right-0 -top-[2px] overflow-hidden" style="width: ${barWidth}%;">
          ${barSvg}
        </div>
      </div>`;
  }

  const barWidth = (y / maxValue) * 100;

  return `
    <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
      <div class="w-4 h-1.5 rounded-r-full overflow-hidden" style="position: relative;">
        ${markerSvg}
      </div>
      <div class="tooltip-point-name text-xs">${displayName}</div>
      <div class="flex-1 text-right justify-end flex numbers-xs">
        <div class="inline-block">${parseFloat(String(y)).toLocaleString('en-GB', {
          minimumFractionDigits: 0,
        })}</div>
      </div>
    </div>
    <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
      <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
      <div class="h-[2px] rounded-none absolute right-0 -top-[2px] overflow-hidden" style="width: ${barWidth}%;">
        ${barSvg}
      </div>
    </div>`;
};

// Helper function to extract gradient colors
function getGradientColors(compositionType: any): string {
  if (compositionType.fill.type !== 'gradient') return '';
  
  const gradientConfig = compositionType.fill.config;
  if (gradientConfig.type === 'linearGradient') {
    const { linearGradient, stops } = gradientConfig;
    const x1 = linearGradient?.x1 || 0;
    const y1 = linearGradient?.y1 || 0;
    const x2 = linearGradient?.x2 || 1;
    const y2 = linearGradient?.y2 || 0;
    
    // Convert to CSS linear-gradient
    let direction = '90deg'; // default (left to right)
    if (x1 === x2) {
      // Vertical gradient
      direction = y1 < y2 ? '0deg' : '180deg';
    } else if (y1 === y2) {
      // Horizontal gradient
      direction = x1 < x2 ? '90deg' : '270deg';
    } else {
      // Diagonal gradient
      if (x1 < x2 && y1 < y2) direction = '45deg';  // top-left to bottom-right
      else if (x1 > x2 && y1 < y2) direction = '135deg'; // top-right to bottom-left
      else if (x1 < x2 && y1 > y2) direction = '315deg'; // bottom-left to top-right
      else direction = '225deg'; // bottom-right to top-left
    }
    
    // Convert stops to CSS format
    const cssStops = stops.map(stop => `${stop[1]} ${stop[0] * 100}%`).join(', ');
    
    return `linear-gradient(${direction}, ${cssStops})`;
  }
  
  // For radial gradients
  if (gradientConfig.type === 'radialGradient') {
    const { radialGradient, stops } = gradientConfig;
    const cx = radialGradient?.cx || 0.5;
    const cy = radialGradient?.cy || 0.5;
    const r = radialGradient?.r || 0.5;
    
    // Convert stops to CSS format
    const cssStops = stops.map(stop => `${stop[1]} ${stop[0] * 100}%`).join(', ');
    
    return `radial-gradient(circle at ${cx * 100}% ${cy * 100}%, ${cssStops})`;
  }
  
  return '';
}

/**
 * Renders the "Others" row in the tooltip when there are more points than can be shown
 */
export const renderOthersRow = (
  restPoints: TooltipPoint[],
  maxValue: number,
  maxPercentage: number,
  options: TooltipFormatterOptions
): string => {
  if (restPoints.length === 0) return '';
  
  const { selectedScale = 'absolute' } = options;
  
  const restSum = restPoints.reduce((acc: number, point: any) => acc + point.y, 0);
  const restPercentage = restPoints.reduce((acc: number, point: any) => acc + point.percentage, 0);
  
  // Option to customize the "Others" label
  const othersColor = options.colorMap?.['__others__'] || '#E0E7E6';
  const othersLabel = restPoints.length > 1 ? `${restPoints.length} Others` : "1 Other";
  
  // Create marker and bar styles
  const markerStyle = `background-color: ${othersColor};`;
  const barStyle = `background-color: ${othersColor}99;`;
  
  if (selectedScale === 'percentage') {
    // Calculate width for the percentage bar
    const barWidth = (restPercentage / maxPercentage) * 100;
    
    return `
      <div class="flex w-full space-x-2 items-center font-medium mb-0.5 opacity-60">
        <div class="w-4 h-1.5 rounded-r-full" style="${markerStyle}"></div>
        <div class="tooltip-point-name">${othersLabel}</div>
        <div class="flex-1 text-right font-inter">${Highcharts.numberFormat(restPercentage, 2)}%</div>
      </div>
      <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
        <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
        <div class="h-[2px] rounded-none absolute right-0 -top-[2px]" 
          style="${barStyle} width: ${barWidth}%;"></div>
      </div>`;
  }
  
  // Calculate width for the absolute value bar
  const barWidth = (restSum / maxValue) * 100;
  
  return `
    <div class="flex w-full space-x-2 items-center font-medium mb-0.5 opacity-60">
      <div class="w-4 h-1.5 rounded-r-full" style="${markerStyle}"></div>
      <div class="tooltip-point-name">${othersLabel}</div>
      <div class="flex-1 text-right justify-end flex numbers-xs">
        <div class="inline-block">${restSum.toLocaleString('en-GB', { minimumFractionDigits: 0, })}</div>
      </div>
    </div>
    <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
      <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
      <div class="h-[2px] rounded-none absolute right-0 -top-[2px]"
        style="${barStyle} width: ${barWidth}%;"></div>
    </div>`;
};

/**
 * Creates a tooltip formatter function for Highcharts
 */
export const createTooltipFormatter = (options: TooltipFormatterOptions) => {
  const {
    selectedScale = 'absolute',
    selectedMetric = '',
    weeklyFormat = true,
    maxPointsToShow = 10,
    colorMap = {},
    compositionTypes = {},
  } = options;
  
  return function(this: any) {
    const { x, points }: { x: number; points: TooltipPoint[] } = this;
    const chart = this.chart;
    
    // Sort points by value and split into visible and "others"
    const sortedPoints = [...points].sort((a, b) => b.y - a.y);
    const visiblePoints = sortedPoints.slice(0, maxPointsToShow);
    const restPoints = sortedPoints.slice(maxPointsToShow);
    
    // Format the date for the header
    const date = new Date(x);
    const dateString = formatDateHeader(date, weeklyFormat);

    // Calculate max values for scaling the bars
    const maxValue = Math.max(...points.map(point => point.y));
    const maxPercentage = Math.max(...points.map(point => point.percentage));
    
    // Start building the tooltip HTML
    let tooltip = `<div class="mt-3 mr-3 mb-3 min-w-60 md:min-w-60 text-xs font-raleway highcharts-tooltip-container">
      <div class="flex-1 font-bold text-[13px] md:text-[1rem] ml-6 mb-2 flex justify-between">${dateString}</div>`;
    
    // Add points
    visiblePoints.forEach(point => {
      tooltip += renderPointRow(point, maxValue, maxPercentage, { ...options, compositionTypes });
    });
    
    // Add "Others" row if necessary
    const filteredRestPoints = restPoints.filter((point: TooltipPoint) => {
      // Include all points that have defined colors or all if no color map specified
      if (!colorMap || Object.keys(colorMap).length === 0) return true;
      return point.series.name in colorMap;
    });
    
    if (filteredRestPoints.length > 0) {
      tooltip += renderOthersRow(filteredRestPoints, maxValue, maxPercentage, { ...options, compositionTypes });
    }
    
    // Add any special notes/footer for specific metrics
    let tooltipEnd = `</div>`;
    // if (selectedMetric === 'Total Ethereum Ecosystem') {
    //   tooltipEnd = `
    //     <div class="flex flex-col items-start pl-[24px] pt-3 gap-x-1 w-full text-forest-900/60 dark:text-forest-500/60">
    //       <div class="font-medium">Note:</div>
    //       Addresses exclusively interacting with<br>respective chain.
    //     </div>
    //   </div>`;
    // }
    
    return tooltip + tooltipEnd;
  };
};

/**
 * Factory function to create a customized tooltip formatter
 */
export const createChartTooltipFormatter = (options: TooltipFormatterOptions) => {
  // Return a function that can be used directly in Highcharts configuration
  return createTooltipFormatter(options);
};

export default createChartTooltipFormatter;