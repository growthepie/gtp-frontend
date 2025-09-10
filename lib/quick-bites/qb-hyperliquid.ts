// In your quick bite data file (e.g., lib/quick-bites/arbitrum-timeboost.ts)
import { QuickBiteData } from '@/lib/types/quickBites';

const hyperliquidUSDC: QuickBiteData = {
  title: "Hyperliquid USDC on Arbitrum One",
  subtitle: "Tracking Hyperliquid's USDC Bridge on Arbitrum One",
  content: [

    "# Hyperliquid USDC Liquidity",
    "Hyperliquid is a L1 and decentralized exchange that offers perpetual trading. It is ",
    "stablecoin on hyperliquid kpis",
    "```kpi-cards",JSON.stringify(
      [
        {
          title: "USDC Bridged to Hyperliquid from Arbitrum One",
          value: "${{hyperliquidUSDCLast}}",
          description: "since launch",
          icon: "gtp-realtime",
          info: "Total USDC bridged to Hyperliquid from Arbitrum One.",
        },
      ]
    ),
    "```",

    "```chart",
    JSON.stringify({
      type: "line",
      title: "Circles USDC Supply",
      subtitle: "USDC Stablecoin supply with and without Hyperliquid",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "USDC on Hyperliquid",
            color: "#90f8e0",
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
      caption: "Stablecoin Supply on Arbitrum One split by Hyperliquid USDC and all other stablecoins",
    }),
    "```",


    "stablecoin on hyperliquid kpis",
    "```kpi-cards",JSON.stringify(
      [
        {
          title: "Estimated Revenue For Circle",
          value: "${{hyperliquidTotalRevenueForCircle}}",
          description: "since launch",
          icon: "gtp-realtime",
          info: "Estimated revenue for Circle on USDC in Hyperliquid based on current data.",
        },
        {
          title: "Share of all USDC in Hyperliquid",
          value: "{{percentageHyperliquidOfCircle}}%",
          description: "since launch",
          icon: "gtp-realtime",
          info: "Share of all USDC in Hyperliquid compared to the total supply of USDC.",
        },
        {
          title: "Estimated Yearly Revenue For Circle on USDC in Hyperliquid",
          value: "{{estimatesYearlyRevenueHyperliquidCircle}}%",
          description: "yearly estimate",
          icon: "gtp-realtime",
          info: "Estimated yearly revenue for Circle on USDC in Hyperliquid based on current data.",
        },
      ]
    ),
    "```",

    "```chart",
    JSON.stringify({
      type: "area",
      title: "Circles USDC Supply",
      subtitle: "USDC Stablecoin supply with and without Hyperliquid",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "USDC on Hyperliquid",
            color: "#90f8e0",
            xIndex: 0,
            yIndex: 3,
            suffix: '$',
            prefix: null,
            tooltipDecimals: 2,
            stacking: "normal",
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          },
          {
            name: "All other USDC",
            color: "#1F1248",
            xIndex: 0,
            yIndex: 5,
            suffix: '$',
            prefix: null,
            tooltipDecimals: 2,
            stacking: "normal",
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          }
        ],
      },
      height: 400,
      caption: "Stablecoin Supply on Arbitrum One split by Hyperliquid USDC and all other stablecoins",
    }),
    "```",

    "# Effects Of Stablecoin Supply on Arbitrum One",
    "Hyperliquid main USDC bridge is on Arbitrum One, allowing users to transfer USDC from Arbitrum One to Hyperliquid in a fast and easy way. This quick bite explores the impact of Hyperliquid's USDC bridge on the overall stablecoin supply on Arbitrum One.",
    "The stablecoin supply metric is heavily influenced by Hyperliquid's USDC bridge. As of September 2025, ≈60% of all stablecoins on Arbitrum One are held within Hyperliquid's USDC bridge.",

    "```chart",
    JSON.stringify({
      type: "area",
      title: "Stablecoin Supply on Arbitrum One",
      subtitle: "Stablecoin supply with and without Hyperliquid",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Hyperliquid USDC",
            color: "#90f8e0",
            xIndex: 0,
            yIndex: 3,
            suffix: '$',
            prefix: null,
            tooltipDecimals: 2,
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
            tooltipDecimals: 2,
            stacking: "normal",
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          }
        ],
      },
      height: 400,
      caption: "Stablecoin Supply on Arbitrum One split by Hyperliquid USDC and all other stablecoins",
    }),
    "```",

    "```chart",
    JSON.stringify({
      type: "area",
      title: "Hyperliquid USDC Dominance on Arbitrum One",
      subtitle: "Share of Hyperliquid USDC within the total stablecoin supply on Arbitrum One",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Hyperliquid USDC",
            color: "#90f8e0",
            stacking: "percent",
            xIndex: 0,
            yIndex: 3,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 2,
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
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/hyperliquid/usdc.json",
            pathToData: "data.hyperliquid_usdc.daily.values",
          }
        ],
      },
      height: 400,
      caption: "The share of Hyperliquid USDC within the total stablecoin supply on Arbitrum One"
    }),
    "```",

  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/robinhood.png",
  og_image: "",
  date: "2025-09-09",
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
],
  icon: "arbitrum-logo-monochrome"
};

export default hyperliquidUSDC;