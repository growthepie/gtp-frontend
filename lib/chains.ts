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
  border: {
    light: string[];
    dark: string[];
  };
  colors: {
    light: string[];
    dark: string[];
  };
  backgrounds: {
    light: string[];
    dark: string[];
  };
  darkTextOnBackground: boolean;
};

export const AllChains: Chain[] = [
  {
    label: "Ethereum",
    icon: "/icons/ethereum.png",
    key: "ethereum",
    urlKey: "ethereum",
    chainType: "L1",
    ecosystem: [],
    description:
      "Ethereum was proposed by Vitalik Buterin in 2013 and launched in 2015. It is arguably the most decentralized smart contract platform to date. The goal is to scale Ethereum through the usage of Layer 2s.",
    border: {
      light: ["border-[#8B8B8B]", "border-[#8B8B8B]"],
      dark: ["border-[#C1C1C1]", "border-[#C1C1C1]"],
    },
    colors: {
      light: ["#8B8B8B", "#8B8B8B"], // text color
      dark: ["#C1C1C1", "#C1C1C1"], // text color
    }, // yellow-orange
    backgrounds: {
      light: ["bg-[#8B8B8B]", "bg-[#8B8B8B]"],
      dark: ["bg-[#C1C1C1]", "bg-[#C1C1C1]"],
    },
    darkTextOnBackground: true,
  },
  {
    label: "Base",
    icon: "/icons/Base.png",
    key: "base",
    urlKey: "base",
    chainType: "L2",
    ecosystem: ["op-stack", "op-super", "all-chains"],
    description:
      "Base is an fully EVM compatible optimistic rollup built on the OP Stack. It is incubated inside of Coinbase. Public mainnet launch was on August 9th 2023.",
    border: {
      light: ["border-[#2151F5]", "border-[#2151F5]"],
      dark: ["border-[#2151F5]", "border-[#2151F5]"],
    },
    colors: {
      light: ["#2151F5", "#2151F5"], // dark purple
      dark: ["#2151F5", "#2151F5"], // dark purple
    },
    backgrounds: {
      light: ["bg-[#2151F5]", "bg-[#2151F5]"],
      dark: ["bg-[#2151F5]", "bg-[#2151F5]"],
    },
    darkTextOnBackground: false,
  },
  {
    label: "OP Mainnet",
    icon: "/icons/optimism.png",
    key: "optimism",
    urlKey: "optimism",
    chainType: "L2",
    ecosystem: ["op-stack", "op-super", "all-chains"],
    description:
      "OP Mainnet (formerly Optimism) uses an optimistic rollup approach, where transactions are assumed to be valid unless proven otherwise, and only invalid transactions are rolled back. OP Mainnet launched in August 2021, making it one of the first rollups. It is fully compatible with the Ethereum Virtual Machine (EVM), making it easy for developers to migrate their applications to the OP Mainnet network.",
    border: {
      light: ["border-[#DD3408]", "border-[#DD3408]"],
      dark: ["border-[#FE5468]", "border-[#FE5468]"],
    },
    colors: {
      light: ["#DD3408", "#DD3408"], // red-orange
      dark: ["#FE5468", "#FE5468"], // red-orange
    },
    backgrounds: {
      light: ["bg-[#DD3408]", "bg-[#DD3408]"],
      dark: ["bg-[#FE5468]", "bg-[#FE5468]"],
    },
    darkTextOnBackground: false,
  },
  {
    label: "Public Goods Network",
    icon: "/icons/PGN.png",
    key: "gitcoin_pgn",
    urlKey: "public-goods-network",
    chainType: "L2",
    ecosystem: ["all-chains"],
    description:
      "Public Goods Network is a fully EVM compatible optimistic rollup built on the OP Stack. Public launch was in July 2023.",
    border: {
      light: ["border-[#B9EE75]", "border-[#B9EE75]"],
      dark: ["border-[#D7FD7B]", "border-[#D7FD7B]"],
    },
    colors: {
      light: ["#B9EE75", "#B9EE75"], // dark purple
      dark: ["#D7FD7B", "#D7FD7B"], // dark purple
    },
    backgrounds: {
      light: ["bg-[#B9EE75]", "bg-[#B9EE75]"],
      dark: ["bg-[#D7FD7B]", "bg-[#D7FD7B]"],
    },
    darkTextOnBackground: true,
  },
  {
    label: "Zora",
    icon: "/icons/Zora.png",
    key: "zora",
    urlKey: "zora",
    chainType: "L2",
    ecosystem: ["op-stack", "op-super", "all-chains"],
    description:
      "Zora is a fully EVM compatible optimistic rollup built on the OP Stack. Public launch was in June 2023.",
    border: {
      light: ["border-[#2FB9F4]", "border-[#2FB9F4]"],
      dark: ["border-[#2FB9F4]", "border-[#2FB9F4]"],
    },
    colors: {
      light: ["#2FB9F4", "#2FB9F4"], // dark purple
      dark: ["#2FB9F4", "#2FB9F4"], // dark purple
    },
    backgrounds: {
      light: ["bg-[#2FB9F4]", "bg-[#2FB9F4]"],
      dark: ["bg-[#2FB9F4]", "bg-[#2FB9F4]"],
    },
    darkTextOnBackground: true,
  },
  {
    label: "Arbitrum One",
    icon: "/icons/arbitrum.png",
    key: "arbitrum",
    urlKey: "arbitrum",
    chainType: "L2",
    ecosystem: ["all-chains"],
    description:
      "Arbitrum One is developed by Offchain Labs and its mainnet launched in September 2021. It uses an optimistic rollup approach and is fully compatible with the Ethereum Virtual Machine (EVM), making it developer-friendly.",
    border: {
      light: ["border-[#2ECEE8]", "border-[#2ECEE8]"],
      dark: ["border-[#1DF7EF]", "border-[#1DF7EF]"],
    },
    colors: {
      light: ["#2ECEE8", "#2ECEE8"], // tropical sea
      dark: ["#1DF7EF", "#1DF7EF"], // tropical sea
    },
    backgrounds: {
      light: ["bg-[#2ECEE8]", "bg-[#2ECEE8]"],
      dark: ["bg-[#1DF7EF]", "bg-[#1DF7EF]"],
    },
    darkTextOnBackground: true,
  },
  {
    label: "Polygon zkEVM",
    icon: "/icons/polygon-pos.png",
    key: "polygon_zkevm",
    urlKey: "polygon-zkevm",
    chainType: "L2",
    ecosystem: ["all-chains", "zk-rollup"],
    description:
      "Polygon zkEVM uses zero-knowledge proofs to enable faster and cheaper transactions. It allows users to build and run EVM-compatible smart contracts, achieving up to 100x lower gas fees and up to 2,000x faster transaction speeds than the Ethereum mainnet. It's fully compatible with the Ethereum Virtual Machine, making it easy for developers to migrate their applications to the Polygon network. It launched in March 2023.",
    border: {
      light: ["border-[#800094]", "border-[#800094]"],
      dark: ["border-[#AD0DC5]", "border-[#AD0DC5]"],
    },
    colors: {
      light: ["#800094", "#800094"], // purple
      dark: ["#AD0DC5", "#AD0DC5"], // purple
    },
    backgrounds: {
      light: ["bg-[#800094]", "bg-[#800094]"],
      dark: ["bg-[#AD0DC5]", "bg-[#AD0DC5]"],
    },
    darkTextOnBackground: false,
  },
  {
    label: "ZKsync Era",
    icon: "/icons/zksync-era.png",
    key: "zksync_era",
    urlKey: "zksync-era",
    chainType: "L2",
    ecosystem: ["all-chains", "Hyperchain", "zk-rollup"],
    description:
      "ZKsync Era is a Layer 2 protocol that scales Ethereum with cutting-edge ZK tech. Their mission isn't to merely increase Ethereum's throughput, but to fully preserve its foundational values – freedom, self-sovereignty, decentralization – at scale.",
    border: {
      light: ["border-[#390094]", "border-[#390094]"],
      dark: ["border-[#7C32F4]", "border-[#7C32F4]"],
    },
    colors: {
      light: ["#390094", "#390094"], // dark purple
      dark: ["#7C32F4", "#7C32F4"], // dark purple
    },
    backgrounds: {
      light: ["bg-[#390094]", "bg-[#390094]"],
      dark: ["bg-[#7C32F4]", "bg-[#7C32F4]"],
    },
    darkTextOnBackground: false,
  },
  {
    label: "Linea",
    icon: "/icons/linea.png",
    key: "linea",
    urlKey: "linea",
    chainType: "L2",
    ecosystem: ["all-chains", "zk-rollup"], // TODO: add ecosystems when unhiding from the UI
    description:
      "Linea is a developer-friendly ZK Rollup, marked as the next stage of ConsenSys zkEVM, which aims to enhance the Ethereum network by facilitating a new wave of decentralized applications. Public launch was in July 2023.",
    border: {
      light: ["border-[#9CE5FF]", "border-[#9CE5FF]"],
      dark: ["border-[#A9E9FF]", "border-[#A9E9FF]"],
    },
    colors: {
      light: ["#9CE5FF", "#9CE5FF"], // dark purple
      dark: ["#A9E9FF", "#A9E9FF"], // dark purple
    },
    backgrounds: {
      light: ["bg-[#9CE5FF]", "bg-[#9CE5FF]"],
      dark: ["bg-[#A9E9FF]", "bg-[#A9E9FF]"],
    },
    darkTextOnBackground: true,
  },
  {
    label: "Scroll",
    icon: "/icons/scroll.png",
    key: "scroll",
    urlKey: "scroll",
    chainType: "L2",
    ecosystem: ["all-chains", "zk-rollup"],
    description:
      "Scroll is a general purpose zkEVM rollup. Public launch was in October 2023.",
    border: {
      light: ["border-[#FBB90D]", "border-[#FBB90D]"],
      dark: ["border-[#FFDF27]", "border-[#FFDF27]"],
    },
    colors: {
      light: ["#FBB90D", "#FBB90D"], // dark purple
      dark: ["#FFDF27", "#FFDF27"], // dark purple
    },
    backgrounds: {
      light: ["bg-[#FBB90D]", "bg-[#FBB90D]"],
      dark: ["bg-[#FFDF27]", "bg-[#FFDF27]"],
    },
    darkTextOnBackground: true,
  },
  {
    label: "Aztec V2",
    icon: "/icons/aztec.png",
    key: "aztecv2",
    urlKey: "aztec-v2",
    chainType: "L2",
    ecosystem: [],
    description: "",
    border: {
      light: ["border-[#000000]", "border-[#000000]"],
      dark: ["border-[#000000]", "border-[#000000]"],
    },
    colors: { light: ["#000000", "#000000"], dark: ["#000000", "#000000"] },
    backgrounds: {
      light: ["bg-[#000000]", "bg-[#000000]"],
      dark: ["bg-[#000000]", "bg-[#000000]"],
    },
    darkTextOnBackground: false,
  },
  {
    label: "Immutable X",
    icon: "/icons/immutablex.png",
    key: "imx",
    urlKey: "immutable-x",
    chainType: "L2",
    ecosystem: ["all-chains"],
    description:
      "Immutable X is an optimized game-specific zk rollup. It is designed to mint, transfer, and trade tokens and NFTs at higher volumes and zero gas fees. It is not EVM compatible but its easy-to-use APIs and SDKs aim to make development for game devs as easy as possible. It launched in April 2021.",
    border: {
      light: ["border-[#3ECDA7]", "border-[#3ECDA7]"],
      dark: ["border-[#3AFCC9]", "border-[#3AFCC9]"],
    },
    colors: {
      light: ["#3ECDA7", "#3ECDA7"], // dark sea
      dark: ["#3AFCC9", "#3AFCC9"], // dark sea
    },
    backgrounds: {
      light: ["bg-[#3ECDA7]", "bg-[#3ECDA7]"],
      dark: ["bg-[#3AFCC9]", "bg-[#3AFCC9]"],
    },
    darkTextOnBackground: true,
  },
  {
    label: "Mantle",
    icon: "/icons/mantle.png",
    key: "mantle",
    urlKey: "mantle",
    chainType: "L2",
    ecosystem: ["all-chains"], // add ecosystems when unhiding from the UI
    description:
      "Mantle is an OVM based EVM-compatible rollup. Public launch was in July 2023.",
    border: {
      light: ["border-[#08373C]", "border-[#08373C]"],
      dark: ["border-[#10808C]", "border-[#10808C]"],
    },
    colors: {
      light: ["#08373C", "#08373C"], // dark greenish
      dark: ["#10808C", "#10808C"], // dark greenish
    },
    backgrounds: {
      light: ["bg-[#08373C]", "bg-[#08373C]"],
      dark: ["bg-[#10808C]", "bg-[#10808C]"],
    },
    darkTextOnBackground: false,
  },
  {
    label: "Starknet",
    icon: "/icons/starknet.png",
    key: "starknet",
    urlKey: "starknet",
    chainType: "L2",
    ecosystem: ["all-chains"], // add ecosystems when unhiding from the UI
    description:
      "Starknet is a ZK Rollup developed by Starkware. The rollup was launched on mainnet in November 2021.",
    border: {
      light: ["border-[#EC796B]", "border-[#EC796B]"],
      dark: ["border-[#EC796B]", "border-[#EC796B]"],
    },
    colors: {
      light: ["#EC796B", "#EC796B"], // dark greenish
      dark: ["#EC796B", "#EC796B"], // dark greenish
    },
    backgrounds: {
      light: ["bg-[#EC796B]", "bg-[#EC796B]"],
      dark: ["bg-[#EC796B]", "bg-[#EC796B]"],
    },
    darkTextOnBackground: false,
  },
  {
    label: "Loopring",
    icon: "/icons/loopring.png",
    key: "loopring",
    urlKey: "loopring",
    chainType: "L2",
    ecosystem: ["all-chains"], // add ecosystems when unhiding from the UI
    description: "",
    border: {
      light: ["border-[#4F5EDF]", "border-[#4F5EDF]"],
      dark: ["border-[#4F5EDF]", "border-[#4F5EDF]"],
    },
    colors: {
      light: ["#4F5EDF", "#4F5EDF"], // dark greenish
      dark: ["#4F5EDF", "#4F5EDF"], // dark greenish
    },
    backgrounds: {
      light: ["bg-[#4F5EDF]", "bg-[#4F5EDF]"],
      dark: ["bg-[#4F5EDF]", "bg-[#4F5EDF]"],
    },
    darkTextOnBackground: false,
  },
  {
    label: "rhino.fi",
    icon: "/icons/rhino.png",
    key: "rhino",
    urlKey: "rhino-fi",
    chainType: "L2",
    ecosystem: ["all-chains"], // add ecosystems when unhiding from the UI
    description: "",
    border: {
      light: ["border-[#ECB16B]", "border-[#ECB16B]"],
      dark: ["border-[#ECB16B]", "border-[#ECB16B]"],
    },
    colors: {
      light: ["#ECB16B", "#ECB16B"], // dark greenish
      dark: ["#ECB16B", "#ECB16B"], // dark greenish
    },
    backgrounds: {
      light: ["bg-[#ECB16B]", "bg-[#ECB16B]"],
      dark: ["bg-[#ECB16B]", "bg-[#ECB16B]"],
    },
    darkTextOnBackground: false,
  },
  {
    label: "Metis",
    icon: "/icons/metis.png",
    key: "metis",
    urlKey: "metis",
    chainType: "L2",
    ecosystem: ["all-chains"], // add ecosystems when unhiding from the UI
    description: "",
    border: {
      light: ["border-[#20BACD]", "border-[#20BACD]"],
      dark: ["border-[#20BACD]", "border-[#20BACD]"],
    },
    colors: {
      light: ["#20BACD", "#20BACD"], // dark greenish
      dark: ["#20BACD", "#20BACD"], // dark greenish
    },
    backgrounds: {
      light: ["bg-[#20BACD]", "bg-[#20BACD]"],
      dark: ["bg-[#20BACD]", "bg-[#20BACD]"],
    },
    darkTextOnBackground: false,
  },
  {
    label: "Manta",
    icon: "/icons/manta.png",
    key: "manta",
    urlKey: "manta",
    chainType: "L2",
    ecosystem: ["all-chains"], // add ecosystems when unhiding from the UI
    description: "",
    border: {
      light: ["border-[#FB4FF2]", "border-[#FB4FF2]"],
      dark: ["border-[#FB4FF2]", "border-[#FB4FF2]"],
    },
    colors: {
      light: ["#FB4FF2", "#FB4FF2"], // dark greenish
      dark: ["#FB4FF2", "#FB4FF2"], // dark greenish
    },
    backgrounds: {
      light: ["bg-[#FB4FF2]", "bg-[#FB4FF2]"],
      dark: ["bg-[#FB4FF2]", "bg-[#FB4FF2]"],
    },
    darkTextOnBackground: false,
  },
  {
    label: "Blast",
    icon: "/icons/blast.png",
    key: "blast",
    urlKey: "blast",
    chainType: "L2",
    ecosystem: ["all-chains"], // add ecosystems when unhiding from the UI
    description: "",
    border: {
      light: ["border-[#E9E238]", "border-[#E9E238]"],
      dark: ["border-[#FEFF00]", "border-[#FEFF00]"],
    },
    colors: {
      light: ["#E9E238", "#E9E238"], // dark greenish
      dark: ["#FEFF00", "#FEFF00"], // dark greenish
    },
    backgrounds: {
      light: ["bg-[#E9E238]", "bg-[#E9E238]"],
      dark: ["bg-[#FEFF00]", "bg-[#FEFF00]"],
    },
    darkTextOnBackground: true,
  },
  {
    label: "Mode Network",
    icon: "/icons/mode.png",
    key: "mode",
    urlKey: "mode",
    chainType: "L2",
    ecosystem: ["op-stack", "op-super", "all-chains"], // add ecosystems when unhiding from the UI
    description: "",
    border: {
      light: ["border-[#C4DF00]", "border-[#C4DF00]"],
      dark: ["border-[#C4DF00]", "border-[#C4DF00]"],
    },
    colors: {
      light: ["#C4DF00", "#C4DF00"], // dark greenish
      dark: ["#C4DF00", "#C4DF00"], // dark greenish
    },
    backgrounds: {
      light: ["bg-[#C4DF00]", "bg-[#C4DF00]"],
      dark: ["bg-[#C4DF00]", "bg-[#C4DF00]"],
    },
    darkTextOnBackground: true,
  },
  {
    label: "Taiko",
    icon: "/icons/taiko.png",
    key: "taiko",
    urlKey: "taiko",
    chainType: "L2",
    ecosystem: ["all-chains"], // add ecosystems when unhiding from the UI
    description: "",
    border: {
      light: ["border-[#E81899]", "border-[#E81899]"],
      dark: ["border-[#E81899]", "border-[#E81899]"],
    },
    colors: {
      light: ["#E81899", "#E81899"], // dark greenish
      dark: ["#E81899", "#E81899"], // dark greenish
    },
    backgrounds: {
      light: ["bg-[#E81899]", "bg-[#E81899]"],
      dark: ["bg-[#E81899]", "bg-[#E81899]"],
    },
    darkTextOnBackground: false,
  },
  {
    label: "Multiple Chains",
    icon: null,
    key: "multiple",
    urlKey: "multiple",
    chainType: "all-L2",
    ecosystem: [],
    description: "",
    border: {
      light: ["border-[#cdd8d3]", "border-[#cdd8d3]"],
      dark: ["border-[#cdd8d3]", "border-[#cdd8d3]"],
    },
    colors: {
      // light: ["#F130DE", "#FB4FF2"], // pink
      // dark: ["#F130DE", "#FB4FF2"] // pink
      light: ["#cdd8d3", "#cdd8d3"], // soft green
      dark: ["#cdd8d3", "#cdd8d3"], // soft green
    },
    backgrounds: {
      light: ["bg-[#cdd8d3]", "bg-[#cdd8d3]"],
      dark: ["bg-[#cdd8d3]", "bg-[#cdd8d3]"],
    },
    darkTextOnBackground: false,
  },
  {
    label: "All L2s",
    icon: "/icons/x.png",

    key: "all_l2s",
    urlKey: "all-l2s",
    chainType: null,
    ecosystem: ["op-stack", "op-super", "all-chains"],
    description: "",
    border: {
      light: ["border-[#FFDF27]", "border-[#FE5468]"],
      dark: ["border-[#FFDF27]", "border-[#FE5468]"],
    },
    colors: {
      light: ["#FFDF27", "#FE5468"], // yellow
      dark: ["#FFDF27", "#FE5468"], // yellow
    },
    backgrounds: {
      light: ["bg-[#FFDF27]", "bg-[#FE5468]"],
      dark: ["bg-[#FFDF27]", "bg-[#FE5468]"],
    },
    darkTextOnBackground: false,
  },
];

export const AllChainsByKeys: { [key: string]: Chain } = AllChains.reduce(
  (acc, chain) => {
    acc[chain.key] = chain;
    return acc;
  },
  {},
);

export const AllChainsByLabels: { [label: string]: Chain } = AllChains.reduce(
  (acc, chain) => {
    acc[chain.label] = chain;
    return acc;
  },
  {},
);

export const AllChainsByUrlKey: { [urlKey: string]: Chain } = AllChains.reduce(
  (acc, chain) => {
    acc[chain.urlKey] = chain;
    return acc;
  },
  {},
);

export const EnabledChainsByKeys: { [key: string]: Chain } = AllChains.reduce(
  (acc, chain) => {
    if (chain.chainType === "L2") {
      if (chain.ecosystem.includes("all-chains")) {
        acc[chain.key] = chain;
      }
    } else {
      acc[chain.key] = chain;
    }
    return acc;
  },
  {},
);

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
