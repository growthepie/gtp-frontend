// In your quick bite data file (e.g., lib/quick-bites/arbitrum-timeboost.ts)
import { QuickBiteData } from '@/lib/types/quickBites';

const robinhoodStock: QuickBiteData = {
  title: "Robinhood Tokenized Stock Tracker",
  subtitle: "Tracking the adoption of Robinhood's tokenized stock on Arbitrum One",
  content: [
    "# Robinhood Tokenized Stocks",
    "blablabla...",

    "```kpi-cards",JSON.stringify(
      [
        {
          title: "Number of Stocks Tokenized",
          value: "{{robinhood_stockCount}}",
          description: "since launch",
          icon: "gtp-realtime",
          info: "Total number of stocks Robinhood tokenized on Arbitrum One.",
        },
        {
          title: "Total Outstanding Tokenized Stock",
          value: "${{robinhood_total_market_value_sum_usd}}",
          description: "since launch",
          icon: "gtp-realtime",
          info: "Total outstanding USD value of tokenized stock by Robinhood on Arbitrum One.",
        },
        {
          title: "Change in Total Outstanding Tokenized Stock",
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
      title: "Total Value of Tokenized Stock",
      subtitle: "USD value of all tokenized stocks on Arbitrum One over time.",
      stacking: "normal",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Total Tokenized Stock",
            color: "#00C805",
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

    "## Stock Table",
    "```dropdown",
    JSON.stringify({
      label: "Select a Ticker",
      placeholder: "Choose a token...",
      searchable: true,
      stateKey: "selectedTicker",
      defaultValue: "AAPL",
      readFromJSON: true,
      jsonData: {
        url: "https://api.growthepie.xyz/v1/quick-bites/robinhood/dropdown.json",
        pathToOptions: "dropdown_values",
        valueField: "ticker",
        labelField: "name_extended"
      }
    }),
    "```",

    "```table",
    JSON.stringify({
      content: "All stocks robinhood has tokenized on Arbitrum One so far.",
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
      filterOnStateKey: {
        stateKey: "selectedTicker",
        columnKey: "ticker",
      }
    }),
    "```",

    "```chart",
    JSON.stringify({
      type: "line",
      title: "Selected Stock: HOOD",
      subtitle: "Outstanding shares & stock price.",
      stacking: "normal",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Price",
            color: "#00C805",
            xIndex: 0,
            yIndex: 1,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/robinhood/stocks/{{selectedTicker}}.json",
            pathToData: "data.daily.values",
          },
          {
            name: "Stocks Outstanding",
            color: "#00C805",
            xIndex: 0,
            yIndex: 2,
            suffix: null,
            prefix: '',
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
  topics: [{
    icon: "gtp-metrics-economics",
    name: "Economics",
    url: "/economics"
  }],
  icon: "arbitrum-logo-monochrome",
  showInMenu: false
};

console.log("robinhoodStock", robinhoodStock);

export default robinhoodStock;