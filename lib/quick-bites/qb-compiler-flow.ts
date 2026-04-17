// Quick Bite: Programming Languages Facilitating Transactions
import { QuickBiteData } from '@/lib/types/quickBites';
import { FaqItem, renderFaqMarkdown, generateJsonLdFaq } from './seo_helper';

const COLOR_SOLIDITY = "#FE5468";
const COLOR_VYPER = "#B45CF4";
const COLOR_UNVERIFIED = "#636A72";

const SOLIDITY_VERSION_COLORS = ["#FFD580", "#FFB300", "#FF8C00", "#E05A00", "#FE5468", "#CC0030", "#990020", "#660015"];
const VYPER_VERSION_COLORS = ["#DDB4FE", "#B45CF4", "#9333EA", "#6B21A8", "#4C1D95", "#2E1065"];

// Weekly timeseries: data.types = ["unix"(0), "solidity"(1), "unverified"(2), "vyper"(3)]
// Totals:            data.types = ["code_language"(0), "total_gas_fees_eth"(1), "total_gas_fees_usd"(2), "total_txcount"(3)]

const PIE_COLORS = [COLOR_SOLIDITY, COLOR_UNVERIFIED, COLOR_VYPER];
const PIE_NAME_MAP = { solidity: "Solidity", unverified: "Unverified", vyper: "Vyper" };

const chainDropdown = {
  label: "Select a Chain",
  placeholder: "Choose a chain",
  searchable: true,
  stateKey: "selectedChain",
  labelStateKey: "selectedChainName",
  defaultValue: "ethereum",
  allowEmpty: false,
  readFromJSON: true,
  jsonData: {
    url: "https://api.growthepie.com/v1/quick-bites/sourcify/dropdown-chains.json",
    pathToOptions: "dropdown_values",
    valueField: "origin_key",
    labelField: "name",
    useChainIcons: true,
  },
};

function buildAreaMeta(fileKey: string, options: { prefix?: string; suffix?: string; tooltipDecimals?: number } = {}) {
  const base = {
    type: "area",
    stacking: "percent",
    xIndex: 0,
    tooltipDecimals: options.tooltipDecimals ?? 0,
    ...(options.prefix ? { prefix: options.prefix } : {}),
    ...(options.suffix ? { suffix: options.suffix } : {}),
    pathToData: "data.values",
  };
  const url = `https://api.growthepie.com/v1/quick-bites/sourcify/{{selectedChain}}_compiler_weekly_${fileKey}.json`;
  return [
    { ...base, name: "Solidity",   color: COLOR_SOLIDITY,   yIndex: 1, url },
    { ...base, name: "Unverified", color: COLOR_UNVERIFIED, yIndex: 2, url },
    { ...base, name: "Vyper",      color: COLOR_VYPER,      yIndex: 3, url },
  ];
}

function buildPieChart(yIndex: number, options: { tooltipDecimals?: number; prefix?: string; suffix?: string } = {}) {
  return {
    type: "pie",
    title: "Total",
    centerName: "TOTAL\nSHARE",
    height: 420,
    dataAsJson: {
      pieData: {
        url: "https://api.growthepie.com/v1/quick-bites/sourcify/{{selectedChain}}_compiler_total.json",
        pathToData: "data.values",
        xIndex: 0,
        yIndex,
        colors: PIE_COLORS,
        nameMap: PIE_NAME_MAP,
        tooltipDecimals: options.tooltipDecimals ?? 0,
        ...(options.prefix ? { prefix: options.prefix } : {}),
        ...(options.suffix ? { suffix: options.suffix } : {}),
        showPercentage: true,
      },
    },
    caption: "All-time cumulative share across Solidity, Vyper, and unverified contracts.",
  };
}

function buildVersionPieChart(
  lang: "solidity" | "vyper",
  yIndex: number,
  colors: string[],
  options: { tooltipDecimals?: number; prefix?: string; suffix?: string } = {},
) {
  return {
    type: "pie",
    title: "Total",
    centerName: "TOTAL\nSHARE",
    height: 420,
    dataAsJson: {
      pieData: {
        url: `https://api.growthepie.com/v1/quick-bites/sourcify/{{selectedChain}}_${lang}_version_total.json`,
        pathToData: "data.values",
        xIndex: 0,
        yIndex,
        colors,
        tooltipDecimals: options.tooltipDecimals ?? 0,
        ...(options.prefix ? { prefix: options.prefix } : {}),
        ...(options.suffix ? { suffix: options.suffix } : {}),
        showPercentage: true,
      },
    },
    caption: `All-time cumulative share across ${lang === "solidity" ? "Solidity" : "Vyper"} compiler versions.`,
  };
}

function buildVersionDynamicSeries(
  lang: "solidity" | "vyper",
  fileKey: string,
  colors: string[],
  options: { tooltipDecimals?: number; prefix?: string; suffix?: string } = {},
) {
  return {
    dynamicSeries: {
      url: `https://api.growthepie.com/v1/quick-bites/sourcify/{{selectedChain}}_${lang}_version_weekly_${fileKey}.json`,
      pathToData: "data.values",
      pathToTypes: "data.types",
      ystartIndex: 1,
      xIndex: 0,
      colors,
      stacking: "percent" as const,
      tooltipDecimals: options.tooltipDecimals ?? 0,
      ...(options.prefix ? { prefix: options.prefix } : {}),
      ...(options.suffix ? { suffix: options.suffix } : {}),
    },
  };
}

