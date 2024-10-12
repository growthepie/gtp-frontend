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
      urlKey: chain.url_key ? chain.url_key : key.replace(/_/g, "-"),
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
    label: "Chains",
    key: "chains",
    icon: "gtp-chain",
    options: chainKeys.map((key) => {
      const chain = chains[key];
      return {
        label: chain.name,
        icon: `${
          chain.url_key ? chain.url_key : key.replace(/_/g, "-")
        }-logo-monochrome`,
        key: key,
        urlKey: chain.url_key ? chain.url_key : key.replace(/_/g, "-"),
        url: `/chains/${
          chain.url_key ? chain.url_key : key.replace(/_/g, "-")
        }`,
        hide: false,
        excludeFromSitemap: false,
      };
    }),
  };
};

export const GetRankingColor = (percentage, weighted = false) => {
  const colors = !weighted
    ? [
        { percent: 0, color: "#1DF7EF" },
        { percent: 20, color: "#76EDA0" },
        { percent: 50, color: "#FFDF27" },
        { percent: 70, color: "#FF9B47" },
        { percent: 100, color: "#FE5468" },
      ]
    : [
        { percent: 0, color: "#1DF7EF" },
        { percent: 2, color: "#76EDA0" },
        { percent: 10, color: "#FFDF27" },
        { percent: 40, color: "#FF9B47" },
        { percent: 80, color: "#FE5468" },
        { percent: 100, color: "#FE5468" }, // Repeat the final color to ensure upper bound
      ];

  let lowerBound = colors[0];
  let upperBound = colors[colors.length - 1];

  if (weighted) {
    // Adjust lower and upper bounds for weighted gradient
    lowerBound = colors[0];
    upperBound = colors[1];
  }

  for (let i = 0; i < colors.length - 1; i++) {
    if (
      percentage >= colors[i].percent &&
      percentage <= colors[i + 1].percent
    ) {
      lowerBound = colors[i];
      upperBound = colors[i + 1];
      break;
    }
  }

  const percentDiff =
    (percentage - lowerBound.percent) /
    (upperBound.percent - lowerBound.percent);

  const r = Math.floor(
    parseInt(lowerBound.color.substring(1, 3), 16) +
      percentDiff *
        (parseInt(upperBound.color.substring(1, 3), 16) -
          parseInt(lowerBound.color.substring(1, 3), 16)),
  );

  const g = Math.floor(
    parseInt(lowerBound.color.substring(3, 5), 16) +
      percentDiff *
        (parseInt(upperBound.color.substring(3, 5), 16) -
          parseInt(lowerBound.color.substring(3, 5), 16)),
  );

  const b = Math.floor(
    parseInt(lowerBound.color.substring(5, 7), 16) +
      percentDiff *
        (parseInt(upperBound.color.substring(5, 7), 16) -
          parseInt(lowerBound.color.substring(5, 7), 16)),
  );

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

export const GetRankingScale = (
  value: number,
  valueRange: [number, number],
  scaleRange: [number, number],
): number => {
  const scale =
    scaleRange[0] +
    ((value - valueRange[0]) / (valueRange[1] - valueRange[0])) *
      (scaleRange[1] - scaleRange[0]);

  return scale;
};
