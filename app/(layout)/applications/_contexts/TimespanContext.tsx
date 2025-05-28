"use client";
import { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useMemo, 
  useTransition,
  ReactNode
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// Define types
type Timespan = {
  label: string;
  shortLabel: string;
  value: number;
};

type TimespanMap = {
  [key: string]: Timespan;
};

export type TimespanContextType = {
  selectedTimespan: string;
  setSelectedTimespan: (value: string) => void;
  isMonthly: boolean;
  setIsMonthly: (value: boolean) => void;
  timespans: TimespanMap;
};

export const TimespanContext = createContext<TimespanContextType | undefined>(undefined);

type TimespanProviderProps = {
  children: ReactNode;
  timespans: TimespanMap;
  defaultTimespan?: string;
};

export const TimespanProvider = ({ 
  children, 
  timespans, 
  defaultTimespan = "7d" 
}: TimespanProviderProps) => {
  // Use useTransition to mark UI updates as non-urgent
  const [isPending, startTransition] = useTransition();
  const [isMonthly, setIsMonthly] = useState<boolean>(false);
  
  // Get URL utilities from Next.js
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  
  // Get the current timespan from URL or use default
  const selectedTimespanParam = searchParams.get("timespan") || defaultTimespan;
  
  // Create a memoized function to handle timespan updates
  const setSelectedTimespan = useCallback((value: string) => {
    console.log(`Setting timespan to ${value}`, selectedTimespanParam);
    if (value === selectedTimespanParam) return; // Avoid unnecessary updates
    
    startTransition(() => {
      // get existing query params
      let newSearchParams = new URLSearchParams(searchParams.toString());

      if (value === defaultTimespan) {
        newSearchParams.delete("timespan");
      } else {
        newSearchParams.set("timespan", value);
      }
    

      // create new url
      let url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;
      // Update the URL without forcing a hard navigation
      // router.replace(url, { scroll: false });
      window.history.replaceState(null, "", url);
    });
  }, [selectedTimespanParam, searchParams, defaultTimespan, pathname]);
  
  // Create the context value object only when its dependencies change
  const contextValue = useMemo(() => ({
    timespans,
    selectedTimespan: selectedTimespanParam,
    setSelectedTimespan,
    isMonthly,
    setIsMonthly,
  }), [
    timespans,
    selectedTimespanParam,
    setSelectedTimespan,
    isMonthly,
  ]);
  
  return (
    <TimespanContext.Provider value={contextValue}>
      {children}
    </TimespanContext.Provider>
  );
};

export const useTimespan = () => {
  const context = useContext(TimespanContext);
  if (context === undefined) {
    throw new Error("useTimespan must be used within a TimespanProvider");
  }
  return context;
};