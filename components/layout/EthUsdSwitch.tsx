"use client";

import { Switch } from "@/components/Switch";
import { useEffect, useState } from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { SunIcon } from "@heroicons/react/24/outline";
import { MoonIcon } from "@heroicons/react/24/solid";
import { useTheme } from "next-themes";

export default function EthUsdSwitch() {
  const [mounted, setMounted] = useState(false);
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    setShowUsd(!showUsd);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex justify-between">
      <div className="flex items-center">
        <input id="toggle" type="checkbox" className="hidden" />
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
            className="relative"
            onClick={() => {
              setShowUsd(showUsd ? false : true);
            }}
          >
            <div
              className={` 
                        w-[6.25rem] h-7 flex justify-between items-center px-3 text-sm font-medium
                        rounded-full transition duration-200 ease-in-out text-black/50 ${
                          showUsd ? "bg-forest-500" : "bg-forest-500/50"
                        }`}
            >
              <div>ETH</div>
              <div>USD</div>
            </div>
            <div
              className={`dot absolute left-0.5 top-0.5 w-12 h-6 rounded-full transition duration-200 
                          ease-in-out bg-white dark:bg-forest-50 dark:text-forest-900 text-sm font-medium
                          py-0.5 px-1.5 text-center
                          ${
                            showUsd ? "transform translate-x-full" : ""
                          } rounded-full`}
            >
              {showUsd === true ? <>USD</> : <>ETH</>}
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
