// src/lib/highcharts/configUtils.ts
import * as d3 from 'd3';
import Highcharts from 'highcharts';
import { merge } from 'lodash';

// Base chart configuration that can be used across different charts
export const baseChartOptions: Highcharts.Options = {
  accessibility: { enabled: false },
  exporting: { enabled: false },
  chart: {
    backgroundColor: "transparent",
    showAxes: false,
    panKey: "shift",
    animation: false,
    zooming: {
      resetButton: {
        position: {
          x: 0,
          y: 10,
        },
        theme: {
          fill: "transparent",
          style: {
            opacity: 1,
            fontSize: "12",
            fontFamily: "Inter",
            fontWeight: "300",
            color: "#fff",
            textTransform: "lowercase",
            border: "1px solid #fff",
          },
          borderRadius: 4,
          padding: 8,
          borderWidth: 2,
          r: 16,
          states: { hover: { fill: "#fff", style: { color: "#000" } } },
        },
      },
    },
  },
  title: undefined,
  yAxis: {
    title: { text: undefined },
    labels: {
      enabled: true,
    },
    gridLineWidth: 1,
    gridLineColor: "rgb(215, 223, 222)",
  },
  xAxis: {
    type: "datetime",
    lineWidth: 0,
    crosshair: {
      width: 0.5,
      color: "rgb(215, 223, 222)",
      snap: false,
    },
    gridLineWidth: 0,
  },
  legend: {
    enabled: false,
    useHTML: false,
    symbolWidth: 0,
  },
  tooltip: {
    useHTML: true,
    shadow: false,
    shared: true,
  },
  plotOptions: {
    area: {
      stacking: "normal",
      events: {
        legendItemClick: function () {
          return false;
        },
      },
      marker: {
        radius: 0,
      },
      shadow: false,
      animation: false,
    },
    column: {
      grouping: true,
      stacking: "normal",
      events: {
        legendItemClick: function () {
          return false;
        },
      },
      groupPadding: 0,
      animation: false,
    },
    series: {
      stacking: "normal",
      events: {
        legendItemClick: function () {
          return false;
        },
      },
      marker: {
        radius: 0,
      },
      shadow: false,
      animation: false,
    },
  },
  credits: {
    enabled: false,
  },
  navigation: {
    buttonOptions: {
      enabled: false,
    },
  },
};

/**
 * Creates Highcharts options by merging base options with custom options
 */
export function createChartOptions(customOptions: Highcharts.Options): Highcharts.Options {
  return merge({}, baseChartOptions, customOptions);
}

/**
 * Format numbers for display in charts and tooltips
 */
export function formatNumber(
  value: number | string, 
  scale: 'absolute' | 'percentage' | 'log' = 'absolute',
  isAxis = false
): string {
  if (typeof value === 'string') {
    value = parseFloat(value);
  }
  
  return isAxis
    ? scale !== 'percentage'
      ? d3.format('.2s')(value)
      : d3.format('.2s')(value) + '%'
    : d3.format(',.2~s')(value);
}

/**
 * Get formatter for x-axis date labels
 */
export function getXAxisLabelFormatter(isMobile = false): Highcharts.AxisLabelsFormatterCallbackFunction {
  return function(this) {
    // If Jan 1st, show year
    if (new Date(this.value).getUTCMonth() === 0) {
      return new Date(this.value).toLocaleDateString("en-GB", {
        timeZone: "UTC",
        year: "numeric",
      });
    }
    return new Date(this.value).toLocaleDateString("en-GB", {
      timeZone: "UTC",
      month: isMobile ? "short" : "short",
      year: "numeric",
    });
  };
}

/**
 * Create a tooltip positioner function
 */
export function createTooltipPositioner(
  isMobile = false
): Highcharts.TooltipPositionerCallbackFunction {
  return function(this, width, height, point) {
    const chart = this.chart;
    const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
    const tooltipWidth = width;
    const tooltipHeight = height;

    const distance = 20;
    const pointX = point.plotX + plotLeft;
    const pointY = point.plotY + plotTop;
    let tooltipX =
      pointX - distance - tooltipWidth < plotLeft
        ? pointX + distance
        : pointX - tooltipWidth - distance;

    const tooltipY = pointY - tooltipHeight / 2;

    if (isMobile) {
      if (tooltipX + tooltipWidth > plotLeft + plotWidth) {
        tooltipX = plotLeft + plotWidth - tooltipWidth;
      }
      return {
        x: tooltipX,
        y: 0,
      };
    }

    return {
      x: tooltipX,
      y: tooltipY,
    };
  };
}

/**
 * Creates a hash pattern definition for chart fill patterns
 */
export function createHashPattern(
  id: string, 
  angle = 45, 
  spacing = 5, 
  strokeWidth = 1, 
  color = '#000'
): string {
  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${spacing}" height="${spacing}" patternTransform="rotate(${angle})">
      <line 
        x1="0" 
        y1="0" 
        x2="0" 
        y2="${spacing}" 
        stroke="${color}" 
        stroke-width="${strokeWidth}"
      />
    </pattern>
  `;
}

/**
 * Get the chart height based on device and embed status
 */
export function getChartHeight(isMobile = false, isEmbed = false, containerHeight = 0): number {
  if (isEmbed) return containerHeight;
  if (isMobile) return 264;
  return 360;
}

/**
 * Configure Highcharts global settings
 */
export function configureHighchartsGlobals(): void {
  Highcharts.setOptions({
    lang: {
      numericSymbols: ["K", " M", "B", "T", "P", "E"],
    },
  });
  
  // Add wrapper for axis tick rendering to adjust styling
  Highcharts.wrap(
    Highcharts.Axis.prototype,
    "renderTick",
    function (proceed) {
      proceed.apply(this, Array.prototype.slice.call(arguments, 1));

      const axis: Highcharts.Axis = this;
      const ticks: Highcharts.Dictionary<Highcharts.Tick> = axis.ticks;
      if (
        axis.isXAxis &&
        axis.options.labels &&
        axis.options.labels.enabled
      ) {
        Object.keys(ticks).forEach((tick) => {
          const tickLabel = ticks[tick].label;
          if (!tickLabel) return;
          const tickValue = tickLabel.element.textContent;
          if (tickValue) {
            if (tickValue.length === 4) {
              tickLabel.css({
                transform: "scale(1.4)",
                fontWeight: "600",
              });
            }
          }
        });
      }
    },
  );
}