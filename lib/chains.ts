export const AllChains = [
  {
    label: "Ethereum",
    icon: "/icons/ethereum.png",
    key: "ethereum",
    border: ["border-[#08373C]", "border-[#10808C]"],
    colors: ["#08373C", "#10808C"], // dark sea
  },
  {
    label: "Arbitrum",
    icon: "/icons/arbitrum.png",
    key: "arbitrum",
    border: ["border-[#2ECEE8]", "border-[#1DF7EF]"],
    colors: ["#2ECEE8", "#1DF7EF"], // tropical sea
  },
  {
    label: "Aztec V2",
    icon: "/icons/aztec.png",
    key: "aztecv2",
    border: ["border-red-300", "border-red-500"],
    colors: ["#000000", "#000000"],
  },
  {
    label: "Immutable X",
    icon: "/icons/immutablex.png",
    key: "imx",
    border: ["border-[#FBB90D]", "border-[#FFDF27]"],
    colors: ["#FBB90D", "#FFDF27"], // yellow-orange
  },
  {
    label: "Polygon zkEVM",
    icon: "/icons/polygon-pos.png",
    key: "polygon_zkevm",
    border: ["border-[#800094]", "border-[#AD0DC5]"],
    colors: ["#800094", "#AD0DC5"], // purple-ish

  },
  {
    label: "Loopring",
    icon: "/icons/loopring.png",
    key: "loopring",
    border: ["border-yellow-300", "border-yellow-500"],
    colors: ["#000000", "#000000"],
  },
  {
    label: "Optimism",
    icon: "/icons/optimism.png",
    key: "optimism",
    border: ["border-[#DD3408]", "border-[#FE5468]"],
    colors: ["#DD3408", "#FE5468"], // red
  },
  {
    label: "Multiple",
    icon: "/icons/optimism.png",
    key: "multiple",
    border: ["border-[#F130DE]", "border-[#FB4FF2]"],
    colors: ["#F130DE", "#FB4FF2"], // pink
  },
];

export const AllChainsByKeys = AllChains.reduce((acc, chain) => {
  acc[chain.key] = chain;
  return acc;
}, {});
