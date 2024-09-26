"use client";
import { useEffect, useState, ReactNode, useMemo, useRef } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import useSWR, { preload } from "swr";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipTrigger, TooltipContent } from "./Tooltip";
import {
  MasterURL,
  BlockspaceURLs,
  ChainsBaseURL,
  MetricsURLs,
} from "@/lib/urls";
import { NavigationItem, navigationItems } from "@/lib/navigation";
import { IS_PREVIEW } from "@/lib/helpers";
import { navigationCategories } from "@/lib/navigation";
import rpgf from "@/icons/svg/rpgf.svg";
import Image from "next/image";
import { MasterResponse } from "@/types/api/MasterResponse";
import {
  Get_AllChainsByKeys,
  Get_AllChainsNavigationItems,
  Get_SupportedChainKeys,
} from "@/lib/chains";
import GTPIcon from "./GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useMaster } from "@/contexts/MasterContext";
import { useUIContext } from "@/contexts/UIContext";

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

    const chainItemsByKey = Get_AllChainsNavigationItems(master)
      .options.filter((option) => option.hide !== true)
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

  const { isMobile } = useUIContext();

  const { AllChainsByKeys } = useMaster();

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const pathname = usePathname();

  console.log("pathname", pathname);

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

  console.log("urlParts", urlParts);

  useEffect(() => {
    const optionURLs = item.options.map((o) => o.url);
    if (optionURLs.includes(pathname)) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }

    // if (urlParts[0].length === 0 && item.name === "Fundamentals") {
    //   setIsOpen(true);
    // } else {
    //   setIsOpen(
    //     urlParts[0].toLowerCase() == item.name.toLowerCase() ? true : false,
    //   );
    // }
  }, [item.name, item.options, pathname, urlParts]);

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


  return (
    <Accordion icon={item.icon as GTPIconName} iconBackground="none" size="lg" background="none" label={item.label} onToggle={handleToggle} isOpen={isOpen} hideLabel={!sidebarOpen}>
      {item.label === "Chains" ?

        (
          <div className="pl-[9px] gap-y-[5px]">
            {Object.keys(ChainGroups).length > 0 &&
              Object.entries(ChainGroups).map(([bucket, chains]: any, i) => {
                if (chains.length === 0) return null;

                return (
                  <div key={bucket}>
                    <div className="text-[14px] font-bold text-[#5A6462] px-[5px] py-[5px]" style={{
                      fontVariant: "all-small-caps",
                    }}>
                      {sidebarOpen ? bucket.toUpperCase() : <span>&nbsp;</span>}
                    </div>
                    {chains.map((option, i) => {
                      return (
                        <>

                          <Accordion
                            key={option.key}
                            size={"sm"} background="none"
                            icon={option.icon as GTPIconName} iconBackground="dark" iconColor={option.url && pathname.localeCompare(option.url) === 0 ? AllChainsByKeys[option.key].colors["dark"][1] : "#5A6462"}
                            iconHoverColor={AllChainsByKeys[option.key].colors["dark"][1]}
                            label={option.label} hideLabel={!sidebarOpen}
                            link={option.url} isActive={option.url ? pathname.localeCompare(option.url) === 0 : false}
                            width={isMobile ? "100%" : "250px"}
                          />
                        </>
                      );
                    })}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="px-[3px] gap-y-[-5px]">
            {item.options
              .filter((o) => o.hide !== true)
              .map((option, i) => {
                let label = <></>;

                if (option.category) {
                  // check if this is the first item in the category
                  if (i === 0 || option.category !== item.options[i - 1].category) {
                    label = (
                      <div className="text-[14px] font-bold text-[#5A6462] p-[5px]" style={{
                        fontVariant: "all-small-caps",
                      }}>
                        {sidebarOpen ? navigationCategories[
                          option.category
                        ].label.toUpperCase() : <span>&nbsp;</span>}
                      </div>
                    );
                  }
                }


                return (
                  <>
                    {label}
                    <Accordion
                      key={option.key}
                      size={"md"} background="none"
                      icon={option.icon as GTPIconName} iconBackground="dark"
                      label={option.label} hideLabel={!sidebarOpen} link={option.url} isActive={option.url ? pathname.localeCompare(option.url) === 0 : false}
                      width={isMobile ? "100%" : "250px"}
                    />
                  </>
                );
              })}
          </div>
        )}
    </Accordion>
  );

  // // disable Blockspace menu item in production
  // if (item.name === "")
  //   return (
  //     <div className="group flex flex-col">
  //       <Tooltip key={item.name} placement="right">
  //         <TooltipTrigger className="h-6 mb-[17px] cursor-default pl-0 md:pl-8 overflow-visible">
  //           <div className="flex items-center justify-items-center opacity-70">
  //             <div className="w-[24px] mx-0">
  //               <div className="w-[24px] mx-auto grayscale">
  //                 <Icon
  //                   icon={item.icon}
  //                   className="h-[24px] w-[24px] p-0.5 mx-auto"
  //                 />
  //               </div>
  //             </div>
  //             <div className="">
  //               {sidebarOpen && (
  //                 <div className="text-base font-bold mx-3 w-80 flex space-x-3 items-center">
  //                   <span>{item.label}</span>
  //                   <div className="px-1 py-[2px] leading-[1] text-sm font-bold ml-1 rounded-[3px] bg-forest-900 text-forest-50 dark:bg-forest-50 dark:text-forest-900">
  //                     SOON
  //                   </div>
  //                 </div>
  //               )}
  //             </div>
  //           </div>
  //         </TooltipTrigger>
  //         {!sidebarOpen && (
  //           <TooltipContent className="bg-forest-900 text-forest-50 dark:bg-forest-50 dark:text-forest-900 rounded-md p-2 text-xs ml-2 font-medium break-inside-auto shadow-md flex z-50">
  //             {item.label}{" "}
  //             <div className="text-[0.5rem] leading-[1] px-1 py-1 font-bold ml-1 rounded-[4px] bg-forest-50 dark:bg-forest-900 text-forest-900 dark:text-forest-50">
  //               SOON
  //             </div>
  //           </TooltipContent>
  //         )}
  //       </Tooltip>
  //     </div>
  //   );

  // if (
  //   [
  //     "API Documentation",
  //     "Knowledge",
  //     "Contributors",
  //     "Home",
  //     "Blog",
  //     "RPGF3 Tracker",
  //   ].includes(item.name)
  // )
  //   return (
  //     <div key={item.name} className="group flex flex-col">
  //       {/* open in new tab */}
  //       <Tooltip placement="right">
  //         <TooltipTrigger className="h-6 mb-[17px] cursor-default pl-0 md:pl-8 overflow-visible">
  //           <Link
  //             target={
  //               ["API Documentation", "Knowledge", "Blog"].includes(item.name)
  //                 ? "_blank"
  //                 : ""
  //             }
  //             className="flex items-center justify-items-center"
  //             href={item.href ?? ""}
  //             rel={
  //               ["API Documentation", "Knowledge", "Blog"].includes(item.name)
  //                 ? "noopener noreferrer"
  //                 : ""
  //             }
  //           >
  //             <div className="w-[24px] mx-0">
  //               <div className="w-[24px] mx-auto">
  //                 {!item.name.includes("RPGF3 Tracker") ? (
  //                   <Icon
  //                     icon={item.icon}
  //                     className="h-[24px] w-[24px] p-0.5 mx-auto"
  //                   />
  //                 ) : (
  //                   <Icon
  //                     icon={item.icon}
  //                     className="h-[24px] w-[24px] p-1 mx-auto fill-[#FF0420] text-[#FF0420]"
  //                   />
  //                 )}
  //               </div>
  //             </div>
  //             <div className="">
  //               {sidebarOpen && (
  //                 <div className="text-[20px] font-bold mx-3 w-80 flex space-x-1">
  //                   {item.name === "RPGF3 Tracker" ? (
  //                     <div className="flex space-x-1 relative">
  //                       <div className="text-[#FF0420]">RetroPGF 3</div>{" "}
  //                       <div className="text-inherit">Tracker</div>
  //                       <Icon
  //                         icon="material-symbols:star"
  //                         className={`text-[#FF0420] self-center animate-bounce visible h-[8px] w-[8px] absolute -left-3`}
  //                       />
  //                       <Icon
  //                         icon="material-symbols:star"
  //                         className={`text-[#FF0420] self-center animate-bounce visible h-[8px] w-[8px] absolute -right-2.5`}
  //                       />
  //                     </div>
  //                   ) : (
  //                     item.label
  //                   )}
  //                 </div>
  //               )}
  //             </div>
  //           </Link>
  //         </TooltipTrigger>
  //         {!sidebarOpen && (
  //           <TooltipContent className="bg-forest-900 text-forest-50 dark:bg-forest-50 dark:text-forest-900 rounded-md p-2 text-xs ml-2 font-medium break-inside-auto shadow-md flex z-50">
  //             {item.name === "RPGF3 Tracker" ? (
  //               <div className="flex space-x-1">
  //                 <div className="text-[#FF0420]">RetroPGF 3</div>{" "}
  //                 <div className="">Tracker</div>
  //               </div>
  //             ) : (
  //               item.label
  //             )}
  //           </TooltipContent>
  //         )}
  //       </Tooltip>
  //     </div>
  //   );

  // if (item.key === "chains") {
  //   return (
  //     <div key={item.key} className="flex flex-col " suppressHydrationWarning>
  //       <Tooltip placement="right">
  //         <TooltipTrigger className="h-[44px] pl-0 md:pl-8 overflow-visible">
  //           <div
  //             className="group flex items-center justify-items-start mb-2 cursor-pointer relative"
  //             onClick={handleToggle}
  //           >
  //             <div className="w-[38px] mx-0">
  //               <div className="w-[38px] h-[38px] mx-auto flex items-center">
  //                 {!item.name.includes("RPGF3 Tracker") ? (
  //                   <Icon
  //                     icon={item.icon}
  //                     className="h-[38px] w-[38px] p-[5px] mx-auto"
  //                   />
  //                 ) : (
  //                   <Icon
  //                     icon={item.icon}
  //                     className="h-7 w-7 p-0 mx-auto fill-[#FF0420] text-[#FF0420]"
  //                   />
  //                 )}
  //               </div>
  //             </div>
  //             <div
  //               className={`absolute bottom-[14px] left-[33px] flex-1 flex items-center transition-all duration-300 origin-[-15px_5px] ${isOpen ? "rotate-90" : "rotate-0"
  //                 }`}
  //             >
  //               {/* <Icon
  //                 icon={"gtp:chevron-right"}
  //                 className="w-[8px] h-[8px] mr-2"
  //               /> */}
  //               <svg
  //                 width="4"
  //                 height="10"
  //                 viewBox="0 0 4 10"
  //                 fill="none"
  //                 xmlns="http://www.w3.org/2000/svg"
  //               >
  //                 <path
  //                   d="M0.898315 1.07129L2.89832 5.07129L0.898315 9.07129"
  //                   stroke="#CDD8D3"
  //                   stroke-width="1.5"
  //                   stroke-linejoin="round"
  //                 />
  //               </svg>
  //             </div>
  //             {sidebarOpen && (
  //               <div
  //                 className={`flex-1 h-[44px] flex items-center justify-between`}
  //               >
  //                 <div className="text-[20px] font-semibold mx-3 whitespace-nowrap">
  //                   {item.label}
  //                 </div>
  //               </div>
  //             )}
  //             {item.options.some((option) => option.showNew) && (
  //               <div
  //                 className={`transition-all duration-300 absolute top-0.5 bottom-0.5 right-[4px] md:right-0 text-xs flex items-center justify-center font-bold overflow-hidden pointer-events-none`}
  //               >
  //                 <div
  //                   className={`transition-all duration-300 w-[50px] h-full rounded-full md:rounded-br-none md:rounded-tr-none bg-gradient-to-t from-[#FFDF27] to-[#FE5468] ${!sidebarOpen || isOpen
  //                     ? "translate-x-[60px] ease-in-out opacity-0"
  //                     : "delay-300 translate-x-0 ease-in-out opacity-100"
  //                     }`}
  //                 >
  //                   <div
  //                     className={`transition-all duration-300 absolute inset-0 pr-[8px] rounded-full md:rounded-br-none md:rounded-tr-none text-xs flex items-center justify-end font-bold hard-shine-2 text-white dark:text-forest-900`}
  //                   >
  //                     NEW!
  //                   </div>
  //                 </div>
  //               </div>
  //             )}
  //           </div>
  //         </TooltipTrigger>
  //         {!sidebarOpen && (
  //           <TooltipContent className="bg-forest-900 text-forest-50 dark:bg-forest-50 dark:text-forest-900 rounded-md p-2 text-xs ml-2 font-medium break-inside-auto shadow-md z-50">
  //             {item.label}
  //           </TooltipContent>
  //         )}
  //       </Tooltip>

  //       <div
  //         className={`flex flex-col overflow-hidden w-full`}
  //         style={{
  //           transition: `all ${item.options.length * 0.01 + 0.1}s ease-in-out`,
  //           maxHeight: isOpen ? item.options.length * 40 + 40 : 0,
  //           // paddingTop: isOpen ? "10px" : "0",
  //         }}
  //       >
  //         {Object.keys(ChainGroups).length > 0 &&
  //           Object.entries(ChainGroups).map(([bucket, chains]: any, i) => {
  //             if (chains.length === 0) return null;

  //             return (
  //               <div key={bucket}>
  //                 <div
  //                   className={`px-0 md:pl-5 mb-[2px] overflow-visible text-[#5A6462] ${i === 0 ? "mt-[0px]" : "mt-[0px]"
  //                     }`}
  //                 >
  //                   <div
  //                     className={`flex items-center justify-items-center rounded-full md:rounded-r-none relative  ${sidebarOpen ? "visible" : "invisible"
  //                       }`}
  //                   >
  //                     <div className={`h-full`}></div>
  //                     <div
  //                       className={`text-[14px] font-bold break-inside-auto text-left ml-[16px]`}
  //                       style={{
  //                         fontVariant: "all-small-caps",
  //                       }}
  //                     >
  //                       {sidebarOpen ? bucket : <span>&nbsp;</span>}
  //                     </div>
  //                   </div>
  //                 </div>
  //                 {chains.map((option, i) => {
  //                   return (
  //                     <Tooltip key={option.key} placement="top-start">
  //                       <TooltipTrigger className="px-0 md:pl-[26px] w-full">
  //                         <Link
  //                           className={`group flex items-center justify-items-center rounded-l-full md:rounded-r-none relative w-full whitespace-nowrap ${urlParts[1]
  //                             .trim()
  //                             .localeCompare(option.urlKey) === 0
  //                             ? "bg-[#CDD8D3] dark:bg-forest-1000 hover:bg-[#F0F5F3] dark:hover:bg-[#5A6462]"
  //                             : "hover:bg-[#F0F5F3] dark:hover:bg-[#5A6462]"
  //                             }`}
  //                           href={
  //                             option.url
  //                               ? option.url
  //                               : `/${item.name.toLowerCase()}/${option.urlKey}`
  //                           }
  //                           onMouseOver={() => {
  //                             switch (item.name) {
  //                               case "Blockspace":
  //                                 preload(BlockspaceURLs[option.key], fetcher);
  //                                 break;
  //                               case "Chains":
  //                                 preload(
  //                                   `${ChainsBaseURL}${option.key}.json`,
  //                                   fetcher,
  //                                 );
  //                                 break;
  //                               case "Fundamentals":
  //                                 preload(MetricsURLs[option.urlKey], fetcher);
  //                                 break;
  //                             }
  //                           }}
  //                         >
  //                           <div
  //                             className={`absolute top-0 left-[4px] w-[64px] h-[28px] bg-gradient-to-r from-transparent to-forest-50 dark:to-[#1F2726] transition-opacity ease-in-out ${sidebarOpen
  //                               ? "opacity-0 duration-0"
  //                               : "opacity-100 duration-500"
  //                               }`}
  //                           ></div>

  //                           <div
  //                             className={`w-6 absolute left-[13px]  ${urlParts[1]
  //                               .trim()
  //                               .localeCompare(option.urlKey) === 0
  //                               ? "text-inherit"
  //                               : "text-[#5A6462] group-hover:text-inherit"
  //                               }`}
  //                           >
  //                             {["Blockspace"].includes(item.name) && (
  //                               <Icon
  //                                 icon={option.icon}
  //                                 className={`${item.name === "Fundamentals"
  //                                   ? "h-4 w-4 mx-auto"
  //                                   : "h-[15px] w-[15px] mx-auto"
  //                                   } `}
  //                               />
  //                             )}
  //                           </div>
  //                           <div>
  //                             <div className={`w-full`}>
  //                               <div className="w-full flex items-center gap-x-[15px]">
  //                                 <div
  //                                   className={`w-[26px] h-[26px] flex items-center justify-center rounded-full bg-[#151A19] ml-[11px]`}
  //                                 >
  //                                   <Icon
  //                                     icon={option.icon.replace("_", "-")}
  //                                     className="h-[15px] w-[15px] text-[#5A6462] "
  //                                   />
  //                                 </div>
  //                                 {option.category ? (
  //                                   <div
  //                                     className={`text-[14px] py-1 w-48 font-bold break-inside-auto transition-all duration-300 ease-in text-left `}
  //                                   >
  //                                     {option.label}
  //                                   </div>
  //                                 ) : (
  //                                   <div
  //                                     className={`text-[14px] py-1 w-48 font-bold break-inside-auto transition-all duration-300 ease-in text-left `}
  //                                   >
  //                                     {sidebarOpen ? (
  //                                       option.label
  //                                     ) : (
  //                                       <span>&nbsp;</span>
  //                                     )}
  //                                   </div>
  //                                 )}
  //                               </div>
  //                               {option.showNew && (
  //                                 <div
  //                                   className={`transition-all duration-300 absolute top-1 bottom-1 right-[4px] md:right-0 text-xs flex items-center justify-center font-bold overflow-hidden`}
  //                                 >
  //                                   <div
  //                                     className={`transition-all duration-300 w-[50px] h-full rounded-full md:rounded-br-none md:rounded-tr-none bg-gradient-to-t from-[#FFDF27] to-[#FE5468] ${sidebarOpen && isOpen
  //                                       ? "delay-300 translate-x-[0px] ease-in-out opacity-100"
  //                                       : "translate-x-[60px] ease-in-out opacity-0"
  //                                       }`}
  //                                   >
  //                                     <div
  //                                       className={`transition-all duration-300 absolute inset-0 pr-[8px] rounded-full md:rounded-br-none md:rounded-tr-none text-xs flex items-center justify-end font-bold hard-shine-2 text-white dark:text-forest-900`}
  //                                     >
  //                                       NEW!
  //                                     </div>
  //                                   </div>
  //                                 </div>
  //                               )}
  //                             </div>
  //                           </div>
  //                         </Link>
  //                       </TooltipTrigger>
  //                       {!sidebarOpen && (
  //                         <TooltipContent
  //                           className={`text-forest-900 dark:text-forest-50 py-1 px-4 text-base break-inside-auto shadow-md z-50 pointer-events-none ml-[24px] mt-[42px] flex items-center justify-items-center rounded-full md:rounded-l-full relative ${urlParts[1]
  //                             .trim()
  //                             .localeCompare(option.urlKey) === 0
  //                             ? "bg-[#CDD8D3] dark:bg-forest-1000"
  //                             : "bg-[#F0F5F3] dark:bg-[#5A6462]"
  //                             }`}
  //                         >
  //                           <div className="w-full flex items-center gap-x-[15px]">
  //                             <div
  //                               className={`w-[26px] h-[26px] min-w-[26px] min-h-[26px] flex items-center justify-center rounded-full bg-[#151A19] relative right-[4px]`}
  //                             >
  //                               <Icon
  //                                 icon={option.icon}
  //                                 className="h-[15px] w-[15px] text-[#5A6462] "
  //                               />
  //                             </div>

  //                             <div
  //                               className={`text-[14px] py-1  font-bold break-inside-auto transition-all duration-300 ease-in text-left relative right-[4px]`}
  //                             >
  //                               {option.label}
  //                             </div>
  //                           </div>
  //                         </TooltipContent>
  //                       )}
  //                     </Tooltip>
  //                   );
  //                 })}
  //               </div>
  //             );
  //           })}
  //       </div>
  //     </div>
  //   );
  // }

  // return (
  //   <div key={item.key} className="flex flex-col " suppressHydrationWarning>
  //     <Tooltip placement="right">
  //       <TooltipTrigger className="h-[44px] pl-0 md:pl-8 overflow-visible w-full relative">
  //         <div
  //           className="relative group flex items-center justify-items-start cursor-pointer"
  //           onClick={handleToggle}
  //         >
  //           <div className="w-[38px] mx-0">
  //             <div className="w-[38px] h-[38px] mx-auto flex items-center">
  //               {!item.name.includes("RPGF3 Tracker") ? (
  //                 <Icon
  //                   icon={item.icon}
  //                   className="h-[38px] w-[38px] p-[5px] mx-auto"
  //                 />
  //               ) : (
  //                 <Icon
  //                   icon={item.icon}
  //                   className="h-[24px] w-[24px] p-0 mx-auto fill-[#FF0420] text-[#FF0420]"
  //                 />
  //               )}
  //             </div>
  //           </div>

  //           <div
  //             className={`absolute bottom-[14px] left-[33px] flex-1 flex items-center transition-all duration-300 origin-[-15px_5px]  ${isOpen ? "rotate-90" : "rotate-0"
  //               }`}
  //           >
  //             {/* <Icon icon="gtp:chevron-right" className="w-[8px] h-[8px] mr-2" /> */}
  //             <svg
  //               width="4"
  //               height="10"
  //               viewBox="0 0 4 10"
  //               fill="none"
  //               xmlns="http://www.w3.org/2000/svg"
  //             >
  //               <path
  //                 d="M0.898315 1.07129L2.89832 5.07129L0.898315 9.07129"
  //                 stroke="#CDD8D3"
  //                 stroke-width="1.5"
  //                 stroke-linejoin="round"
  //               />
  //             </svg>
  //           </div>
  //           {sidebarOpen && (
  //             <div
  //               className={`flex-1 h-[44px] flex items-center justify-between`}
  //             >
  //               <div className="text-[20px] font-semibold mx-3 whitespace-nowrap">
  //                 {item.name === "RPGF3 Tracker" ? (
  //                   <>
  //                     <span className="text-[#FF0420]">RetroPGF 3</span>{" "}
  //                     <span className="text-black">Tracker</span>
  //                   </>
  //                 ) : (
  //                   item.label
  //                 )}
  //               </div>
  //             </div>
  //           )}
  //         </div>
  //         {item.options.some((option) => option.showNew) && (
  //           <div
  //             className={`transition-all duration-300 absolute top-0.5 bottom-0.5 right-[4px] md:right-0 text-xs flex items-center justify-center font-bold overflow-hidden pointer-events-none`}
  //           >
  //             <div
  //               className={`transition-all duration-300 w-[50px] h-full rounded-full md:rounded-br-none md:rounded-tr-none bg-gradient-to-t from-[#FFDF27] to-[#FE5468] ${!sidebarOpen || isOpen
  //                 ? "translate-x-[60px] ease-in-out opacity-0"
  //                 : "delay-300 translate-x-0 ease-in-out opacity-100"
  //                 }`}
  //             >
  //               <div
  //                 className={`transition-all duration-300 absolute inset-0 pr-[8px] rounded-full md:rounded-br-none md:rounded-tr-none text-xs flex items-center justify-end font-bold hard-shine-2 text-white dark:text-forest-900`}
  //               >
  //                 NEW!
  //               </div>
  //             </div>
  //           </div>
  //         )}
  //       </TooltipTrigger>
  //       {!sidebarOpen && (
  //         <TooltipContent className="bg-forest-900 text-forest-50 dark:bg-forest-50 dark:text-forest-900 rounded-md p-2 text-xs ml-2 font-medium break-inside-auto shadow-md z-50">
  //           {item.label}
  //         </TooltipContent>
  //       )}
  //     </Tooltip>

  //     <div
  //       className={`flex flex-col overflow-hidden w-full whitespace-nowrap`}
  //       style={{
  //         transition: `all ${item.options.length * 0.01 + 0.1}s ease-in-out`,
  //         maxHeight: isOpen ? item.options.length * 50 + 50 : 0,
  //         // paddingTop: isOpen ? "10px" : "0",
  //       }}
  //     >
  //       {item.options
  //         .filter((o) => o.hide !== true)
  //         .map((option, i) => {
  //           return (
  //             <div key={option.key}>
  //               {option.category &&
  //                 Object.keys(navigationCategories).includes(option.category) &&
  //                 (i === 0 ||
  //                   (i > 0 &&
  //                     item.options.filter((o) => o.hide !== true)[i - 1]
  //                       .category != option.category)) && (
  //                   <div
  //                     className={`px-0 md:pl-5 overflow-visible text-[#5A6462] ${i === 0 ? "mt-[0px]" : "mt-[0px]"
  //                       } `}
  //                   >
  //                     <div
  //                       className={`flex items-center justify-items-center rounded-full md:rounded-r-none relative  ${sidebarOpen ? "visible" : "invisible"
  //                         }`}
  //                     >
  //                       <div className={`h-full`}></div>
  //                       <div
  //                         className={`text-[14px] font-bold break-inside-auto text-left ml-[16px]`}
  //                         style={{
  //                           fontVariant: "all-small-caps",
  //                         }}
  //                       >
  //                         {sidebarOpen ? (
  //                           navigationCategories[
  //                             option.category
  //                           ].label.toUpperCase()
  //                         ) : (
  //                           <span>&nbsp;</span>
  //                         )}
  //                       </div>
  //                     </div>
  //                   </div>
  //                 )}
  //               <Tooltip placement="top-start">
  //                 <TooltipTrigger
  //                   className={`px-0 md:pl-[26px] w-full ${!option.category ? "mt-[26px]" : "mt-0"
  //                     }`}
  //                 >
  //                   <Link
  //                     className={`group flex h-[36px] items-center justify-items-center rounded-full md:rounded-r-none relative w-full ${urlParts[1].trim().localeCompare(option.urlKey) === 0
  //                       ? "bg-[#CDD8D3] dark:bg-forest-1000 hover:bg-[#F0F5F3] dark:hover:bg-[#5A6462]"
  //                       : "hover:bg-[#F0F5F3] dark:hover:bg-[#5A6462]"
  //                       } ${option.key === "chain-overview" ? "mt-1" : "mt-0"}`}
  //                     href={
  //                       !option.key?.includes("https://")
  //                         ? option.url
  //                           ? option.url
  //                           : `/${item.name.toLowerCase()}/${option.urlKey}`
  //                         : option.key
  //                     }
  //                     rel={option.key?.includes("https://") ? "noopener" : ""}
  //                     target={option.key?.includes("https://") ? "_blank" : ""}
  //                     onMouseOver={() => {
  //                       if (!option.key) return;
  //                       switch (item.name) {
  //                         case "Blockspace":
  //                           preload(BlockspaceURLs[option.key], fetcher);
  //                           break;
  //                         case "Chains":
  //                           preload(
  //                             `${ChainsBaseURL}${option.key}.json`,
  //                             fetcher,
  //                           );
  //                           break;
  //                         case "Fundamentals":
  //                           preload(MetricsURLs[option.urlKey], fetcher);
  //                           break;
  //                       }
  //                     }}
  //                   >
  //                     <div
  //                       className={`absolute top-0 left-[4px] w-[64px] h-[36px] bg-gradient-to-r from-transparent to-forest-50 dark:to-[#1F2726] transition-opacity  ease-in-out ${sidebarOpen
  //                         ? "opacity-0 duration-0"
  //                         : "opacity-100 duration-500"
  //                         }`}
  //                     ></div>

  //                     <div className="w-full flex items-center gap-x-[15px]">
  //                       <div
  //                         className={`w-[26px] h-[26px] min-w-[26px] min-h-[26px] flex items-center justify-center rounded-full bg-[#151A19] ml-[11px]`}
  //                       >
  //                         <Icon
  //                           icon={option.icon}
  //                           className="h-[15px] w-[15px] text-[#5A6462] "
  //                         />
  //                       </div>
  //                       {option.category ? (
  //                         <div
  //                           className={`text-[14px] py-1 w-48 font-bold break-inside-auto transition-all duration-300 ease-in text-left `}
  //                         >
  //                           {sidebarOpen ? option.label : <span>&nbsp;</span>}
  //                         </div>
  //                       ) : (
  //                         <div
  //                           className={`text-[14px] py-1 w-48 font-bold break-inside-auto transition-all duration-300 ease-in text-left `}
  //                         >
  //                           {sidebarOpen ? option.label : <span>&nbsp;</span>}
  //                         </div>
  //                       )}
  //                     </div>
  //                     {option.showNew && (
  //                       <div
  //                         className={`transition-all duration-300 absolute top-1 bottom-1 right-[4px] md:right-0 text-xs flex items-center justify-center font-bold overflow-hidden`}
  //                       >
  //                         <div
  //                           className={`transition-all duration-300 w-[50px] h-full rounded-full md:rounded-br-none md:rounded-tr-none bg-gradient-to-t from-[#FFDF27] to-[#FE5468] ${sidebarOpen && isOpen
  //                             ? "delay-300 translate-x-[0px] ease-in-out opacity-100"
  //                             : "translate-x-[60px] ease-in-out opacity-0"
  //                             }`}
  //                         >
  //                           <div
  //                             className={`transition-all duration-300 absolute inset-0 pr-[8px] rounded-full md:rounded-br-none md:rounded-tr-none text-xs flex items-center justify-end font-bold hard-shine-2 text-white dark:text-forest-900`}
  //                           >
  //                             NEW!
  //                           </div>
  //                         </div>
  //                       </div>
  //                     )}
  //                   </Link>
  //                 </TooltipTrigger>
  //                 {!sidebarOpen && (
  //                   <TooltipContent
  //                     className={`text-forest-900 dark:text-forest-50 py-1 px-4 text-base break-inside-auto shadow-md z-50 pointer-events-none ml-[24px] mt-[42px] flex items-center justify-items-center rounded-full md:rounded-l-full relative ${urlParts[1].trim().localeCompare(option.urlKey) === 0
  //                       ? "bg-[#CDD8D3] dark:bg-forest-1000"
  //                       : "bg-[#F0F5F3] dark:bg-[#5A6462]"
  //                       }`}
  //                   >
  //                     <div className="w-full flex items-center gap-x-[15px]">
  //                       <div
  //                         className={`w-[26px] h-[26px] min-w-[26px] min-h-[26px] flex items-center justify-center rounded-full bg-[#151A19] relative right-[4px]`}
  //                       >
  //                         <Icon
  //                           icon={option.icon}
  //                           className="h-[15px] w-[15px] text-[#5A6462] "
  //                         />
  //                       </div>

  //                       <div
  //                         className={`text-[14px] py-1  font-bold break-inside-auto transition-all duration-300 ease-in text-left relative right-[4px]`}
  //                       >
  //                         {option.label}
  //                       </div>
  //                     </div>
  //                   </TooltipContent>
  //                 )}
  //               </Tooltip>
  //             </div>
  //           );
  //         })}
  //     </div>
  //   </div>
  // );
}



type AccordionProps = {
  icon: GTPIconName;
  iconColor?: string;
  iconHoverColor?: string;
  label: string;
  link?: string;
  background: "none" | "medium" | "dark-border";
  iconBackground?: "none" | "dark";
  size: "sm" | "md" | "lg";
  children?: ReactNode;
  maxHeight?: number;
  isOpen?: boolean;
  hideLabel?: boolean;
  isActive?: boolean;
  onToggle?: () => void;
  width?: string | undefined;
};

const Accordion = ({
  icon,
  iconColor = "#5A6462",
  iconHoverColor = undefined,
  label,
  link,
  background,
  iconBackground = "dark",
  size,
  children,
  maxHeight = 1000,
  isOpen = false,
  hideLabel = false,
  isActive = false,
  onToggle = () => { },
  width = undefined,
}: AccordionProps) => {
  // const [isOpen, setIsOpen] = useState(open);

  const iconBgSize = {
    sm: "26px",
    md: "26px",
    lg: "38px",
  }

  const iconSize = {
    sm: "15px",
    md: "15px",
    lg: "24px",
  }

  const height = {
    sm: "26px",
    md: "36px",
    lg: "44px",
  };

  const padding = {
    sm: "3px 16px 3px 0px",
    md: "3px 15px 3px 5px",
    lg: "3px 13px 3px 3px",
  };

  const gap = {
    sm: "0 15px",
    md: "0 15px",
    lg: "0 10px",
  };

  const bg = {
    none: "transparent",
    medium: "#1F2726",
    "dark-border": "#1F2726",
  };

  const border = {
    none: "none",
    medium: "none",
    "dark-border": "2px solid #151A19",
  };

  const fontSize = {
    sm: "14px",
    md: "14px",
    lg: "20px",
  };

  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [childrenHeight, setChildrenHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      setChildrenHeight(ref.current.clientHeight);
    }
  }, [children]);


  return (
    <Link
      className="flex flex-col relative overflow-visible"
      href={link ? link : ""}
      target={link && link.startsWith("http") ? "_blank" : ""}
      rel={link && link.startsWith("http") ? "noopener noreferrer" : ""}
      style={{
        width: width || "100%",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Tooltip placement="top-start">
        <TooltipTrigger>
          <div
            className={`w-full flex items-center justify-between ${hideLabel ? "rounded-full" : "rounded-full"}  ${children ? "cursor-pointer" : ""} ${isActive && "!bg-[#151A19]"} ${link && !hideLabel && "hover:!bg-[#5A6462]"}`}
            onClick={() => {
              onToggle && onToggle();
            }}
            style={{
              padding: padding[size],
              gap: gap[size],
              height: height[size],
              background: bg[background],
              border: border[background],
            }}
          >
            <DropdownIcon size={size} icon={icon} iconBackground={iconBackground} showArrow={children ? true : false} isOpen={isOpen} iconColor={isHovered && iconHoverColor ? iconHoverColor : iconColor} />
            <div
              className="flex-1 flex items-start justify-start font-semibold truncate transition-all duration-300"
              style={{
                fontSize: fontSize[size],
                opacity: hideLabel ? 0 : 1,
              }}
            >
              {label}
            </div>
          </div>
        </TooltipTrigger>
        {hideLabel && <TooltipContent className={`${hideLabel ? "z-50" : ""} pointer-events-none`}>
          <div className="absolute" style={{ top: 5, left: 0 }}>
            <div
              className={`flex items-center justify-between ${hideLabel ? "rounded-full" : "rounded-full"} ${isActive && "!bg-[#151A19]"}`}
              style={{
                padding: padding[size],
                gap: gap[size],
                height: height[size],
                background: "#5A6462",
                border: border[background],
                width: hideLabel ? undefined : width
              }}
            >
              <DropdownIcon size={size} icon={icon} iconBackground={iconBackground} showArrow={children ? true : false} isOpen={isOpen} iconColor={isHovered && iconHoverColor ? iconHoverColor : iconColor} />
              <div
                className="flex-1 flex items-start justify-start font-semibold truncate transition-all duration-300"
                style={{
                  fontSize: fontSize[size],
                  // opacity: hideLabel ? 0 : 1,
                }}
              >
                {label}
              </div>
            </div>
          </div>
        </TooltipContent>}
      </Tooltip>
      {children && (
        <div
          className={`overflow-hidden transition-[max-height] duration-300`}
          style={{
            maxHeight: isOpen ? childrenHeight : "0",
          }}
        >
          <div ref={ref}>
            {children}
          </div>
        </div>
      )
      }
    </Link >
  );
};

type DropdownIconProps = {
  size: "sm" | "md" | "lg";
  icon: GTPIconName;
  iconColor?: string;
  iconBackground: "none" | "dark";
  showArrow: boolean;
  isOpen?: boolean;
};

const DropdownIcon = ({ size, icon, iconColor, iconBackground, showArrow = false, isOpen = false }: DropdownIconProps) => {

  const iconBgSize = {
    sm: "26px",
    md: "26px",
    lg: "38px",
  }

  const iconSize = {
    sm: "15px",
    md: "15px",
    lg: "24px",
  }


  const iconBg = {
    none: "transparent",
    dark: "#151A19",
  };

  return (
    <div className="flex items-center justify-center rounded-full" style={{ width: iconBgSize[size], height: iconBgSize[size], background: iconBg[iconBackground] }}>
      <div className="relative flex h-full px-[5px] items-center justify-center">
        <GTPIcon icon={icon} style={{
          width: iconSize[size],
          height: iconSize[size],
          fontSize: iconSize[size],
          color: iconColor,
        }} />

        {showArrow && (
          <div
            className={`w-[5px] h-[10px] absolute right-0 transition-all duration-300`}
            style={{
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
              transformOrigin: `calc(-${iconSize[size]}/2) 50%`,
            }}
          >
            <svg width="5" height="10" viewBox="0 0 5 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.32446 1.07129L3.32446 5.07129L1.32446 9.07129" stroke="#CDD8D3" stroke-width="1.5" stroke-linejoin="round" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};