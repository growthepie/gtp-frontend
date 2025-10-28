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

  if (!['pie', 'area', 'line'].includes(chartType)) return;

  // Disable animation during updates for better performance
  const originalAnimation = chart.options?.chart?.animation;
  if (chart.options?.chart) {
    chart.options.chart.animation = false;
  }

  try {
    if (chartType === 'pie') {
      const series = chart.series[0];
      if (!series?.points) return;

      // Reset all points
      series.points.forEach(point => point.setState(''));

      if (seriesName) {
        const matchedPoint = series.points.find(point => point.name === seriesName);
        if (matchedPoint) {
          matchedPoint.setState('hover');
          chart.tooltip.refresh(matchedPoint);
        }
      } else {
        chart.tooltip.hide();
      }
    } else {
      // For area/line charts
      const selectedName = (chart as any).selectedSeriesName;
      let needsRedraw = false;

      chart.series.forEach(series => {
        let opacity = 1.0;
        let zIndex = 1;

        if (isHover) {
          // Hovering behavior
          if (selectedName) {
            opacity = series.name === selectedName ? 1.0 :
                     series.name === seriesName ? 0.7 : 0.2;
            zIndex = 100;
          } else {
            opacity = !seriesName || series.name === seriesName ? 1.0 : 0.2;
            zIndex = 1;
          }
        } else {
          // Selection behavior
          const visible = !seriesName || series.name === seriesName;
          opacity = visible ? 1.0 : 0.2;
          zIndex = 1;
          (chart as any).selectedSeriesName = seriesName;
        }

        // Only update if opacity actually changed
        if (series.options.opacity !== opacity) {
          series.update({
            opacity: opacity as number,
            type: chartType,
            zIndex: zIndex
          }, false);
          needsRedraw = true;
        }
      });

      // Only redraw if something changed
      if (needsRedraw) {
        chart.redraw();
      }
    }
  } finally {
    // Restore animation setting
    if (chart.options?.chart) {
      chart.options.chart.animation = originalAnimation;
    }

    // Redraw pie charts always (they don't check needsRedraw)
    if (chartType === 'pie') {
      chart.redraw();
    }
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

// Use a stable Map that persists across React StrictMode double-renders
const globalChartsMap = new Map<string, Highcharts.Chart>();

// Simplified provider that manages both hovering and selection
export const ChartSyncProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const chartsRef = useRef(globalChartsMap);
  const [hoveredSeriesName, setHoveredSeriesNameState] = useState<string | null>(null);
  const [selectedSeriesName, setSelectedSeriesNameState] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);

  // Store hover state in a ref to avoid triggering re-renders on every hover
  const hoveredSeriesNameRef = useRef<string | null>(null);

  // Use throttle with RAF batching for smoother updates
  const throttledHoverUpdate = useMemo(
    () => throttle((name: string | null) => {
      // Cancel any pending RAF
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      // Batch chart updates in a single animation frame
      rafRef.current = requestAnimationFrame(() => {
        hoveredSeriesNameRef.current = name;
        chartsRef.current.forEach(chart => updateChart(chart, name, true));
        rafRef.current = null;
      });
    }, 16),  // ~60fps for smoother animations
    []
  );
  
  useEffect(() => {
    return () => {
      throttledHoverUpdate.cancel();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [throttledHoverUpdate]);
  
  const setHoveredSeriesName = useCallback((name: string | null) => {
    if (!name) {
      throttledHoverUpdate.cancel();

      // Cancel any pending RAF
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      // Batch unhover in RAF for consistency
      rafRef.current = requestAnimationFrame(() => {
        hoveredSeriesNameRef.current = null;
        chartsRef.current.forEach(chart => {
          updateChart(chart, null, true);
        });
        rafRef.current = null;
      });
      return;
    }
    throttledHoverUpdate(name);
  }, [throttledHoverUpdate]);
  
  const setSelectedSeriesName = useCallback((name: string | null) => {
    setSelectedSeriesNameState(name);
    chartsRef.current.forEach(chart => updateChart(chart, name, false));
  }, []);
  
  // Don't memoize the charts Map - always use the current ref
  // Use refs for hover state to avoid re-renders
  const value = useMemo(() => ({
    get charts() {
      return chartsRef.current;
    },
    get hoveredSeriesName() {
      return hoveredSeriesNameRef.current;
    },
    setHoveredSeriesName,
    selectedSeriesName,
    setSelectedSeriesName
  }), [setHoveredSeriesName, selectedSeriesName, setSelectedSeriesName]);
  
  return (
    <ChartContext.Provider value={value}>
      {children}
    </ChartContext.Provider>
  );
};

// Simplified hook for chart components to use
export const useChartSync = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error('useChartSync must be used within a ChartSyncProvider');
  }
  
  const chartIdRef = useRef<string | null>(null);
  
  const registerChart = useCallback((chart: Highcharts.Chart) => {
    const chartId = Math.random().toString(36).substring(2, 9);
    context.charts.set(chartId, chart);
    chartIdRef.current = chartId;

    // Apply current states on registration
    const currentHoveredSeries = context.hoveredSeriesName;
    if (currentHoveredSeries) {
      updateChart(chart, currentHoveredSeries, true);
    }
    if (context.selectedSeriesName) {
      updateChart(chart, context.selectedSeriesName, false);
    }

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