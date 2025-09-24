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

    console.log(expanded)

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
      <div
        className={`rounded-[15px] p-[15px] bg-[#1F2726] max-w-[483px] h-[400px] relative transition-height  duration-300 `}
       
      >
            <div className="heading-large-md ">Events</div>

            <div className={`relative z-10 flex flex-col gap-y-[10px] pt-[30px] bg-[#1F2726] rounded-b-[15px] -mx-[15px] px-[15px] transition-all  duration-300 overflow-hidden`}
                 style={{
                    height: expanded ? (measuredContentHeight + 50 || totalHeight) : measuredContentHeight < 355 ? measuredContentHeight : 355
                 }}
            >
                <div ref={contentRef}>
                    {children}
                </div>
                <div ref={toggleRef} className="absolute bottom-0 left-0 h-[50px] right-0 w-full bg-[#1F2726] flex items-center justify-center pt-[12px] z-40"
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
    )
}




export const EventItem = ({ event, setHeight, heightIndex }: { event: EthereumEvents, setHeight: Dispatch<SetStateAction<number[]>>, heightIndex: number}) => {


    const [eventHover, setEventHover] = useState<string | null>(null);
    const [eventExpanded, setEventExpanded] = useState<string | null>(null);

    return (
        <div className="flex gap-x-[10px]" 
            onMouseEnter={() => setEventHover(event.date)}
            onMouseLeave={() => setEventHover(null)}
            onClick={() => setEventExpanded(prev => prev === event.date ? null : event.date)}
        >
            <div className="w-[24px] flex flex-col">
                <EventIcon event={event} eventHover={eventHover} index={heightIndex} eventExpanded={eventExpanded} />
                <div className="flex-1 ml-[11.5px] -mt-[6px] -mb-[7px] relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] text-[#5A6462] bg-[repeating-linear-gradient(to_bottom,currentColor_0,currentColor_3px,transparent_3px,transparent_14px)]" />
                </div>
            </div>
            <div className="w-full flex flex-col gap-y-[5px]">
                <div className="flex justify-between items-center w-full h-[24px] pb-[2px]">
                    <div className="heading-large-xxs">{event.title}</div>
                    <div className="text-xxs ">{moment(event.date).format('D MMMM YYYY')}</div>
                </div>
                <div className="text-xxs text-[#5A6462]">{event.description}</div>
                <div className="w-full flex justify-end h-[16px]">

                    {event.source && <div className="flex-1 flex justify-end"><LinkButton href={event.source}>More about this event</LinkButton></div>}
                </div>
                <div className="w-full flex h-[10px]"></div>
            </div>
            
            
        </div>
    )
}

