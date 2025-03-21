/**
 * Highcharts Pattern Fill Gradient Plugin
 * 
 * This plugin extends the PatternFill module to support gradients within patterns.
 * Include this file after loading both Highcharts and the PatternFill module.
 */

// patternFillGradient.ts
/**
 * Highcharts Pattern Fill Gradient Plugin
 * 
 * This plugin extends the PatternFill module to support gradients within patterns.
 * Include this file after loading both Highcharts and the PatternFill module.
 */

// patternFillGradient.ts
import * as Highcharts from 'highcharts';

// Extend Highcharts types to include gradient patterns
declare module 'highcharts' {
  interface PatternOptionsPath {
    d?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
  }

  interface GradientColorStop {
    0: number;
    1: string;
    2?: number; // optional stop-opacity
  }

  interface LinearGradientColorObject {
    linearGradient: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
    stops: Array<[number, string, number?]>;
  }

  interface RadialGradientColorObject {
    radialGradient: {
      cx: number;
      cy: number;
      r: number;
    };
    stops: Array<[number, string, number?]>;
  }

  // type GradientColorObject = LinearGradientColorObject | RadialGradientColorObject;

  interface PatternOptions {
    path?: PatternOptionsPath;
    color?: string;
    opacity?: number;
    width?: number;
    height?: number;
    fill?: string | GradientColorObject;
    patternTransform?: string;
    fullColumn?: boolean; // New option to extend gradient across full column
  }

  interface PatternObject {
    id: string;
    patternOptions?: PatternOptions;
    _width?: number;
    _height?: number;
    element?: Highcharts.SVGElement;
    defs?: Highcharts.SVGElement;
  }
}

// Initialize the PatternFill gradient plugin
const initPatternFillGradientPlugin = (): void => {
  // Skip if Highcharts isn't loaded or if addPattern isn't available
  if (!Highcharts || !Highcharts.SVGRenderer.prototype['addPattern']) {
    console.error('Highcharts PatternFill Gradient Plugin: Highcharts or PatternFill module not loaded');
    return;
  }

  // Store the original addPattern method
  const originalAddPattern = Highcharts.SVGRenderer.prototype['addPattern'];

  // Override with gradient-supporting version
  Highcharts.SVGRenderer.prototype['addPattern'] = function(
    pattern: Highcharts.PatternObject,
    animation?: boolean
  ): Highcharts.PatternObject {
    const animate = Highcharts.pick(animation, true);
    const animationOptions = Highcharts.animObject(animate);
    const patternOptions = pattern.patternOptions || {};
    const patternPath = patternOptions.path;
    const patternColor = patternOptions.color;
    const patternOpacity = Highcharts.pick(patternOptions.opacity, 1);
    const patternWidth = patternOptions.width || pattern._width || 32;
    const patternHeight = patternOptions.height || pattern._height || 32;
    const fullColumn = true;
    const id = pattern.id;

    // Create the pattern element if it doesn't exist
    if (!pattern.element) {
      // Set pattern attributes based on whether we want it to cover the full column
      const patternAttrs: Record<string, any> = {
        id: id,
        width: patternWidth,
        height: patternHeight,
        x: 0,
        y: 0
      };
      
      // If we want the pattern to extend across the entire column
      if (fullColumn) {
        patternAttrs.patternUnits = 'objectBoundingBox';
        patternAttrs.width = 1;
        patternAttrs.height = 1;
      } else {
        patternAttrs.patternUnits = 'userSpaceOnUse';
      }
      
      // Add patternTransform if specified
      if (patternOptions.patternTransform) {
        patternAttrs.patternTransform = patternOptions.patternTransform;
      }
      
      pattern.element = this.createElement('pattern').attr(patternAttrs).add(this.defs);

      // Create a rect for the background that fills the entire pattern
      const rectAttrs: Record<string, any> = {
        fill: patternColor,
        opacity: patternOpacity
      };
      
      if (fullColumn) {
        rectAttrs.width = 1;
        rectAttrs.height = 1;
      } else {
        rectAttrs.width = patternWidth;
        rectAttrs.height = patternHeight;
      }
      
      const rect = this.rect(0, 0, rectAttrs.width, rectAttrs.height).attr(rectAttrs);

      // Handle gradient in pattern fill
      if (patternOptions.fill) {
        if (
          typeof patternOptions.fill === 'object' &&
          (
            ('linearGradient' in patternOptions.fill) || 
            ('radialGradient' in patternOptions.fill)
          ) &&
          'stops' in patternOptions.fill
        ) {
          const gradientId = 'gradient-' + id;
          let gradientType: string;
          let gradientAttrs: Record<string, number> = {};
          
          // Set up attributes based on gradient type
          if ('linearGradient' in patternOptions.fill) {
            gradientType = 'linearGradient';
            
            // If we want the gradient to go across the entire column,
            // use 0 to 1 coordinates (objectBoundingBox scale)
            if (fullColumn) {
              gradientAttrs = {
                x1: 0,
                y1: 0,
                x2: 1,
                y2: 0 // Horizontal gradient by default
              };
              
              // Override with any user-specified coordinates
              const userGradient = (patternOptions.fill as unknown as Highcharts.LinearGradientColorObject).linearGradient;
              if (userGradient) {
                Object.assign(gradientAttrs, userGradient);
              }
            } else {
              gradientAttrs = (patternOptions.fill as unknown as Highcharts.LinearGradientColorObject).linearGradient;
            }
          } else {
            gradientType = 'radialGradient';
            
            // For radial gradients on full columns
            if (fullColumn) {
              gradientAttrs = {
                cx: 0.5,
                cy: 0.5,
                r: 0.5
              };
              
              // Override with any user-specified coordinates
              const userGradient = (patternOptions.fill as unknown as Highcharts.RadialGradientColorObject).radialGradient;
              if (userGradient) {
                Object.assign(gradientAttrs, userGradient);
              }
            } else {
              gradientAttrs = (patternOptions.fill as unknown as Highcharts.RadialGradientColorObject).radialGradient;
            }
          }
          
          // Create the gradient element
          const gradient = this.createElement(gradientType)
            .attr({
              id: gradientId,
              ...gradientAttrs
            })
            .add(pattern.element);
          
          // Add stops to the gradient
          (patternOptions.fill as unknown as Highcharts.GradientColorObject).stops.forEach((stop) => {
            this.createElement('stop').attr({
              offset: stop[0],
              'stop-color': stop[1],
              'stop-opacity': stop[2] !== undefined ? stop[2] : 1
            }).add(gradient);
          });
          
          // Update the rect to use the gradient
          rect.attr({
            fill: 'url(#' + gradientId + ')'
          });
        } else if (typeof patternOptions.fill === 'string') {
          // Regular color string
          rect.attr({
            fill: patternOptions.fill
          });
        }
      }
      
      rect.add(pattern.element);

      // Add path if defined (only for non-fullColumn patterns)
      if (patternPath && !fullColumn) {
        const attribs: Record<string, any> = {};
        
        if (patternPath.d) {
          attribs.d = patternPath.d;
        }
        
        if (patternPath.stroke) {
          attribs.stroke = patternPath.stroke;
        }
        
        if (patternPath.strokeWidth) {
          attribs['stroke-width'] = patternPath.strokeWidth;
        }
        
        if (patternPath.opacity) {
          attribs.opacity = patternPath.opacity;
        }
        
        this.createElement('path').attr(attribs).add(pattern.element);
      }
    }

    return pattern;
  };
};

export default initPatternFillGradientPlugin;