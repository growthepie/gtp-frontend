import Container from "@/components/layout/Container";
import BlockspaceTreemapSection from "@/components/layout/BlockspaceTreeMap/BlockspaceTreemapSection";
import React from "react";

const BlockspaceTreemap = () => {
  return (
    <Container className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] mb-[15px]" isPageRoot>
      <BlockspaceTreemapSection titleAs="h1" />
    </Container>
  );
};

export default BlockspaceTreemap;
