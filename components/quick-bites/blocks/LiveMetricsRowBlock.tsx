"use client";

import React from "react";
import { LiveMetricsRowBlock as LiveMetricsRowBlockType } from "@/lib/types/blockTypes";
import { LiveMetricsCardRenderer } from "./LiveMetricsBlock";

export const LiveMetricsRowBlock: React.FC<{ block: LiveMetricsRowBlockType }> = ({ block }) => {
  const className =
    block.className ||
    "grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr))] gap-x-[15px]";

  return (
    <div className={className}>
      {block.items.slice(0, 3).map((item, index) => (
        <LiveMetricsCardRenderer key={`${item.title}-${index}`} config={item} />
      ))}
    </div>
  );
};

export default LiveMetricsRowBlock;
