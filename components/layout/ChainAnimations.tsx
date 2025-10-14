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
  parentContainerWidth,
  master,
  disableAutoSelection = false,
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
  parentContainerWidth: number;
  master: MasterResponse;
  disableAutoSelection?: boolean;
}) {
  const { theme } = useTheme();
  const { AllChainsByKeys } = useMaster();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [isShaking, setIsShaking] = useState(false);
  // const [width, setWidth] = useState(() => {
  //   if (sortedValues && value) {
  //     const largestValue = Math.max(
  //       ...Object.values(sortedValues).map(([, value]) => value),
  //     );
  //     let minWidth = 144;

  //     const relativeWidth = 144 + (sortedValues[index][1] / largestValue) * 150;

  //     const percentage = (value / largestValue) * 99;
  //     const newWidth = `max(${percentage}%, ${relativeWidth}px)`;
  //     return `max(${percentage}%, ${minWidth}px)`;
  //   } else {
  //     return "auto";
  //   }
  // });

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
  }, [selectedChains, selectedMode, sortedValues]);

  // Conditional auto-selection
  useEffect(() => {
    if (disableAutoSelection) return; // Skip if auto-selection is disabled
    
    let allFalse = true;
    for (const key in sortedValues) {
      const element = sortedValues[key];
      if (selectedChains[element[0]]) {
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
  }, [selectedChains, setSelectedChains, sortedValues, disableAutoSelection]);

  // useEffect(() => {
  //   if (sortedValues && value && selectedChains) {
  //     const valuesOfSelected = Object.values(sortedValues).filter(
  //       ([chain, value]) => selectedChains[chain],
  //     );
  //     const largestValue = Math.max(
  //       ...Object.values(valuesOfSelected).map(([, value]) => value),
  //     );
  //     let minWidth = 144;

  //     const relativeWidth = 144 + (sortedValues[index][1] / largestValue) * 150;

  //     const percentage = (value / largestValue) * 99;
  //     const newWidth = `max(${percentage}%, ${relativeWidth}px)`;

  //     // Set the width state using the setWidth function
  //     setWidth(newWidth);
  //   } else {
  //     setWidth("auto");
  //   }
  // }, [value, sortedValues, index, selectedChains]);

  const valuesOfSelected = useMemo(() => {
    return Object.values(sortedValues).filter(
      ([chain, value]) => selectedChains[chain],
    );
  }, [sortedValues, selectedChains]);

  const largestValue = useMemo(() => {
    return Math.max(
      ...Object.values(valuesOfSelected).map(([, value]) => value),
    );
  }, [valuesOfSelected]);

  const relativeWidth = useMemo(() => {
    if (sortedValues && value) {
      return 144 + (sortedValues[index][1] / largestValue) * 150;
    } else {
      return 144;
    }
  }, [sortedValues, value, index, largestValue]);

  const percentage = useMemo(() => {
    if (sortedValues && value) {
      return (value / largestValue) * 100;
    } else {
      return 0;
    }
  }, [sortedValues, value, largestValue]);

  if (chain === "imx" && selectedMode === "gas_fees_") {
    return null;
  } else {
    return (
      <>
        <div
          key={chain}
          className={`relative z-0 flex h-[34px] cursor-pointer select-none flex-row items-center justify-between rounded-full pl-[2px] pr-[2px] text-xs font-medium transition-all duration-500 ${
            AllChainsByKeys[chain].darkTextOnBackground === true
              ? "text-white dark:text-black"
              : "text-white"
          } ${isShaking ? "animate-shake" : ""} ${
            selectedChains[chain] ? "opacity-100" : "opacity-30"
          }`}
          style={{
            // width: `max(${percentage}%, ${relativeWidth}px)`,
            width: `max(${percentage}%, ${relativeWidth}px)`,
            maxWidth: "1000%",
            backgroundColor: AllChainsByKeys[chain].colors[theme ?? "dark"][1],
            maskImage:
              percentage > 100
                ? `linear-gradient(to right, white 0px, white ${parentContainerWidth - 40}px, transparent ${parentContainerWidth}px, transparent 100%)`
                : `none`,
            // marginRight: percentage > 100 ? "-10px" : undefined,
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
          <div className="flex h-[30px] w-[140px] items-center gap-x-[10px] rounded-full bg-color-bg-default">
            <div
              className="z-20 flex h-full w-[30px] items-center justify-center"
              style={{
                color: AllChainsByKeys[chain].colors["dark"][0],
              }}
            >
              <Icon
                icon={`gtp:${chain.replace("_", "-")}-logo-monochrome`}
                className="h-[15px] w-[15px]"
              />
            </div>

            <div className="flex flex-col text-color-text-primary">
              <div className="-mb-[4px] mt-[1px] text-[14px] font-bold">
                {" "}
                {selectedValue === "share" ? (
                  <div>{Math.round(value * 100)}%</div>
                ) : (
                  <div className="flex">
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
                          })
                            .format(value)
                            .replace(/K$/, "k")
                        : Intl.NumberFormat(undefined, {
                            notation: "compact",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })
                            .format(value)
                            .replace(/K$/, "k")}
                    </div>
                  </div>
                )}
              </div>
              <Link
                href={`/chains/${AllChainsByKeys[chain].urlKey}/`}
                className="text-[10px] hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {AllChainsByKeys[chain].label}
              </Link>
            </div>
          </div>
          <div
            className="absolute right-2 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-color-bg-default"
            style={{
              left: percentage > 100 ? parentContainerWidth - 25 : undefined,
            }}
          >
            <Icon
              icon={`feather:${
                !selectedChains[chain] ? "circle" : "check-circle"
              }`}
              className="h-[15px] w-[15px] align-middle"
              style={{
                color: AllChainsByKeys[chain].colors[theme ?? "dark"][0],
                lineHeight: 1, // Ensure the line height doesn't cause vertical misalignment
              }}
            />
          </div>
        </div>
      </>
    );
  }
}
