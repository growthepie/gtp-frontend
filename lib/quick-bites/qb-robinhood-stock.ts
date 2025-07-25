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
    "```table",
    JSON.stringify({
      content: "All stocks robinhood has tokenized on Arbitrum One so far.",
      readFromJSON: true,
      jsonData: {
        url: "https://api.growthepie.xyz/v1/quick-bites/robinhood_stock_table.json",
        pathToRowData: "data.stocks.rows",
        pathToColumnKeys: "data.stocks.columns",
        pathToTypes: "data.stocks.types"
      },
    }),
    "```"

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
  icon: "arbitrum-logo-monochrome"
};

export default robinhoodStock;