"use client";

import Heading from "../layout/Heading";
import { useMemo, useState } from "react";
import { GTPIcon } from "../layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import Link from "next/link";
import GTPCardLayout from "../GTPButton/GTPCardLayout";
import GTPChart, { GTPChartSeries } from "../GTPButton/GTPChart";
import { GTPButton } from "../GTPButton/GTPButton";
import GTPButtonContainer from "../GTPButton/GTPButtonContainer";
import GTPButtonRow from "../GTPButton/GTPButtonRow";
import { useMediaQuery } from "usehooks-ts";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { EVENTS_BY_ID, FEATURED_EVENT_IDS_MAX, type EventId } from "./events";
import { EventOption, EventSeriesMeta } from "./events/types";

const EMPTY_OPTIONS: EventOption[] = [];

const getNestedValue = (obj: unknown, path: string) => {
  return path.split(".").reduce((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, obj as unknown);
};

const buildSeriesFromSource = (
  values: unknown,
  seriesMeta: EventSeriesMeta[],
  xIndex = 0,
): GTPChartSeries[] => {
  if (!Array.isArray(values)) return [];

  return seriesMeta.map((meta) => {
    const data = values
      .map<[number, number | null] | null>((row) => {
        if (!Array.isArray(row)) return null;
        const rawX = row[xIndex];
        const rawY = row[meta.yIndex];
        const timestamp = typeof rawX === "number" ? rawX : Number(rawX);
        if (!Number.isFinite(timestamp)) return null;
        const value = typeof rawY === "number" ? rawY : Number(rawY);
        return [timestamp, Number.isFinite(value) ? value : null];
      })
      .filter((point): point is [number, number | null] => Boolean(point));

    return {
      name: meta.name,
      color: meta.color,
      seriesType: meta.seriesType ?? "line",
      data,
    };
  });
};

const EventCard = ({
  event,
  isSelected,
  setSelectedEvent,
}: {
  event: EventId;
  isSelected: boolean;
  setSelectedEvent: (event: EventId) => void;
}) => {
  return (
    <motion.div
      layout
      className={`flex w-full overflow-hidden border-[1px] border-color-bg-medium rounded-[15px] py-[10px] px-[15px] gap-x-[10px] cursor-pointer ${isSelected ? "flex-1 min-h-0 bg-color-ui-active items-start" : "h-[54px] bg-color-bg-default hover:bg-color-ui-hover items-center"}`}
      onClick={() => setSelectedEvent(event)}
      transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
    >
      {/* Icon — layout="position" so it animates from center to top-left as card expands */}
      <motion.div layout="position" className={`shrink-0 ${isSelected ? "" : "pt-[6px]"}`}>
        <GTPIcon
          icon={isSelected ? (EVENTS_BY_ID[event].image as GTPIconName) : "gtp-megaphone"}
          className={isSelected ? "!size-[24px]" : "!size-[16px]"}
          containerClassName="!size-[24px]"
        />
      </motion.div>

      {/* Content — AnimatePresence swaps between the two text states with opacity only.
          The card's own layout animation handles the height change, so no height
          animation is needed here (which was causing the squishing/pushing effect). */}
      <div className={`flex flex-col w-full min-w-0 ${isSelected ? "h-full" : "justify-center"}`}>
        <AnimatePresence mode="wait" initial={false}>
          {isSelected ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.15, ease: "easeOut" } }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="flex flex-col gap-y-[10px] h-full"
            >
              <p className="heading-small-md">{EVENTS_BY_ID[event].title}</p>
              <div className="flex h-full items-center pb-[30px]"><p className="text-xs">{EVENTS_BY_ID[event].description}</p></div>
            </motion.div>
          ) : (
            <motion.p
              key="question"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.25, ease: "easeOut" } }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="heading-small-xs"
            >
              {EVENTS_BY_ID[event].question}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Chevron — layout="position" mirrors the icon treatment */}
      <motion.div layout="position" className={`shrink-0 ${isSelected ? "flex items-center justify-center h-full" : ""}`}>
        <Link className="flex items-center justify-center" href={EVENTS_BY_ID[event].link}>
          <GTPIcon icon={isSelected ? "gtp-chevronright" : "gtp-chevronright-monochrome"} className="!size-[16px]" containerClassName="!size-[16px]" />
        </Link>
      </motion.div>
    </motion.div>
  );
};

