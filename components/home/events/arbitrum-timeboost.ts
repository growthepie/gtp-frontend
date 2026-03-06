import { EventExample, EventOption, EventSeriesMeta } from "./types";

const TIMEBOOST_SERIES_META: EventSeriesMeta[] = [
  {
    name: "Timeboost Fees (ETH)",
    color: "#1DF7EF",
    yIndex: 0,
    seriesType: "bar",
  },
];

const TIMEBOOST_OPTIONS: EventOption[] = [
  {
    id: "timeboost-daily",
    label: "Daily fees",
    dataSource: {
      url: "https://api.growthepie.com/v1/quick-bites/arbitrum-timeboost.json",
      pathToData: "data.fees_paid_priority_eth.daily.values",
      xIndex: 1,
      series: TIMEBOOST_SERIES_META,
    },
  },
];

const arbitrumTimeboostEvent: EventExample = {
  title: "Arbitrum Timeboost",
  description: "Daily Timeboost revenue paid to the Arbitrum DAO.",
  question: "How much is Timeboost earning each day?",
  image: "arbitrum-logo-monochrome",
  link: "/quick-bites/arbitrum-timeboost",
  options: TIMEBOOST_OPTIONS,
  defaultOptionId: "timeboost-daily",
  bodyType: "chart",
};

export default arbitrumTimeboostEvent;
