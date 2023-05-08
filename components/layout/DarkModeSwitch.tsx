"use client";

import { Switch } from "@/components/Switch";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { SunIcon } from "@heroicons/react/24/outline";
import { MoonIcon } from "@heroicons/react/24/solid";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";

export default function DarkModeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex justify-between mr-[34px]">
      <div className="flex items-center">
        <input id="toggle" type="checkbox" className="hidden" />
        <label htmlFor="toggle" className="flex items-center cursor-pointer">
          <div className="mr-3 font-medium" onClick={handleToggle}>
            {theme === "dark" ? (
              <Icon icon="feather:moon" className="h-6 w-6" />
            ) : (
              <Icon icon="feather:sun" className="h-6 w-6" />
            )}
          </div>
          <div
            className="relative nightwind-prevent-block"
            onClick={handleToggle}
          >
            <div
              className={`block 
                        w-[3.25rem] h-7
                        rounded-full transition duration-200 ease-in-out bg-forest-500`}
            ></div>
            <div
              className={`dot absolute left-0.5 top-0.5
                        w-6
                        h-6
                        rounded-full transition duration-200 ease-in-out
                        bg-forest-900 text-forest-500 
                        ${theme === "dark" ? "transform translate-x-full" : ""}
                        rounded-full`}
            ></div>
          </div>
        </label>
      </div>
    </div>
  );
}
