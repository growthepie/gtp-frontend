import { QuickBiteData } from '@/lib/types/quickBites';
import fiatData from '../../public/dicts/fiat.json';

const CURRENCIES_MAP = Object.fromEntries(
  Object.entries(fiatData).map(([code, info]) => [code, { symbol: info.symbol, name: info.name, country: info.country}])
);

const Stablecoin: QuickBiteData = {
  title: "Stablecoin Breakdown",
  shortTitle: "Stablecoins",
  subtitle: "Analyzing the composition and trends of stablecoins across different chains.",
  content: [
    "# Introduction:",
    "Tracking stablecoin composition on to show how the mix evolves over time.",
    "",
    "```dropdown",
    JSON.stringify({
      label: "Select a Chain",
      placeholder: "Choose a chain...",
      searchable: true,
      stateKey: "selectedChain",
      defaultValue: "arbitrum",
      allowEmpty: false,
      readFromJSON: true,
      jsonData: {
        url: "https://api.growthepie.com/v1/quick-bites/stablecoins/dropdown.json",
        pathToOptions: "dropdown_values",
        valueField: "origin_key",
        labelField: "name"
      }
    }),
    "```",
    "```chart",
    JSON.stringify({
      type: "area",
      title: "Stablecoin Breakdown",
      subtitle: "Stacked circulating supply of top stablecoins.",
      showXAsDate: true,
      showZeroTooltip: false,
      showTotalTooltip: true,
      dataAsJson: {
        meta: [
          {
            name: "",
            nameFromPath: "data.timeseries.types",
            color: "#94ABD3",
            stacking: "normal",
            xIndex: 0,
            yIndex: 1,
            tooltipDecimals: 2,
            suffix: null,
            prefix: '$',
            url: "https://api.growthepie.com/v1/quick-bites/stablecoins/timeseries/top_{{selectedChain}}.json",
            pathToData: "data.timeseries.values",
          },
          {
            name: "",
            nameFromPath: "data.timeseries.types",
            color: "#2151F5",
            stacking: "normal",
            xIndex: 0,
            yIndex: 2,
            tooltipDecimals: 2,
            suffix: null,
            prefix: '$',
            url: "https://api.growthepie.com/v1/quick-bites/stablecoins/timeseries/top_{{selectedChain}}.json",
            pathToData: "data.timeseries.values",
          },
          {
            name: "",
            nameFromPath: "data.timeseries.types",
            color: "#FFC300",
            stacking: "normal",
            xIndex: 0,
            yIndex: 3,
            tooltipDecimals: 2,
            suffix: null,
            prefix: '$',
            url: "https://api.growthepie.com/v1/quick-bites/stablecoins/timeseries/top_{{selectedChain}}.json",
            pathToData: "data.timeseries.values",
          },
          {
            name: "",
            nameFromPath: "data.timeseries.types",
            color: "#FE5468",
            stacking: "normal",
            xIndex: 0,
            yIndex: 4,
            tooltipDecimals: 2,
            suffix: null,
            prefix: '$',
            url: "https://api.growthepie.com/v1/quick-bites/stablecoins/timeseries/top_{{selectedChain}}.json",
            pathToData: "data.timeseries.values",
          },
          {
            name: "",
            nameFromPath: "data.timeseries.types",
            color: "#9e6067",
            stacking: "normal",
            xIndex: 0,
            yIndex: 5,
            tooltipDecimals: 2,
            suffix: null,
            prefix: '$',
            url: "https://api.growthepie.com/v1/quick-bites/stablecoins/timeseries/top_{{selectedChain}}.json",
            pathToData: "data.timeseries.values",
          },
          {
            name: "",
            nameFromPath: "data.timeseries.types",
            color: "#19D9D6",
            stacking: "normal",
            xIndex: 0,
            yIndex: 6,
            tooltipDecimals: 2,
            suffix: null,
            prefix: '$',
            url: "https://api.growthepie.com/v1/quick-bites/stablecoins/timeseries/top_{{selectedChain}}.json",
            pathToData: "data.timeseries.values",
          },
          {
            name: "",
            nameFromPath: "data.timeseries.types",
            color: "#CDD8D3",
            stacking: "normal",
            xIndex: 0,
            yIndex: 7,
            tooltipDecimals: 2,
            suffix: null,
            prefix: '$',
            url: "https://api.growthepie.com/v1/quick-bites/stablecoins/timeseries/top_{{selectedChain}}.json",
            pathToData: "data.timeseries.values",
          },
        ],
      },
      height: 450,
      caption: "Stacked supply of the top stablecoins on Arbitrum.",
    }),
    "```",
    "## Stablecoin Breakdown Table",
    "```table",
    JSON.stringify({
      readFromJSON: true,
      jsonData: {
        url: "https://api.growthepie.com/v1/quick-bites/stablecoins/tables/{{selectedChain}}.json",
        pathToRowData: "data.stables_per_chain.rows",
        pathToColumnKeys: "data.stables_per_chain.columns",
        pathToTypes: "data.stables_per_chain.types",
      },
      columnDefinitions: {
        logo: {
          label: "",
          type: "image",
          minWidth: 26,
          isNumeric: false,
          sortByValue: false
        },
        name: {
          label: "Name",
          type: "string",
          minWidth: 160,
          isNumeric: false,
          sortByValue: true
        },
        symbol: {
          label: "Symbol",
          type: "string",
          minWidth: 90,
          isNumeric: false,
          sortByValue: true,
          chip: true,
        },
        value: {
          label: "Supply",
          type: "number",
          minWidth: 120,
          isNumeric: true,
          sortByValue: true,
          units: {
            "value": {
              decimals: 2,
            },
          }
        },
        value_usd: {
          label: "Value (USD)",
          type: "number",
          minWidth: 140,
          isNumeric: true,
          sortByValue: true,
          units: {
            "usd": {
              decimals: 2,
              prefix: "$",
            },
          },

        },
        fiat: {
          label: "Fiat",
          type: "string",
          minWidth: 180,
          isNumeric: false,
          sortByValue: true,
          currencyMap: CURRENCIES_MAP,
        },
        metric_key: {
          label: "Type",
          type: "string",
          minWidth: 100,
          isNumeric: false,
          sortByValue: true,
          iconMap: {
            supply_bridged: { icon: "gtp-crosschain", label: "Bridged" },
            supply_direct: { icon: "gtp-tokentransfers", label: "Direct" },
            locked_supply: { icon: "gtp-lock", label: "Locked" },
          }
        },
        origin_key: {
          label: "Bridged\nFrom/To",
          type: "chain",
          minWidth: 160,
          isNumeric: false,
          sortByValue: true,
          showLabel: true
        },
      },
      columnOrder: ["logo", "name", "symbol", "fiat", "value", "value_usd", "metric_key", "origin_key"],
      rowBar: {
        valueColumn: "value_usd",
        color: "linear-gradient(-145deg, rgb(254, 84, 104) 0%, rgb(255, 223, 39) 100%)",
        // color: "rgb(var(--text-primary))",
      },
    }),
    "```",

    "> This page is a data tracker for informational and educational purposes only. It is not investment advice. Data may be delayed or inaccurate. Do your own research.",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/fusaka.png",
  og_image: "",
  date: "2026-01-23",
  related: [],
  author: [{
    name: "Lorenz Lehmann",
    xUsername: "LehmannLorenz",
  }],
  topics: [
    {
      icon: "ethereum-logo-monochrome",
      color: "#94ABD3",
      name: "Ethereum Mainnet",
      url: "/chains/ethereum"
    },
    {
      icon: "gtp-metrics-economics",
      name: "Economics",
      url: "/economics"
    },
    {
      icon: "gtp-data-availability",
      name: "Data Availability",
      url: "/data-availability"
    },
  ],
  icon: "",
  showInMenu: false
};

export default Stablecoin;
