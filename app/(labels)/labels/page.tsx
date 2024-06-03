//@ts-nocheck
"use client";
import LabelsContainer from "@/components/layout/LabelsContainer";
import Icon from "@/components/layout/Icon";
import { AllChainsByKeys } from "@/lib/chains";
import { useTheme } from "next-themes";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  useEventListener,
  useIsMounted,
  useLocalStorage,
  useMediaQuery,
} from "usehooks-ts";
import { LabelsURLS, MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { LabelsResponse, LabelsResponseHelper } from "@/types/api/LabelsResponse";
import Header from "./Header";
import { useTransition, animated } from "@react-spring/web";

import Footer from "./Footer";
import FeesHorizontalScrollContainer from "@/components/FeesHorizontalScrollContainer";
import {
  useResizeObserver,
  useWindowSize,
  useDebounceCallback,
} from "usehooks-ts";
import Link from "next/link";
import { IS_PRODUCTION } from "@/lib/helpers";
import { useVirtualizer, useWindowVirtualizer } from "@tanstack/react-virtual";

const devMiddleware = (useSWRNext) => {
  return (key, fetcher, config) => {
    return useSWRNext(key, (url) => {
      if (url.includes("api.growthepie.xyz")) {
        // replace /v1/ with /dev/ to get JSON files from the dev folder in S3
        let newUrl = url.replace('/v1/', '/dev/');
        return fetch(newUrl).then((r) => r.json());
      } else {
        return fetch(url).then((r) => r.json());
      }
    }, config);
  }
}

function labelsMiddleware(useSWRNext) {
  return (key, fetcher, config) => {
    /// Add logger to the original fetcher.
    const extendedFetcher = (...args) => {
      return fetcher(...args).then((data) => {
        const labelsHelper = LabelsResponseHelper.fromResponse(data);
        console.log(labelsHelper);
        return labelsHelper;
      })
    }

    // Execute the hook with the new fetcher.
    return useSWRNext(key, extendedFetcher, config)
  }
}

export default function LabelsPage() {
  const showGwei = true;
  const showCents = true;

  //True is default descending false ascending
  const { theme } = useTheme();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");


  const metrics = useMemo(() => {
    return {
      txcosts_median: {
        title: "Median Fee",
      },
      txcosts_native_median: {
        title: "Transfer ETH",
      },
      txcosts_swap: {
        title: "Swap Token",
      },
    };
  }, []);

  const { fetcher } = useSWRConfig()
  const fallbackFetcher = (url) => fetch(url).then((r) => r.json());

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: labelsData,
    error: labelsError,
    isLoading: labelsLoading,
    isValidating: labelsValidating,
  } = useSWR<LabelsResponseHelper>(LabelsURLS.quick, fallbackFetcher, {
    use: apiRoot === "dev" && !IS_PRODUCTION ? [devMiddleware, labelsMiddleware] : [labelsMiddleware]
  });

  // The scrollable element for your list
  const listRef = useRef<HTMLDivElement>();

  // The virtualizer
  const virtualizer = useWindowVirtualizer({
    count: labelsData ? labelsData.getData().length : 0,
    // getScrollElement: () => listRef.current,
    estimateSize: () => 37,
    // size: 37,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    overscan: 5,
  })

  return (
    <>
      <Header />

      <div className="pb-[114px] pt-[150px]">
        <LabelsContainer className="w-full pt-[30px] flex items-end sm:items-center justify-between md:justify-start  gap-x-[10px]">
          <h1 className="text-[20px] md:text-[30px] pl-[15px] leading-[120%] font-bold">
            Latest contracts on Ethereum Layer 2s
          </h1>
        </LabelsContainer>

        <FeesHorizontalScrollContainer
          className="w-full pt-[20px]"
        // style={{
        //   maskImage: `linear-gradient(to top, white 10%, transparent 15%, transparent 85%, white 90%)`,
        // }}

        >
          <div className="flex flex-col gap-y-[3px]">
            {labelsData && (
              <GridTableHeader gridDefinitionColumns="pb-[4px] text-[12px] grid-cols-[15px,auto,130px,120px,110px,105px,120px] lg:grid-cols-[15px,auto,130px,120px,110px,105px,120px]">
                <div className="flex items-center justify-center"></div>
                <div className="flex items-center justify-start">Contract Address</div>
                <div className="flex items-center justify-start">Owner Project</div>
                <div className="flex items-center justify-start">Contract Name</div>
                <div className="flex items-center justify-start">Category</div>
                <div className="flex items-center justify-start">Subcategory</div>
                <div className="flex items-center justify-end">Transaction Count</div>
              </GridTableHeader>
            )}

            {/* {labelsData && labelsData.getData().map((label, index) => {
              return (
                <GridTableRow key={index} gridDefinitionColumns="text-[12px] h-[34px] grid-cols-[15px,auto,130px,120px,110px,105px,120px] lg:grid-cols-[15px,auto,130px,120px,110px,105px,120px]">
                  <div className="flex h-full items-center">
                    <Icon
                      icon={`gtp:${AllChainsByKeys[label.origin_key].urlKey
                        }-logo-monochrome`}
                      className="w-[15px] h-[15px]"
                      style={{
                        color:
                          AllChainsByKeys[label.origin_key].colors[
                          theme ?? "dark"
                          ][0],
                      }}
                    />
                  </div>
                  <div className="flex h-full items-center">{label.address}</div>
                  <div className="flex h-full items-center">{label.owner_project}</div>
                  <div className="flex h-full items-center">{label.name}</div>
                </GridTableRow>
              );
            })} */}
            <div ref={listRef}>
              {labelsData && (<div
                className="relative flex-flex-col gap-y-[3px]"
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                  // maskImage: `linear-gradient(to bottom, white 10px, transparent 15px, transparent calc(100vh - 15px), white calc(100vh - 10px))`,
                }}

              >
                {virtualizer.getVirtualItems().map((item) => (
                  <GridTableRow
                    key={item.index}
                    gridDefinitionColumns="text-[12px] h-[34px] grid-cols-[15px,auto,130px,120px,110px,105px,120px] lg:grid-cols-[15px,auto,130px,120px,110px,105px,120px]"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${item.size}px`,
                      transform: `translateY(${item.start - virtualizer.options.scrollMargin
                        }px)`,
                    }}>
                    <div className="flex h-full items-center">
                      <Icon
                        icon={`gtp:${AllChainsByKeys[labelsData.getData()[item.index].origin_key].urlKey
                          }-logo-monochrome`}
                        className="w-[15px] h-[15px]"
                        style={{
                          color:
                            AllChainsByKeys[labelsData.getData()[item.index].origin_key].colors[
                            theme ?? "dark"
                            ][0],
                        }}
                      />
                    </div>
                    <div className="flex h-full items-center">{labelsData.getData()[item.index].address}</div>
                    <div className="flex h-full items-center">{labelsData.getData()[item.index].owner_project}</div>
                    <div className="flex h-full items-center">{labelsData.getData()[item.index].name}</div>
                  </GridTableRow>
                ))}
              </div>)}
            </div>

          </div>
        </FeesHorizontalScrollContainer>
      </div>

      <Footer />
    </>
  );
}

type GridTableProps = {
  gridDefinitionColumns: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

// grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] lg:grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] 
// class="select-none grid gap-x-[15px] px-[6px] pt-[30px] text-[11px] items-center font-bold"

const GridTableHeader = ({ children, gridDefinitionColumns }: GridTableProps) => {
  return (
    <div className={`select-none gap-x-[10px] pl-[10px] pr-[20px] pt-[30px] text-[11px] items-center font-bold grid ${gridDefinitionColumns}`}>
      {children}
    </div>
  );
}
// grid grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] lg:grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] 
// class="gap-x-[15px] rounded-full border border-forest-900/20 dark:border-forest-500/20 px-[6px] py-[5px] text-xs items-center"
const GridTableRow = ({ children, gridDefinitionColumns, style }: GridTableProps) => {
  return (
    <div className={`select-text gap-x-[10px] rounded-full border border-forest-900/20 dark:border-forest-500/20 pl-[10px] pr-[20px] py-[5px] text-xs items-center grid ${gridDefinitionColumns}`} style={style}>
      {children}
    </div>
  );
}