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
        dynamicSeries: {
          url: "https://api.growthepie.com/v1/quick-bites/stablecoins/timeseries/top_{{selectedChain}}.json",
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

    "> We do not double count: Bridged stablecoins are counted on the receiving chain. For example, USDC.e on Arbitrum is counted towards Arbitrum and that same amount is deducted from Ethereum's USDC supply, since it is locked in a bridge contract there.",

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
      icon: "gtp-metrics-stablecoinmarketcap",
      name: "Stablecoin Supply",
      url: "/fundamentals/stablecoin-market-cap"
    },
  ],
  icon: "",
  showInMenu: false
};

export default StablecoinChain;
