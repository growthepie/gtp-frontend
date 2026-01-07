// lib/figma.ts
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { inspect, promisify } from "util";
import { gunzip, gzip } from "zlib";
import dotenv from "dotenv";
// @ts-ignore
import { CLI, COLORS } from "./cli.mjs";

// Load environment variables
dotenv.config({ path: ".env.local" });

// --- ESM COMPATIBILITY SETUP ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ui = new CLI();

// --- CONFIGURATION ---
const outputDir = path.resolve(__dirname, "../icons/small");
const cacheFilePath = path.resolve(__dirname, "figma-file-cache.json.gz");
const logFilePath = path.resolve(__dirname, "figma-export.log");
const CACHE_DURATION_MS = 30 * 60 * 1000;

// Access environment variables directly from process.env
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN as string;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY as string;
const ARGS = process.argv.slice(2);

// --- TYPES ---
interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
}

interface FigmaFileResponse {
  document: FigmaNode;
}

// --- LOGIC ---

if (!FIGMA_ACCESS_TOKEN || !FIGMA_FILE_KEY) {
  ui.error("Missing FIGMA_ACCESS_TOKEN or FIGMA_FILE_KEY in env.");
  process.exit(1);
}

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

async function fetchFigmaFile(
  fileKey: string,
  accessToken: string,
): Promise<FigmaFileResponse> {
  const url = `https://api.figma.com/v1/files/${fileKey}`;
  ui.debug(`Sending request to ${url}`);
  const response = await fetch(url, {
    headers: { "X-Figma-Token": accessToken },
  });
  if (!response.ok)
    throw new Error(`Status ${response.status}: ${response.statusText}`);
  return await response.json();
}

async function fetchFigmaFileWithCache(
  fileKey: string,
  accessToken: string,
  forceRefresh: boolean = false,
): Promise<FigmaFileResponse> {
  let shouldUseCache = false;

  // Check Cache existence and age
  if (!forceRefresh) {
    try {
      const stats = await fs.stat(cacheFilePath);
      const cacheAge = Date.now() - stats.mtimeMs;

      if (cacheAge <= CACHE_DURATION_MS) {
        const pressed = await ui.waitForKeyWithTimeout(
          3000,
          "Cache found. Press any key to force refresh",
        );
        if (pressed) {
          ui.info("Key pressed. Forcing API refresh.");
          forceRefresh = true;
        } else {
          shouldUseCache = true;
        }
      } else {
        ui.warn(
          `Cache expired (${Math.round(cacheAge / 1000 / 60)} mins old).`,
        );
      }
    } catch (error) {
      ui.debug("No cache found at " + cacheFilePath);
    }
  }

  // Load from Cache
  if (shouldUseCache) {
    ui.startSpinner("Loading data from local compressed cache...");
    try {
      const compressedData = await fs.readFile(cacheFilePath);
      const decompressed = await gunzipAsync(compressedData);
      const data = JSON.parse(decompressed.toString("utf-8"));
      ui.stopSpinner(true, "Loaded data from cache.");
      return data;
    } catch (e) {
      ui.stopSpinner(false);
      ui.error("Corrupt cache, falling back to API.");
    }
  }

  // Fetch from API
  ui.startSpinner(
    `Downloading full file structure from Figma API (${fileKey})...`,
  );
  const data = await fetchFigmaFile(fileKey, accessToken);
  ui.stopSpinner(true, "Document structure downloaded.");

  // Save Cache
  ui.startSpinner("Compressing and saving cache...");
  const compressed = await gzipAsync(JSON.stringify(data));
  await fs.writeFile(cacheFilePath, compressed);
  ui.stopSpinner(true, "Cache saved to disk.");

  return data;
}

function traverseDocument(node: FigmaNode, foundNodes: FigmaNode[], socialNodes: string[]) {
  // Logic: We are looking for top-level containers that start with "GTP-"

  if(node.name.includes("Social Media icons") && node.children) {
    node.children.forEach(child => {
      if(child.type === "COMPONENT") {
        socialNodes.push(child.name);
      }
    });
  }

  if (node.name.startsWith("GTP-") || socialNodes.includes(node.name)) {
    if (node.type === "COMPONENT_SET" || node.type === "COMPONENT") {
      foundNodes.push(node);
    }
  }

  if(node.name.includes("Additional Control icons") && node.children) {
    node.children.forEach(child => {
      if(child.type === "COMPONENT" || child.type === "COMPONENT_SET") {
        foundNodes.push(child);
      }
    });
  }

  if (node.children) {
    node.children.forEach((child) => traverseDocument(child, foundNodes, socialNodes));
  }
}

function getIconNodeIds(
  foundNodes: FigmaNode[],
): { id: string; name: string }[] {
  const iconNodes: { id: string; name: string }[] = [];

  ui.subHeader(`Analyze logic:`);
  ui.info(`  1. Scanning ${foundNodes.length} 'GTP-' candidates.`);
  ui.info(`  2. If type is COMPONENT -> Use directly.`);
  ui.info(
    `  3. If type is COMPONENT_SET -> Look for child named 'Size=medium' or 'Size=md'.`,
  );



  foundNodes.forEach((node) => {
    if (node.type === "COMPONENT") {
      ui.debug(`   Found COMPONENT: ${node.name}`);
      iconNodes.push({ id: node.id, name: node.name });
    } else if (node.type === "COMPONENT_SET" && node.children) {
      // Logic: Variants are children of Component Sets.
      // We only want the "medium" size variant for the export.
      let smallVariant = node.children.find((c) => c.name === "Size=medium");

      if (!smallVariant) {
        smallVariant = node.children.find((c) => c.name === "Size=md");
      }

      if (smallVariant) {
        ui.info(`   Found COMPONENT_SET: ${node.name} with 'medium' variant.`);
        iconNodes.push({ id: smallVariant.id, name: node.name }); // Use Set name, not variant name
      } else {
        ui.debug(`Skipping ${node.name}: No 'medium' variant found.`);
      }
    } else {
      ui.debug(`   Skipping node: ${node.name} (type: ${node.type})`);
    }
  });

  return iconNodes;
}

