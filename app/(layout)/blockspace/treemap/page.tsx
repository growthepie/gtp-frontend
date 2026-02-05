import Container from "@/components/layout/Container";
import { Title } from "@/components/layout/TextHeadingComponents";
import HierarchyTreemap from "@/components/layout/BlockspaceTreeMap/HierarchyTreemap";
import React from "react";

const BlockspaceTreemap = () => {
  return (
    <Container className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] mb-[15px]" isPageRoot>
      <div className="flex items-center w-[99.8%] justify-between md:text-[36px] relative">
        <div className="flex items-center gap-x-[8px]">
          <Title title="Blockspace Hierarchy Treemap" icon="gtp-blockspace" as="h1" />
        </div>
      </div>
      <div className="text-[14px] w-[99%] mx-auto">
        Explore blockspace usage as a nested treemap from chain level down to specific contract addresses.
      </div>
      <HierarchyTreemap />
    </Container>
  );
};

export default BlockspaceTreemap;
