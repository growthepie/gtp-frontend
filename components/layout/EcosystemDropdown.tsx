"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { animated, useSpring, easings } from "@react-spring/web";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
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

  const [chainEcosystemFilter, setChainEcosystemFilter] = useSessionStorage(
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
  }, [selectedStack, setChainEcosystemFilter]);

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
              ? "rounded-2xl border-b border-l border-r border-forest-900 bg-white transition-colors dark:border-forest-500 dark:bg-[#1F2726] lg:rounded-3xl"
              : ""
          }`}
        >
          <li
            className={`flex cursor-pointer items-center justify-start space-x-[5px] overflow-hidden rounded-full border-[1px] border-forest-900 bg-transparent px-[10px] py-[6px] transition-all dark:border-forest-500 lg:space-x-[10px] lg:px-[15px] lg:py-[10px]`}
            onClick={() => {
              setOptOpen(!optOpen);
            }}
          >
            {selectedStack && (
              <>
                <div>
                  <Icon
                    icon={"feather:chevron-right"}
                    className={`!h-[20px] !w-[20px] transform font-light text-forest-900 transition-transform duration-300 ease-in-out dark:text-forest-50 lg:!h-[24px] lg:!w-[24px] ${
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
                  className={`overflow-hidden whitespace-nowrap text-xs leading-snug transition-all duration-300 ease-in-out lg:text-sm ${
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
              optOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
            }`}
          >
            {Object.keys(ChainsList).map((stack, i) => {
              return (
                stack !== selectedStack && (
                  <li
                    key={i}
                    className={`flex w-full cursor-pointer items-center justify-start space-x-[5px] rounded-full px-[10px] py-[6px] text-sm lg:space-x-[10px] lg:px-[15px] lg:py-[10px] ${
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
                        className={`!h-[20px] !w-[20px] font-light opacity-0 lg:!h-[24px] lg:!w-[24px]`}
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
                      className={`overflow-hidden whitespace-nowrap text-xs leading-snug transition-all duration-300 ease-in-out lg:text-sm ${
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
