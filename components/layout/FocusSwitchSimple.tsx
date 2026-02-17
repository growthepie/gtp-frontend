"use client";
import { useState, useEffect } from "react";
import { track } from "@/lib/tracking";
import useAsyncStorage from "@/hooks/useAsyncStorage";
import { ToggleSwitch } from "./ToggleSwitch";
import { GTPTooltipNew, TooltipBody, TooltipHeader } from "../tooltip/GTPTooltip";
import { useUIContext } from "@/contexts/UIContext";

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
  const focusSwitchEnabled = useUIContext((state) => state.focusSwitchEnabled);
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
    <GTPTooltipNew
      placement="bottom-start"
      trigger={
        <div className={`flex flex-col items-center gap-y-[5px] ${className}`.trim()}>
          <span className={`heading-small-xxxs ${focusEnabled ? "text-[#5A6462]" : ""}`.trim()}>
            Total Ecosystem
          </span>
          <ToggleSwitch
            values={[
              { value: "totalEcosystem", label: "ON" },
              { value: "l2Focus", label: "OFF" },
            ]}
            value={focusEnabled ? "l2Focus" : "totalEcosystem"}
            onChange={handleChange}
            size={isMobile ? "sm" : "sm"}
            disabled={!focusSwitchEnabled}
            // Removed redundant `className` prop which is already on the parent div
            className={`${showBorder ? "rounded-full border border-[#5A6462]" : ""}`.trim()}
          />
        </div>
      }
      containerClass="flex flex-col gap-y-[10px] z-global-search-tooltip"
      positionOffset={{ mainAxis: 12, crossAxis: 0 }}
      size='md'
    >
      <TooltipHeader title={"Total Ecosystem vs L2 Focus"} />
      <TooltipBody className='flex flex-col gap-y-[5px] pl-[20px]'>
          <div>
            Toggling between "Total Ecosystem" and "L2 focus" allows you to include Ethereum Mainnet on our pages or to focus solely on Layer 2s.
          </div>
        {!focusSwitchEnabled && (
          <div className="text-xxs text-wrap text-forest-400">
            Currently disabled because current page encompasses the full Ethereum Ecosystem, therefore the focus switch is not applicable.
          </div>
        )}
      </TooltipBody>

    </GTPTooltipNew>
  );
}