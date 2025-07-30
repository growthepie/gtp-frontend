// lib/figma.ts
const fs = require("fs").promises;
const path = require("path");

// use env.local
require("dotenv").config({ path: ".env.local" });

const outputDir = path.resolve(__dirname, "../icons/small");

// Access environment variables directly from process.env
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN as string;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY as string;

if (!FIGMA_ACCESS_TOKEN || !FIGMA_FILE_KEY) {
  console.error(
    "Missing FIGMA_ACCESS_TOKEN or FIGMA_FILE_KEY in environment variables.",
  );
  process.exit(1);
}

/**
 * Represents a node in the Figma document.
 */
interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
}

/**
 * Represents the response structure from Figma API's /files endpoint.
 */
interface FigmaFileResponse {
  document: FigmaNode;
  components: { [key: string]: any };
  componentSets: { [key: string]: any };
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

/**
 * Recursively traverses the Figma document tree to find component sets.
 * @param node The current node in the traversal.
 * @param componentSets An array to collect found component sets.
 */
function traverseDocument(node: FigmaNode, componentSets: FigmaNode[]) {
  if (node.type === "COMPONENT_SET" && node.name.startsWith("GTP-")) {
    console.log("Found component set:", node.name);
    componentSets.push(node);
  }

  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => traverseDocument(child, componentSets));
  }
}

/**
 * Retrieves the node IDs of "small" variants within "GTP-" component sets.
 * @param componentSets Array of component sets starting with "GTP-".
 * @returns Array of node IDs for "small" variants.
 */
function getSmallVariantNodeIds(componentSets: FigmaNode[]): string[] {
  const smallVariantIds: string[] = [];

  componentSets.forEach((set) => {
    if (!set.children) return;

    console.log("set.children", set.name, set.children);

    // the "small" variant is the first child in the component set and has the property "size" set to "small"
    const smallVariant = set.children.find(
      (child) => child.name === "Size=small",
    );

    if (smallVariant) {
      smallVariantIds.push(smallVariant.id);
    } else {
      console.warn(
        `No "small" variant found for component set "${set.name}" (ID: ${set.id})`,
      );
    }
  });

  return smallVariantIds;
}

/**
 * Fetches SVG URLs for the given node IDs.
 * @param fileKey The key of the Figma file.
 * @param accessToken Your Figma access token.
 * @param nodeIds Array of node IDs to export.
 * @returns Object mapping node IDs to their SVG URLs.
 */
async function fetchSVGUrls(
  fileKey: string,
  accessToken: string,
  nodeIds: string[],
): Promise<{ [id: string]: string }> {
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${nodeIds.join(
    ",",
  )}&format=svg`;

  try {
    const response = await fetch(url, {
      headers: {
        "X-Figma-Token": accessToken,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Figma Images API responded with status ${response.status}: ${response.statusText}`,
      );
    }

    const data = await response.json();

    return data.images; // { "nodeId": "imageUrl", ... }
  } catch (error) {
    console.error("Error fetching SVG URLs:", error);
    throw error;
  }
}

/**
 * Downloads an SVG from a given URL and saves it to the specified path.
 * @param url The URL of the SVG.
 * @param savePath The file system path where the SVG should be saved.
 */
async function downloadSVG(url: string, savePath: string) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to download SVG from ${url}: ${response.statusText}`,
      );
    }

    const svgContent = await response.text();
    await fs.writeFile(savePath, svgContent, "utf-8");
    console.log(`Saved SVG to ${savePath}`);
  } catch (error) {
    console.error(`Error downloading SVG from ${url}:`, error);
  }
}

/**
 * Main function to orchestrate fetching and saving SVGs for "small" variants.
 */
async function main() {
  try {
    console.log("Fetching Figma file data...", FIGMA_FILE_KEY, FIGMA_ACCESS_TOKEN);
    const figmaData = await fetchFigmaFile(FIGMA_FILE_KEY, FIGMA_ACCESS_TOKEN);

    console.log('Traversing document to find "GTP-" component sets...');
    const componentSets: FigmaNode[] = [];
    traverseDocument(figmaData.document, componentSets);
    console.log(`Found ${componentSets.length} "GTP-" component sets.`);

    console.log('Extracting node IDs for "small" variants...');
    const smallVariantIds = getSmallVariantNodeIds(componentSets);

    if (smallVariantIds.length === 0) {
      console.log('No "small" variants found.');
      return;
    }

    console.log(
      `Fetching SVG URLs for ${smallVariantIds.length} "small" variants...`,
    );
    const svgUrls = await fetchSVGUrls(
      FIGMA_FILE_KEY,
      FIGMA_ACCESS_TOKEN,
      smallVariantIds,
    );

    console.log("Downloading SVGs...");

    // Ensure the output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    for (const nodeId of smallVariantIds) {
      const svgUrl = svgUrls[nodeId];
      if (svgUrl) {
        const svgName =
          componentSets
            .find((set) =>
              set.children?.some((variant) => variant.id === nodeId),
            )
            ?.name.toLowerCase() || nodeId;
        const savePath = path.join(outputDir, `${svgName}.svg`);
        await downloadSVG(svgUrl, savePath);
      } else {
        console.warn(`No SVG URL found for node ID: ${nodeId}`);
      }
    }

    console.log("All SVGs downloaded successfully.");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Execute the main function
main();
