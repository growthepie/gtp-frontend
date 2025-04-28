// File: components/quick-dives/ChartWrapper.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import highchartsAnnotations from 'highcharts/modules/annotations';
import highchartsRoundedCorners from 'highcharts-rounded-corners';
import highchartsPatternFill from 'highcharts/modules/pattern-fill';
import { debounce } from 'lodash';
import { useTheme } from 'next-themes';
import ChartWatermark from '@/components/layout/ChartWatermark';

interface ChartWrapperProps {
  chartType: 'line' | 'area' | 'bar' | 'column' | 'pie';
  data: any;
  options?: any;
  width?: number | string;
  height?: number | string;
  title?: string;
  subtitle?: string;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  chartType,
  data,
  options = {},
  width = '100%',
  height = 400,
  title,
  subtitle
}) => {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const { theme } = useTheme();
  const [isChartReady, setIsChartReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize Highcharts modules
  useEffect(() => {
    try {
      // Only initialize once
      if (!Highcharts.charts || Highcharts.charts.length === 0) {
        highchartsRoundedCorners(Highcharts);
        highchartsAnnotations(Highcharts);
        highchartsPatternFill(Highcharts);
        
        Highcharts.setOptions({
          lang: {
            numericSymbols: ["K", " M", "B", "T", "P", "E"],
          },
        });
      }
      
      // Validate data
      if (!Array.isArray(data)) {
        throw new Error('Chart data must be an array');
      }
      
      setIsChartReady(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to initialize chart');
      setLoading(false);
    }
  }, [data]);
  
  // Handle resize events
  useEffect(() => {
    const handleResize = debounce(() => {
      if (chartRef.current?.chart) {
        chartRef.current.chart.reflow();
      }
    }, 300);
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, []);
  
  if (loading) {
    return (
      <div 
        style={{ width, height }} 
        className="flex items-center justify-center bg-forest-50 dark:bg-forest-900 rounded-lg animate-pulse"
        aria-busy="true"
      >
        <p className="text-forest-500 dark:text-forest-400">Loading chart...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        style={{ width, height }} 
        className="flex items-center justify-center bg-forest-50 dark:bg-forest-900 rounded-lg"
        role="alert"
      >
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">Failed to load chart</p>
          <p className="text-sm text-forest-700 dark:text-forest-300">{error}</p>
        </div>
      </div>
    );
  }
  
  // Base chart options that match the platform style
  const baseOptions: Highcharts.Options = {
    accessibility: { enabled: false },
    exporting: { enabled: false },
    chart: {
      type: chartType,
      animation: true,
      backgroundColor: 'transparent',
      style: {
        fontFamily: 'Raleway, sans-serif',
      },
      spacing: [10, 10, 15, 10],
      reflow: true,
    },
    title: title ? {
      text: title,
      style: {
        fontSize: '16px',
        fontWeight: '700',
      }
    } : undefined,
    subtitle: subtitle ? {
      text: subtitle,
      style: {
        fontSize: '13px',
        color: theme === 'dark' ? '#CDD8D3' : '#5A6462',
      }
    } : undefined,
    credits: {
      enabled: false,
    },
    legend: {
      enabled: true,
      itemStyle: {
        color: theme === 'dark' ? '#CDD8D3' : '#293332',
        fontWeight: '500',
        fontSize: '12px',
      },
      itemHoverStyle: {
        color: theme === 'dark' ? '#FFFFFF' : '#000000',
      },
    },
    tooltip: {
      backgroundColor: theme === 'dark' ? '#2A3433EE' : '#EAECEBEE',
      borderWidth: 0,
      borderRadius: 10,
      shadow: true,
      style: {
        color: theme === 'dark' ? '#CDD8D3' : '#293332',
        fontSize: '12px',
        fontFamily: 'Raleway, sans-serif',
      },
      useHTML: true,
    },
    xAxis: {
      labels: {
        style: {
          color: theme === 'dark' ? '#CDD8D3' : '#293332',
          fontSize: '10px',
        },
      },
      gridLineColor: theme === 'dark' ? 'rgba(215, 223, 222, 0.11)' : 'rgba(41, 51, 50, 0.11)',
      lineColor: theme === 'dark' ? 'rgba(215, 223, 222, 0.33)' : 'rgba(41, 51, 50, 0.33)',
      tickColor: theme === 'dark' ? 'rgba(215, 223, 222, 0.33)' : 'rgba(41, 51, 50, 0.33)',
    },
    yAxis: {
      labels: {
        style: {
          color: theme === 'dark' ? '#CDD8D3' : '#293332',
          fontSize: '10px',
        },
      },
      gridLineColor: theme === 'dark' ? 'rgba(215, 223, 222, 0.11)' : 'rgba(41, 51, 50, 0.11)',
    },
    plotOptions: {
      series: {
        animation: true,
        states: {
          hover: {
            enabled: true,
            brightness: 0.1,
          },
          inactive: {
            opacity: 0.6,
          },
        },
      },
      line: {
        marker: {
          enabled: false,
          radius: 3,
          states: {
            hover: {
              enabled: true,
              radius: 4,
            },
          },
        },
      },
      area: {
        fillOpacity: 0.3,
        marker: {
          enabled: false,
        },
      },
      column: {
        borderRadius: 3,
        borderWidth: 0,
      },
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        borderWidth: 0,
        borderRadius: 5,
        dataLabels: {
          enabled: false,
        },
        showInLegend: true,
      },
    },
  };
  
  // Merge base options with user options
  const chartOptions = {
    ...baseOptions,
    chart: {
      ...baseOptions.chart,
      height,
    },
    series: data,
    ...options,
  };
  
  // Add watermark and ensure it's positioned properly
  const onChartRendered = () => {
    if (chartRef.current?.chart) {
      const chart = chartRef.current.chart;
      
      // Remove existing watermark if any
      if (chart.customWatermark) {
        chart.customWatermark.destroy();
      }
      
      // Add watermark
      chart.customWatermark = chart.renderer.image(
        '/logo-watermark.svg',
        chart.plotLeft + chart.plotWidth / 2 - 80,
        chart.plotTop + chart.plotHeight / 2 - 15,
        160,
        30
      )
      .attr({
        opacity: theme === 'dark' ? 0.2 : 0.1,
        zIndex: 0,
      })
      .add();
    }
  };
  
  return (
    <div style={{ width, height }} className="relative">
      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
        ref={chartRef}
        callback={onChartRendered}
        containerProps={{ 
          style: { width: '100%', height: '100%', borderRadius: '8px' } 
        }}
      />
      <div className="absolute bottom-[53.5%] left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-40">
        <ChartWatermark className="w-[128.67px] h-[30.67px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
      </div>
    </div>
  );
};

export default ChartWrapper;