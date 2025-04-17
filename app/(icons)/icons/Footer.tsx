"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import Container from "@/components/layout/Container";
import { useUIContext } from "@/contexts/UIContext";
import { GTPIcon } from "@/components/layout/GTPIcon";
import FloatingBar from "./FloatingBar";
import Share from "@/components/Share";

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
          <div className="pointer-events-none fixed bottom-[20px] z-50 flex w-full max-w-[1427px] justify-end">
                <div className="pointer-events-auto pr-[40px] md:pr-[120px]">
                    {/* <Details /> */}
                    <Share />
                </div>
              </div>
        </Container>
      </Container>
    </div>
  );
}
