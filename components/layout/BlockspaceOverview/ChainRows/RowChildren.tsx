import { useTheme } from "next-themes";
import { useMemo, useCallback, CSSProperties } from "react";
import { Icon } from "@iconify/react";
import { useLocalStorage } from "usehooks-ts";
import { useRowContext } from "./RowContext";
import { RowChildrenInterface } from "./ContextInterface";
import { useMaster } from "@/contexts/MasterContext";
import { indexOf } from "lodash";

export default function RowChildren({
  chainKey,
  categoryKey,
  i,
  categoryIndex,
  chainCategories,
}) {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { theme } = useTheme();

  const { AllChainsByKeys } = useMaster();

  const {
    data,
    master,
    selectedMode,
    forceSelectedChain,
    isCategoryHovered,
    selectedCategory,
    selectedChain,
    selectedTimespan,
    selectedValue,
    categories,
    allCats,
    setSelectedChain,
    setSelectedCategory,
    setAllCats,
    unhoverCategory,
    hoverCategory,
  } = useRowContext() as RowChildrenInterface;

  const sumChainValue = useMemo(() => {
    const chainValues = {};

    Object.keys(data).forEach((chainKey) => {
      let sumValue = 0;

      // Iterate over each category for the current chain
      Object.keys(data[chainKey].overview[selectedTimespan]).forEach(
        (category) => {
          const categoryData =
            data[chainKey].overview[selectedTimespan][category].data;

          // Check if category data exists and index is valid
          if (
            categoryData &&
            data[chainKey].overview["types"].indexOf(selectedMode) !== -1
          ) {
            const dataIndex =
              data[chainKey].overview["types"].indexOf(selectedMode);
            const categoryValue = categoryData[dataIndex];
            sumValue += categoryValue; // Add to the sum
          }
        },
      );

      // Store the sum of values for the chain
      chainValues[chainKey] = sumValue;
    });

    return chainValues;
  }, [data, selectedTimespan, selectedMode]);

  const relativePercentageByChain = useMemo(() => {
    return Object.keys(data).reduce((acc, chainKey) => {
      return {
        ...acc,
        [chainKey]:
          100 -
          (Object.keys(data[chainKey].overview[selectedTimespan]).length - 1) *
            2,
      };
    }, {});
  }, [data, selectedTimespan]);

  function formatNumber(number: number): string {
    if (number === 0) {
      return "0";
    } else if (Math.abs(number) >= 1e6) {
      if (Math.abs(number) >= 1e9) {
        return (number / 1e9).toFixed(1) + "B";
      } else {
        return (number / 1e6).toFixed(1) + "M";
      }
    } else if (Math.abs(number) >= 1e3) {
      const rounded =
        Math.abs(number) >= 10000
          ? Math.round(number / 1e3)
          : (number / 1e3).toFixed(1);
      return `${rounded}${Math.abs(number) >= 10000 ? "K" : "k"}`;
    } else if (Math.abs(number) >= 100) {
      return number.toFixed(0);
    } else if (Math.abs(number) >= 10) {
      return number.toFixed(1);
    } else {
      return number.toFixed(2);
    }
  }

  const childBlockStyle = useCallback(
    (
      chainKey: string,
      categoryKey: string, // dataIndex: number,
    ) => {
      const style: CSSProperties = {
        backgroundColor: "white",
        // width: "0px",
        borderRadius: "0px",
      };

      const categoriesKey = Object.keys(categories).indexOf(categoryKey);

      const dataKeys = Object.keys(data[chainKey].overview[selectedTimespan]);
      const dataKeysIntersectCategoriesKeys = Object.keys(categories).filter(
        (key) => dataKeys.includes(key),
      );
      const dataIndex = dataKeysIntersectCategoriesKeys.indexOf(categoryKey);
      const dataTypes = data[chainKey].overview.types;
      const categoryData =
        data[chainKey].overview[selectedTimespan][categoryKey]["data"];

      const allCategoryKeys = Object.keys(
        master.blockspace_categories.main_categories,
      );

      const isLastCategory = categoryKey === "unlabeled";
      const isFirstCategory = categoryKey === allCategoryKeys[0];

      const isNextCategoryHovered = isCategoryHovered(
        allCategoryKeys[allCategoryKeys.indexOf(categoryKey) + 1],
      );
      const isLastCategoryHovered = isCategoryHovered(
        allCategoryKeys[allCategoryKeys.indexOf(categoryKey) - 1],
      );

      style.backgroundColor = `rgba(0, 0, 0, ${
        1 - (1 - 0.1 * (dataIndex + 1))
      })`;

      if (isLastCategory)
        style.borderRadius = "10000px 99999px 99999px 10000px";

      if (categoryData) {
        if (isLastCategory && selectedCategory !== categoryKey) {
          style.background =
            "linear-gradient(-45deg, rgba(0, 0, 0, .88) 25%, rgba(0, 0, 0, .99) 25%, rgba(0, 0, 0, .99) 50%, rgba(0, 0, 0, .88) 50%, rgba(0, 0, 0, .88) 75%, rgba(0, 0, 0, .99) 75%, rgba(0, 0, 0, .99))";
          // style.background = undefined;
          //   "linear-gradient(to right, #e5405e 0%, #ffdb3a 45%, #3fffa2 100%)";
          // style.backgroundPosition = "75% 0%";
          // style.backgroundRepeat = "repeat";
          style.animation = "unlabeled-gradient 20s linear infinite";
          style.backgroundSize = "10px 10px";
        }
        if (selectedValue === "share") {
          style.width = categoryData
            ? categoryData[dataTypes.indexOf(selectedMode)] *
                relativePercentageByChain[chainKey] +
              8 +
              "%"
            : "0px";
          // if()
        } else {
          style.width = categoryData
            ? (categoryData[dataTypes.indexOf(selectedMode)] /
                sumChainValue[chainKey]) *
                relativePercentageByChain[chainKey] +
              8 +
              "%"
            : "0px";
          // if()
        }
      } else {
        style.width = 10;
      }

      style.opacity = 1;

      if (
        selectedCategory === categoryKey &&
        (isNextCategoryHovered || isLastCategoryHovered)
      ) {
        style.opacity = 0.75;
      }

      return style;
    },
    [
      AllChainsByKeys,
      selectedCategory,
      selectedMode,
      selectedChain,
      data,
      relativePercentageByChain,
      isCategoryHovered,
      categories,
      selectedTimespan,
    ],
  );

  const subChildStyle = useCallback(
    (
      chainKey: string,
      categoryKey: string, // dataIndex: number,
    ) => {
      const style: CSSProperties = {
        backgroundColor: "transparent",
        // width: "0px",
        borderRadius: "0px",
      };

      const allCategoryKeys = Object.keys(
        master.blockspace_categories.main_categories,
      );
      const dataTypes = data[chainKey].overview.types;

      const isLastCategory = categoryKey === "unlabeled";
      const isFirstCategory = categoryKey === allCategoryKeys[0];

      const categoryData =
        data[chainKey].overview[selectedTimespan][categoryKey]["data"];

      if (
        !data[chainKey].overview[selectedTimespan][categoryKey]["data"] &&
        !(selectedCategory === categoryKey || isCategoryHovered(categoryKey))
      ) {
        style.backgroundColor = "rgba(255, 255, 255, 0.8)";
        style.borderRadius = "50px";
      }

      if (selectedCategory === categoryKey || isCategoryHovered(categoryKey)) {
        if (!selectedChain || selectedChain === chainKey) {
          style.backgroundColor = "#1F2726";
          style.color = "#CDD8D3";
          style.transform =
            selectedCategory === categoryKey
              ? "scaleX(1.15) scaleY(1.20)"
              : "scaleX(1.05) scaleY(1.05)";
          style.transformOrigin = "center center";

          if (isFirstCategory) {
            style.transformOrigin = "left center";
            style.right = "10px";
          }

          if (isLastCategory) {
            style.transformOrigin = "right center";
            style.left = "3px";
          }

          style.borderRadius = "999px";
          style.boxShadow = "9999px 9999px 9999px 9999px #1F2726 inset";
          style.border = `2px solid ${AllChainsByKeys[chainKey].colors["dark"][0]} `;
          if (!data[chainKey].overview[selectedTimespan][categoryKey]["data"]) {
            style.minWidth = "55px";
          }
        }
      }

      return style;
    },
    [
      AllChainsByKeys,
      selectedCategory,
      selectedMode,
      selectedChain,
      data,
      relativePercentageByChain,
      isCategoryHovered,
      categories,
      selectedTimespan,
    ],
  );

  return (
    <div
      className="flex flex-col h-[31px] relative w-full cursor-pointer justify-center items-center transition-all"
      style={{
        ...childBlockStyle(chainKey, categoryKey),
        zIndex:
          selectedCategory === categoryKey || isCategoryHovered(categoryKey)
            ? 20
            : 10, // Higher z-index for the selected div
      }}
      onMouseEnter={() => {
        hoverCategory(categoryKey);
      }}
      onMouseLeave={() => {
        unhoverCategory(categoryKey);
      }}
    >
      <div
        className={`w-full h-full flex justify-center items-center absolute cursor-pointer z-[40] opacity-100 transition-all ${
          (selectedCategory === categoryKey &&
            (selectedChain === chainKey || selectedChain === null)) ||
          isCategoryHovered(categoryKey)
            ? `${
                isCategoryHovered(categoryKey) &&
                selectedCategory !== categoryKey
                  ? "text-xs"
                  : "text-[13px] font-bold"
              } ${
                AllChainsByKeys[chainKey].darkTextOnBackground === true
                  ? "text-black"
                  : "text-white"
              }`
            : AllChainsByKeys[chainKey].darkTextOnBackground === true
            ? i > 4
              ? "text-white/60 text-xs"
              : "text-black text-xs"
            : i > 4
            ? "text-white/60 text-xs"
            : "text-white/80 text-xs"
        } `}
        style={{
          ...subChildStyle(chainKey, categoryKey),
          zIndex:
            selectedCategory === categoryKey
              ? 30
              : isCategoryHovered(categoryKey)
              ? 40
              : 20, // Higher z-index for the child div of the selected element
        }}
        onClick={() => {
          if (selectedCategory === categoryKey) {
            if (
              !data[chainKey].overview[selectedTimespan][categoryKey]["data"]
            ) {
              return;
            }
            if (selectedChain === chainKey && !forceSelectedChain) {
              // setSelectedCategory(categoryKey);
              setSelectedChain(null);
            } else {
              // setSelectedCategory(categoryKey);
              setSelectedChain(chainKey);
            }
          } else {
            setSelectedCategory(categoryKey);
            if (forceSelectedChain) setAllCats(false);
            if (!forceSelectedChain) setSelectedChain(null);
          }
        }}
      >
        {data[chainKey].overview[selectedTimespan][categoryKey]["data"] ? (
          <>
            {selectedValue === "absolute"
              ? selectedMode.includes("txcount")
                ? ""
                : showUsd
                ? "$ "
                : "Ξ "
              : ""}
            {selectedValue === "share"
              ? (
                  data[chainKey].overview[selectedTimespan][categoryKey][
                    "data"
                  ][data[chainKey].overview.types.indexOf(selectedMode)] * 100.0
                ).toFixed(2)
              : formatNumber(
                  data[chainKey].overview[selectedTimespan][categoryKey][
                    "data"
                  ][data[chainKey].overview.types.indexOf(selectedMode)],
                )}
            {selectedValue === "share" ? "%" : ""}{" "}
          </>
        ) : (
          <div
            className={`text-white/80 
                          ${
                            isCategoryHovered(categoryKey) ||
                            selectedCategory === categoryKey
                              ? "opacity-100 py-8"
                              : "opacity-0"
                          } transition-opacity duration-300 ease-in-out`}
          >
            {selectedValue === "absolute"
              ? selectedMode.includes("txcount")
                ? ""
                : showUsd
                ? "$ "
                : "Ξ "
              : ""}
            0 {selectedValue === "share" ? "%" : ""}{" "}
          </div>
        )}
      </div>
    </div>
  );
}
