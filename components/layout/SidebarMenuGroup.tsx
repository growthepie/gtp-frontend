"use client";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { useEffect, useState, ReactNode } from "react";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "@react-hook/media-query";
import Link from "next/link";
import { useMetricsData } from "@/context/MetricsProvider";

export type SidebarItem = {
  name: string;
  label: string;
  key?: string;
  icon: ReactNode;
  sidebarIcon: ReactNode;
  options: {
    // name?: string;
    label: string;
    icon: ReactNode;
    key?: string;
    rootKey?: string;
  }[];
};

type SidebarProps = {
  item: SidebarItem;
  trigger: ReactNode;
  className?: string;
  open?: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  children?: ReactNode;
};

export default function SidebarMenuGroup({
  item,
  trigger,
  className = "",
  open = false,
  onToggle = () => {},
  onOpen = () => {},
  onClose = () => {},
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(isOpen);
  }, [open]);

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    onOpen();
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const metricsData = useMetricsData();

  const [masterData, setMasterData] = useState<any>(null);

  useEffect(() => {
    if (
      metricsData.status === "success" &&
      Object.keys(metricsData.data).includes("masterData")
    ) {
      setMasterData(metricsData.data.masterData);
    }
  }, [metricsData]);

  if (item.name === "Blockspace")
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-items-center mb-8 opacity-50">
          <div className="w-6 mx-0">
            <div className="text-white bg-slate-500 dark:text-black dark:bg-slate-300 rounded-md w-6 mx-auto">
              {item.sidebarIcon}
            </div>
          </div>
          <div className="">
            <div className="text-sm font-medium mx-8 w-60 flex">
              {item.label}
              <div className="text-[0.6rem] leading-[1.75] px-1 py-[0.1rem] font-bold ml-2 rounded-[4px] bg-slate-500 dark:bg-slate-300 dark:text-black text-slate-100">
                SOON
              </div>
            </div>{" "}
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col">
      <div
        className="flex items-center justify-items-center mb-2 cursor-pointer"
        onClick={handleToggle}
      >
        <div className="w-6 mx-0">
          <div className="text-white bg-slate-500 dark:text-black dark:bg-slate-300 rounded-md w-6 mx-auto">
            {item.sidebarIcon}
          </div>
        </div>
        <div className={``}>
          <div className="text-sm font-medium mx-8 w-60">{item.label}</div>
        </div>
      </div>
      <div
        className={`flex flex-col overflow-hidden mb-6 w-60 ${
          isOpen ? "h-auto" : "h-0"
        }`}
      >
        {masterData &&
          item.options
            .filter(
              (option) =>
                item.key &&
                option.key &&
                Object.keys(masterData[item.key]).includes(option.key)
            )
            .map((option) => (
              <Link
                key={option.label}
                className="flex items-center justify-items-center rounded-l-full hover:bg-slate-100/10"
                href={`${item.label.toLowerCase()}/${option.key?.toLowerCase()}`}
              >
                {/* <div className="w-6"> */}
                <div className="w-6 mx-1 text-slate-500 dark:text-slate-300">
                  {option.icon}
                </div>
                {/* </div> */}
                <div className="text-sm py-[0.75rem] mx-8 w-60 font-normal break-inside-auto">
                  {option.label}
                </div>
              </Link>
            ))}

        {/* <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-400 dark:bg-slate-400"></div> */}
      </div>
    </div>
  );
}
