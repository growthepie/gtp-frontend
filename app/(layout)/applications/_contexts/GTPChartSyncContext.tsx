"use client";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
  PropsWithChildren,
  useMemo,
  memo,
} from "react";
import Highcharts from "highcharts/highstock";
import { throttle } from "lodash";

// Define supported chart types
type SupportedChartType = 'pie' | 'area' | 'line';

// Simple chart update function - consolidated to a single approach
const updateChart = (chart: Highcharts.Chart, seriesName: string | null, isHover: boolean): void => {
  if (!chart?.options?.chart?.type) return;

  const chartType = chart.options.chart.type as SupportedChartType;
  
  // Expand supported chart types
  if (!['pie', 'area', 'line', 'column', 'spline', 'areaspline'].includes(chartType)) return;

  // Don't disable animation for crosshair - it can interfere with Highcharts' internal mechanisms
  try {
    if (chartType === 'pie') {
      // ... existing pie chart logic
    } else {
      // For line/area charts, ensure crosshair is preserved
      const selectedName = (chart as any).selectedSeriesName;
      
      chart.series.forEach(series => {
        let opacity = 1.0;
        
        if (isHover) {
          if (selectedName) {
            opacity = series.name === selectedName ? 1.0 : 
                     series.name === seriesName ? 0.7 : 0.2;
          } else {
            opacity = !seriesName || series.name === seriesName ? 1.0 : 0.4;
          }
        } else {
          const visible = !seriesName || series.name === seriesName;
          opacity = visible ? 1.0 : 0.2;
          (chart as any).selectedSeriesName = seriesName;
        }
        
        // Update without redraw to preserve crosshair
        series.update({
          type: series.type as SupportedChartType,
          opacity: opacity as number,
        }, false);
      });
      
      // Single redraw at the end
      chart.redraw(false); // false = don't reset crosshair
    }
  } catch (error) {
    console.warn('Chart update failed:', error);
  }
};

// Context interface
interface ChartContextValue {
  charts: Map<string, Highcharts.Chart>;
  hoveredSeriesName: string | null;
  setHoveredSeriesName: (name: string | null) => void;
  selectedSeriesName: string | null;
  setSelectedSeriesName: (name: string | null) => void;
}

const ChartContext = createContext<ChartContextValue | null>(null);

// Simplified provider that manages both hovering and selection
export const ChartSyncProvider: React.FC<PropsWithChildren> = memo(({ children }) => {
  const chartsRef = useRef(new Map<string, Highcharts.Chart>());
  const [hoveredSeriesName, setHoveredSeriesNameState] = useState<string | null>(null);
  const [selectedSeriesName, setSelectedSeriesNameState] = useState<string | null>(null);
  
  // Use throttle instead of debounce for smoother updates
  const throttledHoverUpdate = useMemo(
    () => throttle((name: string | null) => {
      setHoveredSeriesNameState(name);
      chartsRef.current.forEach(chart => updateChart(chart, name, true));
    }, 40),  // 25fps is usually sufficient for smooth animations
    []
  );
  
  useEffect(() => {
    return () => {
      throttledHoverUpdate.cancel();
    };
  }, [throttledHoverUpdate]);
  
  const setHoveredSeriesName = useCallback((name: string | null) => {
    console.log(`Setting hover to ${name} on ${chartsRef.current.size} charts`);
    if (!name) {
      throttledHoverUpdate.cancel();
      setHoveredSeriesNameState(null);
      chartsRef.current.forEach(chart => updateChart(chart, null, true));
      return;
    }
    throttledHoverUpdate(name);
  }, [throttledHoverUpdate]);
  
  const setSelectedSeriesName = useCallback((name: string | null) => {
    setSelectedSeriesNameState(name);
    chartsRef.current.forEach(chart => updateChart(chart, name, false));
  }, []);
  
  const value = useMemo(() => ({
    charts: chartsRef.current,
    hoveredSeriesName,
    setHoveredSeriesName,
    selectedSeriesName,
    setSelectedSeriesName
  }), [hoveredSeriesName, setHoveredSeriesName, selectedSeriesName, setSelectedSeriesName]);
  
  return (
    <ChartContext.Provider value={value}>
      {children}
    </ChartContext.Provider>
  );
});

ChartSyncProvider.displayName = "ChartSyncProvider";

// Simplified hook for chart components to use
export const useChartSync = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error('useChartSync must be used within a ChartSyncProvider');
  }
  
  const chartIdRef = useRef<string | null>(null);
  
  const registerChart = useCallback((chart: Highcharts.Chart) => {
    console.log(`Registering chart ${chart.container.id}`);
    const chartId = Math.random().toString(36).substring(2, 9);
    context.charts.set(chartId, chart);
    chartIdRef.current = chartId;
    
    // Apply current states on registration - but defer to next tick
    setTimeout(() => {
      if (context.hoveredSeriesName) {
        updateChart(chart, context.hoveredSeriesName, true);
      }
      if (context.selectedSeriesName) {
        updateChart(chart, context.selectedSeriesName, false);
      }
    }, 0);
    
    return chartId;
  }, [context]);
  
  const unregisterChart = useCallback(() => {
    if (chartIdRef.current) {
      context.charts.delete(chartIdRef.current);
      chartIdRef.current = null;
    }
  }, [context]);
  
  return {
    registerChart,
    unregisterChart,
    hoveredSeriesName: context.hoveredSeriesName,
    setHoveredSeriesName: context.setHoveredSeriesName,
    selectedSeriesName: context.selectedSeriesName,
    setSelectedSeriesName: context.setSelectedSeriesName
  };
};