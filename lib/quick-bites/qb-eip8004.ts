import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

const Agents: QuickBiteData = createQuickBite({
  title: "AI Agents in the Ethereum Ecosystem (ERC-8004)",
  shortTitle: "AI Agents",
  subtitle: "Exploring ERC-8004 and the role of AI agents in Ethereum",
  content: [
    "# Introduction:",
    "[ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) (“Trustless Agents”) is emerging as foundational infrastructure for the onchain machine economy. It enables agents and services to discover each other, build reputation and optionally validate their outputs across organizational boundaries without relying on a centralized intermediary.",
    "While AI agents are a primary and highly visible use case, the standard is designed as a flexible trust and discovery layer that supports any onchain registered service or endpoint.",
    "At its core, ERC-8004 is built around three registries:",
    
    "### 1. Identity Registry",
    "The Identity Registry is an [ERC-721](https://etherscan.io/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432) based registration system. Each registered entity mints an NFT whose metadata URI points to a structured registration file describing what the entity is, what it provides and how it can be reached. The registration file can reference A2A endpoints, MCP endpoints, standard web URLs, ENS names, DIDs, OASF endpoints or even email addresses. This design allows AI agents, tool servers, oracle networks, automated DeFi services and other infrastructure providers to establish an onchain identity that makes them globally discoverable.",
    
    "### 2. Reputation Registry",
    "The [Reputation Registry](https://etherscan.io/address/0x8004BAa17C55a88189AE136b182e5fdA19dE9b63) enables giving onchain feedback to service providers on a score of 0–100 with optional performance tags. It is not limited to subjective scoring, it can also capture performance indicators such as uptime, response time, success rate, block freshness, revenues or yield. This makes it suitable for evaluating both autonomous agents and infrastructure services.",

    "### 3. Validation Registry (Under Development)",
    "The Validation Registry introduces a mechanism for requesting and publishing objective verification of outputs. Registered entities can request audits or proofs from validator contracts, which may rely on stake secured re-execution, zkML proofs, or TEE-based attestations. The registry itself does not define correctness; instead, it standardizes how validation claims are published and discovered, allowing participants to evaluate services based on the specific validator mechanisms they trust.",

    "# Overview",
    "```kpi-cards",
    JSON.stringify([
      {
        title: "Onchain Registered Services",
        value: "{{eip8004_total_agents}}",
        description: "in total",
        icon: "gtp-settings",
        info: "Total number of onchain registered services under ERC-8004.",
      },
      {
        title: "Unique Owners",
        value: "{{eip8004_unique_owners}}",
        description: "in total",
        icon: "gtp-users",
        info: "Number of unique owners that registered at least one onchain services.",
      },
      {
        title: "Services with Reviews",
        value: "{{eip8004_agents_with_feedback}}",
        description: "in total",
        icon: "gtp-realtime",
        info: "Number of registered onchain services that received at least one review.",
      },
    ]),
    "```",
    
    "Since the launch of the ERC-8004 standard in late January 2026, we have seen explosive growth in the number of registered machine-to-machine services, with over {{eip8004_total_agents}} services registered to date. The ecosystem is still in its early days, but the rapid adoption of the standard and the volume of feedback already generated show the strong demand for a trustless identity and reputation layer for the machine-to-machine ecosystem.",

    "## Most Popular AI Agents & Services",
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
          label: "Name",
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
          label: "Service Endpoints",
          type: "badges",
          minWidth: 300,
          maxVisibleBadges: 6,
          isNumeric: false,
          sortByValue: false,
          badgeSources: [
            { sourceKey: "service_web_endpoint", label: "Web", color: "#4A90D9" },
            { sourceKey: "service_mcp_endpoint", label: "MCP", color: "#10B981" },
            { sourceKey: "service_a2a_endpoint", label: "A2A", color: "#F59E0B" },
            { sourceKey: "service_oasf_endpoint", label: "OASF", color: "#8B5CF6" },
            { sourceKey: "service_ens_endpoint", label: "ENS", color: "#EC4899" },
            { sourceKey: "service_did_endpoint", label: "DID", color: "#14B8A6" },
            { sourceKey: "service_email_endpoint", label: "Email", color: "#F97316" },
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
        sections: [
          { columns: ["rating", "feedback_count_valid", "unique_clients"], labelPosition: "bottom" },
          { columns: ["origin_key", "x402_support"], labelPosition: "right", layout: "start" },
          { columns: ["endpoints"], labelPosition: "hidden" },
        ],
        autoRowHeight: true,
      },
    }),
    "```",

    "AI agents span a broad spectrum, from task-specific bots such as automated arbitrageurs or liquidators to more autonomous, agentic systems capable of long-term planning and complex DeFi strategy execution. Alongside these agents, the registry also includes a growing range of infrastructure services and tool providers. As reflected in the table above, each registered entity exposes different payment and communication interfaces, including x402-based payment flows for real-time microtransactions and MCP (Model Context Protocol) endpoints for standardized access to tools and data services.",

    "```chart",
    JSON.stringify({
      type: "line",
      title: "Registrations & Reviews Over Time",
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
      caption: "ERC-8004 event activity over time for the whole Ethereum Ecosystem.",
    }),
    "```",

    "## Distribution by Chain",
    "```table",
    JSON.stringify({
      readFromJSON: true,
      content: "As ERC-8004 is an application-layer standard, any EVM-compatible chain can simply deploy the registry contracts without requiring a network hard fork. Because of this permissionless design, many chains across the Ethereum ecosystem have already adopted the standard to support the growing agentic economy.",
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
          type: "date",
          dateFormat: "medium",
          showTimeAgo: true,
          minWidth: 140,
          isNumeric: true,
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
        sections: [
          { columns: ["total_registered", "valid_registrations"], labelPosition: "bottom" },
          { columns: ["total_feedback", "unique_owners", "agents_per_owner"], labelPosition: "bottom" },
        ]
      },
    }),
    "```",

    "```chart",
    JSON.stringify({
      type: "column",
      title: "New Registrations of AI Agents & Services by Chain",
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
      caption: "New registrations of AI agents & services over time, broken down by chain.",
    }),
    "```",

    "## Endpoint Service Types",
    "Count of different endpoint types provided by registered agents & services. One agent can provide multiple endpoints.",
    "Web endpoints are standard HTTP/HTTPS APIs or frontends for interacting with an agent; MCP (Model Context Protocol) endpoints expose structured tools and data for AI-native integrations; A2A endpoints enable direct agent-to-agent communication; OASF endpoints follow a structured service framework for publishing agent capabilities; ENS endpoints use human-readable .eth names for resolution; DID endpoints provide decentralized identity documents; and Email endpoints bridge agents with traditional offchain communication.",
    "```chart",
    JSON.stringify({
      type: "pie",
      title: "Service Endpoint Share",
      subtitle: "Breakdown of endpoint types published by ERC-8004 agents",
      centerName: "SERVICE\nSHARE",
      height: 400,
      dataAsJson: {
        pieData: {
          url: "https://api.growthepie.com/v1/quick-bites/eip8004/service_counts.json",
          pathToData: "data.service_counts",
          colors: ["#2151F5","#FFC300","#FE5468","#2bee6c","#8B5CF6","#19D9D6","#ff7ceb"],
          xIndex: 0,
          yIndex: 1,
          tooltipDecimals: 0,
          showPercentage: true,
          nameMap: {
            "web": "Web",
            "mcp": "MCP",
            "a2a": "A2A",
            "oasf": "OASF",
            "ens": "ENS",
            "did": "DID",
            "email": "Email",
          },
        },
      },
      caption: "Distribution of service endpoint types provided by registered agents.",
    }),
    "```",

    "# Estimating AI Slop",

    "To be discoverable by AI agents and onchain actors, each service provider must provide a standardized metadata file via the URI field of its Identity NFT. We can estimate the amount of AI slop by counting the non-functional URI resolvability; currently, out of {{eip8004_total_agents}} total registrations, only {{eip8004_valid_uri_count}} have valid and resolvable URIs, which totals to a slop share of {{eip8004_empty_uri_share}}%. As tooling matures and registration becomes more intuitive, we expect a decrease in these broken configurations and a shift toward higher-quality profiles.",

    "```kpi-cards",
    JSON.stringify([
      {
        title: "Valid Registrations",
        value: "{{eip8004_valid_uri_count}}",
        description: "latest snapshot",
        icon: "gtp-realtime",
        info: "Count of registrations with a valid URI set.",
      },
      {
        title: "Invalid Registrations",
        value: "{{eip8004_empty_uri_count}}",
        description: "latest snapshot",
        icon: "gtp-message",
        info: "Count of registrations with an invalid URI set.",
      },
      {
        title: "Valid Registrations Share",
        value: "{{eip8004_valid_uri_share}}%",
        description: "latest snapshot",
        icon: "gtp-metrics-chains-percentage",
        info: "Share of registrations with a valid URI set.",
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
