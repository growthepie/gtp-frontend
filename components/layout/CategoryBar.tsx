import Container from "./Container";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { Icon } from "@iconify/react";
import { CategoryComparisonResponseData } from "@/types/api/CategoryComparisonResponse";
import { MasterResponse } from "@/types/api/MasterResponse";

const CategoryBar = ({
  data,
  master,
  categories,
  querySubcategories,
  selectedCategory,
  setSelectedCategory,
  checkSubcategory,
  formatSubcategories,
  checkAllSelected,
  handleSelectAllSubcategories,
  handleToggleSubcategory,
}: {
  data: CategoryComparisonResponseData;
  master: MasterResponse | undefined;
  categories: any;
  querySubcategories: Object | undefined;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  checkSubcategory: (category: string, subcategory: string) => boolean;
  formatSubcategories: (str: string) => string;
  checkAllSelected: (category: string) => boolean;
  handleSelectAllSubcategories: (category: string) => void;
  handleToggleSubcategory: (category: string, subcategory: string) => void;
}) => {
  const [openSub, setOpenSub] = useState(querySubcategories ? true : false);

  const [isCategoryHovered, setIsCategoryHovered] = useState<{
    [key: string]: boolean;
  }>(() => {
    if (master) {
      const initialIsCategoryHovered: { [key: string]: boolean } = {};
      Object.keys(master.blockspace_categories.main_categories).forEach(
        (key) => {
          if (key !== "cross_chain") {
            initialIsCategoryHovered[key] = false;
          }
        },
      );
      return initialIsCategoryHovered;
    }

    return {
      native_transfers: false,
      token_transfers: false,
      nft_fi: false,
      defi: false,
      cefi: false,
      utility: false,
      scaling: false,
      gaming: false,
    };
  });
  return (
    // <Container>
    <div
      className={`border-forest-400 dark:border-forest-800 flex border-[0.5px] mx-[2px] mt-[30px] rounded-2xl transition-all min-w-[950px] duration-[700ms] ease-in-out overflow-hidden bg-color-ui-active ${openSub ? "h-[170px]" : "h-[65px]"
        }`}
    >
      {Object.keys(categories).map((category, i) =>
        categories[category] !== "Categories" ? (
          <div
            key={category}
            className={`w-full relative hover:cursor-pointer overflow-hidden items-center transition-transform  duration-[700ms]  justify-between flex flex-col border-forest-50 border-dotted border-l-[1px] pt-2 pb-0.5 text-[12px] font-semibold ${selectedCategory === category
              ? "bg-color-ui-hover"
              : "hover:bg-forest-500 dark:hover:bg-white/5"
              } `}
            onClick={() => {
              if (selectedCategory === category) {
                setOpenSub(!openSub);
              }

              setSelectedCategory(category);
            }}
            onMouseEnter={() => {
              setIsCategoryHovered((prev) => ({
                ...prev,
                [category]: true,
              }));
            }}
            onMouseLeave={() => {
              setIsCategoryHovered((prev) => ({
                ...prev,
                [category]: false,
              }));
            }}
            style={{
              transition: "min-width .7s",

              minWidth:
                selectedCategory === category && openSub
                  ? Object.keys(data[category].subcategories.list).length > 7
                    ? "650px"
                    : "500px"
                  : selectedCategory === category &&
                    categories[category] === "Token Transfers"
                    ? "125px"
                    : "10px",

              borderLeft: "0.5px dotted var(--dark-active-text, #CDD8D3)",
              background:
                selectedCategory === category
                  ? "#5A6462"
                  : isCategoryHovered[category]
                    ? "#FFFFFF0D"
                    : `linear-gradient(
                    90deg,
                    rgba(16, 20, 19, ${0.3 - (i / (Object.keys(categories).length - 1)) * 0.2
                    }) 0%,
                    #101413 15.10%,
                    rgba(16, 20, 19, ${0.06 + (i / Object.keys(categories).length) * 0.94
                    }) 48.96%,
                    #101413 86.98%,
                    rgba(16, 20, 19, ${0.3 - (i / (Object.keys(categories).length - 1)) * 0.2
                    }) 100%
                  )`,
            }}
          >
            <div
              className={`flex items-center p-[5px] h-[30px] overflow-hidden min-w-[145px] justify-center  ${selectedCategory === category
                ? openSub
                  ? "text-base font-bold"
                  : "text-sm font-semibold"
                : openSub
                  ? "text-sm font-semibold "
                  : "text-xs font-medium"
                }`}
            >
              <h1 className="text-[14px]">{categories[category]}</h1>
            </div>
            <div
              className={`z-10  basis-0 absolute top-[40px] min-h-[90px] content-center leading-tight  ${selectedCategory === category && openSub
                ? "flex flex-wrap items-center justify-center gap-y-[5px] gap-x-[5px]"
                : "hidden"
                } ${category === "utility" ? "min-w-[640px]" : "min-w-[490px]"
                }`}
            >
              {category !== "unlabeled" && category !== "native_transfers" ? (
                <div
                  key={categories[category]}
                  className={`flex border-forest-500 rounded-[15px] border-[1.5px] p-[5px] justify-between items-center max-h-[35px] min-w-[90px] hover:bg-white/5 z-10    ${checkAllSelected(category) ? "opacity-100" : "opacity-30"
                    }`}
                  onClick={(e) => {
                    handleSelectAllSubcategories(category);
                    e.stopPropagation();
                  }}
                >
                  <div className="mr-2 text-[10px]">
                    Select All Subcategories
                  </div>
                  <div className="rounded-full flex items-center justify-center bg-forest-900 w-[15px] h-[15px]">
                    <Icon
                      icon="feather:check-circle"
                      className={`w-[13px] h-[13px] ${checkAllSelected(category)
                        ? "opacity-100"
                        : "opacity-0"
                        }`}
                    />
                  </div>
                </div>
              ) : null}
              {category !== "unlabeled" && category !== "native_transfers" ? (
                data[category].subcategories.list.map((subcategory) => (
                  <button
                    key={subcategory}
                    className={`flex border-forest-500 rounded-[15px] border-[1.5px] p-[5px] justify-between items-center max-h-[35px] min-w-[90px] hover:bg-white/5 z-10 ${checkSubcategory(category, subcategory)
                      ? "opacity-100"
                      : "opacity-30"
                      }`}
                    onClick={(e) => {
                      handleToggleSubcategory(category, subcategory);
                      e.stopPropagation();
                    }}
                  >
                    <div className="mr-2 text-[10px]">
                      {formatSubcategories(subcategory)}
                    </div>
                    <div className="rounded-full flex items-center justify-center bg-forest-900 w-[15px] h-[15px]">
                      <Icon
                        icon="feather:check-circle"
                        className={`w-[13px] h-[13px]  ${checkSubcategory(category, subcategory)
                          ? "opacity-100"
                          : "opacity-0"
                          }  `}
                      />
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex items-center gap-x-1 ">
                  <Icon icon="feather:info" className="w-6 h-6" />
                  <h1>
                    {" "}
                    There are currently no subcategories for the given
                    category.{" "}
                  </h1>
                </div>
              )}
            </div>
            <div
              key={i}
              className={`relative transition-transform duration-100 flex min-w-[24px] min-h-[24px] items-center mb-2.5 top-[8px] h-[24px] w-full ${openSub ? "rotate-180 " : "rotate-0"
                }`}
              onClick={() => {
                setOpenSub(!openSub);
              }}
            >
              <Icon icon="icon-park-outline:down" className="w-full h-full" />
            </div>
          </div>
        ) : (
          <div
            key={category}
            className={
              "relative flex flex-col min-w-[140px] w-full h-full justify-start mt-2 ml-0.5 pl-[18px] dark:text-white bg-white dark:bg-inherit"
            }
          >
            <div className="text-sm font-bold pb-[10px]">
              {categories[category]}
            </div>
            <div className="text-xs font-medium">Subcategories</div>
          </div>
        ),
      )}
    </div>
    // </Container>
  );
};

export default CategoryBar;
