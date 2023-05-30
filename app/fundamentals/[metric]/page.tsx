"use client";
import { useMemo, useState, useEffect } from "react";
import Error from "next/error";
import { MetricsResponse } from "@/types/api/MetricsResponse";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import ComparisonChart from "@/components/layout/ComparisonChart";
import { useSessionStorage } from "usehooks-ts";
import useSWR from "swr";
import MetricsTable from "@/components/layout/MetricsTable";
import { MetricsURLs } from "@/lib/urls";
import { AllChains } from "@/lib/chains";
import { intersection } from "lodash";
import { Icon } from "@iconify/react";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import LoadingAnimation from "@/components/layout/LoadingAnimation";
import { navigationItems } from "@/lib/navigation";
import Container from "@/components/layout/Container";

const Chain = ({ params }: { params: any }) => {
  const [showUsd, setShowUsd] = useSessionStorage("showUsd", true);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const {
    data: metricData,
    error: metricError,
    isLoading: metricLoading,
    isValidating: metricValidating,
  } = useSWR<MetricsResponse>(MetricsURLs[params.metric]);

  // const data = useMemo(() => {
  //   if (!metricData) return null;
  //   return _.omit(metricData.data.chains, "ethereum");
  // }, [metricData]);

  const chains = useMemo(() => {
    if (!metricData) return AllChains;

    return AllChains.filter(
      (chain) =>
        Object.keys(metricData.data.chains).includes(chain.key) &&
        chain.key != "ethereum"
    );
  }, [metricData]);

  const pageData = navigationItems[1]?.options.find(
    (item) => item.urlKey === params.metric
  )?.page ?? {
    title: "",
    description: "",
    icon: "",
  };

  const [selectedChains, setSelectedChains] = useSessionStorage(
    "fundamentalsChains",
    AllChains.map((chain) => chain.key)
  );

  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    "fundamentalsTimespan",
    "180d"
  );

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");

  const [showEthereumMainnet, setShowEthereumMainnet] = useSessionStorage(
    "fundamentalsShowEthereumMainnet",
    false
  );

  const timeIntervalKey = useMemo(() => {
    if (!metricData) return null;

    return metricData.data.avg === true &&
      ["365d", "max"].includes(selectedTimespan) &&
      selectedTimeInterval === "daily"
      ? "daily_7d_rolling"
      : selectedTimeInterval;
  }, [metricData, selectedTimeInterval, selectedTimespan]);

  const [showLoading, setShowLoading] = useState(true);
  const [loadingTimeoutSeconds, setLoadingTimeoutSeconds] = useState(0);

  useEffect(() => {
    if (metricLoading) {
      setShowLoading(true);
      if (!metricValidating) setLoadingTimeoutSeconds(1200);
    }

    if (metricData)
      setTimeout(() => {
        setShowLoading(false);
      }, loadingTimeoutSeconds);
  }, [metricLoading, metricValidating, metricData, loadingTimeoutSeconds]);

  if (errorCode) {
    return <Error statusCode={errorCode} />;
  }

  return (
    <>
      {/* <h1>Metric: {params.metric}</h1> */}
      <div
        className={`absolute w-full h-screen right flex -ml-2 -mr-2 md:-ml-6 md:-mr-[50px] -mt-[153px] items-center justify-center bg-forest-50 dark:bg-forest-1000 z-50 ${
          showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        } transition-opacity duration-300`}
        suppressHydrationWarning
      >
        <LoadingAnimation />
      </div>
      <Container className="flex flex-col w-full mt-[75px]">
        <div className="flex justify-between items-start w-full">
          <div className="flex items-start">
            <Heading className="text-[30px] leading-snug md:text-[36px] mb-[30px]">
              {pageData.title}
            </Heading>
          </div>
        </div>
        <Subheading
          className="text-[16px]"
          leftIcon={
            pageData.icon && (
              <div className="self-start md:self-center pr-[7px] pl-[0px] pt-0.5 md:pt-0 md:pr-[10px] md:pl-[30px]">
                <Icon icon={pageData.icon} className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            )
          }
          iconContainerClassName="items-center mb-[22px] md:mb-[32px]"
        >
          {pageData.description}
        </Subheading>
      </Container>
      <div className="flex flex-col-reverse xl:flex-row space-x-0 xl:space-x-8">
        {metricData && (
          <ComparisonChart
            data={Object.keys(metricData.data.chains)
              .filter((chain) => selectedChains.includes(chain))
              .map((chain) => {
                return {
                  name: chain,
                  // type: 'spline',
                  types: metricData.data.chains[chain][timeIntervalKey].types,
                  data: metricData.data.chains[chain][timeIntervalKey].data,
                };
              })}
            timeIntervals={intersection(
              Object.keys(metricData.data.chains.arbitrum),
              ["daily", "weekly", "monthly"]
            )}
            onTimeIntervalChange={(timeInterval) =>
              setSelectedTimeInterval(timeInterval)
            }
            showTimeIntervals={true}
            sources={metricData.data.source}
            avg={metricData.data.avg}
            showEthereumMainnet={showEthereumMainnet}
            setShowEthereumMainnet={setShowEthereumMainnet}
            selectedTimespan={selectedTimespan}
            setSelectedTimespan={setSelectedTimespan}
          >
            <MetricsTable
              data={metricData.data.chains}
              selectedChains={selectedChains}
              setSelectedChains={setSelectedChains}
              chains={chains}
              metric={metricData.data.metric_id}
              showEthereumMainnet={showEthereumMainnet}
              setShowEthereumMainnet={setShowEthereumMainnet}
            />
          </ComparisonChart>
        )}
      </div>
      <Container className="flex flex-col space-y-[15px] mt-[30px]">
        <QuestionAnswer
          className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[63px] py-[23px] flex flex-col"
          question={`What does ${pageData.title} tell you?`}
          answer={pageData.why}
        />
      </Container>
    </>
  );
};

export default Chain;
