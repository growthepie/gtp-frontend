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
          minWidth: 100,
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
          minWidth: 100,
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
          minWidth: 100,
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
  showInMenu: false
});

export default testBite;
