import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

const Agents: QuickBiteData = createQuickBite({
  title: "AI Agents in the Ethereum Ecosystem",
  shortTitle: "AI Agents",
  subtitle: "Exploring EIP8004 and the role of AI agents in Ethereum",
  content: [
    "# Introduction:",
    "EIP-8004 introduces a common registration surface for onchain AI agents. This quick bite tracks current adoption, event activity, and URI quality over time.",

    "# EIP-8004 Metrics",
    "```kpi-cards",
    JSON.stringify([
      {
        title: "Registered Agents",
        value: "{{eip8004_total_agents}}",
        description: "latest cumulative",
        icon: "gtp-realtime",
        info: "Total number of agents registered under EIP-8004.",
      },
      {
        title: "Unique Owners",
        value: "{{eip8004_unique_owners}}",
        description: "latest snapshot",
        icon: "gtp-multiple-chains",
        info: "Number of unique owners that registered agents.",
      },
      {
        title: "Agents with Feedback",
        value: "{{eip8004_agents_with_feedback}}",
        description: "latest cumulative",
        icon: "gtp-metrics-transactions",
        info: "Number of registered agents that have feedback attached.",
      },
    ]),
    "```",

    "## Top 200 Agents",
    "```table",
    JSON.stringify({
      readFromJSON: true,
      content: "Most active agents by observed EIP-8004 activity.",
      jsonData: {
        url: "https://api.growthepie.com/v1/quick-bites/eip8004/top_agents.json",
        pathToRowData: "data.top_agents.rows",
        pathToColumnKeys: "data.top_agents.columns",
      },
      columnDefinitions: {
        image: {
          label: "",
          type: "image",
          minWidth: 36,
          isNumeric: false,
          sortByValue: false,
        },
        rank: {
          label: "#",
          type: "number",
          minWidth: 40,
          isNumeric: true,
          sortByValue: true,
          units: {
            value: {
              decimals: 0,
            },
          },
        },
        agent: {
          label: "Agent",
          type: "string",
          sourceKey: "name",
          minWidth: 180,
          isNumeric: false,
          sortByValue: true,
        },
        origin_key: {
          label: "Origin",
          type: "chain",
          minWidth: 70,
          isNumeric: false,
          sortByValue: true,
        },
        x402_support: {
          label: "x402",
          type: "boolean",
          minWidth: 70,
          isNumeric: false,
          sortByValue: true,
        },
        service_mcp_endpoint: {
          label: "MCP Endpoint",
          type: "link",
          sourceKey: "service_mcp_endpoint",
          minWidth: 95,
          isNumeric: false,
          sortByValue: false,
          add_url: "${cellValue}",
        },
        events: {
          label: "Events",
          type: "number",
          minWidth: 90,
          isNumeric: true,
          sortByValue: true,
          units: {
            value: {
              decimals: 0,
            },
          },
        },
      },
      columnOrder: [
        "image",
        "rank",
        "agent",
        "origin_key",
        "x402_support",
        "service_mcp_endpoint",
        "events"
      ],
      columnSortBy: "value",
    }),
    "```",

    "```chart",
    JSON.stringify({
      type: "line",
      title: "Agent Registrations & Feedbacks Over Time",
      subtitle: "Two key event series over time.",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Total Feedbacks",
            oppositeYAxis: true,
            color: "#AEEFED",
            type: "line",
            xIndex: 0,
            yIndex: 1,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/eip8004/events_cumulative.json",
            pathToData: "data.timeseries.values",
          },
          {
            name: "Total Registrations",
            oppositeYAxis: true,
            color: "#FF8A98",
            type: "line",
            xIndex: 0,
            yIndex: 2,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/eip8004/events_cumulative.json",
            pathToData: "data.timeseries.values",
          },
          {
            name: "Registrations",
            oppositeYAxis: false,
            color: "#FE5468",
            type: "column",
            xIndex: 0,
            yIndex: 4,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/eip8004/events_cumulative.json",
            pathToData: "data.timeseries.values",
          },
          {
            name: "Feedbacks",
            oppositeYAxis: false,
            color: "#19D9D6",
            type: "column",
            xIndex: 0,
            yIndex: 3,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/eip8004/events_cumulative.json",
            pathToData: "data.timeseries.values",
          },
        ],
      },
      height: 500,
      caption: "EIP-8004 event activity over time in the Ethereum Ecosystem.",
    }),
    "```",

    "## Agent Breakdown by Chain",
    "```table",
    JSON.stringify({
      readFromJSON: true,
      content: "Distribution of registered agents by chain.",
      jsonData: {
        url: "https://api.growthepie.com/v1/quick-bites/eip8004/origin_breakdown.json",
        pathToRowData: "data.origin_breakdown.rows",
        pathToColumnKeys: "data.origin_breakdown.columns",
      },
      columnDefinitions: {
        chain: {
          label: "Chain",
          type: "chain",
          minWidth: 120,
          isNumeric: false,
          sortByValue: true,
        },
        agents: {
          label: "Agents",
          type: "number",
          minWidth: 100,
          isNumeric: true,
          sortByValue: true,
          units: {
            value: {
              decimals: 0,
            },
          },
        },
        share: {
          label: "Share",
          type: "number",
          minWidth: 100,
          isNumeric: true,
          sortByValue: true,
          units: {
            value: {
              decimals: 2,
              suffix: "%",
            },
          },
        },
      },
      columnSortBy: "value",
    }),
    "```",

    "```chart",
    JSON.stringify({
      type: "column",
      title: "Registered Agents Over Time by Chain",
      subtitle: "Stacked cumulative registrations split by origin chain.",
      showXAsDate: true,
      showTotalTooltip: true,
      dataAsJson: {
        dynamicSeries: {
          url: "https://api.growthepie.com/v1/quick-bites/eip8004/registered_cumulative.json",
          pathToData: "data.timeseries.values",
          ystartIndex: 1,
          names: "data.names",
          colors: "data.colors",
          stacking: "normal",
          xIndex: 0,
          tooltipDecimals: 0
        },
      },
      height: 440,
      caption: "Cumulative registrations across chains under EIP-8004.",
    }),
    "```",

    "# Estimating AI Agents Slop",
    "```kpi-cards",
    JSON.stringify([
      {
        title: "Valid Agents",
        value: "{{eip8004_valid_uri_count}}",
        description: "latest snapshot",
        icon: "gtp-realtime",
        info: "Count of agents with a valid URI.",
      },
      {
        title: "Invalid Agents",
        value: "{{eip8004_empty_uri_count}}",
        description: "latest snapshot",
        icon: "gtp-message",
        info: "Count of agents with an invalid URI.",
      },
      {
        title: "Valid URI Share",
        value: "{{eip8004_valid_uri_share}}%",
        description: "latest snapshot",
        icon: "gtp-metrics-chains-percentage",
        info: "Share of agents with a valid URI.",
      },
    ]),
    "```",

    "```chart",
    JSON.stringify({
      type: "area",
      title: "URI Quality Over Time",
      subtitle: "100% stacked view of valid vs invalid AI-agent URIs.",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Valid URIs",
            color: "#FE5468",
            stacking: "percent",
            xIndex: 0,
            yIndex: 1,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/eip8004/invalid_uri_daily.json",
            pathToData: "data.timeseries.values",
          },
          {
            name: "Invalid URIs",
            color: "#00C805",
            stacking: "percent",
            xIndex: 0,
            yIndex: 2,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/eip8004/invalid_uri_daily.json",
            pathToData: "data.timeseries.values",
          },
        ],
      },
      height: 420,
      caption: "URI quality mix over time (normalized to 100%).",
    }),
    "```",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/eip8004.png",
  og_image: "",
  date: "2026-02-17",
  related: [],
  author: [{
    name: "Lorenz Lehmann",
    xUsername: "LehmannLorenz",
  },
  {
    name: "ETH Wave",
    xUsername: "TrueWaveBreak"
  }],
  topics: [
    {
      icon: "ethereum-logo-monochrome",
      color: "#94ABD3",
      name: "Ethereum Mainnet",
      url: "/chains/ethereum"
    },
    {
      icon: "gtp-metrics-economics",
      name: "Economics",
      url: "/economics"
    },
    {
      icon: "gtp-data-availability",
      name: "Data Availability",
      url: "/data-availability"
    },
  ],
  icon: "ethereum-logo-monochrome",
  showInMenu: false
});

export default Agents;
