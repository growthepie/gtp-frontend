import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

/**
 * Test Quick Bite - Example implementation showcasing all available content blocks
 * 
 * 📖 For complete documentation on creating Quick Bites, see: ./README.md
 * 
 * This file demonstrates:
 * - All content block types (kpi-cards, charts, iframes, images, code, text)
 * - Chart configurations (line, column, area charts with different stacking)
 * - Dynamic value interpolation ({{variableName}})
 * - Text formatting (headers, bold, callouts, lists)
 */

const testBite: QuickBiteData = createQuickBite({
  title: "This is a Test Quick Bite",
  subtitle: "Trying out different types of blocks",
  shortTitle: "Test Quick Bite",
  content: [
    "This Quick Bite is a test to see how different types of blocks work. It's a work in progress and will be updated as we add more features to the platform.",
    "## ETH/USD Switch (Quick Bites)",
    "By default, the global ETH/USD switch is disabled on all `/quick-bites` pages, it has been enabled for this quick bite.",
    "To enable it for a specific quick bite, set `ethUsdSwitchEnabled: true` in that quick bite config.",
    "```kpi-cards",JSON.stringify(
      [
          {
            title: "Test with Dynamic Value",
            value: "{{timeboostTotalETH}} ETH",
            description: "Test",
            icon: "gtp-realtime",
            info: "Test"
          },
          {
            title: "Test",
            value: "100",
            description: "Test",
            icon: "gtp-realtime",
            info: "Test"
          },
          {
            title: "Test",
            value: "100",
            description: "Test",
            icon: "gtp-realtime",
            info: "Test"
          }
      ]),
    "```",
    "```live-metrics-row",
    JSON.stringify({
      items: [
        {
          title: "Transfer Fees (Arbitrum)",
          icon: "gtp-growthepie-fees",
          dataUrl: "https://sse.growthepie.com/api/chain/arbitrum/history",
          dataPath: "history.0",
          historyPath: "history",
          refreshInterval: 10000,
          feeDisplayRows: [
            {
              title: "ERC20 Transfer",
              valuePath: "tx_cost_erc20_transfer_usd",
              historyPath: "history",
              valueKey: "tx_cost_erc20_transfer_usd",
              showUsd: true,
              gradientClass: "from-chains-arbitrum to-chains-arbitrum/50",
              hoverText: "new block every ~250ms"
            }
          ],
          liveMetric: {
            label: "Current (USD)",
            valuePath: "tps",
            valueFormat: { prefix: "$", maxDecimals: 4 },
            accentColor: "#28A0F0"
          }
        },
        {
          title: "TPS (Base)",
          icon: "gtp-metrics-transactionspersecond",
          layout: "chart-right",
          dataUrl: "https://sse.growthepie.com/api/chain/base/history",
          dataPath: "history.0",
          refreshInterval: 10000,
          chart: {
            dataPath: "history",
            valueKey: "tps",
            timeKey: "timestamp",
            metricLabel: "TPS",
            seriesNamePath: "display_name",
            overrideColor: ["#2151F5", "#7EA6FF"],
            centerWatermark: true,
            anchorZero: true,
            limit: 100
          },
          liveMetric: {
            label: "Current TPS",
            valuePath: "tps",
            valueFormat: { maxDecimals: 1, suffix: " TPS" },
            accentColor: "#2151F5"
          }
        },
        {
          title: "TPS (OP Mainnet)",
          icon: "gtp-metrics-transactionspersecond",
          layout: "chart-right",
          dataUrl: "https://sse.growthepie.com/api/chain/optimism/history",
          dataPath: "history.0",
          refreshInterval: 10000,
          chart: {
            dataPath: "history",
            valueKey: "tps",
            timeKey: "timestamp",
            metricLabel: "TPS",
            seriesNamePath: "display_name",
            overrideColor: ["#FE5468", "#FF8BA0"],
            centerWatermark: true,
            anchorZero: true,
            limit: 100
          },
          liveMetric: {
            label: "Current TPS",
            valuePath: "tps",
            valueFormat: { maxDecimals: 1, suffix: " TPS" },
            accentColor: "#FE5468"
          }
        }
      ]
    }),
    "```",


    "## Toggleable Chart Group",
    "This example bundles multiple chart configurations into a single block with a toggle so readers can explore different views.",
    "```chart-toggle",
    JSON.stringify({
      title: "Toggle Between Metrics",
      description: "Switch between blob throughput and Type 4 transaction activity.",
      layout: "segmented",
      defaultIndex: 0,
      charts: [
        {
          toggleLabel: "Blobs per Block",
          type: "line",
          title: "Submitted Blobs per Block",
          subtitle: "Compare the average #Blobs per block before and after the Pectra upgrade",
          showXAsDate: true,
          dataAsJson: {
            meta: [{
              name: "Blob Count",
              color: "#FFC300",
              stacking: "normal",
              xIndex: 0,
              yIndex: 1,
              suffix: null,
              prefix: null,
              url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
              pathToData: "data.ethereum_blob_count.daily.values",
              dashStyle: "solid" 
            },
            {
              name: "Target",
              color: "#19D9D6",
              stacking: "normal",
              xIndex: 0,
              yIndex: 1,
              suffix: null,
              prefix: null,
              url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
              pathToData: "data.ethereum_blob_target.daily.values",
              dashStyle: "Dash" 
            }
            ],
          },
          yAxisLine: [{
            xValue: 1755388800000,
            annotationPositionY: 50,
            annotationPositionX: 30,
            annotationText: "Target",
            lineStyle: "Dash",
            lineColor: "#19D9D6",
            textColor: "#19D9D6",
            textFontSize: "9px",
            backgroundColor: "#19D9D6",
            lineWidth: 1,
          }],
          height: 400,
          caption: "Blobs submitted per block contrasted with the target cadence.",
          seeMetricURL: "https://www.growthepie.com/data-availability"
        },
        {
          toggleLabel: "Type 4 Transactions",
          type: "column",
          title: "Transactions that trigger smart wallet upgrades and downgrades",
          subtitle: "The number of Set Code transactions on EVM chains (aka Type 4 transactions)",
          showXAsDate: true,
          dataAsJson: {
            meta: [{
              name: "Ethereum",
              color: "#94ABD3",
              stacking: "normal",
              xIndex: 1,
              yIndex: 0,
              suffix: null,
              prefix: null,
              tooltipDecimals: 0,
              url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
              pathToData: "data.type4_tx_count.ethereum.daily.values",
            },
            {
              name: "Base",
              color: "#2151F5",
              stacking: "normal",
              oppositeYAxis: true,
              type: "line",
              xIndex: 1,
              yIndex: 0,
              suffix: null,
              prefix: null,
              tooltipDecimals: 0,
              url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
              pathToData: "data.type4_tx_count.base.daily.values",
            },
            {
              name: "OP Mainnet",
              color: "#FE5468",
              stacking: "normal",
              xIndex: 1,
              yIndex: 0,
              suffix: null,
              prefix: null,
              tooltipDecimals: 0,
              url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
              pathToData: "data.type4_tx_count.optimism.daily.values",
            },
            {
              name: "Unichain",
              color: "#FF47BB",
              stacking: "normal",
              xIndex: 1,
              yIndex: 0,
              suffix: null,
              prefix: null,
              tooltipDecimals: 0,
              url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
              pathToData: "data.type4_tx_count.unichain.daily.values",
            },
            ],
          },
          height: 400,
          caption: "Compare Type 4 transaction activity across networks in one click.",
        },
        {
          toggleLabel: "Timeboost Revenue",
          type: "column",
          title: "Timeboost Revenue in ETH",
          subtitle: "The amount of money that Arbitrum DAO is making from Timeboost per day",
          showXAsDate: true,
          dataAsJson: {
            meta: [{
              name: "Ethereum",
              color: "#94ABD3",
              stacking: "normal",
              xIndex: 1,
              yIndex: 0,
              suffix: null,
              prefix: null,
              tooltipDecimals: 0,
              url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
              pathToData: "data.type4_tx_count.ethereum.daily.values",
            },
            {
              name: "Base",
              color: "#2151F5",
              stacking: "normal",
              oppositeYAxis: true,
              type: "line",
              xIndex: 1,
              yIndex: 0,
              suffix: null,
              prefix: null,
              tooltipDecimals: 0,
              url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
              pathToData: "data.type4_tx_count.base.daily.values",
            },
          ],
        },  
        },
        {
          toggleLabel: "Timeboost Revenue",
          type: "column",
          title: "Timeboost Revenue in ETH",
          subtitle: "The amount of money that Arbitrum DAO is making from Timeboost per day",
          showXAsDate: true,
          dataAsJson: {
            meta: [{
              name: "Ethereum",
              color: "#94ABD3",
              stacking: "normal",
              xIndex: 1,
              yIndex: 0,
              suffix: null,
              prefix: null,
              tooltipDecimals: 0,
              url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
              pathToData: "data.type4_tx_count.ethereum.daily.values",
            },
            {
              name: "Base",
              color: "#2151F5",
              stacking: "normal",
              oppositeYAxis: true,
              type: "line",
              xIndex: 1,
              yIndex: 0,
              suffix: null,
              prefix: null,
              tooltipDecimals: 0,
              url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
              pathToData: "data.type4_tx_count.base.daily.values",
            },
          ],
        },
      }
      ]
    }),
    "```",

    "## Dropdown Examples ",
    "With hardcoded options:",
    
   "```dropdown",
    JSON.stringify({
      label: "Select a Blockchain Network",
      placeholder: "Choose a network...",
      searchable: true,
      defaultValue: "arbitrum",
      options: [
        {
          value: "ethereum",
          label: "Ethereum Mainnet"
        },
        {
          value: "arbitrum",
          label: "Arbitrum One"
        },
        {
          value: "base",
          label: "Base"
        },
        {
          value: "optimism",
          label: "OP Mainnet"
        },
        {
          value: "polygon",
          label: "Polygon PoS"
        },
        {
          value: "blast",
          label: "Blast"
        },
        {
          value: "scroll",
          label: "Scroll"
        }
      ]
    }),
    "```",

    "With options loaded from JSON:",
    
   "```dropdown",
    JSON.stringify({
      label: "Select a Ticker",
      placeholder: "Choose a token...",
      searchable: true,
      readFromJSON: true,
      exclusive: true,
      jsonData: {
        url: "https://api.growthepie.xyz/v1/quick-bites/robinhood/dropdown.json",
        pathToOptions: "dropdown_values",
        valueField: "ticker",     // Use 'ticker' field as the option value
        labelField: "name_extended"        // Use 'name' field as the option label
        // Assumes API returns: { tokens: [{ symbol: "ETH", name: "Ethereum" }] }
      }
    }),
    "```",

    "## Live Metrics Block",
    "```live-metrics",
    JSON.stringify({
      metrics: [
        {
          label: "Ethereum",
          value: "100",
        }
      ]
    }),


    "## Table Example",
    "Here's an example of a sortable table showing L2 metrics:",
    "```table",
    JSON.stringify({
      content: "Comparison of Layer 2 networks by key metrics",
      readFromJSON: true,
      filterOnStateKey: {
        stateKey: "ticker",
        columnKey: "ticker"
      },
      columnDefinitions: {
        contract_address: {
          label: "Contract Address",
          type: "address",
          minWidth: 160,
          isNumeric: false,
          sortByValue: false,
          add_url: "https://arbiscan.io/address/${cellValue}"
        },
        ticker: {
          label: "Ticker",
          type: "string",
          minWidth: 80,
          maxWidth: 120,
          isNumeric: false,
          sortByValue: true
        },
        name: {
          label: "Name",
          type: "string",
          minWidth: 120,
          isNumeric: false,
          sortByValue: true
        },
        usd_outstanding: {
          label: "USD Outstanding",
          type: "number",
          minWidth: 150,
          isNumeric: true,
          sortByValue: true,
          units: {
            "usd": {
              decimals: 2,
              prefix: "$",
            },
          }
        },
        stocks_tokenized: {
          label: "Stocks Tokenized",
          type: "number",
          minWidth: 150,
          isNumeric: true,
          sortByValue: true,
          units: {
            "value": {
              decimals: 0,
            },
          }
        },
        usd_stock_price: {
          label: "USD Stock Price",
          type: "number",
          minWidth: 150,
          isNumeric: true,
          sortByValue: true,
          units: {
            "usd": {
              decimals: 2,
              prefix: "$",
            },
          }
        }
      },
      jsonData: {
        url: "https://api.growthepie.xyz/v1/quick-bites/robinhood/stock_table.json",
        pathToRowData: "data.stocks.rows",
        pathToColumnKeys: "data.stocks.columns",
      }
      
    }),
    "```",

    "## Table with Card View, Badges & Chain Columns",
    "This table demonstrates card view (resize to mobile), badges column, chain columns with icon/label options, expand, maxWidth, and auto-index. For badge overflow in desktop table view, set `maxVisibleBadges` on a badges column. If there are more badges than the limit, the table shows `maxVisibleBadges - 1` badges plus a `+ X more` pill, and hovering the pill reveals all badges. On mobile, setting `cardView.autoRowHeight: true` lets card rows grow to fit multi-line content (e.g. multiple endpoint badges) instead of forcing a fixed 20px row height.",
    "```table",
    JSON.stringify({
      readFromJSON: true,
      content: "Top agents by EIP-8004 activity — with responsive card view.",
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
          label: "Origin Chain",
          type: "chain",
          minWidth: 200,
          isNumeric: false,
          sortByValue: true,
          showLabel: true,
        },
        endpoints: {
          label: "Endpoints",
          type: "badges",
          minWidth: 140,
          maxVisibleBadges: 4,
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
        events: {
          label: "Events",
          type: "number",
          sourceKey: "feedback_count_all",
          minWidth: 80,
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
        "agent",
        "origin_key",
        "endpoints",
        "events"
      ],
      columnSortBy: "value",
      cardView: {
        titleColumn: "agent",
        imageColumn: "image",
        sections: [
          { columns: ["events"], labelPosition: "bottom" },
          { columns: ["origin_key"], labelPosition: "right", layout: "start" },
          { columns: ["endpoints"], labelPosition: "hidden" },
        ],
        autoRowHeight: true,
      },
    }),
    "```",

    "## Non-Scrollable Table with Card View",
    "This table uses `scrollable: false` to show all rows, and a card view with all metrics split across top/bottom.",
    "```table",
    JSON.stringify({
      readFromJSON: true,
      content: "Agent breakdown by chain — all rows visible.",
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
            value: { decimals: 0 },
          },
        },
        valid_registrations: {
          label: "Valid",
          type: "number",
          minWidth: 100,
          isNumeric: true,
          sortByValue: true,
          units: {
            value: { decimals: 0 },
          },
        },
        total_feedback: {
          label: "Feedback",
          type: "number",
          minWidth: 100,
          isNumeric: true,
          sortByValue: true,
          units: {
            value: { decimals: 0 },
          },
        },
        unique_owners: {
          label: "Owners",
          type: "number",
          minWidth: 100,
          isNumeric: true,
          sortByValue: true,
          units: {
            value: { decimals: 0 },
          },
        },
        agents_per_owner: {
          label: "Agents/Owner",
          type: "number",
          minWidth: 100,
          isNumeric: true,
          sortByValue: true,
          units: {
            value: { decimals: 2 },
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
        sections: [
          { columns: ["total_registered", "valid_registrations"], labelPosition: "bottom" },
          { columns: ["total_feedback", "unique_owners", "agents_per_owner"], labelPosition: "bottom" },
        ],
      },
    }),
    "```",

    "# Main Header",
    "Some Text. This is a normal text block. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Now there was a line break. I can also use **bold** text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    
    "## Subheader",
    "Some more text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",

    "## Callout Block",
    "> This is a very important message!",
    
    "## A list of items",
    "- Normal Text: Blaaaah",
    "- Bold Text: **Bla Bli Blub**",

    "## Dynamic Values in Text",
    "This next value is dynamic (taken from API endpoint): **{{timeboostTotalETH}} ETH**.",
    
    "## Embedded Chart Block",
    "Usage: When you want to embed a chart from growthepie.com",
    "```iframe",
    JSON.stringify({
      src: "https://www.growthepie.com/embed/fundamentals/daily-active-addresses?showUsd=true&theme=dark&timespan=90d&scale=absolute&interval=daily&showMainnet=false&chains=arbitrum%2Cbase%2Ccelo%2Cunichain&zoomed=false&startTimestamp=&endTimestamp=1745712000000",
      width: "100%",
      height: "500px",
      caption: "Daily active addresses comparison across Layer 2 solutions. Source: growthepie.com"
    }),
    "```",
    
    "## Line Chart with different line types",
    "Usage: When you want to compare 2-5 entities over time OR compare a value against target (use dashed line)",
    "General Chart features: Chart Title, Metric Url Link, Line Styles, Stacking, Show X as Date, Suffix/Prefix",
    
    "```chart",
    JSON.stringify({
      type: "line",
      title: "Submitted Blobs per Block",
      subtitle: "Compare the average #Blobs per block before and after the Pectra upgrade",
      showXAsDate: true,
      dataAsJson: {
        meta: [{
          name: "Blob Count",
          color: "#FFC300",
          stacking: "normal",
          xIndex: 0,
          yIndex: 1,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
          pathToData: "data.ethereum_blob_count.daily.values",
          dashStyle: "solid" 
        },
        {
          name: "Target",
          color: "#19D9D6",
          stacking: "normal",
          xIndex: 0,
          yIndex: 1,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
          pathToData: "data.ethereum_blob_target.daily.values",
          dashStyle: "Dash" 
        }
        ],
      },

      yAxisLine: [{
        xValue: 		1755388800000, //position on x-axis
        annotationPositionY: 50, //pixel offset
        annotationPositionX: 30, //pixel offset
        annotationText: "Target",
        lineStyle: "Dash", //Dash, Dot, Solid, DashDot, LongDash, LongDashDot
        lineColor: "#19D9D6",
        textColor: "#19D9D6",
        textFontSize: "9px",
        
        backgroundColor: "#19D9D6",

        lineWidth: 1,

      }],
      height: 400,
      caption: "Ethereum Blob Count per Block vs Target. Data updated daily.",
      seeMetricURL: "https://www.growthepie.com/data-availability"
    }),
    "```",

    "## Column Chart",
    "Usage: When you want to show the growth of 2-5 entities over time with limited timestamps (max 180) ",
    "```chart",
    JSON.stringify({
      type: "column",
      title: "Transactions that trigger smart wallet upgrades and downgrades",
      subtitle: "The number of Set Code transactions on EVM chains (aka Type 4 transactions)",
      showXAsDate: true,
      dataAsJson: {
        meta: [{
          name: "Ethereum",
          color: "#94ABD3",
          stacking: "normal",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          tooltipDecimals: 0,
          url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.ethereum.daily.values",
        },
        {
          name: "Base",
          color: "#2151F5",
          stacking: "normal",
          oppositeYAxis: true,
          type: "line",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          tooltipDecimals: 0,
          url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.base.daily.values",
        },
        {
          name: "OP Mainnet",
          color: "#FE5468",
          stacking: "normal",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          tooltipDecimals: 0,
          url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.optimism.daily.values",
        },
        {
          name: "Unichain",
          color: "#FF47BB",
          stacking: "normal",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          tooltipDecimals: 0,
          url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.unichain.daily.values",
        },
        ],
      },
      height: 400,
      caption: "The number of Set Code transactions on EVM chains (aka Type 4 transactions). Data updated daily.",
    }),
    "```",

    "## Area Chart",
    "Usage: When you want to show the growth of 2-5 entities over time with more timestamps (90 or more) ",
    "```chart",
    JSON.stringify({
      type: "area",
      title: "Daily Timeboost Revenue in ETH",
      subtitle: "The amount of money that Arbitrum DAO is making from Timeboost per day",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Timeboost Fees",
            color: "#19D9D6",
            stacking: "normal",
            xIndex: 1,
            yIndex: 0,
            suffix: null,
            prefix: 'Ξ',
            tooltipDecimals: 3,
            url: "https://api.growthepie.com/v1/quick-bites/arbitrum-timeboost.json",
            pathToData: "data.fees_paid_priority_eth.daily.values",
          },
          {
            name: "Network Fees",
            color: "#FFC300",
            stacking: "normal",
            xIndex: 1,
            yIndex: 0,
            suffix: 'ETH',
            prefix: null,
            tooltipDecimals: 3,
            url: "https://api.growthepie.com/v1/quick-bites/arbitrum-timeboost.json",
            pathToData: "data.fees_paid_base_eth.daily.values",
          }
        ],
      },
      height: 400,
      caption: "The amount of money that Arbitrum DAO is making from Timeboost per day. Data updated daily.",
    }),
    "```",

    "## Area Chart Percentage Mode",
    "Usage: when you want to shwocase the market share of 2-5 entities over time",
    "```chart",
    JSON.stringify({
      type: "area",
      title: "Daily Timeboost Revenue in ETH",
      subtitle: "The amount of money that Arbitrum DAO is making from Timeboost per day",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Timeboost Fees",
            color: "#19D9D6",
            stacking: "percent",
            xIndex: 1,
            yIndex: 0,
            suffix: ' ETH',
            prefix: null,
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/arbitrum-timeboost.json",
            pathToData: "data.fees_paid_priority_eth.daily.values",
          },
          {
            name: "Network Fees",
            color: "#FFC300",
            stacking: "percent",
            xIndex: 1,
            yIndex: 0,
            suffix: ' ETH',
            prefix: null,
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/arbitrum-timeboost.json",
            pathToData: "data.fees_paid_base_eth.daily.values",
          }
        ],
      },
      height: 400,
      caption: "The amount of money that Arbitrum DAO is making from Timeboost per day. Data updated daily.",
    }),
    "```",

    "## Pie Chart",
    "Usage: When you want to show the composition or market share of static/snapshot data across 3–8 categories. Use centerName to label the donut hole.",
    "```chart",
    JSON.stringify({
      type: "pie",
      title: "L2 Blob Usage Share",
      subtitle: "Breakdown of DA blob usage by rollup (snapshot)",
      centerName: "BLOB\nSHARE",
      height: 400,
      dataAsJson: {
        pieData: [
          { name: "Base", y: 38.4, color: "#2151F5" },
          { name: "Arbitrum", y: 22.1, color: "#FFC300" },
          { name: "OP Mainnet", y: 15.7, color: "#FE5468" },
          { name: "Scroll", y: 10.2, color: "#EADB6B" },
          { name: "zkSync Era", y: 8.3, color: "#8B5CF6" },
          { name: "Other", y: 5.3, color: "#5A6462" },
        ],
      },
      caption: "Approximate blob usage share across major L2s. Data is illustrative.",
    }),
    "```",

    "## Sample Image",
    "Here's an example of how to include an image in your quick bite:",

    "```image",
    JSON.stringify({
      src: "https://pbs.twimg.com/media/GFGqJLuWUAACKYj?format=jpg&name=4096x4096", // should allow link to our API
      alt: "Sample chart showing transaction volume over time",
      width: "800",
      height: "400",
      caption: "Transaction volume trends across major L2 networks. Source: growthepie.com",
    }),
    "```",

    "The improved developer experience has also attracted hundreds of new projects to the platform, creating a rich ecosystem of applications across DeFi, gaming, and social platforms."
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/placeholder.png",
  date: "2025-01-15",
  icon: "arbitrum-logo-monochrome",
  related: [],
  author: [{
    name: "Matthias Seidl",
    xUsername: "web3_data"
  }],
  topics: [{
    icon: "base-logo-monochrome",
    color: "#2151F5",
    name: "Base",
    url: "/chains/base"
  }],
  showInMenu: false,
  ethUsdSwitchEnabled: true
});

export default testBite;
