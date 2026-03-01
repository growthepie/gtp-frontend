// In your quick bite data file (e.g., lib/quick-bites/arbitrum-timeboost.ts)
import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

const robinhoodStock: QuickBiteData = createQuickBite({
  title: "Robinhood Tokenized Stock Tracker",
  subtitle: "Tracking the adoption of Robinhood's tokenized stocks on Arbitrum One",
  shortTitle: "Robinhood Stocks",
  content: [
    "# Phase 1 (of 3):",
    "Robinhood's first step toward self-custodial stocks and the integration of stocks into DeFi (Decentralized Finance) began with their “To Catch A Token” announcement on June 30th ([1])[https://www.youtube.com/watch?v=FBHmAq5lmZQ]. Phase 1 includes the launch of non-custodial tokenized stocks within the EU, with plans to expand to further countries soon. On launch day, Robinhood began with 204 stocks, each has a unique token which is 1 to 1 backed by the shares held in each stock. When a user buys or sells a share within the Robinhood app the supply of the corresponding token changes to reflect this (buying = token minting and selling = token burning). This is the first of three phases, initially launching on Arbitrum One. Robinhood also plans to launch its own Layer 2, built on the Arbitrum Orbit Stack. We explore this phase and future phases in further detail at the end of this quick bite. ",
    "> Publicly listed shares are held by a US-licensed broker-dealer, currently the amount of tokenized shares seems to update daily, meaning changes in token supply reflect a net change rather than individual trades.. We have excluded $1.5M of privately listed shares (Space X and OpenAI), which were given away to Robinhood users, these shares are not yet tradable and are awaiting further regulatory clarity. The tokens relating to these private stocks have been burned (destroyed) while the shares are said to be held by a “Special Purpose Vehicle” ([2])[https://www.youtube.com/watch?v=yhFN6LcV6PQ].",
    
    "# Robinhood Tokenized Stocks Metrics:",

    "```kpi-cards",JSON.stringify(
      [
        {
          title: "Stocks Tokenized",
          value: "{{robinhood_stockCount}}",
          description: "since launch",
          icon: "gtp-realtime",
          info: "Total number of stocks Robinhood tokenized on Arbitrum One.",
        },
        {
          title: "Tokenized Value (Total)",
          value: "${{robinhood_total_market_value_sum_usd}}",
          description: "since launch",
          icon: "gtp-realtime",
          info: "Total outstanding USD value of tokenized stock by Robinhood on Arbitrum One.",
        },
        {
          title: "Change in Tokenized Value",
          value: "{{robinhood_perc_change_market_value_usd_7d}}%",
          description: "change over the last 7 days",
          icon: "gtp-realtime",
          info: "Percentage change in total outstanding USD value of tokenized stock by Robinhood on Arbitrum One over the last 7 days.",
        },
      ]
    ),
    "```",

    "```chart",
    JSON.stringify({
      type: "column",
      title: "Total Value of Tokenized Shares",
      subtitle: "USD value of all tokenized stocks on Arbitrum One over time.",
      stacking: "normal",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Tokenized Value",
            color: "#ccff00",
            xIndex: 1,
            yIndex: 0,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/robinhood/totals.json",
            pathToData: "data.total_market_value_sum.daily.values",
          }
        ],
      },
      height: 400,
      caption: "Outstanding tokenized stock USD value by Robinhood on Arbitrum One.",
    }),
    "```",

    "# Overview of All Tokenized Stocks",
    "All the stocks Robinhood has tokenized on Arbitrum One to date excluding the privately listed shares (mentioned above) which have been burned.",
    "```table",
    JSON.stringify({
      readFromJSON: true, 
      jsonData: {
        url: "https://api.growthepie.com/v1/quick-bites/robinhood/stock_table.json",
        pathToRowData: "data.stocks.rows",
        pathToColumnKeys: "data.stocks.columns",
        pathToTypes: "data.stocks.types",
      },
      columnDefinitions: {
        ticker: {
          label: "Ticker",
          type: "string",
          minWidth: 50,
          isNumeric: false,
          sortByValue: true,
          copyable: false,
          add_url: "https://finance.yahoo.com/quote/${cellValue}"
        },
        name: {
          label: "Name",
          type: "string",
          minWidth: 150,
          isNumeric: false,
          sortByValue: true
        },
        contract_address: {
          label: "Contract Address",
          type: "address",
          minWidth: 160,
          isNumeric: false,
          sortByValue: false,
          copyable: true,
          add_url: "https://arbiscan.io/address/${cellValue}"
        },
        tokenization_date: {
          label: "Tokenized Since",
          type: "date",
          dateFormat: "medium",
          showTimeAgo: true,
          minWidth: 140,
          isNumeric: false,
          sortByValue: true,
        },
        usd_stock_price: {
          label: "Stock Price",
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
          label: "Shares Tokenized",
          type: "number",
          minWidth: 80,
          isNumeric: true,
          sortByValue: true,
          units: {
            "value": {
              decimals: 0,
            },
          }
        },
        stocks_tokenized_7d_change_pct: {
          label: "Shares 7d Change",
          type: "number",
          minWidth: 80,
          isNumeric: true,
          sortByValue: true,
          units: {
            "value": {
              decimals: 1,
              suffix: "%",
            },
          }
        },
        usd_outstanding: {
          label: "Tokenized Value",
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
      },
      columnOrder: ["ticker", "name", "contract_address", "tokenization_date", "usd_stock_price", "stocks_tokenized", "stocks_tokenized_7d_change_pct", "usd_outstanding"],
    }),
    "```",

    "# Individual Stock Chart",

    "```dropdown",
    JSON.stringify({
      label: "Select a Ticker to update the chart - HOOD displayed by default",
      placeholder: "Choose a Ticker...",
      searchable: true,
      stateKey: "selectedTicker",
      defaultValue: "HOOD",
      allowEmpty: true,
      readFromJSON: true,
      jsonData: {
        url: "https://api.growthepie.com/v1/quick-bites/robinhood/dropdown.json",
        pathToOptions: "dropdown_values",
        valueField: "ticker",
        labelField: "name_extended"
      }
    }),
    "```",
    "```chart",
    JSON.stringify({
      type: "column",
      title: "Tokenized Stock: {{selectedTicker}}", // Now using mustache to dynamically set the title within the ChartBlock component
      subtitle: "Outstanding shares & stock price.",
      showXAsDate: true,
      filterOnStateKey: {
        stateKey: "selectedTicker",
        columnKey: "ticker",
      },
      disableTooltipSort: true,
      dataAsJson: {
        meta: [
          {
            name: "Share Price",
            color: "#ccff00",
            stacking: "normal",
            oppositeYAxis: false,
            type: "line",
            xIndex: 0,
            yIndex: 1,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/robinhood/stocks/{{selectedTicker}}.json",
            pathToData: "data.daily.values",
          },
          {
            name: "Shares Tokenized",
            color: "#00c805",
            stacking: "normal",
            oppositeYAxis: true,
            xIndex: 0,
            yIndex: 2,
            suffix: null,
            prefix: null,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/robinhood/stocks/{{selectedTicker}}.json", 
            pathToData: "data.daily.values",
          }
        ],
      },
      height: 400,
      caption: "Outstanding shares and stock price over time.",
    }),
    "```",
  
    "# To Catch A Token - Robinhood's presentation",
    "## Phase 1 - Continued",
    "Vlad Tenev (Robinhood CEO) outlines the first phase of the tokenization process live in Cannes, France ([1])[https://www.youtube.com/watch?v=FBHmAq5lmZQ]. In this example, we can see a user buying an Apple share → Which is received by Robinhood’s backend → Instructions are sent to a US Broker, which buys and custodies the share from a TradFi market → This then gets sent to Robinhood's “Tokenization Engine” → Once the token has been minted Robinhoods backend logs this and the user can see that they have bought a share. This is live and tradable 24 hours and 5 days a week",
    
    "```image",
    JSON.stringify({
      src: "https://api.growthepie.com/v1/quick-bites/robinhood-stock-p1.png", // should allow link to our API
      alt: "Phase 1 by Vlad Tenev",
      width: "1344",
      height: "644",
      caption: "Phase 1 - To Catch A Token - Vlad Tenev ([1])[https://www.youtube.com/watch?v=FBHmAq5lmZQ]",
    }),
    "```",
    "> Currently, the amount of tokenized shares seems to update daily, meaning changes in token supply reflect a net change rather than individual trades. When this changes we will explore tracking trade volume",

    "## Phase 2",
    "In the “next few months”, Robinhood hopes to launch its second phase. Robinhood will use Bitstamp to enable trading of the tokenized stocks during weekends, meaning stocks can finally be traded 24/7 within the Robinhood app.",

    "```image",
    JSON.stringify({
      src: "https://api.growthepie.com/v1/quick-bites/robinhood-stock-p2.png", // should allow link to our API
      alt: "Phase 2 by Vlad Tenev",
      width: "1344",
      height: "644",
      caption: "Phase 2 - To Catch A Token - Vlad Tenev ([1])[https://www.youtube.com/watch?v=FBHmAq5lmZQ]",
    }),
    "```",

    "## Phase 3",
    "Also “a few months away”, Robinhood hopes to release its most ambitious phase. This phase allows users to withdraw their tokenized shares directly into their wallet. From there, users can self-custody these assets and use them to interact with DeFi.",  
    "```image",
    JSON.stringify({
      src: "https://api.growthepie.com/v1/quick-bites/robinhood-stock-p3.PNG", // should allow link to our API
      alt: "Phase 3 by Vlad Tenev",
      width: "1344",
      height: "644",
      caption: "Phase 3 - To Catch A Token - Vlad Tenev ([1])[https://www.youtube.com/watch?v=FBHmAq5lmZQ]",
    }),
    "```",
    "> This page is a data tracker for informational and educational purposes only. It is not investment advice or a recommendation to buy or sell any security or token. It does not consider your objectives, financial situation, or needs. Data may be incomplete, delayed, or inaccurate. Do your own research.",
    
  ],
  image: "/quick-bites/robinhood-stock.webp",
  og_image: "/quick-bites/robinhood-stock.webp",
  date: "2025-08-11",
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
    icon: "gtp-categories",
    name: "Real World Use-Case",
    url: "",
   },
    {
    name: "Arbitrum One",
    url: "/chains/arbitrum"
  },
  {
    icon: "gtp-metrics-economics",
    name: "Economics",
    url: "/economics"
  },
],
  icon: "arbitrum-logo-monochrome"
});

export default robinhoodStock;
