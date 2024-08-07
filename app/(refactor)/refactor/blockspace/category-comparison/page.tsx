"use client";
import Heading from "@/components/layout/Heading";
import Container from "@/components/layout/Container";
import Image from "next/image";
import { useSessionStorage } from "usehooks-ts";
import CategoryMetrics from "../../components/layout/Blockspace/CategoryMetrics/CategoryMetrics";
import { BlockspaceURLs } from "@/lib/urls";
import useSWR from "swr";
import { CategoryComparisonResponse } from "@/types/api/CategoryComparisonResponse";
import EcosystemDropdown from "@/components/layout/EcosystemDropdown";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import ShowLoading from "@/components/layout/ShowLoading";

const CategoryComparison = () => {
  const {
    data: usageData,
    error: usageError,
    isLoading: usageLoading,
    isValidating: usageValidating,
  } = useSWR<CategoryComparisonResponse>(BlockspaceURLs["category-comparison"]);

  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    "blockspaceTimespan",
    "max",
  );

  return (
    <>
      <ShowLoading
        dataLoading={[usageLoading]}
        dataValidating={[usageValidating]}
      />
      <Container
        className="flex flex-col w-full pt-[65px] md:pt-[30px]"
        isPageRoot
      >
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
          selectedTimespan={selectedTimespan}
          setSelectedTimespan={setSelectedTimespan}
          data={usageData.data}
        />
      )}
      {usageData && (
        <Container className="flex flex-col space-y-[15px] mt-[45px]">
          <QuestionAnswer
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[63px] py-[23px] flex flex-col"
            question={`What should you know about the Category Comparison page?`}
            answer={`We measure the gas fees spent and the number of transactions sent to
            smart contracts. The smart contracts are mapped to distinct
            categories. The chart above allows to compare the usage of these
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
