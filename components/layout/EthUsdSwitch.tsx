"use client";
import { useEffect, useState } from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { track } from "@vercel/analytics";
import { TooltipContent } from "./Tooltip";
import { TooltipTrigger } from "./Tooltip";
import { ToggleSwitch } from "./ToggleSwitch";
import { Tooltip } from "./Tooltip";
import { Icon } from "@iconify/react";

type EthUsdSwitchProps = {
  isMobile?: boolean;
  showBorder?: boolean;
  className?: string;
};

export default function EthUsdSwitch({ isMobile, showBorder=false, className }: EthUsdSwitchProps) {
  const [mounted, setMounted] = useState(false);
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // Only apply resize opacity on desktop where this component is visible
      if (window.innerWidth >= 768) { // md breakpoint
        setIsResizing(true);
        setTimeout(() => setIsResizing(false), 200);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <ToggleSwitch
      values={{
        left: {
          value: "eth",
          label: "ETH"
        },
        right: {
          value: "usd",
          label: "USD"
        }
      }}
      value={showUsd ? "usd" : "eth"}
      onChange={handleToggle}
      size={isMobile ? "sm" : "xl"}
      className={`${showBorder ? "rounded-full border border-[#5A6462]" : ""} ${className || ""} ${isResizing ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
    />
  );
}
