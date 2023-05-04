export const AllChains = [
  {
    label: "Ethereum",
    icon: "/icons/ethereum.png",
    key: "ethereum",
    chainType: "L1",
    border: {
      light: ["border-[#293305]", "border-[#293305]"],
      dark: ["border-[#d7dfde]", "border-[#d7dfde]"],
    },
    colors: {
      light: ["#293305", "#293305"], // text color
      dark: ["#d7dfde", "#d7dfde"], // text color
    }, // yellow-orange
  },
  {
    label: "Arbitrum",
    icon: "/icons/arbitrum.png",
    key: "arbitrum",
    chainType: "L2",
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
    chainType: "L2",
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
    chainType: "L2",
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
    chainType: "L2",
    border: {
      light: ["border-[#800094]", "border-[#800094]"],
      dark: ["border-[#AD0DC5]", "border-[#AD0DC5]"],
    },
    colors: {
      light: ["#800094", "#800094"], // purple
      dark: ["#AD0DC5", "#AD0DC5"], // purple
    },
  },
  {
    label: "Loopring",
    icon: "/icons/loopring.png",
    key: "loopring",
    chainType: "L2",
    border: {
      light: ["border-[#000000]", "border-[#000000]"],
      dark: ["border-[#000000]", "border-[#000000]"],
    },
    colors: {
      light: ["#000000", "#000000"], // black
      dark: ["#000000", "#000000"], // black
    },
  },
  {
    label: "Optimism",
    icon: "/icons/optimism.png",
    key: "optimism",
    chainType: "L2",
    border: {
      light: ["border-[#DD3408]", "border-[#DD3408]"],
      dark: ["border-[#FE5468]", "border-[#FE5468]"],
    },
    colors: {
      light: ["#DD3408", "#DD3408"], // red-orange
      dark: ["#FE5468", "#FE5468"], // red-orange
    },
  },
  {
    label: "Multiple",
    icon: null,
    key: "multiple",
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
  },
  {
    label: "All L2s",
    icon: "/icons/x.png",

    key: "all_l2s",
    chainType: null,
    border: {
      light: ["border-[#DAEE75]", "border-[#DAEE75]"],
      dark: ["border-[#EEFF97]", "border-[#EEFF97]"],
    },
    colors: {
      light: ["#DAEE75", "#DAEE75"], // light green
      dark: ["#EEFF97", "#EEFF97"], // light green
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
