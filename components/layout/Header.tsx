"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { Icon } from "@iconify/react";
import EthUsdSwitch from "./EthUsdSwitch";
import DarkModeSwitch from "./DarkModeSwitch";

export default function Header() {
  const [startSidebarOpen, setStartSidebarOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // useEffect(() => {
  //   setStartSidebarOpen(isLargeScreen);
  // }, [isLargeScreen]);

  return (
    <header className="flex justify-between space-x-6 items-center max-w-[1600px] w-full mx-auto px-[50px] pt-[50px]">
      <div className="flex justify-between items-center">
        <div className="flex space-x-6">
          <div className="block md:hidden relative">
            <Sidebar
              trigger={
                <button className="flex items-center space-x-2">
                  <Icon icon="feather:menu" className="h-8 w-8" />
                </button>
              }
              isMobile={true}
              open={startSidebarOpen}
              isOpen={isSidebarOpen}
              setIsOpen={setIsSidebarOpen}
            />
            <Link href="" className="absolute top-2 left-20">
              <div className="h-[32px] w-[32px] absolute">
                <Image
                  src="/logo_pie_only.png"
                  alt="Forest"
                  className="mb-6 -ml-[9px] z-10 antialiased hover:scale-105 hover:translate-x-0 transition-transform duration-150 ease-in-out"
                  fill={true}
                  quality={100}
                />
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div className="flex items-center z-10">
        <EthUsdSwitch />
        <DarkModeSwitch />
        <Link
          href="https://twitter.com/growthepie_eth"
          target="_blank"
          rel="noopener"
          className="mr-[22px]"
        >
          <Icon icon="cib:twitter" className="h-6 w-6" />
        </Link>
        <Link
          href="https://discord.gg/fxjJFe7QyN"
          target="_blank"
          rel="noopener"
        >
          <Icon icon="cib:discord" className="h-6 w-6" />
        </Link>
      </div>
    </header>
  );
}
