/**
 * Enhanced SVG pattern system for Highcharts
 * This consolidates all pattern-related functionality in one place
 */

import Highcharts from "highcharts";

// Type definitions for better type safety
export type PatternDirection = 'left' | 'right';
export type PatternType = 'hash' | 'gradient-hash' | 'colored-hash';

export interface PatternConfig {
  type: PatternType;
  direction?: PatternDirection;
  width?: number;
  height?: number;
  colors?: {
    start: string;
    end: string;
  };
  color?: string;
  backgroundFill?: string;
}

export interface PatternResult {
  patternId: string;
  maskId?: string;
  fillUrl: string;
  svgDef: string;
}

/**
 * Creates a pattern based on the provided configuration
 */
export function createPattern(config: PatternConfig): PatternResult {
  switch (config.type) {
    case 'hash':
      return createHashPattern(
        config.direction || 'right',
        config.width || 5,
        config.height || 6,
        config.colors?.start || '#000000'
      );
    case 'gradient-hash':
      return createGradientHashPattern(
        config.direction || 'right',
        config.width || 5,
        config.height || 6,
        config.colors?.start || '#3498db',
        config.colors?.end || '#9b59b6'
      );
    case 'colored-hash':
      return createColoredHashPattern(
        config.direction || 'right',
        config.width || 5,
        config.height || 6,
        config.color || '#94ABD3',
        config.backgroundFill || 'url(#allL2sLinearGradient)'
      );
    default:
      throw new Error(`Unsupported pattern type: ${config.type}`);
  }
}

/**
 * Creates a diagonal hash pattern for masking
 */
function createHashPattern(
  direction: PatternDirection = 'right',
  width = 5,
  height = 6,
  fillColor = '#000000'
): PatternResult {
  const isRight = direction === 'right';
  const patternId = `hashPattern${isRight ? 'Right' : 'Left'}`;
  const maskId = `${patternId}Mask`;
  
  // Paths for right-facing diagonal pattern
  const rightPathsContent = `
    <path d="M0 0V0.707108L0.589256 0H0Z" fill="white"/>
    <path d="M1.91074 0L0 2.29289V3.70711L3.08926 0H1.91074Z" fill="white"/>
    <path d="M4.41074 0L0 5.29289V6H0.589256L5 0.707108V0H4.41074Z" fill="white"/>
    <path d="M1.91074 6H3.08926L5 3.70711V2.29289L1.91074 6Z" fill="white"/>
    <path d="M5 5.29289L4.41074 6H5L5 5.29289Z" fill="white"/>
  `;
  
  // Paths for left-facing diagonal pattern
  const leftPathsContent = `
    <path d="M5 0V0.707108L4.41074 0H5Z" fill="white"/>
    <path d="M3.08926 0L5 2.29289V3.70711L1.91074 0H3.08926Z" fill="white"/>
    <path d="M0.589256 0L5 5.29289V6H4.41074L0 0.707108V0H0.589256Z" fill="white"/>
    <path d="M3.08926 6H1.91074L0 3.70711V2.29289L3.08926 6Z" fill="white"/>
    <path d="M0 5.29289L0.589256 6H0L0 5.29289Z" fill="white"/>
  `;

  const pathsContent = isRight ? rightPathsContent : leftPathsContent;
  
  // SVG content for pattern with mask
  const svgDef = `
    <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${width}" height="${height}">
      ${pathsContent}
    </pattern>
    <mask id="${maskId}" patternUnits="userSpaceOnUse" width="${width}" height="${height}">
      <rect x="0" y="0" width="100%" height="100%" fill="url(#${patternId})" transform="scale(2)"/>
    </mask>
  `;
  
  return {
    patternId,
    maskId,
    svgDef,
    fillUrl: `url(#${patternId})`
  };
}

/**
 * Creates a diagonal hash pattern with gradient
 */
