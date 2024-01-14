"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import { track } from "@vercel/analytics";

type DarkModeSwitchProps = {
  isMobile?: boolean;
};

export default function DarkModeSwitch({ isMobile }: DarkModeSwitchProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    if (theme === "dark") {
      track("changed to Light Mode", {
        location: isMobile ? "mobile Menu" : "desktop Sidebar",
        page: window.location.pathname,
      });
    } else {
      track("changed to Dark Mode", {
        location: isMobile ? "mobile Menu" : "desktop Sidebar",
        page: window.location.pathname,
      });
    }

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
          <div className="mr-1.5 md:mr-3 font-medium" onClick={handleToggle}>
            {theme === "dark" ? (
              <Icon
                icon="feather:moon"
                className="h-[19px] w-[19px] md:h-6 md:w-6"
              />
            ) : (
              <Icon
                icon="feather:sun"
                className="h-[19px] w-[19px] md:h-6 md:w-6"
              />
            )}
          </div>
          <div className="relative" onClick={handleToggle}>
            <div
              className={`${
                isMobile ? "w-[40px] h-[22px]" : "w-[3.25rem] h-7"
              } rounded-full transition duration-200 ease-in-out bg-forest-500`}
            ></div>
            <div
              className={`absolute left-0.5 top-0.5 ${
                isMobile ? "w-[18px] h-[18px]" : "w-6 h-6"
              } rounded-full transition-transform duration-200 ease-in-out bg-[#1F2726] text-forest-500 ${
                theme === "dark"
                  ? "transform translate-x-full"
                  : "translate-x-0"
              }`}
            ></div>
          </div>
        </label>
      </div>
    </div>
  );
}
