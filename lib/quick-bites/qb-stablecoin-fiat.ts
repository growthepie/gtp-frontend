import { QuickBiteData } from '@/lib/types/quickBites';
import { renderFaqMarkdown, generateJsonLdFaq, type FaqItem } from './seo_helper';

const faqItems: FaqItem[] = [
  {
    q: "What is a fiat-pegged stablecoin?",
    a: "A fiat-pegged stablecoin is a token issued onchain that aims to maintain a 1:1 value with a specific fiat currency (e.g. USD, EUR). Issuers typically back each token with cash or short-duration reserves and redeem on demand to keep the peg.",
  },
  {
    q: "Which fiat currencies have stablecoins on Ethereum?",
    a: "We track every fiat currency that has at least one stablecoin issued in the Ethereum ecosystem. The current list of tokenized currencies is shown in the dropdown above and updates daily as new currencies launch onchain.",
  },
  {
    q: "How is on-chain stablecoin supply measured?",
    a: "We read the total supply of each tracked stablecoin contract directly onchain and aggregate daily. For lock-and-mint stablecoins we deduct the locked amount on the source chain to avoid double counting, and we deduct issuer-held treasury balances that are authorized but not yet in circulation.",
  },
  {
    q: "Why is the USD share so dominant?",
    a: "The vast majority of stablecoin supply in the Ethereum ecosystem is pegged to the US dollar, driven primarily by USDC (Circle) and USDT (Tether). Non-USD pegs exist (EUR, BRL, etc.) but their combined supply is a small fraction of total stablecoin float.",
  },
  {
    q: "Why isn't Solana or Tron supply included?",
    a: "This page only tracks stablecoins inside the Ethereum ecosystem (Ethereum L1 and its L2s). Supply on other L1s such as Solana or Tron is not included, so totals shown here are lower than a currency's full global stablecoin market cap.",
  },
  {
    q: "Which stablecoins are excluded from this dataset?",
    a: "We exclude value-accruing stablecoins that don't hold a 1:1 peg to the underlying asset (e.g. sUSDS), stablecoins that primarily wrap other stablecoins unless the wrapping is part of a bridge mechanism (e.g. Aave aUSDC), and permissioned or institutional-only tokens (e.g. BlackRock BUIDL).",
  },
];

