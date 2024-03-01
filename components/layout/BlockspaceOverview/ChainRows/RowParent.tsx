import { useTheme } from "next-themes";
import { useMemo, useCallback } from "react";
import { Icon } from "@iconify/react";
import { AllChainsByKeys } from "@/lib/chains";
import { useRowContext } from "./RowContext";
import RowChildren from "./RowChildren";
import { RowParentInterface } from "./ContextInterface";

export default function RowParent({ chainKey, index }) {
  const { theme } = useTheme();

  const {
    data,
    selectedMode,
    forceSelectedChain,
    isCategoryHovered,
    selectedChain,
    selectedTimespan,
    categories,
    allCats,
    setAllCats,
    setIsCategoryHovered,
  } = useRowContext() as RowParentInterface;

  const DisabledStates: {
    [mode: string]: {
      [chain: string]: {
        text: string;
        reason: string;
      };
    };
  } = {
    gas_fees_share_eth: {
      imx: {
        text: "No Gas Fees",
        reason: "IMX does not charge Gas Fees",
      },
    },
    gas_fees_share_usd: {
      imx: {
        text: "No Gas Fees",
        reason: "IMX does not charge Gas Fees",
      },
    },
    gas_fees_usd_absolute: {
      imx: {
        text: "No Gas Fees",
        reason: "IMX does not charge Gas Fees",
      },
    },
    gas_fees_eth_absolute: {
      imx: {
        text: "No Gas Fees",
        reason: "IMX does not charge Gas Fees",
      },
    },
  };

  return (
    <div key={index} className="w-full h-full relative">
      {DisabledStates[selectedMode] &&
      DisabledStates[selectedMode][chainKey] ? (
        <>
          <div
            className={`flex flex-row flex-grow h-full items-center rounded-full text-xs font-medium ${
              AllChainsByKeys[chainKey].darkTextOnBackground === true
                ? "text-white dark:text-black"
                : "text-white"
            } ${AllChainsByKeys[chainKey].backgrounds[theme][1]}`}
          >
            <div className="flex items-center h-[45px] pl-[20px] w-[155px] min-w-[155px] z-10">
              <div className="flex justify-center items-center w-[30px]">
                <Icon
                  icon={`gtp:${chainKey}-logo-monochrome`}
                  className="w-[15px] h-[15px]"
                />
              </div>
              <div className="-mb-0.5">{AllChainsByKeys[chainKey].label}</div>
            </div>
            {/* Additional content */}
          </div>
        </>
      ) : (
        <div
          className={`flex flex-row flex-grow h-full items-center rounded-full text-xs font-medium ${
            AllChainsByKeys[chainKey].darkTextOnBackground === true
              ? "text-white dark:text-black"
              : "text-white"
          } ${AllChainsByKeys[chainKey].backgrounds[theme][1]}`}
        >
          <div
            className={`flex items-center h-[45px] pl-[20px] w-[155px] min-w-[155px] ${
              forceSelectedChain
                ? isCategoryHovered["all_chain"]
                  ? isCategoryHovered["all_chain"] && allCats
                    ? `rounded-l-full py-[25px] -my-[5px] z-[2] shadow-lg ${AllChainsByKeys[chainKey].backgrounds[theme][1]}`
                    : `rounded-l-full py-[24px] -my-[5px] z-[2] shadow-lg ${AllChainsByKeys[chainKey].backgrounds[theme][1]}`
                  : allCats
                  ? `rounded-l-full py-[25px] -my-[5px] z-[2] shadow-lg ${AllChainsByKeys[chainKey].backgrounds[theme][1]}`
                  : "z-1"
                : ""
            }  ${
              forceSelectedChain
                ? "hover:cursor-pointer"
                : "hover:cursor-default"
            } `}
            onMouseEnter={() => {
              setIsCategoryHovered((prev) => ({
                ...prev,
                ["all_chain"]: true,
              }));
            }}
            onMouseLeave={() => {
              setIsCategoryHovered((prev) => ({
                ...prev,
                ["all_chain"]: false,
              }));
            }}
            onClick={() => {
              if (forceSelectedChain) {
                setAllCats(!allCats);
              }
            }}
          >
            <div className="flex justify-center items-center w-[30px]">
              <Icon
                icon={`gtp:${chainKey.replace("_", "-")}-logo-monochrome`}
                className="w-[15px] h-[15px]"
              />
            </div>
            <div className="-mb-0.5">{AllChainsByKeys[chainKey].label}</div>
          </div>
          <div className="flex w-full pr-[2px] py-[2px] relative">
            {/*Children */}
            {Object.keys(categories).map((categoryKey, i) => {
              const rawChainCategories = Object.keys(
                data[chainKey].overview[selectedTimespan],
              );

              const chainCategories = Object.keys(categories).filter((x) =>
                rawChainCategories.includes(x),
              );

              const categoryIndex = chainCategories.indexOf(categoryKey);

              return (
                <RowChildren
                  key={chainKey}
                  chainKey={chainKey}
                  categoryKey={categoryKey}
                  i={i}
                  categoryIndex={categoryIndex}
                  chainCategories={chainCategories}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
