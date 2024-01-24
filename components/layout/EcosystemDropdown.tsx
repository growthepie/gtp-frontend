"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { animated, useSpring, easings } from "@react-spring/web";
import { useLocalStorage } from "usehooks-ts";
import { useUIContext } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";

type Chains = {
  name: string;
  icon: string;
};

const ChainsList: { [key: string]: Chains } = {
  "all-chains": {
    name: "All Chains",
    icon: "/all-chains.svg",
  },
  "op-stack": {
    name: "OP Chains",
    icon: "/Optimism-logo.svg",
  },
  // "zk-rollup": {
  //   name: "ZK-Rollup",
  //   icon: "/zkSync-logo-monochrome.svg",
  // },
};

export default function EcosystemDropdown({}: // optOpen,
// setOptOpen,
// selectedStack,
// setSelectedStack,
{
  // optOpen: boolean;
  // setOptOpen: (show: boolean) => void;
  // selectedStack: string;
  // setSelectedStack: (show: string) => void;
}) {
  const { isSidebarOpen } = useUIContext();

  const [optOpen, setOptOpen] = useState(false);
  const [selectedStack, setSelectedStack] = useState<string | null>(null);

  const [chainEcosystemFilter, setChainEcosystemFilter] = useLocalStorage(
    "chainEcosystemFilter",
    "all-chains",
  );

  useEffect(() => {
    if (chainEcosystemFilter) setSelectedStack(chainEcosystemFilter);
  }, []);

  useEffect(() => {
    if (selectedStack && Object.keys(ChainsList).includes(selectedStack)) {
      setChainEcosystemFilter(selectedStack);
    }
  }, [ChainsList, selectedStack, setChainEcosystemFilter]);

  const chainHeight = (Object.keys(ChainsList).length - 1) * 100;

  const heightAnimate = useSpring({
    height: optOpen ? chainHeight : 43,
    config: { easing: easings.easeInOutBack },
  });

  return (
    <>
      <div className="absolute right-0 top-0">
        <ul
          className={`relative z-[30] transition-[width] duration-300 ease-in-out ${
            optOpen
              ? "border-l border-r border-b rounded-2xl lg:rounded-3xl dark:bg-[#1F2726] bg-white  border-forest-900 dark:border-forest-500 transition-colors"
              : ""
          }`}
        >
          <li
            className={`flex justify-start items-center overflow-hidden cursor-pointer transition-all bg-transparent border-forest-900 dark:border-forest-500 border-[1px] rounded-full py-[6px] px-[10px] space-x-[5px] lg:py-[10px] lg:px-[15px] lg:space-x-[10px]`}
            onClick={() => {
              setOptOpen(!optOpen);
            }}
          >
            {selectedStack && (
              <>
                <div>
                  <Icon
                    icon={"feather:chevron-right"}
                    className={`font-light !h-[20px] !w-[20px] lg:!h-[24px] lg:!w-[24px] transition-transform duration-300 ease-in-out transform text-forest-900 dark:text-forest-50 ${
                      optOpen ? "rotate-90" : "rotate-0"
                    }`}
                  />
                </div>
                <Image
                  src={ChainsList[selectedStack].icon}
                  alt="Forest"
                  className="flex lg:hidden"
                  height={16}
                  width={16}
                  quality={100}
                />
                <Image
                  src={ChainsList[selectedStack].icon}
                  alt="Forest"
                  className="hidden lg:flex"
                  height={22}
                  width={22}
                  quality={100}
                />
                <div
                  className={`text-xs lg:text-sm whitespace-nowrap leading-snug transition-all duration-300 ease-in-out overflow-hidden ${
                    optOpen ? "w-full" : "w-0 lg:w-full"
                  }`}
                >
                  {ChainsList[selectedStack].name}
                </div>
              </>
            )}
          </li>
          <div
            className={`transition-all duration-300 ease-in-out ${
              optOpen ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
            }`}
          >
            {Object.keys(ChainsList).map((stack, i) => {
              return (
                stack !== selectedStack && (
                  <li
                    key={i}
                    className={`flex justify-start items-center cursor-pointer  rounded-full py-[6px] px-[10px] space-x-[5px] lg:py-[10px] lg:px-[15px] lg:space-x-[10px] text-sm w-full ${
                      optOpen ? "opacity-100" : "opacity-0"
                    } hover:bg-forest-100 hover:dark:bg-black/10`}
                    onClick={() => {
                      setSelectedStack(stack);
                      setOptOpen(false);
                    }}
                  >
                    <div>
                      <Icon
                        icon={"feather:chevron-right"}
                        className={`font-light !h-[20px] !w-[20px] lg:!h-[24px] lg:!w-[24px] opacity-0`}
                      />
                    </div>
                    <Image
                      src={ChainsList[stack].icon}
                      alt="Forest"
                      className="flex lg:hidden"
                      height={16}
                      width={16}
                      quality={100}
                    />
                    <Image
                      src={ChainsList[stack].icon}
                      alt="Forest"
                      className="hidden lg:flex"
                      height={22}
                      width={22}
                      quality={100}
                    />
                    <div
                      className={`text-xs lg:text-sm whitespace-nowrap leading-snug transition-all duration-300 ease-in-out overflow-hidden  ${
                        optOpen ? "w-full" : "w-0 lg:w-full"
                      }`}
                    >
                      {ChainsList[stack].name}
                    </div>
                  </li>
                )
              );
            })}
          </div>
        </ul>
      </div>
      {optOpen && (
        <div
          className={`fixed inset-0 z-20 bg-black/50`}
          onClick={() => {
            setOptOpen(false);
          }}
        />
      )}
    </>
  );
}
