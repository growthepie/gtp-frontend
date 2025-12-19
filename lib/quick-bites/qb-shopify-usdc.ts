import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

const BaseCommercePaymentProtocol: QuickBiteData = createQuickBite({
  title: "Base: Commerce Payment Protocol (+Shopify)",
  subtitle: "A game changer for E-commerce, stablecoins are going mainstream",
  shortTitle: "Base Commerce",
  content: [

    'On June 12, 2025, Shopify announced a landmark integration with Coinbase and Stripe. This enables USDC payments on Base to "bring frictionless, secure stablecoin payments to merchants around the world". ([1])[https://www.shopify.com/news/stablecoins-on-shopify] This marked the birth of the Commerce Payment Protocol on Base (Layer 2) bringing tradtional E-commerce onchain.',
    "> USDC is a token that is pegged to the value of the US dollar, backed by treasuries (commonly known as stablecoins). It has over $60 Billion in circulation and is one of the most widely adopted stablecoins ranking in the top 10 for all crypto assets by market cap. ([2])[https://www.coingecko.com/en/coins/usdc]",
  
    "# Commerce Payment Protocol Metrics (All-Time)",

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
            info: "The number of unique wallets that have received USDC payments through Commerce Payment Protocol.",
          },
          {
            title: "Total # of Customers",
            value: "{{shopifyCustomers}}",
            description: "since launch",
            icon: "gtp-realtime",
            info: "The number of unique wallets that have made purchases using USDC on Commerce Payment Protocol.",
          }
      ]),
      "```",
      "> Commerce Payment Protocol is used by multiple companies including Shopify, however it is by design not possible to trace which payments are linked to each company. Shopify enables $500 Billion in annualized merchant revenue with over 5.5 Million stores, and more than 2 Million daily active users. ([3a])[https://www.mobiloud.com/blog/shopify-statistics] ([3b])[https://craftberry.co/articles/how-many-shopify-stores-are-there] ([3c])[https://www.yaguara.co/shopify-statistics/#:~:text=There%20are%209.55%20million%20Shopify,are%20currently%20live%20on%20Shopify]",
    "## Commerce Payment Protocol USDC Volumes",
    "Initial adoption is expected to be gradual but if successful, this is a metric that should grow over a longer time period. With Shopify's impressive market size there is a lot of growth potential particularly for products that are not yet seen onchain.",

    "```chart-toggle",
    JSON.stringify({
      title: "Settled USDC Volume",
      description: "Toggle between daily, weekly, and monthly views of USDC volume settled through Commerce Payment Protocol",
      layout: "segmented",
      defaultIndex: 0,
      charts: [
        {
          toggleLabel: "Daily",
          type: "column",
          title: "Settled USDC Volume (Daily)",
          subtitle: "The daily volume of USDC settled through Commerce Payment Protocol",
          showXAsDate: true,
          dataAsJson: {
            meta: [
              {
                name: "Volume Settled",
                color: "#2151F5",
                stacking: "normal",
                xIndex: 1,
                yIndex: 0,
                suffix: null,
                prefix: '$',
                tooltipDecimals: 2,
                aggregation: "daily",
                url: "https://api.growthepie.com/v1/quick-bites/shopify-usdc.json",
                pathToData: "data.gross_volume_usdc.daily.values",
              }
            ],
          },
          height: 400,
          caption: "The daily volume of USDC settled through Commerce Payment Protocol. Data updated daily.",
        },
        {
          toggleLabel: "Weekly",
          type: "column",
          title: "Settled USDC Volume (Weekly)",
          subtitle: "The weekly volume of USDC settled through Commerce Payment Protocol",
          showXAsDate: true,
          dataAsJson: {
            meta: [
              {
                name: "Volume Settled",
                color: "#2151F5",
                stacking: "normal",
                xIndex: 1,
                yIndex: 0,
                suffix: null,
                prefix: '$',
                tooltipDecimals: 2,
                aggregation: "weekly",
                url: "https://api.growthepie.com/v1/quick-bites/shopify-usdc.json",
                pathToData: "data.gross_volume_usdc.daily.values",
              }
            ],
          },
          height: 400,
          caption: "The weekly volume of USDC settled through Commerce Payment Protocol. Data aggregated by calendar week.",
        },
        {
          toggleLabel: "Monthly",
          type: "column",
          title: "Settled USDC Volume (Monthly)",
          subtitle: "The monthly volume of USDC settled through Commerce Payment Protocol",
          showXAsDate: true,
          dataAsJson: {
            meta: [
              {
                name: "Volume Settled",
                color: "#2151F5",
                stacking: "normal",
                xIndex: 1,
                yIndex: 0,
                suffix: null,
                prefix: '$',
                tooltipDecimals: 2,
                aggregation: "monthly",
                url: "https://api.growthepie.com/v1/quick-bites/shopify-usdc.json",
                pathToData: "data.gross_volume_usdc.daily.values",
              }
            ],
          },
          height: 400,
          caption: "The monthly volume of USDC settled through Commerce Payment Protocol. Data aggregated by month.",
        }
      ],
    }),
    "```",

    "# Adoption: New vs Returning",
    "## Merchants (Daily)",
    "Initially, we have seen a number of test transactions and new merchants exploring USDC as a payment method. Over the long term, we would hope to see increased returning merchants, laying the foundation for sustainable growth.",
    "```chart",
    JSON.stringify({
      type: "column",
      title: "Merchants Receiving USDC",
      subtitle: "The daily number of new and returning merchants that received USDC",
      showXAsDate: true,
      dataAsJson: {
        meta: [{
          name: "New Merchants",
          color: "#19D9D6",
          stacking: "normal",
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
          stacking: "normal",
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
      caption: "The daily number of new and returning merchants that received USDC. Data updated daily.",
      seeMetricURL: null
    }),
    "```",

    "## Customers (Daily)",
    "Long term growth in this metric will likely drive merchant adoption as USDC payments become increasingly established. Again initially we have seen test transactions and new customers exploring USDC as a payment method.",

     "```chart",
    JSON.stringify({
      type: "column",
      title: "Customers Paying in USDC",
      subtitle: "The daily number of new and returning customers that paid in USDC",
      showXAsDate: true,
      dataAsJson: {
        meta: [{
          name: "New Customers",
          color: "#19D9D6",
          stacking: "normal",
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
          stacking: "normal",
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
    "# Why Shopify Chose USDC/Base:",
    "- Faster - Payments on Base can settle in as little as 200 milliseconds across international borders, improving cashflow management. ([4])[https://shopify.engineering/commerce-payments-protocol]",
    "- Cheaper - Transaction fees on Base are significantly cheaper and are independent of the value of goods sold, improving profit margins. ([4])[https://shopify.engineering/commerce-payments-protocol]",
    "- Globally Accessible - Opening up new markets with a onchain, internet native currency, improving market penetration. ([4])[https://shopify.engineering/commerce-payments-protocol]",
    "- Composable - Reducing complexity and middlemen by using a single, shared source of truth, improving operational efficiency. ([4])[https://shopify.engineering/commerce-payments-protocol]",
    "Note: These benefits are largely merchant focused with traditional card payment networks often blocking alternatives from providing discounts, this may make changing current customer behavior challenging. For emerging economies with less access to traditional payment options USDC may prove to be highly favorable and this could be part of Shopify's USDC strategy.",
    
    "# Implementation",
    'The integration is powered by the new Commerce Payments Protocol, an open-source framework developed by Coinbase. Its core innovation is an onchain escrow system that mimics the "authorize and capture" flow common in traditional finance.',
    "```image",
    JSON.stringify({
      src: "https://api.growthepie.com/v1/quick-bites/shopify/shopify-payment-operations.png", // should allow link to our API
      alt: "6 core payment operations outlined by Shopify",
      width: "1600",
      height: "1188",
      caption: "6 core payment operations outlined by Shopify ([4])[https://shopify.engineering/commerce-payments-protocol]",
    }),
    "```",
    "```image",
    JSON.stringify({
      src: "https://api.growthepie.com/v1/quick-bites/shopify/shopify-payment-example.png", // should allow link to our API
      alt: "Example payment flow illustrated by Shopify",
      width: "1600",
      height: "1187",
      caption: "Example payment flow illustrated by Shopify ([4])[https://shopify.engineering/commerce-payments-protocol]",
    }),
    "```",
    "Further implementation documentation can be seen here: [https://shopify.engineering/commerce-payments-protocol](https://shopify.engineering/commerce-payments-protocol).",
  ],
  image: "/quick-bites/base-commerce.webp",
  og_image: "/quick-bites/base-commerce.webp",
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
  topics: [
    {
    icon: "gtp-categories",
    name: "Real World Use-Case",
    url: "",
   },
    {
    icon: "base-logo-monochrome",
    color: "#2151F5",
    name: "Base",
    url: "/chains/base"
  },
  {
    icon: "gtp-metrics-stablecoinmarketcap",
    name: "Stablecoins",
    url: "/fundamentals/stablecoin-market-cap"
  }
],
icon: "base-logo-monochrome"
});


export default BaseCommercePaymentProtocol;
