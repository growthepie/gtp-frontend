"use client";
import { ReactNode } from "react";
import SidebarMenuGroup from "./SidebarMenuGroup";
import Link from "next/link";
import { motion } from "framer-motion";
import { navigationItems, contributorsItem } from "@/lib/navigation";
import { useUIContext } from "@/contexts/UIContext";

type SidebarProps = {
  trigger: ReactNode;
  className?: string;
  children?: ReactNode;
  isMobile?: boolean;
};

export default function Sidebar({ trigger, isMobile }: SidebarProps) {
  const { isSidebarOpen, toggleSidebar } = useUIContext();

  if (isMobile)
    return (
      <>
        {isSidebarOpen && (
          <>
            <div
              className="fixed bottom-0 left-0 right-0 top-0 z-10 bg-black/50 transition-all"
              onClick={toggleSidebar}
            ></div>
            <div
              className={`absolute top-20 left-0 bg-forest-50 dark:bg-forest-900 rounded-r-lg z-50 flex flex-col justify-items-start select-none overflow-hidden`}
            >
              <div className="text-forest-800 z-20 m-2 mt-10">
                <div className="">
                  {navigationItems.map((item) => (
                    <SidebarMenuGroup
                      key={item.name + "_item"}
                      item={item}
                      trigger={trigger}
                      sidebarOpen={isSidebarOpen}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        <div
          className={`text-forest-800 ${
            isSidebarOpen ? "bg-forest-50 rounded-lg z-50" : ""
          } p-2`}
        >
          <div onClick={toggleSidebar} className="w-8 h-8">
            {trigger}
          </div>
        </div>
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
            trigger={trigger}
            sidebarOpen={isSidebarOpen}
          />
        ))}
      </div>
      <div className="flex flex-col justify-end py-6 relative">
        <SidebarMenuGroup
          key={contributorsItem.name + "_item"}
          item={contributorsItem}
          trigger={trigger}
          sidebarOpen={isSidebarOpen}
        />
        {isSidebarOpen ? (
          <div className="text-[0.7rem] flex justify-between w-48 text-inherit dark:text-forest-400 leading-[1] ml-8">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/imprint">Imprint</Link>
            <Link href="https://discord.gg/fxjJFe7QyN">Feedback</Link>
          </div>
        ) : (
          <div className="text-[0.7rem] flex flex-col justify-between w-6 text-inherit dark:text-forest-400 leading-[2] ml-8 items-center">
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/imprint">Imprint</Link>
            <Link href="https://discord.gg/fxjJFe7QyN">Feedback</Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
