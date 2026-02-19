"use client";

import { useMaster } from "@/contexts/MasterContext";
import Heading from "../layout/Heading";
import { useEffect, useState } from "react";
import { GTPIcon } from "../layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import Link from "next/link";
import GTPCardLayout from "../GTPButton/GTPCardLayout";
import GTPChart from "../GTPButton/GTPChart";
import { GTPButton } from "../GTPButton/GTPButton";
import GTPButtonContainer from "../GTPButton/GTPButtonContainer";
import GTPButtonRow from "../GTPButton/GTPButtonRow";
import { useMediaQuery } from "usehooks-ts";

const EVENTS_EXAMPLES = {
    "example1": {
        title: "Example 1",
        description: "Example 1 description lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
        question: "What is the best way to learn about Ethereum?",
        image: "gtp-ethereum-weekly",
        link: "/chains/ethereum",
        color: "#FF0000",
        data: [
            {
                date: "2026-01-01",
                value: 100,
            },
            {
                date: "2026-01-02",
                value: 500,
            },
            {
                date: "2026-01-03",
                value: 300,
            },
        ],
    },
    "example2": {
        title: "Example 2",
        description: "Example 2 description",
        question: "What is the best way to learn about Ethereum?",
        image: "gtp-ethereum-weekly",
        link: "/chains/ethereum",
        color: "#00FF00",
        data: [
            {
                date: "2026-01-01",
                value: 900,
            },
            {
                date: "2026-01-02",
                value: 200,
            },
            {
                date: "2026-01-03",
                value: 300,
            },
        ],
    },
    "example3": {
        title: "Example 3",
        description: "Example 3 description",
        question: "What is the best way to learn about Ethereum?",
        image: "gtp-ethereum-weekly",
        link: "/chains/ethereum",
        color: "#0000FF",
        data: [
            {
                date: "2026-01-01",
                value: 100,
            },
            {
                date: "2026-01-02",
                value: 200,
            },
            {
                date: "2026-01-03",
                value: 300,
            },
        ],
    },
    "example4": {
        title: "Example 4",
        description: "Example 4 description",
        question: "What is the best way to learn about Ethereum?",
        image: "gtp-ethereum-weekly",
        link: "/chains/ethereum",
        color: "#FF00FF",
        data: [
            {
                date: "2026-01-01",
                value: 100,
            },
            {
                date: "2026-01-02",
                value: 200,
            },
            {
                date: "2026-01-03",
                value: 300,
            },
        ],
    },
    "example5": {
        title: "Example 5",
        description: "Example 5 description",
        question: "What is the best way to learn about Ethereum?",
        image: "gtp-ethereum-weekly",
        link: "/chains/ethereum",
        color: "#00FFFF",
        data: [
            {
                date: "2026-01-01",
                value: 100,
            },
            {
                date: "2026-01-02",
                value: 200,
            },
            {
                date: "2026-01-03",
                value: 300,
            },
        ],
    },
    "example6": {
        title: "Example 6",
        description: "Example 6 description",
        question: "What is the best way to learn about Ethereum?",
        image: "gtp-ethereum-weekly",
        link: "/chains/ethereum",
        color: "#FFFF00",
        data: [
            {
                date: "2026-01-01",
                value: 100,
            },
            {
                date: "2026-01-02",
                value: 200,
            },
        ],
    },

};


