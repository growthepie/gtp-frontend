import React from "react";
import Heading from "@/components/layout/Heading";
import Container from "@/components/layout/Container";
import Subheading from "@/components/layout/Subheading";

const FeesExplainer = () => {
  return (
    <Container className="flex flex-col flex-1 w-full mt-[65px] md:mt-[70px] gap-y-[15px]">
      <div className="flex flex-col gap-x-[8px]  mb-[30px]">
        {/* <Image
                    src="/GTP-Link.svg"
                    alt="GTP Chain"
                    className="object-contain w-[32px] h-[32px] self-center mr-[8px]"
                    height={36}
                    width={36}
                  /> */}

        <Heading
          className="font-bold leading-[1.2] text-[24px] sm:text-[32px] md:text-[36px] max-w-[900px]"
          as="h1"
        >
          Fees Explainer
        </Heading>
        <Subheading className="text-xs sm:text-sm md:text-[20px] font-semibold leading-[1.2]">
          Gain additional context and understanding of our fees metrics
        </Subheading>
      </div>
      <iframe
        title="Fee HTML"
        src="https://api.growthepie.xyz/v1/misc/fee.html"
        width="100%"
        height="820px"
        frameBorder="0"
      ></iframe>
    </Container>
  );
};

export default FeesExplainer;
