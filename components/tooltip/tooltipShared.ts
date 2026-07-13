"use client";

export type GTPTooltipSize = "fit" | "sm" | "md" | "lg";

export const GTP_TOOLTIP_SIZE_CLASS_MAP: Record<GTPTooltipSize, string> = {
  fit: "w-fit",
  sm: "w-[245px]",
  md: "w-[350px] max-w-[calc(100vw-30px)]",
  lg: "w-[350px] md:w-[460px] max-w-[calc(100vw-30px)]",
};

export const GTP_TOOLTIP_BASE_CLASS =
  "flex flex-col gap-y-[5px] py-[15px] pr-[15px] rounded-[15px] bg-color-bg-default text-color-text-primary text-xs shadow-standard";

export const DEFAULT_TOOLTIP_VIEWPORT_PADDING = 12;
export const DEFAULT_TOOLTIP_CURSOR_OFFSET = 14;
// Clearance required so a fingertip + nearby fingers do not occlude the tooltip.
// Calibrated to typical fingertip contact area on phones (~40–50 CSS px).
export const DEFAULT_TOOLTIP_TOUCH_OFFSET = 56;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const getGTPTooltipContainerClass = (
  size: GTPTooltipSize,
  extraClassName?: string,
) => [GTP_TOOLTIP_BASE_CLASS, GTP_TOOLTIP_SIZE_CLASS_MAP[size], extraClassName]
  .filter(Boolean)
  .join(" ");

export const getViewportAwareTooltipLocalPosition = ({
  anchorLocalX,
  anchorLocalY,
  contentWidth,
  contentHeight,
  hostRect,
  viewportPadding = DEFAULT_TOOLTIP_VIEWPORT_PADDING,
  cursorOffset = DEFAULT_TOOLTIP_CURSOR_OFFSET,
  isTouch = false,
  touchOffset = DEFAULT_TOOLTIP_TOUCH_OFFSET,
}: {
  anchorLocalX: number;
  anchorLocalY: number;
  contentWidth: number;
  contentHeight: number;
  hostRect?: DOMRect | null;
  viewportPadding?: number;
  cursorOffset?: number;
  isTouch?: boolean;
  touchOffset?: number;
}): [number, number] => {
  const hostLeft = hostRect?.left ?? 0;
  const hostTop = hostRect?.top ?? 0;
  const anchorAbsX = hostLeft + anchorLocalX;
  const anchorAbsY = hostTop + anchorLocalY;
  const viewportWidth = Math.max(typeof window !== "undefined" ? window.innerWidth : contentWidth, 1);
  const viewportHeight = Math.max(typeof window !== "undefined" ? window.innerHeight : contentHeight, 1);
  const maxX = Math.max(viewportWidth - contentWidth - viewportPadding, viewportPadding);
  const maxY = Math.max(viewportHeight - contentHeight - viewportPadding, viewportPadding);

  if (isTouch) {
    // Touch placement: pin the tooltip at the top of the chart host with X
    // centered on the finger. Following the finger's Y (as a mouse-style cursor
    // tooltip would) makes the tooltip drift up and down as the hand wobbles
    // during a horizontal scrub, which feels janky. Anchoring vertically to the
    // chart turns the tooltip into a stable readout band — only the values
    // inside change as the finger moves — matching iOS Stocks / Robinhood etc.
    //
    // Both axes are clamped to the chart host, not just the viewport: on large
    // touch screens (e.g. iPad) charts sit in a multi-column grid, and a
    // viewport-only clamp lets the tooltip spill over neighboring charts —
    // reading as if it belonged to the wrong chart. Viewport clamping is the
    // fallback when the host is too small to contain the tooltip.
    const hostRightAbs = hostRect ? hostRect.right : viewportWidth;
    const hostBottomAbs = hostRect ? hostRect.bottom : viewportHeight;

    let xAbs = anchorAbsX - contentWidth / 2;
    const minXAbs = Math.max(hostLeft, viewportPadding);
    const maxXAbs = Math.min(hostRightAbs - contentWidth, maxX);
    xAbs = maxXAbs >= minXAbs
      ? clamp(xAbs, minXAbs, maxXAbs)
      : clamp(xAbs, viewportPadding, maxX);

    const STABLE_TOP_PADDING = 8;
    const stableTopAbs = Math.max(hostTop + STABLE_TOP_PADDING, viewportPadding);
    // Only abandon the stable top position when the finger is so close to the
    // top of the chart that the tooltip would visually overlap it. Once that
    // happens, drop the tooltip below the finger instead.
    const stableTopFingerClearanceY = stableTopAbs + contentHeight + touchOffset;

    let yAbs: number;
    if (anchorAbsY >= stableTopFingerClearanceY) {
      yAbs = stableTopAbs;
    } else {
      // Finger near the top of the chart: place the tooltip below the finger,
      // but keep it inside the touched chart rather than over the charts below.
      // When the host can't fit it below the finger, overlapping the finger at
      // the stable top beats detaching the tooltip from its chart.
      const belowYAbs = anchorAbsY + touchOffset;
      const maxYInHostAbs = Math.min(hostBottomAbs - contentHeight, maxY);
      yAbs = maxYInHostAbs >= stableTopAbs
        ? clamp(belowYAbs, stableTopAbs, maxYInHostAbs)
        : stableTopAbs;
    }
    yAbs = clamp(yAbs, viewportPadding, maxY);
    return [Math.round(xAbs - hostLeft), Math.round(yAbs - hostTop)];
  }

  let xAbs = anchorAbsX + cursorOffset;
  if (xAbs + contentWidth > viewportWidth - viewportPadding) {
    xAbs = anchorAbsX - contentWidth - cursorOffset;
  }
  xAbs = clamp(xAbs, viewportPadding, maxX);

  const spaceBelow = viewportHeight - viewportPadding - (anchorAbsY + cursorOffset);
  const spaceAbove = anchorAbsY - cursorOffset - viewportPadding;
  let yAbs = anchorAbsY + cursorOffset;

  if (contentHeight > spaceBelow && contentHeight <= spaceAbove) {
    yAbs = anchorAbsY - contentHeight - cursorOffset;
  } else if (contentHeight > spaceBelow && contentHeight > spaceAbove) {
    yAbs = anchorAbsY - contentHeight / 2;
  }

  yAbs = clamp(yAbs, viewportPadding, maxY);
  return [Math.round(xAbs - hostLeft), Math.round(yAbs - hostTop)];
};
