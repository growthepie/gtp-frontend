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
      light: ["border-[#2ECEE8]", "border-[#1DF7EF]"],
      dark: ["border-[#2ECEE8]", "border-[#1DF7EF]"],
    },
    colors: {
      light: ["#2ECEE8", "#1DF7EF"], // tropical sea
      dark: ["#2ECEE8", "#1DF7EF"], // tropical sea
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
      light: ["border-[#08373C]", "border-[#10808C]"],
      dark: ["border-[#08373C]", "border-[#10808C]"],
    },
    colors: {
      light: ["#08373C", "#10808C"], // dark sea
      dark: ["#08373C", "#10808C"], // dark sea
    },
  },
  {
    label: "Polygon zkEVM",
    icon: "/icons/polygon-pos.png",
    key: "polygon_zkevm",
    border: {
      light: ["border-[#800094]", "border-[#AD0DC5]"],
      dark: ["border-[#800094]", "border-[#AD0DC5]"],
    },
    colors: {
      light: ["#800094", "#AD0DC5"], // purple
      dark: ["#800094", "#AD0DC5"] // purple
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
      light: ["border-[#DD3408]", "border-[#FE5468]"],
      dark: ["border-[#DD3408]", "border-[#FE5468]"],
    },
    colors: {
      light: ["#DD3408", "#FE5468"], // red-orange
      dark: ["#DD3408", "#FE5468"] // red-orange
    },
  },
  {
    label: "Multiple",
    icon: "/icons/optimism.png",
    key: "multiple",
    border: {
      light: ["border-[#F130DE]", "border-[#FB4FF2]"],
      dark: ["border-[#F130DE]", "border-[#FB4FF2]"],
    },
    colors: {
      light: ["#F130DE", "#FB4FF2"], // pink
      dark: ["#F130DE", "#FB4FF2"] // pink
    },
  },
];

export const AllChainsByKeys = AllChains.reduce((acc, chain) => {
  acc[chain.key] = chain;
  return acc;
}, {});
