"use client";
import Container from "@/components/layout/Container";
import Icon from "@/components/layout/Icon";
import { useMemo, useState, useEffect, useRef } from "react";

export default function FeesPage() {
  const [selectedTimescale, setSelectedTimescale] = useState("thirty_min");
  const timescales = useMemo(() => {
    return {
      thirty_min: {
        label: "30 Min",
      },
      hourly: {
        label: "1h",
      },
      six_hours: {
        label: "6h",
      },
      twelve_hours: {
        label: "12h",
      },
    };
  }, []);

  return (
    <>
      <Container className="w-full">
        <div className="flex px-2 items-center w-full h-[61px] rounded-full mt-[16px] bg-[#5A6462]">
          <a
            className="flex items-center w-[162px] h-[44px] bg-[#1F2726] gap-x-[10px] rounded-full px-2 gap"
            href="https://www.growthepie.xyz/"
            target="_blank"
          >
            <Icon icon="gtp:house" className="h-6 w-6" />
            <div className="font-bold">Main platform</div>
          </a>
        </div>
      </Container>
      <Container className="w-full mt-[30px] ">
        <div className="flex w-full justify-between px-[10px]">
          <div className="text-[20px] font-bold">
            Cost of using Ethereum Layer-2s
          </div>
          <div className="w-[171px] h-[34px] flex bg-[#1F2726] text-[12px] items-center justify-evenly pr-[2px] rounded-full ">
            {Object.keys(timescales)
              .reverse()
              .map((timescale) => (
                <div
                  className={`w-[25%] hover:cursor-pointer py-1.5 px-0.5 hover:bg-forest-500/10 rounded-full text-center
                  ${
                    selectedTimescale === timescale
                      ? "bg-[#151A19]"
                      : "bg-inherit"
                  }`}
                  key={timescale}
                  onClick={() => {
                    setSelectedTimescale(timescale);
                  }}
                >
                  {timescales[timescale].label}
                </div>
              ))}
          </div>
        </div>
      </Container>
    </>
  );
}
