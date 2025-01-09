import Link from "next/link";
import Search from "./Search";
import { HomeIcon, DownloadIcon } from "./Icons";

export default function FloatingBar({
  downloadCSV,
  downloadJSON,
}: {
  downloadCSV: () => void;
  downloadJSON: () => void;
}) {
  return (
    <div className="flex p-[5px] items-center w-full rounded-full mt-[16px] bg-[#344240] shadow-[0px_0px_50px_0px_#000000] gap-x-[5px] md:gap-x-[15px] z-0 pointer-events-auto">
      <Link
        className="flex items-center bg-[#1F2726] gap-x-[10px] rounded-full p-[10px]"
        href="https://www.growthepie.xyz/"
        target="_blank"
      >
        <div className="w-6 h-6">
          <HomeIcon />
        </div>
      </Link>

      {/* Download Button */}
      <button
        className="flex items-center bg-[#1F2726] gap-x-[10px] rounded-full p-[10px_15px] text-white hover:bg-[#2b3635] focus:outline-none"
        onClick={() => {
          downloadCSV();
          downloadJSON();
        }}
      >
        <div className="w-6 h-6">
          <DownloadIcon />
        </div>
        <span>Download All</span>
      </button>

      <Search />
    </div>
  );
}
