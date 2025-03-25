import { BACKEND_SIMULATION_CONFIG, GradientConfig, PatternConfig, MaskConfig } from "@/components/layout/LandingChart";


// Pattern configuration
type PatternType = "hash" | "gradient-hash" | "colored-hash";


// Fill configuration (gradient or pattern)
type FillConfig =
  | { type: "gradient"; config: GradientConfig }
  | { type: "pattern"; config: PatternConfig };

// Pattern direction
type PatternDirection = "left" | "right";

type PatternResult = {
  patternId: string;
  maskId?: string;
  svgDef: string;
  fillUrl: string;
}

const SUPPORTED_GRADIENT_TYPES = ["linearGradient", "radialGradient"];
function createGradientDef(id: string, config: GradientConfig): PatternResult {
  const { type, linearGradient, radialGradient, stops } = config;
  if (!SUPPORTED_GRADIENT_TYPES.includes(type)) {
    throw new Error(`Unsupported gradient type: ${type}`);
  }

  let svgDef: string;

  if (type === "linearGradient" && linearGradient) {
    const { x1, y1, x2, y2 } = linearGradient;
    svgDef = `
      <linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
        ${stops
        .map((stop) => `<stop offset="${stop[0]}" stop-color="${stop[1]}" />`)
        .join("")}
      </linearGradient>
    `;
  } else if (type === "radialGradient" && radialGradient) {
    const { cx, cy, r} = radialGradient;
    svgDef = `
      <radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">
        ${stops
          .map((stop) => `<stop offset="${stop[0]}" stop-color="${stop[1]}" />`)
          .join("")}
      </radialGradient>
    `;
  } else {
    throw new Error(`Unsupported gradient type: ${type}`);
  }

  return {
    patternId: id,
    svgDef: svgDef,
    fillUrl: `url(#${id})`,
  }
}

function createHashMaskDef(
  maskId: string,
  direction: PatternDirection = "right",
  width = 5,
  height = 6,
  scale = 2
): PatternResult {
  const isRight = direction === "right";
  const patternId = `${maskId}Pattern`;
  const pathsContent = isRight
    ? `
      <path d="M0 0V0.707108L0.589256 0H0Z" fill="white"/>
      <path d="M1.91074 0L0 2.29289V3.70711L3.08926 0H1.91074Z" fill="white"/>
      <path d="M4.41074 0L0 5.29289V6H0.589256L5 0.707108V0H4.41074Z" fill="white"/>
      <path d="M1.91074 6H3.08926L5 3.70711V2.29289L1.91074 6Z" fill="white"/>
      <path d="M5 5.29289L4.41074 6H5L5 5.29289Z" fill="white"/>
    `
    : `
      <path d="M5 0V0.707108L4.41074 0H5Z" fill="white"/>
      <path d="M3.08926 0L5 2.29289V3.70711L1.91074 0H3.08926Z" fill="white"/>
      <path d="M0.589256 0L5 5.29289V6H4.41074L0 0.707108V0H0.589256Z" fill="white"/>
      <path d="M3.08926 6H1.91074L0 3.70711V2.29289L3.08926 6Z" fill="white"/>
      <path d="M0 5.29289L0.589256 6H0L0 5.29289Z" fill="white"/>
    `;
  const svgDef = `
    <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${width}" height="${height}">
      ${pathsContent}
    </pattern>
    <mask id="${maskId}">
      <rect x="0" y="0" width="100%" height="100%" fill="url(#${patternId})" transform="scale(${scale})" />
    </mask>
  `;

  return {
    patternId,
    maskId,
    svgDef,
    fillUrl: `url(#${patternId})`,
  }

}

function createColoredHashPattern(
  id: string,
  direction: PatternDirection = "right",
  hashColor = "#94ABD3",
  backgroundFill = "url(#allL2sLinearGradient)",
  scale = 2
): PatternResult {
  const width = 5;
  const height = 6;
  const isRight = direction === "right";
  const patternContentId = `${id}Content`;
  const pathsContent = isRight
    ? `
      <path d="M0 0V0.707108L0.589256 0H0Z" fill="${hashColor}"/>
      <path d="M1.91074 0L0 2.29289V3.70711L3.08926 0H1.91074Z" fill="${hashColor}"/>
      <path d="M4.41074 0L0 5.29289V6H0.589256L5 0.707108V0H4.41074Z" fill="${hashColor}"/>
      <path d="M1.91074 6H3.08926L5 3.70711V2.29289L1.91074 6Z" fill="${hashColor}"/>
      <path d="M5 5.29289L4.41074 6H5L5 5.29289Z" fill="${hashColor}"/>
    `
    : `
      <path d="M5 0V0.707108L4.41074 0H5Z" fill="${hashColor}"/>
      <path d="M3.08926 0L5 2.29289V3.70711L1.91074 0H3.08926Z" fill="${hashColor}"/>
      <path d="M0.589256 0L5 5.29289V6H4.41074L0 0.707108V0H0.589256Z" fill="${hashColor}"/>
      <path d="M3.08926 6H1.91074L0 3.70711V2.29289L3.08926 6Z" fill="${hashColor}"/>
      <path d="M0 5.29289L0.589256 6H0L0 5.29289Z" fill="${hashColor}"/>
    `;
  const svgDef = `
    <pattern id="${patternContentId}" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse" width="${width}" height="${height}" patternTransform="scale(${scale})">
      ${pathsContent}
    </pattern>
    <pattern id="${id}" width="100%" height="100%" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="100%" height="100%" fill="${backgroundFill}" />
      <rect x="0" y="0" width="100%" height="100%" fill="url(#${patternContentId})" />
    </pattern>
  `;

  return {
    patternId: id,
    svgDef,
    fillUrl: `url(#${id})`,
  }
}

