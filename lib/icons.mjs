// 1. export icons from Figma using Export Variants plugin
// - select 1 or more layers in Figma that contain SVG icon variants
// - run Export Variants plugin
// - for "Use variant names for" option, select "Folders"
// - click Export
// - copy the exported SVG files to this project's icons/small directory
// 2. run "node lib/icons.mjs" to generate icons/gtp2.json

import { promises as fs } from "fs";
import {
  importDirectory,
  cleanupSVG,
  runSVGO,
  parseColors,
  isEmptyColor,
} from "@iconify/tools";

var GetChainIcons = async () => {
  const resp = await fetch("https://api.growthepie.xyz/v1/master.json").then(
    (res) => res.json(),
  );

  const chainEntries = Object.entries(resp.chains);

  // start with empty collection
  let icons = {
    prefix: "gtp",
    icons: {},
  };

  chainEntries.forEach(([chainKey, chainInfo]) => {
    // skip if no logo
    if (!chainInfo.logo) return;

    // add icon with key as chainKey
    icons.icons[`${chainInfo.url_key}-logo-monochrome`] = {
      body: chainInfo.logo.body,
      width: chainInfo.logo.width || 15,
      height: chainInfo.logo.height || 15,
    };

    // add icon with key as chainKey
    icons.icons[
      `${chainKey.replace("_", "-").replace("_", "-")}-logo-monochrome`
    ] = {
      body: chainInfo.logo.body,
      width: chainInfo.logo.width || 15,
      height: chainInfo.logo.height || 15,
    };
  });

  return icons;
};

var GetDAIcons = async () => {
  const resp = await fetch("https://api.growthepie.xyz/v1/master.json").then(
    (res) => res.json(),
  );

  const daEntries = Object.entries(resp.da_layers);

  // start with empty collection
  let icons = {
    prefix: "gtp",
    icons: {},
  };

  daEntries.forEach(([daKey, daInfo]) => {
    // skip if no logo
    if (!daInfo.logo) return;

    const key = daKey.replace("_", "-").replace("_", "-");
    let body = daInfo.logo.body;

    // replace fill="url(#..." and fill="#..." with fill="currentColor"
    body = body
      .replace(/fill="url\(#.*?\)"/g, 'fill="currentColor"')
      .replace(/fill="#.*?"/g, 'fill="currentColor"');

    // // add icon with key replacing _ with -
    icons.icons[`${key}-logo-monochrome`] = {
      body: body,
      width: daInfo.logo.width || 15,
      height: daInfo.logo.height || 15,
    };
  });

  return icons;
};

(async () => {
  // json filename to export
  const jsonFilename = "icons/gtp-figma-export.json";
  // Import icons
  const iconSet = await importDirectory("icons/small", {
    prefix: "gtp",
  });

  // Validate, clean up, fix palette and optimise
  await iconSet.forEach(async (name, type) => {
    if (type !== "icon") {
      return;
    }

    const svg = iconSet.toSVG(name);
    if (!svg) {
      // Invalid icon
      iconSet.remove(name);
      return;
    }

    // Clean up and optimise icons
    try {
      // Clean up icon code
      await cleanupSVG(svg);

      // Assume icon is monotone: replace color with currentColor, add if missing
      // If icon is not monotone, remove this code
      if (name.includes("logo")) {
        await parseColors(svg, {
          defaultColor: "currentColor",
          callback: (attr, colorStr, color) => {
            return !color || isEmptyColor(color) ? colorStr : "currentColor";
          },
        });
      } else {
        // duplicate the icon with the -monochrome suffix and set the fill to currentColor
        iconSet.fromSVG(`${name}-monochrome`, svg);
        let newSVG = iconSet.toSVG(name);
        await parseColors(newSVG, {
          defaultColor: "currentColor",
          callback: (attr, colorStr, color) => {
            return !color || isEmptyColor(color) ? colorStr : "currentColor";
          },
        });
        iconSet.fromSVG(`${name}-monochrome`, newSVG);
      }

      // Optimise
      await runSVGO(svg);
    } catch (err) {
      // Invalid icon
      console.error(`Error parsing ${name}:`, err);
      iconSet.remove(name);
      return;
    }

    // Update icon
    iconSet.fromSVG(name, svg);
  });

  // get the icon names from the icons/gtp.json file
  const oldIconsFile = await fs.readFile("icons/gtp.json", "utf8");
  const oldIcons = JSON.parse(oldIconsFile);

  const currIcons = JSON.parse(JSON.stringify(iconSet.export()));
  let currIconNames = Object.keys(currIcons.icons);

  // add any old icons that don't already exist in the new set
  for (const icon of Object.keys(oldIcons.icons)) {
    // console.log(icon, oldIcons.icons[icon]);
    if (!currIconNames.includes(icon)) {
      currIcons.icons[icon] = oldIcons.icons[icon];
    }
  }

  let chainIcons = await GetChainIcons();
  let daIcons = await GetDAIcons();

  currIcons.icons = {
    ...currIcons.icons,
    ...chainIcons.icons,
    ...daIcons.icons,
  };

  // Export as IconifyJSON
  const exported = JSON.stringify(currIcons, null, "\t") + "\n";

  // Save to file
  await fs.writeFile(jsonFilename, exported, "utf8");

  // get the icon names and write to a file for use in typescript
  const GTPIconNames = (currIconNames = Object.keys(currIcons.icons));

  console.log(`Exported ${currIconNames.length} icons to ${jsonFilename}`);

  const iconNamesFile = "icons/gtp-icon-names.ts";

  await fs.writeFile(
    iconNamesFile,
    `// This file is generated by lib/icons.mjs
export const iconNames = ${JSON.stringify(GTPIconNames, null, 2)};
export type GTPIconName = ${GTPIconNames.map((name) => `"${name}"`).join(
      " | ",
    )};`,
    "utf8",
  );

  console.log(`Exported ${GTPIconNames.length} icon names to ${iconNamesFile}`);
  console.log(`Done!`);
})();
