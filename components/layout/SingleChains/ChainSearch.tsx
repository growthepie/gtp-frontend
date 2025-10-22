"use client";
import { ChainInfo } from "@/types/api/MasterResponse";
import Search from "@/app/(layout)/applications/_components/Search";
import { Title, TitleButtonLink } from "../TextHeadingComponents";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPIcon } from "../GTPIcon";
import Heading from "../Heading";

interface ChainSearchProps {
  chainInfo: ChainInfo;
  chainKey: string;
}

export default function ChainSearch({ chainInfo, chainKey }: ChainSearchProps) {
  return (
    <div className="sticky top-0 z-[10] flex flex-col w-full pt-[0px] gap-y-[15px] overflow-visible">
      <div className="flex flex-col gap-y-[10px]">
      <div className="flex items-center h-[43px] gap-x-[8px]">
        {/* <GTPIcon icon="gtp-project" size="lg" /> */}
        {/* <Heading className="heading-large-lg md:heading-large-xl h-[36px]" as="h1">
          Applications
        </Heading> */}
        <GTPIcon icon={"gtp-project"} size="lg" className="!w-[34px] !h-[34px]" containerClassName="w-[36px] h-[36px]" />
        <Heading
            className="leading-[120%] text-[20px] md:text-[30px] break-inside-avoid "
            as="h2"
          >
            Applications on {chainInfo?.name}
          </Heading>
      </div>
      </div>
      <Search hideChainSection />
    </div>
  );
}
