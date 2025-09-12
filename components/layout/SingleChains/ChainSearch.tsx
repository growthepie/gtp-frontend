"use client";
import { ChainInfo } from "@/types/api/MasterResponse";
import Search from "@/app/(layout)/applications/_components/Search";
import { Title, TitleButtonLink } from "../TextHeadingComponents";
import { GTPIconName } from "@/icons/gtp-icon-names";

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
        <Title
          icon="gtp-project"
          title={`Apps on ${chainInfo?.name}`}
          containerClassName="flex md:w-full md:items-center md:justify-between"
          button={
            <>
              <TitleButtonLink
                label="Don’t see your app? Label here."
                icon="gtp-oli-logo"
                iconSize="md"
                iconBackground="bg-transparent"
                rightIcon={"feather:arrow-right" as GTPIconName}
                href="https://www.openlabelsinitiative.org/?gtp.applications"
                newTab
                gradientClass="bg-[linear-gradient(4.17deg,#5C44C2_-14.22%,#69ADDA_42.82%,#FF1684_93.72%)]"
                className="w-fit hidden md:block"
              />

            </>
          }
        />
      </div>
      </div>
      <Search hideChainSection />
    </div>
  );
}
