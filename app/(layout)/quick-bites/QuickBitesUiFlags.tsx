"use client";

import { useEffect } from "react";
import { useUIContext } from "@/contexts/UIContext";

export default function QuickBitesUiFlags() {
  const setEthUsdSwitchEnabled = useUIContext((state) => state.setEthUsdSwitchEnabled);

  useEffect(() => {
    // Quick Bites default: ETH/USD switch is disabled unless a specific bite enables it.
    setEthUsdSwitchEnabled(false);

    return () => {
      setEthUsdSwitchEnabled(true);
    };
  }, [setEthUsdSwitchEnabled]);

  return null;
}
