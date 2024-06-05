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
import { AllChainsByKeys } from "@/lib/chains";
import { MasterResponse } from "@/types/api/MasterResponse";

interface DAvailability {
  icon: string;
  label: string;
}

export default function ChainBreakdown({
  data,
  master,
}: {
  data: ChainBreakdownResponse;
  master: MasterResponse;
}) {
  const [selectedTimespan, setSelectedTimespan] = useState("max");
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  //
  const [openChain, setOpenChain] = useState(() => {
    const initialState = Object.keys(data).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});
    return initialState;
  });

  const toggleOpenChain = (key) => {
    setOpenChain((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };
  //Handles opening of each chain section
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
      const dataIndex = data[key][selectedTimespan].revenue.types.indexOf(
        showUsd ? "usd" : "eth",
      );
      retValue += data[key][selectedTimespan].revenue.total[dataIndex];
    });

    return retValue;
  }, [selectedTimespan, data, showUsd]);
  //Calculate total revenue for referencing in relative revenue bars

  function dataAvailToArray(x: string): DAvailability[] {
    let retObject: DAvailability[] = [];
    if (typeof x === "string") {
      // Ensure x is a string
      if (x.includes("calldata")) {
        retObject.push({
          icon: "calldata",
          label: "Calldata",
        });
      }

      if (x.includes("blobs")) {
        retObject.push({
          icon: "blobs",
          label: "Blobs",
        });
      }

      if (x.includes("MantleDA")) {
        retObject.push({
          icon: "customoffchain",
          label: "MantleDA",
        });
      }

      if (x.includes("DAC")) {
        retObject.push({
          icon: "committee",
          label: "DAC (committee)",
        });
      }

      if (x.includes("Celestia")) {
        retObject.push({
          icon: "celestiafp",
          label: "Celestia",
        });
      }

      if (x.includes("memo")) {
        retObject.push({
          icon: "memofp",
          label: "Memo",
        });
      }
    }
    return retObject;
  }

  function formatNumber(x: number) {
    return (
      <div className="flex gap-x-0.5 ">
        <span>{showUsd ? "$" : "Ξ"}</span>
        <span>
          {Intl.NumberFormat("en-GB", {
            notation: "compact",
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
          }).format(x)}
        </span>
      </div>
    );
  }

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
          style={{ gridTemplateColumns: "auto 150px 170px 110px 140px" }}
        >
          <div className="pl-[44px] flex grow gap-x-[5px] items-center justify-start  ">
            <div className="flex items-center group ">
              <div className="text-[12px] group-hover:text-forest-50/80 font-bold">
                Chain
              </div>
              <div>
                <Icon
                  icon="formkit:arrowdown"
                  className="dark:text-forest-50 group-hover:text-forest-50/80 text-black w-[10px] h-[10px] "
                />
              </div>
            </div>
            <div className="flex items-center bg-[#344240] gap-x-1 text-[8px] rounded-full px-[5px] py-[2px] ">
              <div>Data Availability: </div>
              <div>SelectedDA </div>
            </div>
          </div>
          <div className="flex items-center justify-end ">
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
          <div className="flex items-center justify-center gap-x-[5px] ">
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
          <div className="flex items-center justify-end gap-x-[5px] pr-[2px]">
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
          <div className="flex items-center justify-end pr-[30px] gap-x-[5px] ">
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
        <div className="flex flex-col gap-y-[5px]">
          {Object.keys(data).map((key, i) => {
            const dataIndex = data[key][selectedTimespan].revenue.types.indexOf(
              showUsd ? "usd" : "eth",
            );
            return (
              <div
                className="flex flex-col gap-y-[5px]"
                key={key + " chainGridParent"}
              >
                <div
                  className="grid relative rounded-full w-full border-[#CDD8D3] border-[1px] h-[34px] text-[14px] items-center"
                  style={{
                    gridTemplateColumns: "auto 150px 170px 110px 140px",
                  }}
                >
                  <div className="flex items-center gap-x-[5px] pl-[10px] ">
                    <Icon
                      icon={`gtp:${AllChainsByKeys[key].urlKey}-logo-monochrome`}
                      className={`w-[22px] h-[24px] flex items-center justify-center text-[10px] mr-[5px]`}
                      style={{
                        color: AllChainsByKeys[key].colors["dark"][0],
                      }}
                    />

                    <div>{AllChainsByKeys[key].label}</div>

                    {dataAvailToArray(master.chains[key].da_layer).map((x) => (
                      <div
                        className="flex items-center bg-[#344240] gap-x-1 h-[18px] text-[14px] rounded-full px-[5px] py-[3px]"
                        key={x.label}
                      >
                        <div>{x.label}</div>
                        <div className="flex items-center gap-x-1">
                          <Icon
                            icon={`gtp:${x.icon}`}
                            className="w-[12px] h-[12px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-x-[5px]  ">
                    <div className="">
                      {formatNumber(
                        data[key][selectedTimespan].revenue.total[dataIndex],
                      )}
                    </div>
                    <div
                      className={`w-[82px] rounded-full bg-[${AllChainsByKeys[key].colors["dark"][0]}]`}
                    >
                      &nbsp;
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
                  <div
                    className="absolute -right-2 hover:cursor-pointer"
                    onClick={() => {
                      toggleOpenChain(key);
                    }}
                  >
                    <div className="flex relative items-center justify-center w-[22px] h-[22px] bg-[#1F2726] rounded-full">
                      <div
                        className={`absolute w-[18px] h-[18px]  rounded-full border-[1px] ${
                          openChain[key]
                            ? "border-[#CDD8D3]"
                            : "border-[#5A6462]"
                        }`}
                      ></div>
                      <Icon
                        icon="feather:chevron-down"
                        className={`w-4 h-4  ${
                          openChain[key] ? "text-[#CDD8D3]" : "text-[#5A6462]"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/*Chart Area \/ */}
                <div
                  className={`w-full transition-height  ${
                    openChain[key] ? "h-[249px]" : "h-[0px]"
                  }`}
                ></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
