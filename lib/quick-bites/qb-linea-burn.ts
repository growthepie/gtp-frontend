// In your quick bite data file (e.g., lib/quick-bites/linea-token-burn.ts)
import { QuickBiteData } from '@/lib/types/quickBites';

const lineaTokenBurn: QuickBiteData = {
  title: "Linea Token Burn Tracker",
  subtitle: "Tracking Linea's token burn mechanism and network economics",
  content: [
    "# Linea Token Burn Overview:",
    "Linea burns ETH on Ethereum mainnet and bridges LINEA tokens as part of its economic model. This dashboard tracks the burn activity, operating costs, and profit metrics.",

    "```kpi-cards",JSON.stringify(
      [
        {
          title: "Total LINEA Tokens Burned",
          value: "{{linea_totals_lineatokensburned_linea}}",
          description: "since 11th of Sep. 2025",
          icon: "gtp-realtime",
          info: "Total amount of LINEA tokens burned.",
        },
        {
          title: "Total ETH Burned",
          value: "{{linea_totals_ethburnt_eth}}",
          description: "since 11th of Sep. 2025",
          icon: "gtp-realtime",
          info: "Total amount of ETH burned.",
        },
        {
          title: "Total Revenue",
          value: "${{linea_totals_gas_fee_income_usd}}",
          description: "since 11th of Sep. 2025",
          icon: "gtp-metrics-onchainprofit",
          info: "Total gas fee income in USD.",
        },
        {
          title: "Total Operating Cost",
          value: "${{linea_totals_operating_costs_usd}}",
          description: "since 11th of Sep. 2025",
          icon: "gtp-metrics-stablecoinmarketcap",
          info: "Total USD value of ETH burned (at time of burn).",
        },
        {
          title: "Total USD Burnt",
          value: "${{linea_total_usd_burnt}}",
          description: "since 11th of Sep. 2025",
          icon: "gtp-message",
          info: "Total USD value of tokens burned. Lags behind total profit due to delay in burn processing.",
        },
      ]
    ),
    "```",

    "# Network Economics Overview",
    "```chart",
    JSON.stringify({
      title: "Gas Fee Income vs Operating Costs",
      subtitle: "Daily gas fee income, operating costs breakdown, and amount available for burn (in USD).",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Gas Fee Income",
            color: "#00c805",
            type: "column",
            stacking: "normal",
            xIndex: 0,
            yIndex: 6,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/linea/profit_calculation.json",
            pathToData: "data.daily.values",
            makeNegative: false
          },
          {
            name: "Costs (L1 rent)",
            color: "#ff9999",
            type: "column",
            stacking: "normal",
            xIndex: 0,
            yIndex: 8,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/linea/profit_calculation.json",
            pathToData: "data.daily.values",
            makeNegative: true
          },
          {
            name: "Costs (Infra)",
            color: "#ffcccc",
            type: "column",
            stacking: "normal",
            xIndex: 0,
            yIndex: 9,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/linea/profit_calculation.json",
            pathToData: "data.daily.values",
            makeNegative: true
          }
        ],
      },
      height: 400,
      caption: "Network economics showing gas fee income and operating costs, broken down by L1 rent and infrastructure costs.",
    }),
    "```",

    "# Token Burn Activity",
    "```kpi-cards",JSON.stringify(
      [
        {
          title: "Max LINEA Supply",
          value: "{{linea_max_supply}}",
          description: "fixed",
          icon: "gtp-metrics-fullydilutedvaluation",
          info: "Maximum supply of LINEA tokens set at genesis (72,009,990,000 LINEA).",
        },
        {
          title: "Projected Annual LINEA Burn",
          value: "{{linea_projected_annual_burn_rate}}",
          description: "LINEA tokens per year",
          icon: "gtp-realtime",
          info: "Estimated annual LINEA token burn based on current daily burn rate since September 11th, 2025.",
        },
        {
          title: "Annual Burn as % of Max Supply",
          value: "{{linea_projected_annual_burn_rate_percentage}}%",
          description: "",
          icon: "gtp-metrics-chains-percentage",
          info: "Projected annual burn rate as a percentage of the maximum LINEA token supply (72,009,990,000).",
        },
      ]
    ),
    "```",

    "> Note: Projected burn rates are calculated based on historical data since September 11th, 2025, and assume constant burn rates. Actual future burn rates may vary significantly based on network activity and economic conditions.",

    "```chart",
    JSON.stringify({
      type: "column",
      title: "LINEA Token Burns",
      subtitle: "Total LINEA tokens burnt and their USD value over time.",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Total LINEA Burnt",
            color: "#62DEFE",
            type: "line",
            oppositeYAxis: false,
            xIndex: 0,
            yIndex: 5,
            suffix: ' LINEA',
            prefix: null,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/linea/burn.json",
            pathToData: "data.daily.values",
          },
          {
            name: "Total LINEA Burnt",
            color: "#62dffea7",
            type: "line",
            oppositeYAxis: true,
            xIndex: 0,
            yIndex: 7,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/linea/burn.json",
            pathToData: "data.daily.values",
          }
        ],
      },
      height: 400,
      caption: "Total LINEA tokens burnt (left axis) and their USD value (right axis).",
    }),
    "```",

    "```chart",
    JSON.stringify({
      type: "column",
      title: "ETH Burns",
      subtitle: "Total ETH burned and its USD value over time.",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Total ETH Burned",
            color: "#627deab9",
            type: "line",
            oppositeYAxis: true,
            xIndex: 0,
            yIndex: 8,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/linea/burn.json",
            pathToData: "data.daily.values",
          },
          {
            name: "Total ETH Burned",
            color: "#627eea",
            type: "line",
            oppositeYAxis: false,
            xIndex: 0,
            yIndex: 6,
            suffix: ' ETH',
            prefix: null,
            tooltipDecimals: 3,
            url: "https://api.growthepie.com/v1/quick-bites/linea/burn.json",
            pathToData: "data.daily.values",
          }
        ],
      },
      height: 400,
      caption: "Total ETH burned (left axis) and its USD value (right axis).",
    }),
    "```",
    
    "> This page is a data tracker for informational and educational purposes only. It is not investment advice or a recommendation to buy or sell any security or token.",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/linea.png",
  og_image: "",
  date: "2025-11-13",
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
      icon: "gtp-metrics-economics",
      name: "Economics",
      url: "/economics"
    },
    {
      name: "Linea",
      url: "/chains/linea"
    },
    {
      icon: "gtp-categories",
      name: "Token Burns",
      url: "",
    },
  ],
  icon: "linea-logo-monochrome",
  showInMenu: false
};

export default lineaTokenBurn;