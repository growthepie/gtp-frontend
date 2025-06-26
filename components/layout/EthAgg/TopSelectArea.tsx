"use client";
import Container from "../Container";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useState } from "react";
import { IS_PRODUCTION } from "@/lib/helpers";

export default function TopSelectArea({
  selectedBreakdownGroup,
  setSelectedBreakdownGroup,
}: {
  selectedBreakdownGroup: string;
  setSelectedBreakdownGroup: (selectedBreakdownGroup: string) => void;
}) {
  return (
    <Container style={{marginTop: "45px"}}>
        <div className="h-full w-full relative">

            <div className="flex flex-row gap-x-[8px] w-full min-h-[44px] items-center">
                <SelectionButton selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} breakdownGroup="Metrics" icon="gtp-realtime" />
                {/* <SelectionButton selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} breakdownGroup="Ethereum Ecosystem" icon="gtp-ethereumlogo" />
                
                <SelectionButton selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} breakdownGroup="Builders & Apps" icon="gtp-project" /> */}
                <ComingSoonButton selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} breakdownGroup="Ethereum Ecosystem" icon="gtp-ethereumlogo-monochrome" />
                <ComingSoonButton selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} breakdownGroup="Builders & Apps" icon="gtp-project-monochrome" />
            </div>
            <div className="absolute bottom-[0px] left-0 w-full h-[34px] z-[-1] bg-[#1F2726] rounded-full mr-[10px]"></div>
        </div>
    </Container>
  );
}

const ComingSoonButton = ( {
    selectedBreakdownGroup,
    setSelectedBreakdownGroup,
    breakdownGroup,
    icon,
}: {
    selectedBreakdownGroup: string;
    setSelectedBreakdownGroup: (selectedBreakdownGroup: string) => void;
    breakdownGroup: string;
    icon: GTPIconName;
}) => {
   
    return (
        <div className={`flex items-center justify-between w-full flex-1 flex-row gap-x-[15px] rounded-full px-[10px] py-[3px] transition-all text-[#344240]
            ${selectedBreakdownGroup === breakdownGroup ? "bg-active-black border-[0px] border-[#1F2726] h-[44px] " 
                                        : "bg-[#5A6462] h-[36px]"}`}
            onClick={() => !IS_PRODUCTION ? setSelectedBreakdownGroup(breakdownGroup) : null}
            style={{
                maxHeight: "44px"
            }}

        >
            <div className="flex items-center gap-x-[15px]">
                <GTPIcon icon={icon} size={"md"} className={`transition-all relative ${breakdownGroup === "Builders & Apps" ? "bottom-[2px] " : ""}`}/>
                <div className={`${"heading-large-sm"} transition-all text-nowrap `}>{breakdownGroup}</div>
            </div>
            <div className="flex items-center py-[2px] px-[10px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] rounded-full">
                <div className={`${"heading-large-sm"} transition-all text-nowrap heading-small-xxxs `}>SOON</div>
            </div>
        </div>
    )
}

const SelectionButton = ({
    selectedBreakdownGroup,
    setSelectedBreakdownGroup,
    breakdownGroup,
    icon,
}: {
    selectedBreakdownGroup: string;
    setSelectedBreakdownGroup: (selectedBreakdownGroup: string) => void;
    breakdownGroup: string;
    icon: GTPIconName;
}) => {

    const [isHovered, setIsHovered] = useState(false);
    return (
        <div className={`flex items-center justify-start w-full flex-1 flex-row gap-x-[15px] rounded-full px-[10px] py-[3px] transition-all cursor-pointer
            ${selectedBreakdownGroup === breakdownGroup ? "bg-active-black border-[3px] border-[#1F2726] h-[44px]" 
                                        : "bg-medium-background hover:bg-[#5A6462] h-[36px] hover:h-[44px]"}`}
            onClick={() => setSelectedBreakdownGroup(breakdownGroup)}
            style={{
                maxHeight: "44px"
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <GTPIcon icon={icon} size={(breakdownGroup === selectedBreakdownGroup || isHovered) ? "lg" : "md"} className={`transition-all relative ${breakdownGroup === "Builders & Apps" ? "bottom-[2px]" : ""}`}/>
            <div className={`${(selectedBreakdownGroup === breakdownGroup || isHovered) ? "heading-large-md" : "heading-large-sm"} transition-all text-nowrap`}>{breakdownGroup}</div>
        </div>
    );
}