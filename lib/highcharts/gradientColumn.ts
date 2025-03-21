// gradientColumns.ts
import * as Highcharts from 'highcharts';

/**
 * Function to apply a gradient fill to a column series
 */
const applyGradientToSeries = (
  chart: Highcharts.Chart, 
  seriesIndex: number, 
  gradientOptions: {
    direction?: 'vertical' | 'horizontal' | 'diagonal' | 'radial';
    startColor: string;
    endColor: string;
    stops?: Array<[number, string]>;
  }
): void => {
  const series = chart.series[seriesIndex];
  if (!series) {
    console.error(`Series at index ${seriesIndex} not found`);
    return;
  }
  
  // Create a unique ID for the gradient
  const gradientId = `gradient-${series.index}-${new Date().getTime()}`;
  
  // Create gradient configuration
  let gradientConfig: any;
  
  // Default stops if none provided
  const stops = gradientOptions.stops || [
    [0, gradientOptions.startColor],
    [1, gradientOptions.endColor]
  ];
  
  // Configure gradient based on direction
  const direction = gradientOptions.direction || 'vertical';
  
  switch (direction) {
    case 'horizontal':
      gradientConfig = {
        linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
        stops
      };
      break;
    case 'diagonal':
      gradientConfig = {
        linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
        stops
      };
      break;
    case 'radial':
      gradientConfig = {
        radialGradient: { cx: 0.5, cy: 0.5, r: 0.5 },
        stops
      };
      break;
    case 'vertical':
    default:
      gradientConfig = {
        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
        stops
      };
  }
  
  // Apply gradient to the series
  series.update({
    color: gradientConfig
  } as any);
};

/**
 * Function to apply pattern with gradient fill to column series
 * This is for when you still want the pattern strokes but with gradient background
 */
const applyGradientPatternToSeries = (
  chart: Highcharts.Chart,
  seriesIndex: number,
  options: {
    pattern: {
      path: string;
      stroke?: string;
      strokeWidth?: number;
      rotation?: number;
    };
    gradient: {
      direction?: 'vertical' | 'horizontal' | 'diagonal' | 'radial';
      startColor: string;
      endColor: string;
    };
  }
): void => {
  const series = chart.series[seriesIndex];
  if (!series) {
    console.error(`Series at index ${seriesIndex} not found`);
    return;
  }
  
  // Generate unique ID
  const patternId = `pattern-${series.index}-${new Date().getTime()}`;
  
  // Configure the pattern options
  const pattern = {
    id: patternId,
    width: 10,
    height: 10,
    path: options.pattern.path,
    color: 'transparent', // Transparent background so gradient shows through
    backgroundColor: 'transparent' // Ensure no background color
  };
  
  // Create the pattern
  chart.renderer['addPattern'](pattern);
  
  // Get direction gradient settings
  const direction = options.gradient.direction || 'vertical';
  let gradientAttrs;
  
  switch (direction) {
    case 'horizontal':
      gradientAttrs = { x1: 0, y1: 0, x2: 1, y2: 0 };
      break;
    case 'diagonal':
      gradientAttrs = { x1: 0, y1: 0, x2: 1, y2: 1 };
      break;
    case 'radial':
      // For radial, we'll create it separately
      break;
    case 'vertical':
    default:
      gradientAttrs = { x1: 0, y1: 0, x2: 0, y2: 1 };
  }
  
  // Create the gradient directly in defs
  const defs = chart.renderer.defs;
  let gradient;
  
  if (direction === 'radial') {
    gradient = chart.renderer.createElement('radialGradient')
      .attr({
        id: `${patternId}-gradient`,
        cx: 0.5,
        cy: 0.5,
        r: 0.5,
        gradientUnits: 'objectBoundingBox'
      })
      .add(defs);
  } else {
    gradient = chart.renderer.createElement('linearGradient')
      .attr({
        id: `${patternId}-gradient`,
        ...gradientAttrs,
        gradientUnits: 'objectBoundingBox'
      })
      .add(defs);
  }
  
  // Add gradient stops
  chart.renderer.createElement('stop')
    .attr({
      offset: 0,
      'stop-color': options.gradient.startColor
    })
    .add(gradient);
  
  chart.renderer.createElement('stop')
    .attr({
      offset: 1,
      'stop-color': options.gradient.endColor
    })
    .add(gradient);
  
  // Find the pattern element
  setTimeout(() => {
    // This timeout ensures the pattern is in the DOM
    const patternElement = document.getElementById(patternId);
    if (patternElement) {
      // Create a rect that fills the pattern with the gradient
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      rect.setAttribute('width', '10');
      rect.setAttribute('height', '10');
      rect.setAttribute('fill', `url(#${patternId}-gradient)`);
      
      // Insert the rect before any other elements in the pattern
      if (patternElement.firstChild) {
        patternElement.insertBefore(rect, patternElement.firstChild);
      } else {
        patternElement.appendChild(rect);
      }
      
      // Ensure pattern path elements use transparent fill and the specified stroke
      const pathElements = patternElement.getElementsByTagName('path');
      for (let i = 0; i < pathElements.length; i++) {
        pathElements[i].setAttribute('fill', 'none');
        if (options.pattern.stroke) {
          pathElements[i].setAttribute('stroke', options.pattern.stroke);
        }
        if (options.pattern.strokeWidth) {
          pathElements[i].setAttribute('stroke-width', options.pattern.strokeWidth.toString());
        }
      }
    }
  }, 0);
  
  // Apply the pattern to the series
  series.update({
    color: `url(#${patternId})`
  });
};

export { applyGradientToSeries, applyGradientPatternToSeries };