async function fetchSVGUrls(
  fileKey: string,
  accessToken: string,
  nodeIds: string[],
) {
  const batchSize = 100;
  let allImages: { [id: string]: string } = {};
  const totalBatches = Math.ceil(nodeIds.length / batchSize);

  ui.startSpinner(
    `Requesting SVG download URLs from Figma (0/${totalBatches} batches)...`,
  );

  for (let i = 0; i < nodeIds.length; i += batchSize) {
    const batch = nodeIds.slice(i, i + batchSize);
    // Figma API requires comma-separated IDs
    const url = `https://api.figma.com/v1/images/${fileKey}?ids=${batch.join(
      ",",
    )}&format=svg`;

    ui.debug(
      `Batch ${Math.floor(i / batchSize) + 1}: Fetching ${batch.length} URLs...`,
    );

    const response = await fetch(url, {
      headers: { "X-Figma-Token": accessToken },
    });
    if (!response.ok)
      throw new Error(`Figma Image API Error: ${response.status}`);
    const data = await response.json();

    // Merge results
    Object.assign(allImages, data.images);
  }

  ui.stopSpinner(
    true,
    `Received download URLs for ${Object.keys(allImages).length} icons.`,
  );
  return allImages;
}

async function main() {
  ui.initLog(logFilePath);
  ui.header("Figma Icon Extractor");

  const searchArgIndex = ARGS.indexOf("--search");
  const forceRefresh = ARGS.includes("--refresh");

  try {
    // 1. Get File Data
    const figmaData = await fetchFigmaFileWithCache(
      FIGMA_FILE_KEY,
      FIGMA_ACCESS_TOKEN,
      forceRefresh,
    );

    // --- Search Mode ---
    if (searchArgIndex !== -1 && ARGS[searchArgIndex + 1]) {
      const query = ARGS[searchArgIndex + 1];
      ui.info(`Searching for nodes matching "${query}"...`);
      const results: FigmaNode[] = [];
      
      const searchNodes = (node: FigmaNode, query: string, results: FigmaNode[]) => {
        if (node.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(node);
        }
        if (node.children) {
            node.children.forEach(child => searchNodes(child, query, results));
        }
      };

      searchNodes(figmaData.document, query, results);

      if (results.length === 0) {
        ui.warn("No results found.");
      } else {
        ui.success(`Found ${results.length} matches:`);
        results.forEach(node => {
            console.log(`- [${node.type}] ${node.name} (ID: ${node.id})`);
            if (node.children) {
                console.log(`  Children: ${node.children.length}`);
            }
        });
      }
      return;
    }

    // 2. Traverse
    ui.info("Traversing document tree...");
    ui.subHeader("Looking for nodes starting with 'GTP-'...");

    const foundNodes: FigmaNode[] = [];
    const socialNodes: string[] = [];
    traverseDocument(figmaData.document, foundNodes, socialNodes);

    // 3. Filter IDs
    ui.info("Filtering valid icon variants...");
    // Returns array of objects { id, name }
    const validIcons = getIconNodeIds(foundNodes);

    if (validIcons.length === 0) return ui.warn("No icons found.");
    ui.success(`Identified ${validIcons.length} icons to process.`);

    // 4. Get URLs
    const svgUrls = await fetchSVGUrls(
      FIGMA_FILE_KEY,
      FIGMA_ACCESS_TOKEN,
      validIcons.map((i) => i.id),
    );

    // 5. Download Files
    await fs.mkdir(outputDir, { recursive: true });

    let successCount = 0;
    let failCount = 0;

    ui.header("Downloading SVGs");
    console.log(""); // Spacer

    for (let i = 0; i < validIcons.length; i++) {
      const { id, name } = validIcons[i];
      const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const fileName = `${safeName}.svg`;
      const url = svgUrls[id];

      // Update bar with the specific filename being downloaded
      ui.progressBar(i, validIcons.length, "Downloading", fileName);

      if (url) {
        try {
          const resp = await fetch(url);
          if (resp.ok) {
            const content = await resp.text();
            await fs.writeFile(path.join(outputDir, fileName), content, "utf-8");
            successCount++;
          } else {
            failCount++;
            ui.error(
              `Failed to download ${fileName}`,
              new Error(resp.statusText),
            );
          }
        } catch (e) {
          failCount++;
          ui.error(`Network error for ${fileName}`, e);
        }
      } else {
        failCount++;
        ui.debug(`No URL returned for ${name} (${id})`);
      }
    }

    // Complete bar
    ui.progressBar(
      validIcons.length,
      validIcons.length,
      "Downloading",
      "Done",
    );

    ui.header("Summary");
    console.log(`  Target Dir : ${outputDir}`);
    console.log(`  Log File   : ${logFilePath}`);
    console.log(
      `  ${COLORS.green}Success    : ${successCount}${COLORS.reset}`,
    );
    if (failCount > 0)
      console.log(`  ${COLORS.red}Failed     : ${failCount}${COLORS.reset}`);
    console.log("");
  } catch (error) {
    ui.error("Execution failed", error);
  }
}

main();
