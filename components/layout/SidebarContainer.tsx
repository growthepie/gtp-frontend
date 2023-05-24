"use client";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { Icon } from "@iconify/react";
import { useUIContext } from "@/contexts/UIContext";

export default function SidebarContainer() {
  const { isSidebarOpen, toggleSidebar } = useUIContext();

  return (
    <div className="pt-8 pl-0 bg-forest-50 dark:bg-[#1F2726] mix-h-screen max-h-screen sticky top-0 left-0 hidden md:flex flex-col overflow-hidden space-y-6 border-r-0 border-forest-500 dark:border-black/50">
      {isSidebarOpen ? (
        <div className="h-[45.07px] mb-[18px]">
          <div className="flex items-center mx-5 justify-between h-[45.07px]">
            <Link href="/" className="relative h-[45.07px] w-[192.87px] block">
              <div className="h-[45.07px] w-[192.87px] absolute left-3">
                <Image
                  src="/logo_full.png"
                  alt="Forest"
                  className="mb-6 -ml-[9px] z-10 crisp-edges hidden dark:block"
                  fill={true}
                  quality={100}
                />
                <Image
                  src="/logo_full_light.png"
                  alt="Forest"
                  className="mb-6 -ml-[9px] z-10 crisp-edges block dark:hidden"
                  fill={true}
                  quality={100}
                />
              </div>
            </Link>
            <div>
              <Icon
                icon="feather:log-out"
                className={`w-[13px] h-[13px] cursor-pointer mt-2 transition-transform ${
                  isSidebarOpen ? "rotate-180" : ""
                }`}
                onClick={() => {
                  toggleSidebar();
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[45.07px] mt-1 mb-[14px]">
          <div className="flex items-center ml-8 mr-2 justify-between h-[45.07px]">
            <Link href="/" className="relative h-[24px] w-[22.29px] block">
              <div className="h-[24px] w-[22.29px] absolute left-3">
                <Image
                  src="/logo_full.png"
                  alt="Forest"
                  className="mb-6 -ml-[9px] z-10 w-[102.704px] h-[24px] object-cover object-left"
                  width={102.704}
                  height={24}
                  quality={100}
                />
              </div>
            </Link>
            <div>
              <Icon
                icon="feather:log-out"
                className={`w-[13px] h-[13px] cursor-pointer mt-2`}
                onClick={() => {
                  toggleSidebar();
                }}
              />
            </div>
          </div>
        </div>
      )}

      <Sidebar
        trigger={
          <button className="flex items-center space-x-2">
            <Icon icon="feather:menu" className="h-6 w-6" />
          </button>
        }
      />
    </div>
  );
}
