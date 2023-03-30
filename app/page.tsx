"use client";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataSelector } from "@/components/home/DataSelector";
import { DataSources } from "@/components/home/DataSources";
import MainChart from "@/components/home/MainChart";
import Popover from "@/components/Popover";
import { useLocalStorage } from "usehooks-ts";
import {
  ArrowsRightLeftIcon,
  LinkIcon,
  TicketIcon,
  Bars3Icon,
} from "@heroicons/react/24/solid";
import { Icon } from "@iconify/react";
import styles from "./page.module.css";
import { Tag } from "@/components/Tag";
import { useEffect, useMemo, useState } from "react";
import { useMetricsData } from "@/context/MetricsProvider";
import { ReactJson } from "@/components/ReactJson";
import Image from "next/image";
import Sidebar, { SidebarItems } from "@/components/layout/Sidebar";
import { useMediaQuery } from "@react-hook/media-query";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import ComparisonChart from "@/components/home/ComparisonChart";

export default function Home() {
  const isLargeScreen = useMediaQuery("(min-width: 768px)");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(isLargeScreen);
  }, [isLargeScreen]);

  const metricsData = useMetricsData();

  // const [darkMode, setDarkMode] = useLocalStorage("darkMode", true);

  const [dataSources, setDataSources] = useLocalStorage<{
    [index: number]: {
      rootKey: string;
      url: string;
      data: any;
      useCorsProxy?: boolean;
    };
  }>("dataSources", {
    0: {
      rootKey: "arbitrum",
      url: "https://d2cfnw27176mbd.cloudfront.net/v1/chains/arbitrum.json",
      data: {},
      useCorsProxy: true,
    },
    1: {
      rootKey: "optimism",
      url: "https://d2cfnw27176mbd.cloudfront.net/v1/chains/optimism.json",
      data: {},
      useCorsProxy: true,
    },
    2: {
      rootKey: "tvl",
      url: "https://d2cfnw27176mbd.cloudfront.net/v1/metrics/tvl.json",
      data: {},
      useCorsProxy: true,
    },
    3: {
      rootKey: "txcount",
      url: "https://d2cfnw27176mbd.cloudfront.net/v1/metrics/txcount.json",
      data: {},
      useCorsProxy: true,
    },
  });

  const allChains = [
    {
      label: "Ethereum",
      icon: "/icons/ethereum.png",
      key: "ethereum",
    },
    {
      label: "Arbitrum",
      icon: "/icons/arbitrum.png",
      key: "arbitrum",
    },
    {
      label: "Aztec V2",
      icon: "/icons/aztec.png",
      key: "aztecv2",
    },
    {
      label: "Immutable X",
      icon: "/icons/immutablex.png",
      key: "immutablex",
    },
    {
      label: "Loopring",
      icon: "/icons/loopring.png",
      key: "loopring",
    },
    {
      label: "Optimism",
      icon: "/icons/optimism.png",
      key: "optimism",
    },
  ];

  const [selectedFilter, setSelectedFilter] = useState({
    name: "Fundamentals",
  });

  const [selectedFilterOption, setSelectedFilterOption] = useState({
    label: "Total Value Locked",
    rootKey: "metricsTvl",
  });

  const chains = useMemo(() => {
    if (metricsData?.status !== "success") return [];

    if (selectedFilter.name === "Fundamentals")
      return allChains.filter((chain) =>
        Object.keys(
          metricsData.data[selectedFilterOption.rootKey].data.chains
        ).includes(chain.key)
      );

    return allChains.filter((chain) =>
      Object.keys(metricsData.data[selectedFilterOption.rootKey].data).includes(
        chain.key
      )
    );
  }, [metricsData]);

  const [selectedChains, setSelectedChains] = useState(
    allChains.map((chain) => chain.key)
  );

  const [errorCode, setErrorCode] = useState(0);
  const [data, setData] = useState(null);

  useEffect(() => {
    console.log(metricsData);
    if (metricsData.status === "error") {
      setErrorCode(500);
    }

    if (metricsData.status === "success") {
      console.log(
        Object.keys(metricsData.data),
        Object.keys(metricsData.data).includes("masterData")
      );
      if (!Object.keys(metricsData.data).includes("masterData"))
        setErrorCode(500);

      if (!Object.keys(metricsData.data.masterData?.metrics).includes("daa"))
        setErrorCode(404);
      // }

      // //   console.log(params.metric);

      let metric = "daa";

      // if (metricsData.status === "success") {

      console.log(metricsData.data);
      switch (metric) {
        case "tvl":
          setData(metricsData.data.metricsTvl);
          break;
        case "txcount":
          setData(metricsData.data.metricsTxCount);
          break;
        case "daa":
          setData(metricsData.data.metricsDaa);
          break;
        default:
          break;
      }
    }

    // console.log(metricsData);
  }, [metricsData]);

  if (!metricsData || metricsData.status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    // <div className="w-full my-8 overflow-y-none">
    <div className="flex w-full mt-8">
      {/* <div className="">
        <Sidebar
          trigger={
            <button className="flex items-center space-x-2">
              <Bars3Icon className="h-6 w-6" />
            </button>
          }
          // items={filters}
          open={isLargeScreen ? true : false}
          onOpen={() => setIsSidebarOpen(true)}
          onClose={() => setIsSidebarOpen(false)}
        >
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2 text-sm font-semibold items-center text-gray-600 dark:text-gray-400">
                <ArrowsRightLeftIcon className="h-4 w-4" />
                <div>Fundamentals</div>
              </div>
            </div>
          </div>
        </Sidebar>
      </div> */}
      {/* Chart Filter Menu */}
      {/* <div className="flex flex-col space-y-3"> */}
      {/* {filters.map((filter) => (
						<div key={filter.name} className="flex flex-col space-y-1">
							<div className="flex space-x-2 text-sm font-semibold items-center text-gray-600 dark:text-gray-400">
								{filter.icon}
								<div>{filter.label}</div>
							</div>
							<div className="flex flex-col space-y-2 text-md font-[400]">
								{metricsData.status === 'success' &&
									filter.options.map((option) => {
										if (!metricsData.rootKeys.includes(option.rootKey)) {
											return (
												<div
													key={option.label}
													className="flex space-x-2 items-center cursor-not-allowed"
												>
													<div className="text-gray-500/40">{option.label}</div>
												</div>
											);
										}

										if (
											selectedFilter.name === filter.name &&
											selectedFilterOption.rootKey === option.rootKey
										) {
											return (
												<div
													key={option.label}
													className="flex space-x-2 items-center cursor-pointer"
													onClick={() => {
														setSelectedFilter({
															name: filter.name,
														});
														setSelectedFilterOption(option);
													}}
												>
													<div className="font-bold">{option.label}</div>
												</div>
											);
										}
										return (
											<div
												key={option.label}
												className="flex space-x-2 items-center cursor-pointer"
												onClick={() => {
													setSelectedFilter({
														name: filter.name,
													});
													setSelectedFilterOption(option);
												}}
											>
												<div>{option.label}</div>
											</div>
										);
									})}
							</div>
						</div>
					))} */}
      {/* </div> */}
      {/* <div
          className={`flex flex-col ${
            isSidebarOpen
              ? "ease-in-out duration-300 transform translate-x-[10.75rem] w-[calc(100%-15.5rem)]"
              : "ease-in-out duration-300 transform translate-x-0 w-full"
          }`}
        > */}
      <div className={`flex flex-col flex-1 pl-8`}>
        {data && (
          <>
            <Heading>Growing the Ethereum ecosystem together.</Heading>
            <Subheading className="text-lg font-medium mt-10">
              Compare Ethereum&apos;s Layer-2 solutions and better understand
              the metrics to grow the ecosystem.
            </Subheading>
            <div className="flex-1">
              <ComparisonChart
                data={Object.keys(data.data.chains)
                  .filter((chain) => selectedChains.includes(chain))
                  .map((chain) => {
                    return {
                      name: chain,
                      // type: 'spline',
                      types: data.data.chains[chain].daily.types,
                      data: data.data.chains[chain].daily.data,
                    };
                  })}
              />
            </div>
          </>
        )}
        {/* <div className="flex space-x-2 justify-end">
            {chains.map((chain) => (
              <div
                key={chain.key}
                className={`flex items-center space-x-2 cursor-pointer py-1 px-2 rounded-full text-sm font-medium ${
                  selectedChains.includes(chain.key)
                    ? "bg-blue-200 dark:bg-blue-500 hover:bg-blue-100 dark:hover:bg-blue-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-900 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-100"
                }`}
                onClick={() => {
                  if (selectedChains.includes(chain.key)) {
                    setSelectedChains(
                      selectedChains.filter((c) => c !== chain.key)
                    );
                  } else {
                    setSelectedChains([...selectedChains, chain.key]);
                  }
                }}
              >
                <div
                  className={`w-4 h-4 ${
                    selectedChains.includes(chain.key) ? "" : ""
                  }`}
                >
                  <Image
                    src={chain.icon}
                    alt={chain.label}
                    width={16}
                    height={16}
                  />
                </div>
                <div>{chain.label}</div>
              </div>
            ))}
          </div>
          <div className="font-bold text-3xl mb-3 ml-2">
            {metricsData.status === "success" &&
              (selectedFilter.name === "Fundamentals"
                ? metricsData.data[selectedFilterOption.rootKey].data
                    .metric_name
                : selectedFilterOption.label)}
          </div>
          {selectedFilter &&
            selectedFilterOption &&
            metricsData.status === "success" &&
            metricsData.data[selectedFilterOption.rootKey].data && (
              <MainChart
                data={Object.keys(
                  metricsData.data[selectedFilterOption.rootKey].data.chains
                )
                  .filter((chain) => selectedChains.includes(chain))
                  .map((chain) => {
                    return {
                      name: chain,
                      // type: 'spline',
                      data: metricsData.data[selectedFilterOption.rootKey].data
                        .chains[chain].daily,
                    };
                  })}
              />
            )}

          <div className="text-2xl font-bold my-3">Metrics Data</div>
          <ReactJson
            src={metricsData}
            theme={darkMode ? "monokai" : "rjv-default"}
          ></ReactJson>
        </div> */}
        {/* <Popover
				trigger={
					<Button variant="solid" color="blue">
						Data Sources
					</Button>
				}
			>
				<div className="p-4">
					<DataSources
						dataSources={dataSources}
						setDataSources={setDataSources}
					/>
				</div>
			</Popover>
			<Popover
				trigger={
					<Button variant="solid" color="blue">
						Data Selector
					</Button>
				}
			>
				<div className="p-4">
					<DataSelector />
				</div>
			</Popover> */}
      </div>
    </div>
  );
}
