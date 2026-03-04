import { EventExample, EventOption, EventSeriesMeta } from "./types";

const FUSAKA_BLOB_SERIES_META: EventSeriesMeta[] = [
  {
    name: "Avg blob count",
    color: "#FFC300",
    yIndex: 1,
    seriesType: "line",
  },
  {
    name: "Target blob count",
    color: "#19D9D6",
    yIndex: 5,
    seriesType: "line",
  },
  {
    name: "Total blob fees",
    color: "#FE5468",
    yIndex: 4,
    seriesType: "line",
  },
];

const FUSAKA_BLOB_OPTIONS: EventOption[] = [
  {
    id: "fusaka-bpo2",
    label: "since Fusaka-BPO2 (2026-01-07)",
    dataSource: {
      url: "https://api.growthepie.com/v1/quick-bites/fusaka/timeseries_blobs/Fusaka-BPO2.json",
      pathToData: "data.timeseries.values",
      series: FUSAKA_BLOB_SERIES_META,
    },
  },
  {
    id: "fusaka-bpo1",
    label: "since Fusaka-BPO1 (2025-12-09)",
    dataSource: {
      url: "https://api.growthepie.com/v1/quick-bites/fusaka/timeseries_blobs/Fusaka-BPO1.json",
      pathToData: "data.timeseries.values",
      series: FUSAKA_BLOB_SERIES_META,
    },
  },
  {
    id: "fusaka",
    label: "since Fusaka (2025-12-03)",
    dataSource: {
      url: "https://api.growthepie.com/v1/quick-bites/fusaka/timeseries_blobs/Fusaka.json",
      pathToData: "data.timeseries.values",
      series: FUSAKA_BLOB_SERIES_META,
    },
  },
];

const fusakaEvent: EventExample = {
  title: "Fusaka Upgrade",
  description: "Average blobs per block vs target blob fees in ETH.",
  question: "Is blob capacity keeping up with demand?",
  image: "gtp-ethereum-weekly",
  link: "/quick-bites/fusaka",
  defaultOptionId: "fusaka-bpo2",
  options: FUSAKA_BLOB_OPTIONS,
};

export default fusakaEvent;
