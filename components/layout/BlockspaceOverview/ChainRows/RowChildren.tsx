import { useTheme } from "next-themes";
import { useMemo, useCallback, CSSProperties } from "react";
import { Icon } from "@iconify/react";
import { useLocalStorage } from "usehooks-ts";
import { useRowContext } from "./RowContext";
import { RowChildrenInterface } from "./ContextInterface";
import { useMaster } from "@/contexts/MasterContext";

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

  const getBarSectionStyle = useCallback(
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

      const categoryData =
        data[chainKey].overview[selectedTimespan][categoryKey]["data"];

      // const isLastCategory =
      //   dataIndex === dataKeysIntersectCategoriesKeys.length - 1;

      const isLastCategory = categoryKey === "unlabeled";
      const isFirstCategory = categoryKey === "nft_fi";

      const dataTypes = data[chainKey].overview.types;

      const isSelectedCategory = selectedCategory === categoryKey && !allCats;

      const isSelectedChainOrNoSelectedChain =
        selectedChain === chainKey || !selectedChain;

      // default transition
      style.transition = "all 0.165s ease-in-out";

      if (isFirstCategory) style.transformOrigin = "left center";
      else if (isLastCategory) style.transformOrigin = "right center";

      if (isLastCategory)
        style.borderRadius = "20000px 99999px 99999px 20000px";

      if (!categoryData) {
        if (
          (isSelectedCategory && isSelectedChainOrNoSelectedChain) ||
          isCategoryHovered(categoryKey)
        ) {
          if (isSelectedCategory && isSelectedChainOrNoSelectedChain) {
            style.backgroundColor = "#1F2726";

            style.color = "rgba(0, 0, 0, 0.66)";

            // style.marginRight = "-5px";
          } else {
            style.backgroundColor = "#1F2726";
            style.color = "rgba(0, 0, 0, 0.66)";
          }
          if (isLastCategory) {
            style.borderRadius = "25% 125% 125% 25%";
          } else {
            style.borderRadius = "999px";
          }
          style.transform =
            isCategoryHovered(categoryKey) && !isSelectedCategory
              ? "scale(1.04)"
              : isSelectedChainOrNoSelectedChain
              ? "scale(1.08)"
              : "scale(1.04)";

          if (isLastCategory && isSelectedChainOrNoSelectedChain)
            style.transform += " translateX(3px)";
          style.zIndex = isCategoryHovered(categoryKey) ? 2 : 5;
        } else {
          style.backgroundColor = "rgba(255,255,255, 0.60)";
          if (isLastCategory) {
            style.borderRadius = "20000px 9999999px 9999999px 20000px";
            style.paddingRight = "30px";
          } else {
            style.borderRadius = "2px";
          }
        }
        style.paddingTop =
          isCategoryHovered(categoryKey) || selectedCategory === categoryKey
            ? "20px"
            : "0px";
        style.paddingBottom =
          isCategoryHovered(categoryKey) || selectedCategory === categoryKey
            ? "20px"
            : "0px";
        style.width =
          isCategoryHovered(categoryKey) || selectedCategory === categoryKey
            ? "55px"
            : "10px";

        style.margin = "0px 1px";

        return style;
      }
      if (
        (isSelectedCategory && isSelectedChainOrNoSelectedChain) ||
        isCategoryHovered(categoryKey)
      ) {
        if (isLastCategory) {
          style.borderRadius = "99999px 99999px 99999px 99999px";
        } else {
          style.borderRadius = "999px";
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
        style.transform =
          isCategoryHovered(categoryKey) && !isSelectedCategory
            ? "scaleY(1.05)"
            : isSelectedChainOrNoSelectedChain
            ? "scaleY(1.06)"
            : "scaleY(1.05)";

        style.transform =
          isCategoryHovered(categoryKey) && !isSelectedCategory
            ? "scaleX(1.02)"
            : isSelectedChainOrNoSelectedChain
            ? "scaleX(1.06)"
            : "scaleX(1.02)";

        if (isLastCategory && isSelectedChainOrNoSelectedChain)
          style.transform += " translateX(3px)";

        // style.outline =
        //   isSelectedCategory && isSelectedChainOrNoSelectedChain
        //     ? "3px solid rgba(255,255,255, 1)"
        //     : "3px solid rgba(255,255,255, 0.33)";

        style.zIndex = isCategoryHovered(categoryKey) ? 2 : 5;

        style.backgroundColor = "#1F2726";
      } else {
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
        }

        // if(isCategoryHovered[categoryKey])
        // style.transform =
        //   isCategoryHovered[categoryKey] && !isSelectedCategory
        //     ? "scale(1)"
        //     : "scale(1.05)";

        if (isLastCategory) {
          style.borderRadius = "0px 99999px 99999px 0px";
        } else {
          style.borderRadius = "0px";
        }

        if (categoryKey === "unlabeled" && categoryData) {
          // style.backgroundColor = "rgba(88, 88, 88, 0.55)";
          style.background =
            "linear-gradient(-45deg, rgba(0, 0, 0, .88) 25%, rgba(0, 0, 0, .99) 25%, rgba(0, 0, 0, .99) 50%, rgba(0, 0, 0, .88) 50%, rgba(0, 0, 0, .88) 75%, rgba(0, 0, 0, .99) 75%, rgba(0, 0, 0, .99))";
          // style.background = undefined;
          //   "linear-gradient(to right, #e5405e 0%, #ffdb3a 45%, #3fffa2 100%)";
          // style.backgroundPosition = "75% 0%";
          // style.backgroundRepeat = "repeat";
          style.animation = "unlabeled-gradient 20s linear infinite";
          style.backgroundSize = "10px 10px";
        } else {
          style.backgroundColor = `rgba(0, 0, 0, ${
            0.06 + (dataIndex / (Object.keys(categories).length - 1)) * 0.94
          })`;
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

  return (
    <div
      key={categoryKey}
      onClick={() => {
        if (selectedCategory === categoryKey) {
          if (!data[chainKey].overview[selectedTimespan][categoryKey]["data"]) {
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
      onMouseEnter={() => {
        hoverCategory(categoryKey);
      }}
      onMouseLeave={() => {
        unhoverCategory(categoryKey);
      }}
      className={`flex flex-col h-[31px] justify-center items-center cursor-pointer relative transition-all duration-200 ease-in-out
        ${
          data[chainKey].overview[selectedTimespan][categoryKey]
            ? (selectedCategory === categoryKey &&
                !allCats &&
                (selectedChain === chainKey || selectedChain === null)) ||
              isCategoryHovered(categoryKey)
              ? isCategoryHovered(categoryKey) &&
                selectedCategory !== categoryKey
                ? `py-[18px] -my-[3px] z-[2] shadow-lg`
                : `py-[20px] -my-[5px] z-[2] shadow-lg`
              : `z-[1]`
            : "py-[18px] -my-[3px] z-[2] shadow-lg"
        } 
                        ${
                          categoryIndex === Object.keys(categories).length - 1
                            ? selectedCategory === categoryKey &&
                              (selectedChain === chainKey ||
                                selectedChain === null)
                              ? ""
                              : "rounded-r-full"
                            : ""
                        }`}
      style={
        getBarSectionStyle(chainKey, categoryKey)
        // background: data[chainKey].overview[selectedTimespan][categoryKey]
        //   ? (selectedCategory === categoryKey && (!allCats && (selectedChain === chainKey || selectedChain === null))) || isCategoryHovered(categoryKey) ? isCategoryHovered(categoryKey) && selectedCategory !== categoryKey
        //     ? AllChainsByKeys[chainKey].colors[theme ?? "dark"][1]
        //     : AllChainsByKeys[chainKey].colors[theme ?? "dark"][1]
        //     : undefined
        //   : undefined,
      }
    >
      <div
        className={`font-medium w-full absolute  inset-0 flex items-center justify-center ${
          (selectedCategory === categoryKey &&
            (selectedChain === chainKey || selectedChain === null)) ||
          isCategoryHovered(categoryKey)
            ? `${
                isCategoryHovered(categoryKey) &&
                selectedCategory !== categoryKey
                  ? "text-xs"
                  : "text-sm font-semibold"
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
        } ${
          categoryKey === selectedCategory || isCategoryHovered(categoryKey)
            ? "border-[3px] rounded-full text-white/80 "
            : "border-none rounded-inherit text-inherit "
        }`}
        style={{
          borderColor: AllChainsByKeys[chainKey].colors["dark"][0],
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
