// In your quick bite data file (e.g., lib/quick-bites/arbitrum-timeboost.ts)
import { QuickBiteData } from '@/lib/types/quickBites';

const arbitrumTimeboost: QuickBiteData = {
  title: "Timeboost: An Express Lane for Arbitrum",
  subtitle: "FCFS is over.",
  content: [
    "> Total ETH paid in Timeboost fees: {{timeboostTotalETH}} ETH.",

    "## What is Timeboost?",
    "It's cool!",

    "## Money for DAO",
    "The Blob target was doubled from 3 to 6, and the limit was raised from 6 to 9. This means more blobs for Layer 2s and it takes longer for the Blob fee market to kick in.",
    "The following chart shows how close we are to the new Blob target. When the number of blobs submitted per block exceeds the target, the Blob fee market will kick in and increase the cost per blob (using the EIP-1559 mechanism).",

    "```chart",
    JSON.stringify({
      type: "column",
      title: "Daily Timeboost Revenue in ETH",
      subtitle: "The amount of money that Arbitrum DAO is making from Timeboost per day",
      stacking: "normal",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Timeboost Fees",
            color: "#19D9D6",
            xIndex: 1,
            yIndex: 0,
            suffix: 'ETH',
            prefix: null,
            url: "https://api.growthepie.xyz/v1/quick-bites/arbitrum-timeboost.json",
            pathToData: "data.fees_paid_priority_eth.daily.values",
          },
          {
            name: "Network Fees",
            color: "#FFC300",
            xIndex: 1,
            yIndex: 0,
            suffix: 'ETH',
            prefix: null,
            url: "https://api.growthepie.xyz/v1/quick-bites/arbitrum-timeboost.json",
            pathToData: "data.fees_paid_base_eth.daily.values",
          }
        ],
      },
      height: 400,
      caption: "The amount of money that Arbitrum DAO is making from Timeboost per day. Data updated daily.",
      seeMetricURL: "https://www.growthepie.com/economics"
    }),
    "```",

    "## EIP-7702: Smarter Wallets",
    "EIP-7702 introduces a new transaction type that allows wallets to act as smart accounts. This improves the user experience by enabling wallets to pay network fees with custom gas tokens, delegate transactions, and more.",
    "The following chart shows the adoption of EIP-7702 wallets by visualizing the daily number of Set Code transactions on EVM chains (aka Type 4 transactions).",

    "```chart",
    JSON.stringify({
      type: "area",
      title: "Daily Timeboost Revenue in ETH",
      subtitle: "The amount of money that Arbitrum DAO is making from Timeboost per day",
      stacking: "percent",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Timeboost Fees",
            color: "#19D9D6",
            xIndex: 1,
            yIndex: 0,
            suffix: 'ETH',
            prefix: null,
            url: "https://api.growthepie.xyz/v1/quick-bites/arbitrum-timeboost.json",
            pathToData: "data.fees_paid_priority_eth.daily.values",
          },
          {
            name: "Network Fees",
            color: "#FFC300",
            xIndex: 1,
            yIndex: 0,
            suffix: 'ETH',
            prefix: null,
            url: "https://api.growthepie.xyz/v1/quick-bites/arbitrum-timeboost.json",
            pathToData: "data.fees_paid_base_eth.daily.values",
          }
        ],
      },
      height: 400,
      caption: "The amount of money that Arbitrum DAO is making from Timeboost per day. Data updated daily.",
      seeMetricURL: "https://www.growthepie.com/economics"
    }),
    "```",

    "All charts on this page are updated daily so you can track the adoption of the Pectra upgrades over time.",
  ],
  image: "/images/quick-bites/pectra-tx-type-4.png",
  og_image: "https://api.growthepie.xyz/v1/og_images/quick-bites/pectra-upgrade.png",
  date: "2025-05-29",
  related: [],
  author: [{
    name: "Matthias Seidl",
    xUsername: "web3_data"
  }],
  topics: [{
    icon: "arbitrum-logo-monochrome",
    color: "#1DF7EF",
    name: "Arbitrum",
    url: "/chains/arbitrum"
  },
  {
    icon: "gtp-metrics-economics",
    name: "Economics",
    url: "/economics"
  }],
  icon: "arbitrum-logo-monochrome"
};

export default arbitrumTimeboost;