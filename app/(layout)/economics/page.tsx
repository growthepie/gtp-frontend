"use client";
import Image from "next/image";
import Heading from "@/components/layout/Heading";
import useSWR from "swr";
import { EconomicsURL } from "@/lib/urls";
import {
  EconomicsResponse,
  ChainBreakdownResponse,
  FeesBreakdown,
} from "@/types/api/EconomicsResponse";
import EconHeadCharts from "@/components/layout/Economics/HeadCharts";
import ChainBreakdown from "@/components/layout/Economics/ChainBreakdown";
import ShowLoading from "@/components/layout/ShowLoading";
import { MasterResponse } from "@/types/api/MasterResponse";
import { MasterURL } from "@/lib/urls";
import Container from "@/components/layout/Container";

export default function Economics() {
  const {
    data: econData,
    error: econError,
    isLoading: econLoading,
    isValidating: econValidating,
  } = useSWR<EconomicsResponse>(EconomicsURL);

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  if (!econData || !master) {
    return (
      <ShowLoading
        dataLoading={[econLoading, masterLoading]}
        dataValidating={[econValidating, masterValidating]}
      />
    );
  }

  const {
    chain_breakdown,
    da_charts,
  }: { chain_breakdown: ChainBreakdownResponse; da_charts: FeesBreakdown } =
    econData.data;

  return (
    <div className="mt-[15px] flex flex-col gap-y-[60px] h-full">
      {/*Data Availability Fee Markets */}
      <Container className="flex flex-col gap-y-[15px]">
        <EconHeadCharts da_charts={da_charts} />
      </Container>
      <ChainBreakdown data={chain_breakdown} master={master} />
    </div>
  );
}
