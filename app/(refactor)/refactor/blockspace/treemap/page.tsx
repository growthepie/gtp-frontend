import Treemap from "@/components/charts/Treemap";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import React from "react";

const Imprint = () => {
  return (
    <Container className="mt-[65px]">
      <Heading className="text-[48px] mb-[30px] leading-snug" as="h1">
        Blockspace Treemap
      </Heading>
      <div className="text-lg mb-6">Experimental</div>

      <Treemap />
    </Container>
  );
};

export default Imprint;
