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
    // Touch placement: prefer above the finger, horizontally centered on it.
    // The finger (and the user's hand) occludes everything below-and-right of the
    // contact point, so placing the tooltip there — as we do for a mouse cursor —
    // hides it during scrubbing. Centering horizontally also avoids confusing
    // left/right flips as the finger drags across the chart.
    let xAbs = anchorAbsX - contentWidth / 2;
    xAbs = clamp(xAbs, viewportPadding, maxX);

    const spaceAbove = anchorAbsY - touchOffset - viewportPadding;
    const spaceBelow = viewportHeight - viewportPadding - (anchorAbsY + touchOffset);

    let yAbs: number;
    if (contentHeight <= spaceAbove) {
      yAbs = anchorAbsY - contentHeight - touchOffset;
    } else if (contentHeight <= spaceBelow) {
      yAbs = anchorAbsY + touchOffset;
    } else {
      // No room either side at the touch offset — pin to the top of the viewport.
      // This keeps the tooltip visible even when the chart fills the screen.
      yAbs = viewportPadding;
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
