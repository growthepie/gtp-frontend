"use client";
import Container from "@/components/layout/Container";
import { Chart } from "@/components/charts/chart";
import Icon from "@/components/layout/Icon";
import Image from "next/image";
import useSWR from "swr";
import { useMemo, useState, useEffect, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";
import { AllChainsByKeys } from "@/lib/chains";

export default function eiptracker() {
  const {
    data: feeData,
    error: feeError,
    isLoading: feeLoading,
    isValidating: feeValidating,
  } = useSWR("https://api.growthepie.xyz/v1/fees.json");
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const chartComponent = useRef<Highcharts.Chart | null>(null);

  const avgTxCosts = useMemo(() => {
    if (!feeData) return {}; // Return an empty object if feeData is falsy
    return Object.keys(feeData.chain_data).reduce((acc, chain) => {
      acc[chain] = feeData.chain_data[chain].ten_min.txcosts_avg;
      return acc;
    }, {});
  }, [feeData]);

  const chartSeries = useMemo(() => {
    return Object.keys(avgTxCosts).map((chain) => ({
      id: chain,
      name: chain,
      unixKey: "unix",
      dataKey: showUsd ? "value_usd" : "value_eth",
      data: avgTxCosts[chain].data,
    }));
  }, [avgTxCosts, showUsd]);

  return (
    <>
      {feeData && avgTxCosts && (
        <>
          <Container>
            <div className="flex flex-col px-[20px] gap-y-[5px]">
              <div className="text-[24px] font-bold">EIP 4844 Launch</div>
              <div className="text-[16px]">
                See how the launch of EIP 4844 effects transaction costs.
              </div>
            </div>
          </Container>
          <Container className="flex flex-col justify-center  mt-[30px]">
            <div className="flex flex-col justify-center"></div>
            <Chart
              chartType={"line"}
              types={avgTxCosts.optimism.types}
              timespan={"max"}
              series={chartSeries}
              chartHeight={"259px"}
              chartWidth={"100%"}
              chartRef={chartComponent}
            />
          </Container>
          <Container className="mt-[30px]">
            {/*Bar Titles */}
            <div className="flex px-[20px] font-bold">
              <div className="w-[25%] ">Chain</div>
              <div className="w-[25%] ">Average Transaction Costs</div>
              <div className="w-[25%] ">Median Transaction Costs</div>
              <div className="w-[25%] ">Native Transfer</div>
            </div>
            <div className="px-[20px] mt-[5px]">
              <div className=" border-forest-800 border-[1px] rounded-full h-[52px]">
                Text
              </div>
            </div>
          </Container>
        </>
      )}
    </>
  );
}
