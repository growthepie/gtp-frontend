// utils/clientSvgUtils.ts
import { createHash } from 'crypto-browserify'; // Use browser-compatible crypto
import {
    CustomizationMode, // Use updated type
    IconIndexEntry,
    SolidColorOverrides, // Type for derived overrides
    GradientOverrides, // Type for gradient overrides
} from '@/lib/icon-library/types'; // Adjust path

/**
 * Helper to safely get attributes, returning null if not present.
 */
const getAttr = (el: Element, attr: string): string | null => el.getAttribute(attr);

/**
 * Calculates a hash for a gradient DOM element in the browser.
 */
function getGradientElementHash(gradientElement: SVGGradientElement): string {
    // --- Hashing logic (same as before, using getAttr and crypto-browserify) ---
    const type = gradientElement.tagName.toLowerCase() === 'lineargradient' ? 'linear' : 'radial';
    const stops: Array<{ o: string; c: string | null; op: string | null }> = [];
    gradientElement.querySelectorAll('stop').forEach(stopEl => {
        stops.push({
            o: getAttr(stopEl, 'offset') ?? '0',
            c: (getAttr(stopEl, 'stop-color') ?? '#000000').toLowerCase(),
            op: getAttr(stopEl, 'stop-opacity') ?? '1',
        });
    });
    stops.sort((a, b) => parseFloat(a.o) - parseFloat(b.o));

    const structure: any = { type, stops };
    if (type === 'linear') {
        structure.coords = { x1: getAttr(gradientElement, 'x1') ?? '0', y1: getAttr(gradientElement, 'y1') ?? '0', x2: getAttr(gradientElement, 'x2') ?? '1', y2: getAttr(gradientElement, 'y2') ?? '0' };
    } else { // radial
        structure.coords = { cx: getAttr(gradientElement, 'cx') ?? '0.5', cy: getAttr(gradientElement, 'cy') ?? '0.5', r: getAttr(gradientElement, 'r') ?? '0.5', fx: getAttr(gradientElement, 'fx'), fy: getAttr(gradientElement, 'fy'), fr: getAttr(gradientElement, 'fr') };
    }
    const gradientUnits = getAttr(gradientElement, 'gradientUnits');
    const gradientTransform = getAttr(gradientElement, 'gradientTransform');
    const spreadMethod = getAttr(gradientElement, 'spreadMethod');
    const href = getAttr(gradientElement, 'href') ?? getAttr(gradientElement, 'xlink:href');
    if (gradientUnits) structure.gu = gradientUnits;
    if (gradientTransform) structure.gt = gradientTransform;
    if (spreadMethod) structure.sm = spreadMethod;
    if (href) structure.hr = href;

    const sortedStructure = Object.keys(structure).sort().reduce((acc, key) => { acc[key] = structure[key]; return acc; }, {} as any);
    const stringified = JSON.stringify(sortedStructure);
    const hash = createHash('sha256');
    hash.update(stringified);
    return hash.digest('hex').substring(0, 16);
}

/**
 * Applies customization rules to an SVG string based on the selected mode.
 * @param svgString Raw SVG.
 * @param icon Icon data (optional, maybe needed later).
 * @param mode Current customization mode.
 * @param singleColor The color to use in 'singleColorPicker' mode.
 * @param derivedSolidOverrides HSL-shifted overrides for 'customPalette' mode.
 * @param gradientOverrides Gradient stop overrides for 'customPalette' mode.
 * @returns Modified SVG string.
 */
