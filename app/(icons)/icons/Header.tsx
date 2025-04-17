import Link from "next/link";
import HeaderLinks from "@/components/layout/HeaderLinks";
import IconsContainer from "@/components/layout/IconsContainer";
import { useUIContext } from "@/contexts/UIContext";
import FloatingBar from "./FloatingBar";
import Image from "next/image";
interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  iconsCount?: number;
  onDownloadAll?: (format: "SVG" | "PNG") => void;
  selectedFormat: "SVG" | "PNG";
  setSelectedFormat: React.Dispatch<React.SetStateAction<"SVG" | "PNG">>;
  selectedStyles: ("gradient" | "monochrome")[];
  setSelectedStyles: React.Dispatch<React.SetStateAction<("gradient" | "monochrome")[]>>;
}

export default function Header({
  searchQuery = "",
  setSearchQuery = () => {},
  iconsCount = 0,
  onDownloadAll = () => {},
  selectedFormat,
  setSelectedFormat,
  selectedStyles,
  setSelectedStyles,
}: HeaderProps) {
  const { isMobile } = useUIContext();
  return (
    <div className="fixed flex flex-col w-full z-50 items-center">
      <div className="absolute h-[150px] md:h-[170px] w-full overflow-clip">
        <div
          className="background-container !h-screen"
          style={{
            backgroundPosition: "top",
            maskImage: isMobile ? `linear-gradient(to bottom, white 0, white 90px, transparent 110px` : `linear-gradient(to bottom, white 0, white 150px, transparent 170px`,
          }}
        >
          <div className="background-gradient-group">
            <div className="background-gradient-yellow"></div>
            <div className="background-gradient-green"></div>
          </div>
        </div>
      </div>
      <header className="flex z-10 w-full max-w-[1307px] mx-auto justify-between space-x-0 xl:space-x-6 items-end px-[20px] pt-[20px] md:px-[60px] md:pt-[30px]">
        <div className="flex justify-start items-center w-full">
          <div className="flex space-x-0 xl:space-x-6 w-full h-full">
            <div className="flex justify-between items-start h-full relative">
              <Link href="/" className="hidden md:block">
                <Image src="/logo_icons_full.svg" alt="growthepie Icons Logo" width={206} height={45} />
              </Link>
              <Link href="/" className="block md:hidden">
                <Image src="/logo_icons_full.svg" alt="growthepie Icons Logo" width={288} height={63} />
              </Link>
            </div>
          </div>
        </div>
        <div className="items-center hidden md:flex md:space-x-[34px] h-full mt-[7px]">
          <div className="flex space-x-[22px] pr-2.5 items-center">
            <HeaderLinks />
          </div>
        </div>
      </header>
      <IconsContainer className={`hidden md:block absolute top-[76px] w-full max-w-[1307px] mx-auto px-[20px] md:px-[60px] z-10`}>
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
      </IconsContainer>
    </div>
  );
}
