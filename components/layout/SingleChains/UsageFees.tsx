import { useState, useMemo, useCallback } from "react";
import { useMediaQuery } from "usehooks-ts";
import { useUIContext } from "@/contexts/UIContext";
import Link from "next/link";
import { Icon } from "@iconify/react";

export default function UsageFees({
  chainFeeData,
  showUsd,
}: {
  chainFeeData: object;
  showUsd: boolean;
}) {
  const [hoverBarIndex, setHoverBarIndex] = useState<Number | null>(null);
  const [selectedBarIndex, setSelectedBarIndex] = useState(23);
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const isSidebarOpen = useUIContext((state) => state.isSidebarOpen);
  const optIndex = useMemo(() => {
    let pickIndex = hoverBarIndex ? hoverBarIndex : selectedBarIndex;
    let retIndex = 23 - Number(pickIndex);
    return retIndex;
  }, [selectedBarIndex, hoverBarIndex]);

  const getGradientColor = useCallback((percentage, weighted = false) => {
    const colors = !weighted
      ? [
        { percent: 0, color: "#1DF7EF" },
        { percent: 20, color: "#76EDA0" },
        { percent: 50, color: "#FFDF27" },
        { percent: 70, color: "#FF9B47" },
        { percent: 100, color: "#FE5468" },
      ]
      : [
        { percent: 0, color: "#1DF7EF" },
        { percent: 2, color: "#76EDA0" },
        { percent: 10, color: "#FFDF27" },
        { percent: 40, color: "#FF9B47" },
        { percent: 80, color: "#FE5468" },
        { percent: 100, color: "#FE5468" }, // Repeat the final color to ensure upper bound
      ];

    let lowerBound = colors[0];
    let upperBound = colors[colors.length - 1];

    if (weighted) {
      // Adjust lower and upper bounds for weighted gradient
      lowerBound = colors[0];
      upperBound = colors[1];
    }

    for (let i = 0; i < colors.length - 1; i++) {
      if (
        percentage >= colors[i].percent &&
        percentage <= colors[i + 1].percent
      ) {
        lowerBound = colors[i];
        upperBound = colors[i + 1];
        break;
      }
    }

    const percentDiff =
      (percentage - lowerBound.percent) /
      (upperBound.percent - lowerBound.percent);

    const r = Math.floor(
      parseInt(lowerBound.color.substring(1, 3), 16) +
      percentDiff *
      (parseInt(upperBound.color.substring(1, 3), 16) -
        parseInt(lowerBound.color.substring(1, 3), 16)),
    );

    const g = Math.floor(
      parseInt(lowerBound.color.substring(3, 5), 16) +
      percentDiff *
      (parseInt(upperBound.color.substring(3, 5), 16) -
        parseInt(lowerBound.color.substring(3, 5), 16)),
    );

    const b = Math.floor(
      parseInt(lowerBound.color.substring(5, 7), 16) +
      percentDiff *
      (parseInt(upperBound.color.substring(5, 7), 16) -
        parseInt(lowerBound.color.substring(5, 7), 16)),
    );

    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }, []);

  const feeValue = useMemo(() => {
    let multiplier = 100;

    if (!showUsd) {
      // showing Gwei
      multiplier = 1e9;
    }

    return chainFeeData[0] &&
      chainFeeData?.[optIndex]?.[showUsd ? 2 : 1] !== null
      ? Intl.NumberFormat("en-GB", {
        notation: "compact",
        maximumFractionDigits: showUsd ? 1 : 2,
        minimumFractionDigits: showUsd ? 1 : 2,
      }).format(chainFeeData[optIndex][showUsd ? 2 : 1] * multiplier)
      : "N/A"

  }, [chainFeeData, optIndex, showUsd]);



  return (
    <div
      className={`h-[58px] flex relative gap-x-[5px] px-[5px] py-[10px] items-center rounded-[15px] bg-forest-50 dark:bg-color-bg-default w-full ${isMobile ? "justify-between" : "justify-normal"
        } `}
    >
      <div
        className={`absolute z-20 inset-0 pointer-events-none shadow-inner rounded-2xl group-hover:opacity-0 transition-opacity duration-300 ${isMobile
          ? "opacity-0"
          : isSidebarOpen
            ? "2xl:opacity-0 md:opacity-100 "
            : "xl:opacity-0 md:opacity-100"
          }`}
        style={{
          boxShadow: "-55px 0px 10px rgba(21, 26, 25, 0.45) inset",
        }}
      ></div>
      <div className="flex gap-x-[5px]">
        <div className="flex flex-col items-center leading-tight pt-[9px] ">
          <div className="text-[14px] font-semibold w-[44px]  flex justify-center">
            {feeValue}
          </div>
          <div className="text-[8px] w-[44px] flex justify-center">{showUsd ? "cents" : "gwei"}</div>
        </div>
        <div className="flex flex-col leading-3 gap-y-[0px] justify-self-start">
          <div className="text-[10px] text-[#5A6462] font-bold">
            What a typical user paid for a
          </div>
          <div className="relative flex items-center gap-x-[1px]">
            {Array.from({ length: 24 }, (_, index) => (
              <div
                key={index.toString() + "circles"}
                className="h-[12px] flex items-center justify-end cursor-pointer"
                onMouseEnter={() => {
                  setHoverBarIndex(index);
                }}
                onMouseLeave={() => {
                  setHoverBarIndex(null);
                }}
                onClick={() => {
                  setSelectedBarIndex(index);
                }}
              >
                <div
                  className={`w-[5px] h-[5px] rounded-full transition-all duration-300 ${selectedBarIndex === index
                    ? "scale-[160%]"
                    : hoverBarIndex === index
                      ? "scale-[120%] opacity-90"
                      : "scale-100 opacity-50"
                    }`}
                  style={{
                    backgroundColor:
                      !chainFeeData[23 - index] ||
                        !chainFeeData[23 - index][showUsd ? 2 : 1]
                        ? "gray"
                        : getGradientColor(
                          Math.floor(chainFeeData[23 - index][3] * 100),
                        ),
                  }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center w-[110%] ">
            <div className="text-[10px] font-bold ">Transaction</div>
            <div className="text-[8px] font-semibold min-w-[53px]">
              {optIndex + 1 > 1
                ? optIndex + 1 + " hours ago"
                : optIndex + 1 + " hour ago"}
            </div>
          </div>
        </div>
      </div>
      <div className="h-full flex flex-col justify-between items-end pr-[5px] z-10 ">
        <Link
          href={`/fees`}
          className="rounded-full  w-[15px] h-[15px] bg-color-bg-medium flex items-center justify-center text-[10px] hover:cursor-pointer z-10"
        >
          <Icon icon="feather:arrow-right" className="w-[11px] h-[11px]" />
        </Link>
      </div>
    </div>
  );
}