const SolidityVersionToggle = [
  "```chart-toggle",
  JSON.stringify({
    layout: "segmented",
    defaultIndex: 0,
    charts: [
      {
        toggleLabel: "TX Count",
        sideChart: buildVersionPieChart("solidity", 3, SOLIDITY_VERSION_COLORS),
        type: "area",
        title: "Transaction Share by Solidity Version on {{selectedChainName}}",
        subtitle: "Weekly percentage of transactions going to contracts by Solidity compiler version.",
        showXAsDate: true,
        dataAsJson: buildVersionDynamicSeries("solidity", "total_txcount", SOLIDITY_VERSION_COLORS),
        height: 420,
        caption: "Each week's bar shows how the total transaction count is split across Solidity compiler versions.",
      },
      {
        toggleLabel: "Gas Fees ETH",
        sideChart: buildVersionPieChart("solidity", 1, SOLIDITY_VERSION_COLORS, { suffix: " ETH", tooltipDecimals: 2 }),
        type: "area",
        title: "Gas Fee Share (ETH) by Solidity Version on {{selectedChainName}}",
        subtitle: "Weekly percentage of ETH gas fees going to contracts by Solidity compiler version.",
        showXAsDate: true,
        dataAsJson: buildVersionDynamicSeries("solidity", "total_gas_fees_eth", SOLIDITY_VERSION_COLORS, { suffix: " ETH", tooltipDecimals: 2 }),
        height: 420,
        caption: "Each week's bar shows how total ETH gas fees are split across Solidity compiler versions.",
      },
      {
        toggleLabel: "Gas Fees USD",
        sideChart: buildVersionPieChart("solidity", 2, SOLIDITY_VERSION_COLORS, { prefix: "$" }),
        type: "area",
        title: "Gas Fee Share (USD) by Solidity Version on {{selectedChainName}}",
        subtitle: "Weekly percentage of USD gas fees going to contracts by Solidity compiler version.",
        showXAsDate: true,
        dataAsJson: buildVersionDynamicSeries("solidity", "total_gas_fees_usd", SOLIDITY_VERSION_COLORS, { prefix: "$" }),
        height: 420,
        caption: "Each week's bar shows how total USD gas fees are split across Solidity compiler versions.",
      },
    ],
  }),
  "```",
];

const VyperVersionToggle = [
  "```chart-toggle",
  JSON.stringify({
    layout: "segmented",
    defaultIndex: 0,
    charts: [
      {
        toggleLabel: "TX Count",
        sideChart: buildVersionPieChart("vyper", 3, VYPER_VERSION_COLORS),
        type: "area",
        title: "Transaction Share by Vyper Version on {{selectedChainName}}",
        subtitle: "Weekly percentage of transactions going to contracts by Vyper compiler version.",
        showXAsDate: true,
        dataAsJson: buildVersionDynamicSeries("vyper", "total_txcount", VYPER_VERSION_COLORS),
        height: 420,
        caption: "Each week's bar shows how the total transaction count is split across Vyper compiler versions.",
      },
      {
        toggleLabel: "Gas Fees ETH",
        sideChart: buildVersionPieChart("vyper", 1, VYPER_VERSION_COLORS, { suffix: " ETH", tooltipDecimals: 2 }),
        type: "area",
        title: "Gas Fee Share (ETH) by Vyper Version on {{selectedChainName}}",
        subtitle: "Weekly percentage of ETH gas fees going to contracts by Vyper compiler version.",
        showXAsDate: true,
        dataAsJson: buildVersionDynamicSeries("vyper", "total_gas_fees_eth", VYPER_VERSION_COLORS, { suffix: " ETH", tooltipDecimals: 2 }),
        height: 420,
        caption: "Each week's bar shows how total ETH gas fees are split across Vyper compiler versions.",
      },
      {
        toggleLabel: "Gas Fees USD",
        sideChart: buildVersionPieChart("vyper", 2, VYPER_VERSION_COLORS, { prefix: "$" }),
        type: "area",
        title: "Gas Fee Share (USD) by Vyper Version on {{selectedChainName}}",
        subtitle: "Weekly percentage of USD gas fees going to contracts by Vyper compiler version.",
        showXAsDate: true,
        dataAsJson: buildVersionDynamicSeries("vyper", "total_gas_fees_usd", VYPER_VERSION_COLORS, { prefix: "$" }),
        height: 420,
        caption: "Each week's bar shows how total USD gas fees are split across Vyper compiler versions.",
      },
    ],
  }),
  "```",
];

