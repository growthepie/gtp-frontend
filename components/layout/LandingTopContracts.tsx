"use client";
import { useState, useMemo, useEffect, memo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useLocalStorage } from "usehooks-ts";
import { LandingURL } from "@/lib/urls";
import { ApplicationDisplayName, ApplicationIcon, ApplicationTooltip, Category, formatNumber } from "@/app/(layout)/applications/_components/Components";
import { useMaster } from "@/contexts/MasterContext";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectsMetadataProvider, useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { AggregatedDataRow } from "@/app/(layout)/applications/_contexts/ApplicationsDataContext";
import { GTPTooltipNew } from "../tooltip/GTPTooltip";
import { useTheme } from "next-themes";

export default function LandingTopContracts({ ariaId }: { ariaId?: string }) {
  const {
    data: landing,
    error: landingError,
    isLoading: landingLoading,
    isValidating: landingValidating,
  } = useSWR<any>(LandingURL);

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  // Convert the data into the expected format for AggregatedDataRow
  const transformDataToAggregatedRow = (item) => {
    const [
      owner_project,
      origin_key,
      num_contracts,
      gas_fees_eth,
      prev_gas_fees_eth,
      gas_fees_usd,
      txcount,
      prev_txcount,
      gas_fees_change_pct,
      txcount_change_pct,
      rank
    ] = item;

    return {
      owner_project,
      origin_keys: origin_key.split(', '),
      num_contracts,
      gas_fees_eth,
      prev_gas_fees_eth,
      gas_fees_usd,
      txcount,
      prev_txcount,
      daa: 0, // Not provided in original data
      prev_daa: 0, // Not provided in original data
      gas_fees_eth_change_pct: gas_fees_change_pct,
      gas_fees_usd_change_pct: gas_fees_change_pct, // Assuming same as ETH change
      txcount_change_pct,
      daa_change_pct: 0, // Not provided in original data
      rank_gas_fees_eth: rank,
      rank_gas_fees_usd: rank,
      rank_txcount: rank,
      rank_daa: rank
    };
  };

  const metrics = useMemo(
    () => ({
      gas_fees: {
        label: "Gas Fees",
        key: showUsd ? "gas_fees_usd" : "gas_fees_eth",
      },
      txcount: {
        label: "Transactions",
        key: "txcount",
      },
      daa: {
        label: "Daily Users",
        key: "daa",
      },
    }),
    [showUsd],
  );

  return (
    <ProjectsMetadataProvider>  
      {landing ? (
        <div className={`h-fit md:h-[450px] lg:h-[300px] grid md:grid-rows-3 md:grid-flow-col lg:grid-rows-2 lg:grid-flow-row pt-[10px] lg:grid-cols-3 gap-[10px]`}>
            {landing.data.top_applications.gainers.data.slice(0, 6).map((application, index) => (
              <ApplicationCard key={index} application={transformDataToAggregatedRow(application)} />
            ))}
            
          </div>
          ) : (
            <div className={`h-fit md:h-[450px] lg:h-[300px] grid md:grid-rows-3 md:grid-flow-col lg:grid-rows-2 lg:grid-flow-row pt-[10px] lg:grid-cols-3 gap-[10px]`}>
            {new Array(6).fill(0).map((_, index) => (
              <ApplicationCard key={index} application={undefined} />
            ))}
            <></>
          </div>
      )}
    </ProjectsMetadataProvider>
  );
}