export class PatternRegistry {
  private chart: Highcharts.Chart;
  private defs: Highcharts.SVGElement;
  private registeredDefs: Map<string, PatternResult> = new Map();

  constructor(chart: Highcharts.Chart) {
    this.chart = chart;
    this.defs = chart.renderer.createElement("defs").add();
  }

  registerGradient(id: string, config: GradientConfig): void {
    if (this.registeredDefs.has(id)) return;
    const result = createGradientDef(id, config);
    this.defs.element.innerHTML += result.svgDef;
    this.registeredDefs.set(id, result);
  }

  registerPattern(id: string, config: PatternConfig): void {
    if (this.registeredDefs.has(id)) return;
    let svgDef: string;
    let result: PatternResult;
    switch (config.type) {
      case "colored-hash":
        result = createColoredHashPattern(
          id,
          config.direction as PatternDirection,
          config.color,
          config.backgroundFill
        );
        svgDef = result.svgDef;
        break;
      // Add cases for 'hash' or 'gradient-hash' if needed
      default:
        throw new Error(`Unsupported pattern type: ${config.type}`);
    }
    this.defs.element.innerHTML += svgDef;
    this.registeredDefs.set(id, result);
  }

  registerMask(id: string, config: MaskConfig): void {
    if (this.registeredDefs.has(id)) return;
    const result = createHashMaskDef(id, config.direction as PatternDirection);
    const svgDef = result.svgDef;
    this.defs.element.innerHTML += svgDef;
    this.registeredDefs.set(id, result);
  }

  hasDef(id: string): boolean {
    return this.registeredDefs.has(id);
  }

  applyPatternToSeries(seriesIndex: number, patternId: string): void {
    const pattern = this.registeredDefs.get(patternId);
    if (!pattern) {
      console.warn(`Pattern ${patternId} not found`); 
      return;
    }

    const series = this.chart.series[seriesIndex];
    if (!series) {
      console.warn(`Series at index ${seriesIndex} not found`);
      return;
    }
    
    series.points.forEach((point) => {
      if (point.graphic) {
        point.graphic.attr({ fill: pattern.fillUrl });
      }
    });
  }

  applyFillToSeries(seriesIndex: number, fillId: string): void {
    const series = this.chart.series[seriesIndex];
    if (!series || !this.registeredDefs.has(fillId)) return;
    const fillUrl = `url(#${fillId})`;
    series.points.forEach((point) => {
      if (point.graphic) {
        point.graphic.attr({ fill: fillUrl });
      }
    });
  }

  applyMaskToSeries(seriesIndex: number, maskId: string): void {
    const series = this.chart.series[seriesIndex];
    if (!series || !this.registeredDefs.has(maskId)) return;
    if (series.type === "column") {
      series.points.forEach((point) => {
        if (point.graphic) {
          point.graphic.attr({ mask: `url(#${maskId})` });
        }
      });
    } else if (series.type === "area" && (series as any).area) {
      (series as any).area.attr({ mask: `url(#${maskId})` });
    }
  }
}

export function initializePatterns(chart: Highcharts.Chart, config: BACKEND_SIMULATION_CONFIG): PatternRegistry {
  const registry = new PatternRegistry(chart);

  // Register predefined gradients
  config.defs.gradients.forEach((gradient) => {
    registry.registerGradient(gradient.id, gradient.config);
  });

  // Register fills and masks for each compositionType
  Object.entries(config.compositionTypes).forEach(
    ([type, config]) => {
      const fillId = `${type}_fill`;
      if (config.fill.type === "gradient") {
        registry.registerGradient(fillId, config.fill.config as GradientConfig);
      } else if (config.fill.type === "pattern") {
        registry.registerPattern(fillId, config.fill.config as PatternConfig);
      }

      if (config.mask) {
        const maskId = `${type}_mask`;
        registry.registerMask(maskId, config.mask.config);
      }
    }
  );

  return registry;
}