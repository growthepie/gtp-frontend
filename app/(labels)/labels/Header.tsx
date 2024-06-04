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

export default function Header() {
  return (
    <div className="fixed flex flex-col w-full z-50 items-center">
      <div className="absolute h-[150px] w-full overflow-hidden">
        <div className="background-container !h-screen">
          <div className="background-gradient-group">
            <div className="background-gradient-yellow"></div>
            <div className="background-gradient-green"></div>
          </div>
        </div>
      </div>
      <header className="flex justify-between space-x-0 xl:space-x-6 items-end w-full mx-auto px-[20px] pt-[20px] md:px-[60px] md:pt-[30px] ">
        <div className="flex justify-start items-center w-full">
          <div className="flex space-x-0 xl:space-x-6 w-full h-full">


            <div className="flex justify-between items-start h-full relative w-full left-1 ">
              <Link href="/" className="flex gap-x-1">
                <Image
                  src="/logo_labels_full.png"
                  alt="Forest"
                  className="hidden dark:block"
                  width={206}
                  height={45}
                  sizes="100vw"
                />

              </Link>
            </div>
          </div>
        </div>
        <div className="items-center z-10 hidden md:flex md:space-x-[34px] h-full mt-[7px]">
          <EthUsdSwitch />

          <div className="flex space-x-[22px] pr-2.5 items-center">
            <HeaderLinks />
          </div>
        </div>
        {/* <LabelsContainer className="invisible pt-[102px] pointer-events-auto">
        <div className="flex px-[5px] items-center w-full h-[54px] rounded-full bg-[#344240] shadow-[0px_0px_50px_0px_#000000]">
          <a
            className="flex items-center w-[162px] h-[44px] bg-[#1F2726] gap-x-[10px] rounded-full px-2 gap"
            href="https://www.growthepie.xyz/"
            target="_blank"
          >
            <Icon icon="gtp:house" className="h-6 w-6" />
            <div className="font-bold">Main platform</div>
          </a>
        </div>
      </LabelsContainer> */}

      </header>
      <LabelsContainer className={`absolute top-[76px] w-full hidden md:block`}>
        <div className="flex p-[5px] items-center w-full rounded-full mt-[16px] bg-[#344240]  shadow-[0px_0px_50px_0px_#000000]">
          <a
            className="flex items-center w-[162px] bg-[#1F2726] gap-x-[10px] rounded-full p-[10px] gap"
            href="https://www.growthepie.xyz/"
            target="_blank"
          >
            <div className="w-6 h-6">
              <Icon icon="gtp:house" className="h-6 w-6" />
            </div>
            <div className="font-semibold">Main platform</div>
          </a>
        </div>
      </LabelsContainer>

    </div>
  );
}
