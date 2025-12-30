import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

const averageAddress: QuickBiteData = createQuickBite({
  title: "The Average Active Address",
  subtitle: "Understanding the relationship between active addressesm, fundamentals and economics.",
  shortTitle: "Avg Address",
  content: [

    "# The Problem With Active Addresses",
    "Active addresses is a metric that gets a lot of critism because it can be easily manipulated by multiple parties each with different incentives. So instead of looking at the total number this quick bite will exsplore combining active addresses with economic metrics that are harder to game. We will also explore the relationshtip between active addresses and other fundamental metrics to understand their relatiionshp and how it differs per chain.",

    "# Fundamentals per Active Address",
    
    "The average address on a blockchain represents the typical user experience and behavior patterns across the network. Understanding what makes an address 'average' provides valuable insights into network health, user distribution, and economic activity.",
    
    "```kpi-cards",
    JSON.stringify([
      {
        title: "Volume",
        value: "{{avg_address_volume}}",
        description: "Average transactions per address",
        icon: "gtp-metrics-transactioncount",
        info: "Average number of transactions per active address across the top 10 chains by active addresses (last 30 days)."
      },
      {
        title: "Complexity",
        value: "{{avg_address_complexity}}",
        description: "Average throughput per address",
        icon: "gtp-metrics-throughput",
        info: "Average throughput per active address across the top 10 chains by active addresses (last 30 days)."
      },
      {
        title: "Value",
        value: "{{avg_address_value}}",
        description: "Average stablecoin supply per address",
        icon: "gtp-metrics-stablecoinmarketcap",
        info: "Average stablecoin supply per active address across the top 10 chains by active addresses (last 30 days)."
      },
      {
        title: "Unit cost",
        value: "{{avg_address_unit_cost}}",
        description: "Average transaction cost per address",
        icon: "gtp-metrics-transactioncosts",
        info: "Average transaction cost per active address across the top 10 chains by active addresses (last 30 days)."
      }
    ]),
    "```",
    
    "## Scatter Charts",
    
    "The following scatter plots compare active addresses with different metrics to reveal patterns in network usage, engagement, and economic activity across different blockchain networks.",

    "```scatter-chart-toggle",
    JSON.stringify({
      title: null,
      description: null,
      layout: "segmented",
      defaultIndex: 0,
      charts: [
        {
          toggleLabel: "Volume",
          type: "chains-scatter-chart"
        },
        {
          toggleLabel: "Complexity",
          type: "chains-scatter-throughput-chart"
        },
        {
          toggleLabel: "Value",
          type: "chains-scatter-stables-chart"
        },
        {
          toggleLabel: "Unit cost",
          type: "chains-scatter-txcosts-chart"
        }
      ]
    }),
    "```",
  ],
  image: "/quick-bites/average-address.webp",
  og_image: "/quick-bites/average-address.webp",
  date: new Date().toISOString().split('T')[0],
  related: [],
  author: [],
  topics: [
    {
      name: "Fundamentals",
      url: "/fundamentals"
    }
  ],
  icon: "gtp-metrics-activeaddresses",
  showInMenu: true
});

export default averageAddress;

