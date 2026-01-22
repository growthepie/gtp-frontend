/*
  This script is used to generate the icons/gtp-figma-export.json file and icons/gtp-icon-names.ts file
  from the SVG icons in the icons/small directory. The icon names are exported to the icons/gtp-icon-names.ts file
  for use in TypeScript. The public/gtp-figma-export.json file is used to import the icons into the project.
*/
// Follow these steps to update the icons in the project:
// 1. export icons from Figma using either option below:
//   a. export using lib/figma.ts (requires FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY in .env.local)
//     - ensure FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY are set in .env.local - see https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens, file key can be found in the Figma URL for the file
//     - ensure tsx is installed globally (npm install -g tsx)
//     - run "npx tsx lib/figma.ts" to automatically download the icons from Figma into this project's icons/small directory
//   b. export from Figma using Export Variants plugin
//     - select 1 or more layers in Figma that contain SVG icon variants
//     - run Export Variants plugin
//     - for "Use variant names for" option, select "Folders"
//     - click Export
//     - copy the exported SVG files to this project's icons/small directory
// 2. run "node lib/icons.mjs" to update the public/gtp-figma-export.json and icons/gtp-icon-names.ts files
// 3. you can now use the icons in your project by using the following in the `icon` prop:
//   a. "gtp:[icon layer name in lower case]" if using the default Icon component from @iconify/react
//   b. "[icon layer name in lower case]" if using the GTPIcon component

// lib/icons.mjs
import { promises as fs } from "fs";
import {
  importDirectory,
  cleanupSVG,
  runSVGO,
  parseColors,
  isEmptyColor,
} from "@iconify/tools";
import { CLI, COLORS } from "./cli.mjs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ui = new CLI();
const LOG_FILE = path.resolve(__dirname, "icons-process.log");

// Color mappings: Figma hardcoded colors → CSS variables
// These are the dark mode colors exported from Figma
const COLOR_REPLACEMENTS = {
  // Petrol (gradient start for teal icons)
  "#10808C": "var(--icon-accent-petrol)",
  "#10808c": "var(--icon-accent-petrol)",
  // Turquoise (gradient end for teal icons)
  "#1DF7EF": "var(--icon-accent-turquoise)",
  "#1df7ef": "var(--icon-accent-turquoise)",
  // Red (gradient start for warm icons)
  "#FE5468": "var(--icon-accent-red)",
  "#fe5468": "var(--icon-accent-red)",
  // Yellow (gradient end for warm icons)
  "#FFDF27": "var(--icon-accent-yellow)",
  "#ffdf27": "var(--icon-accent-yellow)",
};

// Replace hardcoded colors with CSS variables in SVG content
function replaceColorsWithVariables(svgBody) {
  let result = svgBody;
  for (const [hexColor, cssVar] of Object.entries(COLOR_REPLACEMENTS)) {
    // Replace in stop-color attributes
    result = result.replace(new RegExp(`stop-color="${hexColor}"`, 'g'), `stop-color="${cssVar}"`);
    // Replace in fill attributes
    result = result.replace(new RegExp(`fill="${hexColor}"`, 'g'), `fill="${cssVar}"`);
    // Replace in stroke attributes
    result = result.replace(new RegExp(`stroke="${hexColor}"`, 'g'), `stroke="${cssVar}"`);
  }
  return result;
}

// --- API FETCH HELPERS ---

var GetChainIcons = async () => {
  const url = "https://api.growthepie.com/v1/master.json";
  ui.startSpinner("Fetching Chain data from API...");
  ui.debug(`GET ${url}`);
  
  try {
    const resp = await fetch(url).then((res) => res.json());
    
    const icons = { prefix: "gtp", icons: {} };
    let count = 0;

    Object.entries(resp.chains).forEach(([chainKey, chainInfo]) => {
      if (!chainInfo.logo) {
        ui.debug(`Skipping chain ${chainKey}: No logo found.`);
        return;
      }
      count += 2; // We add two variants per chain
      
      const urlKeyName = `${chainInfo.url_key}-logo-monochrome`;
      const stdKeyName = `${chainKey.replace(/_/g, "-")}-logo-monochrome`;

      const iconDef = {
        body: chainInfo.logo.body, width: chainInfo.logo.width || 15, height: chainInfo.logo.height || 15,
      }

      icons.icons[urlKeyName] = iconDef;
      icons.icons[stdKeyName] = iconDef;

      ui.debug(`Added chain icon: ${urlKeyName} and ${stdKeyName}`);
    });
    
    ui.stopSpinner(true, `Fetched ${count} Chain icons.`);
    return icons;
  } catch (e) {
    ui.stopSpinner(false);
    throw new Error(`Failed to fetch Chain icons: ${e.message}`);
  }
};

