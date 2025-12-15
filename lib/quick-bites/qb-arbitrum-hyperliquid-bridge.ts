// In your quick bite data file (e.g., lib/quick-bites/arbitrum-timeboost.ts)
import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';


const ArbStacked = ["```chart",
    JSON.stringify({
      type: "area",
      title: "Stablecoin Supply on Arbitrum One",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Hyperliquid USDC",
            color: "#97FBE4",
            xIndex: 0,
            yIndex: 3,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 0,
            stacking: "normal",
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          },
          {
            name: "Other Stablecoins",
            color: "#1B4ADD",
            xIndex: 0,
            yIndex: 2,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 0,
            stacking: "normal",
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          }
        ],
      },
      height: 400,
      caption: "Stablecoin Supply on Arbitrum One split by Hyperliquid USDC and all other stablecoins.",
    }),
    "```",
];

const ArbPercentage = [
  "```chart",
    JSON.stringify({
      type: "area",
      title: "Stablecoin Dominance on Arbitrum One",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Hyperliquid USDC",
            color: "#97FBE4",
            stacking: "percent",
            xIndex: 0,
            yIndex: 3,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          },
          {
            name: "Other Stablecoins",
            color: "#1B4ADD",
            stacking: "percent",
            xIndex: 0,
            yIndex: 2,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          }
        ],
      },
      height: 400,
      caption: "Market share of Hyperliquid's USDC within the total stablecoin supply on Arbitrum One."
    }),
    "```",

]

const arbitrumCharts = ["```container",
  JSON.stringify({
    blocks: [ArbStacked, ArbPercentage],
    className: "flex flex-col-reverse lg:grid lg:grid-cols-2 items-center",
  }),
  "```",
];

const CircleStacked = [
  "```chart",
    JSON.stringify({
      type: "area",
      title: "USDC Supply Breakdown",
      margins: "none",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "on Hyperliquid",
            color: "#97FBE4",
            xIndex: 0,
            yIndex: 3,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 0,
            stacking: "normal",
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          },
          {
            name: "All other",
            color: "#FFD700",
            xIndex: 0,
            yIndex: 5,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 0,
            stacking: "normal",
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          }
        ],
      },
      height: 400,
      caption: "Circle's USDC supply on Hyperliquid compared to all other chains.",
    }),
    "```",
]
const CirclePercentage = [
  "```chart",
    JSON.stringify({
      type: "area",
      title: "Hyperliquid USDC Market Share",
      margins: "none",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "on Hyperliquid",
            color: "#97FBE4",
            xIndex: 0,
            yIndex: 3,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 0,
            stacking: "percent",
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          },
          {
            name: "All other",
            color: "#FFD700",
            xIndex: 0,
            yIndex: 5,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 0,
            stacking: "percent",
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          }
        ],
      },
      height: 400,
      caption: "Market share of Hyperliquid's USDC within the total USDC stablecoin supply.",
    }),
    "```",
]

const CircleCharts = ["```container",
  JSON.stringify({
    blocks: [CircleStacked, CirclePercentage],
    className: "flex flex-col-reverse lg:grid lg:grid-cols-2 items-center gap-[15px]",
  }),
  "```",
];




const arbitrumHyperliquidBridge: QuickBiteData = createQuickBite({
  title: "Arbitrum Hyperliquid Bridge",
  subtitle: "The Critical Infrastructure Connecting Arbitrum One to Hyperliquid's Trading Ecosystem",
  shortTitle: "Hyperliquid Bridge",
  content: [

    "The Arbitrum Hyperliquid bridge serves as the primary infrastructure connecting USDC on Arbitrum One to Hyperliquid's Layer 1 perpetual trading platform. This bridge has become the most significant driver of stablecoin activity on Arbitrum One, with over $5.4B in USDC locked in the bridge contract at time of writing. The bridge enables seamless USDC transfers from Arbitrum One to Hyperliquid, where the stablecoin serves as the primary settlement currency for perpetual trading.",

    "```kpi-cards",JSON.stringify(
      [
        {
          title: "Total USDC Bridged to Hyperliquid",
          value: "${{hyperliquidUSDCLast}}B",
          description: "",
          icon: "gtp-realtime",
          info: "Total USDC bridged to Hyperliquid from Arbitrum One.",
        },
      ]
    ),
    "```",

    ...ArbStacked,

    "# Circle's Cash Cow",

    "The Arbitrum Hyperliquid bridge has become a major revenue driver for Circle, the issuer of USDC. As of September 2025, Hyperliquid accounts for more than 7.5% of all USDC in circulation, with most of this supply flowing through the Arbitrum bridge. Circle has earned approximately $106 million in revenue from USDC held on Hyperliquid, with potential annual revenue exceeding $210 million if current trends continue. USDC is backed by US treasuries which generate this revenue.",

    "```kpi-cards",JSON.stringify(
      [
        {
          title: "Revenue from Hyperliquid",
          value: "${{hyperliquidTotalRevenueForCircle}}M",
          description: "since launch",
          icon: "gtp-realtime",
          info: "Total revenue earned by Circle from USDC held and used on Hyperliquid."
        },
        {
          title: "USDC Share on Hyperliquid",
          value: "{{percentageHyperliquidOfCircle}}%",
          description: "of total USDC supply",
          icon: "gtp-realtime",
          info: "Percentage of the entire USDC supply currently circulating on Hyperliquid."
        },
        {
          title: "Projected Annual Revenue",
          value: "${{estimatesYearlyRevenueHyperliquidCircle}}M",
          description: "based on current yields",
          icon: "gtp-realtime",
          info: "Estimated yearly revenue Circle would generate from USDC on Hyperliquid if current supply levels and U.S. Treasury yields remain stable."
        }
      ]
    ),
    "```",

    ...CircleCharts,

    "# Arbitrum's Bridge Dependency",

    "With the proposed launch of a natively issued stablecoin on Hyperliquid, called USDH, much of Arbitrum One’s stablecoin liquidity, which currently has about 60% of its stablecoin supply locked in the USDC bridge to Hyperliquid, could shift away and potentially cause a decline in its overall stablecoin supply.",

    ...ArbPercentage,

  ],
  image: "/quick-bites/arbitrum-hyperliquid-bridge.webp",
  og_image: "/quick-bites/arbitrum-hyperliquid-bridge.webp",
  date: "2025-09-10",
  related: [],
  author: [{
    name: "Lorenz Lehmann",
    xUsername: "LehmannLorenz",
  },
  {
    name: "ETH Wave",
    xUsername: "TrueWaveBreak"
  }],
  topics: [
    {
    name: "Arbitrum One",
    url: "/chains/arbitrum"
  },
  {
    icon: "gtp-metrics-stablecoinmarketcap",
    name: "Circle LLC",
    url: "/applications/circlefin"
  },
  {
    icon: "gtp-metrics-stablecoinmarketcap",
    name: "Stablecoin Supply",
    url: "/fundamentals/stablecoin-market-cap"
  },
],
  icon: "arbitrum-logo-monochrome",
  showInMenu: true
});

export default arbitrumHyperliquidBridge;
