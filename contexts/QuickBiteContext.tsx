'use client';

import React, { createContext, useState, useContext, useMemo } from 'react';

// Define the shape of the context state
interface QuickBiteState {
  [key: string]: any;
}

// Define the shape of the context value
interface QuickBiteContextType {
  sharedState: QuickBiteState;
  setSharedState: (key: string, value: any) => void;
}

// Create the context with a default value
const QuickBiteContext = createContext<QuickBiteContextType | null>(null);

// Create the provider component
export const QuickBiteProvider = ({ children }: { children: React.ReactNode }) => {
  const [sharedState, setSharedStateInternal] = useState<QuickBiteState>({});

  const setSharedState = (key: string, value: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`QuickBite state update: ${key} =`, value);
    }
    setSharedStateInternal(prevState => ({
      ...prevState,
      [key]: value,
    }));
  };

  const contextValue = useMemo(() => ({
    sharedState,
    setSharedState,
  }), [sharedState]);

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