var GetDAIcons = async () => {
  const url = "https://api.growthepie.com/v1/master.json";
  ui.startSpinner("Fetching DA Layer data from API...");
  ui.debug(`GET ${url}`);

  try {
    const resp = await fetch(url).then((res) => res.json());
    
    const icons = { prefix: "gtp", icons: {} };
    let count = 0;

    Object.entries(resp.da_layers).forEach(([daKey, daInfo]) => {
      if (!daInfo.logo) return;
      count++;

      const key = daKey.replace(/_/g, "-");
      // Sanitize body content
      let body = daInfo.logo.body
        .replace(/fill="url\(#.*?\)"/g, 'fill="currentColor"')
        .replace(/fill="#.*?"/g, 'fill="currentColor"');

      icons.icons[`${key}-logo-monochrome`] = {
        body: body, width: daInfo.logo.width || 15, height: daInfo.logo.height || 15,
      };

      ui.debug(`Added DA icon: ${key}-logo-monochrome`);
    });

    ui.stopSpinner(true, `Fetched ${count} DA Layer icons.`);
    return icons;
  } catch (e) {
    ui.stopSpinner(false);
    throw new Error(`Failed to fetch DA icons: ${e.message}`);
  }
};

var GetLogos = async () => {
  const url = "https://api.growthepie.com/v1/master.json";
  ui.startSpinner("Fetching Custom Logos from API...");
  
  try {
    const resp = await fetch(url).then((res) => res.json());

    const icons = { prefix: "gtp", icons: {} };
    let count = 0;

    Object.entries(resp.custom_logos).forEach(([logoKey, logoInfo]) => {
      if (!logoInfo.body) return;
      count++;

      const key = logoKey.replace(/_/g, "-");
      let body = logoInfo.body
        .replace(/fill="url\(#.*?\)"/g, 'fill="currentColor"')
        .replace(/fill="#.*?"/g, 'fill="currentColor"');

      icons.icons[`${key}-custom-logo-monochrome`] = {
        body: body, width: logoInfo.width || 15, height: logoInfo.height || 15,
      };

      ui.debug(`Added custom logo: ${key}-custom-logo-monochrome`);
    });

    ui.stopSpinner(true, `Fetched ${count} Custom Logos.`);
    return icons;
  } catch (e) {
    ui.stopSpinner(false);
    throw new Error(`Failed to fetch Custom Logos: ${e.message}`);
  }
};

// --- MAIN EXECUTION ---

