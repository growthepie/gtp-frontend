// lib/buildSvgUtils.ts
import { JSDOM } from 'jsdom';
import { promises as fs } from 'fs'; // Node.js fs
import { optimize, Config as SvgoConfig } from 'svgo'; // Node.js svgo
import path from 'path'; // Node.js path
import { existsSync } from 'fs'; // Node.js fs
import { GradientInfo, SVGResult } from './types';
import { ExtractedColors } from './types';


export function extractColorsFromSVG(svgString: string): ExtractedColors {
  const dom = new JSDOM(svgString, { contentType: "image/svg+xml" });
  const svgDoc = dom.window.document;
  const result: { solidColors: Set<string>; gradients: GradientInfo[] } = {
    solidColors: new Set(),
    gradients: [],
  };
  extractSolidColors(svgDoc, result.solidColors);
  extractGradients(svgDoc, result.gradients);
  return {
    solidColors: Array.from(result.solidColors).sort(), // Sort for consistency
    gradients: result.gradients,
  };
}

export function extractSolidColors(svgDoc: Document, colorSet: Set<string>): void {
  const colorAttributes = ['fill', 'stroke', 'stop-color', 'color'];
  const allElements = svgDoc.querySelectorAll('*');

  allElements.forEach(element => {
    // Attribute values
    colorAttributes.forEach(attr => {
      const value = element.getAttribute(attr);
      if (value && value !== 'none' && value !== 'transparent' && !value.startsWith('url(')) {
        colorSet.add(value.toLowerCase()); // Normalize
      }
    });

    // Style values
    const style = element.getAttribute('style');
    if (style) {
      colorAttributes.forEach(attr => {
        const regex = new RegExp(`${attr}\\s*:\\s*([^;!]+)`, 'i');
        const match = style.match(regex);
        let value = match?.[1]?.trim();
        if (value && value !== 'none' && value !== 'transparent' && !value.startsWith('url(')) {
          colorSet.add(value.toLowerCase()); // Normalize
        }
      });
    }
  });
}


export function extractGradients(svgDoc: Document, gradientArray: GradientInfo[]): void {
  const linearGradients = svgDoc.querySelectorAll('linearGradient');
  const radialGradients = svgDoc.querySelectorAll('radialGradient');

  linearGradients.forEach(gradient => {
    const gradientInfo: GradientInfo = {
      id: gradient.id,
      type: 'linear',
      stops: [],
    };
    ['x1', 'y1', 'x2', 'y2', 'gradientUnits', 'gradientTransform', 'spreadMethod', 'href', 'xlink:href'].forEach(attr => {
      if (gradient.hasAttribute(attr)) gradientInfo[attr] = gradient.getAttribute(attr);
    });
    const stops = gradient.querySelectorAll('stop');
    stops.forEach(stop => {
      gradientInfo.stops.push({
        offset: stop.getAttribute('offset') ?? '0',
        color: (stop.getAttribute('stop-color') ?? '#000000').toLowerCase(),
        opacity: stop.getAttribute('stop-opacity') ?? '1',
      });
    });
    gradientInfo.stops.sort((a, b) => parseFloat(a.offset) - parseFloat(b.offset));
    if (gradientInfo.id && gradientInfo.stops.length > 0) gradientArray.push(gradientInfo);
  });

  radialGradients.forEach(gradient => {
    const gradientInfo: GradientInfo = {
      id: gradient.id,
      type: 'radial',
      stops: [],
    };
    ['cx', 'cy', 'r', 'fx', 'fy', 'fr', 'gradientUnits', 'gradientTransform', 'spreadMethod', 'href', 'xlink:href'].forEach(attr => {
      if (gradient.hasAttribute(attr)) gradientInfo[attr] = gradient.getAttribute(attr);
    });
    const stops = gradient.querySelectorAll('stop');
    stops.forEach(stop => {
      gradientInfo.stops.push({
        offset: stop.getAttribute('offset') ?? '0',
        color: (stop.getAttribute('stop-color') ?? '#000000').toLowerCase(),
        opacity: stop.getAttribute('stop-opacity') ?? '1',
      });
    });
    gradientInfo.stops.sort((a, b) => parseFloat(a.offset) - parseFloat(b.offset));
    if (gradientInfo.id && gradientInfo.stops.length > 0) gradientArray.push(gradientInfo);
  });
}


