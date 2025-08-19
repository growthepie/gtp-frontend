"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { debounce } from "lodash";
import { useApplicationsData } from "@/app/(layout)/applications/_contexts/ApplicationsDataContext";
import { useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { useMaster } from "@/contexts/MasterContext";
import { useUIContext } from "@/contexts/UIContext";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Icon from "@/components/layout/Icon";
import { ChainInfo } from "@/types/api/MasterResponse";
import Container from "@/components/layout/Container";
import { Badge } from "@/components/layout/FloatingBar/Badge";
import { FilterSelectionContainer } from "@/components/layout/FloatingBar/FilterSelectionContainer";

interface ChainSearchProps {
  chainInfo: ChainInfo;
  chainKey: string;
}

export default function ChainSearch({ chainInfo, chainKey }: ChainSearchProps) {
  const { availableMainCategories } = useProjectsMetadata();
  const { isMobile } = useUIContext();
  const { applicationDataAggregatedAndFiltered, setSelectedStringFilters, selectedStringFilters } = useApplicationsData();
  
  // Local state only - no URL updates
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [internalSearch, setInternalSearch] = useState<string>("");
  const [search, setSearch] = useState<string>("");

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

  // Focus input when search opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const applicationsNumberFiltered = useMemo(() => {
    return applicationDataAggregatedAndFiltered.length;
  }, [applicationDataAggregatedAndFiltered]);

  // Handler for adding/removing string filters (no URL updates)
  const handleFilter = useCallback(
    (value: string) => {
      const newStringFilters = selectedStringFilters.includes(value)
        ? selectedStringFilters.filter(filter => filter !== value)
        : [...selectedStringFilters, value];
        
      setSelectedStringFilters(newStringFilters);
      setInternalSearch("");
      setSearch("");
    },
    [selectedStringFilters, setSelectedStringFilters]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedStringFilters([]);
    setInternalSearch("");
    setSearch("");
  }, [setSelectedStringFilters]);

  const applicationsOwnerProjects = useMemo(() => {
    return applicationDataAggregatedAndFiltered.map((row) => ({
      owner_project: row.owner_project,
      owner_project_clear: row.owner_project,
    }));
  }, [applicationDataAggregatedAndFiltered]);

  // For autocomplete - filter applications by chain and search term
  const [applicationsAutocomplete, setApplicationsAutocomplete] = useState<{
    address: any[];
    name: any[];
    owner_project: { owner_project: string; owner_project_clear: string }[];
    category: string[];
    subcategory: string[];
    origin_key: string[];
  }>({
    address: [],
    name: [],
    owner_project: [],
    category: [],
    subcategory: [],
    origin_key: [],
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

  // Update autocomplete with debounced search term
  useEffect(() => {
    if (!availableMainCategories) {
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

    // Only show owner_project autocomplete for chain-specific search
    const ownerProjectAutocomplete = applicationsOwnerProjects.filter((row) =>
      row.owner_project.toLowerCase().includes(search.toLowerCase()),
    );

    setApplicationsAutocomplete({
      address: [],
      name: [],
      owner_project: ownerProjectAutocomplete,
      category: [],
      subcategory: [],
      origin_key: [],
    });
  }, [applicationsOwnerProjects, search, setApplicationsAutocomplete, availableMainCategories]);

  // Memoize filters to prevent recreating them on every render
  const Filters = useMemo(() => {
    const stringFilters = selectedStringFilters.map((string) => (
      <Badge
        key={string}
        onClick={(e) => { 
          e.stopPropagation(); // Stop event from bubbling up
          e.preventDefault(); // Prevent default behavior
          handleFilter(string);
        }}
        label={<>&quot;{boldSearch(string)}&quot;</>}
        leftIcon="feather:search"
        leftIconColor="#CDD8D3"
        rightIcon="heroicons-solid:x-circle"
        rightIconColor="#FE5468"
        showLabel={true}
        altColoring={isOpen}
      />
    ));

    return stringFilters;
  }, [selectedStringFilters, isOpen, handleFilter, boldSearch]);

  return (
    <div className="sticky top-0 z-[10] flex flex-col w-full pt-[0px] gap-y-[15px] overflow-visible">
      <div className="flex flex-col gap-y-[10px]">
        <div className="heading-large">Apps on {chainInfo?.name}</div>
        <div className="text-xs">
          Applications deployed on {chainInfo?.name}. Search to filter by project name.
        </div>
      </div>
      
      {/* Search Bar - Matching original design */}
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
            <div className="absolute flex items-center w-full bg-[#1F2726] gap-x-[10px] rounded-[22px] pr-[10px] min-h-[44px] z-[17]" />
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
                className={`${isOpen ? "flex-1" : Filters.length > 0 ? "w-[63px]" : "flex-1"} pl-[11px] h-full bg-transparent text-white placeholder-[#CDD8D3] border-none outline-none overflow-x-clip`}
                placeholder="Search & Filter"
                value={internalSearch}
                onChange={handleSearchChange}
                onKeyUp={(e) => {
                  // if enter is pressed, add the search term to the address filters
                  if (e.key === "Enter" && internalSearch.length > 0) {
                    handleFilter(internalSearch);
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
                      <div className="w-[6px] h-[6px] bg-[#344240] rounded-full" />
                    </div>
                    <FilterSelectionContainer className="w-full">
                      {Filters}
                    </FilterSelectionContainer>
                  </>
                ) : <div />}
                <div className={`${isOpen ? "flex" : "hidden md:flex"} justify-end items-center gap-x-[10px] shrink-0 overflow-clip whitespace-nowrap transition-all duration-300`}>
                  {Filters.length > 0 && (
                    <div className={`flex items-center px-[15px] h-[24px] border border-[#CDD8D3] rounded-full`}>
                      <div className="text-[8px] text-[#CDD8D3] font-medium">
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
            {/* Dropdown Content */}
            <div
              className={`${isOpen ? "max-h-[400px]" : "max-h-0"} pt-[10px] md:pt-0 md:pb-[10px] gap-y-[15px] md:gap-y-[10px] transition-[max-height] z-[16] absolute flex flex-col-reverse md:flex-col rounded-t-[22px] md:rounded-t-none md:rounded-b-[22px] bg-[#151A19] left-0 right-0 bottom-[calc(100%-22px)] md:bottom-auto md:top-[calc(100%-22px)] shadow-[0px_0px_50px_0px_#000000] duration-300  overflow-hidden overflow-y-auto lg:overflow-y-hidden scrollbar-thin scrollbar-thumb-forest-700 scrollbar-track-transparent`}
            >
              <div className={`select-none flex flex-col-reverse md:flex-col pl-[12px] pr-[25px] pb-[25px] pt-[5px] md:pb-[5px] md:pt-[25px] gap-y-[10px] text-[10px] bg-[#344240] z-[1] ${Filters.length > 0 ? "max-h-[100px]" : "max-h-[20px] opacity-0 !p-0"} transition-all duration-300 overflow-clip`}>
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
                <div className="flex flex-col md:flex-row gap-x-[10px] gap-y-[10px] items-start md:items-center">
                  <div className="flex gap-x-[10px] items-center">
                    <div className="w-[15px] h-[15px]">
                      <GTPIcon
                        icon="gtp-project-monochrome"
                        size="sm"
                        className="text-white"
                      />
                    </div>
                    <div className="text-white leading-[150%]">Project Name</div>
                    <div className="w-[6px] h-[6px] bg-[#344240] rounded-full" />
                  </div>
                  <FilterSelectionContainer className="w-full md:flex-1">
                    {applicationsOwnerProjects
                      .filter(
                        (project) =>
                          !selectedStringFilters.includes(project.owner_project)
                      )
                      .filter((project) =>
                        search.length === 0 || project.owner_project.toLowerCase().includes(search.toLowerCase())
                      )
                      .slice(0, 20) // Limit to 20 results
                      .map((project) => (
                        <Badge
                          key={project.owner_project}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleFilter(project.owner_project);
                          }}
                          label={
                            applicationsAutocomplete.owner_project.length > 0
                              ? boldSearch(project.owner_project)
                              : project.owner_project
                          }
                          leftIcon="gtp-project-monochrome"
                          rightIcon="heroicons-solid:plus-circle"
                          className={`z-[100] ${search.length > 0
                            ? applicationsAutocomplete.owner_project.some(p => p.owner_project === project.owner_project)
                              ? "opacity-100"
                              : "opacity-30"
                            : "opacity-100"
                          } transition-all`}
                        />
                      ))}
                  </FilterSelectionContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
