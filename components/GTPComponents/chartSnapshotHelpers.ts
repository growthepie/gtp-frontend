import { toPng } from "html-to-image";

// 1x1 transparent GIF used as placeholder for images that fail to load
const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const FONT_VARIABLES = [
  "--font-raleway",
  "--font-inter",
  "--font-fira-sans",
  "--font-fira-mono",
  "--font-source-code-pro",
  "--font-roboto-mono",
] as const;
const SCREENSHOT_PIXEL_RATIO_MULTIPLIER = 1.5;
const SCREENSHOT_PIXEL_RATIO_MAX = 3;

/**
 * Walks up the DOM tree to find the first solid background color.
 * Falls back to the light-mode card color if nothing is found.
 */
function resolveBackgroundColor(element: HTMLElement): string {
  let el: HTMLElement | null = element;
  while (el) {
    const bg = window.getComputedStyle(el).backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
    el = el.parentElement;
  }
  return "#f0f4f4"; // fallback: light-mode --bg-default
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

type FontRuleBlock = {
  cssText: string;
  baseUrl: string;
};

// Cached by input fingerprint so late-loaded styles can still update the cache.
let fontEmbedCSSCache: { key: string; css: string } | null = null;

function toAbsoluteUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

function resolveStyleElementBaseUrl(styleEl: HTMLStyleElement): string {
  const fromDataHref = styleEl.getAttribute("data-href");
  if (fromDataHref) {
    return toAbsoluteUrl(fromDataHref, window.location.href);
  }
  if (styleEl.sheet?.href) {
    return styleEl.sheet.href;
  }
  return document.baseURI || window.location.href;
}

function resolveStyleSheetBaseUrl(sheet: CSSStyleSheet): string {
  if (sheet.href) {
    return sheet.href;
  }

  const ownerNode = sheet.ownerNode;
  if (ownerNode instanceof HTMLStyleElement) {
    return resolveStyleElementBaseUrl(ownerNode);
  }

  if (ownerNode instanceof Node && ownerNode.baseURI) {
    return ownerNode.baseURI;
  }

  return document.baseURI || window.location.href;
}

function readSnapshotFontVariables(): Record<string, string> {
  const rootComputed = window.getComputedStyle(document.documentElement);
  const fontVars: Record<string, string> = {};

  for (const variableName of FONT_VARIABLES) {
    const value = rootComputed.getPropertyValue(variableName).trim();
    if (value) {
      fontVars[variableName] = value;
    }
  }

  return fontVars;
}

type InlineStylePatch = {
  node: HTMLElement;
  styleAttribute: string | null;
};

function isTransparentColorToken(token: string): boolean {
  const normalized = token.trim().toLowerCase().replace(/\s+/g, " ");
  if (
    normalized === "transparent" ||
    normalized === "#0000" ||
    normalized === "#00000000"
  ) {
    return true;
  }

  if (/^rgba\(.+,\s*0(?:\.0+)?\)$/.test(normalized)) return true;
  if (/^hsla\(.+,\s*0(?:\.0+)?\)$/.test(normalized)) return true;
  if (/^rgb\(.+\/\s*0(?:\.0+)?\s*\)$/.test(normalized)) return true;
  if (/^hsl\(.+\/\s*0(?:\.0+)?\s*\)$/.test(normalized)) return true;
  return false;
}

function extractNonTransparentColorFromShadow(boxShadow: string): string | null {
  const matches = boxShadow.match(/(rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-fA-F]{3,8}|transparent)/g);
  if (!matches || matches.length === 0) return null;

  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const color = matches[index];
    if (!isTransparentColorToken(color)) {
      return color;
    }
  }

  return null;
}

function resolveCssColorExpression(node: HTMLElement, colorExpression: string): string | null {
  if (!colorExpression) return null;

  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.fontSize = "0";
  probe.style.color = colorExpression;
  node.appendChild(probe);
  const resolved = window.getComputedStyle(probe).color;
  probe.remove();

  if (!resolved || isTransparentColorToken(resolved)) return null;
  return resolved;
}

