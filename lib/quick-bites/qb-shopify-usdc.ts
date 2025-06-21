import { QuickBiteData } from '@/lib/types/quickBites';

const shopifyUsdc: QuickBiteData = {
  title: "Shopify's USDC Adoption",
  subtitle: "A Game Changer for E-commerce",
  content: [

    "# Cool Stuff",
    "To be filled",
    "> This is a very important message!",

    "```kpi-cards",JSON.stringify(
      [
        {
          title: "Total USDC Volume",
          value: "${{shopifyVolumeUSD}}",
          description: "Test",
          icon: "base-logo-monochrome",
          info: "Test"
        }
      ]),
    "```",
    
    "```chart",
    JSON.stringify({
      type: "column",
      title: "Settled USDC Volume via Shopify Stores",
      subtitle: "The daily volume of USDC settled through Shopify stores",
      stacking: "normal",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Volume Settled",
            color: "#2151F5",
            xIndex: 1,
            yIndex: 0,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/shopify-usdc.json",
            pathToData: "data.gross_volume_usdc.daily.values",
          }
        ],
      },
      height: 400,
      caption: "The daily volume of USDC settled through Shopify stores. Data updated daily.",
    }),
    "```",

    "## Timeboost vs Network Fees",
    "In addition to revenue from Timeboost, the Arbitrum DAO also receives the standard transaction fees that users pay. The following chart allows you to track the share of Timeboost fees vs Network fees in ETH.",

  ],
  image: "/images/quick-bites/placeholder.png",
  og_image: "https://api.growthepie.com/v1/og_images/quick-bites/arbitrum-timeboost.png",
  date: "2025-06-18",
  related: [],
  author: [{
    name: "ETH Wave",
    xUsername: "TrueWaveBreak"
  },
  {
    name: "Manish Gupta",
    xUsername: "manishiwa"
  }
],
  topics: [{
    icon: "base-logo-monochrome",
    color: "#2151F5",
    name: "Base",
    url: "/chains/base"
  },
  {
    icon: "gtp-metrics-stablecoin-market-cap",
    name: "Stablecoins",
    url: "/fundamentals/stablecoin-market-cap"
  }],
  icon: "arbitrum-logo-monochrome"
};

export default shopifyUsdc;