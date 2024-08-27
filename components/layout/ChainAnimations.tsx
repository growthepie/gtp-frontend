import { animated, useSpring } from "@react-spring/web";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { useLocalStorage } from "usehooks-ts";
import { useMemo, useState, useEffect, useRef } from "react";
import { MasterResponse } from "@/types/api/MasterResponse";
import Link from "next/link";
import { useMaster } from "@/contexts/MasterContext";

export default function ChainAnimations({
  chain,
  value,
  index,
  sortedValues,
  selectedValue,
  selectedMode,
  selectedChains,
  setSelectedChains,
  selectedCategory,
  master,
}: {
  chain: string;
  value: number;
  index: number;
  sortedValues: Object;
  selectedValue: string;
  selectedMode: string;
  selectedChains: Object;
  setSelectedChains: (show: Object) => void;
  selectedCategory: string;
  master: MasterResponse;
}) {
  const { theme } = useTheme();
  const { AllChainsByKeys } = useMaster();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [isShaking, setIsShaking] = useState(false);

  const [width, setWidth] = useState(() => {
    if (sortedValues && value) {
      const largestValue = Math.max(
        ...Object.values(sortedValues).map(([, value]) => value),
      );
      let minWidth = 144;

      const relativeWidth = 144 + (sortedValues[index][1] / largestValue) * 150;

      const percentage = (value / largestValue) * 99;
      const newWidth = `max(${percentage}%, ${relativeWidth}px)`;
      return `max(${percentage}%, ${minWidth}px)`;
    } else {
      return "auto";
    }
  });

  const availableSelectedChains = useMemo(() => {
    let counter = 0;
    Object.keys(sortedValues).forEach((chain) => {
      if (selectedChains[sortedValues[chain][0]]) {
        counter++;
      }
    });

    if (
      selectedMode === "gas_fees_" &&
      selectedChains["imx"] &&
      Object.keys(sortedValues).some(
        (chain) => sortedValues[chain][0] === "imx",
      )
    ) {
      return counter - 1;
    } else {
      return counter;
    }
  }, [selectedChains, selectedMode, selectedMode]);

  const changeMode = useMemo(() => {
    if (
      selectedMode === "gas_fees_" &&
      selectedChains["imx"] &&
      Object.keys(selectedChains).filter((chain) => selectedChains[chain])
        .length === 1
    ) {
      setSelectedChains((prevSelectedChains) => {
        // Create a copy of the previous selectedChains with all chains set to true
        const updatedSelectedChains = { ...prevSelectedChains };
        for (const chain in updatedSelectedChains) {
          updatedSelectedChains[chain] = true;
        }
        return updatedSelectedChains;
      });
    }
  }, [selectedMode]);

  const changeCategory = useMemo(() => {
    let allFalse = true;

    for (const key in sortedValues) {
      const element = sortedValues[key];

      if (selectedChains[element[0]]) {
        /*
        // console.log("--------------");
        // console.log(element[0]);
        // console.log(selectedCategory);
        // console.log(element);
        // console.log(selectedChains);
        // console.log("--------------");
        */
        allFalse = false;
      }
    }

    if (allFalse) {
      for (const key in sortedValues) {
        const element = sortedValues[key];
        setSelectedChains((prevSelectedChains) => ({
          ...prevSelectedChains,
          [element[0]]: true,
        }));
      }
    }
  }, [sortedValues]);

  useEffect(() => {
    if (sortedValues && value) {
      const largestValue = Math.max(
        ...Object.values(sortedValues).map(([, value]) => value),
      );
      let minWidth = 144;

      const relativeWidth = 144 + (sortedValues[index][1] / largestValue) * 150;

      const percentage = (value / largestValue) * 99;
      const newWidth = `max(${percentage}%, ${relativeWidth}px)`;

      // Set the width state using the setWidth function
      setWidth(newWidth);
    } else {
      setWidth("auto");
    }
  }, [value, sortedValues]);

  const showSeperatingLine = useMemo(() => {
    const isUnselected = !selectedChains[chain];
    const isPrevSelected =
      index > 0 ? selectedChains[sortedValues[index - 1][0]] : true;

    if (isUnselected && isPrevSelected) {
      return true;
    } else {
      return false;
    }
  }, [sortedValues, selectedChains, selectedValue, selectedCategory, master]);

  if (chain === "mode") {
    console.log("chain", chain);
    console.log("index", index);
    console.log("sortedValues", sortedValues);
    console.log(selectedChains[sortedValues[index - 1][0]]);
  }

  if (chain === "imx" && selectedMode === "gas_fees_") {
    return null;
  } else {
    return (
      <>
        {showSeperatingLine && (
          <div className="flex items-center ">
            <div className="flex-grow border-t border-[#5A6462]"></div>
            <span className="mx-4 text-[12px] font-semibold text-[#CDD8D3]">
              Not showing in chart
            </span>
            <div className="flex-grow border-t border-[#5A6462]"></div>
          </div>
        )}
        <div
          key={chain}
          className={`relative flex flex-row items-center rounded-full justify-between text-xs  transition-opacity font-medium z-0 select-none pl-[2px]  pr-[2px] h-[34px] ${
            AllChainsByKeys[chain].darkTextOnBackground === true
              ? "text-white dark:text-black"
              : "text-white"
          } ${isShaking ? "animate-shake " : ""} ${
            selectedChains[chain] ? "opacity-100" : "opacity-30"
          }`}
          style={{
            width: width,
            backgroundColor: AllChainsByKeys[chain].colors[theme ?? "dark"][1],
            // height: "45px",
            // bottom: `${index * 45}px`,
          }}
          // style={{
          //   zIndex: index,
          //   ...style,
          // }}
          onClick={() => {
            if (availableSelectedChains > 1 || !selectedChains[chain]) {
              setSelectedChains((prevSelectedChains) => ({
                ...prevSelectedChains,
                [chain]: !prevSelectedChains[chain],
              }));
            } else {
              setIsShaking(true);
              setTimeout(() => {
                setIsShaking(false);
              }, 500);
            }
          }}
        >
          <div className=" w-[140px] gap-x-[10px] h-[30px] flex items-center  bg-[#1F2726] rounded-full ">
            <div
              className="flex justify-center items-center w-[30px] h-full z-20 "
              style={{
                color: AllChainsByKeys[chain].colors["dark"][0],
              }}
            >
              <Icon
                icon={`gtp:${chain.replace("_", "-")}-logo-monochrome`}
                className="w-[15px] h-[15px]"
              />
            </div>

            <div className="flex flex-col text-[#CDD8D3]">
              <div className="text-[14px] font-bold -mb-[2px] ">
                {" "}
                {selectedValue === "share" ? (
                  <div>{Math.round(value * 100)}%</div>
                ) : (
                  <div className="flex gap-x-0.5">
                    <div
                      className={`${showUsd ? "static" : "relative top-[1px]"}`}
                    >
                      {selectedMode === "gas_fees_"
                        ? showUsd
                          ? `$`
                          : `Ξ`
                        : ""}
                    </div>
                    <div>
                      {showUsd
                        ? Intl.NumberFormat(undefined, {
                            notation: "compact",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          }).format(value)
                        : Intl.NumberFormat(undefined, {
                            notation: "compact",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          }).format(value)}
                    </div>
                  </div>
                )}
              </div>
              <Link
                href={`/chains/${AllChainsByKeys[chain].urlKey}/`}
                className="hover:underline text-[10px]"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {AllChainsByKeys[chain].label}
              </Link>
            </div>
          </div>
          <div className="flex items-center absolute right-2 justify-center h-[17px] w-[17px] bg-[#1F2726] rounded-full">
            <Icon
              icon={`feather:${
                !selectedChains[chain] ? "circle" : "check-circle"
              }`}
              className={`w-[15px] h-[15px] `}
              style={{
                color: AllChainsByKeys[chain].colors[theme ?? "dark"][0],
              }}
            />
          </div>
        </div>
      </>
    );
  }
}
