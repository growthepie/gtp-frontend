"use client";
import { useEffect, useMemo, useState } from "react";
import Error from "next/error";
import { useMetricsData } from "@/context/MetricsProvider";
import { TVLMetricsResponse } from "@/types/api/TVLMetricsResponse";
import { TxCountMetricsResponse } from "@/types/api/TxCountMetricsResponse";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import MainChart from "@/components/home/MainChart";
import ComparisonChart from "@/components/home/ComparisonChart";
import Image from "next/image";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/solid";
import { useLocalStorage } from "usehooks-ts";

const allChains = [
  {
    label: "Ethereum",
    icon: "/icons/ethereum.png",
    key: "ethereum",
    border: ["border-zinc-400", "border-zinc-500"],
  },
  {
    label: "Arbitrum",
    icon: "/icons/arbitrum.png",
    key: "arbitrum",
    border: ["border-blue-300", "border-blue-500"],
  },
  {
    label: "Aztec V2",
    icon: "/icons/aztec.png",
    key: "aztecv2",
    border: ["border-red-300", "border-red-500"],
  },
  {
    label: "Immutable X",
    icon: "/icons/immutablex.png",
    key: "immutablex",
    border: ["border-blue-700", "border-blue-800"],
  },
  {
    label: "Polygon",
    icon: "/icons/polygon-pos.png",
    key: "polygon",
    border: ["border-purple-300", "border-purple-500"],
  },
  {
    label: "Loopring",
    icon: "/icons/loopring.png",
    key: "loopring",
    border: ["border-yellow-300", "border-yellow-500"],
  },
  {
    label: "Optimism",
    icon: "/icons/optimism.png",
    key: "optimism",
    border: ["border-red-300", "border-red-500"],
  },
];

const Timespans = [
  {
    label: "30 Days",
    key: "30d",
  },
  {
    label: "90 Days",
    key: "90d",
  },
  {
    label: "180 Days",
    key: "180d",
  },
  {
    label: "1 Year",
    key: "1y",
  },
  {
    label: "Maximum",
    key: "max",
  },
];

const Chain = ({ params }: { params: any }) => {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const metricsData = useMetricsData();

  const [data, setData] = useState<
    TVLMetricsResponse | TxCountMetricsResponse | null
  >(null);

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

      if (
        !Object.keys(metricsData.data.masterData?.metrics).includes(
          params.metric
        )
      )
        setErrorCode(404);
      // }

      // //   console.log(params.metric);

      // if (metricsData.status === "success") {
      switch (params.metric) {
        case "tvl":
          setData(metricsData.data.metricsTvl);
          break;
        case "txcount":
          setData(metricsData.data.metricsTxCount);
          break;
        case "fees":
          setData(metricsData.data.metricsFees);
          break;
        case "daa":
          setData(metricsData.data.metricsDaa);
          break;

        default:
          break;
      }
    }

    // console.log(metricsData);
  }, [metricsData, params.metric]);

  const chains = useMemo(() => {
    if (!data) return allChains;
    return allChains.filter((chain) =>
      Object.keys(data.data.chains).includes(chain.key)
    );
  }, [data]);

  const [selectedChains, setSelectedChains] = useState(
    allChains.map((chain) => chain.key)
  );

  const [selectedTimespan, setSelectedTimespan] = useState("30d");

  if (errorCode) {
    return <Error statusCode={errorCode} />;
  }

  return (
    <>
      {/* <h1>Metric: {params.metric}</h1> */}
      {data && (
        <div className="flex flex-col space-y-4 mt-8">
          <Heading>{data.data.metric_name}</Heading>
          <Subheading>{data.data.description}</Subheading>
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
          </div> */}

          <div className="flex">
            <div className="flex flex-col w-2/5">
              <div className="flex items-center space-x-2 cursor-pointer py-1 pl-2 pr-4 rounded-full text-sm font-medium">
                <div className="ml-10 w-[20%]">Chain</div>
                <div className="ml-10 w-[20%]">
                  {data.data.metric_id.toUpperCase()}
                </div>
                {["1d", "7d", "30d", "365d"].map((timespan) => (
                  <div
                    key={timespan}
                    className="w-[15%] font-bold text-xs text-right"
                  >
                    {timespan}
                  </div>
                ))}
              </div>
              {chains.map((chain) => (
                <div
                  key={chain.key}
                  className={`flex items-center space-x-2 cursor-pointer py-1 pl-2 pr-4 rounded-full text-sm font-[400] ${
                    selectedChains.includes(chain.key)
                      ? " hover:bg-blue-100 dark:hover:bg-blue-600"
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
                  <div className="relative">
                    <div
                      className={`w-8 h-8 rounded-full bg-white border-[5px] ${
                        chain.border[1]
                      } ${selectedChains.includes(chain.key) ? "" : ""}`}
                    ></div>
                    <Image
                      src={chain.icon}
                      alt={chain.label}
                      width={18}
                      height={18}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    />
                  </div>
                  <div className="flex flex-1 align-middle items-center">
                    <div className="w-[20%]">{chain.label}</div>
                    <div className="w-[20%]">
                      {Intl.NumberFormat("en-US", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(
                        data.data.chains[chain.key].daily.data[
                          data.data.chains[chain.key].daily.data.length - 1
                        ][
                          !showUsd &&
                          data.data.chains[chain.key].daily.types.includes(
                            "usd"
                          )
                            ? 2
                            : 1
                        ]
                      )}
                    </div>
                    {["1d", "7d", "30d", "365d"].map((timespan) => (
                      <div
                        key={timespan}
                        className="w-[15%] text-right flex justify-end align-middle items-center"
                      >
                        {data.data.chains[chain.key].changes[timespan][0] >
                        0 ? (
                          <div className="text-green-500 text-[0.5rem]">▲</div>
                        ) : (
                          <div className="text-red-500 text-[0.5rem]">▼</div>
                        )}
                        <div className="w-12">
                          {Math.round(
                            data.data.chains[chain.key].changes[timespan][0] *
                              1000
                          ) / 10}
                          %
                        </div>
                      </div>
                    ))}
                    {/* <div className="w-1/4 text-right">
                      {Math.round(
                        data.data.chains[chain.key].changes["7d"][0] * 1000
                      ) / 10}
                      %
                    </div>
                    <div className="w-1/4 text-right">
                      {Math.round(
                        data.data.chains[chain.key].changes["30d"][0] * 1000
                      ) / 10}
                      %
                    </div>
                    <div className="w-1/4 text-right">
                      {Math.round(
                        data.data.chains[chain.key].changes["365d"][0] * 1000
                      ) / 10}
                      %
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex-1 py-2 px-3 pt-5 bg-white/5 rounded-xl">
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
          </div>
        </div>
      )}

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

export default Chain;
