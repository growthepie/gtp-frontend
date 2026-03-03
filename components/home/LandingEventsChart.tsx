"use client";

import Heading from "../layout/Heading";
import { useEffect, useMemo, useState } from "react";
import { GTPIcon } from "../layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import Link from "next/link";
import GTPCardLayout from "../GTPButton/GTPCardLayout";
import GTPChart, { GTPChartSeries } from "../GTPButton/GTPChart";
import { GTPButton } from "../GTPButton/GTPButton";
import GTPButtonContainer from "../GTPButton/GTPButtonContainer";
import GTPButtonRow from "../GTPButton/GTPButtonRow";
import { useMediaQuery } from "usehooks-ts";
import { motion } from "framer-motion";
import useSWR from "swr";

type EventSeriesMeta = {
  name: string;
  color: string;
  yIndex: number;
  seriesType?: GTPChartSeries["seriesType"];
};

type EventOptionDataSource = {
  url: string;
  pathToData: string;
  xIndex?: number;
  series: EventSeriesMeta[];
};

type EventOption = {
  id: string;
  label: string;
  series?: GTPChartSeries[];
  dataSource?: EventOptionDataSource;
};

type EventExample = {
  title: string;
  description: string;
  question: string;
  image: string;
  link: string;
  series?: GTPChartSeries[];
  options?: EventOption[];
  defaultOptionId?: string;
};

const EMPTY_OPTIONS: EventOption[] = [];

const FUSAKA_BLOB_SERIES_META: EventSeriesMeta[] = [
  {
    name: "Avg blob count",
    color: "#FFC300",
    yIndex: 1,
    seriesType: "line",
  },
  {
    name: "Target blob count",
    color: "#19D9D6",
    yIndex: 5,
    seriesType: "line",
  },
  {
    name: "Total blob fees",
    color: "#FE5468",
    yIndex: 4,
    seriesType: "line",
  },
];

const FUSAKA_BLOB_OPTIONS: EventOption[] = [
  {
    id: "fusaka-bpo2",
    label: "since Fusaka-BPO2 (2026-01-07)",
    dataSource: {
      url: "https://api.growthepie.com/v1/quick-bites/fusaka/timeseries_blobs/Fusaka-BPO2.json",
      pathToData: "data.timeseries.values",
      series: FUSAKA_BLOB_SERIES_META,
    },
  },
  {
    id: "fusaka-bpo1",
    label: "since Fusaka-BPO1 (2025-12-09)",
    dataSource: {
      url: "https://api.growthepie.com/v1/quick-bites/fusaka/timeseries_blobs/Fusaka-BPO1.json",
      pathToData: "data.timeseries.values",
      series: FUSAKA_BLOB_SERIES_META,
    },
  },
  {
    id: "fusaka",
    label: "since Fusaka (2025-12-03)",
    dataSource: {
      url: "https://api.growthepie.com/v1/quick-bites/fusaka/timeseries_blobs/Fusaka.json",
      pathToData: "data.timeseries.values",
      series: FUSAKA_BLOB_SERIES_META,
    },
  },
];

const EVENTS_EXAMPLES: Record<string, EventExample> = {
  "fusaka": {
    title: "Fusaka Upgrade",
    description: "Average blobs per block vs target and blob fees in ETH.",
    question: "Is blob capacity keeping up with demand?",
    image: "gtp-ethereum-weekly",
    link: "/quick-bites/fusaka",
    defaultOptionId: "fusaka-bpo2",
    options: FUSAKA_BLOB_OPTIONS,
  },
};

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


