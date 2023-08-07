import { animated, useSpring } from "@react-spring/web";
import { Icon } from "@iconify/react";
import { AllChainsByKeys } from "@/lib/chains";
import { useTheme } from "next-themes";
import { useLocalStorage } from "usehooks-ts";
import { useMemo, useState, useEffect, useRef } from "react";

export default function ChainAnimations({
  chain,
  value,
  index,
  sortedValues,
  selectedValue,
  selectedMode,
  selectedChains,
  setSelectedChains,
}: {
  chain: string;
  value: number;
  index: number;
  sortedValues: Object;
  selectedValue: string;
  selectedMode: string;
  selectedChains: Object;
  setSelectedChains: (show: Object) => void;
}) {
  const { theme } = useTheme();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [width, setWidth] = useState(() => {
    if (sortedValues && value) {
      const largestValue = Math.max(
        ...Object.values(sortedValues).map(([, value]) => value),
      );

      const percentage = (value / largestValue) * 99;
      return `max(${percentage}%, 205px)`;
    } else {
      return "auto";
    }
  });

  useEffect(() => {
    if (sortedValues && value) {
      const largestValue = Math.max(
        ...Object.values(sortedValues).map(([, value]) => value),
      );

      const percentage = (value / largestValue) * 99;
      setWidth(`max(${percentage}%, 205px)`);
    } else {
      setWidth("auto");
    }
  }, [value, sortedValues]);

  return (
    <animated.div
      key={chain}
      className={`relative flex flex-row flex-grow h-full items-center rounded-full text-xs font-medium hover:cursor-pointer z-0 ${
        ["arbitrum", "imx", "zkSync Era", "all_l2s"].includes(chain)
          ? "text-white dark:text-black"
          : "text-white"
      } ${
        selectedChains[chain]
          ? AllChainsByKeys[chain].backgrounds[theme][1]
          : `${AllChainsByKeys[chain].backgrounds[theme][1]} `
      }`}
      style={{
        width: width,
        bottom: `${index * 45}px`,
      }}
      onClick={() => {
        setSelectedChains((prevSelectedChains) => ({
          ...prevSelectedChains,
          [chain]: !prevSelectedChains[chain],
        }));
      }}
    >
      <div
        key={chain + " " + value}
        className="flex items-center h-[45px] pl-[20px] min-w-[155px] w-full "
      >
        <div
          key={chain + " " + index + value}
          className="flex w-[155px] items-center pr-2 "
        >
          <div key={chain + " " + index} className="flex items-center w-[30px]">
            <Icon
              icon={`gtp:${
                chain === "zksync_era" ? "zksync-era" : chain
              }-logo-monochrome`}
              className="w-[15px] h-[15px]"
            />
          </div>
          <div className="-mb-0.5">{AllChainsByKeys[chain].label}</div>
        </div>

        <div key={value + " " + index} className="flex justify-end flex-grow">
          <div key={index} className="text-base flex">
            {selectedValue === "share" ? (
              <div>{Math.round(value * 100)}%</div>
            ) : (
              <div className="flex gap-x-1">
                <div className={`${showUsd ? "static" : "relative top-[1px]"}`}>
                  {selectedMode === "gas_fees_" ? (showUsd ? `$` : `Ξ`) : ""}
                </div>
                <div>
                  {(Math.round(value * 100) / 100).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>
            )}
          </div>
          <div
            key={chain + "select"}
            className={`relative flex left-[10px] w-[24px] h-[24px] bg-forest-700 rounded-full self-center items-center justify-center z-10 ${
              !selectedChains[chain] ? "opacity-100" : ""
            }`}
          >
            <Icon
              icon="feather:check-circle"
              className={`w-[24px] h-[24px] opacity-100 text-white ${
                !selectedChains[chain] ? "opacity-0" : ""
              }`}
            />
          </div>
        </div>
      </div>
    </animated.div>
  );
}
