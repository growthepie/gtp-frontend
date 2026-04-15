// Quick Bite: Argot Compiler Analysis
import { QuickBiteData } from '@/lib/types/quickBites';
import {
  FaqItem, renderFaqMarkdown, generateJsonLdFaq,
} from './seo_helper';

// Compiler colors
const COLOR_SOLC = "#FE5468";
const COLOR_VYPER = "#B45CF4";
const COLOR_UNVERIFIED = "#636A72";

// Solidity version palette (light → dark, oldest → newest; extra entries for future versions)
const SOLC_VERSION_COLORS = ["#FFD580", "#FFB300", "#FF8C00", "#E05A00", "#FE5468", "#CC0030", "#990020"];

// Vyper version palette (light → dark; extra entries for future versions)
const VYPER_VERSION_COLORS = ["#DDB4FE", "#B45CF4", "#9333EA", "#6B21A8", "#4C1D95"];

// compiler_tvs_timeseries.json  → ["date"(0), "solc"(1), "unverified"(2), "vyper"(3)]
// compiler_ct_timeseries.json   → ["date"(0), "solc"(1), "unverified"(2), "vyper"(3)]
// solc_tvs/ct_timeseries.json   → ["date"(0), "0.4"(1), "0.5"(2), "0.6"(3), "0.7"(4), "0.8"(5)]
// vyper_tvs/ct_timeseries.json  → ["date"(0), "0.2"(1), "0.3"(2)]

// Chart 1: TVS by compiler (line)
const TvsCompilerLineChart = [
  "```chart",
  JSON.stringify({
    type: "line",
    title: "Value Secured by Smart Contract Language",
    subtitle: "Monthly snapshot of TVS across the top 1,000 Ethereum contracts, split by compiler.",
    showXAsDate: true,
    dataAsJson: {
      meta: [
        {
          name: "Solidity",
          color: COLOR_SOLC,
          type: "line",
          xIndex: 0,
          yIndex: 1,
          tooltipDecimals: 0,
          prefix: "$",
          url: "https://api.growthepie.com/v1/quick-bites/argot/compiler_tvs_timeseries.json",
          pathToData: "data.values",
        },
        {
          name: "Unverified",
          color: COLOR_UNVERIFIED,
          type: "line",
          deselected: true,
          xIndex: 0,
          yIndex: 2,
          tooltipDecimals: 0,
          prefix: "$",
          url: "https://api.growthepie.com/v1/quick-bites/argot/compiler_tvs_timeseries.json",
          pathToData: "data.values",
        },
        {
          name: "Vyper",
          color: COLOR_VYPER,
          type: "line",
          xIndex: 0,
          yIndex: 3,
          tooltipDecimals: 0,
          prefix: "$",
          url: "https://api.growthepie.com/v1/quick-bites/argot/compiler_tvs_timeseries.json",
          pathToData: "data.values",
        },
      ],
    },
    height: 420,
    caption: "Source: growthepie.com via Argot. Top 1,000 Ethereum contracts by TVS, monthly snapshots.",
  }),
  "```",
];

