// lib/quick-bites/ethereum-scaling.ts
import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import { 
  FaqItem, renderFaqMarkdown, generateJsonLdFaq,
} from './seo_helper';

const MainKPIs = [
  "```kpi-cards",
  JSON.stringify([
    {
      title: "Ethereum Mainnet TPS",
      value: "{{ethereumCurrentTPS}} TPS",
      description: "This Month's Average",
      icon: "gtp-realtime",
      info:
        "Estimated as total gas per second divided by 100,000 gas per transaction (typical EVM tx size).",
    },
    {
      title: "Ethereum Mainnet Scaling Goal",
      value: "10,000 TPS",
      description: "Target By ~2031",
      icon: "gtp-realtime",
      info:
        "A commonly discussed L1 throughput milestone among Ethereum researchers (pairs with rollup growth).",
    },
    {
      title: "Required Multiplier",
      value: "{{ethereumMultiplier}}×",
      description: "To Reach 10k TPS From Today",
      icon: "gtp-realtime",
      info:
        "How many times today's mainnet throughput must increase to hit 10,000 TPS.",
    },
  ]),
  "```",
];

const HistoricalScaling = [
  "```chart",
  JSON.stringify({
    type: "column",
    title: "Ethereum Mainnet: Historical TPS Capacity",
    showXAsDate: true,
    dataAsJson: {
      meta: [
        {
          name: "Ethereum Mainnet",
          color: "#A3B8D9",
          xIndex: 0,
          yIndex: 1,
          suffix: " TPS",
          prefix: null,
          tooltipDecimals: 2,
          stacking: "normal",
          url: "https://api.growthepie.com/v1/quick-bites/ethereum-scaling/data.json",
          pathToData: "data.historical_tps.monthly.values",
        },
      ],
    },
    height: 400,
    caption:
      "In the last decade, Ethereum Mainnet scaled over {{ethereumHistoricalScale}}x. This scaling speed will increase significantly.",
  }),
  "```",
];

const ProjectedScaling = [
  "```chart",
  JSON.stringify({
    type: "area",
    title: "Ethereum Mainnet: Projected TPS Growth Towards 10,000 TPS",
    showXAsDate: true,
    dataAsJson: {
      meta: [
        {
          name: "Ethereum Mainnet",
          color: "#A3B8D9",
          xIndex: 0,
          yIndex: 1,
          suffix: " TPS",
          prefix: null,
          tooltipDecimals: 2,
          stacking: "normal",
          url: "https://api.growthepie.com/v1/quick-bites/ethereum-scaling/data.json",
          pathToData: "data.projected_tps.monthly.values",
        },
      ],
    },
    yAxisLine: [
      {
        xValue: 1806591485000,
        annotationPositionY: 10,
        annotationPositionX: -49,
        annotationText: "100 TPS, Apr 2027",
        lineStyle: "Dash",
        lineColor: "#19D9D6",
        textColor: "#19D9D6",
        textFontSize: "9px",
        backgroundColor: "#19D9D6",
        lineWidth: 1,
      },
      {
        xValue: 1872341885000,
        annotationPositionY: 10,
        annotationPositionX: -55,
        annotationText: "1,000 TPS, May 2029",
        lineStyle: "Dash",
        lineColor: "#19D9D6",
        textColor: "#19D9D6",
        textFontSize: "9px",
        backgroundColor: "#19D9D6",
        lineWidth: 1,
      },
      {
        xValue: 1938092285000,
        annotationPositionY: 10,
        annotationPositionX: -56,
        annotationText: "10,000 TPS, Jun 2031",
        lineStyle: "Dash",
        lineColor: "#19D9D6",
        textColor: "#19D9D6",
        textFontSize: "9px",
        backgroundColor: "#19D9D6",
        lineWidth: 1,
      },
    ],
    height: 400,
    caption:
      "Ethereum Mainnet aims to scale another {{ethereumMultiplier}}x until Jun 2031.",
  }),
  "```",
];

const L2Scaling = [
  "```chart",
  JSON.stringify({
    type: "area",
    title: "Ethereum Ecosystem: Toward 1,000,000+ TPS with Layer 2s",
    showXAsDate: true,
    dataAsJson: {
      meta: [
        {
          name: "Layer 2s Combined",
          color: "#FFDF27",
          xIndex: 0,
          yIndex: 1,
          suffix: " TPS",
          prefix: null,
          tooltipDecimals: 2,
          stacking: "normal",
          url: "https://api.growthepie.com/v1/quick-bites/ethereum-scaling/data.json",
          pathToData: "data.l2_projected_tps.monthly.values",
        },
        {
          name: "Ethereum Mainnet",
          color: "#A3B8D9",
          xIndex: 0,
          yIndex: 1,
          suffix: " TPS",
          prefix: null,
          tooltipDecimals: 2,
          stacking: "normal",
          url: "https://api.growthepie.com/v1/quick-bites/ethereum-scaling/data.json",
          pathToData: "data.projected_tps.monthly.values",
        },
      ],
    },
    yAxisLine: [
      {
        xValue: 1938092285000,
        annotationPositionY: 10,
        annotationPositionX: -65,
        annotationText: "1 Million TPS, Jun 2031",
        lineStyle: "Dash",
        lineColor: "#19D9D6",
        textColor: "#19D9D6",
        textFontSize: "9px",
        backgroundColor: "#19D9D6",
        lineWidth: 1,
      },
    ],
    height: 400,
    caption:
      "Layer 2 solution s push the ecosystem into million-TPS territory.",
  }),
  "```",
];

