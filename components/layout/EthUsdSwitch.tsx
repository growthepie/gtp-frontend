"use client";
import { useEffect, useState } from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { track } from "@vercel/analytics";

type EthUsdSwitchProps = {
  isMobile?: boolean;
};

export default function EthUsdSwitch({ isMobile }: EthUsdSwitchProps) {
  const [mounted, setMounted] = useState(false);
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    if (showUsd === true) {
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
    setShowUsd(!showUsd);
  };

  if (!mounted) {
    return null;
  }

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
              setShowUsd(showUsd ? false : true);
            }}
          >
            <div
              className={`${isMobile ? "w-[80px] h-[22px] text-[13px]" : "w-[104px] h-[36px] heading-small"
                } flex justify-between  items-center px-2 md:px-3 rounded-full transition duration-200 ease-in-out text-forest-900 bg-forest-500`}
            >
              <div className="-mb-0.5">ETH</div>
              <div className="-mb-0.5">USD</div>
            </div>
            <div
              className={`absolute left-[2px] top-[2px] md:left-0.5 md:top-0.5
              ${isMobile
                  ? "w-[38px] h-[18px] leading-[14px] text-[12px]"
                  : "w-[50px] h-[32px] heading-small leading-[20px]"
                } 
              rounded-full transition-transform duration-200 ease-in-out text-forest-500 bg-[#1F2726] pt-[7px] px-1.5 text-center ${showUsd ? "transform translate-x-full" : "translate-x-0"
                }`}
            >
              {showUsd === true ? <>USD</> : <>ETH</>}
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
