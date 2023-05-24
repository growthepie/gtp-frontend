"use client";
import { useEffect, useState, ReactNode } from "react";
import { Icon } from "@iconify/react";
import SidebarMenuGroup from "./SidebarMenuGroup";
import { MasterResponse } from "@/types/api/MasterResponse";
import useSWR from "swr";
import { Router } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { useMediaQuery } from "@react-hook/media-query";
import { addCollection } from "@iconify/react";
import GTPIcons from "icons/gtp.json";
import GTPHouse from "icons/svg/GTP-House.svg";
import { MasterURL } from "@/lib/urls";
import { motion } from "framer-motion";
import { navigationItems, contributorsItem } from "@/lib/navigation";

type SidebarProps = {
  // items: SidebarItems;
  trigger: ReactNode;
  className?: string;
  open?: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  children?: ReactNode;
  isOpen?: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile?: boolean;
};

export default function Sidebar({
  // items,
  trigger,
  className = "",
  open = true,
  onToggle = () => {},
  onOpen = () => {},
  onClose = () => {},
  isOpen,
  setIsOpen,
  isMobile,
}: SidebarProps) {
  const { data: master } = useSWR<MasterResponse>(MasterURL);

  // const [isOpen, setIsOpen] = useState(open);

  const isLargeScreen = useMediaQuery("(min-width: 768px)");
  const isLargerScreen = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (!isLargerScreen) {
      setIsOpen(false);
    }
  }, [isLargerScreen, isLargeScreen, setIsOpen]);

  // useEffect(() => {
  //   setIsOpen(open);
  // }, [open]);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    onOpen();
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (isMobile)
    return (
      <>
        {isOpen && (
          <>
            <div
              className="fixed bottom-0 left-0 right-0 top-0 z-10 bg-black/50 transition-all"
              onClick={() => {
                handleToggle();
              }}
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
                      sidebarOpen={isOpen}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        <div
          className={`text-forest-800 ${
            isOpen ? "bg-forest-50 rounded-lg z-50" : ""
          } p-2`}
        >
          <div onClick={handleToggle} className="w-8 h-8">
            {trigger}
          </div>
        </div>
      </>
    );

  return (
    <motion.div
      className={`flex-1 flex flex-col justify-items-start select-none overflow-hidden`}
      animate={{
        width: isOpen ? "18rem" : "5.5rem",
      }}
    >
      {/* trigger that opens the sidebar when clicked */}
      {/* <div className="text-forest-800 z-20 mb-6 pl-6">
        <div onClick={handleToggle} className="w-6 h-6">
          {trigger}
        </div>
      </div> */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-forest-800/30 scrollbar-track-forest-800/10 relative">
        {navigationItems.map((item) => (
          <SidebarMenuGroup
            key={item.name + "_item"}
            item={item}
            trigger={trigger}
            sidebarOpen={isOpen}
          />
        ))}
      </div>
      <div className="flex flex-col justify-end py-6 relative">
        <SidebarMenuGroup
          key={contributorsItem.name + "_item"}
          item={contributorsItem}
          trigger={trigger}
          sidebarOpen={isOpen}
        />
        {isOpen ? (
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
