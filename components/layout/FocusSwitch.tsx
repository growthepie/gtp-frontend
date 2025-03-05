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

  // onClick={() => {
  //   setFocusEnabled(focusEnabled ? false : true);
  // }}
  return (
    <div className="select-none flex justify-between">
      <div className="flex items-center">
        <input type="checkbox" className="hidden" />
        <label htmlFor="toggle" className="flex items-center cursor-pointer">
          {/* <div
            className="mr-2 font-medium"
            onClick={() => {
              setShowUsd(showUsd ? false : true);
            }}
          >
            {showUsd === true ? <>USD</> : <>ETH</>}
          </div> */}
          <div
            className="relative text-sm md:text-base font-medium"
            onClick={() => {
              setFocusEnabled(focusEnabled ? false : true);
            }}
          >
            <div
              className={`${isMobile ? "w-[80px] h-[22px] text-[13px]" : "w-[203px] h-[28px] heading-small"
                } flex justify-between  items-center px-2 md:pl-3 md:pr-8 rounded-full transition duration-200 ease-in-out text-forest-900 bg-[#344240]`}
            >
              <div className="heading-small-xxs text-forest-500">Total Ecosystem</div>
              <div className="heading-small-xxs text-forest-500">L2 Focus</div>
              <div className="absolute top-[6px] z-20 right-[5px]">
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
            </div>
            <div
              className={`absolute flex justify-center items-center  left-[2px] top-[2px] md:-left-[46px] md:top-0.5
              ${isMobile
                  ? "h-[18px] leading-[14px] text-[12px]"
                  : "w-full h-[24px] heading-small-xxs leading-[20px]"
                } 
              rounded-full transition-transform duration-200 ease-in-out text-forest-500  px-1.5 text-center ${focusEnabled ? "transform translate-x-[46%]" : "translate-x-0"
                }`}
            >
              
              <div className="bg-[#1F2726] px-[5px] rounded-full h-[24px] flex items-center">
                {focusEnabled === true ? <>L2 Focus</> : <>Total Ecosystem</>}
              </div>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}