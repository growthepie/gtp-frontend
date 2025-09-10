// In your quick bite data file (e.g., lib/quick-bites/arbitrum-timeboost.ts)
import { QuickBiteData } from '@/lib/types/quickBites';


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
            suffix: '$',
            prefix: null,
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
            suffix: '$',
            prefix: null,
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
      title: "Hyperliquid USDC Market Share",
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
      caption: "Market share of Hyperliquid’s USDC within the total stablecoin supply on Arbitrum One."
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
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "on Hyperliquid",
            color: "#97FBE4",
            xIndex: 0,
            yIndex: 3,
            suffix: '$',
            prefix: null,
            tooltipDecimals: 0,
            stacking: "normal",
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          },
          {
            name: "All other",
            color: "#0C53BF",
            xIndex: 0,
            yIndex: 5,
            suffix: '$',
            prefix: null,
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
      title: "Hyperliquid USDC Share",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "on Hyperliquid",
            color: "#97FBE4",
            xIndex: 0,
            yIndex: 3,
            suffix: '$',
            prefix: null,
            tooltipDecimals: 0,
            stacking: "percent",
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          },
          {
            name: "All other",
            color: "#0C53BF",
            xIndex: 0,
            yIndex: 5,
            suffix: '$',
            prefix: null,
            tooltipDecimals: 0,
            stacking: "percent",
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          }
        ],
      },
      height: 400,
      caption: "Market share of Hyperliquid’s USDC within the total USDC stablecoin supply.",
    }),
    "```",
]

const CircleCharts = ["```container",
  JSON.stringify({
    blocks: [CircleStacked, CirclePercentage],
    className: "flex flex-col-reverse lg:grid lg:grid-cols-2 items-center",
  }),
  "```",
];

const hyperliquidUSDC: QuickBiteData = {
  title: "USDC on Hyperliquid",
  subtitle: "Tracking USDC on Hyperliquid and Its Effects on Different Actors",
  content: [

    "Hyperliquid is a Layer 1 blockchain and decentralized exchange that specializes in perpetual trading. The platform relies primarily on USDC as its settlement currency, with most of the supply bridged through the Arbitrum One bridge. By September 2025 Hyperliquid had accumulated over five billion dollars in liquidity denominated in USDC, making Circle’s stablecoin the backbone of its trading ecosystem.",

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

    "```chart",
    JSON.stringify({
      type: "line",
      title: "USDC Bridged to Hyperliquid",
      subtitle: "Total USDC bridged to Hyperliquid from Arbitrum One over time.",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "USDC",
            color: "#97FBE4",
            xIndex: 0,
            yIndex: 3,
            suffix: '$',
            prefix: null,
            tooltipDecimals: 0,
            stacking: "normal",
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          },
        ],
      },
      height: 400,
      caption: "Significant growth in USDC bridged to Hyperliquid from Arbitrum One since 2024.",
    }),
    "```",

    "# Circle’s Cash Cow",

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

    "As of September 2025 Hyperliquid accounts for more than 7.5% of all USDC in circulation, making it a major driver of the stablecoin’s growing supply. Circle, the issuer of USDC, benefits significantly from this demand since it invests the fiat reserves backing USDC into short-term U.S. Treasuries that generate yield. From Hyperliquid’s share of USDC alone Circle has earned around $106 million in revenue. If both yields and the USDC supply on Hyperliquid remain stable, Circle’s revenue from this source could exceed $210 million per year. USDC usage on Hyperliquid has become one of Circle’s fastest growing revenue drivers, with its expansion directly translating into substantial earnings for the issuer.",

    ...CircleCharts,

    "# Arbitrum's Growth Engine",

    "Since early 2024 the growth of stablecoins on Arbitrum One has been driven largely by users bridging USDC to Hyperliquid. At the time of writing roughly 60 percent of all stablecoins on Arbitrum One are locked in the bridge contract that connects to Hyperliquid, highlighting how dependent Arbitrum’s stablecoin supply has become on this single use case. With the proposed launch of a natively issued stablecoin on Hyperliquid, called USDH, much of this liquidity could shift away from Arbitrum, leading to a sharp reduction in its reported stablecoin supply.",

    ...arbitrumCharts,

  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/hyperliquid.png",
  og_image: "",
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
    icon: "gtp-metrics-economics",
    name: "Economics",
    url: "/economics"
  },
  {
    name: "Circle",
    url: "/applications/circlefin"
  },
],
  icon: "arbitrum-logo-monochrome"
};

export default hyperliquidUSDC;