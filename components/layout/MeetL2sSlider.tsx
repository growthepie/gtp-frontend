"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useLocalStorage } from "usehooks-ts";
import { Carousel } from "@/components/Carousel";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { ApplicationIcon, ApplicationTooltipAlt } from "@/app/(layout)/applications/_components/Components";
import { useMaster } from "@/contexts/MasterContext";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { MeetL2s } from "@/types/api/EthereumEcosystemOverviewResponse";

type ProjectData = Record<string, any[]>;

export type MeetL2sCardProps = {
  chainKey: string;
  l2Data?: MeetL2s[string];
  projectData?: any[];
  showUsd: boolean;
  resolvedTheme?: string | null;
  metrics?: React.ReactNode;
};

type MeetL2sSliderProps = {
  meetL2sData: MeetL2s | null | undefined;
  projectData: ProjectData | null;
};

const formatNumber = (number: number, decimals = 2): string => {
  if (number === 0) return "0";

  const absNumber = Math.abs(number);
  if (absNumber >= 1e12) return (number / 1e12).toFixed(1) + "T";
  if (absNumber >= 1e9) return (number / 1e9).toFixed(1) + "B";
  if (absNumber >= 1e6) return (number / 1e6).toFixed(1) + "M";
  if (absNumber >= 1e3) return (number / 1e3).toFixed(1) + "k";
  if (absNumber >= 100) return number.toFixed(decimals);
  return number.toFixed(decimals);
};

export const MeetL2sCard = React.memo(({ chainKey, l2Data, projectData, showUsd, resolvedTheme, metrics }: MeetL2sCardProps) => {
  const { AllChainsByKeys } = useMaster();
  const chainInfo = AllChainsByKeys[chainKey];
  const color = chainInfo?.colors?.[resolvedTheme ?? "dark"]?.[0];

  const defaultMetrics = (
    <>
      <div className="flex gap-x-[10px] items-center justify-between">
        <div className="flex flex-col gap-y-[5px] w-[125px]">
          <div className="numbers-2xl">{l2Data ? formatNumber(l2Data.yesterday_aa) : "N/A"}</div>
          <div className="text-xs">Wallets Yesterday</div>
        </div>
        <div className="flex flex-col gap-y-[5px] w-[125px]">
          <div className="numbers-2xl">{l2Data ? formatNumber(l2Data.total_aa) : "N/A"}</div>
          <div className="text-xs">Total Wallets</div>
        </div>
      </div>
      <div className="flex gap-x-[10px] items-center justify-between">
        <div className="flex flex-col gap-y-[5px] w-[125px]">
          <div className="numbers-2xl">
            {l2Data ? `$${formatNumber(l2Data[showUsd ? "stables_mcap_usd" : "stables_mcap_eth"])}` : "N/A"}
          </div>
          <div className="text-xs">Stablecoin Supply</div>
        </div>
        <div className="flex flex-col gap-y-[5px] w-[125px]">
          <div className="numbers-2xl">{l2Data ? formatNumber(l2Data.tps) : "N/A"}</div>
          <div className="text-xs">TPS/Day</div>
        </div>
      </div>
    </>
  );

  return (
    <div
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("a")) {
          window.location.href = `/chains/${chainKey}`;
        }
      }}
      className="group cursor-pointer flex flex-col gap-y-[10px] rounded-[15px] p-[15px] bg-transparent border-[1px] border-color-bg-medium h-full"
    >
      <div className="flex items-center w-full justify-between">
        <div className="flex items-center gap-x-[5px]">
          <GTPIcon
            icon={`${chainInfo?.urlKey}-logo-monochrome` as GTPIconName}
            size="md"
            style={{ color }}
          />
          <div className="heading-large-md select-auto group-hover:underline">
            {chainInfo?.label}
          </div>
        </div>
        <div className="flex items-center justify-center w-[26px] h-[26px] rounded-full bg-color-bg-medium">
          <GTPIcon
            icon="in-button-right-monochrome"
            size="sm"
            containerClassName="!w-[16px] !h-[16px] flex justify-center items-center"
            className="!w-[10.67px] !h-[10.67px] -mr-[2px]"
          />
        </div>
      </div>
      {metrics ?? defaultMetrics}
      <div className="flex flex-col gap-y-[5px] mt-auto pt-[10px]">
        <div className="flex items-center gap-x-[5px]">
          {!projectData || projectData.length === 0 ? (
            <div className="heading-small-xxxs bg-color-bg-medium rounded-full w-[24px] h-[24px] flex items-center justify-center">
              <div className="opacity-90">N/A</div>
            </div>
          ) : (
            projectData.map((project: any) => (
              <GTPTooltipNew
                key={project.owner_project}
                size="md"
                placement="top-start"
                allowInteract={false}
                trigger={
                  <Link href={`/applications/${project.owner_project}`} className="w-fit h-fit">
                    <ApplicationIcon owner_project={project.owner_project} size="sm" />
                  </Link>
                }
                containerClass="flex flex-col gap-y-[10px]"
                positionOffset={{ mainAxis: 0, crossAxis: 20 }}
              >
                <ApplicationTooltipAlt owner_project={project.owner_project} />
              </GTPTooltipNew>
            ))
          )}
        </div>
        <div className="text-xs">Most used apps</div>
      </div>
    </div>
  );
});

const MeetL2sSlider = React.memo(({ meetL2sData, projectData }: MeetL2sSliderProps) => {
  const [showUsd] = useLocalStorage("showUsd", true);
  const { resolvedTheme } = useTheme();

  const l2Keys = useMemo(() => (meetL2sData ? Object.keys(meetL2sData) : []), [meetL2sData]);

  if (!meetL2sData || !projectData) {
    return null;
  }

  return (
    <Carousel
      heightClass="h-[calc(235px+12px+15px)]"
      minSlideWidth={266}
      pagination="dots"
      arrows={false}
      bottomOffset={0}
    >
      {l2Keys.map((key) => (
        <MeetL2sCard
          key={key}
          chainKey={key}
          l2Data={meetL2sData[key]}
          projectData={projectData[key]}
          showUsd={showUsd}
          resolvedTheme={resolvedTheme}
        />
      ))}
    </Carousel>
  );
});

MeetL2sSlider.displayName = "MeetL2sSlider";

export default MeetL2sSlider;
