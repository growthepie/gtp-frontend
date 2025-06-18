// In your quick bite data file (e.g., lib/quick-bites/arbitrum-timeboost.ts)
import { QuickBiteData } from '@/lib/types/quickBites';

const shopifyUsdc: QuickBiteData = {
  title: "Shopify's USDC Adoption",
  subtitle: "A Game Changer for E-commerce",
  content: [

    "# Cool Stuff",
    "To be filled",
    "> WOW!",
    
    "```chart",
    JSON.stringify({
      type: "column",
      title: "Daily Timeboost Revenue in ETH",
      subtitle: "The revenue that the Arbitrum DAO is making from Timeboost on Arbitrum per day",
      stacking: "normal",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Timeboost Fees",
            color: "#1DF7EF",
            xIndex: 1,
            yIndex: 0,
            suffix: null,
            prefix: 'Ξ',
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/arbitrum-timeboost.json",
            pathToData: "data.fees_paid_priority_eth.daily.values",
          }
        ],
      },
      height: 400,
      caption: "The revenue that the Arbitrum DAO is making from Timeboost on Arbitrum per day. Data updated daily.",
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