function prefixSvgIds(svgString: string, prefix: string): string {
  if (!prefix) return svgString;
  const safePrefix = prefix.endsWith('-') ? prefix : `${prefix}-`;
  let prefixedSvg = svgString.replace(/(id=")([^"]+)(")/g, (match, p1, p2, p3) => `${p1}${safePrefix}${p2}${p3}`);
  prefixedSvg = prefixedSvg.replace(/(url\(#)([^)]+)(\))/g, (match, p1, p2, p3) => p2.startsWith('http') || p2.startsWith('data:') ? match : `${p1}${safePrefix}${p2}${p3}`);
  prefixedSvg = prefixedSvg.replace(/(xlink:href="#)([^"]+)(")/g, (match, p1, p2, p3) => `${p1}${safePrefix}${p2}${p3}`);
  prefixedSvg = prefixedSvg.replace(/(href="#)([^"]+)(")/g, (match, p1, p2, p3) => !p2.includes('.') ? `${p1}${safePrefix}${p2}${p3}` : match);
  return prefixedSvg;
}

export async function downloadSVG(url: string, savePath: string, baseId: string): Promise<SVGResult> {
  try {
    // console.log(`Downloading ${url} for ${baseId}`);
    const response = await fetch(url); // Node-fetch or undici
    if (!response.ok) throw new Error(`Failed to download SVG (${response.status})`);
    const originalSvgContent = await response.text();

    const svgoConfig: SvgoConfig = {
      multipass: true,
      plugins: [
        { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
        'removeRasterImages',
        { name: 'sortAttrs', params: { xmlnsOrder: 'alphabetical' } },
      ]
    };
    let optimizedSvgContent = originalSvgContent;
    try {
      const optimizedResult = optimize(originalSvgContent, svgoConfig);
      optimizedSvgContent = ('data' in optimizedResult) ? optimizedResult.data : originalSvgContent;
    } catch (svgoError) { console.warn(`SVGO Error for ${baseId}:`, svgoError); }

    const prefixedSvgContent = prefixSvgIds(optimizedSvgContent, baseId);

    // --- Remove Width/Height Attributes ---
    let finalSvgContent = prefixedSvgContent;
    try {
      const dom = new JSDOM(prefixedSvgContent, { contentType: "image/svg+xml" });
      const svgElement = dom.window.document.documentElement; // Get root <svg>
      if (svgElement && svgElement.tagName.toLowerCase() === 'svg') {
        // Check if viewBox exists, as it's crucial for scaling
        if (!svgElement.hasAttribute('viewBox')) {
          console.warn(`SVG for ${baseId} is missing viewBox after optimization/prefixing. Scaling might be unpredictable.`);
        }
        // Remove presentation attributes
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');
        finalSvgContent = svgElement.outerHTML; // Serialize back to string
      } else {
        console.warn(`Could not find root <svg> element for ${baseId} after prefixing. Skipping width/height removal.`);
      }
    } catch (parseError) {
      console.error(`Error parsing SVG for width/height removal (${baseId}):`, parseError);
      // Fallback to using the prefixed content if parsing fails
      finalSvgContent = prefixedSvgContent;
    }
    // --- End Remove Width/Height ---

    const dir = path.dirname(savePath);
    if (!existsSync(dir)) await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(savePath, finalSvgContent, 'utf-8');

    const colors = extractColorsFromSVG(finalSvgContent); // Extract from final content

    return { path: savePath, content: finalSvgContent, colors };
  } catch (error) {
    console.error(`Error processing SVG from ${url} for ${baseId}:`, error);
    throw error;
  }
}