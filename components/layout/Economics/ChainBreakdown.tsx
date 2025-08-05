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
import { ChainBreakdownResponse, ChainBreakdownData } from "@/types/api/EconomicsResponse";
import BreakdownCharts from "@/components/layout/Economics/BreakdownCharts";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { MasterResponse } from "@/types/api/MasterResponse";
import { sortByDataAvailability } from "./SortHelpers";
import { useTransition, animated } from "@react-spring/web";
import { set, times } from "lodash";
import { useUIContext } from "@/contexts/UIContext";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";

import Container from "../Container";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/layout/Tooltip";
import { useMaster } from "@/contexts/MasterContext";
import Link from "next/link";

const regularMetrics = ["profit", "revenue", "costs", "size", "profit_margin"];
interface DAvailability {
  icon: string;
  label: string;
}
//prettier-ignore
type MetricSort = "revenue" | "profit" | "chain" | "costs" | "costs_l1" | "costs_blobs" | "profit_margin" | "size";

export default function ChainBreakdown({
  data,
  master,
  selectedTimespan,
  setSelectedTimespan,
  isMonthly,
  setIsMonthly,
  totals,
}: {
  data: ChainBreakdownResponse;
  master: MasterResponse;
  selectedTimespan: string;
  setSelectedTimespan: (value: string) => void;
  isMonthly: boolean;
  setIsMonthly: (value: boolean) => void;
  totals: ChainBreakdownData;
}) {
  const { AllChainsByKeys } = useMaster();
 
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [DAIndex, setDAIndex] = useState(0);
  const [metricSort, setMetricSort] = useState<MetricSort>("revenue");
  const [enableDASort, setEnableDASort] = useState(false);
  const [sortOrder, setSortOrder] = useState(true);
  const [isBouncing, setIsBouncing] = useState(false);
  const [bounceChain, setBounceChain] = useState("");
  const { isSidebarOpen } = useUIContext();
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const triggerShrink = useMediaQuery("(max-width: 1120px)");


  // console.log(metricSort);

  const [openChain, setOpenChain] = useState(() => {
    const initialState = Object.keys(data).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});
    return initialState;
  });

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

      if (x.includes("EigenDA")) {
        retObject.push({
          icon: "da-eigenda-logo-monochrome",
          label: "EigenDA",
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

  function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
  const toggleOpenChain = (key) => {
    setOpenChain((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };

  const handleClick = (e, chain) => {
    if (selectedTimespan === "1d") {
      setIsBouncing(true);
      setBounceChain(chain);
      setTimeout(() => setIsBouncing(false), 1000); // Duration of the bounce animation
    } else {
      toggleOpenChain(chain);
      e.stopPropagation();
    }
  };

  const dataTimestampExtremes = useMemo(() => {
    let xMin = Infinity;
    let xMax = -Infinity;

    Object.keys(data).forEach((chain) => {
      regularMetrics.forEach((metric) => {
        if (!data[chain].daily[metric]) return;
        const min = data[chain].daily[metric].data[0][0];
        const max =
          data[chain].daily[metric].data[
          data[chain].daily[metric].data.length - 1
          ][0];

        xMin = Math.min(min, xMin);
        xMax = Math.max(max, xMax);
      });
    });

    return { xMin, xMax };
  }, [data]);

  //Handles opening of each chain section
  const timespans = useMemo(() => {
    let xMin = dataTimestampExtremes.xMin;
    let xMax = dataTimestampExtremes.xMax;

    if (!isMonthly) {
      return {
        "1d": {
          shortLabel: "1d",
          label: "1 day",
          value: 1,
        },
        "7d": {
          shortLabel: "7d",
          label: "7 days",
          value: 7,
          xMin: xMax - 7 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "30d": {
          shortLabel: "30d",
          label: "30 days",
          value: 30,
          xMin: xMax - 30 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "90d": {
          shortLabel: "90d",
          label: "90 days",
          value: 90,
          xMin: xMax - 90 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "365d": {
          shortLabel: "1y",
          label: "1 year",
          value: 365,
          xMin: xMax - 365 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },

        max: {
          shortLabel: "Max",
          label: "Max",
          value: 0,
          xMin: xMin,
          xMax: xMax,
        },
      };
    } else {
      return {
        "180d": {
          shortLabel: "6m",
          label: "6 months",
          value: 90,
          xMin: xMax - 180 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "365d": {
          shortLabel: "1y",
          label: "1 year",
          value: 365,
          xMin: xMax - 365 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },

        max: {
          shortLabel: "Max",
          label: "Max",
          value: 0,
          xMin: xMin,
          xMax: xMax,
        },
      };
    }
  }, [dataTimestampExtremes.xMax, dataTimestampExtremes.xMin, isMonthly]);

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

  const totalProfit = useMemo(() => {
    let retValue = 0;
    //Loop through for each chain
    Object.keys(data).forEach((key) => {
      const dataIndex = data[key][selectedTimespan].profit.types.indexOf(
        showUsd ? "usd" : "eth",
      );

      retValue += data[key][selectedTimespan].profit.total[dataIndex];
    });

    return retValue;
  }, [selectedTimespan, data, showUsd]);

  //Total profit

  const largestProfit = useMemo(() => {
    let retValue = 0;
    //Loop through for each chain
    Object.keys(data).forEach((key) => {
      const dataIndex = data[key][selectedTimespan].profit.types.indexOf(
        showUsd ? "usd" : "eth",
      );

      retValue =
        data[key][selectedTimespan].profit.total[dataIndex] > retValue
          ? data[key][selectedTimespan].profit.total[dataIndex]
          : retValue;
    });

    return retValue;
  }, [selectedTimespan, data, showUsd]);

  //Largest profit data point

  const allChainsDA = useMemo(() => {
    let retArray = [""];

    Object.keys(data).forEach((key) => {
      let keyDA = dataAvailToArray(master.chains[key].da_layer);
      keyDA.forEach((element) => {
        if (!retArray.includes(element.label)) {
          retArray.push(element.label);
        }
      });
    });

    return retArray;
  }, [data, master]);
  //Get an array of potential data availabilities for this page

  const maxRevenue = useMemo(() => {
    let retValue = 0;
    //Loop through for each chain
    Object.keys(data).forEach((key) => {
      const dataIndex = data[key][selectedTimespan].revenue.types.indexOf(
        showUsd ? "usd" : "eth",
      );

      retValue =
        data[key][selectedTimespan].revenue.total[dataIndex] > retValue
          ? data[key][selectedTimespan].revenue.total[dataIndex]
          : retValue;
    });

    return retValue;
  }, [selectedTimespan, data, showUsd]);

  function formatNumber(x: number) {
    return (
      <div className="flex ">
        <span>{showUsd ? "$" : "Ξ"}</span>
        <span>
          {Intl.NumberFormat("en-GB", {
            notation: "compact",
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          }).format(x).replace(/K/g, "k")}
        </span>
      </div>
    );
  }

  // console.log(data ? data : "");
  const sortedChainData = useMemo(() => {
    let retData: string[];
    if (metricSort !== "chain") {
      if (regularMetrics.includes(metricSort)) {
        retData = Object.keys(data).sort((a, b) => {
          const dataIndex =
            metricSort === "profit_margin" || metricSort === "size"
              ? 0
              : data[a][selectedTimespan].revenue.types.indexOf(
                showUsd ? "usd" : "eth",
              );
          const aComp = data[a][selectedTimespan][metricSort].total[dataIndex];

          const bComp = data[b][selectedTimespan][metricSort].total[dataIndex];

          if (aComp > bComp) return -1;
          if (aComp < bComp) return 1;

          // If aComp and bComp are equal, maintain the existing order
          return 0;
        });
      } else {
        retData = Object.keys(data).sort((a, b) => {
          const dataIndex = data[a][selectedTimespan].revenue.types.indexOf(
            showUsd ? "usd" : "eth",
          );

          const aComp =
            data[a][selectedTimespan].costs[metricSort][dataIndex] /
            data[a][selectedTimespan].costs.total[dataIndex];
          const bComp =
            data[b][selectedTimespan].costs[metricSort][dataIndex] /
            data[b][selectedTimespan].costs.total[dataIndex];

          if (aComp > bComp) return -1;
          if (aComp < bComp) return 1;

          // If aComp and bComp are equal, maintain the existing order
          return 0;
        });
      }
    } else {
      retData = Object.keys(data).sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;

        // If a and b are equal, maintain the existing order
        return 0;
      });
    }

    if (enableDASort) {
      retData = sortByDataAvailability(
        data,
        master,
        allChainsDA[DAIndex],
        retData,
      );
    }

    return retData.reduce((acc, key) => {
      if (data[key] !== undefined) {
        acc[key] = data[key];
      }
      return acc;
    }, {});
  }, [
    data,
    master,
    DAIndex,
    allChainsDA,
    metricSort,
    selectedTimespan,
    isMonthly,
  ]);

  const transitions = useTransition(
    (sortOrder
      ? Object.keys(sortedChainData)
      : Object.keys(sortedChainData).reverse()
    ).map((key, index) => {
      let prevOpenCharts: number = 0;
      if (selectedTimespan !== "1d") {
        (sortOrder
          ? Object.keys(sortedChainData)
          : Object.keys(sortedChainData).reverse()
        ).map((localKey, localIndex) => {
          if (localIndex >= index) return;

          if (openChain[localKey]) {
            prevOpenCharts += 1;
          }
        });
      }
      return {
        y: index * 39 + prevOpenCharts * 387,
        height: 39 + (openChain[key] ? 387 : 0),
        key: key, // Assuming `chain` is used as a key
        i: index,
      };
    }),
    {
      key: (d) => d.key,
      from: { height: 0 },
      leave: { height: 0 },
      enter: ({ y, height }) => ({ y, height }),
      update: ({ y, height }) => ({ y, height }), // Ensure height change is animated
      config: { mass: 5, tension: 500, friction: 100 },
      trail: 25,
    },
  );

  const columnBorder = useCallback(
    (metric, key) => {
      const isOpen = openChain[key];
      const openDark =
        metric === "revenue" || metric === "profit" || metric === "size";
      const openLight =
        metric === "chain" || metric === "costs" || metric === "margin";

      if (isOpen) {
        if (openLight) {
          return (
            "border-[#CDD8D3] border-y-[1px]" +
            (metric === "chain" ? " border-l-[1px] rounded-l-full" : "")
          );
        } else if (openDark) {
          return (
            "border-[#CDD8D399] border-y-[1px]" +
            (metric === "size" ? " border-r-[1px] rounded-r-full" : "")
          );
        }
      } else {
        return (
          "border-[#5A6462] border-y-[1px]" +
          (metric === "chain"
            ? " border-l-[1px] rounded-l-full"
            : metric === "size"
              ? " border-r-[1px] rounded-r-full"
              : "")
        );
      }
      //"border-[#CDD8D3] bg-forest-950 border-r-[#5A6462]"
      //"border-[#5A6462]
    },
    [openChain],
  );

  const minimumHeight = useMemo(() => {
    let retHeight: number = 39;
    Object.keys(data).map((key) => {
      retHeight += 39;
      retHeight += openChain[key] && selectedTimespan !== "1d" ? 387 : 0;
    });

    return retHeight;
  }, [openChain, data, selectedTimespan]);





  // console.log(allChainsDA);

  return (
    <div className="h-full">
      {/* <div>xMax {new Date(timespans[selectedTimespan].xMax).toDateString()}</div>
      <div>xMin {new Date(timespans[selectedTimespan].xMin).toDateString()}</div> */}
      {sortedChainData && (
        <div className="flex flex-col mb-[30px]">

          <HorizontalScrollContainer
            includeMargin={true}
            className="w-full flex flex-col "
          >
            <div
              className={`grid  pr-0.5 grid-cols-[auto_200px_200px_170px_145px_110px] mb-[15px]  ${isSidebarOpen
                ? " 2xl:grid-cols-[auto_200px_200px_170px_145px_110px] grid-cols-[auto_170px_180px_170px_145px_110px] "
                : "xl:grid-cols-[auto_200px_200px_170px_145px_110px] grid-cols-[auto_170px_180px_170px_145px_110px] "
                } min-w-[1125px]`}
            >
              <div className="pl-[44px] flex grow gap-x-[5px] items-center justify-start ">
                <div
                  className="flex items-center group cursor-pointer  "
                  onClick={() => {
                    if (metricSort !== "chain") {
                      setSortOrder(true);
                      setMetricSort("chain");
                    } else {
                      setSortOrder(!sortOrder);
                    }
                  }}
                >
                  <div className="text-xs group-hover:text-forest-50/80 font-bold">
                    Chain
                  </div>
                  <div>
                    <Icon
                      icon={
                        metricSort !== "chain"
                          ? "formkit:arrowdown"
                          : sortOrder
                            ? "formkit:arrowdown"
                            : "formkit:arrowup"
                      }
                      className={` w-[10px] h-[10px] ${metricSort === "chain"
                        ? "text-forest-50 opacity-100"
                        : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                        } `}
                    />
                  </div>
                </div>
                <div
                  className="flex items-center bg-[#344240] gap-x-1 text-xxs rounded-full px-[5px] py-[2px] cursor-pointer"
                  onClick={() => {
                    setEnableDASort(true);
                    if (DAIndex === allChainsDA.length - 1) {
                      setEnableDASort(false);
                      setDAIndex(0);
                    } else {
                      setDAIndex(DAIndex + 1);
                    }
                  }}
                >
                  <div>Data Availability{DAIndex !== 0 ? ":" : ""}</div>
                  <div>{allChainsDA[DAIndex]}</div>

                  <Icon
                    icon={"feather:x-circle"}
                    className={` dark:text-white text-black w-[10px] -ml-0.5 h-[10px] relative bottom-[0.5px] cursor-pointer ${DAIndex !== 0 ? "block" : "hidden"
                      }`}
                    onClick={(e) => {
                      setDAIndex(0);
                      setEnableDASort(false);
                      e.stopPropagation();
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end pr-[5px] ">
                {" "}
                <div
                  className="flex items-center group gap-x-[1px] cursor-pointer"
                  onClick={() => {
                    if (metricSort !== "revenue") {
                      setSortOrder(true);
                      setMetricSort("revenue");
                    } else {
                      setSortOrder(!sortOrder);
                    }
                  }}
                >
                  <div className="text-xs group-hover:text-forest-50/80 font-bold">
                    Chain Revenue
                  </div>

                  <div>
                    <Icon
                      icon={
                        metricSort !== "revenue"
                          ? "formkit:arrowdown"
                          : sortOrder
                            ? "formkit:arrowdown"
                            : "formkit:arrowup"
                      }
                      className={` w-[10px] h-[10px] ${metricSort === "revenue"
                        ? "text-forest-50 opacity-100"
                        : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                        } `}
                    />
                  </div>
                  <Tooltip key={"revenue"} placement="right">
                    <TooltipTrigger>
                      <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-x-[10px] pl-1.5 pr-3 py-2 text-xs bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto max-w-[280px] font-normal transition-all duration-300">
                          <div className="flex flex-col gap-y-[5px] items-center">
                            <div className="flex items-center gap-x-[5px] text-xxs">
                              The sum of fees that were paid by users of the
                              chain in gas fees.
                            </div>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-center justify-end pr-[5px] gap-x-[5px]">
                {" "}
                <div className="flex items-center group gap-x-[1px]">
                  <div
                    className="text-xs group-hover:text-forest-50/80 font-bold cursor-pointer"
                    onClick={() => {
                      if (metricSort !== "costs") {
                        setSortOrder(true);
                        setMetricSort("costs");
                      } else {
                        setSortOrder(!sortOrder);
                      }
                    }}
                  >
                    Costs
                  </div>
                  <div>
                    <Icon
                      icon={
                        metricSort !== "costs"
                          ? "formkit:arrowdown"
                          : sortOrder
                            ? "formkit:arrowdown"
                            : "formkit:arrowup"
                      }
                      className={` w-[10px] h-[10px] ${metricSort === "costs"
                        ? "text-forest-50 opacity-100"
                        : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                        } `}
                    />
                  </div>
                  <Tooltip key={"costs"} placement="right">
                    <TooltipTrigger>
                      <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-x-[10px] pl-1.5 pr-3 py-2 text-xs bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto max-w-[280px] font-normal transition-all duration-300">
                          <div className="flex flex-col gap-y-[5px] items-center">
                            <div className="flex items-center gap-x-[5px] text-xs ">
                              The chains onchain expenses. L1 costs are gas fees
                              paid to Ethereum for posting proofs, states, and
                              pointing to Blobs. Blob costs are fees paid for
                              data storage in Blobs (i.e. EIP4844 or Celestia
                              Blobs).
                            </div>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center  gap-x-[1.5px] text-xxxs w-[104px] h-[16px] cursor-pointer">
                  <div className="flex justify-center group items-center rounded-l-full border-[2px] border-r-[0px] border-[#D03434] w-[72px] px-[5px]  ">
                    <div
                      className=" group-hover:text-forest-50/80 whitespace-nowrap"
                      onClick={() => {
                        if (metricSort !== "costs_l1") {
                          setSortOrder(true);
                          setMetricSort("costs_l1");
                        } else {
                          setSortOrder(!sortOrder);
                        }
                      }}
                    >
                      L1 Costs
                    </div>
                    <div>
                      <Icon
                        icon={
                          metricSort !== "costs_l1"
                            ? "formkit:arrowdown"
                            : sortOrder
                              ? "formkit:arrowdown"
                              : "formkit:arrowup"
                        }
                        className={` w-[10px] h-[10px] ${metricSort === "costs_l1"
                          ? "text-forest-50 opacity-100"
                          : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                          } `}
                      />
                    </div>
                  </div>
                  <div
                    className="flex justify-center group items-center rounded-r-full border-[2px] border-l-[0px] border-[#FE5468] w-[47px] px-[5px] cursor-pointer "
                    onClick={() => {
                      if (metricSort !== "costs_blobs") {
                        setSortOrder(true);
                        setMetricSort("costs_blobs");
                      } else {
                        setSortOrder(!sortOrder);
                      }
                    }}
                  >
                    <div className=" group-hover:text-forest-50/80 ">Blobs</div>
                    <div>
                      <Icon
                        icon={
                          metricSort !== "costs_blobs"
                            ? "formkit:arrowdown"
                            : sortOrder
                              ? "formkit:arrowdown"
                              : "formkit:arrowup"
                        }
                        className={` w-[10px] h-[10px] ${metricSort === "costs_blobs"
                          ? "text-forest-50 opacity-100"
                          : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                          } `}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-x-[5px] pl-[30.5px]">
                {" "}
                <div
                  className="flex items-center group cursor-pointer"
                  onClick={() => {
                    if (metricSort !== "profit") {
                      setSortOrder(true);
                      setMetricSort("profit");
                    } else {
                      setSortOrder(!sortOrder);
                    }
                  }}
                >
                  <div className="text-xs group-hover:text-forest-50/80 font-bold">
                    Loss | Profit
                  </div>
                  <div>
                    <Icon
                      icon={
                        metricSort !== "profit"
                          ? "formkit:arrowdown"
                          : sortOrder
                            ? "formkit:arrowdown"
                            : "formkit:arrowup"
                      }
                      className={` w-[10px] h-[10px] ${metricSort === "profit"
                        ? "text-forest-50 opacity-100"
                        : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                        } `}
                    />
                  </div>
                  <Tooltip key={"profit"} placement="right">
                    <TooltipTrigger>
                      <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-x-[10px] pl-1.5 pr-3 py-2 text-xs bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto max-w-[280px] font-normal transition-all duration-300">
                          <div className="flex flex-col gap-y-[5px] items-center">
                            <div className="flex items-center gap-x-[5px] text-xs ">
                              The chains total revenue minus its costs.
                            </div>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div
                className="flex items-center justify-end pr-[5px]  gap-x-[5px] pl-[2px] cursor-pointer"
                onClick={() => {
                  if (metricSort !== "profit_margin") {
                    setSortOrder(true);
                    setMetricSort("profit_margin");
                  } else {
                    setSortOrder(!sortOrder);
                  }
                }}
              >
                {" "}
                <div className="flex items-center group gap-x-[1px] ">
                  <div className="text-xs group-hover:text-forest-50/80 font-bold">
                    Margin
                  </div>
                  <div>
                    <Icon
                      icon={
                        metricSort !== "profit_margin"
                          ? "formkit:arrowdown"
                          : sortOrder
                            ? "formkit:arrowdown"
                            : "formkit:arrowup"
                      }
                      className={` w-[10px] h-[10px] ${metricSort === "profit_margin"
                        ? "text-forest-50 opacity-100"
                        : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                        } `}
                    />
                  </div>
                  <Tooltip key={"profit"} placement="right">
                    <TooltipTrigger>
                      <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-x-[10px] pl-1.5 pr-3 py-2 text-xs bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto max-w-[280px] font-normal transition-all duration-300">
                          <div className="flex flex-col gap-y-[5px] items-center">
                            <div className="flex items-center gap-x-[5px] text-xxs ">
                              The profit margin of the chain calculated as
                              (Revenue - Costs) / Revenue
                            </div>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div
                className="flex items-center group gap-x-[1px] justify-end cursor-pointer pr-[8px]"
                onClick={() => {
                  if (metricSort !== "size") {
                    setSortOrder(true);
                    setMetricSort("size");
                  } else {
                    setSortOrder(!sortOrder);
                  }
                }}
              >
                <div className="text-xs group-hover:text-forest-50/80 font-bold">
                  {"Blob Data"}
                </div>
                <div>
                  <Icon
                    icon={
                      metricSort !== "size"
                        ? "formkit:arrowdown"
                        : sortOrder
                          ? "formkit:arrowdown"
                          : "formkit:arrowup"
                    }
                    className={` w-[10px] h-[10px] ${metricSort === "size"
                      ? "text-forest-50 opacity-100"
                      : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                      } `}
                  />
                </div>
                <Tooltip key={"margin"} placement="right">
                  <TooltipTrigger>
                    <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-x-[10px] pl-1.5 pr-3 py-2 text-xs bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto max-w-[280px] font-normal transition-all duration-300">
                        <div className="flex flex-col gap-y-[5px] items-center">
                          <div className="flex items-center gap-x-[5px] text-xxs ">
                            The total amount of data that is stored in Blobs.
                          </div>
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              {/*END TOP ROW */}
              {/*END TOP ROW */}
              {/*END TOP ROW */}
            </div>
            <div
              className={`relative flex flex-col -mt-[5px] min-w-[1125px] z-0 transition-height duration-500 `}
              style={{ height: minimumHeight }}
            >
              {transitions((style, item) => {
                const dataIndex = data[item.key][
                  selectedTimespan
                ].revenue.types.indexOf(showUsd ? "usd" : "eth");
                const localDataAvail = dataAvailToArray(
                  master.chains[item.key].da_layer,
                )[0];
               

                // console.log(((data[item.key][selectedTimespan].revenue
                //   .total[dataIndex]) /
                // maxRevenue) + " " + item.key);

                return (
                  <animated.div
                    className={`absolute w-full flex flex-col pr-0.5  ${enableDASort
                      ? allChainsDA[DAIndex] === localDataAvail.label
                        ? "opacity-100"
                        : "opacity-50"
                      : "opacity-100"
                      }`}
                    key={item.key + " chainGridParent"}
                    style={{ ...style }}
                  >
                    <div
                      className={`grid  relative rounded-full w-full  min-h-[34px] text-sm items-center z-20 cursor-pointer pr-0.5 grid-cols-[auto_200px_200px_170px_145px_110px] min-w-[1000px] 
                        ${isBouncing && bounceChain === item.key
                          ? "horizontal-bounce"
                          : ""
                        } ${isSidebarOpen
                          ? " 2xl:grid-cols-[auto_200px_200px_170px_145px_110px] grid-cols-[auto_170px_180px_170px_145px_110px] "
                          : "xl:grid-cols-[auto_200px_200px_170px_145px_110px] grid-cols-[auto_170px_180px_170px_145px_110px] "
                        }`}
                      onClick={(e) => {
                        handleClick(e, item.key);
                        e.stopPropagation();
                      }}
                    >
                      <div
                        className={`flex items-center gap-x-[10px] pl-[5px] h-full ${columnBorder(
                          "chain",
                          item.key,
                        )} `}
                      >
                        <div
                          className="relative flex items-center justify-center rounded-full w-[26px] h-[26px] bg-[#151A19] cursor-pointer"
                          onClick={(e) => {
                            handleClick(e, item.key);
                            e.stopPropagation();
                          }}
                        >
                          <Icon
                            icon={`gtp:${AllChainsByKeys[item.key].urlKey
                              }-logo-monochrome`}
                            className={`w-[15px] h-[15px] flex items-center justify-center text-xxs`}
                            style={{
                              color:
                                AllChainsByKeys[item.key].colors["dark"][0],
                            }}
                          />
                          <Icon
                            icon={"gtp:circle-arrow"}
                            className={`w-[4px] h-[9px] absolute top-[9px] right-0 ${selectedTimespan !== "1d" ? "visible" : "hidden"}`}
                            style={{
                              transform: `rotate(${openChain[item.key] && selectedTimespan !== "1d"
                                ? "90deg"
                                : "0deg"
                                })`,
                              transformOrigin: "-9px 4px",
                              transition: "transform 0.5s",
                            }}
                          />
                        </div>

                        <div>
                          <Link
                            className="hover:underline whitespace-nowrap"
                            href={`/chains/${AllChainsByKeys[item.key].urlKey
                              }`}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            {triggerShrink
                              ? master.chains[item.key].name_short
                              : AllChainsByKeys[item.key].label}
                          </Link>
                        </div>

                        <div
                          className="flex items-center bg-[#344240] gap-x-1 h-[18px] text-xxs rounded-full px-[6px] py-[3px]"
                          key={localDataAvail.label}
                          onClick={(e) => {
                            if (
                              DAIndex ===
                              allChainsDA.indexOf(localDataAvail.label)
                            ) {
                              setEnableDASort(false);
                              setDAIndex(0);
                              e.stopPropagation();
                              return;
                            } else {
                              setEnableDASort(true);
                              //setDAIndex()
                              setDAIndex(
                                allChainsDA.indexOf(localDataAvail.label),
                              );
                              e.stopPropagation();
                            }
                          }}
                        >
                          <div className="flex items-center gap-x-1">
                            <Icon
                              icon={`gtp:${localDataAvail.icon}`}
                              className="w-[12px] h-[12px]"
                            />
                          </div>
                          <div>{localDataAvail.label}</div>
                        </div>
                      </div>
                      <div
                        className={`relative flex items-center  justify-start gap-x-[5px] h-full px-[10px] bg-[#34424044] ${columnBorder(
                          "revenue",
                          item.key,
                        )}`}
                      >
                        <div className="w-[60px] flex justify-end numbers-xs">
                          <div
                            className="numbers-xs"

                          >
                            {formatNumber(
                              data[item.key][selectedTimespan].revenue.total[
                              dataIndex
                              ],
                            )}
                          </div>
                        </div>
                        <div
                          className={` w-[120px] flex justify-start items-end pb-[6px] h-full ${isSidebarOpen ? "2xl:w-[125px]" : "xl:w-[125px]"
                            }`}
                        >
                          <div
                            className={`w-[120px] flex items-center justify-center rounded-full h-[4px] bg-[#1DF7EF]`}
                            style={{
                              width: `${(100 *
                                data[item.key][selectedTimespan].revenue
                                  .total[dataIndex]) /
                                maxRevenue
                                }%`,

                              minWidth: `4px`,
                            }}
                          >
                            &nbsp;
                          </div>
                        </div>
                      </div>
                      <div
                        className={`flex items-center justify-center gap-x-[5px]  h-full ${columnBorder(
                          "costs",
                          item.key,
                        )}`}
                      >
                        <div
                          className="w-[65px] flex justify-end items-center h-full numbers-xs"
                        >
                          {formatNumber(
                            data[item.key][selectedTimespan].costs.total[
                            dataIndex
                            ],
                          )}
                        </div>
                        <div className="flex flex-col justify-end pb-[6px] w-[120px] h-full">
                          <div className="flex w-full justify-between h-[15px] numbers-xxs">
                            <div className="flex gap-x-[0.5px] ">
                              <span
                              >
                                {Intl.NumberFormat("en-GB", {
                                  notation: "compact",
                                  maximumFractionDigits: 1,
                                  minimumFractionDigits: 1,
                                }).format(
                                  (data[item.key][selectedTimespan].costs
                                    .costs_l1[dataIndex] /
                                    data[item.key][selectedTimespan].costs
                                      .total[dataIndex]) *
                                  100,
                                )}
                              </span>
                              <span>{"%"}</span>
                            </div>
                            <div
                            >
                              {Intl.NumberFormat("en-GB", {
                                notation: "compact",
                                maximumFractionDigits: 1,
                                minimumFractionDigits: 1,
                              }).format(
                                (data[item.key][selectedTimespan].costs
                                  .costs_blobs[dataIndex] /
                                  data[item.key][selectedTimespan].costs.total[
                                  dataIndex
                                  ]) *
                                100,
                              )}
                              {"%"}
                            </div>
                          </div>
                          <div className="flex justify-start w-full items-end text-xxxs ">
                            <div
                              className="bg-[#D03434] flex items-center justify-start font-bold rounded-l-full pl-[5px] h-[4px] "
                              style={{
                                width: `${100 *
                                  (data[item.key][selectedTimespan].costs
                                    .costs_l1[dataIndex] /
                                    data[item.key][selectedTimespan].costs
                                      .total[dataIndex])
                                  }%`,
                              }}
                            ></div>
                            <div
                              className="bg-[#FE5468] rounded-r-full flex items-center font-bold  justify-end  pr-[5px] h-[4px] "
                              style={{
                                width: `${120 *
                                  (data[item.key][selectedTimespan].costs
                                    .costs_blobs[dataIndex] /
                                    data[item.key][selectedTimespan].costs
                                      .total[dataIndex])
                                  }px`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`flex items-center py-[6px] justify-center gap-x-[5px] px-[5px] bg-[#34424044]  h-full relative ${data[item.key][selectedTimespan].profit.total[
                          dataIndex
                        ] > 0
                          ? "flex-row"
                          : "flex-row-reverse pl-[16px]"
                          } ${columnBorder("profit", item.key)}`}
                      >
                        <div
                          className={`min-w-[70px] max-w-[70px]  flex  ${data[item.key][selectedTimespan].profit.total[
                            dataIndex
                          ] > 0
                            ? "justify-end"
                            : "justify-start"
                            }`}
                        >
                          <div
                            className="numbers-xs"
                          >
                            {formatNumber(
                              data[item.key][selectedTimespan].profit.total[
                              dataIndex
                              ],
                            )}
                          </div>
                        </div>
                        <div
                          className={`relative flex items-center px-[3px]  h-full w-[70px]  border-dashed border-forest-50  ${data[item.key][selectedTimespan].profit.total[
                            dataIndex
                          ] > 0
                            ? "border-l-[1px] justify-start "
                            : "border-r-[1px] justify-end"
                            }`}
                        >
                          <div
                            className={`h-[4px] ${data[item.key][selectedTimespan].profit.total[
                              dataIndex
                            ] > 0
                              ? "bg-[#EEFF97] rounded-r-2xl "
                              : "bg-[#FFDF27] rounded-l-2xl"
                              }`}
                            style={{
                              width: `${(
                                65 *
                                (data[item.key][selectedTimespan].profit.total[
                                  dataIndex
                                ] > 0
                                  ? 1
                                  : -1) *
                                (data[item.key][selectedTimespan].profit.total[
                                  dataIndex
                                ] /
                                  largestProfit)
                              ).toFixed(2)}px`,
                              minWidth: "1px",
                            }}
                          ></div>
                        </div>
                      </div>
                      <div
                        className={`flex items-center py-[6px] justify-center gap-x-[5px] px-[5px]   h-full relative ${data[item.key][selectedTimespan].profit_margin
                          .total[0] > 0
                          ? "flex-row"
                          : "flex-row-reverse pl-[16px]"
                          } ${columnBorder("margin", item.key)}`}
                      >
                        <div
                          className={`numbers-xs min-w-[61px] max-w-[61px] flex items-center ${data[item.key][selectedTimespan].profit_margin
                            .total[0] > 0
                            ? "justify-end"
                            : "justify-start"
                            }`}
                        >
                          <div>
                            {Intl.NumberFormat("en-GB", {
                              notation: "standard",
                              maximumFractionDigits: 1,
                              minimumFractionDigits: 1,
                            }).format(
                              data[item.key][selectedTimespan].profit_margin
                                .total[0] * 100,
                            )}
                          </div>
                          <span>{"%"}</span>
                        </div>
                        <div
                          className={`relative flex items-center px-[3px]  h-full w-[65px]  border-dashed border-forest-50  ${data[item.key][selectedTimespan].profit_margin
                            .total[0] > 0
                            ? "border-l-[1px] justify-start flex-row"
                            : "border-r-[1px] justify-start flex-row-reverse"
                            }`}
                        >
                          <div
                            className={`absolute h-[4px] bg-[#5A6462] w-[50px] z-0 ${data[item.key][selectedTimespan].profit_margin
                              .total[0] > 0
                              ? "rounded-r-full"
                              : "rounded-l-full"
                              }`}
                          />
                          <div
                            className={`h-[4px] z-10 ${data[item.key][selectedTimespan].profit_margin
                              .total[0] > 0
                              ? "bg-[#45AA6F] rounded-r-2xl "
                              : "bg-[#FF8F27] rounded-l-2xl"
                              }`}
                            style={{
                              width: `${(
                                50 *
                                (data[item.key][selectedTimespan].profit_margin
                                  .total[0] > 0
                                  ? 1
                                  : -1) *
                                data[item.key][selectedTimespan].profit_margin
                                  .total[0]
                              ).toFixed(2)}px`,
                              minWidth: "1px",
                              maxWidth: "50px",
                            }}
                          ></div>
                          <div
                            className={` items-center flex-row-reverse relative ${(data[item.key][selectedTimespan].profit_margin
                              .total[0] > 0
                              ? 1
                              : -1) *
                              data[item.key][selectedTimespan].profit_margin
                                .total[0] *
                              100 >
                              100
                              ? "flex"
                              : "hidden"
                              }`}
                          >
                            <div
                              className={`h-[4px] w-[4px] z-10 absolute right-[-18px] ${data[item.key][selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#5A6462] block"
                                }`}
                            ></div>
                            <div
                              className={`h-[4px] w-[4px] z-10 absolute right-[-14px] ${data[item.key][selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#FF8F27] block"
                                }`}
                            ></div>
                            <div
                              className={`h-[4px] w-[3px] z-10 absolute right-[-11px] ${data[item.key][selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#5A6462] block"
                                }`}
                            ></div>
                            <div
                              className={`h-[4px] w-[3px] z-10 absolute right-[-8px] ${data[item.key][selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#FF8F27] block"
                                }`}
                            ></div>
                            <div
                              className={`h-[4px] w-[2px] z-10 absolute right-[-5px] ${data[item.key][selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#5A6462] block"
                                }`}
                            ></div>
                            <div
                              className={`h-[4px] w-[2px] z-10 absolute right-[-3px] ${data[item.key][selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#FF8F27] block"
                                }`}
                            ></div>
                            <div
                              className={`h-[4px] w-[1px] z-10 absolute right-[-2px] ${data[item.key][selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#5A6462] block"
                                }`}
                            ></div>
                            <div
                              className={`h-[4px] w-[1px] z-10 absolute right-[-1px] ${data[item.key][selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#FF8F27] block"
                                }`}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-full flex items-center justify-end pr-[15px] gap-x-[5px] bg-[#34424044] rounded-r-full h-full relative ${columnBorder(
                          "size",
                          item.key,
                        )}`}
                      >
                        {/*border-[#5A6462] */}
                        <div
                          className={`absolute left-0 -top-[0.5px] rounded-r-full  h-[34.33px] z-10   ${openChain[item.key]
                            ? "border-[#5A6462]  border-y-[1px] "
                            : ""
                            }`}
                        />
                        <div
                          className="numbers-xs"
                        >
                          {formatBytes(
                            data[item.key][selectedTimespan].size.total[0],
                          )}
                        </div>
                      </div>
                    </div>

                    {/*Chart Area \/ */}
                    <div
                      className={`flex bottom-2 z-0 relative top-[0px] justify-center w-full transition-height duration-300 overflow-hidden ${openChain[item.key] && selectedTimespan !== "1d"
                        ? "h-[387px]"
                        : "h-[0px]"
                        }`}
                    >
                      <div className="w-[97.5%] bg-forest-950 rounded-b-2xl border-dotted border-[1.25px] border-t-0 border-forest-50/30">
                        <BreakdownCharts
                          data={data[item.key][selectedTimespan]}
                          dailyData={
                            data[item.key][isMonthly ? "monthly" : "daily"]
                          }
                          chain={item.key}
                          timespans={timespans}
                          selectedTimespan={selectedTimespan}
                          isOpen={openChain[item.key]}
                          isMonthly={isMonthly}
                        />
                      </div>
                    </div>
                  </animated.div>
                );
              })}
              <div
                className={`grid absolute w-full pl-[45px] -bottom-[10px] pr-0.5 grid-cols-[auto_200px_200px_170px_145px_110px] mb-[15px]  ${isSidebarOpen
                  ? " 2xl:grid-cols-[auto_200px_200px_170px_145px_110px] grid-cols-[auto_170px_180px_170px_145px_110px] "
                  : "xl:grid-cols-[auto_200px_200px_170px_145px_110px] grid-cols-[auto_170px_180px_170px_145px_110px] "
                  } min-w-[1125px]`}
              >
                <div className="inline-flex items-center"><div className="heading-large-xs">TOTAL &nbsp;</div><div className="heading-large-xs text-[#5A6462] ">  {selectedTimespan === "max" ? "FOR MAXIMUM TIMEFRAME AVAILABLE" : ("IN THE LAST " + (timespans[selectedTimespan].label).toUpperCase()) }</div></div>
                <div className="w-full h-[34px] px-[2px]">
                  <div className="flex rounded-full w-full h-[34px] border-[#5A6462] border-[1px] items-center justify-center numbers-xs  bg-[#34424044]">
                    {formatNumber(totals[selectedTimespan].revenue.total[showUsd ? 0 : 1])}
                  </div>
                </div>
                <div className="w-full h-[34px] px-[2px]">
                  <div className="flex rounded-full w-full h-[34px] border-[#5A6462] border-[1px] items-center justify-center numbers-xs ">
                    {formatNumber(totals[selectedTimespan].costs.total[showUsd ? 0 : 1])}
                  </div>
                </div>
                <div className="w-full h-[34px] px-[2px]">
                  <div className="flex rounded-full w-full h-[34px] border-[#5A6462] border-[1px] items-center justify-center numbers-xs bg-[#34424044]">
                    {formatNumber(totals[selectedTimespan].profit.total[showUsd ? 0 : 1])}
                  </div>
                </div>
                <div className="w-full h-[34px] px-[2px]">
                  <div className="flex rounded-full w-full h-[34px] border-[#5A6462] border-[1px] items-center justify-center numbers-xs">
                  <div
                        className={`flex items-center py-[6px] justify-center gap-x-[5px] px-[5px]   h-full relative ${totals[selectedTimespan].profit_margin
                          .total[0] > 0
                          ? "flex-row"
                          : "flex-row-reverse pl-[16px]"
                          } `}
                      >
                        <div
                          className={`numbers-xs min-w-[60px] max-w-[60px] flex items-center ${totals[selectedTimespan].profit_margin
                            .total[0] > 0
                            ? "justify-end"
                            : "justify-start"
                            }`}
                        >
                          <div>
                            {Intl.NumberFormat("en-GB", {
                              notation: "standard",
                              maximumFractionDigits: 1,
                              minimumFractionDigits: 1,
                            }).format(
                              totals[selectedTimespan].profit_margin
                                .total[0] * 100,
                            )}
                          </div>
                          <span>{"%"}</span>
                        </div>
                  <div
                    className={`relative flex items-center px-[3px]  h-full w-[65px]  border-dashed border-forest-50  ${totals[selectedTimespan].profit_margin
                            .total[0] > 0
                            ? "border-l-[1px] justify-start flex-row"
                            : "border-r-[1px] justify-start flex-row-reverse"
                            }`}
                        >
                          <div
                            className={`absolute h-[4px] bg-[#5A6462] w-[50px] z-0 ${totals[selectedTimespan].profit_margin
                              .total[0] > 0
                              ? "rounded-r-full"
                              : "rounded-l-full"
                              }`}
                          />
                          <div
                            className={`h-[4px] z-10 ${totals[selectedTimespan].profit_margin
                              .total[0] > 0
                              ? "bg-[#45AA6F] rounded-r-2xl "
                              : "bg-[#FF8F27] rounded-l-2xl"
                              }`}
                            style={{
                              width: `${(
                                50 *
                                (totals[selectedTimespan].profit_margin
                                  .total[0] > 0
                                  ? 1
                                  : -1) *
                                  totals[selectedTimespan].profit_margin
                                  .total[0]
                              ).toFixed(2)}px`,
                              minWidth: "1px",
                              maxWidth: "50px",
                            }}
                          ></div>
                          <div
                            className={` items-center flex-row-reverse relative ${(totals[selectedTimespan].profit_margin
                              .total[0] > 0
                              ? 1
                              : -1) *
                              totals[selectedTimespan].profit_margin
                                .total[0] *
                              100 >
                              100
                              ? "flex"
                              : "hidden"
                              }`}
                          >
                            <div
                              className={`h-[4px] w-[4px] z-10 absolute right-[-18px] ${totals[selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#5A6462] block"
                                }`}
                            ></div>
                            <div
                              className={`h-[4px] w-[4px] z-10 absolute right-[-14px] ${totals[selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#FF8F27] block"
                                }`}
                            ></div>
                            <div
                              className={`h-[4px] w-[3px] z-10 absolute right-[-11px] ${totals[selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#5A6462] block"
                                }`}
                            ></div>
                            <div
                              className={`h-[4px] w-[3px] z-10 absolute right-[-8px] ${totals[selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#FF8F27] block"
                                }`}
                            ></div>
                            <div
                              className={`h-[4px] w-[2px] z-10 absolute right-[-5px] ${totals[selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#5A6462] block"
                                }`}
                            ></div>
                            <div
                              className={`h-[4px] w-[2px] z-10 absolute right-[-3px] ${totals[selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#FF8F27] block"
                                }`}
                            ></div>
                            <div
                              className={`h-[4px] w-[1px] z-10 absolute right-[-2px] ${totals[selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#5A6462] block"
                                }`}
                            ></div>
                            <div
                              className={`h-[4px] w-[1px] z-10 absolute right-[-1px] ${totals[selectedTimespan].profit_margin
                                .total[0] > 0
                                ? "hidden"
                                : "bg-[#FF8F27] block"
                                }`}
                            ></div>
                          </div>
                        </div>
                  </div>
                  </div>
                </div>
                <div className="w-full h-[34px] px-[2px]">
                  <div className="flex rounded-full w-full h-[34px] border-[#5A6462] border-[1px] items-center justify-center numbers-xs bg-[#34424044]">
                    {formatBytes(
                        totals[selectedTimespan].size.total[0],
                    )}
                  </div>
                </div>
              </div>
            </div>

          </HorizontalScrollContainer>
          
        </div>
      )}
    </div>
  );
}
