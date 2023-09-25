"use client";
import { useMemo, useState } from "react";
import Heading from "@/components/layout/Heading";
import Container from "@/components/layout/Container";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useSessionStorage, useLocalStorage } from "usehooks-ts";
import CategoryMetrics from "@/components/layout/CategoryMetrics";
import { BlockspaceURLs } from "@/lib/urls";
import useSWR from "swr";
import { CategoryComparisonResponse } from "@/types/api/CategoryComparisonResponse";
import EcosystemDropdown from "@/components/layout/EcosystemDropdown";

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
    "max",
  );

  return (
    <>
      <Container className="flex flex-col w-full mt-[65px] md:mt-[75px]">
        <div className="flex items-center w-[99.8%] justify-between md:text-[36px] mb-[15px] md:mb-[30px]">
          <Heading className="text-[30px] leading-snug md:text-[36px]">
            Category Comparison
          </Heading>
          <EcosystemDropdown
          // optOpen={optOpen}
          // setOptOpen={setOptOpen}
          // selectedStack={selectedStack}
          // setSelectedStack={setSelectedStack}
          />
        </div>
        <div className="flex items-center w-[92%]  mb-[30px]">
          <Image
            src="/GTP-Package.svg"
            alt="GTP Chain"
            className="object-contain w-[32px] h-[32px] mr-2 relative bottom-[100px] xs:bottom-[60px] sm:bottom-4 md:bottom-6 lg:bottom-4"
            height={32}
            width={32}
          />
          <h1 className="text-[16px]">
            We measure the gas fees spent and the number of transactions sent to
            smart contracts. The smart contracts are mapped to distinct
            categories. The chart below allows to compare the usage of these
            categories across different chains. Each category is made up of
            multiple subcategories. You can click on the category dropdown in
            order to see and filter its subcategories.
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
