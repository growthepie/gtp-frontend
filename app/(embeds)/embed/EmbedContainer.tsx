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

const EmbedContainer = ({
  title,
  icon,
  url,
  time_frame,
  chart_type,
  aggregation,
  children,
}: EmbedContainerProps) => {
  const searchParams = useSearchParams();

  const queryZoomed = searchParams ? searchParams.get("zoomed") : null;
  const queryStartTimestamp = searchParams
    ? searchParams.get("startTimestamp")
    : null;
  const queryEndTimestamp = searchParams
    ? searchParams.get("endTimestamp")
    : null;
  const queryTimespan = searchParams ? searchParams.get("timespan") : null;

  const timeframe_text = useMemo(() => {
    let tf = time_frame;
    if (queryZoomed && queryStartTimestamp && queryEndTimestamp)
      tf = `${new Date(
        Math.round(parseInt(queryStartTimestamp)),
      ).toLocaleDateString("en-GB")} - ${new Date(
        Math.round(parseInt(queryEndTimestamp)),
      ).toLocaleDateString("en-GB")}`;
    return tf;
  }, [time_frame, queryZoomed, queryStartTimestamp, queryEndTimestamp]);

  return (
    <div className="h-screen max-h-screen flex flex-col p-[3px] md:p-[15px] bg-white dark:bg-[#151A19] rounded-[18px] md:rounded-[40px] overflow-hidden">
      {title && (
        <div className="flex items-center gap-x-2 justify-center md:justify-between font-semibold bg-forest-50 dark:bg-[#1F2726] rounded-full md:px-[5px]">
          <div className="flex items-center px-[11px] py-[3px] md:px-[21px] md:py-[10px] gap-x-[8px]">
            <div className="flex items-center w-[24px] h-[24px] md:w-[40px] md:h-[40px]">
              <Icon
                className="w-[24px] h-[24px] md:w-[40px] md:h-[40px] font-semibold"
                icon={icon}
              />
            </div>
            <div className="font-semibold text-[16px] md:text-[30px] leading-[120%]">
              {title}
            </div>
          </div>
          <div className="hidden md:flex justify-end items-center p-[3px]">
            <div className="font-normal bg-white dark:bg-[#151A19] px-[8px] py-[6px] md:px-[16px] md:py-[12px] rounded-full flex items-end gap-x-[5px] leading-snug">
              <div className="md:leading-[1.3] text-[10px] md:text-xs text-forest-400">
                Timeframe
              </div>
              <div className="text-xs md:text-sm font-semibold">
                {timeframe_text}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="w-full flex-1 h-[calc(100vh-110px)] md:h-[calc(100vh-210px)] pt-[10px] pb-[0px] md:pt-[50px] md:pb-[10px] overflow-hidden">
        {children}
      </div>
      <div className="flex justify-between items-end pl-[20px] md:pl-[40px]">
        <div className="flex flex-col justify-center items-start gap-x-[10px] text-[8px] md:text-[10px]">
          <div className="flex gap-x-[5px]">
            <div className="text-forest-400">Chart Type</div>
            <div className="capitalize">{chart_type}</div>
          </div>
          <div className="flex gap-x-[5px]">
            <div className="text-forest-400">Aggregation</div>
            <div className="capitalize">{aggregation}</div>
          </div>
        </div>
        <Link
          href={url}
          target="_blank"
          rel="noopener"
          className="flex pl-[12px] pr-[2px] py-[3px] md:px-[20px] md:py-[12px] gap-x-[0px] md:gap-x-[5px] items-center font-normal border md:border-2 border-[#1F2726] dark:border-[#EAECEB] bg-white dark:bg-[#1F2726] text-[12px] md:text-[16px] leading-[150%] rounded-full"
        >
          <div className="hidden md:block">Latest data on</div>
          <div className="block md:hidden text-[0.6rem] md:text-inherit">
            More on
          </div>
          <div className="relative w-[calc(115.7px/4*3)] h-[22px] md:w-[115.7px] md:h-[32px] pl-[8px] pr-[2.5px] pb-[4px] md:pl-[4px] md:pr-[5px] md:pb-[8px]">
            <div className="relative w-full h-full">
              <Image
                src="/logo-restake.svg"
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
          <div className="w-[20px] h-[20px] md:w-[24px] md:h-[24px]">
            <Icon
              className="w-[20px] h-[20px] md:w-[24px] md:h-[24px] font-semibold"
              icon="feather:chevron-right"
            />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default EmbedContainer;
