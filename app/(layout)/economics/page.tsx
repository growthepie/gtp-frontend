"use client";
import Image from "next/image";
import Heading from "@/components/layout/Heading";
import useSWR from "swr";
import { EconomicsURL } from "@/lib/urls";
import {
  EconomicsResponse,
  ChainBreakdownResponse,
  FeesBreakdown,
  l2_data,
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

  // if (!econData || !master) {
  //   return (
  //     <ShowLoading
  //       dataLoading={[econLoading, masterLoading]}
  //       dataValidating={[econValidating, masterValidating]}
  //     />
  //   );
  // }

  // const {
  //   chain_breakdown,
  //   all_l2s,
  // }: { chain_breakdown: ChainBreakdownResponse; all_l2s: l2_data } =
  //   econData.data;

  return (
    <>
      <ShowLoading
        dataLoading={[econLoading, masterLoading]}
        dataValidating={[econValidating, masterValidating]}
      />
      {/* <div className="mt-[15px] flex flex-col gap-y-[60px] h-full"> */}
      {/*Data Availability Fee Markets */}
      <Container className="pb-[60px]">
        {econData && <EconHeadCharts chart_data={econData.data.all_l2s} />}
      </Container>
      {econData && master && <ChainBreakdown data={econData.data.chain_breakdown} master={master} />}
      {/* </div> */}
    </>
  );
}
