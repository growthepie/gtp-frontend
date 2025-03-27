import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ParserFunction<T> = (value: string | null) => T;
type SerializerFunction<T> = (value: T) => string;

interface UseSearchParamStateOptions<T> {
  defaultValue: T;
  parser?: ParserFunction<T>;
  serializer?: SerializerFunction<T>;
  updateMode?: 'push' | 'replace';
  skipUrlUpdate?: boolean | ((value: T) => boolean);
}

export function useSearchParamState<T>(
  paramName: string,
  options: UseSearchParamStateOptions<T>
): [T, (value: T | ((prev: T) => T)) => void] {
  const {
    defaultValue,
    parser,
    serializer,
    updateMode = 'replace',
    skipUrlUpdate = false,
  } = options;

  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Store previous value to avoid unnecessary updates
  const prevValueRef = useRef<T | null>(null);
  
  // Initial state calculation with useMemo to avoid recalculation on rerenders
  const initialState = useMemo(() => {
    const paramValue = searchParams.get(paramName);
    if (paramValue === null) {
      return defaultValue;
    }
    return parser ? parser(paramValue) : paramValue as unknown as T;
  }, [searchParams, paramName, parser, defaultValue]);
  
  const [state, setState] = useState<T>(initialState);

  // Update state when URL changes (from external navigation)
  useEffect(() => {
    const paramValue = searchParams.get(paramName);
    
    if (paramValue === null) {
      if (JSON.stringify(defaultValue) !== JSON.stringify(state)) {
        setState(defaultValue);
      }
      return;
    }
    
    const parsedValue = parser ? parser(paramValue) : paramValue as unknown as T;
    
    // Deep comparison to avoid unnecessary state updates
    if (JSON.stringify(parsedValue) !== JSON.stringify(state)) {
      setState(parsedValue);
    }
  }, [searchParams, paramName, parser, defaultValue]);

  // Memoize the setState function to prevent it from causing rerenders
  const setStateAndUrl = useCallback((valueOrUpdater: T | ((prev: T) => T)) => {
    setState((prevState) => {
      const newValue = typeof valueOrUpdater === 'function' 
        ? (valueOrUpdater as (prev: T) => T)(prevState) 
        : valueOrUpdater;
      
      // Early return if value hasn't changed (deep comparison)
      if (JSON.stringify(prevValueRef.current) === JSON.stringify(newValue)) {
        return prevState;
      }
      
      prevValueRef.current = newValue;
      
      // Should we skip updating the URL?
      const shouldSkipUrlUpdate = typeof skipUrlUpdate === 'function'
        ? skipUrlUpdate(newValue)
        : skipUrlUpdate;
      
      if (!shouldSkipUrlUpdate) {
        const newParams = new URLSearchParams(searchParams.toString());
        
        if (newValue === defaultValue || newValue === null || newValue === undefined || 
            JSON.stringify(newValue) === JSON.stringify(defaultValue)) {
          newParams.delete(paramName);
        } else {
          const serializedValue = serializer 
            ? serializer(newValue) 
            : String(newValue);
          
          newParams.set(paramName, serializedValue);
        }
        
        // Debounce URL updates
        queueMicrotask(() => {
          if (updateMode === 'replace') {
            router.replace(`?${decodeURIComponent(newParams.toString())}`);
          } else {
            router.push(`?${decodeURIComponent(newParams.toString())}`);
          }
        });
      }
      
      return newValue;
    });
  }, [searchParams, paramName, defaultValue, serializer, updateMode, router, skipUrlUpdate]);

  // Memoize the state value to prevent unnecessary rerenders
  const memoizedState = useMemo(() => state, [state]);

  return [memoizedState, setStateAndUrl];
}

// Common parsers and serializers
export const parsers = {
  number: (value: string | null) => (value === null ? 0 : Number(value)),
  boolean: (value: string | null) => value === 'true',
  jsonArray: <T>(value: string | null): T[] => (value ? JSON.parse(value) : []),
  json: <T>(value: string | null): T => (value ? JSON.parse(value) : {} as T),
};

export const serializers = {
  number: (value: number) => String(value),
  boolean: (value: boolean) => String(value),
  jsonArray: <T>(value: T[]) => JSON.stringify(value),
  json: <T>(value: T) => JSON.stringify(value),
}; 