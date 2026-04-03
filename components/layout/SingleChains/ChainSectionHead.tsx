"use client";
import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { useUIContext } from "@/contexts/UIContext";

const ChainSectionHead = ({
  title,
  icon,
  children,
  childrenHeight,
  className,
  ref,
  style,
  enableDropdown,
  defaultDropdown,
  rowEnd,
  disabled,
  removeChildrenTopPadding = false,
  adjustRadiusForMultiline = false,
  multilineCornerRadiusPx = 20,
}: {
  title: string;
  icon?: string;
  children?: React.ReactNode;
  childrenHeight?: number;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  enableDropdown: boolean;
  defaultDropdown?: boolean;
  rowEnd?: React.ReactNode | null;
  disabled?: boolean;
  removeChildrenTopPadding?: boolean;
  adjustRadiusForMultiline?: boolean;
  multilineCornerRadiusPx?: number;
}) => {
  const [clicked, setClicked] = useState(
    defaultDropdown !== undefined ? defaultDropdown : false,
  );
  const isSidebarOpen = useUIContext((state) => state.isSidebarOpen);
  const titleRef = useRef<HTMLDivElement | null>(null);
  // can't interact with content section until dropdown is fully open
  const [isInteractable, setIsInteractable] = useState(false);
  const [titleIsMultilineMeasured, setTitleIsMultilineMeasured] = useState(false);
  const isTitleMultiline = adjustRadiusForMultiline && titleIsMultilineMeasured;

  const handleClick = () => {
    setClicked(!clicked);
  };

  useEffect(() => {
    let interactTimeout: NodeJS.Timeout;
    const handleInteract = () => {
      interactTimeout = setTimeout(() => {
        setIsInteractable(true);
      }, 500);
    };
    handleInteract();

    return () => {
      clearTimeout(interactTimeout);
    };
  }, [clicked]);

  useEffect(() => {
    if (!adjustRadiusForMultiline) {
      return;
    }

    const measureMultiline = () => {
      const titleElement = titleRef.current;
      if (!titleElement) {
        setIsTitleMultiline(false);
        return;
      }

      const computedStyle = window.getComputedStyle(titleElement);
      const computedLineHeight = Number.parseFloat(computedStyle.lineHeight);
      const fallbackLineHeight = Number.parseFloat(computedStyle.fontSize) * 1.2;
      const lineHeight = Number.isFinite(computedLineHeight) ? computedLineHeight : fallbackLineHeight;
      const multiline = titleElement.scrollHeight > lineHeight * 1.5;
      setTitleIsMultilineMeasured(multiline);
    };

    measureMultiline();
    const resizeObserver = new ResizeObserver(measureMultiline);
    if (titleRef.current) {
      resizeObserver.observe(titleRef.current);
    }
    window.addEventListener("resize", measureMultiline);

    return () => {
      window.removeEventListener("resize", measureMultiline);
      resizeObserver.disconnect();
    };
  }, [adjustRadiusForMultiline, title]);

  return (
    <div
      className={`flex flex-col group ${className} ${disabled ? "opacity-50" : ""}`}
      ref={ref ? ref : null}
      style={style}
    >
      <div
        className={`relative flex items-center gap-x-[12px] px-[6px] py-[3px] rounded-full bg-forest-50 dark:bg-color-bg-medium select-none ${enableDropdown && "cursor-pointer"
          }`}
        style={isTitleMultiline ? { borderRadius: `${multilineCornerRadiusPx}px` } : undefined}
        onClick={() => {
          handleClick();
          // find .highcharts-tooltip-container and remove them all
          const chartTooltips = document.querySelectorAll(
            ".highcharts-tooltip-container",
          );
          chartTooltips.forEach((tooltip) => {
            // remove the tooltip from the DOM
            document.body.removeChild(tooltip);
          });
        }}
      >
        <div
          className={`absolute  inset-0 pointer-events-none shadow-inner rounded-2xl group-hover:opacity-0 opacity-0 transition-opacity duration-500 ${enableDropdown ? "hidden" : title === "Menu" ? "hidden" : "block"
            } ${title === "Background"
              ? isSidebarOpen
                ? "lg:opacity-0 md:opacity-100"
                : "xl:opacity-0 md:opacity-100"
              : title === "Risk"
                ? " xl:opacity-0 md:opacity-100 "
                : title === "Usage"
                  ? isSidebarOpen
                    ? "2xl:opacity-0 md:opacity-100 "
                    : "xl:opacity-0 md:opacity-100"
                  : title === "Technology"
                    ? isSidebarOpen
                      ? "2xl:opacity-0 md:opacity-100 "
                      : "xl:opacity-0 md:opacity-100"
                    : ""
            }`}
          style={{
            background:
              "linear-gradient(to right, rgba(0, 0, 0, 0) 10%, rgba(22, 28, 27, 0.76) 100%)",
          }}
        ></div>
        <div className="bg-white dark:bg-color-ui-active rounded-full w-[24px] h-[24px] p-1 flex items-center justify-center relative">
          <Icon
            icon={icon ? icon : "gtp:gtp-clock"}
            className="w-[16px] h-[16px]"
          />
          <Icon
            icon={"gtp:circle-arrow"}
            className={`w-[4px] h-[9px] absolute top-2 right-0 ${!enableDropdown || disabled ? "hidden" : "block"
              }`}
            style={{
              transform: `rotate(${clicked ? "90deg" : "0deg"})`,
              transformOrigin: "-8px 4px",
              transition: "transform 0.5s",
            }}
            onClick={(e) => {
              handleClick();
            }}
          />
        </div>
        <div ref={titleRef} className="text-[20px] font-semibold overflow-hidden">{title}</div>
        <div className="flex-grow"></div>
        {rowEnd ? rowEnd : null}
      </div>
      <div
        className="overflow-clip hover:!overflow-visible"
        style={{
          maxHeight: `${enableDropdown
            ? clicked
              ? childrenHeight
                ? `${childrenHeight}px`
                : "1000px"
              : "0"
            : "120px"
            }`,
          transition: "all 0.4s",
        }}
      >
        <div className={removeChildrenTopPadding ? "" : "pt-[5px]"}>{children ? children : ""}</div>
      </div>
    </div>
  );
};

export default ChainSectionHead;
