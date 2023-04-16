import { AllChainsByKeys } from "@/lib/chains";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage, useMediaQuery, useSessionStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import d3 from "d3";
import moment from "moment";

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

    let clv = [];

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

    setChainsLastVal(clv.sort((a, b) => b.lastVal - a.lastVal));

    setMaxVal(max);
  }, [chains, data]);

  return (
    <>
      <div
        className={`flex flex-col mt-12 ${
          interactable ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`flex items-center py-1 pl-2 pr-4 rounded-full gap-x-2 lg:gap-x-8 font-semibold whitespace-nowrap text-xs lg:text-sm`}
        >
          <div className="basis-2/5 pl-14">Chain</div>
          <div className="basis-1/5 text-right capitalize">
            {metric} User Base
          </div>
          <div className="basis-1/5 text-right">User Share</div>
          <div className="basis-1/5 text-right">Age</div>
          <div className="basis-1/5">Technology</div>
        </div>
        {chains &&
          chainsLastVal &&
          chainsLastVal.map((clv, i) => {
            const chain = clv.chain;
            return (
              <div
                key={chain.key}
                className={`flex gap-x-2 lg:gap-x-8 items-center cursor-pointer p-1.5 lg:p-3 rounded-full w-full font-[400] border-[1px] border-forest-500 whitespace-nowrap text-xs lg:text-sm ${
                  i > 0 ? "-mt-[1px]" : ""
                } ${
                  selectedChains.includes(chain.key)
                    ? " hover:bg-forest-50"
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
                <div className="flex basis-2/5 items-center space-x-4">
                  <div className="relative">
                    <div
                      className={`w-8 h-8 rounded-full bg-white border-[5px] ${chain.border[theme][1]}`}
                    ></div>
                    <Image
                      src={chain.icon}
                      alt={chain.label}
                      width={18}
                      height={18}
                      className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`}
                    />
                  </div>
                  <div className="break-inside-avoid text-xs md:text-sm lg:text-lg">
                    {chain.label}
                  </div>
                </div>
                <div className="basis-1/5 flex justify-end items-center">
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
                              data.chains[chain.key].data.types.includes("usd")
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
                    <div className="absolute -bottom-[4px] right-0 w-full h-1 bg-black/30 rounded-md"></div>
                    <div
                      className={`absolute -bottom-[4px] right-0 h-1 bg-green-500 rounded-md`}
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
                <div className="basis-1/5 text-right">
                  {d3.format(
                    data.chains[chain.key].user_share > 0.01 ? ".1%" : ".1%"
                  )(data.chains[chain.key].user_share)}
                </div>
                <div className="basis-1/5 text-right">
                  {/* format as 1 year 2 months */}
                  {moment
                    .duration(
                      moment().diff(
                        moment(master.chains[chain.key].launch_date)
                      )
                    )
                    .humanize()}
                </div>
                <div className="basis-1/5 capitalize">
                  {master && master.chains[chain.key].rollup === "-" ? (
                    " - "
                  ) : (
                    <>
                      <span>{master.chains[chain.key].rollup}</span>{" "}
                      <span className="hidden lg:inline-block">Rollup</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}
