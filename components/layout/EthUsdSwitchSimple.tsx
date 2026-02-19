"use client";
import { useState, useEffect, useRef, startTransition } from "react";
import { useLocalStorage } from "usehooks-ts";
import { track } from "@/lib/tracking";
import { ToggleSwitch } from "./ToggleSwitch";
import { useUIContext } from "@/contexts/UIContext";
import { GTPTooltipNew } from "../tooltip/GTPTooltip";

interface EthUsdSwitchProps {
  isMobile?: boolean;
  showBorder?: boolean;
  className?: string;
}

export default function EthUsdSwitchSimple({ 
  isMobile = false, 
  showBorder = true, // Changed default to true to match the image
  className = "" 
}: EthUsdSwitchProps) {
  const ethUsdSwitchEnabled = useUIContext((state) => state.ethUsdSwitchEnabled);
  // Changed default to false to make ETH the default selection
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", false);
  const [mounted, setMounted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Only show after hydration to prevent SSR mismatch
  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const handleToggle = () => {
    const newValue = !showUsd;
    
    // IMMEDIATE UI UPDATE - This makes the toggle feel instant
    setShowUsd(newValue);
    
    // Show loading state for visual feedback
    setIsUpdating(true);
    
    // Clear any previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Set a reasonable timeout for the updating state (charts need time to change)
    updateTimeoutRef.current = setTimeout(() => {
      setIsUpdating(false);
    }, 800); // Allow enough time for charts to update

    // Track the change
    track(newValue ? "changed to USD" : "changed to ETH", {
      location: isMobile ? "mobile Menu" : "desktop Header",
      page: window.location.pathname,
    });
  };

  if (!mounted) {
    return null;
  }

  const switchControl = (
    <div className="relative w-fit">
      <ToggleSwitch
        values={[
          { value: "eth", label: "ETH" },
          { value: "usd", label: "USD" },
        ]}
        value={showUsd ? "usd" : "eth"}
        onChange={handleToggle}
        disabled={!ethUsdSwitchEnabled}
        size={isMobile ? "xl" : "md"}
        className={`
          ${showBorder ? "h-fit rounded-full border border-color-bg-default" : ""} 
          ${isUpdating ? "opacity-80" : ""}
          ${className}
        `.trim()}
      />
    </div>
  );

  if (!ethUsdSwitchEnabled) {
    return (
      <GTPTooltipNew
        placement={isMobile ? "top-start" : "bottom-start"}
        allowInteract={true}
        enableHover={!isMobile}
        trigger={switchControl}
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
