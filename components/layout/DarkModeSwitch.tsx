"use client";

import { Switch } from "@/components/Switch";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { SunIcon } from "@heroicons/react/24/outline";
import { MoonIcon } from "@heroicons/react/24/solid";
import { useTheme } from "next-themes";

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
    <div className="flex justify-between">
      <div className="flex items-center">
        <input id="toggle" type="checkbox" className="hidden" />
        <label htmlFor="toggle" className="flex items-center cursor-pointer">
          <div className="mr-2 font-medium" onClick={handleToggle}>
            {theme === "dark" ? (
              <MoonIcon className="h-5 w-5" />
            ) : (
              <SunIcon className="h-5 w-5" />
            )}
          </div>
          <div className="relative" onClick={handleToggle}>
            <div
              className={`block 
                        w-10 h-6
                        rounded-full transition duration-200 ease-in-out ${
                          theme === "dark"
                            ? "bg-forest-500"
                            : "bg-forest-500/50"
                        }`}
            ></div>
            <div
              className={`dot absolute left-1 top-1
                        w-4
                        h-4
                        rounded-full transition duration-200 ease-in-out
                        bg-white dark:bg-forest-950
                        ${theme === "dark" ? "transform translate-x-full" : ""}
                        rounded-full`}
            ></div>
          </div>
        </label>
      </div>
    </div>
  );
}
