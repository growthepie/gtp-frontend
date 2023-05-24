"use client";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { Icon } from "@iconify/react";
import EthUsdSwitch from "./EthUsdSwitch";
import DarkModeSwitch from "./DarkModeSwitch";
import { useUIContext } from "@/contexts/UIContext";

export default function Header() {
  const { isSidebarOpen, toggleSidebar } = useUIContext();

  return (
    <header className="flex justify-between space-x-6 items-center max-w-[1600px] pb-[35px] md:pb-0 w-full mx-auto px-[50px] pt-[20px] md:pt-[50px]">
      <div className="flex justify-between items-center">
        <div className="flex space-x-6">
          <div className="flex items-center md:hidden relative">
            <Link href="" className="flex absolute right-[6vw]">
              <div className="h-[36px] w-[154px] absolute">
                <Image
                  src="/logo_full.png"
                  alt="Forest"
                  className="mb-6 -ml-[2px] z-10 antialiased hover:scale-105 hover:translate-x-0 transition-transform duration-150 ease-in-out"
                  fill={true}
                  quality={100}
                />
              </div>
            </Link>
            <div className="flex absolute left-[70vw] top-[1px]">
              <Sidebar
                trigger={
                  <button className="flex items-center space-x-2">
                    <Icon icon="feather:menu" className="h-8 w-8" />
                  </button>
                }
                isMobile={true}
              />
          </div>
          </div>
        </div>
      </div>
      <div className="items-center z-10 hidden md:flex">
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

