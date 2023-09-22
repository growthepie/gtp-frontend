"use client";
import { Icon } from "@iconify/react";
import Image from "next/image";

type Chains = {
  name: string;
  icon: string;
};

export default function OptimismComp({
  optOpen,
  setOptOpen,
  selectedStack,
  setSelectedStack,
}: {
  optOpen: boolean;
  setOptOpen: (show: boolean) => void;
  selectedStack: string;
  setSelectedStack: (show: string) => void;
}) {
  const ChainsList: { [key: string]: Chains } = {
    "all-chains": {
      name: "All Chains",
      icon: "/all-chains.svg",
    },
    "op-stack": {
      name: "OP Stack Chains",
      icon: "/Optimism-logo.svg",
    },
    "op-super": {
      name: "OP Superchain",
      icon: "/Optimism-super-logo.svg",
    },
  };

  console.log(((Object.keys(ChainsList).length - 1) * 55).toString() + "px");
  return (
    <div className="relative w-[218px]">
      <div
        className={`w-[99%] justify-center bg-[#CDD8D3] rounded-b-2xl rounded-t-none absolute top-1/2 -translate-y-1/50 left-1/2 transform -translate-x-1/2 -translate-y-[5px] z-10 ${
          optOpen ? `opacity-100` : "opacity-0 "
        } transition-all ease-in-out duration-500`}
      >
        <div className="flex flex-col gap-y-[10px]  w-[170px] items-center text-sm text-forest-900 mt-[40px] mb-[10px] ml-[45px]">
          {Object.keys(ChainsList).map((stack, i) => {
            return (
              stack !== selectedStack && (
                <button
                  className={`flex w-full gap-x-2   opacity-${
                    optOpen ? "100" : "0"
                  }`}
                  onClick={() => {
                    setSelectedStack(stack);
                  }}
                >
                  <Image
                    src={ChainsList[stack].icon}
                    alt="Forest"
                    className="flex"
                    height={22}
                    width={22}
                    quality={100}
                  />
                  {ChainsList[stack].name}
                </button>
              )
            );
          })}
        </div>
      </div>
      <div className="w-full flex justify-center h-[44px] bg-[#CDD8D3] border-[1px] border-forest-900 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
        <button
          className="flex h-full gap-x-2 w-[90%]   items-center"
          onClick={() => {
            setOptOpen(!optOpen);
          }}
        >
          <Icon
            icon={"tabler:chevron-right"}
            className={`text-forest-900 font-light h-[24px] w-[24px] transform ${
              optOpen
                ? "rotate-90 transition-transform duration-300 ease-in-out"
                : "rotate-0 transition-transform duration-300 ease-in-out"
            }`}
          />

          <Image
            src={ChainsList[selectedStack].icon}
            alt="Forest"
            className="flex"
            height={22}
            width={22}
            quality={100}
          />
          <p className="text-sm text-forest-900">
            {ChainsList[selectedStack].name}
          </p>
        </button>
      </div>
    </div>
  );
}
