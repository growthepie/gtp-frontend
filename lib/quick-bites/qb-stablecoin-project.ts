import { QuickBiteData } from '@/lib/types/quickBites';
import fiatData from '../../public/dicts/fiat.json';

const CURRENCIES_MAP = Object.fromEntries(
  Object.entries(fiatData).map(([code, info]) => [code, { symbol: info.symbol, name: info.name, country: info.country}])
);

const StablecoinProject: QuickBiteData = {
  title: "Stablecoin Breakdown by Project",
  shortTitle: "Stablecoins",
  subtitle: "Analyzing the composition and trends of stablecoins across different projects.",
  content: [

    "```dropdown",
    JSON.stringify({
      label: "Select a Project",
      placeholder: "Choose a project...",
      searchable: true,
      stateKey: "selectedProject",
      defaultValue: "circlefin",
      allowEmpty: false,
      readFromJSON: true,
      jsonData: {
        url: "https://api.growthepie.com/v1/quick-bites/stablecoins/dropdown-projects.json",
        pathToOptions: "dropdown_values",
        valueField: "owner_project",
        labelField: "display_name"
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
          url: "https://api.growthepie.com/v1/quick-bites/stablecoins/projects/{{selectedProject}}.json",
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
      caption: "Stacked area chart showing the circulating supply of top stablecoins for the selected project. Data is updated daily.",
    }),
    "```",

    "## Stablecoin Breakdown Table",
    "```table",
    JSON.stringify({
      readFromJSON: true,
      jsonData: {
        url: "https://api.growthepie.com/v1/quick-bites/stablecoins/projects/table_{{selectedProject}}.json",
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
        origin_key: {
          label: "Chain",
          type: "chain",
          minWidth: 150,
          isNumeric: false,
          sortByValue: true,
          showLabel: true,
          add_url: "/chains/${cellValue}",
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
      columnOrder: ["logo", "symbol", "origin_key", "fiat", "30d_supply_change", "365d_supply_change", "value", "value_usd"],
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
          { columns: ["origin_key", "fiat"], labelPosition: "right", layout: "start" },
        ],
        autoRowHeight: true,
      },
    }),
    "```",

    "> Ethereum ecosystem only: We only track stablecoins within the Ethereum ecosystem. Supply on other L1s are not included, so totals will be lower than a project's full global market cap.",

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

export default StablecoinProject;
