import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import Icon from "@/components/layout/Icon";
import EthUsdSwitch from "@/components/layout/EthUsdSwitch";

import Banner from "@/components/Banner";
import Notification from "@/components/Notification";
import HeaderLinks from "@/components/layout/HeaderLinks";
import { track } from "@vercel/analytics";

export default function Header() {
  return (
    <header className="flex justify-between space-x-0 xl:space-x-6 items-end max-w-[1600px] w-full mx-auto px-[20px] pt-[20px] md:px-[40px] md:pt-[50px] ">
      <div className="flex justify-start items-center w-full  ">
        <div className="flex space-x-0 xl:space-x-6 w-full h-full ">
          {/*Banner/Notification Area */}

          {/* <div className={`hidden md:flex  `}>
            <Notification />
          </div> */}

          <div className="flex justify-between items-start h-full relative w-full left-1 ">
            <Link href="/" className="flex gap-x-1">
              {/* <div className="h-[45px] w-[206px]"> */}
              <Image
                src="/logo_fees_full.png"
                alt="Forest"
                className="hidden dark:block"
                width={206}
                height={45}
                sizes="100vw"
              />
              {/* </div> */}
              {/*
                <div className="h-[36px] w-[35px] relative bottom-[1px]">
                  <Image
                  src="/logo-pie-only2.svg"
                  alt="Forest"
                  className="block dark:hidden"
                  width={33}
                  height={35}
                /> */}
              {/* <div className="h-[36px] w-[35px] relative bottom-[1px] ">
                <Image
                  src="/logo-pie-only.svg"
                  alt="Forest"
                  className="hidden dark:block"
                  width={33}
                  height={35}
                />
                <Image
                  src="/logo-pie-only2.svg"
                  alt="Forest"
                  className="block dark:hidden"
                  width={33}
                  height={35}
                />
              </div>
              <div className="h-[36px] w-[52px] relative flex items-end bottom-[9px] right-2">
                <Image
                  src="/feesketch.svg"
                  alt="Forest"
                  className="block "
                  width={52}
                  height={24}
                />
              </div>
              <div className="h-full w-[128px] relative flex items-end justify-end right-[38px] top-[11px]">
                <Image
                  src="/logo-text-only2.svg"
                  alt="Forest"
                  className="block "
                  width={138}
                  height={21}
                />
              </div>
              <div className="h-full w-[128px] relative flex items-end right-[40px] top-[16px]">
                <Image
                  src="/xyz.svg"
                  alt="Forest"
                  className="block text-white "
                  width={42}
                  height={21}
                />
              </div> */}
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
      {process.env.NEXT_PUBLIC_VERCEL_ENV !== undefined &&
      ["development", "preview"].includes(
        process.env.NEXT_PUBLIC_VERCEL_ENV,
      ) ? (
        <> </>
      ) : (
        <>{/* <SupportUsBanner /> */}</>
      )}
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
