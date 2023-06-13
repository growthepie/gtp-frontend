"use client";
import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import Link from "next/link";
import { Icon } from "@iconify/react";


export default function OverviewMetrics ({
  data,
  timeIntervals,
  onTimeIntervalChange,
  showTimeIntervals = true,
  showEthereumMainnet,
  setShowEthereumMainnet,
  selectedTimespan,
  setSelectedTimespan,
}: {
  data: any;
  timeIntervals: string[];
  onTimeIntervalChange: (interval: string) => void;
  showTimeIntervals: boolean;
    showEthereumMainnet: boolean;
  setShowEthereumMainnet: (show: boolean) => void;
  selectedTimespan: string;
  setSelectedTimespan: (timespan: string) => void;
}) {

  const [selectedScale, setSelectedScale] = useState("gasfees");

  const filteredData = useMemo<any[]>(() => {
    if (!data)
      return [
        {
          name: "",
          data: [],
          types: [],
        },
      ];

    const d: any[] = showEthereumMainnet
      ? data
      : data.filter((d) => d.name !== "ethereum");

    if (d.length === 0)
      return [
        {
          name: "",
          data: [],
          types: [],
        },
      ];
    return d;
  }, [data, showEthereumMainnet]);


  const timespans = useMemo(() => {
    let maxDate = new Date();
    if (filteredData && filteredData[0].name !== "") {
      maxDate = new Date(
        filteredData.length > 0
          ? filteredData[0].data[filteredData[0].data.length - 1][0]
          : 0
      );
    }

    const buffer = 0.5 * 24 * 60 * 60 * 1000;
    const maxPlusBuffer = maxDate.valueOf() + buffer;

    return {
      // "30d": {
      //   label: "30 days",
      //   value: 30,
      //   xMin: Date.now() - 30 * 24 * 60 * 60 * 1000,
      //   xMax: Date.now(),
      // },
      "90d": {
        label: "90 days",
        value: 90,
        xMin: maxDate.valueOf() - 90 * 24 * 60 * 60 * 1000 - buffer,
        xMax: maxPlusBuffer,
      },
      "180d": {
        label: "180 days",
        value: 180,
        xMin: maxDate.valueOf() - 180 * 24 * 60 * 60 * 1000 - buffer,
        xMax: maxPlusBuffer,
      },
      "365d": {
        label: "1 year",
        value: 365,
        xMin: maxDate.valueOf() - 365 * 24 * 60 * 60 * 1000 - buffer,
        xMax: maxPlusBuffer,
      },
      max: {
        label: "Maximum",
        value: 0,
        xMin:
          filteredData[0].name === ""
            ? Date.now() - 365 * 24 * 60 * 60 * 1000
            : filteredData.reduce(
                (min, d) => Math.min(min, d.data[0][0]),
                Infinity
              ) - buffer,

        xMax: maxPlusBuffer,
      },
    };
  }, [filteredData, selectedScale]);

  return (
    <>
      <div className="flex w-full justify-between items-center text-xs rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5">
        <div className="hidden md:flex justify-center items-center">
          <div className="w-7 h-7 md:w-9 md:h-9 relative ml-[21px] mr-1.5">
            <Image
              src="/GTP-Chain.png"
              alt="GTP Chain"
              className="object-contain"
              fill
            />
          </div>
          {/* <Icon icon="gtp:chain" className="w-7 h-7 lg:w-9 lg:h-9" /> */}
          <h2 className="text-[24px] xl:text-[30px] leading-snug font-bold hidden lg:block my-[10px]">
            Native Transfer
          </h2>
        </div>
        <div className="flex w-full md:w-auto justify-between md:justify-center items-stretch md:items-center space-x-[4px] md:space-x-1">
          {(
            Object.keys(timespans).map((timespan) => (
              <button
                key={timespan}
                className={`rounded-full px-[16px] py-[8px] grow text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium ${
                  selectedTimespan === timespan
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedTimespan(timespan);
                  // setXAxis();
                }}
              >
                {timespans[timespan].label}
              </button>
            ))
          )}
        </div>
      </div>


      <div className="flex justify-normal md:justify-start items-center w-full md:w-auto bg-forest-50 dark:bg-[#1F2726] rounded-full p-0.5 mt-8">
              {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
              {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
              {/* toggle ETH */}

              <div className="flex justify-center items-center pl-0 md:pl-0 w-full md:w-auto ">
                <div className="flex justify-between md:justify-center items-center  space-x-[4px] md:space-x-1 mr-0 md:mr-2.5 w-full md:w-auto ">
                  <button
                    className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                      "gasfees" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                      setSelectedScale("gasfees");
                    }}
                  >
                    Gas Fees
                  </button>
                  <button
                    className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base  lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                      "txcount" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                      setSelectedScale("txcount");
                    }}
                  >
                    Transaction Count
                  </button>

                </div>
                
              </div>
            </div>
    </>
  );
};

