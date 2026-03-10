import { QuickBiteData } from '@/lib/types/quickBites';
import fiatData from '../../public/dicts/fiat.json';

const CURRENCIES_MAP = Object.fromEntries(
  Object.entries(fiatData).map(([code, info]) => [code, { symbol: info.symbol, name: info.name, country: info.country}])
);

const mainContent = [
  "This page shows a breakdown of the total circulating stablecoin supply by chain. Select a chain below to explore which stablecoins dominate its ecosystem, how supply has changed over time and how different tokens compare in size.",

  "```dropdown",
  JSON.stringify({
    label: "Select a Chain",
    placeholder: "Choose a chain...",
    searchable: true,
    stateKey: "selectedChain",
    labelStateKey: "selectedChainName",
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
    title: "Stablecoin Breakdown for {{selectedChainName}}",
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

  "> No double counting: Bridged stablecoins are counted on the receiving chain. For example, USDC.e on Arbitrum is counted towards Arbitrum and that same amount is deducted from Ethereum's USDC supply, since it is locked in a bridge contract there.",

  "# Methodology",
  "We track stablecoin supply by reading onchain total supply values for known stablecoins directly on each chain. For lock-and-mint stablecoins, we deduct the locked amount from the source chain to avoid double counting. Supply is aggregated daily. We have three inclusion rules for a stablecoin to be included: value-accruing stablecoins are excluded since they do not hold a 1:1 peg to the underlying asset (e.g. sUSDS). Stablecoins that primarily wrap other stablecoins are also excluded, unless the wrapping is part of a bridge mechanism (e.g. Aave aUSDC, IUSD, dtrinity USD). Finally, we only include stablecoins that anyone can freely hold, permissioned or institutional-only tokens are out of scope (e.g. Blackrock BUIDL). If we are missing a stablecoin, you can open a PR on our [mapping file on GitHub](https://github.com/growthepie/gtp-backend/blob/main/backend/src/stables_config_v2.py).",
];

const StablecoinChain: QuickBiteData = {
  title: "Stablecoin Breakdown by Chain",
  shortTitle: "Stablecoins by Chain",
  subtitle: "Analyzing the composition and trends of stablecoins across different chains.",
  content: [
    ...mainContent,
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
  showInMenu: false,
};

export default StablecoinChain;
