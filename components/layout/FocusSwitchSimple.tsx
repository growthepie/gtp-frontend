"use client";
import { useState, useEffect } from "react";
import { track } from "@vercel/analytics";
import useAsyncStorage from "@/hooks/useAsyncStorage";
import { ToggleSwitch } from "./ToggleSwitch";

interface FocusSwitchProps {
  isMobile?: boolean;
  className?: string;
  showBorder?: boolean;
}

export default function FocusSwitchSimple({
  isMobile = false,
  className = "",
  showBorder = false,
}: FocusSwitchProps) {
  const [focusEnabled, setFocusEnabled] = useAsyncStorage("focusEnabled", false);
  const [mounted, setMounted] = useState(false);

  // Only show after hydration to prevent SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (newValue: string) => {
    const isL2Focus = newValue === "l2Focus";
    setFocusEnabled(isL2Focus);

    // Track the change
    track(
      isL2Focus ? "changed to L2 Focus" : "changed to Total Ecosystem",
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
    <div className={`flex flex-col items-center gap-y-[5px] ${className}`.trim()}>
      <span className="heading-small-xxxs text-[#5A6462]">
        Total Ecosystem
      </span>
      <ToggleSwitch
        values={{
          left: {
            value: "totalEcosystem",
            label: "ON",
          },
          right: {
            value: "l2Focus",
            label: "OFF",
          },
        }}
        value={focusEnabled ? "l2Focus" : "totalEcosystem"}
        onChange={handleChange}
        size={isMobile ? "sm" : "sm"}
        // Removed redundant `className` prop which is already on the parent div
        className={`${showBorder ? "rounded-full border border-[#5A6462]" : ""}`.trim()}
      />
    </div>
  );
}