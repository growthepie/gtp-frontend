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

// Batch coordinator to prevent race conditions when multiple params update simultaneously
const pendingUpdates = new Map<string, {
  value: any;
  defaultValue: any;
  serializer?: SerializerFunction<any>;
  skipUrlUpdate?: boolean | ((value: any) => boolean);
}>();
let batchTimer: NodeJS.Timeout | null = null;
let routerContext: { router: any; pathname: string; searchParams: URLSearchParams; mode: 'push' | 'replace' } | null = null;

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

// Add this after safeParser function

function flushBatchedUpdates() {
  if (pendingUpdates.size === 0 || !routerContext) {
    return;
  }

  const { router, pathname, searchParams, mode } = routerContext;
  const newParams = new URLSearchParams(searchParams.toString());
  let hasChanges = false;

  pendingUpdates.forEach((update, paramName) => {
    const shouldSkip = typeof update.skipUrlUpdate === 'function'
      ? update.skipUrlUpdate(update.value)
      : update.skipUrlUpdate;

    if (shouldSkip) return;

    if (shallowEqual(update.value, update.defaultValue) || update.value === null || update.value === undefined) {
      if (newParams.has(paramName)) {
        newParams.delete(paramName);
        hasChanges = true;
      }
    } else {
      try {
        const serialized = update.serializer ? update.serializer(update.value) : String(update.value);
        if (newParams.get(paramName) !== serialized) {
          newParams.set(paramName, serialized);
          hasChanges = true;
        }
      } catch (error) {
        console.warn(`Failed to serialize search param:`, error);
      }
    }
  });

  pendingUpdates.clear();

  if (hasChanges) {
    const newUrl = newParams.toString() ? `${pathname}?${newParams}` : pathname;
    const scrollY = window.scrollY;
    
    if (mode === 'replace') {
      router.replace(newUrl, { scroll: false });
    } else {
      router.push(newUrl, { scroll: false });
    }
    
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
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
    // Update router context
    routerContext = { router, pathname, searchParams, mode: updateMode };
    
    // Queue this update
    pendingUpdates.set(paramName, {
      value: newValue,
      defaultValue,
      serializer,
      skipUrlUpdate,
    });
    
    // Schedule batch flush
    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = setTimeout(() => {
      flushBatchedUpdates();
      batchTimer = null;
    }, debounceMs);
    
    lastUrlValueRef.current = newValue;
  }, [router, pathname, searchParams, updateMode, paramName, defaultValue, serializer, skipUrlUpdate, debounceMs]);

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
      // delete the pending update for this param
      pendingUpdates.delete(paramName);
    };
  }, [paramName]);

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