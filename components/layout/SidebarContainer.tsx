"use client";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { getIcon, Icon } from "@iconify/react";
import { useUIContext } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { GTPIcon } from "./GTPIcon";
import { useOutsideAlerter } from "@/hooks/useOutsideAlerter";
import { useToast } from "../toast/GTPToast";
import { triggerBlobDownload } from "@/lib/icon-library/clientSvgUtils";
import { convertSvgToPngBlob } from "@/lib/icon-library/clientSvgUtils";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { createPortal } from "react-dom";
import { IconContextMenu } from "./IconContextMenu";

export default function SidebarContainer() {
  const { isSidebarOpen, toggleSidebar } = useUIContext();

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
      await fetch("/logo-full.svg").then(res => res.text()).then(setLogoFullSVG).catch(() => {}); // Simple retry/refetch example
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
    <div className="bg-forest-1000 md:min-w-[94px] max-w-[253px]">
      <div className="pt-[35px] pl-[20px] bg-[#1F2726] min-h-screen max-h-screen sticky top-0 left-0 hidden md:flex flex-col overflow-y-hidden overflow-x-hidden gap-y-[36px] border-r-[2px] border-[#151A19] z-[3]">
        <div className="select-none h-[45.07px]">
          <div className="flex items-center justify-start h-[45.07px] gap-x-[15px] pr-[10px]">
            
            <Link
              href="/"
              className={`${isSidebarOpen ? "relative h-[45.07px] w-[192.87px] block" : "relative h-[45.07px] w-[62px] overflow-clip"} transition-[width] duration-sidebar ease-sidebar`}
            >
              <IconContextMenu getSvgData={getLogoSvgData} itemName="gtp-logo-full" wrapperClassName="block h-full w-full">
              <div className={`h-[45.07px] w-[192.87px] relative ${isSidebarOpen ? "scale-100  translate-x-[1.5px] translate-y-[0px]" : "scale-[0.5325] translate-x-[1.5px] translate-y-[2px]"} transition-transform duration-sidebar ease-sidebar`} style={{ transformOrigin: "21px 27px" }}>
                <svg className="absolute" viewBox="0 0 194 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.9962 13.991C13.9112 12.805 14.2342 11.716 14.9272 10.66C15.3912 9.958 16.0492 9.2 16.7752 8.365C18.6482 6.208 20.9682 3.538 21.5362 0C22.7712 2.712 22.1722 5.349 20.8052 7.774C20.1902 8.864 19.5092 9.647 18.8592 10.394C18.0942 11.273 17.3732 12.102 16.8552 13.321C16.5702 13.984 16.4082 14.619 16.3322 15.24L13.9962 13.991Z" fill="url(#paint0_radial_2690_14166)" />
                  <path d="M18.0044 16.1366C18.2894 15.0906 18.7824 14.1126 19.4374 13.1636C19.9794 12.3716 20.4874 11.7846 20.9434 11.2576C22.4774 9.48264 23.4294 8.38064 23.1504 2.43164C23.3294 2.81364 23.5064 3.18164 23.6784 3.53664L23.6794 3.53864C25.1754 6.64464 26.2254 8.82264 24.4614 11.8136C23.5894 13.2916 22.9534 14.0266 22.3914 14.6766C21.7584 15.4076 21.2184 16.0326 20.5394 17.4866L18.0044 16.1366Z" fill="url(#paint1_radial_2690_14166)" />
                  <path d="M24.5734 15.1997C23.8854 16.0147 22.7624 17.1387 22.7114 17.2127L29.0664 13.6597C28.9334 12.4757 28.0604 11.0807 26.9874 9.09766C27.2044 11.7117 26.1844 13.2907 24.5734 15.1997Z" fill="url(#paint2_radial_2690_14166)" />
                  <path d="M29.0195 14.8408C28.8485 15.5988 27.9125 17.1758 27.2245 17.9948C25.0505 20.5808 23.9185 21.6838 22.0585 25.5748C21.9535 25.1538 21.8435 24.7568 21.7385 24.3778C21.2195 22.5058 20.9005 20.9468 21.5225 19.6028L29.0195 14.8408Z" fill="url(#paint3_radial_2690_14166)" />
                  <path d="M20.6245 23.6073C20.0925 22.0503 19.7105 20.7483 19.9885 19.1013L17.7665 17.6533C17.6435 20.0763 18.6785 22.9053 21.5365 26.5473C21.3845 25.6453 20.9285 24.4973 20.6245 23.6073Z" fill="url(#paint4_radial_2690_14166)" />
                  <path d="M16.2854 16.6883C16.3234 17.4763 16.8104 19.5593 17.2464 20.6613C16.0024 19.0743 14.6424 16.6393 14.2534 15.3633L16.2854 16.6883Z" fill="url(#paint5_radial_2690_14166)" />
                  <path d="M42.4564 28.5309C42.4564 24.9259 35.7524 21.8939 26.6924 21.0449C25.8284 22.0149 24.9644 23.2189 24.1384 24.9939L22.8944 27.3569C22.6574 27.7929 22.2204 28.0789 21.7354 28.1169C21.2424 28.1549 20.7674 27.9389 20.4734 27.5439L19.6754 26.4719C18.0134 24.3499 16.7974 22.6689 15.8384 21.0959C7.04538 22.0109 0.588379 24.9949 0.588379 28.5309C0.588379 32.7939 9.97038 36.2549 21.5274 36.2549C22.0854 36.2549 22.6394 36.2469 23.1874 36.2309L24.8834 31.4299L24.8974 31.3959C25.2714 30.4609 26.1714 29.8489 27.1724 29.8349H27.1794L42.1524 29.8749C42.3064 29.4979 42.4564 28.9239 42.4564 28.5309Z" fill="url(#paint6_radial_2690_14166)" />
                  <path d="M27.7902 36.359H39.5212L39.0082 37.66H27.3392L24.7412 45.071V37.201L26.5582 32.06C26.6612 31.8 26.9132 31.627 27.1962 31.623L41.4162 31.627L40.8902 32.909H29.0192L28.6552 33.991H40.4842L39.9222 35.277H28.2012L27.7902 36.359Z" fill="url(#paint7_radial_2690_14166)" />
                  <path d="M1.30859 31.9385C2.65959 35.7585 5.96559 40.2455 6.66859 40.9015C9.09659 43.1885 16.9196 45.0715 23.0806 45.0715V38.6325C12.4006 38.6325 4.06259 35.1735 1.30859 31.9385Z" fill="url(#paint8_radial_2690_14166)" />
                  <defs>
                    <radialGradient id="paint0_radial_2690_14166" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(20.6624 4.73381) rotate(117.912) scale(13.0099 10.041)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="1" stopColor="#10808C" />
                    </radialGradient>
                    <radialGradient id="paint1_radial_2690_14166" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(23.9969 7.10799) rotate(115.692) scale(12.6028 9.18639)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="1" stopColor="#10808C" />
                    </radialGradient>
                    <radialGradient id="paint2_radial_2690_14166" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(27.8722 11.6183) rotate(127.548) scale(7.72106 6.96057)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="1" stopColor="#10808C" />
                    </radialGradient>
                    <radialGradient id="paint3_radial_2690_14166" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(27.5463 18.175) rotate(125.634) scale(9.96278 8.80191)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="1" stopColor="#10808C" />
                    </radialGradient>
                    <radialGradient id="paint4_radial_2690_14166" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(20.8262 20.416) rotate(112.642) scale(7.26953 4.81909)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="1" stopColor="#10808C" />
                    </radialGradient>
                    <radialGradient id="paint5_radial_2690_14166" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16.684 17.0089) rotate(119.008) scale(4.56987 3.61603)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="1" stopColor="#10808C" />
                    </radialGradient>
                    <radialGradient id="paint6_radial_2690_14166" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(34.5884 25.7694) rotate(159.689) scale(33.0552 20.0765)">
                      <stop stopColor="#FFDF27" />
                      <stop offset="0.9999" stopColor="#FE5468" />
                    </radialGradient>
                    <radialGradient id="paint7_radial_2690_14166" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(38.2826 35.8002) rotate(140.592) scale(15.9797 14.6242)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="0.9999" stopColor="#10808C" />
                    </radialGradient>
                    <radialGradient id="paint8_radial_2690_14166" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(18.9891 36.0178) rotate(148.427) scale(18.9214 15.7481)">
                      <stop stopColor="#1DF7EF" />
                      <stop offset="0.9999" stopColor="#10808C" />
                    </radialGradient>
                  </defs>
                </svg>
                <svg className={`absolute ${isSidebarOpen ? "opacity-100" : "opacity-0"} transition-all duration-sidebar ease-sidebar`} viewBox="0 0 194 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M56.1195 38.7766C55.1405 38.7766 54.2375 38.5886 53.4085 38.2116C52.5995 37.8166 51.8935 37.2706 51.2915 36.5746C50.7075 35.8776 50.2565 35.0776 49.9365 34.1746C49.6165 33.2706 49.4565 32.3106 49.4565 31.2946C49.4565 30.2216 49.6255 29.2236 49.9645 28.3016C50.3035 27.3796 50.7735 26.5706 51.3765 25.8736C51.9975 25.1586 52.7215 24.6126 53.5505 24.2366C54.3975 23.8406 55.3285 23.6436 56.3455 23.6436C57.4935 23.6436 58.5005 23.9066 59.3665 24.4336C60.2325 24.9416 60.9475 25.6286 61.5115 26.4946V23.8976H64.8155V37.9856C64.8155 39.4546 64.4575 40.7056 63.7425 41.7416C63.0465 42.7946 62.0765 43.5956 60.8345 44.1406C59.5925 44.7056 58.1805 44.9876 56.5995 44.9876C54.9995 44.9876 53.6445 44.7146 52.5335 44.1696C51.4235 43.6426 50.4725 42.8896 49.6825 41.9106L51.7435 39.9056C52.3075 40.6026 53.0135 41.1486 53.8605 41.5436C54.7265 41.9386 55.6395 42.1366 56.5995 42.1366C57.4085 42.1366 58.1425 41.9856 58.8015 41.6846C59.4795 41.4026 60.0155 40.9506 60.4105 40.3296C60.8255 39.7266 61.0325 38.9456 61.0325 37.9856V36.1226C60.5425 36.9696 59.8465 37.6286 58.9425 38.0986C58.0585 38.5506 57.1175 38.7766 56.1195 38.7766ZM57.3895 35.7556C57.8045 35.7556 58.1995 35.6896 58.5755 35.5576C58.9525 35.4266 59.3005 35.2476 59.6205 35.0216C59.9405 34.7956 60.2225 34.5316 60.4675 34.2306C60.7125 33.9106 60.9005 33.5906 61.0325 33.2706V29.7416C60.8065 29.1586 60.4865 28.6496 60.0725 28.2166C59.6765 27.7846 59.2255 27.4546 58.7165 27.2286C58.2275 26.9846 57.7095 26.8616 57.1645 26.8616C56.5805 26.8616 56.0535 26.9846 55.5825 27.2286C55.1125 27.4736 54.7075 27.8216 54.3685 28.2736C54.0305 28.7066 53.7665 29.1956 53.5785 29.7416C53.4085 30.2686 53.3245 30.8236 53.3245 31.4076C53.3245 32.0096 53.4275 32.5746 53.6345 33.1016C53.8415 33.6286 54.1245 34.0896 54.4815 34.4846C54.8585 34.8806 55.2915 35.1906 55.7805 35.4166C56.2885 35.6426 56.8255 35.7556 57.3895 35.7556Z" fill="#CDD8D3" />
                  <path d="M75.9052 27.1732C74.7572 27.1732 73.7312 27.3992 72.8272 27.8502C71.9242 28.2832 71.2752 28.9142 70.8792 29.7422V38.6922H67.0962V23.8982H70.5692V27.0602C71.0962 26.0432 71.7642 25.2442 72.5732 24.6602C73.3832 24.0772 74.2392 23.7572 75.1432 23.7002H75.6222C75.7352 23.7002 75.8302 23.7092 75.9052 23.7282V27.1732Z" fill="#CDD8D3" />
                  <path d="M83.5253 38.9746C82.3203 38.9746 81.2383 38.7766 80.2783 38.3816C79.3183 37.9676 78.4993 37.4026 77.8213 36.6876C77.1633 35.9716 76.6543 35.1536 76.2973 34.2306C75.9393 33.3086 75.7603 32.3396 75.7603 31.3226C75.7603 30.2876 75.9393 29.3086 76.2973 28.3866C76.6543 27.4646 77.1633 26.6456 77.8213 25.9296C78.4993 25.2146 79.3183 24.6596 80.2783 24.2646C81.2383 23.8506 82.3203 23.6436 83.5253 23.6436C84.7293 23.6436 85.8023 23.8506 86.7433 24.2646C87.7033 24.6596 88.5223 25.2146 89.2003 25.9296C89.8773 26.6456 90.3863 27.4646 90.7243 28.3866C91.0823 29.3086 91.2613 30.2876 91.2613 31.3226C91.2613 32.3396 91.0823 33.3086 90.7243 34.2306C90.3863 35.1536 89.8773 35.9716 89.2003 36.6876C88.5413 37.4026 87.7323 37.9676 86.7723 38.3816C85.8123 38.7766 84.7293 38.9746 83.5253 38.9746ZM79.6573 31.3226C79.6573 32.1886 79.8263 32.9606 80.1653 33.6376C80.5043 34.2966 80.9653 34.8146 81.5483 35.1906C82.1323 35.5676 82.7913 35.7556 83.5253 35.7556C84.2403 35.7556 84.8893 35.5676 85.4733 35.1906C86.0563 34.7956 86.5183 34.2686 86.8563 33.6096C87.2143 32.9326 87.3933 32.1606 87.3933 31.2946C87.3933 30.4476 87.2143 29.6856 86.8563 29.0076C86.5183 28.3296 86.0563 27.8026 85.4733 27.4266C84.8893 27.0496 84.2403 26.8616 83.5253 26.8616C82.7913 26.8616 82.1323 27.0596 81.5483 27.4546C80.9653 27.8316 80.5043 28.3586 80.1653 29.0356C79.8263 29.6946 79.6573 30.4566 79.6573 31.3226Z" fill="#CDD8D3" />
                  <path d="M110.541 23.8984H114.126L107.943 38.6924H104.781L102.296 32.3404L99.8684 38.6924H96.6784L90.5234 23.8984H94.0804L98.4854 35.0784L100.207 30.2504L97.6384 23.9264H100.772L102.296 28.4434L103.849 23.9264H106.983L104.414 30.2504L106.164 35.0784L110.541 23.8984Z" fill="#CDD8D3" />
                  <path d="M125.392 37.2349C125.085 37.3619 124.714 37.5069 124.279 37.6699C123.845 37.8329 123.374 37.9589 122.868 38.0499C122.379 38.1579 121.881 38.2129 121.375 38.2129C120.705 38.2129 120.09 38.0949 119.528 37.8599C118.967 37.6249 118.515 37.2539 118.171 36.7469C117.845 36.2219 117.682 35.5429 117.682 34.7109V26.5389H115.809V23.7429H117.682V19.1279H121.32V23.7429H124.986V26.5389H121.32V33.4889C121.338 33.9779 121.474 34.3309 121.727 34.5479C121.981 34.7649 122.298 34.8739 122.678 34.8739C123.058 34.8739 123.429 34.8099 123.791 34.6839C124.153 34.5569 124.442 34.4479 124.659 34.3579L125.392 37.2349ZM138.608 37.9679H134.97V29.9869C134.97 28.8829 134.753 28.0589 134.318 27.5159C133.902 26.9739 133.323 26.7019 132.581 26.7019C132.147 26.7019 131.685 26.8289 131.196 27.0819C130.708 27.3349 130.264 27.6879 129.866 28.1409C129.486 28.5749 129.205 29.0819 129.025 29.6609V37.9679H125.387V18.1499H129.025V25.8899C129.637 25.2609 130.264 24.7649 131.169 24.2589C132.074 23.7519 133.061 23.4989 134.128 23.4989C135.051 23.4989 135.802 23.6609 136.382 23.9869C136.961 24.2949 137.413 24.7199 137.739 25.2629C138.065 25.7879 138.291 26.3849 138.418 27.0549C138.544 27.7059 138.608 28.3849 138.608 29.0909V37.9679ZM146.467 38.2399C145.327 38.2399 144.296 38.0499 143.373 37.6699C142.45 37.2719 141.662 36.7379 141.011 36.0679C140.359 35.3799 139.852 34.6019 139.49 33.7329C139.147 32.8469 138.975 31.9139 138.975 30.9369C138.975 29.5799 139.273 28.3399 139.871 27.2179C140.486 26.0959 141.355 25.1999 142.477 24.5299C143.617 23.8419 144.956 23.4989 146.495 23.4989C148.051 23.4989 149.381 23.8419 150.485 24.5299C151.589 25.1999 152.431 26.0959 153.01 27.2179C153.607 28.3219 153.906 29.5159 153.906 30.8009C153.906 31.0189 153.897 31.2449 153.879 31.4799C153.861 31.6969 153.843 31.8779 153.825 32.0229H142.83C142.902 32.7469 143.11 33.3799 143.454 33.9229C143.816 34.4659 144.268 34.8829 144.811 35.1719C145.373 35.4439 145.97 35.5789 146.603 35.5789C147.327 35.5789 148.006 35.4069 148.639 35.0639C149.291 34.7019 149.734 34.2309 149.97 33.6519L153.092 34.5209C152.748 35.2449 152.25 35.8869 151.598 36.4479C150.965 37.0089 150.214 37.4529 149.345 37.7779C148.476 38.0859 147.517 38.2399 146.467 38.2399ZM142.748 29.4009H150.187C150.114 28.6769 149.906 28.3669 149.562 27.8419C149.237 27.2989 148.802 26.8829 148.259 26.5929C147.716 26.2859 147.11 26.1319 146.44 26.1319C145.789 26.1319 145.192 26.2859 144.649 26.5929C144.124 26.8829 143.689 27.2989 143.345 27.8419C143.02 28.3669 142.821 28.6769 142.748 29.4009Z" stroke="#CDD8D3" />
                  <path d="M164.892 38.9746C163.744 38.9746 162.728 38.7206 161.843 38.2126C160.977 37.6856 160.3 36.9796 159.81 36.0946V44.7066H156.027V23.8976H159.33V26.4386C159.895 25.5726 160.61 24.8956 161.476 24.4056C162.342 23.8976 163.33 23.6436 164.441 23.6436C165.438 23.6436 166.351 23.8416 167.179 24.2366C168.026 24.6316 168.76 25.1876 169.382 25.9026C170.003 26.5986 170.483 27.4086 170.822 28.3306C171.179 29.2336 171.358 30.2126 171.358 31.2666C171.358 32.6976 171.076 33.9966 170.511 35.1636C169.965 36.3306 169.203 37.2616 168.224 37.9586C167.264 38.6356 166.154 38.9746 164.892 38.9746ZM163.622 35.7556C164.205 35.7556 164.732 35.6336 165.203 35.3886C165.674 35.1446 166.078 34.8146 166.417 34.4006C166.775 33.9676 167.038 33.4876 167.208 32.9606C167.396 32.4146 167.49 31.8506 167.49 31.2666C167.49 30.6456 167.386 30.0716 167.179 29.5446C166.991 29.0176 166.709 28.5566 166.332 28.1616C165.956 27.7466 165.514 27.4266 165.005 27.2016C164.516 26.9756 163.979 26.8626 163.396 26.8626C163.038 26.8626 162.671 26.9286 162.295 27.0596C161.937 27.1726 161.589 27.3426 161.25 27.5686C160.911 27.7946 160.61 28.0576 160.347 28.3586C160.102 28.6596 159.923 28.9896 159.81 29.3466V32.8196C160.036 33.3656 160.337 33.8646 160.714 34.3166C161.109 34.7676 161.561 35.1256 162.069 35.3886C162.577 35.6336 163.095 35.7556 163.622 35.7556Z" fill="#CDD8D3" />
                  <path d="M172.792 38.693V23.898H176.575V38.693H172.792ZM172.792 21.837V18.082H176.575V21.837H172.792Z" fill="#CDD8D3" />
                  <path d="M185.72 38.9746C184.534 38.9746 183.461 38.7766 182.501 38.3816C181.541 37.9676 180.722 37.4126 180.045 36.7156C179.367 36.0006 178.84 35.1916 178.464 34.2876C178.106 33.3656 177.927 32.3966 177.927 31.3796C177.927 29.9686 178.238 28.6786 178.859 27.5116C179.499 26.3446 180.402 25.4126 181.569 24.7166C182.755 24.0016 184.148 23.6436 185.748 23.6436C187.367 23.6436 188.75 24.0016 189.898 24.7166C191.046 25.4126 191.922 26.3446 192.524 27.5116C193.145 28.6596 193.456 29.9026 193.456 31.2386C193.456 31.4646 193.446 31.6996 193.428 31.9446C193.409 32.1706 193.39 32.3586 193.371 32.5096H181.936C182.012 33.2616 182.228 33.9206 182.586 34.4856C182.962 35.0506 183.433 35.4836 183.997 35.7846C184.581 36.0666 185.202 36.2076 185.861 36.2076C186.614 36.2076 187.32 36.0286 187.978 35.6716C188.656 35.2946 189.117 34.8056 189.362 34.2036L192.609 35.1066C192.251 35.8596 191.734 36.5276 191.056 37.1116C190.397 37.6946 189.616 38.1556 188.713 38.4946C187.809 38.8146 186.811 38.9746 185.72 38.9746ZM181.852 30.1096H189.588C189.512 29.3566 189.296 28.7066 188.938 28.1616C188.6 27.5966 188.148 27.1636 187.583 26.8626C187.018 26.5426 186.388 26.3826 185.691 26.3826C185.014 26.3826 184.393 26.5426 183.828 26.8626C183.282 27.1636 182.83 27.5966 182.473 28.1616C182.134 28.7066 181.927 29.3566 181.852 30.1096Z" fill="#CDD8D3" />
                </svg>
              </div>
              </IconContextMenu>
            </Link>
            
            <div className="absolute flex items-end p-[10px] right-0 cursor-pointer " onClick={() => {
              // track("clicked Sidebar Close", {
              //   location: "desktop sidebar",
              //   page: window.location.pathname,
              // });
              toggleSidebar();
            }}>
              <Icon
                icon={isSidebarOpen ? "feather:log-out" : "feather:log-in"}
                className={`w-[13px] h-[13px] mt-4 transition-transform ${isSidebarOpen ? "rotate-180" : ""
                  }`}

              />
            </div>
          </div>
        </div>
        <Sidebar />
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

  useOutsideAlerter(menuRef, () => {
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
    if(!logoFullSVG){
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
    if(!logoFullSVG){
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
    if(!width || !height){
      toast.addToast({
        title: "Error",
        message: "Logo dimensions not found",
        type: "error",
      });
      setIsOpen(false);
      return;
    }
    const blob = await convertSvgToPngBlob(logoFullSVG, parseInt(width), parseInt(height));
    if(!blob){
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
    window.open("https://icons.growthepie.xyz", "_blank");
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
      className="fixed z-[999] flex flex-col w-fit gap-y-[5px] rounded-[15px] overflow-hidden bg-[#1F2726] text-[#CDD8D3] text-xs shadow-[0px_0px_8px_0px_rgba(0,_0,_0,_0.66)]"
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
            className="flex w-full items-center justify-between gap-x-[30px] pl-[20px] pr-[25px] py-[5px] cursor-pointer hover:bg-[#5A6462]/50"
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
    <div className="relative w-fit"  onContextMenu={handleContextMenu}>
      {children}
      {isOpen && createPortal(menuContent, document.body)}
    </div>
  );
};