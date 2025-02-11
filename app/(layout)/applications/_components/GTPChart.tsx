
"use client";
import React, { Component } from 'react';
import Highcharts from 'highcharts/highstock';
import 'highcharts/highcharts-more';
import {
  HighchartsChart, Chart, HighchartsProvider, XAxis, YAxis, Title, Legend, ColumnSeries, SplineSeries, PieSeries,
  BarSeries
} from 'react-jsx-highcharts';
import highchartsRoundedCorners from "highcharts-rounded-corners";

highchartsRoundedCorners(Highcharts);

type SeriesData = {
  name: string;
  data: number[]
}

export const StackedDataBar = ({seriesData} : {seriesData: SeriesData[]}) => {
  return (
    <>
    <pre style={{maxHeight: 200, overflow: 'auto'}}>
      {JSON.stringify(seriesData, null, 2)}
    </pre>
    <GTPChartProvider 
      type="bar" 
      plotOptions={{
        series: {
          stacking: "percent",
        },
        bar: {
          dataLabels: {
            enabled: false
          },
          stacking: "percent",
        }
      }}
      chart={{
        height: 200,
        margin: [0, 0, 0, 0],
        spacing: [0, 0, 0, 0],
        backgroundColor: 'transparent'
      }}
      >
      <XAxis categories={seriesData.map(series => series.name)} labels={{ enabled: false }} gridLineWidth={0} plotLines={[]} title={{ text: null }} />
      <YAxis labels={{ enabled: false }} gridLineWidth={0} plotLines={[]} title={{ text: null }} stackLabels={{ enabled: false }}>
        {seriesData.map((series, i) => (
          <BarSeries key={i} name={series.name} data={series.data} stacking="normal" borderRadius={8} />
        ))}
      </YAxis>
    </GTPChartProvider>
    </>
  )
}

type GTPChartProviderProps = {
  children: React.ReactNode;
  type: Highcharts.ChartOptions["type"];
  plotOptions: Highcharts.PlotOptions;
  chart?: Highcharts.ChartOptions;
}

export const GTPChartProvider = ({ children, type, plotOptions, chart }: GTPChartProviderProps) => {
  
  return (
    <HighchartsProvider Highcharts={Highcharts}>
      <HighchartsChart plotOptions={plotOptions} type={type} chart={chart}>
        {children}
      </HighchartsChart>
    </HighchartsProvider>
  )
}