const SideEventsContainer = ({
  selectedEvent,
  setSelectedEvent,
}: {
  selectedEvent: EventId;
  setSelectedEvent: (event: EventId) => void;
}) => {
  return (
    <div className="flex flex-col gap-y-[10px] w-[390px] h-[442px] min-w-[300px] shrink min-h-0 self-stretch overflow-y-auto">
      {FEATURED_EVENT_IDS_MAX.map((event) => (
        <EventCard key={event} event={event} isSelected={selectedEvent === event} setSelectedEvent={setSelectedEvent} />
      ))}
    </div>
  );
};


const LandingEventsCardContent = ({ selectedEvent }: { selectedEvent: EventId }) => {
  console.log(EVENTS_BY_ID[selectedEvent]);
  return (
    <div className="flex flex-col gap-y-[10px] h-[442px] flex-1 overflow-y-auto">
      <div className="grid grid-cols-3 h-full gap-x-[10px] gap-y-[10px]">
        {EVENTS_BY_ID[selectedEvent].cards?.map((card, index) => (
          <Link href={"/chains/optimism"} key={card.id + index} className="px-[15px] pt-[5px] h-full pb-[10px] bg-transparent hover:bg-color-ui-hover rounded-[15px] border-[0.5px] border-color-bg-medium flex flex-col">
            <div className="flex w-full justify-between items-end">
              <div className="">
                <span className="numbers-xs">{card.contractsDeployed}</span>
                <span className="text-xs text-color-text-secondary">&nbsp;contracts</span>
              </div>

              <div className="">
                <span className="text-xs text-color-text-secondary">Rank&nbsp;</span>
                <span className="numbers-xs">{card.rank}</span>
                
              </div>
              
            </div>
            <div className="flex w-full justify-end items-center">
              <div className="">
                <span className="numbers-sm">{card.value}$</span>
             
              </div>
              
            </div>
            <div className="flex w-full h-full gap-x-[5px] justify-between items-center">
              <GTPIcon icon={card.icon as GTPIconName} className="!size-[22px]" containerClassName="!size-[32px]" />
              <span className="heading-small-md text-color-text-primary">{card.name}</span>
              <div className="p-[5px] bg-color-bg-medium rounded-full flex items-center justify-center">
                <GTPIcon icon="gtp-chevronright-monochrome" className="!size-[11px]" containerClassName="!size-[16px] flex items-center justify-center" />
              </div>

            </div>
          </Link>
          ))}
      </div>   
    </div>
  );
};
const LandingEventsChartContent = ({ selectedEvent }: { selectedEvent: EventId }) => {
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
  const [isWrapping, setIsWrapping] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const eventData = EVENTS_BY_ID[selectedEvent];
  const options = eventData.options ?? EMPTY_OPTIONS;
  const hasOptions = options.length > 0;
  const showOptions = options.length > 1;
  const resolvedDefaultOptionId = hasOptions
    ? options.some((option) => option.id === eventData.defaultOptionId)
      ? eventData.defaultOptionId ?? options[0].id
      : options[0].id
    : null;
  const [activeOptionId, setActiveOptionId] = useState<string | null>(resolvedDefaultOptionId);

  const activeOption = hasOptions
    ? options.find((option) => option.id === activeOptionId) ?? options[0]
    : null;
  const activeDataSource = activeOption?.dataSource;
  const { data: activeSourceData } = useSWR(activeDataSource?.url ?? null);

  const selectedSeries = useMemo(() => {
    if (activeOption?.series?.length) {
      return activeOption.series;
    }

    if (activeDataSource && activeSourceData) {
      const values = getNestedValue(activeSourceData, activeDataSource.pathToData);
      return buildSeriesFromSource(values, activeDataSource.series, activeDataSource.xIndex ?? 0);
    }

    return eventData.series ?? [];
  }, [activeOption?.series, activeDataSource, activeSourceData, eventData.series]);

  const emptyStateMessage = activeDataSource
    ? activeSourceData
      ? "No data available"
      : "Loading chart data..."
    : selectedSeries.length === 0
      ? "No chart data available"
      : "";

  return (
    <div className="relative flex-1 min-w-[300px] min-h-[300px] self-stretch overflow-hidden">
      <GTPCardLayout className="h-[442px]"
       topBar={
        showOptions ? (
          <GTPButtonContainer style={{ borderRadius: isWrapping ? "15px" : "inherit" }}>
              <GTPButtonRow wrap onWrapChange={setIsWrapping} style={{ borderRadius: isWrapping ? "15px" : "inherit" }}>
                {options.map((option) => {
                  const isActive = option.id === activeOptionId;

                  return (
                    <GTPButton
                      key={option.id}
                      label={option.label}
                      size="sm"
                      variant={isActive ? "primary" : "no-background"}
                      visualState={isActive ? "active" : "default"}
                      clickHandler={() => {
                        setActiveOptionId(option.id);
                        setSelectedRange(null);
                      }}
                    />
                  );
                })}
              </GTPButtonRow>
            <GTPButton
                label={!selectedRange ? undefined : ""}
                leftIcon={selectedRange ? "feather:zoom-out" as GTPIconName : "feather:zoom-in" as GTPIconName}
                leftIconClassname={"text-color-text-primary"}
                size={isMobile ? "xs" : "sm"}
                className={!selectedRange ? "hidden" : "block"}
                variant={!selectedRange ? "no-background" : "highlight"}
                visualState="default"
                clickHandler={() => setSelectedRange(null)}
            />
          </GTPButtonContainer>
        ) : undefined
       }
      >
        <div className="flex-1 min-h-0 w-full h-full py-[15px] overflow-hidden">
          <GTPChart 
            series={selectedSeries}
            xAxisMin={selectedRange ? selectedRange[0] : undefined}
            xAxisMax={selectedRange ? selectedRange[1] : undefined}
            emptyStateMessage={emptyStateMessage}
            
            onDragSelect={(xStart, xEnd) => {
              if(xStart < xEnd) {
                setSelectedRange([Math.floor(xStart), Math.floor(xEnd)]);
              } else {
                setSelectedRange([Math.floor(xEnd), Math.floor(xStart)]);
              }
            }}
            dragSelectOverlayColor="rgb(var(--text-secondary) / 50%)"
            dragSelectIcon={"feather:zoom-in" as GTPIconName}
            minDragSelectPoints={2}
          
          />
        </div>
      </GTPCardLayout>
    </div>
  );
};

export default function LandingEventsChart() {

  const [selectedEvent, setSelectedEvent] = useState<EventId>(FEATURED_EVENT_IDS_MAX[0]);
   

  return (
    <div className="flex flex-col gap-y-[15px] w-full pb-[30px] h-full min-h-0 overflow-hidden">
        {/*Heading */}
      <div className="flex items-center gap-x-[8px]">
        <GTPIcon icon="gtp-ethereumlogo" className="!size-[24px]" containerClassName="!size-[24px]" />
        <Heading className="heading-large-lg">Trending</Heading>

      </div>
      <div className="flex flex-wrap items-stretch gap-[15px] flex-1 min-h-0 overflow-y-auto">
        <SideEventsContainer selectedEvent={selectedEvent} setSelectedEvent={(event) => setSelectedEvent(event)}></SideEventsContainer>
        {(EVENTS_BY_ID[selectedEvent].bodyType ?? "chart") === "chart" ? (
          <LandingEventsChartContent key={selectedEvent} selectedEvent={selectedEvent} />
        ) : (
          <LandingEventsCardContent key={selectedEvent} selectedEvent={selectedEvent} />
        )}
      </div>
    </div>
  );
}
