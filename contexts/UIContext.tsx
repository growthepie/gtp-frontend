'use client';
import { createContext, useContext, useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { debounce } from 'lodash';
import Highcharts from "highcharts/highstock";

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
  isMobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  embedData: EmbedData;
  setEmbedData: (embedData: EmbedData | ((prevEmbedData: EmbedData) => EmbedData)) => void;
  isSafariBrowser: boolean;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  dragChartId: string;
  setDragChartId: (dragChartId: string) => void;
};

const UIContext = createContext<UIContextState>({
  isSidebarOpen: false,
  isMobile: false,
  isMobileSidebarOpen: false,
  toggleSidebar: () => { },
  toggleMobileSidebar: () => { },
  embedData: { width: 945, height: 638, src: "", title: "", timeframe: "absolute" },
  setEmbedData: () => { },
  isSafariBrowser: false,
  isDragging: false,
  setIsDragging: () => { },
  dragChartId: "",
  setDragChartId: () => { },
});

export const useUIContext = () => useContext(UIContext);

export const UIContextProvider = ({ children }) => {
  const [state, setState] = useState<UIContextState>({
    isSidebarOpen: false,
    isMobile: false,
    isMobileSidebarOpen: false,
    toggleSidebar: () => { },
    toggleMobileSidebar: () => { },
    embedData: { width: 945, height: 638, src: "", title: "", timeframe: "absolute" },
    setEmbedData: () => { },
    isSafariBrowser: false,
    isDragging: false,
    setIsDragging: () => { },
    dragChartId: "",
    setDragChartId: () => { },
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



    setState(prevState => ({
      ...prevState,
      isSafariBrowser: isSafari,
      isSidebarOpen: window.innerWidth >= 1280,
      isMobile: isMobileSize,
      lastWindowWidth: window.innerWidth,
    }));

    // Handle resize events
    const updateSize = () => {
      // const currentWidth = window.innerWidth;
      // const isExpanding = currentWidth > prevWindowWidthRef.current;
      // setState(prevState => ({
      //   ...prevState,
      //   isSidebarOpen: !state.isSidebarOpen && currentWidth >= 1280 && !isExpanding ? false : currentWidth >= 1280,
      //   isMobile: window.innerWidth < 768,
      // }));

      // prevWindowWidthRef.current = currentWidth;
      const currentWidth = window.innerWidth;
      const isExpanding = currentWidth > prevWindowWidthRef.current;
      
      setState(prevState => {
        const newIsMobile = currentWidth < 768;
        const newIsSidebarOpen = currentWidth >= 1280 
          ? !isExpanding || prevState.isSidebarOpen 
          : false;

        // Only update if values actually changed
        if (
          prevState.isMobile === newIsMobile &&
          prevState.isSidebarOpen === newIsSidebarOpen
        ) return prevState;

        return {
          ...prevState,
          isSidebarOpen: newIsSidebarOpen,
          isMobile: newIsMobile,
        };
      });
      
      prevWindowWidthRef.current = currentWidth;
    };

    
    const debouncedUpdateSize = debounce(updateSize, 100);
    const onWindowResize = () => {
      prevWindowWidthRef.current = window.innerWidth;
      debouncedUpdateSize();
    };

    window.addEventListener('resize', onWindowResize);
    return () => {
      window.removeEventListener('resize', onWindowResize);
      debouncedUpdateSize.cancel();
    };
  }, []);

  useEffect(() => {
    // find content-panel
    const contentPanel = document.getElementById("content-panel");
    if (state.isMobileSidebarOpen && state.isMobile) {
      // Prevent scrolling when mobile sidebar is open
      if (contentPanel)
        contentPanel.style.touchAction = "none";
      document.body.style.touchAction = "none";
      document.body.style.overflow = "hidden";
    } else {
      //document.body.style.overflow = "auto";
      if (contentPanel)
        contentPanel.style.touchAction = "auto";
      document.body.style.touchAction = "auto";
      document.body.style.overflow = "auto";
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