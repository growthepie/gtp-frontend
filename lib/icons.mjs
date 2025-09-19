/*
  This script is used to generate the icons/gtp-figma-export.json file and icons/gtp-icon-names.ts file
  from the SVG icons in the icons/small directory. The icon names are exported to the icons/gtp-icon-names.ts file
  for use in TypeScript. The icons/gtp-figma-export.json file is used to import the icons into the project.
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
// 2. run "node lib/icons.mjs" to update the icons/gtp-figma-export.json and icons/gtp-icon-names.ts files
// 3. you can now use the icons in your project by using the following in the `icon` prop:
//   a. "gtp:[icon layer name in lower case]" if using the default Icon component from @iconify/react
//   b. "[icon layer name in lower case]" if using the GTPIcon component

import { promises as fs } from "fs";
import {
  importDirectory,
  cleanupSVG,
  runSVGO,
  parseColors,
  isEmptyColor,
} from "@iconify/tools";

var GetChainIcons = async () => {
  const resp = await fetch("https://api.growthepie.com/v1/master.json").then(
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
      width: 15,
      height: 15,
    };

    // add icon with key as chainKey
    icons.icons[
      `${chainKey.replace("_", "-").replace("_", "-")}-logo-monochrome`
    ] = {
      body: chainInfo.logo.body,
      width: 15,
      height: 15,
    };
  });

  return icons;
};

var GetDAIcons = async () => {
  const resp = await fetch("https://api.growthepie.com/v1/master.json").then(
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

var GetLogos = async () => {
  const resp = await fetch("https://api.growthepie.com/v1/master.json").then(
    (res) => res.json(),
  );

  const customLogos = Object.entries(resp.custom_logos)

  // start with empty collection
  let icons = {
    prefix: "gtp",
    icons: {},
  };

  customLogos.forEach(([logoKey, logoInfo]) => {
    // skip if no logo
    if (!logoInfo.body) return;

    const key = logoKey.replace("_", "-").replace("_", "-");
    let body = logoInfo.body;

    // replace fill="url(#..." and fill="#..." with fill="currentColor"
    body = body
      .replace(/fill="url\(#.*?\)"/g, 'fill="currentColor"')
      .replace(/fill="#.*?"/g, 'fill="currentColor"');

    // // add icon with key replacing _ with -
    icons.icons[`${key}-custom-logo-monochrome`] = {
      body: body,
      width: logoInfo.width || 15,
      height: logoInfo.height || 15,
    };
  });

  return icons;
};

(async () => {
  // json filename to export
  const jsonFilename = "public/gtp-figma-export.json";
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
      // if (name.includes("logo")) {
      //   await parseColors(svg, {
      //     defaultColor: "currentColor",
      //     callback: (attr, colorStr, color) => {
      //       return !color || isEmptyColor(color) ? colorStr : "currentColor";
      //     },
      //   });
      // } else {
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
  const oldIconsFile = await fs.readFile("public/gtp.json", "utf8");
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
  let logos = await GetLogos();

  currIcons.icons = {
    ...currIcons.icons,
    ...chainIcons.icons,
    ...daIcons.icons,
    ...logos.icons,
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
