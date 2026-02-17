"use client"
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer"
import { useUIContext } from "@/contexts/UIContext";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { animated, useSpring, useTransition } from "@react-spring/web";
import { DAOverviewBreakdown } from "@/types/api/DAOverviewResponse";
import { useLocalStorage } from "usehooks-ts";
import { useMaster } from "@/contexts/MasterContext";
import { Icon } from "@iconify/react";
import DABreakdownCharts from "@/components/layout/DA-Overview/DATableCharts";
import useSWR from "swr";
import { DATimeseriesResponse } from "@/types/api/DATimeseriesResponse";
import { DATimeseriesURL } from "@/lib/urls";
import { chart } from "highcharts";
// import ShowLoading from "@/components/layout/ShowLoading";
import DATableCharts from "@/components/layout/DA-Overview/DATableCharts";
import Image from "next/image";
import DynamicIcon from "../DynamicIcon";
import VerticalScrollContainer from "@/components/VerticalScrollContainer";
import { first } from "lodash";
import { Badge } from "@/app/(labels)/labels/Search";
import Link from "next/link";
import { getIcon, listIcons } from "@iconify/react";
import { TooltipBody, TooltipHeader } from "@/components/tooltip/GTPTooltip";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { GTPIcon } from "../GTPIcon";
import { useTheme } from "next-themes";

const AnimatedDiv = animated.div as any;



const REGULAR_METRICS = ["fees", "size", "fees_per_mb", "fixed_parameters"];
const UNLISTED_CHAIN_COLORS = ["#7D8887", "#717D7C", "#667170", "#5A6665", "#4F5B5A", "#43504F", "#384443", "#2C3938"]



