import RowParent from "./RowParent";
import { useRowContext } from "./RowContext";
import { RowContainerInterface } from "./ContextInterface";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";

export default function RowContainer() {
  const {
    master,
    data,
    forceSelectedChain,
    isCategoryHovered,
    selectedCategory,
    selectedChain,
    selectedTimespan,
    categories,
    allCats,
    setSelectedChain,
    setSelectedCategory,
    setAllCats,
    hoverCategory,
    unhoverCategory,
  } = useRowContext() as RowContainerInterface;

  return (
    <HorizontalScrollContainer>
      <div
        className={"min-w-[880px] md:min-w-[910px] overflow-hidden px-[16px]"}
      >
        <div
          className={
            "relative h-[50px] border-x-[1px] border-t-[1px] rounded-t-[15px] text-forest-50 dark:text-forest-50 border-forest-400 dark:border-forest-800 bg-forest-900 dark:bg-forest-1000 mt-6 overflow-hidden"
          }
        >
          <div className="flex w-full h-full text-[12px]">
            <div
              className={`relative flex w-[138px] h-full justify-center items-center`}
            >
              <button
                className={`flex flex-col flex-1 h-full justify-center items-center border-x border-transparent overflow-hidden  ${
                  forceSelectedChain ? "cursor-pointer" : "cursor-default"
                }
              ${
                forceSelectedChain
                  ? allCats
                    ? "bg-[#5A6462] "
                    : "bg-inherit hover:bg-forest-800/50"
                  : "bg-inherit"
              } `}
                onClick={() => {
                  if (forceSelectedChain) {
                    setAllCats(!allCats);
                  }
                }}
                onMouseEnter={() => {
                  hoverCategory("all_chain");
                }}
                onMouseLeave={() => {
                  unhoverCategory("all_chain");
                }}
              >
                {forceSelectedChain && "All"}
              </button>
            </div>
            <div className="flex flex-1">
              {master &&
                Object.keys(master.blockspace_categories.main_categories).map(
                  (category, i) => (
                    <div
                      key={category}
                      className={`relative flex h-full justify-center items-center 
                    ${category === "unlabeled" ? "flex-1" : "flex-1"}
                    ${
                      selectedCategory === category
                        ? "borden-hidden rounded-[0px]"
                        : "h-full"
                    }`}
                      onMouseEnter={() => {
                        hoverCategory(category);
                      }}
                      onMouseLeave={() => {
                        unhoverCategory(category);
                      }}
                      style={{
                        backgroundColor:
                          selectedCategory === category && !allCats
                            ? "#5A6462"
                            : `rgba(0, 0, 0, ${
                                0.06 +
                                (i / Object.keys(categories).length) * 0.94
                              })`,
                      }}
                    >
                      <button
                        key={category}
                        className={`flex flex-col w-full h-full justify-center items-center overflow-hidden border-l border-[
                    1px 
                  ] border-forest-50 dark:border-forest-800
                    ${
                      selectedCategory === category
                        ? "bg-forest-800/[0.025]"
                        : ""
                    } 
                    ${isCategoryHovered(category) ? "bg-forest-800/50" : ""}`}
                        onClick={() => {
                          if (forceSelectedChain) {
                            // if no data, return
                            if (
                              !data[forceSelectedChain].overview[
                                selectedTimespan
                              ][category]["data"]
                            ) {
                              return;
                            }
                            setSelectedCategory(category);
                            if (selectedCategory === category) {
                              if (allCats) {
                                setAllCats(false);
                              } else {
                                setAllCats(true);
                              }
                            } else {
                              setAllCats(false);
                            }
                          } else {
                            setSelectedCategory(category);
                            setSelectedChain(null);
                          }
                          // if (forceSelectedChain) setAllCats(false);
                          // if (!forceSelectedChain) setSelectedChain(null);
                        }}
                      >
                        <div
                          className={`${
                            selectedCategory === category
                              ? "text-sm font-semibold"
                              : "text-xs font-medium"
                          }`}
                        >
                          {categories[category]}
                        </div>
                      </button>
                    </div>
                  ),
                )}
            </div>
          </div>
        </div>
      </div>
      {/* <colorful rows> */}
      {/* {selectedScale === "gasfees" ? ( */}

      <div className="flex flex-col space-y-[10px] min-w-[880px] md:min-w-[910px] mb-8">
        {
          //chain name is key
          Object.keys(data)
            .filter((c) => c !== "all_l2s")
            .map((chainKey, index) => {
              return (
                <RowParent key={chainKey} chainKey={chainKey} index={index} />
              );
            })
            .concat(
              <div
                key="legend"
                className="relative pl-[155px] w-full flex justify-between h-[15px] -top-[10px] text-[10px]"
              >
                {[0, 20, 40, 60, 80, 100].map((x, i) => (
                  <div key={x} className="relative">
                    <div className="h-[15px] border-r border-forest-900 dark:border-forest-500"></div>
                    {x === 0 && (
                      <div className="text-forest-900 dark:text-forest-500 absolute top-[110%] left-0">
                        {x}%
                      </div>
                    )}
                    {x === 100 && (
                      <div className="text-forest-900 dark:text-forest-500 absolute top-[110%] right-0">
                        {x}%
                      </div>
                    )}
                    {x !== 0 && x !== 100 && (
                      <div className="text-forest-900 dark:text-forest-500 absolute w-8 top-[110%] -left-2">
                        {x}%
                      </div>
                    )}
                  </div>
                ))}
              </div>,
            )
        }
      </div>
    </HorizontalScrollContainer>
  );
}
