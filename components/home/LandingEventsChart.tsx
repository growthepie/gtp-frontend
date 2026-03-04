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

const DENCUN_SERIES: GTPChartSeries[] = [
  {
    name: "L1 Base Fee (gwei)",
    color: "#FFC300",
    seriesType: "line",
    data: [
      [1705276800000, 35],
      [1705881600000, 42],
      [1706486400000, 38],
      [1707091200000, 45],
      [1707696000000, 55],
      [1708300800000, 48],
      [1708905600000, 62],
      [1709510400000, 58],
      [1710115200000, 72],
      [1710720000000, 18],
      [1711324800000, 14],
      [1711929600000, 11],
      [1712534400000, 20],
      [1713139200000, 16],
      [1713744000000, 13],
    ],
  },
  {
    name: "Avg blobs per block",
    color: "#19D9D6",
    seriesType: "line",
    data: [
      [1710720000000, 1.2],
      [1711324800000, 2.1],
      [1711929600000, 2.8],
      [1712534400000, 3.5],
      [1713139200000, 3.8],
      [1713744000000, 4.2],
    ],
  },
];

const PECTRA_SERIES: GTPChartSeries[] = [
  {
    name: "Active Validators (k)",
    color: "#FE5468",
    seriesType: "line",
    data: [
      [1740787200000, 1052],
      [1741392000000, 1051],
      [1741996800000, 1050],
      [1742601600000, 1048],
      [1743206400000, 1047],
      [1743811200000, 1045],
      [1744416000000, 1043],
      [1745020800000, 1040],
      [1745625600000, 870],
      [1746230400000, 810],
      [1746835200000, 770],
      [1747440000000, 748],
      [1748044800000, 735],
      [1748649600000, 725],
    ],
  },
  {
    name: "Staking APR (%)",
    color: "#FFC300",
    seriesType: "line",
    data: [
      [1740787200000, 3.6],
      [1741392000000, 3.6],
      [1741996800000, 3.7],
      [1742601600000, 3.6],
      [1743206400000, 3.7],
      [1743811200000, 3.7],
      [1744416000000, 3.7],
      [1745020800000, 3.8],
      [1745625600000, 4.2],
      [1746230400000, 4.5],
      [1746835200000, 4.7],
      [1747440000000, 4.8],
      [1748044800000, 4.9],
      [1748649600000, 5.0],
    ],
  },
];

const L2_ACTIVITY_SERIES: GTPChartSeries[] = [
  {
    name: "L2 Txs per month (M)",
    color: "#FFC300",
    seriesType: "line",
    data: [
      [1704067200000, 95],
      [1706745600000, 105],
      [1709251200000, 120],
      [1711929600000, 155],
      [1714521600000, 162],
      [1717200000000, 170],
      [1719792000000, 185],
      [1722470400000, 192],
      [1725148800000, 198],
      [1727740800000, 210],
      [1730419200000, 225],
      [1733011200000, 240],
    ],
  },
  {
    name: "Active addresses (M)",
    color: "#19D9D6",
    seriesType: "line",
    data: [
      [1704067200000, 8.2],
      [1706745600000, 8.8],
      [1709251200000, 10.1],
      [1711929600000, 12.5],
      [1714521600000, 13.2],
      [1717200000000, 14.1],
      [1719792000000, 15.3],
      [1722470400000, 16.0],
      [1725148800000, 16.8],
      [1727740800000, 18.2],
      [1730419200000, 19.5],
      [1733011200000, 21.3],
    ],
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
  "dencun": {
    title: "Dencun Upgrade",
    description: "L1 base fees (gwei) and average blobs per block before and after EIP-4844.",
    question: "How did Dencun reshape the Ethereum fee market?",
    image: "gtp-blobs-ethereum",
    link: "/quick-bites/dencun",
    series: DENCUN_SERIES,
  },
  "pectra": {
    title: "Pectra Upgrade",
    description: "Active validator count and staking APR following EIP-7251 validator consolidation.",
    question: "How did Pectra change Ethereum staking?",
    image: "gtp-metrics-total-value-secured",
    link: "/quick-bites/pectra",
    series: PECTRA_SERIES,
  },
  "l2-activity": {
    title: "L2 Activity Growth",
    description: "Monthly L2 transaction count and active addresses across major rollups in 2024.",
    question: "How fast is Layer 2 adoption growing?",
    image: "gtp-metrics-transaction-count",
    link: "/fundamentals/transaction-count",
    series: L2_ACTIVITY_SERIES,
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
      className={`flex w-full border-[1px] border-color-bg-medium rounded-[15px] py-[10px] px-[15px] gap-x-[10px] cursor-pointer ${isSelected ? "bg-color-ui-active" : "h-[54px] bg-color-bg-default hover:bg-color-ui-hover"}`}
      onClick={() => setSelectedEvent(event)}
      transition={{ layout: { duration: 0.25, ease: "easeInOut" } }}
    >
      {/*Icon */}
      <motion.div layout className={`${isSelected ? "" : "flex items-center justify-center  relative pt-[7px] h-full "}`}>
        <GTPIcon
          icon={isSelected ? EVENTS_EXAMPLES[event].image as GTPIconName : "gtp-megaphone"}
          className={isSelected ? "!size-[24px]" : "!size-[16px]"}
          containerClassName="!size-[24px]"
        />
      </motion.div>

      {/*Content — both states always rendered, height+opacity animated simultaneously */}
      <div className="flex flex-col w-full min-w-0 justify-center">
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
    <div className="flex flex-col gap-y-[10px] w-[390px] h-[442px] min-w-[300px] shrink min-h-0 self-stretch overflow-y-auto">
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
      <GTPCardLayout className="h-[442px]"
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
                      clickHandler={() => {
                        setActiveOptionId(option.id);
                        setSelectedRange(null);
                      }}
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
        <LandingEventsChartContent key={selectedEvent} selectedEvent={selectedEvent} />
      </div>
    </div>
  );
}
