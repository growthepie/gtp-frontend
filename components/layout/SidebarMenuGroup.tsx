"use client";
import { useEffect, useState, ReactNode, useMemo } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import useSWR, { preload } from "swr";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipTrigger, TooltipContent } from "./Tooltip";
import { MasterURL, BlockspaceURLs, ChainURLs, MetricsURLs } from "@/lib/urls";
import { NavigationItem, navigationItems } from "@/lib/navigation";
import { IS_PREVIEW } from "@/lib/helpers.mjs";
import { navigationCategories } from "@/lib/navigation";
import rpgf from "@/icons/svg/rpgf.svg";
import Image from "next/image";
import { MasterResponse } from "@/types/api/MasterResponse";
import { Get_SupportedChainKeys } from "@/lib/chains";

const fetcher = (url) => fetch(url).then((res) => res.json());

type SidebarProps = {
  item: NavigationItem;
  className?: string;
  onOpen?: () => void;
  onClose?: () => void;
  children?: ReactNode;
  sidebarOpen: boolean;
};

export default function SidebarMenuGroup({
  item,
  onOpen,
  onClose,
  sidebarOpen,
}: SidebarProps) {
  const { data: master } = useSWR<MasterResponse>(MasterURL);

  const ChainGroups = useMemo(() => {
    if (!master) return {};

    // const chainGroups = {};

    const chainItemsByKey = navigationItems[3].options
      .filter((option) => option.hide !== true)
      .filter(
        (option) =>
          option.key && Get_SupportedChainKeys(master).includes(option.key),
      )
      .reduce((acc, option) => {
        if (option.key) acc[option.key] = option;
        return acc;
      }, {});

    // group master.chains by bucket
    const chainsByBucket = Object.entries(master.chains).reduce(
      (acc, [chainKey, chainInfo]) => {
        if (!acc[chainInfo.bucket]) {
          acc[chainInfo.bucket] = [];
        }

        if (chainItemsByKey[chainKey])
          acc[chainInfo.bucket].push(chainItemsByKey[chainKey]);

        return acc;
      },
      {},
    );

    // sort each bucket in alphabetical order
    Object.keys(chainsByBucket).forEach((bucket) => {
      chainsByBucket[bucket].sort((a, b) => a.label.localeCompare(b.label));
    });

    return chainsByBucket;
  }, [master]);

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const pathname = usePathname();

  const urlParts = useMemo(() => {
    if (!pathname) {
      return ["", ""];
    }

    const parts = pathname.slice(1).split("/");
    switch (parts.length) {
      case 0:
        return ["", ""];
      case 1:
        return [parts[0], ""];
      case 2:
        return [parts[0], parts[1]];
      default:
        return parts;
    }
  }, [pathname]);

  useEffect(() => {
    if (urlParts[0].length === 0 && item.name === "Fundamentals") {
      setIsOpen(true);
    } else {
      setIsOpen(
        urlParts[0].toLowerCase() == item.name.toLowerCase() ? true : false,
      );
    }
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
    onOpen && onOpen();
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose && onClose();
  };

  // disable Blockspace menu item in production
  if (item.name === "")
    return (
      <div className="group flex flex-col">
        <Tooltip key={item.name} placement="right">
          <TooltipTrigger className="h-6 mb-[17px] cursor-default pl-0 md:pl-8 overflow-visible">
            <div className="flex items-center justify-items-center opacity-70">
              <div className="w-6 mx-0">
                <div className="w-6 mx-auto grayscale">
                  <Icon icon={item.icon} className="h-7 w-7 p-0.5 mx-auto" />
                </div>
              </div>
              <div className="">
                {sidebarOpen && (
                  <div className="text-base font-bold mx-3 w-80 flex space-x-3 items-center">
                    <span>{item.label}</span>
                    <div className="px-1 py-[2px] leading-[1] text-sm font-bold ml-1 rounded-[3px] bg-forest-900 text-forest-50 dark:bg-forest-50 dark:text-forest-900">
                      SOON
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TooltipTrigger>
          {!sidebarOpen && (
            <TooltipContent className="bg-forest-900 text-forest-50 dark:bg-forest-50 dark:text-forest-900 rounded-md p-2 text-xs ml-2 font-medium break-inside-auto shadow-md flex z-50">
              {item.label}{" "}
              <div className="text-[0.5rem] leading-[1] px-1 py-1 font-bold ml-1 rounded-[4px] bg-forest-50 dark:bg-forest-900 text-forest-900 dark:text-forest-50">
                SOON
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    );

  if (
    [
      "API Documentation",
      "Knowledge",
      "Contributors",
      "Home",
      "Blog",
      "RPGF3 Tracker",
    ].includes(item.name)
  )
    return (
      <div key={item.name} className="group flex flex-col">
        {/* open in new tab */}
        <Tooltip placement="right">
          <TooltipTrigger className="h-6 mb-[17px] cursor-default pl-0 md:pl-8 overflow-visible">
            <Link
              target={
                ["API Documentation", "Knowledge", "Blog"].includes(item.name)
                  ? "_blank"
                  : ""
              }
              className="flex items-center justify-items-center"
              href={item.href ?? ""}
              rel={
                ["API Documentation", "Knowledge", "Blog"].includes(item.name)
                  ? "noopener noreferrer"
                  : ""
              }
            >
              <div className="w-6 mx-0">
                <div className="w-6 mx-auto">
                  {!item.name.includes("RPGF3 Tracker") ? (
                    <Icon icon={item.icon} className="h-7 w-7 p-0.5 mx-auto" />
                  ) : (
                    <Icon
                      icon={item.icon}
                      className="h-7 w-7 p-1 mx-auto fill-[#FF0420] text-[#FF0420]"
                    />
                  )}
                </div>
              </div>
              <div className="">
                {sidebarOpen && (
                  <div className="text-base font-bold mx-3 w-80 flex space-x-1">
                    {item.name === "RPGF3 Tracker" ? (
                      <div className="flex space-x-1 relative">
                        <div className="text-[#FF0420]">RetroPGF 3</div>{" "}
                        <div className="text-inherit">Tracker</div>
                        <Icon
                          icon="material-symbols:star"
                          className={`text-[#FF0420] self-center animate-bounce visible h-[8px] w-[8px] absolute -left-3`}
                        />
                        <Icon
                          icon="material-symbols:star"
                          className={`text-[#FF0420] self-center animate-bounce visible h-[8px] w-[8px] absolute -right-2.5`}
                        />
                      </div>
                    ) : (
                      item.label
                    )}
                  </div>
                )}
              </div>
            </Link>
          </TooltipTrigger>
          {!sidebarOpen && (
            <TooltipContent className="bg-forest-900 text-forest-50 dark:bg-forest-50 dark:text-forest-900 rounded-md p-2 text-xs ml-2 font-medium break-inside-auto shadow-md flex z-50">
              {item.name === "RPGF3 Tracker" ? (
                <div className="flex space-x-1">
                  <div className="text-[#FF0420]">RetroPGF 3</div>{" "}
                  <div className="">Tracker</div>
                </div>
              ) : (
                item.label
              )}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    );

  if (item.key === "chains") {
    return (
      <div key={item.key} className="flex flex-col " suppressHydrationWarning>
        <Tooltip placement="right">
          <TooltipTrigger className="h-6 pl-0 md:pl-8 overflow-visible">
            <div
              className="group flex items-center justify-items-start mb-2 cursor-pointer relative"
              onClick={handleToggle}
            >
              <div className="w-6 mx-0">
                <div className="w-6 mx-auto">
                  {!item.name.includes("RPGF3 Tracker") ? (
                    <Icon icon={item.icon} className="h-7 w-7 p-0.5 mx-auto" />
                  ) : (
                    <Icon
                      icon={item.icon}
                      className="h-7 w-7 p-0 mx-auto fill-[#FF0420] text-[#FF0420]"
                    />
                  )}
                </div>
              </div>
              <div
                className={`absolute bottom-[10px] left-[23px] flex-1 flex items-center transition-all duration-300 origin-[-10px_4px]  ${isOpen ? "rotate-90" : "rotate-0"
                  }`}
              >
                <Icon
                  icon={"gtp:chevron-right"}
                  className="w-[8px] h-[8px] mr-2"
                />
              </div>
              {sidebarOpen && (
                <div className={`flex-1 flex items-start justify-between`}>
                  <div className="text-base font-bold mx-3 py-0.5 whitespace-nowrap">
                    {item.label}
                  </div>
                </div>
              )}
              {item.options.some((option) => option.showNew) && (
                <div
                  className={`transition-all duration-300 absolute top-0.5 bottom-0.5 right-[4px] md:right-0 text-xs flex items-center justify-center font-bold overflow-hidden pointer-events-none`}
                >
                  <div
                    className={`transition-all duration-300 w-[50px] h-full rounded-full md:rounded-br-none md:rounded-tr-none bg-gradient-to-t from-[#FFDF27] to-[#FE5468] ${!sidebarOpen || isOpen
                        ? "translate-x-[60px] ease-in-out opacity-0"
                        : "delay-300 translate-x-0 ease-in-out opacity-100"
                      }`}
                  >
                    <div
                      className={`transition-all duration-300 absolute inset-0 pr-[8px] rounded-full md:rounded-br-none md:rounded-tr-none text-xs flex items-center justify-end font-bold hard-shine-2 text-white dark:text-forest-900`}
                    >
                      NEW!
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TooltipTrigger>
          {!sidebarOpen && (
            <TooltipContent className="bg-forest-900 text-forest-50 dark:bg-forest-50 dark:text-forest-900 rounded-md p-2 text-xs ml-2 font-medium break-inside-auto shadow-md z-50">
              {item.label}
            </TooltipContent>
          )}
        </Tooltip>

        <div
          className={`flex flex-col overflow-hidden mb-[17px] w-full`}
          style={{
            transition: `all ${item.options.length * 0.01 + 0.1}s ease-in-out`,
            maxHeight: isOpen ? item.options.length * 40 + 40 : 0,
            paddingTop: isOpen ? "10px" : "0",
          }}
        >
          {Object.keys(ChainGroups).length > 0 &&
            Object.entries(ChainGroups).map(([bucket, chains]: any) => {
              if (chains.length === 0) return null;

              return (
                <div key={bucket}>
                  <div className="px-0 md:px-5 mt-[7px] mb-[2px] overflow-visible text-forest-800">
                    <div className="flex items-center justify-items-center rounded-full md:rounded-l-full relative">
                      <div className={`w-6 absolute left-[13px]`}>
                        <Icon
                          icon="feather:clock"
                          className={"h-[15px] w-[15px] mx-auto"}
                        />
                      </div>
                      <div
                        className={`text-[10px] w-48 font-medium break-inside-auto text-left ml-12 uppercase`}
                      >
                        {sidebarOpen ? bucket : <span>&nbsp;</span>}
                      </div>
                    </div>
                  </div>
                  {chains.map((option, i) => {
                    return (
                      <Tooltip key={option.key} placement="top-start">
                        <TooltipTrigger className="px-0 md:pl-5 w-full">
                          <Link
                            className={`group flex items-center justify-items-center rounded-l-full md:rounded-r-none relative w-full whitespace-nowrap ${urlParts[1]
                                .trim()
                                .localeCompare(option.urlKey) === 0
                                ? "bg-[#CDD8D3] dark:bg-forest-1000 hover:bg-[#F0F5F3] dark:hover:bg-[#5A6462]"
                                : "hover:bg-[#F0F5F3] dark:hover:bg-[#5A6462]"
                              }`}
                            href={`/${item.name.toLowerCase()}/${option.urlKey
                              }`}
                            onMouseOver={() => {
                              switch (item.name) {
                                case "Blockspace":
                                  preload(BlockspaceURLs[option.key], fetcher);
                                  break;
                                case "Chains":
                                  preload(ChainURLs[option.key], fetcher);
                                  break;
                                case "Fundamentals":
                                  preload(MetricsURLs[option.urlKey], fetcher);
                                  break;
                              }
                            }}
                          >
                            <div
                              className={`absolute top-0 left-[4px] w-[64px] h-[28px] bg-gradient-to-r from-transparent to-forest-50 dark:to-[#1F2726] transition-opacity ease-in-out ${sidebarOpen
                                  ? "opacity-0 duration-0"
                                  : "opacity-100 duration-500"
                                }`}
                            ></div>

                            <div
                              className={`w-6 absolute left-[13px]  ${urlParts[1]
                                  .trim()
                                  .localeCompare(option.urlKey) === 0
                                  ? "text-inherit"
                                  : "text-[#5A6462] group-hover:text-inherit"
                                }`}
                            >
                              {["Blockspace"].includes(item.name) && (
                                <Icon
                                  icon={option.icon}
                                  className={`${item.name === "Fundamentals"
                                      ? "h-4 w-4 mx-auto"
                                      : "h-[15px] w-[15px] mx-auto"
                                    } `}
                                />
                              )}
                            </div>
                            <div
                              className={`text-sm py-1 w-48 font-normal break-inside-auto transition-all duration-300 ease-in text-left ${sidebarOpen ? "ml-12" : "ml-4"
                                }`}
                            >
                              {option.label}
                              {option.showNew && (
                                <div
                                  className={`transition-all duration-300 absolute top-1 bottom-1 right-[4px] md:right-0 text-xs flex items-center justify-center font-bold overflow-hidden`}
                                >
                                  <div
                                    className={`transition-all duration-300 w-[50px] h-full rounded-full md:rounded-br-none md:rounded-tr-none bg-gradient-to-t from-[#FFDF27] to-[#FE5468] ${sidebarOpen && isOpen
                                        ? "delay-300 translate-x-[0px] ease-in-out opacity-100"
                                        : "translate-x-[60px] ease-in-out opacity-0"
                                      }`}
                                  >
                                    <div
                                      className={`transition-all duration-300 absolute inset-0 pr-[8px] rounded-full md:rounded-br-none md:rounded-tr-none text-xs flex items-center justify-end font-bold hard-shine-2 text-white dark:text-forest-900`}
                                    >
                                      NEW!
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Link>
                        </TooltipTrigger>
                        {!sidebarOpen && (
                          <TooltipContent
                            className={`text-forest-900 dark:text-forest-50 py-1 px-4 text-base break-inside-auto shadow-md z-50 pointer-events-none ml-[8px] mt-[36px] flex items-center justify-items-center rounded-full md:rounded-l-full relative ${urlParts[1]
                                .trim()
                                .localeCompare(option.urlKey) === 0
                                ? "bg-[#CDD8D3] dark:bg-forest-1000"
                                : "bg-[#F0F5F3] dark:bg-[#5A6462]"
                              }`}
                          >
                            {option.label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              );
            })}
        </div>
      </div>
    );
  }

  return (
    <div key={item.key} className="flex flex-col " suppressHydrationWarning>
      <Tooltip placement="right">
        <TooltipTrigger className="h-6 pl-0 md:pl-8 overflow-visible w-full relative">
          <div
            className="relative group flex items-center justify-items-start mb-2 cursor-pointer"
            onClick={handleToggle}
          >
            <div className="w-6 mx-0">
              <div className="w-6 mx-auto">
                {!item.name.includes("RPGF3 Tracker") ? (
                  <Icon icon={item.icon} className="h-7 w-7 p-0.5 mx-auto" />
                ) : (
                  <Icon
                    icon={item.icon}
                    className="h-7 w-7 p-0 mx-auto fill-[#FF0420] text-[#FF0420]"
                  />
                )}
              </div>
            </div>

            <div
              className={`absolute bottom-[10px] left-[23px] flex-1 flex items-center transition-all duration-300 origin-[-10px_4px]  ${isOpen ? "rotate-90" : "rotate-0"
                }`}
            >
              <Icon icon="gtp:chevron-right" className="w-[8px] h-[8px] mr-2" />
            </div>
            {sidebarOpen && (
              <div className={`flex-1 flex items-start justify-between`}>
                <div className="text-base font-bold mx-3 py-0.5 whitespace-nowrap">
                  {item.name === "RPGF3 Tracker" ? (
                    <>
                      <span className="text-[#FF0420]">RetroPGF 3</span>{" "}
                      <span className="text-black">Tracker</span>
                    </>
                  ) : (
                    item.label
                  )}
                </div>
              </div>
            )}
          </div>
          {item.options.some((option) => option.showNew) && (
            <div
              className={`transition-all duration-300 absolute top-0.5 bottom-0.5 right-[4px] md:right-0 text-xs flex items-center justify-center font-bold overflow-hidden pointer-events-none`}
            >
              <div
                className={`transition-all duration-300 w-[50px] h-full rounded-full md:rounded-br-none md:rounded-tr-none bg-gradient-to-t from-[#FFDF27] to-[#FE5468] ${!sidebarOpen || isOpen
                    ? "translate-x-[60px] ease-in-out opacity-0"
                    : "delay-300 translate-x-0 ease-in-out opacity-100"
                  }`}
              >
                <div
                  className={`transition-all duration-300 absolute inset-0 pr-[8px] rounded-full md:rounded-br-none md:rounded-tr-none text-xs flex items-center justify-end font-bold hard-shine-2 text-white dark:text-forest-900`}
                >
                  NEW!
                </div>
              </div>
            </div>
          )}
        </TooltipTrigger>
        {!sidebarOpen && (
          <TooltipContent className="bg-forest-900 text-forest-50 dark:bg-forest-50 dark:text-forest-900 rounded-md p-2 text-xs ml-2 font-medium break-inside-auto shadow-md z-50">
            {item.label}
          </TooltipContent>
        )}
      </Tooltip>

      <div
        className={`flex flex-col overflow-hidden mb-[17px] w-full whitespace-nowrap`}
        style={{
          transition: `all ${item.options.length * 0.01 + 0.1}s ease-in-out`,
          maxHeight: isOpen ? item.options.length * 40 + 40 : 0,
          paddingTop: isOpen ? "10px" : "0",
        }}
      >
        {item.options
          .filter((o) => o.hide !== true)
          .map((option, i) => {
            return (
              <div key={option.key}>
                {option.category &&
                  Object.keys(navigationCategories).includes(option.category) &&
                  (i === 0 ||
                    (i > 0 &&
                      item.options.filter((o) => o.hide !== true)[i - 1]
                        .category != option.category)) && (
                    <div className="px-0 md:pl-5 mt-[7px] mb-[2px] overflow-visible text-forest-800 ">
                      <div
                        className={`flex items-center justify-items-center rounded-full md:rounded-r-none relative `}
                      >
                        <div className={`w-6 absolute left-[13px]`}>
                          {navigationCategories[option.category].icon && (
                            <Icon
                              icon={navigationCategories[option.category].icon}
                              className={
                                item.name === "Fundamentals" ||
                                  item.name === "Trackers"
                                  ? "h-4 w-4 mx-auto"
                                  : "h-[15px] w-[15px] mx-auto"
                              }
                            />
                          )}
                        </div>
                        <div
                          className={`text-[10px] w-48 font-medium break-inside-auto text-left ml-12 uppercase`}
                        >
                          {sidebarOpen ? (
                            navigationCategories[option.category].label
                          ) : (
                            <span>&nbsp;</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                <Tooltip placement="top-start">
                  <TooltipTrigger className="px-0 md:pl-5 w-full">
                    <Link
                      className={`group flex items-center justify-items-center rounded-full md:rounded-r-none relative w-full ${urlParts[1].trim().localeCompare(option.urlKey) === 0
                          ? "bg-[#CDD8D3] dark:bg-forest-1000 hover:bg-[#F0F5F3] dark:hover:bg-[#5A6462]"
                          : "hover:bg-[#F0F5F3] dark:hover:bg-[#5A6462]"
                        } ${option.key === "chain-overview" ? "mt-1" : "mt-0"}`}
                      href={
                        option.key !== "feesxyz"
                          ? `/${item.name.toLowerCase()}/${option.urlKey}`
                          : "https://fees.growthepie.xyz/"
                      }
                      onMouseOver={() => {
                        if (!option.key) return;
                        switch (item.name) {
                          case "Blockspace":
                            preload(BlockspaceURLs[option.key], fetcher);
                            break;
                          case "Chains":
                            preload(ChainURLs[option.key], fetcher);
                            break;
                          case "Fundamentals":
                            preload(MetricsURLs[option.urlKey], fetcher);
                            break;
                        }
                      }}
                    >
                      <div
                        className={`absolute top-0 left-[4px] w-[64px] h-[28px] bg-gradient-to-r from-transparent to-forest-50 dark:to-[#1F2726] transition-opacity  ease-in-out ${sidebarOpen
                            ? "opacity-0 duration-0"
                            : "opacity-100 duration-500"
                          }`}
                      ></div>

                      <div
                        className={`w-6 absolute left-[13px]  ${urlParts[1].trim().localeCompare(option.urlKey) === 0
                            ? "text-inherit"
                            : "text-[#5A6462] group-hover:text-inherit"
                          }`}
                      >
                        {["Blockspace"].includes(item.name) && (
                          <Icon
                            icon={option.icon}
                            className={`${item.name === "Fundamentals" ||
                                item.name === "Trackers"
                                ? "h-4 w-4 mx-auto"
                                : "h-[15px] w-[15px] mx-auto"
                              } `}
                          />
                        )}
                      </div>
                      {option.category ? (
                        <div
                          className={`text-sm py-1 w-48 font-normal break-inside-auto transition-all duration-300 ease-in text-left ${sidebarOpen ? "ml-12" : "ml-4"
                            }`}
                        >
                          {option.label}
                        </div>
                      ) : (
                        <div
                          className={`text-sm py-1 w-48 font-normal break-inside-auto text-left ml-12`}
                        >
                          {sidebarOpen ? option.label : <span>&nbsp;</span>}
                        </div>
                      )}
                      {option.showNew && (
                        <div
                          className={`transition-all duration-300 absolute top-1 bottom-1 right-[4px] md:right-0 text-xs flex items-center justify-center font-bold overflow-hidden`}
                        >
                          <div
                            className={`transition-all duration-300 w-[50px] h-full rounded-full md:rounded-br-none md:rounded-tr-none bg-gradient-to-t from-[#FFDF27] to-[#FE5468] ${sidebarOpen && isOpen
                                ? "delay-300 translate-x-[0px] ease-in-out opacity-100"
                                : "translate-x-[60px] ease-in-out opacity-0"
                              }`}
                          >
                            <div
                              className={`transition-all duration-300 absolute inset-0 pr-[8px] rounded-full md:rounded-br-none md:rounded-tr-none text-xs flex items-center justify-end font-bold hard-shine-2 text-white dark:text-forest-900`}
                            >
                              NEW!
                            </div>
                          </div>
                        </div>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {!sidebarOpen && (
                    <TooltipContent
                      className={`text-forest-900 dark:text-forest-50 py-1 px-4 text-base break-inside-auto shadow-md z-50 pointer-events-none ml-[8px] mt-[36px] flex items-center justify-items-center rounded-full md:rounded-l-full relative ${urlParts[1].trim().localeCompare(option.urlKey) === 0
                          ? "bg-[#CDD8D3] dark:bg-forest-1000"
                          : "bg-[#F0F5F3] dark:bg-[#5A6462]"
                        }`}
                    >
                      {option.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            );
          })}
      </div>
    </div>
  );
}
