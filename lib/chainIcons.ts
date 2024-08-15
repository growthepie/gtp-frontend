import { MasterResponse } from "@/types/api/MasterResponse";
import { addCollection, IconifyJSON } from "@iconify/react";

export const ImportChainIcons = (master: MasterResponse) => {
  const chainEntries = Object.entries(master.chains);

  // start with empty collection
  let chainIcons: IconifyJSON = {
    prefix: "gtp",
    icons: {},
  };

  chainEntries.forEach(([chainKey, chainInfo]) => {
    // skip if no logo
    if (!chainInfo.logo) return;

    // add icon with key as chainKey
    chainIcons.icons[`${chainKey.replace(/_/g, "-")}-logo`] = {
      body: chainInfo.logo.body,
      width: chainInfo.logo.width || 15,
      height: chainInfo.logo.height || 15,
    };
    // add icon with url_key as chainKey
    chainIcons.icons[`${chainInfo.url_key}-logo-monochrome`] = {
      body: chainInfo.logo.body,
      width: chainInfo.logo.width || 15,
      height: chainInfo.logo.height || 15,
    };
  });

  // add icons to collection
  addCollection(chainIcons);
};
