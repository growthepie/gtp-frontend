"use client";

import { useRef, useState } from "react"
import { GrayOverlay } from "../layout/Backgrounds"
import { GTPIcon } from "../layout/GTPIcon"
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Icon from "../layout/Icon";
import { Badge, FilterSelectionContainer } from "@/app/(layout)/applications/_components/Search";
import { useMaster } from "@/contexts/MasterContext";

const setDocumentScroll = (showScroll: boolean) => {
  if (showScroll) {
    document.body.classList.add("overflow-y-scroll");
    document.body.classList.remove("!overflow-y-hidden");
  } else {
    document.body.classList.remove("overflow-y-scroll");
    document.body.classList.add("!overflow-y-hidden");
  }
}

export const HeaderSearchButton = () => {
  const pathname = usePathname();

  // read state from url
  const handleOpenSearch = () => {
    // get existing query params
    let newSearchParams = new URLSearchParams(window.location.search)

    newSearchParams.set("search", "true");

    // create new url
    let url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;

    window.history.replaceState(null, "", url);
    setDocumentScroll(false);
  }

  return (
    <>
      <GTPIcon icon="gtp-search" size="lg" className="cursor-pointer" onClick={() => handleOpenSearch()} />
    </>
  )
}

export const SearchComponent = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isOpen = searchParams.get("search") === "true";

  const handleCloseSearch = () => {
    // get existing query params
    let newSearchParams = new URLSearchParams(window.location.search)

    newSearchParams.delete("search");

    // create new url
    let url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;

    window.history.replaceState(null, "", url);
    setDocumentScroll(true);
  }

  if (!isOpen) return null;

  return (
    <>
      <SearchBar />
      <GrayOverlay onClick={handleCloseSearch} />

    </>
  )
}

