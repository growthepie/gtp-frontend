"use client";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { useEffect, useState, ReactNode } from "react";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "@react-hook/media-query";
import Link from "next/link";
import { MasterResponse } from "@/types/api/MasterResponse";
// import { useMetricsData } from "@/context/MetricsProvider";
import useSWR from "swr";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipTrigger, TooltipContent } from "./Tooltip";
import { AllChains } from "@/lib/chains";
import Image from "next/image";

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
  // open?: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  children?: ReactNode;
  sidebarOpen?: boolean;
};

export default function SidebarMenuGroup({
  item,
  trigger,
  className = "",
  // open = false,
  onToggle = () => {},
  onOpen = () => {},
  onClose = () => {},
  sidebarOpen,
}: SidebarProps) {
  const { data: master } = useSWR<any>(
    "https://d2cfnw27176mbd.cloudfront.net/v0_3/master.json"
  );

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const pathname = usePathname();

  // const [first, second] = pathname.slice(1).split("/");

  const [urlParts, setUrlParts] = useState<string[]>(["", ""]);

  useEffect(() => {
    const parts = pathname.slice(1).split("/");
    switch (parts.length) {
      case 0:
        setUrlParts(["", ""]);
        break;
      case 1:
        setUrlParts([parts[0], ""]);
        break;
      case 2:
        setUrlParts([parts[0], parts[1]]);
        break;
      default:
        setUrlParts(parts);
    }
  }, [item.name, pathname]);

  useEffect(() => {
    setIsOpen((isOpen) =>
      urlParts[0].toLowerCase() == item.name.toLowerCase() ? true : isOpen
    );
  }, [item.name, urlParts]);

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

  if (item.name === "Blockspace")
    return (
      <div className="group flex flex-col">
        <Tooltip key={item.label} placement="right">
          <TooltipTrigger className="h-6 mb-6 cursor-default">
            <div className="flex items-center justify-items-center opacity-70 group-hover:opacity-100 transition-opacity duration-100 ease-in-out">
              <div className="w-6 mx-0">
                <div className="text-forest-50 bg-forest-900 rounded-md w-6 mx-auto">
                  {item.sidebarIcon}
                </div>
              </div>
              <div className="">
                <div className="text-sm font-bold mx-4 w-60 flex ">
                  {item.label}
                  <div className="text-[0.6rem] leading-[1.75] px-1 py-[0.1rem] font-bold ml-2 rounded-[4px] bg-forest-900 text-forest-50">
                    SOON
                  </div>
                </div>{" "}
              </div>
            </div>
          </TooltipTrigger>
          {!sidebarOpen && (
            <TooltipContent className="bg-forest-900 text-forest-50 rounded-md p-2 text-xs ml-2 font-medium break-inside-auto shadow-md flex">
              {item.label}{" "}
              <div className="text-[0.5rem] leading-[1.75] px-1 py-[0.1rem] font-bold ml-1 rounded-[4px] bg-forest-50 text-forest-900">
                SOON
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    );

  if (["API Documentation", "Wiki", "Contributors"].includes(item.name))
    return (
      <div className="group flex flex-col">
        {/* open in new tab */}
        <Tooltip key={item.label} placement="right">
          <TooltipTrigger className="h-6 mb-6 cursor-default">
            <Link
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-items-center mb-8"
              href={
                ["API Documentation", "Wiki"].includes(item.name)
                  ? "https://growthepie.gitbook.io/introduction/"
                  : "/contributors"
              }
            >
              <div className="w-6 mx-0">
                <div className="text-forest-50 bg-forest-900 rounded-md w-6 mx-auto opacity-70 group-hover:opacity-100 transition-opacity duration-100 ease-in-out">
                  {item.sidebarIcon}
                </div>
              </div>
              <div className="">
                <div className="text-sm font-bold mx-4 w-60 flex">
                  {item.label}
                </div>{" "}
              </div>
            </Link>
          </TooltipTrigger>
          {!sidebarOpen && (
            <TooltipContent className="bg-forest-900 text-forest-50 rounded-md p-2 text-xs ml-2 font-medium break-inside-auto shadow-md flex">
              {item.label}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    );

  return (
    <div className="flex flex-col">
      <div className="text-xs"></div>
      <Tooltip key={item.label} placement="right">
        <TooltipTrigger className="h-6">
          <div
            className="group flex items-start justify-items-start mb-2 cursor-pointer"
            onClick={handleToggle}
          >
            <div className="w-6 mx-0">
              <div className="text-forest-50 bg-forest-900 rounded-md w-6 mx-auto opacity-70 group-hover:opacity-100 transition-opacity duration-100 ease-in-out">
                {item.sidebarIcon}
              </div>
            </div>
            <div className={`text-left`}>
              <div className="text-sm font-bold mx-[17px] py-0.5 w-60">
                {item.label}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        {!sidebarOpen && (
          <TooltipContent className="bg-forest-900 text-forest-50 rounded-md p-2 text-xs ml-2 font-medium break-inside-auto shadow-md">
            {item.label}
          </TooltipContent>
        )}
      </Tooltip>

      <div
        className={`flex flex-col overflow-hidden mb-6 w-60 ${
          isOpen ? "h-auto mt-1" : "h-0 mt-0"
        }`}
      >
        {master &&
          item.options
            .filter((option) =>
              Object.keys(master[item.key]).includes(option.key)
            )
            .map((option) => {
              // console.log(option.label);
              // if (!sidebarOpen) {
              return (
                <Tooltip key={option.label} placement="right">
                  <TooltipTrigger>
                    <Link
                      className={`group flex items-center justify-items-center rounded-l-full my-[0.25rem] relative ${
                        urlParts[1].trim().localeCompare(option.key) === 0
                          ? "bg-forest-900 text-forest-50 hover:bg-forest-700 hover:text-forest-50"
                          : "hover:bg-forest-200 hover:text-forest-900"
                      }`}
                      href={`/${item.label.toLowerCase()}/${option.key?.toLowerCase()}`}
                    >
                      {/* <div className="w-6"> */}
                      <div
                        className={`w-6 absolute top-1.5 left-0 ${
                          urlParts[1].trim().localeCompare(option.key) === 0
                            ? "opacity-100"
                            : "opacity-30 group-hover:opacity-100"
                        }`}
                      >
                        {item.name === "Fundamentals" && option.icon}
                        {item.name === "Chains" && (
                          <Image
                            src={
                              AllChains.find((c) => c.key == option.key)?.icon
                            }
                            width="16"
                            height="16"
                            alt={item.key}
                            className="ml-0.5 saturate-0 contrast-200 invert"
                          />
                        )}
                      </div>
                      {/* </div> */}
                      <div
                        className={`text-sm py-1 w-40 font-normal break-inside-auto text-left mx-10`}
                      >
                        {option.label}
                      </div>
                    </Link>
                  </TooltipTrigger>
                  {!sidebarOpen && (
                    <TooltipContent className="bg-forest-900 text-forest-50 rounded-md p-2 text-xs font-medium break-inside-auto -ml-48 shadow-md">
                      {option.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
              // } else {
              //   return (
              //     <Link
              //       key={option.label}
              //       className={`flex items-center justify-items-center rounded-l-full my-[0.25rem] relative ${
              //         urlParts[1].trim().localeCompare(option.key) === 0
              //           ? "bg-forest-900 text-forest-50 hover:bg-forest-700 hover:text-forest-50"
              //           : "hover:bg-forest-200 hover:text-forest-900 "
              //       }`}
              //       href={`/${item.label.toLowerCase()}/${option.key?.toLowerCase()}`}
              //     >
              //       {/* <div className="w-6"> */}
              //       <div className="w-6 absolute top-1.5 left-0">
              //         {item.name === "Fundamentals" && option.icon}
              //         {item.name === "Chains" && (
              //           <Image
              //             src={AllChains.find((c) => c.key == option.key)?.icon}
              //             width="16"
              //             height="16"
              //             alt={item.key}
              //             className="ml-0.5 saturate-0 contrast-200 invert"
              //           />
              //         )}
              //       </div>
              //       {/* </div> */}
              //       <div className="text-sm py-1 ml-10 w-40 font-normal break-inside-auto">
              //         {option.label}
              //       </div>
              //     </Link>
              //   );
              // }
            })}

        {/* <div className="flex items-center justify-center w-6 h-6 rounded-full bg-forest-400 "></div> */}
      </div>
    </div>
  );
}
