// In your quick bite data file (e.g., lib/quick-bites/linea-token-burn.ts)
import { QuickBiteData } from '@/lib/types/quickBites';

const lineaTokenBurn: QuickBiteData = {
  title: "Linea Token Burn Tracker",
  subtitle: "Tracking Linea's token burn mechanism and network economics",
  shortTitle: "Linea Token Burn Tracker",
  content: [
    "# Introduction:",
    " Linea has introduced a dual-token burn mechanism that burns both ETH and LINEA by using all the profits the Linea chain generates after operating expenses. We will also be exploring the economic data Linea is publishing onchain." ,
    "- July 29th 2025: Linea announced its plans for a new dual token burn mechanism",
    "- September 10th 2025: Linea token generation event (TGE)",
    "- November 4th 2025: Dual token burn mechanism went live - backdated to September 11th 2025",
    "> How it works: 20% of operating profits burn ETH directly, reducing Ethereum's supply and supporting L1 value accrual. The remaining 80% buys and burns LINEA tokens, driving value to token holders. ([1])[https://docs.linea.build/technology/tokenomics#burning-mechanism]" ,


    "# Token Burn Activity",
    "```kpi-cards",JSON.stringify(
      [
        {
          title: "Total ETH Burned",
          value: "{{linea_totals_ethburnt_eth}}",
          description: "since 11th of Sep. 2025",
          icon: "gtp-realtime",
          info: "Total amount of ETH burned.",
        },
        {
          title: "Total LINEA Tokens Burned",
          value: "{{linea_totals_lineatokensburned_linea}}",
          description: "since 11th of Sep. 2025",
          icon: "gtp-realtime",
          info: "Total amount of LINEA tokens burned.",
        },
        {
          title: "Max LINEA Supply",
          value: "{{linea_max_supply}}",
          description: "fixed",
          icon: "gtp-metrics-fullydilutedvaluation",
          info: "Maximum supply of LINEA tokens set at genesis (72,009,990,000 LINEA)."
        }
      ]
    ),
    "```",

"```chart",
    JSON.stringify({
      type: "column",
      title: "Total ETH Burned",
      subtitle: "Total ETH burned and its USD value over time.",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "ETH Burned - USD",
            color: "#FE5468",
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
            name: "ETH Burned",
            color: "#94ABD3",
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

    "```chart",
    JSON.stringify({
      type: "column",
      title: "Total LINEA Token Burned",
      subtitle: "Total LINEA tokens burned and their USD value over time.",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "LINEA Burned",
            color: "#a9e9ff",
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
            name: "LINEA Burned - USD",
            color: "#FE5468",
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
      caption: "Total LINEA tokens burned (left axis) and their USD value (right axis).",
    }),
    "```",

    "# Linea Economics & Supply Projections",

    " Linea has begun publishing its operating costs onchain for full transparency. This gives us insight into the profits of running an L2 and also allows us to get a better understanding of its operating costs:",
    " Total amount burned = gross gas fee income − operating costs (L1 rent + offchain infrastructure).",

    "```kpi-cards",JSON.stringify(
      [
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
          info: "Total USD value costs includes L1 rent and infrastructure costs.",
        },
        {
          title: "Total USD Burned",
          value: "${{linea_total_usd_burnt}}",
          description: "since 11th of Sep. 2025",
          icon: "gtp-message",
          info: "Total USD value of ETH and LINEA tokens burned. Lags behind total profit due to delays in cost invoicing and burn processing.",
        }
      ]
    ),
    "```",

    "",

    "```kpi-cards",JSON.stringify(
      [
        {
          title: "Projected Annual Burn as % of Max Supply",
          value: "{{linea_projected_annual_burn_rate_percentage}}%",
          description: "",
          icon: "gtp-metrics-chains-percentage",
          info: "Projected annual burn rate as a percentage of the maximum LINEA token supply (72,009,990,000).",
        },
        {
          title: "Projected Annual LINEA Burn",
          value: "{{linea_projected_annual_burn_rate}}",
          description: "LINEA tokens per year",
          icon: "gtp-realtime",
          info: "Estimated annual LINEA token burn based on current daily burn rate since September 11th, 2025.",
        }
      ]
    ),
    "```",

    "> Note: Projected burn rates are calculated based on historical data since September 11th, 2025 and assume constant burn rates. Actual future burn rates may vary significantly based on network activity and economic conditions.",

    "> Note: \"Cost (Infra)\" is lagging behind as this datapoint requires onchain disclosure by the Linea team. Data typically appears within a 1-4 week.",

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
          },
          {
            name: "Cumulative Profits",
            color: "#A9E9FF",
            type: "line",
            oppositeYAxis: true,
            xIndex: 0,
            yIndex: 11,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/linea/profit_calculation.json",
            pathToData: "data.daily.values"
          }
        ],
      },
      height: 500,
      caption: "Network economics showing gas fee income and operating costs, broken down by L1 rent and infrastructure costs.",
    }),
    "```",    
    "> This page is a data tracker for informational and educational purposes only. It is not investment advice or a recommendation to buy or sell any security or token.",
  ],
  image: "/quick-bites/linea-burn.webp",
  og_image: "/quick-bites/linea-burn.webp",
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
  showInMenu: true
};

export default lineaTokenBurn;