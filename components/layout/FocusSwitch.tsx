"use client";
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { Icon } from "@iconify/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import useAsyncStorage from "@/hooks/useAsyncStorage";
import { ToggleSwitch } from "./ToggleSwitch";

type FocusSwitchProps = {
  isMobile?: boolean;
};

export default function FocusSwitch({ isMobile }: FocusSwitchProps) {
  const [mounted, setMounted] = useState(false);
  const [focusEnabled, setFocusEnabled] = useAsyncStorage("focusEnabled", true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (newValue: string) => {
    if (newValue === "totalEcosystem") {
      setFocusEnabled(true);
    } else {
      setFocusEnabled(false);
    }
    track(
      newValue === "totalEcosystem" ? "changed to Total Ecosystem" : "changed to L2 Focus",
      {
        location: isMobile ? "mobile Menu" : "desktop Header",
        page: window.location.pathname,
      }
    );
  };

  if (!mounted) {
    return null;
  }

  return (
    <ToggleSwitch
      values={{
        left: {
          value: "totalEcosystem",
          label: "Total Ecosystem"
        },
        right: {
          value: "l2Focus",
          label: "L2 Focus"
        }
      }}
      value={focusEnabled ? "totalEcosystem" : "l2Focus"}
      onChange={handleChange}
      size={isMobile ? "sm" : "md"}
      rightComponent={
        <Tooltip>
          <TooltipTrigger>
            <Icon icon="feather:info" className="w-4 h-4" />
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col items-center">
              <div className="p-[15px] text-sm bg-forest-100 dark:bg-[#1F2726] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex gap-y-[5px] max-w-[300px] flex-col z-50">
                <div className="heading-small-xs">Total Ecosystem vs L2 Focus</div>
                <div className="text-xxs text-wrap">
                  Toggling between "Total Ecosystem" and "L2 focus" allows you to include Ethereum Mainnet on our pages or to focus solely on Layer 2s.
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      }
    />
  );
}