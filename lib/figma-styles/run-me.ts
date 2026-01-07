/* 
  Currently this script pulls the styles from Figma and saves them to the lib/figma-styles/output directory.
  It then uses the cache file to generate the Tailwind theme files.
  It also generates the CSS variables file.

  Currently a manual process to copy code from lib/figma-styles/output/figma-presets.js to figma-styles.config.js.
  tailwind.config.js imports figma-styles.config.js and uses the presets.
*/

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CACHE_DIR = path.resolve(__dirname, "./output");

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const STYLES_CACHE_FILE = path.resolve(CACHE_DIR, "styles.json");
const TOKENS_CACHE_FILE = path.resolve(CACHE_DIR, "tokens.json");

// Load environment variables
dotenv.config({ path: ".env.local" });

const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN as string;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY as string;

if (!FIGMA_ACCESS_TOKEN || !FIGMA_FILE_KEY) {
  console.error(
    "Missing FIGMA_ACCESS_TOKEN or FIGMA_FILE_KEY in environment variables.",
  );
  process.exit(1);
}

async function getCachedData(cacheFile: string) {
  if (fs.existsSync(cacheFile)) {
    return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  }
  return null;
}

async function saveCachedData(cacheFile: string, data: any) {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
    console.log(`✅ Cached data saved to ${path.basename(cacheFile)}`);
  } catch (error) {
    console.error(`❌ Failed to save cache to ${cacheFile}:`, error.message);
  }
}

async function fetchFromFigma(endpoint: string) {
  const response = await fetch(`https://api.figma.com/v1/${endpoint}`, {
    headers: {
      'X-Figma-Token': FIGMA_ACCESS_TOKEN
    }
  });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchStylesData() {
  const cachedData = await getCachedData(STYLES_CACHE_FILE);
  if (cachedData) {
    console.log("📦 Using cached styles data");
    return cachedData;
  }

  console.log("🔄 Fetching styles from Figma API...");
  const data = await fetchFromFigma(`files/${FIGMA_FILE_KEY}/styles`);
  await saveCachedData(STYLES_CACHE_FILE, data);
  return data;
}

async function fetchStyleNodes(nodeIds: string[]) {
  console.log(`🔄 Fetching ${nodeIds.length} style nodes from Figma...`);
  
  // Fetch nodes in batches to avoid URL length limits
  const batchSize = 50;
  const allNodes: any = {};
  
  for (let i = 0; i < nodeIds.length; i += batchSize) {
    const batch = nodeIds.slice(i, i + batchSize);
    const ids = batch.join(',');
    
    try {
      const data = await fetchFromFigma(`files/${FIGMA_FILE_KEY}/nodes?ids=${ids}`);
      Object.assign(allNodes, data.nodes);
      console.log(`  ✅ Fetched batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(nodeIds.length / batchSize)}`);
    } catch (error) {
      console.error(`  ❌ Failed to fetch batch: ${error.message}`);
    }
  }
  
  return allNodes;
}

interface DesignTokens {
  colors: Array<{ name: string; value: string }>;
  gradients: Array<{ name: string; value: string }>;
  fonts: Array<{ name: string; fontFamily: string }>;
  typeStyles: Array<{
    name: string;
    fontFamily: string;
    fontSize: string;
    fontWeight?: number;
    lineHeight: string;
    letterSpacing: string;
  }>;
  spacePatterns: Array<{ name: string; value: string }>;
}

function rgbaToHex(color: any, opacity: number = 1): string {
  const r = Math.round((color.r || 0) * 255);
  const g = Math.round((color.g || 0) * 255);
  const b = Math.round((color.b || 0) * 255);
  const a = Math.round(opacity * 255);
  
  const hex = '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
  
  if (a < 255) {
    const alphaHex = a.toString(16).padStart(2, '0');
    return hex + alphaHex;
  }
  
  return hex;
}

function gradientToCSS(gradientHandles: any[], gradientStops: any[]): string {
  if (!gradientStops || gradientStops.length === 0) return '';
  
  // Calculate angle from handles (default to 90deg for horizontal)
  let angle = 90;
  if (gradientHandles && gradientHandles.length >= 2) {
    const dx = gradientHandles[1].x - gradientHandles[0].x;
    const dy = gradientHandles[1].y - gradientHandles[0].y;
    angle = Math.round(Math.atan2(dy, dx) * 180 / Math.PI);
  }
  
  const stops = gradientStops.map(stop => {
    const color = rgbaToHex(stop.color, stop.color.a !== undefined ? stop.color.a : 1);
    const position = (stop.position * 100).toFixed(2);
    return `${color} ${position}%`;
  }).join(',');
  
  return `linear-gradient(${angle}deg, ${stops})`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '-')      // Replace non-word chars with -
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
}

