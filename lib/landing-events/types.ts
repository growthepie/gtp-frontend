import { GTPChartSeries, GTPChartXAxisLine } from "@/components/GTPComponents/GTPChart";

export type EventSeriesMeta = {
  name: string;
  color: string;
  yIndex: number;
  seriesType?: GTPChartSeries["seriesType"];
};

export type EventOptionDataSource = {
  url: string;
  pathToData: string;
  xIndex?: number;
  series?: EventSeriesMeta[];
  dynamicSeries?: {
    namesPath: string;
    colorsPath: string;
    ystartIndex?: number;
    xIndex?: number;
    seriesType?: GTPChartSeries["seriesType"];
  };
};

export type EventOption = {
  id: string;
  label: string;
  series?: GTPChartSeries[];
  dataSource?: EventOptionDataSource;
  stack?: boolean;
  xAxisLines?: GTPChartXAxisLine[];
};

export type EventExample = {
  title?: string;
  description?: string;
  question?: string;
  image?: string;
  link?: string;
  series?: GTPChartSeries[];
  cards?: { owner_project: string, metric: string }[];
  topAppsMetric?: string;
  options?: EventOption[];
  defaultOptionId?: string;
  bodyType?: "chart" | "card";
  xAxisLines?: GTPChartXAxisLine[];
  allTimeHigh?: {
    chainKey: string;
    metricKey: string;
  };
};
