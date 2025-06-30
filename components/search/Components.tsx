"use client"
import { useMediaQuery } from "usehooks-ts";
import { memo, useCallback, useEffect, useMemo, useRef, useState, forwardRef } from "react"
import { GrayOverlay } from "../layout/Backgrounds"
import { GTPIcon } from "../layout/GTPIcon"
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Icon from "../layout/Icon";
import { Badge, FilterSelectionContainer } from "@/app/(layout)/applications/_components/Search";
import { useMaster } from "@/contexts/MasterContext";
import { navigationItems } from "@/lib/navigation";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { AnimatePresence, motion } from "framer-motion";
import { useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import Image from "next/image";
import VerticalScrollContainer from "../VerticalScrollContainer";
import Link from "next/link";
import { HeaderButton } from "../layout/HeaderButton";
import { debounce } from "lodash";
import { numberFormat } from "highcharts";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import type { InputHTMLAttributes } from 'react';

function normalizeString(str: string) {
  return str.toLowerCase().replace(/\s+/g, '');
}

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
  const searchParams = useSearchParams();
  const isOpen = searchParams.get("search") === "true";
  const query = searchParams.get("query") || "";
  const isMobile = useMediaQuery("(max-width: 767px)");

  // read state from url
  const handleOpenSearch = useCallback(() => {
    // get existing query params
    let newSearchParams = new URLSearchParams(window.location.search)

    newSearchParams.set("search", "true");

    // create new url
    let url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;

    window.history.replaceState(null, "", url);
    setDocumentScroll(false);
  }, [pathname]);

  const handleCloseSearch = useCallback(() => {
    // get existing query params
    let newSearchParams = new URLSearchParams(window.location.search)

    newSearchParams.delete("search");
    newSearchParams.delete("query");

    // create new url
    let url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;

    window.history.replaceState(null, "", url);
    setDocumentScroll(true);
  }, [pathname]);

  const handleClearQuery = useCallback(() => {
    // get existing query params
    let newSearchParams = new URLSearchParams(window.location.search)

    newSearchParams.delete("query");

    // create new url
    let url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;

    window.history.replaceState(null, "", url);
  }, [pathname]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // on '/' press, open search if not already open, otherwise close it
      if (e.key === "/") {
        e.preventDefault();
        e.stopPropagation();
        if (isOpen) {
          handleCloseSearch();
        } else {
          handleOpenSearch();
        }
      }

      // on 'esc' press, close search with a small delay
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (query !== "") {
          handleClearQuery();
        } else {
          // Add a small delay before closing to allow visual feedback
          setTimeout(() => {
            handleCloseSearch();
          }, 200); // 200ms delay to match the visual feedback duration
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleClearQuery, handleCloseSearch, handleOpenSearch, isOpen, query]);

  if(isMobile){
    return (
      <button className={`cursor-pointer group bg-transparent p-[5px]`} onClick={() => handleOpenSearch()} aria-label="Search" >
        <div className="flex items-center">
          <GTPIcon icon="gtp-search" size="md" />
        </div>
      </button>
    )
  }

  return (
    <HeaderButton size={isMobile ? "md" : "xl"} className={`cursor-pointer group ${isMobile ? "bg-transparent" : "bg-[#344240]"}`} onClick={() => handleOpenSearch()} ariaLabel="Search" >
      <div className="flex items-center">
        <GTPIcon icon="gtp-search" size="md" />
        {!isMobile && (
        <div className={`flex items-center justify-end overflow-hidden w-0 group-hover:w-[28px] transition-all duration-200 ${isOpen ? "!w-[28px]" : "w-0"}`}>
          <div className="size-[18px] heading-small-xs font-black rounded-[4px] text-[#344240] bg-[#1F2726] flex items-center justify-center">/</div>
        </div>
        )}
      </div>
    </HeaderButton>
  )
}

