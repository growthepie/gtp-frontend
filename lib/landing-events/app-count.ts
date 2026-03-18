import { EventExample, EventOption, EventSeriesMeta } from "./types";

const APPS_TOTAL_SERIES_META: EventSeriesMeta[] = [
  {
    name: "Weekly Active Apps",
    color: "#CDD8D2",
    yIndex: 1,
    seriesType: "area",
  },
];

const APP_COUNT_OPTIONS: EventOption[] = [
  {
    id: "apps-total",
    label: "Totals",
    dataSource: {
      url: "https://api.growthepie.com/v1/landing-events/apps-data.json",
      pathToData: "data.apps_total.weekly.values",
      xIndex: 0,
      series: APPS_TOTAL_SERIES_META,
    },
  },
  {
    id: "apps-by-chain",
    label: "Breakdown by Chain",
    dataSource: {
      url: "https://api.growthepie.com/v1/landing-events/apps-data.json",
      pathToData: "data.apps_by_chain.timeseries.values",
      dynamicSeries: {
        namesPath: "data.apps_by_chain.names",
        colorsPath: "data.apps_by_chain.colors",
        ystartIndex: 1,
        xIndex: 0,
        seriesType: "area",
      },
    },
    stack: true,
  },
];

const appCountEvent: EventExample = {
  title: "Active Apps in the Ethereum Ecosystem",
  description: "Weekly active app counts across the Ethereum ecosystem, with chain-level breakdowns.",
  question: "How many apps are active in the Ethereum ecosystem?",
  image: "gtp-project",
  link: "/applications",
  options: APP_COUNT_OPTIONS,
  defaultOptionId: "apps-total",
  bodyType: "chart",
};

export default appCountEvent;
