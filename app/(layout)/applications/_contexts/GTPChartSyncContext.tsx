"use client";
import {
  useState,
  useCallback,
  useRef,
  createContext,
  useContext,
  PropsWithChildren,
  useMemo,
} from "react";

// Context interface
interface ChartContextValue {
  hoveredSeriesName: string | null;
  setHoveredSeriesName: (name: string | null) => void;
  selectedSeriesName: string | null;
  setSelectedSeriesName: (name: string | null) => void;
}

const ChartContext = createContext<ChartContextValue | null>(null);

// Shares the hovered and selected series between the application detail page's components
export const ChartSyncProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [selectedSeriesName, setSelectedSeriesNameState] = useState<string | null>(null);

  // Store hover state in a ref to avoid triggering re-renders on every hover
  const hoveredSeriesNameRef = useRef<string | null>(null);

  const setHoveredSeriesName = useCallback((name: string | null) => {
    hoveredSeriesNameRef.current = name;
  }, []);

  const setSelectedSeriesName = useCallback((name: string | null) => {
    setSelectedSeriesNameState(name);
  }, []);

  // Use refs for hover state to avoid re-renders
  const value = useMemo(() => ({
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

export const useChartSync = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error('useChartSync must be used within a ChartSyncProvider');
  }

  return {
    hoveredSeriesName: context.hoveredSeriesName,
    setHoveredSeriesName: context.setHoveredSeriesName,
    selectedSeriesName: context.selectedSeriesName,
    setSelectedSeriesName: context.setSelectedSeriesName
  };
};
