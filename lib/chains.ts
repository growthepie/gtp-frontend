import { MasterResponse } from "@/types/api/MasterResponse";
import { IS_DEVELOPMENT, IS_PREVIEW } from "./helpers";

export type Chain = {
  label: string;
  icon: string | null;
  key: string;
  urlKey: string;
  chainType: string | null;
  ecosystem: string[];
  description: string;
  colors: {
    light: string[];
    dark: string[];
  };
  darkTextOnBackground: boolean;
};

export const Get_SupportedChainKeys = (
  data?: MasterResponse,
  additionalKeys?: string[],
) => {
  if (!data) return [];
  if (IS_DEVELOPMENT || IS_PREVIEW) {
    let keys = Object.keys(data.chains)
      .filter((key) => ["DEV", "PROD"].includes(data.chains[key].deployment))
      .map((key) => key);

    if (additionalKeys) {
      keys = keys.concat(additionalKeys);
    }

    return keys;
  }

  let keys = Object.keys(data.chains)
    .filter((key) => ["PROD"].includes(data.chains[key].deployment))
    .map((key) => key);

  if (additionalKeys) {
    keys = keys.concat(additionalKeys);
  }

  return keys;
};

export const Get_DefaultChainSelectionKeys = (master: MasterResponse) => {
  const supportedChainKeys = Get_SupportedChainKeys(master);
  return master.default_chain_selection.filter((key) =>
    supportedChainKeys.includes(key),
  );
};

export const Get_AllChainsByKeysFromSessionStorage = () => {
  // get AllChainsByKeys from session storage
  const data: { [key: string]: Chain } = JSON.parse(
    sessionStorage.getItem("AllChainsByKeys") as string,
  );

  return data;
};

export const Get_AllChainsNavigationItems = (master: MasterResponse) => {
  const chains = master.chains;
  // filter out all_l2s and multiple chains
  const chainKeys = Get_SupportedChainKeys(master).filter(
    (key) => !["all_l2s", "multiple"].includes(key),
  );

  return {
    name: "Chains",
    label: "Single Chain",
    key: "chains",
    icon: "gtp:link",
    options: chainKeys.map((key) => {
      const chain = chains[key];
      return {
        label: chain.name,
        icon: `gtp-${key}-logo-monochrome`,
        key: key,
        urlKey: key.replace(/_/g, "-"),
        hide: false,
        excludeFromSitemap: false,
      };
    }),
  };
};
