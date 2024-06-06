"use client";
import Icon from "@/components/layout/Icon";
import Image from "next/image";
import Heading from "@/components/layout/Heading";
import { useState, useEffect, useMemo } from "react";
import {
  TopRowContainer,
  TopRowParent,
  TopRowChild,
} from "@/components/layout/TopRow";
import { GloHolderURL } from "@/lib/urls";
import useSWR from "swr";
import { IS_DEVELOPMENT, IS_PREVIEW, IS_PRODUCTION } from "@/lib/helpers";
import { HolderResponse, TableDataBreakdown } from "@/types/api/Holders";
import { useTransition, animated } from "@react-spring/web";
import ShowLoading from "@/components/layout/ShowLoading";

export default function StableInsights({}: {}) {
  const [clicked, setClicked] = useState(true);
  const [sortOrder, setSortOrder] = useState(true);
  const [sortMetric, setSortMetric] = useState("balance");
  const [selectedTimespan, setSelectedTimespan] = useState("180d");
  const handleClick = () => {
    setClicked(!clicked);
  };

  const {
    data: data,
    error: error,
    isLoading: isLoading,
    isValidating: isValidating,
  } = useSWR<HolderResponse>(GloHolderURL);

  const timespans = useMemo(() => {
    return {
      "30d": {
        label: "30 days",
        value: 30,
        xMin: Date.now() - 30 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "90d": {
        label: "90 days",
        value: 90,
        xMin: Date.now() - 90 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "180d": {
        label: "180 days",
        value: 180,
        xMin: Date.now() - 180 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      max: {
        label: "Maximum",
        value: 0,
      },
    };
  }, []);

  const sortedTableData = useMemo(() => {
    if (!data) return;

    const holdersTable = data.holders_table;
    const sortedEntries = Object.entries(holdersTable).sort(
      ([keyA, valueA], [keyB, valueB]) =>
        valueB[sortMetric] - valueA[sortMetric],
    );

    const sortedData = sortedEntries.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as TableDataBreakdown);

    return sortedData;
  }, [data, sortMetric]);

  const transitions = useTransition(
    sortedTableData
      ? (sortOrder
          ? Object.keys(sortedTableData)
          : Object.keys(sortedTableData).reverse()
        ).map((key, index) => ({
          y: index * 39,
          height: 34,
          key: key,
          i: index,
        }))
      : [],
    {
      key: (d) => d.key,
      from: { height: 0 },
      leave: { height: 0 },
      enter: ({ y, height }) => ({ y, height }),
      update: ({ y, height }) => ({ y, height }),
      config: { mass: 5, tension: 500, friction: 100 },
      trail: 25,
    },
  );

  function formatNumber(x: number) {
    return (
      <div className="flex gap-x-0.5 ">
        <span>
          {Intl.NumberFormat("en-GB", {
            notation: "standard",
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          }).format(x)}
        </span>
      </div>
    );
  }

  return (
    <>
      {(IS_DEVELOPMENT || IS_PREVIEW) && sortedTableData && data && (
        <div className="flex flex-col gap-y-[15px]">
          <div className="flex items-center gap-x-[8px] ">
            <Image
              src="/GTP-Package.svg"
              alt="GTP Chain"
              className="object-contain w-[32px] h-[32px] "
              height={36}
              width={36}
            />
            <Heading className="text-[30px] leading-snug " as="h1">
              Stablecoin Insights
            </Heading>
          </div>
          <div className="w-full h-[36px] bg-[#24E5DF] rounded-full flex items-center pl-2 gap-x-[10px] ">
            <div
              className="bg-white dark:bg-forest-1000 rounded-full w-[24px] h-[24px] p-1 flex items-center justify-center relative cursor-pointer "
              onClick={(e) => {
                handleClick();
              }}
            >
              <Image
                src={"/Glo_Dollar.svg"}
                className="w-[16px] h-[16px]"
                alt={"Glo Dollar Icon"}
                height={16}
                width={16}
              />
              <Icon
                icon={"gtp:circle-arrow"}
                className={`w-[4px] h-[9px] absolute top-2 right-0 `}
                style={{
                  transform: `rotate(${clicked ? "90deg" : "0deg"})`,
                  transformOrigin: "-8px 4px",
                  transition: "transform 0.5s",
                }}
              />
            </div>
            <div className="text-[#1F2726] text-[20px] font-bold">
              Top 10 Glo Dollar Stablecoin Holders
            </div>
          </div>
          <div
            className="overflow-clip hover:!overflow-visible flex flex-col gap-y-[10px] px-[30px]"
            style={{
              maxHeight: `${clicked ? "739px" : "0px"}`,
              transition: "all 0.4s",
            }}
          >
            <div className="flex lg:flex-row md:flex-col w-full justify-between px-[10px]">
              <div className="flex flex-col gap-y-[5px] max-w-[520px] xl:max-w-[690px]">
                <div className="pt-[5px] w-full ">
                  Glo Dollar is a fiat-backed stablecoin that funds public
                  goods. With Glo Dollar, you can help fund public goods and
                  charitable causes just by holding a stablecoin. It&apos;s a
                  new, donationless form of philanthropy. Check here which are
                  the top supporting Glo Dollar wallets currently.
                </div>

                <div className="pt-[5px] w-full">
                  Check here which are the top supporting Glo Dollar wallets
                  currently.
                </div>
              </div>
              <div className="h-[96px] w-[249px] self-end rounded-2xl bg-[#344240] flex flex-col px-[15px] py-[10px]">
                <div className="flex justify-between items-center ">
                  <Image
                    src={"/Glo_Dollar.svg"}
                    alt={"Glo Dollar Icon"}
                    className="w-[36px] h-[36px]"
                    height={36}
                    width={36}
                  />
                  <div className="text-[36px] -ml-1 flex gap-x-0.5 font-bold">
                    <span>Glo</span>
                    <span>Dollar</span>
                  </div>
                </div>
                <div className="text-[12px] flex items-center justify-center ">
                  More about Glo Dollar on their website
                </div>
              </div>
            </div>
            <TopRowContainer>
              <TopRowParent>
                <TopRowChild isSelected={true}>By Wallet</TopRowChild>
              </TopRowParent>
              <TopRowParent>
                {Object.keys(timespans).map((timespan) => {
                  return (
                    <TopRowChild
                      isSelected={selectedTimespan === timespan}
                      onClick={() => {
                        setSelectedTimespan(timespan);
                      }}
                      key={timespan}
                    >
                      {timespans[timespan].label}
                    </TopRowChild>
                  );
                })}
              </TopRowParent>
            </TopRowContainer>
            <div className="flex w-full gap-x-[5px] ">
              <div className="flex flex-col gap-y-[15px] relative h-[415px]  w-[60%] ">
                <div
                  className="w-full grid px-[10px] gap-x-[10px] pl-[15px] pr-[15px]"
                  style={{ gridTemplateColumns: "auto 120px 50px" }}
                >
                  <div className="text-[14px] font-bold items-center ">
                    Holder
                  </div>
                  <div
                    className="flex justify-end items-center text-[14px] font-bold"
                    onClick={() => {
                      if (sortMetric === "balance") {
                        setSortOrder(!sortOrder);
                      } else {
                        setSortMetric("balance");
                      }
                    }}
                  >
                    <div>Amount</div>{" "}
                    <Icon
                      icon={sortOrder ? "formkit:arrowdown" : "formkit:arrowup"}
                      className="dark:text-forest-50 group-hover:text-forest-50/80 text-black w-[10px] h-[10px] "
                    />
                  </div>
                  <div
                    className="flex text-[10px] justify-center items-center bg-[#344240] rounded-full py-[2px] px-[2px]"
                    onClick={() => {
                      if (sortMetric === "share") {
                        setSortOrder(!sortOrder);
                      } else {
                        setSortMetric("share");
                      }
                    }}
                  >
                    <div>Share</div>
                    <Icon
                      icon={sortOrder ? "formkit:arrowdown" : "formkit:arrowup"}
                      className="dark:text-forest-50 group-hover:text-forest-50/80 text-black w-[8px] h-[8px] "
                    />
                  </div>
                </div>
                {transitions((style, item) => {
                  if (item.i > 9) {
                    return;
                  }
                  return (
                    <animated.div
                      className="absolute w-full rounded-full border-[#5A6462] top-[30px] border-[2px] h-[34px]"
                      style={{ ...style }}
                    >
                      <div
                        className="w-full h-full grid px-[10px] gap-x-[10px] pl-[15px] pr-[15px] "
                        style={{ gridTemplateColumns: "auto 120px 50px" }}
                      >
                        <div className="text-[12px] h-full flex grow items-center ">
                          {item.key}
                        </div>
                        <div className="text-[12px] h-full flex items-center justify-end  gap-x-0.5">
                          ${formatNumber(data.holders_table[item.key].balance)}
                        </div>

                        <div className="flex text-[10px] h-[18px] justify-center items-center bg-[#344240] rounded-full my-auto ml-1  py-[2px] px-[2px]">
                          <div className="text-[9px] flex items-center justify-center gap-x-0.5">
                            %
                            {formatNumber(
                              data.holders_table[item.key].share * 100,
                            )}
                          </div>
                        </div>
                      </div>
                    </animated.div>
                  );
                })}
              </div>
              <div className="w-[40%]"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
