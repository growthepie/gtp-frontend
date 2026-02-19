"use client";
import { useEffect, useState, startTransition } from "react";
import { useLocalStorage } from "usehooks-ts";
import { track } from "@/lib/tracking";
import { ToggleSwitch } from "./ToggleSwitch";
import { useUIContext } from "@/contexts/UIContext";
import { GTPTooltipNew } from "../tooltip/GTPTooltip";

type EthUsdSwitchProps = {
  isMobile?: boolean;
  showBorder?: boolean;
  className?: string;
};

export default function EthUsdSwitch({ isMobile, showBorder=false, className }: EthUsdSwitchProps) {
  const ethUsdSwitchEnabled = useUIContext((state) => state.ethUsdSwitchEnabled);
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
    startTransition(() => {
      setMounted(true);
    });
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

  const switchControl = (
    <ToggleSwitch
      values={[
        { value: "eth", label: "ETH" },
        { value: "usd", label: "USD" },
      ]}
      value={showUsd ? "usd" : "eth"}
      onChange={handleToggle}
      disabled={!ethUsdSwitchEnabled}
      size={isMobile ? "sm" : "xl"}
      className={`${showBorder ? "rounded-full border border-[#5A6462]" : ""} ${className || ""} ${isResizing ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
    />
  );

  if (!ethUsdSwitchEnabled) {
    return (
      <GTPTooltipNew
        placement={isMobile ? "top-start" : "bottom-start"}
        allowInteract={true}
        enableHover={!isMobile}
        trigger={<div className="w-fit">{switchControl}</div>}
        containerClass="flex flex-col gap-y-[10px] z-global-search"
        positionOffset={{ mainAxis: 0, crossAxis: 20 }}
      >
        <div className="px-[15px] py-[5px]">
          This toggle is not currently available on this page
        </div>
      </GTPTooltipNew>
    );
  }

  return switchControl;
}
