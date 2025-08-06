// In your quick bite data file (e.g., lib/quick-bites/arbitrum-timeboost.ts)
import { QuickBiteData } from '@/lib/types/quickBites';

const robinhoodStock: QuickBiteData = {
  title: "Robinhood Tokenized Stock Tracker",
  subtitle: "Tracking the adoption of Robinhood's tokenized stock on Arbitrum One",
  content: [
    "# Phase 1 (of 3):",
    "The first step toward self-custodial stocks and the integration of stocks into DeFi (Decentralized Finance) began with Robinhood's announcement on June 30th. Robinhood announced the launch of tokenized stocks within the EU, with plans to expand to more countries soon. This is the first of three phases, initially launching on Arbitrum One. Robinhood also plans to launch its own Layer 2, built on the Arbitrum Orbit Stack. In this first phase, stocks are traded solely within the Robinhood app (offchain), and the stock tokens are custodied by Robinhood. We explore this phase and future phases in further detail at the end of this quick bite.",

  
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
          title: "Tokenized Shares Value (Total)",
          value: "${{robinhood_total_market_value_sum_usd}}",
          description: "since launch",
          icon: "gtp-realtime",
          info: "Total outstanding USD value of tokenized stock by Robinhood on Arbitrum One.",
        },
        {
          title: "Change in Tokenized Shares Value",
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
            name: "Tokenized Shares Total Value",
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

    "> Shares are 1 to 1 backed and currently only include publicly listed companies. Publicly listed shares are held by a US-licensed broker-dealer. We have excluded $1.5M of privately listed shares (Space X and OpenAI), which were given away to Robinhood users, these shares are not yet tradable and are awaiting further regulatory clarity. The tokens relating to these stocks have been burned (destroyed) and the shares relating to these stocks are held by a “Special Purpose Vehicle”. In phase 1 the amount of tokenized shares is updated daily so any change reflects a net change rather than individual trades.",

    "# Individual Stocks",
    "All stocks Robinhood has tokenized on Arbitrum One to date exsluding the privately listed shares mentioned above.",
    "```table",
    JSON.stringify({
      readFromJSON: true,
      jsonData: {
        url: "https://api.growthepie.xyz/v1/quick-bites/robinhood/stock_table.json",
        pathToRowData: "data.stocks.rows",
        pathToColumnKeys: "data.stocks.columns",
        pathToTypes: "data.stocks.types",
      },
      columnDefinitions: {
        contract_address: {
          label: "Contract Address",
          type: "address",
          minWidth: 160,
          isNumeric: false,
          sortByValue: false
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
      // filterOnStateKey: {
      //   stateKey: "selectedTicker",
      //   columnKey: "ticker",
      // }
    }),
    "```",

  "```dropdown",
    JSON.stringify({
      label: "Select a Ticker to filter the table and update the chart - HOOD displayed by default",
      placeholder: "Choose a token...",
      searchable: true,
      stateKey: "selectedTicker",
      defaultValue: "HOOD",
      allowEmpty: true,
      readFromJSON: true,
      jsonData: {
        url: "https://api.growthepie.xyz/v1/quick-bites/robinhood/dropdown.json",
        pathToOptions: "dropdown_values",
        valueField: "ticker",
        labelField: "name_extended"
      }
    }),
    "```",
    "```chart",
    JSON.stringify({
      type: "column",
      title: "Selected Stock: {{selectedTicker}}", // Now using mustache to dynamically set the title within the ChartBlock component
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
            name: "Price",
            color: "#ccff00",
            stacking: "normal",
            oppositeYAxis: false,
            type: "line",
            xIndex: 0,
            yIndex: 1,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/robinhood/stocks/{{selectedTicker}}.json", // here too
            pathToData: "data.daily.values",
          },
          {
            name: "Stock Outstanding",
            color: "#00c805",
            stacking: "normal",
            oppositeYAxis: true,
            xIndex: 0,
            yIndex: 2,
            suffix: null,
            prefix: null,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/robinhood/stocks/{{selectedTicker}}.json",  // here too
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
    "## Phase 2",
    "## Phase 3",
    '## Private listed stocks - "A special purpose vehicle"',
    "Saving these links for sources - https://www.youtube.com/watch?v=WNMaXVweaiY - https://www.youtube.com/watch?v=FBHmAq5lmZQ",
    
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/robinhood.png",
  og_image: "",
  date: "2025-07-25",
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
    icon: "arbitrum-logo-monochrome",
    color: "#1DF7EF",
    name: "Abritrum One",
    url: "/chains/arbitrum"
  },
  {
    icon: "gtp-metrics-economics",
    name: "Economics",
    url: "/economics"
  },
],
  icon: "arbitrum-logo-monochrome",
  showInMenu: false
};

console.log("robinhoodStock", robinhoodStock);

export default robinhoodStock;