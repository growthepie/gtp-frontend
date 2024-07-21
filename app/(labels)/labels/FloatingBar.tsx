import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import Icon from "@/components/layout/Icon";
import EthUsdSwitch from "@/components/layout/EthUsdSwitch";

import Banner from "@/components/Banner";
import Notification from "@/components/Notification";
import HeaderLinks from "@/components/layout/HeaderLinks";
import { track } from "@vercel/analytics";
import LabelsContainer from "@/components/layout/LabelsContainer";
import Search from "./Search";
import { useUIContext } from "@/contexts/UIContext";
import { HomeIcon, SettingsIcon, DownloadIcon } from "./Icons";

export default function FloatingBar() {
  const { isMobile } = useUIContext();
  return (

    <div className="flex p-[5px] items-center w-full rounded-full mt-[16px] bg-[#344240]  shadow-[0px_0px_50px_0px_#000000] gap-x-[5px] md:gap-x-[15px] z-0 pointer-events-auto">
      <Link
        className="flex items-center bg-[#1F2726] gap-x-[10px] rounded-full p-[10px] gap"
        href="https://www.growthepie.xyz/"
        target="_blank"
      >
        <div className="w-6 h-6">
          <HomeIcon />
        </div>
      </Link>
      <Search />
      <div
        className="flex items-center bg-[#1F2726] gap-x-[10px] rounded-full py-[10px] pl-[10px] pr-[0px] lg:pl-[15px] lg:pr-[15px] gap font-medium transition-all duration-300"
      >
        <div className="w-6 h-6">
          <SettingsIcon />
        </div>
        <div className="max-w-0 lg:max-w-[100px] overflow-hidden transition-all duration-300">
          Settings
        </div>
      </div>
      <div
        className="hidden md:flex items-center bg-[#1F2726] gap-x-[10px] rounded-full p-[10px]"
      >
        <div className="w-6 h-6">
          <DownloadIcon />
        </div>
      </div>
    </div>

  );
}
