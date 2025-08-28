"use client";
import Heading from "@/components/layout/Heading";
import Container from "@/components/layout/Container";
import { useSessionStorage } from "usehooks-ts";
import CategoryMetrics from "@/components/layout/CategoryMetrics";
import { BlockspaceURLs, MasterURL } from "@/lib/urls";
import useSWR from "swr";
import { CategoryComparisonResponse } from "@/types/api/CategoryComparisonResponse";
import EcosystemDropdown from "@/components/layout/EcosystemDropdown";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import ShowLoading from "@/components/layout/ShowLoading";
import { MasterResponse } from "@/types/api/MasterResponse";
import { Icon } from "@iconify/react";
import { PageContainer } from "@/components/layout/Container";
import MetricRelatedQuickBites from "@/components/MetricRelatedQuickBites";

const CategoryComparison = () => {
  const {
    data: usageData,
    error: usageError,
    isLoading: usageLoading,
    isValidating: usageValidating,
  } = useSWR<CategoryComparisonResponse>(BlockspaceURLs["category-comparison"]);

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

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
      <ShowLoading
        dataLoading={[usageLoading]}
        dataValidating={[usageValidating]}
      />
      <Container
        className="flex flex-col w-full pt-[45px] md:pt-[30px]"
        isPageRoot
      >
        <div className="flex items-center w-[99.8%] justify-between md:text-[36px] mb-[15px] relative">
          <div className="flex items-center gap-x-[8px]">
            <Icon
              icon={"gtp:gtp-compare"}
              className="object-contain w-[32px] h-[32px]"
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
          <div className="text-[14px]">
            How are certain blockspace categories used on different chains?
          </div>
        </div>
      </Container>

      {usageData && master && (
        <CategoryMetrics
          selectedTimespan={selectedTimespan}
          setSelectedTimespan={setSelectedTimespan}
          data={usageData.data}
          master={master}
        />
      )}
      {usageData && (
        <Container className="flex flex-col space-y-[15px] mt-[45px]">
          <QuestionAnswer
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
      
      {/* Add Related Quick Bites Section */}
      <PageContainer className="" paddingY="none">
        <MetricRelatedQuickBites metricKey="category-comparison" metricType="blockspace" />
      </PageContainer>
    </>
  );
};

export default CategoryComparison;
