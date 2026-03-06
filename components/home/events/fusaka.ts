import { EventExample, EventOption, EventSeriesMeta } from "./types";

const BLOB_SERIES_META: EventSeriesMeta[] = [
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
];

const FUSAKA_BLOB_OPTIONS: EventOption[] = [
    {
    id: "dencun",
    label: "Since Dencun",
    dataSource: {
      url: "https://api.growthepie.com/v1/quick-bites/fusaka/timeseries_blobs/Dencun.json",
      pathToData: "data.timeseries.values",
      series: BLOB_SERIES_META,
    },
    xAxisLines: [
      {
        xValue: 1746576000000,
        annotationText: "Pectra",
        annotationPositionY: -8,
        lineStyle: "Dash",
        lineColor: "#CDD8D3",
        textColor: "#CDD8D3",
        textFontSize: 9,
      },
      {
        xValue: 1765177600000,
        annotationText: "Fusaka",
        annotationPositionY: -8,
        lineStyle: "Dash",
        lineColor: "#CDD8D3",
        textColor: "#CDD8D3",
        textFontSize: 9,
      },
    ],
  },
  {
    id: "pectra",
    label: "Since Pectra",
    dataSource: {
      url: "https://api.growthepie.com/v1/quick-bites/fusaka/timeseries_blobs/Pectra.json",
      pathToData: "data.timeseries.values",
      series: BLOB_SERIES_META,
    },
    xAxisLines: [
      {
        xValue: 1765187600000,
        annotationText: "Fusaka",
        annotationPositionY: -8,
        lineStyle: "Dash",
        lineColor: "#CDD8D3",
        textColor: "#CDD8D3",
        textFontSize: 9,
      },
    ],
  },
  {
    id: "fusaka",
    label: "Since Fusaka",
    dataSource: {
      url: "https://api.growthepie.com/v1/quick-bites/fusaka/timeseries_blobs/Fusaka.json",
      pathToData: "data.timeseries.values",
      series: BLOB_SERIES_META,
    },
    xAxisLines: [
      {
        xValue: 1765161600000,
        annotationText: "Fusaka-BPO1",
        annotationPositionY: -8,
        lineStyle: "Dash",
        lineColor: "#CDD8D3",
        textColor: "#CDD8D3",
        textFontSize: 9,
      },
      {
        xValue: 1767647695000,
        annotationText: "Fusaka-BPO2",
        annotationPositionY: -8,
        lineStyle: "Dash",
        lineColor: "#CDD8D3",
        textColor: "#CDD8D3",
        textFontSize: 9,
      },
    ],
  },

];

const fusakaEvent: EventExample = {
  title: "Blob Capacity",
  description: "Average blob count per block compared to target blob count over time.",
  question: "Is Ethereum blob capacity keeping up with demand?",
  image: "gtp-blobs",
  link: "/quick-bites/fusaka",
  defaultOptionId: "fusaka-bpo2",
  options: FUSAKA_BLOB_OPTIONS,
};

export default fusakaEvent;
