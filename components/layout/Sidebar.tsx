"use client";
import { ReactNode, useEffect } from "react";
import SidebarMenuGroup from "./SidebarMenuGroup";
import Link from "next/link";
import { motion } from "framer-motion";
import { navigationItems, contributorsItem } from "@/lib/navigation";
import { useUIContext } from "@/contexts/UIContext";
import { Icon } from "@iconify/react";
import EthUsdSwitch from "./EthUsdSwitch";
import DarkModeSwitch from "./DarkModeSwitch";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";

type SidebarProps = {
  className?: string;
  children?: ReactNode;
  isMobile?: boolean;
};

export default function Sidebar({ isMobile }: SidebarProps) {
  const { isSidebarOpen, toggleSidebar, clientOS } = useUIContext();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // detect if we are changing routes on mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      toggleSidebar();
    }
  }, [pathname, searchParams]);

  if (isMobile)
    return (
      <>
        {isSidebarOpen && (
          <>
            <div
              style={{
                pointerEvents: "none",
                // background: `radial-gradient(90.11% 90.11% at 77.71% 27.89%, #1B2524 0%, #364240 100%) fixed`,
              }}
              className="fixed inset-0 z-20 mouse-events-none overflow-hidden w-full h-full bg-white dark:bg-[#1F2726]"
            ></div>
            {clientOS !== "iOS" && (
              <div
                style={{
                  mixBlendMode: "screen",
                  opacity: 0.065,
                  pointerEvents: "none",
                }}
                className="fixed inset-0 z-20 mouse-events-none overflow-hidden w-full h-full hidden dark:block antialiased"
              >
                <div
                  style={{
                    height: "600px",
                    width: "500px",
                    left: "100px",
                    right: "-6px",
                    top: "0px",
                    bottom: "602px",
                    background: `radial-gradient(45% 45% at 50% 50%, #FBB90D 0%, rgba(217, 217, 217, 0) 100%, rgba(251, 185, 13, 0) 100%)`,
                  }}
                  className="absolute z-0 mouse-events-none"
                ></div>
                <div
                  style={{
                    height: "600px",
                    width: "700px",
                    left: "275px",
                    right: "-475px",
                    top: "0px",
                    bottom: "466px",
                    background: `radial-gradient(45% 45% at 50% 50%, #0DF6B9 0%, rgba(217, 217, 217, 0) 100%, rgba(13, 246, 185, 0) 100%)`,
                  }}
                  className="absolute z-0 mouse-events-none"
                ></div>
              </div>
            )}
            <div className="fixed inset-0 p-[20px] z-50 flex flex-col justify-items-start select-none overflow-hidden">
              <div className="flex justify-between space-x-[20px] items-end w-full">
                <Link href="/" className="h-[36px] w-[34px] relative">
                  <Image
                    src="/logo_pie_only.png"
                    alt="Forest"
                    className="antialiased"
                    fill={true}
                    quality={100}
                  />
                </Link>
                <div className="flex flex-1 justify-between items-end space-x-[20px]">
                  <div className="z-10 flex space-x-[20px] mb-0.5">
                    <Link
                      href="https://twitter.com/growthepie_eth"
                      target="_blank"
                      rel="noopener"
                    >
                      <Icon icon="cib:twitter" className="h-[19px] w-[19px]" />
                    </Link>
                    <Link
                      href="https://discord.gg/fxjJFe7QyN"
                      target="_blank"
                      rel="noopener"
                    >
                      <Icon icon="cib:discord" className="h-[19px] w-[19px]" />
                    </Link>
                  </div>
                  <div className="items-end z-10 flex space-x-[15px] mb-[1px]">
                    <DarkModeSwitch isMobile />
                    <EthUsdSwitch isMobile />
                  </div>
                </div>
                <button className="!-mb-1  !-mr-1" onClick={toggleSidebar}>
                  <Icon icon="feather:x" className="h-8 w-8" />
                </button>
              </div>
              <div className="z-20 mt-[30px] h-[calc(100vh-100px)] w-full flex flex-col justify-between overflow-hidden">
                <div className="flex-1 w-full overflow-x-hidden relative overflow-y-scroll scrollbar-none">
                  {navigationItems.map((item) => (
                    <SidebarMenuGroup
                      key={item.name + "_item"}
                      item={item}
                      sidebarOpen={isSidebarOpen}
                    />
                  ))}
                </div>
                <div className="flex flex-col justify-end py-6 relative mb-[30px]">
                  <SidebarMenuGroup
                    key={contributorsItem.name + "_item"}
                    item={contributorsItem}
                    sidebarOpen={isSidebarOpen}
                  />
                  <div className="text-[0.7rem] flex justify-between w-full text-inherit leading-[1] px-2 mt-[30px]">
                    <Link href="/privacy-policy">Privacy Policy</Link>
                    <Link href="/imprint">Imprint</Link>
                    <Link
                      rel="noopener"
                      target="_blank"
                      href="https://discord.com/channels/1070991734139531294/1095735245678067753"
                    >
                      Feedback
                    </Link>
                  </div>
                </div>
                <div className="mt-24 w-full text-center py-6 absolute bottom-0">
                  <div className="text-[0.7rem] text-inherit leading-[2] z-20">
                    © 2023 Grow The Pie 🥧
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        <button className="-mb-1 -mr-1" onClick={toggleSidebar}>
          <Icon icon="feather:menu" className="h-8 w-8" />
        </button>
      </>
    );

  return (
    <motion.div
      className={`flex-1 flex flex-col justify-items-start select-none overflow-hidden`}
      animate={{
        width: isSidebarOpen ? "18rem" : "5.5rem",
      }}
      transition={{
        duration: 0.2,
      }}
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-forest-800/30 scrollbar-track-forest-800/10 relative">
        {navigationItems.map((item) => (
          <SidebarMenuGroup
            key={item.name + "_item"}
            item={item}
            sidebarOpen={isSidebarOpen}
          />
        ))}
      </div>
      <div className="flex flex-col justify-end py-6 relative">
        <SidebarMenuGroup
          key={contributorsItem.name + "_item"}
          item={contributorsItem}
          sidebarOpen={isSidebarOpen}
        />
        {isSidebarOpen ? (
          <div className="text-[0.7rem] flex justify-between w-48 text-inherit dark:text-forest-400 leading-[1] ml-8">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/imprint">Imprint</Link>
            <Link
              rel="noopener"
              target="_blank"
              href="https://discord.com/channels/1070991734139531294/1095735245678067753"
            >
              Feedback
            </Link>
          </div>
        ) : (
          <div className="text-[0.7rem] flex flex-col justify-between w-6 text-inherit dark:text-forest-400 leading-[2] ml-8 items-center">
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/imprint">Imprint</Link>
            <Link
              rel="noopener"
              target="_blank"
              href="https://discord.com/channels/1070991734139531294/1095735245678067753"
            >
              Feedback
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
