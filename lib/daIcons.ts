import { MasterResponse } from "@/types/api/MasterResponse";
import { addCollection, IconifyJSON } from "@iconify/react";

export const ImportDaIcons = (master: MasterResponse) => {
  const daEntries = Object.entries(master.da_layers);

  // start with empty collection
  let daIcons: IconifyJSON = {
    prefix: "gtp",
    icons: {},
  };

  daEntries.forEach(([key, info]) => {
    // skip if no logo
    if (!info.logo) return;
    const keyDashed = key.replaceAll("_", "-");
    const urlKeyDashed = info.url_key.replaceAll("_", "-");


    const body = info.logo.body
      .replace(/fill="url\(#.*?\)"/g, 'fill="currentColor"')
      .replace(/fill="#.*?"/g, 'fill="currentColor"');


    // add icon with url key
    daIcons.icons[`${urlKeyDashed}-logo-monochrome`] = {
      body: body,
      width: info.logo.width || 15,
      height: info.logo.height || 15,
    };

    // add icon with key
    daIcons.icons[`${keyDashed}-logo-monochrome`] = {
      body: body,
      width: info.logo.width || 15,
      height: info.logo.height || 15,
    };
  });

  // add icons to collection
  addCollection(daIcons);
};
