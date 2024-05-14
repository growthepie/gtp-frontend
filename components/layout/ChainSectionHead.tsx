"use client";
import { Icon } from "@iconify/react";
import { useState } from "react";

const ChainSectionHead = ({
  title,
  icon,
  children,
  className,
  ref,
  style,
  enableDropdown,
  defaultDropdown,
  rowEnd,
}: {
  title: string;
  icon?: string;
  children?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  enableDropdown: boolean;
  defaultDropdown?: boolean;
  rowEnd?: React.ReactNode | null;
}) => {

  const [clicked, setClicked] = useState(
    defaultDropdown !== undefined ? defaultDropdown : false,
  );

  const handleClick = () => {
    setClicked(!clicked);
  };

  return (
    <div
      className={`flex flex-col gap-y-[5px] group ${className} `}
      ref={ref ? ref : null}
      style={style}
    >
      <div
        className={`relative flex items-center gap-x-[15px] px-[6px] py-[3px] rounded-full bg-forest-50 dark:bg-[#344240] select-none ${enableDropdown && 'cursor-pointer'}`}
        onClick={() => {
          handleClick();
        }}
      >
        <div
          className={`absolute  inset-0 pointer-events-none shadow-inner xl:opacity-0 lg:opacity-100 rounded-2xl group-hover:opacity-0 transition-opacity duration-500 ${enableDropdown ? "hidden" : "block"
            }`}
          style={{
            boxShadow: "-50px 0px 10px rgba(21, 26, 25, 0.5) inset",
          }}
        ></div>
        <div
          className="bg-white dark:bg-forest-1000 rounded-full w-[24px] h-[24px] p-1 flex items-center justify-center relative"

        >
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
            onClick={handleClick}
          />
        </div>
        <div className="text-[20px] font-semibold overflow-hidden">{title}</div>
        <div className="flex-grow"></div>
        {rowEnd ? rowEnd : null}
      </div>
      <div
        className={`${enableDropdown ? (clicked ? "block" : "hidden") : "block"
          }`}
      >
        {children ? children : ""}
      </div>

    </div>
  );
};

export default ChainSectionHead;
