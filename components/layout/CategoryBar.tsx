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
  querySubcategories: string[] | undefined;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  checkSubcategory: (category: string, subcategory: string) => boolean;
  formatSubcategories: (str: string) => string;
  checkAllSelected: (category: string) => boolean;
  handleSelectAllSubcategories: (category: string) => void;
  handleToggleSubcategory: (category: string, subcategory: string) => void;
}) => {
  const hasQuerySubcategories = Boolean(querySubcategories?.length);
  const [openSub, setOpenSub] = useState(hasQuerySubcategories);

  useEffect(() => {
    setOpenSub(hasQuerySubcategories);
  }, [hasQuerySubcategories]);

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
      collectibles: false,
      finance: false,
      utility: false,
      scaling: false,
      gaming: false,
    };
  });
  return (
    // <Container>
    <div
      className={`border-color-text-primary flex border-[0.5px] mx-[2px] mt-[30px] rounded-2xl transition-all min-w-[950px] duration-[700ms] ease-in-out overflow-hidden bg-color-ui-active ${openSub ? "h-[170px]" : "h-[65px]"
        }`}
    >
      {Object.keys(categories).map((category, i) =>
        categories[category] !== "Categories" ? (
          <div
            key={category}
            className={`w-full relative hover:cursor-pointer overflow-hidden items-center transition-transform  duration-[700ms]  justify-between flex flex-col border-forest-50 border-dotted border-l-[1px] pt-2 pb-0.5 text-[12px] font-semibold ${selectedCategory === category
              ? "bg-color-bg-default"
              : "bg-color-ui-default hover:bg-color-ui-hover"
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

              borderLeft: "0.5px dotted rgb(var(--text-primary))",
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
                  <div className="rounded-full flex items-center justify-center bg-color-ui-active w-[15px] h-[15px]">
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
                    className={`flex border-color-ui-hover rounded-[15px] border-[1.5px] p-[5px] justify-between items-center max-h-[35px] min-w-[90px] hover:bg-color-ui-hover z-10 ${checkSubcategory(category, subcategory)
                      ? "text-color-text-primary"
                      : "text-color-text-secondary"
                      }`}
                    onClick={(e) => {
                      handleToggleSubcategory(category, subcategory);
                      e.stopPropagation();
                    }}
                  >
                    <div className="mr-2 text-[10px]">
                      {formatSubcategories(subcategory)}
                    </div>
                    <div className="rounded-full flex items-center justify-center bg-color-ui-active w-[15px] h-[15px]">
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
              "relative flex flex-col min-w-[140px] w-full h-full justify-start pt-2 pl-[20px] bg-color-ui-default text-color-text-primary"
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
