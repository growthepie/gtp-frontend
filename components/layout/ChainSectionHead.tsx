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
      className={`flex flex-col gap-y-[5px] ${className} `}
      ref={ref ?? null}
      style={style}
    >
      <div className="flex items-center gap-x-[15px] px-[6px] py-[3px] rounded-full bg-forest-50 dark:bg-forest-900">
        <div className="bg-white dark:bg-forest-1000 rounded-full w-[25px] h-[25px] p-[5px]">
          <Icon
            icon={icon ? icon : "gtp:gtp-clock"}
            className="w-[15px] h-[15px]"
          />
        </div>
        <div className="text-[20px] font-semibold">{title}</div>
      </div>
      <div className="">{children ? children : ""}</div>
    </div>
  );
};

export default ChainSectionHead;