(async () => {
  ui.initLog(LOG_FILE);
  ui.header("Icon Processor & Exporter");
  
  const jsonFilename = "public/gtp-figma-export.json";
  const sourceDir = "icons/small";

  ui.info(`Configuration:`);
  ui.info(`  Source: ${sourceDir}`);
  ui.info(`  Output: ${jsonFilename}`);
  
  // 1. Import Directory
  ui.header("Step 1: Local Import");
  ui.startSpinner(`Reading SVGs from '${sourceDir}'...`);
  let iconSet;
  try {
    iconSet = await importDirectory(sourceDir, { prefix: "gtp" });
    ui.stopSpinner(true, `Imported ${iconSet.count()} raw icons.`);
  } catch (err) {
    ui.stopSpinner(false);
    ui.error("Failed to import directory", err);
    process.exit(1);
  }

  // 2. Process Icons (Cleanup, SVGO, Colors)
  ui.header("Step 2: Processing & Optimization");
  
  const iconList = iconSet.list(); // Get array of names
  let processedCount = 0;
  let errorCount = 0;

  console.log(""); // Spacer for progress bar

  for (let i = 0; i < iconList.length; i++) {
    const name = iconList[i];
    ui.progressBar(i, iconList.length, "Processing", name);

    const svg = iconSet.toSVG(name);
    if (!svg) {
      ui.debug(`Removing invalid icon: ${name}`);
      iconSet.remove(name);
      ui.debug(`Removed invalid icon: ${name}`);
      continue;
    }

    try {
      // 2a. Cleanup
      await cleanupSVG(svg);
      
      // 2b. Generate Monochrome Variant
      iconSet.fromSVG(`${name}-monochrome`, svg);
      let newSVG = iconSet.toSVG(name);
      
      await parseColors(newSVG, {
        defaultColor: "currentColor",
        callback: (attr, colorStr, color) => {
          return !color || isEmptyColor(color) ? colorStr : "currentColor";
        },
      });
      
      iconSet.fromSVG(`${name}-monochrome`, newSVG);

      ui.debug(`Generated monochrome variant: ${name}-monochrome`);
      
      // 2c. Optimize Original
      await runSVGO(svg);
      iconSet.fromSVG(name, svg);

      ui.debug(`Optimized original icon: ${name}`);
      
      processedCount++;
    } catch (err) {
      ui.error(`Error processing ${name}`, err);
      iconSet.remove(name);
      errorCount++;

      ui.debug(`Error processing ${name}: ${err.message}`);
    }
  }
  
  // Complete bar
  ui.progressBar(iconList.length, iconList.length, "Processing", "Done");
  
  if(errorCount > 0) ui.warn(`${errorCount} icons failed validation and were removed.`);

  // 3. Merge with Old Icons
  ui.header("Step 3: Merging Legacy Data");
  ui.startSpinner("Reading existing 'public/gtp.json'...");
  let oldIcons = { icons: {} };
  try {
    const oldIconsFile = await fs.readFile("public/gtp.json", "utf8");
    oldIcons = JSON.parse(oldIconsFile);
    ui.stopSpinner(true, "Legacy file loaded.");
  } catch (e) {
    ui.stopSpinner(false); // Not strictly an error, just means file doesn't exist
    ui.warn("Could not read public/gtp.json (might not exist), starting fresh.");
    ui.debug(`Error reading public/gtp.json: ${e.message}`);
  }

  const currIcons = JSON.parse(JSON.stringify(iconSet.export()));
  let currIconNames = Object.keys(currIcons.icons);

  // Preserve old icons not in new set
  let preservedCount = 0;
  for (const icon of Object.keys(oldIcons.icons)) {
    if (!currIconNames.includes(icon)) {
      currIcons.icons[icon] = oldIcons.icons[icon];
      preservedCount++;
      ui.debug(`Preserved legacy icon: ${icon}`);
    }
  }
  ui.info(`Preserved ${preservedCount} legacy icons that were not present in source.`);

  // 4. Fetch and Merge Remote Icons
  ui.header("Step 4: Fetching Remote Icons");
  
  const chainIcons = await GetChainIcons();
  const daIcons = await GetDAIcons();
  const logos = await GetLogos();

  currIcons.icons = {
    ...currIcons.icons,
    ...chainIcons.icons,
    ...daIcons.icons,
    ...logos.icons,
  };

  // 4b. Replace hardcoded colors with CSS variables
  ui.startSpinner("Replacing hardcoded colors with CSS variables...");
  let colorReplacementCount = 0;
  for (const [iconName, iconData] of Object.entries(currIcons.icons)) {
    if (iconData.body) {
      const originalBody = iconData.body;
      iconData.body = replaceColorsWithVariables(iconData.body);
      if (originalBody !== iconData.body) {
        colorReplacementCount++;
        ui.debug(`Replaced colors in: ${iconName}`);
      }
    }
  }
  ui.stopSpinner(true, `Replaced colors in ${colorReplacementCount} icons.`);

  // 5. Write Output Files
  ui.header("Step 5: Writing Output");
  ui.startSpinner(`Serializing JSON...`);
  
  // Write JSON
  const exported = JSON.stringify(currIcons, null, "\t") + "\n";
  await fs.writeFile(jsonFilename, exported, "utf8");
  ui.stopSpinner(true, `JSON written to ${jsonFilename}`);

  ui.startSpinner(`Generating TypeScript definitions...`);
  
  // Write TypeScript Types
  const GTPIconNames = Object.keys(currIcons.icons);
  const iconNamesFile = "icons/gtp-icon-names.ts";
  const tsContent = `// This file is generated by lib/icons.mjs
export const iconNames = ${JSON.stringify(GTPIconNames, null, 2)};
export type GTPIconName = ${GTPIconNames.map((name) => `"${name}"`).join(" | ")};`;
  
  await fs.writeFile(iconNamesFile, tsContent, "utf8");
  
  ui.stopSpinner(true, `Types written to ${iconNamesFile}`);

  // Summary
  ui.header("Summary");
  console.log(`  Log File    : ${LOG_FILE}`);
  console.log(`  Total Icons : ${GTPIconNames.length}`);
  console.log(`  ${COLORS.green}Finished Successfully${COLORS.reset}`);
  console.log("");
})();