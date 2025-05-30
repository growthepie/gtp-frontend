import Link from "next/link";
import Search from "./Search";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GradientIcon, MonochromeIcon } from "./Icons";
import { SettingsIcon } from "@/app/(labels)/labels/Icons";
import { useIconPageUI } from "./IconPageUIContext";
import CustomizationControls from "./CustomizationControls";
import { useEffect, useRef, useState } from "react";

type IconStyleOption = "gradient" | "monochrome";
type IconFormatOption = "SVG" | "PNG";

const customizeButtonWidthMobile = "44px";
const customizeButtonWidth = "136px";
const customizeButtonWidthHover = "280px";

const useOutsideAlerter = (ref: React.RefObject<HTMLElement>, callback: () => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
};


export default function FloatingBar() {
  const {
    searchQuery,
    setSearchQuery,
    iconsCount,
    selectedFormat,
    setSelectedFormat,
    triggerDownloadAll,
    selectedSize,
    setSelectedSize,
  } = useIconPageUI();

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isCustomizedOpenLocked, setIsCustomizedOpenLocked] = useState(false);
  const customizeGroupRef = useRef<HTMLDivElement>(null);

  useOutsideAlerter(customizeGroupRef, () => {
    setIsCustomizeOpen(false)
    setIsCustomizedOpenLocked(false)
  });



  const handleDownloadAllClick = () => {
    triggerDownloadAll(); // Trigger download using context callback
  };

  // --- Content for the SMALL screen Settings Popover ---
  const mobileSettingsContent = (
    <div className="p-3 flex flex-col items-stretch gap-y-3 text-xs">
      {/* Format Selector */}
      <div>
        <div className="heading-caps-xxxs text-[#5A6462] mb-1">Format</div>
        <div className="flex items-center gap-[8px]">
          {[{ option: "SVG", iconName: "gtp-svg" }, { option: "PNG", iconName: "gtp-png" }].map(({ option, iconName }) => (
            <SelectOption
              key={option} option={option}
              icon={<GTPIcon icon={iconName as GTPIconName} size="sm" />}
              selectedOption={selectedFormat}
              setSelectedOption={(v) => setSelectedFormat(v as IconFormatOption)}
            />
          ))}
        </div>
      </div>
      {/* Size Selector */}
      <div>
        <div className="heading-caps-xxxs text-[#5A6462] mb-1">Size</div>
        <div className="flex items-center gap-[8px]">
          <SizeInput
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            className="!w-auto !px-3 !h-[28px]" // Smaller size buttons
          />
        </div>
      </div>
    </div>
  );
  // --- End Mobile Settings Popover Content ---

  return (
    <div className="flex p-[5px] items-center w-full rounded-full mt-[16px] bg-[#344240] shadow-[0px_0px_50px_0px_#000000] gap-x-[5px] md:gap-x-[15px] z-0 pointer-events-auto">
      {/* Home Icon */}
      <Link href="https://www.growthepie.com/" target="_blank" className="flex items-center justify-center !size-[44px] bg-[#1F2726] rounded-full shrink-0">
        <GTPIcon icon="gtp-house" size="md" />
      </Link>

      
      

      {/* Search Bar */}
      <div className="flex-1 min-w-[150px]">
        <Search query={searchQuery} setQuery={setSearchQuery} iconsCount={iconsCount} />
      </div>

      {/* --- Visible Options on LG+ Screens --- */}
      <div className="hidden lg:flex items-center gap-x-[5px] md:gap-x-[15px]">
        {/* Format Selector */}
        <div className="flex flex-col items-center gap-y-[2px]">
          <div className="h-[9px] heading-caps-xxxs text-[#5A6462]">Format</div>
          <div className="flex items-center gap-[8px]">
            {[{ option: "SVG", iconName: "gtp-svg" }, { option: "PNG", iconName: "gtp-png" }].map(({ option, iconName }) => (
              <SelectOption
                key={option} option={option}
                icon={<GTPIcon icon={iconName as GTPIconName} size="sm" />}
                selectedOption={selectedFormat}
                setSelectedOption={(v) => setSelectedFormat(v as IconFormatOption)}
              />
            ))}
          </div>
        </div>
        {/* Size Selector */}
        <div className="flex flex-col items-center gap-y-[2px]">
          <div className="h-[9px] heading-caps-xxxs text-[#5A6462]">Size</div>
          <div className="flex items-center gap-[8px]">
            <SizeInput
              selectedSize={selectedSize}
              setSelectedSize={setSelectedSize}
              className="!w-auto !px-3 !h-[28px]" // Smaller size buttons
            />
          </div>
        </div>
      </div>
      {/* --- End Visible Options on LG+ Screens --- */}


      {/* --- Customize Button and Popover --- */}
      <div
        ref={customizeGroupRef}
        className="relative w-fit z-50 flex"
        onClick={(e)=>{
          // if not locked, set locked to true
          if(!isCustomizedOpenLocked){
            setIsCustomizedOpenLocked(true);
          }
        }}
        onMouseEnter={() => setIsCustomizeOpen(true)}
        onMouseLeave={() => {
          if(!isCustomizedOpenLocked){
            setIsCustomizeOpen(false);
          }
        }}
        
      >
        {/* Popover container */}
        {/* Customize Button */}
        <button
          className={`z-10 cursor-pointer flex md:hidden  overflow-hidden items-center justify-start pl-[10px] gap-x-1.5 h-[44px] rounded-full shrink-0 transition-all duration-200 ease-out heading-small-sm bg-[#1F2726]`}
          title="Customize Icon Colors"
          style={{ width: isCustomizeOpen ? customizeButtonWidthMobile : customizeButtonWidthMobile }}
        >
          <GTPIcon icon="gtp-settings" size="md" /> {/* Or a palette icon */}
          <span style={{ opacity: isCustomizeOpen ? 0 : 0 }}>Customize</span>
        </button>
        <button
          className={`z-10 cursor-pointer hidden md:flex items-center gap-x-1.5 px-3 h-[44px] rounded-full shrink-0 transition-all duration-200 ease-out heading-small-sm bg-[#1F2726]`}
          title="Customize Icon Colors"
            
          style={{ width: isCustomizeOpen ? customizeButtonWidthHover : customizeButtonWidth }}
        >
          <GTPIcon icon="gtp-settings" size="md" /> {/* Or a palette icon */}
          <span>Customize</span>
        </button>

        {/* Popover Menu */}
        <div
          className={`z-0 whitespace-nowrap w-0 max-h-[0px] absolute bottom-[calc(100%+15px)] top-auto right-[calc(-50%-10px)] md:bottom-auto md:top-1/2 md:left-auto md:right-0 bg-[#151A19] rounded-[22px] md:rounded-t-[0px] md:rounded-b-[22px] transition-all duration-200 ease-out shadow-[0px_4px_46.2px_0px_#000000] overflow-hidden origin-top-right`}
          role="dialog"
          aria-modal="true"
          style={{ 
            width: isCustomizeOpen ? customizeButtonWidthHover : customizeButtonWidth,
            maxHeight: isCustomizeOpen ? "70vh" : "0px",
          }}
        >
          <div className="h-[5px] md:h-[24px]"></div>
          {/* Only render Customization Controls */}
          <CustomizationControls />
          <div className="h-[5px] md:h-0"></div>
        </div>
      </div>
      {/* --- End Customize Button and Popover --- */}
      {/* Download All Button (Visible differently on screen sizes) */}
      <button className="flex items-center justify-center rounded-full !size-[44px] bg-[#1F2726]" onClick={handleDownloadAllClick} title="Download All">
        <GTPIcon icon="gtp-download" size="md" />
      </button>
      {/* <button className="hidden lg:flex items-center gap-x-[10px] rounded-full px-[15px] h-[44px] bg-[#1F2726]" onClick={handleDownloadAllClick}>
        <GTPIcon icon="gtp-download" size="md" />
        <div className="heading-small-sm">Download All</div>
      </button> */}
    </div>
  );
}