export function applySvgCustomizations(
    svgString: string,
    icon: IconIndexEntry, // Keep icon arg for potential future use
    mode: CustomizationMode,
    singleColor: string,
    derivedSolidOverrides: SolidColorOverrides,
    gradientOverrides: GradientOverrides
): string {
    if (!svgString) return '';
    if (mode === 'original') return svgString;

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, "image/svg+xml");
        const svgElement = doc.documentElement;
        if (svgElement.querySelector('parsererror')) { console.error("SVG parse error"); return svgString; }

        const allElements = svgElement.querySelectorAll('*');
        const colorAttributes = ['fill', 'stroke', 'stop-color'];

        // --- Mode Logic ---
        allElements.forEach(el => {
            // Apply to attributes
            colorAttributes.forEach(attr => {
                const value = el.getAttribute(attr);
                const isColorAttr = attr === 'fill' || attr === 'stroke' || attr === 'stop-color'; // Refine which attrs get changed

                if (value && value !== 'none' && value !== 'transparent' && !value.startsWith('url(')) {
                    if (mode === 'currentColor' && isColorAttr) {
                        el.setAttribute(attr, 'currentColor');
                    } else if (mode === 'singleColorPicker' && isColorAttr) {
                        el.setAttribute(attr, singleColor);
                    } else if (mode === 'customPalette') {
                        // Apply HSL-derived solid overrides only to fill/stroke
                        if ((attr === 'fill' || attr === 'stroke') && derivedSolidOverrides[value.toLowerCase()]) {
                            el.setAttribute(attr, derivedSolidOverrides[value.toLowerCase()]);
                        }
                        // Gradient stop overrides are handled separately below
                    }
                }
            });

            // Apply to inline styles
            if (el instanceof SVGElement && el.style) {
                colorAttributes.forEach(attr => {
                    const styleValue = el.style.getPropertyValue(attr);
                    const isColorAttr = attr === 'fill' || attr === 'stroke' || attr === 'stop-color';

                    if (styleValue && styleValue !== 'none' && styleValue !== 'transparent' && !styleValue.startsWith('url(')) {
                        if (mode === 'currentColor' && isColorAttr) {
                            el.style.setProperty(attr, 'currentColor');
                        } else if (mode === 'singleColorPicker' && isColorAttr) {
                            el.style.setProperty(attr, singleColor);
                        } else if (mode === 'customPalette') {
                            if ((attr === 'fill' || attr === 'stroke') && derivedSolidOverrides[styleValue.toLowerCase()]) {
                                el.style.setProperty(attr, derivedSolidOverrides[styleValue.toLowerCase()]);
                            }
                        }
                    }
                });
            }
        });

        // Apply specific gradient overrides ONLY in customPalette mode
        if (mode === 'customPalette') {
            const gradients = svgElement.querySelectorAll('linearGradient, radialGradient');
            gradients.forEach(gradientEl => {
                if (gradientEl instanceof SVGGradientElement) {
                    const hash = getGradientElementHash(gradientEl);
                    const overrides = gradientOverrides[hash];
                    if (overrides?.stops) {
                        const stops = gradientEl.querySelectorAll('stop');
                        stops.forEach((stopEl, index) => {
                            if (overrides.stops[index] !== undefined) {
                                stopEl.setAttribute('stop-color', overrides.stops[index]);
                                // Optional: remove opacity if applying solid color override?
                                // stopEl.removeAttribute('stop-opacity');
                            }
                        });
                    }
                }
            });
        }

        const serializer = new XMLSerializer();
        return serializer.serializeToString(svgElement);

    } catch (error) {
        console.error("Error applying customizations:", error);
        return svgString; // Fallback
    }
}

/**
 * Converts an SVG string to a PNG Blob using the Canvas API.
 * @param svgString The SVG content as a string.
 * @param width The desired width of the PNG.
 * @param height The desired height of the PNG.
 * @returns A Promise resolving to the PNG Blob, or null if conversion fails.
 */
export async function convertSvgToPngBlob(svgString: string, width: number, height: number): Promise<Blob | null> {
    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            console.error("Failed to get 2D context for canvas.");
            resolve(null); // Indicate failure
            return;
        }

        // Create a data URL from the SVG string
        // Use btoa for Base64 encoding in the browser
        const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
        const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

        img.onload = () => {
            // Clear the canvas (important for transparent backgrounds)
            ctx.clearRect(0, 0, width, height);
            // Draw the SVG image onto the canvas
            ctx.drawImage(img, 0, 0, width, height);
            // Get the PNG blob from the canvas
            canvas.toBlob((blob) => {
                resolve(blob); // Resolve with the blob (or null if toBlob fails)
            }, 'image/png');
        };

        img.onerror = (error) => {
            console.error("Error loading SVG into image:", error);
            resolve(null); // Indicate failure
        };

        // Start loading the SVG into the Image element
        img.src = svgDataUrl;
    });
}

/**
 * Returns an SVG string with the specified width and height attributes set.
 * @param svgString The original SVG content as a string.
 * @param width The desired width of the SVG.
 * @param height The desired height of the SVG.
 * @returns A string containing the SVG with the specified width and height, or the original string if parsing fails.
 */
export const getSvgAtWidthAndHeight = (svgString: string, width: number, height: number): string => {
    if (!svgString) return '';
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, "image/svg+xml");
        const svgElement = doc.documentElement;

        // Check for parsing errors
        if (svgElement.querySelector('parsererror')) {
            console.error("SVG parse error in getSvgAtWidthAndHeight");
            return svgString; // Return original on error
        }
        if (!svgElement || svgElement.tagName.toLowerCase() !== 'svg') {
            console.error("Could not find root SVG element in getSvgAtWidthAndHeight");
            return svgString; // Return original if root SVG is not found
        }

        svgElement.setAttribute('width', width.toString());
        svgElement.setAttribute('height', height.toString());

        // Remove existing viewBox if you want the dimensions to strictly control size
        // svgElement.removeAttribute('viewBox'); // Optional: uncomment if needed

        const serializer = new XMLSerializer();
        return serializer.serializeToString(svgElement);
    } catch (error) {
        console.error("Error setting SVG width/height:", error);
        return svgString; // Fallback to original string on error
    }
}


/**
 * Triggers a browser download for the given content.
 */
export function triggerDownload(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    triggerBlobDownload(filename, blob); // Reuse blob download logic
}

/**
 * Triggers a browser download for a Blob.
 */
export function triggerBlobDownload(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}