export const SearchComponent = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isOpen = searchParams.get("search") === "true";
  const [showMore, setShowMore] = useState<{ [key: string]: boolean }>({});

  const handleCloseSearch = () => {
    // get existing query params
    let newSearchParams = new URLSearchParams(window.location.search)

    newSearchParams.delete("search");
    newSearchParams.delete("query");
    // create new url
    let url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;

    window.history.replaceState(null, "", url);
    setDocumentScroll(true);
  }

  // Handle initial scroll state when page loads with search parameters
  useEffect(() => {
    if (isOpen) {
      setDocumentScroll(false);
    }
    return () => {
      if (isOpen) {
        setDocumentScroll(true);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <SearchBar showMore={showMore} setShowMore={setShowMore} />
      <GrayOverlay onClick={handleCloseSearch} />
    </>
  )
}

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onFocus' | 'onBlur'> {
  showMore?: any;
  setShowMore?: any;
  showSearchContainer?: boolean;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ showMore, setShowMore, showSearchContainer=true, onInputFocus, onInputBlur, onFocus, onBlur, ...rest }, forwardedRef) => {
    // Local ref for internal SearchBar use
    const localInputRef = useRef<HTMLInputElement>(null);

    // Effect to assign the input element to both refs when available
    useEffect(() => {
      // Assign to the local ref
      // This assignment is implicitly handled by React when localInputRef is passed to the input's ref prop.
      // So localInputRef.current will be set.

      // Assign to the forwarded ref
      if (forwardedRef) {
        if (typeof forwardedRef === 'function') {
          forwardedRef(localInputRef.current);
        } else {
          // `forwardedRef` is a RefObject
          // TypeScript might complain here if `current` is readonly.
          // A common workaround is to cast, but ensure this aligns with React's ref handling.
          (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = localInputRef.current;
        }
      }
    }, [forwardedRef]); // Re-run if forwardedRef changes (though it usually doesn't for a component instance)

    const { AllChainsByKeys } = useMaster();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const query = searchParams.get("query") || "";
    const [localQuery, setLocalQuery] = useState(query);
    const { totalMatches } = useSearchBuckets();

    const handleInternalFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      // Call original onFocus if provided for SearchBar's internal logic
      if (onFocus) {
        onFocus(event);
      }
      // Call the new onInputFocus handler passed from GlobalFloatingBar
      if (onInputFocus) {
        onInputFocus();
      }
    };

    const handleInternalBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      // Call original onBlur if provided for SearchBar's internal logic
      if (onBlur) {
        onBlur(event);
      }
      // Call the new onInputBlur handler passed from GlobalFloatingBar
      if (onInputBlur) {
        onInputBlur();
      }
    };

    // Create a debounced version of the search update function
    const debouncedUpdateSearch = useMemo(
      () => debounce((newValue: string) => {
        // get existing query params
        let newSearchParams = new URLSearchParams(window.location.search);
        newSearchParams.set("query", newValue);

        // create new url
        let url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;
        window.history.replaceState(null, "", url);
      }, 50),
      [pathname]
    );

    // Update local query when URL query changes
    useEffect(() => {
      setLocalQuery(query);
    }, [query]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const newValue = input.value;
      const cursorPosition = input.selectionStart;

      // Update local state immediately
      setLocalQuery(newValue);

      // Call the debounced function for URL updates
      debouncedUpdateSearch(newValue);

      // Restore cursor position after React updates the input
      requestAnimationFrame(() => {
        if (localInputRef.current) {
          localInputRef.current.selectionStart = cursorPosition;
          localInputRef.current.selectionEnd = cursorPosition;
        }
      });
    };

    // Cleanup the debounced function on unmount
    useEffect(() => {
      return () => {
        debouncedUpdateSearch.cancel();
      };
    }, [debouncedUpdateSearch]);

    if(!showSearchContainer){
      return (
        <div className={`flex w-full flex-col-reverse md:flex-col`}>
            {/* first child: the search bar w/ Icon and input */}
            <div className="flex w-full gap-x-[10px] items-center bg-[#1F2726] rounded-[22px] h-[44px] p-2.5">
              {localQuery.length > 0 ? (
                <div className="flex items-center justify-center w-[24px] h-[24px]">
                  <Icon icon="feather:chevron-down" className="w-[24px] h-[24px]" />
                </div>
              ) : (
                <GTPIcon icon="gtp-search" size="md" />
              )}
              <input
                ref={localInputRef}
                autoComplete="off"
                spellCheck={false}
                className={`flex-1 h-full bg-transparent text-white placeholder-[#CDD8D3] border-none outline-none overflow-x-clip text-md leading-[150%] font-medium font-raleway`}
                placeholder="Search"
                value={localQuery}
                onChange={handleSearchChange}
                onFocus={handleInternalFocus}
                onBlur={handleInternalBlur}
              />
              <div className={`absolute flex items-center gap-x-[10px] right-[20px] text-[8px] text-[#CDD8D3] font-medium ${localQuery.length > 0 ? "opacity-100" : "opacity-0 pointer-events-none"} transition-opacity duration-200`}>
                <div className="flex items-center px-[15px] h-[24px] border border-[#CDD8D3] rounded-full select-none">
                  <div className="text-xxxs text-[#CDD8D3] font-medium font-raleway -mb-[1px]">
                    {totalMatches} {totalMatches === 1 ? "result" : "results"}
                  </div>
                </div>
                <div
                  className="flex flex-1 items-center justify-center cursor-pointer w-[27px] h-[26px]"
                  onClick={(e) => {
                    setLocalQuery("");
                    debouncedUpdateSearch("");
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
              </div>
            </div>
            {/* second child: the filter selection container */}
            <Filters showMore={showMore} setShowMore={setShowMore} />
          </div>
      );
    }

    return (
      <>
        {/* SearchContainer includes the thick border with rounded corners along with the main dark background */}
        <SearchContainer>
          {/* flex-col to make it so the children are stacked vertically */}
          <div className="flex w-full flex-col">
            {/* first child: the search bar w/ Icon and input */}
            <div className="flex w-full gap-x-[10px] items-center bg-[#1F2726] rounded-[22px] h-[44px] p-2.5">
              {localQuery.length > 0 ? (
                <div className="flex items-center justify-center w-[24px] h-[24px]">
                  <Icon icon="feather:chevron-down" className="w-[24px] h-[24px]" />
                </div>
              ) : (
                <GTPIcon icon="gtp-search" size="md" />
              )}
              <input
                ref={localInputRef}
                autoFocus={true}
                autoComplete="off"
                spellCheck={false}
                className={`flex-1 h-full bg-transparent text-white placeholder-[#CDD8D3] border-none outline-none overflow-x-clip text-md leading-[150%] font-medium font-raleway`}
                placeholder="Search"
                value={localQuery}
                onChange={handleSearchChange}
              />
              <div className={`absolute flex items-center gap-x-[10px] right-[20px] text-[8px] text-[#CDD8D3] font-medium ${localQuery.length > 0 ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}>
                <div className="flex items-center px-[15px] h-[24px] border border-[#CDD8D3] rounded-full select-none">
                  <div className="text-xxxs text-[#CDD8D3] font-medium font-raleway -mb-[1px]">
                    {totalMatches} {totalMatches === 1 ? "result" : "results"}
                  </div>
                </div>
                <div
                  className="flex flex-1 items-center justify-center cursor-pointer w-[27px] h-[26px]"
                  onClick={(e) => {
                    setLocalQuery("");
                    debouncedUpdateSearch("");
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
              </div>
            </div>
            {/* second child: the filter selection container */}
            <Filters showMore={showMore} setShowMore={setShowMore} />
          </div>
        </SearchContainer>
      </>
    )
  }
);

SearchBar.displayName = "SearchBar";

// hook to get search buckets and total matches
export const useSearchBuckets = () => {
  const { AllChainsByKeys } = useMaster();
  const searchParams = useSearchParams();

  const query = searchParams.get("query")?.trim();

  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { AllChainsByStacks } = useMaster();

  // search buckets structure
  type SearchBucket = {
    label: string;
    icon: GTPIconName;
    options: { 
      label: string; 
      url: string; 
      icon: string; 
      color?: string;
    }[];
    groupOptions?: { 
      label: string; 
      options: { label: string; url: string; icon: string, color?: string }[]
    }[];
  };

  // first bucket = chains
  const searchBuckets: SearchBucket[] = useMemo(() => [
    {
      label: "Chains",
      icon: "gtp-chain",
      options: Object.entries(AllChainsByKeys)
        .filter(([key]) => key !== "all_l2s" && key !== "multiple")
        .map(([_, chain]) => ({
          label: chain.label,
          url: `/chains/${chain.urlKey}`,
          icon: `gtp:${chain.urlKey}-logo-monochrome`,
          color: chain.colors.dark[0]
        })),
      groupOptions: Object.entries(AllChainsByStacks)
        .map(([bucket, chains]) => ({
          label: bucket,
          options: chains.map(chain => ({
            label: chain.name,
            url: `/chains/${chain.url_key}`,
            icon: `gtp:${chain.url_key}-logo-monochrome`,
            color: chain.colors.dark[0]
          }))
        }))
    },
    ...navigationItems.filter(navItem => navItem.name !== "Applications").map(navItem => ({
      label: navItem.name,
      icon: navItem.icon,
      options: navItem.options.map(option => ({
        label: option.label,
        url: option.url || "",
        icon: `gtp:${option.icon}`,
        color: undefined
      }))
    })),
    {
      label: "Applications",
      icon: "gtp-project",
      options: [
        ...navigationItems.filter(navItem => navItem.name === "Applications")[0].options.map(option => ({
          label: option.label,
          url: option.url || "",
          icon: `gtp:${option.icon}`,
          color: undefined
        })),
        ...Object.entries(ownerProjectToProjectData)
          .filter(([owner, project]) => project.on_apps_page)
          .map(([owner, project]) => ({
            label: project.display_name,
            url: `/applications/${project.owner_project}`,
            icon: project.logo_path 
              ? `https://api.growthepie.xyz/v1/apps/logos/${project.logo_path}`
              : "gtp-project-monochrome",
            color: undefined
          }))
      ]
    }
  ], [AllChainsByKeys, ownerProjectToProjectData, AllChainsByStacks]);


  const allFilteredData = useMemo(() => {
    // Check if the query matches at least 40% of a bucket name from the beginning
    const bucketMatch = query ? searchBuckets.find(bucket => {
      const bucketName = normalizeString(bucket.label);
      const searchQuery = normalizeString(query);

      // Calculate the minimum length needed (40% of bucket name)
      const minQueryLength = Math.ceil(bucketName.length * 0.4);

      // Check if query is long enough and matches from the start
      return searchQuery.length >= minQueryLength &&
        bucketName.startsWith(searchQuery);
    }) : null;

    // Get regular search results
    const regularSearchResults = searchBuckets.map(bucket => {
      const bucketOptions = bucket.options;
      const lowerQuery = normalizeString(query || "");

      // Split into three categories
      const exactMatches = bucketOptions.filter(option =>
        normalizeString(option.label) === lowerQuery
      );

      const startsWithMatches = bucketOptions.filter(option => {
        const lowerLabel = normalizeString(option.label);
        return lowerLabel !== lowerQuery && // not an exact match
          lowerLabel.startsWith(lowerQuery);
      });

      const containsMatches = bucketOptions.filter(option => {
        const lowerLabel = normalizeString(option.label);
        return lowerLabel !== lowerQuery && // not an exact match
          !lowerLabel.startsWith(lowerQuery) && // not a starts with match
          lowerLabel.includes(lowerQuery);
      });

      const groupOptions = bucket.groupOptions;

      const groupOptionsMatches = groupOptions?.filter(group => {
        const lowerLabel = normalizeString(group.label);
        const normalizedQuery = normalizeString(query || "");
        
        // Only search stacks if query is 3 characters or more
        if (normalizedQuery.length < 3) {
          return false;
        }
        
        return lowerLabel.includes(normalizedQuery);
      });

      return {
        type: bucket.label,
        icon: bucket.icon,
        filteredData: [...exactMatches, ...startsWithMatches, ...containsMatches],
        filteredGroupData: groupOptionsMatches,
        isBucketMatch: false
      };
    });

    // Filter out empty buckets from regular results first
    const filteredRegularResults = regularSearchResults.filter(bucket =>
      bucket.filteredData.length > 0 || (bucket.filteredGroupData && bucket.filteredGroupData.length > 0)
    );

    // Sort regular results
    const sortedRegularResults = filteredRegularResults.sort((a, b) => {
      // First, prioritize Chains bucket
      if (a.type === "Chains" && b.type !== "Chains") return -1;
      if (b.type === "Chains" && a.type !== "Chains") return 1;

      // For remaining items, maintain the order from navigationItems
      const aIndex = navigationItems.findIndex(item => item.name === a.type);
      const bIndex = navigationItems.findIndex(item => item.name === b.type);

      // If both items are found in navigationItems, sort by their order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If one item is not in navigationItems, put it last
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return 0;
    });

    // Add bucket match at the end if it exists
    return bucketMatch && bucketMatch.options.length > 0
      ? [...sortedRegularResults, {
        type: `${bucketMatch.label} `,
        icon: bucketMatch.icon,
        filteredData: bucketMatch.options,
        filteredGroupData: null,
        isBucketMatch: true
      }]
      : sortedRegularResults;
  }, [query, searchBuckets]);

  // Calculate total matches for the counter
  const totalMatches = allFilteredData.reduce((total, { filteredData, filteredGroupData }) => {
    let bucketTotal = filteredData.length;
    
    // Add stack results to the count
    if (filteredGroupData && filteredGroupData.length > 0) {
      filteredGroupData.forEach(group => {
        bucketTotal += group.options.length;
      });
    }
    
    return total + bucketTotal;
  }, 0);

  return {
    allFilteredData,
    totalMatches
  }
}

