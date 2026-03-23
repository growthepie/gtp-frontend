"use client";

import { GTPIcon } from "../../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";

export interface MetricRankingIconProps {
  /** Processed icon name ready to pass to GTPIcon */
  icon: GTPIconName;
  rank: number;
  rankingColor: string;
  /** Used in the tooltip description */
  chainName: string;
  metricName: string;
}

export default function MetricRankingIcon({
  icon,
  rank,
  rankingColor,
  chainName,
  metricName,
}: MetricRankingIconProps) {
  return (
    <div className="!size-[14px] xs:!size-[28px] relative flex items-center justify-center">
      <GTPTooltipNew
        placement="top-start"
        allowInteract={true}
        trigger={
          <div className="w-[12px] h-[12px] xs:w-[24px] xs:h-[24px] p-[2px] border-t-[1px] border-r-[1px] border-b-[1px] border-[#5A6462] rounded-r-full rounded-tl-full rounded-bl-full relative flex items-center justify-center">
            <GTPIcon
              icon={icon}
              color={rankingColor}
              className="!w-[12px] !h-[12px] xs:!w-[15px] xs:!h-[15px]"
              containerClassName="relative flex items-center justify-center left-[0.5px] top-[0.5px] w-[12px] h-[12px]"
            />
            <div
              className="numbers-xxxs -left-[11px] absolute top-[0%] w-[12px] h-[12px] xs:w-[24px] xs:h-[24px] flex justify-center items-center"
              style={{ color: rankingColor }}
            >
              {rank}
            </div>
          </div>
        }
        containerClass="mb-[5px] pl-[10px] p-[2px] min-w-[300px] relative flex items-center justify-center"
        positionOffset={{ mainAxis: 0, crossAxis: 20 }}
      >
        <div>
          {`${chainName} ranks #${rank} for ${metricName} among chains listed on growthepie.`}
        </div>
      </GTPTooltipNew>
    </div>
  );
}
