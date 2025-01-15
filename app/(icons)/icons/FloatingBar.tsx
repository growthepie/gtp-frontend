import Link from "next/link";
import Search from "./Search";
import { useState } from "react";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

// Accept searchQuery, setSearchQuery, and iconsCount from props
interface FloatingBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  iconsCount: number;
}

export default function FloatingBar({
  searchQuery,
  setSearchQuery,
  iconsCount,
}: FloatingBarProps) {
  const [selectedFormat, setSelectedFormat] = useState<"SVG" | "PNG" | null>(null);

  return (
    <div className="flex p-[5px] items-center w-full rounded-full mt-[16px] bg-[#344240] shadow-[0px_0px_50px_0px_#000000] gap-x-[5px] md:gap-x-[15px] z-0 pointer-events-auto">
      {/* Home Icon */}
      <Link
        className="flex items-center bg-[#1F2726] gap-x-[10px] rounded-full p-[10px]"
        href="https://www.growthepie.xyz/"
        target="_blank"
      >
        <div className="w-6 h-6">
          <GTPIcon icon="gtp-house" size="sm" className="w-[24px] h-[24px]" />
        </div>
      </Link>

      {/* Select Format Section */}
      <div className="flex flex-col items-center gap-[2px] w-[137px] h-[43px]">
        {/* Title */}
        <span
          className="font-raleway font-bold text-[10px] leading-[12px] uppercase text-[#5A6462] text-center"
          style={{
            fontVariant: "all-small-caps",
            fontFeatureSettings: "'pnum' on, 'lnum' on",
          }}
        >
          Select Format
        </span>
        {/* Options */}
        <div className="flex items-center gap-[8px] w-[137px] h-[35px]">
          {[
            { format: "SVG", icon: "gtp-svg" as GTPIconName },
            { format: "PNG", icon: "gtp-png" as GTPIconName },
          ].map(({ format, icon }) => (
            <div
              key={format}
              className={`relative flex items-center justify-center w-[61px] h-[34px] rounded-full cursor-pointer ${
                selectedFormat === format ? "bg-[#5A6462]" : "bg-[#5A6462]"
              }`}
              onClick={() => setSelectedFormat(format as "SVG" | "PNG")}
            >
              {/* Inner Rect */}
              <div
                className={`absolute inset-0 m-[2px] rounded-full bg-[#1F2726]`}
              />
              {/* Icon */}
              <div
                className={`absolute left-[7px] w-[26px] h-[26px] rounded-full bg-[#1F2726] flex items-center justify-center`}
              >
                <GTPIcon icon={icon} size="sm" className="w-[15px] h-[15px]" />
              </div>
              {/* Checkmark */}
              <div className="absolute right-[7px] flex items-center">
                {selectedFormat === format ? (
                  <GTPIcon
                    icon="gtp-checkmark-checked-monochrome"
                    size="sm"
                    className="w-[15px] h-[15px]"
                  />
                ) : (
                  <GTPIcon
                    icon="gtp-checkmark-unchecked-monochrome"
                    size="sm"
                    className="w-[15px] h-[15px]"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Download All Button */}
      <button
        className="flex items-center bg-[#1F2726] gap-x-[10px] rounded-full p-[10px_15px] text-white hover:bg-[#2b3635] focus:outline-none"
      >
        <div className="w-6 h-6">
          <GTPIcon icon="gtp-download" size="sm" className="w-[24px] h-[24px]" />
        </div>
        <span>Download All</span>
      </button>

      {/* Search Bar */}
      <div className="flex-1">
        <Search 
          query={searchQuery} 
          setQuery={setSearchQuery} 
          iconsCount={iconsCount}
        />
      </div>
    </div>
  );
}
