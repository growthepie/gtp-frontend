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
        icon: "gtp-settings",
        info: "Total number of agents registered under EIP-8004.",
      },
      {
        title: "Unique Owners",
        value: "{{eip8004_unique_owners}}",
        description: "latest snapshot",
        icon: "gtp-users",
        info: "Number of unique owners that registered agents.",
      },
      {
        title: "Agents with Reviews",
        value: "{{eip8004_agents_with_feedback}}",
        description: "latest cumulative",
        icon: "gtp-realtime",
        info: "Number of registered agents that received at least one review.",
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
          minWidth: 26,
          isNumeric: false,
          sortByValue: false,
        },
        agent: {
          label: "Agent",
          type: "string",
          sourceKey: "name",
          expand: true,
          minWidth: 150,
          maxWidth: 200,
          isNumeric: false,
          sortByValue: true,
        },
        origin_key: {
          label: "Chain",
          type: "chain",
          minWidth: 150,
          isNumeric: false,
          sortByValue: true,
          showLabel: true,
        },
        x402_support: {
          label: "x402 Support",
          type: "boolean",
          minWidth: 100,
          isNumeric: false,
          sortByValue: false,
        },
        feedback_count_valid: {
          label: "Valid Reviews",
          type: "number",
          minWidth: 80,
          isNumeric: true,
          sortByValue: true
        },
        unique_clients: {
          label: "Unique Reviewers",
          type: "number",
          minWidth: 80,
          isNumeric: true,
          sortByValue: true
        },
        endpoints: {
          label: "Endpoints",
          type: "badges",
          minWidth: 140,
          isNumeric: false,
          sortByValue: false,
          badgeSources: [
            { sourceKey: "service_web_endpoint", label: "Web", color: "#4A90D9" },
            { sourceKey: "service_mcp_endpoint", label: "MCP", color: "#10B981" },
          ],
        },
        rating: {
          label: "Overall Rating",
          type: "number",
          sourceKey: "avg_rating",
          minWidth: 80,
          isNumeric: true,
          sortByValue: true,
          units: {
            value: {
              decimals: 2,
            },
          },
        },
      },
      columnOrder: [
        "image",
        "agent",
        "origin_key",
        "x402_support",
        "endpoints",
        "feedback_count_valid",
        "unique_clients",
        "rating"
      ],
      columnSortBy: "value",
      cardView: {
        titleColumn: "agent",
        imageColumn: "image",
        topColumns: ["", "rating"],
        bottomColumns: ["endpoints", "origin_key", "x402_support"],
      },
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

    "## AI Agents by Chain",
    "```table",
    JSON.stringify({
      readFromJSON: true,
      content: "Distribution of registered AI agents by chain.",
      scrollable: false,
      jsonData: {
        url: "https://api.growthepie.com/v1/quick-bites/eip8004/origin_breakdown.json",
        pathToRowData: "data.origin_breakdown.rows",
        pathToColumnKeys: "data.origin_breakdown.columns",
      },
      columnDefinitions: {
        chain_icon: {
          label: "",
          type: "chain",
          sourceKey: "origin_key",
          minWidth: 26,
          isNumeric: false,
          sortByValue: false,
        },
        origin_key: {
          label: "Chain",
          type: "chain",
          minWidth: 120,
          isNumeric: false,
          sortByValue: true,
          showIcon: false,
          showLabel: true,
          expand: true,
        },
        total_registered: {
          label: "Total Registered",
          type: "number",
          minWidth: 200,
          isNumeric: true,
          sortByValue: true,
          units: {
            value: {
              decimals: 0,
            },
          },
        },
        valid_registrations: {
          label: "Valid",
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
        total_feedback: {
          label: "Feedback",
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
        unique_owners: {
          label: "Owners",
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
        agents_per_owner: {
          label: "Agents\n/Owner",
          type: "number",
          minWidth: 100,
          isNumeric: true,
          sortByValue: true,
          units: {
            value: {
              decimals: 2,
            },
          },
        },
        first_registered_date: {
          label: "First Registered",
          type: "string",
          minWidth: 100,
          isNumeric: false,
          sortByValue: true,
          hidden: true,
        },
      },
      columnOrder: [
        "chain_icon",
        "origin_key",
        "total_registered",
        "valid_registrations",
        "total_feedback",
        "unique_owners",
        "agents_per_owner"
      ],
      columnSortBy: "value",
      cardView: {
        titleColumn: "origin_key",
        topColumns: [null, "total_registered", "valid_registrations"],
        bottomColumns: ["total_feedback", "unique_owners", "agents_per_owner"]
      },
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
