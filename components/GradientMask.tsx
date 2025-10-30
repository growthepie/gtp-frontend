"use client";

import React, { useMemo } from "react";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";

type GradientMaskProps = {
  direction: "left" | "right";
  isVisible: boolean;
};

const GradientMask: React.FC<GradientMaskProps> = ({ direction, isVisible }) => {
  const gradientClass =
    direction === "left"
      ? "bg-[linear-gradient(-90deg,#00000000_0%,#161C1BEE_76%)]"
      : "bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)]";

  const positionClass = direction === "left" ? "-left-[58px]" : "-right-[58px]";

  const [maskRef, { height }] = useElementSizeObserver<HTMLDivElement>();

  const fadeSize = useMemo(() => {
    if (!height) return 26;
    const proportionalFade = height * 0.18;
    const minFade = 14;
    const maxFade = 44;
    return Math.round(Math.min(Math.max(proportionalFade, minFade), maxFade));
  }, [height]);

  return (
    <div
      ref={maskRef}
      className={`transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      } z-[2] absolute top-0 bottom-0 w-[125px] pointer-events-none ${gradientClass} ${positionClass}`}
      style={{
        // prevent the gradient from being clipped vertically
        maskImage:
          "linear-gradient(to bottom, transparent 0, white var(--mask-fade-size), white calc(100% - var(--mask-fade-size)), transparent)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0, white var(--mask-fade-size), white calc(100% - var(--mask-fade-size)), transparent)",
        ["--mask-fade-size" as any]: `${fadeSize}px`,
      }}
    />
  );
};

export default GradientMask;

