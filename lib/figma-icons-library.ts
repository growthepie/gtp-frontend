export { };

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { createHash } from 'crypto';
import { downloadSVG } from './icon-library/nodeSvgUtils';
import { SVGResult, GradientInfo, IconLibraryData, UniqueGradientStructure } from './icon-library/types';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure dotenv
dotenv.config({ path: ".env.local" });

const outputDir = path.resolve(__dirname, "../public/icon-library/");

// Access environment variables directly from process.env
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN as string;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY as string;

if (!FIGMA_ACCESS_TOKEN || !FIGMA_FILE_KEY) {
  console.error(
    "Missing FIGMA_ACCESS_TOKEN or FIGMA_FILE_KEY in environment variables.",
  );
  process.exit(1);
}

// --- Interfaces ---
interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
}

// Keep FigmaFileResponse if you still fetch the whole file initially
// interface FigmaFileResponse { ... }

interface VariantInfo {
  color?: string;
  size?: string;
  node: FigmaNode; // Make node required if always present
}

interface OrganizedItem {
  type: string; // 'icons' or 'logos'
  category?: string;
  name: string; // Kebab-case name of the component set
  variants?: VariantInfo[];
}

// --- Index File Structure ---
export interface IconIndexEntry {
  type: string; // 'icons' or 'logos'
  category: string;
  name: string; // Kebab-case name
  filePath: string; // Relative path within outputDir
  figmaNodeId: string;
  solidColors: string[]; // Keep the list of solid colors used by this specific icon
  gradientRefs: string[]; // List of unique gradient structure hashes used by this icon
}


/**
 * Fetches the Figma file data.
 * @param fileKey The key of the Figma file.
 * @param accessToken Your Figma access token.
 * @returns The Figma file data.
 */