const OpacityUnmatchedText = ({ text, query }: { text: string; query: string }) => {
  const spanRef = useRef<HTMLSpanElement>(null);      // Parent span (visible)
  const matchRef = useRef<HTMLSpanElement>(null);     // Match span
  const [isTruncated, setIsTruncated] = useState(false);
  const [matchIsHidden, setMatchIsHidden] = useState(false);

  // Always call hooks before any return
  useEffect(() => {
    if (spanRef.current) {
      setIsTruncated(spanRef.current.scrollWidth > spanRef.current.clientWidth);
    }
  }, [text, query]);

  useEffect(() => {
    if (spanRef.current && matchRef.current) {
      const parentRect = spanRef.current.getBoundingClientRect();
      const matchRect = matchRef.current.getBoundingClientRect();
      setMatchIsHidden(matchRect.right > parentRect.right);
    } else {
      setMatchIsHidden(false);
    }
  }, [isTruncated, text, query]);

  if (!query) return <>{text}</>;

  // Normalize for matching
  const normalizedText = normalizeString(text);
  const normalizedQuery = normalizeString(query);

  const matchIndex = normalizedText.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    // No match, all faded
    return <span className="opacity-50">{text}</span>;
  }

  // Map normalized match index back to original string indices
  let origStart = 0, normCount = 0;
  while (origStart < text.length && normCount < matchIndex) {
    if (text[origStart] !== ' ') normCount++;
    origStart++;
  }

  let origEnd = origStart, normMatchCount = 0;
  while (origEnd < text.length && normMatchCount < query.replace(/\s+/g, '').length) {
    if (text[origEnd] !== ' ') normMatchCount++;
    origEnd++;
  }

  const before = text.slice(0, origStart);
  const match = text.slice(origStart, origEnd);
  const after = text.slice(origEnd);

  // If the match is hidden, use solid color for parent (and thus ellipsis)
  const parentColorClass =
    isTruncated && matchIsHidden
      ? "text-[rgba(205,216,211)]"
      : "text-[rgba(205,216,211,0.5)]";

  return (
    <>
      {/* Hidden span for measuring full width (not visible) */}
      <span
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          height: 0,
          overflow: "hidden",
        }}
      >
        {text}
      </span>
      {/* Actual rendered text */}
      <span
        ref={spanRef}
        className={`truncate inline-block max-w-full align-bottom ${parentColorClass}`}
        style={{ position: "relative" }}
      >
        {before && (
          <span className="text-[rgba(205,216,211,0.5)]">{before}</span>
        )}
        <span ref={matchRef} className="text-[rgba(205,216,211)]">{match}</span>
        {after && <span>{after}</span>}
      </span>
    </>
  );
};

