"use client";
import { Icon } from "@iconify/react";

const ChainSectionHead = ({
  title,
  icon,
  children,
  className,
  ref,
  style,
}: {
  title: string;
  icon?: string;
  children?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
}) => {
  return (
    <div
      className={`flex flex-col gap-y-[5px] group ${className} `}
      ref={ref ? ref : null}
      style={style}
    >
      <div className="relative flex items-center gap-x-[15px] px-[6px] py-[3px] rounded-full bg-forest-50 dark:bg-forest-900">
        <div
          className="absolute  inset-0 pointer-events-none shadow-inner xl:opacity-0 lg:opacity-100 rounded-2xl group-hover:opacity-0 transition-opacity duration-500 "
          style={{
            boxShadow: "-30px 0px 10px rgba(21, 26, 25, 0.7) inset",
          }}
        ></div>
        <div className="bg-white dark:bg-forest-1000 rounded-full w-[25px] h-[25px] p-[5px]">
          <Icon
            icon={icon ? icon : "gtp:gtp-clock"}
            className="w-[15px] h-[15px]"
          />
        </div>
        <div className="text-[20px] font-semibold overflow-hidden">{title}</div>
      </div>
      <div className="">{children ? children : ""}</div>
    </div>
  );
};

export default ChainSectionHead;
