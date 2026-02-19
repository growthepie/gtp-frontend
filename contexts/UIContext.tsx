'use client';

import { useEffect, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { debounce } from "lodash";
import Highcharts from "highcharts/highstock";
import { create } from "zustand";

export const MOBILE_BREAKPOINT = 768;

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
};

const getInitialSidebarOpen = () => {
  if (typeof window === "undefined") {
    // server render: rely on CSS to collapse for smaller viewports
    return true;
  }
  return window.innerWidth >= 1280;
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
    setIsSidebarOpen(initialWidth >= 1280);
    setIsLessThan2xl(initialWidth < 1536);
    prevWindowWidthRef.current = initialWidth;
  
    // Debounced version for the heavier layout updates
    const debouncedUpdateLayout = debounce(() => {
      const currentWidth = window.innerWidth;
      const isExpanding = currentWidth > prevWindowWidthRef.current;
  
      setIsMobile(currentWidth < MOBILE_BREAKPOINT);
      setIsLessThan2xl(currentWidth < 1536);
      setIsSidebarOpen((prev) =>
        currentWidth >= 1280 ? (isExpanding ? prev : true) : false,
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

// Custom hook for Highcharts wrappers
export const useHighchartsWrappers = () => {
  const setIsDragging = useUIStore((state) => state.setIsDragging);
  const setDragChartId = useUIStore((state) => state.setDragChartId);

  useEffect(() => {
    const wrapHighchartsMethods = () => {
      Highcharts.wrap(Highcharts.Pointer.prototype, "reset", function (proceed) {
        if (this.chart.container.classList.contains("zoom-chart")) {
          this.chart.container.style.cursor = "url(/cursors/zoom.svg) 14.5 14.5, auto";
        }
        proceed.call(this);
      });

      Highcharts.wrap(Highcharts.Pointer.prototype, "dragStart", function (proceed, e) {
        if (this.chart.container.classList.contains("zoom-chart")) {
          setDragChartId(this.chart.container.id);

          this.chart.container.style.cursor = "none";

          if (this.chart.series.length > 0) {
            const x = e.chartX;
            const y = e.chartY;

            this.chart.zoomStartX = x;
            this.chart.zoomStartY = y;

            if (!this.chart.zoomLineStart) {
              this.chart.zoomLineStart = this.chart.renderer
                .path([
                  "M",
                  x,
                  this.chart.plotTop,
                  "L",
                  x,
                  this.chart.plotTop + this.chart.plotHeight,
                ])
                .attr({
                  stroke: "rgba(205, 216, 211, 1)",
                  "stroke-width": "1px",
                  "stroke-linejoin": "round",
                  "stroke-dasharray": "2, 1",
                  "shape-rendering": "crispEdges",
                  zIndex: 100,
                })
                .add()
                .toFront();
            }

            if (!this.chart.zoomLineEnd) {
              this.chart.zoomLineEnd = this.chart.renderer
                .path([
                  "M",
                  x,
                  this.chart.plotTop,
                  "L",
                  x,
                  this.chart.plotTop + this.chart.plotHeight,
                ])
                .attr({
                  stroke: "rgba(205, 216, 211, 1)",
                  "stroke-width": "1px",
                  "stroke-linejoin": "round",
                  "stroke-dasharray": "2, 1",
                  "shape-rendering": "crispEdges",
                  zIndex: 100,
                })
                .add()
                .toFront();
            }

            if (!this.chart.zoomStartIcon) {
              this.chart.zoomStartIcon = this.chart.renderer
                .image("/cursors/rightArrow.svg", x - 17, y, 34, 34)
                .attr({
                  zIndex: 999,
                })
                .add()
                .toFront();
            }

            if (!this.chart.zoomEndIcon) {
              this.chart.zoomEndIcon = this.chart.renderer
                .image("/cursors/leftArrow.svg", x - 17, y, 34, 34)
                .attr({
                  zIndex: 999,
                })
                .add()
                .toFront();
            }

            if (!this.chart.numDaysText) {
              this.chart.numDaysText = this.chart.renderer
                .label(``, x, y)
                .attr({
                  zIndex: 999,
                  fill: "rgb(215, 223, 222)",
                  r: 5,
                  padding: 5,
                  "font-size": "12px",
                  "font-weight": "500",
                  align: "center",
                  opacity: 0.7,
                })
                .css({
                  color: "#2A3433",
                })
                .add()
                .shadow(true)
                .toFront();
            }

            if (!this.chart.leftDateText) {
              this.chart.leftDateText = this.chart.renderer
                .label(``, x, this.chart.plotHeight - 20)
                .attr({
                  zIndex: 999,
                  fill: "#2A3433",
                  r: 5,
                  padding: 6,
                  "font-size": "12px",
                  "font-weight": "500",
                  align: "center",
                })
                .css({
                  color: "rgb(215, 223, 222)",
                })
                .add()
                .shadow(true)
                .toFront();
            }

            if (!this.chart.rightDateText) {
              this.chart.rightDateText = this.chart.renderer
                .label(``, x, this.chart.plotHeight - 20)
                .attr({
                  zIndex: 999,
                  fill: "#2A3433",
                  r: 5,
                  padding: 6,
                  "font-size": "12px",
                  "font-weight": "500",
                  align: "center",
                })
                .css({
                  color: "rgb(215, 223, 222)",
                })
                .add()
                .shadow(true)
                .toFront();
            }
          }
        }
        proceed.call(this, e);
      });

      Highcharts.wrap(Highcharts.Pointer.prototype, "drag", function (proceed, e) {
        const { dragChartId, isDragging } = useUIStore.getState();

        if (this.chart.container.id === dragChartId) {
          if (!isDragging) {
            setIsDragging(true);
          }
          this.chart.container.style.cursor = "none";

          if (this.chart.series.length > 0) {
            const x = e.chartX;
            const y = e.chartY;

            const leftX = this.chart.zoomStartX < x ? this.chart.zoomStartX : x;
            const rightX = this.chart.zoomStartX < x ? x : this.chart.zoomStartX;

            if (this.chart.zoomLineStart.attr("visibility") === "hidden") {
              this.chart.zoomLineStart.attr("visibility", "visible");
            }

            this.chart.zoomLineStart.attr({
              d: [
                "M",
                leftX,
                this.chart.plotTop,
                "L",
                leftX,
                this.chart.plotTop + this.chart.plotHeight,
              ],
            });

            if (this.chart.zoomLineEnd.attr("visibility") === "hidden") {
              this.chart.zoomLineEnd.attr("visibility", "visible");
            }

            this.chart.zoomLineEnd.attr({
              d: [
                "M",
                rightX,
                this.chart.plotTop,
                "L",
                rightX,
                this.chart.plotTop + this.chart.plotHeight,
              ],
            });

            if (this.chart.zoomStartIcon.attr("visibility") === "hidden") {
              this.chart.zoomStartIcon.attr("visibility", "visible");
            }

            this.chart.zoomStartIcon.attr({
              x:
                x < this.chart.zoomStartX
                  ? leftX - 14.5
                  : this.chart.zoomStartX - 14.5,
              y: x < this.chart.zoomStartX ? y - 15 : this.chart.zoomStartY - 15,
              src:
                x < this.chart.zoomStartX
                  ? "/cursors/rightArrow.svg"
                  : "/cursors/leftArrow.svg",
            });

            if (this.chart.zoomEndIcon.attr("visibility") === "hidden") {
              this.chart.zoomEndIcon.attr("visibility", "visible");
            }

            this.chart.zoomEndIcon.attr({
              x: x < this.chart.zoomStartX ? rightX - 14.5 : x - 14.5,
              y: x < this.chart.zoomStartX ? this.chart.zoomStartY - 15 : y - 15,
              src:
                x < this.chart.zoomStartX
                  ? "/cursors/leftArrow.svg"
                  : "/cursors/rightArrow.svg",
            });

            const leftXValue = this.chart.xAxis[0].toValue(
              leftX - this.chart.plotLeft,
              true,
            );
            const rightXValue = this.chart.xAxis[0].toValue(
              rightX - this.chart.plotLeft,
              true,
            );

            const leftDate = new Date(leftXValue);
            const rightDate = new Date(rightXValue);

            const numDays = Math.round(
              (rightXValue - leftXValue) / (24 * 60 * 60 * 1000),
            );

            if (this.chart.numDaysText.attr("visibility") === "hidden") {
              this.chart.numDaysText.attr("visibility", "visible");
            }

            this.chart.numDaysText.attr({
              text: `${numDays} day${numDays > 1 ? "s" : ""}`,
              x: leftX + (rightX - leftX) / 2,
              y:
                rightX - leftX < 160
                  ? this.chart.plotHeight - 50
                  : this.chart.plotHeight - 20,
            });

            if (this.chart.leftDateText.attr("visibility") === "hidden") {
              this.chart.leftDateText.attr("visibility", "visible");
            }

            this.chart.leftDateText.attr({
              text: `${leftDate.toLocaleDateString("en-GB", {
                timeZone: "UTC",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}`,
              x: leftX,
              y: this.chart.plotHeight - 20,
            });

            if (this.chart.rightDateText.attr("visibility") === "hidden") {
              this.chart.rightDateText.attr("visibility", "visible");
            }

            this.chart.rightDateText.attr({
              text: `${rightDate.toLocaleDateString("en-GB", {
                timeZone: "UTC",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}`,
              x: rightX,
              y: this.chart.plotHeight - 20,
            });
          }
        }
        proceed.call(this, e);
      });

      Highcharts.wrap(Highcharts.Pointer.prototype, "drop", function (proceed, e) {
        const { dragChartId } = useUIStore.getState();

        if (this.chart.container.id === dragChartId) {
          setIsDragging(false);

          this.chart.container.style.cursor = "url(/cursors/zoom.svg) 14.5 14.5, auto";

          const elements = [
            "zoomLineStart",
            "zoomLineEnd",
            "zoomStartIcon",
            "zoomEndIcon",
            "numDaysText",
            "leftDateText",
            "rightDateText",
          ];

          elements.forEach((element) => {
            if (this.chart[element]) {
              try {
                this.chart[element].attr("visibility", "hidden");
              } catch (e) {
                console.log(`[UIContext] Error hiding chart element: ${element}`, e);
              }
            }
          });
        }
        proceed.call(this, e);
      });
    };

    wrapHighchartsMethods();
  }, [setDragChartId, setIsDragging]);
};
