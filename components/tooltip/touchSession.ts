"use client";

// --- Touch-session tracking (module-level, shared by chart components) ---
// TouchEvents can only originate from a real touch screen, so they are a
// reliable "a finger is (or just was) on the page" signal even on devices that
// synthesize mouse/pointer events from touches after the fact (iPadOS does this
// for taps and at the end of scroll gestures). Two things derive from it:
//  • isTouchSession(): forces tooltip positioners down the touch-placement path
//    even when the triggering event was a synthesized one with pointerType
//    "mouse".
//  • getActiveTouchChartEl(): the chart container the current touch started on —
//    the only chart allowed to show a tooltip while the session is active, so a
//    synthesized or group-synced event can never pop a tooltip on a chart the
//    user never touched.
// Mouse-only usage never fires TouchEvents, so hover behavior is untouched.

export const TOUCH_SESSION_LINGER_MS = 800;
export const TOUCH_CHART_CONTAINER_ATTR = "data-gtp-chart-container";

let lastTouchEventAt = 0;
let activeTouchChartEl: Element | null = null;

export const isTouchSession = () =>
  Date.now() - lastTouchEventAt < TOUCH_SESSION_LINGER_MS;

export const getActiveTouchChartEl = () => activeTouchChartEl;

// Touch-primary devices (no hover capability — phones, iPads even in
// desktop-website mode). Mouse-primary desktops and hybrid laptops report
// hover: hover and are excluded, keeping mouse behavior untouched.
export const isTouchPrimaryDevice =
  typeof window !== "undefined" && !!window.matchMedia?.("(hover: none)").matches;

if (typeof document !== "undefined") {
  document.addEventListener("touchstart", (e) => {
    lastTouchEventAt = Date.now();
    activeTouchChartEl = e.target instanceof Element
      ? e.target.closest(`[${TOUCH_CHART_CONTAINER_ATTR}]`)
      : null;
  }, { capture: true, passive: true });
  const bumpTouchSession = () => { lastTouchEventAt = Date.now(); };
  document.addEventListener("touchmove", bumpTouchSession, { capture: true, passive: true });
  document.addEventListener("touchend", bumpTouchSession, { capture: true, passive: true });
}
