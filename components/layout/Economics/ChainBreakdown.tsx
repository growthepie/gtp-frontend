"use client";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Heading from "@/components/layout/Heading";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { ChainBreakdownResponse } from "@/types/api/EconomicsResponse";
import { useLocalStorage } from "usehooks-ts";

export default function ChainBreakdown({
  data,
}: {
  data: ChainBreakdownResponse;
}) {
  const [selectedTimespan, setSelectedTimespan] = useState("max");
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const timespans = useMemo(() => {
    return {
      "1d": {
        label: "1d",
        value: 1,
      },
      "7d": {
        label: "7d",
        value: 7,
        xMin: Date.now() - 7 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "30d": {
        label: "30d",
        value: 30,
        xMin: Date.now() - 30 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "90d": {
        label: "90d",
        value: 90,
      },
      "180d": {
        label: "180d",
        value: 180,
      },

      max: {
        label: "Max",
        value: 0,
      },
    };
  }, []);

  const totalRevenue = useMemo(() => {
    let retValue = 0;
    //Loop through for each chain
    Object.keys(data).forEach((key) => {
      let dataIndex = data[key][selectedTimespan].revenue.types.indexOf(
        showUsd ? "usd" : "eth",
      );
      retValue += data[key][selectedTimespan].revenue.total[dataIndex];
    });

    return retValue;
  }, [selectedTimespan, data, showUsd]);
  //Calculate total revenue for referencing in relative revenue bars

  return (
    <div>
      <div className="flex flex-col gap-y-[15px] ">
        <div className="flex justify-between items-center">
          <div className="flex items-center  gap-x-[8px]">
            <Image
              src="/GTP-Fundamentals.svg"
              alt="GTP Chain"
              className="object-contain w-[32px] h-[32px] "
              height={36}
              width={36}
            />
            <Heading className="text-[30px] leading-snug " as="h1">
              Chain Breakdown
            </Heading>
          </div>
          <div className="bg-[#1F2726] flex text-[12px] w-[249px] rounded-2xl justify-between p-[2px]">
            {Object.keys(timespans).map((key) => {
              {
                return (
                  <div
                    className={`px-[10px] py-[5px] flex items-center gap-x-[3px] justify-center min-w-[40px] rounded-full hover:cursor-pointer ${
                      selectedTimespan === key
                        ? "bg-[#151A19]"
                        : "bg-transparent hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                      setSelectedTimespan(key);
                    }}
                  >
                    {timespans[key].label}
                  </div>
                );
              }
            })}
          </div>
        </div>
        <div
          className="grid "
          style={{ gridTemplateColumns: "39% 18% 16% 15% 11%" }}
        >
          <div className="pl-[44px] flex gap-x-[5px] items-center justify-start ">
            <div className="flex items-center group ">
              <div className="text-[12px] group-hover:text-forest-50/80 font-bold">
                Chain
              </div>
              <div>
                <Icon
                  icon="formkit:arrowdown"
                  className="dark:text-forest-50 group-hover:text-forest-50/80 text-black w-[10px] h-[10px]"
                />
              </div>
            </div>
            <div className="flex items-center bg-[#344240] gap-x-1 text-[8px] rounded-full px-[5px] py-[2px]">
              <div>Data Availability: </div>
              <div>SelectedDA </div>
            </div>
          </div>
          <div className="flex items-center justify-end">
            {" "}
            <div className="flex items-center group ">
              <div className="text-[12px] group-hover:text-forest-50/80 font-bold">
                Revenue
              </div>
              <div>
                <Icon
                  icon="formkit:arrowdown"
                  className="dark:text-forest-50 group-hover:text-forest-50/80 text-black w-[10px] h-[10px]"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-x-[5px]">
            {" "}
            <div className="flex items-center group ">
              <div className="text-[12px] group-hover:text-forest-50/80 font-bold">
                Costs
              </div>
              <div>
                <Icon
                  icon="formkit:arrowdown"
                  className="dark:text-forest-50 group-hover:text-forest-50/80 text-black w-[10px] h-[10px]"
                />
              </div>
            </div>
            <div className="flex items-center gap-x-[1.5px] text-[8px] w-[110px]">
              <div className="flex justify-center items-center rounded-l-full bg-[#344240] w-[54px] px-[5px] py-[2px] ">
                <div className=" group-hover:text-forest-50/80 ">L1 Fees</div>
                <div>
                  <Icon
                    icon="formkit:arrowdown"
                    className="dark:text-forest-50 group-hover:text-forest-50/80 text-black w-[8px] h-[8px]"
                  />
                </div>
              </div>
              <div className="flex justify-center items-center rounded-r-full bg-[#344240] w-[54px] px-[5px] py-[2px] ">
                <div className=" group-hover:text-forest-50/80 ">DA Cost</div>
                <div>
                  <Icon
                    icon="formkit:arrowdown"
                    className="dark:text-forest-50 group-hover:text-forest-50/80 text-black w-[8px] h-[8px]"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-x-[5px]">
            {" "}
            <div className="flex items-center group ">
              <div className="text-[12px] group-hover:text-forest-50/80 font-bold">
                Profit
              </div>
              <div>
                <Icon
                  icon="formkit:arrowdown"
                  className="dark:text-forest-50 group-hover:text-forest-50/80 text-black w-[10px] h-[10px]"
                />
              </div>
            </div>
            <div className="flex items-center bg-[#344240] gap-x-1 text-[8px] rounded-full px-[5px] py-[2px]">
              <div>Margin </div>
              <Icon
                icon="formkit:arrowdown"
                className="dark:text-forest-50 group-hover:text-forest-50/80 text-black w-[10px] h-[10px]"
              />
            </div>
          </div>
          <div className="flex items-center justify-end pr-[30px] gap-x-[5px]">
            {" "}
            <div className="flex items-center group ">
              <div className="text-[12px] group-hover:text-forest-50/80 font-bold">
                {"Blob Sizes(Max)"}
              </div>
              <div>
                <Icon
                  icon="formkit:arrowdown"
                  className="dark:text-forest-50 group-hover:text-forest-50/80 text-black w-[10px] h-[10px]"
                />
              </div>
            </div>
          </div>
          {/*END TOP ROW */}
          {/*END TOP ROW */}
          {/*END TOP ROW */}
        </div>
        <div
          className="grid rounded-full w-full border-[#CDD8D3] border-[1px] h-[34px] text-[14px] items-center"
          style={{ gridTemplateColumns: "39% 18% 16% 15% 11%" }}
        >
          <div className="flex items-center gap-x-[5px] pl-[12.5px] ">
            <div className="w-[24px] h-[24px] rounded-full bg-white text-black flex items-center  justify-center text-[10px]">
              Icon
            </div>
            <div>Chain Name</div>
            <div className="flex items-center bg-[#344240] gap-x-1 h-[18px] text-[14px] rounded-full px-[5px] py-[3px]">
              <div>Icon</div>
              <div>Blobs</div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-x-[5px] ">
            <div className="">{"Revenue$"}</div>
            <div className="w-[82px] rounded-full bg-milano-red-400 ">
              {"num"}
            </div>
          </div>
          <div className="flex items-center justify-center gap-x-[5px]">
            <div>$Costs</div>
            <div className="flex w-[98px] gap-x-[1px] items-center text-[8px]">
              <div className="bg-[#FD0F2C] w-[78px] flex items-center justify-start font-bold rounded-l-full pl-[5px] py-[2px]">
                L1 Proof
              </div>
              <div className="bg-[#FE5468] w-[19px] rounded-r-full flex items-center font-bold  justify-end  pr-[5px] py-[2px]">
                DA
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-x-[5px]">
            <div>Profit$</div>
            <div className="w-[82px] rounded-full bg-cyan-600 flex justify-end items-center px-[5px] ">
              {"%"}
            </div>
          </div>
          <div className="flex items-center justify-end pr-[35px] gap-x-[5px]">
            Data GB
          </div>
        </div>
      </div>
    </div>
  );
}
