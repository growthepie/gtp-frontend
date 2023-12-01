"use client";
import { useMemo, useState } from "react";
import Error from "next/error";
import { MetricsResponse } from "@/types/api/MetricsResponse";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import ComparisonChart from "@/components/layout/ComparisonChart";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import useSWR from "swr";
import MetricsTable from "@/components/layout/MetricsTable";
import { MetricsURLs } from "@/lib/urls";
import { AllChains } from "@/lib/chains";
import { intersection } from "lodash";
import { Icon } from "@iconify/react";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import { navigationItems } from "@/lib/navigation";
import Container from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import Image from "next/image";

const Chain = ({ params }: { params: any }) => {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const {
    data: metricData,
    error: metricError,
    isLoading: metricLoading,
    isValidating: metricValidating,
  } = useSWR<MetricsResponse>(MetricsURLs[params.metric]);

  const chains = useMemo(() => {
    if (!metricData) return AllChains;

    return AllChains.filter(
      (chain) =>
        Object.keys(metricData.data.chains).includes(chain.key) &&
        chain.key != "ethereum" && chain.ecosystem.includes("all-chains")
    );
  }, [metricData]);

  const pageData = navigationItems[1]?.options.find(
    (item) => item.urlKey === params.metric,
  )?.page ?? {
    title: "",
    description: "",
    icon: "",
  };

  const [selectedChains, setSelectedChains] = useSessionStorage(
    "fundamentalsChains",
    AllChains.filter(
      chain => (chain.ecosystem.includes("all-chains") && ["arbitrum", "optimism", "base", "linea", "zksync_era"].includes(chain.key)) || chain.key === "ethereum"
    ).map((chain) => chain.key),
  );

  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    "fundamentalsTimespan",
    "365d",
  );

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");

  const [showEthereumMainnet, setShowEthereumMainnet] = useSessionStorage(
    "fundamentalsShowEthereumMainnet",
    false,
  );

  const timeIntervalKey = useMemo(() => {
    if (!metricData) return null;

    return metricData.data.avg === true &&
      ["365d", "max"].includes(selectedTimespan) &&
      selectedTimeInterval === "daily"
      ? "daily_7d_rolling"
      : selectedTimeInterval;
  }, [metricData, selectedTimeInterval, selectedTimespan]);

  if (errorCode) {
    return <Error statusCode={errorCode} />;
  }

  return (
    <>
      <ShowLoading
        dataLoading={[metricLoading]}
        dataValidating={[metricValidating]}
      />
      <Container className="flex flex-col w-full mt-[65px] md:mt-[45px]">
        <div className="flex justify-between items-start w-full mb-[15px]">
          <div className="flex items-center ">
            <Image
              src="/GTP-Fundamentals.svg"
              alt="GTP Chain"
              className="object-contain w-[32px] h-[32px] mr-[8px]"
              height={36}
              width={36}
            />
            <Heading className="text-[36px] leading-snug " as="h1">
              {pageData.title}
            </Heading>
          </div>
        </div>
        <Subheading
          className="text-[16px] mb-[30px] w-[99.5%] mx-auto"
          iconContainerClassName="items-center mb-[15px] md:mb-[32px] relative"
        >
          {pageData.description.includes("L2Beat.com.") ? (
            <div>
              <p>
                {pageData.description.replace("L2Beat.com.", "")}

                <a
                  className="hover:underline"
                  target="_blank"
                  href="https://l2beat.com/scaling/tvl"
                >
                  L2Beat.com
                </a>
              </p>
            </div>
          ) : (
            pageData.description
          )}
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
      <div className="flex flex-col-reverse xl:flex-row space-x-0 xl:space-x-2">
        {metricData && (
          <ComparisonChart
            data={Object.keys(metricData.data.chains)
              .filter(
                (chain) => selectedChains.includes(chain)
              )
              .map((chain) => {
                return {
                  name: chain,
                  // type: 'spline',
                  types: metricData.data.chains[chain][timeIntervalKey].types,
                  data: metricData.data.chains[chain][timeIntervalKey].data,
                };
              })}
            metric_id={metricData.data.metric_id}
            timeIntervals={intersection(
              Object.keys(metricData.data.chains.arbitrum),
              ["daily", "weekly", "monthly"],
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
              metric_id={metricData.data.metric_id}
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
          startOpen
        />
      </Container>
    </>
  );
};

export default Chain;
