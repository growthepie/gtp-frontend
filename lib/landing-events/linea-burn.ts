import { EventExample, EventOption, EventSeriesMeta } from "./types";

const LINEA_BURN_SERIES_META: EventSeriesMeta[] = [
  {
    name: "ETH Burned",
    color: "#94ABD3",
    yIndex: 6,
    seriesType: "line",
  },
  {
    name: "ETH Burned (USD)",
    color: "#FE5468",
    yIndex: 8,
    seriesType: "line",
  },
];

const LINEA_BURN_OPTIONS: EventOption[] = [
  {
    id: "linea-burn",
    label: "Daily burn",
    dataSource: {
      url: "https://api.growthepie.com/v1/quick-bites/linea/burn.json",
      pathToData: "data.daily.values",
      xIndex: 0,
      series: LINEA_BURN_SERIES_META,
    },
  },
];

const lineaBurnEvent: EventExample = {
  title: "Linea Token Burn",
  description: "Daily ETH burn and USD value from Linea's dual-token burn program.",
  question: "How fast is Linea burning ETH?",
  image: "linea-logo-monochrome",
  link: "/quick-bites/linea-burn",
  options: LINEA_BURN_OPTIONS,
  defaultOptionId: "linea-burn",
};

export default lineaBurnEvent;
