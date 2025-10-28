"use client";

import { useState, useEffect, useRef, useLayoutEffect, Dispatch, SetStateAction, Children, cloneElement, isValidElement } from "react";
import { useMaster } from "@/contexts/MasterContext";
import { ChainOverview } from "@/lib/chains";
import { MasterResponse, EthereumEvents } from "@/types/api/MasterResponse";
import { Icon } from "@iconify/react";
import { GTPIcon } from "../../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { EventIcon } from "@/components/layout/EthAgg/MetricsTop";
import moment from "moment";
import { LinkButton } from '@/components/layout/LinkButton';
import { GTPTooltipNew, TooltipBody } from "@/components/tooltip/GTPTooltip";
import { isMobile } from "react-device-detect";

export default function EventsCard({ children, totalHeight }: { children: React.ReactNode, totalHeight: number }) {
    const [expanded, setExpanded] = useState(false);
    const [measuredContentHeight, setMeasuredContentHeight] = useState<number>(0);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const toggleRef = useRef<HTMLDivElement | null>(null);
    const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
    const [lockedEvent, setLockedEvent] = useState<string | null>(null);



    useEffect(() => {
        const contentElement = contentRef.current;
        if (!contentElement) return;

        const updateMeasuredHeight = () => {
            const contentHeight = contentElement.scrollHeight || 0;
            const toggleHeight = toggleRef.current?.offsetHeight || 0;
            setMeasuredContentHeight(contentHeight + toggleHeight);
        };

        updateMeasuredHeight();

        const resizeObserver = new ResizeObserver(() => {
            updateMeasuredHeight();
        });

        resizeObserver.observe(contentElement);
        if (toggleRef.current) resizeObserver.observe(toggleRef.current);

        window.addEventListener('resize', updateMeasuredHeight);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateMeasuredHeight);
        };
    }, [expanded, hoveredEvent, lockedEvent]);



    return (
    <>
      {expanded && (
        <div
          onClick={() => {
            setExpanded(false)
          }}
          className='fixed inset-0 bg-color-bg-default/75'
        />
      )}
      <div
        // className={`rounded-[15px] px-[30px] py-[15px] bg-color-bg-default w-full relative transition-height  duration-300 ${measuredContentHeight < 355 ? `h-[${measuredContentHeight + 50}px]` : "h-[409px]"} `}
        className={`w-full relative transition-height duration-300 flex-1`}
       
      >
            {/* <div className="heading-large-md ">Events</div> */}

            <div className={`relative z-10 flex flex-col gap-y-[30px] bg-color-bg-default rounded-[15px] px-[15px] xs:px-[30px] py-[15px] transition-all duration-300 overflow-hidden min-h-full ${expanded ? "shadow-card-dark" : ""}`}
                 style={{
                    height: expanded ? (measuredContentHeight + 100 || totalHeight) : 245
                 }}
            >
                <div className="heading-large-md">Events</div>
                <div ref={contentRef}>
                    {Children.map(children, (child) => {
                        if (isValidElement(child)) {
                            return cloneElement(child, {
                                hoveredEvent,
                                setHoveredEvent,
                                lockedEvent,
                                setLockedEvent,
                            } as any);
                        }
                        return child;
                    })}
                </div>
                <div ref={toggleRef} className="absolute bottom-0 left-0 h-[50px] right-0 w-full bg-color-bg-default flex items-center justify-center pt-[12px] z-40 cursor-pointer"
                    onClick={() => {
                     
                        setExpanded(!expanded)
                    }}
                >
                    <GTPIcon icon="gtp-chevrondown-monochrome" size="md" className={`text-[#5A6462] transition-all duration-300 ${expanded ? "rotate-180" : ""}`} />
                 
              
                    <div className="absolute right-[15px] top-[60%] -translate-y-1/2 w-[15px] h-[15px] flex items-center justify-center">
                        <div className='w-[15px] h-fit z-30'>
                            <GTPTooltipNew
                                placement="top-end"
                                size="md"
                                allowInteract={true}
                                trigger={
                                <div
                                    className={`flex items-center justify-center ${isMobile ? 'w-[24px] h-[24px] -m-[4.5px]' : 'w-[15px] h-fit'}`}
                                    data-tooltip-trigger
                                >
                                    <GTPIcon icon="gtp-info-monochrome" size="sm" className="text-color-ui-hover" />
                                </div>
                                }
                                containerClass="flex flex-col gap-y-[10px]"
                                positionOffset={{ mainAxis: 0, crossAxis: 20 }}

                            >
                                <div>
                                <TooltipBody className='flex flex-col gap-y-[10px] pl-[20px]'>
                                    {"This card shows notable highlights on this chain, such as upgrades, campaigns, or token launches. Click an event to view more details."}
                                </TooltipBody>
                                </div>
                            </GTPTooltipNew>
                        </div>
                    </div>


                </div>
            </div>

      </div>
    </>
    )
}




