"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
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

      // on 'esc' press, close search
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if(query !== ""){
          handleClearQuery();
        } else {
          handleCloseSearch();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleClearQuery, handleCloseSearch, handleOpenSearch, isOpen, query]);
  
  return (
    <HeaderButton size="xl" className="cursor-pointer group" onClick={() => handleOpenSearch()} ariaLabel="Search">
      <div className="flex items-center">
      <GTPIcon icon="gtp-search" size="md" />
      <div className={`flex items-center justify-end overflow-hidden w-0 group-hover:w-[28px] transition-all duration-200 ${isOpen ? "!w-[28px]" : "w-0"}`}>
      <div className="size-[18px] heading-small-xs font-black rounded-[4px] text-[#344240] bg-[#1F2726] flex items-center justify-center">/</div>
      </div>
      </div>
    </HeaderButton>
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
      <SearchBar />
      {/* <SearchContainer>
        <SearchBar />
      </SearchContainer> */}
      <GrayOverlay onClick={handleCloseSearch} />
    </>
  )
}

const SearchBar = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { AllChainsByKeys } = useMaster();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  const { totalMatches } = useSearchBuckets();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const newValue = input.value;
    const cursorPosition = input.selectionStart;

    // get existing query params
    let newSearchParams = new URLSearchParams(window.location.search)
    newSearchParams.set("query", newValue);

    // create new url
    let url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;
    window.history.replaceState(null, "", url);

    // Restore cursor position after React updates the input
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = cursorPosition;
        inputRef.current.selectionEnd = cursorPosition;
      }
    });
  };

  return (
    <>
      {/* SearchContainer includes the thick border with rounded corners along with the main dark background */}
      <SearchContainer>
        {/* flex-col to make it so the children are stacked vertically */}
        <div className="flex w-full flex-col">
          {/* first child: the search bar w/ Icon and input */}
          <div className="flex w-full gap-x-[10px] items-center bg-[#1F2726] rounded-[22px] h-[44px] p-2.5">
            {query.length > 0 ? (
              <div className="flex items-center justify-center w-[24px] h-[24px]">
                <Icon icon="feather:chevron-down" className="w-[24px] h-[24px]" />
              </div>
            ) : (
              <GTPIcon icon="gtp-search" size="md" />
            )}
            <input
              ref={inputRef}
              autoFocus={true}
              autoComplete="off"
              spellCheck={false}
              className={`flex-1 h-full bg-transparent text-white placeholder-[#CDD8D3] border-none outline-none overflow-x-clip text-md leading-[150%] font-medium font-raleway`}
              placeholder="Search"
              value={query}
              onChange={handleSearchChange}
            />
            <div className={`absolute flex items-center gap-x-[10px] right-[20px] text-[8px] text-[#CDD8D3] font-medium ${query.length > 0 ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}>
              <div className="flex items-center px-[15px] h-[24px] border border-[#CDD8D3] rounded-full select-none">
                <div className="text-xxxs text-[#CDD8D3] font-medium font-raleway">
                  {totalMatches} {totalMatches === 1 ? "result" : "results"}
                </div>
              </div>
              <div
                className="flex flex-1 items-center justify-center cursor-pointer w-[27px] h-[26px]"
                onClick={(e) => {
                  handleSearchChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
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
          <Filters />
        </div>
      </SearchContainer>
    </>
  )
}

// hook to get search buckets and total matches
const useSearchBuckets = () => {
  const { AllChainsByKeys } = useMaster();
  const searchParams = useSearchParams();
  const query = searchParams.get("query")?.trim();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  
  // search buckets structure
  type SearchBucket = {
    label: string;
    icon: GTPIconName;
    options: { label: string; url: string; icon: string, color?: string}[];
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
        ...Object.entries(ownerProjectToProjectData).filter(([owner, project]) => project.logo_path).map(([owner, project]) => ({
          label: project.display_name,
          url: `/applications/${project.owner_project}`,
          icon: `https://api.growthepie.xyz/v1/apps/logos/${project.logo_path}`,
          color: undefined
      }
    ))]
    }
  ], [AllChainsByKeys, ownerProjectToProjectData]);

 
  const allFilteredData = useMemo(() => {
    // Check if the query matches at least 40% of a bucket name from the beginning
    const bucketMatch = query ? searchBuckets.find(bucket => {
      const bucketName = bucket.label.toLowerCase().replace(/\s+/g, '');
      const searchQuery = query.toLowerCase().replace(/\s+/g, '');
      
      // Calculate the minimum length needed (40% of bucket name)
      const minQueryLength = Math.ceil(bucketName.length * 0.4);
      
      // Check if query is long enough and matches from the start
      return searchQuery.length >= minQueryLength && 
             bucketName.startsWith(searchQuery);
    }) : null;

    // Get regular search results
    const regularSearchResults = searchBuckets.map(bucket => {
      const bucketOptions = bucket.options;
      const lowerQuery = query?.toLowerCase() || "";

      // Split into three categories
      const exactMatches = bucketOptions.filter(option => 
        option.label.toLowerCase() === lowerQuery
      );
      
      const startsWithMatches = bucketOptions.filter(option => {
        const lowerLabel = option.label.toLowerCase();
        return lowerLabel !== lowerQuery && // not an exact match
          lowerLabel.startsWith(lowerQuery);
      });

      const containsMatches = bucketOptions.filter(option => {
        const lowerLabel = option.label.toLowerCase();
        return lowerLabel !== lowerQuery && // not an exact match
          !lowerLabel.startsWith(lowerQuery) && // not a starts with match
          lowerLabel.includes(lowerQuery);
      });

      return {
        type: bucket.label,
        icon: bucket.icon,
        filteredData: [...exactMatches, ...startsWithMatches, ...containsMatches],
        isBucketMatch: false
      };
    });

    // Filter out empty buckets from regular results first
    const filteredRegularResults = regularSearchResults.filter(bucket => 
      bucket.filteredData.length > 0
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
          type: bucketMatch.label,
          icon: bucketMatch.icon,
          filteredData: bucketMatch.options,
          isBucketMatch: true
        }]
      : sortedRegularResults;
  }, [query, searchBuckets]);

  // Calculate total matches for the counter
  const totalMatches = allFilteredData.reduce((total, { filteredData }) => total + filteredData.length, 0);
  
  return {
    allFilteredData,
    totalMatches
  }
}

