import { QuickBiteData } from "@/lib/types/quickBites";
import { createQuickBite } from "@/lib/quick-bites/createQuickBite";

const averageActiveAddress: QuickBiteData = createQuickBite({
  title: "The Average Active Address",
  subtitle: "Tracking average active address activity across the ecosystem",
  shortTitle: "Avg Active Address",
  content: [
    "## Active Addresses",
    "Rightfully so, active addresses is a metric that often gets a lot of push back as it can be easily gamed by bots and sybil attackers - an active address != a unique user. The best way to get a more accurate understanding of a chain is to combine metrics and this quick bite does just that. We have taken the top 10 chains in multiple metrics and plotted them against weekly active addresses.",
    "- Chart data and top 10 chains update daily",
    "- Remove outliers in the legend and the trendline will update automatically",
    "```chart-toggle",
    `{
      "title": "How do active addresses impact fundamental metrics like activity and value secured?",
      "description": "Fundamental Metrics vs Active Addresses",
      "layout": "segmented",
      "defaultIndex": 0,
      "charts": [
        {
          "toggleLabel": "Volume",
          "type": "scatter",
          "title": "Weekly Active Addresses vs Transaction Count",
          "subtitle": "One marker per chain (Top 10 by transaction count)",
          "showXAsDate": false,
          "top10ByMetric": "transaction count",
          "scatterTrendline": {
            "enabled": true,
            "label": "Trendline"
          },
          "data": {{avg_active_address_top10_series}},
          "options": {
            "xAxis": {
              "title": {
                "text": "Active Addresses"
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
          "caption": "Weekly distinct active addreses vs weekly transaction count - top 10 chains by transaction count."
        },
        {
          "toggleLabel": "Complexity",
          "type": "scatter",
          "title": "Weekly Active Addresses vs Avg Throughput",
          "subtitle": "One marker per chain (Top 10 by weekly avg throughput)",
          "showXAsDate": false,
          "top10ByMetric": "throughput",
          "scatterTrendline": {
            "enabled": true,
            "label": "Trendline"
          },
          "data": {{avg_active_address_top10_throughput_series}},
          "options": {
            "xAxis": {
              "title": {
                "text": "Active Addresses"
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
          "caption": "Weekly distinct active addresses vs weekly average throughput (gas/s) - top 10 chains by weekly avg throughput."
        },
        {
          "toggleLabel": "Stablecoins",
          "type": "scatter",
          "title": "Weekly Active Addresses vs Stablecoin Market Cap",
          "subtitle": "One marker per chain (Top 10 chains by stablecoin market cap)",
          "showXAsDate": false,
          "top10ByMetric": "stablecoin market cap",
          "scatterTrendline": {
            "enabled": true,
            "label": "Trendline"
          },
          "data": {{avg_active_address_top10_stables_series}},
          "options": {
            "xAxis": {
              "title": {
                "text": "Active Addresses"
              }
            },
            "yAxis": [
              {
                "title": {
                  "text": "Stablecoin Market Cap"
                }
              }
            ]
          },
          "height": 450,
          "caption": "Weekly distinct active addresses vs stablecoin market cap (USD) - top 10 chains by stablecoin market cap."
        },
        {
          "toggleLabel": "TVS",
          "type": "scatter",
          "title": "Weekly Active Addresses vs Total Value Secured",
          "subtitle": "One marker per chain (Top 10 chains by total value secured)",
          "showXAsDate": false,
          "top10ByMetric": "total value secured",
          "scatterTrendline": {
            "enabled": true,
            "label": "Trendline"
          },
          "data": {{avg_active_address_top10_tvs_series}},
          "options": {
            "xAxis": {
              "title": {
                "text": "Active Addresses"
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
          "caption": "Weekly distinct active addresses vs total value secured (USD) - top 10 chains by total value secured."
        }
      ]
    }`,
    "```",
   "> At the time of writting this quick bite we do not currently track Ethereum Mainnet TVS",
    "```chart-toggle",
    `{
      "title": "How do active addresses impact value capture metrics like onchain profit, and rent paid to L1?",
      "description": "Value capture metrics vs active addresses",
      "layout": "segmented",
      "defaultIndex": 0,
      "charts": [
        {
          "toggleLabel": "Chain Revenue",
          "type": "scatter",
          "title": "Weekly Active Addresses vs Chain Revenue",
          "subtitle": "One marker per chain (Top 10 by chain revenue)",
          "showXAsDate": false,
          "top10ByMetric": "chain revenue",
          "scatterTrendline": {
            "enabled": true,
            "label": "Trendline"
          },
          "data": {{avg_active_address_top10_revenue_series}},
          "options": {
            "xAxis": {
              "title": {
                "text": "Active Addresses"
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
          "caption": "Weekly distinct active addresses vs weekly chain revenue (USD) - top 10 chains by chain revenue."
        },
        {
          "toggleLabel": "Onchain Profit",
          "type": "scatter",
          "title": "Weekly Active Addresses vs Onchain Profit",
          "subtitle": "One marker per chain (Top 10 by onchain profit)",
          "showXAsDate": false,
          "top10ByMetric": "onchain profit",
          "scatterTrendline": {
            "enabled": true,
            "label": "Trendline"
          },
          "data": {{avg_active_address_top10_profit_series}},
          "options": {
            "xAxis": {
              "title": {
                "text": "Active Addresses"
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
          "caption": "Weekly distinct active addresses vs weekly onchain profit (USD) - top 10 chains by onchain profit."
        },
        {
          "toggleLabel": "Rent Paid to L1",
          "type": "scatter",
          "title": "Weekly Active Addresses vs Rent Paid to L1",
          "subtitle": "One marker per chain (Top 10 by rent paid to L1)",
          "showXAsDate": false,
          "top10ByMetric": "rent paid to l1",
          "scatterTrendline": {
            "enabled": true,
            "label": "Trendline"
          },
          "data": {{avg_active_address_top10_rent_paid_series}},
          "options": {
            "xAxis": {
              "title": {
                "text": "Active Addresses"
              }
            },
            "yAxis": [
              {
                "title": {
                  "text": "Rent Paid to L1"
                }
              }
            ]
          },
          "height": 450,
          "caption": "Weekly distinct active addresses vs weekly rent paid to L1 (USD) - top 10 chains by rent paid to L1."
        }
      ]
    }`,
    "```",
    "",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/placeholder.png",
  date: "2026-04-01",
  icon: "gtp-metrics-activeaddresses",
  related: ["/fundamentals/daily-active-addresses"],
  autoAddChartChainsToTopics: true,
  topics: [
    {
      icon: "gtp-metrics-activeaddresses",
      name: "Active Addresses",
      url: "/fundamentals/daily-active-addresses",
      color: "#19D9D6",
    },
    {
      name: "Base Chain",
      url: "/chains/base",
    },
  ],
  showInMenu: false,
});

export default averageActiveAddress;
