"use client";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { Icon } from "@iconify/react";
import EthUsdSwitch from "./EthUsdSwitch";
import DarkModeSwitch from "./DarkModeSwitch";
import { useUIContext } from "@/contexts/UIContext";
import { useSpring, animated, config } from "react-spring";

export default function Header() {
  return (
    <header className="flex flex-col xl:flex-row justify-between space-x-0 xl:space-x-6 items-center max-w-[1600px] w-full mx-auto px-[20px] pt-[20px] md:px-[50px] md:pt-[50px]">
      <div className="flex justify-between items-center w-full">
        <div className="flex space-x-0 xl:space-x-6 w-full">
          {/* Donation Banner XL screen */}
          <Link
            href="https://explorer.gitcoin.co/#/round/42161/0x59d79b22595b17af659ce9b03907615f53742c57/0x59d79b22595b17af659ce9b03907615f53742c57-16"
            target="_blank"
            rel="noopener"
            className="hidden xl:flex absolute top-[50px] items-center dark:bg-[#FFE28A] dark:text-[#1B0DB9] bg-[#1B0DB9] text-white p-1 justify-between rounded-full text-sm font-bold mr-auto"
          >
            <div className="ml-3 mr-4 flex space-x-0.5">
              <div>
                We are part of Arbitrum&apos;s Gitcoin Grant Funding Fest.{" "}
              </div>
              <div className="animate-bounce text-sm">🎉</div>{" "}
              <div>Support us here.</div>
            </div>
            <Icon icon="feather:arrow-right-circle" className="h-6 w-6" />
          </Link>
          {/* Logo */}

          <div className="flex justify-between items-end md:hidden relative w-full">
            <Link href="/" className="">
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
      <div className="items-center z-10 hidden md:flex md:space-x-[34px] self-end">
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
            href="https://warpcast.com/growthepie"
            target="_blank"
            rel="noopener"
            className="w-6 h-6 dark:text-forest-200 text-forest-900"
          >
            <Icon icon="gtp:farcaster" className="h-6 w-6" />
          </Link>

          <Link
            href="https://discord.gg/fxjJFe7QyN"
            target="_blank"
            rel="noopener"
          >
            <Icon icon="cib:discord" className="h-6 w-6" />
          </Link>
          <Link
            href="https://www.github.com/growthepie"
            target="_blank"
            rel="noopener"
          >
            <Icon icon="cib:github" className="h-6 w-6" />
          </Link>
        </div>
      </div>

      {/* Donation Banner smaller than XL screen */}
      <Link
        href="https://explorer.gitcoin.co/#/round/10/0x8de918f0163b2021839a8d84954dd7e8e151326d/0x8de918f0163b2021839a8d84954dd7e8e151326d-48"
        target="_blank"
        rel="noopener"
        className="flex xl:hidden items-center dark:bg-[#FFE28A] dark:text-[#1B0DB9] bg-[#1B0DB9] text-white px-1 py-0.5 justify-between rounded-full text-[13px] md:text-sm font-bold mr-auto w-full mt-6"
      >
        <div
        // className="bg-white text-[#1B0DB9] dark:bg-[#1B0DB9] dark:text-white rounded-full py-0.5 px-1.5"
        >
          {/* #GG18 */}
        </div>
        <div className="flex space-x-0.5">
          <div className="hidden sm:block">
            Arbitrum&apos;s Gitcoin Grant Fest.
          </div>
          <div className="animate-bounce">🎉</div>{" "}
          <div>Help us by donating to our project.</div>
        </div>
        <Icon icon="feather:arrow-right-circle" className="h-6 w-6" />
      </Link>
    </header>
  );
}
