import { QuickBiteData } from "@/lib/types/quickBites";
import { createQuickBite } from "@/lib/quick-bites/createQuickBite";

const txCostsVsActivity: QuickBiteData = createQuickBite({
  title: "Transaction Costs vs Activity",
  subtitle: "Exploring how transaction fees relate to chain activity and value capture across the ecosystem",
  shortTitle: "Tx Costs vs Activity",
  content: [
    "## Transaction Costs Across Chains",
    "Transaction fees are one of the most directly felt aspects of a blockchain for everyday users. Lower fees tend to attract more users and higher volumes — but the relationship is more nuanced than it first appears. High-fee chains can still command large user bases if they offer unique value, while cheap chains don't automatically generate activity.",
    "This quick bite plots the average weekly transaction fee (in USD) for the top 10 chains across multiple metrics to reveal how costs relate to activity, throughput, and value capture.",
    "- Chart data and top 10 chains update daily",
    "- Remove outliers in the legend and the trendline will update automatically",
    "```chart-toggle",
    `{
      "title": "How do transaction costs relate to chain activity and throughput?",
      "description": "Activity Metrics vs Transaction Costs",
      "layout": "segmented",
      "defaultIndex": 0,
      "charts": [
        {
          "toggleLabel": "Addresses",
          "type": "scatter",
          "title": "Avg Transaction Fee vs Active Addresses",
          "subtitle": "One marker per chain (Top 10 by active addresses)",
          "showXAsDate": false,
          "top10ByMetric": "active addresses",
          "scatterRatioBase": 0.0001,
          "showScatterRatio": false,
          "scatterTrendline": {
            "enabled": true,
            "label": "Trendline"
          },
          "data": {{txcost_top10_activeaddress_series}},
          "options": {
            "xAxis": {
              "title": {
                "text": "Avg Transaction Fee (USD)"
              }
            },
            "yAxis": [
              {
                "title": {
                  "text": "Weekly Active Addresses"
                }
              }
            ]
          },
          "height": 450,
          "caption": "Weekly average transaction fee (USD) vs weekly active addresses — top 10 chains by active addresses."
        },
        {
          "toggleLabel": "Volume",
          "type": "scatter",
          "title": "Avg Transaction Fee vs Transaction Count",
          "subtitle": "One marker per chain (Top 10 by transaction count)",
          "showXAsDate": false,
          "top10ByMetric": "transaction count",
          "scatterRatioBase": 0.0001,
          "showScatterRatio": false,
          "scatterTrendline": {
            "enabled": true,
            "label": "Trendline"
          },
          "data": {{txcost_top10_txcount_series}},
          "options": {
            "xAxis": {
              "title": {
                "text": "Avg Transaction Fee (USD)"
              }
            },
            "yAxis": [
              {
                "title": {
                  "text": "Transaction Count"
                }
              }
            ]
          },
          "height": 450,
          "caption": "Weekly average transaction fee (USD) vs weekly transaction count — top 10 chains by transaction count."
        },
        {
          "toggleLabel": "Complexity",
          "type": "scatter",
          "title": "Avg Transaction Fee vs Avg Throughput",
          "subtitle": "One marker per chain (Top 10 by weekly avg throughput)",
          "showXAsDate": false,
          "top10ByMetric": "throughput",
          "scatterRatioBase": 0.0001,
          "showScatterRatio": false,
          "scatterTrendline": {
            "enabled": true,
            "label": "Trendline"
          },
          "data": {{txcost_top10_throughput_series}},
          "options": {
            "xAxis": {
              "title": {
                "text": "Avg Transaction Fee (USD)"
              }
            },
            "yAxis": [
              {
                "title": {
                  "text": "Weekly Avg Throughput (gas/s)"
                }
              }
            ]
          },
          "height": 450,
          "caption": "Weekly average transaction fee (USD) vs weekly average throughput (gas/s) — top 10 chains by throughput."
        }
      ]
    }`,
    "```",
    "```chart-toggle",
    `{
      "title": "How do transaction costs relate to chain revenue and profitability?",
      "description": "Value Capture Metrics vs Transaction Costs",
      "layout": "segmented",
      "defaultIndex": 0,
      "charts": [
        {
          "toggleLabel": "Chain Revenue",
          "type": "scatter",
          "title": "Avg Transaction Fee vs Chain Revenue",
          "subtitle": "One marker per chain (Top 10 by chain revenue)",
          "showXAsDate": false,
          "top10ByMetric": "chain revenue",
          "scatterRatioBase": 0.0001,
          "showScatterRatio": false,
          "scatterTrendline": {
            "enabled": true,
            "label": "Trendline"
          },
          "data": {{txcost_top10_revenue_series}},
          "options": {
            "xAxis": {
              "title": {
                "text": "Avg Transaction Fee (USD)"
              }
            },
            "yAxis": [
              {
                "title": {
                  "text": "Chain Revenue"
                }
              }
            ]
          },
          "height": 450,
          "caption": "Weekly average transaction fee (USD) vs weekly chain revenue (USD) — top 10 chains by chain revenue."
        },
        {
          "toggleLabel": "Onchain Profit",
          "type": "scatter",
          "title": "Avg Transaction Fee vs Onchain Profit",
          "subtitle": "One marker per chain (Top 10 by onchain profit)",
          "showXAsDate": false,
          "top10ByMetric": "onchain profit",
          "scatterRatioBase": 0.0001,
          "showScatterRatio": false,
          "scatterTrendline": {
            "enabled": true,
            "label": "Trendline"
          },
          "data": {{txcost_top10_profit_series}},
          "options": {
            "xAxis": {
              "title": {
                "text": "Avg Transaction Fee (USD)"
              }
            },
            "yAxis": [
              {
                "title": {
                  "text": "Onchain Profit"
                }
              }
            ]
          },
          "height": 450,
          "caption": "Weekly average transaction fee (USD) vs weekly onchain profit (USD) — top 10 chains by onchain profit."
        },
        {
          "toggleLabel": "TVS",
          "type": "scatter",
          "title": "Avg Transaction Fee vs Total Value Secured",
          "subtitle": "One marker per chain (Top 10 by total value secured)",
          "showXAsDate": false,
          "top10ByMetric": "total value secured",
          "scatterRatioBase": 0.0001,
          "showScatterRatio": false,
          "scatterTrendline": {
            "enabled": true,
            "label": "Trendline"
          },
          "data": {{txcost_top10_tvs_series}},
          "options": {
            "xAxis": {
              "title": {
                "text": "Avg Transaction Fee (USD)"
              }
            },
            "yAxis": [
              {
                "title": {
                  "text": "Total Value Secured"
                }
              }
            ]
          },
          "height": 450,
          "caption": "Weekly average transaction fee (USD) vs total value secured (USD) — top 10 chains by total value secured."
        }
      ]
    }`,
    "```",
    "",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/placeholder.png",
  date: "2026-04-17",
  icon: "gtp-metrics-transactioncosts",
  related: ["/fundamentals/transaction-costs"],
  autoAddChartChainsToTopics: true,
  topics: [
    {
      icon: "gtp-metrics-transactioncosts",
      name: "Transaction Costs",
      url: "/fundamentals/transaction-costs",
      color: "#FE5468",
    },
  ],
  showInMenu: false,
});

export default txCostsVsActivity;
