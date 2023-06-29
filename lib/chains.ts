export const AllChains = [
  {
    label: "Ethereum",
    icon: "/icons/ethereum.png",
    key: "ethereum",
    urlKey: "ethereum",
    chainType: "L1",
    description:
      "Ethereum was proposed by Vitalik Buterin in 2013 and launched in 2015. It is arguably the most decentralized smart contract platform to date. The goal is to scale Ethereum through the usage of Layer 2s.",
    border: {
      light: ["border-[#293305]", "border-[#293305]"],
      dark: ["border-[#C1C1C1]", "border-[#C1C1C1]"],
    },
    colors: {
      light: ["#293305", "#293305"], // text color
      dark: ["#C1C1C1", "#C1C1C1"], // text color
    }, // yellow-orange
    backgrounds: {
      light: ["bg-[#293305]", "bg-[#293305]"],
      dark: ["bg-[#C1C1C1]", "bg-[#C1C1C1]"],
    },
  },
  {
    label: "Arbitrum",
    icon: "/icons/arbitrum.png",
    key: "arbitrum",
    urlKey: "arbitrum",
    chainType: "L2",
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
  },
  {
    label: "Aztec V2",
    icon: "/icons/aztec.png",
    key: "aztecv2",
    urlKey: "aztec-v2",
    chainType: "L2",
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
  },

  {
    label: "Immutable X",
    icon: "/icons/immutablex.png",
    key: "imx",
    urlKey: "immutable-x",
    chainType: "L2",
    description:
      "Immutable X is an optimized game-specific zk rollup. It is designed to mint, transfer, and trade tokens and NFTs at higher volumes and zero gas fees. It is not EVM compatible but its easy-to-use APIs and SDKs aim to make development for game devs as easy as possible. It launched in April 2021.",
    border: {
      light: ["border-[#08373C]", "border-[#08373C]"],
      dark: ["border-[#3AFCC9]", "border-[#3AFCC9]"],
    },
    colors: {
      light: ["#08373C", "#08373C"], // dark sea
      dark: ["#3AFCC9", "#3AFCC9"], // dark sea
    },
    backgrounds: {
      light: ["bg-[#08373C]", "bg-[#08373C]"],
      dark: ["bg-[#3AFCC9]", "bg-[#3AFCC9]"],
    },
  },
  {
    label: "Polygon zkEVM",
    icon: "/icons/polygon-pos.png",
    key: "polygon_zkevm",
    urlKey: "polygon-zkevm",
    chainType: "L2",
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
  },
  {
    label: "Loopring",
    icon: "/icons/loopring.png",
    key: "loopring",
    urlKey: "loopring",
    chainType: "L2",
    description: "",
    border: {
      light: ["border-[#000000]", "border-[#000000]"],
      dark: ["border-[#000000]", "border-[#000000]"],
    },
    colors: {
      light: ["#000000", "#000000"], // black
      dark: ["#000000", "#000000"], // black
    },
    backgrounds: {
      light: ["bg-[#000000]", "bg-[#000000]"],
      dark: ["bg-[#000000]", "bg-[#000000]"],
    },
  },
  {
    label: "OP Mainnet",
    icon: "/icons/optimism.png",
    key: "optimism",
    urlKey: "optimism",
    chainType: "L2",
    description:
      "OP Mainnet (formerly Optimism) uses an optimistic rollup approach, where transactions are assumed to be valid unless proven otherwise, and only invalid transactions are rolled back. OP Mainnet launched in August 2021, making it one of the first rollups. It is fully compatible with the Ethereum Virtual Machine (EVM), making it easy for developers to migrate their applications to the Optimism network.",
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
  },
  {
    label: "zkSync Era",
    icon: "/icons/zksync-era.png",
    key: "zksync_era",
    urlKey: "zksync-era",
    chainType: "L2",
    description:
      "zkSync Era is a Layer-2 protocol that scales Ethereum with cutting-edge ZK tech. Their mission isn't to merely increase Ethereum's throughput, but to fully preserve its foundational values – freedom, self-sovereignty, decentralization – at scale.",
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
  },
  {
    label: "Multiple",
    icon: null,
    key: "multiple",
    urlKey: "multiple",
    chainType: "all-L2",

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
  },
  {
    label: "All L2s",
    icon: "/icons/x.png",

    key: "all_l2s",
    urlKey: "all-l2s",
    chainType: null,
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
  },
];

export const AllChainsByKeys = AllChains.reduce((acc, chain) => {
  acc[chain.key] = chain;
  return acc;
}, {});

export const AllChainsByLabels = AllChains.reduce((acc, chain) => {
  acc[chain.label] = chain;
  return acc;
}, {});
