import { QuickBiteData } from '@/lib/types/quickBites';

const shopifyUsdc: QuickBiteData = {
  title: "Shopify's USDC Adoption",
  subtitle: "A game changer for E-commerce, stablecoins are going mainstream",
  content: [

    'On June 12, 2025, Shopify announced a landmark integration with Coinbase and Stripe. This enables USDC payments on Base to "bring frictionless, secure stablecoin payments to merchants around the world".',
    "> USDC is a token that is pegged to the value of the US dollar, backed by treasuries (commonly known as stablecoins). It has over $60 Billion in circulation and is one of the most widely adopted stablecoins ranking in the top 10 for all crypto assets by market cap. ",
    "## Why Shopify Chose USDC/Base:",
    "- Faster - Payments on Base can settle in as little as 200 milliseconds across international borders, improving cashflow management.",
    "- Cheaper - Transaction fees on Base are significantly cheaper and are independent of the value of goods sold, improving profit margins.",
    "- Globally Accessible - Opening up new markets with a onchain, internet native currency, improving market penetration.",
    "- Composable - Reducing complexity and middlemen by using a single, shared source of truth, improving operational efficiency.",
    "Note: These benefits are largely merchant focused with traditional card payment networks often blocking alternatives from providing discounts, this may make changing current customer behavior challenging. For emerging economies with less access to traditional payment options USDC may prove to be highly favorable and this could be part of Shopify's USDC strategy.",
    "# Shopify's USDC Adoption Metrics (All-Time)",

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
      "> Shopify enables $500 Billion in annualized merchant revenue with over 5.5 million stores, and more than 2 million daily active users.",
    "## Shopify's USDC Volumes (Daily)",
    "Initial adoption is expected to be gradual but if successful, this is a metric that should grow over a longer time period. With Shopify's impressive market size there is a lot of growth potential particularly for products that are not yet seen on-chain.",

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

    "# Adoption: New vs Returning",
    "## Merchants (Daily)",
    "Initially, we have seen a number of test transactions and new merchants exploring USDC as a payment method. Over the long term, we would hope to see increased returning merchants, laying the foundation for sustainable growth.",
    // "```chart",
    // JSON.stringify({
    //   type: "column",
    //   title: "Merchants Receiving USDC",
    //   subtitle: "The daily number of new and returning Shopify merchants that received USDC",
    //   stacking: "normal",
    //   showXAsDate: true,

    //   dataAsJson: {
    //     meta: [{
    //       name: "New Merchants",
    //       color: "#19D9D6",
    //       xIndex: 1,
    //       yIndex: 0,
    //       suffix: null,
    //       prefix: null,
    //       tooltipDecimals: 0,
    //       url: "https://api.growthepie.com/v1/quick-bites/shopify-usdc.json",
    //       pathToData: "data.new_merchants.daily.values",
    //     },
    //     {
    //       name: "Returning Merchants",
    //       color: "#FFC300",
    //       xIndex: 1,
    //       yIndex: 0,
    //       suffix: null,
    //       prefix: null,
    //       tooltipDecimals: 0,
    //       url: "https://api.growthepie.com/v1/quick-bites/shopify-usdc.json",
    //       pathToData: "data.returning_merchants.daily.values",
    //     },
    //     ],
    //   },
    //   height: 400,
    //   caption: "The daily number of new and returning Shopify merchants that received USDC. Data updated daily.",
    //   seeMetricURL: null
    // }),
    // "```",

    "## Customers (Daily)",
    "Long term growth in this metric will likely drive merchant adoption as USDC payments become increasingly established. Again initially we have seen test transactions and new customers exploring USDC as a payment method.",

    //  "```chart",
    // JSON.stringify({
    //   type: "column",
    //   title: "Customers Paying in USDC",
    //   subtitle: "The daily number of new and returning customers that paid in USDC",
    //   stacking: "normal",
    //   showXAsDate: true,

    //   dataAsJson: {
    //     meta: [{
    //       name: "New Customers",
    //       color: "#19D9D6",
    //       xIndex: 1,
    //       yIndex: 0,
    //       suffix: null,
    //       prefix: null,
    //       tooltipDecimals: 0,
    //       url: "https://api.growthepie.com/v1/quick-bites/shopify-usdc.json",
    //       pathToData: "data.new_payers.daily.values",
    //     },
    //     {
    //       name: "Returning Customers",
    //       color: "#FFC300",
    //       xIndex: 1,
    //       yIndex: 0,
    //       suffix: null,
    //       prefix: null,
    //       tooltipDecimals: 0,
    //       url: "https://api.growthepie.com/v1/quick-bites/shopify-usdc.json",
    //       pathToData: "data.returning_payers.daily.values",
    //     },
    //     ],
    //   },
    //   height: 400,
    //   caption: "The daily number of new and returning customers that paid in USDC. Data updated daily.",
    //   seeMetricURL: null
    // }),
    // "```",

    "# Implementation",
    'The integration is powered by the new Commerce Payments Protocol, an open-source framework developed by Coinbase. Its core innovation is an onchain escrow system that mimics the "authorize and capture" flow common in traditional finance.',
    "Image 1 - caption: 6 core payment operations outlined by Shopify",
    "Image 2 - caption: Example payment flow illustrated by Shopify",
    "Further implementation documentation can be seen here: https://shopify.engineering/commerce-payments-protocol.",
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