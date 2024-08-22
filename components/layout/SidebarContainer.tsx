"use client";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { Icon } from "@iconify/react";
import { useUIContext } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";
import { useEffect } from "react";
import { track } from "@vercel/analytics";

export default function SidebarContainer() {
  const { isSidebarOpen, toggleSidebar } = useUIContext();

  return (
    <div className="pr-[2px] bg-white dark:bg-forest-1000">
      <div className="pt-[34px] pl-0 bg-forest-50 dark:bg-[#1F2726] min-h-screen max-h-screen sticky top-0 left-0 hidden md:flex flex-col overflow-y-hidden overflow-x-visible space-y-6 border-r-0 border-forest-500 dark:border-black/50">
        {isSidebarOpen ? (
          <div className="select-none h-[45.07px] mb-[18px]">
            <div className="flex items-center mx-5 justify-between h-[45.07px]">
              <Link
                href="/"
                className="relative h-[45.07px] w-[192.87px] block"
              >
                <div className="h-[45.07px] w-[192.87px] absolute left-3">
                  <Image
                    src="/logo-restake.svg"
                    alt="Forest"
                    className="mb-6 -ml-[9px] z-10 crisp-edges hidden dark:block"
                    fill={true}
                    quality={100}
                    sizes="33vw"
                  />
                  <Image
                    src="/logo_full_light.png"
                    alt="Forest"
                    className="mb-6 -ml-[9px] z-10 crisp-edges block dark:hidden"
                    fill={true}
                    quality={100}
                    sizes="33vw"
                  />
                </div>
              </Link>
              <div>
                <Icon
                  icon="feather:log-out"
                  className={`w-[13px] h-[13px]  cursor-pointer mt-4 transition-transform ${
                    isSidebarOpen ? "rotate-180" : ""
                  }`}
                  onClick={() => {
                    track("clicked Sidebar Close", {
                      location: "desktop sidebar",
                      page: window.location.pathname,
                    });
                    toggleSidebar();
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="select-none h-[45.07px] mt-1 mb-[14px]">
            <div className="flex items-center ml-8 mr-2 justify-between h-[45.07px]">
              <Link href="/" className="relative h-[24px] w-[22.29px] block">
                <div className="h-[24px] w-[22.29px] absolute left-3">
                  <Image
                    src="/logo-restake.svg"
                    alt="Forest"
                    className="mb-6 -ml-[9px] z-10 w-[102.704px] h-[24px] object-cover object-left"
                    width={102.704}
                    height={24}
                    quality={100}
                    sizes="33vw"
                  />
                </div>
              </Link>
              <div>
                <Icon
                  icon="feather:log-out"
                  className={`w-[13px] h-[13px] cursor-pointer mt-2`}
                  onClick={() => {
                    track("clicked Sidebar Open", {
                      location: "desktop sidebar",
                      page: window.location.pathname,
                    });
                    toggleSidebar();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <Sidebar />
      </div>
    </div>
  );
}
