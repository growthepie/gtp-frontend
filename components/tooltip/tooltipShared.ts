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
  boundsRect,
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
  /** Containment box the tooltip must stay inside, when it should not be the
   *  chart host itself — e.g. a short chart sitting in a taller card, where the
   *  host is too small to hold the tooltip but the card is not. Coordinates are
   *  still returned relative to `hostRect`. */
  boundsRect?: DOMRect | null;
  viewportPadding?: number;
  cursorOffset?: number;
  isTouch?: boolean;
  touchOffset?: number;
}): [number, number] => {
  const hostLeft = hostRect?.left ?? 0;
  const hostTop = hostRect?.top ?? 0;
  // The box the tooltip is kept inside: an explicit bounds element when given,
  // otherwise the chart host.
  const containRect = boundsRect ?? hostRect;
  const containLeft = containRect?.left ?? hostLeft;
  const containTop = containRect?.top ?? hostTop;
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
    // Strict containment: on touch the tooltip must never leave the touched
    // chart's containment box — in multi-chart grids anything that spills over
    // a neighbor reads as a tooltip on the wrong chart. Within that box, bias
    // toward the visible viewport; when box and viewport conflict, the box wins.
    const hostRightAbs = containRect ? containRect.right : viewportWidth;
    const hostBottomAbs = containRect ? containRect.bottom : viewportHeight;

    // X: hard containment clamp, viewport-biased within it. Only when the
    // tooltip is wider than the box itself (narrow single-column charts, where
    // there is no horizontal neighbor to spill onto) fall back to viewport
    // clamping.
    let xAbs = anchorAbsX - contentWidth / 2;
    const hostMaxX = hostRightAbs - contentWidth;
    if (hostMaxX >= containLeft) {
      const biasedMinX = Math.max(containLeft, viewportPadding);
      const biasedMaxX = Math.min(hostMaxX, maxX);
      xAbs = biasedMaxX >= biasedMinX
        ? clamp(xAbs, biasedMinX, biasedMaxX)
        : clamp(xAbs, containLeft, hostMaxX);
    } else {
      xAbs = clamp(xAbs, viewportPadding, maxX);
    }

    // Y: same strict clamp. When the tooltip is taller than the box, pin it to
    // the top — overflow is then unavoidable, but never trade containment for
    // viewport containment: that detaches the tooltip from its chart and lands
    // it on the charts above/below.
    const STABLE_TOP_PADDING = 8;
    const hostMinY = containTop + STABLE_TOP_PADDING;
    const hostMaxY = hostBottomAbs - contentHeight;
    let yAbs: number;
    if (hostMaxY >= hostMinY) {
      const biasedMinY = Math.max(hostMinY, viewportPadding);
      const biasedMaxY = Math.min(hostMaxY, maxY);
      const [minYAbs, maxYAbs] = biasedMaxY >= biasedMinY
        ? [biasedMinY, biasedMaxY]
        : [hostMinY, hostMaxY];
      // Stable top band unless the finger is so close to the top of the chart
      // that the tooltip would cover it — then drop below the finger, still
      // clamped inside the host.
      yAbs = anchorAbsY >= minYAbs + contentHeight + touchOffset
        ? minYAbs
        : clamp(anchorAbsY + touchOffset, minYAbs, maxYAbs);
    } else {
      yAbs = hostMinY;
    }

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

  if (boundsRect) {
    // Keep the tooltip inside the element that owns the chart (e.g. the card a
    // short sparkline sits in). Prefer flipping above the cursor when there is
    // no room below inside the bounds — clamping alone would slide the tooltip
    // up under the pointer. An axis where the tooltip is larger than the bounds
    // is left to the viewport placement above: no position can satisfy it.
    const boundsMaxX = boundsRect.right - contentWidth;
    if (boundsMaxX >= boundsRect.left) xAbs = clamp(xAbs, boundsRect.left, boundsMaxX);
    const boundsMaxY = boundsRect.bottom - contentHeight;
    if (boundsMaxY >= boundsRect.top) {
      const flippedY = anchorAbsY - contentHeight - cursorOffset;
      if (yAbs > boundsMaxY && flippedY >= boundsRect.top) yAbs = flippedY;
      yAbs = clamp(yAbs, boundsRect.top, boundsMaxY);
    }
  }

  return [Math.round(xAbs - hostLeft), Math.round(yAbs - hostTop)];
};
