'use client';
import { createContext, useContext, useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";

export type EmbedData = {
  width: number;
  height: number;
  src: string;
  title: string;
  timeframe: "absolute" | "relative";
  zoomed?: boolean;
};

type UIContextState = {
  isSidebarOpen: boolean;
  isMobile: boolean;
  is2XL: boolean;
  isMobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  embedData: EmbedData;
  setEmbedData: (embedData: EmbedData | ((prevEmbedData: EmbedData) => EmbedData)) => void;
  isSafariBrowser: boolean;
};

const UIContext = createContext<UIContextState>({
  isSidebarOpen: false,
  isMobile: false,
  is2XL: false,
  isMobileSidebarOpen: false,
  toggleSidebar: () => { },
  toggleMobileSidebar: () => { },
  embedData: { width: 945, height: 638, src: "", title: "", timeframe: "absolute" },
  setEmbedData: () => { },
  isSafariBrowser: false,
});

export const useUIContext = () => useContext(UIContext);

export const UIContextProvider = ({ children }) => {
  const [state, setState] = useState<UIContextState>({
    isSidebarOpen: false,
    isMobile: false,
    is2XL: false,
    isMobileSidebarOpen: false,
    toggleSidebar: () => { },
    toggleMobileSidebar: () => { },
    embedData: { width: 945, height: 638, src: "", title: "", timeframe: "absolute" },
    setEmbedData: () => { },
    isSafariBrowser: false,
  });

  const prevWindowWidthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 0);

  const setEmbedData = (newEmbedData: EmbedData | ((prevEmbedData: EmbedData) => EmbedData)) => {
    setState((prevState) => ({
      ...prevState,
      embedData: typeof newEmbedData === 'function' ? newEmbedData(prevState.embedData) : newEmbedData,
    }));
  }




  useEffect(() => {
    // This effect will run only in the browser, where window is defined.
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isMobileSize = window.innerWidth < 768;
    const isExtraLarge = window.innerWidth >= 1536;



    setState(prevState => ({
      ...prevState,
      isSafariBrowser: isSafari,
      isSidebarOpen: window.innerWidth >= 1280,
      isMobile: isMobileSize,
      is2XL: isExtraLarge,
      lastWindowWidth: window.innerWidth,
    }));

    // Handle resize events
    const updateSize = () => {
      const currentWidth = window.innerWidth;
      const isExpanding = currentWidth > prevWindowWidthRef.current;
      setState(prevState => ({
        ...prevState,
        isSidebarOpen: !state.isSidebarOpen && currentWidth >= 1280 && !isExpanding ? false : currentWidth >= 1280,
        isMobile: window.innerWidth < 768,
        is2XL: window.innerWidth >= 1536,
      }));

      prevWindowWidthRef.current = currentWidth;
    };

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (state.isMobileSidebarOpen && state.isMobile) {
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowY = "auto";
    }
  }, [state.isMobileSidebarOpen, state.isMobile]);

  const toggleSidebar = () => setState(prevState => ({ ...prevState, isSidebarOpen: !prevState.isSidebarOpen }));
  const toggleMobileSidebar = () => setState(prevState => ({ ...prevState, isMobileSidebarOpen: !prevState.isMobileSidebarOpen }));

  const contextValue = {
    ...state,
    toggleSidebar,
    toggleMobileSidebar,
    setEmbedData,
  };

  useEffect(() => {
    // Checking whether we're in the browser
    const isSafari = typeof navigator !== 'undefined' ? /^((?!chrome|android).)*safari/i.test(navigator.userAgent) : false;

    setState(prevState => ({
      ...prevState,
      isSafariBrowser: isSafari,
    }));
  }, []);

  return <UIContext.Provider value={contextValue}>{children}</UIContext.Provider>;
};
