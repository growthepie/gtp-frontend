// In your quick bite data file (e.g., lib/quick-bites/arbitrum-timeboost.ts)
import { QuickBiteData } from '@/lib/types/quickBites';

const arbitrumTimeboost: QuickBiteData = {
  title: "Timeboost: An Express Lane for Arbitrum",
  subtitle: "Timeboost allows to better capitalize on MEV by providing express lane access for users",
  content: [

    "# Timeboost Usage",
    "The introduction of Arbitrum Timeboost has been a great success. It started to generate significant revenue from day one.",
    
    "```kpi-cards",JSON.stringify(
      [
        {
          title: "Total Timeboost Revenue",
          value: "${{timeboostTotalUSD}}",
          description: "since launch",
          icon: "gtp-realtime",
          info: "Total revenue generated from Timeboost on Arbitrum.",
        },
        {
          title: "Total Timeboost Revenue in ETH",
          value: "Ξ{{timeboostTotalETH}}",
          description: "since launch",
          icon: "gtp-realtime",
          info: "Total revenue generated from Timeboost on Arbitrum.",
        },
      ]
    ),
    "```",

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

    "```chart",
    JSON.stringify({
      type: "area",
      title: "Timeboost vs Network Fees in ETH",
      subtitle: "The share of Revenue that the Arbitrum DAO is making from Timeboost vs Network Fees",
      stacking: "percent",
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
          },
          {
            name: "Network Fees",
            color: "#FFDF27",
            xIndex: 1,
            yIndex: 0,
            suffix: null,
            prefix: 'Ξ',
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/arbitrum-timeboost.json",
            pathToData: "data.fees_paid_base_eth.daily.values",
          }
        ],
      },
      height: 400,
      caption: "The share of Revenue that the Arbitrum DAO is making from Timeboost vs Network Feess. Data updated daily.",
      seeMetricURL: "https://www.growthepie.com/economics"
    }),
    "```",

    "# What is Timeboost?",
    "Timeboost went live on April 17th. It allows Arbitrum to better capitalize on MEV by providing express lane access for users. Until the introduction of Timeboost, Arbitrum had been operating on a FCFS (First-Come, First-Serve) basis. Though it provides great UX it also introduced a lot of spam by searchers that attempted to extract MEV.",
    "Timeboost is a new transaction ordering policy that preserves many of the great benefits of FCFS while unlocking a path for chain owners to capture some of the available MEV on their network and introducing an auction to reduce latency, racing, and, ultimately, spam.",

    "## Timeboost is implemented using three separate components that work together:",

    "- A special “express lane” which allows valid transactions to be sequenced as soon as the sequencer receives them for a given round.",
    
    "```image",
    JSON.stringify({
      src: "https://api.growthepie.com/v1/quick-bites/timeboost-express-lane.png",
      alt: "Timeboost Express Lane",
      width: "1920",
      height: "1073",
      caption: "Timeboost Express Lane",
    }),
    "```",
    
    "- An offchain auction to determine the controller of the express lane for a given round. This auction is managed by an autonomous auctioneer.",
    
    "```image",
    JSON.stringify({
      src: "https://api.growthepie.com/v1/quick-bites/timeboost-auction-flow.png",
      alt: "Timeboost Auction Flow",
      width: "1920",
      height: "1069",
      caption: "Timeboost Auction Flow",
    }),
    "```",
    
    "- An auction contract deployed on the target chain to serve as the canonical source of truth for the auction results and handling of auction proceeds.",

    "A more detailed explanation of Timeboost can be found here: [https://docs.arbitrum.io/how-arbitrum-works/timeboost/gentle-introduction](https://docs.arbitrum.io/how-arbitrum-works/timeboost/gentle-introduction)",

    "All charts on this page are updated daily so you can track the adoption of Timeboost.",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/timeboost.png",
  og_image: "https://api.growthepie.com/v1/og_images/quick-bites/arbitrum-timeboost.png",
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
    icon: "gtp-metrics-feespaidbyusers",
    name: "Revenue",
    url: "/fundamentals/fees-paid-by-users"
  }],
  icon: "arbitrum-logo-monochrome"
};

export default arbitrumTimeboost;