"use client";
import { useMemo, useState, useEffect } from "react";
import Error from "next/error";
import { ChainData, MetricsResponse } from "@/types/api/MetricsResponse";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import ComparisonChart from "@/components/layout/ComparisonChart";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import useSWR from "swr";
import MetricsTable from "@/components/layout/MetricsTable";
import { MetricsURLs, DAMetricsURLs } from "@/lib/urls";
import {
  Get_DefaultChainSelectionKeys,
  Get_SupportedChainKeys,
} from "@/lib/chains";
import { intersection } from "lodash";
import { Icon } from "@iconify/react";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import { navigationItems } from "@/lib/navigation";
import Container from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import Image from "next/image";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { useMaster } from "@/contexts/MasterContext";
import { A } from "million/dist/shared/million.485bbee4";
import DAMetricsTable from "@/components/layout/DAMetricsTable";

const DataAvailability = ({ params }: { params: any }) => {
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: metricData,
    error: metricError,
    isLoading: metricLoading,
    isValidating: metricValidating,
  } = useSWR<MetricsResponse>(DAMetricsURLs[params.da_layer]);

  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, metricLoading]}
        dataValidating={[masterValidating, metricValidating]}
      />
      {master && metricData ? (
        <DataAvailabilityContent params={{ ...params, master, metricData }} />
      ) : (
        <div className="w-full min-h-[1024px] md:min-h-[1081px] lg:min-h-[637px] xl:min-h-[736px]" />
      )}
    </>
  );
};

const DataAvailabilityContent = ({ params }: { params: any }) => {
  const { AllDALayers, AllDALayersByKeys } = useMaster();

  console.log("AllDALayers", AllDALayers);
  console.log("AllDALayersByKeys", AllDALayersByKeys);
  const master = params.master;
  const metricData = params.metricData;
  const [errorCode, setErrorCode] = useState<number | null>(null);

  console.log("metricData", metricData);

  const daLayerKeys = useMemo(() => {
    if (!metricData)
      return AllDALayers;

    return AllDALayers.filter(
      (da) =>
        Object.keys(metricData.data.chains).includes(da.key)
    ).map((da) => da.key);
  }, [AllDALayers, metricData]);

  // const pageData = navigationItems[1]?.options.find(
  //   (item) => item.urlKey === params.metric,
  // )?.page ?? {
  //   title: "",
  //   description: "",
  //   icon: "",
  // };

  const [selectedDaLayers, setSelectedDaLayers] = useSessionStorage(
    "dataAvailabilitySelectedDaLayers",
    AllDALayers.map((da) => da.key),
  );

  const [selectedScale, setSelectedScale] = useSessionStorage(
    "dataAvailabilityScale",
    "absolute",
  );

  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    "dataAvailabilityTimespan",
    "365d",
  );

  const [selectedTimeInterval, setSelectedTimeInterval] = useSessionStorage(
    "dataAvailabilityTimeInterval",
    "daily",
  );

  const [showEthereumMainnet, setShowEthereumMainnet] = useSessionStorage(
    "dataAvailabilityShowEthereumMainnet",
    false,
  );

  useEffect(() => {
    let currentURL = window.location.href;
    if (currentURL.includes("?is_og=true")) {
      setSelectedScale("stacked");
    }
  }, []);

  const timeIntervalKey = useMemo(() => {
    if (
      metricData?.data.avg === true &&
      ["365d", "max"].includes(selectedTimespan)
    ) {
      return "daily_7d_rolling";
    }

    if (selectedTimeInterval === "monthly") {
      return "monthly";
    }

    return "daily";
  }, [metricData, selectedTimeInterval, selectedTimespan]);

  if (errorCode) {
    return <Error statusCode={errorCode} />;
  }

  console.log(master);

  return (
    <>
      <div className="flex flex-col-reverse xl:flex-row space-x-0 xl:space-x-2">
        <ComparisonChart
          data={Object.keys(metricData.data.chains)
            .filter((da) => selectedDaLayers.includes(da))
            .map((da) => {
              return {
                name: da,
                // type: 'spline',
                types: metricData.data.chains[da][timeIntervalKey].types,
                data: metricData.data.chains[da][timeIntervalKey].data,
              };
            })}
          minDailyUnix={
            Object.values(metricData.data.chains).reduce(
              (acc: number, da: ChainData) => {
                if (!da["daily"].data[0][0]) return acc;
                return Math.min(acc, da["daily"].data[0][0]);
              },
              Infinity,
            ) as number
          }
          maxDailyUnix={
            Object.values(metricData.data.chains).reduce(
              (acc: number, da: ChainData) => {
                return Math.max(
                  acc,
                  da["daily"].data[da["daily"].data.length - 1][0],
                );
              },
              0,
            ) as number
          }
          metric_id={metricData.data.metric_id}
          metric_info_key="da_metrics"
          chain_info_key="da_layers"
          timeIntervals={intersection(
            Object.keys(metricData.data.chains.da_celestia),
            ["daily", "weekly", "monthly"],
          )}
          selectedTimeInterval={selectedTimeInterval}
          setSelectedTimeInterval={setSelectedTimeInterval}
          showTimeIntervals={true}
          sources={metricData.data.source}
          avg={metricData.data.avg}
          monthly_agg={metricData.data.monthly_agg}
          showEthereumMainnet={showEthereumMainnet}
          setShowEthereumMainnet={setShowEthereumMainnet}
          selectedTimespan={selectedTimespan}
          setSelectedTimespan={setSelectedTimespan}
          selectedScale={
            params.metric === "transaction-costs" ? "absolute" : selectedScale
          }
          setSelectedScale={setSelectedScale}
        >
          <DAMetricsTable
            data={metricData.data.chains}
            master={master}
            selectedDALayers={selectedDaLayers}
            setSelectedDALayers={setSelectedDaLayers}
            daLayerKeys={daLayerKeys as string[]}
            metric_id={metricData.data.metric_id}
            showEthereumMainnet={showEthereumMainnet}
            setShowEthereumMainnet={setShowEthereumMainnet}
            timeIntervalKey={timeIntervalKey}
          />
        </ComparisonChart>
      </div>
    </>
  );
};

export default DataAvailability;