export const ApplicationCard = memo(({ application, className, width }: { application?: AggregatedDataRow, className?: string, width?: number}) => {
  const medianMetricKey = "txcount";
  const medianMetric = "txcount";
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { data: masterData } = useMaster();
  const metricsDef = masterData!.app_metrics;
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);



  const value = useMemo(() => {
    if (!application) return null;

    return application[medianMetricKey];
  }, [application, medianMetricKey]);

  

  const prefix = useMemo(() => {
    const def = metricsDef[medianMetric].units;

    if (Object.keys(def).includes("usd")) {
      return showUsd ? def.usd.prefix : def.eth.prefix;
    } else {
      return Object.values(def)[0].prefix;
    }
  }, [metricsDef, medianMetric, showUsd]);

  const decimals = useMemo(() => {
    const def = metricsDef[medianMetric].units;

    if (Object.keys(def).includes("usd")) {
      return showUsd ? def.usd.decimals : def.eth.decimals;
    } else {
      return Object.values(def)[0].decimals;
    }
  }, [metricsDef, medianMetric, showUsd]);

  if (!application) {
    return (
      <div className={`flex flex-col justify-between h-[140px] border-[0.5px] border-[#5A6462] rounded-[15px] px-[15px] pt-[5px] pb-[10px] min-w-[340px] ${className || ""} `} style={{ width: width || undefined }}>
      </div>
    )
  }

  return (
    <Link href={{ pathname: `/applications/${application.owner_project}`, query: searchParams.toString().replace(/%2C/g, ",")}}
      className={`flex flex-col justify-between h-[140px] border-[0.5px] border-[#5A6462] rounded-[15px] px-[15px] pt-[5px] pb-[10px] ${className || ""} group hover:cursor-pointer hover:bg-forest-500/10`} 
      style={{ width: width || undefined }}
    >
      <div>
        <div className="flex flex-col">
        <div className="w-full flex justify-between items-end h-[20px]">
          <div className="h-[20px] flex items-center gap-x-[3px]">
            <div className="numbers-xs text-color-text-primary">{application.num_contracts.toLocaleString("en-GB")}</div>
            <div className="text-xs text-[#5A6462]">{application.num_contracts === 1 ? 'contract' : 'contracts'}</div>
          </div>
          <div className="h-[20px] flex items-center gap-x-[3px]">
            {/* <div className="numbers-xs text-[#5A6462]">Rank</div>
            <div className="numbers-xs text-color-text-primary">{rank}</div> */}
            {application[`${medianMetricKey}_change_pct`] !== Infinity ? (
              <div className={`flex justify-end w-[60px] numbers-xs ${application[`${medianMetricKey}_change_pct`] < 0 ? 'text-color-negative' : 'text-color-positive'}`}>
                {application[`${medianMetricKey}_change_pct`] < 0 ? '-' : '+'}{formatNumber(Math.abs(application[`${medianMetricKey}_change_pct`]), {defaultDecimals: 1, thresholdDecimals: {base: 1}})}%
              </div>
            ) : <div className="w-[49px]">&nbsp;</div>}
          </div>
        </div>
        <div className="h-[20px] w-full flex items-center justify-end gap-x-[3px]">
          <div className="numbers-sm text-color-text-primary">
            {prefix}
            {value?.toLocaleString("en-GB", { maximumFractionDigits: decimals })}
          </div>
        </div>
        </div>
      </div>
      
      <div className="w-full flex items-center gap-x-[5px]">
        <ApplicationIcon owner_project={application.owner_project} size="md" />
        <GTPTooltipNew
          size="md"
          placement="bottom-start"
          allowInteract={true}
          trigger={
            <div className="heading-large-md flex-1 overflow-visible truncate hover:underline cursor-pointer">
            <ApplicationDisplayName owner_project={application.owner_project} />
            </div>
          }
          containerClass="flex flex-col gap-y-[10px]"
          positionOffset={{ mainAxis: 0, crossAxis: 20 }}
        >
          <ApplicationTooltip application={application} />
        </GTPTooltipNew>
        <div className="cursor-pointer size-[24px] bg-color-bg-medium rounded-full flex justify-center items-center">
          <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-color-text-primary" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-x-[5px]">
        <div className="text-xs">
          <Category category={ownerProjectToProjectData[application.owner_project]?.main_category || ""} />
        </div>
        <div className="h-[20px] flex items-center gap-x-[5px]">
          <Chains origin_keys={application.origin_keys} />
        </div>
      </div>
    </Link>
  )
});

ApplicationCard.displayName = 'ApplicationCard';

export const Chains = ({ origin_keys }: { origin_keys: string[] }) => {
  const { AllChainsByKeys } = useMaster();
  const router = useRouter();
  const { theme } = useTheme();
  return (
    <div className="flex items-center gap-x-[0px] group/chains">
      {origin_keys.map((chain, index) => (
        <div
          key={index}
          className={`group-hover/chains:opacity-50 hover:!opacity-100 cursor-pointer p-[2.5px]`} style={{ color: AllChainsByKeys[chain] ? AllChainsByKeys[chain].colors[theme ?? "dark"][0] : '' }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            router.push(`/applications/?origin_key=${chain}`);
          }}
        >
          {AllChainsByKeys[chain] && (
            <Icon
              icon={`gtp:${AllChainsByKeys[
                chain
              ].urlKey
                }-logo-monochrome`}
              className="w-[15px] h-[15px]"
            />
          )}
        </div>
      ))}
    </div>
  );
};