"use client";
import { useTheme } from "next-themes";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPIcon } from "@/components/layout/GTPIcon";

export const DarkModeToggleButton = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-end h-full cursor-pointer " onClick={() => {
      setTheme(theme === "dark" ? "light" : "dark");
    }}>
      {theme === "dark" ? <GTPIcon icon={"feather:moon" as GTPIconName} className="w-[9px] h-[9px]" containerClassName="w-[9px] h-[9px]" /> : <GTPIcon icon={"feather:sun" as GTPIconName} className="w-[9px] h-[9px]" containerClassName="w-[9px] h-[9px]" />}
    </div>
  )
}

export default DarkModeToggleButton;