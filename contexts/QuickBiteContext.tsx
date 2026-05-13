'use client';

import React, { createContext, useState, useContext, useMemo, useCallback, startTransition } from 'react';

// Define the shape of the context state
interface QuickBiteState {
  [key: string]: any;
}

// Define the shape of the context value
interface QuickBiteContextType {
  sharedState: QuickBiteState;
  setSharedState: (key: string, value: any) => void;
  exclusiveFilterKeys: FilterKeys;
  setExclusiveFilterKeys: (keys: FilterKeys) => void;
  inclusiveFilterKeys: FilterKeys;
  setInclusiveFilterKeys: (keys: FilterKeys) => void;
}

interface FilterKeys {
  categoryKey: null | string;
  valueKey: null | string;
}

// Create the context with a default value
const QuickBiteContext = createContext<QuickBiteContextType | null>(null);

// Create the provider component
export const QuickBiteProvider = ({
  children,
  initialSharedState = {},
}: {
  children: React.ReactNode;
  initialSharedState?: QuickBiteState;
}) => {
  const [sharedState, setSharedStateInternal] = useState<QuickBiteState>(initialSharedState);
  const [exclusiveFilterKeys, setExclusiveFilterKeysInternal] = useState<FilterKeys>({ categoryKey: null, valueKey: null });
  const [inclusiveFilterKeys, setInclusiveFilterKeysInternal] = useState<FilterKeys>({ categoryKey: null, valueKey: null });

  const setSharedState = useCallback((key: string, value: any) => {
    startTransition(() => {
      setSharedStateInternal(prevState => {
        if (Object.is(prevState[key], value)) {
          return prevState;
        }

        return {
          ...prevState,
          [key]: value,
        };
      });
    });
  }, []);

  const setExclusiveFilterKeys = useCallback((keys: FilterKeys) => {
    startTransition(() => {
      setExclusiveFilterKeysInternal((prevKeys) => {
        if (
          prevKeys.categoryKey === keys.categoryKey &&
          prevKeys.valueKey === keys.valueKey
        ) {
          return prevKeys;
        }

        return keys;
      });
    });
  }, []);

  const setInclusiveFilterKeys = useCallback((keys: FilterKeys) => {
    startTransition(() => {
      setInclusiveFilterKeysInternal((prevKeys) => {
        if (
          prevKeys.categoryKey === keys.categoryKey &&
          prevKeys.valueKey === keys.valueKey
        ) {
          return prevKeys;
        }

        return keys;
      });
    });
  }, []);

  const contextValue = useMemo(() => ({
    sharedState,
    setSharedState,
    exclusiveFilterKeys,
    setExclusiveFilterKeys,
    inclusiveFilterKeys,
    setInclusiveFilterKeys,
  }), [sharedState, setSharedState, exclusiveFilterKeys, setExclusiveFilterKeys, inclusiveFilterKeys, setInclusiveFilterKeys]);

  return (
    <QuickBiteContext.Provider value={contextValue}>
      {children}
    </QuickBiteContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useQuickBite = () => {
  const context = useContext(QuickBiteContext);
  if (!context) {
    throw new Error('useQuickBite must be used within a QuickBiteProvider');
  }
  return context;
};
