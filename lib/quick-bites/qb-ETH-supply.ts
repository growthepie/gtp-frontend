import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

const ethSupply: QuickBiteData = createQuickBite({
  title: "ETH Supply & Issuance Tracker",
  subtitle: "Track Ethereum's total supply and issuance over time",
  shortTitle: "ETH Supply",
  content: [
    "Ethereum's monetary policy has evolved significantly since its inception, particularly after the transition to Proof of Stake (The Merge) and the implementation of EIP-1559 (The Burn). These changes have fundamentally altered how new ETH enters circulation and how the total supply changes over time.",

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
        info: "Net change in ETH supply over the last 30 days",
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

    "# Supply and Issuance Chart",
    "This chart shows the relationship between Ethereum's total supply and its issuance rate over time. The total supply (left axis) represents all ETH in circulation, while the issuance (right axis) shows the annualized rate at which new ETH is being created or burned.",

    "```chart",
    JSON.stringify({
      type: "line",
      title: "ETH Supply and Issuance Rate",
      subtitle: "Total ETH supply and daily issuance rate over time",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Total Supply",
            color: "#1cd3d3",
            stacking: "normal",
            oppositeYAxis: false,
            type: "line",
            xIndex: 0,
            yIndex: 1,
            suffix: " ETH",
            tooltipDecimals: 0,
            url: "https://api.growthepie.xyz/v1/eim/eth_supply.json",
            pathToData: "data.chart.eth_supply.daily.data",
          },
          {
            name: "Issuance Rate",
            color: "#E5B300",
            stacking: "normal",
            oppositeYAxis: true,
            type: "line",
            xIndex: 0,
            yIndex: 1,
            suffix: "%",
            tooltipDecimals: 2,
            url: "https://api.growthepie.xyz/v1/eim/eth_supply.json",
            pathToData: "data.chart.eth_issuance_rate.daily.data",
            yMultiplication: 100,
          }
        ],
      },
      height: 500,
      caption: "ETH total supply and daily issuance rate.",
      yAxisLine: [
        {
          xValue: 1663200000000, // Sep 15, 2022 - The Merge
          annotationPositionY: 10,
          annotationPositionX: -45,
          annotationText: "The Merge",
          lineStyle: "Dash",
          lineColor: "#19D9D6",
          textColor: "#19D9D6",
          textFontSize: "9px",
          backgroundColor: "#19D9D6",
          lineWidth: 1
        },
        {
          xValue: 1628121600000, // Aug 5, 2021 - EIP-1559
          annotationPositionY: 10,
          annotationPositionX: -45,
          annotationText: "The Burn",
          lineStyle: "Dash",
          lineColor: "#19D9D6",
          textColor: "#19D9D6",
          textFontSize: "9px",
          backgroundColor: "#19D9D6",
          lineWidth: 1
        }
      ]
    }),
    "```",

    "# Major Supply-Impacting Events",
    "The vertical lines in the chart mark the two most recent crucial events that fundamentally changed Ethereum's issuance model:",

    "## The Burn (August 2021)",
    "The implementation of EIP-1559 introduced a mechanism that burns the base fee of every transaction, effectively destroying ETH based on network usage. During periods of high network activity, this burning mechanism can exceed new issuance, making ETH deflationary. This upgrade created a direct link between network usage and ETH supply dynamics.",

    "## The Merge (September 2022)",
    "The transition from Proof of Work to Proof of Stake marked a dramatic reduction in ETH issuance. Mining rewards (~13,000 ETH/day) were replaced with staking rewards (~1,700 ETH/day), reducing new ETH issuance by about 87%. This change made Ethereum's supply dynamics mathematically predictable with minimal and precisely controlled issuance. Additionally, The Merge reduced Ethereum's energy consumption by approximately 99.95%, as energy-intensive mining was replaced with environmentally friendly staking.",

    "For a more detailed breakdown of ETH supply metrics, including real-time burn rates and staking rewards, visit [ultrasound.money](https://ultrasound.money/).",

    "> This page is a data tracker for informational and educational purposes only. It is not investment advice. Data may be delayed or inaccurate. Do your own research.",
  ],
  image: "/quick-bites/eth-supply.webp",
  og_image: "/quick-bites/eth-supply.webp",
  date: "2025-10-28",
  related: [],
  author: [{
    name: "Lorenz Lehmann",
    xUsername: "LehmannLorenz",
  }],
  topics: [
    {
      icon: "gtp-metrics-economics",
      name: "Economics",
      url: "/economics"
    },
    {
      name: "Ethereum",
      url: "/chains/ethereum"
    },
    {
      icon: "gtp-categories",
      name: "Monetary Policy",
      url: ""
    },
  ],
  icon: "ethereum-logo-monochrome",
  showInMenu: true
});

export default ethSupply;
