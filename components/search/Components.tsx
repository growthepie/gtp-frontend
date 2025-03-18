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
import { ProjectsMetadataProvider, useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import Image from "next/image";
import VerticalScrollContainer from "../VerticalScrollContainer";
import Link from "next/link";

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
    newSearchParams.delete("query");
    // create new url
    let url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;

    window.history.replaceState(null, "", url);
    setDocumentScroll(true);
  }

  if (!isOpen) return null;

  return (
    <ProjectsMetadataProvider useFilteredProjects={true}>
      <SearchBar />
      {/* <SearchContainer>
        <SearchBar />
      </SearchContainer> */}
      <GrayOverlay onClick={handleCloseSearch} />

    </ProjectsMetadataProvider>
  )
}

const SearchBar = () => {
  // const [internalSearch, setInternalSearch] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { AllChainsByKeys } = useMaster();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  const { totalMatches } = useSearchBuckets();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // get existing query params
    let newSearchParams = new URLSearchParams(window.location.search)

    newSearchParams.set("query", e.target.value);

    // create new url
    let url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;

    window.history.replaceState(null, "", url);
  }

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
                <Icon icon="feather:chevron-down" className="w-[16px] h-[16px]" />
              </div>
            ) : (
              <GTPIcon icon="gtp-search" size="md" />
            )}
            <input
              ref={inputRef}
              autoFocus={true}
              autoComplete="off"
              spellCheck={false}
              className={`flex-1 h-full bg-transparent text-white placeholder-[#CDD8D3] border-none outline-none overflow-x-clip`}
              placeholder="Search & Filter"
              value={query}
              onChange={handleSearchChange}
            />
            <div className={`absolute flex items-center gap-x-[10px] right-[20px] text-[8px] text-[#CDD8D3] font-medium ${query.length > 0 ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}>
              <div className="flex items-center px-[15px] h-[24px] border border-[#CDD8D3] rounded-full select-none">
                {totalMatches} {totalMatches === 1 ? "result" : "results"}
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

// we'll create a custom hook to get our search buckets and total matches so we can use the data in more than one place
const useSearchBuckets = () => {
  const { AllChainsByKeys } = useMaster();
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const { ownerProjectToProjectData } = useProjectsMetadata();
  
  // lets get our search buckets in order by figuring out the structure first
  type SearchBucket = {
    label: string;
    icon: GTPIconName;
    options: { label: string; url: string; icon: string, color?: string}[];
  };
  
  // our first bucket is the chains
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

  // we'll bring this outside of the return statement so we can use it more flexibly
  const allFilteredData = useMemo(() => searchBuckets.map(bucket => {
  
    return {
      type: bucket.label,
      icon: bucket.icon,
      filteredData: bucket.options.filter(option => query?.length === 1 ? option.label.toLowerCase().startsWith(query?.toLowerCase() || "") : option.label.toLowerCase().includes(query?.toLowerCase() || ""))
    };
  }).filter(bucket => bucket.filteredData.length > 0), [query, searchBuckets]);

  // Calculate total matches for the counter
  const totalMatches = allFilteredData.reduce((total, { filteredData }) => total + filteredData.length, 0);
  
  return {
    allFilteredData,
    totalMatches
  }
}


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
      className={`flex items-center ${altColoring ? "bg-[#1F2726]" : "bg-[#344240]"} text-[10px] rounded-full h-[24px] pl-[5px] pr-[10px] gap-x-[4px] ${onClick ? "cursor-pointer" : "cursor-default"} ${className}`}
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



  // if (!query || totalMatches === 0) return null;

  return (
    <div className="flex flex-col-reverse md:flex-col !pt-0 !pb-0 pl-[12px] pr-[25px] gap-y-[10px] text-[10px] max-h-[calc(100vh-180px)] overflow-y-auto">
      {query && allFilteredData.length > 0 && <div className="flex flex-col-reverse md:flex-col pt-[10px] pb-[20px] pl-[12px] pr-[25px] gap-y-[10px] text-[10px]">
          {allFilteredData.map(({ type, icon, filteredData }) => {
            // Only render section if there are matching items
            return (
              <div key={type} className="flex flex-col md:flex-row gap-x-[10px] gap-y-[10px] items-start">
                <div className="flex gap-x-[10px] items-center shrink-0">
                    <GTPIcon
                      icon={icon as GTPIconName}
                      size="md"
                    />
                  <div className="text-white text-sm w-[120px]">{type}</div>
                  <div className="w-[6px] h-[6px] bg-[#344240] rounded-full" />
                </div>
                <div className="flex flex-wrap gap-[5px] transition-[max-height] duration-300">
                  {filteredData.map((item) => (
                    <Link href={item.url} key={item.label}>
                      <SearchBadge
                        // onClick={() => { router.push(item.url) }}
                        className="!cursor-pointer"
                        label={item.label}
                        leftIcon={`${item.icon}` as GTPIconName}
                        leftIconColor={item.color || "white"}
                        rightIcon=""
                      />
                    </Link>
                  )).slice(0, 30)}
                </div>
              </div>
        );
      })}
      </div>
    }
    </div>
  )
}

const SearchContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="fixed top-[80px] md:top-[33px] left-[50%] translate-x-[-50%] z-[111] w-[calc(100vw-20px)] md:w-[660px] max-h-[calc(100vh-100px)] p-2.5 bg-[#344240] rounded-[32px] shadow-[0px_0px_50px_0px_rgba(0,0,0,1.00)] inline-flex justify-start items-center gap-[15px]">
      <div className="flex-1 bg-[#151A19] rounded-[22px] flex justify-start items-center gap-2.5">
        {children}
      </div>
    </div>
  )
}