import { useState, useMemo } from "react";
import useSWR from "swr";
import ChainComponent from "@/components/charts/ChainComponent";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "usehooks-ts";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import { useUIContext } from "@/contexts/UIContext";
import ContractCard from "@/components/layout/ContractCard";
import { useLocalStorage } from "usehooks-ts";

export default function LandingTopContracts({ ariaId }: { ariaId?: string }) {
  const {
    data: landing,
    error: landingError,
    isLoading: landingLoading,
    isValidating: landingValidating,
    // } = useSWR<LandingPageMetricsResponse>(LandingURL);
  } = useSWR<any>("/mock/landing_page.json");

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [selectedTimespan, setSelectedTimespan] = useState("1d");
  const [selectedMetric, setSelectedMetric] = useState("gas_fees");

  const metrics = useMemo(
    () => ({
      gas_fees: {
        label: "Gas Fees",
        key: showUsd ? "gas_fees_usd" : "gas_fees_eth",
      },
      txcount: {
        label: "Transactions",
        key: "txcount",
      },
      daa: {
        label: "Daily Users",
        key: "daa",
      },
    }),
    [showUsd],
  );

  const timespans = {
    "1d": {
      label: "Yesterday",
    },
    "7d": {
      label: "7 Days",
    },
    "30d": {
      label: "30 Days",
    },
    "90d": {
      label: "90 Days",
    },
    // "180d": {
    //   label: "180 Days",
    // },
    // "365d": {
    //   label: "1 Year",
    // },
  };

  return (
    <>
      {landing && (
        <div className="lg:-mt-14 flex flex-col">
          <div className="flex flex-col rounded-[15px] py-[2px] px-[2px] text-xs lg:text-base lg:flex lg:flex-row justify-end items-center w-auto ml-0 lg:ml-auto lg:rounded-full dark:bg-[#1F2726] bg-forest-50 md:py-[2px] mb-4">
            {/* <div className="flex w-full xl:w-auto justify-between xl:justify-center items-stretch xl:items-center space-x-[4px] xl:space-x-1">
              <button
                className={`rounded-full grow px-4 py-1.5 xl:py-4 font-medium ${
                  "gas_fees" === selectedMetric
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedMetric("gas_fees");
                }}
              >
                Gas Fees
              </button>
              <button
                className={`rounded-full grow px-4 py-1.5 xl:py-4 font-medium ${
                  "txcount" === selectedMetric
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedMetric("txcount");
                }}
              >
                Transactions
              </button>
              <button
                className={`rounded-full grow px-4 py-1.5 xl:py-4 font-medium ${
                  "daa" === selectedMetric
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedMetric("daa");
                }}
              >
                Daily Users
              </button>
            </div>
            <div className="block xl:hidden w-[70%] mx-auto my-[10px]">
              <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
            </div> */}
            <div className="flex w-full lg:w-auto justify-between lg:justify-center items-stretch lg:items-center mx-4 lg:mx-0 space-x-[4px] lg:space-x-1">
              {Object.keys(landing.data.top_contracts)
                .filter((timespan) => Object.keys(timespans).includes(timespan))
                .map((timespan) => (
                  <button
                    key={timespan}
                    //rounded-full sm:w-full px-4 py-1.5 xl:py-4 font-medium
                    className={`rounded-full grow px-4 py-1.5 lg:py-4 font-medium ${
                      selectedTimespan === timespan
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                      setSelectedTimespan(timespan);
                    }}
                  >
                    {timespans[timespan].label}
                  </button>
                ))}
            </div>
          </div>

          <div className="grid grid-rows-6 grid-cols-1 lg:grid-rows-3 lg:grid-cols-2 xl:grid-rows-2 xl:grid-cols-3 gap-x-[10px] gap-y-[15px]">
            {new Array(6).fill(0).map((_, i) => (
              <ContractCard
                key={i}
                data={landing.data.top_contracts[selectedTimespan].data[i]}
                types={landing.data.top_contracts[selectedTimespan].types}
                metric={metrics[selectedMetric].key}
                changeSuffix={`in last ${
                  selectedTimespan === "1d"
                    ? "1 day"
                    : `${parseInt(selectedTimespan)} days`
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