// These components remain the same
type SearchBadgeProps = {
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
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

export const SearchBadge = memo(({
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
}: SearchBadgeProps) => {
  // This ensures the click handler takes precedence over any parent handlers
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Stop event from bubbling to parent elements
    e.preventDefault(); // Prevent any default behaviors
    onClick?.(e); // Call the provided onClick handler
  };

  const getLeftIcon = () => {
    if (!leftIcon) return null;
    // if the icon is a url, return an image
    if (leftIcon?.startsWith("http")) {
      return <Image src={leftIcon} alt={label as string} className="rounded-full w-[15px] h-[15px]" width={15} height={15} />;
    }
    
    // Check if it's the specific GTP project monochrome icon
    if (leftIcon === "gtp-project-monochrome") {
      return (
        <div className="flex items-center justify-center w-[15px] h-[15px] pl-[2px]">
          <GTPIcon
            icon={leftIcon as GTPIconName}
            size="sm"
            className="!size-[12px]"
            style={{
              color: "#5A6462", // Force the grey color for GTP icons
            }}
          />
        </div>
      );
    }
    
    // Regular Iconify icon
    return (
      <div className="flex items-center justify-center w-[15px] h-[15px]">
        <Icon
          icon={leftIcon}
          className="text-[#CDD8D3] w-[15px] h-[15px]"
          style={{
            color: leftIconColor,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center ${altColoring ? "bg-[#1F2726]" : "bg-[#344240]"} hover:bg-[#5A6462] active:bg-[#5A6462] text-xs rounded-full h-[24px] pl-[5px] pr-[10px] gap-x-[4px] ${onClick ? "cursor-pointer" : "cursor-default"} ${className}`}
      onClick={onClick ? handleClick : undefined}
    >
      {getLeftIcon()}
      {showLabel && (
        <div className="text-[#CDD8D3] leading-[150%] pr-0.5 truncate max-w-[185px]">
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

SearchBadge.displayName = 'SearchBadge';

const Filters = ({ showMore, setShowMore }: { showMore: { [key: string]: boolean }, setShowMore: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>> }) => {
  const { AllChainsByKeys } = useMaster();
  const [viewportHeight, setViewportHeight] = useState<number>(0);
  const [keyCoords, setKeyCoords] = useState<{ y: number | null, x: number | null }>({ y: null, x: null });
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [keyPressed, setKeyPressed] = useState('');
  const [forceUpdate, setForceUpdate] = useState(0);
  const [lastBucketIndeces, setLastBucketIndeces] = useState<{ [key: string]: { x: number, y: number } }>({});
  const childRefs = useRef<{ [key: string]: HTMLAnchorElement | HTMLDivElement | null }>({});
  const measurementsRef = useRef<{ [key: string]: DOMRect }>({});

  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const { allFilteredData, totalMatches } = useSearchBuckets();
  const router = useRouter();

  const getKey = (label: string, type: string) => {
    return String(`${type}::${label}`);
  }

  const memoizedQuery = useMemo(() => {
    // trim the query
    return normalizeString(query || "");
  }, [query]);

  useEffect(() => {
    // reset lastBucketIndeces
    setShowMore({});
    setLastBucketIndeces({});
  }, [memoizedQuery, setShowMore]);

  const keyMapping = useMemo(() => {
    const dataMap: string[][] = [[]];
    const newLastBucketIndeces: { [key: string]: { x: number, y: number } } = {};
    let yIndex = 0;

    allFilteredData.forEach(({ type, icon, filteredData, filteredGroupData, isBucketMatch }, bucketIndex) => {
      const isShowMore = showMore[type] && type !== "Applications";
      let localYIndex = 0;

      if (bucketIndex > 0) {
        yIndex++;
        localYIndex = 0;
        dataMap[yIndex] = [];
      }

      let currentRow: string[] = [];
      let lastTop: number | null = null;

      // Process regular chain results
      filteredData.forEach((item, itemIndex) => {
        if (localYIndex > 2 && !isShowMore) {
          return
        };

        const key = getKey(item.label, type);
        const rect = measurementsRef.current[key];
        const itemTop = rect?.top;

        // If this is the first item or has same top position as previous items, add to current row
        if (lastTop === null || itemTop === lastTop) {
          currentRow.push(key);
          // 1. make sure we're currently in the third row
          if (localYIndex === 2 && !isShowMore) {
            // 2. make sure there's a next item
            const nextItem = filteredData[itemIndex + 1];
            if (nextItem) {
              // 3. make sure the next item is in the NEXT row
              const nextItemKey = getKey(nextItem.label, type);
              const nextItemRect = measurementsRef.current[nextItemKey];
              const nextItemTop = nextItemRect?.top;
              const lastYIndex = localYIndex;
              if (nextItemTop !== itemTop) {
                newLastBucketIndeces[key] = { x: currentRow.length - 1, y: lastYIndex };
              };
            }
          }
        } else {
          // If top position is different, start a new row
          localYIndex++;
          if (localYIndex > 2 && !isShowMore) return;
          yIndex++;
          dataMap[yIndex] = [];
          currentRow = [key];
        }

        // Update lastTop and add current row to dataMap
        lastTop = itemTop || lastTop;
        dataMap[yIndex] = currentRow;
      });

      // Process stack results
      if (filteredGroupData && filteredGroupData.length > 0) {
        filteredGroupData.forEach((group) => {
          const isStackShowMore = showMore[`${group.label}::${type}`];
          
          // Start a new row for each stack group
          yIndex++;
          dataMap[yIndex] = [];
          currentRow = [];
          lastTop = null;
          let localStackYIndex = 0;

          // Process all stack options (no slicing here since container handles it)
          group.options.forEach((option, optionIndex) => {
            if (localStackYIndex > 2 && !isStackShowMore) {
              return;
            }

            const key = getKey(option.label, `${group.label}::${type}`);
            const rect = measurementsRef.current[key];
            const itemTop = rect?.top;

            // If this is the first item or has same top position as previous items, add to current row
            if (lastTop === null || itemTop === lastTop) {
              currentRow.push(key);
              // Check if this should be the "See more" item (3rd row, not expanded, more items exist)
              if (localStackYIndex === 2 && !isStackShowMore) {
                // Check if there's a next item that would be in the next row
                const nextItem = group.options[optionIndex + 1];
                if (nextItem) {
                  const nextItemKey = getKey(nextItem.label, `${group.label}::${type}`);
                  const nextItemRect = measurementsRef.current[nextItemKey];
                  const nextItemTop = nextItemRect?.top;
                  if (nextItemTop !== itemTop) {
                    newLastBucketIndeces[key] = { x: currentRow.length - 1, y: localStackYIndex };
                  }
                }
              }
            } else {
              // If top position is different, start a new row
              localStackYIndex++;
              if (localStackYIndex > 2 && !isStackShowMore) return;
              yIndex++;
              dataMap[yIndex] = [];
              currentRow = [key];
            }

            // Update lastTop and add current row to dataMap
            lastTop = itemTop || lastTop;
            dataMap[yIndex] = currentRow;
          });
        });
      }
    });

    // commit the built map
    setLastBucketIndeces(newLastBucketIndeces);

    // filter out empty arrays
    return dataMap.filter(arr => arr.length > 0);
  }, [allFilteredData, showMore, measurementsRef]);


  // Setup resize observer
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      let hasChanges = false;

      entries.forEach(entry => {
        const element = entry.target as HTMLElement;
        const key = element.getAttribute('data-key');
        if (!key) return;

        const rect = element.getBoundingClientRect();
        const oldRect = measurementsRef.current[key];

        if (!oldRect || oldRect.top !== rect.top || oldRect.left !== rect.left) {
          measurementsRef.current[key] = rect;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setForceUpdate(prev => prev + 1);
      }
    });

    Object.entries(childRefs.current).forEach(([key, element]) => {
      if (element) {
        element.setAttribute('data-key', key);
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [allFilteredData]);

  useEffect(() => {
    setKeyCoords({ y: null, x: null });
  }, [memoizedQuery, allFilteredData])

  // Add state to track keyboard-triggered expansions
  const [keyboardExpandedStacks, setKeyboardExpandedStacks] = useState<Set<string>>(new Set());

  // Modify the useEffect to only select first item for keyboard-triggered expansions
  useEffect(() => {
    if (memoizedQuery && allFilteredData.length > 0 && keyboardExpandedStacks.size > 0) {
      // Find the first expanded stack and select its first newly revealed result
      for (const expandedStack of keyboardExpandedStacks) {
        // Find the bucket and group that was expanded
        const [groupLabel, bucketType] = expandedStack.split('::');
        
        // Find the bucket in allFilteredData
        const bucket = allFilteredData.find(b => b.type === bucketType);
        if (bucket && bucket.filteredGroupData) {
          // Find the group that was expanded
          const group = bucket.filteredGroupData.find(g => g.label === groupLabel);
          if (group && group.options.length > 9) {
            // Find the position of the first newly revealed result in keyMapping
            // The first 9 results were already visible, so we want the 10th result (index 9)
            const firstNewResult = group.options[9];
            const firstNewResultKey = getKey(firstNewResult.label, `${groupLabel}::${bucketType}`);
            
            // Find this key in the keyMapping
            for (let y = 0; y < keyMapping.length; y++) {
              for (let x = 0; x < keyMapping[y].length; x++) {
                if (keyMapping[y][x] === firstNewResultKey) {
                  setKeyCoords({ x, y });
                  setKeyboardExpandedStacks(new Set()); // Clear the flag
                  return;
                }
              }
            }
          }
        }
      }
    }
  }, [memoizedQuery, allFilteredData, keyboardExpandedStacks, keyMapping, getKey, setKeyCoords]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!keyMapping.length) return;

      const isCoordsNull = keyCoords.y === null || keyCoords.x === null;
      const currentY = keyCoords.y ?? 0;
      const currentX = keyCoords.x ?? 0;



      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (isCoordsNull) {
          setKeyCoords({ y: 0, x: 0 });
        } else if (currentY !== 0) {
          setKeyCoords({ y: currentY - 1, x: Math.min(currentX, (keyMapping[currentY - 1]?.length || 1) - 1) });
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (isCoordsNull) {
          setKeyCoords({ y: 0, x: 0 });
        } else if (currentY !== keyMapping.length - 1) {
          setKeyCoords({ y: currentY + 1, x: Math.min(currentX, (keyMapping[currentY + 1]?.length || 1) - 1) });
        }
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (isCoordsNull) {
          setKeyCoords({ y: 0, x: 0 });
        } else if (currentX !== 0) {
          setKeyCoords({ y: currentY, x: currentX - 1 });
        }
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (isCoordsNull) {
          setKeyCoords({ y: 0, x: 0 });
        } else if (currentX !== keyMapping[currentY].length - 1) {
          setKeyCoords({ y: currentY, x: currentX + 1 });
        }
      } else if (event.key === 'Enter' && !isCoordsNull) {
        event.preventDefault();
        const selectedKey = keyMapping[currentY][currentX];
        const selectedElement = childRefs.current[selectedKey];
        if (selectedElement) {
          selectedElement.click();
        }
      }
    };

    if (memoizedQuery && allFilteredData.length > 0) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [keyCoords, keyMapping, memoizedQuery, allFilteredData]);

  const [groupRef, { height: groupHeight }] =
  useElementSizeObserver<HTMLDivElement>();

  return (
    <div className="flex flex-col !pt-0 !pb-[0px] pl-[0px] pr-[0px] gap-y-[10px] max-h-[calc(100vh-220px)] overflow-y-auto">
      {memoizedQuery && allFilteredData.length > 0 && <div
        key={memoizedQuery}
        className="flex flex-col pt-[10px] pb-[15px] pl-[10px] pr-[25px] gap-y-[15px] text-[10px]">
        {allFilteredData.map(({ type, icon, filteredData, filteredGroupData, isBucketMatch }) => {
          const isShowMore = showMore[type] && type !== "Applications";
          
          // Limit chain results when stack results are present and "See more" is not expanded
          const hasStackResults = filteredGroupData && filteredGroupData.length > 0;
          const shouldLimitChains = hasStackResults && !isShowMore && type === "Chains";
          
          // Limit Applications bucket to 20 results unless showMore is true
          const resultsToRender =
            type === "Applications" && !isShowMore
              ? filteredData.slice(0, 20)
              : shouldLimitChains
                ? filteredData.slice(0, 6) // Show fewer chains when stack results are present
                : filteredData;
          
          return (
            <div 
              key={type} 
              className="flex flex-col md:flex-row gap-x-[10px] gap-y-[10px] items-start overflow-y-hidden"
            >
              <div className="flex gap-x-[10px] items-center shrink-0">
                <GTPIcon
                  icon={icon as GTPIconName}
                  size="md"
                  className="max-sm:size-[15px] max-sm:mt-[3px]"
                />
                <div className="text-sm md:w-[120px] font-raleway font-medium leading-[150%] cursor-default max-sm:ml-[-10px] max-sm:mt-[-3px]">
                  {isBucketMatch ? (
                    <OpacityUnmatchedText text={type} query={memoizedQuery || ""} />
                  ) : (
                    <span className="text-white">{type}</span>
                  )}
                </div>
                <div className="w-[6px] h-[6px] bg-[#344240] rounded-full max-sm:mt-[-3px]" />
              </div>
              
              <div className="flex flex-col gap-[5px]">
                {/* Chain results in separate container */}
                {filteredData.length > 0 && (
                  <div className={`overflow-y-hidden ${
                    isShowMore 
                      ? "max-h-full" 
                      : "max-h-[118px] md:max-h-[87px]"
                  }`}>
                    <div className="flex flex-wrap gap-[5px] transition-[max-height] duration-300">
                      {filteredData.map((item) => {
                        const itemKey = getKey(item.label, type);
                        const isSelected = keyCoords.y !== null &&
                          keyCoords.x !== null &&
                          keyMapping[keyCoords.y]?.[keyCoords.x] === itemKey;

                        return (
                          <BucketItem
                            key={itemKey}
                            item={item}
                            itemKey={itemKey}
                            isSelected={isSelected}
                            childRefs={childRefs}
                            lastBucketIndeces={lastBucketIndeces}
                            bucket={type}
                            query={memoizedQuery}
                            showMore={showMore}
                            setShowMore={setShowMore}
                            setKeyboardExpandedStacks={setKeyboardExpandedStacks}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {/* Stack results in separate container */}
                {filteredGroupData && (
                  <div ref={groupRef} className="flex flex-col gap-[5px]">
                    {filteredGroupData.map((group) => {
                      const isShowMore = showMore[`${group.label}::${type}`];
                      
                      return (
                        <div key={group.label} className="flex flex-col gap-[5px]">
                          <div className="text-xxs" style={{ color: '#5A6462' }}>
                            <span>Chains that are part of the &quot;</span>
                            <OpacityUnmatchedText text={group.label} query={memoizedQuery || ""} />
                            <span>&quot;:</span>
                          </div>
                          {/* Stack results in separate container with height constraints */}
                          <div className={`overflow-y-hidden ${
                            isShowMore 
                              ? "max-h-full" 
                              : "max-h-[118px] md:max-h-[87px]"
                          }`}>
                            <div className="flex flex-wrap gap-[5px] transition-[max-height] duration-300">
                              {group.options.map((option) => {
                                const itemKey = getKey(option.label, `${group.label}::${type}`);
                                const isSelected = keyCoords.y !== null &&
                                  keyCoords.x !== null &&
                                  keyMapping[keyCoords.y]?.[keyCoords.x] === itemKey;

                                return (
                                  <BucketItem
                                    key={option.label}
                                    item={option}
                                    itemKey={itemKey}
                                    isSelected={isSelected}
                                    childRefs={childRefs}
                                    lastBucketIndeces={lastBucketIndeces}
                                    bucket={`${group.label}::${type}`}
                                    query={query || ""}
                                    showMore={showMore}
                                    setShowMore={setShowMore}
                                    setKeyboardExpandedStacks={setKeyboardExpandedStacks}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  )
}


const BucketItem = ({
  item,
  itemKey,
  isSelected,
  childRefs,
  lastBucketIndeces,
  bucket,
  query,
  showMore,
  setShowMore,
  setKeyboardExpandedStacks
}: {
  item: any,
  itemKey: string,
  isSelected: boolean,
  childRefs: any,
  lastBucketIndeces: any,
  bucket: string,
  query: string,
  showMore: { [key: string]: boolean },
  setShowMore: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>,
  setKeyboardExpandedStacks: React.Dispatch<React.SetStateAction<Set<string>>>
}) => {
  const isApps = bucket === "Applications";
  
  // Check if this is a stack result (itemKey contains "::")
  const isStackResult = itemKey.includes("::");
  
  // For stack results, check if the item matches the query
  const shouldGreyOut = isStackResult && query && !normalizeString(item.label).includes(normalizeString(query));

  return (
    <Link
      href={lastBucketIndeces[itemKey] && !showMore[bucket] ? isApps ? `/applications?q=${query}&timespan=max` : `` : item.url}
      key={item.label}
      ref={(el) => {
        childRefs.current[itemKey] = el;
      }}

      onClick={(e) => {
        if (lastBucketIndeces[itemKey] && !showMore[bucket]) {
          if (!isApps) {
            setShowMore(prev => ({ ...prev, [bucket]: true }));
          }
          return;
        }
      }}

      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          if (lastBucketIndeces[itemKey] && !showMore[bucket]) {
            if (!isApps) {
              setShowMore(prev => ({ ...prev, [bucket]: true }));
              setKeyboardExpandedStacks(prev => {
                const newSet = new Set(prev);
                newSet.add(itemKey);
                return newSet;
              });
            }
          }
        }
      }}
      className="relative"
    >
      {lastBucketIndeces[itemKey] && !showMore[bucket] && (
        <div className={`absolute inset-[-1px] z-20 pl-[5px] flex items-center justify-start rounded-full whitespace-nowrap ${isSelected ? "underline" : "text-[#5A6462]"} hover:underline bg-[#151A19] text-xxs`}>
          <div>See more...</div>
        </div>
      )}
      <SearchBadge
        className={`!cursor-pointer ${isSelected ? "!bg-[#5A6462]" : ""}`}
        label={
          shouldGreyOut 
            ? <span className="opacity-50">{item.label}</span> // Grey out entire text for unmatched stack results
            : (normalizeString(item.label).startsWith(normalizeString(query)) && normalizeString(item.label) !== normalizeString(query)) ||
              (normalizeString(item.label).includes(normalizeString(query)) && !normalizeString(item.label).startsWith(normalizeString(query)))
              ? <OpacityUnmatchedText text={item.label} query={query} />
              : item.label
        }
        leftIcon={`${item.icon}` as GTPIconName}
        leftIconColor={item.color || "white"}
        rightIcon=""
      />
    </Link>
  )
}

const SearchContainer = ({ children }: { children: React.ReactNode }) => {
  const { allFilteredData } = useSearchBuckets();
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isScreenTall, setIsScreenTall] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  // Calculate total number of results
  const totalResults = allFilteredData.reduce((total, { filteredData }) => total + filteredData.length, 0);

  const showKeyboardShortcuts = query &&
    allFilteredData.length > 0 &&
    isScreenTall &&
    totalResults >= 10;

  // Add a ref to check for overflow
  const contentRef = useRef<HTMLDivElement>(null);

  // Check for overflow when content changes
  useEffect(() => {
    if (contentRef.current) {
      const hasVerticalOverflow = contentRef.current.scrollHeight > contentRef.current.clientHeight;
      setHasOverflow(hasVerticalOverflow);
    }
  }, [allFilteredData, query]);

  // Add effect to check screen height
  useEffect(() => {
    const checkScreenHeight = () => {
      setIsScreenTall(window.innerHeight >= 500);
    };

    // Initial check
    checkScreenHeight();

    // Add listener for resize events
    window.addEventListener('resize', checkScreenHeight);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenHeight);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(event.key)) {
        setPressedKey(event.key);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(event.key)) {
        // Add a delay before resetting the pressed key
        setTimeout(() => {
          setPressedKey(null);
        }, 200); // 200ms delay
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="fixed top-[80px] md:top-[33px] left-[50%] translate-x-[-50%] z-[111] w-[calc(100vw-20px)] md:w-[660px] max-h-[calc(100vh-100px)] p-2.5 bg-[#344240] rounded-[32px] shadow-[0px_0px_50px_0px_rgba(0,0,0,1.00)] flex flex-col justify-start items-center">
      {/* Add a wrapper div that will handle the overflow */}
      <div ref={contentRef} className="w-full flex-1 overflow-hidden flex flex-col min-h-0">
        <div className={`w-full bg-[#151A19] rounded-t-[22px] ${hasOverflow ? 'rounded-bl-[22px]' : 'rounded-b-[22px]'} flex flex-col justify-start items-center gap-2.5 flex-shrink-0`}>
          {children}
        </div>
      </div>
      {/* Keyboard shortcuts will now stay at the bottom */}
      <div className={`flex px-[10px] pt-2 pb-[5px] items-start gap-[15px] self-stretch flex-shrink-0 ${!showKeyboardShortcuts ? 'hidden' : ''} max-sm:hidden`}>
        <div className="flex h-[21px] py-[2px] px-0 items-center gap-[5px]">
          <svg xmlns="http://www.w3.org/2000/svg" width="70" height="21" viewBox="0 0 70 21" fill="none">
            {/* Up arrow */}
            <rect 
              x="24" 
              width="22" 
              height="10" 
              rx="2" 
              fill={pressedKey === 'ArrowUp' ? "#5A6462" : "#151A19"}
            />
            <path 
              d="M32.6708 6.77639L34.5528 3.01246C34.737 2.64394 35.263 2.64394 35.4472 3.01246L37.3292 6.77639C37.4954 7.10884 37.2537 7.5 36.882 7.5H33.118C32.7463 7.5 32.5046 7.10884 32.6708 6.77639Z" 
              fill="#CDD8D3" 
              stroke="#CDD8D3"
            />
            
            {/* Left arrow */}
            <rect 
              y="11" 
              width="22" 
              height="10" 
              rx="2" 
              fill={pressedKey === 'ArrowLeft' ? "#5A6462" : "#151A19"}
            />
            <path 
              d="M12.8336 18.0581L8.33821 16.4715C7.89343 16.3145 7.89343 15.6855 8.33822 15.5285L12.8336 13.9419C13.1589 13.8271 13.5 14.0684 13.5 14.4134L13.5 17.5866C13.5 17.9316 13.1589 18.1729 12.8336 18.0581Z" 
              fill="#CDD8D3" 
              stroke="#CDD8D3"
            />
            
            {/* Right arrow */}
            <rect 
              x="48" 
              y="11" 
              width="22" 
              height="10" 
              rx="2" 
              fill={pressedKey === 'ArrowRight' ? "#5A6462" : "#151A19"}
            />
            <path 
              d="M57.1664 13.9419L61.6618 15.5285C62.1066 15.6855 62.1066 16.3145 61.6618 16.4715L57.1664 18.0581C56.8411 18.1729 56.5 17.9316 56.5 17.5866L56.5 14.4134C56.5 14.0684 56.8411 13.8271 57.1664 13.9419Z" 
              fill="#CDD8D3" 
              stroke="#CDD8D3"
            />
            
            {/* Down arrow */}
            <rect 
              x="24" 
              y="11" 
              width="22" 
              height="10" 
              rx="2" 
              fill={pressedKey === 'ArrowDown' ? "#5A6462" : "#151A19"}
            />
            <path 
              d="M37.3292 14.2236L35.4472 17.9875C35.263 18.3561 34.737 18.3561 34.5528 17.9875L32.6708 14.2236C32.5046 13.8912 32.7463 13.5 33.118 13.5L36.882 13.5C37.2537 13.5 37.4954 13.8912 37.3292 14.2236Z" 
              fill="#CDD8D3" 
              stroke="#CDD8D3"
            />
          </svg>
          <div className="text-[#CDD8D3] font-raleway text-xs font-medium leading-[150%] font-feature-lining font-feature-proportional cursor-default">Move</div>
        </div>
        <div className="flex h-[21px] py-[2px] px-0 items-center gap-[5px] flex-[1_0_0]">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="21" viewBox="0 0 22 21" fill="none">
            <rect 
              y="0.5" 
              width="22" 
              height="20" 
              rx="2" 
              fill={pressedKey === 'Enter' ? "#5A6462" : "#151A19"} 
            />
            <path d="M16 5.5V12.5C16 13.0523 15.5523 13.5 15 13.5H9" stroke="#CDD8D3" stroke-width="2" />
            <path d="M10.3336 15.5581L5.83821 13.9715C5.39343 13.8145 5.39343 13.1855 5.83822 13.0285L10.3336 11.4419C10.6589 11.3271 11 11.5684 11 11.9134L11 15.0866C11 15.4316 10.6589 15.6729 10.3336 15.5581Z" fill="#CDD8D3" stroke="#CDD8D3" />
          </svg>
          <div className="text-[#CDD8D3] font-raleway text-xs font-medium leading-[150%] font-feature-lining font-feature-proportional cursor-default">Select</div>
        </div>
        <div className="w-[7px] h-[8px]"></div>
        <div className="flex h-[21px] py-[2px] px-0 items-center gap-[5px]">
          <div className={`w-[22px] h-[20px] shrink-0 rounded-[2px] flex items-center justify-center ${pressedKey === 'Escape' ? "bg-[#5A6462]" : "bg-[#151A19]"}`}>
            <div className={`w-[22px] h-[20px] shrink-0 rounded-[2px] flex items-center justify-center mt-[1px] text-[#CDD8D3] numbers-xxxs cursor-default ${pressedKey === 'Escape' ? "bg-[#5A6462]" : "bg-[#151A19]"}`}>
              ESC
            </div>
          </div>
          <div className="text-[#CDD8D3] font-raleway text-xs font-medium leading-[150%] font-feature-lining font-feature-proportional cursor-default">Close</div>
        </div>
      </div>
    </div>
  )
}



