// lib/quick-bites/ethereum-scaling.ts
import { QuickBiteData } from '@/lib/types/quickBites';

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

const ethereumScaling: QuickBiteData = {
  title: "Scaling Ethereum Mainnet to 10,000 TPS",
  subtitle: "The road to ~1 Ggas/s on Layer 1 and ~1 Tgas/s across Layer 2s",
  content: [
    "Ethereum is on a clear path to scale. Over the next six years, Ethereum Mainnet throughput is expected to surge toward 10,000 transactions per second (TPS) - roughly 1 gigagas per second - while Layer 2s collectively push the ecosystem toward million-TPS capacity.",

    ...MainKPIs,

    "# How far we've come",
    "Since launch, Ethereum Mainnet has methodically improved efficiency and capacity without compromising decentralization or security. It went through several key upgrades, each contributing to incremental improvements in efficiency and capacity. You can read more about these on our [ecosystem](https://www.growthepie.com/ethereum-ecosystem/metrics) page.",
    "> From 2015 to today, Ethereum scaled from ~0.71 TPS to {{ethereumCurrentTPS}} TPS, a {{ethereumHistoricalScale}}x increase.",

    ...HistoricalScaling,

    "# Where we're going next",
    "After years of steady gains, the pace is set to accelerate. The goal it to scale by **~3x per year** with upcoming improvements. This takes today's {{ethereumCurrentTPS}} TPS into the thousands before decade's end.",

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

    "# FAQ",
    "### When could 10k TPS on Ethereum Mainnet happen?",
    "- On an illustrative 3x YoY path, the milestone lands around **~2031** based on current research and development trajectories (subject to roadmap realities).",
    "### Why do we need Layer 1 scaling and Layer 2 scaling?",
    "- Layer 1 is the credible neutral ground for the settlement and issuance of assets and great for deep liquidity and slow-moving money. Layer 2 builds on that foundation but can be more opinionated and optimized for speed and cost-efficiency, providing horizontal scale, ultimately catering to other use-cases like microtransactions, socials, and gaming.",
    "### What does 10,000 TPS on mainnet actually mean?",
    "- Roughly **1 Ggas/s** based on block gas target at 100k gas per tx.",
    "### Why count TPS from gas?",
    "- Gas/sec is protocol-native. Converting via a typical 100k-gas tx yields an apples-to-apples TPS proxy.",
    "### How do blobs and DAS matter?",
    "- Cheaper, abundant data availability lets rollups post more data per block, allowing for horizontal scaling.",
    "### What's the difference between Layer 2s and Rollups?",
    "- Rollups are a type of Layer 2 that post data to Ethereum for security and availability. Other Layer 2s may use different security models.",
    "### Will verification stay cheap for users?",
    "- That's the design goal: scale without sacrificing verifiability or pushing hardware requirements too high.",

      "# Conclusion",
    "Ethereum's path to **10k TPS on L1** and **million-TPS with L2s** is driven by pragmatic upgrades and a modular roadmap. The result: lower fees, higher capacity, and preserved neutrality and verification for users and developers.",

    "**Assumptions**",
    "- 100,000 gas per transaction for converting gas/sec → TPS",
    "- Illustrative 3x YoY L1 growth curve; 4x YoY for aggregate L2s",

    "**Disclaimer**",
    "Projections are illustrative and depend on research, engineering, coordination, and market conditions. Not financial advice.",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/ethereun_scaling_2.png",
  og_image: "https://api.growthepie.com/v1/og_images/quick-bites/ethereum_scaling_og.png",
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
};

export default ethereumScaling;

/** ----------------------------------------------------------------
 *  Minimal SEO helper
 *  ---------------------------------------------------------------- */
export const seo = {
  metaTitle: "Scaling Ethereum: 10,000 TPS on L1, Million-TPS with L2s | growthepie.com",
  metaDescription:
    "Data-driven look at Ethereum scaling: Ethereum Mainnet on a path to ~10,000 TPS (~1 Ggas/s) and Layer 2s toward million-TPS using blobs and DAS.",
  metaKeywords: [
    "Ethereum scaling",
    "Ethereum TPS",
    "EIP-7938",
    "Lean Ethereum",
    "rollups",
    "data availability sampling",
    "blobs",
    "Layer 2",
    "throughput",
  ].join(", "),
  og: {
    image: "https://api.growthepie.com/v1/quick-bites/banners/ethereum-scaling_og.png",
    title: "Scaling Ethereum: 10,000 TPS on L1, Million-TPS with L2s",
    description:
      "Mainnet toward ~1 Ggas/s; L2s toward million-TPS. Charts, assumptions, and roadmap context.",
  },
};

/** ----------------------------------------------------------------
 *  JSON-LD (inject into <Head> as <script type="application/ld+json">{JSON.stringify(jsonLdArticle)}</script>)
 *  ---------------------------------------------------------------- */
export const jsonLdArticle = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "Scaling Ethereum Mainnet to 10,000 TPS",
  alternativeHeadline: "The road to ~1 Ggas/s on L1 and ~1 Tgas/s across Layer 2s",
  description:
    "A data-driven overview of Ethereum throughput today, historical growth, and an illustrative path to ~10,000 TPS on Ethereum Mainnet as well as ecosystem-wide scale via rollups.",
  datePublished: "2025-10-17",
  dateModified: "2025-10-17",
  author: {
    "@type": "Person",
    name: "Matthias Seidl",
    sameAs: ["https://x.com/web3_data"],
  },
  publisher: {
    "@type": "Organization",
    name: "growthepie",
    url: "https://www.growthepie.com",
    logo: {
      "@type": "ImageObject",
      url: "https://www.growthepie.com/brand/logo-assets/growthepie_logo_round_BG_dark.png",
    },
  },
  image: [
    "https://api.growthepie.com/v1/quick-bites/banners/ethereum-scaling_og.png",
  ],
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://www.growthepie.com/quick-bites/ethereum-scaling",
  },
  keywords: [
    "Ethereum scaling",
    "Ethereum TPS",
    "Layer 2",
    "EIP-7938",
    "Lean Ethereum",
    "data availability sampling",
    "blobs",
    "rollups",
    "throughput",
  ],
  about: [
    { "@type": "Thing", name: "Ethereum" },
    { "@type": "Thing", name: "Transaction throughput" },
    { "@type": "Thing", name: "Layer 2 rollups" },
  ],
  mentions: [
    { "@type": "CreativeWork", name: "EIP-7938", url: "https://eips.ethereum.org/EIPS/eip-7938" },
    { "@type": "CreativeWork", name: "Lean Ethereum", url: "https://blog.ethereum.org/2025/07/31/lean-ethereum" },
  ],
};

