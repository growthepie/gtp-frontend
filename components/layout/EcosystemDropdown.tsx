"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { animated, useSpring, easings } from "@react-spring/web";
import { useLocalStorage } from "usehooks-ts";

type Chains = {
  name: string;
  icon: string;
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
    if (selectedStack !== null) {
      setChainEcosystemFilter(selectedStack);
    }
  }, [selectedStack, setChainEcosystemFilter]);

  const chainHeight = (Object.keys(ChainsList).length - 1) * 60;

  const heightAnimate = useSpring({
    height: optOpen ? chainHeight : 43,
    config: { easing: easings.easeInOutBack },
  });

  return (
    <div className="relative w-[218px]">
      <div
        className="w-[218px] rounded-t-3xl overflow-hidden absolute top-1/2 -translate-y-1/50 left-1/2 transform -translate-x-1/2 -translate-y-[22px] z-10"
        style={{ height: chainHeight + "px" }}
      >
        <animated.div
          className={`w-full justify-center rounded-b-2xl ${
            optOpen ? "bg-forest-900 dark:bg-[#CDD8D3] " : "bg-transparent"
          } absolute top-1/2 -translate-y-1/50 left-1/2 transform -translate-x-1/2 -translate-y-[60px] overflow-clip z-10`}
          style={{ ...heightAnimate }}
        >
          <div className="flex flex-col items-center text-sm text-forest-50 dark:text-forest-900 pt-[45px] pb-[10px]">
            {Object.keys(ChainsList).map((stack, i) => {
              return (
                stack !== selectedStack && (
                  <button
                    key={i}
                    className={`pl-[42px] py-[8px] flex w-full gap-x-2 opacity-${
                      optOpen ? "100" : "0"
                    } hover:bg-white/10 hover:dark:bg-black/10`}
                    onClick={() => {
                      setSelectedStack(stack);
                      setOptOpen(false);
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
        </animated.div>
      </div>

      <div
        className={`w-full flex justify-center h-[44px] overflow-hidden transition-all ${
          optOpen
            ? " bg-forest-900 dark:bg-[#CDD8D3] border-forest-50 dark:border-forest-900 transition-colors delay-0"
            : "bg-transparent border-forest-900 dark:border-forest-50 transition-colors delay-750"
        }  border-[1px]  rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20`}
      >
        <button
          className="flex h-full gap-x-2 w-[90%]   items-center"
          onClick={() => {
            setOptOpen(!optOpen);
          }}
        >
          {selectedStack && (
            <>
              <Icon
                icon={"tabler:chevron-right"}
                className={`font-light h-[24px] w-[24px] transform ${
                  optOpen
                    ? "rotate-90 transition-transform duration-300 ease-in-out text-forest-50 dark:text-forest-900"
                    : "rotate-0 transition-transform duration-300 ease-in-out text-forest-900 dark:text-forest-50"
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
              <p
                className={`text-sm  ${
                  optOpen
                    ? "text-forest-50 dark:text-forest-900"
                    : "text-forest-900 dark:text-forest-50"
                }`}
              >
                {ChainsList[selectedStack].name}
              </p>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
