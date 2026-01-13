"use client";
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import Icon from "@/components/layout/Icon";
import useSWR from "swr";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { useSessionStorage } from "usehooks-ts";
import useDragScroll from "@/hooks/useDragScroll";
import { debounce, get } from "lodash";
import { useUIContext } from "@/contexts/UIContext";
import { useMaster } from "@/contexts/MasterContext";
import { useProjectsMetadata } from "../_contexts/ProjectsMetadataContext"; // Correctly added import
import { useApplicationsData } from "../_contexts/ApplicationsDataContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

// New props to support chain-scoped usage
type SearchProps = {
  hideChainSection?: boolean;
};

const getGTPCategoryIcon = (category: string): GTPIconName | "" => {
  switch (category) {
    case "Cross-Chain":
      return "gtp-crosschain";
    case "Utility":
      return "gtp-utilities";
    case "Token Transfers":
      return "gtp-tokentransfers";
    case "Finance":
      return "gtp-defi";
    case "Social":
      return "gtp-socials";
    case "Collectibles":
      return "gtp-nft";
    default:
      return "";
  }
}

export default function Search({ hideChainSection = false }: SearchProps) {
  const { AllChainsByKeys } = useMaster();
  const { availableMainCategories } = useProjectsMetadata(); // Added
  const isMobile = useUIContext((state) => state.isMobile);
  const { applicationDataAggregatedAndFiltered, applicationsChains } = useApplicationsData();
  
  // Get Next.js URL utilities
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  
  // Get search term from URL
  const searchFromParams = useMemo(() => 
    searchParams.get("q") || "",
    [searchParams]
  );
  
  // Get filters from URL parameters using useMemo to stabilize dependencies
  const chainsFromParams = useMemo(() => 
    searchParams.get("origin_key")?.split(",").filter(Boolean) || [],
    [searchParams]
  );
  
  const stringFiltersFromParams = useMemo(() =>
    searchParams.get("owner_project")?.split(",").filter(Boolean) || [],
    [searchParams]
  );

  const mainCategoryFromParams = useMemo(() =>{
    const categories = searchParams.get("main_category")?.split(",").filter(Boolean) || [];
    return categories;
  }, [searchParams]);
  
  // Local UI state
  const [isOpen, setIsOpen] = useState<boolean>(!!searchFromParams);
  const [internalSearch, setInternalSearch] = useState<string>(searchFromParams);
  const [search, setSearch] = useState<string>(searchFromParams);

  const inputRef = useRef<HTMLInputElement>(null);

  // Create a stable debounced function with useMemo
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => {
      setSearch(value);
    }, 300),
    []
  );

  // Clean up the debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  // Handle internal search state for immediate UI feedback
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInternalSearch(value); // Update internal state immediately for responsive UI
    debouncedSetSearch(value); // Debounced update for expensive operations
  };

  // Initialize and update search state
  useEffect(() => {
    if (searchFromParams) {
      setInternalSearch(searchFromParams);
      setSearch(searchFromParams);
      setIsOpen(true);
      handleFilter("string", internalSearch);
      setInternalSearch("");
      debouncedSetSearch("");
      
    }
  }, [searchFromParams]);

  // Focus input when search opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const { data: master } = useSWR<MasterResponse>(MasterURL);

  const applicationsNumberFiltered = useMemo(() => {
    return applicationDataAggregatedAndFiltered.length;
  }, [applicationDataAggregatedAndFiltered]);

  // Update URL params when filters change
  const updateURLParams = useCallback((filterType: 'origin_key' | 'owner_project' | 'main_category', newValues: string[]) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    if (newValues.length === 0) {
      newSearchParams.delete(filterType);
    } else {
      newSearchParams.set(filterType, newValues.join(','));
    }
    
    const url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;
    // router.replace(url, { scroll: false });
    window.history.replaceState(null, "", url);
  }, [pathname, searchParams]);

  // Handler for adding/removing filters
  const handleFilter = useCallback(
    (
      key: 'origin_key' | 'string' | 'main_category',
      value: string
    ) => {
      if (key === "origin_key") {
        if (hideChainSection) return; // prevent modifying origin_key when hidden/locked
        const newChains = chainsFromParams.includes(value)
          ? chainsFromParams.filter(chain => chain !== value)
          : [...chainsFromParams, value];
          
        updateURLParams('origin_key', newChains);
      }
      
      if (key === "string") {
        const newStringFilters = stringFiltersFromParams.includes(value)
          ? stringFiltersFromParams.filter(filter => filter !== value)
          : [...stringFiltersFromParams, value];
          
        updateURLParams('owner_project', newStringFilters);
      }

      if (key === "main_category") {
        const newMainCategories = mainCategoryFromParams.includes(value)
          ? mainCategoryFromParams.filter(category => category !== value)
          : [...mainCategoryFromParams, value];
        updateURLParams('main_category', newMainCategories);
      }

      setInternalSearch("");
      setSearch("");
    },
    [chainsFromParams, stringFiltersFromParams, mainCategoryFromParams, updateURLParams, hideChainSection]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (!hideChainSection) newSearchParams.delete('origin_key');
    newSearchParams.delete('owner_project');
    newSearchParams.delete('main_category');
    
    const url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;
    window.history.replaceState(null, "", url);
  }, [pathname, searchParams, hideChainSection]);

  const [applicationsAutocomplete, setApplicationsAutocomplete] = useSessionStorage<{
    address: string[];
    origin_key: string[];
    name: string[];
    owner_project: { owner_project: string; owner_project_clear: string }[];
    category: string[];
    subcategory: string[];
  }>("applicationsAutocomplete", {
    address: [],
    origin_key: [],
    name: [],
    owner_project: [],
    category: [],
    subcategory: [],
  });

  // Bold the search terms in the badges - memoized to avoid recalculations
  const boldSearch = useCallback((text: string) => {
    const searchLower = search.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(searchLower);
    if (index === -1) return text;
    return (
      <>
        {text.substring(0, index)}
        <span className="font-bold underline">
          {text.substring(index, index + search.length)}
        </span>
        {text.substring(index + search.length)}
      </>
    );
  }, [search]);

  const [applicationsOwnerProjects, setApplicationsOwnerProjects] = useSessionStorage<
    { owner_project: string; owner_project_clear: string }[]
  >("applicationsOwnerProjects", []);

  // Memoize filters to prevent recreating them on every render
  const Filters = useMemo(() => {
    if (!master) return [];

    const chainFilters = hideChainSection ? [] : chainsFromParams.map((chainKey) => (
      <Badge
        key={chainKey}
        onClick={(e) => { 
          e.stopPropagation(); // Stop event from bubbling up
          e.preventDefault(); // Prevent default behavior
          handleFilter("origin_key", chainKey);
        }}
        label={master.chains[chainKey].name}
        leftIcon={`gtp:${AllChainsByKeys[chainKey].urlKey}-logo-monochrome`}
        leftIconColor={AllChainsByKeys[chainKey].colors["dark"][0]}
        rightIcon="gtp:in-button-close-monochrome"
        rightIconColor="#FE5468"
        showLabel={true}
        altColoring={isOpen}
      />
    ));

    const stringFilters = stringFiltersFromParams.map((string) => (
      <Badge
        key={string}
        onClick={(e) => { 
          e.stopPropagation(); // Stop event from bubbling up
          e.preventDefault(); // Prevent default behavior
          handleFilter("string", string);
        }}
        label={<>&quot;{boldSearch(string)}&quot;</>}
        leftIcon="feather:search"
        leftIconColor="#CDD8D3"
        rightIcon="gtp:in-button-close-monochrome"
        rightIconColor="#FE5468"
        showLabel={true}
        altColoring={isOpen}
      />
    ));
    const mainCategoryFilters = mainCategoryFromParams.map((categoryKey) => {
      
      // get the display name for the category from availableMainCategories
      const displayName = availableMainCategories.find((category) => category.toLowerCase() === categoryKey.toLowerCase()) || categoryKey;

      return (
      <Badge
        key={categoryKey}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          // Pass the raw categoryKey (which should match the keys in availableMainCategories)
          // The handleFilter function and URL params should ideally use a consistent case (e.g., lowercase)
          handleFilter("main_category", categoryKey.toLowerCase());
        }}
        label={displayName} // Display the original casing
        leftIcon={`gtp:${getGTPCategoryIcon(displayName)}`}
        leftIconColor="#CDD8D3"
        rightIcon="gtp:in-button-close-monochrome"
        rightIconColor="#FE5468"
        showLabel={true}
        altColoring={isOpen}
      />
    )});


    return [
      ...chainFilters,
      ...stringFilters,
      ...mainCategoryFilters,
    ];
  }, [master, chainsFromParams, stringFiltersFromParams, mainCategoryFromParams, AllChainsByKeys, isOpen, handleFilter, boldSearch, availableMainCategories, hideChainSection]);

  // Update autocomplete with debounced search term
  useEffect(() => {
    if (!availableMainCategories || !master) { // Ensure essential data is present
        if (search.length === 0) {
            setApplicationsAutocomplete({ address: [], name: [], owner_project: [], category: [], subcategory: [], origin_key: [] });
        }
        return;
    }

    if (search.length === 0) {
      setApplicationsAutocomplete({
        address: [],
        name: [],
        owner_project: [],
        category: [],
        subcategory: [],
        origin_key: [],
      });
      return;
    }

    // Autocomplete for main categories using the derived list
    const categoryAutocomplete = availableMainCategories.filter((category) =>
      category.toLowerCase().includes(search.toLowerCase())
    );

    // Autocomplete for subcategories (assuming this still comes from master)
    const subcategoryAutocomplete = master.blockspace_categories?.sub_categories
      ? Object.keys(master.blockspace_categories.sub_categories).filter((subcategory) =>
          master.blockspace_categories.sub_categories[subcategory]
            .toLowerCase()
            .includes(search.toLowerCase())
        )
      : [];

    const chainAutocomplete = hideChainSection ? [] : applicationsChains.filter((chainKey) =>
      master.chains[chainKey]?.name.toLowerCase().includes(search.toLowerCase())
    );
    const ownerProjectAutocomplete = applicationsOwnerProjects.filter((row) =>
      row.owner_project.toLowerCase().includes(search.toLowerCase()),
    );

    setApplicationsAutocomplete({
      address: [],
      name: [],
      owner_project: ownerProjectAutocomplete,
      category: categoryAutocomplete,
      subcategory: subcategoryAutocomplete,
      origin_key: chainAutocomplete,
    });
  }, [applicationsChains, applicationsOwnerProjects, master, search, setApplicationsAutocomplete, availableMainCategories, hideChainSection]); // Added availableMainCategories

  return (
    <div className="relative w-full h-[44px]">
      <div
        className="hidden md:block fixed inset-0 bg-black/10 z-[15]"
        onMouseDown={() => setIsOpen(false)}
        style={{
          opacity: isOpen ? 0.5 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />
      <div
        className={`absolute -bottom-[0px] md:bottom-auto md:-top-[0px] ${isOpen ? "left-0 right-0" : "left-0 right-0"} transition-all duration-300 `}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center w-full min-h-[44px]">
          <div className="absolute flex items-center w-full bg-color-bg-default gap-x-[10px] rounded-[22px] pr-[10px] min-h-[44px] z-[17]" />
          <div className="absolute inset-0 z-[18] flex items-center w-full">
            <div className={`relative flex justify-center items-center pl-[10px]`}>
              {isOpen ? (
                <div className="flex items-center justify-center w-[24px] h-[24px]">
                  <Icon
                    icon="feather:chevron-down"
                    className="w-[16px] h-[16px]"
                  />
                </div>
              ) : <GTPIcon icon="gtp-search" size="md" />}
            </div>
            <input
              ref={inputRef}
              className={`${isOpen ? "flex-1" : Filters.length > 0 ? "w-[63px]" : "flex-1"} pl-[11px] h-full bg-transparent text-color-text-primary placeholder-color-text-primary border-none outline-none overflow-x-clip`}
              placeholder="Search & Filter"
              value={internalSearch}
              onChange={handleSearchChange}
              onKeyUp={(e) => {
                // if enter is pressed, add the search term to the address filters
                if (e.key === "Enter" && internalSearch.length > 0) {
                  handleFilter("string", internalSearch);
                  setInternalSearch("");
                  debouncedSetSearch("");
                  e.preventDefault();
                }
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setIsOpen(false)}
            />

            <div className={`flex items-center justify-between pr-[10px] gap-x-[10px] ${isOpen ? "" : "w-[calc(100%-63px-34px)]"}`}>
              {(!isOpen && Filters.length > 0) ? (
                <>
                  <div className="pl-[10px]">
                    <div className="w-[6px] h-[6px] bg-color-bg-medium rounded-full" />
                  </div>
                  <FilterSelectionContainer className="w-full">
                    {Filters}
                  </FilterSelectionContainer>
                </>
              ) : <div />}
              <div className={`${isOpen ? "flex" : "hidden md:flex"} justify-end items-center gap-x-[10px] shrink-0 overflow-clip whitespace-nowrap transition-all duration-300`}>
                {Filters.length > 0 && (
                  <div className={`flex items-center px-[15px] h-[24px] border border-[#CDD8D3] rounded-full`}>
                    <div className="text-[8px] text-color-text-primary font-medium">
                      {applicationsNumberFiltered.toLocaleString("en-GB")} applications
                    </div>
                  </div>
                )}
                {Filters.length > 0 && (
                  <div
                    className="flex flex-1 items-center justify-center cursor-pointer w-[27px] h-[26px]"
                    onClick={(e) => {
                      clearAllFilters()
                      e.stopPropagation();
                    }}
                  >
                    <svg width="27" height="26" viewBox="0 0 27 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="1" width="25" height="24" rx="12" stroke="url(#paint0_linear_8794_34411)" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M17.7435 17.2426C18.8688 16.1174 19.5009 14.5913 19.5009 13C19.5009 11.4087 18.8688 9.88258 17.7435 8.75736C16.6183 7.63214 15.0922 7 13.5009 7C11.9096 7 10.3835 7.63214 9.25827 8.75736C8.13305 9.88258 7.50091 11.4087 7.50091 13C7.50091 14.5913 8.13305 16.1174 9.25827 17.2426C10.3835 18.3679 11.9096 19 13.5009 19C15.0922 19 16.6183 18.3679 17.7435 17.2426V17.2426ZM12.4402 10.8787C12.2996 10.738 12.1088 10.659 11.9099 10.659C11.711 10.659 11.5202 10.738 11.3796 10.8787C11.2389 11.0193 11.1599 11.2101 11.1599 11.409C11.1599 11.6079 11.2389 11.7987 11.3796 11.9393L12.4402 13L11.3796 14.0607C11.2389 14.2013 11.1599 14.3921 11.1599 14.591C11.1599 14.7899 11.2389 14.9807 11.3796 15.1213C11.5202 15.262 11.711 15.341 11.9099 15.341C12.1088 15.341 12.2996 15.262 12.4402 15.1213L13.5009 14.0607L14.5616 15.1213C14.7022 15.262 14.893 15.341 15.0919 15.341C15.2908 15.341 15.4816 15.262 15.6222 15.1213C15.7629 14.9807 15.8419 14.7899 15.8419 14.591C15.8419 14.3921 15.7629 14.2013 15.6222 14.0607L14.5616 13L15.6222 11.9393C15.7629 11.7987 15.8419 11.6079 15.8419 11.409C15.8419 11.2101 15.7629 11.0193 15.6222 10.8787C15.4816 10.738 15.2908 10.659 15.0919 10.659C14.893 10.659 14.7022 10.738 14.5616 10.8787L13.5009 11.9393L12.4402 10.8787Z" fill="#CDD8D3" />
                      <defs>
                        <linearGradient id="paint0_linear_8794_34411" x1="13.5" y1="1" x2="29.4518" y2="24.361" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FE5468" />
                          <stop offset="1" stopColor="#FFDF27" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Only render dropdown content when open */}
          {/* {isOpen && ( */}
            <div
              className={`${isOpen ? "max-h-[400px] shadow-standard" : "max-h-0 shadow-none"} pt-[10px] md:pt-0 md:pb-[10px] gap-y-[15px] md:gap-y-[10px] transition-[max-height] z-[16] absolute flex flex-col-reverse md:flex-col rounded-t-[22px] md:rounded-t-none md:rounded-b-[22px] bg-color-ui-active left-0 right-0 bottom-[calc(100%-22px)] md:bottom-auto md:top-[calc(100%-22px)] duration-300  overflow-hidden overflow-y-auto lg:overflow-y-hidden scrollbar-thin scrollbar-thumb-forest-700 scrollbar-track-transparent`}
            >
              <div className={`select-none flex flex-col-reverse md:flex-col pl-[12px] pr-[25px] pb-[25px] pt-[5px] md:pb-[5px] md:pt-[25px] gap-y-[10px] text-[10px] bg-color-bg-medium z-[1] ${Filters.length > 0 ? "max-h-[100px]" : "max-h-[20px] opacity-0 !p-0"} transition-all duration-300 overflow-clip`}>
                <div className="flex flex-col md:flex-row h-[50px] md:h-[30px] gap-x-[10px] gap-y-[10px] items-start md:items-center z-[50]">
                  <div className="flex gap-x-[10px] items-center">
                    <div className="w-[15px] h-[15px]">
                      <Icon
                        icon="feather:check"
                        className="w-[15px] h-[15px]"
                      />
                    </div>
                    <div className="text-white leading-[150%] whitespace-nowrap">Active Filter(s)</div>
                  </div>
                  <FilterSelectionContainer className="w-full">
                    {Filters}
                  </FilterSelectionContainer>
                </div>
              </div>
              <div className="flex flex-col-reverse md:flex-col pl-[12px] pr-[25px] gap-y-[10px] text-[10px]">
                {!hideChainSection && (
                <div className="flex flex-col md:flex-row gap-x-[10px] gap-y-[10px] items-start md:items-center">
                  <div className="flex gap-x-[10px] items-center">
                    <div className="w-[15px] h-[15px]">
                      <GTPIcon
                        icon="gtp-chain-alt"
                        size="sm"
                        className="text-color-text-primary"
                      />
                    </div>
                    <div className="text-color-text-primary leading-[150%]">Chain</div>
                    <div className="w-[6px] h-[6px] bg-color-bg-medium rounded-full" />
                  </div>
                  {master && (
                    <FilterSelectionContainer className="w-full md:flex-1">
                      {applicationsChains
                        .filter(
                          (chainKey) =>
                            !chainsFromParams.includes(chainKey)
                        )
                        .sort((a, b) =>
                          master.chains[a].name.localeCompare(
                            master.chains[b].name,
                          ),
                        )
                        .map((chainKey) => (
                          <Badge
                            key={chainKey}
                            onClick={(e) => {
                              e.stopPropagation(); // Stop event from bubbling up
                              e.preventDefault(); // Prevent default behavior
                              handleFilter("origin_key", chainKey);
                            }}
                            label={
                              applicationsAutocomplete.origin_key.length > 0
                                ? boldSearch(master.chains[chainKey].name)
                                : master.chains[chainKey].name
                            }
                            leftIcon={`gtp:${AllChainsByKeys[chainKey].urlKey}-logo-monochrome`}
                            leftIconColor={
                              AllChainsByKeys[chainKey].colors["dark"][0]
                            }
                            rightIcon="gtp:in-button-plus-monochrome"
                            className={`z-[100]${search.length > 0
                              ? applicationsAutocomplete.origin_key.includes(chainKey)
                                ? "opacity-100"
                                : "opacity-30"
                              : "opacity-100"
                              } transition-all`}
                          />
                        ))}
                    </FilterSelectionContainer>
                  )}
                </div>
                )}
              </div>
              {/* Main Category Filter Section */}
              <div className="flex flex-col-reverse md:flex-col pl-[12px] pr-[25px] gap-y-[10px] text-[10px]">
                <div className="flex flex-col md:flex-row gap-x-[10px] gap-y-[10px] items-start md:items-center">
                  <div className="flex gap-x-[10px] items-center">
                    <div className="w-[15px] h-[15px]">
                      <GTPIcon
                        icon="gtp-categories-monochrome"
                        size="sm"
                        className="text-color-text-primary"
                      />
                    </div>
                    <div className="text-color-text-primary leading-[150%]">Main Category</div>
                    <div className="w-[6px] h-[6px] bg-color-bg-medium rounded-full" />
                  </div>
                  {master && availableMainCategories && availableMainCategories.length > 0 && (
                    <FilterSelectionContainer className="w-full md:flex-1">
                      {availableMainCategories
                        .filter(
                          (categoryKey) => // categoryKey here is from availableMainCategories (e.g., "DeFi")
                            !mainCategoryFromParams.includes(categoryKey.toLowerCase()) // mainCategoryFromParams are lowercase
                        )
                        .map((categoryKey) => { // categoryKey is e.g. "DeFi"
                          const displayName = categoryKey; // Use the category key itself (it's already cased for display)
                          return (
                            <Badge
                              key={categoryKey}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleFilter("main_category", categoryKey.toLowerCase()); // Pass lowercase value to filter
                              }}
                              label={
                                applicationsAutocomplete.category.includes(categoryKey) // Check against original casing for bolding
                                  ? boldSearch(displayName)
                                  : displayName
                              }
                              leftIcon={`gtp:${getGTPCategoryIcon(categoryKey)}`} // Use the GTP icon or fallback to a generic tag icon
                              rightIcon="gtp:in-button-plus-monochrome"
                              className={`z-[100]${search.length > 0 && applicationsAutocomplete.category.length > 0
                                ? applicationsAutocomplete.category.includes(categoryKey)
                                  ? "opacity-100" // Matched by autocomplete
                                  : "opacity-30" // Not matched by autocomplete
                                : "opacity-100" // No search or no autocomplete results, show all
                                } transition-all`}
                            />
                          );
                        })}
                    </FilterSelectionContainer>
                  )}
                </div>
              </div>
            </div>
          {/* )} */}
        </div>
      </div>
    </div>
  );
}

// These components remain the same
type BadgeProps = {
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  label: string | React.ReactNode;
  leftIcon?: string;
  leftIconColor?: string;
  rightIcon?: string;
  rightIconColor?: string;
  rightIconSize?: "sm" | "base";
  size?: "sm" | "base";
  className?: string;
  showLabel?: boolean;
  altColoring?: boolean;
};

export const Badge = memo(({
  onClick,
  label,
  leftIcon,
  leftIconColor = "#CDD8D3",
  rightIcon,
  rightIconColor = "#5A6462",
  rightIconSize = "base",
  size = "base",
  className,
  showLabel = true,
  altColoring = false,
}: BadgeProps) => {
  // This ensures the click handler takes precedence over any parent handlers
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Stop event from bubbling to parent elements
    e.preventDefault(); // Prevent any default behaviors
    onClick(e); // Call the provided onClick handler
  };

  if (size === "sm")
    return (
      <div
        className={`flex items-center ${altColoring ? "bg-color-bg-default" : "bg-color-bg-medium"} text-[10px] rounded-full pl-[5px] pr-[2px] py-[3px] gap-x-[4px] cursor-pointer max-w-full ${className}`}
        onClick={handleClick}
      >
        {leftIcon ? (
          <div className="flex items-center justify-center w-[12px] h-[12px]">
            <Icon
              icon={leftIcon}
              className="text-color-text-primary w-[10px] h-[10px]"
              style={{
                color: leftIconColor,
              }}
            />
          </div>
        ) : (
          <div className="w-[0px] h-[12px]" />
        )}
        <div className="text-color-text-primary leading-[120%] text-[10px] truncate">
          {label}
        </div>
        {rightIcon && (
        <div
          className={`flex items-center justify-center ${rightIconSize == "sm" ? "pr-[3px]" : "w-[14px] h-[14px]"
            }`}
        >
            <Icon
              icon={rightIcon}
              className={
                rightIconSize == "sm" ? "w-[10px] h-[10px]" : "w-[14px] h-[14px]"
              }
              style={{ color: rightIconColor }}
            />
          </div>
        )}
      </div>
    );

  return (
    <div
      className={`flex items-center ${altColoring ? "bg-color-bg-default" : "bg-color-bg-medium"} text-[10px] rounded-full pl-[2px] pr-[5px] gap-x-[5px] cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {leftIcon ? (
        <div className="flex items-center justify-center w-[25px] h-[25px]">
          <Icon
            icon={leftIcon}
            className="text-color-text-primary w-[15px] h-[15px]"
            style={{
              color: leftIconColor,
            }}
          />
        </div>
      ) : (
        <div className="w-[3px] h-[25px]" />
      )}
      {showLabel && (
        <div className="text-color-text-primary leading-[150%] pr-0.5 truncate">
          {label}
        </div>
      )}
      {rightIcon && (
        <div className="flex items-center justify-center w-[15px] h-[15px]">
          <Icon
            icon={rightIcon}
            className="w-[15px] h-[15px]"
            style={{ color: rightIconColor }}
          />
        </div>
      )}
    </div>
  );
});

Badge.displayName = 'Badge';

type IconProps = {
  icon: string;
  className?: string;
  onClick?: () => void;
};
export const AddIcon = ({ className, onClick }: IconProps) => (
  <div
    className={`w-[15px] h-[15px] ${className} ${onClick && "cursor-pointer"}`}
    onClick={onClick}
  >
    <Icon
      icon="gtp:in-button-plus-monochrome"
      className="w-[15px] h-[15px]"
      style={{ color: "rgb(var(--ui-hover))" }}
    />
  </div>
);

export const RemoveIcon = ({ className, onClick }: IconProps) => (
  <div
    className={`w-[15px] h-[15px] ${className} ${onClick && "cursor-pointer"}`}
    onClick={onClick}
  >
    <Icon
      icon="gtp:in-button-close-monochrome"
      className="w-[15px] h-[15px]"
      style={{ color: "rgb(var(--accent-red))" }}
    />
  </div>
);

type NestedSelectionProps = {
  parent: React.ReactNode;
  children: React.ReactNode;
};
const NestedSelection = ({ parent, children }: NestedSelectionProps) => (
  <div className="flex">
    <div
      className={`flex items-center justify-start gap-x-[0px] bg-gray-500/5 rounded-[15px] justify-items-start justify-self-start overflow-hidden`}
    >
      <div className="p-1 rounded-l-[15px]">{parent}</div>
      <FilterSelectionContainer className="px-1">
        {children}
      </FilterSelectionContainer>
    </div>
  </div>
);

type FilterSelectionContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export const FilterSelectionContainer = memo(({
  children,
  className,
}: FilterSelectionContainerProps) => (
  <DraggableContainer
    className={`flex gap-x-[10px] items-center justify-start h-full ${className} overflow-x-hidden`}
    direction="horizontal"
  >
    {children}
  </DraggableContainer>
));

FilterSelectionContainer.displayName = 'FilterSelectionContainer';

type DraggableContainerProps = {
  children: React.ReactNode;
  className?: string;
  direction?: "horizontal" | "vertical";
};

export const DraggableContainer = memo(({
  children,
  className,
  direction = "horizontal",
}: DraggableContainerProps) => {
  const { containerRef, showLeftGradient, showRightGradient } =
    useDragScroll(direction);

  const [maskGradient, setMaskGradient] = useState<string>("");
  
  // Add a resize observer to monitor content changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Function to check for overflow and update gradients
    const checkOverflow = () => {
      if (!container) return;
      
      const hasHorizontalOverflow = container.scrollWidth > container.clientWidth;
      const hasScrolledRight = container.scrollLeft > 0;
      const hasMoreToScroll = container.scrollLeft < (container.scrollWidth - container.clientWidth - 1); // -1 for rounding errors
      
      // Force update gradients based on actual scroll position and content width
      if (direction === 'horizontal') {
        if (hasHorizontalOverflow) {
          if (hasScrolledRight && hasMoreToScroll) {
            setMaskGradient(
              "linear-gradient(to right, transparent, black 50px, black calc(100% - 50px), transparent)"
            );
          } else if (hasScrolledRight) {
            setMaskGradient(
              "linear-gradient(to right, transparent, black 50px, black)"
            );
          } else if (hasMoreToScroll) {
            setMaskGradient(
              "linear-gradient(to left, transparent, black 50px, black)"
            );
          }
        } else {
          setMaskGradient("");
        }
      }
    };
    
    // Create a resize observer to detect when content changes size
    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });
    
    // Observe both the container and its children
    resizeObserver.observe(container);
    Array.from(container.children).forEach(child => {
      resizeObserver.observe(child);
    });
    
    // Also check on scroll events
    const handleScroll = () => checkOverflow();
    container.addEventListener('scroll', handleScroll);
    
    // Initial check
    checkOverflow();
    
    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, direction]);
  
  // Also update when children prop changes
  useEffect(() => {
    // Check for overflow after children update
    const container = containerRef.current;
    if (!container) return;
    
    // Use requestAnimationFrame to ensure DOM has updated
    const rafId = requestAnimationFrame(() => {
      if (container) {
        const hasHorizontalOverflow = container.scrollWidth > container.clientWidth;
        const hasScrolledRight = container.scrollLeft > 0;
        const hasMoreToScroll = container.scrollLeft < (container.scrollWidth - container.clientWidth - 1);
        
        if (direction === 'horizontal') {
          if (hasHorizontalOverflow) {
            if (hasScrolledRight && hasMoreToScroll) {
              setMaskGradient(
                "linear-gradient(to right, transparent, black 50px, black calc(100% - 50px), transparent)"
              );
            } else if (hasScrolledRight) {
              setMaskGradient(
                "linear-gradient(to right, transparent, black 50px, black)"
              );
            } else if (hasMoreToScroll) {
              setMaskGradient(
                "linear-gradient(to left, transparent, black 50px, black)"
              );
            } else {
              setMaskGradient("");
            }
          } else {
            setMaskGradient("");
          }
        }
      }
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [children, containerRef, direction]);

  return (
    <div
      ref={containerRef}
      className={`flex gap-x-[10px] items-center overflow-x-auto scrollbar-hide h-full ${className}`}
      style={{
        maskClip: "padding-box",
        WebkitMaskClip: "padding-box",
        WebkitMaskImage: maskGradient,
        maskImage: maskGradient,
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        transition: "all 0.3s",
      }}
    >
      {children}
    </div>
  );
});

DraggableContainer.displayName = 'DraggableContainer';