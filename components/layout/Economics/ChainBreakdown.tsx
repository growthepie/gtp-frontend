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
import BreakdownCharts from "@/components/layout/Economics/BreakdownCharts";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { AllChainsByKeys } from "@/lib/chains";
import { MasterResponse } from "@/types/api/MasterResponse";
import { sortByDataAvailability } from "./SortHelpers";
import { useTransition, animated } from "@react-spring/web";
import { set } from "lodash";
import { useUIContext } from "@/contexts/UIContext";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import {
  TopRowContainer,
  TopRowChild,
  TopRowParent,
} from "@/components/layout/TopRow";
import Container from "../Container";
interface DAvailability {
  icon: string;
  label: string;
}
//prettier-ignore
type MetricSort = "revenue" | "profit" | "chain" | "costs" | "l1_costs" | "blobs" | "profit_margin" | "size";

export default function ChainBreakdown({
  data,
  master,
}: {
  data: ChainBreakdownResponse;
  master: MasterResponse;
}) {
  const [selectedTimespan, setSelectedTimespan] = useState("90d");
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

  //Handles opening of each chain section
  const timespans = useMemo(() => {
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
        xMin: Date.now() - 7 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "30d": {
        shortLabel: "30d",
        label: "30 days",
        value: 30,
        xMin: Date.now() - 30 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "90d": {
        shortLabel: "90d",
        label: "90 days",
        value: 90,
        xMin: Date.now() - 90 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "180d": {
        shortLabel: "180d",
        label: "180 days",
        value: 180,
        xMin: Date.now() - 180 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },

      max: {
        shortLabel: "Max",
        label: "Max",
        value: 0,
        xMax: Date.now(),
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

  const sortedChainData = useMemo(() => {
    let retData: string[];
    if (metricSort !== "chain") {
      const regularMetrics = [
        "profit",
        "revenue",
        "costs",
        "size",
        "profit_margin",
      ];
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
  }, [data, master, DAIndex, allChainsDA, metricSort, selectedTimespan]);

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

  const minimumHeight = useMemo(() => {
    let retHeight: number = 39;
    Object.keys(data).map((key) => {
      retHeight += 39;
      retHeight += openChain[key] && selectedTimespan !== "1d" ? 387 : 0;
    });

    return retHeight;
  }, [openChain, data, selectedTimespan]);

  return (
    <div className="h-full">
      {sortedChainData && (
        <div className="flex flex-col gap-y-[15px] ">
          <Container>
            <div className="flex justify-between items-center">
              <div className="flex items-center  gap-x-[8px]">
                <Image
                  src="/GTP-Metrics.svg"
                  alt="GTP Chain"
                  className="object-contain w-[32px] h-[32px] "
                  height={36}
                  width={36}
                />
                <Heading className="text-[30px] leading-snug " as="h1">
                  Chain Breakdown
                </Heading>
              </div>
            </div>
            <TopRowContainer className="-py-[3px]">
              <TopRowParent>
                <div></div>
              </TopRowParent>
              <TopRowParent className="-py-[10px]">
                {Object.keys(timespans).map((key) => {
                  {
                    return (
                      <TopRowChild
                        className={`px-[10px]`}
                        onClick={() => {
                          setSelectedTimespan(key);
                        }}
                        key={key}
                        style={{
                          paddingTop: "10.5px",
                          paddingBottom: "10.5px",
                          paddingLeft: "16px",
                          paddingRight: "16px",
                        }}
                        isSelected={selectedTimespan === key}
                      >
                        {selectedTimespan === key
                          ? timespans[key].label
                          : timespans[key].shortLabel}
                      </TopRowChild>
                    );
                  }
                })}
              </TopRowParent>
            </TopRowContainer>
          </Container>
          <HorizontalScrollContainer
            includeMargin={true}
            className="w-full flex flex-col "
          >
            <div
              className={`grid gap-x-[5px] pr-0.5 grid-cols-[auto_200px_200px_170px_145px_110px] mb-[15px]  ${isSidebarOpen
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
                  <div className="text-[12px] group-hover:text-forest-50/80 font-bold">
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
                  className="flex items-center bg-[#344240] gap-x-1 text-[8px] rounded-full px-[5px] py-[2px] cursor-pointer"
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
                  <div>Data Availability: </div>
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
              <div className="flex items-center justify-start ">
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
                  <div className="text-[12px] group-hover:text-forest-50/80 font-bold">
                    Revenue
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
                  <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-x-[5px] ">
                {" "}
                <div className="flex items-center group gap-x-[1px]">
                  <div
                    className="text-[12px] group-hover:text-forest-50/80 font-bold cursor-pointer"
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
                  <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                </div>
                <div className="flex items-center  gap-x-[1.5px] text-[8px] w-[114px] h-[16px] cursor-pointer">
                  <div className="flex justify-center group items-center rounded-l-full border-[2px] border-r-[0px] border-[#D03434] w-[57px] px-[5px]  ">
                    <div
                      className=" group-hover:text-forest-50/80 "
                      onClick={() => {
                        if (metricSort !== "l1_costs") {
                          setSortOrder(true);
                          setMetricSort("l1_costs");
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
                          metricSort !== "l1_costs"
                            ? "formkit:arrowdown"
                            : sortOrder
                              ? "formkit:arrowdown"
                              : "formkit:arrowup"
                        }
                        className={` w-[10px] h-[10px] ${metricSort === "l1_costs"
                          ? "text-forest-50 opacity-100"
                          : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                          } `}
                      />
                    </div>
                  </div>
                  <div
                    className="flex justify-center group items-center rounded-r-full border-[2px] border-l-[0px] border-[#FE5468] w-[57px] px-[5px] cursor-pointer "
                    onClick={() => {
                      if (metricSort !== "blobs") {
                        setSortOrder(true);
                        setMetricSort("blobs");
                      } else {
                        setSortOrder(!sortOrder);
                      }
                    }}
                  >
                    <div className=" group-hover:text-forest-50/80 ">Blobs</div>
                    <div>
                      <Icon
                        icon={
                          metricSort !== "blobs"
                            ? "formkit:arrowdown"
                            : sortOrder
                              ? "formkit:arrowdown"
                              : "formkit:arrowup"
                        }
                        className={` w-[10px] h-[10px] ${metricSort === "blobs"
                          ? "text-forest-50 opacity-100"
                          : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                          } `}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-start gap-x-[5px] pl-[2px]">
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
                  <div className="text-[12px] group-hover:text-forest-50/80 font-bold">
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
                  <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                </div>
              </div>
              <div
                className="flex items-center justify-start gap-x-[5px] pl-[2px] cursor-pointer"
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
                  <div className="text-[12px] group-hover:text-forest-50/80 font-bold">
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
                  <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                </div>
              </div>
              <div
                className="flex items-center group gap-x-[1px] justify-end cursor-pointer"
                onClick={() => {
                  if (metricSort !== "size") {
                    setSortOrder(true);
                    setMetricSort("size");
                  } else {
                    setSortOrder(!sortOrder);
                  }
                }}
              >
                <div className="text-[12px] group-hover:text-forest-50/80 font-bold">
                  {"Blob Sizes"}
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
                <Icon icon="feather:info" className="w-[15px] h-[15px]" />
              </div>
              {/*END TOP ROW */}
              {/*END TOP ROW */}
              {/*END TOP ROW */}
            </div>
            <div
              className={`relative flex flex-col -mt-[5px] min-w-[1125px]`}
              style={{ minHeight: minimumHeight }}
            >
              {transitions((style, item) => {
                const dataIndex = data[item.key][
                  selectedTimespan
                ].revenue.types.indexOf(showUsd ? "usd" : "eth");
                const localDataAvail = dataAvailToArray(
                  master.chains[item.key].da_layer,
                )[0];

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
                      className={`grid gap-x-[5px] relative rounded-full w-full  border-[1px] min-h-[34px] text-[14px] items-center z-20 cursor-pointer pr-0.5 grid-cols-[auto_200px_200px_170px_145px_110px] min-w-[1000px] overflow-hidden
                      ${openChain[item.key]
                          ? "border-[#CDD8D3] bg-forest-950 "
                          : "border-[#5A6462] bg-transparent"
                        }  ${isBouncing && bounceChain === item.key
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
                      <div className="flex items-center gap-x-[5px] pl-[10px] ">
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
                            className={`w-[15px] h-[15px] flex items-center justify-center text-[10px]`}
                            style={{
                              color:
                                AllChainsByKeys[item.key].colors["dark"][0],
                            }}
                          />
                          <Icon
                            icon={"gtp:circle-arrow"}
                            className={`w-[4px] h-[9px] absolute top-[9px] right-0 `}
                            style={{
                              transform: `rotate(${openChain[item.key] ? "90deg" : "0deg"
                                })`,
                              transformOrigin: "-9px 4px",
                              transition: "transform 0.5s",
                            }}
                          />
                        </div>

                        <div>
                          {triggerShrink
                            ? master.chains[item.key].name_short
                            : AllChainsByKeys[item.key].label}
                        </div>

                        <div
                          className="flex items-center bg-[#344240] gap-x-1 h-[18px] text-[14px] rounded-full px-[5px] py-[3px]"
                          key={localDataAvail.label}
                        >
                          <div>{localDataAvail.label}</div>
                          <div className="flex items-center gap-x-1">
                            <Icon
                              icon={`gtp:${localDataAvail.icon}`}
                              className="w-[12px] h-[12px]"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-end pb-[6px] justify-start gap-x-[5px] h-full px-[5px] bg-[#34424044]">
                        <div className="w-[65px] flex justify-end">
                          <div className="text-[14px] font-semibold ">
                            {formatNumber(
                              data[item.key][selectedTimespan].revenue.total[
                              dataIndex
                              ],
                            )}
                          </div>
                        </div>
                        <div
                          className={` w-[90px] flex justify-start items-end h-full ${isSidebarOpen ? "2xl:w-[120px]" : "xl:w-[120px]"
                            }`}
                        >
                          <div
                            className={`w-[96px] flex items-end justify-center rounded-full h-[4px] bg-[#1DF7EF]`}
                            style={{
                              width:
                                data[item.key][selectedTimespan].revenue.total[
                                  dataIndex
                                ] /
                                  totalRevenue >
                                  0.01
                                  ? (312 *
                                    data[item.key][selectedTimespan].revenue
                                      .total[dataIndex]) /
                                  totalRevenue
                                  : `${(2200 *
                                    data[item.key][selectedTimespan].revenue
                                      .total[dataIndex]) /
                                  totalRevenue
                                  }%`,
                              minWidth:
                                data[item.key][selectedTimespan].revenue.total[
                                  dataIndex
                                ] /
                                  totalRevenue >
                                  0.01
                                  ? "22px"
                                  : `6px`,
                            }}
                          >
                            &nbsp;
                          </div>
                        </div>
                      </div>
                      <div className="flex items-end justify-center gap-x-[5px] pb-[6px] h-full ">
                        <div className="w-[65px] flex justify-end items-end h-full font-semibold text-[14px]">
                          {formatNumber(
                            data[item.key][selectedTimespan].costs.total[
                            dataIndex
                            ],
                          )}
                        </div>
                        <div className="flex flex-col justify-end w-[120px] h-full">
                          <div className="flex w-full justify-between h-[15px]">
                            <div className="text-[10px] flex gap-x-[0.5px] ">
                              <span>
                                {Intl.NumberFormat("en-GB", {
                                  notation: "compact",
                                  maximumFractionDigits: 1,
                                  minimumFractionDigits: 1,
                                }).format(
                                  (data[item.key][selectedTimespan].costs
                                    .l1_costs[dataIndex] /
                                    data[item.key][selectedTimespan].costs
                                      .total[dataIndex]) *
                                  100,
                                )}
                              </span>
                              <span>{"%"}</span>
                            </div>
                            <div className="text-[10px]">
                              {Intl.NumberFormat("en-GB", {
                                notation: "compact",
                                maximumFractionDigits: 1,
                                minimumFractionDigits: 1,
                              }).format(
                                (data[item.key][selectedTimespan].costs.blobs[
                                  dataIndex
                                ] /
                                  data[item.key][selectedTimespan].costs.total[
                                  dataIndex
                                  ]) *
                                100,
                              )}
                              {"%"}
                            </div>
                          </div>
                          <div className="flex justify-start w-full items-end text-[8px] ">
                            <div
                              className="bg-[#FD0F2C] flex items-center justify-start font-bold rounded-l-full pl-[5px] h-[4px] "
                              style={{
                                width: `${100 *
                                  (data[item.key][selectedTimespan].costs
                                    .l1_costs[dataIndex] /
                                    data[item.key][selectedTimespan].costs
                                      .total[dataIndex])
                                  }%`,
                              }}
                            ></div>
                            <div
                              className="bg-[#FE5468]  rounded-r-full flex items-center font-bold  justify-end  pr-[5px] h-[4px] "
                              style={{
                                width: `${120 *
                                  (data[item.key][selectedTimespan].costs.blobs[
                                    dataIndex
                                  ] /
                                    data[item.key][selectedTimespan].costs
                                      .total[dataIndex])
                                  }px`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`flex items-center py-[6px] justify-center gap-x-[5px] px-[5px] bg-[#34424044] h-full ${data[item.key][selectedTimespan].profit.total[
                          dataIndex
                        ] > 0
                          ? "flex-row"
                          : "flex-row-reverse pl-[15px]"
                          }`}
                      >
                        <div
                          className={`min-w-[70px] max-w-[70px]  flex  ${data[item.key][selectedTimespan].profit.total[
                            dataIndex
                          ] > 0
                            ? "justify-end"
                            : "flex-start"
                            }`}
                        >
                          <div className="text-[14px] font-semibold ">
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
                      <div className="flex w-full h-full items-center justify-center px-[5px] py-[6px] gap-x-[5px]">
                        <div className="text-[14px] w-[50px] font-semibold flex justify-end ">
                          <span>
                            {Intl.NumberFormat("en-GB", {
                              notation: "standard",
                              maximumFractionDigits: 1,
                              minimumFractionDigits: 1,
                            }).format(
                              ((data[item.key][selectedTimespan].revenue.total[
                                dataIndex
                              ] -
                                data[item.key][selectedTimespan].costs.total[
                                dataIndex
                                ]) /
                                data[item.key][selectedTimespan].revenue.total[
                                dataIndex
                                ]) *
                              100,
                            )}
                          </span>
                          <span>{"%"}</span>
                        </div>
                        <div
                          className={`relative flex items-center pl-[3px] border-l-[1px]  h-full w-[57.5px] border-dashed border-forest-50 `}
                        >
                          <div className="w-[57.5] bg-[#5A6462] rounded-r-full ">
                            <div
                              className="h-[4px] bg-[#45AA6F] rounded-r-2xl "
                              style={{
                                width:
                                  (data[item.key][selectedTimespan].revenue
                                    .total[dataIndex] -
                                    data[item.key][selectedTimespan].costs
                                      .total[dataIndex]) /
                                    data[item.key][selectedTimespan].revenue
                                      .total[dataIndex] >
                                    0
                                    ? `${57.5 *
                                    ((data[item.key][selectedTimespan]
                                      .revenue.total[dataIndex] -
                                      data[item.key][selectedTimespan].costs
                                        .total[dataIndex]) /
                                      data[item.key][selectedTimespan]
                                        .revenue.total[dataIndex])
                                    }px`
                                    : "0px",
                                minWidth:
                                  (data[item.key][selectedTimespan].revenue
                                    .total[dataIndex] -
                                    data[item.key][selectedTimespan].costs
                                      .total[dataIndex]) /
                                    data[item.key][selectedTimespan].revenue
                                      .total[dataIndex] >
                                    0
                                    ? "1px"
                                    : "0px",
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="w-full flex items-center justify-end pr-[15px] gap-x-[5px] bg-[#34424044] h-full ">
                        <div className="text-[14px] font-semibold">
                          {formatBytes(
                            data[item.key][selectedTimespan].size.total[0],
                          )}
                        </div>
                      </div>
                      {/* <div
                      className="absolute -right-2 hover:cursor-pointer"
                      onClick={() => {
                        toggleOpenChain(item.key);
                      }}
                    >
                      <div className="flex relative items-center justify-center w-[22px] h-[22px] bg-[#1F2726] rounded-full">
                        <div
                          className={`absolute w-[18px] h-[18px]  rounded-full border-[1px] ${
                            openChain[item.key]
                              ? "border-[#CDD8D3]"
                              : "border-[#5A6462]"
                          }`}
                        ></div>
                        <Icon
                          icon="feather:chevron-down"
                          className={`w-4 h-4  ${
                            openChain[item.key]
                              ? "text-[#CDD8D3]"
                              : "text-[#5A6462]"
                          }`}
                        />
                      </div>
                    </div> */}
                    </div>

                    {/*Chart Area \/ */}
                    <div
                      className={`flex bottom-2 z-0 relative top-[0px] justify-center w-full transition-height duration-300 overflow-hidden ${openChain[item.key] && selectedTimespan !== "1d"
                        ? "h-[387px]"
                        : "h-[0px]"
                        }`}
                    >
                      <div className="w-[97.5%] bg-forest-950 rounded-b-2xl border-dotted border-[1.25px] border-forest-50">
                        <BreakdownCharts
                          data={data[item.key][selectedTimespan]}
                          dailyData={data[item.key]["daily"]}
                          chain={item.key}
                          timespans={timespans}
                          selectedTimespan={selectedTimespan}
                          isOpen={openChain[item.key]}
                        />
                      </div>
                    </div>
                  </animated.div>
                );
              })}
            </div>
          </HorizontalScrollContainer>
        </div>
      )}
    </div>
  );
}