async function extractDesignTokens(): Promise<DesignTokens> {
  try {
    // Check if we have cached tokens
    const cachedTokens = await getCachedData(TOKENS_CACHE_FILE);
    if (cachedTokens) {
      console.log("📦 Using cached tokens");
      return cachedTokens;
    }
    
    const stylesData = await fetchStylesData();

    if (!stylesData.meta?.styles?.length) {
      console.error("No styles found in the file.");
      return {
        colors: [],
        gradients: [],
        fonts: [],
        typeStyles: [],
        spacePatterns: []
      };
    }

    console.log(`📊 Found ${stylesData.meta.styles.length} styles`);

    // Extract tokens
    const tokens: DesignTokens = {
      colors: [],
      gradients: [],
      fonts: [],
      typeStyles: [],
      spacePatterns: []
    };
    
    // Get unique node IDs for all styles
    const nodeIds = [...new Set(stylesData.meta.styles.map(style => style.node_id))];
    const nodes = await fetchStyleNodes(nodeIds as string[]);
    
    // Process color styles
    const colorStyles = stylesData.meta.styles.filter(style => style.style_type === 'FILL');
    console.log(`🎨 Processing ${colorStyles.length} color styles...`);
    
    for (const style of colorStyles) {
      const nodeData = nodes[style.node_id];
      if (!nodeData) continue;
      
      const node = nodeData.document;
      if (node?.fills) {
        for (const fill of node.fills) {
          if (fill.visible === false) continue;
          
          if (fill.type === 'SOLID') {
            tokens.colors.push({
              name: slugify(style.name),
              value: rgbaToHex(fill.color, fill.opacity)
            });
          } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
            tokens.gradients.push({
              name: slugify(style.name),
              value: gradientToCSS(fill.gradientHandlePositions, fill.gradientStops)
            });
          }
        }
      }
    }
    
    // Process text styles
    const textStyles = stylesData.meta.styles.filter(style => style.style_type === 'TEXT');
    console.log(`📝 Processing ${textStyles.length} text styles...`);
    
    const uniqueFonts = new Set<string>();
    
    for (const style of textStyles) {
      const nodeData = nodes[style.node_id];
      if (!nodeData) continue;
      
      const node = nodeData.document;
      if (node?.style) {
        const textStyle = node.style;
        
        // Create type style entry
        const typeStyle: any = {
          name: slugify(style.name),
          fontFamily: textStyle.fontFamily || 'Inter',
          fontSize: `${textStyle.fontSize || 16}px`,
          lineHeight: 'normal',
          letterSpacing: '0em'
        };
        
        // Add font weight if available
        if (textStyle.fontWeight) {
          typeStyle.fontWeight = textStyle.fontWeight;
        }
        
        // Handle line height
        if (textStyle.lineHeightPx) {
          typeStyle.lineHeight = `${textStyle.lineHeightPx}px`;
        } else if (textStyle.lineHeightPercent) {
          typeStyle.lineHeight = `${textStyle.lineHeightPercent}%`;
        } else if (textStyle.lineHeightPercentFontSize) {
          typeStyle.lineHeight = `${textStyle.lineHeightPercentFontSize / 100}em`;
        }
        
        // Handle letter spacing
        if (textStyle.letterSpacing) {
          if (textStyle.letterSpacing.unit === 'PIXELS') {
            typeStyle.letterSpacing = `${textStyle.letterSpacing.value}px`;
          } else if (textStyle.letterSpacing.unit === 'PERCENT') {
            typeStyle.letterSpacing = `${textStyle.letterSpacing.value / 100}em`;
          }
        }
        
        tokens.typeStyles.push(typeStyle);
        
        // Track unique fonts
        uniqueFonts.add(textStyle.fontFamily || 'Inter');
      }
    }
    
    // Create font entries
    uniqueFonts.forEach(fontFamily => {
      tokens.fonts.push({
        name: slugify(fontFamily),
        fontFamily: fontFamily
      });
    });
    
    // Sort tokens for consistent output
    tokens.colors.sort((a, b) => a.name.localeCompare(b.name));
    tokens.gradients.sort((a, b) => a.name.localeCompare(b.name));
    tokens.fonts.sort((a, b) => a.name.localeCompare(b.name));
    tokens.typeStyles.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log('\n📊 Token Summary:');
    console.log(`  - Colors: ${tokens.colors.length}`);
    console.log(`  - Gradients: ${tokens.gradients.length}`);
    console.log(`  - Fonts: ${tokens.fonts.length}`);
    console.log(`  - Type Styles: ${tokens.typeStyles.length}`);
    
    // Save tokens to cache
    await saveCachedData(TOKENS_CACHE_FILE, tokens);
    
    return tokens;
  } catch (error) {
    console.error('❌ Error extracting tokens:', error);
    throw error;
  }
}

// Import Tailwind generation functions
import { generateTailwindFiles, generateCSSVariables } from './figma-to-tailwind';

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Figma token extraction...\n');
    
    const tokens = await extractDesignTokens();
    
    // Save to output file to the cache directory
    const outputPath = path.resolve(CACHE_DIR, 'figma-tokens.json');
    fs.writeFileSync(outputPath, JSON.stringify(tokens, null, 2));
    
    console.log(`\n✅ Tokens saved to: ${outputPath}`);
    
    // Generate Tailwind theme files
    console.log('\n🎨 Generating Tailwind theme files...');
    generateTailwindFiles(tokens);
    generateCSSVariables(tokens);
    
    console.log('\n✨ All done! Your design system is ready to use.');
    
    // Optional: Clear cache if you want fresh data next time
    // fs.rmSync(CACHE_DIR, { recursive: true, force: true });
    
  } catch (error) {
    console.error('\n❌ Extraction failed:', error);
    process.exit(1);
  }
}

// Export for testing
export { extractDesignTokens };

main();