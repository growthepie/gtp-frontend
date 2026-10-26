'use client';

import { useEffect, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { debounce } from "lodash";
import { create } from "zustand";

export const MOBILE_BREAKPOINT = 768;
export const SIDEBAR_OPEN_BREAKPOINT = 1440;

export type EmbedData = {
  width: number;
  height: number;
  src: string;
  title: string;
  timeframe: "absolute" | "relative";
  zoomed?: boolean;
};

type Updater<T> = T | ((prevState: T) => T);

const resolveState = <T,>(value: Updater<T>, previous: T): T =>
  typeof value === "function" ? (value as (prev: T) => T)(previous) : value;

const defaultEmbedData: EmbedData = {
  width: 945,
  height: 638,
  src: "",
  title: "",
  timeframe: "absolute",
};

export type UIState = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: Updater<boolean>) => void;
  toggleSidebar: () => void;
  isSidebarAnimating: boolean;
  setIsSidebarAnimating: (value: Updater<boolean>) => void;
  isResizing: boolean;
  setIsResizing: (value: Updater<boolean>) => void;
  isMobile: boolean;
  setIsMobile: (value: Updater<boolean>) => void;
  isLessThan2xl: boolean;
  setIsLessThan2xl: (value: Updater<boolean>) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (value: Updater<boolean>) => void;
  toggleMobileSidebar: () => void;
  embedData: EmbedData;
  setEmbedData: (value: Updater<EmbedData>) => void;
  isSafariBrowser: boolean;
  setIsSafariBrowser: (value: Updater<boolean>) => void;
  isDragging: boolean;
  setIsDragging: (value: Updater<boolean>) => void;
  dragChartId: string;
  setDragChartId: (value: string) => void;
  focusSwitchEnabled: boolean;
  setFocusSwitchEnabled: (value: Updater<boolean>) => void;
  ethUsdSwitchEnabled: boolean;
  setEthUsdSwitchEnabled: (value: Updater<boolean>) => void;
  projectEditMode: boolean;
  setProjectEditMode: (value: Updater<boolean>) => void;
  searchBarCaptureActive: boolean;
  setSearchBarCaptureActive: (value: Updater<boolean>) => void;
};

const getInitialSidebarOpen = () => {
  if (typeof window === "undefined") {
    // server render: rely on CSS to collapse for smaller viewports
    return true;
  }
  return window.innerWidth >= SIDEBAR_OPEN_BREAKPOINT;
};

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: getInitialSidebarOpen(),
  setIsSidebarOpen: (value) =>
    set((state) => ({
      isSidebarOpen: resolveState(value, state.isSidebarOpen),
    })),
  toggleSidebar: () =>
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    })),
  isSidebarAnimating: false,
  setIsSidebarAnimating: (value) =>
    set((state) => ({
      isSidebarAnimating: resolveState(value, state.isSidebarAnimating),
    })),
  isResizing: false,
  setIsResizing: (value) =>
    set((state) => ({
      isResizing: resolveState(value, state.isResizing),
    })),
  isMobile: false,
  setIsMobile: (value) =>
    set((state) => ({
      isMobile: resolveState(value, state.isMobile),
    })),
  isLessThan2xl: false,
  setIsLessThan2xl: (value) =>
    set((state) => ({
      isLessThan2xl: resolveState(value, state.isLessThan2xl),
    })),
  isMobileSidebarOpen: false,
  setIsMobileSidebarOpen: (value) =>
    set((state) => ({
      isMobileSidebarOpen: resolveState(value, state.isMobileSidebarOpen),
    })),
  toggleMobileSidebar: () =>
    set((state) => ({
      isMobileSidebarOpen: !state.isMobileSidebarOpen,
    })),
  embedData: defaultEmbedData,
  setEmbedData: (value) =>
    set((state) => ({
      embedData: resolveState(value, state.embedData),
    })),
  isSafariBrowser: false,
  setIsSafariBrowser: (value) =>
    set((state) => ({
      isSafariBrowser: resolveState(value, state.isSafariBrowser),
    })),
  isDragging: false,
  setIsDragging: (value) =>
    set((state) => ({
      isDragging: resolveState(value, state.isDragging),
    })),
  dragChartId: "",
  setDragChartId: (value) =>
    set(() => ({
      dragChartId: value,
    })),
  focusSwitchEnabled: true,
  setFocusSwitchEnabled: (value) =>
    set((state) => ({
      focusSwitchEnabled: resolveState(value, state.focusSwitchEnabled),
    })),
  ethUsdSwitchEnabled: true,
  setEthUsdSwitchEnabled: (value) =>
    set((state) => ({
      ethUsdSwitchEnabled: resolveState(value, state.ethUsdSwitchEnabled),
    })),
  projectEditMode: false,
  setProjectEditMode: (value) =>
    set((state) => ({
      projectEditMode: resolveState(value, state.projectEditMode),
    })),
  searchBarCaptureActive: false,
  setSearchBarCaptureActive: (value) =>
    set((state) => ({
      searchBarCaptureActive: resolveState(value, state.searchBarCaptureActive),
    })),
}));

