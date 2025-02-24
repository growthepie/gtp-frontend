"use client";
import { useEffect, useState } from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { track } from "@vercel/analytics";
import { Icon } from "@iconify/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import useAsyncStorage from "@/hooks/useAsyncStorage";

type EthUsdSwitchProps = {
  isMobile?: boolean;
};

export default function FocusSwitch({ isMobile }: EthUsdSwitchProps) {
  const [mounted, setMounted] = useState(false);
  const [focusEnabled, setFocusEnabled] = useAsyncStorage("focusEnabled", true);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    if (focusEnabled === true) {
      track("changed to ETH", {
        location: isMobile ? "mobile Menu" : "desktop Header",
        page: window.location.pathname,
      });
    } else {
      track("changed to USD", {
        location: isMobile ? "mobile Menu" : "desktop Header",
        page: window.location.pathname,
      });
    }
    setFocusEnabled(!focusEnabled);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="select-none flex justify-between">
      <div className="flex items-center">
        {/* <input id="focus-toggle" type="checkbox" className="hidden" checked={focusEnabled} onChange={handleToggle} /> */}
        <label htmlFor="focus-toggle" className="flex items-center cursor-pointer gap-x-[10px]">
          {/* <div
            className="mr-2 font-medium"
            onClick={() => {
              setShowUsd(focusEnabled ? false : true);
            }}
          >
            {focusEnabled === true ? <>USD</> : <>ETH</>}
          </div> */}
          <div
            className="relative text-sm md:text-base font-medium"
            onClick={() => {
              setFocusEnabled(focusEnabled ? false : true);
            }}
          >
            <div
              className={`${isMobile ? "w-[80px] h-[20px] text-[13px]" : "w-[50px] h-[28px] heading-small"
                } flex justify-between  items-center px-2 md:px-3 rounded-full transition-all duration-300 ease-in-out text-forest-900 ${focusEnabled ? " bg-[#5A6462]" : "bg-forest-500"}`}
            >
              <div className="-mb-0.5"></div>
              <div className="-mb-0.5"></div>
            </div>
            <div
              className={`absolute left-[2px] top-[2px] md:left-0.5 md:top-0.5 
              ${isMobile
                  ? "w-[24px] h-[24px] leading-[14px] text-[12px]"
                  : "w-[24px] h-[24px] heading-small leading-[20px]"
                } 
              rounded-full transition-transform duration-200 ease-in-out text-forest-500 bg-[#1F2726] pt-[7px] px-1.5 text-center ${focusEnabled ? "transform translate-x-[96%]" : "translate-x-0"
                }`}
            >
            </div>
          </div>
          <div className="heading-small-sm whitespace-nowrap">
            L2 Focus
          </div>
          <div className="relative top-[3px]">
            <Tooltip placement="left">
                <TooltipTrigger>
                <Icon icon="feather:info" className="text-forest-500" />
                </TooltipTrigger>
                <TooltipContent>
                <div className="flex flex-col items-center">
                    <div className="p-3 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex flex-col z-50">
                    <div>
                        <strong>L2 Focus</strong> is a feature that allows you to focus on the scaling solutions for Ethereum.
                    </div>
                    </div>
                </div>
                </TooltipContent>
            </Tooltip>
          </div>
        </label>
      </div>
    </div>
  );
}