import { animated, useSpring } from "@react-spring/web";
import { Icon } from "@iconify/react";
import { AllChainsByKeys } from "@/lib/chains";
import { useTheme } from "next-themes";
import { useLocalStorage } from "usehooks-ts";
import { useMemo, useState, useEffect, useRef } from "react";
import { MasterResponse } from "@/types/api/MasterResponse";
import Link from "next/link";

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
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [isShaking, setIsShaking] = useState(false);

  const [width, setWidth] = useState(() => {
    if (sortedValues && value) {
      const largestValue = Math.max(
        ...Object.values(sortedValues).map(([, value]) => value),
      );
      let minWidth = 205;

      const relativeWidth = 205 + (sortedValues[index][1] / largestValue) * 150;

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
      let minWidth = 205;

      const relativeWidth = 205 + (sortedValues[index][1] / largestValue) * 150;

      const percentage = (value / largestValue) * 99;
      const newWidth = `max(${percentage}%, ${relativeWidth}px)`;

      // Set the width state using the setWidth function
      setWidth(newWidth);
    } else {
      setWidth("auto");
    }
  }, [value, sortedValues]);

  if (chain === "imx" && selectedMode === "gas_fees_") {
    return null;
  } else {
    return (
      <div
        key={chain}
        className={`relative flex flex-row items-center rounded-full text-xs font-medium z-0 select-none ${AllChainsByKeys[chain].darkTextOnBackground === true
          ? "text-white dark:text-black"
          : "text-white"
          } ${selectedChains[chain]
            ? AllChainsByKeys[chain].backgrounds[theme ?? "dark"][1]
            : `${AllChainsByKeys[chain].backgrounds[theme ?? "dark"][1]} `
          }
        ${isShaking ? "animate-shake " : ""}`}
        style={{
          width: width,
          // height: "45px",
          // bottom: `${index * 45}px`,
        }}
      // style={{
      //   zIndex: index,
      //   ...style,
      // }}

      >
        <div
          key={chain + " " + value}
          className="flex items-center h-[45px] pl-[20px] min-w-[155px] w-full "
        >
          <div
            key={chain + " " + index + value}
            className="flex w-[155px] items-center pr-2 "
          >
            <div
              key={chain + " " + index}
              className="flex items-center w-[30px]"
            >
              <Icon
                icon={`gtp:${chain.replace("_", "-")}-logo-monochrome`}
                className="w-[15px] h-[15px]"
              />
            </div>
            {width !== null && (
              <Link
                href={`/chains/${AllChainsByKeys[chain].urlKey}`}
                className="overflow-hidden text-ellipsis min-w-0 max-w-fit hover:underline"
              >
                {width &&
                  230 > parseFloat(width.match(/(\d+(\.\d+)?)(?=px)/)?.[0] || "0")
                  ? master.chains[chain].name_short
                  : AllChainsByKeys[chain]?.label}
              </Link>
            )}
          </div>

          <div
            key={value + " " + index}
            className="flex justify-end flex-grow "
          >
            <div key={index} className="text-base flex">
              {selectedValue === "share" ? (
                <div>{Math.round(value * 100)}%</div>
              ) : (
                <div className="flex gap-x-1">
                  <div
                    className={`${showUsd ? "static" : "relative top-[1px]"}`}
                  >
                    {selectedMode === "gas_fees_" ? (showUsd ? `$` : `Ξ`) : ""}
                  </div>
                  <div>
                    {showUsd
                      ? (Math.round(value * 100) / 100).toLocaleString(
                        "en-GB",
                        {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        },
                      )
                      : (Math.round(value * 100) / 100).toLocaleString(
                        "en-GB",
                        {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        },
                      )}
                  </div>
                </div>
              )}
            </div>
            <div
              key={chain + "select"}
              className={`relative flex left-[10px] w-[24px] h-[24px] bg-forest-700 rounded-full self-center items-center justify-center z-10 cursor-pointer ${!selectedChains[chain] ? "opacity-100" : ""
                }`}
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
              <Icon
                icon="feather:check-circle"
                className={`w-[24px] h-[24px] text-white ${!selectedChains[chain] ? "opacity-0" : "opacity-100"
                  }`}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
