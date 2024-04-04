"use client";
import Icon from "@/components/layout/Icon";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

type EmbedContainerProps = {
  title: string;
  icon: string;
  url: string;
  time_frame: string;
  chart_type: string;
  aggregation: string;
  children: React.ReactNode;
};

const EmbedContainer = ({ title, icon, url, time_frame, chart_type, aggregation, children }: EmbedContainerProps) => {
  const searchParams = useSearchParams();

  const queryZoomed = searchParams ? searchParams.get("zoomed") : null;
  const queryStartTimestamp = searchParams ? searchParams.get("startTimestamp") : null;
  const queryEndTimestamp = searchParams ? searchParams.get("endTimestamp") : null;
  const queryTimespan = searchParams ? searchParams.get("timespan") : null;

  const timeframe_text = useMemo(() => {
    let tf = queryTimespan ? queryTimespan : time_frame;
    if (queryZoomed && queryStartTimestamp && queryEndTimestamp)
      tf = `${new Date(Math.round(parseInt(queryStartTimestamp))).toLocaleDateString()} - ${new Date(Math.round(parseInt(queryEndTimestamp))).toLocaleDateString()}`;
    return tf;
  }, [queryTimespan, time_frame, queryZoomed, queryStartTimestamp, queryEndTimestamp]);

  return (
    <div className="flex flex-col p-[15px] bg-white dark:bg-[#151A19] rounded-[40px]">
      {title && (
        <div className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-[#1F2726] rounded-full px-[5px]">
          <div className="flex items-center px-[21px] py-[10px] gap-x-[8px]">
            <div className="w-[40px] h-[40px]">
              <Icon className="w-[40px] h-[40px] font-semibold" icon={icon} />
            </div>
            <div className="font-semibold text-[30px] leading-[120%]">{title}</div>
          </div>
          <div className="flex justify-end items-center p-[3px]">
            <div className="font-normal bg-white dark:bg-[#151A19] px-[16px] py-[12px] text-[16px] rounded-full flex items-end gap-x-[5px] leading-[1]">
              <div className="text-xs text-forest-400">Timeframe</div>
              <div className="text-sm font-semibold">{timeframe_text}</div>
            </div>
          </div>
        </div>
      )}

      {children}
      <div className="flex justify-between items-center pl-[40px]">
        <div className="flex items-center gap-x-[10px]">

        </div>
        <Link
          href={url}
          target="_blank"
          rel="noopener"
          className="flex px-[20px] py-[12px] gap-x-[5px] items-center font-normal border-2 border-[#1F2726] dark:border-[#EAECEB] bg-white dark:bg-[#1F2726] text-[16px] leading-[150%] rounded-full"
        >
          <div>Latest data on</div>
          <div className="relative w-[115.7px] h-[32px] pl-[8px] pr-[5px] pb-[8px]">
            <div className="relative w-full h-full">
              <Image
                src="/logo_full.png"
                alt="Forest"
                className="hidden dark:block"
                fill={true}
                quality={100}
                sizes="33vw"
              />
              <Image
                src="/logo_full_light.png"
                alt="Forest"
                className="block dark:hidden"
                fill={true}
                quality={100}
                sizes="33vw"
              />
            </div>
          </div>
          <div className="w-[24px] h-[24px]">
            <Icon className="w-[24px] h-[24px] font-semibold" icon="feather:chevron-right" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default EmbedContainer;
