"use client";
import { useState, useEffect, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";
import { track } from "@/lib/tracking";
import { ToggleSwitch } from "./ToggleSwitch";

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
  // Changed default to false to make ETH the default selection
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", false);
  const [mounted, setMounted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Only show after hydration to prevent SSR mismatch
  useEffect(() => {
    setMounted(true);
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

  return (
    <div className="relative">
      <ToggleSwitch
        values={[
          { value: "eth", label: "ETH" },
          { value: "usd", label: "USD" },
        ]}
        value={showUsd ? "usd" : "eth"}
        onChange={handleToggle}
        size={isMobile ? "xl" : "md"}
        className={`
          ${showBorder ? "h-fit rounded-full border border-color-bg-default" : ""} 
          ${isUpdating ? "opacity-80" : ""}
          ${className}
        `.trim()}
      />
    </div>
  );
}