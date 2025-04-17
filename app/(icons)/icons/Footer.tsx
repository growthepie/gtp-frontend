"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import Container from "@/components/layout/Container";
import { useUIContext } from "@/contexts/UIContext";
import { GTPIcon } from "@/components/layout/GTPIcon";
import FloatingBar from "./FloatingBar";

interface FooterProps {
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  iconsCount?: number;
  onDownloadAll?: (format: "SVG" | "PNG") => void;
  selectedFormat: "SVG" | "PNG";
  setSelectedFormat: React.Dispatch<React.SetStateAction<"SVG" | "PNG">>;
  selectedStyles: ("gradient" | "monochrome")[];
  setSelectedStyles: React.Dispatch<React.SetStateAction<("gradient" | "monochrome")[]>>;
}


export default function Footer({
  searchQuery = "",
  setSearchQuery = () => {},
  iconsCount = 0,
  onDownloadAll = () => {},
  selectedFormat,
  setSelectedFormat,
  selectedStyles,
  setSelectedStyles,
}: FooterProps) {
  const { isMobile } = useUIContext();

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 top-0 z-50 flex flex-col justify-end overflow-hidden">
      <div className="relative">
        <div
          className="pointer-events-none fixed inset-0 -z-10 bg-[#151a19]"
          style={{
            backgroundPosition: "bottom",
            maskImage: isMobile
              ? `linear-gradient(to top, white 0, white 150px, transparent 215px)`
              : `linear-gradient(to top, white 0, white 80px, transparent 180px)`,
          }}
        >
          <div className="background-gradient-group">
            <div className="background-gradient-yellow"></div>
            <div className="background-gradient-green"></div>
          </div>
        </div>
      </div>

      {/* Container for Mobile Floating Bar */}
      {/* Positioned absolutely, appears only on mobile */}
      <div className="block md:hidden absolute bottom-[80px] md:bottom-[105px] left-0 right-0 z-60 pointer-events-auto"> {/* Adjust bottom value as needed */}
         <div className="w-full max-w-[1427px] mx-auto px-[20px]"> {/* Constrain width */}
             <FloatingBar
               searchQuery={searchQuery}
               setSearchQuery={setSearchQuery}
               iconsCount={iconsCount}
               onDownloadAll={onDownloadAll}
               selectedFormat={selectedFormat}
               setSelectedFormat={setSelectedFormat}
               selectedStyles={selectedStyles}
               setSelectedStyles={setSelectedStyles}
             />
         </div>
       </div>

      <Container className="w-full max-w-[1427px] mx-auto px-[20px] md:px-[60px] bottom-0 pointer-events-auto">
        <Container className="z-10 flex w-full items-center justify-between !px-0 pb-5 md:pb-9">
          {/* Left Side Links */}
          <div className="flex justify-center md:justify-start px-[15px] w-full">
            <div className="flex flex-col md:flex-row gap-x-[15px] gap-y-[10px] items-center text-[10px] text-[#CDD8D3] dark:text-[#CDD8D3]">
              <div className="flex gap-x-[15px] items-center text-[10px] text-[#CDD8D3] dark:text-[#CDD8D3]">
                <Link href="/privacy-policy" className="underline" passHref target="_blank" rel="noopener" aria-label="Privacy Policy" onClick={() => track("click", { location: "footer", link: "privacy-policy" })}>
                  Privacy Policy
                </Link>
                <Link href="/imprint" className="underline" passHref target="_blank" rel="noopener" aria-label="Imprint" onClick={() => track("click", { location: "footer", link: "imprint" })}>
                  Imprint
                </Link>
                <Link href="https://discord.com/channels/1070991734139531294/1095735245678067753" className="underline" passHref target="_blank" rel="noopener" aria-label="Feedback" onClick={() => track("click", { location: "footer", link: "feedback" })}>
                  Feedback
                </Link>
              </div>
              <div className="">
                © {new Date().getFullYear()} growthepie 🥧📏
              </div>
            </div>
          </div>

          {/* Right Side Share Button */}
          {/* <div className="relative h-14 p-1 bg-[#33413f] rounded-[40px] flex items-center gap-4">
            <div className="absolute inset-0 z-40 w-full h-full overflow-hidden pointer-events-none rounded-full">
              <div className="w-full h-full"></div>
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 transform -skew-x-20 animate-glint blur-sm"></div>
            </div>
            <div className="h-11 px-[15px] py-2.5 bg-[#1f2726] rounded-[40px] flex justify-start items-start gap-2.5">
              <div className="self-stretch justify-start items-center gap-2.5 inline-flex">
                <GTPIcon
                  icon="gtp-share-monochrome"
                  size="sm"
                  className="w-6 h-6 relative"
                />
                <div className="text-[#cdd8d3] text-[16px] font-['Raleway'] leading-[19.2px] text-left">
                  Share
                </div>
              </div>
            </div>
          </div> */}
        </Container>
      </Container>
    </div>
  );
}
