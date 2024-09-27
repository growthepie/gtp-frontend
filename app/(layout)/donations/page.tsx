"use client";
import Container from "@/components/layout/Container";
import Image from "next/image";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { useUIContext } from "@/contexts/UIContext";
import Heading from "@/components/layout/Heading";
import Icon from "@/components/layout/Icon";

export default function Donations() {
  const { isSidebarOpen } = useUIContext();

  return (
    <Container className="">
      <div className="flex flex-col gap-y-[15px]">
        <div className="text-[20px] font-bold ">Ways to Donate to Us</div>
        <div className="text-[14px]">
          You can donate anytime by sending tokens to one of our following
          wallets:
        </div>
        <div className="flex gap-x-[5px]">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              className="flex gap-x-[10px] p-[5px] border-[2px] rounded-[17px] border-[#CDD8D3] w-[200px] h-[82px] items-center"
              key={index}
            >
              <div className="min-w-[64px] min-h-[64px] relative">
                <Image
                  src="/GivethQR.png"
                  alt="QR Code"
                  width={64}
                  height={64}
                />
                <div className="absolute top-0 left-0 w-[64px] h-[64px] bg-opacity-50 flex items-center justify-center" />
              </div>
              <div className="text-[14px] w-full flex items-center justify-center text-left pl-[5px]">
                <div>
                  Donate to our <b>Giveth</b> Page
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-[20px] font-bold">
          Active Public Goods Funding Rounds
        </div>
        <div className="text-[14px]">
          These are the currently active public goods funding rounds that we
          participate in. Be fast and donate now, they usually run for a short
          time only.
        </div>
        <HorizontalScrollContainer
          includeMargin={false}
          className="w-full flex flex-col "
        >
          <div
            className={`grid  pr-0.5 mb-[15px] text-[14px] font-bold ${
              isSidebarOpen
                ? " 2xl:grid-cols-[105px_294px_90px_170px_auto_90px] grid-cols-[105px_294px_90px_170px_auto_90px] "
                : "xl:grid-cols-[105px_294px_90px_170px_auto_90px] grid-cols-[105px_294px_90px_170px_auto_90px] "
            } min-w-[805px]`}
          >
            <div className="w-full flex justify-center">Time Left</div>
            <div>Name</div>
            <div>Share</div>
            <div>Link</div>
            <div>Donate Until</div>
          </div>
          <div
            className={`relative flex flex-col justify-center -mt-[5px] z-0 transition-height duration-300 border-[1px] border-[#5A6462] rounded-full px-[5px]`}
            style={{ height: "34px" }}
          >
            <div className="flex items-center ">
              <div
                className={`grid  relative rounded-full w-full  min-h-[34px] text-[14px] items-center z-20 cursor-pointer pr-0.5
                         ${
                           isSidebarOpen
                             ? " 2xl:grid-cols-[105px_294px_200px_170px_auto_110px] grid-cols-[105px_294px_90px_170px_auto_90px] "
                             : "xl:grid-cols-[105px_294px_90px_170px_auto_90px] grid-cols-[105px_294px_90px_170px_auto_90px] "
                         }  min-w-[805px]  `}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <div className="w-full bg-[#1F2726] rounded-full flex  justify-center text-[16px] font-bold">
                  Time Left
                </div>
                <div>Name</div>
                <div>Share</div>
                <div>Link</div>
                <div>Donate Until</div>
              </div>
            </div>
          </div>
        </HorizontalScrollContainer>

        <div className="flex items-center h-[43px] gap-x-[8px] mt-[45px]">
          <Icon
            icon={"gtp:donate"}
            className="object-contain w-[36px] h-[36px]"
            height={36}
            width={36}
          />
          <Heading className="text-[36px] leading-snug " as="h1">
            {"Impact"}
          </Heading>
        </div>
        <div className="text-[14px] mb-[30px]">
          growthepie data and visualizations are used across many different
          sites, publishers and media. Our main focus is to cater towards end
          users and builders wanting to get the best overview of the entire
          Ethereum ecosystem. Therefore we support everyone who helps us achieve
          this mission.
        </div>
        <div className="text-[20px] font-bold">
          Publice use of our data and visualizations
        </div>
        <div className="text-[14px]">
          The following people and institutions mention us or use our data
          regularly, free of charge:
        </div>
      </div>
    </Container>
  );
}
