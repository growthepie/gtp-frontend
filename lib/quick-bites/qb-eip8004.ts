import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

const Agents: QuickBiteData = createQuickBite({
  title: "AI Agents in the Ethereum Ecosystem (EIP-8004)",
  shortTitle: "AI Agents",
  subtitle: "Exploring EIP8004 and the role of AI agents in Ethereum",
  content: [
    "# Introduction:",
    "[EIP-8004](https://eips.ethereum.org/EIPS/eip-8004) (a.k.a. \"Trustless Agents\" standard) is the emerging backbone for the \"Agentic Economy\" on EVM chains. It solves the \"trust gap\" that occurs when autonomous AI agents from different organizations need to work together without a central middleman to verify who they are or if they are any good.",
    "The protocol is built around three registries. Think of them as the Identity, Review System and Notary of the AI world.",
    "### 1. Identity Registry",
    "Agents can register and mint an [ERC-721 NFTs](https://etherscan.io/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432) that serves as their digital passport. Each agent receives a unique ID and sets a metadata URI detailing its skills, communication protocols (e.g., MCP/A2A) and wallet address ensuring global discoverability.",
    "### 2. Reputation Registry",
    "A decentralized [feedback system](https://etherscan.io/address/0x8004BAa17C55a88189AE136b182e5fdA19dE9b63) for clients to rate their AI agents on a score of 0–100 and assign performance tags.",
    "### 3. Validation Registry (Under Development)",
    "It allows agents to request audits from external validators (like TEEs or zkML proofs). Unlike the subjective Reputation Registry, this is for objective proofs. However, the reliability depends entirely on the specific validator chosen, not the registry itself.",
    
    "# Overview",
    "```kpi-cards",
    JSON.stringify([
      {
        title: "Registered AI Agents",
        value: "{{eip8004_total_agents}}",
        description: "in total",
        icon: "gtp-settings",
        info: "Total number of AI agents registered under EIP-8004.",
      },
      {
        title: "Unique Owners",
        value: "{{eip8004_unique_owners}}",
        description: "in total",
        icon: "gtp-users",
        info: "Number of unique owners that registered AI agents.",
      },
      {
        title: "Agents with Reviews",
        value: "{{eip8004_agents_with_feedback}}",
        description: "in total",
        icon: "gtp-realtime",
        info: "Number of registered AI agents that received at least one review.",
      },
    ]),
    "```",
    
    "Since the launch of the EIP-8004 standard in late January 2026, we have seen explosive growth in the number of registered AI agents, with over {{eip8004_total_agents}} agents registered to date. The ecosystem is still in its early days, but the rapid adoption of the standard and the volume of feedback already generated show the strong demand for a trustless identity and reputation layer for AI agents.",

    "## Most Popular AI Agents",
    "```table",
    JSON.stringify({
      readFromJSON: true,
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
          label: "Agent Name",
          type: "string",
          sourceKey: "name",
          infoTooltip: { sourceKey: "description" },
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

    "AI agents come in a wide variety of flavors, ranging from deterministic task-specific bots such as automated arbitrageurs or liquidators, to autonomous agentic systems capable of long-term planning and complex DeFi strategy execution. As shown in the table above, each agent supports different payment or communication solutions, such as x402 payment protocols for real-time microtransactions or MCP (Model Context Protocol) endpoints for standardized tool and data integrations.",

    "```chart",
    JSON.stringify({
      type: "line",
      title: "AI Agent Registrations & Reviews Over Time",
      subtitle: "Two key event series over time.",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Total Reviews",
            oppositeYAxis: true,
            color: "#AEEFED",
            type: "line",
            xIndex: 0,
            yIndex: 1,
            dashStyle: "Dash",
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
            dashStyle: "Dash",
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
            name: "Reviews",
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
      caption: "EIP-8004 event activity over time for the whole Ethereum Ecosystem.",
    }),
    "```",

    "## AI Agent Distribution by Chain",
    "```table",
    JSON.stringify({
      readFromJSON: true,
      content: "As EIP-8004 is an application-layer standard, any EVM-compatible chain can simply deploy the registry contracts without requiring a network hard fork. Because of this permissionless design, many chains across the Ethereum ecosystem have already adopted the standard to support the growing agentic economy.",
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
        first_registered_date: {
          label: "First Registered Date",
          type: "string",
          minWidth: 120,
          isNumeric: false,
          sortByValue: true,
        },
        total_registered: {
          label: "Total AI Agents",
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
          label: "Valid AI Agents",
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
          label: "Reviews",
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
        }
      },
      columnOrder: [
        "chain_icon",
        "origin_key",
        "first_registered_date",
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
      subtitle: "Stacked registrations split by origin chain.",
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
      caption: "New registrations of AI agents over time, broken down by chain.",
    }),
    "```",

    "# Estimating AI Agents Slop",

    "To be discoverable by other AI agents and onchain actors, each AI agent must provide a standardized metadata file via the URI field of its Identity NFT. We can estimate the amount of AI agent slop by counting the non-functional URI resolvability; currently, out of {{eip8004_total_agents}} total agents, only {{eip8004_valid_uri_count}} have valid and resolvable URIs, which totals to a slop share of {{eip8004_empty_uri_share}}%. As tooling matures and registration becomes more intuitive, we expect a decrease in these broken configurations and a shift toward higher-quality, verifiable agent profiles.",

    "```kpi-cards",
    JSON.stringify([
      {
        title: "Valid AI Agents",
        value: "{{eip8004_valid_uri_count}}",
        description: "latest snapshot",
        icon: "gtp-realtime",
        info: "Count of agents with a valid URI set.",
      },
      {
        title: "Invalid AI Agents",
        value: "{{eip8004_empty_uri_count}}",
        description: "latest snapshot",
        icon: "gtp-message",
        info: "Count of agents with an invalid URI set.",
      },
      {
        title: "Valid AI Agents Share",
        value: "{{eip8004_valid_uri_share}}%",
        description: "latest snapshot",
        icon: "gtp-metrics-chains-percentage",
        info: "Share of agents with a valid URI set.",
      },
    ]),
    "```",

    "```chart",
    JSON.stringify({
      type: "area",
      title: "AI Agent Quality Over Time",
      subtitle: "100% stacked view of valid vs invalid AI-agent URIs.",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Valid URIs",
            color: "#00C805",
            stacking: "percent",
            xIndex: 0,
            yIndex: 2,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/eip8004/invalid_uri_daily.json",
            pathToData: "data.timeseries.values",
          },
          {
            name: "Invalid URIs",
            color: "#FE5468",
            stacking: "percent",
            xIndex: 0,
            yIndex: 1,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/eip8004/invalid_uri_daily.json",
            pathToData: "data.timeseries.values",
          },
        ],
      },
      height: 420,
      caption: "Share of AI agents who provided a valid URI over time, as a proxy for quality and slop in the ecosystem.",
    }),
    "```",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/eip-8004.png",
  og_image: "",
  date: "2026-02-17",
  related: [],
  author: [{
    name: "Lorenz Lehmann",
    xUsername: "LehmannLorenz",
  }],
  topics: [
    {
      icon: "ethereum-logo-monochrome",
      color: "#94ABD3",
      name: "Ethereum Mainnet",
      url: "/chains/ethereum"
    },
    {
      icon: "gtp-compare",
      name: "AI",
      url: "/blockspace/category-comparison"
    },
  ],
  icon: "ethereum-logo-monochrome",
  showInMenu: true
});

export default Agents;
