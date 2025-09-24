"use client";

import { useState, useEffect, useRef, useLayoutEffect, Dispatch, SetStateAction } from "react";
import { useMaster } from "@/contexts/MasterContext";
import { ChainOverview } from "@/lib/chains";
import { MasterResponse, EthereumEvents } from "@/types/api/MasterResponse";
import { Icon } from "@iconify/react";
import { GTPIcon } from "../../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { EventIcon } from "@/components/layout/EthAgg/MetricsTop";
import moment from "moment";
import { LinkButton } from '@/components/layout/LinkButton';

export default function EventsCard({ children, totalHeight }: { children: React.ReactNode, totalHeight: number }) {
    const [expanded, setExpanded] = useState(false);
    const [measuredContentHeight, setMeasuredContentHeight] = useState<number>(0);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const toggleRef = useRef<HTMLDivElement | null>(null);



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
    }, []);



    return (
    <>
      {expanded && (
        <div
          onClick={() => {
            setExpanded(false)
          }}
          className='fixed inset-0 bg-[#1F2726]/75'
        />
      )}
      <div
        // className={`rounded-[15px] px-[30px] py-[15px] bg-[#1F2726] w-full relative transition-height  duration-300 ${measuredContentHeight < 355 ? `h-[${measuredContentHeight + 50}px]` : "h-[409px]"} `}
        className={`w-full relative transition-height duration-300 flex-1`}
       
      >
            {/* <div className="heading-large-md ">Events</div> */}

            <div className={`relative z-10 flex flex-col gap-y-[30px] bg-[#1F2726] rounded-[15px] px-[30px] py-[15px] transition-all duration-300 overflow-hidden min-h-full ${expanded ? "shadow-card-dark" : ""}`}
                 style={{
                    height: expanded ? (measuredContentHeight + 50 || totalHeight) : measuredContentHeight < 355 ? measuredContentHeight + 50 : 355
                 }}
            >
                <div className="heading-large-md">Events</div>
                <div ref={contentRef}>
                    {children}
                </div>
                <div ref={toggleRef} className="absolute bottom-0 left-0 h-[50px] right-0 w-full bg-[#1F2726] flex items-center justify-center pt-[12px] z-40 cursor-pointer"
                    onClick={() => {
                     
                        setExpanded(!expanded)
                    }}
                >
                    <GTPIcon icon="gtp-chevrondown-monochrome" size="md" className={`text-[#5A6462] transition-all duration-300 ${expanded ? "rotate-180" : ""}`} />
                 
              
                    <div className="absolute right-[15px] top-[60%] -translate-y-1/2 w-[15px] h-[15px] flex items-center justify-center">
                        <GTPIcon icon="gtp-info-monochrome" size="sm" className="text-[#5A6462]" />
                    </div>


                </div>
            </div>

      </div>
    </>
    )
}




export const EventItem = ({ event, setHeight, eventIndex }: { event: EthereumEvents, setHeight: Dispatch<SetStateAction<number[]>>, eventIndex: number}) => {


    const [eventHover, setEventHover] = useState<string | null>(null);
    const [eventExpanded, setEventExpanded] = useState<string | null>(null);
    const contentInnerRef = useRef<HTMLDivElement | null>(null);
    const [measuredInnerHeight, setMeasuredInnerHeight] = useState<number>(0);
    const MAX_EXPANDED_HEIGHT = 150; // px; adjust as needed


    //make it so if heightIndex is 0, set eventExpanded to the event.date
    useEffect(() => {
        if (eventIndex < 3) {
            setEventExpanded(event.date);
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

    return (
        <div className="flex gap-x-[5px] cursor-pointer" 
            onMouseEnter={() => setEventHover(event.date)}
            onMouseLeave={() => setEventHover(null)}
            onClick={() => {
   
                setEventExpanded(eventExpanded === event.date ? null : event.date);
            }}
        >
            <div className="w-[24px] flex flex-col">
                <EventIcon event={event} eventHover={eventHover} index={eventIndex} eventExpanded={eventExpanded} />
                <div className={`flex-1 -mb-[7px] relative ${eventExpanded || eventHover ? "-mt-[0px]" : "-mt-[6px]"} transition-opacity duration-300`}>
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
                    style={{ height: (eventExpanded === event.date || eventHover === event.date) ? Math.min(measuredInnerHeight, MAX_EXPANDED_HEIGHT) : 0 }}
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

