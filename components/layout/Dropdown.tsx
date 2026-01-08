"use client";
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { animated, useSpring, easings } from "@react-spring/web";
import { useLocalStorage } from "usehooks-ts";
import { useUIContext } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";

export default function Dropdown({ label, children }: { label: string | React.ReactNode, children: React.ReactNode }) {

  const isSidebarOpen = useUIContext((state) => state.isSidebarOpen);

  const [optOpen, setOptOpen] = useState(false);

  // const chainHeight = (Object.keys(Items).length - 1) * 100;

  // const heightAnimate = useSpring({
  //   height: optOpen ? chainHeight : 43,
  //   config: { easing: easings.easeInOutBack },
  // });

  return (
    <>
      <div className="relative w-60">
        <ul
          className={`relative transition-[width] duration-300 ease-in-out z-30`}
        >
          <li
            className={`z-30 flex justify-start items-center overflow-hidden font-medium cursor-pointer transition-color duration-300 border-forest-900 dark:border-forest-500 border-[1px] rounded-full py-[6px] px-[10px] space-x-[5px] lg:py-[10px] lg:px-[15px] lg:space-x-[10px] ${optOpen
              ? "bg-forest-50 dark:bg-forest-700"
              : "bg-transparent delay-300"
              }`}
            onClick={() => {
              setOptOpen(!optOpen);
            }}
          >
            <Icon icon="feather:chevron-right" className={`w-6 h-6 transition-transform duration-300 ${optOpen ? "transform rotate-90" : ""}`} />
            <div>{label}</div>
          </li>

        </ul>
        <div
          className={`flex flex-col justify-start items-start z-20 absolute top-[20px] transition-all duration-300 ease-in-out overflow-hidden bg-forest-50 dark:bg-forest-700 break-inside-avoid ${optOpen ? "opacity-100 border-forest-900 dark:border-forest-500 border-l border-r border-b rounded-b-3xl pt-[20px] lg:pt-[30px]" : "opacity-0 h-0"}`}
        >
          {children}
        </div>
      </div>
      {optOpen && (
        <div
          className={`fixed inset-0 z-10 bg-black/50`}
          onClick={() => {
            setOptOpen(false);
          }}
        />
      )}
    </>
  );
}
