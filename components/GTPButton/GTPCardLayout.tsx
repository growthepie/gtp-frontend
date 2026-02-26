"use client";

import { ReactNode, createContext, useState, useLayoutEffect, useRef } from "react";

const DEFAULT_BOTTOM_BAR_OVERLAY_HEIGHT = 0;
const DEFAULT_BOTTOM_BAR_GAP = 15;
const DEFAULT_MOBILE_BREAKPOINT = 768;

// Context used to pass the mobile bottom bar into a nested GTPSplitPane.
// When GTPCardLayout is on a mobile-sized screen, it suppresses its own bottomBar
// rendering and instead provides it here for GTPSplitPane to render between panes.
export interface GTPCardLayoutMobileContextValue {
  mobileBottomBar?: ReactNode;
  bottomBarGap: number;
}
export const GTPCardLayoutMobileContext = createContext<GTPCardLayoutMobileContextValue>({
  bottomBarGap: DEFAULT_BOTTOM_BAR_GAP,
});

export interface GTPCardLayoutProps {
  topBar?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  bottomBar?: ReactNode;
  fullBleed?: boolean;
  contentHeight?: number | string;
  bottomBarOverlayHeight?: number;
  bottomBarGap?: number;
  isMobile?: boolean;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

export default function GTPCardLayout({
  topBar,
  header,
  children,
  bottomBar,
  bottomBarOverlayHeight = DEFAULT_BOTTOM_BAR_OVERLAY_HEIGHT,
  bottomBarGap = DEFAULT_BOTTOM_BAR_GAP,
  isMobile = false,
  cardRef,
  className,
}: GTPCardLayoutProps) {
  const hasBottomBar = Boolean(bottomBar);

  // Internal mobile detection via ResizeObserver so callers don't need to pass isMobile.
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [internalIsMobile, setInternalIsMobile] = useState(false);
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const sync = (width: number) => setInternalIsMobile(width < DEFAULT_MOBILE_BREAKPOINT);
    sync(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) sync(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isActuallyMobile = isMobile || internalIsMobile;

  const innerPaddingBottom = isActuallyMobile
    ? "0px"
    : `${hasBottomBar ? bottomBarOverlayHeight + bottomBarGap : 0}px`;

  // On mobile the bottom bar is injected into the nested GTPSplitPane via context
  // so that it appears between the right and left panes (topBar → right → bottomBar → left).
  const mobileContextValue: GTPCardLayoutMobileContextValue = {
    mobileBottomBar: isActuallyMobile && hasBottomBar ? bottomBar : undefined,
    bottomBarGap,
  };

  return (
    <div className={`h-full w-full ${className ?? ""}`} ref={containerRef}>
      <GTPCardLayoutMobileContext.Provider value={mobileContextValue}>
        <div
          ref={cardRef}
          className="w-full h-full rounded-[18px] bg-color-bg-default flex flex-col overflow-hidden"
        >
          {topBar}
          <div
            className={`relative px-[5px] pb-0 overflow-hidden min-h-0 h-full `}
          >
            <div
              className="flex h-full flex-col gap-[5px]"
              style={{ paddingBottom: innerPaddingBottom }}
            >
              {header}
              {children}
            </div>
            {!isActuallyMobile && hasBottomBar ? (
              <div className="absolute inset-x-0 bottom-0 z-[30]">
                {bottomBar}
              </div>
            ) : null}
          </div>
        </div>
      </GTPCardLayoutMobileContext.Provider>
    </div>
  );
}
