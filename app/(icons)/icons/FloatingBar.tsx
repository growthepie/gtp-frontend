import Link from "next/link";
import Search from "./Search";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GradientIcon, MonochromeIcon } from "./Icons";
import { SettingsIcon } from "@/app/(labels)/labels/Icons";

type IconStyleOption = "gradient" | "monochrome";

interface FloatingBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  iconsCount: number;
  onDownloadAll?: (format: "SVG" | "PNG") => void;
  selectedFormat: "SVG" | "PNG";
  setSelectedFormat: React.Dispatch<React.SetStateAction<"SVG" | "PNG">>;
  selectedStyles: IconStyleOption[];
  setSelectedStyles: React.Dispatch<React.SetStateAction<IconStyleOption[]>>;
}

export default function FloatingBar({
  searchQuery,
  setSearchQuery,
  iconsCount,
  onDownloadAll = () => { },
  selectedFormat,
  setSelectedFormat,
  selectedStyles,
  setSelectedStyles,
}: FloatingBarProps) {
  const handleDownloadAllClick = () => {
    onDownloadAll(selectedFormat);
  };

  const toggleStyle = (style: IconStyleOption) => {
    setSelectedStyles(prev => {
      if (prev.includes(style)) {
        // Remove the style if it's already selected
        return prev.filter(s => s !== style);
      } else {
        // Add the style if it's not selected
        return [...prev, style];
      }
    });
  };

  // --- Content for the Settings Popover ---
  const settingsContent = (
    <>
      {/* Select Format Section */}
      <div className="flex flex-col items-center gap-y-[2px] w-full px-2">
        <div className="h-[9px] heading-caps-xxxs text-[#5A6462] self-start pl-1">
          Select Format
        </div>
        <div className="flex items-center gap-[8px] w-full justify-center">
          {[
            { option: "SVG", icon: "gtp-svg" as GTPIconName },
            { option: "PNG", icon: "gtp-png" as GTPIconName },
          ].map(({ option, icon }) => (
            <SelectOption
              key={option}
              option={option}
              icon={<GTPIcon icon={icon} size="sm" containerClassName="!size-[26px] flex justify-center items-center" />}
              selectedOption={selectedFormat}
              // Pass the original state setter directly
              setSelectedOption={(newFormat) => setSelectedFormat(newFormat as "SVG" | "PNG")}
            />
          ))}
        </div>
      </div>

      {/* Select Style Section */}
      <div className="flex flex-col items-center gap-y-[2px] w-full px-2">
        <div className="h-[9px] heading-caps-xxxs text-[#5A6462] self-start pl-1">
          Select Style
        </div>
        <div className="flex items-center gap-[8px] w-full justify-center">
        {[
              { 
                option: "monochrome" as IconStyleOption, 
                Icon: (
                  <div className="size-[26px] flex items-center justify-center">
                    <div className="size-[15px] rounded-[2px]" style={{ background: "#CDD8D3" }} />
                  </div>
                ), 
                label: "Monochrome" },
              {
                option: "gradient" as IconStyleOption, 
                Icon: (
                  <div className="size-[26px] flex items-center justify-center">
                    <div className="size-[15px] rounded-[2px]" style={{ background: "linear-gradient(144.58deg, #FE5468 20.78%, #FFDF27 104.18%)" }} />
                  </div>
                ), 
                label: "Gradient"
              },
            ].map(({ option, Icon, label }) => (
            <SelectOption
              key={option}
              option={option}
              icon={Icon}
              selectedOption={selectedStyles.includes(option) ? option : ""}
              // Use the toggle function for multi-select styles
              setSelectedOption={() => toggleStyle(option)}
            />
          ))}
        </div>
      </div>
    </>
  );
  // --- End Settings Popover Content ---

  return (
    <div className="flex p-[5px] items-center w-full rounded-full mt-[16px] bg-[#344240] shadow-[0px_0px_50px_0px_#000000] gap-x-[5px] md:gap-x-[15px] z-0 pointer-events-auto">
      {/* Home Icon */}
      <Link
        className="flex items-center justify-center !size-[44px] bg-[#1F2726] rounded-full"
        href="https://www.growthepie.xyz/"
        target="_blank"
      >
        <GTPIcon icon="gtp-house" size="md" />
      </Link>

      {/* --- Visible Options on Large Screens --- */}
      <div className="hidden lg:flex items-center gap-x-[5px] md:gap-x-[15px]">
        {/* Select Format Section (LG+) */}
        <div className="flex flex-col items-center gap-y-[2px]">
          <div className="h-[9px] heading-caps-xxxs text-[#5A6462]">
            Select Format
          </div>
          <div className="flex items-center gap-[8px]">
            {[
              { option: "SVG", icon: "gtp-svg" as GTPIconName },
              { option: "PNG", icon: "gtp-png" as GTPIconName },
            ].map(({ option, icon }) => (
              <SelectOption
                key={option}
                option={option}
                icon={<GTPIcon icon={icon} size="sm" containerClassName="!size-[26px] flex justify-center items-center" />}
                selectedOption={selectedFormat}
                setSelectedOption={(newFormat) => setSelectedFormat(newFormat as "SVG" | "PNG")}
              />
            ))}
          </div>
        </div>

        {/* Select Style Section (LG+) */}
        <div className="flex flex-col items-center gap-y-[2px]">
          <div className="h-[9px] heading-caps-xxxs text-[#5A6462]">
            Select Style
          </div>
          <div className="flex items-center gap-[8px]">
            {[
              { 
                option: "monochrome" as IconStyleOption, 
                Icon: (
                  <div className="size-[26px] flex items-center justify-center">
                    <div className="size-[15px] rounded-[2px]" style={{ background: "#CDD8D3" }} />
                  </div>
                ), 
                label: "Monochrome" },
              {
                option: "gradient" as IconStyleOption, 
                Icon: (
                  <div className="size-[26px] flex items-center justify-center">
                    <div className="size-[15px] rounded-[2px]" style={{ background: "linear-gradient(144.58deg, #FE5468 20.78%, #FFDF27 104.18%)" }} />
                  </div>
                ), 
                label: "Gradient"
              },
            ].map(({ option, Icon, label }) => (
              <SelectOption
                key={option}
                option={option}
                icon={Icon}
                selectedOption={selectedStyles.includes(option) ? option : ""}
                setSelectedOption={() => toggleStyle(option)}
              />
            ))}
          </div>
        </div>
      </div>
      {/* --- End Visible Options on Large Screens --- */}



      {/* Download All Button */}
      <button
        className="flex lg:hidden items-center justify-center rounded-full w-[44px] h-[44px] bg-[#1F2726] focus:outline-none"
        onClick={handleDownloadAllClick}
      >
        <GTPIcon icon="gtp-download" size="md" />
      </button>

      <button
        className="hidden lg:flex items-center gap-x-[10px] rounded-full px-[15px] h-[44px] bg-[#1F2726] focus:outline-none"
        onClick={handleDownloadAllClick}
      >
        <GTPIcon icon="gtp-download" size="md" />
        <div className="heading-small-sm">
          Download All
        </div>
      </button>

      {/* Search Bar */}
      <div className="flex-1">
        <Search query={searchQuery} setQuery={setSearchQuery} iconsCount={iconsCount} />
      </div>

      {/* --- Settings Button and Popover (Replaces above options on < LG screens) --- */}
      <div className="group relative w-fit z-50 flex lg:hidden"> {/* Show only below LG */}
        {/* Settings Icon Button */}
        <div className="cursor-pointer flex items-center justify-center !size-[44px] bg-[#1F2726] rounded-full shrink-0">
          <GTPIcon icon="gtp-settings" size="md" /> {/* Use the imported SettingsIcon */}
        </div>

        {/* Popover Menu (Hidden by default, shown on group-hover) */}
        {/* Positioning adjusted for mobile/bottom bar context */}
        <div className={`absolute bottom-full mb-2 right-0 md:right-auto md:left-0 bg-[#151A19] rounded-2xl transition-all duration-300 ease-in-out overflow-hidden shadow-[0px_4px_46.2px_0px_#000000] w-[150px] max-h-0 opacity-0 group-hover:max-h-[200px] group-hover:opacity-100 -z-10`}>
          <div className={`p-3 flex flex-col items-center gap-y-4`}>
            {settingsContent} {/* Render the options inside */}
          </div>
        </div>
      </div>
      {/* --- End Settings Button and Popover --- */}

    </div>
  );
}



const SelectOption = ({
  option,
  icon,
  selectedOption,
  setSelectedOption,
}: {
  option: string;
  icon: React.ReactNode;
  selectedOption: string | IconStyleOption[];
  setSelectedOption: React.Dispatch<React.SetStateAction<string | IconStyleOption[]>>;
}) => {
  return (
    <div
      className="relative flex items-center gap-[8px] w-[57px] h-[34px] px-[2px] py-[2px] rounded-full cursor-pointer bg-[#5A6462]"
      onClick={() => setSelectedOption(option)}
    >
      <div className="absolute inset-[2px] rounded-full bg-[#1F2726] flex items-center justify-center pl-[5px] pr-[1px]">
        {icon}
        <div className="pr-[5px]">
          {selectedOption === option ? (
            <GTPIcon icon="gtp-checkmark-checked-monochrome" size="sm" />
          ) : (
            <GTPIcon icon="gtp-checkmark-unchecked-monochrome" size="sm" className="text-[#5A6462]" />
          )}
        </div>
      </div>
    </div>
  );
};



