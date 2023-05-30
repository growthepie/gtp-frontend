import { AllChainsByKeys } from "@/lib/chains";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { useTheme } from "next-themes";
import d3 from "d3";
import moment from "moment";
import { Icon } from "@iconify/react";
import { useTransition, animated } from "@react-spring/web";

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

  const isMobile = useMediaQuery("(max-width: 1023px)");

  const { theme } = useTheme();

  // set maxVal
  useEffect(() => {
    if (!data) return;

    setMaxVal(
      Math.max(
        ...Object.keys(data.chains)
          .filter(
            (chain) =>
              Object.keys(AllChainsByKeys).includes(chain) &&
              AllChainsByKeys[chain].chainType != null &&
              AllChainsByKeys[chain].chainType != "L1"
          )
          .map((chain) => {
            return data.chains[chain].data.data[
              data.chains[chain].data.data.length - 1
            ][1];
          })
      )
    );
  }, [data, data.chains, showUsd]);

  const rows = useCallback(() => {
    if (!data) return [];
    return Object.keys(data.chains)
      .filter((chain) => Object.keys(AllChainsByKeys).includes(chain))
      .map((chain: any) => {
        return {
          data: data[chain],
          chain: AllChainsByKeys[chain],
          lastVal:
            data.chains[chain].data.data[
              data.chains[chain].data.data.length - 1
            ][1],
        };
      })
      .filter(
        (row) => row.chain.chainType != null && row.chain.chainType != "L1"
      )
      .sort((a, b) => {
        // always show multiple at the bottom
        if (a.chain.key === "multiple") return 1;
        if (b.chain.key === "multiple") return -1;

        // sort by last value in daily data array and keep unselected chains at the bottom in descending order
        if (selectedChains.includes(a.chain.key)) {
          if (selectedChains.includes(b.chain.key)) {
            return b.lastVal - a.lastVal;
          } else {
            return -1;
          }
        } else {
          if (selectedChains.includes(b.chain.key)) {
            return 1;
          } else {
            return b.lastVal - a.lastVal;
          }
        }
      });
  }, [data, selectedChains]);

  let height = 0;
  const transitions = useTransition(
    rows()
      .filter((row) => row.chain.key != "multiple")
      .map((data) => ({
        ...data,
        y: (height += isMobile ? 50 : 66) - (isMobile ? 50 : 66),
        height: isMobile ? 50 : 66,
      })),
    {
      key: (d) => d.chain.key,
      from: { opacity: 0, height: 0 },
      leave: { opacity: 0, height: 0 },
      enter: ({ y, height }) => ({ opacity: 1, y, height }),
      update: ({ y, height }) => ({ y, height }),
      config: { mass: 5, tension: 500, friction: 100 },
      trail: 25,
    }
  );

  const timespanLabels = {
    "1d": "24h",
    "7d": "7 days",
    "30d": "30 days",
    "365d": "1 year",
  };

  return (
    <>
      <div className="flex flex-col mt-3 md:mt-32 space-y-[5px] overflow-x-scroll lg:overflow-x-hidden z-100 w-full p-0 pt-3 pb-5 md:px-2 md:pt-2 scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller">
        <div
          className={`min-w-[820px] md:min-w-[850px] pr-[20px] md:pr-[50px] w-full ${
            interactable ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <div
            className={`flex space-x-5 items-center rounded-full font-semibold text-xs lg:text-sm pr-2 py-1 pl-2`}
          >
            <div className="w-[22.5%] pl-14">Chain</div>
            <div className="w-1/12">Age</div>
            <div className="w-1/5">Purpose</div>
            <div className="w-2/12">Technology</div>
            <div className="flex-1 text-right capitalize">
              Weekly Active Addresses
            </div>
            <div className="w-[10%] text-right pr-14">User Share</div>
          </div>
          <div className="flex flex-col">
            <div className="w-full relative" style={{ height }}>
              {transitions((style, item, t, index) => {
                return (
                  <animated.div
                    className="absolute w-full"
                    style={{
                      zIndex: Object.keys(data).length - index,
                      ...style,
                    }}
                  >
                    <div
                      key={item.chain.key}
                      className={`flex space-x-5 items-center cursor-pointer p-1.5 py-[4px] lg:p-3 lg:py-[11.5px] rounded-full w-full font-[400] border-[1px] border-black/[16%] dark:border-white/[16%] whitespace-nowrap text-xs lg:text-[0.95rem] ${
                        index > 0 ? "-mt-[1px]" : ""
                      } ${
                        selectedChains.includes(item.chain.key)
                          ? " hover:bg-forest-500/10"
                          : "opacity-50 grayscale hover:opacity-70 hover:grayscale-20 transition-all duration-100"
                      }`}
                      onClick={() => {
                        if (selectedChains.includes(item.chain.key)) {
                          setSelectedChains(
                            selectedChains.filter((c) => c !== item.chain.key)
                          );
                        } else {
                          setSelectedChains([
                            ...selectedChains,
                            item.chain.key,
                          ]);
                        }
                      }}
                    >
                      <div className="flex w-[22.5%] items-center space-x-4">
                        <div className="relative">
                          <div
                            className={`w-9 h-9 rounded-full border-[5px] ${
                              item.chain.border[theme ?? "dark"][1]
                            }`}
                          ></div>
                          <Icon
                            icon={`gtp:${item.chain.urlKey}-logo-monochrome`}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5"
                            style={{
                              color: item.chain.colors[theme ?? "dark"][1],
                            }}
                          />
                        </div>
                        <div className="break-inside-avoid text-xs md:text-sm lg:text-lg">
                          {item.chain.label}
                        </div>
                      </div>
                      <div className="w-1/12">
                        {/* format as 1 year 2 months */}
                        {item.chain.chainType === "L2" &&
                          moment
                            .duration(
                              moment().diff(
                                moment(
                                  master.chains[item.chain.key].launch_date
                                )
                              )
                            )
                            .humanize()}
                      </div>
                      <div className="w-1/5 capitalize">
                        {master && master.chains[item.chain.key].purpose && (
                          <span>{master.chains[item.chain.key].purpose}</span>
                        )}
                      </div>
                      <div className="w-2/12 capitalize">
                        {item.chain.chainType === "L2" &&
                        master &&
                        master.chains[item.chain.key].rollup === "-" ? (
                          " - "
                        ) : (
                          <>
                            {item.chain.chainType === "L2" && (
                              <>
                                <span>
                                  {master.chains[item.chain.key].rollup}
                                </span>{" "}
                                <span className="">
                                  {master.chains[item.chain.key].technology}
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex-1 flex justify-end items-center">
                        {/* <div className="flex flex-1 align-middle items-center"> */}
                        <div className={`relative w-full`}>
                          <div className="flex w-full justify-end">
                            {data.chains[item.chain.key].data.types.includes(
                              "usd"
                            ) && (
                              <>
                                {showUsd ? (
                                  <div className="">$</div>
                                ) : (
                                  <div className="">Ξ</div>
                                )}
                              </>
                            )}
                            {data.chains[item.chain.key].data.types.includes(
                              "usd"
                            )
                              ? Intl.NumberFormat(undefined, {
                                  notation: "compact",
                                  maximumFractionDigits: 2,
                                  minimumFractionDigits: 2,
                                }).format(
                                  data.chains[item.chain.key].data.data[
                                    data[item.chain.key].data.data.length - 1
                                  ][
                                    !showUsd &&
                                    data.chains[
                                      item.chain.key
                                    ].data.types.includes("usd")
                                      ? 2
                                      : 1
                                  ]
                                )
                              : Intl.NumberFormat(undefined, {
                                  notation: "compact",
                                  maximumFractionDigits: 2,
                                  minimumFractionDigits: 2,
                                }).format(
                                  data.chains[item.chain.key].data.data[
                                    data.chains[item.chain.key].data.data
                                      .length - 1
                                  ][1]
                                )}
                          </div>
                          <div className="absolute -bottom-[6px] right-0 w-full h-1 bg-black/10 rounded-none"></div>
                          <div
                            className={`absolute -bottom-[6px] right-0 h-1 bg-forest-900 dark:bg-forest-50 rounded-none`}
                            style={{
                              width: `${
                                (data.chains[item.chain.key].data.data[
                                  data.chains[item.chain.key].data.data.length -
                                    1
                                ][1] /
                                  maxVal) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-[10%] text-right pr-14">
                        {d3.format(
                          data.chains[item.chain.key].user_share > 0.01
                            ? ".1%"
                            : ".1%"
                        )(data.chains[item.chain.key].user_share)}
                      </div>
                      {interactable && (
                        <div className={`absolute  ${"-right-[20px]"}`}>
                          <div className="absolute rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`w-6 h-6 ${
                                selectedChains.includes(item.chain.key)
                                  ? "opacity-0"
                                  : "opacity-100"
                              }`}
                            >
                              <circle
                                xmlns="http://www.w3.org/2000/svg"
                                cx="12"
                                cy="12"
                                r="10"
                              />
                            </svg>
                          </div>
                          <div className="p-1 rounded-full bg-forest-50 dark:bg-forest-900">
                            <Icon
                              icon="feather:check-circle"
                              className={`w-6 h-6 ${
                                selectedChains.includes(item.chain.key)
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </animated.div>
                );
              })}

              {/* {chains &&
          chainsLastVal &&
          chainsLastVal.map((clv, i) => {
            const chain = clv.chain;
            return (
              <div key={i} className="flex flex-col">
                {i === chainsLastVal.length - 1 && (
                  <>
                    <div className="pt-[32px] pb-[32px] w-3/5 mx-auto">
                      <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
                    </div>
                    <div className="flex space-x-2 pl-16 pb-0.5">

                      <span className="text-xs">
                        The following figure, “Multiple”, represents the number
                        of unique addresses interacting with one or multiple L2s
                        in a given week.
                      </span>
                    </div>
                  </>
                )}
                
              </div>
            );
          })} */}
            </div>
            <div className="py-[16px] md:py-[32px] w-3/5 mx-auto">
              <hr className="border-dotted border-top-[1px] h-[0.5px] border-black/[16%] dark:border-white/[16%]" />
            </div>
            <div className="flex space-x-2 pl-16 pb-0.5">
              <span className="text-xs">
                The following figure, “Multiple”, represents the number of
                unique addresses that were active on multiple Layer 2s in a
                given week.
              </span>
            </div>
            {rows().length > 0 &&
              rows()
                .filter((row) => row.chain.key === "multiple")
                .map((item, index) => (
                  <div
                    key={item.chain.key}
                    className={`flex space-x-5 items-center cursor-pointer p-1.5 py-[4px] lg:p-3 lg:py-[11.5px] rounded-full w-full font-[400] border-[1px] border-black/[16%] dark:border-white/[16%] whitespace-nowrap text-xs lg:text-[0.95rem] relative ${
                      selectedChains.includes(item.chain.key)
                        ? " hover:bg-forest-500/10"
                        : "opacity-50 grayscale hover:opacity-70 hover:grayscale-20 transition-all duration-100"
                    }`}
                    onClick={() => {
                      if (selectedChains.includes(item.chain.key)) {
                        setSelectedChains(
                          selectedChains.filter((c) => c !== item.chain.key)
                        );
                      } else {
                        setSelectedChains([...selectedChains, item.chain.key]);
                      }
                    }}
                  >
                    <div className="flex w-[22.5%] items-center space-x-4">
                      <div className="relative">
                        <div
                          className={`w-9 h-9 rounded-full border-[5px] ${
                            item.chain.border[theme ?? "dark"][1]
                          }`}
                        ></div>
                        <Icon
                          icon={`gtp:${item.chain.urlKey}-logo-monochrome`}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5"
                          style={{
                            color: item.chain.colors[theme ?? "dark"][1],
                          }}
                        />
                      </div>
                      <div className="break-inside-avoid text-xs md:text-sm lg:text-lg">
                        {item.chain.label}
                      </div>
                    </div>
                    <div className="w-2/12">
                      {/* format as 1 year 2 months */}
                      {item.chain.chainType === "L2" &&
                        moment
                          .duration(
                            moment().diff(
                              moment(master.chains[item.chain.key].launch_date)
                            )
                          )
                          .humanize()}
                    </div>
                    <div className="w-1/5 capitalize">
                      {item.chain.chainType === "L2" &&
                      master &&
                      master.chains[item.chain.key].rollup === "-" ? (
                        " - "
                      ) : (
                        <>
                          {item.chain.chainType === "L2" && (
                            <>
                              <span>
                                {master.chains[item.chain.key].rollup}
                              </span>{" "}
                              <span className="hidden lg:inline-block">
                                {master.chains[item.chain.key].technology}
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex-1 flex justify-end items-center">
                      {/* <div className="flex flex-1 align-middle items-center"> */}
                      <div className={`relative w-full`}>
                        <div className="flex w-full justify-end">
                          {data.chains[item.chain.key].data.types.includes(
                            "usd"
                          ) && (
                            <>
                              {showUsd ? (
                                <div className="">$</div>
                              ) : (
                                <div className="">Ξ</div>
                              )}
                            </>
                          )}
                          {data.chains[item.chain.key].data.types.includes(
                            "usd"
                          )
                            ? Intl.NumberFormat(undefined, {
                                notation: "compact",
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2,
                              }).format(
                                data.chains[item.chain.key].data.data[
                                  data[item.chain.key].data.data.length - 1
                                ][
                                  !showUsd &&
                                  data.chains[
                                    item.chain.key
                                  ].data.types.includes("usd")
                                    ? 2
                                    : 1
                                ]
                              )
                            : Intl.NumberFormat(undefined, {
                                notation: "compact",
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2,
                              }).format(
                                data.chains[item.chain.key].data.data[
                                  data.chains[item.chain.key].data.data.length -
                                    1
                                ][1]
                              )}
                        </div>
                        <div className="absolute -bottom-[6px] right-0 w-full h-1 bg-black/10 rounded-none"></div>
                        <div
                          className={`absolute -bottom-[6px] right-0 h-1 bg-forest-900 dark:bg-forest-50 rounded-none`}
                          style={{
                            width: `${
                              (data.chains[item.chain.key].data.data[
                                data.chains[item.chain.key].data.data.length - 1
                              ][1] /
                                maxVal) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-[10%] text-right pr-14">
                      {d3.format(
                        data.chains[item.chain.key].user_share > 0.01
                          ? ".1%"
                          : ".1%"
                      )(data.chains[item.chain.key].user_share)}
                    </div>
                    {interactable && (
                      <div className={`absolute  ${"-right-[20px]"}`}>
                        <div className="absolute rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`w-6 h-6 ${
                              selectedChains.includes(item.chain.key)
                                ? "opacity-0"
                                : "opacity-100"
                            }`}
                          >
                            <circle
                              xmlns="http://www.w3.org/2000/svg"
                              cx="12"
                              cy="12"
                              r="10"
                            />
                          </svg>
                        </div>
                        <div className="p-1 rounded-full bg-forest-50 dark:bg-forest-900">
                          <Icon
                            icon="feather:check-circle"
                            className={`w-6 h-6 ${
                              selectedChains.includes(item.chain.key)
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
          </div>
        </div>
      </div>
    </>
  );
}
