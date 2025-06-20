"use client";
import { useState, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { track } from "@vercel/analytics";
import { ToggleSwitch } from "./ToggleSwitch";

interface EthUsdSwitchProps {
  isMobile?: boolean;
  showBorder?: boolean;
  className?: string;
}

export default function EthUsdSwitchSimple({ 
  isMobile = false, 
  showBorder = false, 
  className = "" 
}: EthUsdSwitchProps) {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [mounted, setMounted] = useState(false);

  // Only show after hydration to prevent SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const newValue = !showUsd;
    setShowUsd(newValue);

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
      className={`
        ${showBorder ? "rounded-full border border-[#5A6462]" : ""} 
        ${className}
      `.trim()}
    />
  );
}