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
import QuestionAnswer from "@/components/layout/QuestionAnswer";

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
      <Container className="flex flex-col w-full mt-[65px] md:mt-[45px]">
        <div className="flex items-center w-[99.8%] justify-between md:text-[36px] mb-[15px] relative">
          <div className="flex items-center gap-x-[8px]">
            <Image
              src="/GTP-Package.svg"
              alt="GTP Chain"
              className="object-contain w-[32px] h-[32px] "
              height={36}
              width={36}
            />
            <Heading
              className="text-[26px] leading-snug lg:text-[36px]"
              as="h1"
            >
              Category Comparison
            </Heading>
          </div>
          <EcosystemDropdown />
        </div>
        <div className="flex items-center w-[99%] mx-auto  mb-[30px]">
          <div className="text-[16px]">
            How are certain blockspace categories used on different chains?
          </div>
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
      {usageData && (
        <Container className="flex flex-col space-y-[15px] mt-[45px]">
          <QuestionAnswer
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[63px] py-[23px] flex flex-col"
            question={`What does Category Comparison tell you?`}
            answer={`We measure the gas fees spent and the number of transactions sent to
            smart contracts. The smart contracts are mapped to distinct
            categories. The chart below allows to compare the usage of these
            categories across different chains. Each category is made up of
            multiple subcategories. You can click on the category dropdown in
            order to see and filter its subcategories.`}
            startOpen
          />
        </Container>
      )}
    </>
  );
};

export default CategoryComparison;
