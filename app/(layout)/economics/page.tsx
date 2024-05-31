"use client";
import Image from "next/image";
import Heading from "@/components/layout/Heading";
import useSWR from "swr";
import { EconomicsURL } from "@/lib/urls";
import { EconomicsResponse } from "@/types/api/EconomicsResponse";

export default function Economics() {
  const {
    data: usageData,
    error: usageError,
    isLoading: usageLoading,
    isValidating: usageValidating,
  } = useSWR<EconomicsResponse>(EconomicsURL);

  return (
    <div className="mt-[60px]">
      {/*Data Availability Fee Markets */}
      <div className="flex items-center gap-x-[8px] ">
        <Image
          src="/GTP-Fundamentals.svg"
          alt="GTP Chain"
          className="object-contain w-[32px] h-[32px] mr-[8px]"
          height={36}
          width={36}
        />
        <Heading className="text-[30px] leading-snug " as="h1">
          Data Availability Fee Markets
        </Heading>
      </div>
    </div>
  );
}
