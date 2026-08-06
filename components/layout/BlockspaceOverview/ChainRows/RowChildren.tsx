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
  parentRef,
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

  // the categories currently rendered as columns — categories that were removed
  // (e.g. "unlabeled") are excluded so the remaining shares re-normalize to 100%
  const visibleCategoryKeys = useMemo(
    () => Object.keys(categories),
    [categories],
  );

  const sumChainValue = useMemo(() => {
    const chainValues = {};

    Object.keys(data).forEach((chainKey) => {
      let sumValue = 0;

      // Iterate over each visible category for the current chain
      Object.keys(data[chainKey].overview[selectedTimespan])
        .filter((category) => visibleCategoryKeys.includes(category))
        .forEach((category) => {
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
        });

      // Store the sum of values for the chain
      chainValues[chainKey] = sumValue;
    });

    return chainValues;
  }, [data, selectedTimespan, selectedMode, visibleCategoryKeys]);

  const isPrevCategoryHovered = useMemo(() => {
    if (categoryIndex === 0) return false;

    return isCategoryHovered(visibleCategoryKeys[categoryIndex - 1]);
  }, [visibleCategoryKeys, isCategoryHovered, categoryIndex, selectedCategory]);

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
      return `${rounded}${Math.abs(number) >= 10000 ? "k" : "k"}`;
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
        background: "white",
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

      const allCategoryKeys = visibleCategoryKeys;

      const isLastCategory =
        categoryKey === allCategoryKeys[allCategoryKeys.length - 1];
      const isFirstCategory = categoryKey === allCategoryKeys[0];

      const isNextCategoryHovered = isCategoryHovered(
        allCategoryKeys[allCategoryKeys.indexOf(categoryKey) + 1],
      );
      const isLastCategoryHovered = isCategoryHovered(
        allCategoryKeys[allCategoryKeys.indexOf(categoryKey) - 1],
      );

      if(theme === "dark") {
        style.background = `rgba(31, 39, 38, ${
          1 - (1 - 0.1 * (dataIndex + 1))
        })`;
      } else {
        style.background = `rgba(240, 244, 244, ${
          1 - (1 - 0.1 * (dataIndex + 1))
        })`;
      }

      if (isLastCategory)
        style.borderRadius = "10000px 99999px 99999px 10000px";

      if (categoryData) {
        const widthPercentage =
          categoryData[dataTypes.indexOf(selectedMode)] /
          sumChainValue[chainKey];

        if (categoryKey === "unlabeled" && selectedCategory !== categoryKey) {
          style.background =
              "linear-gradient(-45deg, rgb(var(--bg-default)) 25%, rgb(var(--bg-default)) 25%, rgb(var(--bg-default)) 50%, rgb(var(--bg-default)) 50%, rgb(var(--bg-default)) 75%, rgb(var(--bg-default)) 75%, rgb(var(--bg-default)))";
          // style.background = undefined;
          //   "linear-gradient(to right, #e5405e 0%, #ffdb3a 45%, #3fffa2 100%)";
          // style.backgroundPosition = "75% 0%";
          // style.backgroundRepeat = "repeat";
          style.animation = "unlabeled-gradient 20s linear infinite";
          style.backgroundSize = "10px 10px";
        }
        if (selectedValue === "share") {
          style.width = `calc(${widthPercentage * 100}%)`;
          style.minWidth = "20px";
          // if()
        } else {
          style.width = `calc(${widthPercentage * 100}%)`;
          style.minWidth = "20px";
          // if()
        }
      } else {
        style.width = 10;
      }

      style.opacity = 1;

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
      visibleCategoryKeys,
      selectedTimespan,
      selectedValue,
      sumChainValue,
      theme,
    ],
  );

  const shareValue = useMemo(() => {
    const dataTypes = data[chainKey].overview.types;
    const categoryData =
      data[chainKey].overview[selectedTimespan][categoryKey]["data"];
    if (!categoryData) return 0;
    else
      return (
        categoryData[dataTypes.indexOf(selectedMode)] / sumChainValue[chainKey]
      );
  }, [
    data,
    chainKey,
    categoryKey,
    selectedMode,
    selectedTimespan,
    sumChainValue,
  ]);

  // Whether this cell shows its number rather than a bare "%". Segments under
  // 5% are too narrow to fit one, so they only reveal it while this cell is the
  // emphasised one. Mirrors the condition the wrapper uses to pick its type
  // styling — in particular, once a chain is selected only that chain's row
  // counts as emphasised, so the rest of the selected column falls back to the
  // 5% rule instead of every chain expanding at once.
  const showsValue =
    shareValue > 0.05 ||
    (selectedCategory === categoryKey &&
      (selectedChain === chainKey || selectedChain === null) &&
      !allCats) ||
    isCategoryHovered(categoryKey);

  const subChildStyle = useCallback(
    (
      chainKey: string,
      categoryKey: string, // dataIndex: number,
    ) => {
      const style: CSSProperties = {
        backgroundColor: "inherit",
        // width: "0px",
        borderRadius: "0px",
      };

      const allCategoryKeys = visibleCategoryKeys;
      const dataTypes = data[chainKey].overview.types;

      const isLastCategory =
        categoryKey === allCategoryKeys[allCategoryKeys.length - 1];
      const isFirstCategory = categoryKey === allCategoryKeys[0];

      // This overlay is absolutely positioned at w-full/h-full over the block
      // below and inherits its background, so square corners here paint over
      // the block's rounded right cap and flatten it. Carry the same cap. The
      // branches below still override it for the no-data and selected/hovered
      // states, as before.
      if (isLastCategory) {
        style.borderRadius = "0px 17.5px 17.5px 0px";
      }

      const categoryData =
        data[chainKey].overview[selectedTimespan][categoryKey]["data"];

      if (
        !data[chainKey].overview[selectedTimespan][categoryKey]["data"] &&
        !(
          selectedCategory === categoryKey ||
          isCategoryHovered(categoryKey) ||
          (selectedChain && selectedChain !== chainKey)
        )
      ) {
        style.backgroundColor = "rgb(var(--bg-default))";
        if (isLastCategory) {
          style.borderRadius = "50px 999px 999px 50px";
        } else {
          style.borderRadius = "50px";
        }
      }

      if (
        (selectedCategory === categoryKey && !allCats) ||
        isCategoryHovered(categoryKey)
      ) {
        if (selectedCategory === categoryKey) {
          if (!selectedChain || selectedChain === chainKey) {
            style.backgroundColor = "rgb(var(--bg-default))";
          } else {
            if (!isCategoryHovered(categoryKey)) {
              style.backgroundColor = "inherit";
              if (!categoryData) {
                style.backgroundColor = "rgb(var(--bg-default))";
                style.borderRadius = "50px";
              }
            } else {
              style.backgroundColor = "rgb(var(--bg-default))";
            }
          }
        } else {
          style.backgroundColor = "rgb(var(--bg-default))";
        }

        if (
          !selectedChain ||
          selectedChain === chainKey ||
          isCategoryHovered(categoryKey)
        ) {
          style.color = "rgb(var(--text-primary))";
          style.minWidth = "55px";
          style.width = "calc(100% + 14px)";
          style.height = "38px";
          style.transformOrigin = "center center";

          if (isFirstCategory) {
            if (categoryData) {
              style.transformOrigin = "left center";
              style.left = "0px";
            } else {
              style.left = "0px";
            }
          }

          if (isLastCategory) {
            if (categoryData) {
              style.transformOrigin = "right center";
              style.right = "-5px";
            } else {
              style.right = "1px";
              style.borderRadius = "";
            }
          }

          if (
            categoryKey === allCategoryKeys[1] &&
            !categoryData &&
            !data[chainKey].overview[selectedTimespan][allCategoryKeys[0]][
              "data"
            ]
          ) {
            style.left = "3px";
          }

          style.borderRadius = "999px";

          style.border = `2px solid ${
            AllChainsByKeys[chainKey].colors["dark"][0] +
            (isCategoryHovered(categoryKey) ? "EE" : "FF")
          } `;
          if (!data[chainKey].overview[selectedTimespan][categoryKey]["data"]) {
            style.minWidth = "55px";
          }
        }
      }

      return style;
    },
    [
      allCats,
      AllChainsByKeys,
      selectedCategory,
      selectedMode,
      selectedChain,
      data,
      relativePercentageByChain,
      isCategoryHovered,
      categories,
      visibleCategoryKeys,
      selectedTimespan,
    ],
  );

  return (
    <div
      className="flex flex-col h-[31px] relative w-full  cursor-pointer justify-center items-center transition-all "
      style={{
        ...childBlockStyle(chainKey, categoryKey),
        zIndex:
          selectedCategory === categoryKey
            ? 20
            : isCategoryHovered(categoryKey)
            ? 25
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
        className={`w-full h-full flex justify-center items-center absolute cursor-pointer opacity-100 transition-all ${
          (selectedCategory === categoryKey &&
            (selectedChain === chainKey || selectedChain === null) &&
            !allCats) ||
          isCategoryHovered(categoryKey)
            ? `${
                isCategoryHovered(categoryKey) &&
                selectedCategory !== categoryKey
                  ? "text-[14px] font-semibold"
                  : "text-[14px] font-bold"
              } ${
                AllChainsByKeys[chainKey].darkTextOnBackground === true
                  ? "text-color-text-primary"
                  : "text-color-text-primary"
              }`
            : AllChainsByKeys[chainKey].darkTextOnBackground === true
            ? i > 4
              ? "text-color-text-primary/60 text-[10px]"
              : "text-color-text-primary text-[10px]"
            : i > 4
            ? "text-color-text-primary/60 text-[10px]"
            : "text-color-text-primary/80 text-[10px]"
        } `}
        style={{
          ...subChildStyle(chainKey, categoryKey),
          zIndex:
            selectedCategory === categoryKey
              ? 40
              : isCategoryHovered(categoryKey)
              ? 60
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
              if (allCats) {
                setAllCats(false);
              }
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
      >
        {data[chainKey].overview[selectedTimespan][categoryKey]["data"] ? (
          <>
            {selectedValue === "absolute"
              ? selectedMode.includes("txcount")
                ? ""
                : showUsd
                ? "$"
                : "Ξ"
              : ""}
            {selectedValue === "share"
              ? showsValue
                ? // relative to the sum of the visible categories, so removing a
                  // column (e.g. "unlabeled") re-normalizes the remaining shares
                  (shareValue * 100.0).toFixed(2)
                : ""
              : showsValue
              ? formatNumber(
                  data[chainKey].overview[selectedTimespan][categoryKey][
                    "data"
                  ][data[chainKey].overview.types.indexOf(selectedMode)],
                )
              : ""}
            {selectedValue === "share" ? "%" : ""}{" "}
          </>
        ) : (
          <div
            className={`text-color-text-primary/80
                          ${
                            isCategoryHovered(categoryKey) ||
                            selectedCategory === categoryKey
                              ? !selectedChain ||
                                selectedChain === chainKey ||
                                isCategoryHovered(categoryKey)
                                ? "opacity-100 py-8"
                                : "opacity-0"
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
