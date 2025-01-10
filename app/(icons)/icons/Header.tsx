import Link from "next/link";
import HeaderLinks from "@/components/layout/HeaderLinks";
import IconsContainer from "@/components/layout/IconsContainer";
import { useUIContext } from "@/contexts/UIContext";
import FloatingBar from "./FloatingBar";
import { LogoIcon } from "./Icons";
export default function Header({
  downloadCSV,
  downloadJSON,
}: {
  downloadCSV: () => void;
  downloadJSON: () => void;
}) {
  const { isMobile } = useUIContext();
  return (
    <div className="fixed flex flex-col w-full z-50 items-center">
      <div className="absolute h-[90px] md:h-[170px] w-full overflow-clip">
        <div
          className="background-container !h-screen"
          style={{
            backgroundPosition: "top",
            maskImage: isMobile
              ? `linear-gradient(to bottom, white 0, white 90px, transparent 110px`
              : `linear-gradient(to bottom, white 0, white 150px, transparent 170px`,
          }}
        >
          <div className="background-gradient-group">
            <div className="background-gradient-yellow"></div>
            <div className="background-gradient-green"></div>
          </div>
        </div>
      </div>
      <header className="flex justify-between space-x-0 xl:space-x-6 items-end w-full mx-auto px-[20px] pt-[20px] md:px-[60px] md:pt-[30px]">
        <div className="flex justify-start items-center w-full">
          <div className="flex space-x-0 xl:space-x-6 w-full h-full">
            <div className="flex justify-between items-start h-full relative w-full left-1 ">
              <Link href="/" className="flex gap-x-1">
                <LogoIcon />
              </Link>
            </div>
          </div>
        </div>
        <div className="items-center z-10 hidden md:flex md:space-x-[34px] h-full mt-[7px]">
          <div className="flex space-x-[22px] pr-2.5 items-center">
            <HeaderLinks />
          </div>
        </div>
      </header>
      <IconsContainer className={`absolute top-[76px] w-full`}>
        {!isMobile && (
          <FloatingBar downloadCSV={downloadCSV} downloadJSON={downloadJSON} />
        )}
      </IconsContainer>
    </div>
  );
}
