"use client";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { SidebarMenuGroup, SidebarMenuLink } from "./SidebarMenuGroup";
import Link from "next/link";
import {
  navigationItems,
} from "@/lib/navigation";
import { useUIContext } from "@/contexts/UIContext";
import { Icon } from "@iconify/react";
import EthUsdSwitch from "./EthUsdSwitch";

import { usePathname, useSearchParams } from "next/navigation";
import Backgrounds from "./Backgrounds";
import { useTheme } from "next-themes";
import { track } from "@/lib/tracking";
import { useMaster } from "@/contexts/MasterContext";
import VerticalScrollContainer from "../VerticalScrollContainer";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import FocusSwitch from "./FocusSwitch";
import { GTPIcon } from "./GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useLocalStorage } from "usehooks-ts";
import { IS_PRODUCTION } from "@/lib/helpers";
import { useIsStaleSession } from "@/hooks/useIsStaleSession";

type SidebarProps = {
  className?: string;
  children?: ReactNode;
  isMobile?: boolean;
};

export default function Sidebar({ isMobile = false }: SidebarProps) {
  const isSidebarOpen = useUIContext((state) => state.isSidebarOpen);
  const isMobileSidebarOpen = useUIContext((state) => state.isMobileSidebarOpen);
  const toggleMobileSidebar = useUIContext((state) => state.toggleMobileSidebar);
  const isStale = useIsStaleSession();
  // const [showGlobalSearchBar, setShowGlobalSearchBar] = useLocalStorage("showGlobalSearchBar", true);
  const showGlobalSearchBar = true;


  const { ChainsNavigationItems } = useMaster();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();

  // pop ChainNavigationItems into navigationItems
  const navigationItemsWithChains = useMemo(() => {
    if (ChainsNavigationItems) {
      const newNavigationItems = [...navigationItems];
      newNavigationItems.splice(3, 0, ChainsNavigationItems);

      // if not production, add the chains rework item
      if(!IS_PRODUCTION) {
        // console.log("ChainsNavigationItems", ChainsNavigationItems);
        newNavigationItems.splice(3, 0, {...ChainsNavigationItems, name: "Chains", label: "Chains Rework", key: "chains-rework"});
      }

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

  if (isMobile && !showGlobalSearchBar)
    return (
      <>
        <button
          className={`z-[999] transition-colors duration-200 ${isMobileSidebarOpen ? "hidden" : "block"
            } p-[5px] ${
            // if scroll position is 20px or more from top, add bg and shadow
            scrollHeight > 0
              ? "fixed bg-white dark:bg-color-ui-active shadow-md rounded-full border-2 border-forest-900 dark:border-forest-200 right-[17px] top-[26px]"
              : `fixed rounded-full border-2 border-transparent right-[17px] top-[26px]`
            }`}
          // style={{
          //   top: scrollHeight >= 15 ? "20px" : `calc(28px - ${scrollHeight}px)`,
          // }}
          onClick={() => {
            // if (isMobileSidebarOpen)
            //   track("closed Navigation Menu", {
            //     location: "mobile sidebar",
            //     page: window.location.pathname,
            //   });
            // else
            //   track("opened Navigation Menu", {
            //     location: "mobile sidebar",
            //     page: window.location.pathname,
            //   });

            toggleMobileSidebar();
          }}
        >
          <GTPIcon icon={"feather:menu" as GTPIconName} size="md" />
        </button>
        {/* Mobile Sidebar */}
        <div
          suppressHydrationWarning
          className={`fixed top-0 right-0 z-[998] flex justify-end transform transition-transform duration-300 ease-in-out will-change-transform ${isMobileSidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
          aria-hidden={!isMobileSidebarOpen}
          style={{
            height: `100dvh`,
          }}
        >
          {/* Overlay */}
          {/* <div
            className={`absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${isMobileSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            onClick={toggleMobileSidebar}
          ></div> */}
          <div className="relative w-screen p-[20px] z-[999] flex flex-col justify-items-start select-none overflow-hidden">
            <div className="flex px-[5px] justify-between gap-x-[20px] items-end w-full pointer-events-auto">
              <Link href="/" prefetch={isStale ? false : undefined} className="h-[36px] w-[33.44px] relative">
                {/* <Image
                    src="/logo_pie_only.png"
                    alt="Forest"
                    className="antialiased"
                    fill={true}
                    quality={100}
                  /> */}
                <svg viewBox="0 0 43 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.9743 13.991C13.8893 12.805 14.2123 11.716 14.9053 10.66C15.3693 9.958 16.0273 9.2 16.7533 8.365C18.6263 6.208 20.9463 3.538 21.5143 0C22.7493 2.712 22.1503 5.349 20.7833 7.774C20.1683 8.864 19.4873 9.647 18.8373 10.394C18.0723 11.273 17.3513 12.102 16.8333 13.321C16.5483 13.984 16.3863 14.619 16.3103 15.24L13.9743 13.991Z" fill="url(#paint0_radial_6615_30338)" />
                  <path d="M17.9824 16.1366C18.2674 15.0906 18.7604 14.1126 19.4154 13.1636C19.9574 12.3716 20.4654 11.7846 20.9214 11.2576C22.4554 9.48264 23.4074 8.38064 23.1284 2.43164C23.3074 2.81364 23.4844 3.18164 23.6564 3.53664L23.6574 3.53864C25.1534 6.64464 26.2034 8.82264 24.4394 11.8136C23.5674 13.2916 22.9314 14.0266 22.3694 14.6766C21.7364 15.4076 21.1964 16.0326 20.5174 17.4866L17.9824 16.1366Z" fill="url(#paint1_radial_6615_30338)" />
                  <path d="M24.5515 15.1997C23.8635 16.0147 22.7405 17.1387 22.6895 17.2127L29.0445 13.6597C28.9115 12.4757 28.0385 11.0807 26.9655 9.09766C27.1825 11.7117 26.1625 13.2907 24.5515 15.1997Z" fill="url(#paint2_radial_6615_30338)" />
                  <path d="M28.9975 14.8408C28.8265 15.5988 27.8905 17.1758 27.2025 17.9948C25.0285 20.5808 23.8965 21.6838 22.0365 25.5748C21.9315 25.1538 21.8215 24.7568 21.7165 24.3778C21.1975 22.5058 20.8785 20.9468 21.5005 19.6028L28.9975 14.8408Z" fill="url(#paint3_radial_6615_30338)" />
                  <path d="M20.6021 23.6073C20.0701 22.0503 19.6881 20.7483 19.9661 19.1013L17.7441 17.6533C17.6211 20.0763 18.6561 22.9053 21.5141 26.5473C21.3621 25.6453 20.9061 24.4973 20.6021 23.6073Z" fill="url(#paint4_radial_6615_30338)" />
                  <path d="M16.2634 16.6883C16.3014 17.4763 16.7884 19.5593 17.2244 20.6613C15.9804 19.0743 14.6204 16.6393 14.2314 15.3633L16.2634 16.6883Z" fill="url(#paint5_radial_6615_30338)" />
                  <path d="M42.4344 28.5309C42.4344 24.9259 35.7304 21.8939 26.6704 21.0449C25.8064 22.0149 24.9424 23.2189 24.1164 24.9939L22.8724 27.3569C22.6354 27.7929 22.1984 28.0789 21.7134 28.1169C21.2204 28.1549 20.7454 27.9389 20.4514 27.5439L19.6534 26.4719C17.9914 24.3499 16.7754 22.6689 15.8164 21.0959C7.02341 22.0109 0.566406 24.9949 0.566406 28.5309C0.566406 32.7939 9.94841 36.2549 21.5054 36.2549C22.0634 36.2549 22.6174 36.2469 23.1654 36.2309L24.8614 31.4299L24.8754 31.3959C25.2494 30.4609 26.1494 29.8489 27.1504 29.8349H27.1574L42.1304 29.8749C42.2844 29.4979 42.4344 28.9239 42.4344 28.5309Z" fill="url(#paint6_radial_6615_30338)" />
                  <path d="M27.7677 36.359H39.4987L38.9857 37.66H27.3167L24.7188 45.071V37.201L26.5357 32.06C26.6387 31.8 26.8907 31.627 27.1737 31.623L41.3937 31.627L40.8677 32.909H28.9967L28.6327 33.991H40.4618L39.8997 35.277H28.1788L27.7677 36.359Z" fill="url(#paint7_radial_6615_30338)" />
                  <path d="M1.28711 31.9385C2.63811 35.7585 5.94411 40.2455 6.64711 40.9015C9.07511 43.1885 16.8981 45.0715 23.0591 45.0715V38.6325C12.3791 38.6325 4.04111 35.1735 1.28711 31.9385Z" fill="url(#paint8_radial_6615_30338)" />
                  <defs>
                    <radialGradient id="paint0_radial_6615_30338" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(20.6405 4.73381) rotate(117.912) scale(13.0099 10.041)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="1" stopColor="#10808C" />
                    </radialGradient>
                    <radialGradient id="paint1_radial_6615_30338" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(23.975 7.10799) rotate(115.692) scale(12.6028 9.18639)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="1" stopColor="#10808C" />
                    </radialGradient>
                    <radialGradient id="paint2_radial_6615_30338" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(27.8502 11.6183) rotate(127.548) scale(7.72106 6.96057)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="1" stopColor="#10808C" />
                    </radialGradient>
                    <radialGradient id="paint3_radial_6615_30338" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(27.5243 18.175) rotate(125.634) scale(9.96278 8.80191)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="1" stopColor="#10808C" />
                    </radialGradient>
                    <radialGradient id="paint4_radial_6615_30338" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(20.8038 20.416) rotate(112.642) scale(7.26953 4.81909)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="1" stopColor="#10808C" />
                    </radialGradient>
                    <radialGradient id="paint5_radial_6615_30338" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16.662 17.0089) rotate(119.008) scale(4.56987 3.61603)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="1" stopColor="#10808C" />
                    </radialGradient>
                    <radialGradient id="paint6_radial_6615_30338" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(34.5664 25.7694) rotate(159.689) scale(33.0552 20.0765)">
                      <stop stopColor="#FFDF27" />
                      <stop offset="0.9999" stopColor="#FE5468" />
                    </radialGradient>
                    <radialGradient id="paint7_radial_6615_30338" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(38.2601 35.8002) rotate(140.592) scale(15.9797 14.6242)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="0.9999" stopColor="#10808C" />
                    </radialGradient>
                    <radialGradient id="paint8_radial_6615_30338" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(18.9676 36.0178) rotate(148.427) scale(18.9214 15.7481)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="0.9999" stopColor="#10808C" />
                    </radialGradient>
                  </defs>
                </svg>
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
                      icon="gtp:farcaster-monochrome"
                      className="h-[19px] w-[19px]"
                    />
                  </Link>


                </div>
                {/* <div className="z-[999] flex items-center space-x-[16px] mb-0.5 w-full px-2"></div> */}
                <button
                  className="flex h-full items-center pr-[13px]"
                  onClick={toggleMobileSidebar}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 6.21918C6.51256 5.92629 6.98744 5.92629 7.28033 6.21918L12 10.9389L16.7197 6.21918C17.0126 5.92629 17.4874 5.92629 17.7803 6.21918C18.0732 6.51207 18.0732 6.98695 17.7803 7.27984L13.0607 11.9995L17.7803 16.7192C18.0732 17.0121 18.0732 17.4869 17.7803 17.7798C17.4874 18.0727 17.0126 18.0727 16.7197 17.7798L12 13.0602L7.28033 17.7798C6.98744 18.0727 6.51256 18.0727 6.21967 17.7798C5.92678 17.4869 5.92678 17.0121 6.21967 16.7192L10.9393 11.9995L6.21967 7.27984C5.92678 6.98695 5.92678 6.51207 6.21967 6.21918Z" fill="#CDD8D3" />
                  </svg>

                </button>
              </div>
            </div>
            <div ref={mobileRef} className="z-[999] mt-[30px] h-[calc(100vh-100px)] w-full flex flex-col justify-between overflow-hidden relative pointer-events-auto">
              {/* <div className="flex-1 w-full overflow-x-hidden relative overflow-y-auto scrollbar-thin scrollbar-thumb-forest-1000/50 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller"> */}
              <VerticalScrollContainer height={mobileHeight - 150} scrollbarPosition="right" scrollbarAbsolute={false} scrollbarWidth="6px">
                {navigationItemsWithChains.map((item) => 
                  item.href ? (
                    <SidebarMenuLink
                      key={item.label + "_link"}
                      item={item}
                      sidebarOpen={isSidebarOpen}
                    />
                  ) : (
                    <SidebarMenuGroup
                      key={item.label + "_item"}
                      item={item}
                      sidebarOpen={isSidebarOpen}
                    />
                  )
                )}
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
                  <FocusSwitch isMobile />
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
      </>
    );

  let sidebarWidths = {
    open: "w-[260px]",
    closed: "w-[92px]",
  }

  if (showGlobalSearchBar) {
    sidebarWidths.open = "w-[260px]";
    sidebarWidths.closed = "w-[74px]";
  }

  return (
    <div
      ref={ref}
      className={`flex-1 flex flex-col justify-items-start select-none overflow-y-hidden overflow-x-hidden -ml-[20px] will-change-[width] ${isSidebarOpen ? sidebarWidths.open : sidebarWidths.closed} transition-all duration-300`}
    // animate={{
    //   width: isSidebarOpen ? "229px" : "72px",
    // }}
    // transition={{
    //   duration: 0.3,
    // }}
    >
      {/* <div className="flex-1 flex flex-col gap-y-[10px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-forest-800/30 scrollbar-track-forest-800/10"> */}
      <VerticalScrollContainer height={height - 36} scrollbarPosition="left" scrollbarAbsolute={true} scrollbarWidth="6px">
        <div className="pl-[20px] w-[282px]">
          {navigationItemsWithChains.map((item) => 
            item.href ? (
              <SidebarMenuLink
                key={item.label + "_link"}
                item={item}
                sidebarOpen={isSidebarOpen}
              />
            ) : (
              <SidebarMenuGroup
                key={item.label + "_item"}
                item={item}
                sidebarOpen={isSidebarOpen}
              />
            )
          )}
        </div>
      </VerticalScrollContainer>

      {/* </div> */}
      <div className="flex flex-col justify-end pt-6 pb-3 relative"></div>
      {/* <div className="mt-[80px]"></div> */}
    </div>
  );
}
