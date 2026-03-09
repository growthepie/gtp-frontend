import { QuickBiteData } from '@/lib/types/quickBites';
import fiatData from '../../public/dicts/fiat.json';

const CURRENCIES_MAP = Object.fromEntries(
  Object.entries(fiatData).map(([code, info]) => [code, { symbol: info.symbol, name: info.name, country: info.country}])
);

const StablecoinChain: QuickBiteData = {
  title: "Stablecoin Breakdown by Chain",
  shortTitle: "Stablecoins",
  subtitle: "Analyzing the composition and trends of stablecoins across different chains.",
  content: [
    
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
        url: "https://api.growthepie.com/v1/quick-bites/stablecoins/dropdown-chains.json",
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
        dynamicSeries: {
          url: "https://api.growthepie.com/v1/quick-bites/stablecoins/chains/top_{{selectedChain}}.json",
          pathToData: "data.timeseries.values",
          ystartIndex: 1,
          names: "data.symbols",
          colors: "data.colors",
          stacking: "normal",
          prefix: '$',
          xIndex: 0,
          tooltipDecimals: 2
        },
      },
      height: 500,
      caption: "Stacked area chart showing the circulating supply of top stablecoins on the selected chain. Data is updated daily.",
    }),
    "```",

    "```table",
    JSON.stringify({
      readFromJSON: true,
      jsonData: {
        url: "https://api.growthepie.com/v1/quick-bites/stablecoins/chains/table_{{selectedChain}}.json",
        pathToRowData: "data.table.rows",
        pathToColumnKeys: "data.table.columns",
      },
      columnDefinitions: {
        logo: {
          label: "",
          type: "image",
          minWidth: 26,
          isNumeric: false,
          sortByValue: false,
        },
        symbol: {
          label: "Symbol",
          type: "string",
          expand: true,
          minWidth: 100,
          isNumeric: false,
          sortByValue: true,
          chip: true,
        },
        owner_project_display_name: {
          label: "Company",
          type: "string",
          minWidth: 200,
          isNumeric: false,
          sortByValue: true,
          add_url: "/applications/${cellValue}",
          linkSourceKey: "owner_project",
        },
        fiat: {
          label: "Fiat",
          type: "string",
          minWidth: 100,
          isNumeric: false,
          sortByValue: true,
          currencyMap: CURRENCIES_MAP,
        },
        value: {
          label: "Supply",
          type: "number",
          minWidth: 140,
          isNumeric: true,
          sortByValue: true,
          units: {
            value: {
              decimals: 0,
            },
          },
        },
        value_usd: {
          label: "Value (USD)",
          type: "number",
          minWidth: 140,
          isNumeric: true,
          sortByValue: true,
          units: {
            usd: {
              decimals: 0,
              prefix: "$",
            },
          },
        },
        "30d_supply_change": {
          label: "30d Change",
          type: "number",
          minWidth: 110,
          isNumeric: true,
          sortByValue: true,
          colorBySign: true,
          units: {
            value: {
              decimals: 2,
              suffix: "%",
            },
          },
        },
        "365d_supply_change": {
          label: "365d Change",
          type: "number",
          minWidth: 110,
          isNumeric: true,
          sortByValue: true,
          colorBySign: true,
          units: {
            value: {
              decimals: 2,
              suffix: "%",
            },
          },
        },
      },
      columnOrder: ["logo", "symbol", "owner_project_display_name", "fiat", "30d_supply_change", "365d_supply_change", "value", "value_usd"],
      columnSortBy: "value",
      rowBar: {
        valueColumn: "value_usd",
        color: "linear-gradient(-145deg, rgb(254, 84, 104) 0%, rgb(255, 223, 39) 100%)",
      },
      cardView: {
        titleColumn: "symbol",
        imageColumn: "logo",
        sections: [
          { columns: ["value_usd", "value"], labelPosition: "bottom" },
          { columns: ["30d_supply_change", "365d_supply_change"], labelPosition: "bottom" },
          { columns: ["owner_project_display_name", "fiat"], labelPosition: "right", layout: "start" },
        ],
        autoRowHeight: true,
      },
    }),
    "```",

    "> We do not double count: Bridged stablecoins are counted on the receiving chain. For example, USDC.e on Arbitrum is counted towards Arbitrum and that same amount is deducted from Ethereum's USDC supply, since it is locked in a bridge contract there.",

    "> This page is a data tracker for informational and educational purposes only. It is not investment advice. Data may be delayed or inaccurate. Do your own research.",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/fusaka.png",
  og_image: "",
  date: "2026-03-06",
  related: [],
  author: [{
    name: "Lorenz Lehmann",
    xUsername: "LehmannLorenz",
  }],
  topics: [
    {
      icon: "gtp-metrics-stablecoinmarketcap",
      name: "Stablecoin Supply",
      url: "/fundamentals/stablecoin-market-cap"
    },
  ],
  icon: "",
  showInMenu: false
};

export default StablecoinChain;
