"use client";

import React, { useMemo } from "react";
import { Title } from "@/components/layout/TextHeadingComponents";
import HierarchyTreemap from "@/components/layout/BlockspaceTreeMap/HierarchyTreemap";
import { useMaster } from "@/contexts/MasterContext";

type BlockspaceTreemapSectionProps = {
  titleAs?: "h1" | "h2";
  descriptionClassName?: string;
  className?: string;
  chainKey?: string;
};

export default function BlockspaceTreemapSection({
  titleAs = "h2",
  descriptionClassName = "text-[14px] w-[99%] mx-auto",
  className = "",
  chainKey,
}: BlockspaceTreemapSectionProps) {
  const { AllChainsByKeys } = useMaster();
  const chainLabel = useMemo(() => {
    if (!chainKey) return "the Ethereum ecosystem";
    return AllChainsByKeys[chainKey]?.label ?? chainKey;
  }, [AllChainsByKeys, chainKey]);

  return (
    <div className={`flex flex-col w-full gap-y-[15px] ${className}`}>
      <div className="flex items-center w-[99.8%] justify-between md:text-[36px] relative">
        <div className="flex items-center gap-x-[8px]">
          <Title title="Blockspace Treemap" icon="gtp-blockspace" as={titleAs} />
        </div>
      </div>
      <div className={descriptionClassName}>
        Explore blockspace usage accross {chainLabel} as a nested treemap from chain level down to specific contract addresses.
      </div>
      <HierarchyTreemap chainKey={chainKey} />
    </div>
  );
}
