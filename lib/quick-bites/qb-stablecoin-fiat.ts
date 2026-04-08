import { QuickBiteData } from '@/lib/types/quickBites';

const fiatDropdown = {
  label: "Select a Fiat Currency",
  placeholder: "Choose a fiat currency",
  searchable: true,
  stateKey: "selectedFiat",
  labelStateKey: "selectedFiatName",
  defaultValue: "eur",
  allowEmpty: false,
  readFromJSON: true,
  jsonData: {
    url: "https://api.growthepie.com/v1/quick-bites/stablecoins/dropdown-fiat.json",
    pathToOptions: "dropdown_values",
    valueField: "fiat",
  }
};

const mainContent = [
  "This page shows the total circulating supply of stablecoins pegged to each fiat currency. Use the dropdown below to explore which tokens back a specific currency, how supply has changed over time, and which chains hold them.",

  "```dropdown",
  JSON.stringify(fiatDropdown),
  "```",

  "```chart-toggle",
  JSON.stringify({
    title: null,
    description: "Select between native token units and equivalent USD value.",
    layout: "segmented",
    defaultIndex: 0,
    charts: [
      {
        toggleLabel: "Native Value",
        type: "area",
        title: "{{selectedFiatName}} Stablecoin Supply (Native)",
        subtitle: "Stacked circulating supply of stablecoins pegged to {{selectedFiatName}} in native token units, broken down by token.",
        showXAsDate: true,
        showZeroTooltip: false,
        showTotalTooltip: true,
        dataAsJson: {
          dynamicSeries: {
            url: "https://api.growthepie.com/v1/quick-bites/stablecoins/fiat/{{selectedFiat}}_native.json",
            pathToData: "data.timeseries.values",
            ystartIndex: 1,
            names: "data.symbols",
            colors: "data.colors",
            stacking: "normal",
            prefixFiatSymbolFromPath: "data.fiat",
            xIndex: 0,
            tooltipDecimals: 2
          },
        },
        height: 500,
        caption: "Stacked area chart showing the native token circulating supply of stablecoins pegged to the selected fiat currency, broken down by token. Data is updated daily.",
      },
      {
        toggleLabel: "USD Value",
        type: "area",
        title: "{{selectedFiatName}} Stablecoin Supply (USD)",
        subtitle: "Stacked circulating supply of stablecoins pegged to {{selectedFiatName}}, broken down by token.",
        showXAsDate: true,
        showZeroTooltip: false,
        showTotalTooltip: true,
        dataAsJson: {
          dynamicSeries: {
            url: "https://api.growthepie.com/v1/quick-bites/stablecoins/fiat/{{selectedFiat}}.json",
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
        caption: "Stacked area chart showing the USD circulating supply of stablecoins pegged to the selected fiat currency, broken down by token. Data is updated daily.",
      },
    ],
  }),
  "```",

  "```table",
  JSON.stringify({
    readFromJSON: true,
    jsonData: {
      url: "https://api.growthepie.com/v1/quick-bites/stablecoins/fiat/table_{{selectedFiat}}.json",
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
      origin_key: {
        label: "Chain",
        type: "chain",
        minWidth: 150,
        isNumeric: false,
        sortByValue: true,
        showLabel: true,
        add_url: "/chains/${cellValue}",
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
    columnOrder: ["logo", "symbol", "owner_project_display_name", "origin_key", "30d_supply_change", "365d_supply_change", "value", "value_usd"],
    columnSortBy: "value_usd",
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
        { columns: ["origin_key", "owner_project_display_name"], labelPosition: "right", layout: "start" },
      ],
      autoRowHeight: true,
    },
  }),
  "```",

  "## USD-denominated Stablecoins Dominate the Market",

  "```kpi-cards",
  JSON.stringify([
    {
      title: "Fiat Currencies Tracked",
      value: "{{stablecoin_fiat_count}}",
      description: "",
      icon: "gtp-metrics-stablecoinmarketcap",
      info: "Number of distinct fiat currencies for which we track stablecoin supply.",
    },
    {
      title: "USD Dominance",
      value: "{{stablecoin_fiat_usd_dominance}}",
      description: "share of total stablecoin supply",
      icon: "gtp-metrics-stablecoinmarketcap",
      info: "USD-pegged stablecoins as a percentage of total tracked stablecoin supply.",
    },
    {
      title: "Non-USD Supply",
      value: "{{stablecoin_fiat_non_usd_mcap}}",
      description: "stablecoins pegged to non-USD currencies",
      icon: "gtp-metrics-stablecoinmarketcap",
      info: "Total circulating supply (in USD) of stablecoins pegged to currencies other than USD.",
    },
  ]),
  "```",

  "```chart",
  JSON.stringify({
    type: "area",
    title: "Stablecoin Supply by Fiat Currency (USD Value)",
    subtitle: "Share of total stablecoin supply pegged to each fiat currency, as a percentage.",
    showXAsDate: true,
    showZeroTooltip: false,
    showTotalTooltip: false,
    dataAsJson: {
      dynamicSeries: {
        url: "https://api.growthepie.com/v1/quick-bites/stablecoins/fiat/timeseries.json",
        pathToData: "data.timeseries.values",
        ystartIndex: 1,
        names: "data.timeseries.types",
        namesTransform: "uppercase",
        colors: "data.colors",
        stacking: "percent",
        prefix: '$',
        xIndex: 0,
        tooltipDecimals: 1
      },
    },
    height: 500,
    caption: "Stacked area chart showing the percentage share of stablecoin supply pegged to each fiat currency. Data is updated daily.",
  }),
  "```",

  "> Ethereum ecosystem only: We only track stablecoins within the Ethereum ecosystem. Supply on other L1s (e.g. Solana, Tron) is not included, so totals will be lower than a currency's full global market cap.",

  "# Methodology",
  "We track stablecoin supply by reading onchain total supply values for known stablecoins directly on each chain. For lock-and-mint stablecoins, we deduct the locked amount from the source chain to avoid double counting. Supply is aggregated daily. We have three inclusion rules for a stablecoin to be included: value-accruing stablecoins are excluded since they do not hold a 1:1 peg to the underlying asset (e.g. sUSDS). Stablecoins that primarily wrap other stablecoins are also excluded, unless the wrapping is part of a bridge mechanism (e.g. Aave aUSDC, IUSD, dtrinity USD). Finally, we only include stablecoins that anyone can freely hold, permissioned or institutional-only tokens are out of scope (e.g. Blackrock BUIDL). If we are missing a stablecoin, you can open a PR on our [mapping file on GitHub](https://github.com/growthepie/gtp-backend/blob/main/backend/src/stables_config_v2.py).",
];

const StablecoinFiat: QuickBiteData = {
  title: "Stablecoin Supply Breakdown by Fiat Currency",
  shortTitle: "Stablecoins by Fiat",
  subtitle: "Analyzing the composition and trends of stablecoins pegged to different fiat currencies.",
  content: [
    ...mainContent,
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/stablecoins.png",
  og_image: "",
  date: "2026-04-09",
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

export default StablecoinFiat;
