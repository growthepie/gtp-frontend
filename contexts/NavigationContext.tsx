"use client";
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
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

function restoreAfterLayout(savedScroll: number, retries = 5) {
  if (retries === 0) return;
  requestAnimationFrame(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll >= savedScroll || retries === 1) {
      window.scrollTo(0, savedScroll);
    } else {
      restoreAfterLayout(savedScroll, retries - 1);
    }
  });
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [pathname, setPathname] = useState<string | null>(null);
  const [usedBrowserBackButton, setUsedBrowserBackButton] = useState(false);

  const handlePathChange = useCallback((nextPath: string) => {
    setPathname(nextPath);
  }, []);

  const handleBrowserBackNavigation = useCallback(() => {
    setUsedBrowserBackButton(true);
  }, []);

  useEffect(() => {
    if (!pathname) return;

    setNavigationHistory(prev => {
      if (prev[prev.length - 1] === pathname) {
        return prev;
      }

      const updatedHistory = [...prev, pathname];
      if (updatedHistory.length > 10) {
        return updatedHistory.slice(-10);
      }
      return updatedHistory;
    });
  }, [pathname]);

  useEffect(() => {
    if (navigationHistory.length >= 2) {
      setPreviousPath(navigationHistory[navigationHistory.length - 2]);
    } else {
      setPreviousPath(null);
    }
  }, [navigationHistory]);

  useEffect(() => {
    if (!pathname) return;

    // scroll position for routes
    const handleScroll = () => {
      const SCROLL_POS_KEY = `scrollPos-${pathname}`;
      const GO_BACK_SCROLL_POS_PATHNAME_KEY = `goBack-scrollPos-pathname`;
      const GO_BACK_SCROLL_POS_PATHNAME = sessionStorage.getItem(GO_BACK_SCROLL_POS_PATHNAME_KEY);
      console.log("[NavigationContext::handleScroll] Handling scroll", `pathname: ${pathname}, GO_BACK_SCROLL_POS_PATHNAME: ${GO_BACK_SCROLL_POS_PATHNAME}, SCROLL_POS_KEY: ${SCROLL_POS_KEY}`);
      if(GO_BACK_SCROLL_POS_PATHNAME === SCROLL_POS_KEY) {
        console.log("[NavigationContext::handleScroll] Go back scroll key is the same as the current scroll key, skipping scroll position save", GO_BACK_SCROLL_POS_PATHNAME, SCROLL_POS_KEY);
        return;
      }
      sessionStorage.setItem(SCROLL_POS_KEY, window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  useEffect(() => {
    if (!pathname) return;

    // restore scroll position for routes
    const restoreScroll = () => {
      console.log("[NavigationContext::restoreScroll] Restoring scroll position for route", `pathname: ${pathname}`);
      const GO_BACK_SCROLL_POS_PATHNAME_KEY = `goBack-scrollPos-pathname`;
      const GO_BACK_SCROLL_POS_PATHNAME = sessionStorage.getItem(GO_BACK_SCROLL_POS_PATHNAME_KEY);

      if(GO_BACK_SCROLL_POS_PATHNAME === `scrollPos-${pathname}`) {
        console.log("[NavigationContext::restoreScroll] (GO_BACK_SCROLL_POS_PATHNAME === `scrollPos-${pathname}`) Restoring scroll position for route", `GO_BACK_SCROLL_POS_PATHNAME: ${GO_BACK_SCROLL_POS_PATHNAME}`);
        const savedScroll = sessionStorage.getItem(GO_BACK_SCROLL_POS_PATHNAME);
        if (!savedScroll) return;
        console.log("[NavigationContext::restoreScroll] (GO_BACK_SCROLL_POS_PATHNAME === `scrollPos-${pathname}`) Restoring scroll position for route", `savedScroll: ${savedScroll}`);
        restoreAfterLayout(parseInt(savedScroll));

        // remove the goBack-scrollPos-key session storage key
        sessionStorage.removeItem(GO_BACK_SCROLL_POS_PATHNAME_KEY);
        return;
      }

      // check if the user used the browser back button
      if(usedBrowserBackButton) {
        const savedScroll = sessionStorage.getItem(`scrollPos-${pathname}`);
        if (!savedScroll) return;
        console.log("[NavigationContext::restoreScroll] (USED_BROWSER_BACK_BUTTON) Restoring scroll position for route", `savedScroll: ${savedScroll}`);
        restoreAfterLayout(parseInt(savedScroll));
        sessionStorage.removeItem(GO_BACK_SCROLL_POS_PATHNAME_KEY);
        setUsedBrowserBackButton(false);
        return;
      }

      console.log("[NavigationContext::restoreScroll] No scroll position for route to restore");
    };
    restoreScroll();
  }, [pathname, usedBrowserBackButton]);

  const getPreviousPath = () => {
    if (navigationHistory.length >= 2) {
      return navigationHistory[navigationHistory.length - 2];
    }
    return null;
  };

  const canGoBack = navigationHistory.length > 1;
  const [managerReady, setManagerReady] = useState(false);

  useEffect(() => {
    setManagerReady(true);
  }, []);

  return (
    <NavigationContext.Provider 
      value={{
        previousPath,
        navigationHistory,
        canGoBack,
        getPreviousPath,
      }}
    >
      {managerReady && (
        <NavigationStateManager 
          onPathChange={handlePathChange}
          onBrowserBackNavigation={handleBrowserBackNavigation}
        />
      )}
      {children}
    </NavigationContext.Provider>
  );
}

interface NavigationStateManagerProps {
  onPathChange: (pathname: string) => void;
  onBrowserBackNavigation: () => void;
}

function NavigationStateManager({ onPathChange, onBrowserBackNavigation }: NavigationStateManagerProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      onPathChange(pathname);
    }
  }, [pathname, onPathChange]);

  useEffect(() => {
    const handlePopState = () => {
      onBrowserBackNavigation();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onBrowserBackNavigation]);

  return null;
}