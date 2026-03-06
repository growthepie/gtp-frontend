export interface ChainMetricResponse {
  details: MetricDetails;
  last_updated_utc: Date;
}

export interface MetricDetails {
  metric_id: string;
  metric_name: string;
  timeseries: Timeseries;
  source: string[];
  changes: Changes;
  summary: Summary;
}

export interface Changes {
  daily: ChangesDaily;
  weekly: ChangesMonthly;
  monthly: ChangesMonthly;
  quarterly: ChangesMonthly | null;
}

export interface ChangesDaily {
  types: MetricType[];
  "1d": number[];
  "7d": number[];
  "30d": number[];
  "90d": number[];
  "180d": number[];
  "365d": number[];
}

export interface ChangesMonthly {
  types: MetricType[];
  "7d"?: number[];
  "30d": number[];
  "90d": number[];
  "180d": number[];
  "365d": number[];
}

export enum MetricType {
  Unix = "unix",
  Usd = "usd",
  Eth = "eth",
}

export interface Summary {
  last_1d: SummaryPeriod;
  last_7d: SummaryPeriod;
  last_30d: SummaryPeriod;
}

export interface SummaryPeriod {
  types: MetricType[];
  data: number[];
}

export interface Timeseries {
  hourly?: TimeseriesData;
  daily: TimeseriesData;
  weekly: TimeseriesData;
  monthly: TimeseriesData;
  quarterly: TimeseriesData;
  daily_7d_rolling: TimeseriesData;
}

export interface TimeseriesData {
  types: MetricType[];
  data: Array<number[]>;
}