const SelectOption = ({
  option,
  icon,
  selectedOption,
  setSelectedOption,
  className,
}: {
  option: string;
  icon: React.ReactNode;
  selectedOption: string | IconStyleOption[];
  setSelectedOption: React.Dispatch<React.SetStateAction<string | IconStyleOption[]>>;
  className?: string;
}) => {
  return (
    <div
      className={`relative flex items-center gap-[8px] w-[57px] h-[34px] px-[2px] py-[2px] rounded-full cursor-pointer bg-[#5A6462] ${className}`}
      onClick={() => setSelectedOption(option)}
    >
      <div className="absolute inset-[2px] rounded-full bg-[#1F2726] flex items-center justify-center pl-[5px] pr-[1px]">
        <div className="size-[26px] flex items-center justify-center">
        {icon}
        </div>
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

interface SizeInputProps {
  selectedSize: number;
  setSelectedSize: (size: number) => void;
  minSize?: number;
  maxSize?: number;
  step?: number;
  className?: string; // Pass className to the outer div if needed
}

const SizeInput: React.FC<SizeInputProps> = ({
  selectedSize,
  setSelectedSize,
  minSize = 1, // Sensible minimum
  maxSize = 128, // Sensible maximum
  step = 1,
  className = "", // Optional: apply to wrapper
}) => {

  const handleIncrement = () => {
    setSelectedSize(Math.min(maxSize, selectedSize + step));
  };

  const handleDecrement = () => {
    setSelectedSize(Math.max(minSize, selectedSize - step));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value, 10);
    if (isNaN(newValue)) {
      newValue = minSize; // Or keep previous valid value? Reset to min for now
    }
    setSelectedSize(Math.max(minSize, Math.min(maxSize, newValue)));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Optional: If user leaves input blank, reset to min/default
    if (e.target.value === '') {
      setSelectedSize(minSize);
    }
  }

  return (
    // Container: Rounded, background, flex layout, specific height
    <div
      className={`relative flex items-center bg-[#1F2726] rounded-full h-[34px] px-1 gap-x-0.5 overflow-hidden`}
    // style={{ width: 'fit-content' }} // Or set a fixed width if preferred
    >
      
      {/* Decrement Button */}
      <button
        onClick={handleDecrement}
        disabled={selectedSize <= minSize}
        className="flex items-center justify-center p-0.5 rounded-full text-[#CDD8D3] bg-transparent hover:bg-[#344240]/60"
        aria-label="Decrease icon size"
        title="Decrease size"
      >
        <GTPIcon icon={"feather:minus" as GTPIconName} size="sm" /> {/* Smaller icon */}
      </button>
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
      {/* number input without spinners */}
      <input 
      type="number" 
      min={minSize}
      max={maxSize}
      step={step}

      value={selectedSize} 
      onChange={handleChange} 
      onBlur={handleBlur} 
      className="w-[30px] !numbers-lg h-full bg-transparent border-none text-center focus:outline-none" 
      />

      {/* Unit Display */}
      <span className="text-[10px] text-[#CDD8D3]/80 select-none pointer-events-none -ml-0.5 pr-1">px</span>


      {/* Increment Button */}
      <button
        onClick={handleIncrement}
        disabled={selectedSize >= maxSize}
        className="flex items-center justify-center p-0.5 rounded-full text-[#CDD8D3] bg-transparent hover:bg-[#344240]/60  -ml-0.5" // Negative margin to reduce gap slightly
        aria-label="Increase icon size"
        title="Increase size"
      >
        <GTPIcon icon={"feather:plus" as GTPIconName} size="sm" /> {/* Smaller icon */}
      </button>
    </div>
  );
};