function patchSubpixelTailwindRingsForSnapshot(root: HTMLElement): () => void {
  const ringNodes = new Set<HTMLElement>();

  if (root.className.includes("ring-[0.5px]")) {
    ringNodes.add(root);
  }
  root
    .querySelectorAll<HTMLElement>("[class*='ring-[0.5px]']")
    .forEach((node) => ringNodes.add(node));

  if (ringNodes.size === 0) {
    return () => {};
  }

  const patches: InlineStylePatch[] = [];
  ringNodes.forEach((node) => {
    const computed = window.getComputedStyle(node);
    const ringColorExpression = computed.getPropertyValue("--tw-ring-color").trim();
    const resolvedRingColor =
      resolveCssColorExpression(node, ringColorExpression) ??
      extractNonTransparentColorFromShadow(computed.boxShadow);

    patches.push({
      node,
      styleAttribute: node.getAttribute("style"),
    });

    // Screenshot-only replacement: convert Tailwind ring to an actual border so
    // sub-pixel strokes survive rasterization in html-to-image.
    node.style.boxShadow = "none";
    if (resolvedRingColor) {
      node.style.borderStyle = "solid";
      node.style.borderWidth = "0.5px";
      node.style.borderColor = resolvedRingColor;
    } else {
      // Fallback requested by design: if ring color cannot be resolved, hide it.
      node.style.borderStyle = "solid";
      node.style.borderWidth = "0";
      node.style.borderColor = "transparent";
    }
  });

  return () => {
    patches.forEach(({ node, styleAttribute }) => {
      if (styleAttribute === null) {
        node.removeAttribute("style");
      } else {
        node.setAttribute("style", styleAttribute);
      }
    });
  };
}

async function waitForSnapshotFonts(): Promise<void> {
  if (!("fonts" in document)) return;

  const rootComputed = window.getComputedStyle(document.documentElement);
  const fontFamilies = FONT_VARIABLES.map((variableName) =>
    rootComputed.getPropertyValue(variableName).split(",")[0]?.trim(),
  ).filter((familyName): familyName is string => Boolean(familyName));

  await Promise.allSettled(
    fontFamilies.map((familyName) =>
      document.fonts.load(`400 16px ${familyName}`, "0123456789AaBb"),
    ),
  );

  await document.fonts.ready;
}

/**
 * Collects every @font-face block visible to the page using three strategies:
 *
 *  1. Raw textContent of inline <style> elements — catches Next.js App Router
 *     font injections which land as <style> tags in the <head>.
 *  2. document.styleSheets cssRules — catches same-origin <link> stylesheets.
 *  3. document.adoptedStyleSheets — catches CSS-in-JS / framework sheets that
 *     bypass the traditional stylesheet list.
 *
 * Each discovered @font-face block has its URL(s) replaced with base64 data
 * URIs so the SVG foreignObject renderer can use them without network access.
 * The result is passed as `fontEmbedCSS` to toPng, which inserts it as a
 * <style> element in the cloned tree and skips its own (buggy) font fetcher.
 */
