"use client";

import React from "react";
import { LiveMetricsRowBlock as LiveMetricsRowBlockType } from "@/lib/types/blockTypes";
import { LiveMetricsCardRenderer } from "./LiveMetricsBlock";

export const LiveMetricsRowBlock: React.FC<{ block: LiveMetricsRowBlockType }> = ({ block }) => {
  const className =
    block.className ||
    "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[10px]";

  return (
    <div className={className}>
      {block.items.slice(0, 3).map((item, index) => (
        <LiveMetricsCardRenderer key={`${item.title}-${index}`} config={item} />
      ))}
    </div>
  );
};

export default LiveMetricsRowBlock;
