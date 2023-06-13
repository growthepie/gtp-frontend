"use client";
import Heading from "@/components/layout/Heading";
import Container from "@/components/layout/Container";
import OverviewMetrics from "@/components/layout/OverviewMetrics";
import Image from "next/image";

const ChainOverview = () => {

  return (
    <>

      <Container className="flex flex-col w-full mt-[65px] md:mt-[75px]">
          <Heading className="text-[30px] leading-snug md:text-[36px] mb-[15px] md:mb-[30px]"> Chain Overview </Heading>
          <div className="flex items-center">
              <Image
                src="/GTP-Package.svg"
                alt="GTP Chain"
                className="object-contain mr-[17px]"
                height={32}
                width={32}
              />
              <h1 className="text-[16px]">An overview of chains high-level blockspace usage. All expressed in share of chain usage.</h1>
          </div>

          <OverviewMetrics />


      </Container>
    </>
  );
};

export default ChainOverview;
