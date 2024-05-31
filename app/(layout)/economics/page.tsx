"use client";
import Image from "next/image";
import Heading from "@/components/layout/Heading";
import useSWR from "swr";
import { EconomicsURL } from "@/lib/urls";
import {
  EconomicsResponse,
  ChainBreakdown,
  FeesBreakdown,
} from "@/types/api/EconomicsResponse";
import EconHeadCharts from "@/components/layout/Economics/HeadCharts";
import ShowLoading from "@/components/layout/ShowLoading";

export default function Economics() {
  const {
    data: econData,
    error: econError,
    isLoading: econLoading,
    isValidating: econValidating,
  } = useSWR<EconomicsResponse>(EconomicsURL);

  if (!econData) {
    return (
      <ShowLoading
        dataLoading={[econLoading]}
        dataValidating={[econValidating]}
      />
    );
  }

  const {
    chain_breakdown,
    da_fees,
  }: { chain_breakdown: ChainBreakdown; da_fees: FeesBreakdown } =
    econData.data;

  return (
    <div className="mt-[60px] flex flex-col gap-y-[60px]">
      {/*Data Availability Fee Markets */}
      <div className="flex flex-col gap-y-[15px]">
        <div className="flex items-center gap-x-[8px] ">
          <Image
            src="/GTP-Fundamentals.svg"
            alt="GTP Chain"
            className="object-contain w-[32px] h-[32px] "
            height={36}
            width={36}
          />
          <Heading className="text-[30px] leading-snug " as="h1">
            Data Availability Fee Markets
          </Heading>
        </div>
        <EconHeadCharts da_fees={da_fees} />
      </div>
      <div className="flex flex-col gap-y-[15px] ">
        <div className="flex items-center  gap-x-[8px]">
          <Image
            src="/GTP-Fundamentals.svg"
            alt="GTP Chain"
            className="object-contain w-[32px] h-[32px] "
            height={36}
            width={36}
          />
          <Heading className="text-[30px] leading-snug " as="h1">
            Chain Breakdown
          </Heading>
        </div>
      </div>
    </div>
  );
}
