"use client";
import { useMemo, useState, useEffect, type ReactNode } from "react";
import Container from "@/components/layout/Container";
import Icon from "@/components/layout/Icon";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import { useLocalStorage } from "usehooks-ts";
import useDragScroll from "@/hooks/useDragScroll";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import { useApplicationsData } from "../_contexts/ApplicationsDataContext";
import { useMetrics } from "../_contexts/MetricsContext";
import { useTimespan } from "../_contexts/TimespanContext";
import { ApplicationsTable } from "./ApplicationsTable";
import {
  ApplicationCard,
  TopGainersAndLosersTooltip,
} from "./Components";

type CardSwiperProps = {
  cards: ReactNode[];
};

const CardSwiper = ({ cards }: CardSwiperProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFirst, setIsFirst] = useState(true);
  const [isLast, setIsLast] = useState(false);
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(2);

  const { containerRef } = useDragScroll("horizontal", 0.96, { snap: true, snapThreshold: 0.2 });

  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const children = Array.from(containerRef.current.children);
      let closestIndex = 0;
      let closestDistance = Infinity;

      children.forEach((child, index) => {
        const rect = child.getBoundingClientRect();
        const childCenter = rect.left + rect.width / 2;
        const distance = Math.abs(childCenter - containerCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
      setLeftIndex(Math.max(0, closestIndex - 1));
      setRightIndex(Math.min(children.length - 1, closestIndex + 1));
      setIsFirst(closestIndex === 0);
      setIsLast(closestIndex === children.length - 1);
    };

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", onScroll);
    onScroll();

    return () => container.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  return (
    <div ref={containerRef} className="flex overflow-x-scroll scrollbar-none px-[20px]">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`transition-[transform,opacity] duration-300 ease-in-out ${
            index === activeIndex ? "scale-100 opacity-100" : "scale-[0.75] opacity-50"
          }`}
          style={{
            minWidth: "calc(100% - 40px)",
            marginRight: !isLast && index === leftIndex ? "-40px" : 0,
            marginLeft: !isFirst && index === rightIndex ? "-40px" : 0,
          }}
        >
          {card}
        </div>
      ))}
    </div>
  );
};

