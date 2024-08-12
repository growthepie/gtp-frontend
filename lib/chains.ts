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

// used by the MasterProvider to create the AllChains objects/arrays
export const Get_AllChainsByKeys = (master: MasterResponse) => {
  let chains: { [key: string]: any } = {};
  Object.keys(master.chains).forEach((key) => {
    let chain = master.chains[key];
    chains[key] = {
      label: chain.name,
      icon: chain.logo?.body ? chain.logo.body : null,
      key: key,
      urlKey: key.replace(/_/g, "-"),
      chainType: getChainTypeFromMasterChainType(key, chain.chain_type),
      ecosystem: chain.ecosystem,
      description: chain.description,
      border: {
        light: [
          `border-[${chain.colors.light[0]}]`,
          `border-[${chain.colors.light[1]}]`,
        ],
        dark: [
          `border-[${chain.colors.dark[0]}]`,
          `border-[${chain.colors.dark[1]}]`,
        ],
      },
      colors: {
        light: [`${chain.colors.light[0]}`, `${chain.colors.light[1]}`],
        dark: [`${chain.colors.dark[0]}`, `${chain.colors.dark[1]}`],
      },
      backgrounds: {
        light: [
          `bg-[${chain.colors.light[0]}]`,
          `bg-[${chain.colors.light[1]}]`,
        ],
        dark: [`bg-[${chain.colors.dark[0]}]`, `bg-[${chain.colors.dark[1]}]`],
      },
      darkTextOnBackground: chain.colors.darkTextOnBackground,
    };
  });

  return chains;
};

// used by the MasterProvider
const getChainTypeFromMasterChainType = (
  chainKey: string,
  masterChainType: string,
) => {
  if (chainKey === "all_l2s") {
    return "all-l2s";
  }

  if (masterChainType === "-") {
    return null;
  }

  return masterChainType;
};

// used by the MasterProvider and other components
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

// used by Components to get the default chain selection keys
export const Get_DefaultChainSelectionKeys = (master: MasterResponse) => {
  const supportedChainKeys = Get_SupportedChainKeys(master);
  return master.default_chain_selection.filter((key) =>
    supportedChainKeys.includes(key),
  );
};

// helper function used by non-react js/ts files
export const Get_AllChainsByKeysFromSessionStorage = () => {
  // get AllChainsByKeys from session storage
  const data: { [key: string]: Chain } = JSON.parse(
    sessionStorage.getItem("AllChainsByKeys") as string,
  );

  return data;
};

// used by the MasterProvider to create the ChainsNavigationItems object
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
