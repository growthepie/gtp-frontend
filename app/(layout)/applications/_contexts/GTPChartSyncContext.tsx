"use client";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  MutableRefObject,
  createContext,
  useContext,
  PropsWithChildren,
  useMemo,
  memo,
} from "react";
import Highcharts from "highcharts/highstock";
import { debounce } from "lodash";

// Define supported chart types to avoid magic strings
type SupportedChartType = 'pie' | 'area' | 'line';

// Define chart configuration interface
interface ChartConfig {
  chart: Highcharts.Chart | null;
  getNameFromKey?: Record<string, string>;
}

const updateChart = (chart: Highcharts.Chart, seriesName: string | null): void => {
  console.log('Updating chart with series name:', seriesName);
  if (!chart?.options?.chart?.type) return;

  const chartType = chart.options.chart.type as SupportedChartType;
  console.log('Chart type:', chartType);
  
  // Early return if chart type isn't supported
  if (!['pie', 'area', 'line'].includes(chartType)) return;

  if (chartType === 'pie') {
    console.log('Handling pie chart update');
    handlePieChartUpdate(chart, seriesName);
  } else {
    console.log('Handling area/line chart update');
    handleAreaLineChartUpdate(chart, seriesName);
  }

  // chart.redraw();
};

const handlePieChartUpdate = (chart: Highcharts.Chart, seriesName: string | null): void => {
  const series = chart.series[0];
  if (!series?.points) return;

  // Reset all points
  series.points.forEach(point => point.setState(''));

  if (!seriesName) {
    chart.tooltip.hide();
    return;
  }

  const matchedPoint = series.points.find(point => point.name === seriesName);
  if (matchedPoint) {
    matchedPoint.setState('hover');
    chart.tooltip.refresh(matchedPoint);
  }
};

const handleAreaLineChartUpdate = (chart: Highcharts.Chart, seriesName: string | null): void => {
  chart.series.forEach(series => {
    const opacity = !seriesName || series.name === seriesName ? 1.0 : 0.5;
    series.update({ opacity } as Highcharts.SeriesOptionsType);
  });
};

interface GTPChartSyncConfig {
  charts: MutableRefObject<Highcharts.Chart | null>[];
  initialHoveredName?: string | null;
  debounceDelay?: number;
}

export const useGTPChartSync = ({ 
  charts, 
  initialHoveredName = null,
  debounceDelay = 150
}: GTPChartSyncConfig) => {
  const [hoveredSeriesNameState, setHoveredSeriesNameState] = useState<string | null>(initialHoveredName);

  // Create stable debounced function that won't change on every render
  const debouncedFn = useMemo(
    () => debounce((name: string | null, charts: MutableRefObject<Highcharts.Chart | null>[]) => {
      // console.log('Debounced update executing after delay:', name);
      setHoveredSeriesNameState(name);
      // charts
      //   .filter(chart => chart.current)
      //   .forEach(chart => updateChart(chart.current!, name));
    }, debounceDelay),
    [debounceDelay]
  );

  const hoveredSeriesName = useMemo(() => hoveredSeriesNameState, [hoveredSeriesNameState]);


  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedFn.cancel();
    };
  }, [debouncedFn]);

  const setHoveredSeriesName = useCallback((name: string | null) => {
    // console.log('Hover state changing to:', name);
    
    debouncedFn(name, charts);
  }, [charts, debouncedFn]);

  return {
    hoveredSeriesName,
    setHoveredSeriesName,
  };
};

interface GTPChartContextValue {
  registerChart: (chart: Highcharts.Chart) => string;
  unregisterChart: (chartId: string) => void;
  hoveredSeriesName: string | null;
  setHoveredSeriesName: (name: string | null) => void;
}

// const GTPChartContext = createContext<GTPChartContextValue | null>(null);

// export const useGTPChartContext = () => {
//   const context = useContext(GTPChartContext);
//   if (!context) {
//     throw new Error('useChartContext must be used within a ChartProvider');
//   }
//   return context;
// };

// export const GTPChartSyncProvider: React.FC<PropsWithChildren> = ({ children }) => {
//   const [hoveredSeriesNameState, setHoveredSeriesNameState] = useState<string | null>(initialHoveredName);

//   // Create stable debounced function that won't change on every render
//   const debouncedFn = useMemo(
//     () => debounce((name: string | null, charts: MutableRefObject<Highcharts.Chart | null>[]) => {
//       console.log('Debounced update executing after delay:', name);
//       setHoveredSeriesNameState(name, charts);
//       charts
//         .filter(chart => chart.current)
//         .forEach(chart => updateChart(chart.current!, name));
//     }, debounceDelay),
//     [debounceDelay]
//   );

//   const hoveredSeriesName = useMemo(() => hoveredSeriesNameState, [hoveredSeriesNameState]);


//   // Cleanup debounced function on unmount
//   useEffect(() => {
//     return () => {
//       debouncedFn.cancel();
//     };
//   }, [debouncedFn]);

//   const setHoveredSeriesName = useCallback((name: string | null) => {
//     console.log('Hover state changing to:', name);
    
//     debouncedFn(name, charts);
//   }, [charts, debouncedFn]);

//   return {
//     hoveredSeriesName,
//     setHoveredSeriesName,
//   };
// };

interface GTPChartContextValue {
  registerChart: (chart: Highcharts.Chart) => string;
  unregisterChart: (chartId: string) => void;
  hoveredSeriesName: string | null;
  setHoveredSeriesName: (name: string | null) => void;
}

