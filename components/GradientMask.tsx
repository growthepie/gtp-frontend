"use client";

import React from "react";

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

  return (
    <div
      className={`transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      } z-[2] absolute top-0 bottom-0 w-[125px] pointer-events-none ${gradientClass} ${positionClass}`}
      style={{
        // to avoid the gradient from being cut off
        maskImage:
          "linear-gradient(to bottom, transparent 0, white 30px, white calc(100% - 30px), transparent)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0, white 30px, white calc(100% - 30px), transparent)",
      }}
    />
  );
};

export default GradientMask;