function createGradientHashPattern(
  direction: PatternDirection = 'right',
  width = 5,
  height = 6,
  startColor = '#3498db',
  endColor = '#9b59b6'
): PatternResult {
  const isRight = direction === 'right';
  const patternId = `gradientHashPattern${isRight ? 'Right' : 'Left'}`;
  const gradientId = `${patternId}Gradient`;
  
  // Paths with the appropriate direction
  const rightPathsContent = `
    <path d="M0 0V0.707108L0.589256 0H0Z" fill="url(#${gradientId})"/>
    <path d="M1.91074 0L0 2.29289V3.70711L3.08926 0H1.91074Z" fill="url(#${gradientId})"/>
    <path d="M4.41074 0L0 5.29289V6H0.589256L5 0.707108V0H4.41074Z" fill="url(#${gradientId})"/>
    <path d="M1.91074 6H3.08926L5 3.70711V2.29289L1.91074 6Z" fill="url(#${gradientId})"/>
    <path d="M5 5.29289L4.41074 6H5L5 5.29289Z" fill="url(#${gradientId})"/>
  `;
  
  const leftPathsContent = `
    <path d="M5 0V0.707108L4.41074 0H5Z" fill="url(#${gradientId})"/>
    <path d="M3.08926 0L5 2.29289V3.70711L1.91074 0H3.08926Z" fill="url(#${gradientId})"/>
    <path d="M0.589256 0L5 5.29289V6H4.41074L0 0.707108V0H0.589256Z" fill="url(#${gradientId})"/>
    <path d="M3.08926 6H1.91074L0 3.70711V2.29289L3.08926 6Z" fill="url(#${gradientId})"/>
    <path d="M0 5.29289L0.589256 6H0L0 5.29289Z" fill="url(#${gradientId})"/>
  `;
  
  const pathsContent = isRight ? rightPathsContent : leftPathsContent;
  
  // SVG content for pattern with gradient
  const svgDef = `
    <linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${startColor}" />
      <stop offset="100%" stop-color="${endColor}" />
    </linearGradient>
    <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${width}" height="${height}" patternTransform="scale(2)">
      ${pathsContent}
    </pattern>
  `;
  
  return {
    patternId,
    svgDef,
    fillUrl: `url(#${patternId})`
  };
}

/**
 * Creates a colored hash pattern
 */
function createColoredHashPattern(
  direction: PatternDirection = 'right',
  width = 5,
  height = 6,
  hashColor = '#94ABD3',
  backgroundFill = 'url(#allL2sLinearGradient)'
): PatternResult {
  const isRight = direction === 'right';
  const patternId = `coloredHashPattern${isRight ? 'Right' : 'Left'}`;
  const gradientId = `${patternId}Gradient`;
  
  // Paths with the appropriate direction
  const rightPathsContent = `
    <path d="M0 0V0.707108L0.589256 0H0Z" fill="${hashColor}"/>
    <path d="M1.91074 0L0 2.29289V3.70711L3.08926 0H1.91074Z" fill="${hashColor}"/>
    <path d="M4.41074 0L0 5.29289V6H0.589256L5 0.707108V0H4.41074Z" fill="${hashColor}"/>
    <path d="M1.91074 6H3.08926L5 3.70711V2.29289L1.91074 6Z" fill="${hashColor}"/>
    <path d="M5 5.29289L4.41074 6H5L5 5.29289Z" fill="${hashColor}"/>
  `;
  
  const leftPathsContent = `
    <path d="M5 0V0.707108L4.41074 0H5Z" fill="${hashColor}"/>
    <path d="M3.08926 0L5 2.29289V3.70711L1.91074 0H3.08926Z" fill="${hashColor}"/>
    <path d="M0.589256 0L5 5.29289V6H4.41074L0 0.707108V0H0.589256Z" fill="${hashColor}"/>
    <path d="M3.08926 6H1.91074L0 3.70711V2.29289L3.08926 6Z" fill="${hashColor}"/>
    <path d="M0 5.29289L0.589256 6H0L0 5.29289Z" fill="${hashColor}"/>
  `;
  
  const pathsContent = isRight ? rightPathsContent : leftPathsContent;
  
  // SVG content for pattern with gradient
  const svgDef = `
    <pattern id="${patternId}Pattern" patternUnits="userSpaceOnUse" width="${width}" height="${height}" patternTransform="scale(2)">
      ${pathsContent}
    </pattern>
    <pattern id="${patternId}" patternUnits="objectBoundingBox" width="1" height="1">
      <rect x="0" y="0" width="100%" height="100%" fill="url(#allL2sLinearGradient)"/>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#${patternId}Pattern)"/>
    </pattern>
  `;
  
  return {
    patternId,
    svgDef,
    fillUrl: `url(#${patternId})`
  };
}


/**
 * Creates a simple linear gradient
 */
export function createLinearGradient(
  id: string,
  startColor: string,
  endColor: string,
  x1 = "0%",
  y1 = "0%",
  x2 = "100%",
  y2 = "100%"
): PatternResult {
  const svgDef = `
    <linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
      <stop offset="0%" stop-color="${startColor}" stop-opacity="1" />
      <stop offset="100%" stop-color="${endColor}" stop-opacity="1" />
    </linearGradient>
  `;
  
  return {
    patternId: id,
    svgDef,
    fillUrl: `url(#${id})`
  };
}

