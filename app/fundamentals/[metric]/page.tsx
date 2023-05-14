"use client";
import { useMemo, useState } from "react";
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
import { items as sidebarItems } from "@/components/layout/Sidebar";
import { Icon } from "@iconify/react";
import QuestionAnswer from "@/components/layout/QuestionAnswer";

const Chain = ({ params }: { params: any }) => {
  const [showUsd, setShowUsd] = useSessionStorage("showUsd", true);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const { data: metricData, error: metricError } = useSWR<MetricsResponse>(
    MetricsURLs[params.metric]
  );

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

  const pageData = sidebarItems[1]?.options.find(
    (item) => item.urlKey === params.metric
  )?.page ?? {
    title: "",
    description: "",
    icon: "",
  };

  const [selectedChains, setSelectedChains] = useState(
    AllChains.map((chain) => chain.key)
  );

  const [selectedTimespan, setSelectedTimespan] = useState("365d");

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");

  const [showEthereumMainnet, setShowEthereumMainnet] = useState(false);

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
      {/* <h1>Metric: {params.metric}</h1> */}

      <div className="flex w-full pl-2 md:pl-6 mt-[75px]">
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-start w-full">
            <div className="flex items-start">
              <Heading className="text-2xl leading-snug md:text-[36px] mb-[30px]">
                {pageData.title}
              </Heading>
            </div>
          </div>
          <Subheading
            className="text-[16px] leading-snug"
            leftIcon={
              pageData.icon && (
                <Icon
                  icon={pageData.icon}
                  className="w-6 h-6 mr-[12px] ml-[28px] -mt-0.5"
                />
              )
            }
            iconContainerClassName="items-start mb-[30px]"
          >
            {pageData.description}
          </Subheading>
          {/* <Subheading
              className="text-[20px] mb-[30px]"
              leftIcon={
                <div>
                  <Icon icon="feather:gift" className="w-6 h-6 mr-[16px]" />
                </div>
              }
            >
              {pageData.why}
            </Subheading> */}

          <div className="flex flex-col-reverse xl:flex-row space-x-0 xl:space-x-8">
            <div className="flex-1">
              {metricData && (
                <ComparisonChart
                  data={Object.keys(metricData.data.chains)
                    .filter((chain) => selectedChains.includes(chain))
                    .map((chain) => {
                      return {
                        name: chain,
                        // type: 'spline',
                        types:
                          metricData.data.chains[chain][timeIntervalKey].types,
                        data: metricData.data.chains[chain][timeIntervalKey]
                          .data,
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
          </div>
          <div className="flex flex-col space-y-[15px] mt-[30px]">
            <QuestionAnswer
              className="rounded-3xl bg-forest-50 px-[63px] py-[23px] flex flex-col"
              question={`What does ${pageData.title} tell you?`}
              answer={pageData.why}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Chain;