export default function DATable({ breakdown_data, selectedTimespan, isMonthly }: { breakdown_data: DAOverviewBreakdown, selectedTimespan: string, isMonthly: boolean }) {


  const { data: chart_data, error: chart_error, isLoading: chart_loading, isValidating: chart_validating } = useSWR<DATimeseriesResponse>(DATimeseriesURL);

  const isSidebarOpen = useUIContext((state) => state.isSidebarOpen);
  const { AllDALayersByKeys, AllChainsByKeys, data: master } = useMaster();

  const [selectedCategory, setSelectedCategory] = useState("size");
  const [isBouncing, setIsBouncing] = useState(false);
  const [bounceChain, setBounceChain] = useState("");
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [sortOrder, setSortOrder] = useState(true);
  const [openDA, setOpenDA] = useState(() => {
    const initialState = Object.keys(breakdown_data).reduce((acc, key) => {

      acc[key] = key === "da_ethereum_blobs" ? true : false;
      return acc;
    }, {});
    return initialState;
  });

  const toggleOpenDA = (key) => {
    setOpenDA((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };

  const handleClick = (e, da) => {
    if (selectedTimespan === "1d") {
      setIsBouncing(true);
      setBounceChain(da);
      setTimeout(() => setIsBouncing(false), 1000); // Duration of the bounce animation
    } else {
      toggleOpenDA(da);
      e.stopPropagation();
    }
  };

  const columnBorder = useCallback(
    (metric, key) => {
      const isOpen = openDA[key];
      const openDark =
        metric === "fees" || metric === "da_consumers" || metric === "fixed_parameters";
      const openLight =
        metric === "name" || metric === "size" || metric === "fees_per_mb";

      if (isOpen) {
        if (openLight) {
          return (
            "border-color-bg-medium border-y-[1px]" +
            (metric === "name" ? " border-l-[1px] rounded-l-full" : "")
          );
        } else if (openDark) {
          return (
            "border-color-bg-medium-50 border-y-[1px]" +
            (metric === "fixed_parameters" ? " border-r-[1px] rounded-r-full" : "")
          );
        }
      } else {
        return (
          "border-color-bg-medium border-y-[1px]" +
          (metric === "name"
            ? " border-l-[1px] rounded-l-full"
            : metric === "fixed_parameters"
              ? " border-r-[1px] rounded-r-full "
              : "")
        );
      }
      //"border-[#CDD8D3] bg-forest-950 border-r-[#5A6462]"
      //"border-[#5A6462]
    },
    [openDA],
  );


  const timespans = useMemo(() => {

    let xMax = 0;


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
        "180d": {
          shortLabel: "6m",
          label: "6 months",
          value: 180,
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
          xMin: xMax - 365 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
      };
    } else {
      return {
        "90d": {
          shortLabel: "3m",
          label: "3 months",
          value: 90,
          xMin: xMax - 90 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "180d": {
          shortLabel: "6m",
          label: "6 months",
          value: 180,
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
          xMin: xMax - 365 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
      };
    }
  }, [selectedTimespan, isMonthly]);

  const sortedBreakdownData = useMemo(() => {

    let retData: string[];
    if (REGULAR_METRICS.includes(selectedCategory)) {
      retData = Object.keys(breakdown_data).filter((row_key) => row_key !== "totals").sort((a, b) => {
        let types = breakdown_data[a][selectedTimespan][selectedCategory].types;
        let typeIndex = types.includes("usd") ? types.indexOf(showUsd ? "usd" : "eth") : 0;

        let aComp = breakdown_data[a][selectedTimespan][selectedCategory].total[typeIndex];
        let bComp = breakdown_data[b][selectedTimespan][selectedCategory].total[typeIndex];

        if (aComp > bComp) return -1;
        if (aComp < bComp) return 1;

        return 0;
      });
    } else {
      if (selectedCategory === "da_consumers") {
        retData = Object.keys(breakdown_data).filter((row_key) => row_key !== "totals").sort((a, b) => {
          let aComp = breakdown_data[a][selectedTimespan][selectedCategory].count;
          let bComp = breakdown_data[b][selectedTimespan][selectedCategory].count;

          if (aComp > bComp) return -1;
          if (aComp < bComp) return 1;

          return 0;
        });
      } else if (selectedCategory === "name") {
        retData = Object.keys(breakdown_data).filter((row_key) => row_key !== "totals").sort((a, b) => {
          if (a > b) return -1;
          if (a < b) return 1;

          return 0;
        });
      } else {
        retData = Object.keys(breakdown_data).filter((row_key) => row_key !== "totals");
      }
    }

    return retData.reduce((acc, key) => {
      if (breakdown_data[key] !== undefined) {
        acc[key] = breakdown_data[key];
      }
      return acc;
    }, {});
  }, [breakdown_data, selectedCategory, selectedTimespan, showUsd]);


  const maxDataPosted = useMemo(() => {
    let maxData = 0;

    Object.keys(breakdown_data).filter((key) => key !== "totals").map((key) => {
      if (breakdown_data[key][selectedTimespan].size.total[0] > maxData) {
        maxData = breakdown_data[key][selectedTimespan]["size"].total[0];
      }
    });

    return maxData;
  }, [breakdown_data, selectedTimespan, showUsd]);



  const totalDAConsumers = useMemo(() => {
    let total = 0;
    Object.keys(breakdown_data).forEach((key) => {
      if (key === "totals") return;
      total += breakdown_data[key][selectedTimespan].da_consumers.count;
    });

    return total;
  }, [])

  const maxFeesPaid = useMemo(() => {
    let maxFees = 0;
    let typeIndex = breakdown_data[Object.keys(breakdown_data)[0]][selectedTimespan]["fees"].types.indexOf(showUsd ? "usd" : "eth");

    Object.keys(breakdown_data).filter((key) => key !== "totals").map((key) => {

      if (breakdown_data[key][selectedTimespan]["fees"].total[typeIndex] > maxFees) {


        maxFees = breakdown_data[key][selectedTimespan]["fees"].total[typeIndex];
      }
    });

    return maxFees;
  }, [breakdown_data, selectedTimespan, showUsd]);




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

  function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  const transitions = useTransition(
    (sortOrder
      ? Object.keys(sortedBreakdownData)
      : Object.keys(sortedBreakdownData).reverse()
    ).map((key, index) => {

      let prevOpenCharts: number = 0;
      if (selectedTimespan !== "1d") {
        (sortOrder
          ? Object.keys(sortedBreakdownData)
          : Object.keys(sortedBreakdownData).reverse()
        ).map((localKey, localIndex) => {
          if (localIndex >= index) return;

          if (openDA[localKey]) {
            prevOpenCharts += 1;
          }
        });
      }
      return {
        y: index * 39 + prevOpenCharts * 295,
        height: 39 + (openDA[key] ? 295 : 0),
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

  const EXTRA_PADDING = 0;

  const minimumHeight = useMemo(() => {
    let retHeight: number = 39;
    Object.keys(breakdown_data).map((key) => {
      retHeight += 39;
      retHeight += openDA[key] && selectedTimespan !== "1d" ? 295 : 0;
    });

    // add extra padding to the bottom for tooltip
    retHeight += EXTRA_PADDING;

    return retHeight;
  }, [openDA, breakdown_data, selectedTimespan]);


  const createDAConsumers = useCallback((da_row) => {
    if (!master) return;

    let more = 0;
    let addedLogos = 0;
    const primaryIndex = da_row.chains.types.findIndex((type) => type.includes("gtp_origin_key"));
    const altIndex = da_row.chains.types.findIndex((type) => type.includes("da_consumer_key"));


    const retHTML = da_row.chains.values.map((chain, index) => {
      const chainLogoExists = (AllChainsByKeys[chain[primaryIndex]] || master.custom_logos[chain[altIndex]]) ? true : false;

      if (chainLogoExists && addedLogos < 5) {
        addedLogos += 1;
        return AllChainsByKeys[chain[primaryIndex]] ? (
          <Icon
            key={index}
            icon={
              AllChainsByKeys[chain[primaryIndex]]
                ? `gtp:${AllChainsByKeys[chain[primaryIndex]].urlKey}-logo-monochrome`
                : master.custom_logos[chain[altIndex]].body
            }
            className="w-[15px] h-[15px]"
          />
        ) : (
          <DynamicIcon
            key={index}
            pathString={master.custom_logos[chain[altIndex]].body}
            size={12}
            className="text-forest-200"
            viewBox="0 0 15 15"
          />
        );
      } else {
        more += 1;
      }
      return null; // Return null for items that don't meet the condition
    });

    return (
      <div className="flex items-center gap-x-[2px]">
        <div className="numbers-xs mr-[3px]">{da_row.count}</div>
        <div className="w-[6px] h-[6px] bg-color-bg-medium rounded-full mr-[5px]"></div>
        {retHTML}
        <div className="ml-[3px] w-auto pl-[5px] pr-[6px] py-[1.5px] rounded-full bg-color-bg-medium text-xxs">
          {`+ ${more} more`}
        </div>
      </div>
    )

    // return (

    //     <div className="flex items-center gap-x-[5px] number-xs">
    //       <div>{da_row.total[0]}</div>
    //       <div className="flex gap-x-[5px] items-center">{iconDisplay}</div>
    //     </div>

    // )
  }, []);

  // console.log("listIcons", listIcons(undefined, "gtp"));
  // console.log("getIcon", getIcon("gtp:da-eigenda-logo-monochrome"));

  //daconsumers breakdown_data[item.key][selectedTimespan].da_consumers
  return (
    <>
      {/* {chart_loading || !chart_data || !master ? ( */}
      {/* <div> */}
      {/* <ShowLoading
                dataLoading={[chart_loading]}
                dataValidating={[chart_validating]}
                fullScreen={true}
              /> */}
      {/* </div> */}
      {/* ) : ( */}
      <HorizontalScrollContainer
        includeMargin={true}
        className="w-full flex flex-col mt-[3px] overflow-visible"
      >
        <div
          className={`grid pl-[44px]  pr-0.5 grid-cols-[auto_200px_199px_114px_280px_46px] mb-[15px]  ${isSidebarOpen
            ? " 2xl:grid-cols-[auto_200px_199px_114px_280px_46px] grid-cols-[auto_200px_199px_94px_215px_46px]"
            : "xl:grid-cols-[auto_200px_199px_94px_215px_46px] grid-cols-[auto_200px_199px_94px_215px_46px]"
            } min-w-[970px] `}
        >
          <div className="heading-small-xxs font-bold flex items-center cursor-pointer" onClick={() => {
            if (selectedCategory !== "name") {
              setSortOrder(true);
              setSelectedCategory("name");
            } else {
              setSortOrder(!sortOrder);
            }
          }}>
            <div>DA Layer</div>
            <Icon
              icon={
                selectedCategory !== "name"
                  ? "formkit:arrowdown"
                  : sortOrder
                    ? "formkit:arrowdown"
                    : "formkit:arrowup"
              }
              className={` w-[10px] h-[10px] ${selectedCategory === "name"
                ? "text-forest-50 opacity-100"
                : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                } `}
            />
          </div>
          <div className="w-full flex justify-end items-center heading-small-xxs font-bold pr-1 cursor-pointer" onClick={() => {
            if (selectedCategory !== "size") {
              setSortOrder(true);
              setSelectedCategory("size");
            } else {
              setSortOrder(!sortOrder);
            }
          }}>
            <div>Data Posted</div>
            <Icon
              icon={
                selectedCategory !== "size"
                  ? "formkit:arrowdown"
                  : sortOrder
                    ? "formkit:arrowdown"
                    : "formkit:arrowup"
              }
              className={` w-[10px] h-[10px] ${selectedCategory === "size"
                ? "text-forest-50 opacity-100"
                : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                } `}
            />
            <GTPTooltipNew
              placement="right"
              allowInteract={false}
              unstyled
              containerClass="z-50"
              trigger={<Icon icon="feather:info" className="w-[15px] h-[15px]" />}
            >
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-x-[10px] pl-1.5 pr-3 py-2 text-xs bg-color-bg-default dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto max-w-[280px] font-normal transition-all duration-300">
                  <div className="flex flex-col gap-y-[5px] items-center">
                    <div className="flex items-center gap-x-[5px] text-xxs">
                      The amount of data that was submitted to the DA layer.
                    </div>
                  </div>
                </div>
              </div>
            </GTPTooltipNew>
          </div>
          <div className="w-full flex justify-end items-center heading-small-xxs font-bold pr-1 cursor-pointer"
            onClick={() => {
              if (selectedCategory !== "fees") {
                setSortOrder(true);
                setSelectedCategory("fees");
              } else {
                setSortOrder(!sortOrder);
              }
            }}
          >
            <div>Fees Paid</div>
            <Icon
              icon={
                selectedCategory !== "fees"
                  ? "formkit:arrowdown"
                  : sortOrder
                    ? "formkit:arrowdown"
                    : "formkit:arrowup"
              }
              className={` w-[10px] h-[10px] ${selectedCategory === "fees"
                ? "text-forest-50 opacity-100"
                : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                } `}
            />
            <GTPTooltipNew
              placement="right"
              allowInteract={false}
              unstyled
              containerClass="z-50"
              trigger={<Icon icon="feather:info" className="w-[15px] h-[15px]" />}
            >
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-x-[10px] pl-1.5 pr-3 py-2 text-xs bg-color-bg-default dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto max-w-[280px] font-normal transition-all duration-300">
                  <div className="flex flex-col gap-y-[5px] items-center">
                    <div className="flex items-center gap-x-[5px] text-xxs">
                      The fees collected by the DA layer for processing and storing data.
                    </div>
                  </div>
                </div>
              </div>
            </GTPTooltipNew>
          </div>
          <div className="w-full flex justify-end items-center heading-small-xxs font-bold pr-1 cursor-pointer"
            onClick={() => {
              if (selectedCategory !== "fees_per_mb") {
                setSortOrder(true);
                setSelectedCategory("fees_per_mb");
              } else {
                setSortOrder(!sortOrder);
              }
            }}
          >
            <div>Fees/MB</div>
            <Icon
              icon={
                selectedCategory !== "fees_per_mb"
                  ? "formkit:arrowdown"
                  : sortOrder
                    ? "formkit:arrowdown"
                    : "formkit:arrowup"
              }
              className={` w-[10px] h-[10px] ${selectedCategory === "fees_per_mb"
                ? "text-forest-50 opacity-100"
                : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                } `}
            />
            <GTPTooltipNew
              placement="right"
              allowInteract={false}
              unstyled
              containerClass="z-50"
              trigger={<Icon icon="feather:info" className="w-[15px] h-[15px]" />}
            >
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-x-[10px] pl-1.5 pr-3 py-2 text-xs bg-color-bg-default dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto max-w-[280px] font-normal transition-all duration-300">
                  <div className="flex flex-col gap-y-[5px] items-center">
                    <div className="flex items-center gap-x-[5px] text-xxs">
                      The average cost that a Layer 2 pays per Megabyte of data submitted.
                    </div>
                  </div>
                </div>
              </div>
            </GTPTooltipNew>
          </div>
          <div className="w-full flex justify-end items-center heading-small-xxs font-bold pr-1 cursor-pointer"
            onClick={() => {
              if (selectedCategory !== "da_consumers") {
                setSortOrder(true);
                setSelectedCategory("da_consumers");
              } else {
                setSortOrder(!sortOrder);
              }
            }}
          >
            <div className="flex gap-x-[3px] items-center">{`DA Consumers (Total`}<div className="w-[6px] h-[6px] bg-color-bg-medium rounded-full"></div>{`Chains)`}</div>
            <Icon
              icon={
                selectedCategory !== "da_consumers"
                  ? "formkit:arrowdown"
                  : sortOrder
                    ? "formkit:arrowdown"
                    : "formkit:arrowup"
              }
              className={` w-[10px] h-[10px] ${selectedCategory === "da_consumers"
                ? "text-forest-50 opacity-100"
                : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                } `}
            />
            <GTPTooltipNew
              placement="right"
              allowInteract={false}
              unstyled
              containerClass="z-50"
              trigger={<Icon icon="feather:info" className="w-[15px] h-[15px]" />}
            >
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-x-[10px] pl-1.5 pr-3 py-2 text-xs bg-color-bg-default dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto max-w-[280px] font-normal transition-all duration-300">
                  <div className="flex flex-col gap-y-[5px] items-center">
                    <div className="flex items-center gap-x-[5px] text-xxs">
                      The Layer 2 networks that have submitted at least 100MB worth of data to the DA layer.
                    </div>
                  </div>
                </div>
              </div>
            </GTPTooltipNew>
          </div>
          {/* <div className="w-full flex justify-center items-center heading-small-xxs font-bold pr-0.5 ">
                  <div>Blob Count</div>
                  <Icon
                    icon={
                      selectedCategory !== "blob_count"
                        ? "formkit:arrowdown"
                        : sortOrder
                          ? "formkit:arrowdown"
                          : "formkit:arrowup"
                    }
                    className={` w-[10px] h-[10px] ${selectedCategory === "blob_count"
                      ? "text-forest-50 opacity-100"
                      : " opacity-50 group-hover:opacity-100 group-hover:text-forest-50"
                      } `}
                  />
                  <Tooltip key={"Blob Count"} placement="right">
                    <TooltipTrigger>
                      <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-x-[10px] pl-1.5 pr-3 py-2 text-xs bg-color-bg-default dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto max-w-[280px] font-normal transition-all duration-300">
                          <div className="flex flex-col gap-y-[5px] items-center">
                            <div className="flex items-center gap-x-[5px] text-xxs">
                              Blob Count
                            </div>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>  */}
          <div className="heading-small-xxs flex font-bold items-center pl-0.5 ">

          </div>
        </div>
        <div
          className={`relative overflow-visible flex flex-col -mt-[5px] min-w-[970px] z-0 transition-height duration-500 `}
          style={{ height: minimumHeight }}
        >
          {transitions((style, item) => {
            let typeIndex = breakdown_data[item.key][selectedTimespan]["fees"].types.indexOf(showUsd ? "usd" : "eth");


            return (
              <AnimatedDiv
                className={"absolute w-full flex flex-col pr-0.5 "}
                key={item.key + " chainGridParent"}
                style={{ ...style }}
              >
                <div
                  className={`grid  relative rounded-full w-full  min-h-[34px] text-sm items-center cursor-pointer pr-0.5 grid-cols-[auto_200px_199px_114px_280px_46px] min-w-[970px] 
                        ${isBouncing && bounceChain === item.key
                      ? "horizontal-bounce"
                      : ""
                    } ${isSidebarOpen
                      ? " 2xl:grid-cols-[auto_200px_199px_114px_280px_46px] grid-cols-[auto_200px_199px_94px_215px_46px] "
                      : "xl:grid-cols-[auto_200px_199px_94px_215px_46px] grid-cols-[auto_200px_199px_94px_215px_46px] "
                    }`}
                  onClick={(e) => {
                    handleClick(e, item.key);
                    e.stopPropagation();
                  }}
                >
                  <div
                    className={`flex items-center gap-x-[10px] pl-[5px] h-full bg-transparent ${columnBorder(
                      "name",
                      item.key,
                    )} `}
                  >
                    <div className="w-[26px] h-[26px] relative rounded-full bg-color-ui-active flex items-center justify-center" title={item.key.replaceAll("_", "-")}>
                      <Icon icon={`gtp:${AllDALayersByKeys[item.key].url_key.replaceAll("_", "-")}-logo-monochrome`} className="w-[15px] h-[15px]"
                        style={{
                          color:
                            AllDALayersByKeys[item.key].colors["dark"][0],
                        }}
                      />

                      <GTPIcon
                        icon="gtp-chevronright-monochrome"
                        className={` !w-[9px] !h-[6px] text-color-text-primary ${selectedTimespan !== "1d" ? "visible" : "hidden"}`}
                        size={"sm"}
                        containerClassName={`w-[15px] !overflow-visible h-[15px] flex items-center justify-center absolute top-[6px] text-color-text-primary -right-[5px] transition-transform duration-500 origin-[-2px_7px] ${openDA[item.key] && selectedTimespan !== "1d" ? "rotate-90" : "rotate-0"}`}
                      />
                    </div>
                    <div className="text-xs">{AllDALayersByKeys[item.key].name}</div>
                  </div>
                  <div
                    className={`flex items-center gap-x-[10px] pl-[5px] h-full bg-transparent ${columnBorder(
                      "size",
                      item.key,
                    )} `}
                  >
                    <div className="w-[90px] flex justify-end numbers-xs">
                      <div
                        className="numbers-xs"

                      >
                        {formatBytes(
                          breakdown_data[item.key][selectedTimespan].size.total[0],
                          2,
                        )}
                      </div>
                    </div>
                    <div
                      className={` w-[139px] pr-[10px] flex justify-start items-end pb-[6px] h-full ${isSidebarOpen ? "2xl:w-[125px]" : "xl:w-[125px]"
                        }`}
                    >
                      <div
                        className={`w-[129px] flex items-center justify-center rounded-full h-[4px] bg-color-accent-turquoise`}
                        style={{
                          width: `${(100 *
                            breakdown_data[item.key][selectedTimespan].size.total[0]) /
                            maxDataPosted
                            }%`,

                          minWidth: "4px",
                        }}
                      >
                        &nbsp;
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex w-full px-[5px] items-center gap-x-[10px] h-full bg-color-bg-medium-50  ${columnBorder(
                      "fees",
                      item.key,
                    )} `}
                  >
                    <div className="w-[90px] flex justify-end numbers-xs">
                      <div
                        className="numbers-xs"

                      >
                        {formatNumber(breakdown_data[item.key][selectedTimespan].fees.total[typeIndex])}
                      </div>
                    </div>
                    <div
                      className={` w-[110px] flex justify-start items-end pb-[6px] h-full ${isSidebarOpen ? "2xl:w-[125px]" : "xl:w-[125px]"
                        }`}
                    >
                      <div
                        className={`w-[110px] flex items-center justify-center rounded-full h-[4px] bg-color-accent-red`}
                        style={{
                          width: `${(100 *
                            breakdown_data[item.key][selectedTimespan].fees.total[typeIndex]) /
                            maxFeesPaid
                            }%`,

                          minWidth: "4px",
                        }}
                      >
                        &nbsp;
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex items-center numbers-xs justify-end w-full px-[5px] h-full bg-transparent  ${columnBorder(
                      "fees_per_mb",
                      item.key,
                    )} `}
                  >
                    <span>{showUsd ? "$" : "Ξ"}</span>
                    {breakdown_data[item.key][selectedTimespan].fees_per_mb.total[typeIndex] < 0.001 ? Number(breakdown_data[item.key][selectedTimespan].fees_per_mb.total[typeIndex]).toExponential(2) : Intl.NumberFormat("en-GB", {
                      notation: "compact",
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    }).format(breakdown_data[item.key][selectedTimespan].fees_per_mb.total[typeIndex])}
                  </div>
                  <div
                    className={`flex items-center justify-end h-full bg-color-bg-medium-50 ${columnBorder(
                      "da_consumers",
                      item.key,
                    )} `}
                  >
                    <div className="flex items-center gap-x-[10px] relative overflow-visible px-[10px] group h-full">
                      <GTPTooltipNew
                        key={"DA Consumers"}
                        size="sm"
                        placement="bottom-end"
                        allowInteract={true}
                        trigger={
                          createDAConsumers(breakdown_data[item.key][selectedTimespan].da_consumers)
                        }
                        containerClass="flex flex-col gap-y-[10px] !pr-[5px]"
                        positionOffset={{ mainAxis: 5, crossAxis: 0 }}
                      >
                        <DaConsumersTooltip item={item} selectedTimespan={selectedTimespan} breakdown_data={breakdown_data} AllChainsByKeys={AllChainsByKeys} master={master} />
                      </GTPTooltipNew>
                    </div>
                  </div>

                  <div
                    className={`flex relative overflow-visible items-center gap-x-[10px] w-full px-[5px] justify-center h-full bg-transparent group/more ${columnBorder(
                      "fixed_parameters",
                      item.key,
                    )} `}
                  >
                    <GTPTooltipNew
                      key={"More"}
                      size="sm"
                      placement="bottom-end"
                      allowInteract={true}
                      trigger={<Icon icon="gtp:gtp-more" className="w-[24px] h-[24px]" />}
                    ><MoreTooltip breakdown_data={breakdown_data} item={item} selectedTimespan={selectedTimespan} /></GTPTooltipNew>
                    {/* <MoreTooltip breakdown_data={breakdown_data} item={item} selectedTimespan={selectedTimespan} /> */}
                  </div>

                </div>
                <div
                  className={`flex bottom-2 z-0 relative top-[0px] justify-center w-full transition-height duration-300 overflow-hidden ${openDA[item.key] && selectedTimespan !== "1d"
                    ? "h-[295px]"
                    : "h-[0px]"
                    }`}
                >
                  <div className="w-[97.5%] bg-color-bg-default rounded-b-2xl border-dotted border-[1.25px] border-t-0 border-color-text-secondary">
                    {chart_data && master && (
                      <DATableCharts
                        data={chart_data.data.da_layers[item.key]}
                        selectedTimespan={selectedTimespan}
                        isMonthly={isMonthly}
                        isOpen={openDA[item.key]}
                        da_key={item.key}
                        da_name={AllDALayersByKeys[item.key].name}
                        pie_data={breakdown_data[item.key][selectedTimespan].da_consumer_chart}
                        master={master}
                      />
                    )}
                  </div>
                </div>

              </AnimatedDiv>
            )
          })}
          <div
            className={`z-[-1] grid w-full pl-[45px] absolute h-[34px] pr-0.5 grid-cols-[auto_200px_199px_114px_280px_46px] mb-[15px]  ${isSidebarOpen
              ? " 2xl:grid-cols-[auto_200px_199px_114px_280px_46px] grid-cols-[auto_200px_199px_94px_215px_46px] "
              : "xl:grid-cols-[auto_200px_199px_94px_215px_46px] grid-cols-[auto_200px_199px_94px_215px_46px]"
              } min-w-[970px]`}
            style={{
              bottom: `${29 + EXTRA_PADDING}px`,
            }}
          >
            <div className="inline-flex items-center"><div className="2xl:heading-large-xs heading-large-xxs ">TOTAL &nbsp;</div><div className="2xl:heading-large-xs heading-large-xxs  text-[#5A6462] ">  {selectedTimespan === "max" ? "FOR MAXIMUM TIMEFRAME AVAILABLE" : ("IN THE LAST " + (timespans[selectedTimespan].label).toUpperCase())}</div></div>
            <div className="w-full h-[34px] px-[2px]">
              <div className="flex rounded-full w-full h-[34px] border-color-bg-medium border-[1px] items-center justify-center numbers-xs  ">
                {formatBytes(breakdown_data["totals"][selectedTimespan].size.total[0], 2)}
              </div>
            </div>
            <div className="w-full h-[34px] px-[2px]">
              <div className="flex rounded-full w-full h-[34px] border-color-bg-medium border-[1px] items-center justify-center numbers-xs bg-color-bg-medium-50">
                {formatNumber(
                  breakdown_data["totals"][selectedTimespan].fees.total[
                  breakdown_data["totals"][selectedTimespan].fees.types.findIndex(
                    type => type === (showUsd ? "usd" : "eth")
                  )
                  ]
                )}
              </div>
            </div>
            <div className="w-full h-[34px] px-[2px]">
              <div className="flex rounded-full w-full h-[34px] border-color-bg-medium border-[1px] items-center justify-center numbers-xs ">
                {"Ø " + (breakdown_data["totals"][selectedTimespan].fees_per_mb.total[showUsd ? 0 : 1] < 0.001 ? Number(breakdown_data["totals"][selectedTimespan].fees_per_mb.total[showUsd ? 0 : 1]).toExponential(2) : Intl.NumberFormat("en-GB", {
                  notation: "compact",
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                }).format(breakdown_data["totals"][selectedTimespan].fees_per_mb.total[showUsd ? 0 : 1])) + ` ${showUsd ? "$" : "Ξ"}/MB`}
              </div>
            </div>
            <div className="w-full h-[34px] px-[2px]">
              <div className="flex rounded-full w-full h-[34px] border-color-bg-medium border-[1px] items-center justify-center numbers-xs bg-color-bg-medium-50">
                {totalDAConsumers}
              </div>
            </div>

          </div>

        </div>
      </HorizontalScrollContainer>
      {/* )} */}
    </>
  )
}

const DaConsumersTooltip = ({ item, selectedTimespan, breakdown_data, AllChainsByKeys, master }) => {
  const { theme } = useTheme();
  return (
    <>
    <TooltipHeader title="DA Consumers (Chains)" />
    <TooltipBody className="pl-[20px]">      
      <VerticalScrollContainer height={154 - 60} className="w-full" scrollThumbColor="#1F2726" scrollTrackColor="#151A19">
        <div className="flex flex-wrap items-center gap-x-[5px] gap-y-[5px] h-fit">
          {Object.keys(breakdown_data[item.key][selectedTimespan].da_consumers.chains.values).map((chain, index) => {
            const types = breakdown_data[item.key][selectedTimespan].da_consumers.chains.types


            const custom_logo_keys = Object.keys(master.custom_logos);
            const first_key = types.findIndex((type) => type.includes("gtp_origin_key"));
            const alt_key = types.findIndex((type) => type.includes("da_consumer_key"));

            // default to unlisted chain icon
            let icon = "gtp:chain-dark";
            let color = UNLISTED_CHAIN_COLORS[index];

            // check if chain exists in AllChainsByKeys 
            if (AllChainsByKeys[breakdown_data[item.key][selectedTimespan].da_consumers.chains.values[index][first_key]]) {
              icon = `gtp:${AllChainsByKeys[breakdown_data[item.key][selectedTimespan].da_consumers.chains.values[index][first_key]].urlKey}-logo-monochrome`;
              color = AllChainsByKeys[breakdown_data[item.key][selectedTimespan].da_consumers.chains.values[index][first_key]].colors[theme ?? "dark"][0];
              // check if chain exists in custom logos (see libs/icons.mjs for how it gets imported)
            } else if (custom_logo_keys.includes(alt_key)) {
              icon = `gtp:${alt_key}-custom-logo-monochrome`;
              color = "#b5c4c3";
            }
            return (
              <Badge
                key={index + "da_consumers"}
                leftIcon={icon}
                leftIconColor={color}
                label={breakdown_data[item.key][selectedTimespan].da_consumers.chains.values[index][1]}
                size="sm"
                className="!cursor-default select-none group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto hover:pointer-events-auto"
                onClick={() => {
                }}
              />
            );
          })}
        </div>
      </VerticalScrollContainer>
    </TooltipBody>
    </>
  )
}

const MoreTooltip = ({ item, selectedTimespan, breakdown_data }) => {
  return (
    <>
    <TooltipHeader title="Parameters" />
    <TooltipBody className="pl-[20px]">
      <div>
        {[{
          key: "blob_size",
          label: "Blob Size",
        }, {
          key: "bandwidth",
          label: "Bandwidth",
        }, {
          key: "block_time",
          label: "Blocktime",
        }, {
          key: "l2beat_risk",
          label: "Risk Analysis",
        }].map((param) => (
          <div key={param.key} className="flex items-center gap-x-[5px] h-[20px]">
            <div className="text-xs">{param.label}:</div>
            <div className="numbers-xs">
              {param.key === "l2beat_risk" ? (
                <Link href={breakdown_data[item.key][selectedTimespan].fixed_params[param.key]} target="_blank" className="underline">
                  L2BEAT DA Risk
                </Link>
              ) : (
                breakdown_data[item.key][selectedTimespan].fixed_params[param.key]
              )}
            </div>
          </div>
        ))}
      </div>
    </TooltipBody>
    </>
  );
}
