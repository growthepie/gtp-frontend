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
import { Icon } from "@iconify/react";
import { navigationItems } from "@/lib/navigation";
import Subheading from "@/components/layout/Subheading";

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

  const pageData = navigationItems[2]?.options.find(
    (item) => item.urlKey === "chain-overview",
  )?.page ?? {
    title: "",
    description: "",
    icon: "",
  };

  return (
    <>
      <Container className="flex flex-col w-full mt-[65px] md:mt-[75px]">
        <Heading className="text-[30px] leading-snug md:text-[36px] mb-[15px] md:mb-[30px]">
          Chain Overview
        </Heading>
        <Subheading
          className="text-[16px]"
          leftIcon={
            pageData.icon && (
              <div className="self-start md:self-center pr-[7px] pl-[0px] pt-0.5 md:pt-0 md:pr-[10px] md:pl-[0px]">
                <Icon icon={pageData.icon} className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            )
          }
          iconContainerClassName="items-center mb-[22px] md:mb-[32px] relative"
        >
          {pageData.description}
          {pageData.note && (
            <div className="absolute text-xs">
              <span className="font-semibold text-forest-200 dark:text-forest-400">
                Note:{" "}
              </span>
              {pageData.note}
            </div>
          )}
        </Subheading>
      </Container>

      {usageData && (
        <OverviewMetrics
          showEthereumMainnet={showEthereumMainnet}
          setShowEthereumMainnet={setShowEthereumMainnet}
          selectedTimespan={selectedTimespan}
          setSelectedTimespan={setSelectedTimespan}
          data={usageData.data.chains}
        />
      )}
    </>
  );
};

export default ChainOverview;
