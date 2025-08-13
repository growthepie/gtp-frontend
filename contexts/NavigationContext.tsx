"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextType {
  previousPath: string | null;
  navigationHistory: string[];
  canGoBack: boolean;
  getPreviousPath: () => string | null;
}

const NavigationContext = createContext<NavigationContextType>({
  previousPath: null,
  navigationHistory: [],
  canGoBack: false,
  getPreviousPath: () => null,
});

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const pathname = usePathname();
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  useEffect(() => {
    // Don't add the same path consecutively
    if (navigationHistory[navigationHistory.length - 1] !== pathname) {
      setNavigationHistory(prev => {
        const newHistory = [...prev, pathname];
        // Keep only last 10 entries to prevent memory issues
        if (newHistory.length > 10) {
          return newHistory.slice(-10);
        }
        return newHistory;
      });

      // Set previous path
      if (navigationHistory.length > 0) {
        setPreviousPath(navigationHistory[navigationHistory.length - 1]);
      }
    }
  }, [pathname, navigationHistory]);

  const getPreviousPath = () => {
    if (navigationHistory.length >= 2) {
      return navigationHistory[navigationHistory.length - 2];
    }
    return null;
  };

  const canGoBack = navigationHistory.length > 1;

  return (
    <NavigationContext.Provider 
      value={{
        previousPath,
        navigationHistory,
        canGoBack,
        getPreviousPath,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}