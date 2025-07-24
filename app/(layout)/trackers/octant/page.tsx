"use client";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
// import { OctantTable } from "./OctantTable";
import { useEffect, useMemo, useState, useCallback, useRef, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import { EpochData } from "@/app/api/trackers/octant/route";
import ShowLoading from "@/components/layout/ShowLoading";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/layout/Tooltip";
import Address, { AddressIcon } from "@/components/layout/Address";
import moment from "moment";
import Container from "@/components/layout/Container";
import {
  TopRowChild,
  TopRowContainer,
  TopRowParent,
} from "@/components/layout/TopRow";
import Heading from "@/components/layout/Heading";
import ChainSectionHead from "@/components/layout/SingleChains/ChainSectionHead";
import { track } from "@vercel/analytics/react";
import { useMediaQuery } from "usehooks-ts";
import ChainSectionHeadAlt from "@/components/layout/SingleChains/ChainSectionHeadAlt";
import {
  GridTableHeader,
  GridTableHeaderCell,
  GridTableRow,
  GridTableContainer,
} from "@/components/layout/GridTable";
import { min, set } from "lodash";
import VerticalScrollContainer from "@/components/VerticalScrollContainer";
import { MasterResponse } from "@/types/api/MasterResponse";
import { MasterURL, OctantURLs } from "@/lib/urls";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { measureElement, useVirtualizer } from "@tanstack/react-virtual";
import {
  EpochSummary,
  OctantProjectMetadata,
  OctantProjectMetadataOrNone,
  useOctantData,
} from "./OctantDataProvider";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import React from "react";

const useProcessedCommunityData = (
  communityData: any[],
  communityEpoch: number,
  Epochs: any[]
) => {
  return useMemo(() => {
    if (!communityData) return [];
    
    const epochString = Epochs[communityEpoch]?.epoch || "all";
    
    // Pre-process data once instead of in every filter/map operation
    return communityData.map(userData => ({
      ...userData,
      currentEpochData: {
        locked: userData.lockeds[epochString] || 0,
        budget: userData.budget_amounts[epochString] || 0,
        allocation: userData.allocation_amounts[epochString] || 0,
        projectCount: userData.allocated_to_project_counts[epochString] || 0,
        projectKeys: userData.allocated_to_project_keys[epochString] || [],
      }
    }));
  }, [communityData, communityEpoch, Epochs]);
};

const CircleChart = dynamic(
  () => import("../../../../components/layout/CircleChart"),
  {
    loading: () => <p>Loading...</p>,
    ssr: false,
  },
);

const formatNumberMemo = (() => {
  const cache = new Map<string, string>();
  
  return (number: number, decimals?: number): string => {
    const key = `${number}-${decimals}`;
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    let result: string;
    
    if (number === 0) {
      result = "0";
    } else if (Math.abs(number) >= 1e12) {
      result = (number / 1e12).toFixed(2) + "T";
    } else if (Math.abs(number) >= 1e9) {
      result = (number / 1e9).toFixed(2) + "B";
    } else if (Math.abs(number) >= 1e6) {
      result = (number / 1e6).toFixed(2) + "M";
    } else if (Math.abs(number) >= 1e3) {
      const rounded = (number / 1e3).toFixed(2);
      result = `${rounded}k`;
    } else {
      result = number.toFixed(decimals ?? 2);
    }

    // Cache the result (limit cache size to prevent memory leaks)
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(key, result);
    
    return result;
  };
})();

export default function Page() {
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const { data: master } = useSWR<MasterResponse>(MasterURL);
  const {
    summaryData,
    communityData,
    projectMetadataData,

    Epochs,
    communityEpoch,
    setCommunityEpoch,
    handlePrevCommunityEpoch,
    handleNextCommunityEpoch,
    fundingEpoch,
    setFundingEpoch,
    handlePrevFundingEpoch,
    handleNextFundingEpoch,

    communityDataSortedAndFiltered,

    communityTablePage,
    setCommunityTablePage,
    communityTablePageSize,
    setCommunityTablePageSize,
    communityTablePageMax,

    communityUserSelection,
    handleCommunityUserSelection,
    communitySearch,
    setCommunitySearch,
    communityTableSort,
    setCommunityTableSort,
    UserTypes,

    fundingSearch,
    setFundingSearch,
    fundingTableSort,
    setFundingTableSort,

    fundingDataSortedAndFiltered,

    latestProjectMetadatas,
  } = useOctantData();

  const [communityRowsOpen, setCommunityRowsOpen] = useState<string[]>([]);

  const handleCommunityRowToggle = (user: string) => {
    if (communityRowsOpen.includes(user)) {
      setCommunityRowsOpen(communityRowsOpen.filter((u) => u !== user));
    } else {
      setCommunityRowsOpen([...communityRowsOpen, user]);
    }
  };

  const [currentEpoch, setCurrentEpoch] = useState<EpochSummary | null>(null);
  const [nextEpoch, setNextEpoch] = useState<EpochSummary | null>(null);

  const processEpochSummaries = useCallback(() => {
    // iterate over the epochs and find the current and next epoch
    // the currentEpoch should be set to the first epoch where the current time is between the start and end of the epoch Allocation Window
    // the nextEpoch should be set to the first epoch where the current time is before the start of the epoch Allocation Window
    if (!summaryData) return;

    const epochsInfo = summaryData.epochs;

    const now = new Date().getTime() / 1000;

    let curr: string | null = null;
    let next: string | null = null;

    const epochKeys = Object.keys(epochsInfo).sort(
      (a, b) => parseInt(a) - parseInt(b),
    );

    for (let i = 0; i < epochKeys.length; i++) {
      let epoch = epochKeys[i];
      // let epochAllocationStart =
      //   new Date(epochsInfo[epoch].allocationStart).getTime() / 1000;
      // let epochAllocationEnd =
      //   new Date(epochsInfo[epoch].allocationEnd).getTime() / 1000;

      // the incoming data is in UTC, so we need to adjust the time to the local timezone
      let epochAllocationStart = moment
        .utc(epochsInfo[epoch].allocationStart)
        .local()
        .unix();
      let epochAllocationEnd = moment
        .utc(epochsInfo[epoch].allocationEnd)
        .local()
        .unix();

      if (now <= epochAllocationEnd) {
        if (now >= epochAllocationStart && now <= epochAllocationEnd) {
          // console.log(
          //   "curr",
          //   epoch,
          //   "is now",
          //   epochAllocationStart,
          //   now,
          //   epochAllocationEnd,
          // );
          curr = epoch;
          continue;
        } else {
          // console.log(
          //   "next",
          //   epoch,
          //   "is now",
          //   epochAllocationStart,
          //   now,
          //   epochAllocationEnd,
          // );
          next = epoch;
          continue;
        }
      }

      if (curr && next) break;
    }

    let countdownEnd = 0;

    if (next) {
      setNextEpoch(epochsInfo[next]);
      countdownEnd =
        new Date(epochsInfo[next].allocationStart).getTime() / 1000;
    }

    if (curr) {
      setCurrentEpoch(epochsInfo[curr]);
      setCommunityEpoch(parseInt(curr));
      setFundingEpoch(parseInt(curr));
      countdownEnd = new Date(epochsInfo[curr].allocationEnd).getTime() / 1000;
    }

    // console.log("curr", curr, "next", next, "countdownEnd", countdownEnd);

    setCountdownTime(countdownEnd - now + 3600);
  }, [summaryData]);

  useEffect(() => {
    if (!summaryData) return;
    processEpochSummaries();
  }, [processEpochSummaries, summaryData]);

  const EpochStatus = useMemo(() => {
    if (currentEpoch) {
      return (
        <div className="text-[9px]">
          Epoch {currentEpoch.epoch} Allocation ends in
        </div>
      );
    }
    if (nextEpoch) {
      return (
        <div className="text-[9px]">
          Epoch {nextEpoch.epoch} Allocation starts in
        </div>
      );
    }
  }, [currentEpoch, nextEpoch]);

  const [countdownTime, setCountdownTime] = useState<number>(0);

  const JumpToSections = {
    Community: {
      label: "Community",
      icon: "gtp:gtp-users",
      id: "community",
      ref: useRef<HTMLDivElement>(null),
    },
    ProjectFunding: {
      label: "Project Funding",
      icon: "gtp:gtp-project",
      id: "project-funding",
      ref: useRef<HTMLDivElement>(null),
    },
    Fundamentals: {
      label: "Fundamentals",
      icon: "gtp:gtp-fundamentals",
      id: "fundamentals",
      ref: useRef<HTMLDivElement>(null),
    },
    Blockspace: {
      label: "Blockspace",
      icon: "gtp:gtp-package",
      id: "blockspace",
      ref: useRef<HTMLDivElement>(null),
    },
  };

  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyAddressTimeout = useRef<number | null>(null);

  const handleCopyAddress = useCallback((address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);

    if (copyAddressTimeout.current) {
      clearTimeout(copyAddressTimeout.current);
    }

    copyAddressTimeout.current = window.setTimeout(() => {
      setCopiedAddress(null);
    }, 2000);
  }, []);

  const lastFundingEpoch = useMemo(() => {
    return summaryData?.epochs
      ? Object.values(summaryData.epochs)
          .sort((a, b) => b.epoch - a.epoch)
          .filter((epoch) => epoch.has_allocation_started)[0]
          .epoch.toString()
      : "1";
  }, [summaryData]);

  interface VirtualizedListProps {
  communityEpoch: number;
  projectMetadataData: any;
  Epochs: { epoch: string; label: string }[];
  communityDataSortedAndFiltered: any[];
}

const VirtualizedList = React.memo<VirtualizedListProps>(({ 
  communityEpoch, 
  projectMetadataData, 
  Epochs,
  communityDataSortedAndFiltered 
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Memoize the current epoch string to avoid recalculation
  const currentEpochString = useMemo(() => 
    Epochs[communityEpoch]?.epoch || "all", 
    [Epochs, communityEpoch]
  );

  // Memoize processed user data to avoid recalculating on every render
  const processedUserData = useMemo(() => {
    return communityDataSortedAndFiltered.map((userData) => {
      const userLockedEpochs = Object.keys(userData.lockeds).filter(
        (e) => e !== "all"
      );
      
      return {
        user: userData.user,
        locked: userData.lockeds[currentEpochString] || 0,
        min: userData.mins[currentEpochString] || 0,
        max: userData.lockeds[currentEpochString] || 0,
        budget_amount: userData.budget_amounts[currentEpochString] || 0,
        allocation_amount: userData.allocation_amounts[currentEpochString] || 0,
        allocated_to_project_count: userData.allocated_to_project_counts[currentEpochString] || 0,
        allocated_to_project_keys: userData.allocated_to_project_keys[currentEpochString] || [],
        activeSinceEpoch: userLockedEpochs.length > 0 
          ? Math.min(...userLockedEpochs.map((epoch) => parseInt(epoch)))
          : 0,
      };
    });
  }, [communityDataSortedAndFiltered, currentEpochString]);

  // Optimize virtualizer configuration
  const virtualizer = useVirtualizer({
    count: processedUserData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 37,
    overscan: 5, // Reduced from 10 for better performance
    measureElement: (element) => {
      // Enable dynamic measurement if needed
      return element?.getBoundingClientRect().height ?? 37;
    },
  });

  // Memoize the render function for virtual items
  const renderVirtualItem = useCallback((virtualRow: any) => {
    const user = processedUserData[virtualRow.index];
    if (!user) return null;

    return (
      <div
        key={virtualRow.key}
        data-index={virtualRow.index}
        ref={(ref) => virtualizer.measureElement(ref)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          transform: `translateY(${virtualRow.start}px)`,
        }}
      >
        <CommunityTableRow
          key={`${user.user}-${communityEpoch}`} // Better key for re-renders
          user={user}
          communityEpoch={communityEpoch}
          projectMetadataData={projectMetadataData}
          Epochs={Epochs}
        />
      </div>
    );
  }, [processedUserData, virtualizer, communityEpoch, projectMetadataData, Epochs]);

  return (
    <VerticalScrollContainer ref={parentRef} height={250}>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map(renderVirtualItem)}
      </div>
    </VerticalScrollContainer>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

  return (
    <div className="w-full">
      <ShowLoading
        dataLoading={[!summaryData, !communityData, !projectMetadataData]}
      />
      <Container className="flex w-full flex-col @container" isPageRoot>
        <div className="flex w-full flex-col gap-x-[5px] gap-y-[5px] bg-clip-content pb-[30px] md:pb-[60px] lg:flex-row">
          <div className="relative flex lg:col-auto lg:w-[275px] lg:basis-[275px]">
            <ChainSectionHead
              title={"Menu"}
              icon={"gtp:gtp-menu"}
              enableDropdown={false}
              defaultDropdown={true}
              childrenHeight={isMobile ? 97 : 111}
              className="w-full transition-all duration-300 lg:!w-[275px]"
            >
              <div className="relative flex h-[97px] select-none gap-x-[10px] overflow-visible rounded-[15px] bg-forest-50 px-[5px] py-[10px] dark:bg-[#1F2726] lg:h-[111px]">
                <div className="flex min-w-[120px] flex-col justify-between gap-y-[10px]">
                  <ExpandingButtonMenu
                    className={`left-[5px] right-[calc((100%/2)+5px)] top-[10px] lg:right-[calc((100%/2)+5px)] lg:top-[10px]`}
                    button={{
                      label: "Jump to …",
                      icon: "gtp:gtp-jump-to-section",
                      showIconBackground: true,
                    }}
                    items={[
                      {
                        label: "Community",
                        icon: "gtp:gtp-users",
                        href: "#Community",
                      },
                      {
                        label: "Project Funding",
                        icon: "gtp:gtp-project",
                        href: "#ProjectFunding",
                      },
                    ]}
                  />
                  <ExpandingButtonMenu
                    className="absolute left-[5px] right-[calc((100%/2)+5px)] top-[50px] lg:right-[140px] lg:top-[65px]"
                    button={{
                      label: "More",
                      icon: "feather:chevron-right",
                      showIconBackground: false,
                      animateIcon: true,
                    }}
                    items={[
                      {
                        label: "Octant.Build",
                        icon: "feather:external-link",
                        href: "https://octant.build",
                      },
                      {
                        label: "Golem Foundation Blog",
                        icon: "feather:external-link",
                        href: "https://golem.foundation/blog/",
                      },

                      // {
                      //   label: "Octant Docs",
                      //   icon: "feather:external-link",
                      //   href: "https://docs.octant.app/",
                      // },
                      {
                        label: "@GolemFoundation",
                        icon: "ri:twitter-x-fill",
                        href: "https://twitter.com/GolemFoundation",
                      },
                      {
                        label: "@OctantApp",
                        icon: "ri:twitter-x-fill",
                        href: "https://twitter.com/OctantApp",
                      },
                    ]}
                  />
                </div>
                <div className="flex min-w-[90px] flex-1 flex-col justify-between gap-y-[10px]">
                  <Link
                    href={`https://octant.app/`}
                    className="absolute left-[calc((100%/2)+5px)] right-[5px] top-[10px] lg:left-[140px] lg:top-[10px]"
                  >
                    <div className="flex h-[36px] w-full items-center gap-x-[8px] rounded-full bg-forest-50 pl-[6px] pr-[10px] dark:bg-[#263130]">
                      <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-forest-1000">
                        <svg
                          width="27"
                          height="26"
                          viewBox="0 0 27 26"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M13.2939 5.5C18.8365 5.5 20.7939 7.46667 20.7939 13C20.7939 18.5124 18.8039 20.5 13.2939 20.5C7.80026 20.5 5.79395 18.4869 5.79395 13C5.79395 7.49207 7.76754 5.5 13.2939 5.5Z"
                            fill="black"
                          />
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12.7395 13.8787C12.3959 14.6971 11.587 15.2717 10.6439 15.2717C9.3892 15.2717 8.37207 14.2546 8.37207 12.9999C8.37207 11.7452 9.3892 10.7281 10.6439 10.7281C11.587 10.7281 12.3959 11.3028 12.7395 12.1211C13.0982 10.7735 14.262 9.75419 15.6845 9.60975C15.9153 9.58634 16.0328 9.60656 16.0328 9.87615V11.935C16.0328 12.0883 16.004 12.1647 15.6845 12.1647C15.2094 12.1647 14.9036 12.5872 14.9036 12.9999C14.9036 13.4704 15.1783 13.8518 15.6845 13.8518C16.0328 13.8518 16.0328 13.6571 16.0328 13.417V12.432C16.0328 12.2427 16.0994 12.148 16.2769 12.148H17.3618C17.5357 12.148 17.5438 12.1512 17.6437 12.2898C17.6437 12.2898 18.0795 12.8912 18.1555 12.9999C18.2314 13.1086 18.2403 13.1419 18.1555 13.2685C18.0706 13.3952 17.6437 13.9914 17.6437 13.9914C17.5441 14.1321 17.5371 14.1358 17.3618 14.1358H16.5471C16.1224 14.1358 16.0328 14.4297 16.0328 14.6949V16.0527C16.0328 16.3691 15.9768 16.4197 15.6845 16.3901C14.262 16.2457 13.0982 15.2264 12.7395 13.8787ZM11.4012 12.9995C11.4012 13.4177 11.0622 13.7568 10.644 13.7568C10.2257 13.7568 9.88672 13.4177 9.88672 12.9995C9.88672 12.5813 10.2257 12.2422 10.644 12.2422C11.0622 12.2422 11.4012 12.5813 11.4012 12.9995Z"
                            fill="white"
                          />
                        </svg>
                      </div>
                      <div className="truncate text-[14px] font-semibold">
                        Octant App
                      </div>
                    </div>
                  </Link>
                  <Link
                    href={`https://docs.octant.app/`}
                    className="absolute left-[calc((100%/2)+5px)] right-[5px] top-[50px] lg:left-[140px] lg:top-[65px]"
                  >
                    <div className="flex h-[36px] w-full items-center gap-x-[8px] rounded-full bg-forest-50 pl-[6px] pr-[10px] dark:bg-[#263130]">
                      <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-forest-1000">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_12402_20306)">
                            <path
                              d="M7.35644 1.4375C7.0114 1.4375 6.67242 1.51996 6.37348 1.67659L1.78085 4.06281L1.77832 4.06414C1.47933 4.2211 1.23099 4.44679 1.05821 4.71857C0.885436 4.99035 0.794299 5.29866 0.793945 5.61258V10.3874C0.794299 10.7013 0.885436 11.0097 1.05821 11.2814C1.23099 11.5532 1.47933 11.7789 1.77832 11.9359L1.78085 11.9372L6.37207 14.3227L6.37328 14.3233C6.67227 14.48 7.01132 14.5625 7.35644 14.5625C7.70158 14.5625 8.04064 14.48 8.33964 14.3233L8.34082 14.3227L10.2337 13.3392C9.81253 13.1502 9.43841 12.8751 9.13384 12.5361L7.6871 13.2878L7.68457 13.2892C7.58481 13.3415 7.47164 13.3691 7.35644 13.3691C7.24125 13.3691 7.12808 13.3415 7.02832 13.2891L2.43457 10.9023L2.43354 10.9018C2.33433 10.8495 2.25193 10.7745 2.19453 10.6842C2.13699 10.5937 2.10661 10.491 2.10644 10.3865V5.61355C2.10661 5.509 2.13699 5.40632 2.19453 5.3158C2.25193 5.22552 2.33433 5.1505 2.43354 5.0982L2.43457 5.09766L7.02579 2.71218L7.02832 2.71085C7.12808 2.65848 7.24125 2.6309 7.35644 2.6309C7.47164 2.6309 7.5848 2.65848 7.68457 2.71085L12.2783 5.09766L12.2794 5.0982C12.3786 5.1505 12.461 5.22552 12.5184 5.3158C12.5759 5.40639 12.6063 5.50916 12.6064 5.6138V7.22783C13.1086 7.39394 13.5571 7.67807 13.9189 8.04735V5.61258C13.9186 5.29866 13.8275 4.99035 13.6547 4.71857C13.4819 4.44679 13.2336 4.2211 12.9346 4.06413L8.34082 1.67733L8.33945 1.67661C8.0405 1.51996 7.7015 1.4375 7.35644 1.4375Z"
                              fill="url(#paint0_linear_12402_20306)"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M0.884698 5.45315C1.07121 5.19887 1.48379 5.11198 1.80622 5.25907L7.35645 7.79111L12.9067 5.25907C13.2291 5.11198 13.6417 5.19887 13.8282 5.45315C14.0147 5.70744 13.9045 6.03282 13.5821 6.17991L7.69416 8.86602C7.48523 8.96133 7.22766 8.96133 7.01873 8.86602L1.13079 6.17991C0.808366 6.03282 0.698185 5.70744 0.884698 5.45315Z"
                              fill="url(#paint1_linear_12402_20306)"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M7.35645 8C7.87421 8 8.29395 8.46875 8.29395 8.9375V13.625C8.29395 14.0938 7.87421 14.5625 7.35645 14.5625C6.83868 14.5625 6.41895 14.0938 6.41895 13.625V8.9375C6.41895 8.46875 6.83868 8 7.35645 8Z"
                              fill="url(#paint2_linear_12402_20306)"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M11.5752 11.75C12.3518 11.75 12.9814 11.1204 12.9814 10.3438C12.9814 9.5671 12.3518 8.9375 11.5752 8.9375C10.7985 8.9375 10.1689 9.5671 10.1689 10.3438C10.1689 11.1204 10.7985 11.75 11.5752 11.75ZM11.5752 12.6875C12.8696 12.6875 13.9189 11.6382 13.9189 10.3438C13.9189 9.04933 12.8696 8 11.5752 8C10.2808 8 9.23145 9.04933 9.23145 10.3438C9.23145 11.6382 10.2808 12.6875 11.5752 12.6875Z"
                              fill="url(#paint3_linear_12402_20306)"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M12.3756 11.4184C12.5586 11.2353 12.8554 11.2353 13.0385 11.4184L15.1881 13.568C15.3711 13.751 15.3711 14.0478 15.1881 14.2309C15.005 14.4139 14.7082 14.4139 14.5252 14.2309L12.3756 12.0813C12.1925 11.8982 12.1925 11.6014 12.3756 11.4184Z"
                              fill="url(#paint4_linear_12402_20306)"
                            />
                          </g>
                          <defs>
                            <linearGradient
                              id="paint0_linear_12402_20306"
                              x1="7.35645"
                              y1="1.4375"
                              x2="7.35645"
                              y2="14.5625"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#10808C" />
                              <stop offset="1" stopColor="#1DF7EF" />
                            </linearGradient>
                            <linearGradient
                              id="paint1_linear_12402_20306"
                              x1="7.35645"
                              y1="5.1875"
                              x2="7.35645"
                              y2="8.9375"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#10808C" />
                              <stop offset="1" stopColor="#1DF7EF" />
                            </linearGradient>
                            <linearGradient
                              id="paint2_linear_12402_20306"
                              x1="7.35645"
                              y1="14.5625"
                              x2="7.35645"
                              y2="7.63542"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#10808C" />
                              <stop offset="1" stopColor="#1DF7EF" />
                            </linearGradient>
                            <linearGradient
                              id="paint3_linear_12402_20306"
                              x1="11.5752"
                              y1="8"
                              x2="14.7351"
                              y2="12.4425"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#FE5468" />
                              <stop offset="1" stopColor="#FFDF27" />
                            </linearGradient>
                            <linearGradient
                              id="paint4_linear_12402_20306"
                              x1="13.4504"
                              y1="9.87483"
                              x2="12.7875"
                              y2="13.819"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#FE5468" />
                              <stop offset="1" stopColor="#FFDF27" />
                            </linearGradient>
                            <clipPath id="clip0_12402_20306">
                              <rect
                                width="15"
                                height="15"
                                fill="white"
                                transform="translate(0.793945 0.5)"
                              />
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                      <div className="truncate text-[14px] font-semibold">
                        Docs
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </ChainSectionHead>
          </div>

          <div className="min-w-[67px] transition-all duration-300 @container lg:col-auto lg:max-w-[398px] lg:flex-shrink lg:flex-grow lg:basis-[398px] lg:hover:min-w-[398px]">
            <ChainSectionHeadAlt
              title={"Background"}
              icon={"gtp:gtp-backgroundinformation"}
              enableDropdown={isMobile}
              childrenHeight={isMobile ? 200 : 111}
              className={`flex w-full min-w-[67px] flex-1 transition-all duration-300`}
              shadowElement={
                <div className="pointer-events-none absolute -right-[58px] bottom-0 top-0 z-10 w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] opacity-100 transition-all duration-300 group-hover:opacity-0 @[398px]:opacity-0"></div>
              }
            >
              <div
                className={`group relative flex min-h-[111px] flex-col justify-between overflow-hidden rounded-[15px] bg-forest-50 bg-clip-border px-[10px] py-[8px] transition-opacity duration-300 dark:bg-[#1F2726] lg:max-h-[111px]`}
              >
                <div className="pointer-events-none absolute -right-[58px] bottom-0 top-0 z-10 w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] opacity-100 transition-all duration-300 group-hover:opacity-0 @[398px]:opacity-0"></div>
                <div className="flex h-auto w-full flex-col justify-between gap-y-[5px] lg:h-[calc(111px-20px)] lg:w-[378px]">
                  <div className="w-full">
                    <div className="text-xs font-semibold text-[#5A6462]">
                      Background Information
                    </div>
                    <div
                      className={`text-[10px] leading-[150%] md:min-w-[378px] md:max-w-[378px]`}
                    >
                      Octant is a novel platform for experiments in
                      participatory public goods funding, centered on
                      Golem&apos;s native ERC-20 token, GLM. Developed by the
                      Golem Foundation to explore motivations and behaviors that
                      drive engagement in funding public goods, Octant uses
                      recurring funding rounds and rewards active user
                      participation with ETH.
                    </div>
                  </div>
                </div>
              </div>
            </ChainSectionHeadAlt>
          </div>
          <div className="flex flex-shrink flex-grow basis-0 flex-col gap-x-[5px] gap-y-[5px] lg:flex-row">
            <div className="min-w-full transition-all duration-300 @container lg:col-auto lg:min-w-[67px] lg:flex-shrink lg:basis-[294px] lg:hover:min-w-[294px]">
              <ChainSectionHeadAlt
                title={"Community"}
                icon={"gtp:gtp-users"}
                enableDropdown={isMobile}
                childrenHeight={isMobile ? 116 : 111}
                className="w-full min-w-[67px] transition-all duration-300"
                shadowElement={
                  <div className="pointer-events-none absolute -right-[58px] bottom-0 top-0 z-10 w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] opacity-100 transition-all duration-300 group-hover:opacity-0 @[294px]:opacity-0"></div>
                }
              >
                <div className="group relative flex flex-col gap-y-[5px] overflow-hidden">
                  <div className="relative flex min-h-[111px] items-center justify-between gap-x-[5px] overflow-hidden rounded-[15px] bg-forest-50 bg-clip-border px-[5px] py-[10px] dark:bg-[#1F2726] lg:max-h-[111px]">
                    <div className="pointer-events-none absolute -right-[58px] bottom-0 top-0 z-10 w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] opacity-100 transition-all duration-300 group-hover:opacity-0 @[228px]:opacity-0"></div>
                    <div className="flex flex-col pl-[5px]">
                      <div className="text-xs font-semibold text-[#5A6462]">
                        User Wallets with GLM locked
                      </div>
                      <div
                        className={`text-[10px] leading-[150%] md:min-w-[273px] md:max-w-[273px]`}
                      >
                        <div>
                          Amount of wallets owning GLM and locking their tokens
                          in the Octant app to allocate rewards in the next
                          Epoch.
                        </div>
                        <div className="flex w-full justify-between pt-[5px]">
                          <div className="flex h-[43px] w-full items-center justify-center gap-x-[6px] rounded-[11px] bg-[#5A6462] px-[13px] py-[5px]">
                            <svg
                              width="24"
                              height="25"
                              viewBox="0 0 24 25"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g clipPath="url(#clip0_11946_38465)">
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M16.4421 5.69018C16.4421 4.06696 15.0258 2.86958 13.5505 3.24555L3.37656 5.8383C2.31894 6.10783 1.57254 7.11927 1.57254 8.28293V11.5H0.00732422V8.28293C0.00732422 6.3435 1.25133 4.65776 3.01403 4.20855L13.1879 1.6158C15.6468 0.989179 18.0073 2.98481 18.0073 5.69018V8.14938H16.4421V5.69018Z"
                                  fill="url(#paint0_linear_11946_38465)"
                                />
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M18.8645 8.43182H3.15018C2.49927 8.43182 1.97161 8.95076 1.97161 9.59091V20.4091C1.97161 21.0492 2.49927 21.5682 3.15018 21.5682H18.8645C19.5154 21.5682 20.043 21.0492 20.043 20.4091V9.59091C20.043 8.95076 19.5154 8.43182 18.8645 8.43182ZM3.15018 6.5C1.41443 6.5 0.00732422 7.88385 0.00732422 9.59091V20.4091C0.00732422 22.1162 1.41443 23.5 3.15018 23.5H18.8645C20.6002 23.5 22.0073 22.1162 22.0073 20.4091V9.59091C22.0073 7.88385 20.6002 6.5 18.8645 6.5H3.15018Z"
                                  fill="url(#paint1_linear_11946_38465)"
                                />
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M22.0073 14.1667H17.6073L17.6073 15.8333H22.0073V14.1667ZM17.6073 12.5C16.7237 12.5 16.0073 13.2462 16.0073 14.1667V15.8333C16.0073 16.7538 16.7237 17.5 17.6073 17.5H22.4073C23.291 17.5 24.0073 16.7538 24.0073 15.8333V14.1667C24.0073 13.2462 23.291 12.5 22.4073 12.5H17.6073Z"
                                  fill="url(#paint2_linear_11946_38465)"
                                />
                              </g>
                              <defs>
                                <linearGradient
                                  id="paint0_linear_11946_38465"
                                  x1="9.00732"
                                  y1="1.5"
                                  x2="9.00732"
                                  y2="11.5"
                                  gradientUnits="userSpaceOnUse"
                                >
                                  <stop stopColor="#10808C" />
                                  <stop offset="1" stopColor="#1DF7EF" />
                                </linearGradient>
                                <linearGradient
                                  id="paint1_linear_11946_38465"
                                  x1="11.0073"
                                  y1="6.5"
                                  x2="21.249"
                                  y2="25.1337"
                                  gradientUnits="userSpaceOnUse"
                                >
                                  <stop stopColor="#FE5468" />
                                  <stop offset="1" stopColor="#FFDF27" />
                                </linearGradient>
                                <linearGradient
                                  id="paint2_linear_11946_38465"
                                  x1="20.0073"
                                  y1="12.5"
                                  x2="20.0073"
                                  y2="17.5"
                                  gradientUnits="userSpaceOnUse"
                                >
                                  <stop stopColor="#10808C" />
                                  <stop offset="1" stopColor="#1DF7EF" />
                                </linearGradient>
                                <clipPath id="clip0_11946_38465">
                                  <rect
                                    width="24"
                                    height="24"
                                    fill="white"
                                    transform="translate(0.00732422 0.5)"
                                  />
                                </clipPath>
                              </defs>
                            </svg>
                            <div className="flex flex-col items-center pt-[5px]">
                              <div className="text-[20px] font-semibold">
                                {
                                  summaryData?.locked_changes.now
                                    .num_users_locked_glm
                                }
                              </div>
                              <div className="text-xxs">Total Wallets</div>
                            </div>
                          </div>
                          {/* <div className="flex h-[43px] w-[135px] items-center justify-center gap-x-[6px] rounded-[11px] bg-[#5A6462] px-[13px] py-[5px]">
                            <svg
                              width="25"
                              height="25"
                              viewBox="0 0 25 25"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className={`${
                                summaryData &&
                                summaryData.locked_changes.changes
                                  .num_users_locked_glm_change >= 0
                                  ? ""
                                  : "rotate-180"
                              }`}
                            >
                              <g clipPath="url(#clip0_11946_38485)">
                                <path
                                  d="M15.067 15.1489L20.9266 15.1489C23.3019 15.1489 24.5995 12.4851 23.0789 10.7305L15.0525 1.46928C13.9324 0.176906 11.8681 0.176908 10.748 1.46928L2.72159 10.7305C1.20098 12.4851 2.49855 15.1489 4.87383 15.1489L10.7337 15.1489L10.7337 24.5L15.0525 24.5L15.067 15.1489Z"
                                  fill="url(#paint0_linear_11946_38485)"
                                />
                              </g>
                              <defs>
                                {summaryData &&
                                summaryData.locked_changes.changes
                                  .num_users_locked_glm_change >= 0 ? (
                                  <linearGradient
                                    id="paint0_linear_11946_38485"
                                    x1="12.9002"
                                    y1="0.5"
                                    x2="12.9002"
                                    y2="24.5"
                                    gradientUnits="userSpaceOnUse"
                                  >
                                    <stop stopColor="#10808C" />
                                    <stop offset="1" stopColor="#1DF7EF" />
                                  </linearGradient>
                                ) : (
                                  <linearGradient
                                    id="paint0_linear_11946_38485"
                                    x1="12.3604"
                                    y1="0.5"
                                    x2="28.5391"
                                    y2="23.2457"
                                    gradientUnits="userSpaceOnUse"
                                  >
                                    <stop stopColor="#FE5468" />
                                    <stop offset="1" stopColor="#FFDF27" />
                                  </linearGradient>
                                )}
                                <clipPath id="clip0_11946_38485">
                                  <rect
                                    width="24"
                                    height="24"
                                    fill="white"
                                    transform="translate(0.933594 0.5)"
                                  />
                                </clipPath>
                              </defs>
                            </svg>

                            <div className="flex flex-col items-center pt-[5px]">
                              {summaryData && (
                                <div className="text-[20px] font-semibold">
                                  {summaryData.locked_changes.changes
                                    .num_users_locked_glm_change > 0 && "+"}
                                  {summaryData.locked_changes.changes
                                    .num_users_locked_glm_change < 0 && "-"}
                                  {(
                                    summaryData.locked_changes.changes
                                      .num_users_locked_glm_change * 100
                                  ).toFixed(1)}
                                  %
                                </div>
                              )}
                              <div className="text-[9px]">in last week</div>
                            </div>
                          </div> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ChainSectionHeadAlt>
            </div>
            <div className="flex flex-shrink flex-grow basis-0 gap-x-[5px]">
              <div className="min-w-full transition-all duration-300 @container lg:min-w-[67px] lg:max-w-[294px] lg:flex-shrink lg:flex-grow lg:basis-[294px] lg:hover:min-w-[294px] min-[1700px]:min-w-[294px]">
                <ChainSectionHeadAlt
                  title={"Project Funding"}
                  icon={"gtp:gtp-project"}
                  enableDropdown={isMobile}
                  childrenHeight={isMobile ? 116 : 111}
                  className={`min-w-[67px] transition-all duration-300`}
                  shadowElement={
                    <div className="pointer-events-none absolute -right-[58px] bottom-0 top-0 z-10 w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] opacity-100 transition-all duration-300 group-hover:opacity-0 @[232px]:opacity-0"></div>
                  }
                >
                  <div className="group relative flex h-[111px] gap-x-[5px] overflow-hidden rounded-[15px] bg-forest-50 px-[10px] py-[8px] dark:bg-[#1F2726]">
                    <div className="pointer-events-none absolute -right-[58px] bottom-0 top-0 z-10 w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] opacity-100 transition-all duration-300 group-hover:opacity-0 @[232px]:opacity-0"></div>
                    <div className="flex flex-col">
                      <div className="text-xs font-semibold text-[#5A6462]">
                        Total Funding Paid Out
                      </div>
                      <div className={`w-full text-[10px] leading-[150%]`}>
                        <div>
                          Funding paid out over all Epochs from donations and matching.
                        </div>
                        <div className="flex w-full justify-between gap-x-[5px] pt-[5px]">
                          <div className="flex h-[43px] w-[135px] items-center justify-center gap-x-[6px] rounded-[11px] bg-[#5A6462] px-[13px] py-[5px]">
                            <svg
                              width="25"
                              height="25"
                              viewBox="0 0 25 25"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M12.3604 24.5C18.9878 24.5 24.3604 19.1274 24.3604 12.5C24.3604 5.87258 18.9878 0.5 12.3604 0.5C5.73293 0.5 0.360352 5.87258 0.360352 12.5C0.360352 19.1274 5.73293 24.5 12.3604 24.5ZM7.9577 6.1C7.46334 6.1 7.06259 6.50934 7.06259 7.01429C7.06259 7.51923 7.46334 7.92857 7.9577 7.92857H16.9087C17.4031 7.92857 17.8039 7.51923 17.8039 7.01429C17.8039 6.50934 17.4031 6.1 16.9087 6.1H7.9577ZM8.8528 11.5857C8.35845 11.5857 7.9577 11.9951 7.9577 12.5C7.9577 13.0049 8.35845 13.4143 8.8528 13.4143H16.0136C16.508 13.4143 16.9087 13.0049 16.9087 12.5C16.9087 11.9951 16.508 11.5857 16.0136 11.5857H8.8528ZM7.51014 17.0714C7.01579 17.0714 6.61504 17.4808 6.61504 17.9857C6.61504 18.4907 7.01579 18.9 7.51014 18.9H17.3563C17.8507 18.9 18.2514 18.4907 18.2514 17.9857C18.2514 17.4808 17.8507 17.0714 17.3563 17.0714H7.51014Z"
                                fill="url(#paint0_linear_11954_38557)"
                              />
                              <defs>
                                <linearGradient
                                  id="paint0_linear_11954_38557"
                                  x1="12.3604"
                                  y1="0.5"
                                  x2="28.5391"
                                  y2="23.2457"
                                  gradientUnits="userSpaceOnUse"
                                >
                                  <stop stopColor="#FE5468" />
                                  <stop offset="1" stopColor="#FFDF27" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="flex flex-col items-center pt-[5px]">
                              <div className="text-[20px] font-semibold">
                                {summaryData?.total_funding_amount.toFixed(0)}
                                <span className="text-[14px] font-normal">
                                  {" Ξ"}
                                </span>
                              </div>
                              <div className="text-xxs">Total Funded</div>
                            </div>
                          </div>
                          <div className="flex h-[43px] w-[135px] items-center justify-center gap-x-[6px] rounded-[11px] bg-[#5A6462] px-[13px] py-[5px]">
                            <svg
                              width="25"
                              height="25"
                              viewBox="0 0 25 25"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g clipPath="url(#clip0_11954_38563)">
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M10.3715 1.29505C11.5908 0.234984 13.3901 0.234984 14.6095 1.29505L15.6116 2.16618L16.6136 1.29505C17.833 0.234984 19.6323 0.234984 20.8517 1.29505C22.2918 2.54699 22.3762 4.77739 21.0351 6.13766L15.6432 11.6063L15.6116 11.5743L15.58 11.6063L10.1881 6.13766C8.8469 4.77739 8.93136 2.54699 10.3715 1.29505ZM15.6116 9.40007L19.9316 5.0185C20.63 4.31015 20.586 3.14869 19.8361 2.49675C19.2011 1.94474 18.2642 1.94474 17.6292 2.49675L15.6922 4.18069L15.6239 4.26149L15.6116 4.25077L15.5992 4.26149L15.531 4.18069L13.594 2.49675C12.959 1.94474 12.022 1.94474 11.387 2.49675C10.6371 3.14869 10.5931 4.31015 11.2915 5.0185L15.6116 9.40007Z"
                                  fill="url(#paint0_linear_11954_38563)"
                                />
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M20.8153 12.9173C21.8285 12.2604 23.1775 12.3903 24.0385 13.2277C24.9686 14.1323 25.0403 15.5761 24.204 16.5636L20.6139 20.8035C18.632 23.1441 15.6778 24.5 12.5602 24.5H7.89871C5.70834 24.5 3.5873 23.7531 1.90461 22.3894L1.84544 22.3414C1.17453 21.7977 0.786621 20.9922 0.786621 20.1428V17.8129C0.786621 17.5053 0.837612 17.1997 0.93763 16.9079L1.06198 16.5451C1.32534 15.7767 1.91116 15.1528 2.67417 14.8281L6.16486 13.3428C8.94355 12.1605 12.1937 13.1239 13.822 15.6125L13.9334 15.7827C14.3359 16.398 15.1799 16.5712 15.8038 16.1667L20.8153 12.9173ZM22.9035 14.3315C22.5835 14.0203 22.0822 13.9721 21.7057 14.2162L16.6941 17.4656C16.6221 17.5123 16.5487 17.5555 16.4742 17.5952L16.4802 17.604L13.8092 19.3359C13.3258 19.6493 12.7578 19.8165 12.1769 19.8165H6.9395V18.2555H12.1769C12.441 18.2555 12.6991 18.1794 12.9188 18.037L13.6221 17.581C13.2114 17.3575 12.8499 17.0346 12.5792 16.6208L12.4678 16.4506C11.2643 14.6112 8.86203 13.8991 6.80821 14.773L3.31752 16.2583C2.9707 16.4059 2.70442 16.6895 2.58471 17.0388L2.46036 17.4016C2.4149 17.5342 2.39172 17.6731 2.39172 17.8129V20.1428C2.39172 20.5289 2.56804 20.895 2.873 21.1422L2.93217 21.1901C4.3264 22.3201 6.08383 22.9389 7.89871 22.9389H12.5602C15.1982 22.9389 17.6979 21.7916 19.3749 19.8111L22.965 15.5712C23.2758 15.2042 23.2491 14.6677 22.9035 14.3315Z"
                                  fill="url(#paint1_linear_11954_38563)"
                                />
                              </g>
                              <defs>
                                <linearGradient
                                  id="paint0_linear_11954_38563"
                                  x1="15.6116"
                                  y1="0.5"
                                  x2="22.7074"
                                  y2="11.9563"
                                  gradientUnits="userSpaceOnUse"
                                >
                                  <stop stopColor="#FE5468" />
                                  <stop offset="1" stopColor="#FFDF27" />
                                </linearGradient>
                                <linearGradient
                                  id="paint1_linear_11954_38563"
                                  x1="12.7866"
                                  y1="12.5"
                                  x2="12.7866"
                                  y2="24.5"
                                  gradientUnits="userSpaceOnUse"
                                >
                                  <stop stopColor="#10808C" />
                                  <stop offset="1" stopColor="#1DF7EF" />
                                </linearGradient>
                                <clipPath id="clip0_11954_38563">
                                  <rect
                                    width="24"
                                    height="24"
                                    fill="white"
                                    transform="translate(0.786621 0.5)"
                                  />
                                </clipPath>
                              </defs>
                            </svg>
                            <div className="flex flex-col items-center pt-[5px]">
                              <div className="text-[20px] font-semibold">
                                {summaryData?.median_reward_amounts.all?.toFixed(2)}
                                <span className="text-[14px] font-normal">
                                  {" Ξ"}
                                </span>
                              </div>
                              <div className="whitespace-nowrap text-[9px]">
                                Mdn. Project Funding
                              </div>
                            </div> 
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ChainSectionHeadAlt>
              </div>
            </div>
          </div>
        </div>
        <div
          className="flex scroll-mt-8 items-center gap-x-[8px] pb-[15px]"
          ref={JumpToSections.Community.ref}
          id="Community"
        >
          <div className="h-[36px] w-[36px]">
            <Icon icon="gtp:gtp-users" className="h-[36px] w-[36px]" />
          </div>
          <Heading
            className="break-inside-avoid text-[20px] leading-[120%] md:text-[30px]"
            as="h2"
          >
            Community
          </Heading>
        </div>
        <div className="pb-[15px] text-[14px]">
          This is all about the owners of GLM and who have locked their funds in
          Octant. Either donating/allocating or not.
        </div>
        <TopRowContainer
          className={`mb-[15px] flex w-full flex-col-reverse items-center justify-between gap-y-3 rounded-b-[15px] rounded-t-[24px] bg-forest-50 p-[3px] text-xs transition-shadow duration-300 dark:bg-[#1F2726] md:rounded-b-[20px] lg:z-30 lg:h-[54px] lg:flex-row lg:gap-y-0 lg:rounded-full lg:p-[5px]`}
        >
          <TopRowParent>
            <TopRowChild
              isSelected={communityUserSelection === "All"}
              onClick={() => {
                handleCommunityUserSelection("All");
              }}
              style={{}}
              className={`text-[16px] leading-[150%] lg:!px-[15px] lg:!py-[10px]`}
            >
              <span className="hidden sm:block">
                {UserTypes.All.label} (
                {communityData &&
                  communityData.filter(
                    (user) =>
                      user.lockeds[Epochs[communityEpoch].epoch] !== undefined,
                  ).length}
                )
              </span>
              <span className="block text-xs sm:hidden">
                {UserTypes.All.label}
              </span>
            </TopRowChild>
            <TopRowChild
              isSelected={communityUserSelection === "Donating"}
              onClick={() => {
                handleCommunityUserSelection("Donating");
              }}
              style={{}}
              className={`text-[16px] leading-[150%] lg:!px-[15px] lg:!py-[10px]`}
            >
              <span className="hidden sm:block">
                {UserTypes.Donating.label} (
                {communityData &&
                  communityData.filter(
                    (user) =>
                      user.allocation_amounts[Epochs[communityEpoch].epoch] !==
                        undefined &&
                      user.allocation_amounts[Epochs[communityEpoch].epoch] > 0,
                  ).length}
                )
              </span>
              <span className="block text-xs sm:hidden">
                {UserTypes.Donating.label}
              </span>
            </TopRowChild>
          </TopRowParent>
          <div className="relative -my-[1px] flex h-full w-full flex-col lg:h-[44px] lg:w-[271px]">
            <div
              className={`relative flex h-full w-full rounded-full p-[5px] lg:z-30 ${
                isMobile ? "w-full" : "w-[271px]"
              }`}
              style={{
                backgroundColor: "#344240",
              }}
            >
              <div
                className="z-[15] flex h-[34px] w-[54px] items-center justify-center rounded-[40px] bg-forest-50 hover:cursor-pointer dark:bg-[#1F2726]"
                onClick={handlePrevCommunityEpoch}
              >
                <Icon icon="feather:arrow-left" className="h-6 w-6" />
              </div>
              <div className="flex flex-1 flex-col items-center gap-y-[1px] justify-self-center">
                <div
                  className={`flex h-full w-[123px] items-center justify-center gap-x-[5px]`}
                >
                  <div className="truncate overflow-ellipsis whitespace-nowrap text-sm">
                    {Epochs[communityEpoch].label}
                  </div>
                </div>
              </div>
              <div
                className="z-[15] flex h-[34px] w-[54px] items-center justify-center rounded-[40px] bg-forest-50 hover:cursor-pointer dark:bg-[#1F2726]"
                onClick={handleNextCommunityEpoch}
              >
                <Icon icon="feather:arrow-right" className="h-6 w-6" />
              </div>
            </div>
          </div>
        </TopRowContainer>

        <div className="-mr-[32px] hidden flex-col @[960px]:mr-0 @[960px]:flex-row @[960px]:flex-wrap md:flex">
          <div className="w-full @[960px]:w-1/2">
            <div className="pr-[32px]">
              <div className="z-[1] flex min-h-[44px] w-full items-center gap-x-[10px] rounded-[22px] bg-[#1F2726] pr-[10px]">
                <div
                  className={`relative flex items-center justify-center pl-[10px]`}
                >
                  <SearchIcon />
                </div>
                <input
                  // ref={inputRef}
                  className={`h-full flex-1 overflow-x-clip border-none bg-transparent pl-[11px] placeholder-[#CDD8D3] outline-none`}
                  placeholder="Search Wallets"
                  value={communitySearch}
                  onChange={(e) => {
                    setCommunitySearch(e.target.value);
                  }}
                  onKeyUp={(e) => {
                    // if enter is pressed, add the search term to the address filters
                    if (e.key === "Enter" && communitySearch.length > 0) {
                      // handleFilter("address", search);
                      // setSearch("");
                      // e.preventDefault();
                    }
                  }}
                />
                {communitySearch.length > 0 && (
                  <div
                    className="cursor-pointer"
                    onClick={() => setCommunitySearch("")}
                  >
                    <svg
                      width="27"
                      height="26"
                      viewBox="0 0 27 26"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="1"
                        y="1"
                        width="25"
                        height="24"
                        rx="12"
                        stroke="url(#paint0_linear_8794_34411)"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M17.7435 17.2426C18.8688 16.1174 19.5009 14.5913 19.5009 13C19.5009 11.4087 18.8688 9.88258 17.7435 8.75736C16.6183 7.63214 15.0922 7 13.5009 7C11.9096 7 10.3835 7.63214 9.25827 8.75736C8.13305 9.88258 7.50091 11.4087 7.50091 13C7.50091 14.5913 8.13305 16.1174 9.25827 17.2426C10.3835 18.3679 11.9096 19 13.5009 19C15.0922 19 16.6183 18.3679 17.7435 17.2426V17.2426ZM12.4402 10.8787C12.2996 10.738 12.1088 10.659 11.9099 10.659C11.711 10.659 11.5202 10.738 11.3796 10.8787C11.2389 11.0193 11.1599 11.2101 11.1599 11.409C11.1599 11.6079 11.2389 11.7987 11.3796 11.9393L12.4402 13L11.3796 14.0607C11.2389 14.2013 11.1599 14.3921 11.1599 14.591C11.1599 14.7899 11.2389 14.9807 11.3796 15.1213C11.5202 15.262 11.711 15.341 11.9099 15.341C12.1088 15.341 12.2996 15.262 12.4402 15.1213L13.5009 14.0607L14.5616 15.1213C14.7022 15.262 14.893 15.341 15.0919 15.341C15.2908 15.341 15.4816 15.262 15.6222 15.1213C15.7629 14.9807 15.8419 14.7899 15.8419 14.591C15.8419 14.3921 15.7629 14.2013 15.6222 14.0607L14.5616 13L15.6222 11.9393C15.7629 11.7987 15.8419 11.6079 15.8419 11.409C15.8419 11.2101 15.7629 11.0193 15.6222 10.8787C15.4816 10.738 15.2908 10.659 15.0919 10.659C14.893 10.659 14.7022 10.738 14.5616 10.8787L13.5009 11.9393L12.4402 10.8787Z"
                        fill="#CDD8D3"
                      />
                      <defs>
                        <linearGradient
                          id="paint0_linear_8794_34411"
                          x1="13.5"
                          y1="1"
                          x2="29.4518"
                          y2="24.361"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#FE5468" />
                          <stop offset="1" stopColor="#FFDF27" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <GridTableHeader
              gridDefinitionColumns="grid-cols-[20px,minmax(80px,1600px),118px,72px,69px]"
              className="z-[2] select-none gap-x-[15px] !pb-[10px] !pl-[5px] !pr-[46px] !pt-[15px] text-[12px]"
            >
              <div></div>
              <GridTableHeaderCell
                metric="user"
                sort={communityTableSort}
                setSort={setCommunityTableSort}
              >
                Address
              </GridTableHeaderCell>
              <GridTableHeaderCell
                justify="end"
                metric="mins"
                sort={communityTableSort}
                setSort={setCommunityTableSort}
              >
                Amount Locked
              </GridTableHeaderCell>
              <GridTableHeaderCell
                justify="end"
                metric="budget_amounts"
                sort={communityTableSort}
                setSort={setCommunityTableSort}
              >
                Rewards
              </GridTableHeaderCell>
              <GridTableHeaderCell
                justify="end"
                metric="allocation_amounts"
                sort={communityTableSort}
                setSort={setCommunityTableSort}
              >
                Donated
              </GridTableHeaderCell>
            </GridTableHeader>
            <VirtualizedList
              communityDataSortedAndFiltered={communityDataSortedAndFiltered}
              communityEpoch={communityEpoch}
              projectMetadataData={projectMetadataData}
              Epochs={Epochs}
            />
            {/* <div className="flex flex-col justify-between">
              <div className="min-h-[300px] flex flex-col transition-all duration-300">
                {communityDataSortedAndFiltered && communityDataSortedAndFiltered.length > 0 && (
                  communityDataSortedAndFiltered.slice(communityTablePage * communityTablePageSize, communityTablePage * communityTablePageSize + communityTablePageSize).map((userData, index) => {
                    const userLockedEpochs = Object.keys(userData.lockeds).filter((e) => e !== "all");
                    const user = {
                      user: userData.user,
                      locked: userData.lockeds[Epochs[communityEpoch].epoch] || 0,

                      min: userData.lockeds[Epochs[communityEpoch].epoch] || 0,
                      max: userData.lockeds[Epochs[communityEpoch].epoch] || 0,

                      budget_amount: userData.budget_amounts[Epochs[communityEpoch].epoch] || 0,
                      allocation_amount: userData.allocation_amounts[Epochs[communityEpoch].epoch] || 0,
                      allocated_to_project_count: userData.allocated_to_project_counts[Epochs[communityEpoch].epoch] || 0,
                      allocated_to_project_keys: userData.allocated_to_project_keys[Epochs[communityEpoch].epoch] || [],
                      activeSinceEpoch: Math.min(...userLockedEpochs.map((epoch) => parseInt(epoch))),

                    }
                    return (
                      <CommunityTableRow key={index} user={user} communityEpoch={communityEpoch} projectMetadataData={projectMetadataData} Epochs={Epochs} />
                    );
                  })
                )}
              </div>
              <div className="relative pt-[10px] w-full select-none">
                {communityDataSortedAndFiltered.length > communityTablePageSize && (
                  <>
                    <div className="flex w-full justify-center items-center gap-x-[5px] text-[12px] text-[#CDD8D3]">
                      <div className="flex items-center gap-x-[5px]">
                        <div className="hover:cursor-pointer" onClick={() => setCommunityTablePage(0)}>
                          <Icon icon="feather:chevrons-left" className="w-4 h-4" />
                        </div>
                        <div className="hover:cursor-pointer" onClick={() => communityTablePage > 0 ? setCommunityTablePage(communityTablePage - 1) : null}>
                          <Icon icon="feather:chevron-left" className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="w-[160px] flex items-center justify-center gap-x-[5px] text-xs">
                        <div className="text-[12px]">Page</div>
                        <div className="text-[12px]">{communityTablePage + 1}</div>
                        <div className="text-[12px]">of</div>
                        <div className="text-[12px]">{Math.ceil(communityDataSortedAndFiltered.length / communityTablePageSize)}</div>
                      </div>

                      <div className="flex items-center gap-x-[5px]">
                        <div className="hover:cursor-pointer" onClick={() => communityTablePage < Math.floor(communityDataSortedAndFiltered.length / communityTablePageSize) ? setCommunityTablePage(communityTablePage + 1) : null}>
                          <Icon icon="feather:chevron-right" className="w-4 h-4" />
                        </div>
                        <div className="hover:cursor-pointer" onClick={() => setCommunityTablePage(Math.floor(communityDataSortedAndFiltered.length / communityTablePageSize))}>
                          <Icon icon="feather:chevrons-right" className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute -bottom-[24px] w-full h-full flex items-center justify-center gap-x-[5px] text-[12px] text-forest-600">
                      <div className="text-[9px]">Showing</div>
                      <div className="text-[9px]">{(communityTablePage * communityTablePageSize) + 1}</div>
                      <div className="text-[9px]">to</div>
                      <div className="text-[9px]">{Math.min((communityTablePage + 1) * communityTablePageSize, communityDataSortedAndFiltered.length)}</div>
                      <div className="text-[9px]">of</div>
                      <div className="text-[9px]">{communityDataSortedAndFiltered.length}</div>
                    </div>


                  </>
                )}

              </div>


            </div> */}
          </div>
          <style>
            {`
              .one-project {
                fill: url(#gradient1) !important;
              }
              .two-to-five-projects {
                fill: url(#gradient2) !important;
              }
              .more-than-five-projects {
                fill: url(#gradient1) !important;
              }
              .no-projects {
                fill: url(#gradient2) !important;
              }

              .kept-by-wallets {
                fill: url(#gradient2) !important;
              }
              .allocated-to-projects {
                fill: url(#gradient1) !important;
              }
              `}
          </style>
          <svg width={0} height={0}>
            <defs>
              <linearGradient
                id="gradient1"
                x1="100%"
                y1="100%"
                x2="0%"
                y2="0%"
                gradientUnits="objectBoundingBox"
              >
                <stop stopColor="#1DF7EF" />
                <stop offset="0.5" stopColor="#10808C" />
              </linearGradient>
              <linearGradient
                id="gradient2"
                x1="100%"
                y1="100%"
                x2="0%"
                y2="0%"
                gradientUnits="objectBoundingBox"
              >
                <stop stopColor="#FFDF27" />
                <stop offset="0.7" stopColor="#FE5468" />
              </linearGradient>
            </defs>
          </svg>
          <div className="flex w-full flex-col items-center justify-evenly gap-y-[20px] pt-[50px] @[600px]:flex-row @[600px]:gap-y-0 @[960px]:h-[337px] @[960px]:w-1/2 @[960px]:pt-0">
            <div className="h-[250px] w-[250px] overflow-visible">
              <div className="relative -left-[20px] -top-[20px] w-fit">
                <CircleChart
                  title="ALLOCATIONS"
                  data={[
                    {
                      label: "kept by wallets",
                      value: communityDataSortedAndFiltered
                        ? communityDataSortedAndFiltered.reduce((acc, user) => {
                            if (
                              user.budget_amounts[
                                Epochs[communityEpoch].epoch
                              ] === undefined
                            ) {
                              return acc;
                            }
                            let allocation =
                              user.allocation_amounts[
                                Epochs[communityEpoch].epoch
                              ] || 0;
                            let budget =
                              user.budget_amounts[
                                Epochs[communityEpoch].epoch
                              ] || 0;
                            return acc + (budget - allocation);
                          }, 0)
                        : 0,
                      className: "kept-by-wallets",
                    },
                    {
                      label: "allocated to projects",
                      value: communityDataSortedAndFiltered
                        ? communityDataSortedAndFiltered.reduce((acc, user) => {
                            if (
                              user.allocation_amounts[
                                Epochs[communityEpoch].epoch
                              ] === undefined
                            ) {
                              return acc;
                            }
                            return (
                              acc +
                              user.allocation_amounts[
                                Epochs[communityEpoch].epoch
                              ]
                            );
                          }, 0)
                        : 0,
                      className: "allocated-to-projects",
                    },
                  ]}
                  valuePrefix="Ξ"
                />
              </div>
            </div>

            <div className="relative h-[250px] w-[250px] overflow-visible">
              <div className="relative -left-[20px] -top-[20px] w-fit">
                <CircleChart
                  title={["DONATIONS TO", "# OF PROJECTS"]}
                  data={[
                    {
                      label: "1",
                      value: communityDataSortedAndFiltered
                        ? communityDataSortedAndFiltered.filter(
                            (user) =>
                              user.allocated_to_project_keys[
                                Epochs[communityEpoch].epoch
                              ] &&
                              user.allocated_to_project_keys[
                                Epochs[communityEpoch].epoch
                              ].length === 1,
                          ).length
                        : 0,
                      className: "one-project",
                    },
                    {
                      label: "2-5",
                      value: communityDataSortedAndFiltered
                        ? communityDataSortedAndFiltered.filter(
                            (user) =>
                              user.allocated_to_project_keys[
                                Epochs[communityEpoch].epoch
                              ] &&
                              user.allocated_to_project_keys[
                                Epochs[communityEpoch].epoch
                              ].length > 1 &&
                              user.allocated_to_project_keys[
                                Epochs[communityEpoch].epoch
                              ].length <= 5,
                          ).length
                        : 0,
                      className: "two-to-five-projects",
                    },
                    {
                      label: ">5",
                      value: communityDataSortedAndFiltered
                        ? communityDataSortedAndFiltered.filter(
                            (user) =>
                              user.allocated_to_project_keys[
                                Epochs[communityEpoch].epoch
                              ] &&
                              user.allocated_to_project_keys[
                                Epochs[communityEpoch].epoch
                              ].length > 5,
                          ).length
                        : 0,
                      className: "more-than-five-projects",
                    },
                    {
                      label: "0 Projects",
                      value: communityDataSortedAndFiltered
                        ? communityDataSortedAndFiltered.filter(
                            (user) =>
                              user.allocated_to_project_keys[
                                Epochs[communityEpoch].epoch
                              ] &&
                              user.allocated_to_project_keys[
                                Epochs[communityEpoch].epoch
                              ].length === 0,
                          ).length
                        : 0,
                      className: "no-projects",
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
      {/* <Container className="@container flex flex-col w-full">
      </Container> */}
      <Container className="flex w-full flex-col gap-y-[20px] md:hidden">
        <div className="z-[1] flex min-h-[44px] w-full items-center gap-x-[10px] rounded-[22px] bg-[#1F2726] pr-[10px]">
          <div
            className={`relative flex items-center justify-center pl-[10px]`}
          >
            <SearchIcon />
          </div>
          <input
            // ref={inputRef}
            className={`h-full flex-1 overflow-x-clip border-none bg-transparent pl-[11px] placeholder-[#CDD8D3] outline-none`}
            placeholder="Search Wallets"
            value={communitySearch}
            onChange={(e) => {
              setCommunitySearch(e.target.value);
            }}
            onKeyUp={(e) => {
              // if enter is pressed, add the search term to the address filters
              if (e.key === "Enter" && communitySearch.length > 0) {
                // handleFilter("address", search);
                // setSearch("");
                // e.preventDefault();
              }
            }}
          />
          {communitySearch.length > 0 && (
            <div
              className="cursor-pointer"
              onClick={() => setCommunitySearch("")}
            >
              <svg
                width="27"
                height="26"
                viewBox="0 0 27 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="1"
                  y="1"
                  width="25"
                  height="24"
                  rx="12"
                  stroke="url(#paint0_linear_8794_34411)"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M17.7435 17.2426C18.8688 16.1174 19.5009 14.5913 19.5009 13C19.5009 11.4087 18.8688 9.88258 17.7435 8.75736C16.6183 7.63214 15.0922 7 13.5009 7C11.9096 7 10.3835 7.63214 9.25827 8.75736C8.13305 9.88258 7.50091 11.4087 7.50091 13C7.50091 14.5913 8.13305 16.1174 9.25827 17.2426C10.3835 18.3679 11.9096 19 13.5009 19C15.0922 19 16.6183 18.3679 17.7435 17.2426V17.2426ZM12.4402 10.8787C12.2996 10.738 12.1088 10.659 11.9099 10.659C11.711 10.659 11.5202 10.738 11.3796 10.8787C11.2389 11.0193 11.1599 11.2101 11.1599 11.409C11.1599 11.6079 11.2389 11.7987 11.3796 11.9393L12.4402 13L11.3796 14.0607C11.2389 14.2013 11.1599 14.3921 11.1599 14.591C11.1599 14.7899 11.2389 14.9807 11.3796 15.1213C11.5202 15.262 11.711 15.341 11.9099 15.341C12.1088 15.341 12.2996 15.262 12.4402 15.1213L13.5009 14.0607L14.5616 15.1213C14.7022 15.262 14.893 15.341 15.0919 15.341C15.2908 15.341 15.4816 15.262 15.6222 15.1213C15.7629 14.9807 15.8419 14.7899 15.8419 14.591C15.8419 14.3921 15.7629 14.2013 15.6222 14.0607L14.5616 13L15.6222 11.9393C15.7629 11.7987 15.8419 11.6079 15.8419 11.409C15.8419 11.2101 15.7629 11.0193 15.6222 10.8787C15.4816 10.738 15.2908 10.659 15.0919 10.659C14.893 10.659 14.7022 10.738 14.5616 10.8787L13.5009 11.9393L12.4402 10.8787Z"
                  fill="#CDD8D3"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_8794_34411"
                    x1="13.5"
                    y1="1"
                    x2="29.4518"
                    y2="24.361"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#FE5468" />
                    <stop offset="1" stopColor="#FFDF27" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>
      </Container>
      <HorizontalScrollContainer className="flex flex-col md:hidden">
        <GridTableHeader
          gridDefinitionColumns="grid-cols-[20px,minmax(125px,1600px),118px,72px,69px]"
          className="z-[2] select-none gap-x-[15px] !pb-[10px] !pl-[5px] !pr-[16px] !pt-[15px] text-[12px]"
        >
          <div></div>
          <GridTableHeaderCell
            metric="user"
            sort={communityTableSort}
            setSort={setCommunityTableSort}
          >
            Address
          </GridTableHeaderCell>
          <GridTableHeaderCell
            justify="end"
            metric="mins"
            sort={communityTableSort}
            setSort={setCommunityTableSort}
          >
            Amount Locked
          </GridTableHeaderCell>
          <GridTableHeaderCell
            justify="end"
            metric="budget_amounts"
            sort={communityTableSort}
            setSort={setCommunityTableSort}
          >
            Rewards
          </GridTableHeaderCell>
          <GridTableHeaderCell
            justify="end"
            metric="allocation_amounts"
            sort={communityTableSort}
            setSort={setCommunityTableSort}
          >
            Donated
          </GridTableHeaderCell>
        </GridTableHeader>
        <div className="flex flex-col justify-between">
          <div className="flex min-h-[250px] flex-col transition-all duration-300">
            {/* <VerticalScrollContainer height={250} className=""> */}
            {communityDataSortedAndFiltered &&
              communityDataSortedAndFiltered.length > 0 &&
              communityDataSortedAndFiltered
                .slice(
                  communityTablePage * communityTablePageSize,
                  communityTablePage * communityTablePageSize +
                    communityTablePageSize,
                )
                .map((userData, index) => {
                  const userLockedEpochs = Object.keys(userData.lockeds).filter(
                    (e) => e !== "all",
                  );
                  const user = {
                    user: userData.user,
                    locked: userData.lockeds[Epochs[communityEpoch].epoch] || 0,

                    min: userData.lockeds[Epochs[communityEpoch].epoch] || 0,
                    max: userData.lockeds[Epochs[communityEpoch].epoch] || 0,

                    budget_amount:
                      userData.budget_amounts[Epochs[communityEpoch].epoch] ||
                      0,
                    allocation_amount:
                      userData.allocation_amounts[
                        Epochs[communityEpoch].epoch
                      ] || 0,
                    allocated_to_project_count:
                      userData.allocated_to_project_counts[
                        Epochs[communityEpoch].epoch
                      ] || 0,
                    allocated_to_project_keys:
                      userData.allocated_to_project_keys[
                        Epochs[communityEpoch].epoch
                      ] || [],
                    activeSinceEpoch: Math.min(
                      ...userLockedEpochs.map((epoch) => parseInt(epoch)),
                    ),
                  };
                  return (
                    <div key={index} className="pb-[3px]">
                      <GridTableRow
                        gridDefinitionColumns="grid-cols-[20px,minmax(125px,1600px),118px,72px,69px]"
                        className="group inline-grid h-[34px] select-none gap-x-[15px] !pl-[5px] !pr-[15px] text-[12px] transition-all duration-300"
                        onClick={() => {
                          if (communityRowsOpen.includes(user.user)) {
                            setCommunityRowsOpen(
                              communityRowsOpen.filter((u) => u !== user.user),
                            );
                          } else {
                            setCommunityRowsOpen([
                              ...communityRowsOpen,
                              user.user,
                            ]);
                          }
                        }}
                      >
                        <div className="flex items-center justify-center">
                          <div className="relative flex h-[16px] w-[16px] cursor-pointer items-center justify-center rounded-full bg-[#151A19]">
                            {/* <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_12402_20562)">
                              <circle cx="8.29395" cy="8" r="7" stroke="#5A6462" />
                              <path d="M3.67414 6.32422L4.77814 7.86022L4.84214 7.98822L4.91414 7.86022L6.01014 6.32422H6.79414L5.25014 8.42022L6.80214 10.5002H6.01814L4.91414 8.97222L4.84214 8.85222L4.77814 8.97222L3.67414 10.5002H2.89014L4.44214 8.42022L2.89814 6.32422H3.67414Z" fill="#5A6462" />
                              <path d="M7.6557 11.6362C7.72503 11.6416 7.79437 11.6469 7.8637 11.6522C7.93303 11.6629 7.98637 11.6682 8.0237 11.6682C8.10903 11.6682 8.1837 11.6389 8.2477 11.5802C8.3117 11.5216 8.38103 11.4069 8.4557 11.2362C8.5357 11.0709 8.63703 10.8256 8.7597 10.5002L6.9917 6.32422H7.7357L9.1437 9.78822L10.4157 6.32422H11.1117L9.0797 11.5962C9.0317 11.7189 8.9597 11.8336 8.8637 11.9402C8.77303 12.0522 8.6557 12.1402 8.5117 12.2042C8.3677 12.2682 8.19437 12.3002 7.9917 12.3002C7.9437 12.3002 7.89303 12.2976 7.8397 12.2922C7.7917 12.2869 7.73037 12.2762 7.6557 12.2602V11.6362Z" fill="#5A6462" />
                              <path d="M11.4951 10.0442L14.1271 6.83622H11.5671V6.32422H14.9191V6.78022L12.3031 9.98822H14.9271V10.5002H11.4951V10.0442Z" fill="#5A6462" />
                            </g>
                            <defs>
                              <clipPath id="clip0_12402_20562">
                                <rect width="15" height="15" fill="white" transform="translate(0.793945 0.5)" />
                              </clipPath>
                            </defs>
                          </svg> */}
                            <AddressIcon
                              address={user.user}
                              className="rounded-full"
                            />
                            <Icon
                              icon={"gtp:circle-arrow"}
                              className={`absolute -right-[4px] top-[4px] h-[9px] w-[4px]`}
                              style={{
                                transform: `rotate(${
                                  communityRowsOpen.includes(user.user)
                                    ? "90deg"
                                    : "0deg"
                                })`,
                                transformOrigin: "-7px 4px",
                                transition: "transform 0.5s",
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex h-full select-none items-center @container hover:bg-transparent">
                          <span
                            className="flex h-full flex-1 items-center pr-[10px] @container hover:bg-transparent"
                            style={{
                              fontFeatureSettings: "'pnum' on, 'lnum' on",
                            }}
                            // onDoubleClick={(e) => {
                            //   e.preventDefault(); // Prevent default double-click behavior
                            //   const selection = window.getSelection();
                            //   const range = document.createRange();
                            //   range.selectNodeContents(e.currentTarget);
                            //   selection?.removeAllRanges();
                            //   selection?.addRange(range);
                            // }}
                          >
                            <div
                              className="truncate transition-all duration-300"
                              style={{ direction: "ltr" }}
                              onClick={() => {
                                navigator.clipboard.writeText(user.user);
                              }}
                            >
                              {user.user.slice(0, user.user.length - 6)}
                            </div>
                            <div className="transition-all duration-300">
                              {user.user.slice(-6)}
                            </div>
                            <div className="flex gap-x-[10px] pl-[10px]">
                              <div className="">
                                <Icon
                                  icon={
                                    copiedAddress === user.user
                                      ? "feather:check-circle"
                                      : "feather:copy"
                                  }
                                  className="z-[10] h-[14px] w-[14px] cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyAddress(user.user);
                                  }}
                                />
                              </div>
                              <Link
                                href={`https://etherscan.io/address/${user.user}`}
                                passHref
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <g clipPath="url(#clip0_12260_38955)">
                                    <path
                                      d="M6.85644 1.4375C6.5114 1.4375 6.17242 1.51996 5.87348 1.67659L1.28085 4.06281L1.27832 4.06414C0.979329 4.2211 0.730988 4.44679 0.558212 4.71857C0.385436 4.99035 0.294299 5.29866 0.293945 5.61258V10.3874C0.294299 10.7013 0.385436 11.0097 0.558212 11.2814C0.730988 11.5532 0.979329 11.7789 1.27832 11.9359L1.28085 11.9372L5.87207 14.3227L5.87328 14.3233C6.17227 14.48 6.51132 14.5625 6.85644 14.5625C7.20158 14.5625 7.54064 14.48 7.83964 14.3233L7.84082 14.3227L9.73374 13.3392C9.31253 13.1502 8.93841 12.8751 8.63384 12.5361L7.1871 13.2878L7.18457 13.2892C7.08481 13.3415 6.97164 13.3691 6.85644 13.3691C6.74125 13.3691 6.62808 13.3415 6.52832 13.2891L1.93457 10.9023L1.93354 10.9018C1.83433 10.8495 1.75193 10.7745 1.69453 10.6842C1.63699 10.5937 1.60661 10.491 1.60644 10.3865V5.61355C1.60661 5.509 1.63699 5.40632 1.69453 5.3158C1.75193 5.22552 1.83433 5.1505 1.93354 5.0982L1.93457 5.09766L6.52579 2.71218L6.52832 2.71085C6.62808 2.65848 6.74125 2.6309 6.85644 2.6309C6.97164 2.6309 7.0848 2.65848 7.18457 2.71085L11.7783 5.09766L11.7794 5.0982C11.8786 5.1505 11.961 5.22552 12.0184 5.3158C12.0759 5.40639 12.1063 5.50916 12.1064 5.6138V7.22783C12.6086 7.39394 13.0571 7.67807 13.4189 8.04735V5.61258C13.4186 5.29866 13.3275 4.99035 13.1547 4.71857C12.9819 4.44679 12.7336 4.2211 12.4346 4.06413L7.84082 1.67733L7.83945 1.67661C7.5405 1.51996 7.2015 1.4375 6.85644 1.4375Z"
                                      fill="#CDD8D3"
                                    />
                                    <path
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                      d="M0.384698 5.45315C0.571212 5.19887 0.983791 5.11198 1.30622 5.25907L6.85645 7.79111L12.4067 5.25907C12.7291 5.11198 13.1417 5.19887 13.3282 5.45315C13.5147 5.70744 13.4045 6.03282 13.0821 6.17991L7.19416 8.86602C6.98523 8.96133 6.72766 8.96133 6.51873 8.86602L0.630794 6.17991C0.308366 6.03282 0.198185 5.70744 0.384698 5.45315Z"
                                      fill="#CDD8D3"
                                    />
                                    <path
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                      d="M6.85645 8C7.37421 8 7.79395 8.46875 7.79395 8.9375V13.625C7.79395 14.0938 7.37421 14.5625 6.85645 14.5625C6.33868 14.5625 5.91895 14.0938 5.91895 13.625V8.9375C5.91895 8.46875 6.33868 8 6.85645 8Z"
                                      fill="#CDD8D3"
                                    />
                                    <path
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                      d="M11.0752 11.75C11.8518 11.75 12.4814 11.1204 12.4814 10.3438C12.4814 9.5671 11.8518 8.9375 11.0752 8.9375C10.2985 8.9375 9.66895 9.5671 9.66895 10.3438C9.66895 11.1204 10.2985 11.75 11.0752 11.75ZM11.0752 12.6875C12.3696 12.6875 13.4189 11.6382 13.4189 10.3438C13.4189 9.04933 12.3696 8 11.0752 8C9.78078 8 8.73145 9.04933 8.73145 10.3438C8.73145 11.6382 9.78078 12.6875 11.0752 12.6875Z"
                                      fill="#CDD8D3"
                                    />
                                    <path
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                      d="M11.8756 11.4184C12.0586 11.2353 12.3554 11.2353 12.5385 11.4184L14.6881 13.568C14.8711 13.751 14.8711 14.0478 14.6881 14.2309C14.505 14.4139 14.2082 14.4139 14.0252 14.2309L11.8756 12.0813C11.6925 11.8982 11.6925 11.6014 11.8756 11.4184Z"
                                      fill="#CDD8D3"
                                    />
                                  </g>
                                  <defs>
                                    <clipPath id="clip0_12260_38955">
                                      <rect
                                        width="15"
                                        height="15"
                                        fill="white"
                                        transform="translate(0.293945 0.5)"
                                      />
                                    </clipPath>
                                  </defs>
                                </svg>
                              </Link>
                            </div>
                          </span>
                        </div>
                        <div className="flex items-center justify-end whitespace-nowrap">
                          {communityEpoch != 0 && user.min > 0 ? (
                            <div className="text-[#CDD8D3]">
                              {formatNumberMemo(user.min, 2)}{" "}
                              {/* {user.min.toLocaleString("en-GB", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} */}
                              <span className="text-[0.55rem] opacity-60">
                                GLM
                              </span>
                            </div>
                          ) : (
                            <div className="text-[#CDD8D3]">-</div>
                          )}
                        </div>
                        <div
                          className={`flex items-center justify-end whitespace-nowrap ${
                            user.budget_amount < 0.01 && "text-[11px]"
                          }`}
                        >
                          {user.budget_amount > 0 ? (
                            <div className="text-[#CDD8D3]">
                              {user.budget_amount.toLocaleString("en-GB", {
                                minimumFractionDigits:
                                  user.budget_amount < 0.01 ? 4 : 2,
                                maximumFractionDigits:
                                  user.budget_amount < 0.01 ? 5 : 2,
                              })}{" "}
                              <span className="text-[0.55rem] opacity-60">
                                ETH
                              </span>
                            </div>
                          ) : (
                            <div className="text-[#CDD8D3]">-</div>
                          )}
                        </div>
                        <div
                          className={`flex items-center justify-end whitespace-nowrap ${
                            user.allocation_amount < 0.01 && "text-[11px]"
                          }`}
                        >
                          {user.allocation_amount > 0 ? (
                            <div className="text-[#CDD8D3]">
                              {user.allocation_amount.toLocaleString("en-GB", {
                                minimumFractionDigits:
                                  user.allocation_amount < 0.01 ? 4 : 2,
                                maximumFractionDigits:
                                  user.allocation_amount < 0.01 ? 5 : 2,
                              })}{" "}
                              <span className="text-[0.55rem] opacity-60">
                                ETH
                              </span>
                            </div>
                          ) : (
                            <div className="text-[#CDD8D3]">-</div>
                          )}
                        </div>
                      </GridTableRow>
                      <div className="pl-[13px] pr-[15px]">
                        <div
                          className={`flex flex-col rounded-b-[15px] border-x border-b border-dotted border-[#CDD8D3]/30 bg-[#1F2726] transition-all duration-300 ${
                            communityRowsOpen.includes(user.user)
                              ? "max-h-[300px] min-h-[80px] opacity-100"
                              : "max-h-0 min-h-0 opacity-0"
                          } overflow-hidden`}
                        >
                          <div className="flex flex-col gap-y-[6px] p-[15px] text-[12px]">
                            <div className="flex items-center justify-between">
                              <div>
                                Active Since:{" "}
                                <span className="font-semibold">
                                  Epoch {user.activeSinceEpoch}
                                </span>
                              </div>
                              <div className="flex items-center gap-x-[5px]">
                                <div>
                                  Donated{" "}
                                  <span className="font-semibold">
                                    {user.allocation_amount.toLocaleString(
                                      "en-GB",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )}{" "}
                                    ETH
                                  </span>
                                </div>
                                <div className="flex w-[133px] flex-col">
                                  <div className="flex justify-between text-[10px]">
                                    <div>
                                      {(
                                        (user.allocation_amount /
                                          user.budget_amount) *
                                        100
                                      ).toFixed(2)}
                                      %
                                    </div>
                                    <div>
                                      {(
                                        ((user.budget_amount -
                                          user.allocation_amount) /
                                          user.budget_amount) *
                                        100
                                      ).toFixed(2)}
                                      %
                                    </div>
                                  </div>
                                  <div className="flex h-[4px] w-full">
                                    <div
                                      className="h-full rounded-l-full"
                                      style={{
                                        background:
                                          "linear-gradient(0deg,#1DF7EF 0%,#10808C 100%)",
                                        width: `${
                                          (user.allocation_amount /
                                            user.budget_amount) *
                                          100
                                        }%`,
                                      }}
                                    ></div>
                                    <div
                                      className="h-full rounded-r-full"
                                      style={{
                                        background:
                                          "linear-gradient(-3deg,#FFDF27 0%,#FE5468 100%)",
                                        width: `${
                                          ((user.budget_amount -
                                            user.allocation_amount) /
                                            user.budget_amount) *
                                          100
                                        }%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                                <div>
                                  <span className="font-semibold">
                                    {(
                                      user.budget_amount -
                                      user.allocation_amount
                                    ).toLocaleString("en-GB", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}{" "}
                                    ETH
                                  </span>{" "}
                                  Kept
                                </div>
                              </div>
                            </div>
                            {user.allocated_to_project_keys.length > 0 ? (
                              <div className="flex flex-col gap-y-[5px]">
                                <div>
                                  Wallet donated to{" "}
                                  <span className="font-semibold">
                                    {user.allocated_to_project_keys.length}
                                  </span>{" "}
                                  projects:
                                </div>
                                <div className="flex flex-wrap gap-x-[5px] gap-y-[5px]">
                                  {user.allocated_to_project_keys.map(
                                    (project_key, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-x-[5px] rounded-[15px] bg-[#344240] py-[0px] pl-[0px] pr-[6px] text-[10px]"
                                      >
                                        {communityEpoch === 0 ? (
                                          <div className="h-6 w-6 overflow-hidden rounded-full border border-forest-900/20 dark:border-forest-500/20">
                                            {projectMetadataData &&
                                              projectMetadataData[
                                                project_key
                                              ] &&
                                              Object.entries(
                                                projectMetadataData[
                                                  project_key
                                                ],
                                              )
                                                .sort(
                                                  (
                                                    [aKey, aValue],
                                                    [bKey, bValue],
                                                  ) =>
                                                    parseInt(bKey) -
                                                    parseInt(aKey),
                                                )
                                                .slice(1)
                                                .map(([key, md], i: number) => (
                                                  <Image
                                                    key={i + key}
                                                    src={`https://ipfs.io/ipfs/${md.profile_image_medium}`}
                                                    alt={md.name}
                                                    width={24}
                                                    height={24}
                                                    className="rounded-full"
                                                  />
                                                ))}
                                          </div>
                                        ) : (
                                          <div className="h-6 w-6 overflow-hidden rounded-full border border-forest-900/20 dark:border-forest-500/20">
                                            {projectMetadataData &&
                                              projectMetadataData[project_key][
                                                Epochs[communityEpoch].epoch
                                              ] && (
                                                <Image
                                                  src={`https://ipfs.io/ipfs/${
                                                    projectMetadataData[
                                                      project_key
                                                    ][
                                                      Epochs[communityEpoch]
                                                        .epoch
                                                    ].profile_image_medium
                                                  }`}
                                                  alt={
                                                    projectMetadataData[
                                                      project_key
                                                    ][
                                                      Epochs[communityEpoch]
                                                        .epoch
                                                    ].name
                                                  }
                                                  width={24}
                                                  height={24}
                                                  className="rounded-full"
                                                />
                                              )}
                                          </div>
                                        )}
                                        {project_key}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>No donations made to any projects.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
          {/* </VerticalScrollContainer> */}
        </div>
      </HorizontalScrollContainer>
      <Container className="flex w-full flex-col gap-y-[20px] md:hidden">
        {/* pagination */}
        <div className="relative w-full select-none pt-[10px]">
          {communityDataSortedAndFiltered.length > communityTablePageSize && (
            <>
              <div className="flex w-full items-center justify-center gap-x-[5px] text-[12px] text-[#CDD8D3]">
                <div className="flex items-center gap-x-[5px]">
                  <div
                    className="hover:cursor-pointer"
                    onClick={() => setCommunityTablePage(0)}
                  >
                    <Icon icon="feather:chevrons-left" className="h-4 w-4" />
                  </div>
                  <div
                    className="hover:cursor-pointer"
                    onClick={() =>
                      communityTablePage > 0
                        ? setCommunityTablePage(communityTablePage - 1)
                        : null
                    }
                  >
                    <Icon icon="feather:chevron-left" className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex w-[160px] items-center justify-center gap-x-[5px] text-xs">
                  <div className="text-[12px]">Page</div>
                  <div className="text-[12px]">{communityTablePage + 1}</div>
                  <div className="text-[12px]">of</div>
                  <div className="text-[12px]">
                    {Math.ceil(
                      communityDataSortedAndFiltered.length /
                        communityTablePageSize,
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-x-[5px]">
                  <div
                    className="hover:cursor-pointer"
                    onClick={() =>
                      communityTablePage <
                      Math.floor(
                        communityDataSortedAndFiltered.length /
                          communityTablePageSize,
                      )
                        ? setCommunityTablePage(communityTablePage + 1)
                        : null
                    }
                  >
                    <Icon icon="feather:chevron-right" className="h-4 w-4" />
                  </div>
                  <div
                    className="hover:cursor-pointer"
                    onClick={() =>
                      setCommunityTablePage(
                        Math.floor(
                          communityDataSortedAndFiltered.length /
                            communityTablePageSize,
                        ),
                      )
                    }
                  >
                    <Icon icon="feather:chevrons-right" className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-[24px] flex h-full w-full items-center justify-center gap-x-[5px] text-[12px] text-forest-600">
                <div className="text-[9px]">Showing</div>
                <div className="text-[9px]">
                  {communityTablePage * communityTablePageSize + 1}
                </div>
                <div className="text-[9px]">to</div>
                <div className="text-[9px]">
                  {Math.min(
                    (communityTablePage + 1) * communityTablePageSize,
                    communityDataSortedAndFiltered.length,
                  )}
                </div>
                <div className="text-[9px]">of</div>
                <div className="text-[9px]">
                  {communityDataSortedAndFiltered.length}
                </div>
              </div>
            </>
          )}
        </div>
      </Container>
      <Container className="@container">
        <div
          className="flex scroll-mt-8 items-center gap-x-[8px] pb-[15px] pt-[60px]"
          ref={JumpToSections.ProjectFunding.ref}
          id="ProjectFunding"
        >
          <div className="h-[36px] w-[36px]">
            <Icon icon="gtp:gtp-project" className="h-[36px] w-[36px]" />
          </div>
          <Heading
            className="break-inside-avoid text-[20px] leading-[120%] md:text-[30px]"
            as="h2"
          >
            Project Funding
          </Heading>
        </div>
        <div className="pb-[15px] text-[14px]">
          These are all the projects that can participate in the current round
          of Octant. There are a maximum of 30 projects voted in for this Epoch.
        </div>

        <TopRowContainer
          className={`mb-[15px] flex w-full flex-col-reverse items-center justify-between gap-y-3 rounded-b-[15px] rounded-t-[24px] bg-forest-50 p-[3px] text-xs transition-shadow duration-300 dark:bg-[#1F2726] md:rounded-b-[20px] lg:z-30 lg:h-[54px] lg:flex-row lg:gap-y-0 lg:rounded-full lg:p-[5px]`}
        >
          <TopRowParent className="flex !w-full flex-col !items-center px-[15px] py-[5px] leading-[120%] md:!w-fit md:!items-start">
            {/* <div className="text-[9px]">Next Epoch starts in</div>
            <div className="font-bold text-[16px]">{moment("2024-10-13T16:00:00Z").diff(moment(), "days")} days</div> */}
            {EpochStatus}
            <div className="text-[16px] font-bold">
              {/* {countdownTimeFormatted}
               */}
              <CountdownTimer time={countdownTime} />
            </div>
          </TopRowParent>
          <div className="relative -my-[1px] flex h-full w-full flex-col lg:h-[44px] lg:w-[271px]">
            <div
              className={`relative flex h-full w-full rounded-full p-[5px] lg:z-30 ${
                isMobile ? "w-full" : "w-[271px]"
              }`}
              style={{
                backgroundColor: "#344240",
              }}
            >
              <div
                className="z-[15] flex h-[34px] w-[54px] items-center justify-center rounded-[40px] bg-forest-50 hover:cursor-pointer dark:bg-[#1F2726]"
                onClick={handlePrevFundingEpoch}
              >
                <Icon icon="feather:arrow-left" className="h-6 w-6" />
              </div>
              <div className="flex flex-1 flex-col items-center gap-y-[1px] justify-self-center">
                <div
                  className={`flex h-full w-[123px] items-center justify-center gap-x-[5px]`}
                >
                  <div className="truncate overflow-ellipsis whitespace-nowrap text-sm">
                    {Epochs[fundingEpoch].label}
                  </div>
                </div>
              </div>
              <div
                className="z-[15] flex h-[34px] w-[54px] items-center justify-center rounded-[40px] bg-forest-50 hover:cursor-pointer dark:bg-[#1F2726]"
                onClick={handleNextFundingEpoch}
              >
                <Icon icon="feather:arrow-right" className="h-6 w-6" />
              </div>
            </div>
          </div>
        </TopRowContainer>
        <div className="z-[1] flex min-h-[44px] w-full items-center gap-x-[10px] rounded-[22px] bg-[#1F2726] pr-[10px]">
          <div
            className={`relative flex items-center justify-center pl-[10px]`}
          >
            <SearchIcon />
          </div>
          <input
            // ref={inputRef}
            className={`h-full flex-1 overflow-x-clip border-none bg-transparent pl-[11px] placeholder-[#CDD8D3] outline-none`}
            placeholder="Find Project"
            value={fundingSearch}
            onChange={(e) => {
              setFundingSearch(e.target.value);
            }}
            onKeyUp={(e) => {
              // if enter is pressed, add the search term to the address filters
              if (e.key === "Enter" && fundingSearch.length > 0) {
                // handleFilter("address", search);
                // setSearch("");
                // e.preventDefault();
              }
            }}
          />
          {fundingSearch.length > 0 && (
            <div
              className="cursor-pointer"
              onClick={() => setFundingSearch("")}
            >
              <svg
                width="27"
                height="26"
                viewBox="0 0 27 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="1"
                  y="1"
                  width="25"
                  height="24"
                  rx="12"
                  stroke="url(#paint0_linear_8794_34411)"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M17.7435 17.2426C18.8688 16.1174 19.5009 14.5913 19.5009 13C19.5009 11.4087 18.8688 9.88258 17.7435 8.75736C16.6183 7.63214 15.0922 7 13.5009 7C11.9096 7 10.3835 7.63214 9.25827 8.75736C8.13305 9.88258 7.50091 11.4087 7.50091 13C7.50091 14.5913 8.13305 16.1174 9.25827 17.2426C10.3835 18.3679 11.9096 19 13.5009 19C15.0922 19 16.6183 18.3679 17.7435 17.2426V17.2426ZM12.4402 10.8787C12.2996 10.738 12.1088 10.659 11.9099 10.659C11.711 10.659 11.5202 10.738 11.3796 10.8787C11.2389 11.0193 11.1599 11.2101 11.1599 11.409C11.1599 11.6079 11.2389 11.7987 11.3796 11.9393L12.4402 13L11.3796 14.0607C11.2389 14.2013 11.1599 14.3921 11.1599 14.591C11.1599 14.7899 11.2389 14.9807 11.3796 15.1213C11.5202 15.262 11.711 15.341 11.9099 15.341C12.1088 15.341 12.2996 15.262 12.4402 15.1213L13.5009 14.0607L14.5616 15.1213C14.7022 15.262 14.893 15.341 15.0919 15.341C15.2908 15.341 15.4816 15.262 15.6222 15.1213C15.7629 14.9807 15.8419 14.7899 15.8419 14.591C15.8419 14.3921 15.7629 14.2013 15.6222 14.0607L14.5616 13L15.6222 11.9393C15.7629 11.7987 15.8419 11.6079 15.8419 11.409C15.8419 11.2101 15.7629 11.0193 15.6222 10.8787C15.4816 10.738 15.2908 10.659 15.0919 10.659C14.893 10.659 14.7022 10.738 14.5616 10.8787L13.5009 11.9393L12.4402 10.8787Z"
                  fill="#CDD8D3"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_8794_34411"
                    x1="13.5"
                    y1="1"
                    x2="29.4518"
                    y2="24.361"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#FE5468" />
                    <stop offset="1" stopColor="#FFDF27" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>
      </Container>
      <HorizontalScrollContainer className="@container">
        <GridTableHeader
          gridDefinitionColumns="grid-cols-[20px,250px,minmax(125px,1600px),95px,126px,101px,89px]"
          className="z-[2] w-full select-none gap-x-[15px] !pb-[10px] !pl-[5px] !pr-[48px] !pt-[15px] text-[12px]"
        >
          <div></div>
          <GridTableHeaderCell
            metric="project"
            sort={fundingTableSort}
            setSort={setFundingTableSort}
          >
            Owner Project
          </GridTableHeaderCell>
          <GridTableHeaderCell
            // justify="end"
            metric="address"
            sort={fundingTableSort}
            setSort={setFundingTableSort}
          >
            Wallet Address
          </GridTableHeaderCell>
          <GridTableHeaderCell
            justify="end"
            metric="donor_counts"
            sort={fundingTableSort}
            setSort={setFundingTableSort}
          >
            Donors
          </GridTableHeaderCell>
          <GridTableHeaderCell
            justify="end"
            metric="allocations"
            sort={fundingTableSort}
            setSort={setFundingTableSort}
          >
            Wallet Donations
          </GridTableHeaderCell>
          <GridTableHeaderCell
            justify="end"
            metric="matched_rewards"
            sort={fundingTableSort}
            setSort={setFundingTableSort}
          >
            Octant Match
          </GridTableHeaderCell>
          <GridTableHeaderCell
            justify="end"
            metric="total"
            sort={fundingTableSort}
            setSort={setFundingTableSort}
          >
            Epoch Total
          </GridTableHeaderCell>
          {/* <GridTableHeaderCell
            justify="end"
            metric="all_time_total"
            sort={fundingTableSort}
            setSort={setFundingTableSort}
          >
            All Time Total
          </GridTableHeaderCell> */}
        </GridTableHeader>
        <VerticalScrollContainer height={600} className="">
          <div className="flex flex-col gap-y-[3px]">
            {master &&
              latestProjectMetadatas &&
              fundingDataSortedAndFiltered &&
              fundingDataSortedAndFiltered
                .filter((fundingRow) => {
                  if (fundingEpoch === 0) return true;

                  return (
                    projectMetadataData &&
                    projectMetadataData[fundingRow.project_key] !== undefined
                  );
                })
                .map((fundingRow, index) => {
                  const project_key = fundingRow.project_key;
                  const lastEpoch = projectMetadataData
                    ? Object.keys(projectMetadataData[project_key])
                        .filter((e) => e != "all")
                        .map((e) => parseInt(e))
                        .sort((a, b) => b - a)[0]
                    : 0;
                  const lastEpochProjectMetadata = latestProjectMetadatas[
                    project_key
                  ] || null;
                  const project: {
                    project_key: string;
                    owner_project: string;
                    project_metadata: OctantProjectMetadataOrNone;
                    address: string;
                    donors: number;
                    allocation: number;
                    matched: number;
                    total: number;
                    all_time_total: number;
                    last_funding_epoch: string;
                  } = {
                    project_key: project_key,
                    owner_project:
                      projectMetadataData &&
                      projectMetadataData[fundingRow.project_key] &&
                      projectMetadataData[fundingRow.project_key][
                        Epochs[fundingEpoch].epoch
                      ]
                        ? projectMetadataData[fundingRow.project_key][
                            Epochs[fundingEpoch].epoch
                          ].name
                        : "",
                    project_metadata:
                      projectMetadataData &&
                      projectMetadataData[fundingRow.project_key] &&
                      projectMetadataData[fundingRow.project_key][
                        Epochs[fundingEpoch].epoch
                      ]
                        ? projectMetadataData[fundingRow.project_key][
                            Epochs[fundingEpoch].epoch
                          ]
                        : lastEpochProjectMetadata,
                    //@ts-ignore
                    address:
                      projectMetadataData &&
                      projectMetadataData[fundingRow.project_key][
                        Epochs[fundingEpoch].epoch
                      ]
                        ? projectMetadataData[fundingRow.project_key][
                            Epochs[fundingEpoch].epoch
                          ].address
                        : lastEpochProjectMetadata?.address || "",
                    donors:
                      fundingRow.donor_counts[Epochs[fundingEpoch].epoch] || 0,
                    allocation:
                      fundingRow.allocations[Epochs[fundingEpoch].epoch] || 0,
                    matched:
                      fundingRow.matched_rewards[Epochs[fundingEpoch].epoch] ||
                      0,
                    total:
                      fundingRow.total[Epochs[fundingEpoch].epoch] ||
                      0 +
                        fundingRow.matched_rewards[
                          Epochs[fundingEpoch].epoch
                        ] ||
                      0,
                    all_time_total: 0,
                    last_funding_epoch: lastEpoch.toString(),
                  };

                  return (
                    <OctantTableRow
                      key={index}
                      row={project}
                      fundingEpoch={fundingEpoch}
                      // lastFundingEpoch={Epochs[Epochs.length - 1].epoch}
                      project_key={fundingRow.project_key}
                      lastFundingEpoch={lastFundingEpoch}
                      // projectIndex={index}
                      // setCurrentEpoch={setCurrentEpoch}
                      // ProjectsMetadata={ProjectsMetadata}
                      // master={master}
                      // allTimeTotalsByProjectKey={allTimeTotalsByProjectKey}
                    />
                  );
                })}
          </div>
        </VerticalScrollContainer>
      </HorizontalScrollContainer>
      <Container className="@container">
        <div
          className="flex scroll-mt-8 items-center gap-x-[8px] pb-[15px] pt-[60px]"
          ref={JumpToSections.ProjectFunding.ref}
          id="ProjectFunding"
        >
          <div className="h-[36px] w-[36px]">
            <Icon icon="gtp:gtp-blockspace" className="h-[36px] w-[36px]" />
          </div>
          <Heading
            className="break-inside-avoid text-[20px] leading-[120%] md:text-[30px]"
            as="h2"
          >
            Octant Explained
          </Heading>
        </div>
        <div></div>
        <QuestionAnswer
          question="What do you see here?"
          answer={
            <div className="flex flex-col gap-y-[15px]">
              <div>
                Octant is a platform developed by the Golem Foundation that
                allows the Ethereum community to participate in decentralized
                governance and allocate a portion of the Foundation&apos;s
                staking rewards to public goods projects.
              </div>
              <div>
                In the Community section, you can see the a breakdown of User
                activity in All Epochs or use the arrows to view individual
                Epoch data.
              </div>
              <div>
                In the Project Funding section, you can see the projects that
                have participated in All epochs or use the arrows to view
                individual Epoch data.
              </div>
            </div>
          }
        />
      </Container>
    </div>
  );
}

type OctantCircleChart = {
  title: string;
  epoch: string;
  communityData: any;
  valuePrefix: string;
};

const OctantCircleChart = ({
  title,
  epoch,
  communityData,
  valuePrefix,
}: OctantCircleChart) => {
  return (
    <CircleChart
      title={title}
      data={[
        {
          label: "kept by wallets",
          value: communityData
            ? communityData.reduce(
                (acc, user) =>
                  acc +
                  user.budget_amounts[epoch] -
                  user.allocation_amounts[epoch],
                0,
              )
            : 0,
          className: "kept-by-wallets",
        },
        {
          label: "allocated to projects",
          value: communityData
            ? communityData.reduce(
                (acc, user) => acc + user.allocation_amounts[epoch],
                0,
              )
            : 0,
          className: "allocated-to-projects",
        },
      ]}
      valuePrefix="Ξ"
    />
  );
};

type ExpandingButtonMenuProps = {
  button: {
    label: string;
    icon: string;
    showIconBackground?: boolean;
    animateIcon?: boolean;
  };
  items: {
    label: string;
    icon: string;
    href: string;
  }[];
  className?: string;
};

const ExpandingButtonMenu = ({
  button,
  items,
  className,
}: ExpandingButtonMenuProps) => {
  const isMobile = useMediaQuery("(max-width: 640px)");
  return (
    <div
      className={`group/jump absolute flex cursor-pointer flex-col transition-all delay-0 duration-300 hover:left-[5px] hover:right-[5px] hover:top-[10px] hover:delay-300 ${className}`}
    >
      <div
        className="!z-[15] flex h-[36px] w-full items-center gap-x-[8px] rounded-full bg-forest-50 pl-[6px] pr-[10px] transition-[z-index] delay-100 group-hover/jump:!z-[25] group-hover/jump:delay-0 dark:bg-[#263130]"
        onMouseEnter={() => {
          track(`hovered ${button.label} button`, {
            location: isMobile ? `mobile Octant page` : `desktop Octant page`,
            page: window.location.pathname,
          });
        }}
      >
        <div
          className={`${
            button.showIconBackground && "relative bg-white dark:bg-forest-1000"
          } h-[25px] w-[25px] rounded-full p-[5px]`}
        >
          <Icon
            icon={button.icon}
            className={`h-[15px] w-[15px] ${
              button.animateIcon &&
              "transform transition-transform delay-0 duration-300 group-hover/jump:rotate-90 group-hover/jump:delay-300"
            }`}
          />
          <Icon
            icon={"gtp:circle-arrow"}
            className={`absolute right-0 top-2 h-[9px] w-[4px] transition-transform delay-0 duration-500 group-hover/jump:rotate-90 group-hover/jump:delay-300 ${
              button.showIconBackground ? "block" : "hidden"
            }`}
            style={{
              transformOrigin: "-8px 4px",
            }}
          />
        </div>
        <div className="whitespace-nowrap text-[14px] font-semibold leading-tight lg:leading-normal">
          {button.label}
        </div>
      </div>
      <div className="absolute left-0 right-0 top-[16px] !z-[11] max-h-0 overflow-hidden whitespace-nowrap rounded-b-[22px] bg-white pb-[0px] transition-all delay-0 duration-300 group-hover/jump:!z-[21] group-hover/jump:max-h-[300px] group-hover/jump:pb-[10px] group-hover/jump:pt-[24px] group-hover/jump:shadow-lg group-hover/jump:delay-300 dark:bg-[#151A19] group-hover/jump:dark:shadow-[0px_4px_46.2px_0px_#000000]">
        {items.map((item: { label: string; icon: string; href: string }) => (
          <Link
            href={item.href}
            key={item.label}
            rel="noreferrer"
            target="_blank"
            onClick={(e) => {
              track(`clicked ${item.label} link`, {
                location: isMobile
                  ? `mobile Octant page`
                  : `desktop Octant page`,
                page: window.location.pathname,
              });
              if (item.href.startsWith("#")) {
                e.preventDefault();
                document.querySelector(item.href)?.scrollIntoView({
                  behavior: "smooth",
                });
              }
            }}
            className="flex h-[32px] w-0 items-center gap-x-[10px] whitespace-nowrap px-4 py-2 text-sm font-medium transition-[width] duration-100 ease-in-out group-hover:w-full hover:bg-forest-50 dark:hover:bg-forest-900"
          >
            <div className="h-4 w-4">
              <Icon icon={item.icon} className="h-4 w-4" />
            </div>
            <div>{item.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const SearchIcon = () => (
  <div className="z-10 h-6 w-6">
    <svg
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_11948_38516)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M17.8939 8.8C17.8939 13.6601 13.9541 17.6 9.09395 17.6C4.23384 17.6 0.293945 13.6601 0.293945 8.8C0.293945 3.93989 4.23384 0 9.09395 0C13.9541 0 17.8939 3.93989 17.8939 8.8ZM9.09395 15.2C12.6286 15.2 15.4939 12.3346 15.4939 8.8C15.4939 5.26538 12.6286 2.4 9.09395 2.4C5.55932 2.4 2.69395 5.26538 2.69395 8.8C2.69395 12.3346 5.55932 15.2 9.09395 15.2Z"
          fill="url(#paint0_linear_11948_38516)"
        />
        <circle
          cx="9.04395"
          cy="8.75"
          r="5.75"
          fill="url(#paint1_linear_11948_38516)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M23.4577 23.2927C23.0672 23.6833 22.4341 23.6833 22.0435 23.2927L14.0009 15.2501C13.6104 14.8596 13.6104 14.2264 14.0009 13.8359L14.1298 13.707C14.5204 13.3164 15.1535 13.3164 15.5441 13.707L23.5867 21.7496C23.9772 22.1401 23.9772 22.7733 23.5867 23.1638L23.4577 23.2927Z"
          fill="url(#paint2_linear_11948_38516)"
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_11948_38516"
          x1="9.09395"
          y1="0"
          x2="20.9584"
          y2="16.6802"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FE5468" />
          <stop offset="1" stopColor="#FFDF27" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_11948_38516"
          x1="9.04395"
          y1="14.5"
          x2="9.04395"
          y2="3"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#10808C" />
          <stop offset="1" stopColor="#1DF7EF" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_11948_38516"
          x1="18.7938"
          y1="13.4141"
          x2="25.6506"
          y2="23.054"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FE5468" />
          <stop offset="1" stopColor="#FFDF27" />
        </linearGradient>
        <clipPath id="clip0_11948_38516">
          <rect
            width="24"
            height="24"
            fill="white"
            transform="translate(0.293945)"
          />
        </clipPath>
      </defs>
    </svg>
  </div>
);
interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  setValue: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max = 100,
  setValue,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [containerMetrics, setContainerMetrics] = useState({
    width: 0,
    left: 0,
  });

  // Update container dimensions
  useEffect(() => {
    const updateMetrics = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerMetrics({
          width: rect.width,
          left: rect.left,
        });
      }
    };

    updateMetrics();
    window.addEventListener("resize", updateMetrics);
    return () => {
      window.removeEventListener("resize", updateMetrics);
    };
  }, []);

  // Calculate the slider value based on clientX
  const calculateValue = useCallback(
    (clientX: number) => {
      const { width, left } = containerMetrics;
      let newValue = ((clientX - left) / width) * (max - min) + min;
      newValue = Math.min(Math.max(newValue, min), max);
      return Math.round(newValue);
    },
    [containerMetrics, min, max],
  );

  // Handle mouse and touch movement
  const handleMove = useCallback(
    (clientX: number) => {
      if (isDragging) {
        const newValue = calculateValue(clientX);
        setValue(newValue);
      }
    },
    [isDragging, calculateValue, setValue],
  );

  // Mouse event handlers
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handleMove(e.clientX);
    },
    [handleMove],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch event handlers
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      handleMove(e.touches[0].clientX);
    },
    [handleMove],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    isDragging,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // Handle mouse down and touch start
  const startDrag = useCallback(
    (clientX: number) => {
      setIsDragging(true);
      const newValue = calculateValue(clientX);
      setValue(newValue);
    },
    [calculateValue, setValue],
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    startDrag(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    startDrag(e.touches[0].clientX);
  };

  // Handle keyboard interactions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let newValue = value;
    const step = 1;

    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      newValue = Math.max(value - step, min);
      setValue(newValue);
      e.preventDefault();
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      newValue = Math.min(value + step, max);
      setValue(newValue);
      e.preventDefault();
    }
  };

  // Calculate thumb position percentage
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative h-2 w-full cursor-pointer rounded-full bg-forest-1000"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div
          className="absolute left-0 top-0 h-2 rounded-full bg-forest-900"
          style={{ width: `${percentage}%`, transition: "all 0.1s" }}
        ></div>
        <div
          className="absolute left-0 top-1/2 h-2 w-4 -translate-x-1/2 -translate-y-1/2 transform rounded-full border border-forest-800 bg-forest-800 shadow focus:outline-none"
          style={{
            left: `${percentage}%`,
            transition: isDragging ? "none" : "left 0.1s",
          }}
        ></div>
      </div>
      <div className="mt-2 text-center text-gray-700">Value: {value}</div>
    </div>
  );
};

type CommunityTableRowProps = {
  user: {
    user: string;
    locked: number;
    min: number;
    max: number;
    budget_amount: number;
    allocation_amount: number;
    allocated_to_project_count: number;
    allocated_to_project_keys: string[];
    activeSinceEpoch: number;
  };
  communityEpoch: number;
  projectMetadataData: any;
  Epochs: { epoch: string; label: string }[];
};

const CommunityTableRow = React.memo<CommunityTableRowProps>(({
  user,
  communityEpoch,
  projectMetadataData,
  Epochs,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const copyTimeout = useRef<NodeJS.Timeout | null>(null);

  // Memoize expensive calculations
  const formattedUser = useMemo(() => {
    const userStart = user.user.slice(0, user.user.length - 6);
    const userEnd = user.user.slice(-6);
    return { userStart, userEnd };
  }, [user.user]);

  const donationPercentages = useMemo(() => {
    if (user.budget_amount === 0) return { donated: 0, kept: 0 };
    
    const donated = (user.allocation_amount / user.budget_amount) * 100;
    const kept = ((user.budget_amount - user.allocation_amount) / user.budget_amount) * 100;
    
    return { donated, kept };
  }, [user.allocation_amount, user.budget_amount]);

  const handleCopyAddress = useCallback((address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    
    if (copyTimeout.current) {
      clearTimeout(copyTimeout.current);
    }
    
    copyTimeout.current = setTimeout(() => {
      setCopiedAddress(null);
    }, 1000);
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }
    };
  }, []);

  // Memoize project rendering to avoid re-renders
  const projectElements = useMemo(() => {
    if (user.allocated_to_project_keys.length === 0) return null;

    return user.allocated_to_project_keys.map((project_key, index) => (
      <div
        key={`${project_key}-${index}`}
        className="flex items-center gap-x-[5px] rounded-[15px] bg-[#344240] py-[0px] pl-[0px] pr-[6px] text-[10px]"
      >
        {/* Project image rendering logic here */}
        {project_key}
      </div>
    ));
  }, [user.allocated_to_project_keys, communityEpoch, projectMetadataData, Epochs]);

  // Rest of the component remains the same but with optimized rendering
  return (
        <div>
      <div className="pb-[3px]">
        <GridTableRow
          gridDefinitionColumns="grid-cols-[20px,minmax(80px,1600px),118px,72px,69px]"
          className="group inline-grid h-[34px] select-none gap-x-[15px] !pl-[5px] !pr-[15px] text-[12px] transition-all duration-300"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          <div className="flex items-center justify-center">
            <div className="relative flex h-[16px] w-[16px] cursor-pointer items-center justify-center rounded-full bg-[#151A19]">
              <AddressIcon address={user.user} className="rounded-full" />
              <Icon
                icon={"gtp:circle-arrow"}
                className={`absolute -right-[4px] top-[4px] h-[9px] w-[4px]`}
                style={{
                  transform: `rotate(${isOpen ? "90deg" : "0deg"})`,
                  transformOrigin: "-7px 4px",
                  transition: "transform 0.5s",
                }}
              />
            </div>
          </div>
          <div className="flex h-full select-none items-center @container hover:bg-transparent">
            <span
              className="flex h-full flex-1 items-center pr-[10px] @container hover:bg-transparent"
              style={{
                fontFeatureSettings: "'pnum' on, 'lnum' on",
              }}
              // onDoubleClick={(e) => {
              //   e.preventDefault(); // Prevent default double-click behavior
              //   const selection = window.getSelection();
              //   const range = document.createRange();
              //   range.selectNodeContents(e.currentTarget);
              //   selection?.removeAllRanges();
              //   selection?.addRange(range);
              // }}
            >
              <div
                className="truncate transition-all duration-300"
                style={{ direction: "ltr" }}
                onClick={() => {
                  navigator.clipboard.writeText(user.user);
                }}
              >
                {user.user.slice(0, user.user.length - 6)}
              </div>
              <div className="transition-all duration-300">
                {user.user.slice(-6)}
              </div>
              <div className="flex gap-x-[10px] pl-[10px]">
                <div className="">
                  <Icon
                    icon={
                      copiedAddress === user.user
                        ? "feather:check-circle"
                        : "feather:copy"
                    }
                    className="z-[10] h-[14px] w-[14px] cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyAddress(user.user);
                    }}
                  />
                </div>
                <Link
                  href={`https://etherscan.io/address/${user.user}`}
                  passHref
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0_12260_38955)">
                      <path
                        d="M6.85644 1.4375C6.5114 1.4375 6.17242 1.51996 5.87348 1.67659L1.28085 4.06281L1.27832 4.06414C0.979329 4.2211 0.730988 4.44679 0.558212 4.71857C0.385436 4.99035 0.294299 5.29866 0.293945 5.61258V10.3874C0.294299 10.7013 0.385436 11.0097 0.558212 11.2814C0.730988 11.5532 0.979329 11.7789 1.27832 11.9359L1.28085 11.9372L5.87207 14.3227L5.87328 14.3233C6.17227 14.48 6.51132 14.5625 6.85644 14.5625C7.20158 14.5625 7.54064 14.48 7.83964 14.3233L7.84082 14.3227L9.73374 13.3392C9.31253 13.1502 8.93841 12.8751 8.63384 12.5361L7.1871 13.2878L7.18457 13.2892C7.08481 13.3415 6.97164 13.3691 6.85644 13.3691C6.74125 13.3691 6.62808 13.3415 6.52832 13.2891L1.93457 10.9023L1.93354 10.9018C1.83433 10.8495 1.75193 10.7745 1.69453 10.6842C1.63699 10.5937 1.60661 10.491 1.60644 10.3865V5.61355C1.60661 5.509 1.63699 5.40632 1.69453 5.3158C1.75193 5.22552 1.83433 5.1505 1.93354 5.0982L1.93457 5.09766L6.52579 2.71218L6.52832 2.71085C6.62808 2.65848 6.74125 2.6309 6.85644 2.6309C6.97164 2.6309 7.0848 2.65848 7.18457 2.71085L11.7783 5.09766L11.7794 5.0982C11.8786 5.1505 11.961 5.22552 12.0184 5.3158C12.0759 5.40639 12.1063 5.50916 12.1064 5.6138V7.22783C12.6086 7.39394 13.0571 7.67807 13.4189 8.04735V5.61258C13.4186 5.29866 13.3275 4.99035 13.1547 4.71857C12.9819 4.44679 12.7336 4.2211 12.4346 4.06413L7.84082 1.67733L7.83945 1.67661C7.5405 1.51996 7.2015 1.4375 6.85644 1.4375Z"
                        fill="#CDD8D3"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M0.384698 5.45315C0.571212 5.19887 0.983791 5.11198 1.30622 5.25907L6.85645 7.79111L12.4067 5.25907C12.7291 5.11198 13.1417 5.19887 13.3282 5.45315C13.5147 5.70744 13.4045 6.03282 13.0821 6.17991L7.19416 8.86602C6.98523 8.96133 6.72766 8.96133 6.51873 8.86602L0.630794 6.17991C0.308366 6.03282 0.198185 5.70744 0.384698 5.45315Z"
                        fill="#CDD8D3"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M6.85645 8C7.37421 8 7.79395 8.46875 7.79395 8.9375V13.625C7.79395 14.0938 7.37421 14.5625 6.85645 14.5625C6.33868 14.5625 5.91895 14.0938 5.91895 13.625V8.9375C5.91895 8.46875 6.33868 8 6.85645 8Z"
                        fill="#CDD8D3"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M11.0752 11.75C11.8518 11.75 12.4814 11.1204 12.4814 10.3438C12.4814 9.5671 11.8518 8.9375 11.0752 8.9375C10.2985 8.9375 9.66895 9.5671 9.66895 10.3438C9.66895 11.1204 10.2985 11.75 11.0752 11.75ZM11.0752 12.6875C12.3696 12.6875 13.4189 11.6382 13.4189 10.3438C13.4189 9.04933 12.3696 8 11.0752 8C9.78078 8 8.73145 9.04933 8.73145 10.3438C8.73145 11.6382 9.78078 12.6875 11.0752 12.6875Z"
                        fill="#CDD8D3"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M11.8756 11.4184C12.0586 11.2353 12.3554 11.2353 12.5385 11.4184L14.6881 13.568C14.8711 13.751 14.8711 14.0478 14.6881 14.2309C14.505 14.4139 14.2082 14.4139 14.0252 14.2309L11.8756 12.0813C11.6925 11.8982 11.6925 11.6014 11.8756 11.4184Z"
                        fill="#CDD8D3"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_12260_38955">
                        <rect
                          width="15"
                          height="15"
                          fill="white"
                          transform="translate(0.293945 0.5)"
                        />
                      </clipPath>
                    </defs>
                  </svg>
                </Link>
              </div>
            </span>
          </div>
          <div className="flex items-center justify-end whitespace-nowrap">
            {communityEpoch != 0 && user.min > 0 ? (
              <div className="text-[#CDD8D3]">
                {formatNumberMemo(user.min, 2)}{" "}
                {/* {user.min.toLocaleString("en-GB", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} */}
                <span className="text-[0.55rem] opacity-60">GLM</span>
              </div>
            ) : (
              <div className="text-[#CDD8D3]">-</div>
            )}
          </div>
          <div
            className={`flex items-center justify-end whitespace-nowrap ${
              user.budget_amount < 0.01 && "text-[11px]"
            }`}
          >
            {user.budget_amount > 0 ? (
              <div className="text-[#CDD8D3]">
                {user.budget_amount.toLocaleString("en-GB", {
                  minimumFractionDigits: user.budget_amount < 0.01 ? 4 : 2,
                  maximumFractionDigits: user.budget_amount < 0.01 ? 5 : 2,
                })}{" "}
                <span className="text-[0.55rem] opacity-60">ETH</span>
              </div>
            ) : (
              <div className="text-[#CDD8D3]">-</div>
            )}
          </div>
          <div
            className={`flex items-center justify-end whitespace-nowrap ${
              user.allocation_amount < 0.01 && "text-[11px]"
            }`}
          >
            {user.allocation_amount > 0 ? (
              <div className="text-[#CDD8D3]">
                {user.allocation_amount.toLocaleString("en-GB", {
                  minimumFractionDigits: user.allocation_amount < 0.01 ? 4 : 2,
                  maximumFractionDigits: user.allocation_amount < 0.01 ? 5 : 2,
                })}{" "}
                <span className="text-[0.55rem] opacity-60">ETH</span>
              </div>
            ) : (
              <div className="text-[#CDD8D3]">-</div>
            )}
          </div>
        </GridTableRow>
        <div className="pl-[13px] pr-[15px]">
          <div
            className={`flex flex-col rounded-b-[15px] border-x border-b border-dotted border-[#CDD8D3]/30 bg-[#1F2726] transition-all duration-300 ${
              isOpen
                ? "max-h-[300px] min-h-[80px] opacity-100"
                : "max-h-0 min-h-0 opacity-0"
            } overflow-hidden`}
          >
            <div className="flex flex-col gap-y-[6px] p-[15px] text-[12px]">
              <div className="flex items-center justify-between">
                <div>
                  Active Since:{" "}
                  <span className="font-semibold">
                    Epoch {user.activeSinceEpoch}
                  </span>
                </div>
                <div className="flex items-center gap-x-[5px]">
                  <div>
                    Donated{" "}
                    <span className="font-semibold">
                      {user.allocation_amount.toLocaleString("en-GB", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ETH
                    </span>
                  </div>
                  <div className="flex w-[133px] flex-col">
                    <div className="flex justify-between text-[10px]">
                      <div>
                        {(
                          (user.allocation_amount / user.budget_amount) *
                          100
                        ).toFixed(2)}
                        %
                      </div>
                      <div>
                        {(
                          ((user.budget_amount - user.allocation_amount) /
                            user.budget_amount) *
                          100
                        ).toFixed(2)}
                        %
                      </div>
                    </div>
                    <div className="flex h-[4px] w-full">
                      <div
                        className="h-full rounded-l-full"
                        style={{
                          background:
                            "linear-gradient(0deg,#1DF7EF 0%,#10808C 100%)",
                          width: `${
                            (user.allocation_amount / user.budget_amount) * 100
                          }%`,
                        }}
                      ></div>
                      <div
                        className="h-full rounded-r-full"
                        style={{
                          background:
                            "linear-gradient(-3deg,#FFDF27 0%,#FE5468 100%)",
                          width: `${
                            ((user.budget_amount - user.allocation_amount) /
                              user.budget_amount) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">
                      {(
                        user.budget_amount - user.allocation_amount
                      ).toLocaleString("en-GB", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ETH
                    </span>{" "}
                    Kept
                  </div>
                </div>
              </div>
              {user.allocated_to_project_keys.length > 0 ? (
                <div className="flex flex-col gap-y-[5px]">
                  <div>
                    Wallet donated to{" "}
                    <span className="font-semibold">
                      {user.allocated_to_project_keys.length}
                    </span>{" "}
                    projects:
                  </div>
                  <div className="flex flex-wrap gap-x-[5px] gap-y-[5px]">
                    {user.allocated_to_project_keys.map(
                      (project_key, index) => (
                        <div
                          key={index + project_key}
                          className="flex items-center gap-x-[5px] rounded-[15px] bg-[#344240] py-[0px] pl-[0px] pr-[6px] text-[10px]"
                        >
                          {communityEpoch === 0 ? (
                            <div className="h-6 w-6 overflow-hidden rounded-full border border-forest-900/20 dark:border-forest-500/20">
                              {projectMetadataData &&
                                projectMetadataData[project_key] &&
                                Object.values(projectMetadataData[project_key])
                                  .slice(1)
                                  .map((md: any, i: number) => (
                                    <Image
                                      key={i + md.name}
                                      src={`https://ipfs.io/ipfs/${md.profile_image_medium}`}
                                      alt={md.name}
                                      width={24}
                                      height={24}
                                      className="rounded-full"
                                    />
                                  ))}
                            </div>
                          ) : (
                            <div className="h-6 w-6 overflow-hidden rounded-full border border-forest-900/20 dark:border-forest-500/20">
                              {projectMetadataData && projectMetadataData[project_key] &&
                                projectMetadataData[project_key][
                                  Epochs[communityEpoch].epoch
                                ] && (
                                  <Image
                                    src={`https://ipfs.io/ipfs/${
                                      projectMetadataData[project_key][
                                        Epochs[communityEpoch].epoch
                                      ].profile_image_medium
                                    }`}
                                    alt={
                                      projectMetadataData[project_key][
                                        Epochs[communityEpoch].epoch
                                      ].name
                                    }
                                    width={24}
                                    height={24}
                                    className="rounded-full"
                                  />
                                )}
                            </div>
                          )}
                          {project_key}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : (
                <div>No donations made to any projects.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.user.user === nextProps.user.user &&
    prevProps.communityEpoch === nextProps.communityEpoch &&
    prevProps.user.allocation_amount === nextProps.user.allocation_amount &&
    prevProps.user.budget_amount === nextProps.user.budget_amount &&
    JSON.stringify(prevProps.user.allocated_to_project_keys) === JSON.stringify(nextProps.user.allocated_to_project_keys)
  );
});
CommunityTableRow.displayName = "CommunityTableRow";

type TableRowProps = {
  row: {
    project_key: string;
    owner_project: string;
    project_metadata: OctantProjectMetadataOrNone;
    address: string;
    donors: number;
    allocation: number;
    matched: number;
    total: number;
    all_time_total: number;
    last_funding_epoch: string;
  };
  project_key: string;
  // projectIndex: number;
  // setCurrentEpoch?: (epoch: EpochData) => void;
  lastFundingEpoch: string;
  // ProjectsMetadata: any;
  // master: MasterResponse;
  fundingEpoch: number;
  // allTimeTotalsByProjectKey: any;
};

const OctantTableRow = ({
  row,
  project_key,
  // projectIndex,
  // setCurrentEpoch,
  lastFundingEpoch,
  // ProjectsMetadata,
  // master,
  fundingEpoch,
}: // allTimeTotalsByProjectKey
TableRowProps) => {
  return (
    <GridTableRow
      gridDefinitionColumns="grid-cols-[20px,250px,minmax(125px,1600px),95px,126px,101px,89px]"
      className="group inline-grid h-[34px] w-full select-none gap-x-[15px] !pl-[5px] !pr-[15px] text-[12px] transition-all duration-300"
    >
      <div className="h-[18px] w-[26px] px-[4px]">
        {row.project_metadata && (
          <div className="relative size-[18px]">
            <div className="absolute inset-[1px] size-[16px] rounded-full bg-white" />
            <Image
              src={`https://ipfs.io/ipfs/${row.project_metadata.profile_image_medium}`}
              alt={row.owner_project}
              // width={18}
              // height={18}
              fill
              objectFit="contain"
              className="rounded-full"
            />
          </div>
        )}
      </div>
      <div className="flex select-none justify-between">
        <div className="truncate">
          {row.project_metadata?.name ? (
            row.project_metadata.name
          ) : (
            <div className="flex h-full items-center gap-x-[3px] text-[10px] text-[#5A6462]">
              Not Available
            </div>
          )}
        </div>
        <div className="flex gap-x-[5px]">
          {row.project_metadata && (
            <div className="flex items-center gap-x-[5px]">
              <div className="h-[15px] w-[15px]">
                {row.project_metadata.website_url && (
                  <Link
                    href={row.project_metadata.website_url}
                    target="_blank"
                    className="group flex items-center gap-x-[5px] text-xs"
                  >
                    <Icon
                      icon="feather:monitor"
                      className="h-[15px] w-[15px]"
                    />
                  </Link>
                )}
              </div>
              <>
                <div className="h-[15px] w-[15px]">
                  {row.project_metadata.twitter && (
                    <Link
                      href={`https://x.com/${row.project_metadata.twitter}`}
                      target="_blank"
                      className="group flex items-center gap-x-[5px] text-xs"
                    >
                      <Icon
                        icon="ri:twitter-x-fill"
                        className="h-[15px] w-[15px]"
                      />
                    </Link>
                  )}
                </div>
                <div className="h-[15px] w-[15px]">
                  {row.project_metadata.main_github && (
                    <Link
                      href={`https://github.com/${row.project_metadata.main_github}`}
                      target="_blank"
                      className="group flex items-center gap-x-[5px] text-xs"
                    >
                      <Icon
                        icon="ri:github-fill"
                        className="h-[15px] w-[15px]"
                      />
                    </Link>
                  )}
                </div>
              </>
              <div className="h-[15px] w-[15px]">
                <Link
                  href={`https://octant.app/project/${
                    fundingEpoch === 0 ? lastFundingEpoch : fundingEpoch
                  }/${row.project_metadata.address}`}
                  target="_blank"
                  className="group flex items-center gap-x-[5px] text-xs"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.14397 8.75675C5.56222 8.75675 5.90125 8.41772 5.90125 7.99947C5.90125 7.58125 5.56222 7.24219 5.14397 7.24219C4.72575 7.24219 4.38672 7.58125 4.38672 7.99947C4.38672 8.41772 4.72575 8.75675 5.14397 8.75675Z"
                      fill="#CDD8D3"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M15.2939 8C15.2939 2.46667 13.3365 0.5 7.79395 0.5C2.26754 0.5 0.293945 2.49207 0.293945 8C0.293945 13.4869 2.30026 15.5 7.79395 15.5C13.3039 15.5 15.2939 13.5124 15.2939 8ZM5.14388 10.2717C6.08701 10.2717 6.89591 9.69706 7.23948 8.87875C7.5982 10.2264 8.76204 11.2457 10.1845 11.3901C10.4768 11.4197 10.5328 11.3691 10.5328 11.0527V9.6949C10.5328 9.42972 10.6224 9.13584 11.0471 9.13584H11.8618C12.0371 9.13584 12.0441 9.13206 12.1437 8.9914C12.1437 8.9914 12.5706 8.39519 12.6555 8.26853C12.7403 8.1419 12.7314 8.10862 12.6555 7.9999C12.5795 7.89122 12.1437 7.28984 12.1437 7.28984C12.0438 7.15125 12.0357 7.14797 11.8618 7.14797H10.7769C10.5994 7.14797 10.5328 7.24265 10.5328 7.43197V8.417C10.5328 8.65706 10.5328 8.85184 10.1845 8.85184C9.67826 8.85184 9.40357 8.47044 9.40357 7.9999C9.40357 7.58719 9.70938 7.16469 10.1845 7.16469C10.504 7.16469 10.5328 7.08831 10.5328 6.935V4.87615C10.5328 4.60656 10.4153 4.58634 10.1845 4.60975C8.76204 4.75419 7.5982 5.77347 7.23948 7.12106C6.89591 6.30278 6.08701 5.72809 5.14388 5.72809C3.8892 5.72809 2.87207 6.74522 2.87207 7.9999C2.87207 9.25462 3.8892 10.2717 5.14388 10.2717Z"
                      fill="#CDD8D3"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex h-full select-none items-center @container hover:bg-transparent">
        <span
          className="flex h-full max-w-[320px] flex-1 items-center pr-[10px] @container hover:bg-transparent"
          style={{
            fontFeatureSettings: "'pnum' on, 'lnum' on",
          }}
          onDoubleClick={(e) => {
            e.preventDefault(); // Prevent default double-click behavior
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(e.currentTarget);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }}
        >
          <div
            className="truncate transition-all duration-300"
            style={{ direction: "ltr" }}
            onClick={() => {
              navigator.clipboard.writeText(row.address);
            }}
          >
            {row.address.slice(0, row.address.length - 6)}
          </div>
          <div className="transition-all duration-300">
            {row.address.slice(-6)}
          </div>
        </span>

        <Link
          href={`https://etherscan.io/address/${row.address}`}
          passHref
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_12260_38955)">
              <path
                d="M6.85644 1.4375C6.5114 1.4375 6.17242 1.51996 5.87348 1.67659L1.28085 4.06281L1.27832 4.06414C0.979329 4.2211 0.730988 4.44679 0.558212 4.71857C0.385436 4.99035 0.294299 5.29866 0.293945 5.61258V10.3874C0.294299 10.7013 0.385436 11.0097 0.558212 11.2814C0.730988 11.5532 0.979329 11.7789 1.27832 11.9359L1.28085 11.9372L5.87207 14.3227L5.87328 14.3233C6.17227 14.48 6.51132 14.5625 6.85644 14.5625C7.20158 14.5625 7.54064 14.48 7.83964 14.3233L7.84082 14.3227L9.73374 13.3392C9.31253 13.1502 8.93841 12.8751 8.63384 12.5361L7.1871 13.2878L7.18457 13.2892C7.08481 13.3415 6.97164 13.3691 6.85644 13.3691C6.74125 13.3691 6.62808 13.3415 6.52832 13.2891L1.93457 10.9023L1.93354 10.9018C1.83433 10.8495 1.75193 10.7745 1.69453 10.6842C1.63699 10.5937 1.60661 10.491 1.60644 10.3865V5.61355C1.60661 5.509 1.63699 5.40632 1.69453 5.3158C1.75193 5.22552 1.83433 5.1505 1.93354 5.0982L1.93457 5.09766L6.52579 2.71218L6.52832 2.71085C6.62808 2.65848 6.74125 2.6309 6.85644 2.6309C6.97164 2.6309 7.0848 2.65848 7.18457 2.71085L11.7783 5.09766L11.7794 5.0982C11.8786 5.1505 11.961 5.22552 12.0184 5.3158C12.0759 5.40639 12.1063 5.50916 12.1064 5.6138V7.22783C12.6086 7.39394 13.0571 7.67807 13.4189 8.04735V5.61258C13.4186 5.29866 13.3275 4.99035 13.1547 4.71857C12.9819 4.44679 12.7336 4.2211 12.4346 4.06413L7.84082 1.67733L7.83945 1.67661C7.5405 1.51996 7.2015 1.4375 6.85644 1.4375Z"
                fill="#CDD8D3"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.384698 5.45315C0.571212 5.19887 0.983791 5.11198 1.30622 5.25907L6.85645 7.79111L12.4067 5.25907C12.7291 5.11198 13.1417 5.19887 13.3282 5.45315C13.5147 5.70744 13.4045 6.03282 13.0821 6.17991L7.19416 8.86602C6.98523 8.96133 6.72766 8.96133 6.51873 8.86602L0.630794 6.17991C0.308366 6.03282 0.198185 5.70744 0.384698 5.45315Z"
                fill="#CDD8D3"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.85645 8C7.37421 8 7.79395 8.46875 7.79395 8.9375V13.625C7.79395 14.0938 7.37421 14.5625 6.85645 14.5625C6.33868 14.5625 5.91895 14.0938 5.91895 13.625V8.9375C5.91895 8.46875 6.33868 8 6.85645 8Z"
                fill="#CDD8D3"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.0752 11.75C11.8518 11.75 12.4814 11.1204 12.4814 10.3438C12.4814 9.5671 11.8518 8.9375 11.0752 8.9375C10.2985 8.9375 9.66895 9.5671 9.66895 10.3438C9.66895 11.1204 10.2985 11.75 11.0752 11.75ZM11.0752 12.6875C12.3696 12.6875 13.4189 11.6382 13.4189 10.3438C13.4189 9.04933 12.3696 8 11.0752 8C9.78078 8 8.73145 9.04933 8.73145 10.3438C8.73145 11.6382 9.78078 12.6875 11.0752 12.6875Z"
                fill="#CDD8D3"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.8756 11.4184C12.0586 11.2353 12.3554 11.2353 12.5385 11.4184L14.6881 13.568C14.8711 13.751 14.8711 14.0478 14.6881 14.2309C14.505 14.4139 14.2082 14.4139 14.0252 14.2309L11.8756 12.0813C11.6925 11.8982 11.6925 11.6014 11.8756 11.4184Z"
                fill="#CDD8D3"
              />
            </g>
            <defs>
              <clipPath id="clip0_12260_38955">
                <rect
                  width="15"
                  height="15"
                  fill="white"
                  transform="translate(0.293945 0.5)"
                />
              </clipPath>
            </defs>
          </svg>
        </Link>
      </div>

      <div className="item-center flex justify-end gap-x-2">
        <div className="item-center flex justify-end gap-x-2">
          <div className="flex items-center font-inter leading-[1]">
            {row.donors}
          </div>
          <div className="flex h-[15px] w-[15px] select-none items-center justify-center">
            {row.donors < 50 && (
              <Icon
                icon={"fluent:person-20-filled"}
                className="h-[15px] w-[15px] fill-current text-forest-900/30 dark:text-forest-500/30"
              />
            )}
            {row.donors >= 50 && row.donors < 100 && (
              <Icon
                icon={"fluent:people-20-filled"}
                className="h-[15px] w-[15px] fill-current text-forest-900/30 dark:text-forest-500/30"
              />
            )}
            {row.donors >= 100 && (
              <Icon
                icon={"fluent:people-community-20-filled"}
                className="h-[15px] w-[15px] fill-current text-forest-900/30 dark:text-forest-500/30"
              />
            )}
          </div>
        </div>

        {/* )} */}
      </div>
      <div className="flex justify-end">
        {/* {["REWARD_ALLOCATION", "FINALIZED"].includes(currentEpoch.state) && currentEpochProject && ( */}
        <div className="relative flex items-center gap-x-2 pr-0.5">
          <div className="font-inter leading-[1.2]">
            {row.allocation.toFixed(2)}{" "}
            <span className="text-[0.55rem] opacity-60">ETH</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <div
          className={`font-inter leading-[1.2] ${
            row.matched <= 0 && "opacity-30"
          }`}
        >
          {row.matched.toFixed(2)}{" "}
          <span className="text-[0.55rem] opacity-60">ETH</span>
        </div>
      </div>
      <div className="flex justify-end">
        <div
          className={`font-inter leading-[1.2] ${
            row.total <= 0 && "opacity-30"
          }`}
        >
          {row.total.toFixed(2)}{" "}
          <span className="text-[0.55rem] opacity-60">ETH</span>
        </div>
      </div>
      {/* <div className="flex justify-end">
        <div
          className={`leading-[1.2] font-inter ${FundingDataFilteredRow.total <= 0 && "opacity-30"
            }`}
        >
          {(allTimeTotalsByProjectKey[project_key]).toFixed(2)}{" "}
          <span className="opacity-60 text-[0.55rem]">ETH</span>
        </div>
      </div> */}
    </GridTableRow>
  );
};

const CountdownTimer = ({ time }: { time: number }) => {
  const [countdownTime, setCountdownTime] = useState<number>(time);

  useEffect(() => {
    setCountdownTime(time);
  }, [time]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTime(countdownTime - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [countdownTime]);

  const countdownTimeFormatted = useMemo(() => {
    const days = Math.floor(countdownTime / 86400);
    const hours = moment.utc(countdownTime * 1000).format("HH");
    const minutes = moment.utc(countdownTime * 1000).format("mm");
    const seconds = moment.utc(countdownTime * 1000).format("ss");

    return (
      <div className="flex items-center gap-x-[5px] leading-[1.1]">
        {days > 0 && (
          <div className="flex w-[20px] flex-col items-center">
            <div className="text-[12px] font-bold">{days}</div>
            <div className="text-[9px] font-normal text-forest-600">days</div>
          </div>
        )}
        <div className="flex w-[60px] items-center gap-x-[0px] leading-[1.1]">
          <div className="flex flex-col items-center">
            <div className="text-[12px] font-bold">{hours}</div>
            <div className="text-[9px] font-normal text-forest-600">hrs</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-[12px] font-bold">:</div>
            <div className="text-[9px] font-normal text-forest-600">&nbsp;</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-[12px] font-bold">{minutes}</div>
            <div className="text-[9px] font-normal text-forest-600">min</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-[12px] font-bold">:</div>
            <div className="text-[9px] font-normal text-forest-600">&nbsp;</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-[12px] font-bold">{seconds}</div>
            <div className="text-[9px] font-normal text-forest-600">sec</div>
          </div>
        </div>
      </div>
    );
  }, [countdownTime]);

  return (
    <div className="flex items-center gap-x-[5px] leading-[1.1]">
      {countdownTimeFormatted}
    </div>
  );
};