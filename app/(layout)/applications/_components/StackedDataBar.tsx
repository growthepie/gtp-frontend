
import React, { Component } from 'react';
import Highcharts from 'highcharts/highstock';
import 'highcharts/highcharts-more';
import {
  HighchartsChart, Chart, HighchartsProvider, XAxis, YAxis, Title, Legend, ColumnSeries, SplineSeries, PieSeries
} from 'react-jsx-highcharts';

const StackedDataBar = ({seriesData}) => {
  return (
    <HighchartsProvider Highcharts={Highcharts}>
      <HighchartsChart>
      </HighchartsChart>
    </HighchartsProvider>
  )
}