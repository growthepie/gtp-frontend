"use client";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
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
  shadowElement,
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
  shadowElement?: React.ReactNode;
}) => {
  const [clicked, setClicked] = useState(
    defaultDropdown !== undefined ? defaultDropdown : false,
  );
  const { isSidebarOpen } = useUIContext();
  // can't interact with content section until dropdown is fully open
  const [isInteractable, setIsInteractable] = useState(false);

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

  return (
    <div
      className={`flex flex-col group ${className}`}
      ref={ref ? ref : null}
      style={style}
    >
      <div
        className={`relative flex items-center gap-x-[12px] pl-[6px] py-[3px] rounded-full bg-forest-50 dark:bg-[#344240] select-none overflow-clip border-0 outline-0 ${enableDropdown && "cursor-pointer"
          }`}
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
        {shadowElement ? shadowElement : null}
        {/* <div
          className={`absolute  inset-0 pointer-events-none shadow-inner rounded-2xl group-hover:opacity-0 opacity-0 transition-opacity duration-500 ${
            enableDropdown ? "hidden" : title === "Menu" ? "hidden" : "block"
          } ${
            title === "Background" || title === "Usage"
              ? isSidebarOpen
                ? "opacity-100"
                : "2xl:opacity-0 md:opacity-100"
              : title === "Technology"
              ? "2xl:opacity-0 md:opacity-100"
              : title === "Risk"
              ? " xl:opacity-0 md:opacity-100 "
              : ""
          }`}
          style={{
            boxShadow: "-62.5px 0px 10px rgba(22, 28, 27, 0.35) inset",
          }}
        ></div> */}
        <div className="bg-white dark:bg-forest-1000 rounded-full w-[24px] h-[24px] p-1 flex items-center justify-center relative">
          <Icon
            icon={icon ? icon : "gtp:gtp-clock"}
            className="w-[16px] h-[16px]"
          />
          <Icon
            icon={"gtp:circle-arrow"}
            className={`w-[4px] h-[9px] absolute top-2 right-0 ${enableDropdown ? "block" : "hidden"
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
        <div className="text-[20px] font-semibold overflow-hidden">{title}</div>
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
        <div className="h-[5px]" />
        {children ? children : ""}
      </div>
    </div>
  );
};

export default ChainSectionHead;