"use client";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { Icon } from "@iconify/react";
import EthUsdSwitch from "./EthUsdSwitch";
import DarkModeSwitch from "./DarkModeSwitch";
import { useUIContext } from "@/contexts/UIContext";
import { useSpring, animated, config } from "react-spring";
import { useState, useEffect, useMemo } from "react";
import Banner from "@/components/Banner";

export default function Header() {
  const [isFirstText, setIsFirstText] = useState(true);

  useEffect(() => {
    // Toggle between texts every 8 seconds
    const textSlideInterval = setInterval(() => {
      setIsFirstText((prevIsFirstText) => !prevIsFirstText);
    }, 8000);

    return () => {
      clearInterval(textSlideInterval);
    };
  }, [isFirstText]);

  return (
    <header className="flex flex-col xl:flex-row justify-between space-x-0 xl:space-x-6 items-center max-w-[1600px] w-full mx-auto px-[20px] pt-[20px] md:px-[50px] md:pt-[50px]">
      <div className="flex justify-between items-center w-full">
        <div className="flex space-x-0 xl:space-x-6 w-full">
          <Banner />

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
      <div className="items-center z-10 hidden md:flex md:space-x-[34px] self-end ">
        <EthUsdSwitch />
        <DarkModeSwitch />
        <div className="flex space-x-[22px] items-center">
          <Link
            href="https://twitter.com/growthepie_eth"
            target="_blank"
            rel="noopener"
          >
            <Icon icon="gtp:twitter" className="h-6 w-6" />
          </Link>

          <Link
            href="https://share.lens.xyz/u/growthepie.lens"
            target="_blank"
            rel="noopener"
            className="w-7 h-6 dark:text-forest-200 text-forest-900"
          >
            <Icon icon="gtp:lens" className="h-6 w-7" />
          </Link>

          <Link
            href="https://warpcast.com/growthepie"
            target="_blank"
            rel="noopener"
            className="w-[28px] h-[24px] dark:text-forest-200 text-forest-900"
          >
            <Icon icon="gtp:farcaster" className="h-[24px] w-[26px]" />
          </Link>

          <Link
            href="https://discord.gg/fxjJFe7QyN"
            target="_blank"
            rel="noopener"
          >
            <Icon icon="cib:discord" className="h-6 w-6 pt-[2px]" />
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
      <Link
        href={
          isFirstText
            ? "https://vote.optimism.io/retropgf/3/application/0x849e164d1b8cc2b51bd3313d007ac58acb816660492336d2498615551ec75f02"
            : "https://explorer.gitcoin.co/#/round/424/0xd4cc0dd193c7dc1d665ae244ce12d7fab337a008/0xd4cc0dd193c7dc1d665ae244ce12d7fab337a008-70"
        }
        target="_blank"
        rel="noopener"
        className={`relative flex overflow-hidden xl:hidden items-center justify-between bg-forest-100 text-black px-1 py-1 rounded-full text-[10px] sm:text-sm font-bold mr-auto w-[375px] sm:w-[560px] mt-6 z-0 ${
          isFirstText ? "dark:bg-[#FFE28A]" : "dark:bg-[#1DF7EF]"
        }`}
      >
        <div
          className={`ml-3 mr-4 flex space-x-0.5 absolute overflow-x-visible items-center ${
            isFirstText
              ? "translate-x-0"
              : "translate-x-[-535px] sm:translate-x-[-665px]"
          } `}
          style={{
            transition: "transform 1s ease-in-out", // Adjust the duration and easing as needed
          }}
        >
          <div
            className="w-[800px] flex space-x-0.5 z-0 items-center"
            style={{ minWidth: 0, whiteSpace: "nowrap" }}
          >
            <div className="slide-text mr-[200px]">
              We are listed for Retroactive Public Goods Funding. Spread the
              word!{" "}
            </div>
            <div className="slide-text flex items-center">
              <div className="mr-0.5">We are part of Gitcoin Round 19!</div>
              <div className="animate-bounce text-sm"> 🎉</div>{" "}
              <div>Help us by donating to our project.</div>
            </div>
          </div>
        </div>
        <div className="flex-grow"></div>
        <Icon
          icon="feather:arrow-right-circle"
          className={` w-4 h-4 sm:h-6 sm:w-6  bg-forest-100 z-10 ${
            isFirstText ? "dark:bg-[#FFE28A]" : "dark:bg-[#1DF7EF]"
          }`}
        />
      </Link>
      {/* Donation Banner smaller than XL screen */}
      {/* <Link
        href="https://explorer.gitcoin.co/#/round/42161/0x59d79b22595b17af659ce9b03907615f53742c57/0x59d79b22595b17af659ce9b03907615f53742c57-16"
        target="_blank"
        rel="noopener"
        className="flex xl:hidden items-center dark:bg-[#FFE28A] dark:text-[#1B0DB9] bg-[#1B0DB9] text-white px-1 py-0.5 justify-between rounded-full text-[13px] md:text-sm font-bold mr-auto w-full mt-6"
      >
        <div
        // className="bg-white text-[#1B0DB9] dark:bg-[#1B0DB9] dark:text-white rounded-full py-0.5 px-1.5"
        >
          {/* #GG18 
        </div>
        <div className="flex space-x-0.5">
          <div className="hidden sm:block">
            Arbitrum&apos;s Gitcoin Grant Fest.
          </div>
          <div className="animate-bounce">🎉</div>{" "}
          <div>Help us by donating to our project.</div>
        </div>
        <Icon icon="feather:arrow-right-circle" className="h-6 w-6" />
      </Link> */}
    </header>
  );
}
