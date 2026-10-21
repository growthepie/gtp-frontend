"use client";

import { memo, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMediaQuery } from "@react-hook/media-query";
import { track } from "@/lib/tracking";
import { createEtherDiamondScene, EtherDiamondScene } from "./etherDiamondScene";

// iOS only sends motion events after the visitor allows it, from a tap.
type MotionPermissionApi = { requestPermission?: () => Promise<PermissionState> };
const motionApi = () =>
  typeof DeviceMotionEvent === "undefined" ? undefined : (DeviceMotionEvent as unknown as MotionPermissionApi);
const motionNeedsPermission = () =>
  typeof motionApi()?.requestPermission === "function" && window.matchMedia("(any-pointer: coarse)").matches;
const subscribeNever = () => () => {};

// The hero's ETH glyph: a canvas-drawn 3D diamond that spins on its own, can be
// dragged (with inertia), leans towards a hovering mouse and follows the device
// gyroscope on phones and tablets. Spun hard enough, it turns into the steam of
// growthepie's logo for a while. See etherDiamondScene.ts for the renderer.
function EtherDiamond({ height = 380 }: { height?: number }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<EtherDiamondScene | null>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const needsMotionPermission = useSyncExternalStore(subscribeNever, motionNeedsPermission, () => false);
  const [tilt, setTilt] = useState<"off" | "on" | "denied">("off");

  useEffect(() => {
    if (!wrapperRef.current || !canvasRef.current) return;
    const scene = createEtherDiamondScene(wrapperRef.current, canvasRef.current, {
      onTiltActive: () => setTilt("on"),
      onSteam: () => track("found ETH steam easter egg", { location: "eth hero", page: window.location.pathname }),
    });
    sceneRef.current = scene;
    return () => {
      scene?.destroy();
      sceneRef.current = null;
    };
  }, []);

  const enableTilt = () => {
    const requestPermission = motionApi()?.requestPermission;
    if (!requestPermission) return;
    // Must be called straight from the tap, before any await.
    requestPermission()
      .then((state) => {
        if (state === "granted") sceneRef.current?.enableTilt();
        else setTilt("denied");
      })
      .catch(() => setTilt("denied"));
  };

  return (
    <div
      ref={wrapperRef}
      className="relative flex w-full cursor-grab select-none items-center justify-center [-webkit-touch-callout:none]"
      style={{ height, touchAction: "pan-y pinch-zoom" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-auto rounded-full"
        style={{
          width: height * 0.8,
          height: height * 0.8,
          background: "radial-gradient(closest-side, rgb(var(--accent-turquoise) / 0.22), rgb(var(--accent-turquoise) / 0))",
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="relative block h-full max-w-full opacity-0 transition-opacity duration-500"
        style={{ width: height * 0.82 }}
      />
      <div className="absolute bottom-0 right-[15px] flex items-center gap-x-[8px] text-xs text-color-text-primary/70">
        {needsMotionPermission && !reducedMotion && tilt === "off" && (
          <button
            type="button"
            onClick={enableTilt}
            className="cursor-pointer rounded-full bg-color-bg-medium px-[10px] py-[3px] text-color-text-primary transition-colors hover:bg-color-ui-hover"
          >
            enable tilt
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(EtherDiamond);
