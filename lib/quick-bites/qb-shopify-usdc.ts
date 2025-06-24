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
          description: "since launch",
          icon: "gtp-realtime",
          info: "Volume Settled describes the total amount of USDC that was paid out to merchants.",
        },
          {
            title: "Total # of Merchants",
            value: "{{shopifyMerchants}}",
            description: "since launch",
            icon: "gtp-realtime",
            info: "The number of unique wallets that have received USDC payments through Shopify.",
          },
          {
            title: "Total # of Customers",
            value: "{{shopifyCustomers}}",
            description: "since launch",
            icon: "gtp-realtime",
            info: "The number of unique wallets that have made purchases using USDC on Shopify stores.",
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

    "Test text for the chart below. This is a placeholder for the actual chart data.",

    "```chart",
    JSON.stringify({
      type: "column",
      title: "Merchants Receiving USDC",
      subtitle: "The daily number of new and returning Shopfiy merchants that received USDC",
      stacking: "normal",
      showXAsDate: true,

      dataAsJson: {
        meta: [{
          name: "New Merchants",
          color: "#19D9D6",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          tooltipDecimals: 0,
          url: "https://api.growthepie.com/v1/quick-bites/shopify-usdc.json",
          pathToData: "data.new_merchants.daily.values",
        },
        {
          name: "Returning Merchants",
          color: "#FFC300",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          tooltipDecimals: 0,
          url: "https://api.growthepie.com/v1/quick-bites/shopify-usdc.json",
          pathToData: "data.returning_merchants.daily.values",
        },
        ],
      },
      height: 400,
      caption: "The daily number of new and returning Shopify merchants that received USDC. Data updated daily.",
      seeMetricURL: null
    }),
    "```",

    "More text for the chart below. This is a placeholder for the actual chart data.",

     "```chart",
    JSON.stringify({
      type: "column",
      title: "Customers Paying in USDC",
      subtitle: "The daily number of new and returning customers that paid in USDC",
      stacking: "normal",
      showXAsDate: true,

      dataAsJson: {
        meta: [{
          name: "New Customers",
          color: "#19D9D6",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          tooltipDecimals: 0,
          url: "https://api.growthepie.com/v1/quick-bites/shopify-usdc.json",
          pathToData: "data.new_payers.daily.values",
        },
        {
          name: "Returning Merchants",
          color: "#FFC300",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          tooltipDecimals: 0,
          url: "https://api.growthepie.com/v1/quick-bites/shopify-usdc.json",
          pathToData: "data.returning_payers.daily.values",
        },
        ],
      },
      height: 400,
      caption: "The daily number of new and returning customers that paid in USDC. Data updated daily.",
      seeMetricURL: null
    }),
    "```",

    "## More Info",
    "Shopify, a leading e-commerce platform, has integrated USDC as a payment option, allowing merchants to accept stablecoin payments seamlessly. This move is expected to enhance transaction speed and reduce costs for both merchants and customers.",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/placeholder.png",
  og_image: "https://api.growthepie.com/v1/og_images/quick-bites/arbitrum-timeboost.png",
  date: "2025-06-26",
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