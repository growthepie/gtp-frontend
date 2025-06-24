import { QuickBiteData } from '@/lib/types/quickBites';

const shopifyUsdc: QuickBiteData = {
  title: "Shopify's USDC Adoption",
  subtitle: "A Game Changer for E-commerce",
  content: [

    "# Bringing Traditional Commerce Onchain with Base",
    "On June 12, 2025, Shopify announced a landmark integration with Coinbase and Stripe to enable USDC payments on Base. This page tracks the adoption of the underlying 'Commerce Payments Protocol', which brings traditional 'authorize and capture' mechanics to onchain payments.",
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

    "# Merchants Receiving USDC",
    "Tracking the number of merchants who receive USDC payments — split between 'New' and 'Returning' merchants.",

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

    "# Customers Paying in USDC",
    "Tracking customer adoption by showing the number of distinct wallet addresses paying with USDC each day — split between 'New' and 'Returning' customers.",

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
          name: "Returning Customers",
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
    
    'The integration is powered by the new Commerce Payments Protocol, an open-source framework developed by Coinbase. Its core innovation is an onchain escrow system that mimics the "authorize and capture" flow common in traditional finance:',
    
    "1. **Authorize:** When a customer pays, their USDC is placed in a secure escrow contract. This reserves the funds and guarantees payment for the merchant.",
    '2. **Capture:** After the merchant fulfills the order (e.g., ships the product), they "capture" the funds from escrow to finalize the payment.',
    
    'This two-step process, managed by a permissionless "operator" like Shopify, solves many complexities of real-world commerce, such as delayed fulfillment, inventory management, and refunds, making onchain payments viable at a global scale.',
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
    icon: "gtp-metrics-stablecoinmarketcap",
    name: "Stablecoins",
    url: "/fundamentals/stablecoin-market-cap"
  }],
  icon: "arbitrum-logo-monochrome"
};

export default shopifyUsdc;