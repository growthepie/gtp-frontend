"use client";
import { ChainInfo } from "@/types/api/MasterResponse";
import Search from "@/app/(layout)/applications/_components/Search";

interface ChainSearchProps {
  chainInfo: ChainInfo;
  chainKey: string;
}

export default function ChainSearch({ chainInfo, chainKey }: ChainSearchProps) {
  return (
    <div className="sticky top-0 z-[10] flex flex-col w-full pt-[0px] gap-y-[15px] overflow-visible">
      <div className="flex flex-col gap-y-[10px]">
        <div className="heading-large">Apps on {chainInfo?.name}</div>
        <div className="text-xs">
          Applications deployed on {chainInfo?.name}. Search to filter by project name.
        </div>
      </div>
      <Search hideChainSection />
    </div>
  );
}