const CombinedToggle = [
  "```chart-toggle",
  JSON.stringify({
    layout: "segmented",
    defaultIndex: 0,
    charts: [
      {
        toggleLabel: "TX Count",
        sideChart: buildPieChart(3),
        type: "area",
        title: "Transaction Share by Language on {{selectedChainName}}",
        subtitle: "Weekly percentage of transactions going to Solidity, Vyper, and unverified contracts.",
        showXAsDate: true,
        dataAsJson: { meta: buildAreaMeta("total_txcount") },
        height: 420,
        caption: "Each week's bar shows how the total transaction count is split across smart contract languages.",
      },
      {
        toggleLabel: "Gas Fees ETH",
        sideChart: buildPieChart(1, { suffix: " ETH", tooltipDecimals: 2 }),
        type: "area",
        title: "Gas Fee Share (ETH) by Language on {{selectedChainName}}",
        subtitle: "Weekly percentage of ETH gas fees going to Solidity, Vyper, and unverified contracts.",
        showXAsDate: true,
        dataAsJson: { meta: buildAreaMeta("total_gas_fees_eth", { suffix: " ETH", tooltipDecimals: 2 }) },
        height: 420,
        caption: "Each week's bar shows how total ETH gas fees are split across smart contract languages.",
      },
      {
        toggleLabel: "Gas Fees USD",
        sideChart: buildPieChart(2, { prefix: "$" }),
        type: "area",
        title: "Gas Fee Share (USD) by Language on {{selectedChainName}}",
        subtitle: "Weekly percentage of USD gas fees going to Solidity, Vyper, and unverified contracts.",
        showXAsDate: true,
        dataAsJson: { meta: buildAreaMeta("total_gas_fees_usd", { prefix: "$" }) },
        height: 420,
        caption: "Each week's bar shows how total USD gas fees are split across smart contract languages.",
      },
    ],
  }),
  "```",
];

export const faqItems: FaqItem[] = [
  {
    q: "What is the Argot Collective?",
    a: "The Argot Collective is a non-profit research and development organization dedicated to sustaining Ethereum's core programming languages and tooling. They maintain critical infrastructure including Solidity (the primary EVM smart contract language), Fe (a statically-typed EVM alternative), Sourcify (decentralized source-code verification), Hevm (a symbolic execution engine), Ethdebug and Act. Their mission is to make smart contract development simpler, safer and more resilient by providing a stable long-term home for these foundational projects.",
  },
  {
    q: "How are the numbers calculated?",
    a: "Only contract interaction transactions are counted, native ETH transfers are excluded. To remove low-activity noise, contracts with fewer than three transactions per day on average are filtered out. Source code verification data is sourced from [Sourcify](https://sourcify.dev) via the [Open Labels Initiative](https://www.openlabelsinitiative.org/).",
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const CompilerFlow: QuickBiteData = {
  title: "Programming Languages That Power Onchain Activity",
  shortTitle: "Smart Contract Language by Flow",
  subtitle: "Analysing active contract interactions to reveal compiler and language usage in production environments.",
  content: [

    "Rather than looking at the compilers of top value-locked contracts, this analysis measures actual usage. By aggregating transaction activity across active smart contracts and linking it to compiler metadata, it reveals which programming languages are truly driving onchain execution.",

    "```dropdown",
    JSON.stringify(chainDropdown),
    "```",

    "# Which Languages Power Onchain Activity?",
    "Every transaction on an EVM chain ultimately calls a smart contract. By cross-referencing verified contracts on Sourcify, we can attribute onchain transaction volume to the programming language used to write the contract. This reveals how much activity flows through Solidity contracts, Vyper contracts, or contracts whose source code has not been verified.",

    ...CombinedToggle,

    "## Solidity Compiler Versions",
    "Not all Solidity versions are equal. Each major release introduced breaking changes and new safety features — version 0.8 added built-in overflow protection, removing the need for SafeMath. The breakdown below shows which versions drive the most onchain activity on {{selectedChainName}}.",

    ...SolidityVersionToggle,

    "## Vyper Compiler Versions",
    "Vyper's version history is more compact. Version 0.3 brought improvements to ABI encoding and gas efficiency, while 0.4 introduced transient storage support. The breakdown below shows how activity on {{selectedChainName}} is distributed across Vyper releases.",

    ...VyperVersionToggle,

    ...renderFaqMarkdown(faqItems, { title: "Methodology" }),

    "> This page is a data tracker for informational and educational purposes only. It is not investment advice. Data may be delayed or inaccurate. Do your own research.",
  ],
  image: "",
  og_image: "",
  date: "2026-04-17",
  related: [],
  author: [
    {
      name: "Lorenz Lehmann",
      xUsername: "LehmannLorenz",
    },
  ],
  topics: [
    {
      icon: "gtp-nft",
      name: "Argot",
      url: "https://www.argot.org/",
    },
    {
      icon: "book-open",
      name: "Sourcify",
      url: "https://sourcify.dev/",
    },
    {
      icon: "oli-open-labels-initiative",
      name: "Open Labels Initiative",
      url: "https://www.openlabelsinitiative.org/",
    },
  ],
  icon: "",
  showInMenu: false,
  faq: faqItems,
  jsonLdFaq: jsonLdFaq,
};

export default CompilerFlow;
