// src/lib/charts/tooltipFormatters.ts
import * as d3 from 'd3';
import Highcharts from 'highcharts';

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
    colorMap = {},
    seriesNameMap = {}
  } = options;

  // Get appropriate color for the point (default to gray if not found)
  const pointColor = colorMap[name] || '#cccccc';

  // Get appropriate display name
  const displayName = seriesNameMap[name] || name;

  if (selectedScale === 'percentage') {
    return `
      <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
        <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${pointColor}"></div>
        <div class="tooltip-point-name text-xs">${displayName}</div>
        <div class="flex-1 text-right numbers-xs">${Highcharts.numberFormat(percentage, 2)}%</div>
      </div>
      <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
        <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
        <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
        style="
          width: ${(percentage / maxPercentage) * 100}%;
          background-color: ${pointColor};
        "></div>
      </div>`;
  }

  return `
    <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
      <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${pointColor}"></div>
      <div class="tooltip-point-name text-xs">${displayName}</div>
      <div class="flex-1 text-right justify-end flex numbers-xs">
        <div class="inline-block">${parseFloat(String(y)).toLocaleString('en-GB', {
          minimumFractionDigits: 0,
        })}</div>
      </div>
    </div>
    <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
      <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
      <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
      style="
        width: ${(y / maxValue) * 100}%;
        background-color: ${pointColor};
      "></div>
    </div>`;
};

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
  
  if (selectedScale === 'percentage') {
    return `
      <div class="flex w-full space-x-2 items-center font-medium mb-0.5 opacity-60">
        <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${othersColor}"></div>
        <div class="tooltip-point-name">${othersLabel}</div>
        <div class="flex-1 text-right font-inter">${Highcharts.numberFormat(restPercentage, 2)}%</div>
      </div>
      <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
        <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
        <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
        style="
          width: ${(restPercentage / maxPercentage) * 100}%;
          background-color: ${othersColor}99;
        "></div>
      </div>`;
  }
  
  return `
    <div class="flex w-full space-x-2 items-center font-medium mb-0.5 opacity-60">
      <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${othersColor}"></div>
      <div class="tooltip-point-name">${othersLabel}</div>
      <div class="flex-1 text-right justify-end flex numbers-xs">
        <div class="inline-block">${restSum.toLocaleString('en-GB', { minimumFractionDigits: 0, })}</div>
      </div>
    </div>
    <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
      <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
      <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
      style="
        width: ${(restSum / maxValue) * 100}%;
        background-color: ${othersColor}99;
      "></div>
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
  } = options;
  
  return function(this: any) {
    const { x, points }: { x: number; points: TooltipPoint[] } = this;
    
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
    let tooltip = `<div class="mt-3 mr-3 mb-3 w-60 md:w-60 text-xs font-raleway">
      <div class="flex-1 font-bold text-[13px] md:text-[1rem] ml-6 mb-2 flex justify-between">${dateString}</div>`;
    
    // Add points
    visiblePoints.forEach(point => {
      tooltip += renderPointRow(point, maxValue, maxPercentage, options);
    });
    
    // Add "Others" row if necessary
    const filteredRestPoints = restPoints.filter((point: TooltipPoint) => {
      // Include all points that have defined colors or all if no color map specified
      if (!colorMap || Object.keys(colorMap).length === 0) return true;
      return point.series.name in colorMap;
    });
    
    if (filteredRestPoints.length > 0) {
      tooltip += renderOthersRow(filteredRestPoints, maxValue, maxPercentage, options);
    }
    
    // Add any special notes/footer for specific metrics
    let tooltipEnd = `</div>`;
    if (selectedMetric === 'Total Ethereum Ecosystem') {
      tooltipEnd = `
        <div class="text-[0.55rem] flex flex-col items-start pl-[24px] pt-3 gap-x-1 w-full text-forest-900/60 dark:text-forest-500/60">
          <div class="font-medium">Note:</div>
          Addresses exclusively interacting with<br/>respective chain.
        </div>
      </div>`;
    }
    
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