const EventCard = ({ event, isSelected, setSelectedEvent }: { event: keyof typeof EVENTS_EXAMPLES, isSelected: boolean, setSelectedEvent: (event: keyof typeof EVENTS_EXAMPLES) => void }) => {
  return (
    <motion.div
      layout
      className={`flex w-full border-[1px] border-color-bg-medium rounded-[15px] p-[15px] gap-x-[10px] cursor-pointer ${isSelected ? "bg-color-ui-active" : "bg-color-bg-default hover:bg-color-ui-hover"}`}
      onClick={() => setSelectedEvent(event)}
      transition={{ layout: { duration: 0.25, ease: "easeInOut" } }}
    >
      {/*Icon */}
      <motion.div layout className={`${isSelected ? "" : "flex items-center justify-center"}`}>
        <GTPIcon
          icon={isSelected ? EVENTS_EXAMPLES[event].image as GTPIconName : "gtp-megaphone"}
          className={isSelected ? "!size-[24px]" : "!size-[16px]"}
          containerClassName="!size-[24px]"
        />
      </motion.div>

      {/*Content — both states always rendered, height+opacity animated simultaneously */}
      <div className="flex flex-col w-full min-w-0">
        {/* Unselected: question */}
        <motion.div
          animate={{ opacity: isSelected ? 0 : 1, height: isSelected ? 0 : "auto" }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={{ overflow: "hidden" }}
          className="flex items-center"
        >
          <p className="heading-small-xs">{EVENTS_EXAMPLES[event].question}</p>
        </motion.div>

        {/* Selected: title + description */}
        <motion.div
          animate={{ opacity: isSelected ? 1 : 0, height: isSelected ? "auto" : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={{ overflow: "hidden" }}
          className="flex flex-col gap-y-[10px]"
        >
          <p className="heading-small-md">{EVENTS_EXAMPLES[event].title}</p>
          <p className="text-xs">{EVENTS_EXAMPLES[event].description}</p>
        </motion.div>
      </div>

      <Link className="flex items-center justify-center" href={EVENTS_EXAMPLES[event].link}>
        <GTPIcon icon={isSelected ? "gtp-chevronright" : "gtp-chevronright-monochrome"} className="!size-[16px]" containerClassName="!size-[16px]" />
      </Link>
    </motion.div>
  );
}

const SideEventsContainer = ({ selectedEvent, setSelectedEvent }: { selectedEvent: keyof typeof EVENTS_EXAMPLES, setSelectedEvent: (event: keyof typeof EVENTS_EXAMPLES) => void }) => {
  return (
    <div className="flex flex-col gap-y-[10px] w-[390px] min-w-[300px] shrink h-full min-h-0 self-stretch overflow-y-auto">
      {Object.keys(EVENTS_EXAMPLES).map((event) => (
        <EventCard key={event} event={event as keyof typeof EVENTS_EXAMPLES} isSelected={selectedEvent === event} setSelectedEvent={setSelectedEvent} />
      ))}
    </div>
  );
}



const LandingEventsChartContent = ({ selectedEvent }: { selectedEvent: keyof typeof EVENTS_EXAMPLES}) => {
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const eventData = EVENTS_EXAMPLES[selectedEvent];
  const options = eventData.options ?? EMPTY_OPTIONS;
  const hasOptions = options.length > 0;
  const resolvedDefaultOptionId = hasOptions
    ? options.some((option) => option.id === eventData.defaultOptionId)
      ? eventData.defaultOptionId ?? options[0].id
      : options[0].id
    : null;
  const [activeOptionId, setActiveOptionId] = useState<string | null>(resolvedDefaultOptionId);

  useEffect(() => {
    if (!hasOptions) {
      setActiveOptionId(null);
      setSelectedRange(null);
      return;
    }

    setActiveOptionId((previous) => {
      if (previous && options.some((option) => option.id === previous)) {
        return previous;
      }

      return resolvedDefaultOptionId;
    });
    setSelectedRange(null);
  }, [hasOptions, options, resolvedDefaultOptionId, selectedEvent]);

  useEffect(() => {
    setSelectedRange(null);
  }, [activeOptionId]);

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
    : "";

  return (
    <div className="relative flex-1 min-w-[300px] min-h-[300px] self-stretch overflow-hidden">
      <GTPCardLayout className="absolute inset-0 min-h-0 min-w-0"
       topBar={
        <GTPButtonContainer>
            {hasOptions && (
              <GTPButtonRow>
                {options.map((option) => {
                  const isActive = option.id === activeOptionId;

                  return (
                    <GTPButton
                      key={option.id}
                      label={option.label}
                      size="sm"
                      variant={isActive ? "primary" : "no-background"}
                      visualState={isActive ? "active" : "default"}
                      clickHandler={() => setActiveOptionId(option.id)}
                    />
                  );
                })}
              </GTPButtonRow>
            )}
            <GTPButton
                label={!selectedRange ? undefined : ""}
                leftIcon={selectedRange ? "feather:zoom-out" as GTPIconName : "feather:zoom-in" as GTPIconName}
                leftIconClassname={"text-color-text-primary"}
                size={isMobile ? "xs" : "sm"}
                className={!selectedRange ? "hidden" : "block"}
                variant={!selectedRange ? "no-background" : "highlight"}
                visualState="default"
                clickHandler={() => setSelectedRange(null)}
            />        </GTPButtonContainer>
       }
      >
       <div className="flex-1 min-h-0 w-full h-full py-[15px] overflow-hidden">
        <GTPChart series={selectedSeries}
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
}

export default function LandingEventsChart() {

  const [selectedEvent, setSelectedEvent] = useState<keyof typeof EVENTS_EXAMPLES>("fusaka");
   


  return (
    <div className="flex flex-col gap-y-[15px] w-full pb-[30px] h-full min-h-0 overflow-hidden">
        {/*Heading */}
      <div className="flex items-center gap-x-[8px]">
        <GTPIcon icon="gtp-ethereumlogo" className="!size-[24px]" containerClassName="!size-[24px]" />
        <Heading className="heading-large-lg">Trending</Heading>

      </div>
      <div className="flex flex-wrap items-stretch gap-[15px] flex-1 min-h-0 overflow-y-auto">
        <SideEventsContainer selectedEvent={selectedEvent} setSelectedEvent={(event) => setSelectedEvent(event as keyof typeof EVENTS_EXAMPLES)}></SideEventsContainer>
            <LandingEventsChartContent selectedEvent={selectedEvent} />
      </div>
    </div>
  );
}