// Table: top 1,000 contracts
const TopContractsTable = [
  "```table",
  JSON.stringify({
    readFromJSON: true,
    jsonData: {
      url: "https://api.growthepie.com/v1/quick-bites/argot/table_latest.json",
      pathToRowData: "data.values",
      pathToColumnKeys: "data.types",
    },
    columnDefinitions: {
      address: {
        label: "Contract Address",
        type: "address",
        minWidth: 160,
        isNumeric: false,
        sortByValue: false,
        copyable: true,
        urlConditional: {
          sourceKey: "compiler",
          map: {
            unverified: "https://etherscan.io/address/${cellValue}",
          },
          fallback: "https://sourcify.dev/#/lookup/${cellValue}",
        },
      },
      total_balance_usd: {
        label: "TVS (USD)",
        type: "number",
        isNumeric: true,
        sortByValue: true,
        minWidth: 150,
        units: {
          value: {
            decimals: 0,
            prefix: "$",
          },
        },
      },
      compiler: {
        label: "Compiler",
        type: "string",
        isNumeric: false,
        sortByValue: true,
        chip: true,
        minWidth: 80,
      },
      version: {
        label: "Version",
        type: "string",
        isNumeric: false,
        sortByValue: false,
        minWidth: 180,
      },
      name: {
        label: "Contract Name",
        type: "string",
        isNumeric: false,
        sortByValue: true,
        expand: true,
        minWidth: 180,
      },
      fully_qualified_name: {
        label: "File",
        type: "string",
        isNumeric: false,
        sortByValue: false,
        hidden: true,
        minWidth: 200,
      },
    },
    columnOrder: ["compiler", "version", "name", "address", "total_balance_usd"],
    columnSortBy: "value",
    rowBar: {
      valueColumn: "total_balance_usd",
      color: "linear-gradient(-145deg, rgba(254,84,104,0.6) 0%, rgba(180,92,244,0.6) 100%)",
    },
    maxHeight: 600,
  }),
  "```",
];

// Chart 2: compiler share by TVS (100% area)
// ["date"(0), "solc"(1), "unverified"(2), "vyper"(3)]
const CompilerShareTvsChart = [
  "```chart",
  JSON.stringify({
    type: "area",
    title: "TVS Share by Compiler",
    subtitle: "Percentage of total TVS for the top 1,000 contracts, by compiler.",
    showXAsDate: true,
    dataAsJson: {
      meta: [
        {
          name: "Solidity",
          color: COLOR_SOLC,
          stacking: "percent",
          xIndex: 0,
          yIndex: 1,
          tooltipDecimals: 1,
          prefix: "$",
          url: "https://api.growthepie.com/v1/quick-bites/argot/compiler_tvs_timeseries.json",
          pathToData: "data.values",
        },
        {
          name: "Unverified",
          color: COLOR_UNVERIFIED,
          stacking: "percent",
          xIndex: 0,
          yIndex: 2,
          tooltipDecimals: 1,
          prefix: "$",
          url: "https://api.growthepie.com/v1/quick-bites/argot/compiler_tvs_timeseries.json",
          pathToData: "data.values",
        },
        {
          name: "Vyper",
          color: COLOR_VYPER,
          stacking: "percent",
          xIndex: 0,
          yIndex: 3,
          tooltipDecimals: 1,
          prefix: "$",
          url: "https://api.growthepie.com/v1/quick-bites/argot/compiler_tvs_timeseries.json",
          pathToData: "data.values",
        },
      ],
    },
    height: 380,
    caption: "TVS-weighted compiler share across the top 1,000 Ethereum contracts.",
  }),
  "```",
];

// Chart 3: compiler share by count (100% area)
// ["date"(0), "solc"(1), "unverified"(2), "vyper"(3)]
const CompilerShareCountChart = [
  "```chart",
  JSON.stringify({
    type: "area",
    title: "Contract Count Share by Compiler",
    subtitle: "Percentage of contracts in the top 1,000, by compiler.",
    showXAsDate: true,
    dataAsJson: {
      meta: [
        {
          name: "Solidity",
          color: COLOR_SOLC,
          stacking: "percent",
          xIndex: 0,
          yIndex: 1,
          tooltipDecimals: 0,
          url: "https://api.growthepie.com/v1/quick-bites/argot/compiler_ct_timeseries.json",
          pathToData: "data.values",
        },
        {
          name: "Unverified",
          color: COLOR_UNVERIFIED,
          stacking: "percent",
          xIndex: 0,
          yIndex: 2,
          tooltipDecimals: 0,
          url: "https://api.growthepie.com/v1/quick-bites/argot/compiler_ct_timeseries.json",
          pathToData: "data.values",
        },
        {
          name: "Vyper",
          color: COLOR_VYPER,
          stacking: "percent",
          xIndex: 0,
          yIndex: 3,
          tooltipDecimals: 0,
          url: "https://api.growthepie.com/v1/quick-bites/argot/compiler_ct_timeseries.json",
          pathToData: "data.values",
        },
      ],
    },
    height: 380,
    caption: "Count-weighted compiler share across the top 1,000 Ethereum contracts.",
  }),
  "```",
];