/**
 * A centralized pattern registry for Highcharts
 * Handles registration of all patterns and keeps track of them
 */
export class PatternRegistry {
  private chart: Highcharts.Chart;
  private defs: Highcharts.SVGElement;
  private registeredPatterns: Map<string, PatternResult> = new Map();

  constructor(chart: Highcharts.Chart) {
    this.chart = chart;
    this.defs = chart.renderer.createElement('defs').add();
  }

  /**
   * Register a pattern and add it to the chart's defs
   */
  register(config: PatternConfig | string, startColor?: string, endColor?: string): PatternResult {
    let pattern: PatternResult;
    
    if (typeof config === 'string') {
      // Simple named pattern/gradient registration
      switch (config) {
        case 'allL2sGradient':
          pattern = createLinearGradient(
            'allL2sLinearGradient',
            startColor || '#FE5468',
            endColor || '#FFDF27',
            "0%", "0%", "100%", "100%"
          );
          break;
        default:
          throw new Error(`Unknown pattern name: ${config}`);
      }
    } else {
      // Register using config object
      pattern = createPattern(config);
    }
    
    // Avoid duplicate registrations
    if (!this.registeredPatterns.has(pattern.patternId)) {
      this.defs.element.innerHTML += pattern.svgDef;
      this.registeredPatterns.set(pattern.patternId, pattern);
      
      // For debugging
      console.log(`Registered pattern: ${pattern.patternId}, maskId: ${pattern.maskId || 'none'}`);
    }
    
    return pattern;
  }

  /**
   * Get a registered pattern by ID
   */
  get(id: string): PatternResult | undefined {
    return this.registeredPatterns.get(id);
  }

  /**
   * Apply a pattern to a series by index
   */
  applyPatternToSeries(seriesIndex: number, patternId: string): void {
    const pattern = this.registeredPatterns.get(patternId);
    if (!pattern) {
      console.warn(`Pattern ${patternId} not found`);
      return;
    }
    
    const series = this.chart.series[seriesIndex];
    if (!series) {
      console.warn(`Series at index ${seriesIndex} not found`);
      return;
    }
    
    // Apply to series points
    series.points.forEach(point => {
      if (point.graphic) {
        point.graphic.attr({ 
          fill: pattern.fillUrl,
          ...(pattern.maskId && { mask: `url(#${pattern.maskId})` }),
          opacity: 1
        });
      }
    });
  }

  /**
   * Apply a mask to a series
   */
  applyMaskToSeries(seriesIndex: number, maskId: string): void {
    const series = this.chart.series[seriesIndex];
    if (!series) return;
    
    if (series.type === 'column') {
      series.points.forEach(point => {
        if (point.graphic) {
          point.graphic.attr({ mask: `url(#${maskId})` });
        }
      });
    } else if (series.type === 'area' && (series as any).area) {
      (series as any).area.attr({ mask: `url(#${maskId})` });
    }
  }
}

/**
 * Initialize pattern registry for a chart and register default patterns
 */
export function initializePatterns(chart: Highcharts.Chart): PatternRegistry {
  const registry = new PatternRegistry(chart);
  
  // Register default patterns
  const rightPattern = registry.register({ type: 'hash', direction: 'right' });
  const leftPattern = registry.register({ type: 'hash', direction: 'left' });
  const l2Gradient = registry.register('allL2sGradient', '#FE5468', '#FFDF27');
  
  // Store registry in chart options for future reference
  chart.options['patternRegistry'] = registry;
  
  // For debugging, log the registered patterns
  console.log('Registered patterns:', {
    rightPattern: rightPattern.patternId,
    rightMask: rightPattern.maskId,
    leftPattern: leftPattern.patternId,
    leftMask: leftPattern.maskId,
    l2Gradient: l2Gradient.patternId
  });
  
  return registry;
}

type RegistrationTarget = Highcharts.Chart | Highcharts.SVGElement | SVGElement;

function getDefs(target: RegistrationTarget) {
  let defs;
  // check if target is a chart
  if (target instanceof Highcharts.Chart) {
    defs = target.renderer.createElement('defs').add();
  } else if (target instanceof Highcharts.SVGElement) {
    defs = target.renderer.createElement('defs').add();
  } else if (target instanceof SVGElement) {
    defs = target.appendChild(document.createElement('defs')); 
  }
  return defs;
}