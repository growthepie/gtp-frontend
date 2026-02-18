"use client";

import { ReactNode } from "react";

const DEFAULT_CONTENT_HEIGHT = 538;
const DEFAULT_BOTTOM_BAR_OVERLAY_HEIGHT = 0;
const DEFAULT_BOTTOM_BAR_GAP = 15;

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
  fullBleed = false,
  contentHeight = DEFAULT_CONTENT_HEIGHT,
  bottomBarOverlayHeight = DEFAULT_BOTTOM_BAR_OVERLAY_HEIGHT,
  bottomBarGap = DEFAULT_BOTTOM_BAR_GAP,
  isMobile = false,
  cardRef,
  className,
}: GTPCardLayoutProps) {
  const hasBottomBar = Boolean(bottomBar);

  const wrapperClassName = fullBleed ? "relative w-screen" : "relative w-full";
  const wrapperStyle = fullBleed
    ? { marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }
    : undefined;

  const contentHeightValue = typeof contentHeight === "number" ? `${contentHeight}px` : contentHeight;

  const innerPaddingBottom = isMobile
    ? "0px"
    : `${hasBottomBar ? bottomBarOverlayHeight + bottomBarGap : 0}px`;

  return (
    <div className={`${wrapperClassName} ${className ?? ""}`} style={wrapperStyle}>
      <div
        ref={cardRef}
        className="w-full  rounded-[18px] bg-color-bg-default flex flex-col overflow-hidden"
      >
        {topBar}
        <div
          className="relative px-[5px] pb-0 overflow-hidden"
          style={{ height: contentHeightValue }}
        >
          <div
            className="flex h-full flex-col gap-[5px]"
            style={{ paddingBottom: innerPaddingBottom }}
          >
            {header}
            {children}
            {isMobile && hasBottomBar ? (
              <div
                className="order-2 -mx-[5px] w-[calc(100%+10px)]"
                style={{ marginTop: `${Math.max(bottomBarGap - 5, 0)}px` }}
              >
                {bottomBar}
              </div>
            ) : null}
          </div>
          {!isMobile && hasBottomBar ? (
            <div className="absolute inset-x-0 bottom-0 z-[30]">
              {bottomBar}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