const EventCard = ({ event, isSelected, setSelectedEvent }: { event: keyof typeof EVENTS_EXAMPLES, isSelected: boolean, setSelectedEvent: (event: keyof typeof EVENTS_EXAMPLES) => void }) => {
  return (
    <div className={`flex w-[390px] border-[1px] border-color-bg-medium rounded-[15px] p-[15px] gap-x-[10px] cursor-pointer ${isSelected ? "bg-color-ui-active" : "bg-color-bg-default hover:bg-color-ui-hover"}`}
        onClick={() => setSelectedEvent(event)}
    >
      {/*Content */}
      <div className={`${isSelected ? "" : "flex items-center justify-center"}`}>
        <GTPIcon icon={isSelected ? EVENTS_EXAMPLES[event].image as GTPIconName : "gtp-megaphone"} className={`${!isSelected ? "!size-[16px]" : "!size-[24px]"}`} containerClassName={`${"!size-[24px]"}`} />
      </div>
      <div className={`flex flex-col w-full gap-y-[10px] ${isSelected ? "" : "justify-center"}`}>
        {isSelected ? (
            <>
                <p className="heading-small-md">{EVENTS_EXAMPLES[event].title}</p>
                <p className="text-xs">{EVENTS_EXAMPLES[event].description}</p>
            </>
               
        ) : (
            <p className="heading-small-xs">{EVENTS_EXAMPLES[event].question}</p>
        )}
      </div>

      <Link className="flex items-center justify-center" href={EVENTS_EXAMPLES[event].link}>
        <GTPIcon icon={!isSelected ? "gtp-chevronright-monochrome" : "gtp-chevronright"} className="!size-[16px]" containerClassName="!size-[16px]" />
      </Link>
    </div>
  );
}

const SideEventsContainer = ({ selectedEvent, setSelectedEvent }: { selectedEvent: keyof typeof EVENTS_EXAMPLES, setSelectedEvent: (event: keyof typeof EVENTS_EXAMPLES) => void }) => {
  return (
    <div className="flex flex-col gap-y-[10px] max-w-[40%] h-full min-h-0 self-stretch overflow-y-auto">
      {Object.keys(EVENTS_EXAMPLES).map((event) => (
        <EventCard key={event} event={event as keyof typeof EVENTS_EXAMPLES} isSelected={selectedEvent === event} setSelectedEvent={setSelectedEvent} />
      ))}
    </div>
  );
}



const LandingEventsChartContent = ({ selectedEvent }: { selectedEvent: keyof typeof EVENTS_EXAMPLES}) => {
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  return (
    <div className="relative flex-1 min-h-0 min-w-0 self-stretch overflow-hidden">
      <GTPCardLayout className="absolute inset-0 min-h-0 min-w-0"
       topBar={
        <GTPButtonContainer>
            <GTPButtonRow>
                <GTPButton label="Daily" size="sm"/>
                <GTPButton label="Weekly" size="sm"/>
                <GTPButton label="Monthly" size="sm"/>
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
            />        </GTPButtonContainer>
       }
      >
       <div className="flex-1 min-h-0 w-full h-full py-[15px] overflow-hidden">
        <GTPChart series={[{
          name: EVENTS_EXAMPLES[selectedEvent].title,
          data: EVENTS_EXAMPLES[selectedEvent].data.map((d) => [new Date(d.date).getTime(), d.value] as [number, number]),

          seriesType: "line",
          color: EVENTS_EXAMPLES[selectedEvent].color,
        }]} 
        xAxisMin={selectedRange ? selectedRange[0] : undefined}
        xAxisMax={selectedRange ? selectedRange[1] : undefined}

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

  const [selectedEvent, setSelectedEvent] = useState<keyof typeof EVENTS_EXAMPLES>("example1");
   


  return (
    <div className="flex flex-col gap-y-[15px] w-full pb-[30px] h-full min-h-0 overflow-hidden">
        {/*Heading */}
      <div className="flex items-center gap-x-[8px]">
        <GTPIcon icon="gtp-ethereumlogo" className="!size-[24px]" containerClassName="!size-[24px]" />
        <Heading className="heading-large-lg">Trending</Heading>

      </div>
      <div className="flex items-stretch gap-x-[15px] flex-1 min-h-0 overflow-hidden">
        <SideEventsContainer selectedEvent={selectedEvent} setSelectedEvent={(event) => setSelectedEvent(event as keyof typeof EVENTS_EXAMPLES)}></SideEventsContainer>
            <LandingEventsChartContent selectedEvent={selectedEvent} />
      </div>
    </div>
  );
}
