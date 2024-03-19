"use client";
import Image from "next/image";
import Link from "next/link";
import DarkModeSwitch from "@/components/layout/DarkModeSwitch";
import { track } from "@vercel/analytics";
import Icon from "@/components/layout/Icon";
import { useMediaQuery } from "usehooks-ts";

export default function BottomBanner() {
  const isMobile = useMediaQuery("(max-width: 767px)");

  return isMobile ? (
    <div className="relative bottom-0 w-[99.7%] ml-[2px] text-center py-3 h-[190px] bg-[#1F2726]">
      <div className="w-[97%] mx-auto mt-[15px] flex flex-col items-center">
        <div className="flex w-full justify-between">
          <div className="flex items-center gap-x-2">
            <Image
              src="/logo_pie_only.png"
              alt="GTP Pie"
              className="object-contain w-[22px] h-[24px]"
              height={24}
              width={24}
            />
            <div className="pt-[2px] text-sm ">
              We are a public goods funded analytics platform.
            </div>
          </div>
        </div>
        <div className="text-[10px] self-start w-[80%] text-left leading-4 mt-[8px]">
          If you would like to donate, please visit our Giveth project page.
          Individual links contain affiliate links, like the “Bridge” button,
          which provide us with some additional income through a revenue-share
          program. For more, please check the following links:
          <a
            href="https://giveth.io/project/growthepiexyz-layer-2-metrics-blockspace-analysis"
            target="_blank"
            className="ml-1 underline cursor-pointer"
          >
            Giveth
          </a>
        </div>
        <div className="flex w-full justify-between mt-[10px]">
          {" "}
          <div className="self-start text-[0.7rem] flex justify-between w-48 leading-[1]">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/imprint">Imprint</Link>
            <Link
              rel="noopener"
              target="_blank"
              href="https://discord.com/channels/1070991734139531294/1095735245678067753"
              onClick={() => {
                track("clicked Feedback link", {
                  location: "desktop sidebar",
                  page: window.location.pathname,
                });
              }}
            >
              Feedback
            </Link>
          </div>
        </div>
        <div className="text-[0.7rem] text-inherit dark:text-forest-400 leading-[2] justify-center z-20 flex w-full items-center mt-[8px]">
          © {new Date().getFullYear()} growthepie 🥧📏
        </div>
      </div>
    </div>
  ) : (
    <div className="relative bottom-0 w-[99.7%] ml-[2px] text-center py-3 h-[160px] bg-[#1F2726]">
      <div className="w-[90%] mx-auto mt-[15px] flex flex-col items-center">
        <div className="flex w-full justify-between">
          <div className="flex items-center gap-x-2">
            <Image
              src="/logo_pie_only.png"
              alt="GTP Pie"
              className="object-contain w-[22px] h-[24px]"
              height={24}
              width={24}
            />
            <div className="pt-[2px]">
              We are a public goods funded analytics platform.
            </div>
          </div>

          <DarkModeSwitch />
        </div>
        <div className="text-[10px] self-start w-[35%] text-left leading-4 mt-[3px]">
          If you would like to donate, please visit our Giveth project page.
          Individual links contain affiliate links, like the “Bridge” button,
          which provide us with some additional income through a revenue-share
          program. For more, please check the following links:
          <a
            href="https://giveth.io/project/growthepiexyz-layer-2-metrics-blockspace-analysis"
            target="_blank"
            className="ml-1 underline cursor-pointer"
          >
            Giveth
          </a>
        </div>
        <div className="flex w-full justify-between mt-[8px]">
          {" "}
          <div className="self-start text-[0.7rem] flex justify-between w-48 leading-[1]">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/imprint">Imprint</Link>
            <Link
              rel="noopener"
              target="_blank"
              href="https://discord.com/channels/1070991734139531294/1095735245678067753"
              onClick={() => {
                track("clicked Feedback link", {
                  location: "desktop sidebar",
                  page: window.location.pathname,
                });
              }}
            >
              Feedback
            </Link>
          </div>
          <div className="text-[0.7rem] text-inherit dark:text-forest-400 leading-[2] ml-8 z-20">
            © {new Date().getFullYear()} growthepie 🥧📏
          </div>
        </div>
      </div>
    </div>
  );
}