export const faqItems: FaqItem[] = [
  {
    q: "When could 10k TPS on Ethereum Mainnet happen?",
    a: "On an illustrative 3x YoY path, ~2031—subject to roadmap realities.",
  },
  {
    q: "Why do we need Layer 1 scaling and Layer 2 scaling?",
    a: "L1 is the credible neutral settlement layer; L2s provide horizontal scale for speed- and cost-sensitive use cases.",
  },
  {
    q: "What does 10,000 TPS on mainnet actually mean?",
    a: "≈1 Ggas/s assuming ≈100,000 gas per tx; a proxy for sustained throughput.",
  },
  {
    q: "Why convert gas to TPS?",
    a: "Gas/sec is protocol-native; dividing by ~100k gas/tx yields a comparable TPS estimate.",
  },
  {
    q: "How do blobs and DAS matter?",
    a: "Cheaper, abundant data availability lets rollups post more data per block, unlocking higher aggregate throughput.",
  },
  {
    q: "What's the difference between Layer 2s and Rollups?",
    a: "Rollups are a type of L2 that post data to Ethereum for security and availability; other L2s use different security models.",
  },
  {
    q: "Will verification stay accessible?",
    a: "That's the goal: scale without sacrificing verifiability or pushing hardware requirements too high.",
  },
];

/** ----------------------------------------------------------------
 *  Additional JSON-LD exports (i.e. FAQ or Dataset) for this Quick Bite
 *  ---------------------------------------------------------------- */

export const jsonLdFaq = generateJsonLdFaq(faqItems);
export const jsonLdDatasets = [
  {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Ethereum Mainnet Historical TPS (monthly)",
    description: "Historical TPS proxy derived from gas/sec, converted assuming ~100k gas per tx.",
    license: "https://creativecommons.org/licenses/by-nc/4.0/",
    creator: { "@type": "Organization", name: "growthepie" },
    temporalCoverage: "2015-07-30/2025-10-31",
    variableMeasured: [
      { "@type": "PropertyValue", name: "date" },
      { "@type": "PropertyValue", name: "tps" }
    ],
    distribution: [{
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: "https://api.growthepie.com/v1/quick-bites/ethereum-scaling/data.json",
      description: "See path data.historical_tps.monthly.values"
    }]
  },
  {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Projected Ethereum Mainnet TPS (monthly)",
    description: "Illustrative projection towards ~10,000 TPS under a ~3x YoY assumption.",
    license: "https://creativecommons.org/licenses/by-nc/4.0/",
    creator: { "@type": "Organization", name: "growthepie" },
    variableMeasured: [
      { "@type": "PropertyValue", name: "date" },
      { "@type": "PropertyValue", name: "tps" }
    ],
    distribution: [{
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: "https://api.growthepie.com/v1/quick-bites/ethereum-scaling/data.json",
      description: "See path data.projected_tps.monthly.values"
    }]
  },
  {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Projected TPS across Ethereum Layer 2s (monthly)",
    description: "Aggregate L2 projection towards million-TPS territory.",
    license: "https://creativecommons.org/licenses/by-nc/4.0/",
    creator: { "@type": "Organization", name: "growthepie" },
    variableMeasured: [
      { "@type": "PropertyValue", name: "date" },
      { "@type": "PropertyValue", name: "tps" }
    ],
    distribution: [{
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: "https://api.growthepie.com/v1/quick-bites/ethereum-scaling/data.json",
      description: "See path data.l2_projected_tps.monthly.values"
    }]
  }
];