async function fetchFigmaFile(
  fileKey: string,
  accessToken: string,
): Promise<FigmaFileResponse> {
  const url = `https://api.figma.com/v1/files/${fileKey}`;

  try {
    const response = await fetch(url, {
      headers: {
        "X-Figma-Token": accessToken,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Figma API responded with status ${response.status}: ${response.statusText}`,
      );
    }

    const data: FigmaFileResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Figma file:", error);
    throw error;
  }
}

// ... (keep fetchSVGUrls, find*NodeById functions) ...
async function fetchSVGUrls(
  fileKey: string,
  accessToken: string,
  nodeIds: string[],
): Promise<{ [id: string]: string | null }> { // Allow null for failed exports
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${nodeIds.join(
    ",",
  )}&format=svg`;

  console.log(`Requesting ${nodeIds.length} SVG URLs from Figma...`);

  try {
    const response = await fetch(url, {
      headers: {
        "X-Figma-Token": accessToken,
      },
    });

    if (!response.ok) {
      // Log more details on failure
      const errorBody = await response.text();
      console.error(`Figma Images API Error Response (${response.status}): ${errorBody}`);
      throw new Error(
        `Figma Images API responded with status ${response.status}: ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (data.err) {
      // Figma API sometimes returns 200 OK with an error object
      console.error("Figma Images API returned an error object:", data.err);
      throw new Error(`Figma API error: ${data.err}`);
    }

    // Handle cases where some images might fail to export (returns null for that id)
    if (data.images && typeof data.images === 'object') {
      for (const nodeId in data.images) {
        if (data.images[nodeId] === null) {
          console.warn(`Figma could not export SVG for node ID: ${nodeId}. It might be empty or invalid.`);
        }
      }
      return data.images;
    } else {
      console.error("Unexpected response structure from Figma Images API:", data);
      throw new Error("Invalid response format from Figma Images API");
    }
  } catch (error) {
    console.error("Error fetching SVG URLs:", error);
    // Don't re-throw immediately, maybe return an empty object or partial results
    // For simplicity now, we re-throw, but consider resilience.
    throw error;
  }
}


// --- Utility Functions ---
function toKebabCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Add hyphen between camelCase
    .replace(/[\s_]+/g, '-')           // Replace spaces and underscores with hyphens
    .replace(/[^a-zA-Z0-9-]+/g, '')   // Remove invalid characters
    .toLowerCase();                   // Convert to lowercase
}

function findPageNodeById(nodes: FigmaNode[], id: string): FigmaNode | undefined {
  return nodes.find((child) => child.id === id);
}
function findFrameNodeById(node: FigmaNode, id: string): FigmaNode | undefined {
  return node.children?.find((child) => child.id === id);
}
function findNodeById(node: FigmaNode, id: string): FigmaNode | undefined {
  return node.children?.find((child) => child.id === id);
}

// ... (keep Figma IDs) ...
const ICONS_AND_LOGOS_PAGE_ID = "21411:73871"
const ICONS_AND_LOGOS_FRAME_ID = "21411:74021"
const GROWTHEPIE_ICONS_NODE_ID = "21411:74022"
const LOGOS_NODE_ID = "21411:74172"


function extractVariant(node: FigmaNode): VariantInfo | null {
  let color: string | undefined = undefined;
  let size: string | undefined = undefined;
  const name = node.name || '';

  if (name.includes('=')) {
    const params = name.split(',').map(param => param.trim());
    params.forEach(param => {
      const [key, value] = param.split('=').map(part => part.trim());
      if (key === 'Color') {
        color = value;
      } else if (key === 'Size') {
        size = value;
      }
      // Add more variant properties if needed
    });
  }

  // Return null if essential info (like size) is missing, or adjust as needed
  // if (!size) return null;

  return { color, size, node };
}

function organizeChildNodes(type: string, nodes: FigmaNode[]): OrganizedItem[] {
  const reversedCollection: OrganizedItem[] = []; // Collect items in reverse order first
  let currentCategory: string | undefined = "uncategorized"; // Default category

  // Create a reversed copy to iterate over without modifying the original nodes array
  const reversedNodes = [...nodes].reverse();

  for (const child of reversedNodes) {
    if (child.type === "TEXT") {
      // Clean and set the category name - this will apply to subsequent items in this reversed loop
      // (which are the items *preceding* this TEXT node in the original Figma order)
      const cleanedCategory = child.name?.replace(/[^A-Za-z0-9\s]/g, '').trim();
      // Optional: kebab-case the category name for consistency
      currentCategory = cleanedCategory ? toKebabCase(cleanedCategory) : "uncategorized";
      continue; // Skip adding text nodes to the collection
    }

    // Skip explicitly private categories if needed (check the category set by a preceding TEXT node)
    if (currentCategory === "private") {
      continue;
    }

    if (child.type === "COMPONENT" || child.type === "COMPONENT_SET") {
      let name = child.name || `unnamed-${child.id}`;
      let variants: VariantInfo[] = [];

      if (child.type === "COMPONENT_SET") {
        name = toKebabCase(name.replace(/^GTP-/i, "")); // Kebab-case name
        variants = child.children
          ?.map(variantNode => extractVariant(variantNode))
          .filter((v): v is VariantInfo => v !== null)
          ?? [];
      } else if (child.type === "COMPONENT") {
        name = toKebabCase(name.replace(/^GTP-/i, ""));
        // Treat standalone component as a single variant
        const variantInfo = extractVariant(child); // Apply variant parsing logic if name has props
        variants = variantInfo ? [variantInfo] : [{ node: child, size: 'Default', color: 'Default' }];
      }


      // Add the item with the category determined by the *last seen* TEXT node in this reversed iteration
      if (variants.length > 0 || child.type === "COMPONENT") {
        reversedCollection.push({
          type,
          // CRITICAL: Assign the category found from the TEXT node processed *before* this component in the reversed list
          category: currentCategory,
          name, // Already kebab-cased
          variants,
        });
      }
      // IMPORTANT: Do NOT reset the category here. Let it persist until the next TEXT node is found.
    }
  }

  // Reverse the collection back to match the original Figma order
  return reversedCollection.reverse();
}


/**
 * Creates a stable hash for a gradient structure, ignoring the instance-specific ID.
 * Sorts stops and relevant properties to ensure consistency.
 */
function getGradientStructureHash(gradient: GradientInfo): string {
  const structure: any = {
    type: gradient.type,
    stops: gradient.stops.map(s => ({ o: s.offset, c: s.color, op: s.opacity })), // Use shorter keys for smaller hash input
    // Include only relevant coords based on type
  };

  // Add type-specific coordinates, using default values if missing for consistency
  if (gradient.type === 'linear') {
    structure.coords = {
      x1: gradient.x1 ?? '0',
      y1: gradient.y1 ?? '0',
      x2: gradient.x2 ?? '1',
      y2: gradient.y2 ?? '0',
    };
  } else if (gradient.type === 'radial') {
    structure.coords = {
      cx: gradient.cx ?? '0.5',
      cy: gradient.cy ?? '0.5',
      r: gradient.r ?? '0.5',
      fx: gradient.fx, // Include focal points if they exist
      fy: gradient.fy,
      fr: gradient.fr,
    };
  }

  // Include units and transform if they exist
  if (gradient.gradientUnits) structure.gu = gradient.gradientUnits;
  if (gradient.gradientTransform) structure.gt = gradient.gradientTransform;
  if (gradient.spreadMethod) structure.sm = gradient.spreadMethod;
  if (gradient.href) structure.hr = gradient.href; // Handle linked gradients

  // Sort keys of the structure object for deterministic stringify
  const sortedStructure = Object.keys(structure)
    .sort()
    .reduce((acc, key) => {
        acc[key] = structure[key];
        return acc;
        }, {} as any);


  // Use JSON.stringify for serialization before hashing
  const stringified = JSON.stringify(sortedStructure);
  return createHash('sha256').update(stringified).digest('hex').substring(0, 16); // Use first 16 chars of SHA256 hash
}


/**
 * Main function to orchestrate fetching and saving SVGs for "small" variants.
 */
async function main() {
  try {
    console.log("Loading Figma file data...");

    // --- Option 1: Fetch live data (uncomment when needed) ---
    const figmaData = await fetchFigmaFile(FIGMA_FILE_KEY, FIGMA_ACCESS_TOKEN);
    // await fs.writeFile(path.join(__dirname, "../figmaData-cache.json"), JSON.stringify(figmaData, null, 2), 'utf-8');

    // --- Option 2: Read cached data ---
    // const cacheFilePath = path.join(__dirname, "../figmaData-stream.json"); // Or your cache file name
    // if (!existsSync(cacheFilePath)) {
    //   console.error(`Error: Figma data cache file not found at ${cacheFilePath}`);
    //   console.log("Please run the script once with live fetching enabled to create the cache, or provide the file.");
    //   process.exit(1);
    // }
    // const rawFigmaData = await fs.readFile(cacheFilePath, "utf-8");
    // const figmaData = JSON.parse(rawFigmaData);
    // console.log("Figma data loaded from cache."); // Less verbose log


    if (!figmaData.document?.children) {
      console.error('Valid Figma document structure not found in cached data.');
      return;
    }

    // --- Find the relevant nodes ---
    const pageNode = findPageNodeById(figmaData.document.children, ICONS_AND_LOGOS_PAGE_ID);
    if (!pageNode) throw new Error(`Page node ${ICONS_AND_LOGOS_PAGE_ID} not found.`);
    console.log(`Found Page: ${pageNode.name}`);

    const frameNode = findFrameNodeById(pageNode, ICONS_AND_LOGOS_FRAME_ID);
    if (!frameNode) throw new Error(`Frame node ${ICONS_AND_LOGOS_FRAME_ID} not found.`);
    console.log(`Found Frame: ${frameNode.name}`);

    const iconsNode = findNodeById(frameNode, GROWTHEPIE_ICONS_NODE_ID);
    if (!iconsNode) throw new Error(`Icons node ${GROWTHEPIE_ICONS_NODE_ID} not found.`);
    console.log(`Found Icons Node: ${iconsNode.name}`);

    const logosNode = findNodeById(frameNode, LOGOS_NODE_ID);
    if (!logosNode) throw new Error(`Logos node ${LOGOS_NODE_ID} not found.`);
    console.log(`Found Logos Node: ${logosNode.name}`);


    // --- Organize nodes and filter for "Small" variants ---
    const organizedIcons = iconsNode.children ? organizeChildNodes("icons", iconsNode.children) : [];
    const organizedLogos = logosNode.children ? organizeChildNodes("logos", logosNode.children) : [];

    const allOrganizedItems = [...organizedIcons, ...organizedLogos];

    // Structure to hold info for variants we actually want to fetch
    const variantsToFetch: {
      nodeId: string;
      type: string;
      category: string;
      name: string; // Kebab-case name of the component set
      originalVariant: VariantInfo; // Keep original info if needed later
    }[] = [];

    console.log(`Organized ${organizedIcons.length} icon sets and ${organizedLogos.length} logo sets.`);

    for (const item of allOrganizedItems) {
      // log the size of the variants
      console.log(`Variants for ${item.name}:`, item.variants?.map(v => v.size));
      const smallVariant = item.variants?.find(v => v.size === "Small" || v.size === "small");
      if (smallVariant?.node?.id) {
        variantsToFetch.push({
          nodeId: smallVariant.node.id,
          type: item.type,
          category: item.category || 'uncategorized', // Ensure category exists
          name: item.name, // Already kebab-cased
          originalVariant: smallVariant
        });
      } else if (item.variants && item.variants.length > 0 && !item.variants.some(v => v.size)) {
        // Handle component sets where no size variant is defined (take the first one?)
        // Or component nodes that were treated as single variants
        const defaultVariant = item.variants[0];
        if (defaultVariant?.node?.id && item.type === 'icons') { // Example: Only do this for icons
          console.warn(`Component set '${item.name}' has no 'Small' variant, using first available variant.`);
          variantsToFetch.push({
            nodeId: defaultVariant.node.id,
            type: item.type,
            category: item.category || 'uncategorized',
            name: item.name,
            originalVariant: defaultVariant
          });
        }
      } else {
        // Log items skipped if needed for debugging
        // console.log(`Skipping '${item.name}': No 'Small' variant found.`);
      }
    }

    console.log(`Identified ${variantsToFetch.length} 'Small' (or default) variants to download.`);

    if (variantsToFetch.length === 0) {
      console.log("No 'Small' variants found to process. Exiting.");
      return;
    }

    // --- Prepare output directory and index ---
    if (!existsSync(outputDir)) {
      await fs.mkdir(outputDir, { recursive: true });
    }
    const intermediateIconData: Array<IconIndexEntry & { rawColors: SVGResult['colors'] }> = [];

    // --- Process in batches ---
    const batchSize = 100; // Keep batching for API politeness
    for (let i = 0; i < variantsToFetch.length; i += batchSize) {
      const batch = variantsToFetch.slice(i, i + batchSize);
      const nodeIdsInBatch = batch.map(v => v.nodeId);
      console.log(`\nProcessing Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(variantsToFetch.length / batchSize)} (${nodeIdsInBatch.length} items)`);
      if (nodeIdsInBatch.length === 0) continue;

      const nodeMap = new Map(batch.map(item => [item.nodeId, item]));
      const svgUrls = await fetchSVGUrls(FIGMA_FILE_KEY, FIGMA_ACCESS_TOKEN, nodeIdsInBatch);

      // Use Promise.all for concurrent downloads within the batch
      const batchPromises = Object.entries(svgUrls).map(async ([nodeId, url]) => {
        if (!url) {
          console.warn(`Skipping node ${nodeId} as Figma did not provide a URL.`);
          return null; // Skip if no URL
        }
        const itemInfo = nodeMap.get(nodeId);
        if (!itemInfo) {
          console.warn(`Orphaned SVG URL for node ID ${nodeId}. Skipping.`);
          return null;
        }

        const categoryDir = path.join(outputDir, itemInfo.type, itemInfo.category);
        const filename = `${itemInfo.name}.svg`;
        const savePath = path.join(categoryDir, filename);
        const relativePath = path.relative(outputDir, savePath).replace(/\\/g, '/');
        const baseIdForPrefixing = `${itemInfo.type}-${itemInfo.category}-${itemInfo.name}`; 

        try {
          const svgResult = await downloadSVG(url as string, savePath, baseIdForPrefixing);
          // Temporarily store raw colors along with other data
          return {
            type: itemInfo.type,
            category: itemInfo.category,
            name: itemInfo.name,
            filePath: relativePath,
            figmaNodeId: nodeId,
            rawColors: svgResult.colors, // Store colors extracted by svgUtils
            solidColors: [], // Initialize solidColors - will be filled later
            gradientRefs: [] // Initialize gradientRefs - will be filled later
          };
        } catch (error) {
          console.error(`Failed to process SVG for ${itemInfo.type}/${itemInfo.category}/${itemInfo.name} (Node ${nodeId}):`, error?.message ?? error);
          return null; // Indicate failure for this item
        }
      });

      // Wait for all promises in the batch to resolve and filter out nulls (failures/skips)
      const batchResults = (await Promise.all(batchPromises)).filter(result => result !== null);
      intermediateIconData.push(...batchResults as Array<IconIndexEntry & { rawColors: SVGResult['colors'] }>);

      // Optional delay between batches
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    // --- Aggregate Unique Colors and Gradients ---
    console.log("\nAggregating color palette...");
    const allSolidColors = new Set<string>();
    const uniqueGradientMap = new Map<string, UniqueGradientStructure>(); // Map hash -> UniqueGradientStructure

    // Process intermediate data to populate gradientRefs and unique collections
    const finalIconIndex: IconIndexEntry[] = intermediateIconData.map(item => {
      const gradientRefs: string[] = [];

      // Add solid colors to global set
      item.rawColors.solidColors.forEach(color => allSolidColors.add(color));

      // Process gradients: get hash, add to unique map, store ref
      item.rawColors.gradients.forEach(gradient => {
        // Important: Ensure the gradient extracted by svgUtils is valid before hashing
        if (!gradient || typeof gradient !== 'object' || !gradient.type || !Array.isArray(gradient.stops)) {
          console.warn(`Skipping invalid gradient structure found in ${item.name}:`, gradient);
          return;
        }

        const hash = getGradientStructureHash(gradient);
        gradientRefs.push(hash);

        if (!uniqueGradientMap.has(hash)) {
          // Create the UniqueGradientStructure (omit 'id', add 'hash')
          const { id, ...structure } = gradient;
          uniqueGradientMap.set(hash, { ...structure, hash });
        }
      });

      // Return the final IconIndexEntry structure (without rawColors)
      return {
        type: item.type,
        category: item.category,
        name: item.name,
        filePath: item.filePath,
        figmaNodeId: item.figmaNodeId,
        solidColors: item.rawColors.solidColors, // Keep solid colors per icon
        gradientRefs: gradientRefs, // Store references to unique gradients
      };
    });

    // Convert Set and Map values to arrays for JSON
    const uniqueSolidColorsArray = Array.from(allSolidColors).sort();
    const uniqueGradientsArray = Array.from(uniqueGradientMap.values());

    // --- Construct Final Data Structure ---
    const finalData: IconLibraryData = {
      icons: finalIconIndex,
      palette: {
        uniqueSolidColors: uniqueSolidColorsArray,
        uniqueGradients: uniqueGradientsArray,
      },
    };

    // --- Save the final index file ---
    const indexFilePath = path.join(outputDir, "index.json");
    await fs.writeFile(indexFilePath, JSON.stringify(finalData, null, 2), 'utf-8');

    console.log(`\n✅ Successfully processed ${finalIconIndex.length} icons/logos.`);
    console.log(`🎨 Found ${uniqueSolidColorsArray.length} unique solid colors.`);
    console.log(`🎨 Found ${uniqueGradientsArray.length} unique gradient structures.`);
    console.log(`✅ Index and palette saved to: ${indexFilePath}`);
    console.log(`✅ Optimized SVGs saved within: ${outputDir}/`);

  } catch (error) {
    console.error("\n❌ An error occurred during the process:", error);
    process.exit(1);
  }
}

// --- Execute ---
main();