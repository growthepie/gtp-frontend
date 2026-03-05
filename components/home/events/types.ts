import { GTPChartSeries } from "@/components/GTPButton/GTPChart";

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
  series: EventSeriesMeta[];
};

export type EventOption = {
  id: string;
  label: string;
  series?: GTPChartSeries[];
  dataSource?: EventOptionDataSource;
};

export type EventExample = {
  title: string;
  description: string;
  question: string;
  image: string;
  link: string;
  series?: GTPChartSeries[];
  cards?: { id: string, name: string, value: number, rank: number, contractsDeployed: number, icon: string, }[];
  options?: EventOption[];
  defaultOptionId?: string;
  bodyType?: "chart" | "card";
};