const ethereumScaling: QuickBiteData = createQuickBite({
  title: "Scaling Ethereum Mainnet to 10,000 TPS",
  subtitle: "The road to ~1 Ggas/s on Layer 1 and ~1 Tgas/s across Layer 2s",
  shortTitle: "Scaling Ethereum",
  summary: "Data-driven projection of Ethereum's path to ~10,000 TPS on L1 and million-TPS with L2s—charts, assumptions, and roadmap context.",
  content: [
    "Ethereum is on a clear path to scale. Over the next six years, Ethereum Mainnet throughput is expected to surge toward 10,000 transactions per second (TPS) - roughly 1 gigagas per second - while Layer 2s collectively push the ecosystem toward million-TPS capacity.",

    ...MainKPIs,

    "# How far we've come",
    "Since launch, Ethereum Mainnet has methodically improved efficiency and capacity without compromising decentralization or security. It went through several key upgrades, each contributing to incremental improvements in efficiency and capacity. You can read more about these on our [ecosystem](https://www.growthepie.com/ethereum-ecosystem/metrics) page.",
    "> From 2015 to today, Ethereum scaled from ~0.71 TPS to {{ethereumCurrentTPS}} TPS, a {{ethereumHistoricalScale}}x increase.",

    ...HistoricalScaling,

    "# Where we're going next",
    "After years of steady gains, the pace is set to accelerate. The goal is to scale by **~3x per year** with upcoming improvements. This takes today's {{ethereumCurrentTPS}} TPS into the thousands before decade's end.",

    ...ProjectedScaling,

    "## How Ethereum Mainnet scales from here",
    "Ethereum's strategy combines multiple approaches to sustainably increase capacity while preserving its core principles:",
    "- **EIP-7938 (Dankrad Feist)** - proposes a **default, exponential gas-limit growth schedule** where clients vote automatically to increase L1 capacity over time (subject to coordination and override). Read the spec (here)[https://eips.ethereum.org/EIPS/eip-7938].",
    "- **Lean Ethereum (Justin Drake)** - a design philosophy to streamline consensus, data, and execution, leveraging **DAS** and **real-time zkVMs** for “beast mode” performance while staying verifiable. (More)[https://blog.ethereum.org/2025/07/31/lean-ethereum].",
    "- **More EIPs** - parallel efforts improve execution, networking, and data availability. (Slide overview)[https://docs.google.com/presentation/d/1vDkFlUXJ6S94hOGjMkeIO-SP3ZB4ysKPNgu1mskf1No/edit#slide=id.g36e7baa00a1_0_1116].",

    "```image",
    JSON.stringify({
      src: "https://api.growthepie.com/v1/quick-bites/ethereum-scaling/scaling-goals2.png",
      alt: "How Ethereum is scaling: gas growth, DAS, and rollups.",
      width: "800",
      height: "400",
      caption:
        "Mainnet capacity compounds via gas-limit growth + efficiency.",
    }),
    "```",

    "The aim isn't raw TPS alone - it's **sustainable, decentralized scale** that remains easy to verify.",

    "# Horizontal scale with Layer 2s",
    "In addition to scaling execution on Ethereum Mainnet, the Ethereum Ecosystem also scales horizontally via Layer 2 solutions. Layer 2s that handle execution off-chain and post data to Ethereum are called Rollups. As blob capacity grows and data availability sampling matures, Rollups can publish more data per block and scale safely.",
    "> These improvements unlock orders of magnitude of additional throughput - toward 1,000,000+ TPS at the ecosystem level.",

    ...L2Scaling,

    ...renderFaqMarkdown(faqItems),

      "# Conclusion",
    "Ethereum's path to **10k TPS on L1** and **million-TPS with L2s** is driven by pragmatic upgrades and a modular roadmap. The result: lower fees, higher capacity, and preserved neutrality and verification for users and developers.",

    "**Assumptions**",
    "- 100,000 gas per transaction for converting gas/sec → TPS",
    "- Illustrative 3x YoY L1 growth curve; 4x YoY for aggregate L2s",

    "## More Content",
    "Listen to Justin Drake discuss Lean Ethereum and scaling on [Bankless](https://www.youtube.com/watch?v=k53WcsldV1Y):",
    "```iframe",
    JSON.stringify({
      src: "https://www.youtube.com/embed/k53WcsldV1Y?si=j87grXem25CHOU1P",
      width: "100%",
      height: "500px",
      caption: "Justin Drake on Lean Ethereum - Bankless Podcast",
    }),
    "```",

    "**Disclaimer**",
    "Projections are illustrative and depend on research, engineering, coordination, and market conditions. Not financial advice.",
  ],
  image: "/quick-bites/ethereum-scaling.webp",
  og_image: "/quick-bites/ethereum-scaling.webp",
  date: "2025-10-17",
  related: [],
  author: [
    {
      name: "Matthias Seidl",
      xUsername: "web3_data",
    },
  ],
  topics: [
    { name: "Ethereum", url: "/chains/ethereum" },
    { icon: "gtp-metrics-transactioncount", name: "Transaction Count", url: "/fundamentals/transaction-count" },
    { icon: "gtp-metrics-throughput", name: "Throughput", url: "/fundamentals/throughput" },
  ],
  icon: "ethereum-logo-monochrome",
  showInMenu: true,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default ethereumScaling;