export const ApplicationsOverviewContent = () => {
  const {
    applicationDataAggregatedAndFiltered,
    isLoading,
    selectedStringFilters,
    medianMetric,
    medianMetricKey,
    viewOptions,
  } = useApplicationsData();
  const { metricsDef } = useMetrics();
  const { selectedMetrics } = useMetrics();
  const { timespans, selectedTimespan } = useTimespan();
  const [showUsd] = useLocalStorage("showUsd", true);
  const [topGainersRef, { height: topGainersHeight }] = useElementSizeObserver<HTMLDivElement>();

  const highlightChainKey =
    viewOptions.enforcedOriginKeys.length === 1 ? viewOptions.enforcedOriginKeys[0] : undefined;
  const cardChainProps = highlightChainKey ? { chainsPage: true, chainKey: highlightChainKey } : {};

  const { topGainers, topLosers } = useMemo(() => {
    const medianMetricValues = applicationDataAggregatedAndFiltered
      .map((application) => application[medianMetricKey])
      .sort((a, b) => a - b);

    const medianValue = medianMetricValues[Math.floor(medianMetricValues.length / 2)];
    const convertToETH = showUsd ? true : false;

    const filteredApplications = applicationDataAggregatedAndFiltered.filter(
      (application) =>
        application[medianMetricKey] > medianValue &&
        application[`prev_${convertToETH ? "gas_fees_eth" : medianMetricKey}`] > 0
    );

    return {
      topGainers: [...filteredApplications]
        .sort((a, b) => b[`${medianMetricKey}_change_pct`] - a[`${medianMetricKey}_change_pct`])
        .slice(0, 3),
      topLosers: [...filteredApplications]
        .sort((a, b) => a[`${medianMetricKey}_change_pct`] - b[`${medianMetricKey}_change_pct`])
        .slice(0, 3),
    };
  }, [applicationDataAggregatedAndFiltered, medianMetricKey, showUsd]);

  const hideTopGainersAndLosers = useMemo(
    () => selectedTimespan === "max" || selectedStringFilters.length > 0,
    [selectedTimespan, selectedStringFilters]
  );

  const filterDescription = useMemo(() => {
    if (viewOptions.allowChainSelection && !viewOptions.hideChainsColumn) {
      return `Applications ranked by ${metricsDef[medianMetric].name} in the last ${
        timespans[selectedTimespan].label
      }. You can apply filters by clicking on the chain icons or by using the search bar.`;
    }

    return `Applications ranked by ${metricsDef[medianMetric].name} in the last ${
      timespans[selectedTimespan].label
    }. Use the search bar and other controls to refine the list.`;
  }, [metricsDef, medianMetric, selectedTimespan, timespans, viewOptions.allowChainSelection, viewOptions.hideChainsColumn]);

  return (
    <>
      <div>
        <div
          style={{
            height: hideTopGainersAndLosers ? 0 : `calc(78px + ${topGainersHeight}px)`,
            opacity: hideTopGainersAndLosers ? 0 : 1,
            transition: "height 0.3s ease, opacity 0.3s ease",
          }}
        >
          <Container className="pt-[30px]">
            <div className="flex flex-col gap-y-[10px] ">
              <div className="heading-large">
                Top Gainers and Losers by {metricsDef[medianMetric].name}
              </div>
              <div className="flex justify-between items-center gap-x-[10px]">
                <div className="text-xs">
                  Projects that saw the biggest change in {metricsDef[medianMetric].name} over the last{" "}
                  {timespans[selectedTimespan].label}.
                </div>
                <Tooltip placement="left">
                  <TooltipTrigger>
                    <div className="size-[15px]">
                      <Icon icon="feather:info" className="size-[15px]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="z-[99]">
                    <TopGainersAndLosersTooltip metric={selectedMetrics[0]} />
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </Container>
          <div ref={topGainersRef}>
            <Container className="hidden md:flex md:flex-wrap pt-[10px] gap-[10px]">
              {topGainers.map((application, index) => (
                <ApplicationCard
                  key={`gainer-${index}`}
                  application={application}
                  className="md:w-[calc(50%-5px)] lg:w-[calc(33.33%-7px)]"
                  {...cardChainProps}
                />
              ))}
              {topLosers.map((application, index) => (
                <ApplicationCard
                  key={`loser-${index}`}
                  application={application}
                  className="md:w-[calc(50%-5px)] lg:w-[calc(33.33%-7px)]"
                  {...cardChainProps}
                />
              ))}
              {isLoading &&
                new Array(6).fill(0).map((_, index) => (
                  <ApplicationCard
                    key={`skeleton-${index}`}
                    application={undefined}
                    className="md:w-[calc(50%-5px)] lg:w-[calc(33.33%-7px)]"
                    {...cardChainProps}
                  />
                ))}
            </Container>

            <div className="block md:hidden">
              <div className="pt-[10px]">
                <CardSwiper
                  cards={[
                    ...topGainers.map((application, index) => (
                      <ApplicationCard
                        key={`mobile-gainer-${index}`}
                        application={application}
                        {...cardChainProps}
                      />
                    )),
                    ...topLosers.map((application, index) => (
                      <ApplicationCard
                        key={`mobile-loser-${index}`}
                        application={application}
                        {...cardChainProps}
                      />
                    )),
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Container className="pt-[30px] pb-[15px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="heading-large">Top Ranked</div>
          <div className="text-xs">{filterDescription}</div>
        </div>
      </Container>
      <HorizontalScrollContainer className="!px-0" reduceLeftMask>
        <ApplicationsTable />
      </HorizontalScrollContainer>
    </>
  );
};
