"use client";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import SidebarMenuGroup from "./SidebarMenuGroup";
import Link from "next/link";
import {
  navigationItems,
  contributorsItem,
  apiDocsItem,
  // rpgfItem,
} from "@/lib/navigation";
import { useUIContext } from "@/contexts/UIContext";
import { Icon } from "@iconify/react";
import EthUsdSwitch from "./EthUsdSwitch";

import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import Backgrounds from "./Backgrounds";
import rpgf from "@/icons/svg/rpgf.svg";
import { useTheme } from "next-themes";
import { track } from "@vercel/analytics";
import { useMaster } from "@/contexts/MasterContext";
import Chain from "@/app/(layout)/chains/[chain]/page";
import { GTPIconName } from "@/icons/gtp-icon-names";
import GTPIcon from "./GTPIcon";
import VerticalScrollContainer from "../VerticalScrollContainer";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";

type SidebarProps = {
  className?: string;
  children?: ReactNode;
  isMobile?: boolean;
};

export default function Sidebar({ isMobile = false }: SidebarProps) {
  const { isSidebarOpen, isMobileSidebarOpen, toggleMobileSidebar } =
    useUIContext();

  const { ChainsNavigationItems } = useMaster();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();

  // pop ChainNavigationItems into navigationItems
  const navigationItemsWithChains = useMemo(() => {
    if (ChainsNavigationItems) {
      const newNavigationItems = [...navigationItems];
      newNavigationItems.splice(3, 0, ChainsNavigationItems);
      return newNavigationItems;
    }
    return navigationItems;
  }, [ChainsNavigationItems]);

  // detect if we are changing routes on mobile
  useEffect(() => {
    if (isMobile && isMobileSidebarOpen) {
      toggleMobileSidebar();
    }
  }, [isMobile, pathname, searchParams]);

  const [scrollHeight, setScrollHeight] = useState(0);

  // detect scroll position on mobile and add bg and shadow to menu button
  useEffect(() => {
    if (isMobile) {
      const handleScroll = () => {
        setScrollHeight(window.scrollY);
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [isMobile]);

  const [ref, { height }] = useElementSizeObserver<HTMLDivElement>();

  const mobileRef = useRef<HTMLDivElement>(null);
  const [mobileHeight, setMobileHeight] = useState(0);

  const handleMobileHeight = () => {
    if (mobileRef.current) {
      setMobileHeight(mobileRef.current.getBoundingClientRect().height);
    }
  };

  useEffect(() => {
    // add height observer to mobile sidebar
    handleMobileHeight();
    window.addEventListener("resize", handleMobileHeight);
    return () => window.removeEventListener("resize", handleMobileHeight);
  }, []);

  useEffect(() => {
    if (isMobileSidebarOpen) {
      handleMobileHeight();
    }
  }, [isMobileSidebarOpen]);

  if (isMobile)
    return (
      <>
        <button
          className={`z-[999] transition-colors duration-200 ${isMobileSidebarOpen ? "hidden" : "block"
            } ${
            // if scroll position is 20px or more from top, add bg and shadow
            scrollHeight > 0
              ? "fixed bg-white dark:bg-forest-1000 shadow-md rounded-full border-2 border-forest-900 dark:border-forest-200 p-2 right-[6px] top-[18px]"
              : `fixed right-[16px] top-[28px] border-transparent`
            }`}
          // style={{
          //   top: scrollHeight >= 15 ? "20px" : `calc(28px - ${scrollHeight}px)`,
          // }}
          onClick={() => {
            if (isMobileSidebarOpen)
              track("closed Navigation Menu", {
                location: "mobile sidebar",
                page: window.location.pathname,
              });
            else
              track("opened Navigation Menu", {
                location: "mobile sidebar",
                page: window.location.pathname,
              });

            toggleMobileSidebar();
          }}
        >
          <Icon icon="feather:menu" className="h-8 w-8" />
        </button>
        {/* {isMobileSidebarOpen && ( */}
        {isMobileSidebarOpen && (
          <div
            suppressHydrationWarning
            className={`transition-opacity z-[999] ${isMobileSidebarOpen
              ? "opacity-100 pointer-events-none"
              : "opacity-0 pointer-events-none"
              }`}
          >
            <div className="fixed inset-0 p-[20px] z-[999] flex flex-col justify-items-start select-none overflow-hidden">
              <div className="flex px-[5px] justify-between gap-x-[20px] items-end w-full pointer-events-auto">
                <Link href="/" className="h-[36px] w-[34px] relative">
                  <Image
                    src="/logo_pie_only.png"
                    alt="Forest"
                    className="antialiased"
                    fill={true}
                    quality={100}
                  />
                </Link>

                <div className="flex gap-x-[20px] items-end">
                  <div className="z-[999] flex items-center space-x-[16px] mb-0.5 w-full">
                    <Link
                      href="https://www.github.com/growthepie"
                      target="_blank"
                      rel="noopener"
                      className=" dark:text-forest-200 text-forest-900"
                      onClick={() => {
                        track("clicked Github link", {
                          location: "mobile sidebar",
                          page: window.location.pathname,
                        });
                      }}
                    >
                      <Icon icon="cib:github" className="h-[19px] w-[19px]" />
                    </Link>
                    <Link
                      href="https://discord.gg/fxjJFe7QyN"
                      target="_blank"
                      rel="noopener"
                      className=" dark:text-forest-200 text-forest-900"
                      onClick={() => {
                        track("clicked Discord link", {
                          location: "mobile sidebar",
                          page: window.location.pathname,
                        });
                      }}
                    >
                      <Icon icon="cib:discord" className="h-[19px] w-[19px]" />
                    </Link>
                    <Link
                      href="https://twitter.com/growthepie_eth"
                      target="_blank"
                      rel="noopener"
                      onClick={() => {
                        track("clicked Twitter link", {
                          location: "mobile sidebar",
                          page: window.location.pathname,
                        });
                      }}
                    >
                      <Icon icon="gtp:twitter" className="h-[19px] w-[19px]" />
                    </Link>
                    <Link
                      href="https://share.lens.xyz/u/growthepie.lens"
                      target="_blank"
                      rel="noopener"
                      className=" dark:text-forest-200 text-forest-900"
                      onClick={() => {
                        track("clicked Lens link", {
                          location: "mobile sidebar",
                          page: window.location.pathname,
                        });
                      }}
                    >
                      <Icon icon="gtp:lens" className="h-[19px] w-[24px]" />
                    </Link>

                    <Link
                      href="https://warpcast.com/growthepie"
                      target="_blank"
                      rel="noopener"
                      className=" dark:text-forest-200 text-forest-900"
                      onClick={() => {
                        track("clicked Warpcast link", {
                          location: "mobile sidebar",
                          page: window.location.pathname,
                        });
                      }}
                    >
                      <Icon
                        icon="gtp:farcaster"
                        className="h-[19px] w-[19px]"
                      />
                    </Link>


                  </div>
                  {/* <div className="z-[999] flex items-center space-x-[16px] mb-0.5 w-full px-2"></div> */}
                  <button
                    className="flex h-full items-center"
                    onClick={toggleMobileSidebar}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M6.21967 6.21918C6.51256 5.92629 6.98744 5.92629 7.28033 6.21918L12 10.9389L16.7197 6.21918C17.0126 5.92629 17.4874 5.92629 17.7803 6.21918C18.0732 6.51207 18.0732 6.98695 17.7803 7.27984L13.0607 11.9995L17.7803 16.7192C18.0732 17.0121 18.0732 17.4869 17.7803 17.7798C17.4874 18.0727 17.0126 18.0727 16.7197 17.7798L12 13.0602L7.28033 17.7798C6.98744 18.0727 6.51256 18.0727 6.21967 17.7798C5.92678 17.4869 5.92678 17.0121 6.21967 16.7192L10.9393 11.9995L6.21967 7.27984C5.92678 6.98695 5.92678 6.51207 6.21967 6.21918Z" fill="#CDD8D3" />
                    </svg>

                  </button>
                </div>
              </div>
              <div ref={mobileRef} className="z-[999] mt-[30px] h-[calc(100vh-100px)] w-full flex flex-col justify-between overflow-hidden relative pointer-events-auto">
                {/* <div className="flex-1 w-full overflow-x-hidden relative overflow-y-auto scrollbar-thin scrollbar-thumb-forest-1000/50 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller"> */}
                <VerticalScrollContainer height={mobileHeight - 100} scrollbarPosition="right" scrollbarAbsolute={false} scrollbarWidth="6px">
                  {navigationItemsWithChains.map((item) => (
                    <SidebarMenuGroup
                      key={item.name + "_item"}
                      item={item}
                      sidebarOpen={isMobileSidebarOpen}
                    />
                  ))}
                </VerticalScrollContainer>
                {/* </div> */}

                <div className="flex flex-col justify-end pt-3 pb-6 relative mb-[17px] pointer-events-auto">
                  <div className="text-[0.7rem] flex justify-evenly w-full gap-x-12 text-inherit leading-[1] px-2  mb-[17px]">
                    <Link href="/privacy-policy">Privacy Policy</Link>
                    <Link href="/imprint">Imprint</Link>
                    <Link
                      rel="noopener"
                      target="_blank"
                      href="https://discord.com/channels/1070991734139531294/1095735245678067753"
                      onClick={() => {
                        track("clicked feedback link", {
                          location: "mobile sidebar",
                          page: window.location.pathname,
                        });
                      }}
                    >
                      Feedback
                    </Link>
                  </div>
                  <div className="items-end justify-center z-[999] flex space-x-[15px] mt-[2px] mb-[17px]">
                    <EthUsdSwitch isMobile />
                  </div>
                </div>
                {/* <div className="mt-24 w-full text-center py-6 absolute bottom-0">
                  <div className="text-[0.7rem] text-inherit leading-[2] z-[999]">
                    © {new Date().getFullYear()} growthepie 🥧
                  </div>
                </div> */}
              </div>
            </div>
            <Backgrounds isMobileMenu />
          </div>
        )}
        {/* )} */}
      </>
    );

  return (
    <div
      ref={ref}
      className={`flex-1 flex flex-col justify-items-start select-none overflow-y-hidden overflow-x-hidden -ml-[20px] ${isSidebarOpen ? "w-[260px]" : "w-[92px]"} transition-all duration-300 `}
    // animate={{
    //   width: isSidebarOpen ? "229px" : "72px",
    // }}
    // transition={{
    //   duration: 0.3,
    // }}
    >
      {/* <div className="flex-1 flex flex-col gap-y-[10px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-forest-800/30 scrollbar-track-forest-800/10"> */}
      <VerticalScrollContainer height={height - 36} scrollbarPosition="left" scrollbarAbsolute={true} scrollbarWidth="6px">
        <div className="pl-[20px]">
          {navigationItemsWithChains.map((item) => (
            <SidebarMenuGroup
              key={item.name + "_item"}
              item={item}
              sidebarOpen={isSidebarOpen}
            />
          ))}
        </div>
      </VerticalScrollContainer>

      {/* </div> */}
      <div className="flex flex-col justify-end pt-6 pb-3 relative"></div>
      {/* <div className="mt-[80px]"></div> */}
    </div>
  );
}