// Chart 4: solc version breakdown by count (100% area, dynamic — new versions auto-appear)
// ["date"(0), "0.4"(1), "0.5"(2), "0.6"(3), "0.7"(4), "0.8"(5), ...]
const SolcVersionCountChart = [
  "```chart",
  JSON.stringify({
    type: "area",
    title: "Solidity Version Share – Contract Count",
    subtitle: "Percentage of Solidity contracts in the top 1,000 by compiler version.",
    showXAsDate: true,
    showTotalTooltip: true,
    dataAsJson: {
      dynamicSeries: {
        url: "https://api.growthepie.com/v1/quick-bites/argot/solc_ct_timeseries.json",
        pathToData: "data.values",
        pathToTypes: "data.types",
        ystartIndex: 1,
        xIndex: 0,
        colors: SOLC_VERSION_COLORS,
        stacking: "percent",
        tooltipDecimals: 0,
      },
    },
    height: 380,
    caption: "Share of Solidity contracts in the top 1,000 by major compiler version. Count-based.",
  }),
  "```",
];

// Chart 5: solc version breakdown by TVS (100% area, dynamic — new versions auto-appear)
// ["date"(0), "0.4"(1), "0.5"(2), "0.6"(3), "0.7"(4), "0.8"(5), ...]
const SolcVersionTvsChart = [
  "```chart",
  JSON.stringify({
    type: "area",
    title: "Solidity Version Share – TVS",
    subtitle: "Percentage of Solidity TVS in the top 1,000 by compiler version.",
    showXAsDate: true,
    showTotalTooltip: true,
    dataAsJson: {
      dynamicSeries: {
        url: "https://api.growthepie.com/v1/quick-bites/argot/solc_tvs_timeseries.json",
        pathToData: "data.values",
        pathToTypes: "data.types",
        ystartIndex: 1,
        xIndex: 0,
        colors: SOLC_VERSION_COLORS,
        stacking: "percent",
        tooltipDecimals: 1,
        prefix: "$",
      },
    },
    height: 380,
    caption: "Share of Solidity TVS in the top 1,000 by major compiler version. TVS-based.",
  }),
  "```",
];

// Chart 6: vyper version breakdown by count (100% area, dynamic — new versions auto-appear)
// ["date"(0), "0.2"(1), "0.3"(2), ...]
const VyperVersionCountChart = [
  "```chart",
  JSON.stringify({
    type: "area",
    title: "Vyper Version Share – Contract Count",
    subtitle: "Percentage of Vyper contracts in the top 1,000 by compiler version.",
    showXAsDate: true,
    showTotalTooltip: true,
    dataAsJson: {
      dynamicSeries: {
        url: "https://api.growthepie.com/v1/quick-bites/argot/vyper_ct_timeseries.json",
        pathToData: "data.values",
        pathToTypes: "data.types",
        ystartIndex: 1,
        xIndex: 0,
        colors: VYPER_VERSION_COLORS,
        stacking: "percent",
        tooltipDecimals: 0,
      },
    },
    height: 380,
    caption: "Share of Vyper contracts in the top 1,000 by major compiler version. Count-based.",
  }),
  "```",
];

