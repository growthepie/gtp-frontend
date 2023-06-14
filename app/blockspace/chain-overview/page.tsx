"use client";
import { useMemo, useState } from "react";
import Heading from "@/components/layout/Heading";
import Container from "@/components/layout/Container";
import OverviewMetrics from "@/components/layout/OverviewMetrics";
import Image from "next/image";
import { useSessionStorage } from "usehooks-ts";
import { ChainOverviewResponse } from "@/types/api/ChainOverviewResponse";
import { BlockspaceURLs } from "@/lib/urls";
import ReactJson from "react-json-view";
import useSWR from "swr";

const ChainOverview = () => {
  const {
    data: usageData,
    error: usageError,
    isLoading: usageLoading,
    isValidating: usageValidating,
  } = useSWR<ChainOverviewResponse>(BlockspaceURLs["chain-overview"]);

  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    "blockspaceTimespan",
    "7d",
  );

  const [showEthereumMainnet, setShowEthereumMainnet] = useSessionStorage(
    "blockspaceShowEthereumMainnet",
    false,
  );

  console.log("usageData", usageData);

  return (
    <>
      <Container className="flex flex-col w-full mt-[65px] md:mt-[75px]">
        <Heading className="text-[30px] leading-snug md:text-[36px] mb-[15px] md:mb-[30px]">
          Chain Overview
        </Heading>
        <div className="flex items-center mb-[30px]">
          <Image
            src="/GTP-Package.svg"
            alt="GTP Chain"
            className="object-contain mr-[17px]"
            height={32}
            width={32}
          />
          <h1 className="text-[16px]">
            An overview of chains high-level blockspace usage. All expressed in
            share of chain usage.
          </h1>
        </div>

        {usageData && (
          <OverviewMetrics
            showEthereumMainnet={showEthereumMainnet}
            setShowEthereumMainnet={setShowEthereumMainnet}
            selectedTimespan={selectedTimespan}
            setSelectedTimespan={setSelectedTimespan}
            data={usageData.data.chains}
          />
        )}
      </Container>
    </>
  );
};

export default ChainOverview;
