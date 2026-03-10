import { EventExample, EventOption, EventSeriesMeta } from "./types";

const EIP8004_SERIES_TOTAL: EventSeriesMeta[] = [
  {
    name: "Total Registrations",
    color: "#FF8A98",
    yIndex: 2,
    seriesType: "line",
  },
  {
    name: "Total Reviews",
    color: "#AEEFED",
    yIndex: 1,
    seriesType: "line",
  },
];

const EIP8004_OPTIONS: EventOption[] = [
  {
    id: "eip-8004-cumulative",
    label: "Total Registrations & Reviews",
    dataSource: {
      url: "https://api.growthepie.com/v1/quick-bites/eip8004/events_cumulative.json",
      pathToData: "data.timeseries.values",
      xIndex: 0,
      series: EIP8004_SERIES_TOTAL,
    },
  },
  {
    id: "eip-8004-chain-breakdown",
    label: "Registrations by Chain",
    dataSource: {
      url: "https://api.growthepie.com/v1/quick-bites/eip8004/registered_cumulative.json",
      pathToData: "data.timeseries.values",
      dynamicSeries: {
        namesPath: "data.names",
        colorsPath: "data.colors",
        ystartIndex: 1,
        xIndex: 0,
        seriesType: "bar",
      },
    },
    stack: true,
  },
];

const eip8004Event: EventExample = {
  title: "AI Agent Adoption",
  description: "AI agent (ERC-8004) registrations and reviews over time.",
  question: "How fast is AI agent adoption growing?",
  image: "gtp-tracker",
  link: "/quick-bites/eip-8004",
  options: EIP8004_OPTIONS,
  defaultOptionId: "eip-8004-cumulative",
};

export default eip8004Event;
