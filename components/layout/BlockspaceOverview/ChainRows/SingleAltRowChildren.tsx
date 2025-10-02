import { useTheme } from "next-themes";
import { useMemo, useCallback, CSSProperties } from "react";
import { Icon } from "@iconify/react";
import { useLocalStorage } from "usehooks-ts";
import { useRowContext } from "./RowContext";
import { AltRowChildrenInterface } from "./ContextInterface";
import { useMaster } from "@/contexts/MasterContext";
import { indexOf } from "lodash";

export default function SingleAltRowChildren({
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
  } = useRowContext() as AltRowChildrenInterface;

  const sumChainValue = useMemo(() => {
    let retValue = 0;

    // For BlockspaceCO structure, data is a flat array structure
    if (data && data.data && data.types) {
      // Calculate sum for each chain by iterating through data rows
      data.data.forEach((row) => {
     
       
          const currentChainKey = row[categoryIndex] as string;
          const value = (row[data.types.indexOf("txcount")] as number) || 0;
          
          retValue += value;
        
      });
    }

    return retValue;
  }, [data, selectedMode]);


 console.log(sumChainValue);

  const isPrevCategoryHovered = useMemo(() => {
    if (categoryIndex === 0) return false;

    const allCategoryKeys = Object.keys(
      master.blockspace_categories.main_categories,
    );

    return isCategoryHovered(allCategoryKeys[categoryIndex - 1]);
  }, [master, isCategoryHovered, categoryIndex, selectedCategory]);

  const relativePercentageByChain = useMemo(() => {
    const chainPercentages: { [key: string]: number } = {};
    
    if (data && data.data && data.types) {
      // Get unique chains from data
      const chainIndex = data.types.indexOf("chain_id");
      const categoryIndex = data.types.indexOf("main_category_id");
      
      if (chainIndex !== -1 && categoryIndex !== -1) {
        const chainCategories: { [key: string]: Set<string> } = {};
        
        data.data.forEach((row) => {
          const chainKey = row[chainIndex] as string;
          const category = row[categoryIndex] as string;
          
          if (!chainCategories[chainKey]) {
            chainCategories[chainKey] = new Set<string>();
          }
          chainCategories[chainKey].add(category);
        });
        
        Object.keys(chainCategories).forEach((chainKey) => {
          chainPercentages[chainKey] = 100 - (chainCategories[chainKey].size - 1) * 2;
        });
      }
    }
    
    return chainPercentages;
  }, [data]);

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
        backgroundColor: "white",
        // width: "0px",
        borderRadius: "0px",
      };

      const categoriesKey = Object.keys(categories).indexOf(categoryKey);

      // For BlockspaceCO structure, find the specific data row for this chain and category
      let categoryData: number[] | null = null;
      let dataTypes = data?.types || [];
      
      if (data && data.data && data.types) {
        const categoryIndex = data.types.indexOf("main_category_id");
     
        if (categoryIndex !== -1) {
          const matchingRow = data.data.find(row => 
            row[categoryIndex] === categoryKey
          );
          
          if (matchingRow) {
            categoryData = [matchingRow[data.types.indexOf("txcount")] as number]; // Wrap in array to match expected format
          }
        }
      }

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

      const dataIndex = categoriesKey;
      style.backgroundColor = `rgba(0, 0, 0, ${
        1 - (1 - 0.1 * (dataIndex + 1))
      })`;

      if (isLastCategory)
        style.borderRadius = "10000px 99999px 99999px 10000px";

      if (categoryData && categoryData.length > 0) {
        const widthPercentage = categoryData[0] / sumChainValue;

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
      selectedTimespan,
    ],
  );

  const shareValue = useMemo(() => {
    if (!data || !data.data || !data.types) return 0;
    
    const categoryIndex = data.types.indexOf("main_category_id");

    if (categoryIndex === -1) return 0;
    
    const matchingRow = data.data.find(row => {
      return row[categoryIndex] === categoryKey;
    } 
    );
    
    if (!matchingRow) return 0;

    
    return matchingRow[data.types.indexOf("pct_share")] / 100;
  }, [data, chainKey, categoryKey, selectedMode, sumChainValue]);



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

      const allCategoryKeys = Object.keys(
        master.blockspace_categories.main_categories,
      );

      const isLastCategory = categoryKey === "unlabeled";
      const isFirstCategory = categoryKey === allCategoryKeys[0];

      // Find category data for BlockspaceCO structure
      let categoryData: number[] | null = null;
      if (data && data.data && data.types) {
        const categoryIndex = data.types.indexOf("main_category_id");

        if (categoryIndex !== -1) {
          const matchingRow = data.data.find(row => 
            row[categoryIndex] === categoryKey
          );
          
          if (matchingRow) {
            categoryData = [matchingRow[data.types.indexOf("txcount")] as number];
          }
        }
      }


      if (
        !categoryData &&
        !(
          selectedCategory === categoryKey ||
          isCategoryHovered(categoryKey) ||
          (selectedChain && selectedChain !== chainKey)
        )
      ) {
        style.backgroundColor = "rgba(255, 255, 255, 0.8)";
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
            style.backgroundColor = "#151A19";
          } else {
            if (!isCategoryHovered(categoryKey)) {
              style.backgroundColor = "inherit";
              if (!categoryData) {
                style.backgroundColor = "rgba(255, 255, 255, 0.8)";
                style.borderRadius = "50px";
              }
            } else {
              style.backgroundColor = "#1F2726";
            }
          }
        } else {
          style.backgroundColor = "#1F2726";
        }

        if (
          !selectedChain ||
          selectedChain === chainKey ||
          isCategoryHovered(categoryKey)
        ) {
          style.color = "#CDD8D3";
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

          // Check if first category has data for BlockspaceCO structure
          let firstCategoryHasData = false;
          if (data && data.data && data.types) {
            const chainIndex = data.types.indexOf("chain_id");
            const categoryIndex = data.types.indexOf("main_category_id");
            
            if (chainIndex !== -1 && categoryIndex !== -1) {
              const firstCategoryRow = data.data.find(row => 
                row[chainIndex] === chainKey && row[categoryIndex] === allCategoryKeys[0]
              );
              firstCategoryHasData = !!firstCategoryRow;
            }
          }

          if (
            categoryKey === allCategoryKeys[1] &&
            !categoryData &&
            !firstCategoryHasData
          ) {
            style.left = "3px";
          }

          style.borderRadius = "999px";

          style.border = `2px solid ${
            AllChainsByKeys[chainKey].colors["dark"][0] +
            (isCategoryHovered(categoryKey) ? "EE" : "FF")
          } `;
          if (!categoryData) {
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
                  ? "text-black"
                  : "text-white"
              }`
            : AllChainsByKeys[chainKey].darkTextOnBackground === true
            ? i > 4
              ? "text-white/60 text-[10px]"
              : "text-black text-[10px]"
            : i > 4
            ? "text-white/60 text-[10px]"
            : "text-white/80 text-[10px]"
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
          // Check if category has data for BlockspaceCO structure
          let hasData = false;
          if (data && data.data && data.types) {
            const chainIndex = data.types.indexOf("chain_id");
            const categoryIndex = data.types.indexOf("main_category_id");
            
            if (chainIndex !== -1 && categoryIndex !== -1) {
              const matchingRow = data.data.find(row => 
                row[chainIndex] === chainKey && row[categoryIndex] === categoryKey
              );
              hasData = !!matchingRow;
            }
          }

          if (selectedCategory === categoryKey) {
            if (!hasData) {
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
        {(() => {
          // Get category data for BlockspaceCO structure
          

          return shareValue !== null ? (
            <>
              {selectedValue === "absolute"
                ? selectedMode.includes("txcount")
                  ? ""
                  : showUsd
                  ? "$"
                  : "Ξ"
                : ""}
              {selectedValue === "share"
                ? shareValue > 0.05 ||
                  selectedCategory === categoryKey ||
                  isCategoryHovered(categoryKey)
                  ? (shareValue * 100.0).toFixed(2)
                  : ""
                : shareValue > 0.05 ||
                  selectedCategory === categoryKey ||
                  isCategoryHovered(categoryKey)
                ? formatNumber(shareValue)
                : ""}
              {selectedValue === "share" ? "%" : ""}{" "}
            </>
          ) : (
            <div
              className={`text-white/80 
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
          );
        })()}
      </div>
    </div>
  );
}