/** FAQPage JSON-LD to pair with on-page FAQ section */
export const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does 10,000 TPS on Ethereum Mainnet actually mean?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Roughly 1 Ggas/s assuming 100,000 gas per transaction. It's a proxy for sustained throughput under decentralization constraints.",
      },
    },
    {
      "@type": "Question",
      name: "Why do we need Layer 1 scaling and Layer 2 scaling?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Layer 1 is the credible neutral ground for the settlement and issuance of assets and great for deep liquidity and slow-moving money. Layer 2 builds on that foundation but can be more opinionated and optimized for speed and cost-efficiency, providing horizontal scale, ultimately catering to other use-cases.",
      },
    },
    {
      "@type": "Question",
      name: "Why convert gas to TPS?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Gas per second is protocol-native. Dividing by a typical 100k gas per tx yields a comparable TPS estimate over time.",
      },
    },
    {
      "@type": "Question",
      name: "How do blobs and DAS help?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Cheaper, abundant data availability lets rollups post more data to Ethereum, enabling higher aggregate throughput and horizontal scaling.",
      },
    },
    {
      "@type": "Question",
      name: "When could 10k TPS on Ethereum Mainnet happen?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "On an illustrative 3x YoY trajectory, around ~2031. Timeline was shaped by researchers like Dankrad Feist and Justin Drake but is subject to change.",
      },
    },
    {
      "@type": "Question",
      name: "What's the difference between Layer 2s and Rollups?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Rollups are a type of Layer 2 that post data to Ethereum for security and availability. Other Layer 2s may use different security models.",
      },
    },
    {
      "@type": "Question",
      name: "Will verification remain accessible?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "That's the core goal: scale without sacrificing verifiability or pushing hardware requirements too high for participants.",
      },
    },
  ],
};

/** Breadcrumbs for richer SERP */
export const jsonLdBreadcrumbs = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.growthepie.com/" },
    { "@type": "ListItem", position: 2, name: "Quick Bites", item: "https://www.growthepie.com/quick-bites" },
    { "@type": "ListItem", position: 3, name: "Scaling Ethereum Mainnet to 10,000 TPS", item: "https://www.growthepie.com/quick-bites/ethereum-scaling" },
  ],
};