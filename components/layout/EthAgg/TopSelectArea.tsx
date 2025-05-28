"use client";
import Container from "../Container";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useState } from "react";

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

            <div className="flex flex-row gap-x-[8px] w-full min-h-[62px] items-center">
                <SelectionButton selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} breakdownGroup="Ethereum Ecosystem" icon="gtp-ethereumlogo" />
                <SelectionButton selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} breakdownGroup="Metrics" icon="gtp-realtime" />
                <SelectionButton selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} breakdownGroup="Builders & Apps" icon="gtp-project" />
            </div>
            <div className="absolute bottom-[0px] left-0 w-full h-[34px] z-[-1] bg-[#1F2726] rounded-full mr-[10px]"></div>
        </div>
    </Container>
  );
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
        <div className={`flex items-center justify-start w-full flex-1 flex-row gap-x-[15px] rounded-full px-[10px] py-[3px] transition-all
            ${selectedBreakdownGroup === breakdownGroup ? "bg-active-black border-[3px] border-[#1F2726] h-[62px]" 
                                        : "bg-medium-background hover:bg-[#5A6462] h-[36px] hover:h-[62px]"}`}
            onClick={() => setSelectedBreakdownGroup(breakdownGroup)}
            style={{
                maxHeight: "62px"
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <GTPIcon icon={icon} size={(breakdownGroup === selectedBreakdownGroup || isHovered) ? "lg" : "md"} className={`transition-all relative ${breakdownGroup === "Builders & Apps" ? "bottom-[2px]" : ""}`}/>
            <div className={`${(selectedBreakdownGroup === breakdownGroup || isHovered) ? "heading-large-lg" : "heading-large-sm"} transition-all text-nowrap`}>{breakdownGroup}</div>
        </div>
    );
}