export const EventItem = ({ 
    event, 
    setHeight, 
    eventIndex,
    hoveredEvent,
    setHoveredEvent,
    lockedEvent,
    setLockedEvent,
    finalIndex
}: { 
    event: EthereumEvents, 
    setHeight: Dispatch<SetStateAction<number[]>>, 
    eventIndex: number,
    hoveredEvent?: string | null,
    setHoveredEvent?: Dispatch<SetStateAction<string | null>>,
    lockedEvent?: string | null,
    setLockedEvent?: Dispatch<SetStateAction<string | null>>
    finalIndex: number
}) => {

    const contentInnerRef = useRef<HTMLDivElement | null>(null);
    const [measuredInnerHeight, setMeasuredInnerHeight] = useState<number>(0);
    const MAX_EXPANDED_HEIGHT = 150; // px; adjust as needed

    // Initialize the first 3 events as locked open
    useEffect(() => {
        if (eventIndex < 1 && setLockedEvent && !lockedEvent) {
            setLockedEvent(event.date);
        }
    }, []);

    useEffect(() => {
        const el = contentInnerRef.current;
        if (!el) return;

        const updateHeight = () => {
            setMeasuredInnerHeight(el.scrollHeight || 0);
        };

        updateHeight();

        const ro = new ResizeObserver(() => updateHeight());
        ro.observe(el);
        window.addEventListener('resize', updateHeight);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', updateHeight);
        };
    }, []);

    // Determine if this event should be shown as expanded
    const isExpanded = lockedEvent === event.date || hoveredEvent === event.date;

    return (
        <div className="flex gap-x-[5px] cursor-pointer" 
            onMouseEnter={() => setHoveredEvent?.(event.date)}
            onMouseLeave={() => setHoveredEvent?.(null)}
            onClick={() => {
                // Toggle locked state: if already locked, unlock it; otherwise lock it
                setLockedEvent?.(lockedEvent === event.date ? null : event.date);
            }}
        >
            <div className="w-[24px] flex flex-col">
                <EventIcon event={event} eventHover={hoveredEvent ?? null} index={eventIndex} eventExpanded={lockedEvent ?? null} />
                <div className={`flex-1 -mb-[7px] relative ${isExpanded ? "-mt-[0px]" : "-mt-[6px]"} transition-opacity duration-300 ${eventIndex === finalIndex ? "hidden" : ""}`}>
                    <div className="absolute ml-[calc(50%-1px)] mr-[calc(50%-1px)] left-0 top-0 bottom-0 w-[2px] text-[#5A6462] bg-[repeating-linear-gradient(to_bottom,currentColor_0,currentColor_3px,transparent_3px,transparent_14px)]" />
                </div>
            </div>
            <div className="w-full flex flex-col gap-y-[5px]">
                <div className="flex justify-between items-center w-full h-[24px]">
                    <div className="heading-large-xxs">{event.title}</div>
                    <div className="text-xxs ">{moment(event.date).format('D MMMM YYYY')}</div>
                </div>
                <div
                    className={`w-full flex flex-col transition-[height] duration-300 overflow-hidden`}
                    style={{ height: isExpanded ? Math.min(measuredInnerHeight, MAX_EXPANDED_HEIGHT) : 0 }}
                >
                    <div
                        ref={contentInnerRef}
                        className={`${measuredInnerHeight > MAX_EXPANDED_HEIGHT ? 'overflow-y-auto pr-[5px]' : 'overflow-visible flex flex-col gap-y-[5px]'} `}
                        style={{ maxHeight: measuredInnerHeight > MAX_EXPANDED_HEIGHT ? MAX_EXPANDED_HEIGHT : undefined }}
                    >
                        <div className="text-xxs">{event.description}</div>
                        <div className="w-full flex justify-end h-[16px]">

                            {event.source && <div className="flex-1 flex justify-end"><LinkButton href={event.source}>More about this event</LinkButton></div>}
                        </div>
                        <div className="w-full flex h-[25px]"></div>
                    </div>
                </div>
            </div>
            
            
        </div>
    )
}

