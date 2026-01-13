"use client";
import { useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPIcon } from "@/components/layout/GTPIcon";

export const DarkModeToggleButton = () => {
  const { theme, setTheme } = useTheme();
  const isToggling = useRef(false);

  const handleToggle = useCallback(() => {
    // Debounce rapid clicks to prevent cross-tab sync issues
    if (isToggling.current) return;
    isToggling.current = true;

    setTimeout(() => {
      isToggling.current = false;
    }, 300);

    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <div className="flex items-center justify-end h-full cursor-pointer" onClick={handleToggle}>
      {theme === "dark" ? <GTPIcon icon={"feather:moon" as GTPIconName} className="w-[9px] h-[9px]" containerClassName="w-[9px] h-[9px]" /> : <GTPIcon icon={"feather:sun" as GTPIconName} className="w-[9px] h-[9px]" containerClassName="w-[9px] h-[9px]" />}
    </div>
  )
}

export default DarkModeToggleButton;