const defaultSelector = (state: UIState) => state;

export function useUIContext(): UIState;
export function useUIContext<T>(selector: (state: UIState) => T): T;
export function useUIContext<T>(selector?: (state: UIState) => T) {
  const selectorToUse = selector ?? (defaultSelector as (state: UIState) => T);
  return useUIStore(selectorToUse);
}

type ProviderProps = {
  children: ReactNode;
};

export const UIContextProvider = ({ children }: ProviderProps) => {
  const setIsSafariBrowser = useUIStore((state) => state.setIsSafariBrowser);
  const setIsMobile = useUIStore((state) => state.setIsMobile);
  const setIsSidebarOpen = useUIStore((state) => state.setIsSidebarOpen);
  const isMobileSidebarOpen = useUIStore((state) => state.isMobileSidebarOpen);
  const isMobile = useUIStore((state) => state.isMobile);
  const isLessThan2xl = useUIStore((state) => state.isLessThan2xl);
  const setIsLessThan2xl = useUIStore((state) => state.setIsLessThan2xl);

  const setIsResizing = useUIStore((state) => state.setIsResizing);
  const setIsSidebarAnimating = useUIStore((state) => state.setIsSidebarAnimating);
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);

  const isFirstRender = useRef(true);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track sidebar animation
  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setIsSidebarAnimating(true);
    const timeout = setTimeout(() => {
      setIsSidebarAnimating(false);
    }, 350);

    return () => clearTimeout(timeout);
  }, [isSidebarOpen, setIsSidebarAnimating]);

  const prevWindowWidthRef = useRef<number>(
    typeof window !== "undefined" ? window.innerWidth : 0,
  );

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
  
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const initialWidth = window.innerWidth;
  
    setIsSafariBrowser(isSafari);
    setIsMobile(initialWidth < MOBILE_BREAKPOINT);
    setIsSidebarOpen(initialWidth >= SIDEBAR_OPEN_BREAKPOINT);
    setIsLessThan2xl(initialWidth < 1536);
    prevWindowWidthRef.current = initialWidth;
  
    // Debounced version for the heavier layout updates
    const debouncedUpdateLayout = debounce(() => {
      const currentWidth = window.innerWidth;
      const prevWidth = prevWindowWidthRef.current;
      const crossedAbove = prevWidth < SIDEBAR_OPEN_BREAKPOINT && currentWidth >= SIDEBAR_OPEN_BREAKPOINT;
      const crossedBelow = prevWidth >= SIDEBAR_OPEN_BREAKPOINT && currentWidth < SIDEBAR_OPEN_BREAKPOINT;

      setIsMobile(currentWidth < MOBILE_BREAKPOINT);
      setIsLessThan2xl(currentWidth < 1536);
      setIsSidebarOpen((prev) =>
        crossedAbove ? true : crossedBelow ? false : prev,
      );

      prevWindowWidthRef.current = currentWidth;
    }, 50);
  
    const handleResize = () => {
      // Set resizing to true IMMEDIATELY on every resize event
      setIsResizing(true);
  
      // Clear any existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
  
      // Set resizing to false only after resizing stops (no events for 200ms)
      resizeTimeoutRef.current = setTimeout(() => {
        setIsResizing(false);
      }, 100);
  
      // Run the debounced layout updates
      debouncedUpdateLayout();
    };
  
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      debouncedUpdateLayout.cancel();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [setIsSafariBrowser, setIsMobile, setIsSidebarOpen, setIsResizing, setIsLessThan2xl]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const contentPanel = document.getElementById("content-panel");
    const shouldLockScroll = isMobileSidebarOpen && isMobile;

    const originalBodyTouchAction = document.body.style.touchAction;
    const originalBodyOverflow = document.body.style.overflow;

    if (contentPanel) {
      contentPanel.style.touchAction = shouldLockScroll ? "none" : "auto";
    }
    document.body.style.touchAction = shouldLockScroll ? "none" : "auto";
    document.body.style.overflow = shouldLockScroll ? "hidden" : "auto";

    return () => {
      if (contentPanel) {
        contentPanel.style.touchAction = "auto";
      }
      document.body.style.touchAction = originalBodyTouchAction || "auto";
      document.body.style.overflow = originalBodyOverflow || "auto";
    };
  }, [isMobileSidebarOpen, isMobile, isLessThan2xl]);

  return <>{children}</>;
};
