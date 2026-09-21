import { animated, useSpring } from "@react-spring/web";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { useLocalStorage } from "usehooks-ts";
import { ReactNode, useMemo, useState, useEffect, useRef } from "react";
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
  parentContainerWidth = 0,
  master,
  disableAutoSelection = false,
  formatValue,
  fitContainer = false,
  linkToChain = true,
  onClick,
}: {
  chain: string;
  value: number;
  index: number;
  sortedValues: Object;
  selectedValue: string;
  selectedMode: string;
  selectedChains: Record<string, boolean>;
  setSelectedChains: (updater: (previous: Record<string, boolean>) => Record<string, boolean>) => void;
  selectedCategory?: string;
  parentContainerWidth?: number;
  master?: MasterResponse;
  disableAutoSelection?: boolean;
  formatValue?: (value: number) => ReactNode;
  fitContainer?: boolean;
  linkToChain?: boolean;
  onClick?: () => void;
}) {
  const { theme } = useTheme();
  const { AllChainsByKeys } = useMaster();
  const chainInfo = AllChainsByKeys[chain];
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
      0,
      ...Object.values(fitContainer ? sortedValues : valuesOfSelected).map(([, value]) => value),
    );
  }, [fitContainer, sortedValues, valuesOfSelected]);

  const relativeWidth = useMemo(() => {
    if (sortedValues && value && largestValue > 0) {
      return 144 + (sortedValues[index][1] / largestValue) * 150;
    } else {
      return 144;
    }
  }, [sortedValues, value, index, largestValue]);

  const percentage = useMemo(() => {
    if (sortedValues && value && largestValue > 0) {
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
          role="button"
          tabIndex={0}
          aria-label={`${chainInfo?.label ?? chain}: ${value.toLocaleString("en-GB")}`}
          aria-pressed={!!selectedChains[chain]}
          aria-disabled={!!selectedChains[chain] && availableSelectedChains <= 1}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
          className={`relative z-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-color-text-primary flex h-[34px] cursor-pointer select-none flex-row items-center justify-between rounded-full pl-[2px] pr-[2px] text-xs font-medium transition-all duration-500 ${
            chainInfo?.darkTextOnBackground === true
              ? "text-white dark:text-black"
              : "text-white"
          } ${isShaking ? "animate-shake" : ""} ${
            selectedChains[chain] ? "opacity-100" : "opacity-30"
          }`}
          style={{
            // width: `max(${percentage}%, ${relativeWidth}px)`,
            width: fitContainer
              ? `calc(${percentage}% + ${184 * (1 - percentage / 100)}px)`
              : `max(${percentage}%, ${relativeWidth}px)`,
            maxWidth: fitContainer ? "100%" : "1000%",
            backgroundColor: chainInfo?.colors[theme ?? "dark"]?.[1] ?? "#7D8887",
            maskImage:
              !fitContainer && percentage > 100
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
            onClick?.();
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
                color: chainInfo?.colors["dark"][0] ?? "#7D8887",
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
                {formatValue ? formatValue(value) : selectedValue === "share" ? (
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
              {linkToChain && chainInfo ? <Link
                href={`/chains/${chainInfo.urlKey}/`}
                className="text-[10px] hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {chainInfo.label}
              </Link> : (
                <span className="text-[10px]">{chainInfo?.label ?? chain}</span>
              )}
            </div>
          </div>
          <div
            className="absolute right-2 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-color-bg-default"
            style={{
              left: !fitContainer && percentage > 100 ? parentContainerWidth - 25 : undefined,
            }}
          >
            <Icon
              icon={`feather:${
                !selectedChains[chain] ? "circle" : "check-circle"
              }`}
              className="h-[15px] w-[15px] align-middle"
              style={{
                color: chainInfo?.colors[theme ?? "dark"]?.[0] ?? "#7D8887",
                lineHeight: 1, // Ensure the line height doesn't cause vertical misalignment
              }}
            />
          </div>
        </div>
      </>
    );
  }
}
