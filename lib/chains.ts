export const AllChains = [
  {
    label: "Ethereum",
    icon: "/icons/ethereum.png",
    key: "ethereum",
    border: {
      light: ["border-[#293305]", "border-[#293305]"],
      dark: ["border-[#d7dfde]", "border-[#d7dfde]"],
    },
    colors: {
      light: ["#293305", "#293305"], // text color
      dark: ["#d7dfde", "#d7dfde"]  // text color
    }// yellow-orange

  },
  {
    label: "Arbitrum",
    icon: "/icons/arbitrum.png",
    key: "arbitrum",
    border: {
      light: ["border-[#2ECEE8]", "border-[#2ECEE8]"],
      dark: ["border-[#1DF7EF]", "border-[#1DF7EF]"],
    },
    colors: {
      light: ["#2ECEE8", "#2ECEE8"], // tropical sea
      dark: ["#1DF7EF", "#1DF7EF"], // tropical sea
    },
  },
  {
    label: "Aztec V2",
    icon: "/icons/aztec.png",
    key: "aztecv2",
    border: {
      light: ["border-[#000000]", "border-[#000000]"],
      dark: ["border-[#000000]", "border-[#000000]"],
    },
    colors: { light: ["#000000", "#000000"], dark: ["#000000", "#000000"] },
  },
  {
    label: "Immutable X",
    icon: "/icons/immutablex.png",
    key: "imx",
    border: {
      light: ["border-[#08373C]", "border-[#08373C]"],
      dark: ["border-[#10808C]", "border-[#10808C]"],
    },
    colors: {
      light: ["#08373C", "#08373C"], // dark sea
      dark: ["#10808C", "#10808C"], // dark sea
    },
  },
  {
    label: "Polygon zkEVM",
    icon: "/icons/polygon-pos.png",
    key: "polygon_zkevm",
    border: {
      light: ["border-[#800094]", "border-[#800094]"],
      dark: ["border-[#AD0DC5]", "border-[#AD0DC5]"],
    },
    colors: {
      light: ["#800094", "#800094"], // purple
      dark: ["#AD0DC5", "#AD0DC5"] // purple
    },

  },
  {
    label: "Loopring",
    icon: "/icons/loopring.png",
    key: "loopring",
    border: {
      light: ["border-[#000000]", "border-[#000000]"],
      dark: ["border-[#000000]", "border-[#000000]"],
    },
    colors: {
      light: ["#000000", "#000000"], // black
      dark: ["#000000", "#000000"] // black
    },
  },
  {
    label: "Optimism",
    icon: "/icons/optimism.png",
    key: "optimism",
    border: {
      light: ["border-[#DD3408]", "border-[#DD3408]"],
      dark: ["border-[#FE5468]", "border-[#FE5468]"],
    },
    colors: {
      light: ["#DD3408", "#DD3408"], // red-orange
      dark: ["#FE5468", "#FE5468"] // red-orange
    },
  },
  {
    label: "Multiple",
    icon: "/icons/optimism.png",
    key: "multiple",
    border: {
      light: ["border-[#45AA6F]", "border-[#45AA6F]"],
      dark: ["border-[#4CFF7E]", "border-[#4CFF7E]"],
    },
    colors: {
      // light: ["#F130DE", "#FB4FF2"], // pink
      // dark: ["#F130DE", "#FB4FF2"] // pink
      light: ["#45AA6F", "#45AA6F"], // soft green
      dark: ["#4CFF7E", "#4CFF7E"] // soft green
    },
  },
  {
    label: "All L2s",
    icon: "/icons/optimism.png",
    key: "all_l2s",
    border: {
      light: ["border-[#45AA6F]", "border-[#45AA6F]"],
      dark: ["border-[#4CFF7E]", "border-[#4CFF7E]"],
    },
    colors: {
      // light: ["#F130DE", "#FB4FF2"], // pink
      // dark: ["#F130DE", "#FB4FF2"] // pink
      light: ["#45AA6F", "#45AA6F"], // soft green
      dark: ["#4CFF7E", "#4CFF7E"] // soft green
    },
  },
];

export const AllChainsByKeys = AllChains.reduce((acc, chain) => {
  acc[chain.key] = chain;
  return acc;
}, {});
