import { QuickBiteData } from '@/lib/types/quickBites';
import fiatData from '../../public/dicts/fiat.json';

const CURRENCIES_MAP = Object.fromEntries(
  Object.entries(fiatData).map(([code, info]) => [code, { symbol: info.symbol, name: info.name, country: info.country}])
);

const chainDropdown = {
  label: "Select a Chain",
  placeholder: "Choose a chain",
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
    labelField: "name",
    useChainIcons: true,
  }
};

const mainContent = [
  "This page shows a breakdown of the total circulating stablecoin supply by chain. Select a chain below to explore which stablecoins dominate its ecosystem, how supply has changed over time and how different tokens compare in size.",

  "```dropdown",
  JSON.stringify(chainDropdown),
  "```",

  "```chart",
  JSON.stringify({
    type: "area",
    title: "Stablecoin Supply for {{selectedChainName}}",
    subtitle: "Stacked circulating supply of top stablecoins for {{selectedChainName}}.",
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
  title: "Stablecoin Supply Breakdown for Chains",
  shortTitle: "Stablecoins by Chain",
  subtitle: "Analyzing the composition and trends of stablecoins across different chains.",
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
    {
      icon: "ethereum-logo-monochrome",
      color: "#94ABD3",
      name: "Ethereum Mainnet",
      url: "/chains/ethereum"
    },
    {
      icon: "arbitrum-logo-monochrome",
      color: "rgb(var(--chains-arbitrum-one))",
      name: "Arbitrum One",
      url: "/chains/arbitrum"
    },
    {
      icon: "arbitrum-nova-logo-monochrome",
      color: "rgb(var(--chains-arbitrum-nova))",
      name: "Arbitrum Nova",
      url: "/chains/arbitrum-nova"
    },
    {
      icon: "base-logo-monochrome",
      color: "rgb(var(--chains-base))",
      name: "Base Chain",
      url: "/chains/base"
    },
    {
      icon: "celo-logo-monochrome",
      color: "rgb(var(--chains-celo))",
      name: "Celo",
      url: "/chains/celo"
    },
    {
      icon: "fraxtal-logo-monochrome",
      color: "rgb(var(--chains-fraxtal))",
      name: "Fraxtal",
      url: "/chains/fraxtal"
    },
    {
      icon: "gravity-logo-monochrome",
      color: "rgb(var(--chains-gravity))",
      name: "Gravity",
      url: "/chains/gravity"
    },
    {
      icon: "ink-logo-monochrome",
      color: "rgb(var(--chains-ink))",
      name: "Ink",
      url: "/chains/ink"
    },
    {
      icon: "linea-logo-monochrome",
      color: "rgb(var(--chains-linea))",
      name: "Linea",
      url: "/chains/linea"
    },
    {
      icon: "lisk-logo-monochrome",
      color: "rgb(var(--chains-lisk))",
      name: "Lisk",
      url: "/chains/lisk"
    },
    {
      icon: "loopring-logo-monochrome",
      color: "rgb(var(--chains-loopring))",
      name: "Loopring",
      url: "/chains/loopring"
    },
    {
      icon: "manta-logo-monochrome",
      color: "rgb(var(--chains-manta))",
      name: "Manta Pacific",
      url: "/chains/manta"
    },
    {
      icon: "mantle-logo-monochrome",
      color: "rgb(var(--chains-mantle))",
      name: "Mantle",
      url: "/chains/mantle"
    },
    {
      icon: "megaeth-logo-monochrome",
      color: "rgb(var(--chains-megaeth))",
      name: "MegaETH",
      url: "/chains/megaeth"
    },
    {
      icon: "metis-logo-monochrome",
      color: "rgb(var(--chains-metis))",
      name: "Metis",
      url: "/chains/metis"
    },
    {
      icon: "mode-logo-monochrome",
      color: "rgb(var(--chains-mode))",
      name: "Mode Network",
      url: "/chains/mode"
    },
    {
      icon: "optimism-logo-monochrome",
      color: "rgb(var(--chains-op-mainnet))",
      name: "OP Mainnet",
      url: "/chains/op-mainnet"
    },
    {
      icon: "plume-logo-monochrome",
      color: "rgb(var(--chains-plume))",
      name: "Plume Network",
      url: "/chains/plume"
    },
    {
      icon: "polygon-pos-logo-monochrome",
      color: "rgb(var(--chains-polygon-pos))",
      name: "Polygon PoS",
      url: "/chains/polygon-pos"
    },
    {
      icon: "scroll-logo-monochrome",
      color: "rgb(var(--chains-scroll))",
      name: "Scroll",
      url: "/chains/scroll"
    },
    {
      icon: "soneium-logo-monochrome",
      color: "rgb(var(--chains-soneium))",
      name: "Soneium",
      url: "/chains/soneium"
    },
    {
      icon: "starknet-logo-monochrome",
      color: "rgb(var(--chains-starknet))",
      name: "Starknet",
      url: "/chains/starknet"
    },
    {
      icon: "taiko-logo-monochrome",
      color: "rgb(var(--chains-taiko))",
      name: "Taiko Alethia",
      url: "/chains/taiko"
    },
    {
      icon: "unichain-logo-monochrome",
      color: "rgb(var(--chains-unichain))",
      name: "Unichain",
      url: "/chains/unichain"
    },
    {
      icon: "worldchain-logo-monochrome",
      color: "rgb(var(--chains-worldchain))",
      name: "World Chain",
      url: "/chains/worldchain"
    },
    {
      icon: "zksync-era-logo-monochrome",
      color: "rgb(var(--chains-zksync-era))",
      name: "ZKsync Era",
      url: "/chains/zksync-era"
    },
  ],
  icon: "",
  showInMenu: true,
};

export default StablecoinChain;
