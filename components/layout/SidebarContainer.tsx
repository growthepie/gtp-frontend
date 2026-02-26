"use client";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "../sidebar/Sidebar";
import { getIcon, Icon } from "@iconify/react";
import { useUIContext } from "@/contexts/UIContext";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { useIsStaleSession } from "@/hooks/useIsStaleSession";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/tracking";
import { GTPIcon } from "./GTPIcon";
import { useOutsideAlerter } from "@/hooks/useOutsideAlerter";
import { useToast } from "../toast/GTPToast";
import { triggerBlobDownload } from "@/lib/icon-library/clientSvgUtils";
import { convertSvgToPngBlob } from "@/lib/icon-library/clientSvgUtils";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { createPortal } from "react-dom";
import { IconContextMenu } from "./IconContextMenu";

export default function SidebarContainer() {
  const isSidebarOpen = useUIContext((state) => state.isSidebarOpen);
  const toggleSidebar = useUIContext((state) => state.toggleSidebar);
  const isStale = useIsStaleSession();
  // const [showGlobalSearchBar, setShowGlobalSearchBar] = useLocalStorage("showGlobalSearchBar", true);
  const showGlobalSearchBar = true;

  const toast = useToast(); // Keep toast for fetch error
  const [logoFullSVG, setLogoFullSVG] = useState<string | null>(null);

  // Fetch the logo SVG
  useEffect(() => {
    const fetchLogoFullSVG = async () => {
      try {
        const response = await fetch("/logo-full.svg");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const logoFullSVGString = await response.text();
        setLogoFullSVG(logoFullSVGString);
      } catch (error) {
        console.error("Failed to fetch logo SVG:", error);
        toast.addToast({ // Use toast here for fetch error
          title: "Error",
          message: "Could not load logo SVG.",
          type: "error",
        });
      }
    };
    fetchLogoFullSVG();
  }, [toast]); // Dependency array includes toast

  const getLogoSvgData = useCallback(async (): Promise<{ svgString: string | null; width: number; height: number } | null> => {
    if (!logoFullSVG) {
      // Maybe try fetching again or return null
      await fetch("/logo-full.svg").then(res => res.text()).then(setLogoFullSVG).catch(() => { }); // Simple retry/refetch example
      if (!logoFullSVG) return null; // Return null if still not available
    }

    // Attempt to parse width and height from the SVG string
    const widthMatch = logoFullSVG.match(/width="(\d+(\.\d+)?)"/);
    const heightMatch = logoFullSVG.match(/height="(\d+(\.\d+)?)"/);
    // Use viewBox as a fallback if width/height attributes are missing
    const viewBoxMatch = logoFullSVG.match(/viewBox="[\d\.\s-]+ (\d+(\.\d+)?) (\d+(\.\d+)?)"/);

    const width = widthMatch ? parseInt(widthMatch[1], 10) : (viewBoxMatch ? parseInt(viewBoxMatch[1], 10) : 194); // Default or parsed
    const height = heightMatch ? parseInt(heightMatch[1], 10) : (viewBoxMatch ? parseInt(viewBoxMatch[3], 10) : 46); // Default or parsed

    return {
      svgString: logoFullSVG,
      width: width || 194, // Ensure fallback
      height: height || 46, // Ensure fallback
    };
  }, [logoFullSVG]); // Depends on logoFullSVG

  return (
    <div className={`${showGlobalSearchBar ? "md:pl-[10px] md:min-w-[61px] max-w-[255px] overflow-visible" : "md:min-w-[94px] max-w-[253px]"} bg-color-bg-main`}>
      <div className={`${showGlobalSearchBar ? "overflow-visible" : "pt-[43px] pl-[20px] gap-y-[36px] border-r-[2px] border-[#151A19]"} bg-color-bg-default min-h-screen max-h-screen sticky top-0 left-0 hidden md:flex flex-col z-[3]`}>
        {!showGlobalSearchBar && (
          <div className="select-none h-[45.07px]">
            <div className="flex items-center justify-start h-[45.07px] gap-x-[15px] pr-[10px]">
            
            <Link
              href="/"
              prefetch={isStale ? false : undefined}
              className={`${isSidebarOpen ? "relative h-[45.07px] w-[192.87px] block" : "relative h-[45.07px] w-[62px] overflow-clip"} transition-[width] duration-sidebar ease-sidebar`}
              title="Link to growthepie"
              aria-label="Link to growthepie"
            >
              <IconContextMenu 
                getSvgData={getLogoSvgData} 
                itemName="gtp-logo-full" 
                wrapperClassName="block h-full w-full"
                isLogo={true}
              >
              <div className={`h-[45.07px] w-[192.87px] relative ${isSidebarOpen ? "scale-100  translate-x-[1.5px] translate-y-[0px]" : "scale-[0.5325] translate-x-[1.5px] translate-y-[2px]"} transition-transform duration-sidebar ease-sidebar`} style={{ transformOrigin: "21px 27px" }}>
                <svg className="absolute" viewBox="0 0 194 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.4274 14.7805C12.3502 13.704 12.6434 12.7156 13.2724 11.7572C13.6935 11.1201 14.2907 10.4321 14.9496 9.67423C16.6496 7.7165 18.7553 5.29317 19.2708 2.08203C20.3917 4.54348 19.848 6.93686 18.6073 9.13783C18.0491 10.1271 17.4311 10.8378 16.8411 11.5158C16.1468 12.3136 15.4924 13.066 15.0222 14.1724C14.7636 14.7741 14.6165 15.3504 14.5476 15.9141L12.4274 14.7805Z" fill="url(#paint0_radial_12827_73007)"/>
                  <path d="M16.0652 16.7279C16.3239 15.7786 16.7713 14.8909 17.3658 14.0296C17.8577 13.3107 18.3188 12.778 18.7327 12.2997C20.1249 10.6887 20.989 9.68846 20.7358 4.28906C20.8982 4.63577 21.0589 4.96977 21.215 5.29198L21.2159 5.29379C22.5737 8.11284 23.5267 10.0896 21.9257 12.8043C21.1342 14.1458 20.557 14.8129 20.0469 15.4028C19.4724 16.0663 18.9823 16.6335 18.366 17.9532L16.0652 16.7279Z" fill="url(#paint1_radial_12827_73007)"/>
                  <path d="M22.0274 15.8776C21.4029 16.6173 20.3837 17.6375 20.3374 17.7046L26.1053 14.4799C25.9846 13.4053 25.1922 12.1392 24.2184 10.3394C24.4153 12.7119 23.4895 14.145 22.0274 15.8776Z" fill="url(#paint2_radial_12827_73007)"/>
                  <path d="M26.0626 15.5518C25.9074 16.2397 25.0579 17.671 24.4334 18.4144C22.4603 20.7615 21.4328 21.7626 19.7447 25.2941C19.6494 24.912 19.5495 24.5517 19.4542 24.2077C18.9832 22.5086 18.6937 21.0937 19.2582 19.8738L26.0626 15.5518Z" fill="url(#paint3_radial_12827_73007)"/>
                  <path d="M18.4433 23.5084C17.9605 22.0953 17.6138 20.9136 17.8661 19.4187L15.8494 18.1045C15.7377 20.3036 16.6771 22.8713 19.2711 26.1768C19.1331 25.3581 18.7193 24.3162 18.4433 23.5084Z" fill="url(#paint4_radial_12827_73007)"/>
                  <path d="M14.5052 17.2285C14.5397 17.9437 14.9817 19.8342 15.3774 20.8344C14.2483 19.394 13.014 17.184 12.6609 16.0259L14.5052 17.2285Z" fill="url(#paint5_radial_12827_73007)"/>
                  <path d="M38.2583 27.977C38.2583 24.7051 32.1737 21.9532 23.9507 21.1826C23.1665 22.063 22.3823 23.1558 21.6326 24.7668L20.5035 26.9115C20.2884 27.3072 19.8918 27.5668 19.4516 27.6013C19.0042 27.6358 18.5731 27.4397 18.3062 27.0812L17.5819 26.1082C16.0735 24.1823 14.9698 22.6566 14.0994 21.2289C6.11877 22.0594 0.258301 24.7677 0.258301 27.977C0.258301 31.8462 8.77354 34.9874 19.2628 34.9874C19.7693 34.9874 20.2721 34.9802 20.7695 34.9656L22.3088 30.6082L22.3215 30.5773C22.6609 29.7287 23.4778 29.1733 24.3863 29.1605H24.3927L37.9824 29.1969C38.1222 28.8547 38.2583 28.3337 38.2583 27.977Z" fill="url(#paint6_radial_12827_73007)"/>
                  <path d="M24.947 35.0822H35.5942L35.1286 36.263H24.5377L22.1797 42.9893V35.8464L23.8288 31.1803C23.9223 30.9443 24.151 30.7873 24.4079 30.7837L37.3142 30.7873L36.8368 31.9509H26.0625L25.7321 32.9329H36.4683L35.9582 34.1001H25.32L24.947 35.0822Z" fill="url(#paint7_radial_12827_73007)"/>
                  <path d="M0.911865 31.0698C2.13805 34.5369 5.13863 38.6094 5.77668 39.2048C7.98037 41.2805 15.0806 42.9895 20.6724 42.9895V37.1454C10.9791 37.1454 3.41144 34.006 0.911865 31.0698Z" fill="url(#paint8_radial_12827_73007)"/>
                  <defs>
                  <radialGradient id="paint0_radial_12827_73007" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(18.4777 6.37851) rotate(117.912) scale(11.808 9.11336)">
                  <stop stopColor="#1DF7EF"/>
                  <stop offset="1" stopColor="#10808C"/>
                  </radialGradient>
                  <radialGradient id="paint1_radial_12827_73007" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(21.5041 8.53338) rotate(115.692) scale(11.4385 8.3377)">
                  <stop stopColor="#1DF7EF"/>
                  <stop offset="1" stopColor="#10808C"/>
                  </radialGradient>
                  <radialGradient id="paint2_radial_12827_73007" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(25.0214 12.6271) rotate(127.548) scale(7.00774 6.31751)">
                  <stop stopColor="#1DF7EF"/>
                  <stop offset="1" stopColor="#10808C"/>
                  </radialGradient>
                  <radialGradient id="paint3_radial_12827_73007" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24.7255 18.5779) rotate(125.634) scale(9.04236 7.98874)">
                  <stop stopColor="#1DF7EF"/>
                  <stop offset="1" stopColor="#10808C"/>
                  </radialGradient>
                  <radialGradient id="paint4_radial_12827_73007" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(18.6264 20.6119) rotate(112.642) scale(6.59793 4.37388)">
                  <stop stopColor="#1DF7EF"/>
                  <stop offset="1" stopColor="#10808C"/>
                  </radialGradient>
                  <radialGradient id="paint5_radial_12827_73007" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(14.8669 17.5195) rotate(119.008) scale(4.14768 3.28196)">
                  <stop stopColor="#1DF7EF"/>
                  <stop offset="1" stopColor="#10808C"/>
                  </radialGradient>
                  <radialGradient id="paint6_radial_12827_73007" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(31.1172 25.4706) rotate(159.689) scale(30.0014 18.2218)">
                  <stop stopColor="#FFDF27"/>
                  <stop offset="0.9999" stopColor="#FE5468"/>
                  </radialGradient>
                  <radialGradient id="paint7_radial_12827_73007" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(34.47 34.575) rotate(140.592) scale(14.5034 13.2732)">
                  <stop stopColor="#1DF7EF"/>
                  <stop offset="0.9999" stopColor="#10808C"/>
                  </radialGradient>
                  <radialGradient id="paint8_radial_12827_73007" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16.959 34.7723) rotate(148.427) scale(17.1733 14.2932)">
                  <stop stopColor="#1DF7EF"/>
                  <stop offset="0.9999" stopColor="#10808C"/>
                  </radialGradient>
                  </defs>
                </svg>
                <svg className={`absolute ${isSidebarOpen ? "opacity-100" : "opacity-0"} transition-all duration-sidebar ease-sidebar`} viewBox="0 0 194 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M160.19 26.7584C160.19 23.0785 157.627 20.4116 153.945 20.4116C150.216 20.4116 147.6 23.1246 147.6 26.877C147.6 30.9342 150.257 33.1991 154.964 33.1991C156.504 33.2044 158.023 32.8319 159.391 32.1136L158.786 29.707C157.551 30.3214 156.182 30.6953 154.987 30.6953C152.546 30.6953 151.072 29.6329 150.909 27.8176H160.113C160.143 27.5606 160.19 27.1356 160.19 26.7584ZM150.846 25.8146C151.009 24.1393 152.196 22.9368 153.921 22.9368C155.646 22.9368 156.835 24.1393 156.998 25.8146H150.846Z" fill="#CDD8D3"/>
                  <path d="M146.207 16H143.085V19.138H146.207V16Z" fill="#CDD8D3"/>
                  <path d="M146.207 20.624H143.085V32.9865H146.207V20.624Z" fill="#CDD8D3"/>
                  <path d="M135.978 20.4116C134.137 20.4116 132.692 21.3094 131.76 22.7474V20.6241H129.034V37.5413H132.157V31.2817C132.97 32.5188 134.425 33.2255 136.118 33.2255C139.218 33.2255 141.688 30.5108 141.688 26.7831C141.688 23.0554 139.288 20.4116 135.978 20.4116ZM135.328 30.5339C133.486 30.5339 132.135 29.0003 132.135 26.9001C132.135 24.706 133.486 23.1016 135.328 23.1016C137.169 23.1016 138.497 24.706 138.497 26.9001C138.495 29.0003 137.166 30.5339 135.326 30.5339H135.328Z" fill="#CDD8D3"/>
                  <path d="M121.995 20.4116C118.267 20.4116 115.657 23.1246 115.657 26.877C115.657 30.9342 118.313 33.1991 123.021 33.1991C124.562 33.2042 126.081 32.8317 127.448 32.1136L126.837 29.707C125.602 30.3214 124.233 30.6953 123.039 30.6953C120.599 30.6953 119.125 29.6329 118.96 27.8176H128.171C128.193 27.5573 128.241 27.1324 128.241 26.7551C128.241 23.0834 125.676 20.4116 121.995 20.4116ZM118.895 25.8146C119.058 24.1393 120.247 22.9368 121.972 22.9368C123.696 22.9368 124.884 24.1393 125.047 25.8146H118.895Z" fill="#CDD8D3"/>
                  <path d="M111.204 20.4113C110.32 20.3979 109.448 20.6231 108.679 21.0637C107.909 21.5043 107.432 22.1445 106.987 22.9184V16H103.863V32.9863H106.987V27.3659C106.987 24.9346 108.106 23.1885 109.878 23.1885C111.159 23.1885 111.928 24.1324 111.928 26.0432V32.9797H115.05V25.2723C115.049 22.589 114.187 20.4113 111.204 20.4113Z" fill="#CDD8D3"/>
                  <path d="M101.252 30.2981C100.601 30.2981 100.087 29.944 100.087 29.094V23.0536H102.65V20.6239H100.087V17.3179H96.9648V20.6239H92.5378L90.3153 30.3838L88.4606 21.9301H85.8574L84.0026 30.3953L81.7573 20.6321H78.5798L81.7948 32.9946H85.4766L87.1362 25.9115L88.8331 32.9946H92.3751L94.9783 23.0618H96.9665V29.6837C96.9665 32.1134 98.1769 33.1989 100.368 33.1989C101.495 33.2046 102.603 32.9122 103.583 32.3506L102.952 29.8484C102.58 30.0148 101.904 30.2981 101.252 30.2981Z" fill="#CDD8D3"/>
                  <path d="M72.7537 20.4116C69.0246 20.4116 66.345 23.1016 66.345 26.8359C66.345 30.5701 69.0246 33.2304 72.7537 33.2304C76.4583 33.2304 79.138 30.5405 79.138 26.8359C79.138 23.1312 76.4583 20.4116 72.7537 20.4116ZM72.7537 30.5339C70.9119 30.5339 69.5599 28.9756 69.5599 26.8293C69.5599 24.6829 70.9119 23.1016 72.7537 23.1016C74.5954 23.1016 75.9458 24.6582 75.9458 26.8062C75.9458 28.9542 74.5938 30.5339 72.7537 30.5339Z" fill="#CDD8D3"/>
                  <path d="M62.289 23.2659V20.6303H59.4238V32.9928H62.546V25.5078C63.1968 24.1159 64.8059 23.3664 66.2279 23.3664V20.482L66.0652 20.459C64.5733 20.459 63.1513 21.5676 62.289 23.2659Z" fill="#CDD8D3"/>
                  <path d="M55.2749 22.7952C54.3426 21.3555 52.8979 20.4116 51.0187 20.4116C47.7013 20.4116 45.3242 23.1016 45.3242 26.8062C45.3242 30.2028 47.724 32.8219 51.0561 32.8219C51.7944 32.831 52.5247 32.665 53.1883 32.3373C53.8519 32.0095 54.4306 31.529 54.8779 30.9342V32.1614C54.8779 34.4972 53.5503 35.7474 51.2204 35.7474C49.5186 35.7474 48.2609 35.3933 46.769 34.6388L45.8595 36.9746C47.5276 37.8144 49.3656 38.2503 51.2286 38.2479C55.5629 38.2479 58.0099 36.0538 58.0099 32.1614V20.6307H55.2749V22.7952ZM51.7085 30.2983C49.8684 30.2983 48.5164 28.7648 48.5164 26.9001C48.5164 24.706 49.8684 23.1016 51.7085 23.1016C53.5487 23.1016 54.8779 24.706 54.8779 26.9001C54.8779 28.7648 53.5503 30.2983 51.7085 30.2983Z" fill="#CDD8D3"/>
                </svg>
              </div>
              </IconContextMenu>
            </Link>
            
            <div className="absolute flex items-end p-[10px] h-[45.07px] top-[41px] right-0 cursor-pointer " onClick={() => {
              // track("clicked Sidebar Close", {
              //   location: "desktop sidebar",
              //   page: window.location.pathname,
              // });
              toggleSidebar();
            }}>
              <Icon
                icon={isSidebarOpen ? "feather:log-out" : "feather:log-in"}
                className={`w-[13px] h-[13px] transition-transform ${isSidebarOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
          </div>
        )}
        <Sidebar isOpen={isSidebarOpen} />
      </div>
    </div>
  );
}

// custom right-click menu to copy, download, or go to the icon page
export const LogoContextMenu = ({ children }: { children: React.ReactNode }) => {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [logoFullSVG, setLogoFullSVG] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useOutsideAlerter(menuRef as React.RefObject<HTMLElement>, () => {
    setIsOpen(false);
  });

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    // clientX/clientY are viewport coordinates, perfect for position: fixed
    setPosition({ x: event.clientX, y: event.clientY });
    setIsOpen(true);
  };

  useEffect(() => {
    const fetchLogoFullSVG = async () => {
      try {
        const response = await fetch("/logo-full.svg");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const logoFullSVGString = await response.text();
        setLogoFullSVG(logoFullSVGString);
      } catch (error) {
        console.error("Failed to fetch logo SVG:", error);
        toast.addToast({
          title: "Error",
          message: "Could not load logo.",
          type: "error",
        });
      }
    };
    fetchLogoFullSVG();
  }, [toast]);

  const getSVG = () => {

  }

  const handleCopy = () => {
    if (!logoFullSVG) {
      toast.addToast({
        title: "Error",
        message: "Logo not found",
        type: "error",
      });
      return;
    }
    navigator.clipboard.writeText(logoFullSVG);
    toast.addToast({
      title: "Success",
      message: "Logo copied to clipboard",
      type: "success",
    });
    setIsOpen(false);
  };

  const handleDownload = async () => {
    if (!logoFullSVG) {
      toast.addToast({
        title: "Error",
        message: "Logo not found",
        type: "error",
      });
      setIsOpen(false);
      return;
    }
    const width = logoFullSVG.match(/width="(\d+)"/)?.[1];
    const height = logoFullSVG.match(/height="(\d+)"/)?.[1];
    if (!width || !height) {
      toast.addToast({
        title: "Error",
        message: "Logo dimensions not found",
        type: "error",
      });
      setIsOpen(false);
      return;
    }
    const blob = await convertSvgToPngBlob(logoFullSVG, parseInt(width), parseInt(height));
    if (!blob) {
      toast.addToast({
        title: "Error",
        message: "Failed to convert logo to PNG",
        type: "error",
      });
      setIsOpen(false);
      return;
    }
    triggerBlobDownload(`logo-full.png`, blob);
    setIsOpen(false);
  };

  const handleGoToIconsPage = () => {
    window.open("https://icons.growthepie.com", "_blank");
  };

  // CMD icon: material-symbols:keyboard-command-key
  const CMDIcon = <Icon icon="lucide:command" />;
  const CTRLIcon = <div className="font-inter">Ctrl</div>
  const PlusIcon = <div className="font-inter">+</div>
  const XIcon = <div className="font-inter">X</div>
  const SIcon = <div className="font-inter">S</div>
  const CIcon = <div className="font-inter">C</div>
  const options = [
    { icon: "gtp-copy", label: "Copy", onClick: handleCopy },
    { icon: "gtp-download", label: "Download", onClick: handleDownload },
    { icon: "gtp-growthepie-icons", label: "See more icons", onClick: handleGoToIconsPage },
  ];

  // Define the menu content as a variable for clarity
  const menuContent = (
    <div
      ref={menuRef}
      className="fixed z-[999] flex flex-col w-fit gap-y-[5px] rounded-[15px] overflow-hidden bg-color-bg-default text-color-text-primary text-xs shadow-[0px_0px_8px_0px_rgba(0,_0,_0,_0.66)]"
      // Add units (px) to position values
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      // Prevent context menu on the menu itself
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex flex-col gap-y-[5px] w-full py-[10px]">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={option.onClick}
            className="flex w-full items-center justify-between gap-x-[30px] pl-[20px] pr-[25px] py-[5px] cursor-pointer hover:bg-color-ui-hover/50"
          >
            <div className="flex justify-start items-center gap-x-[10px] text-[12px]">
              <GTPIcon icon={option.icon as GTPIconName} size="sm" className="!size-[12px]" />
              <span>{option.label}</span>
            </div>
            {/* Optional: Shortcut placeholder */}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative w-fit" onContextMenu={handleContextMenu}>
      {children}
      {isOpen && createPortal(menuContent, document.body)}
    </div>
  );
};