// Chart 7: vyper version breakdown by TVS (100% area, dynamic — new versions auto-appear)
// ["date"(0), "0.2"(1), "0.3"(2), ...]
const VyperVersionTvsChart = [
  "```chart",
  JSON.stringify({
    type: "area",
    title: "Vyper Version Share – TVS",
    subtitle: "Percentage of Vyper TVS in the top 1,000 by compiler version.",
    showXAsDate: true,
    showTotalTooltip: true,
    dataAsJson: {
      dynamicSeries: {
        url: "https://api.growthepie.com/v1/quick-bites/argot/vyper_tvs_timeseries.json",
        pathToData: "data.values",
        pathToTypes: "data.types",
        ystartIndex: 1,
        xIndex: 0,
        colors: VYPER_VERSION_COLORS,
        stacking: "percent",
        tooltipDecimals: 1,
        prefix: "$",
      },
    },
    height: 380,
    caption: "Share of Vyper TVS in the top 1,000 by major compiler version. TVS-based.",
  }),
  "```",
];

export const faqItems: FaqItem[] = [
  {
    q: "What is the Argot Collective?",
    a: "The Argot Collective is a non-profit research and development organization dedicated to sustaining Ethereum's core programming languages and tooling. They maintain critical infrastructure including Solidity (the primary EVM smart contract language), Fe (a statically-typed EVM alternative), Sourcify (decentralized source-code verification), Hevm (a symbolic execution engine), Ethdebug and Act. Their mission is to make smart contract development simpler, safer and more resilient by providing a stable long-term home for these foundational projects.",
  },
  {
    q: "Which tokens are tracked to get the TVS?",
    a: "TVS is calculated by tracking token balances across the top 1,000 contracts. We use [L2beat's open source token mapping](https://github.com/l2beat/l2beat/blob/5a6b284dc52206affabfa1365f4d6a461d5d31b7/packages/config/src/tokens/tokens.jsonc) as our base, excluding a few tokens, for a total of 478 tracked assets. The full list: 10SET, 1INCH, A8, AAVE, ACH, ACX, ADI, AEVO, AGIX, AIUS, ALEPH, ALEX, ALI, ALT, AMINO, AMO, AMP, ANC, ANIME, ANKR, ANT, ANY, APE, APEX, API3, APW, ARB, ARC, ARPA, ATA, AUDIO, AURORA, AXGT, AXL, AXS, AZERO, AZTEC, BADGER, BAG, BAL, BAND, BAT, BEAM, BEL, BETS, BFC, BGB, BICO, BIT, BITCOIN, BLUR, BNRY, BNT, BOBA, BONE, BORG, BRKL, BTRST, BTT, BUSD, BabyDoge, C98, CAPS, CAPX, CEL, CELO, CELR, CET, CHR, CHSB, CHZ, CLEAR, CNFI, COMP, COPI, COTI, COW, CREDI, CRTS, CRV, CTSI, CTX, CVC, CVX, CYBER, DAI, DAO, DENT, DEXTF, DFX, DG, DHT, DIA, DIP, DIVI, DODO, DOG, DOLA, DPI, DPX, DYDX, EIGEN, EKUBO, ELON, ENA, ENJ, ENS, EPIK, EQB, ERN, ESP, ETH, ETH+, ETHFI, ETHx, EUL, EURA, EURC, EURT, EXD, FARM, FBTC, FEG, FEI, FET, FFM, FIS, FLT, FNXAI, FOOM, FORE, FORT, FOX, FPI, FPIS, FRAX, FRAX.legacy, FRTN, FTM, FTX Token, FUEL, FUL, FX, G, GAINS, GALA, GAME, GEAR, GENE, GENOME, GHO, GHST, GLM, GNO, GOB, GOG, GOVI, GPT, GRT, GT, GTC, GUSD, HAIR, HAN, HAUST, HEART, HEGIC, HEU, HEZ, HMKR, HOP, HOT, HSK, HT, HUSD, ILV, IMX, INJ, JASMY, KCS, KEEP, KIBSHI, KNC, KNINE, KOI, KP3R, LAMB, LBTC, LDO, LDY, LEASH, LEO, LGHO, LINK, LIT, LL, LOGX, LOKA, LON, LOOKS, LORDS, LPT, LQTY, LRC, LSK, LUMIA, LUSD, LYRA, LYXe, LsETH, MAGIC, MANA, MASK, MATIC, MAV, MAVIA, MC, MCB, MELD, MIM, MIR, MKR, MLN, MNT, MOON, MORPHO, MTL, MUTE, MVI, MXC, MYRIA, MYT, Metis, NEAR, NEXO, NEXT, NFT, NFTD, NSTR, NU, NUM, NXM, OBI, OCEAN, OGN, OHM, OIK, OKB, OLAS, OLE, OM, OMG, OMI, ONDO, OPAI, OPN, ORBS, ORION, OUSD, OUSG, OVR, PARAM, PAXG, PBX, PC, PEAS, PENDLE, PEOPLE, PEPE, PEPU, PERP, PHA, PLA, PLUME, PMON, PNK, PNT, POL, POLY, POND, PORK, PORTX, POWER, POWR, PREMIA, PROM, PSP, PT, PUFFER, PUNDIX, PYR, Puff, QNT, QUEST, RACA, RAD, RAI, RAZOR, RBX, RDO, REEF, REN, REQ, RGT, RLY, RNDR, RPL, RSC, RSR, RSS3, RUNE, SAND, SDL, SDT, SHIB, SIPHER, SIS, SKL, SKY, SLP, SNT, SNX, SOL, SOPH, SOUL, SPEC, SPX, SQD, SRM, SSV, STARL, STG, STONE, STORJ, STRK, SUI, SUPER, SUSHI, SWELL, SX, SXP, SYN, SYND, Silo, SolvBTC, SolvBTC.BBN, T, TAIKO, TBANK, TEL, THALES, TLOS, TOKE, TONCOIN, TOPIA, TRAC, TRADE, TRALA, TRB, TRESTLE, TRIBE, TRN, TRUF, TUSD, UFO, UMA, UNI, UNP, UOS, USD0++, USDC, USDD, USDM, USDN, USDP, USDT, USDe, USTB, USUAL, VENT, VERI, VIRTUAL, VITA, VLX, VR, VRTX, WAGMI, WAMPL, WAVAX, WAVES, WBNB, WBTC, WECO, WETH, WLD, WOO, WXM, WXT, XAUt, XCAD, XCHNG, XCN, XDB, XSWAP, XYO, YBR, YFI, YFX, YGG, ZEND, ZKL, ZKS, ZRC, ZRX, alUSD, ankrETH, ankrPOL, cDAI, cETH, cSTONE, cUSDC, cWBTC, cbBTC, cbETH, crvUSD, cvxFXS, deUSD, eBTC, eDLLR, eETH, eSOV, eUSD, eXRD, frxETH, gOHM, iUSD, imgnAI, mBTC, mETH, mRe7BTC, mRe7YIELD, mUSD, mswETH, pUSD, pufETH, pxETH, rDPX, rETH, renBTC, rsETH, rswETH, sDAI, sFRAX.legacy, sUSDS, sUSDe, sUSDz, scrvUSD, sdeUSD, sfrxETH, spETH, stAVAIL, stAethir, stETH, stTAO, stZENT, tBTC, uniETH, vPHA, wUSDM, weETH, weETHs, wstETH, xSUSHI, zkCRO, zunETH, zunUSD.",
  },
  {
    q: "What about other chains?",
    a: "Calculating these numbers is quite resource intensive. If you'd like to see this analysis extended to other chains, reach out to us on X or Discord, we're happy to have a conversation.",
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

// Quick Bite
const ArgotCompiler: QuickBiteData = {
  title: "Programming Languages Securing Ethereum's Value",
  shortTitle: "Ethereum Smart Contract Languages",
  subtitle: "Analyzing the top 1,000 Ethereum contracts by Total Value Secured across smart contract languages and compiler versions.",
  content: [
    "# Solidity and Vyper: Ethereum's Dominant Smart Contract Languages",
    "Most value on Ethereum is held by smart contracts, making it critical that the programming languages used to build them are safe and secure. Two languages dominate: Solidity, a statically typed language with syntax influenced by JavaScript and C++ and Vyper, a Pythonic language designed for simplicity and auditability. ",
    "In this analysis, we use Sourcify-verified contracts to identify the programming language of each contract. Since not all contracts are verified, an additional “unverified” category is included. The analysis focuses on the top 1,000 smart contracts on Ethereum by Total Value Secured (TVS) in each timeframe. TVS is calculated by tracking balances of a defined set of tokens, including native ETH. More on the methodology can be found at the end of this quick bite.",

    ...TvsCompilerLineChart,

    "## Top 1,000 Ethereum Contracts by TVS",
    "The table below shows the latest snapshot of the top 1,000 Ethereum contracts ranked by TVS. Contracts verified through [Sourcify](https://sourcify.dev) show their compiler and version. Unverified contracts have no readable source code onchain.",

    ...TopContractsTable,

    "# How Sourcify Is Reducing the Unknown",
    "Prior to the emergence of Sourcify, interpreting raw production bytecode was largely infeasible, limiting transparency into how smart contracts were implemented. Through systematic source code verification, Sourcify now enables visibility into more than 75% of the TVS in contracts. This significantly enhances transparency and introduces an additional layer of confidence and verifiability for users whose funds are held within these contracts.",

    "```container",
    JSON.stringify({
      blocks: [CompilerShareCountChart, CompilerShareTvsChart],
      className: "flex flex-col lg:grid lg:grid-cols-2 items-start gap-[15px]",
    }),
    "```",

    "# Solidity: Which Version Secures the Most Value?",
    "Solidity has evolved significantly across major versions. Version 0.6 introduced breaking changes related to inheritance and error handling, while version 0.8 added built-in overflow protection, removing the need for `SafeMath` libraries. The version breakdown shows how much value is held in contracts compiled with older versus newer Solidity releases and how gradually the high-value contract landscape has migrated forward.",

    "```container",
    JSON.stringify({
      blocks: [SolcVersionCountChart, SolcVersionTvsChart],
      className: "flex flex-col lg:grid lg:grid-cols-2 items-start gap-[15px]",
    }),
    "```",

    "Solidity 0.6 carries a disproportionately large share of TVS relative to its share by contract count. This is because major protocols such as Uniswap V2, the Ethereum 2.0 deposit contract and early versions of Aave and Compound were written in this version and have not been replaced. In contrast, Solidity 0.8 dominates by contract count, reflecting that much of the newer contract surface area consists of smaller or more recently deployed protocols.",

    "# Vyper: A Leaner but Concentrated Footprint",
    "Vyper's version history is simpler than Solidity's. Version 0.3 brought significant improvements to ABI encoding and gas efficiency. Version 0.4, released in 2024, introduced further security hardening including transient storage support. Curve Finance, which secures billions in stablecoin liquidity, is Vyper's most prominent adopter.",

    "```container",
    JSON.stringify({
      blocks: [VyperVersionCountChart, VyperVersionTvsChart],
      className: "flex flex-col lg:grid lg:grid-cols-2 items-start gap-[15px]",
    }),
    "```",

    "Vyper's TVS is highly concentrated in a small number of contracts. A few Curve pools and related infrastructure account for the majority of the TVS attributed to Vyper. This makes Vyper's TVS chart particularly sensitive to the status of those specific contracts.",

    ...renderFaqMarkdown(faqItems, { title: "Methodology" }),

    "> This page is a data tracker for informational and educational purposes only. It is not investment advice. Data may be delayed or inaccurate. Do your own research.",

  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/argot-compiler.png",
  og_image: "",
  date: "2026-04-14",
  related: [],
  author: [
    {
      name: "Lorenz Lehmann",
      xUsername: "LehmannLorenz",
    },
  ],
  topics: [
    {
      icon: "ethereum-logo-monochrome",
      color: "#94ABD3",
      name: "Ethereum Mainnet",
      url: "/chains/ethereum"
    },
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

export default ArgotCompiler;
