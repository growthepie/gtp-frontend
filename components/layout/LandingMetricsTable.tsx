import { AllChainsByKeys } from "@/lib/chains";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage, useMediaQuery, useSessionStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import d3 from "d3";
import moment from "moment";
import { Icon } from "@iconify/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

export default function LandingMetricsTable({
  data,
  chains,
  selectedChains,
  setSelectedChains,
  metric,
  master,
  interactable,
}: {
  data: any;
  chains: any;
  selectedChains: any;
  setSelectedChains: any;
  metric: string;
  master: any;
  interactable: boolean;
}) {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [maxVal, setMaxVal] = useState(0);

  const [chainsLastVal, setChainsLastVal] = useState<
    { chain: any; lastVal: number }[]
  >([]);

  const { theme } = useTheme();

  // check if screen is large enough to show sidebar
  const isLargeScreen = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (!data) return;

    let clv: any[] = [];

    let max = 0;
    console.log("chains", chains);
    console.log(data);

    chains.forEach((chain) => {
      if (!chain.chainType) return;
      console.log("chain", chain);

      let last =
        data.chains[chain.key].data.data[
          data.chains[chain.key].data.data.length - 1
        ][1];

      clv = [...clv, { chain, lastVal: last }];

      if (max < last) max = last;
    });

    // sort so multiple is last
    setChainsLastVal(
      clv
        .sort((a, b) => b.lastVal - a.lastVal)
        .sort((a, b) => {
          if (a.chain.key === "multiple") return 1;
          if (b.chain.key === "multiple") return -1;
          return 0;
        })
    );

    setMaxVal(max);
  }, [chains, data]);

  return (
    <>
      <div
        className={`flex flex-col mt-12 space-y-[5px] ${
          interactable ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`flex items-center py-1 pl-2 pr-2 rounded-full gap-x-2 lg:gap-x-8 font-semibold whitespace-nowrap text-xs lg:text-sm`}
        >
          <div className="basis-3/12 pl-14">Chain</div>
          <div className="basis-2/12">Age</div>
          <div className="basis-2/12">Technology</div>
          <div className="basis-3/12 text-right capitalize">
            Daily Active Addresses
          </div>
          <div className="basis-2/12 text-right pr-14">User Share</div>
        </div>
        {chains &&
          chainsLastVal &&
          chainsLastVal.map((clv, i) => {
            const chain = clv.chain;
            return (
              <>
                {i === chainsLastVal.length - 1 && (
                  <>
                    <div className="pt-[32px] pb-[32px] w-3/5 mx-auto">
                      <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
                    </div>
                    <div className="flex space-x-2 pl-16 pb-0.5">
                      {/* <Tooltip placement="right">
                        <TooltipTrigger>
                          <Icon
                            icon="feather:info"
                            className="w-4 h-4 font-semibold"
                          />
                        </TooltipTrigger>
                        <TooltipContent className="p-3 text-sm font-medium bg-forest-300 text-forest-900 rounded-xl shadow-lg z-50 flex items-center">
                          Number of unique addresses interacting with one or
                          multiple L2s in a given week.
                        </TooltipContent>
                      </Tooltip> */}
                      <span className="text-xs">
                        The following figure, “Multiple”, represents the number
                        of unique addresses interacting with one or multiple L2s
                        in a given week.
                      </span>
                    </div>
                  </>
                )}
                <div
                  key={chain.key}
                  className={`flex gap-x-2 lg:gap-x-8 items-center cursor-pointer p-1.5 lg:p-3 rounded-full w-full font-[400] border-[1px] border-forest-500 whitespace-nowrap text-xs lg:text-[0.95rem] ${
                    i > 0 ? "-mt-[1px]" : ""
                  } ${
                    selectedChains.includes(chain.key)
                      ? " hover:bg-forest-50/10"
                      : "opacity-50 grayscale hover:opacity-70 hover:grayscale-20 transition-all duration-100"
                  }`}
                  onClick={() => {
                    if (selectedChains.includes(chain.key)) {
                      setSelectedChains(
                        selectedChains.filter((c) => c !== chain.key)
                      );
                    } else {
                      setSelectedChains([...selectedChains, chain.key]);
                    }
                  }}
                >
                  <div className="flex basis-3/12 items-center space-x-4">
                    <div className="relative">
                      <div
                        className={`w-9 h-9 rounded-full border-[5px] ${
                          chain.border[theme ?? "dark"][1]
                        }`}
                      ></div>
                      <Icon
                        icon={`gtp:${chain.urlKey}-logo-monochrome`}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5"
                        style={{
                          color: chain.colors[theme ?? "dark"][1],
                        }}
                      />
                    </div>
                    <div className="break-inside-avoid text-xs md:text-sm lg:text-lg">
                      {chain.label}
                    </div>
                  </div>
                  <div className="basis-2/12">
                    {/* format as 1 year 2 months */}
                    {chain.chainType === "L2" &&
                      moment
                        .duration(
                          moment().diff(
                            moment(master.chains[chain.key].launch_date)
                          )
                        )
                        .humanize()}
                  </div>
                  <div className="basis-2/12 capitalize">
                    {chain.chainType === "L2" &&
                    master &&
                    master.chains[chain.key].rollup === "-" ? (
                      " - "
                    ) : (
                      <>
                        {chain.chainType === "L2" && (
                          <>
                            <span>{master.chains[chain.key].rollup}</span>{" "}
                            <span className="hidden lg:inline-block">
                              {master.chains[chain.key].technology}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <div className="basis-3/12 flex justify-end items-center">
                    {/* <div className="flex flex-1 align-middle items-center"> */}
                    <div className={`relative w-full`}>
                      <div className="flex w-full justify-end">
                        {data.chains[chain.key].data.types.includes("usd") && (
                          <>
                            {showUsd ? (
                              <div className="">$</div>
                            ) : (
                              <div className="">Ξ</div>
                            )}
                          </>
                        )}
                        {data.chains[chain.key].data.types.includes("usd")
                          ? Intl.NumberFormat(undefined, {
                              notation: "compact",
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 2,
                            }).format(
                              data.chains[chain.key].data.data[
                                data[chain.key].data.data.length - 1
                              ][
                                !showUsd &&
                                data.chains[chain.key].data.types.includes(
                                  "usd"
                                )
                                  ? 2
                                  : 1
                              ]
                            )
                          : Intl.NumberFormat(undefined, {
                              notation: "compact",
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 2,
                            }).format(
                              data.chains[chain.key].data.data[
                                data.chains[chain.key].data.data.length - 1
                              ][1]
                            )}
                      </div>
                      <div className="absolute -bottom-[6px] right-0 w-full h-1 bg-black/10 rounded-none"></div>
                      <div
                        className={`absolute -bottom-[6px] right-0 h-1 bg-forest-400 rounded-none`}
                        style={{
                          width: `${
                            (data.chains[chain.key].data.data[
                              data.chains[chain.key].data.data.length - 1
                            ][1] /
                              maxVal) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="basis-2/12 text-right pr-14">
                    {d3.format(
                      data.chains[chain.key].user_share > 0.01 ? ".1%" : ".1%"
                    )(data.chains[chain.key].user_share)}
                  </div>
                </div>
              </>
            );
          })}
      </div>
    </>
  );
}
