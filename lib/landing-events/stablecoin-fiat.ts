import { EventExample, EventOption, EventSeriesMeta } from "./types";

const STABLECOIN_FIAT_SERIES_META: EventSeriesMeta[] = [
  {
    name: "Unique Fiat Count",
    color: "#FE5468",
    yIndex: 1,
    seriesType: "line",
  },
];

const STABLECOIN_FIAT_OPTIONS: EventOption[] = [
  {
    id: "stablecoin-fiat-count",
    label: "Fiat Currencies",
    dataSource: {
      url: "https://api.growthepie.com/v1/quick-bites/stablecoins/fiat/unique-fiat-count.json",
      pathToData: "data.timeseries.values",
      xIndex: 0,
      series: STABLECOIN_FIAT_SERIES_META,
    },
  },
];

const stablecoinFiatEvent: EventExample = {
  title: "Fiat Currencies Tokenized in the Ethereum Ecosystem",
  description: "Daily count of unique fiat currencies for which stablecoin supply is tracked.",
  question: "How many fiat currencies are tokenized in the Ethereum ecosystem?",
  image: "gtp-metrics-stablecoinmarketcap",
  link: "/quick-bites/stablecoins-for-fiat",
  options: STABLECOIN_FIAT_OPTIONS,
  defaultOptionId: "stablecoin-fiat-count",
  bodyType: "chart",
};

export default stablecoinFiatEvent;