const datasetSchemas = [
  {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Ethereum Ecosystem Stablecoin Supply by Fiat Currency",
    description: "Daily circulating supply of fiat-pegged stablecoins in the Ethereum ecosystem (Ethereum L1 + L2s), broken down by fiat currency, issuer, and chain. Adjusted for lock-and-mint bridges and issuer treasury balances.",
    url: "https://www.growthepie.com/quick-bites/stablecoins-for-fiat",
    license: "https://creativecommons.org/licenses/by-nc/4.0/",
    isAccessibleForFree: true,
    keywords: [
      "stablecoins",
      "fiat-pegged stablecoins",
      "Ethereum",
      "USDC",
      "USDT",
      "EURC",
      "stablecoin supply",
      "onchain data",
    ],
    creator: { "@id": "https://www.growthepie.com/#organization" },
    publisher: { "@id": "https://www.growthepie.com/#organization" },
    temporalCoverage: "2020-01-01/..",
    variableMeasured: [
      "Circulating supply (native units)",
      "Circulating supply (USD equivalent)",
      "Share of total stablecoin supply by fiat currency",
      "Count of unique fiat currencies tokenized",
    ],
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: "https://api.growthepie.com/v1/quick-bites/stablecoins/fiat/timeseries.json",
        name: "Stablecoin supply share by fiat currency (timeseries)",
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: "https://api.growthepie.com/v1/quick-bites/stablecoins/fiat/unique-fiat-count.json",
        name: "Unique fiat currencies tokenized over time",
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: "https://api.growthepie.com/v1/quick-bites/stablecoins/dropdown-fiat.json",
        name: "List of tracked fiat currencies",
      },
    ],
  },
];

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
        label: "Application",
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

  "```chart",
  JSON.stringify({
    type: "line",
    title: "Fiat Currencies Tokenized in the Ethereum Ecosystem",
    subtitle: "Daily count of unique fiat currencies for which stablecoin supply is tracked.",
    showXAsDate: true,
    dataAsJson: {
      meta: [
        {
          name: "Unique Fiat Count",
          color: "#FE5468",
          xIndex: 0,
          yIndex: 1,
          tooltipDecimals: 0,
          tooltipLabelIndex: 2,
          url: "https://api.growthepie.com/v1/quick-bites/stablecoins/fiat/unique-fiat-count.json",
          pathToData: "data.timeseries.values",
        },
      ],
    },
    height: 400,
    caption: "Daily count of unique fiat currencies tracked. Hover to see which currencies were added in that week.",
  }),
  "```",

  "> Ethereum ecosystem only: We only track stablecoins within the Ethereum ecosystem. Supply on other L1s (e.g. Solana, Tron) is not included, so totals will be lower than a currency's full global market cap.",

  "# Methodology",
  "We track stablecoin supply by reading onchain total supply values for known stablecoins directly on each chain. For lock-and-mint stablecoins, we deduct the locked amount from the source chain to avoid double counting. Beyond bridged amounts, we also deduct stablecoins held in known treasury or reserve wallets on Ethereum that are authorized but not yet in circulation. This is relevant for issuers like Tether (USDT), where a portion of the onchain supply is pre-minted and sitting in issuer-controlled wallets, representing authorized but not yet issued supply. Supply is aggregated daily. We have three inclusion rules for a stablecoin to be included: value-accruing stablecoins are excluded since they do not hold a 1:1 peg to the underlying asset (e.g. sUSDS). Stablecoins that primarily wrap other stablecoins are also excluded, unless the wrapping is part of a bridge mechanism (e.g. Aave aUSDC, IUSD, dtrinity USD). Finally, we only include stablecoins that anyone can freely hold, permissioned or institutional-only tokens are out of scope (e.g. Blackrock BUIDL). If we are missing a stablecoin, you can open a PR on our [mapping file on GitHub](https://github.com/growthepie/gtp-backend/blob/main/backend/src/stables_config_v2.py).",

  ...renderFaqMarkdown(faqItems, {
    title: "Frequently Asked Questions",
    layout: "accordion",
  }),
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
      url: "/fundamentals/stablecoin-market-cap",
      wikipedia: "https://en.wikipedia.org/wiki/Stablecoin",
      wikidata: "https://www.wikidata.org/wiki/Q56241176",
    },
  ],
  entities: [
    {
      name: "USD Coin (USDC)",
      sameAs: [
        "https://en.wikipedia.org/wiki/USD_Coin",
        "https://www.wikidata.org/wiki/Q105942633",
      ],
    },
    {
      name: "Tether (USDT)",
      sameAs: [
        "https://en.wikipedia.org/wiki/Tether_(cryptocurrency)",
        "https://www.wikidata.org/wiki/Q26210251",
      ],
    },
    {
      name: "Dai (DAI)",
      sameAs: [
        "https://en.wikipedia.org/wiki/Dai_(cryptocurrency)",
        "https://www.wikidata.org/wiki/Q63967587",
      ],
    },
    {
      name: "Circle Internet Financial",
      sameAs: [
        "https://en.wikipedia.org/wiki/Circle_(company)",
        "https://www.wikidata.org/wiki/Q24732654",
      ],
    },
    {
      name: "Tether Limited",
      sameAs: [
        "https://en.wikipedia.org/wiki/Tether_Limited",
        "https://www.wikidata.org/wiki/Q97154417",
      ],
    },
    {
      name: "Ethereum",
      sameAs: [
        "https://en.wikipedia.org/wiki/Ethereum",
        "https://www.wikidata.org/wiki/Q20990683",
      ],
    },
    {
      name: "United States dollar",
      sameAs: [
        "https://en.wikipedia.org/wiki/United_States_dollar",
        "https://www.wikidata.org/wiki/Q4917",
      ],
    },
    {
      name: "Euro",
      sameAs: [
        "https://en.wikipedia.org/wiki/Euro",
        "https://www.wikidata.org/wiki/Q4916",
      ],
    },
  ],
  faq: faqItems,
  jsonLdFaq: generateJsonLdFaq(faqItems),
  jsonLdDatasets: datasetSchemas,
  icon: "",
  showInMenu: true,
};

export default StablecoinFiat;