const SearchBar = () => {
  const [internalSearch, setInternalSearch] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { AllChainsByKeys } = useMaster();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalSearch(e.target.value);
  }

  return (
    <div className="fixed top-[33px] left-[50%] translate-x-[-50%] z-[101] w-[660px] p-2.5 bg-[#344240] rounded-[999px] shadow-[0px_0px_50px_0px_rgba(0,0,0,1.00)] inline-flex justify-start items-center gap-[15px]">
      <div className="flex items-center w-full min-h-[44px]">
        <div className="absolute left-[10px] right-[10px]  flex items-center bg-[#1F2726] gap-x-[10px] rounded-[22px] pr-[10px] min-h-[44px] z-[117]" />
        <div className="absolute left-[10px] right-[10px] z-[118] flex items-center w-full">
          <div className={`relative flex justify-center items-center pl-[10px]`}>
            {internalSearch ? (
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
            autoFocus={true}
            className={`flex-1 pl-[11px] h-full bg-transparent text-white placeholder-[#CDD8D3] border-none outline-none overflow-x-clip`}
            placeholder="Search & Filter"
            value={internalSearch}
            onChange={handleSearchChange}
            onKeyUp={(e) => {
              // if enter is pressed, add the search term to the address filters
              if (e.key === "Enter" && internalSearch.length > 0) {
                // handleFilter("string", internalSearch);
                setInternalSearch("");
                // debouncedSetSearch("");
                e.preventDefault();
              }
            }}
          />

          <div className={`flex items-center justify-between pr-[10px] gap-x-[10px] ${internalSearch ? "" : "w-full"}`}>
            <div />
            {/* {(!isOpen ) ? (
                <>
                  <div className="pl-[10px]">
                    <div className="w-[6px] h-[6px] bg-[#344240] rounded-full" />
                  </div>
                  <FilterSelectionContainer className="w-full">
                    {Filters}
                  </FilterSelectionContainer>
                </>
              ) : <div />} */}
            <div className={`${internalSearch ? "flex" : "hidden md:flex"} pr-[20px] justify-end items-center gap-x-[10px] shrink-0 overflow-clip whitespace-nowrap transition-all duration-300`}>
              {internalSearch.length > 0 && (
                <div className={`flex items-center px-[15px] h-[24px] border border-[#CDD8D3] rounded-full`}>
                  <div className="text-[8px] text-[#CDD8D3] font-medium">
                    {["Chains", "Fundamentals"].reduce((total, type) => {
                      let typeData: Array<{ label: string; urlKey: string; color?: string; name_short?: string }> = [];
                      if (type === "Chains") {
                        typeData = Object.entries(AllChainsByKeys)
                          .filter(([key]) => key !== "all_l2s" && key !== "multiple")
                          .map(([_, chain]) => ({
                            label: chain.label,
                            urlKey: chain.urlKey,
                            color: chain.colors.dark[0],
                            name_short: chain.name_short
                          }));
                      } else if (type === "Fundamentals") {
                        typeData = ["Total Value Secured", "Total Value Locked", "Total Value Locked (USD)", "Total Value Locked (USD) (24h)", "Total Value Locked (USD) (7d)", "Total Value Locked (USD) (30d)", "Total Value Locked (USD) (90d)", "Total Value Locked (USD) (180d)", "Total Value Locked (USD) (365d)"]
                          .map(item => ({ label: item, urlKey: "" }));
                      }

                      const matchCount = typeData.filter(item => {
                        const searchTerm = internalSearch.toLowerCase();
                        const itemLabel = item.label.toLowerCase();
                        const itemShortName = item.name_short?.toLowerCase() || "";
                        
                        if (searchTerm.length === 1) {
                          return itemLabel.startsWith(searchTerm) || itemShortName.startsWith(searchTerm);
                        }
                        return itemLabel.includes(searchTerm) || itemShortName.includes(searchTerm);
                      }).length;

                      return total + matchCount;
                    }, 0).toLocaleString("en-GB")} results
                  </div>
                </div>
              )}
              {internalSearch.length > 0 && (
                <div
                  className="flex flex-1 items-center justify-center cursor-pointer w-[27px] h-[26px]"
                  onClick={(e) => {
                    setInternalSearch("");
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
          className={`${internalSearch ? "max-h-[500px]" : "max-h-0"} transition-[max-height] z-[116] absolute flex flex-col-reverse md:flex-col rounded-t-[22px] md:rounded-t-none md:rounded-b-[22px] bg-[#151A19] left-0 right-0 bottom-[calc(100%-22px)] md:bottom-auto md:top-[calc(100%-22px)] shadow-[0px_0px_50px_0px_#000000] duration-300 overflow-y-auto scrollbar-thin scrollbar-thumb-forest-700 scrollbar-track-transparent`}
        >
          <div className={`flex flex-col-reverse md:flex-col pl-[12px] pr-[25px] pb-[25px] pt-[5px] md:pb-[5px] md:pt-[25px] gap-y-[10px] text-[10px] bg-[#344240] z-[11] ${internalSearch ? "max-h-none" : "max-h-[20px]"} opacity-0 !p-0 transition-all duration-300 overflow-visible`}>
            <div className="flex flex-col md:flex-row h-[50px] md:h-[30px] gap-x-[10px] gap-y-[10px] items-start md:items-center z-[150]">
              <div className="flex gap-x-[10px] items-center">
                <div className="w-[15px] h-[15px]">
                  <Icon
                    icon="feather:check"
                    className="w-[15px] h-[15px]"
                  />
                </div>
                <div className="text-white leading-[150%] whitespace-nowrap">Active Filter(s)</div>
              </div>
              {/* <FilterSelectionContainer className="w-full">
                    {Filters}
                  </FilterSelectionContainer> */}
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-col pl-[12px] pr-[25px] pb-[10px] pt-[10px] gap-y-[10px] text-[10px]">
            {(() => {
              // Calculate all filtered data once
              const allFilteredData = ["Chains", "Fundamentals"].map(type => {
                let data: Array<{ label: string; urlKey: string; color?: string; name_short?: string }> = [];
                if (type === "Chains") {
                  // Get chains from master data, excluding All L2s
                  data = Object.entries(AllChainsByKeys)
                    .filter(([key]) => key !== "all_l2s" && key !== "multiple")
                    .map(([_, chain]) => ({
                      label: chain.label,
                      urlKey: chain.urlKey,
                      color: chain.colors.dark[0],
                      name_short: chain.name_short
                    }));
                } else if (type === "Fundamentals") {
                  // get from actual data source (master?)
                  data = ["Total Value Secured", "Total Value Locked", "Total Value Locked (USD)", "Total Value Locked (USD) (24h)", "Total Value Locked (USD) (7d)", "Total Value Locked (USD) (30d)", "Total Value Locked (USD) (90d)", "Total Value Locked (USD) (180d)", "Total Value Locked (USD) (365d)"]
                    .map(item => ({ label: item, urlKey: "" }));
                }

                // Filter data based on search input
                const filteredData = data.filter(item => {
                  if (!internalSearch) return true;
                  
                  const searchTerm = internalSearch.toLowerCase();
                  const itemLabel = item.label.toLowerCase();
                  const itemShortName = item.name_short?.toLowerCase() || "";
                  
                  // For single character, match start of label or short name
                  if (searchTerm.length === 1) {
                    return itemLabel.startsWith(searchTerm) || itemShortName.startsWith(searchTerm);
                  }
                  // For multiple characters, search within label or short name
                  return itemLabel.includes(searchTerm) || itemShortName.includes(searchTerm);
                });

                return {
                  type,
                  filteredData
                };
              });

              // Calculate total matches for the counter
              const totalMatches = allFilteredData.reduce((total, { filteredData }) => total + filteredData.length, 0);

              return (
                <>
                  {allFilteredData.map(({ type, filteredData }) => {
                    // Only render section if there are matching items
                    if (internalSearch && filteredData.length === 0) return null;

                    return (
                      <div key={type} className="flex flex-col md:flex-row gap-x-[10px] gap-y-[10px] items-start">
                        <div className="flex gap-x-[10px] items-center shrink-0 pt-[2px]">
                          <div className="w-[24px] h-[24px]">
                            <Icon
                              icon="gtp:gtp-chain-alt"
                              className="w-[24px] h-[24px] text-white"
                            />
                          </div>
                          <div className="text-white text-sm leading-[150%] w-[120px]">{type}</div>
                          <div className="w-[6px] h-[6px] bg-[#344240] rounded-full" />
                        </div>
                        <FilterSelectionContainer className="w-full flex-wrap gap-[10px]">
                          {filteredData.map((item) => (
                            <Badge
                              key={item.label}
                              onClick={() => { }}
                              label={item.label}
                              leftIcon={type === "Chains" ? `gtp:${item.urlKey}-logo-monochrome` : "gtp:gtp-chain-alt"}
                              leftIconColor={item.color || "white"}
                              rightIcon=""
                            />
                          ))}
                        </FilterSelectionContainer>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>

        </div>
        {/* )} */}
      </div>
    </div>
  );
  return (
    <div className="fixed top-[33px] left-[50%] translate-x-[-50%] z-[101] w-[660px] p-2.5 bg-[#344240] rounded-[999px] shadow-[0px_0px_50px_0px_rgba(0,0,0,1.00)] inline-flex justify-start items-center gap-[15px]">
      <div className="flex-1 p-2.5 bg-[#1f2726] rounded-[40px] flex justify-start items-center gap-2.5">
        <GTPIcon icon="gtp-search" size="md" />
        <div className="flex-1 self-stretch pr-[11px] flex justify-start items-center gap-2.5 overflow-hidden">
          {/* <div className="justify-start text-[#cdd8d3] text-sm font-bold font-['Raleway'] leading-[16.80px]">|</div> */}
          <input autoFocus={true} type="text" placeholder="Search" className="bg-transparent outline-none text-[#cdd8d3] text-sm font-bold font-['Raleway'] leading-[16.80px]" />
        </div>
      </div>
    </div>
  )
}
