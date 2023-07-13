"use client";
import { useMemo, useState } from "react";
import Heading from "@/components/layout/Heading";
import Container from "@/components/layout/Container";
import Image from "next/image";
import { useSessionStorage } from "usehooks-ts";
import CategoryMetrics from "@/components/layout/CategoryMetrics";
import { BlockspaceURLs } from "@/lib/urls";
import useSWR from "swr";
import { CategoryComparisonResponse } from "@/types/api/CategoryComparisonResponse";

const CategoryComparison = () => {
  const {
    data: usageData,
    error: usageError,
    isLoading: usageLoading,
    isValidating: usageValidating,
  } = useSWR<CategoryComparisonResponse>(BlockspaceURLs["chain-comparison"]);

  const [showEthereumMainnet, setShowEthereumMainnet] = useSessionStorage(
    "blockspaceShowEthereumMainnet",
    false,
  );
  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    "blockspaceTimespan",
    "7d",
  );

  return (
    <>
      <Container className="flex flex-col w-full mt-[65px] md:mt-[75px]">
        <Heading className="text-[30px] leading-snug md:text-[36px] mb-[15px] md:mb-[30px]">
          Category Comparison
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
      </Container>
      {usageData && (
        <CategoryMetrics
          showEthereumMainnet={showEthereumMainnet}
          setShowEthereumMainnet={setShowEthereumMainnet}
          selectedTimespan={selectedTimespan}
          setSelectedTimespan={setSelectedTimespan}
          data={usageData.data}
        />
      )}
    </>
  );
};

export default CategoryComparison;
