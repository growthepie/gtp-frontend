import { QuickBiteData } from '@/lib/types/quickBites';

const ethSupply: QuickBiteData = {
  title: "ETH Circulating Supply Tracker",
  subtitle: "Track Ethereum's total supply and issuance over time",
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
    "This chart shows the relationship between Ethereum's total supply and its issuance rate over time. The total supply (left axis) represents all ETH in circulation, while the issuance (right axis) shows the rate at which new ETH is being created or burned.",

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
    }),
    "```",

    "# Major ETH Supply Changes",
    "The following events significantly impacted Ethereum's supply dynamics:",

    "```table",
    JSON.stringify({
      readFromJSON: true,
      jsonData: {
        url: "https://api.growthepie.xyz/v1/eim/eth_supply.json",
        pathToRowData: "data.events",
        filter: {
          field: "show_in_chart",
          value: true
        }
      },
      columnDefinitions: {
        date: {
          label: "Date",
          type: "string",
          minWidth: 100,
          isNumeric: false,
          sortByValue: true
        },
        short_title: {
          label: "Event",
          type: "string",
          minWidth: 120,
          isNumeric: false,
          sortByValue: false
        },
        issuance: {
          label: "Issuance Model",
          type: "string",
          minWidth: 140,
          isNumeric: false,
          sortByValue: false
        },
        description: {
          label: "Description",
          type: "string",
          minWidth: 200,
          isNumeric: false,
          sortByValue: false
        },
        source: {
          label: "Source",
          type: "string",
          minWidth: 100,
          isNumeric: false,
          sortByValue: false,
          add_url: "${cellValue}"
        }
      },
      columnOrder: ["date", "short_title", "issuance", "description", "source"]
    }),
    "```",

    "> This page is a data tracker for informational and educational purposes only. It is not investment advice. Data may be delayed or inaccurate. Do your own research.",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/eth-supply.png",
  og_image: "",
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
  icon: "ethereum-logo-monochrome"
};

export default ethSupply;
