'use client';
import { createContext, useContext, useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
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
      const currentWidth = window.innerWidth;
      const isExpanding = currentWidth > prevWindowWidthRef.current;
      setState(prevState => ({
        ...prevState,
        isSidebarOpen: !state.isSidebarOpen && currentWidth >= 1280 && !isExpanding ? false : currentWidth >= 1280,
        isMobile: window.innerWidth < 768,
      }));

      prevWindowWidthRef.current = currentWidth;
    };

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
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



// Custom hook for Highcharts wrappers
export const useHighchartsWrappers = () => {
  // const { isDragging, setIsDragging, dragChartId, setDragChartId } = useUIContext();
  const [isDragging, setIsDragging] = useState(false);
  const [dragChartId, setDragChartId] = useState("");

  useEffect(() => {
    const wrapHighchartsMethods = () => {
      Highcharts.wrap(Highcharts.Pointer.prototype, "reset", function (proceed) {
        // const chart: Highcharts.Chart = this.chart;
        if (this.chart.container.classList.contains("zoom-chart")) {
          this.chart.container.style.cursor = "url(/cursors/zoom.svg) 14.5 14.5, auto";
        }
        proceed.call(this);
      });

      Highcharts.wrap(Highcharts.Pointer.prototype, "dragStart", function (proceed, e) {
        // const chart: Highcharts.Chart = this.chart;
        if (this.chart.container.classList.contains("zoom-chart")) {
          setDragChartId(this.chart.container.id);

          // invisible cursor
          this.chart.container.style.cursor = "none";

          // place vertical dotted line on click
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
        // const chart: Highcharts.Chart = this.chart;
        if (this.chart.container.id === dragChartId) {
          if (!isDragging) {
            setIsDragging(true);
          }
          // invisible cursor
          this.chart.container.style.cursor = "none";

          // update vertical dotted line on drag
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

            // get the x value of the left and right edges of the selected area
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

            // display the number of days selected
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

            // display the left date
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

            // display the right date label with arrow pointing down
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
        const chart: Highcharts.Chart = this.chart;


        if (chart.container.id === dragChartId) {
          if (isDragging)
            setIsDragging(false);

          // set cursor back to default
          this.chart.container.style.cursor = "url(/cursors/zoom.svg) 14.5 14.5, auto";
          // setIsDragging(false);

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
                console.log(e);
              }
            }
          });
        }
        proceed.call(this, e);
      });
    };

    wrapHighchartsMethods();
  }, [isDragging, setIsDragging, dragChartId, setDragChartId]);
};