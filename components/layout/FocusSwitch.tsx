"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { track } from "@vercel/analytics";
import { Icon } from "@iconify/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import useAsyncStorage from "@/hooks/useAsyncStorage";
import { ToggleSwitch } from "./ToggleSwitch";

type FocusSwitchProps = {
  isMobile?: boolean;
  showBorder?: boolean;
  className?: string;
};

export default function FocusSwitch({ isMobile, showBorder=false, className}: FocusSwitchProps) {
  const [mounted, setMounted] = useState(false);
  const [focusEnabled, setFocusEnabled] = useAsyncStorage("focusEnabled", false);
  const [isChanging, setIsChanging] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsResizing(true);
      setTimeout(() => setIsResizing(false), 200);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Clean up any lingering timeouts on unmount
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = useCallback((newValue: string) => {
    if (isChanging || isUpdating) return; // Prevent changes during updates
    
    setIsChanging(true);
    setIsUpdating(true);
    
    // Use a single timeout with a slightly longer delay to reduce render thrashing
    setTimeout(() => {
      const isL2Focus = newValue === "l2Focus";
      setFocusEnabled(isL2Focus);
      
      // Track the change in focus mode
      track(
        isL2Focus ? "changed to L2 Focus" : "changed to Total Ecosystem",
        {
          location: isMobile ? "mobile Menu" : "desktop Header",
          page: window.location.pathname,
        }
      );
      
      // Reset changing state
      setIsChanging(false);
      
      // Set a longer timeout for the updating state (charts need time to change)
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        setIsUpdating(false);
      }, 200); // Allow enough time for charts to update
    }, 100);
  }, [isMobile, setFocusEnabled, isChanging, isUpdating]);

  if (!mounted) {
    return null;
  }

  return (
    <div className={`relative rounded-full ${showBorder ? "border border-[#5A6462]" : ""} ${className || ""} ${isResizing ? "opacity-0" : ""}`}>
      {/* Show spinner overlay while updating */}
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-forest-100 dark:bg-forest-950 bg-opacity-20 dark:bg-opacity-20 rounded-lg">
          <div className="w-4 h-4 border-[3px] border-forest-500/30 rounded-full border-t-transparent animate-spin"></div>
        </div>
      )}
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
        value={focusEnabled ? "l2Focus" : "totalEcosystem"}
        onChange={handleChange}
        size={isMobile ? "sm" : "md"}
        disabled={isUpdating}
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
    </div>
  );
}