import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ParserFunction<T> = (value: string | null) => T;
type SerializerFunction<T> = (value: T) => string;

interface UseSearchParamStateOptions<T> {
  defaultValue: T;
  parser?: ParserFunction<T>;
  serializer?: SerializerFunction<T>;
  updateMode?: 'push' | 'replace';
  skipUrlUpdate?: boolean | ((value: T) => boolean);
  debounceMs?: number;
}

// Optimized shallow equality check for primitive types and simple objects
function shallowEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  
  // For arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }
  
  // For objects - only check first level
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => (a as any)[key] === (b as any)[key]);
}

// Safe parser wrapper
function safeParser<T>(parser: ParserFunction<T> | undefined, value: string | null, defaultValue: T): T {
  if (!parser) return value as unknown as T;
  
  try {
    return parser(value);
  } catch (error) {
    console.warn(`Failed to parse search param value "${value}":`, error);
    return defaultValue;
  }
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
    debounceMs = 300, // Increased default debounce
  } = options;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Use refs to track values and avoid stale closures
  const lastUrlValueRef = useRef<T | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<T | null>(null);
  const lastSerializedRef = useRef<string | null>(null);
  
  // Parse initial value from URL
  const parseUrlValue = useCallback(() => {
    const paramValue = searchParams.get(paramName);
    return paramValue === null 
      ? defaultValue 
      : safeParser(parser, paramValue, defaultValue);
  }, [searchParams, paramName, parser, defaultValue]);
  
  const [state, setState] = useState<T>(() => {
    const initial = parseUrlValue();
    lastUrlValueRef.current = initial;
    return initial;
  });

  // Debounced URL update function
  const updateUrl = useCallback((newValue: T) => {
    // Clear any pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Store the pending value
    pendingValueRef.current = newValue;
    
    updateTimeoutRef.current = setTimeout(() => {
      // Check if this value is still the most recent
      if (!shallowEqual(pendingValueRef.current, newValue)) {
        return;
      }
      
      const shouldSkipUrlUpdate = typeof skipUrlUpdate === 'function'
        ? skipUrlUpdate(newValue)
        : skipUrlUpdate;
      
      if (shouldSkipUrlUpdate) {
        pendingValueRef.current = null;
        return;
      }
      
      const newParams = new URLSearchParams(searchParams.toString());
      
      // Remove param if value equals default
      if (shallowEqual(newValue, defaultValue) || 
          newValue === null || 
          newValue === undefined) {
        newParams.delete(paramName);
      } else {
        try {
          const serializedValue = serializer 
            ? serializer(newValue) 
            : String(newValue);
          
          // Check if the serialized value has actually changed
          const currentSerialized = searchParams.get(paramName);
          if (currentSerialized === serializedValue) {
            pendingValueRef.current = null;
            return;
          }
          
          newParams.set(paramName, serializedValue);
          lastSerializedRef.current = serializedValue;
        } catch (error) {
          console.warn(`Failed to serialize search param value:`, error);
          pendingValueRef.current = null;
          return;
        }
      }
      
      // Construct the full URL with the pathname
      const newQueryString = newParams.toString();
      const newUrl = newQueryString ? `${pathname}?${newQueryString}` : pathname;
      
      // Store scroll position
      const scrollY = window.scrollY;
      
      // Update lastUrlValueRef BEFORE navigation
      lastUrlValueRef.current = newValue;
      
      // Perform navigation
      if (updateMode === 'replace') {
        router.replace(newUrl, { scroll: false });
      } else {
        router.push(newUrl, { scroll: false });
      }
      
      // Clear pending value
      pendingValueRef.current = null;
      
      // Restore scroll position
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }, debounceMs);
  }, [
    pathname,
    searchParams, 
    paramName, 
    defaultValue, 
    serializer, 
    updateMode, 
    router, 
    skipUrlUpdate, 
    debounceMs
  ]);

  // Sync state with URL changes (only from external navigation)
  useEffect(() => {
    const newUrlValue = parseUrlValue();
    
    // Check if we have a pending update for this value
    if (pendingValueRef.current !== null && shallowEqual(pendingValueRef.current, newUrlValue)) {
      return;
    }
    
    // Only update if the URL value actually changed from what we last knew
    if (!shallowEqual(lastUrlValueRef.current, newUrlValue)) {
      lastUrlValueRef.current = newUrlValue;
      
      // Only update state if it's different from current state
      if (!shallowEqual(state, newUrlValue)) {
        setState(newUrlValue);
      }
    }
  }, [searchParams, parseUrlValue]); // Removed 'state' dependency

  // Memoized setter function
  const setStateAndUrl = useCallback((valueOrUpdater: T | ((prev: T) => T)) => {
    setState((prevState) => {
      const newValue = typeof valueOrUpdater === 'function' 
        ? (valueOrUpdater as (prev: T) => T)(prevState) 
        : valueOrUpdater;
      
      // Early return if value hasn't changed
      if (shallowEqual(prevState, newValue)) {
        return prevState;
      }
      
      // Update URL asynchronously
      updateUrl(newValue);
      
      return newValue;
    });
  }, [updateUrl]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return [state, setStateAndUrl];
}

// Parsers and serializers
export const parsers = {
  number: (value: string | null): number => {
    if (value === null) return 0;
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  },
  
  boolean: (value: string | null): boolean => {
    return value === 'true';
  },
  
  jsonArray: <T>(value: string | null): T[] => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  
  json: <T>(value: string | null, fallback = {} as T): T => {
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  },
  
  stringArray: (value: string | null): string[] => {
    return value ? value.split(',').filter(Boolean) : [];
  },
};

export const serializers = {
  number: (value: number): string => String(value),
  boolean: (value: boolean): string => String(value),
  jsonArray: <T>(value: T[]): string => JSON.stringify(value),
  json: <T>(value: T): string => JSON.stringify(value),
  stringArray: (value: string[]): string => value.join(','),
};

// Type-safe hook variants for common use cases
export function useSearchParamBoolean(
  paramName: string, 
  defaultValue: boolean = false,
  options?: Omit<UseSearchParamStateOptions<boolean>, 'defaultValue' | 'parser' | 'serializer'>
) {
  return useSearchParamState(paramName, {
    defaultValue,
    parser: parsers.boolean,
    serializer: serializers.boolean,
    ...options,
  });
}

export function useSearchParamNumber(
  paramName: string, 
  defaultValue: number = 0,
  options?: Omit<UseSearchParamStateOptions<number>, 'defaultValue' | 'parser' | 'serializer'>
) {
  return useSearchParamState(paramName, {
    defaultValue,
    parser: parsers.number,
    serializer: serializers.number,
    ...options,
  });
}

export function useSearchParamStringArray(
  paramName: string, 
  defaultValue: string[] = [],
  options?: Omit<UseSearchParamStateOptions<string[]>, 'defaultValue' | 'parser' | 'serializer'>
) {
  return useSearchParamState(paramName, {
    defaultValue,
    parser: parsers.stringArray,
    serializer: serializers.stringArray,
    ...options,
  });
}