import { QuickBiteData } from '@/lib/types/quickBites';
import fiatData from '../../public/dicts/fiat.json';

const CURRENCIES_MAP = Object.fromEntries(
  Object.entries(fiatData).map(([code, info]) => [code, { symbol: info.symbol, name: info.name, country: info.country}])
);

const projectDropdown = {
  label: "Select a Project",
  placeholder: "Choose a project",
  searchable: true,
  stateKey: "selectedProject",
  labelStateKey: "selectedProjectName",
  defaultValue: "circlefin",
  allowEmpty: false,
  readFromJSON: true,
  jsonData: {
    url: "https://api.growthepie.com/v1/quick-bites/stablecoins/dropdown-projects.json",
    pathToOptions: "dropdown_values",
    valueField: "owner_project",
    labelField: "display_name",
    logoField: "logo_path",
    logoPrefix: "https://api.growthepie.com/v1/apps/logos/",
  }
};

const mainContent = [
  "This page shows a breakdown of the total circulating stablecoin supply by issuing project. Select a project below to see how its stablecoins are distributed across chains, how supply has changed over time and which tokens it operates.",

  "```dropdown",
  JSON.stringify(projectDropdown),
  "```",

  "```chart",
  JSON.stringify({
    type: "area",
    title: "Stablecoin Supply for {{selectedProjectName}}",
    subtitle: "Stacked circulating supply of top stablecoins for {{selectedProjectName}}.",
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

  "> Ethereum ecosystem only: We only track stablecoins within the Ethereum ecosystem. Supply on other L1s (e.g. Solana, Tron) is not included, so totals will be lower than a project's full global market cap.",

  "# Methodology",
  "We track stablecoin supply by reading onchain total supply values for known stablecoins directly on each chain. For lock-and-mint stablecoins, we deduct the locked amount from the source chain to avoid double counting. Beyond bridged amounts, we also deduct stablecoins held in known treasury or reserve wallets on Ethereum that are authorized but not yet in circulation. This is relevant for issuers like Tether (USDT), where a portion of the onchain supply is pre-minted and sitting in issuer-controlled wallets, representing authorized but not yet issued supply. Supply is aggregated daily. We have three inclusion rules for a stablecoin to be included: value-accruing stablecoins are excluded since they do not hold a 1:1 peg to the underlying asset (e.g. sUSDS). Stablecoins that primarily wrap other stablecoins are also excluded, unless the wrapping is part of a bridge mechanism (e.g. Aave aUSDC, IUSD, dtrinity USD). Finally, we only include stablecoins that anyone can freely hold, permissioned or institutional-only tokens are out of scope (e.g. Blackrock BUIDL). If we are missing a stablecoin, you can open a PR on our [mapping file on GitHub](https://github.com/growthepie/gtp-backend/blob/main/backend/src/stables_config_v2.py).",
];

const StablecoinProject: QuickBiteData = {
  title: "Stablecoin Supply Breakdown for Issuers",
  shortTitle: "Stablecoins by Issuer",
  subtitle: "Analyzing the composition and trends of stablecoins across different issuers.",
  content: [
    ...mainContent,
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/stablecoins.png",
  og_image: "",
  date: "2026-03-12",
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
  showInMenu: true,
};

export default StablecoinProject;