const GTPChartContext = createContext<GTPChartContextValue | null>(null);

export const useGTPChartContext = () => {
  const context = useContext(GTPChartContext);
  if (!context) {
    throw new Error('useChartContext must be used within a ChartProvider');
  }
  return context;
};

export const GTPChartSyncProvider: React.FC<PropsWithChildren> = memo(({ children }) => {
  // Store charts in a Map to maintain order and allow easy removal
  const chartsRef = useRef(new Map<string, Highcharts.Chart>());
  
  // Create stable mutable refs array
  const chartsMutableRef = useRef<MutableRefObject<Highcharts.Chart | null>[]>([]);

  // Helper function to update the chartRefsArray
  const updateChartRefsArray = useCallback(() => {
    const charts = Array.from(chartsRef.current.values());
    chartsMutableRef.current = charts.map(chart => ({ current: chart }));
  }, []);

  // const { hoveredSeriesName, setHoveredSeriesName } = useGTPChartSync({
  //   charts: chartsMutableRef.current,
  //   initialHoveredName: null,
  //   debounceDelay: 0,
  // });

  const registerChart = useCallback((chart: Highcharts.Chart): string => {
    const chartId = generateChartId();
    chartsRef.current.set(chartId, chart);
    updateChartRefsArray();
    return chartId;
  }, [updateChartRefsArray]);

  const unregisterChart = useCallback((chartId: string): void => {
    chartsRef.current.delete(chartId);
    updateChartRefsArray();
  }, [updateChartRefsArray]);



  // const value = useMemo(() => ({
  //   registerChart,
  //   unregisterChart,
  //   hoveredSeriesName,
  //   setHoveredSeriesName,
  // }), [registerChart, unregisterChart, hoveredSeriesName, setHoveredSeriesName]);
  // // Store charts in a Map to maintain order and allow easy removal
  // const chartsRef = useRef(new Map<string, Highcharts.Chart>());
  
  // // Create stable mutable refs array
  // const chartsMutableRef = useRef<MutableRefObject<Highcharts.Chart | null>[]>([]);

  // // Helper function to update the chartRefsArray
  // const updateChartRefsArray = useCallback(() => {
  //   const charts = Array.from(chartsRef.current.values());
  //   chartsMutableRef.current = charts.map(chart => ({ current: chart }));
  // }, []);

  const initialHoveredName = null;
  const debounceDelay = 150;

  const [hoveredSeriesNameState, setHoveredSeriesNameState] = useState<string | null>(initialHoveredName);

  // Create stable debounced function that won't change on every render
  const debouncedFn = useMemo(
    () => debounce((name: string | null, charts: MutableRefObject<Highcharts.Chart | null>[]) => {
      console.log('Debounced update executing after delay:', name, charts);
      setHoveredSeriesNameState(name);
      
      charts
        .filter(chart => chart.current)
        .forEach(chart => updateChart(chart.current!, name));
    }, debounceDelay),
    [debounceDelay]
  );

  const hoveredSeriesName = useMemo(() => hoveredSeriesNameState, [hoveredSeriesNameState]);


  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedFn.cancel();
    };
  }, [debouncedFn]);

  const setHoveredSeriesName = useCallback((name: string | null) => {
    if(hoveredSeriesNameState === name){
      debouncedFn.cancel();
      return;
    }
    console.log('Hover state changing to!:', name);
    
    debouncedFn(name, chartsMutableRef.current);
  }, [debouncedFn, hoveredSeriesNameState]);

  // // const registerChart = useCallback((chart: Highcharts.Chart): string => {
  // //   const chartId = generateChartId();
  // //   chartsRef.current.set(chartId, chart);
  // //   updateChartRefsArray();
  // //   return chartId;
  // // }, [updateChartRefsArray]);

  // // const unregisterChart = useCallback((chartId: string): void => {
  // //   chartsRef.current.delete(chartId);
  // //   updateChartRefsArray();
  // // }, [updateChartRefsArray]);



  const value = useMemo(() => ({
    registerChart,
    unregisterChart,
    hoveredSeriesName,
    setHoveredSeriesName,
  }), [registerChart, unregisterChart, hoveredSeriesName, setHoveredSeriesName]);
  
  return (
    <GTPChartContext.Provider value={value}>
      {children}
    </GTPChartContext.Provider>
  );
});

GTPChartSyncProvider.displayName = "GTPChartSyncProvider";

// Helper hook for individual charts to use
export const useGTPChartSyncProvider = () => {
  const { registerChart, unregisterChart, hoveredSeriesName, setHoveredSeriesName } = useGTPChartContext();
  const chartIdRef = useRef<string | null>(null);

  const handleChartCreated = useCallback((chart: Highcharts.Chart) => {
    console.log('Chart created:', chart);
    chartIdRef.current = registerChart(chart);
  }, [registerChart]);

  const handleChartDestroyed = useCallback(() => {
    console.log('Chart destroyed:', chartIdRef.current);
    if (chartIdRef.current) {
      unregisterChart(chartIdRef.current);
      chartIdRef.current = null;
    }
  }, [unregisterChart]);

  return {
    onChartCreated: handleChartCreated,
    onChartDestroyed: handleChartDestroyed,
    hoveredSeriesName,
    setHoveredSeriesName,
  };
};

// Utility function to generate unique chart IDs
const generateChartId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};