const OpacityUnmatchedText = ({ text, query }: { text: string; query: string }) => {
  // Remove spaces from both text and query for opacity matching
  const normalizedText = text.toLowerCase().replace(/\s+/g, '');
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, '');
  
  let matchedChars = 0;
  // Count how many characters match from the start
  for (let i = 0; i < normalizedQuery.length; i++) {
    if (normalizedText[i] === normalizedQuery[i]) {
      matchedChars++;
    } else {
      break;
    }
  }

  const matchedPart = text.slice(0, matchedChars);
  const unmatchedPart = text.slice(matchedChars);
  
  return (
    <span className="text-sm font-raleway font-medium leading-[150%] text-white">
      <span>{matchedPart}</span>
      <span className="opacity-50">{unmatchedPart}</span>
    </span>
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
    )

  }

  return (
    <div
      className={`flex items-center ${altColoring ? "bg-[#1F2726]" : "bg-[#344240]"} hover:bg-[#5A6462] active:bg-[#5A6462] text-xs rounded-full h-[24px] pl-[5px] pr-[10px] gap-x-[4px] ${onClick ? "cursor-pointer" : "cursor-default"} ${className}`}
      onClick={onClick ? handleClick : undefined}
    >
      {getLeftIcon()}
      {showLabel && (
        <div className="text-[#CDD8D3] leading-[150%] pr-0.5 truncate max-w-[100px]">
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

const Filters = () => {
  const { AllChainsByKeys } = useMaster();
  const [viewportHeight, setViewportHeight] = useState<number>(0);

  useEffect(() => {
    const handleResize = () =>{
      setViewportHeight(window.innerHeight);
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    }
  }, []);

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const { allFilteredData, totalMatches } = useSearchBuckets();

  const router = useRouter();

  return (
    <div className="flex flex-col-reverse md:flex-col !pt-0 !pb-[0px] pl-[0px] pr-[0px] gap-y-[10px] max-h-[calc(100vh-220px)] overflow-y-auto">
      {query && allFilteredData.length > 0 && <div className="flex flex-col-reverse md:flex-col pt-[10px] pb-[15px] pl-[10px] pr-[25px] gap-y-[15px] text-[10px]">
          {allFilteredData.map(({ type, icon, filteredData, isBucketMatch }) => {
            return (
              <div key={type} className="flex flex-col md:flex-row gap-x-[10px] gap-y-[10px] items-start">
                <div className="flex gap-x-[10px] items-center shrink-0">
                    <GTPIcon
                      icon={icon as GTPIconName}
                      size="md"
                    />
                  <div className="text-sm w-[120px] font-raleway font-medium leading-[150%]">
                    {isBucketMatch ? (
                      <OpacityUnmatchedText text={type} query={query || ""} />
                    ) : (
                      <span className="text-white">{type}</span>
                    )}
                  </div>
                  <div className="w-[6px] h-[6px] bg-[#344240] rounded-full" />
                </div>
                <div className="flex flex-wrap gap-[5px] transition-[max-height] duration-300">
                  {filteredData.map((item) => (
                    <Link href={item.url} key={item.label}>
                      <SearchBadge
                        className="!cursor-pointer"
                        label={item.label}
                        leftIcon={`${item.icon}` as GTPIconName}
                        leftIconColor={item.color || "white"}
                        rightIcon=""
                      />
                    </Link>
                  )).slice(0, isBucketMatch ? undefined : 30)}
                </div>
              </div>
            );
          })}
      </div>}
    </div>
  )
}

const SearchContainer = ({ children }: { children: React.ReactNode }) => {
  const { allFilteredData } = useSearchBuckets();
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isScreenTall, setIsScreenTall] = useState(false);
  
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

  return (
    <div className="fixed top-[80px] md:top-[33px] left-[50%] translate-x-[-50%] z-[111] w-[calc(100vw-20px)] md:w-[660px] max-h-[calc(100vh-100px)] p-2.5 bg-[#344240] rounded-[32px] shadow-[0px_0px_50px_0px_rgba(0,0,0,1.00)] flex flex-col justify-start items-center">
      {/* Add a wrapper div that will handle the overflow */}
      <div ref={contentRef} className="w-full flex-1 overflow-hidden flex flex-col min-h-0">
        <div className={`w-full bg-[#151A19] rounded-t-[22px] ${hasOverflow ? 'rounded-bl-[22px]' : 'rounded-b-[22px]'} flex flex-col justify-start items-center gap-2.5 flex-shrink-0`}>
          {children}
        </div>
      </div>
      {/* Keyboard shortcuts will now stay at the bottom */}
      <div className={`flex px-[10px] pt-2 pb-[5px] items-start gap-[15px] self-stretch flex-shrink-0 ${!showKeyboardShortcuts ? 'hidden' : ''}`}>
        <div className="flex h-[21px] py-[2px] px-0 items-center gap-[5px]">
          <svg xmlns="http://www.w3.org/2000/svg" width="70" height="21" viewBox="0 0 70 21" fill="none">
            <rect x="24" width="22" height="10" rx="2" fill="#151A19"/>
            <path d="M32.6708 6.77639L34.5528 3.01246C34.737 2.64394 35.263 2.64394 35.4472 3.01246L37.3292 6.77639C37.4954 7.10884 37.2537 7.5 36.882 7.5H33.118C32.7463 7.5 32.5046 7.10884 32.6708 6.77639Z" fill="#CDD8D3" stroke="#CDD8D3"/>
            <rect y="11" width="22" height="10" rx="2" fill="#151A19"/>
            <path d="M12.8336 18.0581L8.33821 16.4715C7.89343 16.3145 7.89343 15.6855 8.33822 15.5285L12.8336 13.9419C13.1589 13.8271 13.5 14.0684 13.5 14.4134L13.5 17.5866C13.5 17.9316 13.1589 18.1729 12.8336 18.0581Z" fill="#CDD8D3" stroke="#CDD8D3"/>
            <rect x="48" y="11" width="22" height="10" rx="2" fill="#151A19"/>
            <path d="M57.1664 13.9419L61.6618 15.5285C62.1066 15.6855 62.1066 16.3145 61.6618 16.4715L57.1664 18.0581C56.8411 18.1729 56.5 17.9316 56.5 17.5866L56.5 14.4134C56.5 14.0684 56.8411 13.8271 57.1664 13.9419Z" fill="#CDD8D3" stroke="#CDD8D3"/>
            <rect x="24" y="11" width="22" height="10" rx="2" fill="#151A19"/>
            <path d="M37.3292 14.2236L35.4472 17.9875C35.263 18.3561 34.737 18.3561 34.5528 17.9875L32.6708 14.2236C32.5046 13.8912 32.7463 13.5 33.118 13.5L36.882 13.5C37.2537 13.5 37.4954 13.8912 37.3292 14.2236Z" fill="#CDD8D3" stroke="#CDD8D3"/>
          </svg>
          <div className="text-[#CDD8D3] font-raleway text-xs font-medium leading-[150%] font-feature-lining font-feature-proportional">Move</div>
        </div>
        <div className="flex h-[21px] py-[2px] px-0 items-center gap-[5px] flex-[1_0_0]">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="21" viewBox="0 0 22 21" fill="none">
            <rect y="0.5" width="22" height="20" rx="2" fill="#151A19"/>
            <path d="M16 5.5V12.5C16 13.0523 15.5523 13.5 15 13.5H9" stroke="#CDD8D3" stroke-width="2"/>
            <path d="M10.3336 15.5581L5.83821 13.9715C5.39343 13.8145 5.39343 13.1855 5.83822 13.0285L10.3336 11.4419C10.6589 11.3271 11 11.5684 11 11.9134L11 15.0866C11 15.4316 10.6589 15.6729 10.3336 15.5581Z" fill="#CDD8D3" stroke="#CDD8D3"/>
          </svg>
          <div className="text-[#CDD8D3] font-raleway text-xs font-medium leading-[150%] font-feature-lining font-feature-proportional">Select</div>
        </div>
        <div className="w-[7px] h-[8px]"></div>
        <div className="flex h-[21px] py-[2px] px-0 items-center gap-[5px]">
          <div className="w-[22px] h-[20px] shrink-0 rounded-[2px] bg-[#151A19] flex items-center justify-center">
            <div className="w-[22px] h-[20px] shrink-0 rounded-[2px] bg-[#151A19] flex items-center justify-center mt-[1px] text-[#CDD8D3] numbers-xxxs">ESC</div>
          </div>
          <div className="text-[#CDD8D3] font-raleway text-xs font-medium leading-[150%] font-feature-lining font-feature-proportional">Close</div>
        </div>
      </div>
    </div>
  )
}

// when pressing backspace it feels laggy 
  