async function buildFontEmbedCSS(): Promise<string> {
  const fontRuleBlocks = new Map<string, FontRuleBlock>();
  const addFontRuleBlock = (cssText: string, baseUrl: string) => {
    const normalizedCssText = cssText.trim();
    if (!normalizedCssText) return;
    const normalizedBaseUrl = baseUrl || window.location.href;
    const key = `${normalizedBaseUrl}::${normalizedCssText}`;
    if (!fontRuleBlocks.has(key)) {
      fontRuleBlocks.set(key, { cssText: normalizedCssText, baseUrl: normalizedBaseUrl });
    }
  };

  // Strategy 1: raw text from inline <style> elements
  for (const styleEl of Array.from(document.querySelectorAll("style"))) {
    const text = styleEl.textContent ?? "";
    const baseUrl = resolveStyleElementBaseUrl(styleEl);
    for (const match of text.matchAll(/@font-face\s*\{[^}]*\}/gs)) {
      addFontRuleBlock(match[0], baseUrl);
    }
  }

  // Strategy 2: document.styleSheets (same-origin <link> sheets)
  const sheets: CSSStyleSheet[] = Array.from(document.styleSheets);

  // Strategy 3: adoptedStyleSheets (framework-injected sheets)
  if ("adoptedStyleSheets" in document) {
    sheets.push(
      ...(document as Document & { adoptedStyleSheets: CSSStyleSheet[] })
        .adoptedStyleSheets,
    );
  }

  for (const sheet of sheets) {
    const baseUrl = resolveStyleSheetBaseUrl(sheet);
    let cssRules: CSSRuleList;
    try {
      cssRules = sheet.cssRules;
    } catch {
      // Cross-origin stylesheet — skip
      continue;
    }
    for (const rule of Array.from(cssRules)) {
      if (rule instanceof CSSFontFaceRule) {
        addFontRuleBlock(rule.cssText, baseUrl);
      }
    }
  }

  const cacheKey = [...fontRuleBlocks.keys()].sort().join("|");
  if (fontEmbedCSSCache && fontEmbedCSSCache.key === cacheKey) {
    return fontEmbedCSSCache.css;
  }

  console.log(
    `[chartSnapshot] Found ${fontRuleBlocks.size} @font-face rules to embed`,
  );

  // Inline each font URL as a base64 data URI
  const embedded = await Promise.all(
    [...fontRuleBlocks.values()].map(async ({ cssText, baseUrl }) => {
      let result = cssText;
      for (const match of [...result.matchAll(/url\(["']?([^"')]+)["']?\)/g)]) {
        const rawUrl = match[1]?.trim();
        if (!rawUrl || rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) continue;
        const absoluteUrl = toAbsoluteUrl(rawUrl, baseUrl);
        try {
          const resp = await fetch(absoluteUrl);
          if (!resp.ok) continue;
          const dataUrl = await blobToDataUrl(await resp.blob());
          result = result.replace(match[0], `url("${dataUrl}")`);
        } catch {
          // Can't fetch this URL — leave the original src as-is
        }
      }
      return result;
    }),
  );

  const css = embedded.join("\n");
  if (css.trim().length > 0) {
    fontEmbedCSSCache = { key: cacheKey, css };
  }
  return css;
}

/**
 * Downloads the given DOM element as a PNG image.
 *
 * Uses html-to-image which inlines all computed styles (resolving CSS custom
 * properties) and captures <canvas> elements via toDataURL(), making it
 * far more reliable than html2canvas for apps with CSS variables and ECharts.
 *
 * Any element with `data-screenshot-exclude="true"` will be omitted from
 * the output (useful for buttons, tooltips, etc.).
 */
export async function downloadElementAsImage(
  element: HTMLElement,
  label: string,
): Promise<void> {
  if (typeof window === "undefined") return;

  // Ensure all fonts are fully loaded before capturing
  await waitForSnapshotFonts();

  // Let the browser finish any pending layout/paint work
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

  const fontEmbedCSS = await buildFontEmbedCSS();
  const baseDevicePixelRatio = Math.max(window.devicePixelRatio || 1, 1);
  const screenshotPixelRatio = Math.min(
    baseDevicePixelRatio * SCREENSHOT_PIXEL_RATIO_MULTIPLIER,
    SCREENSHOT_PIXEL_RATIO_MAX,
  );

  const options = {
    pixelRatio: screenshotPixelRatio,
    backgroundColor: resolveBackgroundColor(element),
    imagePlaceholder: TRANSPARENT_PIXEL,
    fontEmbedCSS,
    style: {
      animation: "none",
      transition: "none",
      ...readSnapshotFontVariables(),
    },
    filter: (node: Node) => {
      if (node instanceof HTMLElement) {
        return node.dataset.screenshotExclude !== "true";
      }
      return true;
    },
  };

  const restoreSubpixelRings = patchSubpixelTailwindRingsForSnapshot(element);
  let dataUrl: string | null = null;
  try {
    dataUrl = await toPng(element, options);
  } catch (err) {
    console.error("[chartSnapshot] toPng failed:", err);
  } finally {
    restoreSubpixelRings();
  }
  if (!dataUrl) return;

  const metricSlug =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "metric";
  const dateStamp = new Date().toISOString().slice(0, 10);

  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = `growthepie-${metricSlug}-${dateStamp}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
