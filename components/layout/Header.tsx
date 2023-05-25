"use client";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { Icon } from "@iconify/react";
import EthUsdSwitch from "./EthUsdSwitch";
import DarkModeSwitch from "./DarkModeSwitch";
import { useUIContext } from "@/contexts/UIContext";

export default function Header() {
  return (
    <header className="flex justify-between space-x-6 items-center max-w-[1600px] w-full mx-auto px-[20px] pt-[20px] md:px-[50px] md:pt-[50px]">
      <div className="flex justify-between items-center w-full">
        <div className="flex space-x-6 w-full">
          <div className="flex justify-between items-end md:hidden relative w-full">
            <Link href="" className="">
              <div className="h-[36px] w-[154.05px] relative">
                <Image
                  src="/logo_full.png"
                  alt="Forest"
                  className="hidden dark:block"
                  fill={true}
                  quality={100}
                />
                <Image
                  src="/logo_full_light.png"
                  alt="Forest"
                  className="block dark:hidden"
                  fill={true}
                  quality={100}
                />
              </div>
            </Link>
            <Sidebar isMobile={true} />
          </div>
        </div>
      </div>
      <div className="items-center z-10 hidden md:flex md:space-x-[34px]">
        <EthUsdSwitch />
        <DarkModeSwitch />
        <div className="flex space-x-[22px] items-center">
          <Link
            href="https://twitter.com/growthepie_eth"
            target="_blank"
            rel="noopener"
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
      </div>
    </header>
  );
}
