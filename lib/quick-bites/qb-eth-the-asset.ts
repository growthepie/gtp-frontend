import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

const ethTheAsset: QuickBiteData = createQuickBite({
  title: "ETH the Asset",
  subtitle: "The money that pays for, secures, and settles the Ethereum economy",
  shortTitle: "ETH the Asset",
  summary:
    "ETH is not just the token used to pay gas — it is the asset that secures Ethereum, backs its monetary policy, and settles value across every rollup. This bite looks at supply, issuance, market value and fee demand together.",
  content: [
    "Most conversations about Ethereum focus on the network: how many transactions it processes, how cheap its rollups are, how much data it can post. ETH itself — the asset that pays for all of it — gets discussed far less precisely.",

    "ETH does three jobs at once. It is the **fuel** every transaction burns, the **collateral** validators stake to secure the chain, and the **settlement asset** rollups denominate their bridged value in. Each of those roles shows up differently in the data.",

    "```live-metrics",
    JSON.stringify({
      title: "ETH Supply — live projection",
      icon: "gtp-realtime",
      dataUrl: "https://api.growthepie.com/v1/eim/eth_supply.json",
      dataPath: "data.chart",
      refreshInterval: 600000,
      metricsLeft: [
        {
          label: "Issuance Rate",
          valuePath: "eth_issuance_rate.daily.data.last.1",
          valueFormat: { multiply: 100, decimals: 4, suffix: "% / yr" },
        },
        {
          label: "Last Reading",
          valuePath: "eth_supply.daily.data.last.0",
          valueFormat: { type: "date", dateFormat: "D MMM YYYY HH:mm [UTC]" },
        },
      ],
      liveMetric: {
        label: "projected supply",
        valuePath: "eth_supply.daily.data.last.1",
        valueFormat: { prefix: "Ξ", decimals: 2 },
        accentColor: "#1cd3d3",
        projection: {
          baseTimePath: "eth_supply.daily.data.last.0",
          annualRatePath: "eth_issuance_rate.daily.data.last.1",
          tickIntervalMs: 1000,
          ratePercentDecimals: 4,
        },
      },
    }),
    "```",

    "The counter above is a **projection, not a measurement**. It takes the last daily supply reading, applies the current annualised issuance rate shown beside it, and counts forward in real time — roughly 0.03 ETH per second at today's rate. The base value re-syncs from the API every ten minutes, so the number can step slightly when fresh data lands. Real issuance arrives per block and is offset by the burn, so treat this as an illustration of pace rather than an exact live supply.",

    "```kpi-cards",
    JSON.stringify([
      {
        title: "Total ETH Supply",
        value: "Ξ{{eth_total_supply}}",
        description: "current",
        icon: "gtp-realtime",
        info: "Current total supply of ETH in circulation",
      },
      {
        title: "Net Issuance (30d)",
        value: "Ξ{{eth_net_issuance_30d}}",
        description: "last 30 days",
        icon: "gtp-realtime",
        info: "Net change in ETH supply over the last 30 days, after burn",
      },
      {
        title: "Issuance Rate",
        value: "{{eth_annual_issuance_rate}}%",
        description: "annualized",
        icon: "gtp-realtime",
        info: "Annualized rate of new ETH issuance based on current parameters",
      },
    ]),
    "```",

    "# A supply that responds to usage",
    "Two upgrades turned ETH's supply from a simple emission schedule into something that reacts to how much the network is used. EIP-1559 (August 2021) burns the base fee of every transaction, so heavy usage destroys ETH. The Merge (September 2022) replaced mining rewards with staking rewards and cut new issuance by roughly 87%. Together they mean net supply growth depends on demand for blockspace — when the burn exceeds issuance, supply shrinks.",

    "```chart",
    JSON.stringify({
      type: "line",
      title: "ETH Supply and Issuance Rate",
      subtitle: "Total supply against the annualized issuance rate",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Total Supply",
            color: "#1cd3d3",
            oppositeYAxis: false,
            type: "line",
            xIndex: 0,
            yIndex: 1,
            suffix: " ETH",
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/eim/eth_supply.json",
            pathToData: "data.chart.eth_supply.daily.data",
          },
          {
            name: "Issuance Rate",
            color: "#E5B300",
            oppositeYAxis: true,
            type: "line",
            xIndex: 0,
            yIndex: 1,
            suffix: "%",
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/eim/eth_supply.json",
            pathToData: "data.chart.eth_issuance_rate.daily.data",
            yMultiplication: 100,
          },
        ],
      },
      height: 500,
      caption: "Source: growthepie ETH supply tracker.",
      yAxisLine: [
        {
          xValue: 1628121600000, // Aug 5, 2021 - EIP-1559
          annotationPositionY: 10,
          annotationPositionX: -60,
          annotationText: "The Burn",
          lineStyle: "Dash",
          lineColor: "#19D9D6",
          textColor: "#19D9D6",
          textFontSize: "9px",
          backgroundColor: "#19D9D6",
          lineWidth: 1,
        },
        {
          xValue: 1663200000000, // Sep 15, 2022 - The Merge
          annotationPositionY: 10,
          annotationPositionX: 0,
          annotationText: "The Merge",
          lineStyle: "Dash",
          lineColor: "#19D9D6",
          textColor: "#19D9D6",
          textFontSize: "9px",
          backgroundColor: "#19D9D6",
          lineWidth: 1,
        },
      ],
    }),
    "```",

    "For a deeper breakdown of supply mechanics on their own, see our [ETH Supply & Issuance Tracker](https://www.growthepie.com/quick-bites/eth-supply).",

    "# What the market pays for it",
    "Supply is only half the picture. Market capitalisation is the market's running valuation of the whole ETH float — the number that decides how much economic security staking can buy and how much collateral the ecosystem has to work with.",

    "```chart",
    JSON.stringify({
      type: "area",
      title: "Ethereum Market Cap",
      subtitle: "Total value of circulating ETH",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Market Cap",
            color: "#94ABD3",
            xIndex: 0,
            yIndex: 1,
            prefix: "$",
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/metrics/chains/ethereum/market_cap.json",
            pathToData: "details.timeseries.daily.data",
          },
        ],
      },
      height: 400,
      caption: "Source: growthepie. Daily market capitalisation of ETH in USD.",
    }),
    "```",

    "# Demand shows up as fees",
    "Every unit of blockspace someone buys is paid for in ETH, and the base-fee portion of it is burned. Denominating L1 fees in ETH rather than dollars strips out price moves and leaves the thing that actually matters for supply: how much ETH the network is consuming to do its job.",

    "```chart",
    JSON.stringify({
      type: "column",
      title: "Fees Paid on Ethereum L1",
      subtitle: "Daily fees paid by users, denominated in ETH",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Fees Paid",
            color: "#E5B300",
            xIndex: 0,
            yIndex: 2,
            suffix: " ETH",
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/metrics/chains/ethereum/fees.json",
            pathToData: "details.timeseries.daily.data",
          },
        ],
      },
      height: 400,
      caption: "Source: growthepie. Daily fees paid by users on Ethereum Mainnet.",
    }),
    "```",

    "> Rollups do not compete with ETH the asset — they extend it. L2s post their data to Ethereum and pay for it in ETH, and the value they bridge is largely ETH-denominated. More activity on L2s means more settlement demand for the same asset.",

    "# Why it matters",
    "The three views above are the same asset seen from different angles. Supply and issuance set how much ETH exists. Market cap prices it. Fee burn ties the first two to real usage. Reading any one of them alone gives an incomplete picture of what ETH is worth and why.",

    "> This page is a data tracker for informational and educational purposes only. It is not investment advice. Data may be delayed or inaccurate. Do your own research.",
  ],
  image: "/quick-bites/eth-supply.webp",
  og_image: "/quick-bites/eth-supply.webp",
  date: "2026-08-11",
  related: [],
  author: [
    {
      name: "Wave Break",
      xUsername: "",
    },
  ],
  topics: [
    {
      icon: "gtp-metrics-economics",
      name: "Economics",
      url: "/economics",
    },
    {
      name: "Ethereum",
      url: "/chains/ethereum",
    },
    {
      icon: "gtp-categories",
      name: "Monetary Policy",
      url: "",
    },
  ],
  icon: "ethereum-logo-monochrome",
  // Not live yet: keeps it out of the Quick Bites grid, sidebar menu, homepage
  // section, chain tabs and production search. Still reachable directly at
  // /quick-bites/eth-the-asset, and it shows up in search on dev.
  showInMenu: false,
});

export default ethTheAsset;
