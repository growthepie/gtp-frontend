'use client';

import React, { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface ChartWrapperProps {
  chartType: 'line' | 'bar' | 'pie' | 'area';
  data: any;
  options?: any;
  width?: number | string;
  height?: number | string;
}

const defaultOptions = {
  chart: {
    backgroundColor: 'transparent',
    style: {
      fontFamily: 'Raleway, sans-serif',
    },
  },
  title: {
    text: undefined,
  },
  credits: {
    enabled: false,
  },
  legend: {
    itemStyle: {
      color: '#CDD8D3',
    },
    itemHoverStyle: {
      color: '#EAECEB',
    },
  },
  tooltip: {
    backgroundColor: '#2A3433',
    style: {
      color: '#CDD8D3',
    },
    borderWidth: 0,
    borderRadius: 8,
  },
  xAxis: {
    labels: {
      style: {
        color: '#CDD8D3',
      },
    },
    gridLineColor: 'rgba(215, 223, 222, 0.11)',
    lineColor: 'rgba(215, 223, 222, 0.33)',
    tickColor: 'rgba(215, 223, 222, 0.33)',
  },
  yAxis: {
    labels: {
      style: {
        color: '#CDD8D3',
      },
    },
    gridLineColor: 'rgba(215, 223, 222, 0.11)',
  },
  plotOptions: {
    series: {
      animation: true,
    },
  },
};

const getChartOptions = (chartType: string, data: any, userOptions?: any) => {
  const options = {
    ...defaultOptions,
    chart: {
      ...defaultOptions.chart,
      type: chartType,
    },
    series: data,
    ...userOptions,
  };

  return options;
};

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  chartType,
  data,
  options,
  width = '100%',
  height = 400,
}) => {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const chartOptions = getChartOptions(chartType, data, options);

  useEffect(() => {
    // This ensures the chart is properly rendered when the component mounts
    if (chartRef.current?.chart) {
      chartRef.current.chart.reflow();
    }

    // Add resize listener
    const handleResize = () => {
      if (chartRef.current?.chart) {
        chartRef.current.chart.reflow();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{ width, height }}>
      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
        ref={chartRef}
        containerProps={{ style: { width: '100%', height: '100%' } }}
      />
    </div>
  );
};

export default ChartWrapper;