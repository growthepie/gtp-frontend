// components/layout/MobileMenuContent.tsx
"use client";
import { useEffect, useMemo, useRef, useState, memo } from "react";
import Link from "next/link";
import {
  navigationItems,
} from "@/lib/navigation";
import { Icon } from "@iconify/react";
import { SidebarMenuGroup, SidebarMenuLink } from "../SidebarMenuGroup";
import { usePathname, useSearchParams } from "next/navigation";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useMaster } from "@/contexts/MasterContext";
import VerticalScrollContainer from "../../VerticalScrollContainer";
import { track } from "@vercel/analytics";
import FocusSwitch from "../FocusSwitch";
import EthUsdSwitch from "../EthUsdSwitch";
import { GTPIcon } from "../GTPIcon";
import Sidebar from "@/components/sidebar/Sidebar";
// import Backgrounds from "./Backgrounds"; // Optional: if you want the visual effect

type MobileMenuContentProps = {
  onClose: () => void;
  isOpen: boolean;
};

const MobileMenuContent = memo(function MobileMenuContent({ onClose, isOpen }: MobileMenuContentProps) {
  const { ChainsNavigationItems } = useMaster();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [hasBeenOpened, setHasBeenOpened] = useState(false);

  // Memoize navigation items to prevent recalculation on every render
  const navigationItemsWithChains = useMemo(() => {
    if (ChainsNavigationItems) { // ChainsNavigationItems is already a NavigationItem | undefined
      const newNavigationItems = [...navigationItems];
      newNavigationItems.splice(3, 0, ChainsNavigationItems);
      return newNavigationItems;
    }
    return navigationItems;
  }, [ChainsNavigationItems]);

  // Track if the menu has ever been opened to lazy-load expensive content
  useEffect(() => {
    if (isOpen && !hasBeenOpened) {
      setHasBeenOpened(true);
    }
  }, [isOpen, hasBeenOpened]);

  // Close menu on internal route change
  useEffect(() => {
    // This effect will run when pathname or searchParams change.
    // We'll also call onClose explicitly when an internal link is clicked.
    // This is a fallback or for browser back/forward.
    // The primary close action for links is handled by passing onClose to SidebarMenuLink/Group.
  }, [pathname, searchParams]);


  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [scrollableHeight, setScrollableHeight] = useState(0);

  useEffect(() => {
    // Only calculate height when menu is open and has been rendered
    if (!isOpen || !hasBeenOpened) return;

    const calculateHeight = () => {
      if (containerRef.current && headerRef.current && footerRef.current) {
        const totalHeight = containerRef.current.clientHeight;
        const headerOffsetHeight = headerRef.current.offsetHeight;
        const footerOffsetHeight = footerRef.current.offsetHeight;
        // Consider margins around the scrollable area
        const navItemsVerticalMargins = 5; // e.g., 20px margin-top + 20px margin-bottom for the nav list
        const calculatedHeight = totalHeight - headerOffsetHeight - footerOffsetHeight - navItemsVerticalMargins;
        setScrollableHeight(calculatedHeight > 0 ? calculatedHeight : 0);
      }
    };

    // Use requestAnimationFrame for better performance
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(calculateHeight);
    }, 50); // Small delay to ensure DOM is ready

    const handleResize = () => {
      requestAnimationFrame(calculateHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [isOpen, hasBeenOpened]); // Only recalculate when menu opens

  // Mark first render as complete after initial render - only when menu opens
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setTimeout(() => {
      setIsFirstRender(false);
    }, 100); // Reduced to 100ms for faster responsiveness

    return () => clearTimeout(timer);
  }, [isOpen]); // Only trigger when menu opens

  // Don't render anything if never opened (saves initial memory)
  if (!hasBeenOpened && !isOpen) {
    return null;
  }

  return (
    <div 
      className={`flex w-full h-full items-end transition-all duration-300 overflow-hidden ease-in-out ${
        isOpen 
          ? 'opacity-100 pointer-events-auto' 
          : 'opacity-100 pointer-events-none'
      }`}
      style={{ 
        visibility: isOpen ? 'visible' : 'hidden',
        maxHeight: isOpen ? '630px' : '0',
        // top: isOpen ? 'auto' : '-100%' // Move out of flow when hidden
      }}
    >
      <div
        ref={containerRef}
        className="flex flex-col h-[calc(100dvh-120px)] w-[calc(100vw-40px)] bg-color-bg-default rounded-[22px] max-w-full max-h-[625px] will-change-transform mb-[5px]"
        style={{ transform: 'translateZ(0)' }} // Hardware acceleration for smoother rendering
      >
        {/* <Backgrounds isMobileMenu /> */} {/* Optional fancy background */}

        {/* Header */}
        <div ref={headerRef} className="p-[20px] pb-0 hidden">
          <div className="flex px-[5px] justify-between gap-x-[15px] items-center w-full">
            <Link href="/" onClick={onClose} className="h-[36px] w-[33.44px] relative block">
              {/* SVG Logo (copied from Sidebar.tsx mobile) */}
              <svg viewBox="0 0 43 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.9743 13.991C13.8893 12.805 14.2123 11.716 14.9053 10.66C15.3693 9.958 16.0273 9.2 16.7533 8.365C18.6263 6.208 20.9463 3.538 21.5143 0C22.7493 2.712 22.1503 5.349 20.7833 7.774C20.1683 8.864 19.4873 9.647 18.8373 10.394C18.0723 11.273 17.3513 12.102 16.8333 13.321C16.5483 13.984 16.3863 14.619 16.3103 15.24L13.9743 13.991Z" fill="url(#paint0_radial_mobile_menu_content)" />
                <path d="M17.9824 16.1366C18.2674 15.0906 18.7604 14.1126 19.4154 13.1636C19.9574 12.3716 20.4654 11.7846 20.9214 11.2576C22.4554 9.48264 23.4074 8.38064 23.1284 2.43164C23.3074 2.81364 23.4844 3.18164 23.6564 3.53664L23.6574 3.53864C25.1534 6.64464 26.2034 8.82264 24.4394 11.8136C23.5674 13.2916 22.9314 14.0266 22.3694 14.6766C21.7364 15.4076 21.1964 16.0326 20.5174 17.4866L17.9824 16.1366Z" fill="url(#paint1_radial_mobile_menu_content)" />
                <path d="M24.5515 15.1997C23.8635 16.0147 22.7405 17.1387 22.6895 17.2127L29.0445 13.6597C28.9115 12.4757 28.0385 11.0807 26.9655 9.09766C27.1825 11.7117 26.1625 13.2907 24.5515 15.1997Z" fill="url(#paint2_radial_mobile_menu_content)" />
                <path d="M28.9975 14.8408C28.8265 15.5988 27.8905 17.1758 27.2025 17.9948C25.0285 20.5808 23.8965 21.6838 22.0365 25.5748C21.9315 25.1538 21.8215 24.7568 21.7165 24.3778C21.1975 22.5058 20.8785 20.9468 21.5005 19.6028L28.9975 14.8408Z" fill="url(#paint3_radial_mobile_menu_content)" />
                <path d="M20.6021 23.6073C20.0701 22.0503 19.6881 20.7483 19.9661 19.1013L17.7441 17.6533C17.6211 20.0763 18.6561 22.9053 21.5141 26.5473C21.3621 25.6453 20.9061 24.4973 20.6021 23.6073Z" fill="url(#paint4_radial_mobile_menu_content)" />
                <path d="M16.2634 16.6883C16.3014 17.4763 16.7884 19.5593 17.2244 20.6613C15.9804 19.0743 14.6204 16.6393 14.2314 15.3633L16.2634 16.6883Z" fill="url(#paint5_radial_mobile_menu_content)" />
                <path d="M42.4344 28.5309C42.4344 24.9259 35.7304 21.8939 26.6704 21.0449C25.8064 22.0149 24.9424 23.2189 24.1164 24.9939L22.8724 27.3569C22.6354 27.7929 22.1984 28.0789 21.7134 28.1169C21.2204 28.1549 20.7454 27.9389 20.4514 27.5439L19.6534 26.4719C17.9914 24.3499 16.7754 22.6689 15.8164 21.0959C7.02341 22.0109 0.566406 24.9949 0.566406 28.5309C0.566406 32.7939 9.94841 36.2549 21.5054 36.2549C22.0634 36.2549 22.6174 36.2469 23.1654 36.2309L24.8614 31.4299L24.8754 31.3959C25.2494 30.4609 26.1494 29.8489 27.1504 29.8349H27.1574L42.1304 29.8749C42.2844 29.4979 42.4344 28.9239 42.4344 28.5309Z" fill="url(#paint6_radial_mobile_menu_content)" />
                <path d="M27.7677 36.359H39.4987L38.9857 37.66H27.3167L24.7188 45.071V37.201L26.5357 32.06C26.6387 31.8 26.8907 31.627 27.1737 31.623L41.3937 31.627L40.8677 32.909H28.9967L28.6327 33.991H40.4618L39.8997 35.277H28.1788L27.7677 36.359Z" fill="url(#paint7_radial_mobile_menu_content)" />
                <path d="M1.28711 31.9385C2.63811 35.7585 5.94411 40.2455 6.64711 40.9015C9.07511 43.1885 16.8981 45.0715 23.0591 45.0715V38.6325C12.3791 38.6325 4.04111 35.1735 1.28711 31.9385Z" fill="url(#paint8_radial_mobile_menu_content)" />
                <defs>
                  <radialGradient id="paint0_radial_mobile_menu_content" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(20.6405 4.73381) rotate(117.912) scale(13.0099 10.041)"><stop stopColor="#1DF7EF" /><stop offset="1" stopColor="#10808C" /></radialGradient>
                  <radialGradient id="paint1_radial_mobile_menu_content" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(23.975 7.10799) rotate(115.692) scale(12.6028 9.18639)"><stop stopColor="#1DF7EF" /><stop offset="1" stopColor="#10808C" /></radialGradient>
                  <radialGradient id="paint2_radial_mobile_menu_content" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(27.8502 11.6183) rotate(127.548) scale(7.72106 6.96057)"><stop stopColor="#1DF7EF" /><stop offset="1" stopColor="#10808C" /></radialGradient>
                  <radialGradient id="paint3_radial_mobile_menu_content" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(27.5243 18.175) rotate(125.634) scale(9.96278 8.80191)"><stop stopColor="#1DF7EF" /><stop offset="1" stopColor="#10808C" /></radialGradient>
                  <radialGradient id="paint4_radial_mobile_menu_content" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(20.8038 20.416) rotate(112.642) scale(7.26953 4.81909)"><stop stopColor="#1DF7EF" /><stop offset="1" stopColor="#10808C" /></radialGradient>
                  <radialGradient id="paint5_radial_mobile_menu_content" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16.662 17.0089) rotate(119.008) scale(4.56987 3.61603)"><stop stopColor="#1DF7EF" /><stop offset="1" stopColor="#10808C" /></radialGradient>
                  <radialGradient id="paint6_radial_mobile_menu_content" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(34.5664 25.7694) rotate(159.689) scale(33.0552 20.0765)"><stop stopColor="#FFDF27" /><stop offset="0.9999" stopColor="#FE5468" /></radialGradient>
                  <radialGradient id="paint7_radial_mobile_menu_content" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(38.2601 35.8002) rotate(140.592) scale(15.9797 14.6242)"><stop stopColor="#1DF7EF" /><stop offset="0.9999" stopColor="#10808C" /></radialGradient>
                  <radialGradient id="paint8_radial_mobile_menu_content" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(18.9676 36.0178) rotate(148.427) scale(18.9214 15.7481)"><stop stopColor="#1DF7EF" /><stop offset="0.9999" stopColor="#10808C" /></radialGradient>
                </defs>
              </svg>
            </Link>

            <div className="flex gap-x-[15px] items-center">
              {/* Social Links */}
              <Link href="https://www.github.com/growthepie" target="_blank" rel="noopener" className="text-forest-200" onClick={() => { track("clicked Github link", { location: "mobile menu", page: pathname }); onClose(); }}>
                <Icon icon="cib:github" className="h-[19px] w-[19px]" />
              </Link>
              <Link href="https://discord.gg/fxjJFe7QyN" target="_blank" rel="noopener" className="text-forest-200" onClick={() => { track("clicked Discord link", { location: "mobile menu", page: pathname }); onClose(); }}>
                <Icon icon="cib:discord" className="h-[19px] w-[19px]" />
              </Link>
              <Link href="https://twitter.com/growthepie_eth" target="_blank" rel="noopener" className="text-forest-200" onClick={() => { track("clicked Twitter link", { location: "mobile menu", page: pathname }); onClose(); }}>
                <Icon icon="gtp:twitter" className="h-[19px] w-[19px]" />
              </Link>
              <Link href="https://share.lens.xyz/u/growthepie.lens" target="_blank" rel="noopener" className="text-forest-200" onClick={() => { track("clicked Lens link", { location: "mobile menu", page: pathname }); onClose(); }}>
                <Icon icon="gtp:lens" className="h-[19px] w-[24px]" />
              </Link>
              <Link href="https://warpcast.com/growthepie" target="_blank" rel="noopener" className="text-forest-200" onClick={() => { track("clicked Warpcast link", { location: "mobile menu", page: pathname }); onClose(); }}>
                <Icon icon="gtp:farcaster" className="h-[19px] w-[19px]" />
              </Link>
              {/* Close Button */}
              <button className="flex h-full items-center" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 6.21918C6.51256 5.92629 6.98744 5.92629 7.28033 6.21918L12 10.9389L16.7197 6.21918C17.0126 5.92629 17.4874 5.92629 17.7803 6.21918C18.0732 6.51207 18.0732 6.98695 17.7803 7.27984L13.0607 11.9995L17.7803 16.7192C18.0732 17.0121 18.0732 17.4869 17.7803 17.7798C17.4874 18.0727 17.0126 18.0727 16.7197 17.7798L12 13.0602L7.28033 17.7798C6.98744 18.0727 6.51256 18.0727 6.21967 17.7798C5.92678 17.4869 5.92678 17.0121 6.21967 16.7192L10.9393 11.9995L6.21967 7.27984C5.92678 6.98695 5.92678 6.51207 6.21967 6.21918Z" fill="#CDD8D3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="mt-[5px] mb-[5px] flex-grow overflow-hidden pl-[5px] pr-[5px]">
          {isOpen && scrollableHeight > 0 ? (
            <VerticalScrollContainer height={scrollableHeight} scrollbarPosition="right" scrollbarAbsolute={false} scrollbarWidth="6px">
              {/* {navigationItemsWithChains.map((item) =>
                item.href ? (
                  <SidebarMenuLink
                    key={item.name + "_mobile_link"}
                    item={item}
                    sidebarOpen={true} // In mobile menu, labels always visible
                    onClose={onClose}   // Pass onClose to handle popover closing
                    disableAnimation={isFirstRender}
                  />
                ) : (
                  <SidebarMenuGroup
                    key={item.name + "_mobile_item"}
                    item={item}
                    sidebarOpen={true} // In mobile menu, labels always visible
                    onClose={onClose}   // Pass onClose for child links
                    disableAnimation={isFirstRender}
                  />
                )
              )} */}
              <Sidebar isOpen={true} />
            </VerticalScrollContainer>
          ) : isOpen ? (
            // Show loading only when menu is open but height not calculated yet
            <div className="h-full w-full flex items-center justify-center">
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-forest-500 border-t-transparent"></div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div ref={footerRef} className="p-[10px] pt-0 mt-auto">
          <div className="flex flex-col justify-end pt-3 pb-0 relative">
            {/* <div className="text-[0.7rem] flex justify-evenly w-full gap-x-6 text-color-text-primary/80 hover:text-color-text-primary/100 leading-[1] px-2 mb-[17px]">
              <Link href="/privacy-policy" onClick={onClose} className="hover:text-forest-200/80">Privacy Policy</Link>
              <Link href="/imprint" onClick={onClose} className="hover:text-forest-200/80">Imprint</Link>
              <Link
                rel="noopener"
                target="_blank"
                href="https://discord.com/channels/1070991734139531294/1095735245678067753"
                className="hover:text-forest-200/80"
                onClick={() => {
                  track("clicked feedback link", { location: "mobile menu", page: pathname });
                  onClose();
                }}
              >
                Feedback
              </Link>
            </div> */}
            <div className="items-end justify-center flex gap-x-[15px] mt-[2px] mb-[0px]">
              <FocusSwitch isMobile />
              <EthUsdSwitch isMobile />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col w-[54px] h-full gap-y-[15px] items-center justify-end pl-[5px] pb-[10px]">
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
          <GTPIcon icon={"github" as GTPIconName} size="md" />
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
          {/* <Icon icon="cib:discord" className="h-[19px] w-[19px]" /> */}
          <GTPIcon icon={"discord" as GTPIconName} size="md" />
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
          {/* <Icon icon="gtp:twitter" className="h-[19px] w-[19px]" /> */}
          <GTPIcon icon="twitter" size="md" />
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
          {/* <Icon icon="gtp:lens" className="h-[19px] w-[24px]" /> */}
          <GTPIcon icon="lens" size="md" />
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
          <GTPIcon icon="farcaster" size="md" />
        </Link>
      </div>
    </div>
  );
});

export default MobileMenuContent;